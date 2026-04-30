# Decision Log

## 2026-04-29 - Root AGENTS kept as router
- Decision: keep `AGENTS.md` compact and route durable process details to `docs/agent/*`.
- Rationale: avoid instruction bloat and keep task routing deterministic.

## 2026-04-29 - Validation command contract
- Decision: standard validation order is `npm run check:syntax`, `npm run check:manifest`, then `npm test`.
- Rationale: syntax/manifest checks should fail fast before broader regression.

## 2026-04-29 - Commit/artifact safety made explicit
- Decision: require pre-commit status/stat checks and generated-artifact refusal by default.
- Rationale: prevent accidental commits of temporary/build outputs in multi-worker flows.

## 2026-04-30 - Emulator debug harness stays external and disposable
- Decision: keep the emulator debug harness outside the product surface; use the existing `CodexTvRuntimeCheck` project as the primary path and `.agent-tmp` as the fallback workspace.
- Rationale: preserve a clean repo boundary for Task 3 while still allowing repeatable local emulator debugging without turning the harness into product architecture.
