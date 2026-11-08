# ADR 0003: PARASITE owns local product discovery

- Status: Accepted
- Date: 2026-11-08
- Stage: 3

## Context

Product discovery must work independently before runtime federation or cart communication exists. The catalog needs realistic data and navigation without creating shared business state or falsely reporting cart delivery.

## Decision

Place the Product interface in shared-types; keep all fixtures, assets, selection rules, and product UI inside PARASITE. Use deterministic synchronous mock inventory, local SVG product illustrations, and INR pricing. Do not introduce a mock network, server cache, or asynchronous data-fetching abstraction for synchronous fixtures.

Use a standalone BrowserRouter, catalog and detail routes, and URL search parameters for discovery state. Carry those parameters into details and back. Split the two pages with local React.lazy/Suspense imports, preserving independent static build output. No federation is selected or configured.

Disable cart controls for zero stock. For available products, acknowledge cart intent with a truthful information message. No cart, stock mutation, durable intent queue, or cross-application events are implemented. The Host keeps its existing products placeholder.

## Consequences

PARASITE can run and build without the Host or other organisms. Shared packages remain infrastructure/contracts only. Live API fetching, server state, cart-event schemas, durable delivery, and runtime federation belong to later stages. BrowserRouter deployments require an index.html fallback; assets are self-contained in the app's dist directory.
