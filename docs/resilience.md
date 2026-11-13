# IMMUNE SYSTEM

Stage 10 adds Host-owned runtime observations and recovery. It does not move business state into the Host or probe invented health endpoints. All four routes have separate React error boundaries and Suspense fallbacks; asynchronous Cart/Offers service startup is observed separately and caught outside React rendering.

## Status and diagnostics

| Status       | Meaning in this document                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Not loaded   | No operation has started in this page                                                                |
| Loading      | A requested operation is pending                                                                     |
| Available    | A validated module export loaded, a view committed, or service startup returned its cleanup function |
| Failed       | Configuration, import, export validation, render or service startup failed                           |
| Timed out    | A release or expose load exceeded 12 seconds                                                         |
| Incompatible | Release identity, version or compatibility metadata differs from the accepted contract               |
| Disabled     | Runtime policy disabled the requested operation                                                      |

`/ecosystem` displays each remote's configured version and deployment URL, aggregate runtime status, loading operations, last failure and last successful module load with timestamps and version. These are observations, not continuous availability, API health or uptime measurements. No genuine health check is configured. Already-loaded JavaScript can remain usable after its server stops.

Operations are tracked independently. Incompatible, timed-out and failed operations take precedence over loading and successful operations; a successful background import cannot erase a view failure. Each attempt has a token. Late results cannot replace a timed-out operation or a newer attempt. The timeout stops waiting, not the underlying native import. Release and application loads each have a 12-second limit; NUCLEUS retains its separate five-second fetch limits.

Failure logs use fixed messages and metadata, excluding raw exception messages and business payloads. At most 50 validated records are retained in best-effort tab sessionStorage (`microverse:immune:v1:diagnostics`), alongside console warnings. Blocked, full or corrupt storage cannot block the shell. Reload resets current status to Not loaded; previous failure/module-load timestamps remain historical. There is no external telemetry or continuous polling. Registry fallback is logged globally, without attributing it to an arbitrary remote.

## Recovery

- **Retry view** remounts only the failed React view. It clears the optional controlled render-test query parameter. Route navigation is committed before remounting that test view. Owner state remains with the remote.
- **Retry remote** opens a fresh page at that organism's route. This clears the failed native ESM/React.lazy/federation document caches and reselects validated runtime configuration. Durable owner persistence and MYCELIUM reconciliation remain responsible for restoring business state. Unsaved view edits can be lost on reload.
- **Reload page** is also available. Monitoring offers the same fresh-page retry for failed organisms.

No live container override or forced cache replacement is used: replacing active service code could create duplicate Cart/Offers owners. A retry that still encounters the fault returns to its contained fallback. An invalid primary registry selects only a validated fallback; invalid policy or invalid primary plus fallback fails closed. Host navigation remains outside remote boundaries.

## Reproduce the failure scenarios

From the repository root, build all apps with `pnpm build`. Run each filtered `preview` in a separate terminal, for example `pnpm --filter @microverse/parasite preview`, and similarly ecosystem, symbiont, commensal and mutant. All use ports 5000–5004.

1. **Unavailable remote and recovery:** open Host `/products`, add a product, then stop only PARASITE. Reload Products to force a new entry request. Products shows a fallback; Cart quantities, Profile and Offers remain usable. Restart PARASITE and click Retry remote. The collection returns and monitoring retains the previous failure timestamp.
2. **Rendering failure:** dev mode permits the embedded PARASITE test fault. For production-preview QA, opt in only for its build: `VITE_ENABLE_RESILIENCE_TESTS=true pnpm --filter @microverse/parasite build`. Visit Host `/products?immune-render=parasite`. The remote throws during rendering, its boundary contains it, and Retry view clears the parameter and recovers. Normal builds default this flag off; standalone PARASITE is unaffected. Rebuild without the flag afterward.
3. **Registry failure:** back up `apps/ecosystem/dist/nucleus/remotes.json`, replace its content with `{}`, then reload Host `/ecosystem`. The visible fallback notice identifies the validated fallback selection. Restore the file afterward. Unit tests also cover fetch rejection, invalid fallback and untrusted origins.
4. **Timeout:** stop PARASITE preview and run `node deployment/scripts/serve-delayed-remote.mjs 20000`. This localhost-only fixture serves the real PARASITE build but delays remoteEntry.js by 20 seconds. Reload Host `/products`; after 12 seconds its fallback says Timed out and offers retry. Monitoring stays Timed out even after the import eventually returns. Stop the fixture, restart PARASITE preview, and click Retry remote to recover.
5. **Compatibility:** in a backed-up built registry, change only PARASITE's declared version to `9.0.0` while serving its actual `1.0.0` build. Reload Products. Matching release checks reject it as Incompatible before loading its routes. Restore the registry and retry.

Browser verification on 2026-11-13 exercised these real built remotes, including offline isolation, quantity changes, Profile rendering, Offers eligibility/application, fresh-page recovery, controlled render recovery, invalid-primary fallback, mismatched release and delayed-entry timeout. Unit tests independently cover late completion, observation priority/history, blocked storage, subscription cleanup and boundary recovery. Tests mock runtime APIs only where isolation is required; they do not substitute for the built federation demonstration.

## Security boundary

Module Federation executes trusted remote JavaScript in the Host page's security context. Remote code can access the DOM, origin storage, events and accessible credentials, and can block the main thread. React boundaries isolate supported rendering failures; they do not sandbox code, prevent malicious behavior, catch every asynchronous exception or guarantee recovery from a frozen process. Release metadata is a compatibility check, not code authentication, and is checked after the remote container has executed.

NUCLEUS validates exact trusted entry origins before runtime registration/import, disallows URL credentials, restricts production to HTTPS/versioned paths and validates fallback under the same policy. The operator-controlled policy and deployment pipeline are part of the trust boundary. An allowlisted container may import more resources, so origin validation alone is not a complete transitive resource policy.

Use [the production CSP example](../deployment/security/csp.production.example) as an HTTP **Report-Only** header after replacing every example origin with actual approved deployment origins. Align script-src and connect-src with the NUCLEUS policy, include remote asset origins, keep worker-src self for MSW, and restrict framing, base URLs and object loading. Inspect browser violations during complete application flows, then enforce with `Content-Security-Policy` at the hosting/CDN layer. Report-Only does not enforce restrictions, and this stage does not deploy a header. `frame-ancestors` requires an HTTP header. Emotion currently requires the documented inline-style allowance; a nonce-based policy requires coordinated server/render integration before tightening it. Do not add unsafe-eval or unrestricted inline scripts to hide violations. Configure a reporting endpoint only when an operator supplies one; no fabricated collection service is included.

CSP limits resource execution/loading, not the privileges of approved remote code. Truly untrusted applications need a separate security boundary, such as sandboxed cross-origin iframes and a restricted messaging protocol; that architecture is not implemented here.

Primary references: [Federation runtime APIs](https://module-federation.io/guide/runtime/runtime-api), [React error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary), [MDN CSP reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy).
