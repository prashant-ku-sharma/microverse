# Architecture

## Current implementation: Stage 7

MICROVERSE contains five independent React/Vite applications in a pnpm workspace. Ecosystem now owns a responsive shell and six React Router routes. PARASITE now owns a functional standalone product catalog and detail routes on port 5001. SYMBIONT owns a functional standalone cart, persistence/reconciliation service, and checkout simulation on port 5002. COMMENSAL owns an editable profile and preferences on port 5003. MUTANT owns coupon rules and selection on port 5004. All apps consume the expanded shared MUI theme; ECOSYSTEM consumes all four organisms through runtime Module Federation, with shared framework contexts and isolated route failure boundaries.

| Route         | Rendered page                                                                             |
| ------------- | ----------------------------------------------------------------------------------------- |
| `/`           | Dashboard, four organism cards, conceptual map, explicit status and activity placeholders |
| `/products/*` | Federated PARASITE catalog and product detail routes                                      |
| `/cart`       | Federated SYMBIONT cart and checkout simulation                                           |
| `/profile`    | Federated COMMENSAL profile and preferences                                               |
| `/offers`     | Federated MUTANT coupons and eligibility                                                  |
| `/ecosystem`  | Host architecture overview                                                                |

The Host owns layout, navigation, route composition, active links, titles, and route-change focus. Unknown routes render a recovery page. Organism metadata is navigation/display configuration only, never shared business state. No app imports another app. The design system is documented in [design-system.md](design-system.md); [ADR 0002](decisions/0002-host-shell-and-design-system.md) records the route/presentation boundary.

## Shared infrastructure

| Package                    | Current export                                             | Intended boundary                          |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `@microverse/shared-ui`    | `microverseTheme`, tokens, components                      | MUI visual infrastructure                  |
| `@microverse/config`       | Empty root, `./vite`, `./test-setup`, `./federation`       | Development configuration                  |
| `@microverse/shared-types` | Product and exposed-route interfaces                       | Genuine cross-app contracts                |
| `@microverse/mycelium`     | Typed Zod event contracts, transport, durable intent inbox | Event infrastructure, never business state |
| `@microverse/mock-utils`   | Empty module                                               | Shared mock infrastructure                 |

Source exports keep development simple. Applications bundle shared source into their own build output; no package distribution or publication is needed at this stage. This is build-time infrastructure sharing, not runtime Module Federation.

## Toolchain decisions

- pnpm workspaces and a committed lockfile provide a single dependency graph; a catalog aligns React, MUI, Emotion, and Vite versions.
- Node 24 LTS is the supported runtime. React 19, Vite 8, MUI 9, and Vitest 5 are stable selected releases. TypeScript 5.9 stays within typescript-eslint's supported range; TypeScript 7 is intentionally not selected.
- Strict TypeScript is inherited by every workspace project, with unchecked indexed access and exact optional property checks enabled.
- ESLint flat configuration checks TypeScript, React Hooks, and refresh compatibility. Prettier owns formatting.
- Material UI with Emotion is the styling baseline. The custom dark theme supplies forest surfaces, emerald actions, organism accent colors, typography, spacing, and component defaults. Each standalone app owns its provider and baseline reset.
- Each app uses the same Vite factory but supplies its own strict port, making config consistent without coupling business logic.
- Vitest and React Testing Library check Host navigation/routes/drawer behavior, shared UI/theme semantics, and each standalone app. Shared cleanup prevents DOM leakage.

