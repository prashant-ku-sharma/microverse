# MICROVERSE design system

Stage 2 establishes visual infrastructure in `@microverse/shared-ui`, using Material UI with its Emotion styling engine. All five apps consume the same theme through the workspace package. The Host supplies its own React Router links; shared UI has no routing, business data, state store, or remote dependencies.

## Foundations

| Token      | Value / usage                                                                         |
| ---------- | ------------------------------------------------------------------------------------- |
| Background | `#0b1210`, charcoal forest canvas                                                     |
| Surface    | `#121d18`, raised habitat panels                                                      |
| Primary    | `#73e5b0`, emerald actions and focus rings                                            |
| Text       | `#edf5ef` primary, `#a5b8ac` secondary                                                |
| Divider    | `#29372f`, restrained separation                                                      |
| Organisms  | Blue Parasite, violet Symbiont, amber Commensal, coral Mutant                         |
| Spacing    | 8px unit; `sx` values 1, 2, 3, 4, 5 represent 8–40px                                  |
| Shape      | 16px default card radius; buttons use 9px                                             |
| Typography | Avenir Next, Segoe UI, system sans-serif; responsive h1 and compact tracked overlines |

Use `microverseTheme.spacing()` or MUI `sx` spacing for layouts. Use explicit `px` units for one-pixel decorations: numeric `height: 1` in MUI means 100% height. Layout tokens expose a 248px desktop sidebar and a 1440px maximum content width. MUI breakpoints remain the defaults: sm 600px, md 900px, lg 1200px, xl 1536px.

The global baseline adds a subtle green glow, visible keyboard focus, and reduced-motion support. Buttons have consistent touch-friendly sizing and no elevation. Cards and papers remove MUI's default gradient overlays. Colors accompany text labels; status is never conveyed through color alone.

## Exports

| Export                                             | Contract                                                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `microverseTheme`                                  | Custom dark theme for each app's own ThemeProvider                                                                                          |
| `layoutTokens`, `organismColors`, `OrganismAccent` | Shared layout/color constants and accent type                                                                                               |
| `ActionButton`                                     | Standard Button props with primary/secondary intent; retains disabled and event semantics                                                   |
| `SurfaceCard`                                      | Outlined MUI Card with responsive padding, Card props, and caller `sx` overrides                                                            |
| `StatusIndicator`                                  | Explicit label and neutral/success/warning/error tone; decorative dot is hidden from assistive technology                                   |
| `LoadingIndicator`                                 | Accessible status region with label and decorative spinner                                                                                  |
| `PageHeader`                                       | Eyebrow, h1, description, optional action; stacks on small screens                                                                          |
| `OrganismMark`                                     | Decorative inline SVG cellular motif with accent and size                                                                                   |
| `OrganismCard`                                     | Presentation-only name/title/description/index/accent, a caller-configurable status label (Placeholder by default), and caller-owned action |

```tsx
import { CssBaseline, ThemeProvider } from '@mui/material';
import {
  microverseTheme,
  ActionButton,
  PageHeader,
} from '@microverse/shared-ui';

<ThemeProvider theme={microverseTheme}>
  <CssBaseline />
  <PageHeader
    eyebrow="HABITAT"
    title="Overview"
    description="A living system."
  />
  <ActionButton onClick={openDetails}>Explore</ActionButton>
</ThemeProvider>;
```

Routing-aware actions can be passed as children/slots, for example `OrganismCard`'s `action` can be a MUI Button with `component={Link}` and `to`. This keeps the library independent of React Router. Runtime organism states will be designed in their requested stage; the default label is `Placeholder`; the Host labels PARASITE as a configured federated remote. This label describes configuration, not live health.

## Host composition and accessibility

The Host uses a permanent sidebar at md and above, and a temporary MUI drawer below md. The temporary drawer supports Escape, backdrop dismissal, a close button, and dismissal after route selection. The header and footer remain in the shell. Navigation uses real links, active `aria-current`, and a skip-to-content link. Route changes update the document title and focus main content. Dashboard cards use a one/two/four-column grid depending on available viewport width.

The organism map is static code-native SVG with an accessible title and description. It is a conceptual diagram, not connectivity telemetry. Application status and recent activity are explicitly labeled placeholders. No decorative controls imply unfinished actions.

## Verification

`pnpm test` includes the shared UI suite and all five app suites. Tests cover theme context and baseline background, button variants and disabled state, loading/status text, headers/cards, sidebar links and active state, direct route rendering, unknown-route recovery, shortcuts, branding override, and mobile drawer behavior. Browser verification covers 390px phone, 768px tablet, and 1440px desktop layouts with no horizontal overflow.

References: [MUI theming](https://mui.com/material-ui/customization/theming/), [responsive drawers](https://mui.com/material-ui/react-drawer/#responsive-drawer), and [React Router declarative navigation](https://reactrouter.com/start/declarative/navigating).
