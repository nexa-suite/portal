# Portal mock adapters

Buyer Portal runtime resolves `dataMode: 'api'` unconditionally. Runtime global,
local storage and localhost query parameters cannot switch browser execution to
mock data. This keeps catalog, Client Account, request builder and Purchase
Request views on existing HTTP contracts.

Mock classes remain available for unit tests, adapter tests and isolated build
fixtures. Tests may inject `PORTAL_RUNTIME_CONFIG` with `dataMode: 'mock'` or
bind a mock adapter directly; this does not represent production runtime.

## Runtime configuration

`__NEXA_RUNTIME_CONFIG__` may still provide existing API base and tenant profile
settings before Angular bootstrap:

```html
<script>
  window.__NEXA_RUNTIME_CONFIG__ = {
    apiBase: 'http://api.local',
    tenantProfile: 'icisa'
  };
</script>
```

`tenantProfile` supports `generic` and `icisa`. Unsupported values fall back to
`generic`. `dataMode` is ignored by runtime resolver and always returns `api`;
`nexaDataMode=mock` is no longer a browser activation path.

## Test fixtures

Mock adapters cover deterministic Buyer-safe contracts for isolated tests. They
must not be used as evidence of API behavior, persistence, authorization, jobs,
webhooks, provider reconciliation or production readiness. Real API behavior
requires corresponding API client, authenticated environment and server
contract.
