# Architecture

## Current implementation: Stage 3

MICROVERSE contains five independent React/Vite applications in a pnpm workspace. Ecosystem now owns a responsive shell and six React Router routes. PARASITE now owns a functional standalone product catalog and detail routes on port 5001. Symbiont, Commensal, and Mutant remain standalone foundation pages. All apps consume the expanded shared MUI theme; there is still no Host/remote integration or federation library.

| Route        | Host-owned page                                                                           |
| ------------ | ----------------------------------------------------------------------------------------- |
| `/`          | Dashboard, four organism cards, conceptual map, explicit status and activity placeholders |
| `/products`  | Parasite placeholder                                                                      |
| `/cart`      | Symbiont placeholder                                                                      |
| `/profile`   | Commensal placeholder                                                                     |
| `/offers`    | Mutant placeholder                                                                        |
| `/ecosystem` | Host architecture overview                                                                |

The Host owns layout, navigation, route composition, active links, titles, and route-change focus. Unknown routes render a recovery page. Organism metadata is navigation/display configuration only, never shared business state. No app imports another app. The design system is documented in [design-system.md](design-system.md); [ADR 0002](decisions/0002-host-shell-and-design-system.md) records the route/presentation boundary.

## Shared infrastructure

| Package                    | Current export                        | Intended boundary                          |
| -------------------------- | ------------------------------------- | ------------------------------------------ |
| `@microverse/shared-ui`    | `microverseTheme`, tokens, components | MUI visual infrastructure                  |
| `@microverse/config`       | Empty root, `./vite`, `./test-setup`  | Development configuration                  |
| `@microverse/shared-types` | Product interface                     | Genuine cross-app contracts                |
| `@microverse/mycelium`     | Empty module                          | Event infrastructure, never business state |
| `@microverse/mock-utils`   | Empty module                          | Shared mock infrastructure                 |

Source exports keep development simple. Applications bundle shared source into their own build output; no package distribution or publication is needed at this stage. This is build-time infrastructure sharing, not runtime Module Federation.

## Toolchain decisions

- pnpm workspaces and a committed lockfile provide a single dependency graph; a catalog aligns React, MUI, Emotion, and Vite versions.
- Node 24 LTS is the supported runtime. React 19, Vite 8, MUI 9, and Vitest 5 are stable selected releases. TypeScript 5.9 stays within typescript-eslint's supported range; TypeScript 7 is intentionally not selected.
- Strict TypeScript is inherited by every workspace project, with unchecked indexed access and exact optional property checks enabled.
- ESLint flat configuration checks TypeScript, React Hooks, and refresh compatibility. Prettier owns formatting.
- Material UI with Emotion is the styling baseline. The custom dark theme supplies forest surfaces, emerald actions, organism accent colors, typography, spacing, and component defaults. Each standalone app owns its provider and baseline reset.
- Each app uses the same Vite factory but supplies its own strict port, making config consistent without coupling business logic.
- Vitest and React Testing Library check Host navigation/routes/drawer behavior, shared UI/theme semantics, and each standalone app. Shared cleanup prevents DOM leakage.

Official references: [Vite requirements](https://vite.dev/guide/), [MUI installation](https://mui.com/material-ui/getting-started/installation/), [pnpm parallel execution](https://pnpm.io/cli/run#--parallel), and [typescript-eslint dependency support](https://typescript-eslint.io/users/dependency-versions/). Peer dependency compatibility was checked against npm registry metadata during implementation. The selected federation library's official configuration and runtime documentation must be verified when federation is implemented.

## Future architecture (not implemented)

Ecosystem already owns composition and routing. It will later own the runtime registry, simulated authentication, and remote error boundaries. Parasite, Symbiont, Commensal, and Mutant will own products, cart, profile, and offers respectively. Mycelium will carry typed CustomEvent envelopes validated at runtime. Consumer absence will require persistence or reconciliation in the appropriate owner; events are not durable delivery.

Remotes must remain independently runnable and deployable. Runtime federation will use the selected library's supported APIs, configurable remote URLs, aligned shared dependencies, and isolated failure states. A remote deployment must not require a Host rebuild. Deployment automation and the registry are intentionally deferred.

Production static hosting must configure an index.html fallback for BrowserRouter deep links; Vite development already supplies that fallback. No deployment configuration is added in Stage 2.

## PARASITE product ownership

The shared Product interface is a contract only. PARASITE owns its synchronous mock inventory, local product illustrations, search/category/stock filters, sorting, price formatting, detail presentation, and availability rules. Its own BrowserRouter stores discovery choices in URL parameters; local lazy-loaded route chunks are ordinary static application assets.

The Host's `/products` page remains a placeholder. PARASITE is reached independently at `http://127.0.0.1:5001/`, with details at `/products/:productId`. Add to Cart currently acknowledges intent without state mutation or events. There are no cross-app imports or shared business stores. See [PARASITE documentation](parasite.md) and [ADR 0003](decisions/0003-parasite-product-ownership.md).
