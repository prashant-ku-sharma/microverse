# PARASITE products application

Stage 3 turns PARASITE into a functional standalone product-discovery application. It runs at `http://127.0.0.1:5001` with no Host or other organism running. Stage 4 also exposes the same product behavior to ECOSYSTEM at `/products/*` through Module Federation.

## Run and verify

From the workspace root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @microverse/parasite dev
pnpm --filter @microverse/parasite test
pnpm --filter @microverse/parasite typecheck
pnpm --filter @microverse/parasite build
```

Stop the development server before `pnpm --filter @microverse/parasite preview`; preview also uses strict port 5001. The production artifact is `apps/parasite/dist/`, including all local illustrations. For a standalone deployment, serve this directory with an index.html fallback for browser-history routes. Deployment workflows remain deferred.

## Features and routes

- `/`: all 12 local products with images, categories, INR prices, ratings, availability, and Add to Cart controls.
- `/products/:productId`: product description, larger illustration, features, materials, rating, sample inventory, and cart-intent control.
- Unknown product IDs and routes offer a link back to the collection.
- Standalone header navigation links to the full collection and category shortcuts; no navigation depends on the Host being available.
- Search matches names, descriptions, and categories case-insensitively, ignoring surrounding whitespace.
- Category, in-stock-only, and search filters combine. Sort by featured order, price ascending/descending, highest rating, or name. Sorting never mutates source inventory; ties are resolved by name then ID.
- Empty results include a reset action. The current result count is announced through a polite status region.

The URL stores `q`, `category`, `sort`, and `stock=available`. Unsupported categories and sort values fall back to the default view. Search keystrokes replace history entries; other filter choices create navigable entries. Product-card and featured-product links carry the current query, so the Back to collection link restores the discovery view. Browser Back also works. No localStorage or shared global store is used.

Examples:

```text
/?category=Grow+kits&stock=available&sort=price-desc
/products/moss-planter?category=Workspace&q=moss
```

## Data and ownership

`packages/shared-types` exports the readonly `Product` interface. Its fields describe identity, name, description, price, image, category, rating, stock, material, and features. Prices are major currency units. PARASITE currently displays whole-rupee mock prices in INR; this is a catalog convention, not a currency conversion service.

`apps/parasite/src/data/products.ts` owns the fixtures. `catalog.ts` owns filtering, sorting, URL interpretation, availability labels, and INR formatting. The twelve bundled SVG illustrations are authored local assets, not external image requests or product photographs. Ratings and stock are sample data, not live reviews or inventory.

No product data or product business rules were placed in shared-ui, mock-utils, config, or Mycelium. No application imports another application's source. React Router is declared in PARASITE's own manifest, and its own BrowserRouter wraps its own entry point. The shared MUI/Emotion theme remains in use.

Catalog and detail pages use ordinary local React.lazy/Suspense imports with the shared LoadingIndicator. This splits the static build into smaller route bundles; it is not runtime Module Federation. Stage 4 adds a separate federation entry for Host consumption; local route splitting is still ordinary in-app code splitting. No runtime registry is implemented.

## Stock and Add to Cart semantics

Zero stock displays Out of stock and disables Add to Cart on both cards and details. One to three units display a low-stock label. Higher stock displays In stock. Stock is a static non-negative integer fixture.

Clicking an available product's Add to Cart button acknowledges intent with a dismissible information message: cart connection will arrive in a later stage, and no item has been added. It does not decrement stock, create a local cart, persist intent, publish CustomEvents, or communicate with Symbiont. This keeps Stage 3 truthful and within scope. Real cart delivery and reconciliation will be designed with Mycelium in a later stage.

## Verification coverage

Vitest/React Testing Library cover product listings, prices and ratings, search and no-results reset, combined category/stock filters, all sorting choices, detail rendering, query restoration through both card and feature links, standalone navigation, low/out-of-stock handling, honest cart feedback, missing products/routes, and public brand override. Pure rule tests also check stable sorting, unknown URL values, fixture integrity, and local asset paths.

Browser QA verifies standalone development and production preview, local image rendering, discovery/detail journeys, and responsive widths. `pnpm test`, `pnpm build`, `pnpm lint`, and `pnpm typecheck` continue to check the wider workspace.

Official API references checked for this implementation: [React Router URL values](https://reactrouter.com/start/declarative/url-values), [useSearchParams](https://reactrouter.com/api/hooks/useSearchParams), and [MUI read-only ratings](https://mui.com/material-ui/react-rating/).

## Stage 4 embedded entry

`src/routes.tsx` is exposed as `./routes`; `src/App.tsx` remains the standalone wrapper. The exposed component accepts the shared ParasiteRoutesProps contract, defaulting to standalone mode. Embedded mode uses the Host router/theme and renders a region rather than a second main/header/footer. Its catalog return path is `/products`; the standalone path remains `/`. Filters and queries survive detail navigation in both modes.

Product asset URLs are resolved against the remote module URL. The Host does not serve or bundle the fixture images. Card columns use available container width to remain usable within a sidebar shell. Products and cart-intent logic remain entirely in PARASITE. See [federation documentation](module-federation.md) for shared dependencies, runtime calls, startup order, and failure verification.
