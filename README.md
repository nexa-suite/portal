<div align="center">

<img src="./docs/assets/nexa.svg" alt="Nexa Logo" width="250"/>

# Nexa Buyer Portal

Buyer-facing B2B workspace for Nexa Suite's cold-chain organization.

[![Angular 22](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Angular Material](https://img.shields.io/badge/Angular%20Material-22-757575?logo=materialdesign&logoColor=white)](https://material.angular.dev/)
[![Buyer Portal](https://img.shields.io/badge/product-Buyer%20Portal-0891B2)](#role-in-the-nexa-ecosystem)
[![Status](https://img.shields.io/badge/status-baseline%20v0.1.0-16A34A)](#current-status)

[Platform](https://github.com/nexa-suite/platform) · [Portal](https://github.com/nexa-suite/portal) · [API](https://github.com/nexa-suite/api)

</div>

---

## Overview

Nexa Buyer Portal is the independent Angular application for buyer-facing catalog discovery, requests, orders, tracking, documents and support.

## Role in the Nexa Ecosystem

Portal serves B2B buyers. Its shell prioritizes clarity, trust and low cognitive load; it is not a reduced version of Nexa Platform.

```mermaid
flowchart LR
    Buyer["B2B Buyer"] --> Portal["Nexa Buyer Portal<br/>Angular"]
    Portal --> API["Nexa API<br/>Spring Boot"]
```

## Repository Map

| Repository | Responsibility | Technology |
|---|---|---|
| [Platform](https://github.com/nexa-suite/platform) | Internal operations for Sales, Warehouse, Logistics and Administration | Angular |
| **Portal** — This repository | Buyer-facing B2B experience | Angular |
| [API](https://github.com/nexa-suite/api) | Business rules, contracts, security and persistence authority | Spring Boot |

## Scope

- Buyer-facing shell and navigation direction.
- Independent Angular workspace.
- Layered DDD structure per buyer-relevant bounded context.
- Nexa identity and Angular Material adaptation.
- Baseline EN/ES translation surface.

## Architecture

Presentation depends on Application. Application depends on Domain. Infrastructure implements future ports without leaking technical concerns into Domain.

No product, order, buyer account, payment, authentication, persistence or API integration is implemented in this baseline.

## Bounded Contexts

- IAM for buyer identity.
- Catalog Management for authorized catalog visibility.
- Sales for buyer requests and orders.
- Logistics for buyer-visible tracking.
- Invoicing for buyer-visible documents, payments or credit.

## Tech Stack

- Angular 22 standalone components, routing, SCSS and strict mode.
- Angular Material 22 and Angular CDK 22.
- TypeScript, RxJS, Signals and HttpClient.
- ngx-translate 18.
- Node.js and npm.

## Getting Started

```bash
npm ci
npm start
```

Open [http://localhost:4300](http://localhost:4300).

## Available Commands

```bash
npm test
npm run build
```

## Project Structure

```text
docs/assets/                 # Local Nexa documentation asset
public/assets/               # Branding and baseline translations
src/app/core/                # Portal shell, configuration and presentation
src/app/<bounded-context>/   # domain, application, infrastructure, presentation
src/styles.scss              # Nexa tokens and global styles
```

## Current Status

This repository currently contains the approved architecture baseline.

Business capabilities, API integrations, persistence and security will be implemented incrementally through vertical slices.

Release v0.1.0 records this approved baseline; it does not claim production capability.

## Out of Scope

- Authentication.
- API integration.
- Real business screens.
- Persistence.
- Production deployment.
- Complete Vue parity.

## Roadmap

1. Architecture baseline.
2. First approved vertical slice.
3. Security and tenant isolation.
4. Persistence and contracts.
5. Progressive legacy parity.
