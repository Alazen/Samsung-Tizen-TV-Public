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

## 2026-04-30 - Emulator debug harness is repo-tracked source
- Decision: make the checked-in `CodexTvRuntimeCheck` project the authoritative Samsung TV debug harness path for Task 3 validation.
- Generated outputs such as `Debug/` folders and `.wgt` packages remain non-source artifacts and stay untracked.
- Rationale: keep emulator validation repeatable inside the repository while preserving the source/artifact boundary.
