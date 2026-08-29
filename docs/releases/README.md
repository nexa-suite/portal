# Portal release notes

Release notes are scoped to the Buyer Portal repository and distinguish the buyer shell from future B2B workflows.

| Release | Summary |
|---|---|
| [v0.20.0](./v0.20.0.md) | Buyer API source-state recovery and payment-history feedback |
| [v0.19.0](./v0.19.0.md) | API-backed Buyer delivery telemetry and action feedback |
| [v0.16.0](./v0.16.0.md) | Server-authoritative buyer payment preferences |
| [v0.15.0](./v0.15.0.md) | Workspace-aware IAM and Vue-aligned buyer request flow |
| [v0.14.0](./v0.14.0.md) | Runtime mock slices for generic and ICISA buyers |
| [v0.13.0](./v0.13.0.md) | Canonical bounded-context layering and Angular composition |
| [v0.12.0](./v0.12.0.md) | Visual and interaction convergence baseline |
| [v0.11.0](./v0.11.0.md) | PRE-V1 Architecture & Governance Foundation Buyer Portal baseline |
| [v0.10.0](./v0.10.0.md) | Functional convergence continuation Buyer Portal baseline |
| [v0.7.1](./v0.7.1.md) | Buyer availability and delivery-tracking stabilization |
| [v0.7.0](./v0.7.0.md) | Consolidated Buyer commercial and delivery tracking surface |
| [v0.5.0](./v0.5.0.md) | Buyer access, Catalog and Purchase Request self-service |
| [v0.3.0](./v0.3.0.md) | Docker runtime, repository foundation and browser smoke |
| [v0.2.1](./v0.2.1.md) | Repository experience and governance update |
| [v0.2.0](./v0.2.0.md) | Responsive buyer shell, shared UI foundations and catalog assets |
| [v0.1.0](./v0.1.0.md) | Initial Angular buyer repository baseline |

## Historical material

| Draft | Status |
|---|---|
| [UNRELEASED HISTORICAL CANDIDATE: v0.6.0](./v0.6.0.md) | Consolidated into later published work; no tag or GitHub Release |

Current release is `0.20.0`. Buyer orders now expose delivery telemetry from
the existing API contract and partial source failures remain visible. Buyer
Request Builder honors the payment condition returned by the active Client Account and exposes every payment
option accepted by the existing draft contract. Buyer IAM now includes workspace
recognition and an explicit two-factor boundary; the catalog cart, four-step
request builder and embedded route map follow the audited local Vue flow. This
does not claim full product migration or pixel-level parity with Vue.
