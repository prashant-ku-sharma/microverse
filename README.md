# MICROVERSE

A functional biology-inspired microfrontend ecosystem: five independent React/TypeScript applications, runtime Module Federation, validated CustomEvent communication, owner-local mock APIs, a runtime registry and contained remote failures. The final dashboard shows observed versions/status and metadata activity without inventing health or deployment facts.

**Local and hosted integration/Playwright acceptance and independent CI builds are verified. Live Netlify deployment remains unverified:** actual site URLs and credentials are unavailable. See [final acceptance](docs/acceptance.md) for exact evidence and incomplete live requirements.

## Start the ecosystem

Requires Node.js 24 LTS and pnpm 11.25.0. Use [pnpm's official installation instructions](https://pnpm.io/installation) if necessary.

```sh
pnpm install
pnpm dev
```

Open [ECOSYSTEM](http://127.0.0.1:5000/). The root command starts all five servers concurrently on strict ports. Remote applications also work standalone:

| Application | Port | Responsibility                                                            |
| ----------- | ---: | ------------------------------------------------------------------------- |
| ECOSYSTEM   | 5000 | Host shell, routing, composition, NUCLEUS, IMMUNE SYSTEM and observation  |
| PARASITE    | 5001 | Product catalog/detail, search, category/stock filters and sorting        |
| SYMBIONT    | 5002 | Cart, quantities, totals, persisted reconciliation and simulated checkout |
| COMMENSAL   | 5003 | Profile, address/preferences editing and local persistence                |
| MUTANT      | 5004 | Coupon validity, eligibility, quote calculation and application/removal   |

All business data is mocked using MSW, including WELCOME10, SAVE20 and FREESHIP. No backend or payment credentials are needed. Add a product in Products, open Cart, change quantity, choose an eligible coupon in Offers, then return to Cart for confirmed savings. Profile saves survive refresh in that origin/tab. Notifications/language selections are saved demo preferences, not actual delivery/translations.

## Architecture

The Host calls the supported `registerRemotes`/`loadRemote` APIs from `@module-federation/runtime`, using validated NUCLEUS entries rather than local component imports. Each remote exposes release metadata and routes; Cart and Offers also expose small cleanup-returning lifecycle facades. React/React DOM, Router, MUI and Emotion contexts are consistently shared. Embedded routes use the Host shell/theme; standalone entries supply their own root/navigation.

MYCELIUM validates typed envelopes with Zod and uses browser CustomEvents. Product-add intents are saved before dispatch; SYMBIONT reconciles them, commits its own state/applied IDs and acknowledges afterward. Cart facts update the Host count and MUTANT eligibility. Quotes return through events and are confirmed by SYMBIONT. No shared global business store or direct remote-to-remote source imports exist. Profile-save facts exclude personal fields; checkout facts explicitly identify simulation.

NUCLEUS owns trusted-origin policy, versions, compatibility, flags and validated fallback. IMMUNE SYSTEM owns per-remote boundaries, timeouts, retry and honest runtime observations. Federation code executes in the Host security context; neither a boundary nor CSP creates a sandbox.

## Folder structure

```text
apps/
  ecosystem/                 # Host, NUCLEUS and IMMUNE SYSTEM
  parasite/                  # Products owner
  symbiont/                  # Cart owner
  commensal/                 # Profile owner
  mutant/                    # Offers owner
packages/
  mycelium/                  # Event contracts, validation and durable transport
  shared-ui/                 # MUI/Emotion theme and presentation components
  shared-types/              # Genuine shared contracts
  mock-utils/                # Domain-free MSW/HTTP helpers
  config/                    # Shared tooling and federation policy
deployment/
  registry/                  # Development presets and explicit production templates
  scripts/                   # Verified publication, promotion and rollback tooling
  security/                  # CSP rollout guidance
e2e/                         # Real built-app Playwright tests and local-only fixture
.github/workflows/           # Five app pipelines, reusable build, registry and integration jobs
docs/                        # Architecture, procedures, decisions and acceptance evidence
playwright.config.ts
pnpm-workspace.yaml
package.json
pnpm-lock.yaml
tsconfig.base.json
```

Each application has its own package.json, Vite configuration, source, entry, dev/build/test commands and deployment workflow. Shared packages export source consumed by Vite; their build validates TypeScript.

## Verify

```sh
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm exec playwright install chromium
pnpm exec playwright test
```

Stop dev/preview processes before Playwright: it owns ports 5000–5004 plus test-only readiness port 5005 and builds actual artifacts itself. Linux CI needs `pnpm exec playwright install --with-deps chromium`. Reports/traces and local release evidence are ignored by Git. The suite covers Product→Cart, coupon confirmation/removal, Profile persistence/ownership, unavailable/incompatible remotes, validated registry fallback, loading/empty/error states, standalone/phone/keyboard checks and local no-Host-rebuild publication/rollback. See [development](docs/development.md) for prerequisites and all commands.

Use `pnpm --filter @microverse/parasite dev` or build/test/typecheck/preview for one app. `pnpm --filter '@microverse/symbiont...' build` includes its required workspace dependencies. `pnpm format:check` checks formatting. Frontend .env files are ignored; VITE_* values are public and must never contain credentials.

## Independent deployment and rollback

Netlify pipelines independently verify/build each target, publish immutable version directories while retaining earlier releases, verify actual bytes and confirm publication. Remote deployment does not automatically activate an unverified registry entry. A separate protected NUCLEUS workflow validates selected assets and candidate/published browser loading against the existing Host, archives prior snapshots and supports rollback. Version promotion changes registry data without rebuilding/redeploying the Host; origin-policy changes require a reviewed Host policy deployment.

Configure actual site IDs/origins and GitHub environment secrets before live use. The checked-in production .example presets are explicitly illustrative. Current automation requires six canonical Netlify targets in one team; no live sites, secrets or deployment success are invented. Follow [deployment and rollback](docs/deployment.md), including the pending live Symbiont demonstration.

## Documentation

- [Architecture and responsibility boundaries](docs/architecture.md)
- [Module Federation loading flow](docs/module-federation.md)
- [MYCELIUM contracts, delivery and cleanup](docs/communication.md)
- [Runtime remote registry](docs/nucleus.md)
- [Resilience, monitoring and security](docs/resilience.md)
- [Design system](docs/design-system.md) and [mock APIs](docs/mock-apis.md)
- [Development and testing](docs/development.md)
- [Deployment and rollback](docs/deployment.md)
- [Final acceptance and limitations](docs/acceptance.md)
- [Actual milestones, commit hashes and push evidence](docs/IMPLEMENTATION_PROGRESS.md)
- [Architecture decisions](docs/decisions/)

The five requested Mermaid diagrams live in architecture, federation, communication, deployment and resilience documentation. Real authentication, account-backed storage, payments, notification delivery, translations, cross-tab/cross-origin business synchronization and continuous health monitoring are not implemented. The Host shared-MUI chunk-size advisory remains an optimization opportunity. Coupon fixtures are valid through 2027-12-31 UTC; tests use deterministic time for eligibility checks.
