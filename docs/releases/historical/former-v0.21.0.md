# HISTORICAL RELEASE RECORD — FORMER PUBLIC LABEL v0.21.0 — NOT A CURRENT RELEASE

## Summary

Buyer Sales Order delivery-source recovery for the existing delivery tracking contract.

## Why

Sales Order detail treated a failed delivery lookup as an empty delivery list. That made a technical source failure indistinguishable from a genuine order with no delivery projection and could leave the Buyer-facing flow in a misleading pending state.

## Scope

- Show an explicit loading state while the delivery projection is requested.
- Keep the Sales Order detail and its server-backed data visible when the delivery source fails.
- Show an explicit unavailable state with a retry action for the delivery source only.
- Restore the delivery tracking link after a successful retry without reloading the Sales Order detail.
- Reuse the released Design Lab v1.0.2 tokens and public Nexa component contracts.

## Architecture impact

- No new endpoint, entity, domain state or dependency.
- Existing `SalesOrderDeliveryPort` and delivery tracking API projection remain unchanged.
- Portal continues to own Buyer presentation state only; the API remains authoritative for delivery truth.

## Security and tenant impact

- No authorization or tenant predicate changed.
- The UI no longer infers “no delivery” from a failed API call and does not manufacture fallback delivery data.
- `COMPANY_OWNER`, `SALES`, `WAREHOUSE` and `LOGISTICS`/Dispatch remain Platform concerns. `BOM` remains OPEN/DEFERRED because no accepted contract exists.

## Validation

- `npm test`: 131 tests across 65 files passed.
- `npm run build`: passed; existing bundle/style budget warnings remain non-blocking.
- `npm run validate:design-foundations`: passed against local Design Lab v1.0.2 source commit `04e2e4ea83b88792b4dc462d7edb700eb8d3faca`.
- `npm run validate:catalog-assets`: passed with 50 assets.
- `npm run validate:bounded-contexts`: passed for 11 canonical contexts.
- Authenticated `npm run test:e2e` against Docker: 16/16 passed across desktop and mobile.
- `npm audit --omit=dev`: 0 vulnerabilities.
- `git diff --check`: passed.

## Evidence

- Focused unit coverage proves delivery-source failure remains visible and an independent retry restores the delivery link.
- Browser regression covers the live Buyer login, catalog, request builder, orders, delivery and IAM paths against the Docker API.

## Release impact

- Portal version: `0.21.0`.
- Release follows the repository GitFlow policy: feature branch → develop → release branch → main → annotated tag → GitHub Release → back-merge.
