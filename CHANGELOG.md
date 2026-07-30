# Changelog

All notable changes to this project are documented in this file.
The project uses Semantic Versioning.

## [0.6.0] - 2026-07-30

### Added

- Buyer Sales Order list/detail, source-request link and event timeline.
- Secure change-feed reconnect behavior with logout disconnect and one token refresh attempt.
- Portal CI, CodeQL and Dependabot configuration.

### Security

- Buyer Sales Order actions are read-only; internal lifecycle mutations remain outside the Portal surface.
- Change-feed events are consumed only after authenticated API access.

## [0.5.0] - 2026-07-30

This release consolidates previously unreleased Identity, tenant, security and commercial vertical work. Intermediate planned versions were never published.

### Added

- Buyer authentication, Product Catalog and detail, Request Builder, My Requests and Request Detail.
- Server-backed catalog/price snapshots, typed request forms, idempotency handling and focused tests.
- Structural Vue parity improvements for implemented buyer surfaces.

### Security

- Portal accepts `BUYER` only; internal roles are rejected; browser storage is not used for access or refresh tokens.

## [0.3.0] - 2026-07-28

### Added

- Production Dockerfile, Nginx SPA fallback and healthcheck.
- Modern Compose runtime integration on port `4300`.
- Runtime/browser smoke validation for `/home`.

### Changed

- Versioned repository baseline as `v0.3.0` before the approved secured API vertical slice.

## [0.2.1] - 2026-07-28

### Changed

- Redesigned the repository README around the five-product Nexa Suite.
- Standardized repository governance and release documentation.
- Corrected repository metadata and navigation.

### Fixed

- Removed verified duplicate local artifacts.

## [0.2.0] - 2026-07-28

### Added

- Durable Portal shell and `/home` route with responsive buyer navigation and skip link.
- Reusable visual components, language switching, pure formatting utilities and shared tests.
- Normalized SCSS token layers and Angular Material 22 theme integration.
- 50 canonical catalog media assets with checksummed manifest and validation script.

### Changed

- Removed technical architecture messaging from the application surface.

## [0.1.0] - 2026-07-28

### Added

- Independent Angular 22 Buyer Portal application with bounded-context package structure, initial shell and EN/ES translation surface.

[Unreleased]: https://github.com/nexa-suite/portal/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/nexa-suite/portal/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/nexa-suite/portal/compare/v0.3.0...v0.5.0
[0.3.0]: https://github.com/nexa-suite/portal/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/nexa-suite/portal/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/nexa-suite/portal/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nexa-suite/portal/releases/tag/v0.1.0
