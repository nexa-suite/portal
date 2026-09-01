# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

## Historical consolidation

Former release labels and retired implementation snapshots remain below as
historical evidence. Current public headings use the normalized sequence.

## [0.12.0] - 2026-08-29

Former historical label: `v0.26.0`.

API-only production composition for the Buyer Portal.

### Changed

- Production bootstrap and route composition bind the existing HTTP adapters
  directly to the application ports for authentication, security, change feed,
  notifications, payments, catalog, buyer account, purchase requests, sales
  orders, deliveries, receivables and business documents.
- Browser runtime no longer imports the mock data-mode provider composition.
- Notification facade wiring now uses the canonical `NotificationsApiPort`,
  with a provider regression test covering the production binding.

### Boundary

- Portal remains Buyer-only; Platform roles and Dispatch remain outside the
  Portal projection.
- No endpoint, entity, state, persistence model or cross-context contract was
  introduced. `BOM` remains `OPEN`/`DEFERRED`.
- Mock adapters remain available only for isolated tests; they are not a
  browser-runtime data source.

### Validation

- Portal unit suite: 136 tests across 67 files passed.
- Production build passed with existing bundle/style budget warnings.
- Browser E2E passed 16/16 against the isolated API runtime in local
  verification and in the mandatory CI verification job.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Design Lab v1.0.2 foundation, catalog-asset and bounded-context validators
  passed.

## Historical release records

### Former historical label `v0.25.0` - 2026-08-29

API-only Purchase Request summaries and runtime hardening.

### Added

- Purchase Request list cards now expose the server-provided `lineCount` and
  show product lines only when the response actually includes detail lines.
- Focused coverage for summary mapping, list rendering and API-only runtime
  configuration.

### Changed

- Browser runtime ignores mock data switches and resolves the existing HTTP
  adapters for the Buyer Portal.
- Purchase Request route composition keeps the existing application ports and
  API contracts; list responses no longer imply fabricated product details.

### Boundary

- Portal remains Buyer-only. Platform roles and Dispatch remain outside the
  Portal projection.
- `BOM` remains `OPEN`/`DEFERRED`: no accepted role, endpoint, entity, state or
  lifecycle contract was invented.
- Mock adapters remain available only for isolated tests; they are not a
  browser-runtime data source.

### Validation

- Portal unit suite: 135 tests across 66 files passed.
- Production build passed with existing bundle/style budget warnings.
- Design Lab v1.0.2 foundation, catalog-asset and bounded-context validators
  passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Pull request #56 CodeQL and both CI verification checks passed.
- No authenticated live API smoke is claimed; the local API endpoint was not
  available during release preparation.

### Former historical label `v0.24.0` - 2026-08-29

Design Lab-aligned Buyer Catalog and cart interaction hardening.

### Added

- Buyer Catalog list and detail surfaces now use the Design Lab visual foundation, responsive product-card composition and canonical Nexa icons.
- Product cards expose an accessible quantity stepper that increments, decrements and removes cart lines without turning the browser cart into authoritative inventory state.
- Broken product media now degrades to an explicit catalog placeholder instead of a raw fallback character.

### Changed

- Catalog filters, product identity, offer status, cold-chain status, pricing context and detail actions use tokenized, responsive styles aligned with the legacy Vue evidence.
- The catalog page CTA uses the canonical Buyer “Crear solicitud” label; the existing cart badge remains the source of visible draft-line count.
- Existing HTTP catalog and cart ports remain in place; no endpoint, entity or backend business rule was invented.

### Boundary

- Portal remains Buyer-only. `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch remain Platform permission concerns.
- `BOM` is not introduced because the accepted API and Blueprint do not define a canonical role, endpoint, entity or lifecycle contract for it.
- Mock mode remains an explicit demo/test mode; the default catalog path remains the existing API-backed client.

### Validation

- Portal unit suite: 131 tests across 65 files passed.
- Production build passed; existing initial-bundle and component-style budget warnings remain non-blocking.
- Design Lab v1.0.2 foundation validator passed with 50 catalog assets.
- Bounded-context validator passed for 11 canonical contexts.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Authenticated Playwright ICISA mock smoke passed at 1200 px and 390 px; cart interaction verified 0 → 1 → 2 → 1 → 0 and no horizontal overflow was observed.
- `git diff --check` and both locale JSON parses passed.

### Former historical label `v0.21.0` - 2026-08-28

Buyer Sales Order delivery-source recovery.

### Added

- Sales Order detail now distinguishes delivery-source loading from an unavailable delivery lookup.
- An independent retry action recovers the existing delivery projection without reloading the Sales Order detail.

### Changed

- Buyer order detail no longer presents a failed delivery lookup as pending or empty tracking.
- Delivery-source feedback uses existing Nexa loading, button and semantic warning primitives.

### Boundary

- Portal remains Buyer-only; `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch stay Platform permission concerns.
- `BOM` remains OPEN/DEFERRED because no accepted role, endpoint, entity or lifecycle contract exists.
- API, Blueprint, Design Lab and Vue/legacy repositories were not modified; the existing API delivery projection remains authoritative.

