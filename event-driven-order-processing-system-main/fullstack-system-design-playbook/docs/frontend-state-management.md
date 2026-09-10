# Frontend State Management

This document explains how frontend state should be handled in this
React + TypeScript playbook.

## Philosophy

Frontend state is temporary.

It exists to render the current experience, respond to user interactions,
and manage small interface transitions. It does not replace the API or
PostgreSQL, and it should not attempt to reconstruct all business truth
in the browser.

The mental model used in this project:

| Layer | Responsibility | Source of truth |
| --- | --- | --- |
| React state | Rendering and interaction state | No |
| Client stores | Shared state for the current session | No |
| LocalStorage | Small local persistence | No |
| IndexedDB | Larger local persistence/offline storage/cache | No |
| Redis | Backend cache, locks, and idempotency | No |
| PostgreSQL | Durable business records | Yes |

## React State Lifecycle

1. The component renders data received through props, hooks, or stores.
2. The user performs an action, such as adding a product to the cart.
3. A hook coordinates the action and updates a temporary store.
4. When the action crosses the backend boundary, the hook calls a service.
5. The service uses the central API client.
6. The API response updates the store with the latest known state.
7. A new API read can replace local data considered stale.

This cycle keeps components simple. Components do not call `fetch`, do not know
how headers are assembled, and do not know Kafka, Redis, or PostgreSQL.

## Temporary Interface State

Temporary UI state includes:

- open or closed menu;
- selected tab;
- form fields being edited;
- validation messages;
- loading indicators;
- optimistic state for an action in progress.

This state usually lives in components, hooks, or simple stores. It
can disappear on refresh without compromising system consistency.

## Shared Session State

`src/state/cartStore.ts` represents the current session's cart. It supports the
user experience, but the backend still needs to validate items, prices,
inventory, and payment.

`src/state/orderStore.ts` represents the known lifecycle of an order. It
can indicate that an order was accepted by the API, is pending asynchronous
processing, was confirmed, failed, or needs reconciliation. Even so, the
ultimate authority remains the API reading from the backend.

## Backend Source of Truth

PostgreSQL is the source of truth because it stores durable order,
payment, and outbox state. Redis accelerates the backend, but it is not a business ledger. Kafka
transports events between parts of the system, but it is not the UI's direct contract.

The frontend should rely on the backend for:

- business validation;
- definitive calculation of totals;
- final payment status;
- reconciliation of unknown states;
- consistency between orders, payments, and events.

## Rule of Thumb

Keep the frontend stateless whenever possible. When state is necessary,
make it clear whether it is:

- temporary UI state;
- local browser persistence;
- an API response snapshot;
- durable backend truth.

This separation reduces coupling and makes it easier to evolve the architecture
without turning React components into miniature backends.
