# ADR 0008: owner-local MSW APIs and Query caches

- Status: accepted
- Actual date: 2026-11-10
- Stage: 8

## Context

All four remotes need asynchronous mock APIs, realistic deterministic failure modes and independent data ownership. Federation executes them in one Host window, where competing MSW workers at the same scope would be unsafe. Cart already has durable event intent and persistence guarantees that must survive the data-layer change.

## Decision

Use stable MSW 3.0.4 and TanStack Query 5.107.1, verified against official docs and installed types. Each remote owns api/handlers.ts, client.ts, query.ts and API tests. Host serves only the identical generated worker script. Shared mock-utils contains transport bootstrap, JSON/error handling, latency and fault selection. One per-window Symbol.for transport handle joins handler registration across independently bundled copies; it contains no domain state.

Wait for worker activation before fetch. Deliberately enable mocks in built demonstrations as well as development because this project has no real backend. API clients use their current origin; standalone origins remain isolated. Each exposed route provides a private Query cache/context, with visible loading/error/empty states and explicit retries. No new federation shared singleton or global business store is introduced.

Keep SYMBIONT's domain service as the single mock cart repository and headless event consumer. Cart handlers delegate to its validated/atomic persistence path. Query-backed UI reads and item mutations use HTTP. Durable MYCELIUM add ingress remains an event path into that same owner engine; clear/sample/checkout stay local simulations. This avoids two cart stores and preserves receipt-before-acknowledgement guarantees without inventing out-of-scope endpoints.

COMMENSAL GET/PATCH wraps its existing validated private storage; drafts remain local until a successful PATCH. MUTANT GET/validation wraps its catalog/evaluator and validates user selection before publication. Its background reconciliation still owns eligibility and lease logic; it never reads Cart's API. Reject user validation responses if cart basis or checkout state changed while awaiting HTTP.

Use deterministic 240 ms latency, explicit 1,200 ms slow response, 503/read/write faults, and non-destructive empty responses. Test with application-local setupServer and real fetch; preserve browser QA of genuine worker execution. Generated worker assets are identical and excluded from source lint/format transforms.

## Consequences

All five apps independently build and all four remotes keep standalone/federated behavior. Query caches are data projections local to their owner, not cross-MFE state. Existing Cart/Profile storage remains origin/tab scoped and no backend or account is created. More demo JavaScript is bundled for MSW; production hosting must serve the root worker correctly. Real backend selection, registry, authentication, deployment automation and further stages remain deferred.
