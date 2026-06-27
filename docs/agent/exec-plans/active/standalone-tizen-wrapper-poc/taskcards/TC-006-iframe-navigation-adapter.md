# TC-006: Iframe Navigation Adapter — Emulator Implementation

Status: completed

## Objective

Add a lightweight, same-origin iframe navigation adapter that routes Samsung TV remote arrow/OK/Back keys through Stremio Web's focusable elements. Implement and validate exclusively on the emulator before any real-TV deployment.

## Parent ExecPlan

`docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/PLAN.md`

## Required context

- Files to read:
  - `harness/CodexTvRuntimeCheck/js/main.js` (current key handler and iframe listener)
  - `harness/CodexTvRuntimeCheck/index.html` (DOM structure)
  - `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md` (emulator evidence)
  - `docs/agent/known-risks.md`
- Docs to read:
  - `docs/agent/validation.md`
  - `docs/tizen/index.md` (TV key codes and input device API)

## Depends on

- TC-005 (completed and pushed)

## Can run in parallel with

- none (modifies the same `main.js`)

## Conflicts with files

- `harness/CodexTvRuntimeCheck/js/main.js` (primary edit target)

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/js/main.js`
- `harness/CodexTvRuntimeCheck/css/style.css`
- `tests/tizen-wrapper-harness.test.js`
- `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`

## Files forbidden

- `harness/CodexTvRuntimeCheck/config.xml` (no privilege changes)
- `harness/CodexTvRuntimeCheck/index.html` (no DOM structure changes)
- Dependencies, lockfiles, root package scripts
- Signing material, credentials, certificate files
- Generated `Debug/`, `*.wgt`, `*.log`, caches
- TizenBrew runtime files
- TaskCards, `PLAN.md`, `EXECUTION_STATE.json`

## Exact implementation target

### Target behavior

- **Left** from top-left card enters Stremio sidebar.
- **Right** from sidebar returns to cards.
- **Up/Down** jump card-to-card, not slow-scroll.
- **OK** (Enter) activates the focused item.
- Diagnostics keys (`Info`, color buttons, `1`/`Digit1`) always work, even when the iframe owns focus.
- Arrow keys are only consumed when the adapter handles a focus move.
- Otherwise, pass keys through to Stremio's own navigation.
- **Back** behaves per existing wrapper logic (no change to Back handler).

### Implementation constraints

- Same-origin only: the adapter accesses `iframe.contentDocument` for focus management. If cross-origin, fall back gracefully to current pass-through behavior.
- Cached selectors: use Stremio's known focusable element selectors (links, buttons, nav items in sidebar, content cards). Do not perform broad `querySelectorAll('*')` DOM scans.
- Lightweight: no broad DOM mutation observers, no `requestAnimationFrame` polling, no diagnostics refresh on every key.
- ES5-compatible vanilla JavaScript.
- Source marker remains `stremio-web-wrapper-poc-v1.1.0` (bump to `v1.2.0` only if version changes are approved).
- Do not consume or suppress keys that the adapter does not handle. Let unhandled keys flow to Stremio.
- Navigation adapter state must appear in diagnostics when the overlay is open (active candidate, group, adapter status).
- The adapter must handle Stremio DOM changes gracefully: if cached selectors return empty, log a diagnostic and fall back to pass-through.

### Architecture

1. `NavigationAdapter` object with `init()`, `destroy()`, `handleKey(event)` methods.
2. `init()` is called from `attachIframeKeyListener()` after successful same-origin access.
3. `handleKey(event)` is called from `handleKeyDown()` for arrow/Enter keys only.
4. Maintains a reference to the iframe document and a cached set of focusable elements.
5. Focus candidates are refreshed on adapter init and after navigation moves (not continuously).
6. `destroy()` cleans up when the iframe reloads or the adapter is replaced.

## Validation

- `node --check harness/CodexTvRuntimeCheck/js/main.js`
- `node tests/tizen-wrapper-harness.test.js`
- `npm test`
- `git diff --check -- harness/CodexTvRuntimeCheck tests`
- Emulator validation: build, install, launch in debug mode, confirm:
  - Stremio loads in the iframe.
  - Arrow keys move focus between Stremio cards/sidebar using the virtual remote or CDP.
  - OK activates focused items.
  - Diagnostics toggle still works under iframe focus.
  - Adapter gracefully degrades when selectors return empty.

## Done when

- Navigation adapter is implemented in `main.js`.
- Arrow/OK keys move focus through Stremio's DOM when the adapter has candidates.
- Diagnostics keys still work from both wrapper and iframe focus.
- Unhandled keys pass through to Stremio.
- Unit tests cover: adapter init with mock iframe, focus move on arrow, OK activation, empty-selector fallback, cross-origin fallback, diagnostics toggle preservation.
- All validation commands pass.
- Emulator build/install/run shows navigation working (or records the specific limitation).

## Stop conditions

- Stremio source modification, API integration, or dependency changes would be required.
- Cross-origin iframe prevents all same-origin DOM access on the TV (defer to TC-008 investigation).
- Same validation command fails twice.
- Required edits exceed allowed files.
- Stremio DOM structure requires a broad rewrite of the selector strategy.

## Report format

- Changed files:
- Validation run:
- Emulator navigation result:
- Remaining risks:
