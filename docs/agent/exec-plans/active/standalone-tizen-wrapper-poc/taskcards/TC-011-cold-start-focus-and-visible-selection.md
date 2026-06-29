# TC-011: Cold-start focus and visible TV selection

Status: active

## Objective

Make the packaged wrapper usable from a real cold start through the emulator/TV remote without DevTools injecting focus first. Establish deterministic initial focus, preserve directional navigation, and make the focused control unmistakably visible.

## Parent ExecPlan

`docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/PLAN.md`

## Root-cause evidence

- The emulator remote delivers Arrow and Enter events to the iframe listener.
- Live state showed `iframeListenerStatus: attached`, adapter enabled, and 74 visible candidates.
- The iframe `activeElement` remained `BODY`; recent emulator-remote events all targeted `BODY`.
- The visible Stremio selected item was Board, but no DOM element owned focus and no obvious TV focus ring was shown.
- TC-010 validation programmatically focused a card/control before replaying trusted CDP keys. It proved focused-state transitions but bypassed cold-start focus acquisition.
- Current adapter behavior returns without handling most non-intro keys when focus is `BODY`; at `#/`, the existing selected-content lookup does not select the Board sidebar item.

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/js/main.js`
- `tests/tizen-wrapper-harness.test.js`
- `.agent-tmp/agy-tc011-preflight.json`
- `.agent-tmp/agy-tc011-result.json`

Preserve `state.keyEventsLog`, TC-010 directional/login/Back behavior, and all existing uncommitted work.

## Files forbidden

- This TaskCard, `PLAN.md`, `EXECUTION_STATE.json`, `EXECUTION_REPORT.md`, and all other docs
- `config.xml`, `tizen_web_project.yaml`, package metadata, dependencies, lockfiles
- Signing material, credentials, generated `Debug/`, WGT, logs, caches, vendor files, TizenBrew runtime files
- Every file not explicitly allowlisted

## Exact implementation target

### Cold-start focus bootstrap

- Add a semantic helper that finds the best visible selected control across content cards and sidebar/navigation controls. Prefer selected content when present; otherwise use the selected/current sidebar item.
- After same-origin iframe load/listener attachment, schedule a lightweight, bounded initial-focus attempt.
- Focus only while iframe focus is `BODY`/missing. Never steal focus from an input, menu item, profile control, or other active element.
- Do not bootstrap the `#/intro` login route; Stremio already focuses E-mail and the route-aware adapter handles it.
- Allow a small capped retry window for asynchronous Stremio rendering, then stop. Do not install a perpetual observer or timer.
- Cancel/replace pending bootstrap work on iframe reload, adapter destroy, or successful focus.

### BODY key fallback

- If a remote directional key arrives while focus is `BODY`, use the visible selected control as the logical starting element and process that same key through the adapter.
- At root Board: Down must move to Discover and Right must move to the selected/nearest content card when available.
- On a selected first content card: Left must still enter the current sidebar; other directions must use TC-010 card-grid movement.
- Do not make the first directional key a dead “focus-only” key when a deterministic target exists.
- Enter on `BODY` must be safe: bootstrap/focus the selected control rather than activating an unrelated element. A subsequent Enter on a focused control may activate it normally.
- If no selected control or directional target exists, pass through without forcing an unrelated candidate.

### Visible focus indicator

- Inject one idempotent same-origin style element into the iframe document.
- Apply a high-contrast outline/box-shadow to focused interactive controls (`a`, `button`, form controls, `[tabindex]`, `[role=button]`).
- Keep the style lightweight and scoped; do not modify Stremio generated class names or rebuild its UI.
- Cross-origin/style injection failure must remain nonfatal and diagnosable.

### Diagnostics

- Record concise bootstrap/focus status and `lastNavigation` values without logging URLs, credentials, or broad DOM snapshots.
- Ordinary keys must remain lightweight; no broad scan for non-navigation keys.

### Approved header and row navigation extension

- Treat Board/Home, Search, Fullscreen, and Profile as an explicit semantic header/sidebar navigation graph.
- Board/Home Up -> Search.
- Give Search a whole-bar focus treatment while focusing its existing native actionable child.
- Search Enter activates native Stremio search; Search Left -> Home; Search Right -> Fullscreen; Search Down -> the first card in the first visible row; Search Up stops.
- Fullscreen Right -> Profile; Profile Left -> Fullscreen; Fullscreen Left -> Search; Profile Right stops; Up stops on both controls; Down from either -> the first card in the first visible row.
- Any card in the first visible content row Up -> Search.
- The first card in any row Left -> Home.
- The last card in a row Right -> the same-row `See All`; `See All` Left -> that row's last card; `See All` Right -> the next row's first card.
- The topmost `See All` Up -> Search. Other `See All` Up/Down -> the first card in the adjacent content row.
- Content entry/re-entry starts at the first card. Do not restore prior card focus.
- Determine controls and row relationships from semantics and relative visible geometry. Do not use generated class suffixes or fixed screen coordinates.

### Detail, editable, Back, and repeat behavior

- After a card opens a movie/series detail surface, focus the top item in the right-hand source list (the source filter), not Play.
- Identify the source list/filter semantically and geometrically without relying on generated classes.
- Directional keys always perform TV navigation even while Search, email, or password fields are focused; ordinary typing/deletion remains native.
- Back while editing dismisses the keyboard/editing state first without route navigation. A later Back follows the existing transient-menu/history/root behavior.
- Back from login restores Profile focus. Back from a detail route re-enters content at the first card.
- Add controlled directional repeat: one immediate move followed by a capped repeat interval that does not skip controls.

### Diagnostics tabs and system-key behavior

- Keep diagnostics non-modal: directional and OK keys continue controlling Stremio while the overlay is visible.
- Info toggles the overlay. Digit1 types normally in editable fields and toggles diagnostics elsewhere.
- Map Red -> key events, Green -> navigation/focus, Yellow -> media capabilities/state, and Blue -> network/errors.
- A color key opens its tab when hidden, the active color closes the overlay, and a different color switches tabs without closing.
- Pass Channel/Page Up/Down, Volume Up/Down, Mute, dedicated Exit, and media transport keys through without converting them to navigation or clicks. Volume keys are not navigation-log entries.
- Dedicated Exit remains an immediate native Tizen exit.

## Tests required

- Iframe load with `BODY` focus and selected Board schedules and applies bootstrap focus without test-side `.focus()` setup.
- Bootstrap retries when selected controls are not rendered yet, then stops after success/cap.
- Bootstrap does not steal an existing input/control focus and skips `#/intro`.
- Focus style is injected once and includes a visible outline rule.
- Cold-start `BODY` ArrowDown moves selected Board -> Discover in the same event.
- Cold-start `BODY` ArrowRight moves Board -> selected/nearest content card.
- Cold-start selected first-card Left -> current sidebar still works.
- `BODY` Enter focuses safely without activating; focused Enter activates.
- Existing sidebar/card, profile/login, diagnostics, Back, cross-origin, and media tests remain passing.
- Header graph tests cover Home/Search/Fullscreen/Profile transitions, stopped edges, Search native Enter, and whole-bar `:focus-within` styling.
- Row tests cover first-row card Up -> Search, first-card Left -> Home, card -> `See All` -> next-row traversal, and `See All` vertical movement into adjacent first cards.
- Detail-route tests focus the top right-hand source filter after card activation.
- Editable tests cover directional navigation, Digit1 typing versus global toggle, and Back dismissing editing before history navigation.
- Diagnostics tests cover non-modal tab selection/toggling and the four color mappings.
- System-key tests cover controlled repeat and pass-through behavior for channel/page, volume/mute, Exit, and media transport keys.

## Runtime validation

- Fresh build/package/install/debug launch and repo/Debug/live source parity.
- Start from a fresh app/iframe reload where inner `activeElement` is verified as `BODY`.
- Do not call `.focus()` from DevTools before the acceptance sequence.
- Use trusted CDP `Input.dispatchKeyEvent` only after confirming cold-start `BODY` state:
  - Down -> visible Discover focus/selection.
  - Up -> Board.
  - Right -> selected/nearest content card.
  - Card Right/Left and Down/Up.
  - Enter activation from a focused card.
- Inspect active element, selected class, focus-style presence, and `lastNavigation` after each step.
- Final user-visible confirmation through the emulator on-screen remote remains required; DevTools must not inject focus.

## Validation commands

- `node --check harness/CodexTvRuntimeCheck/js/main.js`
- `node tests/tizen-wrapper-harness.test.js`
- `npm test`
- `git diff --check -- harness/CodexTvRuntimeCheck/js/main.js tests/tizen-wrapper-harness.test.js`

## Done when

- Unit tests cover genuine BODY cold-start without pre-focusing controls.
- Fresh live source parity passes.
- Trusted cold-start replay passes without DevTools `.focus()` setup.
- Trusted replay passes the approved header, row-edge, detail source-filter, diagnostics-tab, and Back/editing sequences.
- The emulator remains running for user confirmation with its on-screen remote.
- Codex accepts AGY output after allowlist, privacy, evidence, and code-quality review.

## Stop conditions

- Same-origin iframe access is unavailable after fresh deployment.
- Fix requires Stremio API integration, credential entry, provider activation, dependency changes, or generated/vendor edits.
- AGY changes a forbidden file or exhausts two bounded correction retries.
- Runtime validation cannot establish a genuine `BODY` cold-start state without injecting focus.

## Current validation note

- AGY edited `main.js` and the wrapper tests directly in the repository through supervised repo mode with `--add-dir` and `--dangerously-skip-permissions`; preflight/result validation passed after one bounded correction.
- JavaScript syntax, 11/11 wrapper tests, 15/15 root tests, and diff check pass.
- Fresh build/package/install/debug launch passed; generated Debug/WGT output remains ignored.
- Repo source, ignored Debug source, and live-served source share SHA-256 `f73b851b82e5835ba1c1c3aecf7f5ba5ec32caf91ad65954fb3a9f5eed78b75c`.
- Without any DevTools `.focus()` call, the fresh app automatically focused Board and applied a computed 3px yellow solid outline plus yellow glow.
- Trusted keys from that naturally acquired focus passed Board Down -> Discover, Up -> Board, Right -> content, and card Right/Left/Down/Up.
- TaskCard remains active pending user confirmation through the emulator on-screen remote.
- User testing exposed a `See All` row-end trap: the link received remote keys but was outside the sidebar/card branches.
- AGY's final bounded correction added semantic `See All` handling; Codex review then corrected its row-alignment fixture to measured live geometry and excluded `See All` from sidebar classification after the AGY retry limit was exhausted.
- Final repo/Debug/live source parity passed at SHA-256 `eae5dc6eb41c8987e2d76c9e945da1c2ee0aaa117fc06c83e8c6f35c0cadc4db`.
- Natural-focus replay reached the first `See All`; Left -> last card, last-card Right -> `See All`, Down/Up -> adjacent row-end controls, and no-target Right remained stable.
- The emulator is left running with focus on the first `See All` for immediate user confirmation of Left escape.

## Latest navigation-extension validation note

- AGY implemented the approved header, row, diagnostics, repeat, editable, Back, and detail-focus extension directly in the two allowlisted source/test files. Its initial result-contract failure was rejected; two bounded correction retries completed and passed schema/allowlist review.
- Independent validation passes: JavaScript syntax, 16/16 wrapper tests, 15/15 root tests, and diff checks.
- A fresh emulator install proved repo/ignored-Debug/live-served source parity and passed Board -> Search -> Fullscreen -> Profile, Profile edge stop, header Down -> first card, first-row Up -> Search, Search Left -> Home, card -> `See All` -> next-row first, adjacent-row `See All` Up -> first card, top `See All` Up -> Search, and non-modal diagnostics color tabs.
- Live card activation exposed that the detail selector focused Stremio's full-viewport `input[type=file]` instead of the right-side stream/source action. The final source correction excludes upload/hidden/full-viewport empty controls and semantically selects the top action in the rightmost stream/source group; for the observed no-stream title this is `Install addons`.
- The final detail-selector correction is covered by Test 16 but is not yet installed in the emulator. The final rebuild command was blocked by the command-approval service usage limit before execution. Therefore the currently open emulator package is one source revision stale and must not be used as evidence for final detail/source focus.
- No playback-fixed or real-TV validation claim is made.