### Validation

- Portal unit suite: 131 tests across 65 files passed.
- Design Lab v1.0.2 foundation, catalog asset and bounded-context validators passed.
- Production build passed with existing bundle/style budget warnings.
- Authenticated Buyer E2E against Docker: 16/16 passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `git diff --check`: passed.

### Former historical label `v0.20.0` - 2026-08-28

Buyer API source-state recovery and honest payment-history feedback.

### Added

- Buyer Home now distinguishes an unavailable `Client Account` lookup from a genuinely unlinked Buyer account.
- Available API-backed Home sources remain visible when the account lookup fails, with an explicit retry action.
- Receivables payment-history failures now remain visible with an accessible retry action instead of rendering as an empty history.

### Changed

- Partial Home data notices use Nexa semantic tokens and the shared Button component for the recovery action.
- Payment history loading was extracted into a reusable component method so opening and retrying the same receivable follow one state path.

### Boundary

- Portal remains Buyer-only. `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch remain Platform permission concerns.
- `BOM` is not introduced because the accepted API and Blueprint define no canonical role, endpoint, entity or lifecycle contract.
- No API, Blueprint, Design Lab or legacy source was modified; the release uses existing Buyer contracts.

### Validation

- Portal unit suite: 130 tests across 64 files passed.
- Design Lab v1.0.2 foundation, catalog asset and bounded-context validators passed.
- Production build passed with existing bundle/style budget warnings.
- Authenticated Buyer E2E against Docker: 16/16 desktop and mobile tests passed.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `git diff --check`: passed.

### Former historical label `v0.19.0` - 2026-08-28

API-backed Buyer order telemetry and explicit action feedback.

### Added

- Buyer order cards now expose the route and temperature status returned by the existing delivery API projection.
- Delivery client mapping preserves the API `Client Account`, nested route assignment, temperature range and POD context.
- Partial delivery/document failures are visible to the Buyer instead of looking like complete empty projections.

### Changed

- Removed fabricated pending-weight, route and temperature values from the Buyer Sales Order list; line units and server delivery telemetry are now rendered.
- Notification mark-read actions expose API failures through the existing localized error treatment without mutating the last successful inbox.
- Explicit mock delivery fixtures carry the same optional telemetry shape while API mode remains the runtime default.

### Boundary

- Portal remains Buyer-only. `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch remain Platform permission concerns.
- `BOM` is not introduced because the accepted API and Blueprint define no canonical role, endpoint, entity or lifecycle contract.
- API, Blueprint, Design Lab and Vue/legacy sources were not modified.

### Validation

- Portal unit suite: 127 tests across 63 files passed.
- Design Lab v1.0.2 foundation, catalog asset and bounded-context validators passed.
- Production build passed with existing bundle/style budget warnings.
- Authenticated Buyer canonical E2E against Docker: desktop and mobile 2/2 passed.
- `npm audit --omit=dev`: 0 vulnerabilities.

### Former historical label `v0.18.0` - 2026-08-28

API continuity and server-owned delivery origin.

### Changed

- Request Builder now reads the fulfilment warehouse and route origin from the canonical purchase-request draft snapshots returned by the API.
- Reloaded drafts can restore the server route preview and its traceable origin without relying on the workspace slug or a browser-side warehouse constant.
- Payment history failures remain visible through the existing explicit page error and retry state instead of becoming an empty payment history.

### Boundary

- The Portal remains Buyer-only; internal `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch role separation remains a Platform permission concern.
- `BOM` is not introduced because the current accepted API/Blueprint contract does not define that role or capability.

### Validation

- Canonical Request Builder unit tests cover pending origin state and server snapshot hydration.
- Live E2E asserts warehouse selection and route-origin snapshots returned by the API.

### Former historical label `v0.17.0` - 2026-08-28

Server-backed Buyer Request Builder continuity.

### Added

- Persisted the active canonical Purchase Request Draft pointer so catalog navigation can resume the server-owned draft instead of relying on a local cart as business truth.
- Started the canonical draft and replaced its lines when a buyer moves from Catalog into Request Builder, preserving the existing interaction cart only as presentation state.
- Added the API-backed draft review contract and readiness check before preview/submit, with focused HTTP mapper coverage.
- Added authenticated E2E assertions for draft creation, line replacement, route preview and review against the existing API contract.

### Changed

- Rehydrated the Request Builder from the canonical draft route or scoped server-draft pointer and clear the pointer after terminal submit/abandon states.
- Preserved the buyer-only Portal boundary; internal roles such as `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch remain Platform concerns, and `BOM` is not introduced without an approved contract.

