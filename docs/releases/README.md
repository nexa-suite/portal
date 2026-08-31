# Portal release notes

Release notes are scoped to the Buyer Portal repository and distinguish the buyer shell from future B2B workflows.

| Release | Summary |
|---|---|
| [v0.26.0](./v0.26.0.md) | API-only production composition and notifications wiring |
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
| [UNRELEASED HISTORICAL CANDIDATE: v0.14.0](./v0.14.0.md) | Implementation evidence only; no tag or GitHub Release |
| Historical snapshots: v0.15.0-v0.25.0 | Consolidated into v0.26.0; commits remain reachable, refs are not retained |

Unindexed files under `docs/releases/` preserve historical evidence only; they do
not define the retained public release set.

Current retained release is `0.26.0`. Production composition now binds the existing
Buyer HTTP adapters directly to application ports, including the canonical
notifications port; mock providers remain isolated test fixtures. The release
continues the executable Design Lab foundation and legacy Vue visual direction;
it does not claim full product migration or pixel-level parity across every
Portal route.
