# Development and verification

## Prerequisites

Use Node.js 24 LTS, pnpm 11.25.0 and a modern browser with CustomEvent, crypto.randomUUID, sessionStorage, native ESM and service workers. Node 24 also executes the deployment scripts' shared TypeScript validation schema. The mock APIs require HTTPS or a trusted loopback origin; use the documented 127.0.0.1 URLs consistently.

```sh
pnpm install
pnpm dev
```

The root dev command starts all five independent Vite processes. Each port is strict: ECOSYSTEM 5000, PARASITE 5001, SYMBIONT 5002, COMMENSAL 5003, MUTANT 5004. Open `http://127.0.0.1:5000/`. Each remote also runs standalone on its own origin. Use `pnpm --filter @microverse/parasite dev` (or another application name) for one application. Install remains a workspace operation; builds/tests/type checks can be filtered independently.

## Commands

| Command                                      | Purpose                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm install`                               | Install the committed workspace lockfile; CI uses --frozen-lockfile                    |
| `pnpm dev`                                   | Start five independent Vite development servers                                        |
| `pnpm build`                                 | Type-check shared packages and build all five application outputs                      |
| `pnpm lint`                                  | Workspace ESLint with zero warnings                                                    |
| `pnpm typecheck`                             | Strict application/package TypeScript plus Playwright configuration/specs              |
| `pnpm test`                                  | Vitest business/UI/transport/integration tests and Node deployment orchestration tests |
| `pnpm test:deployment`                       | Deployment orchestration tests with explicit platform/browser test doubles             |
| `pnpm exec playwright install chromium`      | Install the browser required for local end-to-end tests                                |
| `pnpm exec playwright test`                  | Build actual applications and execute the complete Chromium acceptance suite           |
| `pnpm format:check`                          | Check formatting                                                                       |
| `pnpm --filter @microverse/symbiont preview` | Serve its existing production build on its assigned port                               |

All five app packages support dev, build, preview, lint, typecheck, test and test:watch. `pnpm --filter '@microverse/symbiont...' build` includes required workspace dependencies; it does not build sibling applications. Shared packages expose source for Vite; their build validates TypeScript rather than emitting a separate distribution.

## Full end-to-end suite

Stop task-owned dev/preview servers first. Ports 5000–5004 must be available on 127.0.0.1; port 5005 is reserved only for test-fixture readiness. The fixture uses that separate readiness port because macOS Control Center can answer requests on wildcard port 5000 even when explicit 127.0.0.1:5000 is available. Do not kill unrelated system services to run tests.

On Linux CI, install browser OS libraries with `pnpm exec playwright install --with-deps chromium`. Browser downloads require network access. The suite's webServer command builds the five actual apps, then independently builds Cart 1.0.0 and 1.0.1 into ignored deployment/.local/e2e directories. It serves real remote entries/chunks, public images, MSW worker assets and the Host on the assigned ports. One worker serializes fixture control changes; each test gets a fresh browser context/storage. No test replaces a federated module with a local component.

The local-only fixture controls remote HTTP unavailability, registry invalidity, release publication and version selection. These endpoints are in e2e/server.mjs and never copied into application deployment artifacts. The independent-release scenario exposes a separately built artifact, changes only the served registry, confirms the actual Cart version chip, compares every Host artifact's SHA-256 before/after and rolls back. This is verified local static publication, not a Netlify deployment. The protected live promotion/browser gates in [deployment.md](deployment.md) require real configured sites and credentials.

Reports go to playwright-report/; failed traces/screenshots and test attachments go to test-results/. Build hash evidence is deployment/.local/e2e/build-evidence.json. All are ignored by Git. Use `pnpm exec playwright show-report` to inspect an existing report. The integration GitHub Actions workflow retains reports/evidence for 14 days. Coupon acceptance fixes the test browser clock inside deterministic fixture validity; application clocks are unchanged in normal use.

## Test ownership and coverage

- PARASITE catalog tests cover combined search/category/stock filters, stable sorting, detail selection, pricing display and unavailable products.
- SYMBIONT tests cover integer-paise arithmetic, quantity/stock limits, removal, persistence, durable intent deduplication, checkout, quote freshness and listener cleanup.
- MUTANT tests cover eligibility boundaries, percentage rounding, free shipping, UTC validity, application/removal and Cart reconciliation.
- COMMENSAL tests cover owner validation, draft/save/cancel, PATCH failures, persistence and privacy-preserving profile-save facts.
- MYCELIUM tests cover typed publishing/subscription/unsubscription, envelope metadata, schema/source/payload validation, durable inbox limits and subscriber failure isolation.
- Host tests cover routes/mobile navigation, counters, service lifetimes, registry parsing/origins/fallback, timeouts/compatibility, remote boundaries/recovery, metadata-only event observation and cleanup.
- Shared UI tests cover theme application, presentation components and accessible status/loading controls. Playwright adds real cross-remote behavior, healthy console checks, keyboard/phone/standalone checks and local release switching.

## Mock data, fault and persistence controls

MSW intercepts owner-local `/api/*` endpoints; no real backend is needed or implemented. Each owner keeps its own TanStack Query cache. `?mock-products=slow`, `?mock-products=empty`, `?mock-products=error`, and matching cart/profile/offers scenario parameters expose deterministic loading, empty and failure states. APIs also accept x-mock-scenario for tests. See [mock API contracts](mock-apis.md).

Cart, profile, offer selection and the durable product inbox are scoped to browser origin and tab session. Standalone remote origins intentionally have separate persistence from embedded views in the Host origin. Reload preserves saved owner state; a new tab/context starts independently. Do not clear another application's keys to implement a business action. Test contexts isolate storage automatically. Corrupt business records are preserved/reported rather than silently overwritten; UI reset actions are explicit.

Only public VITE_* values belong in frontend environment files. Copy an app's .env.example when needed; .env files are ignored. Never set VITE_* tokens. Release identity is VITE_REMOTE_VERSION; the controlled PARASITE render fault is opt-in for built QA and defaults off. NUCLEUS runtime files select remote URLs; Host source has no per-remote URL constants. See [NUCLEUS](nucleus.md) and [resilience](resilience.md) for controlled failures and recovery.

## Troubleshooting

- A failed import may remain cached: use Retry remote for a fresh document after restoring its server. Already loaded JavaScript can continue working during a later outage.
- Stop old dev/preview processes before end-to-end tests; the fixture refuses to reuse unknown servers.
- Allow the local MSW worker to register; stale worker protocol changes require the migration described in deployment.md.
- If pnpm reports an unexpected store location in a restricted environment, use the existing configured store with appropriate filesystem/network permission. Do not rewrite the lockfile or disable policy checks to hide it.
- A shared Host MUI chunk exceeds Vite's advisory threshold. It does not fail builds; no limit was raised to hide it. Fixed mock coupon dates and tab-only persistence remain demonstration constraints, not production commerce guarantees.
