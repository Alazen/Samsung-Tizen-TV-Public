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

## 2026-05-01 - Debug harness decision blocked on fresh install/refresh path
- Decision: `Decision B: Debug harness is blocked pending emulator/toolchain/user-context access.`
- Evidence: `tz.exe run -d -e emulator-26101 -w <project-path>` attached a live Web Inspector target, but the running app still served a stale `js/stremio-remote.js` copy after a second source fix. `tz build -w <project-path> -b Debug` refreshed the ignored `Debug/` copy, while `tz pack -w <project-path> -t wgt` stopped on `ERROR:Decryption error!` when generating the author signature.
- Rationale: Task 3 cannot claim a repeatable repo-tracked debug path until the command recipe can deterministically refresh installed source without relying on unavailable signing secrets.

## 2026-05-02 - Task 5 harness launch path is not equivalent smoke evidence
- Decision: keep Task 5b blocked; do not treat disposable harness launch/redirect behavior as equivalent to `https://web.stremio.com/` smoke evidence.
- Evidence: `harness/CodexTvRuntimeCheck/config.xml` launches `index.html` locally; Task 5c parity checks confirmed `src/main.js` and `harness/CodexTvRuntimeCheck/js/stremio-remote.js` now hash-match, so the remaining blocker is target equivalence rather than repo copy drift. Official Tizen runtime docs allow hosted starts/navigation with policy gates, but also state Tizen Device APIs are unavailable in cross-origin pages.
- Rationale: a harness-only redirect/hosted-start path can change URL target but does not preserve the same injected runtime evidence contract in the cross-origin page required by Task 5b.

## 2026-05-02 - Harness freshness preflight moved into syntax validation
- Decision: `npm run check:syntax` is now the repo-local preflight gate for `harness/CodexTvRuntimeCheck/js/stremio-remote.js` marker parity and interactive-control guard parity.
- Rationale: keep stale harness runtime copies from reaching the emulator phase while preserving live served-source verification as a separate Task 5 requirement.
