# Final acceptance and delivery

Verification date: 2026-11-14 (Asia/Kolkata). Status labels below are scoped: Verified means demonstrated in the local/CI scope stated; Partial means an external/live requirement is still pending. No live Netlify deployment has been performed. The final ten-case Playwright run passed without retries in 1.3 minutes, including all A–F scenarios.

| Requirement                                | Status                         | Verification evidence                                                                                                                                                                              |
| ------------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five independent applications              | Verified locally               | Five filtered production builds, root concurrent dev command and standalone browser checks at ports 5000–5004; Playwright standalone/phone case                                                    |
| Runtime Module Federation                  | Verified locally               | Real remoteEntry/chunk loading in Playwright; supported runtime call contract and export/release validation unit tests                                                                             |
| Product-to-Cart communication              | Verified locally               | Playwright A; cart-service tests prove pre-mount durable replay, committed facts, correlation and deduplication                                                                                    |
| Cart-to-Offers communication               | Verified locally               | Playwright B; offer service tests and pricing/quote revision validation                                                                                                                            |
| Independent business state                 | Verified locally               | Owner services/private caches/persistence; Profile Host-vs-standalone persistence assertions and absence of cross-application imports                                                              |
| Runtime remote registry                    | Verified locally               | Zod parsing/origin/flag/fallback tests; browser invalid-registry fallback and real selected-release changes                                                                                        |
| Remote failure isolation                   | Verified locally               | Playwright D/F: controlled HTTP unavailability, recovery and incompatible metadata while other remotes work; boundary/timeout/late-result unit tests                                               |
| Independent deployment                     | Partial                        | Five successful Stage 11 hosted build jobs; publication orchestration tests and independent local artifact publication. Live Netlify publication remains unverified without actual targets/secrets |
| Remote version update without Host rebuild | Verified locally; live pending | Playwright E independently publishes Cart 1.0.1, changes only registry, checks visible version and identical Host artifact SHA-256; no Host build runs during switching                            |
| Rollback                                   | Verified locally; live pending | Playwright E selects retained Cart 1.0.0 again with unchanged Host hash; registry orchestration validates archived snapshots and retains release digests beyond 100 assets                         |
| Unit tests                                 | Verified                       | 221 Vitest tests across 33 files, covering products, Cart/discount arithmetic, events/validation, registry/configuration and shared UI                                                             |
| Integration tests                          | Verified locally               | Cross-owner Cart/Offers/Host integration and cleanup suites, private profile fact/persistence, API failures, plus 10 Node deployment orchestration tests; 231 total unit/integration tests         |
| Playwright tests                           | Verified locally               | All 10 Chromium cases passed without retries: A–F, registry fallback, state feedback, standalone/phone/keyboard/console and checkout                                                               |
| Documentation                              | Verified by review             | Final README, architecture/federation/communication/deployment/development/security/resilience guides, five Mermaid diagrams, decisions and actual milestone history                               |

## Functional evidence

Product-to-Cart uses a ₹1,490 Moss planter. Quantity two gives ₹2,980 subtotal + ₹99 delivery = ₹3,079. WELCOME10 gives ₹298 discount and ₹2,781 final total; removing it restores ₹3,079. These are actual UI assertions against owner-local mock APIs and real federated views, not invented backend transactions. Profile saving persists Jordan Integration Rao/Pune after refresh in the Host origin while standalone COMMENSAL retains Avery Rao. Checkout explicitly simulates payment, emits its completion fact after commit and clears the Host count.

A failed PARASITE entry responds with controlled HTTP 503 in the isolated test fixture, rather than replacing the remote with a fake component. Cart/Profile/Offers remain available; restoring it and retrying recovers. A declared Cart 9.0.0 against the actual 1.0.0 artifact is rejected before routes load. Invalid primary registry selects only a separately validated fallback.

The final run compared all 21 Host artifacts with combined SHA-256 `b8351cd804cc1ae513e916542a15db6031a8cf961d35199edd29260c772bcc83` before promotion, after promotion and after rollback. Actual Cart entry hashes differed: 1.0.0 `42b2b8d65932ebfc4f6031bf8c1e803f059df019615a3c69cc941595f2834dd3`; 1.0.1 `84159f6915e6467a6fd26ca72ed6c3a2fd2673da257520fb057bdc58978e5d86`. This is within-run artifact evidence, not a promise that future builds reproduce those bytes.

