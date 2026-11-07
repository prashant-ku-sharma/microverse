# MICROVERSE

A biology-inspired microfrontend ecosystem, built incrementally. **Stage 2 adds the Ecosystem Host shell and shared MUI design system.** Business behavior, remote loading, and cross-application communication remain deferred.

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

Each application has its own entry point, HTML, package manifest, Vite config, TypeScript project, tests, and build output. Shared packages expose TypeScript source consumed by Vite and are private workspace packages, not published artifacts. Their build command validates their source; it does not emit a distribution. `shared-ui` exports a custom dark MUI theme, tokens, and reusable presentation components. `config` provides common Vite and test configuration; the other packages intentionally have empty exports.

## Environment conventions

Copy an application's `.env.example` to `.env.local` inside that application if overrides are needed. `VITE_APP_LABEL` is an optional public display label. In Ecosystem it overrides the sidebar brand (default MICROVERSE); in standalone organism apps it overrides the identifying heading. Vite reads application-local environment files at startup, so restart after edits.

Only `VITE_*` variables are exposed to browser code. They are **public build-time values**, never credentials. Local environment files are ignored; examples are committed. Ports belong in Vite configuration, not environment files. Runtime remote registry configuration will be designed in its own stage; `.env` changes are not a runtime federation mechanism.

## Boundaries and next work

Apps never import another app's code. Business state will remain in its owning remote. Future communication will use typed, validated Mycelium events with reconciliation where consumers can be absent. Federation, authentication simulation, business state, API mocks, resilience, Playwright, CI, and deployment workflows are deferred to their requested stages. Stage 1 builds can be served individually, but independent deployment pipelines are not implemented yet.

Ecosystem provides `/`, `/products`, `/cart`, `/profile`, `/offers`, and `/ecosystem`. Organism routes are Host-owned placeholders. The dashboard's status and activity panels do not report live data. See the [design system](docs/design-system.md) for reusable exports and responsive conventions. Future production hosting must provide an index.html fallback for deep links.

See [architecture](docs/architecture.md), [foundation ADR](docs/decisions/0001-workspace-foundation.md), and [implementation progress](docs/IMPLEMENTATION_PROGRESS.md).
