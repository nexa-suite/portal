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

## Curated presentation sequence

The following five labels are a presentation index over the verified SemVer
history. They are not new tags, releases, or replacement versions; the
canonical SemVer provenance remains authoritative.

| Presentation label | Canonical tag | Verified milestone |
|---|---|---|
| Nexa Buyer Portal — Release 1 | `v0.1.0` | Initial Angular buyer repository baseline |
| Nexa Buyer Portal — Release 2 | `v0.3.0` | Docker runtime, catalog assets, and browser smoke |
| Nexa Buyer Portal — Release 3 | `v0.7.0` | Consolidated buyer commercial and delivery-tracking surface |
| Nexa Buyer Portal — Release 4 | `v0.12.0` | Design Lab visual and interaction convergence baseline |
| Nexa Buyer Portal — Release 5 | `v0.26.0` | API-only production composition and consolidated milestone |

The remaining retained releases (`v0.2.0`, `v0.2.1`, `v0.5.0`, `v0.7.1`,
`v0.10.0`, `v0.11.0`, and `v0.13.0`) remain valid intermediate evidence. They
are intentionally not presented as additional top-level milestones.

## Release-lineage classification

| Version | Classification | Original target | Reachable from retained `v0.26.0` | Meaning |
|---|---|---|---|---|
| `v0.4.0` | INTERNAL_PREPARATION_ONLY | — | — | Preparation commits only; no public tag or GitHub Release. |
| `v0.6.0` | INTERNAL_PREPARATION_ONLY | — | — | Feature/preparation evidence only; no public tag or GitHub Release. |
| `v0.8.0` | NEVER_PUBLISHED | — | — | No public tag, GitHub Release or release evidence found. |
| `v0.9.0` | NEVER_PUBLISHED | — | — | No public tag, GitHub Release or release evidence found. |
| `v0.14.0` | INTERNAL_PREPARATION_ONLY | — | — | Release document and implementation evidence exist; no public tag or GitHub Release. |
| `v0.15.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `55cec233ab6927da0feb82d02adfd9456714b02f` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.16.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `0b1d9ce6f039447ea00874414695f356b3ff30a1` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.17.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `5f9aabb449238f879d9dd6cbdae26ec2c8a3bfc0` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.18.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `1555d3e07a20415922a6f86d07bbc611510b6e84` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.19.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `85091ca318f2b51e6fc803b5d76352519efb26a0` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.20.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `7f47d107335ef1b60c0704bd990b67d3b83af296` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.21.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `2f057ec6371b413d942742195f747e77fbc31835` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.22.0` | NEVER_PUBLISHED | — | — | No public tag, GitHub Release or release evidence found. |
| `v0.23.0` | NEVER_PUBLISHED | — | — | No public tag, GitHub Release or release evidence found. |
| `v0.24.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `e2e180ba425d20aa1077bb627c91a2c4ede20b72` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |
| `v0.25.0` | RETIRED_DURING_AUTHORIZED_CONSOLIDATION | `2fc4dee3b294f4ee17448c55a39b0eadc239617d` | YES | Former public snapshot; ref retired into retained `v0.26.0`. |

`v0.26.0` is the retained `PUBLISHED` consolidated milestone. Its version
number remains intentionally unchanged; no missing number is restored.

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
