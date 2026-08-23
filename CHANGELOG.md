# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

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

Stabilization and release closure baseline for v0.11.0 milestone.

### Added

- Synchronized release governance and release closure metadata.

## [0.10.0] - 2026-08-22

Functional convergence continuation baseline for the Nexa Buyer Portal.

### Added

- Integrated the current buyer availability, Purchase Request and delivery continuation surface.
- Consolidated the Angular dependency baseline while preserving Buyer-safe boundaries.

### Validation

- Catalog asset validation, tests, production build and CI gates passed.

## [0.7.1] - 2026-08-18

Buyer availability and delivery-tracking stabilization.
