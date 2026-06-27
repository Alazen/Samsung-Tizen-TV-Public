# TC-007: Emulator Navigation Validation and Adapter Tuning

Status: completed

## Objective

Validate TC-006 navigation adapter on the emulator using both CDP-injected key events and the Tizen Studio virtual remote. Tune selector groups and focus geometry based on observed Stremio DOM behavior. This is a pure emulator validation and tuning pass.

## Parent ExecPlan

`docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/PLAN.md`

## Required context

- Files to read:
  - `harness/CodexTvRuntimeCheck/js/main.js` (post-TC-006 implementation)
  - `tests/tizen-wrapper-harness.test.js`
  - `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`
- Docs to read:
  - `docs/agent/validation.md`
  - `docs/agent/known-risks.md`

## Depends on

- TC-006 (completed)

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

## Exact target

### Emulator validation procedure

1. Build, package, and install the post-TC-006 WGT on the emulator.
2. Launch in debug mode and confirm source marker parity.
3. Confirm Stremio loads in the iframe.
4. **CDP key injection test:**
   - Inject `ArrowDown` via CDP `Input.dispatchKeyEvent` and observe whether Stremio's active element changes from `BODY` to a focusable card.
   - Inject `ArrowLeft` and observe sidebar entry.
   - Inject `ArrowRight` and observe sidebar exit.
   - Inject `Enter` and observe item activation.
   - Record the active element tag, class, and text after each injection.
5. **Virtual remote test (if available):**
   - Use the Tizen emulator virtual remote buttons.
   - Observe focus movement visually through Web Inspector.
   - Record whether Stremio's own spatial navigation responds, or only the adapter's focus management works.
6. **Adapter tuning:** If selectors miss elements or focus jumps are wrong:
   - Update selector groups in `main.js`.
   - Update corresponding test expectations.
   - Rebuild, reinstall, and retest.
   - Maximum two tuning iterations per selector issue.
7. Record all evidence in `EXECUTION_REPORT.md`.

### Key observations to record

- Does Stremio's own JS handle arrow navigation when the adapter is passive?
- If yes, the adapter should defer to Stremio and only intervene for sidebar/card jumps.
- If no, the adapter must handle all spatial navigation.
- Is `ArrowDown` consumed by Stremio or does it scroll the page?
- What is the actual DOM structure of focusable cards (class names, data attributes)?

## Constraints

- Maximum two tuning iterations per selector issue.
- Do not add broad DOM mutation observers or `requestAnimationFrame` polling.
- Keep adapter changes minimal: selector refinements, focus-order adjustments, and fallback improvements only.
- Do not modify Back/Exit behavior in this TaskCard.

## Documentation obligations

- Update `EXECUTION_REPORT.md` with emulator navigation validation section.
- Update `docs/agent/known-risks.md` if new navigation risks are discovered.
- No `docs/agent/decision-log.md` update unless a durable adapter strategy decision is made.

## Validation

- `node --check harness/CodexTvRuntimeCheck/js/main.js`
- `node tests/tizen-wrapper-harness.test.js`
- `npm test`
- `git diff --check -- harness/CodexTvRuntimeCheck tests`

## Done when

- Emulator navigation is validated with evidence for at least: down-arrow focus move, left-arrow sidebar entry, right-arrow sidebar exit, and Enter activation.
- Adapter behavior is documented: whether Stremio handles navigation natively, whether the adapter intervenes, or both.
- Selector groups are tuned to match observed Stremio DOM or documented as needing real-TV refinement.
- All validation commands pass.

## Stop conditions

- Stremio DOM structure is completely opaque or changes too rapidly for cached selectors.
- Cross-origin prevents all DOM access on the emulator (unlikely given TC-004 evidence).
- Same validation command fails twice.
- More than two tuning iterations needed for a single selector issue.

## Report format

- Changed files:
- Validation run:
- Emulator navigation evidence:
- Stremio native navigation behavior:
- Adapter intervention points:
- Remaining risks:
