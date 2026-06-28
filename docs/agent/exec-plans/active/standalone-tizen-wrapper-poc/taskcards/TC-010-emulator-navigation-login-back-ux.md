# TC-010: Emulator navigation, login, and Back UX

Status: completed

## Objective

Fix the bounded remote-navigation defects reproduced through emulator DevTools, then provide unit-testable behavior for the Discover/sidebar and profile/login flows.

## Parent ExecPlan

`docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/PLAN.md`

## Evidence to implement against

- From the selected first card on `#/discover`, Stremio consumes ArrowLeft and moves DOM focus into a header control instead of the visible sidebar.
- A DevTools prototype worked by intercepting Left only for a selected/active first-column card, matching the visible sidebar item to the current hash, consuming the event, and deferring focus.
- Native sidebar Down and sidebar Right already worked in the emulator.
- The anonymous top-right profile control opens a menu whose `Log in / Sign up` item navigates to `#/intro`.
- Generic spatial scoring on `#/intro` skipped Password, jumped to legal links, and did not preserve the visible left/right form columns.
- Back keyCode 10009 from `#/intro` successfully returned to `#/discover`; root Back must remain pass-through.

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/js/main.js`
- `tests/tizen-wrapper-harness.test.js`
- `.agent-tmp/agy-tc010-preflight.json`
- `.agent-tmp/agy-tc010-result.json`

Preserve the existing uncommitted `state.keyEventsLog` instrumentation in `main.js`.

## Files forbidden

- `PLAN.md`, `EXECUTION_STATE.json`, `EXECUTION_REPORT.md`, this TaskCard, and all other docs
- Config, signing material, credentials, dependencies, lockfiles, package scripts
- Generated `Debug/`, WGT, logs, caches, vendor files, and TizenBrew runtime files

## Exact implementation target

### Discover/sidebar bridge

- When focus is `BODY`/missing, prefer the visible selected Stremio content item over the first generic candidate.
- Intercept ArrowLeft only when the active or visible selected content card is in the first visible card column.
- Determine the first column from visible same-row geometry; do not depend on hashed CSS suffixes or fixed screen pixels.
- Focus the visible sidebar item whose route best matches the iframe location hash; prefer its selected/active duplicate when responsive duplicate navigation exists.
- Consume handled Left with `preventDefault` and propagation suppression when available, then defer focus so Stremio cannot overwrite it after the handler returns.
- Do not hijack Left between content cards, inside editable controls, or when already in the sidebar.
- Leave working native sidebar Up/Down and sidebar-to-content Right behavior untouched unless a deterministic adapter action is required.
- Record a concise `state.lastNavigation` diagnostic for adapter-handled transitions.

### Profile and login flow

- Include the visible anonymous/profile menu toggle in navigation even when it has `tabindex=-1`.
- Make the profile menu's visible `Log in / Sign up` action reachable and activatable with Enter/OK.
- On `#/intro`, use a route-aware navigation map based on semantic element attributes/text and visible geometry, never generated class suffixes.
- Down/Up through the left form must move Email -> Password -> Confirm password and reverse without skipping.
- Left/Right between the main left form and right action column must choose the nearest meaningful account action, not Terms, Privacy, or consent checkboxes.
- Keep controls such as legal links and checkboxes reachable only through deliberate navigation within their own area; they must not win ordinary cross-column movement.
- Add a lightweight focus-visible treatment only if required for controls the adapter makes programmatically focusable.
- Do not enter credentials, activate providers, or submit forms.

### Back

- Preserve Back/keyCode 10009/461 behavior: non-root iframe route calls history.back(), consumes the event, and records navigation; root `#/` passes through.

## Tests required

- First selected card Left -> matching visible route sidebar with deferred focus.
- A non-first-column card Left is not hijacked.
- Body/missing focus prefers selected card.
- Sidebar Up/Down/Right are handled by the packaged-app adapter.
- Anonymous profile toggle and `Log in / Sign up` are included/activatable.
- `#/intro` Email Down -> Password -> Confirm password and Up reverses.
- Login cross-column movement chooses meaningful action controls and excludes legal/consent controls.
- Back from `#/intro` calls history.back() and consumes; root Back passes through.
- Existing diagnostics and key-log tests remain passing.

## Validation

- `node --check harness/CodexTvRuntimeCheck/js/main.js`
- `node tests/tizen-wrapper-harness.test.js`
- `npm test`
- `git diff --check -- harness/CodexTvRuntimeCheck/js/main.js tests/tizen-wrapper-harness.test.js`

## Done when

- All required tests pass.
- Codex accepts the diff after allowlist, privacy, and quality review.
- A fresh emulator build/install serves the updated marker/source.
- DevTools simulation validates Discover/sidebar/card directions, profile -> login, login directions, and Back without submitting credentials.

## Stop conditions

- Same-origin iframe access is unavailable after a fresh install.
- Fix requires Stremio API integration, credential entry, provider activation, dependency changes, or generated/vendor edits.
- AGY changes any forbidden file or exhausts two correction retries.

## Final validation note

- AGY supervised repo preflight/result validation passed; AGY made no additional source changes during the final replay.
- Repo source, ignored Debug source, and live-served source matched SHA-256 `2cc5ee9c8cb81b835308f33f44aa3101cfeb0f2e081d8b85ef7d6d8cb9f51627`.
- Trusted CDP replay passed first-card Left -> Discover; sidebar Down -> Library, Up -> Discover, Right -> selected card; card Right/Left and Down/Up across the visible grid.
- Trusted CDP replay passed profile Enter -> Log in / Sign up -> `#/intro`; form Down/Up order; field/action Right/Left mapping; and Back -> prior Discover route.
- Root `#/` Back pass-through remains unit-tested only so runtime validation does not exit the app.
- JavaScript syntax, 10/10 wrapper tests, 15/15 root tests, and diff check passed.
- No credentials were entered, no provider was activated, and playback was not retested or claimed fixed.