Official references: [Vite requirements](https://vite.dev/guide/), [MUI installation](https://mui.com/material-ui/getting-started/installation/), [pnpm parallel execution](https://pnpm.io/cli/run#--parallel), and [typescript-eslint dependency support](https://typescript-eslint.io/users/dependency-versions/). Peer dependency compatibility was checked against npm registry metadata during implementation. The selected federation library's official configuration and runtime documentation were verified before Stage 4 integration; references are recorded in [module-federation.md](module-federation.md).

## Future architecture (not implemented)

Ecosystem already owns composition and routing. It isolates each of the four remote routes and will later own the runtime registry and simulated authentication. Each organism owns its domain. MYCELIUM already carries versioned product/cart CustomEvent envelopes validated at runtime. Its persisted inbox and SYMBIONT-owned reconciliation handle consumer absence. Offer quotes and separate cart pricing facts support reconciliation; profile data stays private to COMMENSAL.

Remotes must remain independently runnable and deployable. Further remote integrations must retain supported runtime APIs, configurable remote URLs, aligned shared dependencies, and isolated failure states. A remote deployment must not require a Host rebuild. Deployment automation and the registry are intentionally deferred.

Production static hosting must configure an index.html fallback for BrowserRouter deep links; Vite development already supplies that fallback. Deployment hosting is not configured in Stage 7.

## PARASITE product ownership

The shared Product interface is a contract only. PARASITE owns its synchronous mock inventory, local product illustrations, search/category/stock filters, sorting, price formatting, detail presentation, and availability rules. Its own BrowserRouter stores discovery choices in URL parameters; local lazy-loaded route chunks are ordinary static application assets.

The Host's `/products/*` route now consumes `parasite/routes` through the federation runtime. PARASITE is reached independently at `http://127.0.0.1:5001/`, with details at `/products/:productId`. Add to Cart publishes durable product intent through MYCELIUM without changing cart state or product inventory. There are no cross-app imports or shared business stores. See [PARASITE documentation](parasite.md) and [ADR 0003](decisions/0003-parasite-product-ownership.md).

## Runtime federation boundary

The Host's lazy loader explicitly registers the configured ESM remote and calls loadRemote. It has no source imports from any remote. The plugin shares compatible React/React DOM, JSX runtime subpaths, React Router, MUI, and Emotion with identical rules from config. loaded-first keeps the overview independent of remote availability. Embedded components use the Host theme and PARASITE uses its router; standalone entries keep their own providers.

The shared Host boundary, per-remote timeouts, and loading fallbacks isolate all four remote routes separately. No Nucleus/runtime registry or live health monitor is implemented. MYCELIUM carries product/cart/offer business events. See [federation flow and verification](module-federation.md) and [ADR 0004](decisions/0004-first-runtime-federation.md).

## SYMBIONT cart ownership

SYMBIONT owns cart fixtures, models, reducer, quantity/stock rules, integer-paise totals, bounded quote composition, demo delivery, and checkout receipts. Its ./routes entry renders inside /cart without a second root/theme/shell. Standalone keeps its own providers and layout. Its federated headless service owns the persisted cart and deduplication receipts. MYCELIUM carries opaque intent/facts; the Host projects a count. Tab-scoped state survives reload/unmount, separate from PARASITE and the Host. See [SYMBIONT documentation](symbiont.md) and [ADR 0005](decisions/0005-symbiont-cart-ownership.md).

## MYCELIUM communication boundary

The Host requests SYMBIONT's ./cart-service asynchronously after subscribing to cart facts. The shell remains usable if that service is unavailable. Cart UI uses the same remote-owned module instance. Product requests are validated and persisted before CustomEvent dispatch; the owner commits cart + receipt before acknowledgement. No business state or calculations live in MYCELIUM. See [communication architecture](communication.md) and [ADR 0006](decisions/0006-durable-mycelium-delivery.md).

## COMMENSAL and MUTANT ownership

COMMENSAL owns its Zod-validated demo profile, draft/save/cancel workflow, avatar initials, address, and preferences. It writes only its own tab-scoped sessionStorage record. No profile data is published or imported by the Host or another remote. Notification/language selections are saved preferences, not working notification or translation services. See [COMMENSAL](commensal.md).

MUTANT owns catalog, date/minimum rules, percentage/delivery savings, single-coupon selection, and persisted selection. Its `./offers-service` runs independently of the Offers UI; the Host requests its lifecycle asynchronously. It consumes MYCELIUM cart pricing facts and publishes revision-bound, expiring monetary quotes. SYMBIONT accepts a current quote, clamps discounts to subtotal/delivery, and composes the total without knowing any coupon code rules. Separate pricing/request events preserve the original strict CART_UPDATED version-1 payload. Private state is never moved into MYCELIUM. See [MUTANT](mutant.md) and [ADR 0007](decisions/0007-profile-and-offer-ownership.md).
