# MICROVERSE

A biology-inspired microfrontend ecosystem, built incrementally. **Stage 9 adds NUCLEUS runtime configuration.** The Host fetches a trusted-origin policy and validated registry, then registers/loads all four independent remotes through real Module Federation. Reload selects new remote URLs and release versions without rebuilding the Host. Owner-local MSW APIs, Query caches and MYCELIUM communication remain intact.

## Prerequisites

- Node.js 24 LTS (see `.node-version`).
- pnpm 11.25.0 (`packageManager` pins the toolchain).

Install pnpm using the [official installation instructions](https://pnpm.io/installation) if needed. Run every command below from this repository root.

```sh
pnpm install
pnpm dev
```

`pnpm dev` runs all five Vite servers concurrently. Ports are strict: an occupied port produces an error instead of silently changing the application URL.

| Application | Identity        | URL                   | Responsibility             |
| ----------- | --------------- | --------------------- | -------------------------- |
| Ecosystem   | Host            | http://127.0.0.1:5000 | Composition and navigation |
| Parasite    | Products remote | http://127.0.0.1:5001 | Product discovery          |
| Symbiont    | Cart remote     | http://127.0.0.1:5002 | Cart and checkout          |
| Commensal   | Profile remote  | http://127.0.0.1:5003 | User profile               |
| Mutant      | Offers remote   | http://127.0.0.1:5004 | Coupons and promotions     |

Use `pnpm --filter @microverse/parasite dev` for a single application. The same filter supports `build`, `preview`, `lint`, `typecheck`, `test`, and `test:watch` for each application. To preview a production build, stop that application's development server first; preview uses its assigned port too.

## Workspace commands

```sh
pnpm build         # Type-check packages; build all five apps into their own dist/
pnpm lint          # ESLint across the workspace, no warnings allowed
pnpm typecheck     # Strict TypeScript across apps and packages
pnpm test          # Shared UI + all five app suites (Vitest / React Testing Library)
pnpm format:check  # Verify Prettier formatting
pnpm format        # Apply formatting
```

Commit `pnpm-lock.yaml`; use `pnpm install --frozen-lockfile` for reproducible installation. Stable versions are aligned through the workspace catalog. Dependency changes belong in the catalog and lockfile together.

## Layout

```text
apps/{ecosystem,parasite,symbiont,commensal,mutant}
packages/{mycelium,shared-ui,shared-types,mock-utils,config}
docs/architecture.md
docs/decisions/0001-workspace-foundation.md
docs/IMPLEMENTATION_PROGRESS.md
```

Each application has its own entry point, HTML, package manifest, Vite config, TypeScript project, tests, and build output. Shared packages expose TypeScript source consumed by Vite and are private workspace packages, not published artifacts. Their build command validates their source; it does not emit a distribution. `shared-ui` exports a custom dark MUI theme, tokens, and reusable presentation components. `config` provides common Vite and test configuration; `shared-types` exports Product and remote presentation contracts; MYCELIUM exports typed/validated CustomEvent transport and an opaque durable inbox; mock-utils provides transport-only MSW bootstrap, JSON/error handling, latency and fault scenarios.

## Environment conventions

Copy an application's `.env.example` to `.env.local` inside that application if overrides are needed. `VITE_APP_LABEL` is an optional public display label. In Ecosystem it overrides the sidebar brand (default MICROVERSE); in PARASITE it overrides the storefront brand; in SYMBIONT it overrides the standalone header; in COMMENSAL/MUTANT it overrides the standalone header. Vite reads application-local environment files at startup, so restart after edits.

Only `VITE_*` variables are exposed to browser code. They are **public build-time values**, never credentials. Local environment files are ignored; examples are committed. Ports belong in Vite configuration, not environment files. NUCLEUS reads `/nucleus/config.json` and its selected registry at runtime. Remote VITE_REMOTE_VERSION identifies each remote build; remote entry URLs no longer come from Host environment variables.

## Boundaries and next work

Apps never import another app's code. Product data and discovery rules live in PARASITE. Cart state, totals, and simulated checkout live in SYMBIONT; profile and offers remain in COMMENSAL and MUTANT respectively. MYCELIUM carries typed, validated product/cart events, with a persisted inbox and SYMBIONT-owned reconciliation when its consumer is absent. Authentication simulation, further resilience, Playwright, CI, and deployment workflows are deferred to their requested stages. Stage 1 builds can be served individually, but independent deployment pipelines are not implemented yet.

Ecosystem provides `/`, `/products`, `/cart`, `/profile`, `/offers`, and `/ecosystem`. Products dynamically loads PARASITE and Cart loads SYMBIONT. Profile and Offers dynamically load COMMENSAL and MUTANT. The cart count observes live MYCELIUM facts; the dashboard's configuration and activity panels remain explicit placeholders. See the [design system](docs/design-system.md) for reusable exports and responsive conventions. Future production hosting must provide an index.html fallback for deep links.

PARASITE runs independently on port 5001 with 12 local mock products, search, category/stock filters, sorting, detail pages, prices, ratings, and stock handling. Add to Cart publishes a durable MYCELIUM request; SYMBIONT decides cart quantities and stock handling. The Host products route consumes the `parasite/routes` expose at runtime. See [PARASITE development and architecture](docs/parasite.md).

SYMBIONT provides quantity updates, removals, empty state, integer-paise totals, MUTANT-confirmed coupon adjustments and ₹99 demo delivery, and checkout simulation with an order receipt. A fresh cart starts empty; sample loading remains explicit. In the Host it consumes product requests and persists its cart across route navigation/reload in this browser tab. Standalone ports keep separate sessions. See [SYMBIONT ownership and verification](docs/symbiont.md).

See [architecture](docs/architecture.md), [foundation ADR](docs/decisions/0001-workspace-foundation.md), and [implementation progress](docs/IMPLEMENTATION_PROGRESS.md).

## Federation quick start

Start `pnpm --filter @microverse/parasite dev` on 5001, `pnpm --filter @microverse/symbiont dev` on 5002, and `pnpm --filter @microverse/ecosystem dev` on 5000, or use `pnpm dev` for all apps. Open `http://127.0.0.1:5000/products` or `http://127.0.0.1:5000/cart`. Stopping either remote and reloading its Host route shows an isolated failure view while other Host routes remain usable. Already-loaded code may remain cached until a fresh request.

See [Module Federation configuration, loading flow, and outage demonstration](docs/module-federation.md). NUCLEUS resolves entries from runtime JSON and checks the remote's exposed release metadata. The former VITE_*_REMOTE_ENTRY overrides are removed. See [runtime configuration and the exact two-version Cart demonstration](docs/nucleus.md).

## Event-driven demonstration

Open Products in the Host and add products before opening Cart: its count updates from SYMBIONT's background service. Navigate to Cart and reload; items remain. Stop SYMBIONT, reload Products, and save another add request. Restart SYMBIONT and reload the Host: its persisted inbox reconciles the request once. Communication is scoped to this Host origin/tab; standalone ports do not share a cart. See [event contracts, APIs, durability, and lifetime](docs/communication.md).

## Profile and offers

Run all apps with `pnpm dev`. Profile supports editable name/email/address and saved user/notification preferences. Offers displays WELCOME10 (10%, ₹1,000 minimum), SAVE20 (20%, ₹3,000 minimum), and FREESHIP (delivery waiver, ₹1,500 minimum). Coupons replace each other; eligibility uses the merchandise subtotal and current mock validity dates. Cart confirms the final quote. Standalone Offers has an explicit estimate form; it does not modify another origin's cart.

See [COMMENSAL profile](docs/commensal.md), [MUTANT offer rules and demonstration](docs/mutant.md), and [ADR 0007](docs/decisions/0007-profile-and-offer-ownership.md). Profile/cart/selection persistence is local to the current origin and tab. No account, notification delivery, backend order, or payment is created.

## Mock API demonstration

MSW is enabled in development and built previews; there is no real backend. Each remote owns its handlers, API client and Query cache. All five sites serve the generated worker script. Profile and cart saves remain local to this browser origin/tab.

Open `/products?mock-products=slow` to see network loading, `/products?mock-products=error` for a retryable 503, `/profile?mock-profile=write-error` to test a failed save without losing the draft, or `/offers?mock-offers=empty` for an empty catalog. Remove the parameter and reload to recover. See [API contracts, ownership, scenarios and verification](docs/mock-apis.md).

## Runtime remote configuration

Development defaults are in apps/ecosystem/public/nucleus; canonical development/production presets are under deployment/registry. Edit/deploy registry JSON and reload to select a changed entry. Each remote exposes release metadata and NUCLEUS verifies version/compatibility before requesting its application. Fallback and feature flags are visible on the Ecosystem page. The production preset uses explicit .example placeholders requiring real controlled HTTPS origins.

The critical Cart 1.0.0 → 1.1.0 test passed against an unchanged Host build. [NUCLEUS documentation](docs/nucleus.md) records the exact commands, mutable registry files, immutable output hash and limitations.
