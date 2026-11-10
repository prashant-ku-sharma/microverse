# NUCLEUS: runtime remote registry

Stage 9 replaces all four Host build-time remote entries with policy-validated runtime configuration. No remote entry URLs remain in Host TypeScript or its Vite federation configuration. The Host plugin still initializes the common sharing scope, with an empty remotes map. Supported registerRemotes/loadRemote APIs connect the fetched registry to genuine federation.

## Files and trust

The Host requests `/nucleus/config.json` once per document. This operator-controlled, same-origin policy supplies environment, exact trusted origins, primary `/nucleus/remotes.json`, and separate `/nucleus/fallback.json`. Policy paths must be same-origin JSON filenames under /nucleus. Configuration fetches prohibit redirects, use cache=no-store, and have a five-second timeout and a 100,000-character response limit.

The policy is a trust anchor: protect it with the same deployment controls as the Host. The separately published registry cannot approve its own additional origins. Entries are validated against the policy before any federation registration. Invalid policy blocks all remote loading. An invalid/unavailable primary registry selects the complete, independently validated fallback snapshot under the same policy; invalid fallback also blocks loading. The shell/Overview remain available and a visible notice explains the outcome. No unvalidated local-storage registry or arbitrary URL is trusted.

Canonical presets are in deployment/registry/development and deployment/registry/production. Host public/nucleus contains the working development defaults. To publish a preset into static files without compiling Host JavaScript:

```sh
node deployment/scripts/configure-nucleus.mjs development apps/ecosystem/public/nucleus
node deployment/scripts/configure-nucleus.mjs production apps/ecosystem/dist/nucleus
```

Production origins use reserved .example placeholders, not deployed applications. Replace all production policy origins and matching primary/fallback entries with real controlled HTTPS origins before using that preset. The script only copies static files; it does not deploy a site or build the Host. Keep the fallback pointed at an available, previous known-good release.

## Registry schema and compatibility

Both registry files require schemaVersion 1, features, and all four named remotes. Every remote has name, version, entry, enabled and compatibility. Unknown fields/missing remotes are rejected. Versions use stable numeric major.minor.patch; prerelease tags and aliases such as latest are not accepted.

```json
{
  "name": "Symbiont",
  "version": "1.1.0",
  "entry": "https://symbiont.microverse.example/releases/1.1.0/remoteEntry.js",
  "enabled": true,
  "compatibility": {
    "hostApi": 1,
    "mycelium": 1,
    "reactMajor": 19,
    "muiMajor": 9
  }
}
```

Entries must be absolute JavaScript URLs on an exact allowlisted origin, with no credentials, query or fragment. HTTPS is required except loopback HTTP in the development policy. Production paths must start `/releases/<declared-version>/`. Thus changing a production version requires selecting a distinct immutable release directory. The common federation shared dependency policy remains aligned with React 19, React DOM, MUI 9, Emotion and Router.

Every remote also exposes `./release`, a small metadata module containing id/version/compatibility. `VITE_REMOTE_VERSION` sets the remote artifact identity during its own build; the default is 1.0.0. NUCLEUS registers the selected entry once, loads and validates this metadata, verifies exact id/version against the registry, then requests routes or the lifecycle facade. A mismatch or unsupported contract blocks the application/service expose and reaches its contained error path. This is declared compatibility checking, not code authentication; a trusted remote executes with the Host's privileges. Trusted hosting, nonredirecting entry/assets and production CSP remain operational responsibilities. No sandbox or cryptographic integrity guarantee is claimed.

## Runtime flow and flags

1. Host service hooks/route loaders request the same NUCLEUS load promise.
2. Policy and primary/fallback registry are fetched and fully validated.
3. The resolved snapshot is pinned for the document. No live hot swapping of mounted business state occurs.
4. The selected remote's enabled flag and requested background feature are checked **before registration or imports**.
5. registerRemotes receives `{ name: id, type: 'module', entry: resolvedEntry }` on the plugin-created runtime. loadRemote requests `<id>/release`; concurrent route/service requests share that handshake.
6. Matching metadata permits `<id>/routes`, `symbiont/cart-service` or `mutant/offers-service`. Federation module requests retain a 12-second timeout. No force override or second sharing instance is created.
7. Reload starts a new snapshot and module lifetime, selecting changed URLs. Native failed imports can remain cached within the old document.

`remote.enabled=false` disables both its route and background facade. The route explains the intentional disable instead of claiming a network outage. `features.cartEvents` and `features.offerEvents` gate **Host background auto-start** only. Turning them off does not turn off a standalone remote's own business events; opening an enabled Cart/Offers UI starts that owner's service as before. Product requests remain durably queued if Cart is absent. No business state or event logic is moved into NUCLEUS.

