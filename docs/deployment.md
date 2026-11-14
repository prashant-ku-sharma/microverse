# Independent deployment and CI/CD

Stage 11 implements GitHub Actions for five independent Netlify application sites and a sixth static NUCLEUS site. **No live deployment was performed during this stage:** Netlify credentials and actual site URLs were unavailable in the workspace. All five GitHub-hosted verify-build jobs also passed for commit 955f88188401bfbd36d1e78d3ce33943805f1cda; every live deployment job was skipped. Workflow definitions, build outputs and orchestration tests are verified locally; the live Netlify API, proxy/CSP headers and browser acceptance gates remain unverified until configured. Illustrative domains are never substituted for real targets.

## Decision and topology

Netlify's digest-based atomic deployments let us retain old release paths without downloading/rebuilding earlier applications. A draft is uploaded and verified before publication. NUCLEUS has its own publication lifetime: updating it does not build or deploy ECOSYSTEM. See [ADR 0011](decisions/0011-independent-netlify-deployments.md).

Five required workflow entry points are deploy-ecosystem.yml, deploy-parasite.yml, deploy-symbiont.yml, deploy-commensal.yml and deploy-mutant.yml. They call `_deploy-application.yml`. Pushes on main and pull requests use application-specific path filters plus shared packages, deployment infrastructure, workflows, Host registry schema and toolchain files. A change confined to one remote does not trigger the Host workflow. Shared changes conservatively verify all affected applications. `workflow_dispatch` also supports rebuilding one application.

Each pipeline installs the frozen pnpm lockfile, checks workflows with checksum-verified actionlint, lints/type-checks/tests its workspace dependency graph, and builds **only that application and its required packages**. App tests and shared package tests remain independent. Node 24/pnpm 11.25.0 match the repository toolchain. PRs never deploy or receive deployment secrets. A main-branch deployment job runs only when the repository variable DEPLOY_TARGETS_JSON exists; absent configuration means a skipped deployment, never success evidence.

Builds use a unique stable version `1.<workflow run number>.<run attempt>`. Re-running a complete workflow builds a new version. Re-running only failed deployment jobs with the same version is safe only if that version has not been published; overwriting a published release is refused. Read versions from the actual deployment receipt, not guessed numbers.

## Configure actual targets

Create **six separate manually deployed sites in the same Netlify team**, disable competing Git-connected auto-build/publication, and use their actual canonical HTTPS `*.netlify.app` origins. The scripts deliberately reject example domains, deploy-preview origins, duplicate sites and mismatched API site identities. This first deployment adapter supports canonical Netlify origins; adding custom-domain support is a later reviewed change. Do not copy the illustrative MICROVERSE domains into deployment configuration.

Set repository Actions variable `DEPLOY_TARGETS_JSON` to this shape, replacing every value with the corresponding real site ID/origin:

```json
{
  "ecosystem": {
    "siteId": "ACTUAL_HOST_SITE_ID",
    "origin": "ACTUAL_HOST_HTTPS_ORIGIN"
  },
  "parasite": {
    "siteId": "ACTUAL_PRODUCTS_SITE_ID",
    "origin": "ACTUAL_PRODUCTS_HTTPS_ORIGIN"
  },
  "symbiont": {
    "siteId": "ACTUAL_CART_SITE_ID",
    "origin": "ACTUAL_CART_HTTPS_ORIGIN"
  },
  "commensal": {
    "siteId": "ACTUAL_PROFILE_SITE_ID",
    "origin": "ACTUAL_PROFILE_HTTPS_ORIGIN"
  },
  "mutant": {
    "siteId": "ACTUAL_OFFERS_SITE_ID",
    "origin": "ACTUAL_OFFERS_HTTPS_ORIGIN"
  },
  "nucleus": {
    "siteId": "ACTUAL_REGISTRY_SITE_ID",
    "origin": "ACTUAL_REGISTRY_HTTPS_ORIGIN"
  }
}
```

Create GitHub environments `production-ecosystem`, `production-parasite`, `production-symbiont`, `production-commensal`, `production-mutant` and `production-nucleus`. Restrict them to main and configure required reviewers for production. Add a suitably restricted Netlify token as each environment's `NETLIFY_AUTH_TOKEN` secret. GitHub environment settings and site provisioning are operator setup, not resources created by these workflows. Separate tokens/accounts should have only required target access where Netlify permissions permit. Protect workflow/deployment code and the Host trust policy with branch review.

Keep Netlify HTML/JS post-processing and injected snippets disabled for these sites: verification requires the uploaded bytes to be served unchanged. Sites must be publicly readable by the browser gate; protected/private sites require a separately reviewed authentication adapter. Never put tokens in public target JSON, VITE_* variables, CLI arguments, commit files or frontend bundles. The token is scoped only to the deployment step, not the build; the browser gate removes it from its child-process environment.

## Remote artifact publication

Remote builds use `/releases/<version>/` as Vite base. Preparation moves the full build into that directory and writes a release manifest with identity, compatibility, source commit and SHA-256 inventory. Root index/SPA rewrites preserve standalone navigation on each remote's own origin. The worker remains at origin root; changing its bytes is blocked when earlier remote releases remain, until a reviewed worker migration is implemented.

Netlify's complete paginated current file digests are merged with the new release, so **all previously published versioned paths remain in every newer snapshot**. The scripts reject reuse of a version and refuse publication if Netlify asks for an unavailable retained blob. No cleanup deletes prior releases. Hashed chunks, public images and manifests use immutable caching; root HTML/worker use revalidation/no-store as appropriate. Missing release assets return 404, not the SPA HTML. CORS allows the actual Host origin; verification checks CORS and JavaScript MIME types.

A deployment creates a draft, uploads required digests, polls readiness with a bound, verifies public file hashes, publishes using Netlify's supported restore/publish endpoint, confirms the published deploy ID and verifies stable-origin release bytes. It emits deployment-receipt.json and a workflow summary. Deployment jobs serialize per site and recheck the current deploy before publishing; an external concurrent publication aborts rather than silently dropping its releases. Netlify publication has no cross-client compare-and-swap guarantee: disable competing publishers and do not manually publish during these jobs. A post-publication verification failure is an incident, not a successful release receipt.

A remote workflow **does not change the active registry**. An inactive, successfully published version is safe to review before activation.

## Separate NUCLEUS promotion and rollback

The Host deploy contains its operator-controlled `/nucleus/config.json`, exact-origin allowlist and CSP. Only `/nucleus/remotes.json` and `/nucleus/fallback.json` are forced same-origin proxy rewrites to the separate registry site. Other /nucleus paths do not receive an arbitrary proxy. A registry cannot expand its own trust. Origin or policy changes require reviewing and deploying the Host policy; an ordinary version promotion uses existing origins and requires neither a Host build nor a Host deploy.

`promote-nucleus.yml` is manual and serialized. It takes operation, expected_snapshot, and either a remote/version, rollback snapshot hash, or initial_versions. The expected canonical SHA-256 prevents promoting against stale operator assumptions. Before writing it:

1. Confirms actual target IDs/origins and deployed Host policy.
2. Validates the complete proposed registry using the same Zod schema as the Host, production HTTPS/versioned paths and exact owning target origins.
3. Fetches every selected release manifest and its actual assets, verifies identity/version/compatibility, hashes, CORS and MIME types.
4. Runs Chromium against the **existing deployed Host**, intercepting only the registry response in that isolated test context with the candidate snapshot. Real remote entries/chunks, metadata handshakes, MSW data and enabled views must load; intentionally disabled routes must show their disabled state. No Host assets are rebuilt or republished. Cart's visible release version must match the candidate.
5. Creates/verifies a registry-only draft; retains content-addressed historical snapshots and writes the prior active snapshot as fallback; rechecks current state and publishes atomically.
6. Verifies the active registry and runs a second fresh-browser gate **without interception**, through the actual Host proxy. It confirms the Host deploy ID is unchanged and emits nucleus-receipt.json plus screenshots.

A failed candidate gate prevents publication. If the post-publication gate fails, the workflow fails, no success receipt is issued, previous snapshots/assets remain, and an operator must perform rollback. It does not hide failure behind automatic promotion or an unreviewed fallback. Browser gate screenshots are retained for 14 days; receipts for 90. Those Actions retention periods are not remote-release deletion policies.

NUCLEUS sends Cache-Control and Netlify-CDN-Cache-Control no-store for active/fallback snapshots, including upstream responses through the Host proxy. Verify this behavior on live hosting before enabling production use. A document pins one snapshot; reload selects a promotion/rollback.

