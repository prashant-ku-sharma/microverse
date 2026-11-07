# Architecture

## Current implementation: Stage 1

MICROVERSE contains five independent React/Vite applications in a pnpm workspace. Each is a standalone browser entry point and a separately buildable static artifact. There is currently no Host/remote integration. The ecosystem app is an identifying page, like the other four apps.

Each app imports only its own source and genuine shared infrastructure. There are no imports between applications and no centralized business store. No federation library has been selected or configured in Stage 1.

## Shared infrastructure

| Package                    | Current export                       | Intended boundary                          |
| -------------------------- | ------------------------------------ | ------------------------------------------ |
| `@microverse/shared-ui`    | `microverseTheme`                    | MUI visual infrastructure                  |
| `@microverse/config`       | Empty root, `./vite`, `./test-setup` | Development configuration                  |
| `@microverse/shared-types` | Empty module                         | Genuine cross-app contracts                |
| `@microverse/mycelium`     | Empty module                         | Event infrastructure, never business state |
| `@microverse/mock-utils`   | Empty module                         | Shared mock infrastructure                 |

Source exports keep development simple. Applications bundle shared source into their own build output; no package distribution or publication is needed at this stage. This is build-time infrastructure sharing, not runtime Module Federation.

## Toolchain decisions

- pnpm workspaces and a committed lockfile provide a single dependency graph; a catalog aligns React, MUI, Emotion, and Vite versions.
- Node 24 LTS is the supported runtime. React 19, Vite 8, MUI 9, and Vitest 5 are stable selected releases. TypeScript 5.9 stays within typescript-eslint's supported range; TypeScript 7 is intentionally not selected.
- Strict TypeScript is inherited by every workspace project, with unchecked indexed access and exact optional property checks enabled.
- ESLint flat configuration checks TypeScript, React Hooks, and refresh compatibility. Prettier owns formatting.
- Material UI with Emotion is the styling baseline. A minimal dark theme supplies forest surfaces and emerald/violet accents. Each standalone app owns its provider and baseline reset.
- Each app uses the same Vite factory but supplies its own strict port, making config consistent without coupling business logic.
- Vitest and React Testing Library check each app's identifying page and public label override; shared cleanup prevents DOM leakage.

Official references: [Vite requirements](https://vite.dev/guide/), [MUI installation](https://mui.com/material-ui/getting-started/installation/), [pnpm parallel execution](https://pnpm.io/cli/run#--parallel), and [typescript-eslint dependency support](https://typescript-eslint.io/users/dependency-versions/). Peer dependency compatibility was checked against npm registry metadata during implementation. The selected federation library's official configuration and runtime documentation must be verified when federation is implemented.

## Future architecture (not implemented)

Ecosystem will own composition, routing, runtime registry, simulated authentication, and remote error boundaries. Parasite, Symbiont, Commensal, and Mutant will own products, cart, profile, and offers respectively. Mycelium will carry typed CustomEvent envelopes validated at runtime. Consumer absence will require persistence or reconciliation in the appropriate owner; events are not durable delivery.

Remotes must remain independently runnable and deployable. Runtime federation will use the selected library's supported APIs, configurable remote URLs, aligned shared dependencies, and isolated failure states. A remote deployment must not require a Host rebuild. Deployment automation and the registry are intentionally deferred.
