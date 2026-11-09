# ADR 0005: Cart ownership and local checkout simulation

- Status: Accepted
- Date: 2026-11-09
- Stage: 5

## Context

SYMBIONT must be usable independently and through federation before Mycelium exists. It needs meaningful cart and checkout behavior without importing PARASITE or inventing a shared business store.

## Decision

Keep cart models, fixtures, reducer, monetary rules, and receipt inside SYMBIONT. Use integer paise and a fixed, explicitly labeled 10% sample discount. Enforce quantity limits and processing guards in the reducer. Simulate checkout with a cleanup-safe local timer and immutable receipt snapshot; no payment occurs.

Use mount-local state with explicit sample restoration. No state persists across reload/route unmount. This keeps Stage 5 bounded; durable delivery/reconciliation will require a separate decision when event communication is requested.

Expose ./routes with standalone/embedded presentation, reusing the verified federation configuration and runtime APIs. Keep standalone root/theme/shell outside the exposed component. Extract the now-shared Host route boundary for both remotes; business logic stays separate.

## Consequences

Cart operations and receipts work in either context with independent state. Host builds do not need running remotes. The Host dynamically loads Cart from port 5002 and isolates failures. Product-to-cart, offer events, persistence, production registry/cache/deployment policy, and real checkout remain later stages.
