# HISTORICAL RELEASE RECORD — FORMER PUBLIC LABEL v0.16.0 — NOT A CURRENT RELEASE

Release record for server-authoritative buyer payment preferences in the
canonical Request Builder.

## Included

- The Request Builder reads the active Client Account from
  `GET /api/v1/client-accounts/me` before initializing payment preference.
- Account conditions such as `credit_30` and `cash_on_delivery` are normalized
  to the canonical request options accepted by the existing draft contract.
- Draft hydration keeps a persisted `paymentPreference` authoritative and uses
  the account condition only when the draft has no recognized preference.
- The payment selector exposes the existing API-supported options with the
  established Nexa payment-card visual treatment and accessible radio state.

## Explicit boundary

- No API, Blueprint or Vue source changed; no new endpoint or payment rule was
  invented.
- A missing or unrecognized account condition falls back to `BANK_TRANSFER`
  so the request remains on an existing supported option and Sales/API can
  validate eligibility at submission.
- Mock adapters remain available only for explicit mock mode; the default
  runtime remains API-backed.

## Validation

- Buyer Request Builder focused tests: 5/5 passed.
- Full unit suite, bounded-context validators, Design Lab foundation checks,
  production build, dependency audit and authenticated browser checks are
  recorded at publication time.

## Release status

Published through the `release/v0.16.0` GitFlow line with an annotated
`v0.16.0` tag and GitHub Release. Tags are annotated but unsigned in this
repository unless a signing key is configured before publication.
