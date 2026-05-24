# Estratégia de Armazenamento do Navegador

O armazenamento do navegador e persistencia local. Ele melhora continuidade de
uso, recuperacao de fluxo e velocidade percebida, mas nao e fonte de verdade de
negocio.

## LocalStorage

Use `src/storage/localStorageAdapter.ts` para dados pequenos, simples e de
sessao.

Bons usos:

- preferencia de tema;
- flags de experiencia;
- identificador de carrinho draft;
- pequenos snapshots de sessao;
- dados que podem ser reconstruidos pela API.

Cuidados:

- e sincrono e bloqueia a thread principal;
- armazena apenas strings;
- pode ser alterado manualmente pelo usuario;
- pode sobreviver logout se nao for limpo;
- nao deve guardar dados sensiveis.

## IndexedDB

Use `src/storage/indexedDbAdapter.ts` para dados maiores, estruturados ou cache
offline.

Bons usos:

- catalogo de produtos em cache;
- drafts maiores;
- leituras offline;
- historico local descartavel;
- respostas de API com TTL.

Cuidados:

- e assincrono;
- exige estrategia de expiracao;
- pode ficar inconsistente com o backend;
- deve ter invalidacao clara quando o contrato de API muda.

## Estrategia de cache do frontend

O cache do frontend deve ser tratado como dado auxiliar:

1. tente renderizar uma resposta local quando isso melhora a experiencia;
2. marque o dado como possivelmente antigo;
3. revalide com a API quando a tela ou fluxo exigir precisao;
4. substitua o cache pela resposta mais recente;
5. descarte cache expirado ou incompativel.

Para catalogo de produtos, IndexedDB costuma ser melhor que LocalStorage. Para
carrinho pequeno ou preferencia, LocalStorage e suficiente.

## Limites importantes

O frontend nunca deve acessar Redis ou PostgreSQL diretamente.

Redis e exclusivo do backend para cache quente, locks, idempotencia e protecao
contra duplicidade. PostgreSQL guarda a verdade duravel. A API e o contrato
entre a experiencia do usuario e esses sistemas distribuidos.

## Consistencia do backend

MiniShop usa PostgreSQL, outbox, Kafka e workers. Isso significa que a resposta
HTTP pode confirmar que uma requisicao foi aceita enquanto algum trabalho ainda
continua assincronamente.

O navegador pode guardar um snapshot local, mas o status final deve vir da API.
Em fluxos como pagamento, estados como pendente, verificacao e reconciliacao
fazem parte do produto e nao devem ser escondidos pela UI.

## Regra pratica

- LocalStorage: pequeno, simples, sessao, preferencias.
- IndexedDB: maior, offline, cache estruturado.
- Redis: somente backend.
- PostgreSQL: fonte de verdade.
- API: unico limite permitido para o frontend falar com o sistema distribuido.
