# Browser Storage Strategy

Browser storage provides local persistence. It improves continuity,
workflow recovery, and perceived speed, but it is not the source of truth for
business data.

## LocalStorage

Use `src/storage/localStorageAdapter.ts` for small, simple session
data.

Good uses:

- theme preferences;
- user experience flags;
- draft cart identifier;
- small session snapshots;
- data that can be reconstructed from the API.

Considerations:

- it is synchronous and blocks the main thread;
- it stores only strings;
- users can modify it manually;
- it can survive logout if not cleared;
- it should not store sensitive data.

## IndexedDB

Use `src/storage/indexedDbAdapter.ts` for larger, structured data or offline
caching.

Good uses:

- cached product catalog;
- larger drafts;
- offline reads;
- disposable local history;
- API responses with a TTL.

Considerations:

- it is asynchronous;
- it requires an expiration strategy;
- it can become inconsistent with the backend;
- it should have clear invalidation rules when the API contract changes.

## Frontend Cache Strategy

The frontend cache should be treated as supplementary data:

1. try rendering a local response when it improves the experience;
2. mark the data as potentially stale;
3. revalidate with the API when the screen or workflow requires accuracy;
4. replace the cache with the latest response;
5. discard expired or incompatible cache entries.

For a product catalog, IndexedDB is usually better than LocalStorage. For a
small cart or a preference, LocalStorage is sufficient.

## Important Boundaries

The frontend must never access Redis or PostgreSQL directly.

Redis is exclusive to the backend for hot caching, locks, idempotency, and
duplicate protection. PostgreSQL stores durable truth. The API is the contract
between the user experience and these distributed systems.

## Backend Consistency

MiniShop uses PostgreSQL, an outbox, Kafka, and workers. This means the HTTP
response can confirm that a request was accepted while some work
continues asynchronously.

The browser can store a local snapshot, but the final status must come from the API.
In workflows such as payments, pending, verification, and reconciliation states
are part of the product and should not be hidden by the UI.

## Rule of Thumb

- LocalStorage: small, simple data, sessions, preferences.
- IndexedDB: larger data, offline access, structured caching.
- Redis: backend only.
- PostgreSQL: source of truth.
- API: the only permitted boundary for frontend communication with the distributed system.
