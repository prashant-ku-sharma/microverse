# MICROVERSE

A biology-inspired microfrontend ecosystem, built incrementally. **Stage 6 connects PARASITE, SYMBIONT, and the Host cart count through MYCELIUM typed events.** Product adds are persisted before delivery; the independently federated cart service owns reconciliation and state. Both remotes continue to run standalone.

## Prerequisites

- Node.js 24 LTS (see `.node-version`).
- pnpm 11.25.0 (`packageManager` pins the toolchain).

Install pnpm using the [official installation instructions](https://pnpm.io/installation) if needed. Run every command below from this repository root.

```sh
pnpm install
pnpm dev
```

`pnpm dev` runs all five Vite servers concurrently. Ports are strict: an occupied port produces an error instead of silently changing the application URL.

| Application | Identity        | URL                   | Future responsibility      |
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

Each application has its own entry point, HTML, package manifest, Vite config, TypeScript project, tests, and build output. Shared packages expose TypeScript source consumed by Vite and are private workspace packages, not published artifacts. Their build command validates their source; it does not emit a distribution. `shared-ui` exports a custom dark MUI theme, tokens, and reusable presentation components. `config` provides common Vite and test configuration; `shared-types` exports Product and remote presentation contracts; MYCELIUM exports typed/validated CustomEvent transport and an opaque durable inbox; mock-utils still has empty exports.

## Environment conventions

Copy an application's `.env.example` to `.env.local` inside that application if overrides are needed. `VITE_APP_LABEL` is an optional public display label. In Ecosystem it overrides the sidebar brand (default MICROVERSE); in PARASITE it overrides the storefront brand; in SYMBIONT it overrides the standalone header; in the other organisms it overrides the identifying heading. Vite reads application-local environment files at startup, so restart after edits.

Only `VITE_*` variables are exposed to browser code. They are **public build-time values**, never credentials. Local environment files are ignored; examples are committed. Ports belong in Vite configuration, not environment files. Runtime remote registry configuration will be designed in its own stage; `.env` changes are not a runtime federation mechanism.

## Boundaries and next work

Apps never import another app's code. Product data and discovery rules live in PARASITE. Cart state, totals, and simulated checkout live in SYMBIONT; other business state will remain in its owning remote. MYCELIUM carries typed, validated product/cart events, with a persisted inbox and SYMBIONT-owned reconciliation when its consumer is absent. Additional remote integrations, authentication simulation, profile/offer business features, API mocks, resilience, Playwright, CI, and deployment workflows are deferred to their requested stages. Stage 1 builds can be served individually, but independent deployment pipelines are not implemented yet.

Ecosystem provides `/`, `/products`, `/cart`, `/profile`, `/offers`, and `/ecosystem`. Products dynamically loads PARASITE and Cart loads SYMBIONT. Profile and Offers remain Host-owned placeholders. The cart count observes live MYCELIUM facts; the dashboard's configuration and activity panels remain explicit placeholders. See the [design system](docs/design-system.md) for reusable exports and responsive conventions. Future production hosting must provide an index.html fallback for deep links.

PARASITE runs independently on port 5001 with 12 local mock products, search, category/stock filters, sorting, detail pages, prices, ratings, and stock handling. Add to Cart publishes a durable MYCELIUM request; SYMBIONT decides cart quantities and stock handling. The Host products route consumes the `parasite/routes` expose at runtime. See [PARASITE development and architecture](docs/parasite.md).

SYMBIONT provides quantity updates, removals, empty state, integer-paise totals, a local 10% sample discount, and checkout simulation with an order receipt. A fresh cart starts empty; sample loading remains explicit. In the Host it consumes product requests and persists its cart across route navigation/reload in this browser tab. Standalone ports keep separate sessions. See [SYMBIONT ownership and verification](docs/symbiont.md).

See [architecture](docs/architecture.md), [foundation ADR](docs/decisions/0001-workspace-foundation.md), and [implementation progress](docs/IMPLEMENTATION_PROGRESS.md).

## Federation quick start

Start `pnpm --filter @microverse/parasite dev` on 5001, `pnpm --filter @microverse/symbiont dev` on 5002, and `pnpm --filter @microverse/ecosystem dev` on 5000, or use `pnpm dev` for all apps. Open `http://127.0.0.1:5000/products` or `http://127.0.0.1:5000/cart`. Stopping either remote and reloading its Host route shows an isolated failure view while other Host routes remain usable. Already-loaded code may remain cached until a fresh request.

See [Module Federation configuration, loading flow, and outage demonstration](docs/module-federation.md). No runtime remote registry is implemented. The entry URL overrides in Ecosystem's `.env.example` are build-time configuration.

## Event-driven demonstration

Open Products in the Host and add products before opening Cart: its count updates from SYMBIONT's background service. Navigate to Cart and reload; items remain. Stop SYMBIONT, reload Products, and save another add request. Restart SYMBIONT and reload the Host: its persisted inbox reconciles the request once. Communication is scoped to this Host origin/tab; standalone ports do not share a cart. See [event contracts, APIs, durability, and lifetime](docs/communication.md).
