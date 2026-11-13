# Implementation progress

## Current stage

Stage 10 — IMMUNE SYSTEM remote resilience. Implementation and verification complete on 2026-11-13; actual commit/push receipt follows the implementation commit. Completed stages: 1–10. Stage 11 has not started.

## Completed Stage 1 scope

- Five standalone React + Vite + TypeScript apps with strict development ports 5000–5004.
- Five private shared packages with minimal valid source exports.
- Shared strict TypeScript settings, ESLint, Prettier, MUI/Emotion baseline, and minimal dark theme.
- Root concurrent development command and recursive build/type-check/test commands.
- Application-local environment examples and public-variable conventions.
- Foundation documentation and ADR 0001.

## Stage 1 milestone record

- Actual implementation date: 2026-11-07 (Asia/Kolkata).
- Implementation commit: `8dfdd6158885acd16c4f383e5c0d5fa2fbb3a612` (`chore: initialize microverse monorepo`).
- Actual commit timestamp: 2026-11-07T18:27:18+05:30.
- This documentation receipt follows the implementation commit so its real hash and confirmed push result can be recorded without rewriting history.
- Push status: successful. `git push -u origin main` confirmed `[new branch] main -> main` and configured tracking of `origin/main`. The earlier repository lookup failure was resolved by the time of push.
- Remote: `https://github.com/prashant-ku-sharma/microverse.git`.
- Verification: `pnpm install` and `pnpm install --frozen-lockfile --offline` passed.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm format:check` passed. All 10 workspace projects type-check; all five application production builds succeed; all 10 tests pass across five files.
- `pnpm dev` starts five concurrent servers. Browser checks confirmed the correct identifying page at each of ports 5000–5004. The servers were stopped after verification. `pnpm --filter @microverse/parasite dev` also started successfully in isolation.
- Initial verification caught missing test matcher type declarations; application test declarations now include the shared setup. Final checks pass.
- The sandbox denied network binding; server verification ran with approved escalation. Vite noted an existing wildcard listener on port 5000, but successfully served Ecosystem at the explicit loopback address `127.0.0.1:5000`.

## Stage 2 scope and verification

- Custom MUI/Emotion theme, color and layout tokens, typography/spacing conventions, component defaults, buttons, cards, status/loading indicators, page headers, and organism cards.
- Responsive Host sidebar/header/main/footer, six React Router routes, Host-owned organism placeholders, unknown-route recovery, active navigation, titles, and focus management.
- Dashboard branding, static organism map, overview metrics, four organism cards, navigation shortcuts, honest status/activity placeholders.
- Shared UI tests and Host tests for sidebar/route behavior, mobile navigation, theme application, and components; other standalone app tests retained.
- Browser verified at 390×844, 768×1024, and 1440×1000; no horizontal overflow. Mobile drawer opens and closes on navigation; Products placeholder renders correctly. A screenshot review caught and corrected a decorative line height.
- Actual implementation date: 2026-11-07 (Asia/Kolkata). Stage 2 was explicitly requested on the same day as Stage 1; no dates were altered.
- Final verification passed: `pnpm lint`, `pnpm typecheck`, `pnpm test` (22 tests across six files), `pnpm build` (all five apps), `pnpm format:check`, and `pnpm install --frozen-lockfile --offline`. After a final mobile shortcut fix, Host tests, Host build/typecheck, and root lint passed again. Fresh browser load produced no console errors or warnings.
- Implementation commit: `c376f936d3e4db1ed7d66588ba547f5edc979d06` (`feat: implement ecosystem host shell and mui design system`).
- Actual commit timestamp: 2026-11-07T22:35:13+05:30.
- Push confirmed: `git push origin main` advanced `main` from `c2781fe` to `c376f93`.
- This documentation receipt records the actual milestone hash and confirmed push without rewriting history. The local preview server was stopped after verification.

## Stage 3 scope and verification

- Shared readonly Product interface; PARASITE-owned fixtures for 12 products across four categories, detailed descriptions, features, materials, and bundled SVG illustrations.
- Standalone catalog/detail routes, header navigation, search, category and stock filters, five sorting modes, INR prices, ratings, and low/out-of-stock handling.
- URL-backed discovery state retained through card and featured-product detail links, empty results reset, missing-product and unknown-route recovery.
- Add to Cart disabled for unavailable products. Available products show truthful intent-only feedback without changing stock, persisting a cart, or publishing events.
- Local route splitting and shared MUI loading indicators. Host products placeholder and other apps remain unchanged.
- Actual implementation date: 2026-11-08 (Asia/Kolkata). Actual commit timestamps will be retained.
- Verification passed: `pnpm --filter @microverse/parasite test` (23 tests), independent development server, independent build/typecheck, and production preview on strict port 5001.
- Workspace verification passed: `pnpm test` (43 tests across seven files), `pnpm build` (all five apps), `pnpm typecheck` (all 10 projects), `pnpm lint`, `pnpm format:check`, and `pnpm install --frozen-lockfile --offline`.
- Browser QA passed: desktop 1440px, tablet 768px, and phone 390px/320px without horizontal overflow. Confirmed combined filters/sorting, detail navigation and preserved choices, cart-intent feedback, and production deep-link stock handling. All twelve local illustrations loaded after scrolling. Production browser console had no errors or warnings.
- An initial asset-path test was corrected for Vite's test transform. A build chunk-size advisory was resolved with local route splitting; final builds have no size advisory. No verification failures remain.
- Implementation commit: `2b18f54bb118e00c70875a8df1bc817bcbfd73e6` (`feat: implement parasite products microfrontend`).
- Actual commit timestamp: 2026-11-08T16:55:13+05:30.
- Push confirmed: `git push origin main` advanced `main` from `7f15624` to `2b18f54`.
- This documentation receipt records the real milestone hash and confirmed push without rewriting history. Both development and production preview servers were stopped after verification.

## Stage 4 scope and verification

- Verified official Vite, runtime API, sharing, and share-strategy documentation before selecting @module-federation/vite 1.23.11 with runtime 2.9.3.
- PARASITE exposes ./routes; ECOSYSTEM uses real registerRemotes/loadRemote calls behind React.lazy/Suspense. No remote source imports, registry, or Nucleus implementation.
- Shared framework singleton configuration includes React/React DOM and JSX/client subpaths, React Router, MUI, and Emotion, with compatible versions and pnpm suffix matching. Babel fallback is explicitly pinned without overriding nested Emotion dependencies.
- Embedded mode preserves Host routing/theme/shell and PARASITE product ownership; standalone entry remains functional. Remote-origin assets and container-aware product cards work in both contexts.
- Host route loading timeout, loading UI, module validation, and error boundary contain loading and render failures. Configuration labels do not claim live health.
- Browser demonstration passed in development and production: open Host, navigate Products, search/open details; confirm remote images on 5001 and one Host main region; stop PARASITE; fresh Products request shows contained fallback; Cart/Profile/Overview remain usable. Fresh production overview also starts offline.
- Standalone PARASITE works in development and production. A remote-only production rebuild was consumed by the unchanged Host build. Embedded responsive checks passed at 390px and 900px, with detail verification at 1440px.
- Actual implementation date: 2026-11-08 (Asia/Kolkata). All commits retain actual creation timestamps.
- Final workspace verification passed: `pnpm test` (56 tests across 10 files), `pnpm build` (all five applications), `pnpm typecheck` (all 10 projects), `pnpm lint`, `pnpm format:check`, and `pnpm install --frozen-lockfile --offline`. The shared MUI chunk size advisory remains non-blocking.
- Development and production preview servers were stopped after verification.
- Implementation commit: `7fc16e029b610c16a9879ce974636f6ad107c5b6` (`feat: integrate parasite remote using module federation`).
- Actual commit timestamp: 2026-11-08T18:08:00+05:30.
- Push confirmed: `git push origin main` advanced `main` from `c05f601` to `7fc16e0`.
- This documentation receipt records the actual milestone hash and confirmed push without rewriting history.

## Stage 5 scope and verification

- SYMBIONT-owned cart fixtures and illustrations, quantity/stock guards, removal/clear/restore, empty state, integer-paise totals, and explicit 10% sample discount.
- Cleanup-safe checkout simulation, locked editing during processing, immutable receipt snapshot, active cart clearing, focused confirmation, and sample restart. No external checkout/payment or Mycelium integration.
- Independent standalone shell/theme on strict port 5002; ./routes expose and embedded presentation under Host /cart. Shared entry props only; no cart business models moved into shared packages.
- Official federation documentation rechecked on 2026-11-09. Reused plugin/runtime versions, aligned singleton sharing, explicit registerRemotes/loadRemote, loaded-first, development entry/CORS, and remote-origin assets. Host route error boundary extracted for both remote consumers.
- Host dashboard accurately labels two configured remotes; Profile/Offers remain placeholders. Cart data remains separate from PARASITE.
- Actual implementation date: 2026-11-09 (Asia/Kolkata); actual Git timestamps retained.
- Final workspace verification passed: `pnpm test` (82 tests across 13 files), `pnpm build` (all five applications), `pnpm typecheck` (all 10 projects), `pnpm lint`, `pnpm format:check`, and `pnpm install --frozen-lockfile --offline`.
- Initial verification corrected an unavailable icon import and checkout test fake-timer interaction. Running build/typecheck/test concurrently caused two existing PARASITE lazy-load assertions to exceed their async query deadline; a separate complete root test run passed without code changes to PARASITE.
- Browser verification passed for development standalone and federated cart operations, totals, removal, clear/restore, checkout/receipt, one Host main, remote-origin images, and independent mount state. Embedded 320px/390px/900px/1440px checks caught and corrected an accessibility status-region sizing overflow.
- Independent production previews verified SYMBIONT standalone, federated Cart, receipt totals, and PARASITE regression alongside Cart. Both remote screens rendered without console errors/warnings before the deliberate outage test.
- With SYMBIONT production preview stopped, a fresh Cart request showed the contained fallback, Profile navigation worked, and a fresh Host overview loaded. All task-owned development and preview servers were stopped after verification.
- Dependency review made the common React Router federation fallback explicit in SYMBIONT’s manifest. Its independent build/typecheck and 17 tests passed again; final production standalone and federation rendering were reverified against the unchanged Host build.
- Implementation commit: `6ccb0345935f218854374c49e713a86248381c42` (`feat: implement symbiont cart microfrontend`).
- Actual commit timestamp: 2026-11-09T16:51:25+05:30.
- Push confirmed: `git push origin main` advanced `main` from `048437e` to `6ccb034`.
- This documentation receipt records the actual milestone hash and confirmed push without rewriting history.

## Stage 6 scope and verification

- Four Zod-validated, discriminated version-1 event contracts and source-bound publish/subscribe/unsubscribe APIs using genuine browser CustomEvents. UUID IDs/correlations, timestamps, strict envelopes/payloads, cleanup, isolated subscriber failures, and bounded metadata logging.
- Opaque persisted add-intent inbox with backpressure; SYMBIONT-owned cart + deduplication receipts committed before acknowledgement. Tab-scoped sessionStorage survives route unmount/reload without a shared business store or direct app imports.
- Federated ./cart-service consumes while Cart UI is absent; Host starts it asynchronously and projects only validated cart facts into an accessible count. Loading failure keeps the shell/Products usable and the count unknown.
- PARASITE publishes snapshots without modifying cart state. Quantity/removal/clear/checkout facts propagate from SYMBIONT. Connected carts start empty; sample data is explicitly loaded.
- Actual implementation date: 2026-11-09 (Asia/Kolkata). Stage 6 was explicitly requested after Stage 5 on the same date; actual commit timestamps are retained.
- Development browser flow passed: adds before Cart mount updated count 0→1→3; Cart quantities/totals matched and survived reload. With SYMBIONT stopped, another add request was saved and survived a reload. Production recovery restored exactly four units, including the queued journal once; a further reload retained four units. Quantity/removal counts propagated 4→3→2.
- Final checks passed: `pnpm test` (114 tests across 16 files), `pnpm build` (all five applications), `pnpm typecheck` (all 10 projects), `pnpm lint`, `pnpm format:check`, and `pnpm install --frozen-lockfile --offline`. The existing MUI provider chunk-size advisory remains non-blocking.
- Final production browser verification passed: correlated PRODUCT_ADDED publication from 5001, SYMBIONT consumption/CART_UPDATED from 5002, and Host reception on 5000 used the same correlation ID. Clear and checkout restored the count to zero; reload kept the cart empty. Connected Cart at 390px had no horizontal overflow. Standalone SYMBIONT loaded its own sample cart, while standalone PARASITE explained origin-local delivery.
- The Host build was inspected: it includes a runtime service request and contains neither cart persistence internals nor product fixtures. The service federation facade exports only its lifetime API. All task-owned development/preview servers were stopped after verification.
- Earlier assertions were updated for the new saved-request feedback and asynchronous focus behavior. Test fixtures explicitly provide HTTP asset URLs to exercise runtime validation; timer cleanup assertions observe service behavior rather than unrelated jsdom storage/ripple timers. No verification failures remain.
- Implementation milestone: `03863fd2e4154b3408db86f5bbf401f80f9149f0` (`feat: introduce mycelium typed event communication`), created at 2026-11-09T18:26:35+05:30. Push confirmed: `git push origin main` advanced `fb2e155` to `03863fd`.
- Final error-path review added a guard against announcing an uninitialized cart after failed restoration when a second service owner starts. The regression test and all 114 workspace tests passed; all five builds, workspace type checking, lint, and formatting passed again.
- Follow-up fix: `3e062423a88003cd503954f4cc367c27addc16d7` (`fix: suppress cart facts after persistence failures`), created at 2026-11-09T18:36:12+05:30. Push confirmed: `git push origin main` advanced `03863fd` to `3e06242`.
- This documentation receipt records actual hashes, creation dates, and confirmed pushes without rewriting history. Stage 6 is complete; no Stage 7 work was started.

## Stage 7 scope and verification

- Independent COMMENSAL profile, initials avatar, editable validated contact/address fields, draft/save/cancel, user/notification preferences, tab-scoped persistence, and error/reset recovery. Profile data remains private to its owner.
- Independent MUTANT coupon catalog/details, minimum/date/processing eligibility, WELCOME10/SAVE20/FREESHIP, integer-paise savings, apply/remove/replace, persisted code, expiry handling, and explicitly marked standalone estimate.
- Both expose routes through real federation on ports 5003/5004 with aligned framework singletons. Host /profile and /offers now load the remotes with isolated loading/error boundaries. Shared StandaloneShell contains only presentation.
- Background ./offers-service consumes MYCELIUM pricing facts and publishes quotes/removals while the UI is absent. Separate pricing/snapshot-request events preserve original CART_UPDATED strict version-1 compatibility. Snapshot handshake, saved selection, basis revision, acknowledgement comparison, and leases handle startup/missed events without a shared business store.
- SYMBIONT replaces its automatic discount with owner-confirmed quotes and ₹99 demo delivery. It rejects stale/expired quotes, bounds savings, preserves receipt totals, and migrates legacy saved cart records without losing processed intent IDs.
- Actual implementation date: 2026-11-10 (Asia/Kolkata). No timestamps are altered.
- Development browser verification passed: profile editing/preferences/reload, private standalone-origin state, all coupon benefits, replacement/removal, and SAVE20 becoming ineligible after a cart item removal. Offers had no horizontal overflow at 390/900px; desktop 1440px visual review and mobile navigation passed. Profile 390px had no horizontal overflow.
- Production browser verification passed: Profile, Offers, and Cart used independently built servers; profile restored its saved edits; Offers confirmed WELCOME10; stopping COMMENSAL showed its contained fallback while Cart stayed usable. Stopping MUTANT showed its own fallback while Profile and Cart stayed usable; Cart reload displayed no stale persisted savings. Restart/reload reconciled the selected coupon.
- Browser monetary evidence: 2 Moss planters + 1 Field bottle subtotal ₹4,270, SAVE20 savings ₹854, delivery ₹99, total ₹3,515. Removing the bottle invalidated SAVE20; FREESHIP yielded ₹2,980. WELCOME10 yielded ₹2,781 including delivery. Checkout receipt retained WELCOME10/₹298 savings/₹2,781 total; Host count became zero and reload kept Cart empty.
- Healthy production Offers console had no errors/warnings before deliberate outages. Expected import failures during outages were contained. Task-owned development/preview servers are stopped after verification.
- Final checks passed: pnpm test (155 tests across 21 files), pnpm build (all five apps), pnpm typecheck (all 10 projects), pnpm lint, pnpm format:check, and pnpm install --frozen-lockfile --offline. The existing Host shared MUI provider chunk-size advisory remains non-blocking. The actual commit/push receipt follows the implementation commit without rewriting history.
- Implementation commit: `7b2e2f3f00da160d31478c903a312e44f551c6a9` (`feat: add commensal profile and mutant offers remotes`).
- Actual commit timestamp: 2026-11-10T19:16:16+05:30.
- Push confirmed: `git push origin main` advanced `main` from `8ea4d9c` to `7b2e2f3`.
- This documentation receipt records the real milestone hash, timestamp, and confirmed push without rewriting history. Stage 7 is complete; Stage 8 has not started.

## Stage 8 scope and verification

- MSW 3.0.4 and TanStack Query 5.107.1 selected from stable registry releases; official browser/Query docs and MSW 3 migration/types checked before use. No real backend implemented.
- Each remote owns API handlers, fetch client, query client/provider, seeds and business rules. All requested product, cart, profile and offer endpoint methods are implemented with strict mutation validation and explicit failure statuses.
- Shared mock-utils provides only one-per-window worker transport registration, HTTP/error handling, deterministic 240 ms latency, slow/503/write-only-error/empty scenarios. Identical generated workers are served by all five apps, including the Host for embedded use. Host imports no handler or remote business state.
- Products list/detail and Profile GET/PATCH use HTTP-backed data. Cart item API delegates to its existing single persisted owner service, preserving durable event reconciliation; quantity/removal controls use HTTP. MUTANT validates user coupon application through its own API before publishing; automatic owner reconciliation remains event-driven. Each remote retains its own Query cache.
- Tests exercise real fetch through setupServer, with zero default test latency and controlled delayed handlers for loading. API success/errors, status/validation, data updates, persisted Cart/Profile, coupon calculation/failure/stale validation and UI loading/empty/retry are covered.
- Actual implementation date: 2026-11-10 (Asia/Kolkata). Stage 8 was explicitly requested on the same day as Stage 7; all Git timestamps retain actual creation times.
- Development browser checks passed: all five servers started together; Products loads 12 API products, Cart persisted a 1→2 quantity update through reload, Profile PATCH and reload kept Jordan API Rao/Pune, WELCOME10 confirmed ₹298 savings, slow response showed Loading collection, failed GET stayed inside Products while Profile remained usable, failed PATCH retained its draft, and an empty offers response rendered its empty state. Standalone ports 5001–5004 each loaded their own API data; Profile kept its separate Avery Rao seed and Offers preview validated ₹250 savings.
- Production previews passed using independently built outputs and real browser worker assets: all four Host routes loaded; product detail GET and saved Profile rendered; Cart PATCH changed 2→3 planters and recalculated WELCOME10; SAVE20 validation gave ₹894 savings and ₹3,675 total including ₹99 delivery. A failed validation kept SAVE20 active. Checkout receipt retained ₹3,675, count became zero, and reload restored an empty Cart. Healthy production Cart had no console errors/warnings. Profile API failure at 390px had no horizontal overflow. All task-owned servers were stopped after verification.
- Initial checks caught the MSW 3 option rename (onUnhandledFrame), strict partial-profile merge typing, asynchronous test assumptions, and Vitest file-URL image fixtures. These were corrected; no verification failures remain. Mutation pending copy distinguishes an update from simulated checkout.
- Final verification passed: pnpm test (170 tests across 25 files), pnpm build (all five apps), pnpm typecheck (all 10 projects), pnpm lint, pnpm format:check and pnpm install --frozen-lockfile --offline. Generated worker hashes match across all five public roots; the Host build contains no profile/cart persistence internals or product handler factory. The existing Host shared MUI provider chunk-size advisory remains non-blocking. Actual commit/push receipt follows the implementation commit without rewriting history.
- Implementation commit: `a048b7aacbfacb438591d57d0045ad8ccbc91e84` (`feat: add msw mock apis and application data layers`).
- Actual commit timestamp: 2026-11-10T19:45:51+05:30.
- Push confirmed: `git push origin main` advanced `main` from `7dadb07` to `a048b7a`.
- This documentation receipt records the real milestone hash, timestamp and confirmed push without rewriting history. Stage 8 is complete; Stage 9 has not started.

## Stage 9 scope and verification

- Runtime same-origin policy, strict Zod four-remote registry, exact-origin allowlisting, version/compatibility metadata, production HTTPS/version-directory requirements, remote enabled flags and background lifecycle feature flags.
- One pinned, deduplicated configuration snapshot per document; bounded/no-store/nonredirecting config fetches; validated separate fallback and fail-closed policy/fallback handling with visible notices. No local-storage registry trust or remote URL constants in Host TypeScript.
- Supported registerRemotes/loadRemote integration with empty compile-time remotes map. All four owners expose ./release; NUCLEUS checks exact identity/version and declared compatibility before loading routes/services. Shared framework configuration and owner state remain intact.
- Canonical development/production JSON presets, static-copy tooling, immutable local Cart release builder, version-aware Cart assets, origin-root MSW worker support, and runtime metadata UI. Production .example origins are explicit templates rather than deployed sites.
- Actual implementation dates: 2026-11-10–11 (Asia/Kolkata); completion on 2026-11-11. All commit timestamps remain actual creation times.
- Critical production-build browser acceptance passed: independently built Cart 1.0.0 and 1.1.0; edited only deployed registry Cart version/entry; reloaded the unchanged Host; actual Cart chip and new sample image paths confirmed 1.1.0. Four persisted units survived. Host SHA-256 across 18 non-registry artifacts stayed `ad5f20006855116e21c3bea034cf12d3d3adc11686a184c85b7461fdec4fb93b` before/after. No Host build ran between the two loads.
- Additional browser checks passed: invalid/untrusted primary selected validated fallback Cart 1.0.0 with a warning; Profile/background Cart flags disabled their capabilities; invalid policy blocked remotes while Overview remained usable. All four remotes loaded, Profile rendered, SAVE20 still confirmed against selected Cart, versioned Cart 1.1.0 ran standalone with working mock API/images, and the runtime registry had no overflow at 390px. Default development mode/registry was restored and verified; task-owned servers were stopped.
- Unit/UI verification covers valid/invalid/missing/untrusted registry, exact origins, production requirements, fallback, failed policy, request status/JSON/size/timeout, metadata/mismatch/compatibility, disabled imports/services, runtime URL changes, actual supported runtime call ordering, deduplicated release checks and visible state. Full workspace tests passed: 202 tests across 28 files. All five builds, independent release builds, strict type checking for all 10 projects, lint, formatting and pnpm install --frozen-lockfile --offline passed.
- Early verification corrected discriminated state narrowing, MUI sx usage and generated-artifact lint exclusions. Initial offline dependency restoration needed the permitted registry-backed install; no dependency versions were upgraded. Existing shared MUI chunk advisory remains non-blocking. Exact reproduction and trust/cache limitations are in docs/nucleus.md and ADR 0009.
- Implementation commit: `9e02a137f7864a63af1ce1814072df71c04117c8` (`feat: add nucleus runtime remote registry`).
- Actual commit timestamp: 2026-11-11T00:07:56+05:30.
- Push confirmed: `git push origin main` advanced `main` from `6a37bf6` to `9e02a13`.
- This documentation receipt records the real milestone hash, creation timestamp and confirmed push without rewriting history. Stage 9 is complete; Stage 10 has not started.

## Architecture decisions

See [ADR 0001](decisions/0001-workspace-foundation.md), [ADR 0002](decisions/0002-host-shell-and-design-system.md), and [ADR 0003](decisions/0003-parasite-product-ownership.md). The apps are independent standalone builds. Shared UI has no router or business state. The Host owns routing and failure isolation; PARASITE owns products; SYMBIONT owns cart state and checkout simulation. See [ADR 0004](decisions/0004-first-runtime-federation.md) for the runtime integration and [ADR 0005](decisions/0005-symbiont-cart-ownership.md) for cart ownership and [ADR 0006](decisions/0006-durable-mycelium-delivery.md) for durable event intent and service lifetime. [ADR 0007](decisions/0007-profile-and-offer-ownership.md) records private profile state, offer ownership, pricing compatibility, and quote reconciliation. [ADR 0008](decisions/0008-owner-local-mock-apis.md) records owner-local mock APIs, private Query caches, shared worker transport and preservation of durable event ingress. [ADR 0009](decisions/0009-nucleus-runtime-registry.md) records policy trust, runtime federation, release metadata and validated fallback. [ADR 0010](decisions/0010-remote-resilience-and-observations.md) records observation semantics, safe retry lifetimes and security limits.

## Pending stages

Stages 11–12 await their implementation prompts. Their exact scope has not been supplied. Deployment automation and further testing remain deferred.

## Known limitations

All four remotes are integrated. IMMUNE SYSTEM records module/view/service observations, not genuine health checks or continuous uptime. Its diagnostics retain at most 50 tab-local records; CSP is a deployment template, not an enforced header. Boundaries do not sandbox remote code. Runtime entry selection is implemented; production origins remain .example templates pending real hosting. Authentication, deployment automation and further event domains await their stages. Recovery from cached federation import failures uses a full reload. The tab/origin-scoped cart/inbox survives reload but is not a backend/account cart or cross-origin/cross-tab sync. Inbox capacity is 100 pending requests with visible rejection; diagnostic history is 100 records per module instance and applied IDs retain 1000 receipts. Corrupt inbox data is preserved/reported and needs manual inspection. Inventory/coupons/delivery are mock data; checkout is a simulation. Profile/cart/offer selection are local to the origin/tab, not backend account data. Notification delivery and translations are not implemented. Coupons use fixed UTC fixture validity through 2027-12-31. MSW is intentionally included in built demos; no real backend or cross-origin API bridge exists. The existing Host shared MUI provider chunk-size advisory remains non-blocking.

## Next milestone

Await Stage 11 instructions. Do not proceed automatically.

## Stage 10 scope and verification

- Host-owned per-remote boundaries and Suspense fallbacks; typed load/configuration/render/service failures; 12-second release/expose timeouts, version compatibility rejection, export validation, view remount retry and fresh-page remote recovery.
- Independent operation observations with attempt tokens and failure-prioritized aggregation prevent late imports or background successes from erasing failures. Async Cart/Offers startup is caught and observed without sharing business state.
- Ecosystem monitoring displays configured version/URL, Not loaded/Loading/Available/Failed/Timed out/Incompatible/Disabled states, pending operations, last failure and timestamped module load history. It explicitly distinguishes observations from genuine health checks; no uptime or API health information is fabricated.
- Bounded, validated, best-effort tab diagnostics store at most 50 safe metadata records. Current statuses reset on reload; historical observations retain timestamps/versions. Console warnings omit raw errors and business payloads.
- Existing NUCLEUS exact-origin validation and fail-closed policy remain enforced. Added security implications, HTTP CSP Report-Only template, deployment enforcement guidance, ADR 0010 and exact reproduction instructions. Federation code runs in the Host security context; error boundaries are not a sandbox.
- Actual completion date: 2026-11-13 (Asia/Kolkata). No Git timestamps are altered.
- Built-browser verification passed with real federation: stopped PARASITE produced a contained fallback; Cart quantity changed 1→2, Profile rendered and Offers consumed ₹2,980 cart context and accepted WELCOME10. Restoring PARASITE and Retry remote returned the collection.
- Opt-in remote-only controlled render fault was caught; Retry view removed its query parameter and recovered without losing the Host. Invalid primary registry visibly selected the validated fallback. Declaring PARASITE 9.0.0 against its actual 1.0.0 release produced Incompatible.
- A real remoteEntry.js delayed 20 seconds produced Timed out after 12 seconds and remained timed out after late completion. Restoring the preview server and retrying recovered. Monitoring retained the timeout timestamp and new successful module load. Phone 390×844 layout had no horizontal overflow; desktop screenshot saved outside Git. All task-owned servers stopped; canonical registry restored; normal production builds disable controlled render faults.
- Initial verification exposed an unstable test snapshot and a navigation/remount retry race; both were corrected and covered by focused tests. A regression test also ensures ordinary search navigation preserves view state. One existing Offers test hit its five-second limit under concurrent build/test load; the full suite passed on rerun without competing builds.
- Final verification passed: pnpm test (216 tests across 31 files), pnpm build (all five apps), pnpm typecheck (all 10 projects), pnpm lint, pnpm format:check and pnpm install --frozen-lockfile --offline. After the final retry refinement, Host tests (95) and independent Host build/typecheck passed again. Normal PARASITE output contains no controlled-fault code. Existing shared MUI chunk advisory and jsdom scrollTo notices remain non-blocking. Actual commit/push receipt follows without rewriting history.
