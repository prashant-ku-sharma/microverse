# ADR 0011: Independent Netlify targets and separately promoted registry

- Status: accepted
- Date: 2026-11-14

## Context

Remote releases must deploy without rebuilding the Host, remain available for rollback, and not become active before verification. NUCLEUS currently fetches same-origin policy and registry paths. No live platform targets or credentials are available in this workspace.

## Decision

Use five independent Netlify application sites plus a sixth static registry site. GitHub Actions builds one application's dependency graph. Publish remote assets in immutable version directories while retaining earlier Netlify digests. Verify drafts before publishing. Keep the trust policy in the Host; proxy only active/fallback registry JSON to NUCLEUS. Promotion/rollback is a separate manually invoked workflow, not an automatic remote-deployment side effect.

Require schema/origin/compatibility/asset checks and candidate plus published browser gates against the existing Host. Use expected snapshot hashes and serialize publishers. Retain content-addressed registry snapshots and never delete earlier remote release paths. Record actual deployment and Host identities in receipts.

## Consequences

Version promotion and rollback require no Host build or deployment. Origin-policy changes still require a Host policy deployment. Six canonical Netlify targets in one team and protected GitHub environments are operator prerequisites. Platform storage grows with retained releases; no garbage collection is introduced. Public artifact hashes verify served bytes, not publisher trust. Worker changes need a migration plan when old releases coexist. Live deployment and browser acceptance remain unverified until credentials and actual URLs are configured. See [deployment procedures](../deployment.md).
