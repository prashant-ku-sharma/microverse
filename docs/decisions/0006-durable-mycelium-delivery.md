# ADR 0006: Durable event intent and remote-owned cart service

- Status: Accepted
- Date: 2026-11-09
- Stage: 6

## Context

Host routes mount one organism UI at a time. Plain CustomEvents would lose product adds before the Cart page mounts, and a shared cart store would violate ownership. A working count must come from SYMBIONT's committed state.

## Decision

Define four version-1 Zod-discriminated event contracts with metadata/correlation and typed source-bound APIs. Use CustomEvents for live transport. Persist opaque add intents before dispatch in a bounded inbox, with explicit acknowledgement and backpressure. Keep all business interpretation in SYMBIONT.

Expose SYMBIONT's headless ./cart-service through federation. Host subscribes to facts before starting the service; Cart UI shares that same remote-owned instance. Service startup is asynchronous and failure-contained. It is not Host-owned business logic or a shared global Redux store.

Persist the cart and applied event ID together before acknowledgement. Use sessionStorage for a tab-scoped cart/inbox that survives reload/unmount without pretending to solve concurrent cross-tab or backend state. Reject unsupported/corrupt versions rather than overwrite them. Keep sample cart loading explicit; a fresh connected cart starts empty.

## Consequences

Adds are consumed while the Cart UI is absent, or reconciled after service absence. Interrupted acknowledgements can replay without duplicate cart changes. The Host renders a count projection, not cart state. Reference-counted lifetimes clean up subscriptions and simulation timers. Storage failure/backpressure is visible; this remains a local demo, not account persistence, cross-origin messaging, or global exactly-once delivery. Nucleus, profile/offer events, and production API reconciliation remain later work.
