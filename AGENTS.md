# Repository Working Agreement

## Authority

- Use accepted Nexa Product, Domain and architecture decisions as the semantic
  authority.
- Do not invent Product meaning, silently close OPEN decisions, or infer DDD
  ownership from Angular feature folders, routes or component structure.
- Read `README.md`, `.github/CONTRIBUTING.md` and `.github/SECURITY.md` before
  changing behavior.

## Repository state

- Inspect the actual branch, worktree, remote metadata and working tree before
  editing.
- Fetch remote metadata before creating new work when permitted; do not merge
  fetched changes into a user's working branch.
- Preserve unrelated local work. Use an isolated worktree when the checkout is
  dirty.

## Buyer client boundaries

- Buyer-facing behavior remains subordinate to server authority. UI
  authorization checks are advisory; server authorization remains decisive.
- Do not infer domain ownership from routes, components or client state.
- Preserve accepted buyer relationship semantics and API contracts.
- Optimize UX for task completion and recovery. Accessibility, responsive
  behavior, loading, empty, error, stale and conflict states are part of
  completion.
- Never treat cached state as authoritative commercial truth.

## Evidence and security

- Claim only tests, visual checks, accessibility checks, compatibility,
  acceptance and release readiness that were actually verified.
- Do not weaken authorization, tenant/workspace isolation, secret handling,
  data integrity, API compatibility or CI gates to make a change pass.
- Do not add credentials, generated artifacts or undocumented contracts.

## SCM and artifacts

- Follow `.github/CONTRIBUTING.md` for branch, commit, review and release flow.
- Use Conventional Commits and preserve real authorship and signatures.
- Do not force-push, rewrite shared history, create fake commits, invent
  contributors, merge automatically, create releases or create tags for this
  governance change.
- Repository-facing artifacts must be neutral, professional and free of
  internal orchestration residue, temporary placeholders and AI attribution.

## Validation and handoff

- Review the task diff, run `git diff --check`, and use the narrowest relevant
  documentation checks for a governance-only change.
- Do not claim a build, test, browser review, CI result or deployment that was
  not executed and observed.
- End the task with factual result, changes, validation, commit, risk, open
  decision and unverified-item information.
