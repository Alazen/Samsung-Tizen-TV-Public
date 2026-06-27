# TC-002: Remote Diagnostics Runtime

Status: completed

## Objective

Implement the wrapper runtime directly in the existing harness after TC-001 is accepted.

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/js/main.js`
- `harness/CodexTvRuntimeCheck/index.html`
- `harness/CodexTvRuntimeCheck/css/style.css`

## Exact implementation target

- Use vanilla ES5-compatible JavaScript and source marker `stremio-web-wrapper-poc-v1.1.0`.
- Default to iframe loading `https://web.stremio.com/`; support selectable `iframe` and `redirect` modes.
- Register supported optional keys `Info`, `ColorF0Red`, `ColorF1Green`, `ColorF2Yellow`, and `ColorF3Blue`; record registration failures.
- Observe mandatory arrows, Enter, Back, plus `1`/`Digit1`/numeric key delivery without attempting to register mandatory keys.
- Any Info/color/1 key toggles the diagnostics overlay.
- Do not synthesize or forward cross-origin key events and do not port the TizenBrew spatial-navigation engine.
- Show version, user agent, redacted wrapper URL, wrapper and iframe load state, mode, last key/keyCode, registration results, and same-origin availability.
- When same-origin access works, inspect video count and the first video: error code/message, networkState, readyState, redacted currentSrc/src.
- Always show wrapper-engine `canPlayType` and `MediaSource.isTypeSupported` for AVC baseline/high and HEVC using a detached video element when necessary.
- Redaction must remove credentials, query, and fragment while retaining scheme, host, and path.
- Refresh on load transitions, explicit refresh, and at most once per second while the overlay is open. Never run broad DOM scans per key.
- Expose `window.__STREMIO_WEB_WRAPPER_POC__` with `version`, `getState()`, `setMode()`, `toggleDiagnostics()`, and `refreshDiagnostics()`.
- Catch cross-origin `SecurityError` and render an unavailable status instead of failing.

## Validation

- `node --check harness/CodexTvRuntimeCheck/js/main.js`
- `git diff --check -- harness/CodexTvRuntimeCheck`

## Stop conditions

- Stremio source modification, API integration, proxying, dependency changes, or synthetic cross-origin navigation would be required.

## Response

Print `AGY_DONE`, changed files, validation performed, issues, and no unrelated commentary.

## Codex review feedback for correction attempt 2

- Default to iframe mode on every packaged-app startup. Do not persist redirect mode in `localStorage`; otherwise the user can be trapped in remote top-level navigation after restart.
- On ordinary keydown, update only the lightweight last-key state. Do not call `refreshDiagnostics` or inspect iframe/video state from every key event, even throttled.
- Keep the one-second inspection timer active only while diagnostics are visibly open, and keep explicit refresh/toggle/load refreshes.
- Add `diagnosticsOpen` to state and keep it synchronized with actual overlay visibility.
- Remove the unintended `i`/`I` keyboard shortcut; only Info, color buttons, and 1/Digit1 toggle diagnostics.
- Preserve ES5 syntax, source marker, public API, codec fields, and all requested error/state/source diagnostics.
