# ADR 0001: Standalone workspace foundation

- Status: Accepted
- Date: 2026-11-07
- Stage: 1

## Context

MICROVERSE must grow through separately verified implementation stages. Five independently runnable applications need consistent tooling without introducing business coupling or pretending local imports are federation.

## Decision

Use a private pnpm workspace with `apps/*` and `packages/*`. Each application owns its entry point, manifest, Vite config, tests, and output. Shared packages export source and type-check without emitting artifacts. A workspace catalog aligns framework and styling versions. Use Node 24 LTS and TypeScript 5.9 for toolchain compatibility.

Keep only the dark MUI theme in shared-ui and Vite/test setup in config. Reserve the three remaining infrastructure packages with empty valid exports. Use strict ports 5000–5004 and run app dev scripts concurrently. Do not select or install a federation library yet.

## Consequences

Applications can run and build separately after workspace installation. Shared infrastructure changes are bundled into each application build; these are not independently published packages. Future federation, durable communication, business features, deployment pipelines, and runtime configuration require explicit later stages and decisions. Root verification checks all projects, while each app remains independently addressable through pnpm filters.
