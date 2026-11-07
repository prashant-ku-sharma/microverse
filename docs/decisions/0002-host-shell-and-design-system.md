# ADR 0002: Host-owned routes and presentation-only design system

- Status: Accepted
- Date: 2026-11-07
- Stage: 2

## Context

The Host needs a polished application shell before remote integration. Reusable visuals must not create coupling between organisms or imply that future functionality already exists.

## Decision

Use React Router's declarative BrowserRouter, Routes, and NavLink APIs in Ecosystem. The shell owns six routes, active navigation, page composition, document titles, and focus restoration. The four organism routes remain Host-owned placeholders with no remote imports. A wildcard route offers recovery to the dashboard.

Expand shared-ui with theme tokens, MUI defaults, and presentation components. Keep Emotion as MUI's styling engine. Callers supply routing-aware actions; shared-ui does not depend on the router. Use a permanent sidebar at md and above and a temporary accessible drawer below md. Keep organism status and recent activity clearly labeled as placeholders. The map is illustrative.

## Consequences

The five apps retain standalone entry points and build outputs. Shared UI tests join root verification. Static production hosts will require an index.html fallback for BrowserRouter deep links when deployment is configured. Federation, business state, live status, durable events, authentication simulation, and remote failure boundaries remain outside Stage 2.

Stage 2 was explicitly requested on the same day as Stage 1; all commits retain actual creation timestamps.
