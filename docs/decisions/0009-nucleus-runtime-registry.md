# ADR 0009: policy-validated runtime remote selection

- Status: accepted
- Implementation: 2026-11-10–11 (Asia/Kolkata)
- Stage: 9

## Context

The Stage 8 Host still compiled four remote URLs into source/config. Updating a URL required a Host rebuild. A JSON file alone cannot load a remote; selection must reach supported federation registration/loading APIs, while preserving owner state, framework sharing and service/route consistency.

## Decision

Keep NUCLEUS inside the Host, which owns remote orchestration. Fetch an operator-controlled same-origin policy and a strict versioned four-remote registry. Keep trusted origins outside the registry payload. Validate every entry and declared Host/MYCELIUM/framework compatibility before registration. Use exact origins, loopback-only development HTTP, production HTTPS and immutable version directories. Validate a separate fallback under the same policy; fail closed when policy/fallback cannot be trusted while retaining the Host shell.

Use the existing plugin-initialized runtime with an empty compile-time remotes map. NUCLEUS calls supported registerRemotes/loadRemote against the selected URLs. Pin one snapshot per document, deduplicate concurrent release checks, and require reload for a new selection. Do not force-replace live containers or create a second sharing scope.

Expose a small ./release metadata module from each independently built remote. Check exact id/version plus supported compatibility before loading routes/services. Expose configuration facts in the Host and actual build identity in Cart for verifiable release switching. Remote enabled flags block route/service imports; background flags gate only Host lifecycle auto-start. Business logic and private state remain in their owners.

Publish canonical development/production presets and static-copy tooling. Production domains are clearly marked .example placeholders until real deployment origins are supplied. Add a local immutable Cart release builder and version-aware sample assets to reproduce two-version switching. Preserve origin-root MSW worker support for standalone versioned pages.

## Consequences and evidence

Cart 1.0.0 and 1.1.0 were independently built/served. Updating only the deployed primary registry and reloading selected the new actual Cart build while all 18 Host non-registry files retained SHA-256 ad5f20006855116e21c3bea034cf12d3d3adc11686a184c85b7461fdec4fb93b. Saved cart data, owner event flow and standalone execution still worked. Fallback, flags, trust failure and mobile layout were browser verified.

The trusted deployment controls policy integrity; an allowlist is not a sandbox or a cryptographic code guarantee. Release metadata declares compatibility and the federation runtime still negotiates shared packages. Fallback addresses configuration failures, not a new automatic rollback after executable remote code has loaded. Native import failures may require reload. Production deployment/header automation and further resilience remain future stages.
