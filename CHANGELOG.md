# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

## [0.16.0] - 2026-08-28

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

## [0.15.0] - 2026-08-28

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

## [0.14.0] - 2026-08-26

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

## [0.13.0] - 2026-08-26

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

## [0.12.0] - 2026-08-23

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

## [0.11.0] - 2026-08-23

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

## [0.10.0] - 2026-08-22

Functional convergence continuation baseline for the Nexa Buyer Portal.

### Added

- Integrated the current buyer availability, Purchase Request and delivery continuation surface.
- Consolidated the Angular dependency baseline while preserving Buyer-safe boundaries.

### Validation

- Catalog asset validation, tests, production build and CI gates passed.

## [0.7.1] - 2026-08-18

Buyer availability and delivery-tracking stabilization.