### Boundary

- API, Blueprint, Design Lab and legacy repositories were not modified by this frontend release.
- The local cart remains recoverable interaction state; the API draft owns lines, prices, readiness, concurrency version and submission state.

### Validation

- Portal unit tests passed: 122 tests across 61 files.
- Portal production build passed; existing bundle/style budget warnings remain non-blocking.
- Live Buyer canonical request E2E passed against the Docker API.

### Former historical label `v0.16.0` - 2026-08-28

Server-authoritative buyer payment preferences and canonical payment choices.

### Added

- Normalization of the buyer account `paymentCondition` returned by API into the canonical Request Builder payment options.
- Request Builder cards for all payment preferences accepted by the existing purchase-request draft contract.
- Accessible radio semantics and localized labels for the expanded payment choices.

### Changed

- Removed the fixed `CREDIT_LINE` initialization; new requests start from the server-provided account condition, with a neutral transfer fallback only when that condition is absent or unrecognized.
- Draft hydration now prefers the persisted server payment preference and only falls back to the server account condition.

### Boundary

- No API, Blueprint or Vue source changed; the existing buyer-account and purchase-request-draft contracts were sufficient.

### Validation

- Buyer Request Builder tests passed (5/5).
- Bounded-context, i18n and diff checks are required before publication.

### Former historical label `v0.15.0` - 2026-08-28

Buyer IAM boundary hardening for the canonical Portal surface.

### Added

- Workspace preview and recognized-workspace gating before buyer credentials are submitted.
- Explicit two-factor challenge boundary with deterministic mock verification and an API-mode capability error when the backend contract does not expose a second-factor endpoint.
- Shared sign-in structure and language switching behavior aligned with Platform while preserving the buyer-only surface.
- Catalog-owned request cart shared by catalog list, detail and the four-step Request Builder; empty carts link back to Catalog instead of exposing a second selector.
- Business-day delivery-date rules, server route preview and embedded Google Maps route in the buyer delivery step.
- Design provenance synchronized to Nexa Design Lab v1.0.2 with source-checked consumer tokens.

### Changed

- Prevented API-mode bootstrap from manufacturing an authenticated buyer session when refresh has no valid backend session.
- Kept the buyer shell capability-safe and aligned the Request Builder action flow with the local Vue reference.
- Kept password recovery and reset behind the existing unauthenticated API boundary; email delivery remains backend-owned.
- Raised the Portal initial-bundle warning threshold to `550 kB` to accommodate the explicit workspace/2FA auth boundary; the error threshold remains `1 MB`.

### Validation

- 116 unit tests passed across 59 files.
- Bounded-context, catalog-asset and Design Lab foundation validators passed.
- Production build passed; initial bundle `590.68 kB` exceeds the `550 kB`
  warning budget but remains below the `1 MB` error budget.
- Production dependency audit reported zero vulnerabilities.
- Browser evidence: ICISA workspace preview, Portal 2FA, catalog-to-cart, four-step Request Builder, embedded map and submit completed without console errors; one non-blocking LCP lazy-loading warning remains.

### Boundary

- No API, Blueprint canonical definition or Vue source was changed.
- No Portal organization-registration flow was added because it is not present in the canonical Portal/Vue surface.
- API mode remains the default; mock sessions are in-memory and do not claim backend persistence, email delivery or production 2FA.
- Blueprint marks detailed Web acceptance criteria as pending; this release does not claim 100% of those pending criteria.

### Former historical label `v0.14.0` - 2026-08-26

Runtime mock slices for generic and ICISA buyer workspaces across the canonical frontend boundaries.

### Added

- Runtime-selectable `api` and local `mock` modes with deterministic `generic` and `icisa` buyer fixtures.
- Mock adapters behind application ports across the implemented buyer-safe
  surfaces of BC-01 through BC-10, plus the local BC-11 change-feed
  projection: delivery, sales orders, receivables, payments, documents and
  notifications are available in the offline demo.
- Offline no-op change-feed adapter for mock mode; the existing SSE stream remains the API-mode adapter.
- Functional baseline and mock-mode documentation for the executable Buyer
  Portal slices.

### Changed

- Preserved buyer navigation and REST contracts while making the implemented
  buyer-safe flows executable without the API.
