## Purpose & scope

This document is the canonical policy an automated agent (AI) or human must follow when making code changes or adding features in this repository. Use it before every edit. It is normative: if a rule conflicts with a change, prefer the rule unless there is a documented, reviewed exception.

## Quick checklist (must follow)
- Extract the user's requirements into a concise checklist at the start of every change/PR.
- Add a short contract for any public change (inputs, outputs, errors, side effects).
- Keep UI and business logic separate: presentational components must not perform data fetching.
- Route all external calls through repository/service layer with typed input/output.
- Add tests (unit + 1–2 edge cases) for new logic and hooks.
- Run typecheck, lint, build, and tests locally before opening a PR.

## High-level principles (non-negotiable)
- Single Responsibility & Separation of Concerns: each module/component should have one responsibility. UI components render and emit events; logic and data access live in hooks/services/repositories.
- SOLID: favor dependency injection, small interfaces, composition over inheritance.
- KISS & YAGNI: implement only what's needed for the current feature; prefer simple, well-tested solutions.
- DRY but explicit: avoid duplicate logic; prefer shared utilities when duplication is harmful. Do not abstract prematurely.
- Immutability & pure functions: prefer immutable updates for state and pure functions for business logic.
- Fail-fast & explicit errors: validate inputs, throw or return typed errors; do not hide failures.
- Backwards compatibility: prefer additive changes; breakage must be approved in PR and documented.

## Contract-first edits (mandatory)
For every change that introduces or modifies public behavior (API, component props, hook returns, repository interfaces), add a short contract at top of the file or in the PR description.

Contract template (2–4 bullets)
- Inputs: types and required/optional fields.
- Outputs: types and success shape.
- Errors: expected error classes / HTTP status range / error codes.
- Side effects / external dependencies: network, storage, analytics.

Example
- Inputs: { userId: string } (required)
- Output: Promise<UserProfile> | throws NotFoundError | ValidationError
- Side effects: analytics.track('profile.fetch')

## File & repo organization (recommended)
- Feature folders: `features/<feature-name>/{ui,hooks,services,repos,tests,types}`.
- Shared UI components: `components/ui/*` (presentational, no direct data fetching).
- Hooks: `hooks/*` for reusable logic.
- Repositories/services: `lib/repos/*` or `services/*` for external calls and persistence.
- Utilities: `lib/utils.ts`, `lib/formatters`, `lib/validators` (pure functions).
- Types: colocate types with feature; export index types in `types/` when shared.

Naming rules
- Components: PascalCase; files: kebab-case or pascal-case consistent with repo.
- Hooks: use prefix `use` (e.g., `useUserProfile`).
- Repositories/services: suffix `Repo`/`Service` (e.g., `userRepo`).

Minimal file example (feature)
- `features/onboarding/ui/OnboardingForm.tsx` (presentational)
- `features/onboarding/hooks/useOnboarding.ts` (logic + side effects)
- `features/onboarding/repos/onboardingRepo.ts` (network + mapping)
- `features/onboarding/types.ts`

## UI vs logic separation (concrete)
- Presentational components: no network calls, no global state mutations; receive data via props and emit events through callbacks (onSubmit, onChange).
- Container hooks/components: use hooks to fetch and transform data, handle commands; compose presentational components.
- Keep accessibility (a11y) responsibilities in UI components.

## Component & hook rules
- Props: always type props (TypeScript). Use small props; prefer objects for many params.
- Defaults & validation: provide sensible defaults and runtime prop validation where beneficial.
- Side-effects in hooks only: prefer `useEffect/useCallback` and keep effects cleanup correct.
- Testing: every hook should have unit tests for happy path and 1–2 error/edge cases.

## State handling (client)
- Prefer local state for ephemeral UI; use global state only for cross-cutting concerns (auth, user, theme).
- Global state choices: React Context + useReducer, Zustand, or Jotai — pick one and be consistent.
- Normalize state shapes: store collections as { byId: Record<string, T>, allIds: string[] }.
- Selectors: derive shape with selectors for memoization and re-render control.
- Immutable updates: use immer or spread; keep updates predictable.
- Caching & staleness: unify caching in repos/services; UI should rely on TTL or SWR-like logic.
- Optimistic updates: require undo/fallback flows and metrics to detect conflicts.

## External data access & repository pattern
- All external calls go through a repository/service layer with:
  - A typed interface (input/output DTOs).
  - Mapping from wire shapes to domain types.
  - Error normalization: return or throw typed errors (NetworkError, ValidationError, NotFound).
  - Retries/backoff and cancellation support (AbortController).
  - Caching layer: in-memory + storage (IndexedDB/localStorage) only when required and controlled by the repo.
- Repositories should be pure from the caller view: idempotent fetch methods, separated command methods (create/update/delete).
- Keep secrets out of code; use environment variables and platform-secret storage.

Retry & backoff policy (default)
- GET: up to 2 retries with exponential backoff on 5xx or network failure.
- Non-idempotent commands: no automatic retry unless idempotency token provided.

