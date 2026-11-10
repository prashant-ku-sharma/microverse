# MUTANT: independent offers

MUTANT runs on strict port 5004, independently builds/tests, and exposes `./routes` plus the lifecycle-only `./offers-service`. The Host lazily renders it at /offers and starts its background service asynchronously, so coupon eligibility updates while another page is visible. It imports no other app's internals.

## Rules owned by MUTANT

| Coupon    | Benefit                          | Minimum merchandise subtotal |
| --------- | -------------------------------- | ---------------------------: |
| WELCOME10 | 10% merchandise discount         |                       ₹1,000 |
| SAVE20    | 20% merchandise discount         |                       ₹3,000 |
| FREESHIP  | Waive the actual delivery charge |                       ₹1,500 |

Fixtures are valid from 2026-11-01T00:00:00Z through 2027-12-31T23:59:59.999Z, inclusive. The details dialog shows both UTC validity dates and minimum; cards show current eligibility. These fixed mock dates intentionally expire; tests control the clock. WELCOME10 does not imply an unimplemented first-order identity rule.

Only one coupon is selected; applying another replaces it. Minimums use merchandise subtotal before discounts/delivery. No empty or processing cart qualifies. FREESHIP requires a positive delivery charge. Percentage savings round once to integer paise; free delivery uses the charge reported by Cart. Eligibility is reevaluated on every current cart pricing fact and on expiry. Cart changes below the minimum, clear/checkout, or expiry remove the selection.

## State and quote flow

MUTANT owns its catalog/evaluator in offers.ts and its service/selected code in offers-service.ts. A schema-version-1 selection record at `microverse:mutant:v1:selection` stores only the code, never another remote's state. Storage failure preserves the previous record and offers Retry/Reset. Corrupt saved data is not silently overwritten.

The service subscribes to MYCELIUM pricing/clear facts before requesting a snapshot. It publishes expiring, cart-basis-bound offer quotes and removal facts. SYMBIONT verifies basis/lease, bounds adjustments, and reports the confirmed amounts. MUTANT displays Confirmed in Cart only after matching acknowledgement. Cart owns its ₹99 demo delivery and total composition; MUTANT owns all coupon rules. The old automatic 10% Cart discount is removed. See [communication contracts](communication.md).

CustomEvents are transient. Persisted selection plus startup request/current facts reconcile missed notifications; the Host keeps both owner services alive independently of their pages. Quotes are not persisted in Cart and its generic lease timer also handles owner absence. Each service uses cleanup-safe reference counting and bounded timers.

Standalone Offers provides an explicit local cart estimate form. For ₹2,500 subtotal and ₹99 delivery, WELCOME10 saves ₹250, SAVE20 needs ₹500 more, and FREESHIP saves ₹99. Preview emits no fabricated Cart facts and changes no SYMBIONT state. Standalone and Host origins/tabs remain separate.

## Verification

Run `pnpm --filter @microverse/mutant dev`, `test`, `typecheck`, `build`, or `preview`. Stop dev before production preview.

In the Host add two Moss planters and a Field bottle: subtotal ₹4,270, delivery ₹99. SAVE20 saves ₹854 and Cart total is ₹3,515. Remove the bottle: subtotal ₹2,980 no longer qualifies for SAVE20, so total becomes ₹3,079. FREESHIP yields ₹2,980. Remove it and select WELCOME10: savings ₹298, total ₹2,781. Reload to verify reconciliation; simulated checkout retains that quote in the receipt and clears Cart/selection.

Tests cover rules/boundaries/rounding/dates, rendering/details, standalone preview, apply/remove/replace, cart event consumption, revision changes, no acknowledgement loops, persistence restart/failure/corruption, expiry, cleanup, Host loaders and failure boundaries. Browser verification repeats development and independently built production flows, tests remote outage containment, and checks responsive widths. No backend coupon redemption or payment is implemented.