## Bootstrap and critical Symbiont demonstration

This is the exact **pending live acceptance procedure**, not a claim that it happened:

1. Configure sites/environments/secrets/variable above. Run each remote deployment workflow and the Host workflow on main. Record all actual deployment IDs and versions from receipts.
2. Run promote-nucleus with operation initialize, expected_snapshot `none`, and initial_versions JSON mapping all four IDs to their actually deployed versions. Initial active and fallback are the same verified snapshot because no previous release exists.
3. Save its snapshot hash S0, Host deploy ID H0, and old Cart version V0. Open the actual Host URL `/cart` and confirm its visible `SYMBIONT vV0`. Download/hash the Host `/deployment.json` as additional artifact identity evidence.
4. Change only SYMBIONT source or manually dispatch deploy-symbiont. Its pipeline builds/deploys a unique V1 while retaining V0. Confirm the receipt and production deploy ID before promotion. A deployment success alone does not activate V1.
5. Run promote-nucleus with operation promote, remote symbiont, version V1 and expected_snapshot S0. Candidate and actual-proxy browser gates must pass. Save new snapshot S1 and its receipt showing Host deploy ID H0 before/after. Host workflow must not have run. No Host build/deploy is part of this job.
6. Reload the actual Host `/cart`; confirm `SYMBIONT vV1`. Record screenshots and verify unchanged Host artifact hash/deploy ID. Existing persisted cart data should reconcile normally.
7. Run promote-nucleus with operation rollback, snapshot S0 and expected_snapshot S1. Previous release assets are still at their original immutable URLs. Validation/browser gates rerun, the archived S0 becomes active, and S1 becomes fallback.
8. Reload `/cart`; confirm `SYMBIONT vV0`, unchanged Host H0/artifact hash, and retained V1 assets. Keep both receipts and screenshots as acceptance evidence.

To obtain the current expected hash using the public registry URL without credentials:

```sh
node --input-type=module -e 'import { snapshotHash } from "./deployment/scripts/manage-nucleus.mjs"; const r = await fetch(process.env.NUCLEUS_ORIGIN + "/nucleus/remotes.json", {cache:"no-store",redirect:"error"}); if (!r.ok) throw Error("Registry unavailable"); console.log(snapshotHash(await r.json()));'
```

Set NUCLEUS_ORIGIN to the actual configured origin. A receipt's previousSnapshot value is the normal rollback target. Historical files are `/nucleus/history/<hash>.json` on the registry origin. No timestamp fabrication, Git history rewrite or force push is part of rollback. Do **not** restore an old remote site's entire deploy just to change active Cart: that could remove newer releases from stable URLs. Roll back the registry pointer instead.

## Security and verification limits

Generated Host `_headers` enforces a CSP limited to self plus the four configured remote origins, with no unsafe-eval or inline scripts. Emotion currently requires inline styles. Remote `_headers` provide exact Host CORS, nosniff and cache rules. Netlify custom headers do not apply to proxied responses, so NUCLEUS supplies its own no-store headers upstream. Validate actual browser CSP/CORS/worker/proxy behavior after site setup. The earlier Report-Only example remains a generic rollout aid, not proof of live enforcement. Federation code still executes with Host privileges; CSP/compatibility/hash checks do not sandbox it or authenticate a malicious allowlisted publisher. See [resilience security limits](resilience.md).

Local verification: ten Node orchestration tests exercise draft upload/publish, retained digests, immutable-version rejection, concurrency checks, corrupt/missing/incompatible releases, stale/unauthorized snapshots, CORS/MIME, all five preparations, failed browser gate and registry-only promotion/rollback with unchanged Host identity. API/browser dependencies are explicit test doubles in these tests, not live deployment evidence. All five actual versioned production outputs were independently built and their packaged inventories hashed. Actionlint validates all seven workflows. Playwright browser gates are implemented for CI but remain unexecuted against live targets because credentials/URLs are unavailable.

Primary documentation: [Netlify API](https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/), [proxy rewrites](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/), [custom headers](https://docs.netlify.com/manage/routing/headers/), [Playwright network routing](https://playwright.dev/docs/network), [pnpm filtering](https://pnpm.io/filtering).
