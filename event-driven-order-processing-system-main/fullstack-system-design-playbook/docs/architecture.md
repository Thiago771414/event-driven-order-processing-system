# Arquitetura

Este documento descreve a arquitetura fullstack por trás do playbook. O
repositório é uma documentação inspirada em produção, não um sistema de produção
pronto para deploy.

## Forma do sistema

A arquitetura começa em um frontend React e termina em uma execução assíncrona
observável no backend.

```mermaid
flowchart TD
  FE[Frontend React] --> Hooks[Hooks / Gerenciamento de Estado]
  Hooks --> Services[Camada de Serviço]
  Services --> Client[Cliente de API]
  Client --> API[MiniShop Backend API]
  API --> DB[(PostgreSQL)]
  API --> Outbox[(Outbox Transacional)]
  Outbox --> Publisher[Outbox Worker]
  Publisher --> Kafka[(Kafka)]
  Kafka --> Workers[Workers]
  Workers --> Redis[(Redis)]
  Workers --> DB
  API --> Obs[Observabilidade]
  Publisher --> Obs
  Workers --> Obs
```

O frontend é dono da interação do usuário. O backend é dono do estado de negócio
durável. O Kafka conecta mudanças de estado já confirmadas ao processamento
assíncrono.

## Limites

| Limite | Responsabilidade | Não deve fazer |
| --- | --- | --- |
| Componentes React | Renderizar e capturar intenção | Conhecer detalhes internos de Kafka ou banco |
| Hooks | Coordenar estado de UI e chamadas de serviço | Codificar detalhes de transporte |
| Camada de serviço | Expressar ações de produto | Recriar HTTP de baixo nível em vários lugares |
| Cliente de API | Controlar HTTP, cabeçalhos, parsing e erros | Decidir transições de estado de domínio |
| API | Validar requisições e confirmar estado | Publicar diretamente no Kafka dentro da requisição |
| PostgreSQL | Guardar a verdade durável | Agir como fila sem disciplina de outbox |
| Outbox worker | Publicar eventos confirmados | Alterar estado de negócio inesperadamente |
| Kafka | Mover eventos entre serviços | Substituir armazenamento durável de domínio |
| Workers | Executar efeitos colaterais assíncronos | Assumir entrega exatamente uma vez |
| Redis | Cache, locks e idempotência | Virar fonte da verdade |

## Ciclo de vida da requisição

```mermaid
sequenceDiagram
  autonumber
  participant UI as UI React
  participant SVC as Serviço Frontend
  participant HTTP as Cliente de API
  participant API as Backend API
  participant PG as PostgreSQL
  participant OB as Outbox Worker
  participant K as Kafka
  participant W as Worker
  participant O as Observabilidade

  UI->>SVC: Intenção do usuário
  SVC->>HTTP: Requisição de domínio
  HTTP->>API: HTTP com correlation id
  API->>PG: Inicia transação
  API->>PG: Grava registro de domínio
  API->>PG: Grava evento de outbox
  API->>PG: Commit
  API-->>HTTP: Resposta com status de domínio
  HTTP-->>SVC: Resultado parseado
  SVC-->>UI: Estado renderizável
  OB->>PG: Busca linhas pendentes da outbox
  OB->>K: Publica evento
  K->>W: Entrega evento
  W->>PG: Aplica atualização assíncrona
  API->>O: Métricas, traces e logs
  OB->>O: Métricas, traces e logs
  W->>O: Métricas, traces e logs
```

A resposta HTTP não é o fim do fluxo de trabalho. Ela é o ponto em que o frontend recebe
um identificador estável e um status atual.

## Fluxo de eventos

```mermaid
flowchart TD
  A[API grava pedido] --> B[API grava evento de outbox]
  B --> C[Transação do banco faz commit]
  C --> D[Outbox worker lê evento pendente]
  D --> E[Publica no tópico Kafka]
  E --> F[Worker consome evento]
  F --> G{Duplicado?}
  G -->|Sim| H[Ignora usando registro de idempotência]
  G -->|Não| I[Processa evento]
  I --> J{Sucesso?}
  J -->|Sim| K[Marca processado / atualiza banco]
  J -->|Falha temporária| L[Retry com backoff]
  L --> F
  J -->|Retries esgotados| M[DLQ]
```

## Autoridade dos dados

PostgreSQL é a fonte da verdade. Kafka é o log de comunicação para eventos
confirmados. Redis é usado para aceleração e idempotência. O armazenamento do
navegador é útil para continuidade da experiência, mas não pode ser tratado como
autoridade do servidor.

## Contrato entre frontend e backend

O contrato da API deve tornar explícito o comportamento distribuído:

- identificadores estáveis de recursos;
- valores de status de domínio;
- comportamento de idempotência;
- categorias de erro;
- orientação de retry;
- correlation IDs;
- semântica de polling ou refresh;
- expectativas de consistência eventual.

A UI nunca deve inferir que o backend terminou apenas porque um loading local
desapareceu.