Local release evidence is attached to Playwright E and written to ignored deployment/.local/e2e/build-evidence.json. It identifies the local-static-publication scope, Host artifact SHA-256 and actual independently built Cart entry hashes. Live Netlify deployment/promotion/browser gates are separately implemented but remain unexecuted without credentials/targets. See [the exact live procedure](deployment.md#bootstrap-and-critical-symbiont-demonstration).

## UI and command review

The five applications share the MUI/Emotion dark design system and were reviewed in development; production Playwright checks phone width, keyboard skip navigation, mobile drawer navigation, healthy console output, and loading/empty/error feedback. The Host was also reviewed at 390px, 768px and desktop width without horizontal overflow. Review caught and fixed a mobile drawer brand wrap caused by the close button. This is a practical accessibility/keyboard review, not a formal WCAG certification or exhaustive assistive-technology audit.

The root install/dev/build/lint/typecheck/test/Playwright commands are documented in [development](development.md). Source verification, actual full build output and browser assertions are complementary; mocked API/runtime tests alone are not federation evidence. Reports, screenshots and traces remain generated artifacts outside version control.

## Delivered architecture and folder structure

Five app owners under apps/, genuine infrastructure under packages/, deployment registry/scripts/security under deployment/, independent GitHub Actions under .github/workflows/, and actual-artifact browser tests under e2e/. The root README contains the full tree, port table and quick start. Architecture, federation, event, delivery and failure diagrams are in the corresponding guides. No shared Redux store, direct remote source imports, real backend or alternative styling framework was introduced.

## Git milestone history

| Stage | Actual implementation commit                     | Milestone                                  |
| ----- | ------------------------------------------------ | ------------------------------------------ |
| 1     | `8dfdd61`                                        | Workspace foundation                       |
| 2     | `c376f93`                                        | Host shell and MUI design system           |
| 3     | `2b18f54`                                        | PARASITE products                          |
| 4     | `7fc16e0`                                        | Genuine PARASITE federation                |
| 5     | `6ccb034`                                        | SYMBIONT Cart                              |
| 6     | `03863fd`                                        | MYCELIUM communication                     |
| 7     | `7b2e2f3`                                        | COMMENSAL and MUTANT                       |
| 8     | `a048b7a`                                        | MSW owner-local data layers                |
| 9     | `9e02a13`                                        | NUCLEUS runtime registry                   |
| 10    | `cc1320a`                                        | IMMUNE SYSTEM resilience                   |
| 11    | `955f881`                                        | Independent CI/CD                          |
| 12    | Recorded after commit in implementation progress | Final integration, tests and documentation |

Actual timestamps, full hashes, hosted run links and push receipts are preserved in [implementation progress](IMPLEMENTATION_PROGRESS.md). No author/committer dates were altered, history rewritten or force pushes used.

## Known limitations

- Live Netlify deployment, actual CDN/proxy/CSP behavior and live promotion/rollback are not verified. Actual six canonical Netlify targets, protected environments and tokens must be configured first.
- Business data and API responses are mocked; checkout takes no payment. Authentication/account backend, real notifications and translations are absent.
- Persistence/inbox are origin/tab scoped and bounded, not cross-tab/cross-origin or account synchronization. Informational events are transient; the Host feed records only metadata observed while mounted.
- Module load success is not a health check. Boundaries do not sandbox federation code or catch every asynchronous failure; approved remotes execute in the Host security context.
- Failed imports can require a fresh document; unsaved edits may be lost on Retry remote. Native imports are not cancelled by the visible timeout.
- Previous releases grow platform storage. Worker migrations, release garbage collection, custom-domain adapter support and competing external publishers need reviewed operational work.
- Mock coupons expire after 2027-12-31 UTC. Shared Host MUI chunk-size and jsdom scrollTo notices remain non-blocking; a transitive jsdom dependency's deprecation is reported without silently upgrading unrelated versions.
