# Module Federation: four independent remotes

Stages 4–7 integrate PARASITE, SYMBIONT, COMMENSAL, and MUTANT into ECOSYSTEM through genuine runtime Module Federation. The apps remain separate builds and servers. The Host has no remote source imports and does not bundle remote business fixtures.

## Selected implementation and verified references

Selected `@module-federation/vite` 1.23.11 with its matching `@module-federation/runtime` 2.9.3. The plugin's published peer range includes Vite 8, used by this workspace. Official documentation and installed API/types were reviewed on 2026-11-08 before configuration and runtime integration:

- [Official Vite integration](https://module-federation.io/integrations/build-tool/vite): plugin, expose, ESM remote, development origin, and shared configuration.
- [Runtime APIs](https://module-federation.io/guide/runtime/runtime-api): registerRemotes and loadRemote, including remote name/expose syntax.
- [Shared dependency options](https://module-federation.io/configure/shared): singleton, version requirements, subpaths, and pnpm suffix matching.
- [Share strategy](https://module-federation.io/configure/shareStrategy.html): loaded-first defers remote loading; version-first may contact offline remotes during Host initialization.
- [Maintainer Vite README](https://github.com/module-federation/vite): browser runtime package and build behavior.

## Build configuration

`apps/parasite/vite.config.ts` names the remote `parasite`, emits `remoteEntry.js`, and exposes `./routes` from `src/routes.tsx`. Its server origin is `http://127.0.0.1:5001`; development and preview CORS allow the Host origin `http://127.0.0.1:5000`.

`apps/ecosystem/vite.config.ts` names the consumer `ecosystem`, declares the ESM `parasite` remote, and uses the same share configuration. The development entry defaults to `http://127.0.0.1:5001/remoteEntry.js`. `VITE_PARASITE_REMOTE_ENTRY` can override it at build/dev startup; changing this variable requires restarting/rebuilding the Host. It is **not** a runtime registry. Nucleus is not implemented.

Both use `shareStrategy: 'loaded-first'`. Framework dependencies can initialize from the Host without contacting PARASITE. Both keep local shared fallbacks, preserving standalone execution. Automatic remote declaration downloads are disabled with `dts: false`; Host builds and unit tests do not need a running remote.

Source unit tests use Vite's test mode without the federation build transform. Unit tests mock only the Host runtime adapter; actual dev and production browser checks verify the real federation boundary.

## Dependency policy

`packages/config/src/federation.ts` supplies identical share rules for all three federated builds:

| Shared module                        | Installed version / rule                        |
| ------------------------------------ | ----------------------------------------------- |
| React and JSX runtime subpaths       | 19.3.1, singleton                               |
| React DOM and client subpath         | 19.3.1, singleton                               |
| React Router                         | 8.5.1, singleton; preserves Host router context |
| MUI material and styles entry points | 9.5.0, singleton; preserves Host theme context  |
| Emotion React                        | 11.14.0, singleton                              |
| Emotion styled                       | 11.14.1, singleton                              |

Each share declares a version, a compatible required range, and `allowNodeModulesSuffixMatch` for pnpm/workspace package resolution. The dependency catalog aligns the applications. Babel runtime 8.1.0 is an explicit dependency in all three federated applications to make the plugin's fallback selection unambiguous. This does not override Emotion's own nested Babel 7 dependency.

The Host's full shared MUI provider currently produces a chunk above Vite's 500 kB warning threshold (about 567 kB minified, 164 kB gzip). This is a non-blocking size advisory, not a failed build; no warning limit was raised. Further shared-library payload optimization is deferred.

## Exposed module contract and routing

`parasite/routes` exports a default React component accepting the shared `ParasiteRoutesProps` contract. It does not mount a DOM root or create a BrowserRouter/ThemeProvider.

- `mode="embedded"`: renders beneath Host route `/products/*`. Catalog is `/products`; product details are `/products/:productId`. The Host owns its shell, browser router, theme, titles, and focus.
- Default standalone mode: the existing PARASITE entry owns its BrowserRouter, theme, header, main, and footer. Catalog remains `/`; details remain `/products/:productId`.

PARASITE owns both views' products, filters, sorting, details, availability, and cart-intent feedback. Its local navigation context carries only the catalog return path, never business state. Catalog and detail links preserve URL query parameters. Product images resolve against the remote module URL, so embedded views fetch images from port 5001 instead of the Host. Product card columns use available container width to fit inside the Host shell.

## Runtime loading flow

1. The federation plugin initializes ECOSYSTEM's runtime and shared providers before application bootstrap. No PARASITE entry is needed for the overview.
2. Navigation to `/products/*` mounts the Host-owned `RemoteProducts` boundary and Suspense fallback.
3. The Host adapter explicitly calls `registerRemotes` with the configured ESM entry, then `loadRemote('parasite/routes')`. This registration is essential: the plugin may prune remotes that are requested only through runtime APIs rather than static remote imports.
4. The runtime requests PARASITE's remote entry and chunks from port 5001, negotiates shared dependencies, and resolves the expose's module namespace.
5. The adapter validates the default component and returns it to React.lazy. The Host passes embedded mode; PARASITE consumes the existing router and theme contexts.
6. Rejected loads, invalid modules, a 12-second stalled-load timeout, and remote render/chunk failures reach the route error boundary. The sidebar/header and other Host routes remain outside that boundary.

No ordinary local import stands in for a remote. No createInstance/init call invents a separate Host sharing scope. No JSON registry is fetched.

## Failure and caching behavior

The fallback reads Products are resting, provides Back to overview, and offers a full-page reload after the remote recovers. A full reload is intentional: native ESM and federation caches can retain prior imports or failures. The timeout bounds the displayed loading state; it does not cancel an underlying network import.

Stopping a server does not invalidate JavaScript already loaded into a browser. An existing catalog/detail view may keep working until it needs another remote resource. This is not a live health monitor. A fresh page load at Products demonstrates an unavailable entry, while a fresh overview still boots independently. The dashboard labels federation configuration, not observed availability.

Deploying a changed PARASITE at the same entry URL does not require a Host rebuild. In verification, PARASITE was rebuilt and reloaded into an already-built Host. The current root entry URL and CORS policy target local development; production hosting, immutable release directories/cache policy, and runtime registry selection await their stages. Generated JS chunks already have content hashes.

## Reproduce the requested demonstration

Start each app in its own terminal:

```sh
pnpm --filter @microverse/parasite dev
pnpm --filter @microverse/ecosystem dev
```

Open `http://127.0.0.1:5000/`, choose Products, search for moss, and open its details. Confirm that the URL stays on port 5000, the Host sidebar stays visible, and product images come from port 5001. PARASITE's standalone collection remains available at `http://127.0.0.1:5001/`.

Stop only the PARASITE terminal with Ctrl-C. The loaded screen may remain cached. Reload Products to force a fresh remote request: the contained fallback appears. Navigate to Cart/Profile/Overview; the Host remains usable. A fresh overview loads with PARASITE offline. Restart PARASITE and use Reload page to make a fresh attempt.

For production verification, stop dev servers, build each app independently (or run `pnpm build`), then run the two filtered `preview` commands on the same ports. Both build outputs have been checked together, including direct detail URLs, standalone PARASITE, and Host startup with the remote stopped. Builds also succeeded with PARASITE's dev server stopped. Static hosting requires SPA fallbacks on both sites and remote CORS allowing the Host.

## Checks

`pnpm test` covers the loader's actual API call contract, bad exports, rejection, timeout cleanup, loading UI, embedded props, load/render failure containment, Host navigation after failure, embedded detail routing, query preservation, and standalone regressions. Browser verification supplements these source tests; mocked loader tests alone are not federation evidence.

## Stage 5: SYMBIONT

The official Vite integration, runtime API, and share-strategy documentation above was rechecked on 2026-11-09. The selected plugin/runtime versions and singleton policy are unchanged.

SYMBIONT uses the same provider configuration at port 5002, names its container symbiont, and exposes ./routes from src/routes.tsx. ECOSYSTEM registers its ESM entry with registerRemotes and calls loadRemote('symbiont/routes') lazily at /cart. VITE_SYMBIONT_REMOTE_ENTRY defaults to http://127.0.0.1:5002/remoteEntry.js and is a build/dev-start override. Dev/preview CORS allows Host origin 5000.

RemoteBoundary is now reusable Host infrastructure. Products and Cart each mount their own boundary, loading indicator, module validation, and 12-second timeout. A rejected Cart load shows Your cart is resting while other Host routes remain usable. The reload/cache behavior described above applies to both remotes.

The cart expose accepts embedded mode and uses Host MUI/Emotion contexts. It needs no nested router: checkout and confirmation are local workflow state. Its standalone entry still supplies its own root, theme, header, and main. Cart state and images remain remote-owned; the Host contains no fixture imports. See [SYMBIONT documentation](symbiont.md) for business rules and reproduction commands.

## Stage 6: background cart lifetime

SYMBIONT additionally exposes ./cart-service from src/cart-entry.ts, a facade that exports only startCartService from its private cart-service module. Its named startCartService export returns a lifetime cleanup function; it exposes no cart state/mutation API to the Host. The Host uses the supported registerRemotes/loadRemote APIs for symbiont/cart-service, validates the module, bounds loading, and catches failures independently of the shell. Official runtime APIs were rechecked for this integration.

loaded-first still prevents plugin-driven eager initialization of all remotes. The Host now deliberately requests the small cart service asynchronously after mounting its MYCELIUM listeners; overview/Products remain usable when SYMBIONT is offline. The count stays unknown until a validated committed fact arrives. Cart UI and the service share the same independently built remote module instance.

MYCELIUM need not be a federation JavaScript singleton: compatible contracts communicate through native CustomEvents and an origin/tab inbox. It contains no cart business state. See [event flow, persistence, and cleanup](communication.md).

## Stage 7: Profile and Offers

Official [Vite configuration](https://module-federation.io/integrations/build-tool/vite) and [runtime APIs](https://module-federation.io/guide/runtime/runtime-api) were rechecked on 2026-11-10. Existing plugin/runtime versions and common singleton policy are retained. COMMENSAL (5003) exposes `./routes`; MUTANT (5004) exposes `./routes` and `./offers-service`. Each standalone owns createRoot/ThemeProvider/CssBaseline. Embedded entries consume Host layout/theme without nesting a shell, root, or router.

The Host explicitly calls registerRemotes/loadRemote for `commensal/routes`, `mutant/routes`, and `mutant/offers-service`. Route wrappers use React.lazy, Suspense, module validation, a 12-second timeout, and separate RemoteBoundary instances. The offers facade exposes only startOffersService → cleanup. Its asynchronous connection cannot crash or block the Host; a service failure is logged, and the Offers route has its own visible loading/failure state. Dev/preview CORS allows port 5000. Common React/React DOM/router/MUI/Emotion and Babel fallback versions stay aligned.

Entry defaults are `http://127.0.0.1:5003/remoteEntry.js` and `http://127.0.0.1:5004/remoteEntry.js`. `VITE_COMMENSAL_REMOTE_ENTRY` / `VITE_MUTANT_REMOTE_ENTRY` are public build/start overrides, not Nucleus. Start all five with pnpm dev, or each filtered dev command independently. Build with pnpm build and use each app's preview command after stopping dev.

For outage verification, stop COMMENSAL, reload /profile, and navigate to Cart; then restart it. Stop MUTANT, reload /cart, and visit /offers: Cart remains usable without a persisted monetary quote, while Offers shows a contained failure. Profile still loads. Restart MUTANT and reload to clear cached imports; its saved code reconciles against the current cart. Already-loaded modules can remain usable after a server stops; a fresh document is necessary to test entry failure. No live health polling or runtime registry is implied.

## Stage 8 data layer

Each exposed route now provides its own matching QueryClientProvider/cache. MSW worker registration is joined through transport-only mock-utils infrastructure per window; the Host has no domain handler imports. All five public roots serve the identical generated worker script. Framework sharing and existing runtime exposes are unchanged. See [mock APIs](mock-apis.md) for contracts, fault scenarios and verification.
