# ADR 0004: Runtime federation with shared framework contexts

- Status: Accepted
- Date: 2026-11-08
- Stage: 4

## Context

The product application is independently runnable. The Host must consume its live code without importing remote source, taking product ownership, or requiring the remote to be available at startup/build time.

## Decision

Use `@module-federation/vite` 1.23.11 and matching runtime 2.9.3 after reviewing the official configuration, runtime, sharing, and share-strategy documentation. Expose `./routes` and consume it lazily through explicit registerRemotes/loadRemote calls. Use loaded-first to keep offline remotes out of Host bootstrap.

Keep BrowserRouter, ThemeProvider, shell, and titles in the Host for embedded execution. Share React, React DOM, React Router, MUI, and Emotion entry points as compatible singletons, using the same package-config rules and pnpm suffix matching. Preserve standalone PARASITE wrappers and keep its business logic local.

Bound loading time and contain failures at the products route. Offer a full reload rather than promise that cached ESM imports can always be retried in place. Use a fixed development entry with a build-time environment override; do not introduce Nucleus or a runtime registry.

## Consequences

ECOSYSTEM builds and starts without PARASITE; PARASITE continues to build and run alone. A remote-only rebuild at the same entry is consumable without rebuilding the Host. Runtime network failures are expected and contained. Cached code can survive a stopped server, so failure verification includes a fresh Products request. Shared MUI currently increases the Host provider chunk and generates a size advisory; optimization and production cache/deployment policies remain later work.
