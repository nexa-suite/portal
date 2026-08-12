<div align="center">

<img src="./docs/assets/nexa.svg" alt="Nexa Logo" width="250"/>

# Nexa Buyer Portal

Buyer-facing B2B workspace for catalog discovery, purchase requests, orders, delivery visibility and account self-service.

[![Angular 22](https://img.shields.io/badge/Angular-22-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev/) [![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Angular Material 22](https://img.shields.io/badge/Angular%20Material-22-757575?style=flat-square&logo=materialdesign&logoColor=white)](https://material.angular.dev/) [![Release v0.7.0](https://img.shields.io/badge/release-v0.7.0-2563EB?style=flat-square)](https://github.com/nexa-suite/portal/releases/tag/v0.7.0)

[Changelog](./CHANGELOG.md) · [Release notes](./docs/releases/) · [Contributing](./.github/CONTRIBUTING.md) · [Security](./.github/SECURITY.md)

**Current repository:** Portal · **Latest published release:** `v0.7.0` · **Development version:** `0.7.1`

[Website](https://github.com/nexa-suite/website) · [Platform](https://github.com/nexa-suite/platform) · [Portal](https://github.com/nexa-suite/portal) · [API](https://github.com/nexa-suite/api) · [Mobile](https://github.com/nexa-suite/mobile)

</div>

---

## What is implemented

`v0.7.0` packages Angular 22 Buyer access foundations, Product Catalog discovery/detail, Purchase Request and Sales Order flows, plus Buyer-safe delivery tracking.

Current `develop` artifact `0.7.1` contains development stabilization for availability states, delivery tracking and recoverable loading/error/retry states. This material is not a published release.

Portal is the buyer experience and is separate from internal Platform. This release integrates the secured Buyer IAM/session/catalog read contract with the API; broader buyer workflows, persistence beyond the API contract and production deployment are not implemented here.

## Product boundaries

```mermaid
flowchart LR
    Website["Website<br/>Static public site<br/>v1.0.0"]
    Platform["Platform<br/>Angular 22 secured surface<br/>v0.7.0"]
    Portal["Buyer Portal<br/>Angular 22 secured surface<br/>v0.7.0"]
    API["API<br/>IAM, tenant scope and commercial workflows<br/>v0.8.0"]

    Website -. "product navigation" .-> Platform
    Website -. "product navigation" .-> Portal
    Platform -. "secured IAM and Catalog read contract" .-> API
    Portal -->|"secured IAM and Catalog read contract"| API
```

The Portal link is the approved secured vertical slice for this release. Mobile is not implemented and is intentionally absent from the runtime map. PostgreSQL, AI, IoT and cloud services remain outside this frontend release.

![Nexa Suite repository map](./docs/assets/repository-map/nexa-suite-map.svg)

## Repository map

| Repository | Latest published release | Responsibility | Evidence status |
|---|---:|---|---|
| [Website](https://github.com/nexa-suite/website) | `v1.0.0` | Static public product discovery | Released static site |
| [Platform](https://github.com/nexa-suite/platform) | `v0.7.0` | Internal operations shell | Angular 22 secured commercial, Warehouse and Logistics surface; Docker runtime |
| **Portal** | **`v0.7.0`** | Buyer self-service shell | Angular 22 secured commercial and delivery surface; Docker runtime |
| [API](https://github.com/nexa-suite/api) | `v0.8.0` | Business and integration authority | IAM, tenant scope, commercial, Warehouse and Logistics workflows |
| [Mobile](https://github.com/nexa-suite/mobile) | `v0.1.1` | Future native clients | Documentation-only |

## Bounded contexts

| Area | Current maturity |
|---|---|
| IAM | Secured client/API slice |
| Catalog Management | Secured read slice; shared local reference seed |
| Sales from buyer perspective | Purchase Request builder and self-service lifecycle |
| Logistics tracking | Buyer delivery tracking in `v0.7.0` |
| Invoicing documents and payments | Planned |

## Architecture

Presentation depends on Application. Application depends on Domain. Infrastructure remains outside Domain. Buyer-facing models and API adapters require an approved vertical slice and an explicit contract; Portal does not own internal administration or backend business rules.

## Tech stack

Angular 22, TypeScript strict mode, Angular Material/CDK 22, Signals, RxJS, `ngx-translate` 18, SCSS and npm 11.17.0 as declared by `package.json`.

## Getting started

```bash
npm ci
npm start
```

Open [http://localhost:4300](http://localhost:4300) and navigate to `/home`.

## Available commands

```bash
npm run validate:catalog-assets
npm test
npm run build
```

## Project structure

```text
src/app/core/                                      # Shell, routes and language service
src/app/shared/presentation/components/            # Reusable visual components
src/app/shared/application/utilities/              # Pure address, date and number utilities
public/catalog-items/                              # Manifest-validated canonical media subset
src/styles/                                        # Tokens, typography, motion, Material and a11y
docs/assets/repository-map/                        # Local architecture map
docs/releases/                                     # Versioned release notes
```

## Documentation

- [Release notes index](./docs/releases/)
- [Release policy](./.github/RELEASE_POLICY.md)

## Roadmap boundary

Future buyer vertical slices require explicit contracts, buyer identity, tenant rules and runtime/browser evidence. Planned database, AI, IoT, cloud and mobile capabilities must not be described as Portal implementation until those gates pass.