Pagination & streaming
- Repos must support cursor-based pagination and explicit methods for fetching next pages.
- Provide meta (hasMore, nextCursor) in responses.

Rate-limiting & throttling
- Repos should surface rate-limit headers in response metadata.

## Error handling & logging
- Surface user-friendly messages to the UI; keep low-level error details in logs.
- Use structured logging for events (level, event, context).
- Do not swallow errors silently. If a background error can be retried, schedule and record it.
- Provide an error boundary for React to catch render errors and log them.

## Security & secrets
- Never log secrets, tokens, or PII.
- Sanitize user input on client and server.
- Use least-privilege for tokens, rotate often, and store in secure store (server environment).
- On the client, use short-lived tokens and refresh flows. Store tokens in memory or secure httpOnly cookie when feasible.

## Observability & telemetry
- Add instrumentation calls in repos and critical flows: start/stop, success/failure, duration.
- Track feature flag evaluations, experiments, and major user actions.

## Performance
- Avoid heavy synchronous computation in render; memoize expensive transforms.
- Code-split by route/feature.
- Use responsive images and `next/image` when available.

## Accessibility & UX
- All interactive components must be keyboard-navigable and include ARIA attributes where needed.
- Color contrast must meet WCAG AA.

## Internationalization (i18n)
- Strings: do not hardcode text. Use the project's i18n approach; keep default language files.
- Dates/numbers: use Intl APIs and locale-aware formatting.

## Testing
- Unit tests: for pure functions, hooks, and small components.
- Integration tests: for container components + repos (mock network layer).
- End-to-end tests: critical user flows (login, checkout, key happy paths).
- Tests must assert behavior, not implementation.

## CI / PR rules
For every PR:
- Include a clear description, the contract (inputs/outputs), a screenshot (if UI), and affected files.
- Include tests covering new behavior.
- Run linters, typechecks, build, and tests locally before pushing.
- PR must pass: lint, typecheck, unit tests, and integration tests; reviewers test local run if needed.

Commit message template
- `<type>(<scope>): short summary`
- Body (if needed): motivation, design choices, migration notes
- Footer: related issue/PR reference

## Versioning & migrations
- Use semantic versioning for published packages/APIs.
- For DB schema changes: create a migration with up/down and note compatibility. Data migrations must be idempotent and tested.

## Change/feature rollout & feature flags
- Risky changes must be behind feature flags and rolled out progressively.

## Documentation & changelog
- Update `README.md` or feature READMEs for new behavior.
- Document public APIs, props, hooks, repository interfaces in typed comments and docs.

## Automation & reproducibility
- Keep `package.json` scripts for build, lint, test, format.
- Use lockfile to pin dependencies and scan for vulnerabilities.

## Edge cases to always consider
- Empty / null / undefined inputs.
- Slow network, partial failures, and timeouts.
- Concurrent updates and stale state (race conditions).
- Authorization failure paths and token refresh.

## Quality gates (mandatory checklist before committing)
- [ ] Add/update contract for any changed public interface.
- [ ] Add/adjust unit and integration tests (happy + 1–2 edge cases).
- [ ] Run typechecks and linters: no warnings/errors.
- [ ] Run build: success.
- [ ] Manual smoke test of feature locally (describe steps in PR).
- [ ] Update docs/README and changelog if public behavior changed.
- [ ] Use feature flag if change is risky.

Automated verification order
1. Typecheck (tsc) — must pass.
2. Lint — must pass.
3. Unit tests — must pass.
4. Build — must succeed.

## When the AI agent modifies code — explicit workflow
1. Read the user's request and extract requirements into the checklist (include them in PR).
2. Search the repo for existing relevant files and conventions (do not invent new patterns).
3. Propose the minimal design: file list, contract, and tests.
4. Implement changes in small commits each addressing one concern (code, tests, docs).
5. Run quality gates locally and include results in PR description.
6. Push, open PR with required sections, and assign reviewers.

Fail-safe behavior
- If uncertain about a high-impact design (auth, data model, migrations), open a PR with a design doc and request human review before landing.

## PR templates, contract & test-plan (copy into PR body)
PR checklist
- [ ] Contract added
- [ ] Tests added/updated
- [ ] Lint/type/build/test passed locally
- [ ] Docs updated
- [ ] Feature flag added (if applicable)
- [ ] Rollback plan described

Contract (short)
- Input: ...
- Output: ...
- Errors: ...
- Side effects: ...

Test plan (short)
- Unit tests: files/fns
- Integration tests: flows
- Manual test steps: 1) 2) 3)

## Assumptions & decision heuristics for the AI
- Prefer libraries already in repo; if none exist, choose minimal, well-maintained libraries.
- Make minimal changes to existing behavior; prefer additive fixes.
- Default to TypeScript types for public APIs.

## Closing: enforcement & evolution
- This document is the living policy. Changes must be via PR and approved by at least one senior engineer.

---
Small next steps (optional)
- I can add a GitHub PR template and an issues template and a lightweight pre-commit guide. If you'd like I will add those files now.
