# Contratos de Workers para Sagas

Workers sao processos que executam tarefas individuais de um workflow. No modelo inspirado no Netflix Conductor, o Conductor mantem a fila e o estado das tarefas, enquanto os workers consultam tarefas disponiveis, executam trabalho local e reportam o resultado.

## Consulta de tarefas

Um worker consulta o Conductor por tarefas de um tipo especifico, por exemplo `autorizar_pagamento` ou `reservar_estoque`. A resposta conceitual contem:

- `taskId`;
- `workflowId`;
- `correlationId`;
- parametros de entrada;
- numero da tentativa;
- deadlines e timeouts;
- metadados de observabilidade.

O worker deve tratar a tarefa como uma unidade idempotente. Se a mesma tarefa reaparecer apos timeout, retry ou reinicio do processo, a execucao nao deve criar efeitos duplicados.

## Conclusao de tarefas

Ao concluir, o worker envia ao Conductor:

- status de sucesso;
- payload de saida minimo e tipado;
- duracao;
- referencias externas, como `paymentReference` ou `orderId`;
- sinais de observabilidade.

O payload de saida deve ser suficiente para o proximo passo do workflow decidir o que fazer, mas nao deve virar um banco de dados paralelo.

## Falha de tarefas

Ao falhar, o worker deve diferenciar:

- falha temporaria, como timeout de gateway;
- falha de negocio, como pagamento rejeitado;
- falha tecnica irrecuperavel, como payload invalido;
- resultado desconhecido, como conexao perdida apos chamada ao gateway.

Essa diferenca define se o Conductor faz retry, segue para uma tarefa de verificacao, executa compensacao ou envia o caso para DLQ.

## Politica de repeticao

Retries devem ser configurados por tarefa. Um exemplo conceitual:

| Tarefa | Tentativas | Backoff | Observacao |
| --- | --- | --- | --- |
| `autorizar_pagamento` | 3 | exponencial curto | seguro apenas com idempotency key no gateway |
| `reservar_estoque` | 3 | exponencial curto | deve deduplicar por `orderId` |
| `confirmar_pedido` | 2 | linear curto | atualizacao local no banco |
| `publicar_pedido_confirmado` | 5 | exponencial | outbox protege publicacao |

Retries nao substituem idempotencia. Eles apenas tornam falhas temporarias recuperaveis.

## Politica de tempo limite

Timeouts devem existir em dois niveis:

- timeout da tarefa, para impedir que um worker fique preso indefinidamente;
- timeout do workflow, para impedir que a saga inteira fique aberta sem decisao.

Quando uma tarefa expira, o workflow pode repetir a tarefa, chamar uma tarefa de verificacao ou suspender o fluxo para investigacao.

## Idempotencia

Cada worker deve usar chaves estaveis:

- `workflowId`;
- `taskId`;
- `correlationId`;
- `orderId`;
- `paymentId`;
- `idempotencyKey`.

Operacoes externas, como autorizacao e reembolso de pagamento, precisam de uma idempotency key aceita pelo provedor externo. Operacoes internas podem usar Redis, constraints no PostgreSQL ou tabelas de deduplicacao.

## Tarefas de compensacao

Tarefas como `reembolsar_pagamento`, `cancelar_pedido` e `publicar_pedido_cancelado` precisam ser tratadas como fluxo de primeira classe:

- devem ser idempotentes;
- devem ter retries proprios;
- devem emitir eventos e logs claros;
- devem preservar o motivo da compensacao;
- devem ser visiveis no historico do workflow.

Compensacao nao significa apagar o passado. Ela registra uma nova acao que desfaz ou neutraliza o efeito de uma etapa anterior.

## Observabilidade

Cada worker deve emitir:

- logs estruturados com `workflowId`, `taskId`, `orderId` e `correlationId`;
- metricas de latencia, sucesso, falha, retry e timeout;
- spans de tracing conectados ao trace iniciado pela API;
- eventos de auditoria para mudancas de estado importantes.

O objetivo operacional e responder rapidamente: qual etapa falhou, quantas vezes tentou, qual servico era responsavel e qual acao de compensacao foi executada.
