# TC-005: Real-TV Playback and Final Report

Status: completed

## Objective

Install the standalone wrapper WGT on the real Samsung TV, validate core behavior, record the problematic-video playback result, and produce a final evidence report. Only evidence-backed, bounded harness corrections may be applied through AGY.

## Parent ExecPlan

`docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/PLAN.md`

## Required context

- Files to read:
  - `harness/CodexTvRuntimeCheck/js/main.js` (current implementation)
  - `harness/CodexTvRuntimeCheck/config.xml` (version and privileges)
  - `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`
  - `docs/agent/validation.md`
- Docs to read:
  - `docs/agent/known-risks.md`

## Prerequisite

The real TV must appear in `sdb devices` alongside the emulator. If only the emulator appears, this TaskCard is blocked. Do not change the Developer Mode IP or reconfigure the TV.

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/config.xml`
- `harness/CodexTvRuntimeCheck/index.html`
- `harness/CodexTvRuntimeCheck/css/style.css`
- `harness/CodexTvRuntimeCheck/js/main.js`
- `harness/CodexTvRuntimeCheck/tizen_web_project.yaml`
- `tests/tizen-wrapper-harness.test.js`
- `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`

## Files forbidden

- Dependencies, lockfiles, root package scripts
- Signing material, credentials, certificate files
- Generated `Debug/`, `*.wgt`, `*.log`, caches
- TizenBrew runtime files (`src/main.js`, `package.json`)
- TaskCards, `PLAN.md`, `EXECUTION_STATE.json` (Codex-owned state)
- Unrelated docs

## Exact target — nine-step procedure

1. **Install the fresh WGT on the TV.** Use `tz install` targeting the real TV device. The generated WGT remains ignored.
2. **Launch in debug mode.** Use `tz run -d` targeting the TV. Record the debug port.
3. **Confirm live source marker parity.** Verify that live-served `js/main.js` contains marker `stremio-web-wrapper-poc-v1.1.0` and matches the repo copy.
4. **Confirm Stremio loads.** Verify the iframe loads `https://web.stremio.com/` and displays Stremio body text.
5. **Press `1` / `Info` while the iframe owns focus.** Confirm diagnostics toggle works on the real TV with iframe-routed key events.
6. **Try the problematic video.** User navigates to the same video that failed under TizenBrew. Record redacted error/state/source/capability evidence from diagnostics.
7. **Record whether playback works in the standalone wrapper.** This is the key decision gate:
   - If playback works → continue with UX improvement (TC-006+).
   - If playback fails identically to TizenBrew → navigation work is still useful, but playback needs a separate AVPlay/player-path investigation.
8. **Update `EXECUTION_REPORT.md`.** Add the final report section: branch, version, changed files, commands/results, WGT result, emulator result, real-TV result, remaining risks, and next recommendation.
9. **Commit, push, and verify GitHub.** Codex performs the commit/push after reviewing the diff. Verify the push succeeded.

## Constraints

- Use only an already-configured TV connection; never change Developer Mode IP.
- User enters credentials directly; never read or record credentials/private stream URLs.
- Do not claim playback fixed without a real-TV pass.
- Only apply bounded harness corrections backed by real-TV evidence (e.g., key code mismatches observed in diagnostics).

## Documentation obligations

- Update `EXECUTION_REPORT.md` with the final TV validation section.
- `docs/agent/decision-log.md` must be updated if the playback decision gate produces a durable decision.
- `docs/agent/known-risks.md` must be updated with any new real-TV risks discovered.
- `PLAN.md` is updated by Codex after TaskCard completion.

## Validation

- `node --check harness/CodexTvRuntimeCheck/js/main.js`
- `node tests/tizen-wrapper-harness.test.js`
- `npm test`
- `git diff --check -- harness/CodexTvRuntimeCheck tests docs/agent`
- Repo/Debug/live-served `js/main.js` marker parity on the real TV

## Done when

- Real-TV WGT install and debug launch are recorded.
- Source marker parity is confirmed on the TV.
- Stremio iframe load is confirmed on the TV.
- Diagnostics toggle under iframe focus is confirmed on the TV.
- Problematic-video playback result is recorded with redacted evidence.
- `EXECUTION_REPORT.md` contains the final report section.
- Commit, push, and GitHub verification are complete.

## Stop conditions

- TV is unavailable in `sdb devices` until the user reconnects it.
- Credentials/signing material would be exposed.
- Fix expands into AVPlay, a full client, or Stremio API work.
- Same validation command fails twice.
- Required edits exceed allowed files.

## Report format

- Changed files:
- Validation run:
- Real-TV playback result:
- Remaining risks:
- Next recommendation:
