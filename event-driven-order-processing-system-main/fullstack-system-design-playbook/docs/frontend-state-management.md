# Gerenciamento de Estado no Frontend

Este documento explica como o estado do frontend deve ser tratado neste
playbook React + TypeScript.

## Filosofia

O estado do frontend e temporario.

Ele existe para renderizar a experiencia atual, responder a interacoes do
usuario e manter pequenas transicoes de interface. Ele nao substitui a API, nao
substitui o PostgreSQL e nao deve tentar reconstruir toda a verdade de negocio
no navegador.

O modelo mental usado neste projeto:

| Camada | Responsabilidade | Fonte de verdade |
| --- | --- | --- |
| React state | Estado de renderizacao e interacao | Nao |
| Stores do cliente | Estado compartilhado da sessao atual | Nao |
| LocalStorage | Persistencia local pequena | Nao |
| IndexedDB | Persistencia local maior/offline/cache | Nao |
| Redis | Cache, locks e idempotencia do backend | Nao |
| PostgreSQL | Registro duravel de negocio | Sim |

## Ciclo de vida do estado no React

1. O componente renderiza dados recebidos por props, hooks ou stores.
2. O usuario executa uma acao, como adicionar produto ao carrinho.
3. Um hook coordena a acao e atualiza uma store temporaria.
4. Quando a acao cruza o limite do backend, o hook chama um servico.
5. O serviço usa o cliente de API central.
6. A resposta da API atualiza a store com o estado conhecido mais recente.
7. Uma nova leitura da API pode substituir dados locais considerados antigos.

Esse ciclo mantem componentes simples. Componentes nao chamam `fetch`, nao sabem
como cabeçalhos sao montados e nao conhecem Kafka, Redis ou PostgreSQL.

## Estado temporario da interface

Estado temporario da UI inclui:

- menu aberto ou fechado;
- aba selecionada;
- campos de formulario em edicao;
- mensagens de validacao;
- indicadores de carregamento;
- estado otimista de uma acao em andamento.

Esse estado normalmente vive dentro de componentes, hooks ou stores simples. Ele
pode desaparecer em refresh sem comprometer a consistencia do sistema.

## Estado compartilhado da sessao

`src/state/cartStore.ts` representa o carrinho da sessao atual. Ele e util para
experiencia do usuario, mas o backend ainda precisa validar itens, precos,
estoque e pagamento.

`src/state/orderStore.ts` representa o ciclo de vida conhecido de um pedido. Ele
pode dizer que um pedido foi aceito pela API, esta pendente de processamento
assincrono, foi confirmado, falhou ou precisa de reconciliacao. Mesmo assim, a
fonte final continua sendo a API lendo do backend.

## Fonte de verdade do backend

PostgreSQL e a fonte da verdade porque guarda o estado duravel de pedidos,
pagamentos e outbox. Redis acelera o backend, mas nao e ledger de negocio. Kafka
transporta eventos entre partes do sistema, mas nao e o contrato direto da UI.

O frontend deve confiar no backend para:

- validacao de negocio;
- calculo definitivo de totais;
- status final de pagamento;
- reconciliacao de estados desconhecidos;
- consistencia entre pedidos, pagamentos e eventos.

## Regra pratica

Mantenha o frontend sem estado sempre que possivel. Quando estado for necessario,
deixe claro se ele e:

- temporario de UI;
- persistencia local do navegador;
- snapshot de resposta da API;
- verdade duravel do backend.

Essa separacao reduz acoplamento e facilita evoluir a arquitetura sem transformar
componentes React em mini backends.
