# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

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
