# ADR 0012: Final acceptance against real artifacts and private observation

- Status: accepted
- Date: 2026-11-14

## Context

Final acceptance must demonstrate actual federation and owner communication without inventing live deployment or health evidence. The Host dashboard still contained static status/activity placeholders. Live Netlify targets and credentials remain unavailable.

## Decision

Reuse existing NUCLEUS/IMMUNE SYSTEM observations for dashboard versions/status and record only validated event metadata in a bounded Host-local observer. Add privacy-preserving profile-save and explicitly simulated checkout facts to existing MYCELIUM contracts. Do not move business state or introduce another runtime architecture.

Use Playwright against actual independently built applications. Keep unavailable/registry/release controls in a local-only test server, never deployed app code. Compare Host artifact hashes across independently built Cart publication/promotion/rollback. Use a separate test readiness port to avoid unrelated macOS wildcard-port responses. Distinguish local artifact evidence and CI verification from pending live Netlify acceptance.

## Consequences

The dashboard reports observed facts rather than placeholders or fabricated health. Event payloads remain private; the feed does not reconstruct missed facts. Test infrastructure adds no production API. Acceptance statuses are scoped to evidence, and external hosting remains explicitly incomplete until configured. See [acceptance](../acceptance.md) and [development](../development.md).
