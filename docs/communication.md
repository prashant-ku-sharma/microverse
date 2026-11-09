# MYCELIUM: typed events and durable reconciliation

Stage 6 connects PARASITE, SYMBIONT, and ECOSYSTEM through browser CustomEvents. There are no application-to-application source imports, shared Redux store, or shared cart business state. MYCELIUM depends only on Zod 4.6.7, aligned through the pnpm catalog. SYMBIONT owns its cart service and persistence; ECOSYSTEM observes cart facts.

## Version 1 contracts

Every envelope contains `id` (UUID), `name` (namespaced discriminator), `source`, `timestamp` (UTC ISO datetime), `schemaVersion: 1`, `correlationId` (UUID), and `payload`. Types are inferred from a Zod discriminated union, so narrowing by name narrows payload and source. `EventOf<Name>` and `PayloadOf<Name>` support typed consumers.

| Event                        | Source   | Payload and meaning                                                                            |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `microverse:product:added`   | parasite | `{ product, quantity }`: durable add intent; not proof that a cart has accepted it             |
| `microverse:product:removed` | symbiont | `{ productId, quantity }`: fact after removing a cart line                                     |
| `microverse:cart:updated`    | symbiont | `{ itemCount, subtotalPaise, discountPaise, totalPaise, revision }`: committed cart projection |
| `microverse:cart:cleared`    | symbiont | `{ reason: 'user' \| 'checkout', revision }`: committed clear fact                             |

The product transport snapshot includes ID, name, category, description, an HTTP(S) image URL, integer `unitPricePaise`, and stock. It deliberately omits discovery-specific fields such as ratings and materials. Version 1 uses INR. PARASITE converts its rupee fixture prices to paise at publication. SYMBIONT validates its own persisted items and owns merging, availability, rounding, discount, and checkout rules.

Zod validates publication and every subscription delivery. Unknown versions, invalid IDs/timestamps/sources, extra properties, malformed payloads, and mismatched native event names are rejected. Source fields express contract ownership; CustomEvents are not an authentication boundary. Incompatible future envelopes require an explicit new version/migration, not an implicit cast.

## Public API

```ts
import {
  createMycelium,
  events,
  subscribe,
  unsubscribe,
} from '@microverse/mycelium';

const parasite = createMycelium('parasite');
// Bind source once; the call site is publish(event, payload).
parasite.publish(events.PRODUCT_ADDED, {
  product: {
    id: 'moss-planter',
    name: 'Moss planter',
    category: 'Workspace',
    description: 'A sample planter.',
    image: 'http://127.0.0.1:5001/images/products/moss-planter.svg',
    unitPricePaise: 149000,
    stock: 18,
  },
  quantity: 1,
});

const callback = (
  event: import('@microverse/mycelium').EventOf<typeof events.CART_UPDATED>,
) => {
  console.log(event.payload.itemCount);
};
const stop = subscribe(events.CART_UPDATED, callback);
unsubscribe(events.CART_UPDATED, callback); // same callback reference
stop(); // returned cleanup is also supported and idempotent
```

A top-level `publish(name, payload, { source, correlationId? })` is also exported. Source-bound clients restrict event names to that source's contracts at compile time. The optional correlation ID lets a consumer carry the original interaction through derived events. Duplicate subscription of the same callback/name is idempotent. Each callback receives a separately parsed envelope; mutation or exceptions in one callback do not affect other subscribers. Synchronous exceptions and rejected asynchronous callbacks are logged and isolated.

## Full loading and event flow

1. The Host installs CART_UPDATED/CART_CLEARED listeners, then requests SYMBIONT's `./cart-service` through the existing federation runtime. This asynchronous service load does not block the shell or Products. Failures leave the count unknown and show Cart unavailable.
2. SYMBIONT restores its tab-scoped cart, subscribes to PRODUCT_ADDED, drains pending requests, and publishes its current count (including zero). Its service can run while the Cart page is unmounted.
3. PARASITE publishes PRODUCT_ADDED. MYCELIUM validates it, writes its envelope to the durable inbox, then dispatches the CustomEvent. Publication fails visibly if storage fails or the inbox is full.
4. SYMBIONT reconciles pending envelopes. It applies its own add/stock rules and atomically stores the updated cart **and applied event ID in one sessionStorage record**. Only then does it announce CART_UPDATED and acknowledge the envelope.
5. ECOSYSTEM updates only a count projection from the validated cart facts. It never reads a cart persistence key or calls cart mutations. Lower-revision facts are ignored. The navigation badge also exposes its count in its accessible name.
6. Cart UI mounts with useSyncExternalStore against the same remote-owned service used by the headless expose. No second cart is seeded. Quantity changes, removals, clears, and completed checkout publish facts after persistence.

The Host imports only MYCELIUM contracts and a federation loader. PARASITE never imports SYMBIONT. The dependency graph is applications → MYCELIUM → Zod; MYCELIUM has no application, React, or shared UI dependencies.

## Consumer absence, interruption, and storage

CustomEvents provide no durable delivery. The browser tab's sessionStorage inbox uses one opaque PRODUCT_ADDED envelope per key under `microverse:mycelium:v1:pending:`. MYCELIUM does not calculate totals, merge lines, or decide whether stock is available. SYMBIONT owns `microverse:symbiont:v1:cart`, containing versioned items, a revision, and deduplication receipts. Neither PARASITE nor ECOSYSTEM reads this record.

If the service is not loaded, unavailable, stopped, or busy processing checkout, add requests remain pending. Startup/retry drains them. If interruption occurs after cart commit but before acknowledgement, the persisted receipt prevents a second add. Reloading preserves both records. The inbox is capped at 100 pending requests with explicit backpressure; older requests are never silently evicted. Applied IDs retain the most recent 1000 receipts; the controlled acknowledgement/replay path is idempotent, not a general exactly-once messaging system.

Cart writes are validated and completed before in-memory mutation/notification. Failed writes keep the prior cart and the request pending. The Cart alert provides Retry and an explicit Reset saved cart action for corrupt cart state. Reset does not discard pending envelopes. Corrupt inbox records are preserved and reported, rather than silently deleted; manual inspection/clearing of that tab's request storage is needed for recovery from externally corrupted inbox data.

Session storage is intentionally scoped to **one origin and browser tab**, surviving reload and route unmount. It avoids cross-tab concurrent writers; it is not an account/backend cart, cross-device sync, or durable storage after tab closure. The connected demonstration must run inside ECOSYSTEM on port 5000. Standalone apps on ports 5001/5002 keep separate origin-local sessions; no cross-origin event bridge is invented. PARASITE's standalone feedback makes this distinction explicit.

## Lifetime and checkout

The service has a reference-counted start/stop API. The Host and Cart UI each hold a lifetime reference. Leaving the Cart page retains the Host's service; stopping its final owner unsubscribes and cancels a pending simulation without losing persisted items. Hook listeners and late asynchronous service loads are cleaned up under unmount/StrictMode replay.

Checkout receipts and processing phase remain transient simulations. Reload restores the saved items as an editable cart. A completed simulation persists the empty cart and publishes clear/update facts. Requests arriving during processing are saved and applied afterward; new shopping activity can replace the transient confirmation with the new cart. The 10% sample discount is still SYMBIONT-local; no offer or checkout-completed event is introduced in this stage.

## Diagnostics and verification

Console debug records include phase, timestamp, event name/ID, and correlation ID where available. Payloads are excluded. `getEventLog()` returns a copy of a bounded 100-record diagnostic history for that loaded MYCELIUM module instance; separate federation bundles interoperate via native browser events/storage, not a hidden JavaScript singleton. Console output aggregates those instances naturally.

Tests cover public API publication/subscription/cleanup, native event validation, metadata/correlation, listener failures, storage errors and bounds, reconciliation before mount, live headless consumption, duplicate replay, write/acknowledgement interruption, stock rules, cart facts, Host count propagation, malformed federation services, and lifecycle cleanup. Browser QA exercises independently served development and production builds; source mocks alone are not integration evidence.

Reproduce with the three filtered dev commands (or `pnpm dev`). Open the Host Products route, add items before visiting Cart, and verify its count. Reload and verify persistence. Stop SYMBIONT, reload Products, save another request, and reload again. Restart SYMBIONT and reload the Host to retry its cached federation load: the request is reconciled once. Quantity/remove/clear/checkout actions update the Host count. Native ESM failures may be cached, so recovery uses a full reload.

Official references checked: [Zod schemas and discriminated unions](https://zod.dev/api), [federation runtime APIs](https://module-federation.io/guide/runtime/runtime-api). The existing supported registerRemotes/loadRemote APIs load both routes and the service; no Nucleus is implemented.
