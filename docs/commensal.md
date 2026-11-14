# COMMENSAL: independent profile

COMMENSAL runs at http://127.0.0.1:5003 and exposes `./routes` for the Host's /profile route. Its standalone entry supplies the shared MUI theme and StandaloneShell; embedded mode uses the Host providers. There are no imports from another app.

## Ownership

`profile.ts` owns the mock profile, Zod validation, persistence schema, and avatar initials. `routes.tsx` owns saved/draft state, edit/save/cancel, validation feedback, and storage error recovery. Name, email, full address, favorite habitat, preferred language, and three notification preferences are editable. Saving validates and writes before accepting the draft; Cancel restores the saved values. Initials update from the saved name.

The version-1 record at `microverse:commensal:v1:profile` is private, origin/tab-scoped sessionStorage. Reload preserves saves; leaving the Host route discards unsaved drafts. Corrupt data is preserved and reported with an explicit Reset demo profile action. Failed writes keep the draft and prior saved record. No other app or shared package reads it. Profile data is not sent through MYCELIUM.

This is a local demo, not an authenticated account. Notification selections do not send messages and preferred language does not translate the interface. The avatar uses initials; no upload or external image service is needed.

## Verification and commands

Use `pnpm --filter @microverse/commensal dev`, `test`, `typecheck`, `build`, or `preview`. Dev/preview use strict port 5003. Stop dev before preview.

Tests cover standalone/embedded layout, avatar, edit/save/remount, separate drafts/cancel, invalid fields, failed persistence, corrupt data/reset, and label overrides. Browser checks cover federated and standalone editing, preference persistence on Host reload, separate standalone-origin state, responsive layout, production loading, and contained offline entry recovery. See [federation](module-federation.md).

## Stage 8 data layer

Profile GET/PATCH now pass through owner-local MSW handlers and a private TanStack Query cache. Drafts are accepted only after successful persistence; failed PATCH preserves the draft and saved profile. Explicit reset also uses the mock API. See [mock APIs](mock-apis.md) for contracts, fault scenarios and verification.

## Stage 9 runtime configuration

NUCLEUS now selects remote entries from validated runtime JSON; earlier Host VITE_*_REMOTE_ENTRY descriptions are superseded. Each remote exposes ./release with build identity and compatibility, checked before its routes/lifecycle facade. Owner APIs, private state, and MYCELIUM contracts remain unchanged. See [NUCLEUS](nucleus.md).

## Final integration

A successful persisted save publishes microverse:profile:updated through MYCELIUM with only the browser-tab scope. Name, email, address and preferences are never copied into that event or the Host feed. Validation/storage failures publish no successful save fact. Profile remains independently owned and persisted; final browser acceptance verifies Host refresh persistence and an unchanged standalone-origin seed.
