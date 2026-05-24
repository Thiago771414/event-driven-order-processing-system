# Quando Usar Netflix Conductor

O Netflix Conductor e util quando o fluxo de negocio precisa ser coordenado, observado e retomado como uma execucao explicita. Ele ajuda quando a complexidade do workflow ja existe no dominio e precisa ficar operavel.

## Use um mecanismo de workflow quando

- o fluxo de trabalho tiver muitas etapas;
- a logica de compensacao for complexa;
- as tentativas e os tempos limite precisarem ser visiveis;
- os operadores precisarem inspecionar o fluxo de trabalho;
- varios microsservicos participarem;
- a auditabilidade for importante.

Sinais praticos de que o Conductor pode ajudar:

- a equipe precisa saber em qual etapa cada checkout parou;
- ha muitas transicoes entre pagamento, estoque, pedido e notificacao;
- falhas exigem reembolso, cancelamento, reprocessamento ou pausa manual;
- o historico da saga precisa ser consultavel por suporte, operacao ou auditoria;
- retries invisiveis em logs ja nao sao suficientes.

## Evite quando

- o projeto tiver apenas um ou dois servicos simples;
- a coreografia do Kafka for suficiente;
- a complexidade operacional nao for justificada;
- a equipe nao precisar de visibilidade do fluxo de trabalho.

Tambem evite quando a equipe ainda nao tem maturidade operacional para manter mais uma peca de infraestrutura. Um workflow engine simplifica algumas complexidades, mas adiciona outras: operacao, monitoramento, versionamento de workflows, seguranca, backup e governanca.

## Regra pratica para o MiniShop

No estado atual do playbook, Kafka, outbox, Redis, PostgreSQL, workers e observabilidade ja demonstram confiabilidade orientada a eventos. O Conductor faria sentido em uma evolucao onde o checkout tivesse muitos passos de negocio, compensacoes recorrentes e necessidade real de inspecao operacional por workflow.

Para aprendizado, manter o Conductor como documentacao e mock visual e uma escolha intencional: a ideia fica clara sem transformar o projeto em um ambiente de infraestrutura pesada.
