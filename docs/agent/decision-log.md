# Decision Log

Append durable decisions here. Keep entries concise.

## 2026-04-29 - Root AGENTS kept as router

- Decision: keep `AGENTS.md` compact and route durable process details to `docs/agent/*`.
- Rationale: avoid instruction bloat and keep task routing deterministic.

## 2026-04-29 - Validation command contract

- Decision: standard validation order is narrow syntax/manifest checks before broader tests.
- Rationale: syntax and manifest checks should fail fast before broader regression.

## 2026-04-29 - Commit/artifact safety made explicit

- Decision: require pre-commit status/stat checks and generated-artifact refusal by default.
- Rationale: prevent accidental commits of temporary/build outputs in multi-worker flows.

## 2026-05-02 - Old disposable emulator harness is not product-equivalent

- Decision: do not treat the old `CodexTvRuntimeCheck` local harness target as equivalent to `https://web.stremio.com/`.
- Rationale: a local harness can prove wiring/debug behavior but not target-equivalent Stremio Web behavior or real-TV acceptance.

## 2026-06-27 - Stable Tizen workspace branch

- Decision: use `stremio-webapp-tizen` as the durable Tizen app/refactor workspace.
- Rationale: version-number branches were only needed for TizenBrew cache-busting and confuse subagents during normal refactor work.

## 2026-06-27 - Canonical TizenBrew runtime path

- Decision: use `src/tizenbrew/stremio-remote/main.js` as the canonical runtime for the current TizenBrew remote layer.
- Rationale: `package.json.main` should be the single source of truth for tests and agents; stale duplicate runtime paths were removed.

## 2026-06-27 - 001/002-compatible harness baseline

- Decision: add 002-compatible templates, execution-plan directories, testing policy, and narrow repo-local skills.
- Rationale: future long-running agents should work from repo files and checkpointed execution state rather than chat memory.

## 2026-06-27 - Repurpose CodexTvRuntimeCheck harness

- Decision: repurpose the existing `harness/CodexTvRuntimeCheck` project in place as the standalone Stremio Web Wrapper POC.
- Rationale: allows direct in-place standalone validation on Tizen Emulator/TV without creating a redundant app directory or conflicting with older TizenBrew remote testing, while preserving historical validation records.
