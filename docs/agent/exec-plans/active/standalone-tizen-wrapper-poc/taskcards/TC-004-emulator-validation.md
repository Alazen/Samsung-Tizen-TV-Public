# TC-004: Emulator Validation and Bounded Corrections

Status: completed

## Objective

Validate the accepted harness on the existing Samsung TV emulator. AGY may directly correct harness source only from evidence supplied by Codex.

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/config.xml`
- `harness/CodexTvRuntimeCheck/index.html`
- `harness/CodexTvRuntimeCheck/css/style.css`
- `harness/CodexTvRuntimeCheck/js/main.js`
- `harness/CodexTvRuntimeCheck/tizen_web_project.yaml`
- `tests/tizen-wrapper-harness.test.js`
- `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`

## Required evidence

- Existing VM `<emulator-profile>` only; do not create or modify a VM.
- `sdb devices`, optional ping evidence, `tz run -d`, fresh build/package/install/run results.
- Repo, ignored Debug, and live-served `js/main.js` must contain marker `stremio-web-wrapper-poc-v1.1.0`.
- Confirm Stremio visual load, wrapper/iframe state, remote key events, overlay toggles before and after iframe focus, and both iframe/redirect modes.

## Emulator evidence and required correction

- Existing emulator started and reported `device`; ping commands returned no output and remain inconclusive.
- Repo and ignored Debug copies contain marker `stremio-web-wrapper-poc-v1.1.0`.
- Initial `tz run -d` served stale JavaScript; fresh `tz pack` and `tz install` succeeded using the existing signing profile unchanged.
- Fresh live target title is `StremioWebWrapperPOC`; live `js/main.js` contains the marker and exposes the public API.
- Iframe loaded `https://web.stremio.com/` with visible Stremio body text and same-origin DOM access in this packaged Tizen context.
- Wrapper-focused Info event toggled diagnostics and recorded keyCode 457.
- After iframe focus, Digit1 did not reach the wrapper: diagnostics remained closed and wrapper lastKey stayed Info.
- Correct this by factoring one lightweight key handler and attaching it to both the wrapper document and the iframe document after each successful iframe load when access is available. Record iframe-listener status in diagnostics.
- Do not consume or synthesize arrows/Enter/Back; record them and allow native Stremio handling.
- Gracefully retain wrapper-only behavior if iframe listener attachment throws a cross-origin SecurityError.
- Extend the Node test to prove an iframe-focused Info/1/color event toggles diagnostics through the injected listener, ordinary iframe arrows are recorded without inspection/render, and listener attachment failure is nonfatal.
- Update the execution report with the stale-source recovery and this bounded correction. Do not update TaskCard/PLAN/state status files.

## Stop conditions

- Signing profile changes or secrets required.
- Live source remains stale after two attempts.
- Generated output would need committing.

## Response

Print `AGY_DONE`, changed files, validation performed, issues, and no unrelated commentary.

## Codex review feedback for correction attempt 2

- The `handleKeyDown` and `attachIframeKeyListener` runtime change is accepted provisionally; do not expand or redesign it.
- Complete the missing test work: mock iframe-document `addEventListener`/`removeEventListener`, trigger iframe-focused Info/1/color events, assert diagnostics toggles and timer state, assert iframe ArrowLeft only records the key without inspection/render, and assert listener attachment failure is nonfatal with a diagnostic status.
- Update the execution report with stale-source detection, successful fresh pack/install, live source marker/API/Stremio-load evidence, wrapper-focus Info pass, iframe-focus Digit1 failure, and the bounded listener correction.
- Do not edit config, HTML, CSS, YAML, TaskCards, PLAN, state, package.json, or unrelated docs.
- Run focused tests, npm test, syntax, and diff checks. Write `.agent-tmp/agy-tc004-result.txt`.
