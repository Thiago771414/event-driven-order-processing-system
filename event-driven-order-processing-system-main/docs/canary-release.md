# Canary Release no MiniShop

Este documento descreve a estrategia de Canary Release mais segura para a arquitetura atual do MiniShop.

## Onde inserir

A arquitetura atual tem tres superficies de deploy:

- **API NestJS**: recebe HTTP, valida requests, grava `orders`, `payments` e `outbox_events` no PostgreSQL. Nao publica diretamente no Kafka.
- **Outbox Worker**: le a outbox transacional e publica no Kafka preservando `partition_key`.
- **Worker Kafka**: consome `orders.created`, `orders.created.dlq`, `payments.verification.requested` e `payments.verification.dlq`, com retry, DLQ e idempotencia Redis.

O ponto mais seguro para o primeiro canary e a **API**:

- o trafego HTTP pode ser dividido por porcentagem no Ingress;
- rollback e imediato, reduzindo o peso do Ingress para `0`;
- a API ja usa outbox, entao a versao canary nao acopla request HTTP diretamente ao Kafka;
- workers e outbox permanecem estaveis durante a primeira fase, reduzindo risco em ordem, idempotencia e pagamentos.

## Estrategia recomendada

Use **Canary em nivel de API via Ingress NGINX ponderado** como estrategia padrao.

Fluxo:

```text
Cliente
  -> Ingress NGINX
    -> 95% Service minishop-api        -> Deployment stable v1
    -> 5%  Service minishop-api-canary -> Deployment canary v2
  -> PostgreSQL outbox
  -> Outbox Worker stable
  -> Kafka
  -> Worker stable
```

Essa abordagem evita complexidade operacional de service mesh e ainda entrega os controles essenciais de producao: divisao gradual, observabilidade por versao e rollback rapido.

## Fases de rollout

Fase 1:

- aplicar `kubectl apply -k k8s/canary`;
- manter `nginx.ingress.kubernetes.io/canary-weight: "5"`;
- observar por pelo menos uma janela de metricas suficiente para o volume real.

Fase 2:

- aumentar para `25`;
- comparar canary vs stable por `release_track` e `app_version`.

Fase 3:

- aumentar para `50`;
- observar impacto em p95/p99, erros e metricas de negocio.

Fase 4:

- promover a imagem v2 para o Deployment stable;
- remover ou zerar o Ingress canary;
- manter dashboard por uma janela apos promocao.

Comandos uteis:

```bash
kubectl apply -k k8s
kubectl apply -k k8s/canary

kubectl annotate ingress minishop-api-canary \
  nginx.ingress.kubernetes.io/canary-weight="25" \
  --overwrite

kubectl annotate ingress minishop-api-canary \
  nginx.ingress.kubernetes.io/canary-weight="0" \
  --overwrite
```

Observacao: se um Deployment antigo ja foi aplicado sem `release-track` no selector, Kubernetes pode exigir recriacao desse Deployment porque `spec.selector` e imutavel.

## Condicoes de rollback

Reduza o peso para `0` ou remova os recursos canary se qualquer condicao sustentar degradacao contra stable:

- aumento de HTTP `5xx`;
- aumento de p95/p99 em `http_request_duration_ms`;
- aumento de `orders_retries_total`;
- aumento de `orders_dlq_total`;
- aumento de `payment_verification_retries_total`;
- aumento de `payment_verification_dlq_total`;
- aumento de `payment_verification_total{result=~"failed|unknown|dlq"}`;
- aumento de `outbox_failed_total`;
- aumento de `outbox_lag_seconds`;
- aumento de consumer lag Kafka, quando houver exporter Kafka/Redpanda.

O dashboard `infra/grafana/dashboards/canary-release.json` usa labels de release para comparar stable e canary.

## Workers Kafka durante canary

Canary de worker exige mais cuidado que canary de API.

Recomendacao:

- para a primeira versao, mantenha **worker e outbox-worker estaveis**;
- permita que a API canary gere eventos somente se o contrato dos eventos continuar compativel;
- use o mesmo `KAFKA_CONSUMER_GROUP_ID` (`minishop-worker-group`) para workers que realmente executam efeitos;
- nao use grupo de consumidor isolado para processar os mesmos topicos em producao.

Por que nao usar consumer group isolado para canary ativo?

Um grupo novo consome os mesmos eventos de forma independente. Isso duplica processamento e pode duplicar efeitos externos, como atualizacao de pagamento, publicacao de eventos derivados e chamadas a gateways. A idempotencia Redis reduz dano, mas nao deve ser usada como desculpa para criar dois pipelines ativos para os mesmos eventos.

Quando worker canary e aceitavel:

- mudancas compativeis e aditivas;
- sem alteracao de efeitos externos;
- mesma semantica de idempotencia;
- mesmo consumer group;
- rollout com poucas replicas;
- monitoramento forte de retry, DLQ e consumer lag.

Mesmo no mesmo consumer group, Kafka faz rebalance e pode haver reentrega at-least-once. A idempotencia Redis e as chaves por `orderId`/`paymentId` continuam obrigatorias.

## Pagamentos

Fluxos de pagamento devem evitar canary inicialmente quando a mudanca altera:

- autorizacao/captura;
- decisao de status;
- reconciliacao;
- webhook;
- regras de retry;
- chamadas ao gateway.

Para pagamento, prefira feature flags de negocio com escopo explicito:

- por cliente interno;
- por ambiente;
- por metodo de pagamento;
- por lista allowlist;
- por modo read-only/shadow.

Roteamento por porcentagem e bom para trafego HTTP geral. Feature flag e mais segura para decisoes financeiras porque a coorte pode ser auditada e revertida sem mover pods.

## Evolucao de eventos

Durante canary, eventos precisam ser compativeis entre versoes.

Regras:

- adicione campos de forma opcional;
- nao remova campos usados por workers estaveis;
- nao mude semantica de campos existentes;
- quando houver breaking change, crie novo tipo, por exemplo `orders.created.v2`;
- mantenha consumidores lendo `v1` e `v2` durante a migracao;
- promova producer v2 somente depois que consumers v2 estiverem prontos.

## Comparacao das alternativas

### Canary em nivel de API

Melhor ponto inicial para este projeto.

Vantagens:

- porcentagem real de trafego;
- rollback simples no Ingress;
- menor risco para Kafka, ordem e idempotencia;
- integra bem com metricas HTTP, Prometheus e traces.

Limites:

- nao valida mudancas profundas em workers;
- exige compatibilidade dos eventos gerados pela API canary.

### Canary em nivel de worker

Util para mudancas em processamento assincrono, mas nao deve ser a primeira camada.

Vantagens:

- valida codigo novo no consumidor real;
- preserva particionamento quando usa o mesmo consumer group.

Riscos:

- porcentagem nao e precisa, porque Kafka distribui particoes;
- rebalances podem gerar reentrega;
- mudancas de pagamento podem gerar efeitos externos incorretos.

### Canary por consumer group Kafka

Nao recomendado para processamento ativo dos mesmos topicos.

Use apenas para:

- shadow consumer sem efeito colateral;
- topicos espelhados;
- validacao de parse/schema;
- metricas de leitura sem commit operacional relevante.

### Feature flags

Mais seguras para regras de negocio e pagamento.

Boa escolha para:

- ativar novo algoritmo de decisao;
- limitar rollout por cliente/coorte;
- desabilitar caminho novo sem redeploy;
- proteger fluxos financeiros.

### Blue/Green

Bom para troca rapida de ambiente completo, mas menos adequado como primeira opcao aqui.

Vantagens:

- rollback simples;
- isolamento forte.

Limites:

- nao oferece progressao fina 5/25/50;
- pode duplicar custo operacional;
- workers e Kafka exigem cuidado extra para nao duplicar consumo.

### Service Mesh vs Ingress leve

Service mesh como Istio/Linkerd oferece traffic shifting avancado, mTLS, retries e telemetria rica.

Para este projeto, a abordagem leve com Ingress NGINX e melhor:

- menor curva operacional;
- menos componentes;
- suficiente para canary HTTP;
- facil de demonstrar maturidade sem overengineering.

Adote mesh somente se houver necessidade real de politicas L7 complexas, mTLS entre servicos, retries padronizados ou roteamento por header/coorte em muitos servicos.

## Observabilidade adicionada

Metricas agora carregam labels:

- `app_name`;
- `app_version`;
- `deployment_version`;
- `release_track`;
- `canary_cohort`.

Traces carregam atributos OTEL:

- `service.version`;
- `deployment.version`;
- `release.track`;
- `canary.cohort`.

A API tambem expoe:

- `http_requests_total`;
- `http_request_duration_ms`.

Essas metricas permitem comparar stable/canary no Prometheus e no Grafana.

## Riscos operacionais

- Baixo volume pode mascarar regressao; avance fases por tempo e por quantidade minima de requests.
- Canary de API nao prova mudancas de worker; teste essas mudancas com topicos de staging ou shadow.
- Fluxo financeiro deve iniciar protegido por feature flag e allowlist.
- Mudancas de schema precisam ser backward compatible.
- Rollback de codigo nao desfaz eventos ja gravados na outbox.
- Se a versao canary emitir evento invalido, o dano aparece depois no worker; por isso DLQ e retry sao guardrails obrigatorios.

## Decisao final

Implementar primeiro **Canary Release da API por Ingress NGINX**, mantendo workers estaveis. Evoluir para worker canary apenas quando houver necessidade clara e contrato de evento compativel.

Essa e a menor arquitetura de producao que atende aos objetivos: entrega progressiva, rollback rapido, preservacao de ordem/idempotencia e observabilidade por versao.
