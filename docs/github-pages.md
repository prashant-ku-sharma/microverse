# GitHub Pages hosting

The public site is [MICROVERSE](https://prashant-ku-sharma.github.io/microverse/). GitHub Pages is enabled with GitHub Actions as its publishing source. The workflow is `.github/workflows/deploy-pages.yml`.

## Build and publish

Every relevant push to `main` builds all five applications separately, runs lint/type checks/unit tests and verifies the Pages artifact in Chromium before publication. The official configure-pages, upload-pages-artifact and deploy-pages actions publish the artifact using the repository's short-lived token; no deployment credential is committed.

```sh
pnpm install --frozen-lockfile
pnpm build:pages https://prashant-ku-sharma.github.io/microverse/ 1.100.1
PAGES_VERSION=1.100.1 pnpm exec playwright test --config e2e/pages.config.ts
```

Install Chromium first with `pnpm exec playwright install chromium`. The local smoke server changes only its served registry to an explicit loopback development policy; the generated production files remain HTTPS-only. To test the actual published site, set `PAGES_URL=https://prashant-ku-sharma.github.io/microverse/` when running that same smoke command. These tests use a fresh browser context and modify only its local mock data.

The artifact is `deployment/.local/pages-VERSION/`. The Host is at its root. Each real remote is at `remotes/NAME/releases/VERSION/`, including a standalone index and `remoteEntry.js`. The workflow derives unique versions from its run number and attempt. Do not reuse release versions. Production NUCLEUS configuration allows only the site's exact origin and each remote's specific base path, followed by its versioned release path. Configuration requests resolve beneath `/microverse/`.

## Static hosting behavior

Pages has no SPA rewrite configuration, so this deployment selects HashRouter: `/microverse/#/products`, `#/cart`, `#/profile`, `#/offers`, and `#/ecosystem` survive refresh. Local development and existing Netlify builds retain BrowserRouter. The shared mock worker is served at `/microverse/mockServiceWorker.js`, controlling the Host and standalone remote documents. `VITE_ROUTER_MODE=hash` and `VITE_MOCK_WORKER_URL` are public build settings, never secrets.

Read the live `nucleus/remotes.json` for the current version and standalone URLs (replace the final `remoteEntry.js` with an empty suffix). Do not hardcode a workflow version in bookmarks.

## Deployment scope and limits

This Pages site is a cohosted demonstration: the Host and four independently built federation remotes are published in one atomic site artifact. Federation still uses actual runtime registration, metadata checks, remote imports and per-remote boundaries. Business ownership and event communication are unchanged. Since all standalone applications now share an origin, their owner-namespaced local mock persistence can also be shared within the same tab.

This workflow rebuilds the complete Pages artifact on changes. It does not claim independently promoted remote deployments, retained historical releases, registry-only rollback, or immutable HTTP cache headers on Pages. The existing independent Netlify pipelines and protected NUCLEUS promotion/rollback mechanism remain available for those requirements; live Netlify deployment remains unconfigured. To revert this demo, revert the relevant source change normally and let Pages publish a new version. Do not rewrite Git history.

Pages cannot apply the existing Netlify `_headers` or proxy configuration. Federated code executes with Host privileges; origin/path allowlisting is not a sandbox. GitHub controls response headers and caching. Use the documented independent hosting configuration when strict HTTP CSP headers or independently retained releases are required. All API responses and checkout operations here are MSW simulations, not a real backend or payment system.

Official references: [Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Verified publication

On 2026-11-15, [workflow 43701123205](https://github.com/prashant-ku-sharma/microverse/actions/runs/43701123205) published commit `b9aa176cadf6a85bcb911ce85a51472daa68d029` successfully. The live registry confirmed all four remotes at 1.2.1. Both live Chromium checks passed (32.9s), including shopping/coupon/profile flows, artwork, keyboard skip navigation, hash refresh and standalone entries. See implementation progress for the complete receipt.

## Habitat navigation feedback

Habitat navigation displays a shared full-page MUI loading overlay while remote code or initial page data is pending. Its compact spinner and phase label sit over a light 14% charcoal tint, leaving the application visible without blur or a large branded interruption. It announces the current loading phase, traps keyboard focus, locks document scrolling and blocks duplicate interactions until the destination is ready. Existing error boundaries replace the overlay on remote failure. Inline monitoring indicators and background refreshes remain inline.

The Host and standalone Products router explicitly use React Router's supported `useTransitions={false}` option. Otherwise, its default transition retains the previous page while a remote suspends and can suppress visible navigation feedback. This choice makes the existing Suspense fallbacks commit immediately; it does not reduce download time or add an artificial minimum delay. See the [React Router transition documentation](https://reactrouter.com/explanation/react-transitions).
