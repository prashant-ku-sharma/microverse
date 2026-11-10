# ADR 0007: private profiles and reconciled offer quotes

- Status: accepted
- Actual date: 2026-11-10
- Stage: 7

## Context

COMMENSAL and MUTANT must run standalone and federated, own business state, and avoid direct MFE imports. Coupons depend on cart facts and must remain correct while Offers UI is absent. FREESHIP needs a real charge to waive. Existing strict version-1 consumers must not reject expanded CART_UPDATED payloads.

## Decision

COMMENSAL owns a validated, tab-scoped demo profile and draft/save/cancel UI. Profile data stays private; no unnecessary PII event is introduced. User and notification preferences are saved local selections with explicit simulation limits.

MUTANT owns coupon fixtures, validity, minimums, discount calculation, nonstacking selection, and persistence. It exposes routes and a separate headless lifecycle facade through the existing supported federation APIs. Host requests the service asynchronously without taking state ownership. Shared StandaloneShell is visual infrastructure only.

Add separate version-1 CART_PRICING_UPDATED and CART_REQUESTED contracts plus OFFER_APPLIED/OFFER_REMOVED. Preserve original strict CART_UPDATED and all Stage 6 names/payloads. MYCELIUM transports wire contracts, never business calculations. Startup subscribes before requesting a snapshot; persisted code and current owner facts reconcile missed transient events. Quote acknowledgement comparisons and synchronous reentrancy guards prevent feedback loops.

Cart distinguishes merchandise basis revision from commit revision. MUTANT quotes carry basis revision and expiry. SYMBIONT rejects stale/expired/processing quotes, clamps monetary adjustments, and owns final composition. A generic lease timer fences expired savings even if MUTANT stops. Cart schema 2 reads legacy schema 1, preserves deduplication receipts, and persists no quote. Selection persistence remains MUTANT-owned. Failed writes retain prior data; expiry failures do not schedule tight retries.

Replace the old automatic sample discount. SYMBIONT charges ₹99 demo delivery for a nonempty cart; MUTANT calculates actual shipping savings. WELCOME10/SAVE20/FREESHIP require ₹1,000/₹3,000/₹1,500 subtotals and have documented UTC mock validity. Coupons replace rather than stack. Standalone Offers uses an explicit estimate, without fake Cart publication or cross-origin synchronization.

## Consequences

All four remote routes independently build/run and have separate failure boundaries. React/React DOM/MUI/Emotion sharing stays aligned. The Host composes owner lifecycle modules but imports no remote business code. Browser verification must exercise separately served builds; source mocks are insufficient evidence.

Storage remains per origin/tab, not an authenticated account or server transaction. CustomEvents are not a security boundary. Native import caches can require reload after recovery. Production registry, immutable release policy, authentication, deployment automation, and backend redemption remain later-stage work.
