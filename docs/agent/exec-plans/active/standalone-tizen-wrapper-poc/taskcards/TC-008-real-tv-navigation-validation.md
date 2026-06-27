# TC-008: Real-TV Navigation Validation

Status: completed

## Objective

Install the emulator-validated navigation adapter on the real Samsung TV, validate remote navigation behavior with the physical remote, and record evidence for the next improvement iteration.

## Parent ExecPlan

`docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/PLAN.md`

## Required context

- Files to read:
  - `harness/CodexTvRuntimeCheck/js/main.js` (post-TC-007 implementation)
  - `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`
- Docs to read:
  - `docs/agent/validation.md`
  - `docs/agent/known-risks.md`

## Depends on

- TC-007 (completed and emulator-validated)

## Can run in parallel with

- none

## Conflicts with files

- `harness/CodexTvRuntimeCheck/js/main.js`

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/js/main.js`
- `harness/CodexTvRuntimeCheck/css/style.css`
- `tests/tizen-wrapper-harness.test.js`
- `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`

## Files forbidden

- `harness/CodexTvRuntimeCheck/config.xml`
- `harness/CodexTvRuntimeCheck/index.html`
- Dependencies, lockfiles, root package scripts
- Signing material, credentials, certificate files
- Generated `Debug/`, `*.wgt`, `*.log`, caches
- TizenBrew runtime files
- TaskCards, `PLAN.md`, `EXECUTION_STATE.json`

## Prerequisite

The real TV must appear in `sdb devices`. If it does not, this TaskCard is blocked.

## Exact target

### Real-TV validation procedure

1. Build, package, and install the post-TC-007 WGT on the real TV.
2. Launch in debug mode and confirm source marker parity.
3. Confirm Stremio loads in the iframe.
4. **Physical remote test:**
   - Press Down arrow on the physical remote. Observe whether a content card gains focus (visual focus ring or highlight).
   - Press Left arrow. Observe sidebar entry.
   - Press Right arrow. Observe sidebar exit.
   - Press Up arrow. Observe card-to-card jump vs. slow scroll.
   - Press OK/Enter. Observe item activation.
   - Press `1`/`Info` during navigation. Confirm diagnostics toggle.
   - Open diagnostics and read the adapter state: active candidate, group, and key routing path.
5. **Bounded corrections:**
   - If the physical remote sends different key codes than the emulator, update key mappings in `main.js`.
   - If focus selectors miss real-TV Stremio elements, update selector groups.
   - Maximum two correction iterations.
6. Record all evidence in `EXECUTION_REPORT.md`.

### Key observations to record

- Does the physical remote's arrow key produce the same `keyCode` and `key` as the emulator?
- Does Stremio's own focus management respond to the physical remote?
- Does the adapter's focus management produce visible focus indicators on the TV screen?
- Is there any perceptible lag in focus movement?
- Does the iframe same-origin context hold on the real TV (it should, since the app is packaged)?

## Constraints

- Only apply bounded corrections backed by real-TV diagnostics evidence.
- Maximum two correction iterations.
- Do not expand scope into playback controls or Back/Exit behavior.
- Use only the already-configured TV connection.

## Documentation obligations

- Update `EXECUTION_REPORT.md` with real-TV navigation validation section.
- Update `docs/agent/known-risks.md` with any TV-specific navigation risks.
- Update `docs/agent/decision-log.md` if a durable adapter strategy decision is made based on TV evidence.

## Validation

- `node --check harness/CodexTvRuntimeCheck/js/main.js`
- `node tests/tizen-wrapper-harness.test.js`
- `npm test`
- `git diff --check -- harness/CodexTvRuntimeCheck tests`
- Real-TV source marker parity

## Done when

- Real-TV WGT install and debug launch are recorded.
- Physical remote navigation is validated with evidence for: down, left, right, up, and OK.
- Diagnostics toggle works under iframe focus on the real TV.
- Adapter state is readable in diagnostics.
- Any key-code mismatches or selector misses are corrected (within bounded iterations).
- All validation commands pass.

## Stop conditions

- TV unavailable in `sdb devices`.
- Cross-origin prevents DOM access on the real TV (unexpected but possible).
- Same validation command fails twice.
- More than two correction iterations needed for a single issue.
- Scope would expand into playback controls or Back/Exit behavior.

## Report format

- Changed files:
- Validation run:
- Real-TV navigation evidence:
- Physical remote key codes:
- Adapter intervention points:
- Remaining risks:
