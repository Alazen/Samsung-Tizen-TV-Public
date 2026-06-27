# TC-003: Tests and Durable Documentation

Status: completed

## Objective

Add focused automated coverage and synchronize durable documentation after TC-002 is accepted.

## Files allowed to edit

- `tests/tizen-wrapper-harness.test.js`
- `docs/agent/architecture.md`
- `docs/agent/decision-log.md`
- `docs/agent/known-risks.md`
- `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`

## Exact implementation target

- Test runtime parsing/initialization in a dependency-free Node fake DOM.
- Cover key normalization and toggles, URL redaction, cross-origin failure handling, AVC/HEVC capability fields, refresh throttling, and the public debug API.
- Do not edit `package.json`; this test runs directly with Node.
- Document that `CodexTvRuntimeCheck` is now intentionally repurposed as the standalone wrapper POC while preserving older validation reports as historical evidence.
- Keep router docs short and record same-origin, iframe focus/key-routing, emulator-versus-TV, and playback risks.

## Validation

- `node tests/tizen-wrapper-harness.test.js`
- `npm test`
- `git diff --check -- tests docs/agent`

## Stop conditions

- A new package, dependency, root script, or historical validation rewrite would be required.

## Response

Print `AGY_DONE`, changed files, validation performed, issues, and no unrelated commentary.

## Codex review feedback for correction attempt 2

- Fix the failing codec assertions: runtime `MediaSource.isTypeSupported` values are normalized to `"yes"`/`"no"`, not booleans.
- Replace mojibake checkmark output with plain ASCII test output.
- Add instrumentation proving an ordinary keydown performs no iframe/video inspection and no diagnostics render; do not call `getState()` between the key event and that assertion because `getState()` intentionally performs explicit inspection.
- Cover the required toggle families: Info, at least one color key, `1`, and `Digit1`, including interval start/stop behavior.
- Assert video error code/message, networkState, readyState, redacted `src`/`currentSrc`, wrapper URL redaction, AVC/HEVC fields, cross-origin status, registration failure, and public API.
- Do not edit harness runtime, TaskCards, PLAN, state, package.json, or files outside the original TC-003 allowed list.
- Complete the required concise updates to architecture, decision log, known risks, and execution report.
- Run all exact TC-003 validation commands and write `.agent-tmp/agy-tc003-result.txt`.
