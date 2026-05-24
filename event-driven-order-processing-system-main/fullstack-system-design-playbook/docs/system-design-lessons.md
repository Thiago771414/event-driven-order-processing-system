# Lições de Design de Sistemas

Este playbook foca nas lições de engenharia que conectam arquitetura de frontend
com desenho de backend distribuído.

## 1. A API é o Contrato

A API é onde a experiência do usuário encontra sistemas distribuídos. Ela deve
expor identificadores estáveis, valores de status, categorias de erro e
expectativas de retry.

Um frontend não consegue renderizar estados honestos de produto se o backend
esconde estados pendentes, falhos ou desconhecidos atrás de respostas genéricas
de sucesso.

## 2. O Estado do Frontend é Temporário

Estado React serve para interação e renderização. Ele não é durável e não deve
ser tratado como verdade de negócio.

Armazenamento do navegador pode preservar continuidade, mas continua local e
potencialmente antigo.

## 3. PostgreSQL Guarda a Verdade Durável

Registros de negócio pertencem a um armazenamento transacional durável.
PostgreSQL guarda pedidos, pagamentos, eventos de outbox e marcadores de
reconciliação.

Redis e Kafka apoiam o sistema, mas não substituem o sistema de registro.

## 4. Eventos Precisam de Disciplina Transacional

Publicar diretamente a partir de handlers de requisição cria janelas de falha. O
padrão outbox fecha a lacuna entre estado do banco e publicação de eventos.

O estado é confirmado primeiro. Eventos são publicados depois do commit por um
worker dedicado.

## 5. Processamento Assíncrono Exige Idempotência

Consumidores Kafka devem assumir duplicatas. Clientes HTTP podem retentar.
Gateways de pagamento podem enviar webhooks duplicados.

Idempotência transforma entregas repetidas em comportamento seguro.

## 6. Desconhecido é um Estado Real

Sistemas de pagamento precisam representar resultados desconhecidos. Timeout não
significa sucesso nem falha.

Bons sistemas modelam:

- pendente de verificação;
- retentando;
- falhou;
- confirmado;
- reconciliação necessária.

## 7. Cache é uma Decisão de Consistência

Cache não é apenas sobre velocidade. Cada cache precisa ter dono, estratégia de
invalidação, expectativa de frescor e fallback para a verdade.

Cache do navegador melhora UX. Redis melhora desempenho e segurança no backend.
PostgreSQL continua autoritativo.

## 8. Confiabilidade é Desenhada Antes da Falha

Retry, DLQ, backoff, idempotência e reconciliação não são tarefas de limpeza.
São elementos centrais de design.

O sistema deve definir o que acontece quando cada dependência está lenta,
indisponível, duplicada ou inconsistente.

## 9. Observabilidade Faz Parte da Arquitetura

Métricas mostram o formato do sistema. Traces mostram caminhos de requisição.
Logs mostram fatos detalhados.

Um fluxo de trabalho distribuído não está completo se engenheiros não conseguem explicá-lo
durante operação normal e durante falhas.

## 10. Entrega Progressiva Precisa de Proteções

Release canário funciona melhor com saúde mensurável, contratos de evento
estáveis e rollback rápido.

Para decisões de pagamento, feature flags e allowlists muitas vezes são mais
seguras do que rollout percentual amplo.

## 11. Design Fullstack é Um Sistema

Arquitetura de frontend e backend não deve ser ensinada como mundos separados.

O botão de checkout, o contrato da API, a transação no banco, o evento de outbox,
o worker Kafka, a chave de idempotência no Redis e o dashboard Grafana fazem
parte de um único sistema percebido pelo usuário.
