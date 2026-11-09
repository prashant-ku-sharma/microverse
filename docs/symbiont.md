# SYMBIONT: independent cart and checkout

Stage 5 introduces a functional cart at `http://127.0.0.1:5002/` and exposes the same application as `symbiont/routes` inside ECOSYSTEM's `/cart` route. Product data in this stage is local test data. No PARASITE source, inventory, events, or cart mutations are imported.

## Ownership and state

SYMBIONT owns its CartItem, reducer, initial fixtures, availability limits, price formatting, discount rules, and order receipt. These models remain inside the app. The only new shared contract is `SymbiontRoutesProps`, describing standalone versus embedded presentation.

State uses a remote-local React reducer. Every mount starts with a sample collection: one Lumen task light, two Arc ceramic mugs, and one Seed pocket notebook. Quantity changes are whole numbers between one and that fixture's stock. Removing an item is a separate action. Clear cart and Restore sample cart support exploring the empty state.

The state is intentionally in memory: leaving the Host cart route, reloading, or opening standalone creates a fresh sample cart. The Host and standalone mounts are independent. No persistence, account, cross-tab synchronization, shared global store, or Mycelium delivery is implemented. Persistence/reconciliation must be designed with the later communication stage.

## Monetary rules

All prices and calculations use integer paise in INR. Line amount is unit price × quantity. Subtotal is the sum of line amounts; a fixed **local sample discount of 10%** is rounded once to the nearest paise. Final total is subtotal minus discount. This demo has no additional delivery/tax charges. MUTANT and coupon integration are deferred.

Initial expected totals:

| Value           |    Amount |
| --------------- | --------: |
| Units           |         4 |
| Subtotal        | ₹5,346.00 |
| Sample discount |   ₹534.60 |
| Final total     | ₹4,811.40 |

## Simulated checkout

Checkout progresses from cart → processing → confirmed. A snapshot of items/totals, a DEMO reference, and a timestamp are captured when processing starts. Editing and repeat submission are blocked by both UI controls and reducer guards. After a 900 ms local timer the receipt appears and the active cart clears. The receipt retains the checked-out quantities and totals. Start another sample cart discards the receipt and restores the fixtures.

The timer is cleaned up on unmount, and confirmation receives keyboard focus. A polite status region announces changes. There is no network checkout, payment, delivery, order persistence, or external side effect. Every checkout control and receipt identifies the simulation.

## Execution and federation

```sh
pnpm --filter @microverse/symbiont dev
pnpm --filter @microverse/symbiont test
pnpm --filter @microverse/symbiont typecheck
pnpm --filter @microverse/symbiont build
pnpm --filter @microverse/symbiont preview
```

Dev and preview both use strict port 5002. Stop dev before starting preview.

`main.tsx` owns standalone createRoot, ThemeProvider, and CssBaseline. `App.tsx` adds a standalone header/main. The `./routes` expose points to `src/routes.tsx`, which adds none of these wrappers; the Host passes embedded mode and provides its theme/layout. The cart/confirmation workflow needs no additional browser router.

The Vite plugin uses the same pinned version, singleton sharing rules, loaded-first strategy, and disabled declaration downloads as PARASITE. React/React DOM, MUI/Emotion, and router sharing remain aligned. React Router is declared for the common federation fallback policy even though the cart workflow does not mount a router. Babel fallback is pinned consistently. Development/preview CORS allow Host origin `http://127.0.0.1:5000`. Local illustrations resolve against the remote module's origin so the Host fetches them from 5002.

ECOSYSTEM registers the ESM entry, calls `loadRemote('symbiont/routes')` through React.lazy, and scopes Suspense/error handling to Cart. Its entry defaults to `http://127.0.0.1:5002/remoteEntry.js`, with a public build/dev-start override `VITE_SYMBIONT_REMOTE_ENTRY`. This is not Nucleus or runtime registry configuration. See [federation documentation](module-federation.md).

## Verification

Automated checks cover calculations and rounding, quantity bounds, fixture immutability, removals/clear/restore, empty checkout prevention, processing guards, receipt snapshots, timer cleanup, standalone shell, embedded ownership, cart UI flows, runtime API calls, invalid modules, timeouts, and Host failure containment.

For browser verification, start SYMBIONT and ECOSYSTEM independently. Open the Host overview and choose Cart. Adjust quantities, remove items, clear/restore, and run simulated checkout. Confirm the Host remains on port 5000 while cart illustrations come from 5002. The standalone app shows its own shell and separate state. Stop SYMBIONT and reload Cart: its route fallback appears while Overview/Profile remain usable. Already imported code can remain cached; a fresh page is required to demonstrate an offline entry. Repeat against independently built production previews.