- Kept tenant profile selection in runtime configuration and infrastructure composition, outside the domain layer.
- Moved the first home and receivables composition dependencies behind application-facing boundaries.
- Adjusted the initial production budget for the explicitly included mock adapter baseline.

### Validation

- Bounded-context, catalog-asset and Design Lab foundation validators passed.
- 111 unit tests passed across 57 test files.
- Angular production build passed with a `533.48 kB` initial bundle and no budget warning.
- Production dependency audit reported zero vulnerabilities; `git diff --check` passed.
- Local Playwright evidence passed for ICISA login, catalog, four-step request builder, submit, list and detail without console errors.

### Boundary

- No API endpoints, API contracts or Blueprint canonical definitions were changed.
- Mock state is in-memory and intentionally does not simulate backend
  persistence, authorization, jobs or webhooks.
- This remains a PRE-V1 functional foundation; it does not claim complete product migration or Production Readiness.

## [0.11.0] - 2026-08-26

Former historical label: `v0.13.0`.

Canonical bounded-context layering and Angular composition release for the Nexa Buyer Portal.

### Added

- Canonical direct bounded-context roots aligned with the API vocabulary, each with explicit `application`, `domain`, `infrastructure` and `presentation` layers.
- Application ports and explicit ACL gateways for cross-context buyer, catalog and delivery collaboration.
- Executable bounded-context validation for the eleven canonical contexts, layer direction, legacy-root removal and domain isolation.

### Changed

- Reorganized implemented Portal features under their canonical bounded contexts while preserving routes and REST contracts.
- Moved HTTP adapters behind application-facing ports and kept cross-context translation explicit.
- Lazy-loaded the home surface and feature-scoped adapter providers so the initial bundle remains below its configured budget.
- Corrected the translation asset loader path so public routes resolve language files in the browser.

### Validation

- Bounded-context, catalog-asset and Design Lab foundation validators passed.
- 97 unit tests passed across 51 test files.
- TypeScript no-emit compilation and Angular production build passed with a `473.24 kB` initial bundle.
- `git diff --check` passed.

### Boundary

- No API endpoints, API contracts or Blueprint canonical definitions were changed by this release.
- This remains a PRE-V1 architecture release; it does not claim complete product migration or Production Readiness.

## [0.10.0] - 2026-08-23

Former historical label: `v0.12.0`.

Visual and interaction convergence baseline using Nexa Design Lab (v1.0.1) tokens and components.

### Added

- Added standardized standalone presentation primitives: `nexa-numeric-stepper`, `nexa-segmented-control`, `nexa-surface`, and `nexa-button`.
- Integrated `nexa-numeric-stepper` and `nexa-segmented-control` across Buyer Request Builder.
- Added comprehensive unit tests for all presentation components (`94/94 tests passing`).

### Changed

- Restored and aligned the canonical 4-step buyer ordering sequence (`requestReview -> commercialDelivery -> paymentTerms -> confirmation`).
- Aligned Portal Shell routing, navigation permissions, and footer navigation.
- Bumped workspace package baseline to `0.12.0`.

### Validation

- Unit tests (`100% PASS`), Design Lab v1.0.1 token checksum validation (`PASS`), catalog asset validation (`PASS`), and production build (`PASS`).

## [0.9.0] - 2026-08-23

Former historical label: `v0.11.0`.

PRE-V1 Architecture & Governance Foundation release for the Nexa Buyer Portal.

### Added

- Canonical 4-step buyer request workflow: Request Review, Commercial & Delivery, Payment Terms, and Confirmation.
- Nexa Design Lab v1.0.1 design token integration with WCAG AAA accessibility compliance.
- Buyer-scoped authentication state management and permission-based navigation.
- Unified notification deep-link routing and badge synchronization.

### Changed

- Realigned buyer routing to strictly conform to the Blueprint Frontend Product Contract.
- Hardened buyer access boundaries against internal operations leakage.

### Known limitations

- This milestone does not represent Nexa V1 functional completion or Production Readiness.

### Validation

- Catalog asset validation passed.
- Design Lab token and foundation validation passed.
- 90 unit tests passed across 44 test suites.
- Angular production build succeeded.

## [0.8.0] - 2026-08-22

Former historical label: `v0.10.0`.

Functional convergence continuation baseline for the Nexa Buyer Portal.

### Added

- Integrated the current buyer availability, Purchase Request and delivery continuation surface.
- Consolidated the Angular dependency baseline while preserving Buyer-safe boundaries.

### Validation

- Catalog asset validation, tests, production build and CI gates passed.

## [0.7.0] - 2026-08-18

Former historical label: `v0.7.1`.

Buyer availability and delivery-tracking stabilization.
