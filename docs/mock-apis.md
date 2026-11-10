# Mock APIs and application data layers

Stage 8 uses MSW 3.0.4 and TanStack Query 5.107.1 with real fetch requests. No HTTP backend is built. These are demo mock APIs in development **and production previews**. Every domain owns its handlers, client, query client, seeds, business rules, and persistence. No application imports another application's handlers or calls another MFE's HTTP API.

## Endpoints and ownership

| Owner     | Request                    | Response / operation                                                                                    |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| PARASITE  | GET /api/products          | Array of 12 deterministic products                                                                      |
| PARASITE  | GET /api/products/:id      | Product or 404                                                                                          |
| SYMBIONT  | GET /api/cart              | `{ cart, error: null }` owner snapshot; cart contains items, phase, transient receipt, notice and quote |
| SYMBIONT  | POST /api/cart/items       | `{ product, quantity }`; returns committed snapshot, 201                                                |
| SYMBIONT  | PATCH /api/cart/items/:id  | `{ quantity }`; returns committed snapshot                                                              |
| SYMBIONT  | DELETE /api/cart/items/:id | Removes the line and returns committed snapshot                                                         |
| COMMENSAL | GET /api/profile           | Owner's saved profile, or deterministic demo profile for a fresh tab                                    |
| COMMENSAL | PATCH /api/profile         | Top-level partial profile, validated and merged; nested blocks are complete replacements                |
| MUTANT    | GET /api/offers            | WELCOME10, SAVE20, FREESHIP array                                                                       |
| MUTANT    | POST /api/offers/validate  | `{ code, cart }`; returns `{ eligible, reason, quote }` against a MYCELIUM pricing snapshot             |

All mutation bodies are strict Zod schemas. Unknown fields, malformed JSON, and invalid values return 400. Missing products/cart lines/coupons return 404. Cart stock excess and processing conflicts return 409. Ineligible known coupons return 200 with eligible=false and no quote; invalid requests/failed infrastructure do not pretend to be successful validation. Storage failures return 500 while retaining prior saved data. API errors contain a message and the client raises an ApiError with status.

Profile's explicit Reset demo profile action uses PATCH with `x-reset-profile: true`. It is a local demo recovery operation, not authentication or a backend administrative API. Profile data never enters MYCELIUM.

## Worker lifetime and federation

Each app has the generated `public/mockServiceWorker.js`; ECOSYSTEM hosts the identical vendor script so embedded remotes can register at the Host origin. The Host imports no domain handler, product catalog, cart, profile, or offer model. Remotes call ensureMockApi with their own handlers before their first fetch. Registration and activation are awaited; domain handlers are added before requesting their API.

Federation may bundle several copies of mock-utils. A versioned Symbol.for key holds one **transport-only** worker/start promise and registered-domain names per window. All remotes use that transport's worker.use API instead of starting competing workers at the same scope. It contains no business data or query cache. A failed startup clears the handle for a later attempt. Separate standalone origins use their own worker/window/session. Full reload after handler HMR changes rebuilds registrations.

Clients use same-origin /api URLs. Unhandled asset/federation traffic bypasses MSW. Service Workers need localhost/loopback or HTTPS and the root worker script must be served as JavaScript. This project intentionally enables mocks in built demos because no real backend exists. Deployment/real-backend selection remains future work; do not mistake a Vite preview for a server API. Regenerate vendor scripts after changing the MSW version:

```sh
pnpm --filter @microverse/parasite exec msw init public --save
pnpm --filter @microverse/symbiont exec msw init public --save
pnpm --filter @microverse/commensal exec msw init public --save
pnpm --filter @microverse/mutant exec msw init public --save
```

Copy the same generated file into apps/ecosystem/public as well. Vendor files are excluded from ESLint/Prettier to preserve their generated contents.

## Query and state ownership

Each remote owns a QueryClient and wraps its exposed entry in a matching QueryClientProvider. It works standalone or embedded without sharing business caches or requiring the Host to provide Query context. Queries disable automatic retry/window-focus refetch; explicit Retry controls expose deterministic failures. Profile and Cart pending writes disable conflicting edits.

PARASITE list/detail render HTTP responses; discovery filters/sorting remain owner logic. COMMENSAL keeps a separate draft after GET and accepts it only after PATCH persistence succeeds, then updates its private query cache. Failed saves retain the draft. Reset is explicit; corrupt data is never silently overwritten.

SYMBIONT's existing service is the mock cart repository/domain engine as well as the headless MYCELIUM consumer. The API facade delegates to that owner rather than creating a second competing cart database. UI reads GET and quantity/removal use HTTP mutations; successful mutations and owner notifications update the remote's Query cache. The latest owner snapshot wins after mutation, including a synchronous quote acknowledgement. MYCELIUM add intents still use their existing durable inbox and atomic cart/receipt-before-acknowledgement path. This event ingress intentionally does not call an MFE HTTP API. Clear/sample/checkout are local simulation workflows; no invented endpoints are needed for them. Their owner facts update the same cache. Session storage schema 2 and legacy migration remain intact.

MUTANT fetches the catalog and validates user selections via POST before applying/publishing. Failed validation publishes no offer. If the cart basis changes or checkout starts while awaiting a response, the result is rejected. Automatic eligibility/expiry/quote reconciliation still runs within MUTANT's owner service while the page is absent. Both handlers and service reuse MUTANT's evaluator; no pricing rules move into mock-utils or another MFE. Cart context is supplied through MYCELIUM, never fetched from Cart's API.

## Deterministic scenarios

Default response latency is 240 ms. Add one domain-specific page query parameter, or send `x-mock-scenario` on an API request:

| Scenario    | Behavior                                                                              |
| ----------- | ------------------------------------------------------------------------------------- |
| slow        | 1,200 ms, then normal response                                                        |
| error       | 503 before any read/write resolver runs                                               |
| write-error | GET succeeds; mutation methods return 503 without writing                             |
| empty       | GET list returns []; Cart returns an empty presentation snapshot; Profile returns 404 |

Domain parameter names are mock-products, mock-cart, mock-profile, and mock-offers. For example:

```text
http://127.0.0.1:5000/products?mock-products=slow
http://127.0.0.1:5000/products?mock-products=error
http://127.0.0.1:5000/profile?mock-profile=write-error
http://127.0.0.1:5000/offers?mock-offers=empty
```

Remove the parameter and reload for recovery. Retry retains the chosen scenario while that URL remains active. Empty scenarios affect the response, not persisted records; they are read-fault demonstrations. Domain business events remain independently operational. No randomness or unsolicited data deletion is used.

## Tests and browser evidence

Each application's api/test-setup.ts starts MSW setupServer with its own handlers, errors on unhandled requests using MSW 3's onUnhandledFrame option, sets latency to zero, resets handlers/query caches, and closes interception. Tests exercise actual fetch requests, not mocked API client implementations. Delayed handlers test loading, failure and retry. Products' test handler factory supplies deterministic HTTP image URLs because Vitest module URLs are file URLs; browser seed assets remain remote-origin URLs.

Coverage includes all endpoint methods, validation/statuses, cart stock guards, fresh repository restoration, profile merge/persistence/write failure, successful and failed coupon validation, stale validation response rejection, API empty states, loading, and existing federation/event regressions. Browser checks supplement Node interception with real Service Worker execution in standalone apps and the federated Host, development and production.

Official sources checked on 2026-11-10: [MSW browser integration](https://mswjs.io/guides/integrations/browser), [MSW start](https://mswjs.io/api/setup-worker/start), [MSW 3 migration](https://mswjs.io/docs/migrations/2.x-to-3.x), and [TanStack Query queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries). Installed types were also checked; MSW 3 uses onUnhandledFrame rather than the older onUnhandledRequest option.