The Ecosystem page shows resolved primary/fallback source, environment, versions, entries, enabled flags and compatibility. These are configuration facts, not live health checks. A Host-wide notice discloses fallback or policy failure on other routes as well.

## Exact no-Host-rebuild acceptance process

Use a fresh checkout/output root, or reuse already-generated releases. The release builder refuses to overwrite an existing version. Stop existing servers on 5000–5004 first.

```sh
pnpm build
node deployment/scripts/build-cart-release.mjs 1.0.0
node deployment/scripts/build-cart-release.mjs 1.1.0
```

The two latter commands build **only SYMBIONT**, under deployment/.local/cart/releases/<version>, with the matching VITE_REMOTE_VERSION and Vite base path. Its sample assets respect BASE_URL. The helper also installs an identical origin-root MSW transport worker for standalone release pages and rejects a conflicting worker protocol. These are ignored local artifacts, not Git releases or fabricated commit history.

In separate terminals, serve the existing outputs:

```sh
pnpm --parallel --filter @microverse/ecosystem --filter @microverse/parasite --filter @microverse/commensal --filter @microverse/mutant preview
pnpm --filter @microverse/symbiont exec vite preview --outDir ../../deployment/.local/cart
```

For the baseline, edit **only** apps/ecosystem/dist/nucleus/remotes.json and fallback.json: set symbiont.version to 1.0.0 and symbiont.entry to `http://127.0.0.1:5002/releases/1.0.0/remoteEntry.js`. Keep the loopback origin in the development policy. Open http://127.0.0.1:5000/cart: the Cart's own chip displays SYMBIONT v1.0.0. Load a sample cart; its images resolve under the 1.0.0 directory.

Now change **only the primary remotes.json** Cart version to 1.1.0 and entry to `http://127.0.0.1:5002/releases/1.1.0/remoteEntry.js`. Keep fallback at 1.0.0. Reload Ecosystem. The actual Cart component displays SYMBIONT v1.1.0, and its headless service uses the same selected container. Existing persisted cart items survive. Their stored image URLs may still point to the old immutable release; restoring sample data uses the new 1.1.0 image directory. Do not run pnpm build or any Host build between these two loads.

Observed acceptance evidence on 2026-11-10/11:

- Independently built Cart 1.0.0 → registry-only change → reload → Cart 1.1.0.
- Cart UI build identity, new sample image paths, and NUCLEUS metadata all confirmed 1.1.0. Four persisted units survived the switch; offers still confirmed SAVE20 against that cart.
- SHA-256 of the Host's 18 non-registry files was identical before and after: `ad5f20006855116e21c3bea034cf12d3d3adc11686a184c85b7461fdec4fb93b`. Files were sorted by relative path; the hash includes each relative path and file bytes. Only mutable nucleus JSON was excluded.
- An untrusted primary Cart URL selected the validated fallback and rendered Cart 1.0.0 with a visible warning. Disabled Profile/background Cart flags behaved correctly; invalid policy left Overview usable. Cart 1.1.0 also ran standalone at `/releases/1.1.0/` with working MSW and images.
- Default development servers/registry were restored and verified. All task-owned servers were stopped; the Host's dist registry was restored to normal development defaults.

For normal preview again, restore the working default static registry without a rebuild:

```sh
node deployment/scripts/configure-nucleus.mjs development apps/ecosystem/dist/nucleus
```

Real production hosting should serve config/registry/fallback JSON with Cache-Control: no-store and versioned release assets with long immutable caching. Deploy the new remote directory completely before atomically replacing primary registry JSON; keep old assets while saved carts/older documents reference them. Deployment automation and release promotion pipelines remain later-stage work.

## Verification

Unit/UI tests cover valid development/production presets, strict schemas, missing remotes, untrusted/lookalike origins, credentials/scheme/fragment restrictions, metadata, compatibility rejection, redirect/cache policy, malformed/oversized/failed responses, bounded startup, validated fallback, fail-closed policy, feature gates, actual registerRemotes/loadRemote ordering, one handshake across route/service requests, timeout cleanup, changed runtime URLs in a new document loader, and visible configuration/failure states. Separately served browser builds provide the critical integration evidence.

Official references rechecked before implementation: [Vite federation integration](https://module-federation.io/integrations/build-tool/vite), [runtime APIs](https://module-federation.io/guide/runtime/runtime-api). The installed plugin 1.23.11/runtime 2.9.3 remain unchanged. No force registration or Git force push is used.
