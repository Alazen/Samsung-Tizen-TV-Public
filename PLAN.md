# PLAN.md: Stremio Web TV Remote for TizenBrew

## Status

Current task: Task 2, Tizen Studio TV Emulator Setup.

This file is the source of truth for later implementation TaskCards. Do not
start application behavior changes until the relevant section of this plan has
been converted into a bounded TaskCard with allowed files, validation commands,
and acceptance criteria.

Task 2 progress:

- TV emulator `T-samsung-10.0-x86_64` boots.
- `sdb` sees `emulator-26101 device T-samsung-10.0-x86_64`.
- Emulator details and the Codex-shell Tizen CLI permission issue are recorded
  in `docs/agent/local-toolchain.md`.
- Final project target is a real Samsung TV on Tizen 8.0. The local Tizen 8.0
  emulator image is generic `tizen`, not Samsung TV. The only local Samsung TV
  emulator is Tizen 10.0 (`tv-samsung-10.0-x86_64`), so use it for local TV
  runtime/toolchain debugging only.
- A Samsung TV Basic Project named `CodexTvRuntimeCheck` was created in Tizen
  Studio and launched successfully on the TV emulator with `Run As > Tizen Web
  Application (Samsung TV)`.
- `Run As > Tizen Web Application` failed during package install and must not
  be used for this TV emulator path.
- Certificate Manager setup for the emulator now works after updating the
  Certificate Manager through Package Manager, signing in with a Samsung
  account + 2FA, creating the Samsung certificate profile, and adding the
  emulator DUID `XTCYJYZXZBZVK`. The active emulator profile is
  `EmulatorTVProfile`.
- Remaining acceptance: configure/debug the Samsung TV web app on the Tizen
  10.0 TV emulator, confirm Log View runtime messages, and confirm the
  JavaScript Log Console/Web Inspector debug path. Tizen 8.0 compatibility
  remains a real-device acceptance item.

## Goal

Build a thin TizenBrew site-modification module for Stremio Web on Samsung
Tizen TVs.

The module targets:

- `https://web.stremio.com/`
- TizenBrew `packageType: "mods"`
- JavaScript injection through the module `main` file
- Optional CSS injected by the module
- Optional remote/media key registration through Tizen TV input APIs
- Final target: Tizen 8.0 real Samsung TV runtime. Local emulator fallback:
  Tizen 10.0 Samsung TV runtime.

The module must not replace Stremio Web. Stremio Web remains responsible for:

- Login and authentication
- User profile and account state
- Library and continue-watching state
- Addons
- Catalog and stream selection
- Subtitles
- Playback engine and playback history
- Settings
- Stremio-owned page routing

The module only adds a TV-friendly control layer:

- Spatial navigation for Samsung remote arrows
- High-contrast focus treatment on original Stremio elements
- Remote key handling
- Media key shortcuts
- Predictable Back behavior
- A minimal exit confirmation
- Optional hidden diagnostics for development and TV testing

## Non-Goals

Do not build any of the following for v1:

- A replacement Stremio client
- A new player
- A custom subtitle system
- A catalog, addon, login, settings, or account UI
- A persistent visual redesign of Stremio Web
- A framework app around Stremio Web
- A Tizen native app
- A service module unless later validation proves it is required
- A background process
- A packaging pipeline as part of the first implementation increment
- Generated release artifacts committed to the repository

Do not commit by default:

- `target/`
- `*.exe`
- `*.zip`
- `*.log`
- emulator images
- WGT packages
- caches
- temporary files
- other generated artifacts

## Sources Consulted

Repo-local routing and product docs:

- `AGENTS.md`
- `docs/agent/index.md`
- `docs/agent/repository-map.md`
- `docs/agent/validation.md`
- `docs/agent/skills-policy.md`
- `docs/agent/task-card-template.md`
- `docs/agent/local-toolchain.md`
- `docs/agent/decision-log.md`
- `docs/agent/known-risks.md`
- `docs/product/idea.md`
- `docs/product/prd.md`
- `docs/product/non-goals.md`
- `docs/product/user-journeys.md`

Curated Tizen docs:

- `docs/tizen/index.md`
- `docs/tizen/source-map.md`
- `docs/tizen/tv-web-apps.md`
- `docs/tizen/sdb-debugging.md`
- `docs/tizen/logs-and-debugging.md`
- `docs/tizen/config-xml.md`
- `docs/tizen/privileges.md`
- `docs/tizen/web-apis.md`
- `docs/tizen/media-playback-avplay.md`

Official Samsung/Tizen source files routed by `docs/tizen/source-map.md`:

- `docs/vendor/samsung-tizen-docs/docs/application/web/get-started/tv/first-app.md`
- `docs/vendor/samsung-tizen-docs/docs/application/web/get-started/tv/first-samsung-tv-app.md`
- `docs/vendor/samsung-tizen-docs/docs/application/profiles/tv.md`
- `docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/process/run-debug-app.md`
- `docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/sec-privileges.md`
- `docs/vendor/samsung-tizen-docs/docs/application/web/api/10.0/device_api/tv/tizen/tvinputdevice.html`
- `docs/vendor/samsung-tizen-docs/docs/application/web/api/10.0/device_api/tv/tizen/application.html`

External TizenBrew module docs:

- `https://github.com/reisxd/TizenBrew/blob/main/docs/MODULES.md`

Relevant doc conclusions:

- TizenBrew site modification modules are normal npm/node modules with
  `packageType: "mods"`, `websiteURL`, injected `main`, `keys`, and optional
  `serviceFile`.
- Samsung TV web apps use HTML, JavaScript, and CSS and can run on emulator or
  target TV through Tizen Studio.
- Tizen Studio TV Extension provides TV emulator support.
- Tizen Studio can run and debug web apps on an emulator or target device.
- The JavaScript Log Console and Web Inspector are useful for runtime debug.
- `tizen.tvinputdevice` can register optional remote keys.
- Mandatory keys cannot be registered: `ArrowLeft`, `ArrowRight`, `ArrowUp`,
  `ArrowDown`, `Enter`, and `Back`.
- `http://tizen.org/privilege/tv.inputdevice` is public.
- `tizen.application.getCurrentApplication().exit()` exits the current app.
- `tizen.application.kill()` requires partner-level `appmanager.kill`; v1 must
  not use it.

## Existing Repository Baseline

Current source shape:

- `package.json` defines the TizenBrew module metadata.
- `src/main.js` is a small bootstrap script.
- `src/styles.css` contains placeholder focus style hooks.
- `tests/manifest.test.js` validates module metadata and key constraints.
- `tests/syntax.test.js` validates JavaScript syntax, style injection, and key
  registration helpers.

Current architectural properties to preserve:

- No runtime dependencies.
- No build step.
- Vanilla JavaScript.
- Best-effort behavior outside Tizen.
- Soft failure around unsupported device APIs.
- Explicit namespace guard to prevent double initialization.
- Mandatory TV keys are not listed in `package.json` `keys`.

## Development Strategy

Development proceeds in this order:

1. Complete this `PLAN.md`.
2. Set up and validate the Tizen Studio TV emulator.
3. Add or refine a debug harness suitable for emulator and browser-like tests.
4. Implement small, testable remote-control behavior in bounded TaskCards.
5. Run static and unit validation.
6. Use emulator for initial Tizen web runtime debugging.
7. Use real Samsung TV with TizenBrew for final acceptance.

The emulator is useful for fast debugging, logs, Tizen web runtime checks, and
early key-event investigation. It is not final acceptance because the real
product depends on:

- TizenBrew module injection
- The actual Samsung remote
- Real Stremio Web playback behavior
- Device-specific key support
- `tizen.application.getCurrentApplication().exit()` availability from the
  injected TizenBrew context

## Task Breakdown

### Task 1: Detailed PLAN.md

Objective:

- Create this detailed root `PLAN.md`.

Allowed files:

- `PLAN.md`

Forbidden files:

- Application source files
- Tests
- Package metadata
- Vendored docs
- Generated files

Validation:

- `git diff --check -- PLAN.md`

Acceptance:

- Plan covers goal, non-goals, architecture, implementation phases, emulator
  setup, real TV validation, key behavior, player behavior, Back/exit behavior,
  diagnostics, tests, risks, and stop conditions.

### Task 2: Tizen Studio TV Emulator Setup

Objective:

- Establish a working emulator target for initial debugging.

Allowed work:

- Toolchain inspection
- Tizen Studio UI setup
- Emulator launch
- SDB connectivity checks
- Documentation updates if local toolchain details change

Forbidden by default:

- Committing emulator images
- Committing WGTs
- Committing logs
- Changing application source to work around a toolchain setup issue

Expected steps:

1. Confirm Tizen Studio path from `docs/agent/local-toolchain.md`.
2. Confirm `sdb` path and version.
3. Confirm Tizen Studio TV Extension is installed.
4. Open Tizen Studio Emulator Manager.
5. Create a Samsung TV emulator instance if none exists.
6. Launch the emulator.
7. Confirm the emulator appears in Device Manager.
8. Confirm `sdb devices` sees the emulator.
9. Confirm Tizen Studio Log view can show runtime messages.

Acceptance:

- A TV emulator boots successfully.
- `sdb` can see the emulator.
- Tizen Studio can run or debug a basic TV web app on the emulator.
- Any setup issue is documented with exact commands and observed output.

### Task 3: Emulator Debug Harness Decision

Objective:

- Decide the smallest way to test injected module behavior in emulator before
  using real TizenBrew on TV.

Default approach:

- Use a minimal local TV web app wrapper only for debug if needed.
- The wrapper should load a page that can exercise `src/main.js` in a Tizen web
  runtime.
- Do not confuse the wrapper with the production TizenBrew module.
- Do not commit generated Tizen Studio project files unless explicitly approved.

Possible options:

- Use Tizen Studio Web Simulator or emulator with a minimal test page.
- Use a temporary untracked TV web app project outside the repo.
- Use a committed debug harness only if later approved as a first-class source
  artifact.

Acceptance:

- We can observe keydown events, focus behavior, style injection, and Tizen API
  availability in a TV-like web runtime.
- The debug harness does not become product architecture.

### Task 4: Runtime Core

Objective:

- Turn the current bootstrap into a testable runtime core.

Allowed source area:

- `src/main.js`
- `src/styles.css`
- `tests/*.js`
- `package.json` only if metadata or script changes are explicitly required

Runtime components:

- Bootstrap namespace
- Configuration constants
- Feature detection
- Optional key registration
- Style injection
- DOM scanner
- Focus manager
- Spatial navigation engine
- Key router
- Back controller
- Player controller
- Diagnostics controller
- App-exit helper

Acceptance:

- Runtime initializes once.
- Runtime does not throw outside Tizen.
- Runtime does not block Stremio Web load.
- Runtime can be inspected through diagnostics.
- Tests cover pure logic and high-risk branches.

### Task 5: Real TV TizenBrew Validation

Objective:

- Verify the module in the actual target environment.

Required target:

- Real Samsung TV
- TizenBrew installed and accessible
- Stremio Web opened through TizenBrew

Acceptance:

- Module loads on `https://web.stremio.com/`.
- Original Stremio UI remains intact.
- Remote navigation works without a mouse cursor.
- Focus indicator is visible and high contrast.
- Text inputs remain usable.
- Player overlay behavior works.
- Seekbar behavior works.
- Media keys work when supported.
- Back behavior is predictable.
- `End the app` exits through `getCurrentApplication().exit()` or the limitation
  is documented as a blocker.

## Architecture Boundaries

### Module Boundary

Production module type:

- TizenBrew site modification module

Required metadata:

- `packageType: "mods"`
- `appName: "Stremio Web TV Remote"` or a closely related user-facing name
- `websiteURL: "https://web.stremio.com/"`
- `main: "src/main.js"`
- `keys`: optional media/color/info keys only

Default metadata policy:

- Keep `evaluateScriptOnDocumentStart: false` unless injection timing proves too
  late for reliable setup.
- Keep `serviceFile` absent for v1 unless a concrete TizenBrew limitation proves
  a service is required.
- Keep no runtime dependencies.
- Keep no dev dependencies unless later test complexity justifies them.

### Stremio Boundary

The module may:

- Observe DOM state.
- Add temporary focus attributes/classes to original elements.
- Inject a module-owned style block.
- Listen for keydown events.
- Trigger safe clicks on focused original elements.
- Trigger safe media actions on detectable media/player targets.
- Show a module-owned diagnostics panel.
- Show a module-owned exit confirmation.

The module must not:

- Store Stremio credentials.
- Read or modify Stremio account tokens.
- Replace Stremio routing.
- Replace the video player.
- Patch Stremio source bundles.
- Persistently alter Stremio layout.
- Hide or delete Stremio controls by default.
- Depend on private minified implementation details unless there is no safer
  alternative and the risk is documented.

### CSS Boundary

Allowed CSS:

- High-contrast focus outline or box-shadow.
- Module-owned diagnostics panel styles.
- Module-owned exit modal styles.
- Optional hidden utility classes for module-owned UI only.

Forbidden CSS:

- Global theme replacement.
- Broad typography changes.
- Broad layout changes.
- Hiding Stremio elements.
- Recoloring Stremio UI beyond the focused element indicator.
- CSS that changes element dimensions in a way that causes layout shift.

## Runtime Design

### Bootstrap

Current namespace:

- `__STREMIO_TIZENBREW_REMOTE__`

Required properties:

- Idempotent initialization.
- Public debug surface for tests and diagnostics.
- Defensive feature detection.
- No hard dependency on `window.tizen`.
- No hard dependency on `document.head` during early load.

Recommended bootstrap shape:

- Create a state object.
- Inject styles when `document.head` exists.
- Register optional keys when Tizen API exists.
- Attach key listeners after DOM is ready enough for event handling.
- Start a mutation/refresh strategy for focusable candidates.
- Expose debug methods under the namespace.

### Feature Detection

Detect:

- `document`
- `document.body`
- `document.head`
- `window.tizen`
- `tizen.tvinputdevice`
- `tizen.inputdevice` as fallback only if useful
- `tizen.application`
- `tizen.application.getCurrentApplication`
- `HTMLMediaElement` behavior
- `MutationObserver`
- `requestAnimationFrame`

Feature detection policy:

- Missing features must degrade behavior, not crash.
- Diagnostics should record missing Tizen APIs.
- Tests should cover missing API paths.

### Optional Key Registration

Optional keys currently in scope:

- `MediaPlayPause`
- `MediaPlay`
- `MediaPause`
- `MediaStop`
- `MediaFastForward`
- `MediaRewind`
- `ColorF0Red`
- `ColorF1Green`
- `ColorF2Yellow`
- `ColorF3Blue`
- `Info`

Mandatory keys that must not be listed in `package.json` `keys`:

- `ArrowLeft`
- `ArrowRight`
- `ArrowUp`
- `ArrowDown`
- `Enter`
- `Back`

Registration rules:

- Prefer `tizen.tvinputdevice.registerKey`.
- Skip mandatory keys.
- Catch and record unsupported key errors.
- Do not fail initialization if key registration fails.
- Keep tests enforcing the manifest key policy.

### Key Routing

Primary key groups:

- Directional: arrows
- Activation: Enter
- Back: Back, browser/Tizen back key event variants when observed
- Media: play, pause, play/pause, stop, rewind, fast-forward
- Diagnostics: Info or a documented color key
- Module modal keys: arrows, Enter, Back while modal is open

Routing principles:

- Only call `preventDefault()` when the module consumes a key.
- Let Stremio handle native/browser behavior when the module is not acting.
- When an editable element is active, stay hands-off except module-owned UI.
- Record every consumed key in diagnostics.
- Avoid repeated expensive DOM scans on key repeat; refresh candidates through a
  throttled strategy.

### Text Input Policy

Editable contexts:

- `input`
- `textarea`
- `[contenteditable]`
- role/textbox-like elements when safely detectable
- active login fields
- active search fields

Policy:

- Do not intercept arrows.
- Do not intercept Enter.
- Do not intercept Back.
- Do not move spatial focus out of the field.
- Only module-owned modal controls can override this policy.

Reason:

- Login and search must remain Stremio-owned and reliable.

## Focus And Spatial Navigation

### Focus Goal

The viewer should be able to navigate Stremio Web with the Samsung remote
without using a mouse cursor, while the UI still looks like original Stremio
Web.

### Visual Focus

Focus indicator:

- High-contrast outline or box-shadow on the focused original element.
- No text change.
- No size change.
- No layout shift.
- No permanent class on unfocused elements.

Implementation policy:

- Use a module-owned attribute such as `data-stremio-remote-focus="true"`.
- Ensure only one active remote focus marker exists at a time.
- Remove the marker when focus is cleared or the element disappears.
- Keep native focus and remote focus state coordinated where safe.

### Candidate Discovery

Generic candidates:

- `a[href]`
- `button`
- `[role="button"]`
- `[tabindex]` where not negative
- clickable cards or controls with safe action indicators
- visible player controls
- visible dialog buttons

Exclude:

- hidden elements
- invisible elements
- `display: none`
- `visibility: hidden`
- disabled controls
- zero-size elements unless they represent a known seek thumb
- elements outside the viewport with no scroll intent
- editable fields when active
- module-owned internals except diagnostics/modal controls

### Hybrid Selector Map

Use a small Stremio-aware selector map to improve common surfaces.

Planned roles:

- App navigation
- Content cards
- Detail page primary actions
- Dialog actions
- Player bottom-bar buttons
- Subtitles or captions button
- Seekbar track
- Seekbar thumb/dot

Policy:

- Generic discovery remains the fallback.
- Stremio-specific selectors should be grouped in one configuration block.
- Each selector should have a role name for diagnostics.
- Broken selectors must not break navigation.
- Device validation should identify selectors that are too brittle.

### Spatial Algorithm

For each directional key:

1. Ensure candidate list is fresh enough.
2. Find current focused element or seed focus.
3. Compute bounding rectangles.
4. Filter candidates by direction.
5. Rank by major-axis direction, cross-axis distance, and visible overlap.
6. Move focus to the best candidate.
7. Scroll into view only when needed and without disruptive jumps.

Fallbacks:

- If no directional candidate exists, use logical/DOM order within the current
  visible group.
- If no focus exists, seed focus from the most relevant visible candidate.
- If focused element disappeared, clear focus and seed again.

## Player Behavior

### Goal

Make playback feel like a TV app while preserving Stremio Web's own player UI
and behavior.

### Overlay Reveal

When playback is active and the overlay is hidden:

- Pressing any navigation/action key should reveal Stremio's player overlay
  where feasible.
- This should approximate the same behavior as moving the mouse cursor.
- Candidate techniques must be tested:
  - dispatching a safe mousemove/pointermove event
  - focusing or clicking a visible player surface only when non-destructive
  - relying on Stremio's existing key behavior if it already reveals controls

If overlay reveal cannot be implemented reliably:

- Record the limitation.
- Do not add a custom replacement overlay.

### Overlay Navigation

When player controls are visible:

- Spatial navigation should prefer visible player controls.
- Bottom-bar buttons must be navigable.
- Subtitle/legend controls on the bottom bar must be reachable.
- Enter activates the focused visible control.

### Seekbar

Seekbar behavior:

- From bottom-bar controls, `ArrowUp` selects the seekbar thumb/dot when present.
- While seekbar is selected:
  - `ArrowLeft` seeks backward.
  - `ArrowRight` seeks forward.
  - `ArrowDown` returns to bottom-bar controls.
  - Enter keeps behavior conservative unless Stremio exposes a safe action.

Seek step:

- Start with a small fixed seek step, for example 10 seconds.
- Make the value a constant in code.
- Record the actual action in diagnostics.

Seek safety:

- Only seek if a safe media element or Stremio player control path is detected.
- Do not assume every video source is directly seekable.
- If the media target is unavailable, let Stremio handle the key or no-op with
  diagnostics.

### Idle Fade

After remote input in player mode:

- Keep the overlay visible while the user is navigating.
- After 5 seconds of no input, stop forcing focus and allow Stremio's UI to fade
  away.
- Do not implement a separate custom fade animation over Stremio UI.

### Media Keys

Media key behavior:

- `MediaPlayPause`: toggle playback when safe.
- `MediaPlay`: play when safe.
- `MediaPause`: pause when safe.
- `MediaStop`: conservative no-op unless a safe Stremio stop/close action is
  documented during testing.
- `MediaFastForward`: seek forward when safe.
- `MediaRewind`: seek backward when safe.

Safety:

- Prefer Stremio player controls if visible and semantically clear.
- Use `HTMLMediaElement` only when a single safe active media target is
  detectable.
- Do not bypass Stremio state if that causes visible desync.

## Back And Exit

### Back Priority

Back handling must be layered:

1. If module diagnostics are open, close diagnostics.
2. If module exit modal is open, `Back` behaves like `Keep watching`.
3. If a Stremio modal, overlay, or in-page layer is clearly active, let Stremio
   handle Back or activate the visible close/back affordance only when safe.
4. If browser history indicates a safe in-page navigation path, let Stremio or
   history handle it.
5. If there is no safe in-page action left, show the module-owned exit modal.

### Exit Modal

Modal style:

- Minimal centered modal.
- Light page dim only if needed for legibility.
- No broad Stremio UI restyling.
- High-contrast focus on modal buttons.

Button labels:

- `Keep watching`
- `End the app`

Button behavior:

- `Keep watching`: close modal and return focus to prior element when possible.
- `End the app`: call current app exit helper.

### Exit Helper

Primary method:

- `tizen.application.getCurrentApplication().exit()`

Rules:

- Feature-detect every part of the call path.
- Catch exceptions.
- Record success/failure in diagnostics before exiting when possible.
- Do not call `tizen.application.kill()`.
- Do not request partner-level `appmanager.kill`.

Acceptance:

- On real TV, selecting `End the app` should terminate the app rather than keep
  it running in the background.
- If TizenBrew's injected context does not expose current application exit,
  record this as a blocker and revisit architecture.

## Diagnostics

Diagnostics are required for development but hidden for normal viewing.

Toggle:

- Prefer `Info`.
- If `Info` is unavailable on a model, use a documented color key fallback.

Displayed fields:

- Module version or plan/runtime version
- Initialization time
- Current URL/path
- Last key name/code
- Last consumed action
- Current focus role
- Current focus selector summary
- Candidate count
- Registered optional keys
- Failed optional keys
- Tizen API availability
- Player mode state
- Media target state
- Back decision
- Last error message

Rules:

- Hidden by default.
- Does not block normal Stremio Web unless open.
- Back closes diagnostics.
- Diagnostics output should be concise and TV-readable.
- Console logs should be structured and rate-limited.

## Tizen Studio TV Emulator Plan

### Purpose

Use the emulator first for fast setup and initial debugging.

The emulator should validate:

- Basic Tizen web runtime behavior
- Syntax/runtime exceptions
- JavaScript logs
- Web Inspector debugging
- Keydown event shapes
- `tizen.tvinputdevice` availability
- CSS injection
- Focus behavior
- Diagnostics behavior

The emulator should not be used as final proof for:

- TizenBrew injection
- Real remote behavior
- Real Stremio playback quirks
- Real app exit behavior
- Retail TV firmware-specific key support

### Local Toolchain Context

Existing local notes:

- Tizen Studio path observed: `E:\tizen-studio`
- Tizen CLI path observed: `E:\tizen-studio\tools\ide\bin\tizen.bat`
- SDB path observed: `E:\tizen-studio\tools\sdb.exe`
- SDB version previously observed: `Smart Development Bridge version 4.2.25`
- Tizen CLI version previously observed: `Tizen CLI 2.5.25`

Important Windows context:

- Codex sandbox commands may run under a different Windows identity than the
  real desktop user.
- Tizen CLI log permissions can differ between identities.
- If Tizen CLI emits access-denied errors for `E:\tizen-studio-data`, verify in
  the real user context before changing repo files.

### Emulator Setup Steps

1. Confirm Tizen Studio launches.
2. Open Package Manager.
3. Confirm TV Extension is installed.
4. Open Emulator Manager.
5. Create a Samsung TV emulator if none exists.
6. Launch the emulator.
7. Confirm the emulator appears in Device Manager.
8. Confirm `sdb devices` lists the emulator.
9. Create or use a local security profile as required by Tizen Studio.
10. Run a basic TV web app on the emulator.
11. Confirm Log view shows runtime messages.
12. Confirm JavaScript debugging path is available.

### Emulator Debug Evidence

Record:

- Emulator profile/version
- Whether TV Extension was already installed
- `sdb devices` output
- Whether logs are visible
- Whether Web Inspector opens
- Any key event names/codes observed
- Any missing Tizen APIs

Do not commit:

- emulator screenshots unless explicitly requested
- generated emulator files
- generated Tizen Studio project files
- WGT packages
- logs

## Real Samsung TV Validation Plan

### Purpose

Final acceptance must happen on the real Samsung TV with TizenBrew because the
target product is a TizenBrew site modification module, not a generic Tizen web
app.

### Setup

Required:

- Samsung TV accessible on the local network.
- TizenBrew installed.
- Ability to load the local or packaged module through TizenBrew.
- Stremio Web reachable from the TV.
- Real Samsung remote available.

Optional:

- SDB connection to the TV for logs.
- Tizen Studio Device Manager connection.
- Web Inspector if supported by the device setup.

### Manual Acceptance Scenarios

Scenario 1: Initial load

- Open Stremio Web through TizenBrew.
- Confirm Stremio loads normally.
- Confirm no console-breaking exceptions.
- Confirm module diagnostics can be opened and closed.

Scenario 2: Original UI preservation

- Inspect home/catalog surface.
- Confirm layout, colors, content cards, menus, and typography look like
  Stremio Web.
- Confirm only focused element gets the module focus indicator.

Scenario 3: Basic navigation

- Use arrows to move through visible content.
- Confirm focus moves predictably.
- Confirm Enter activates the focused original element.
- Confirm scrolling is controlled and not jarring.

Scenario 4: Text input

- Enter login or search input.
- Confirm arrows/Enter/Back remain usable for text-entry expectations.
- Confirm module does not pull focus away from the field.

Scenario 5: Dialogs and detail pages

- Open a content detail page.
- Navigate primary actions.
- Open and close a Stremio-owned dialog if available.
- Confirm Back behavior does not skip expected Stremio in-page actions.

Scenario 6: Playback overlay

- Start playback.
- Let controls fade.
- Press a navigation/action key.
- Confirm Stremio player overlay appears where feasible.
- Navigate visible bottom-bar controls.
- Reach subtitles/legend controls.

Scenario 7: Seekbar

- With player controls visible, move from bottom controls to seekbar with
  `ArrowUp`.
- Confirm seekbar thumb/dot is selected.
- Press left/right.
- Confirm playback seeks backward/forward.
- Press down.
- Confirm focus returns to player controls.

Scenario 8: Media keys

- Press play/pause.
- Press rewind/fast-forward.
- Confirm actions work only when safe.
- Confirm unsupported keys do not crash the module.

Scenario 9: Back and exit

- Press Back while diagnostics is open.
- Press Back while an in-page Stremio action exists.
- Press Back when no safe in-page action remains.
- Confirm modal appears with `Keep watching` and `End the app`.
- Select `Keep watching` and confirm playback/page remains.
- Select `End the app` and confirm the app exits.

## Test Strategy

### Static Checks

Run in this order for implementation tasks:

1. `npm run check:syntax`
2. `npm run check:manifest`
3. `npm test`

Fallback direct Node commands if npm is unavailable:

1. `node tests/syntax.test.js`
2. `node tests/manifest.test.js`

Docs-only validation:

- `git diff --check -- PLAN.md`
- For agent docs or harness docs: `git diff --check -- AGENTS.md docs/agent .agents/skills/stremio-task-executor/SKILL.md`

### Unit Test Coverage Targets

Manifest tests:

- Module remains `mods`.
- `websiteURL` remains `https://web.stremio.com/`.
- Mandatory keys are not listed.
- Optional key list remains expected.
- No `serviceFile` unless explicitly approved.
- No runtime dependencies.

Runtime helper tests:

- Bootstrap is idempotent.
- Missing `document` does not crash.
- Missing `tizen` does not crash.
- Missing `document.head` does not crash.
- Style injection is idempotent.
- Optional key registration soft-fails.
- Mandatory keys are skipped.

Focus tests:

- Hidden elements are excluded.
- Disabled elements are excluded.
- Editable active elements are excluded from interception.
- Candidate ordering is deterministic.
- Directional movement chooses a sensible nearest candidate.
- Focus marker is removed from old element.

Key router tests:

- Consumed keys call prevent-default in test doubles.
- Unconsumed keys do not call prevent-default.
- Text input context bypasses module handling.
- Diagnostics toggle works.
- Module modal receives key priority.

Player tests:

- Overlay reveal function is called on playback key input.
- Seekbar mode changes arrow behavior.
- Left/right seek uses configured step.
- Idle timer clears player-navigation state after 5 seconds.
- Missing media target degrades safely.

Back tests:

- Diagnostics close first.
- Exit modal closes with Back.
- In-page action decision happens before exit modal.
- No in-page action opens exit modal.
- `Keep watching` closes modal.
- `End the app` calls current-app exit when available.
- Missing current-app exit returns unsupported state.

Diagnostics tests:

- State updates on key events.
- API availability is recorded.
- Last error is recorded without throwing.

### Emulator Validation

Use emulator after static/unit checks pass.

Validate:

- App or debug harness launches.
- Runtime initializes.
- Logs are visible.
- Key events are observable.
- CSS focus marker renders.
- Diagnostics panel renders.
- Tizen API availability is recorded.

### Real TV Validation

Use real TV only after emulator debug does not show blocking runtime errors.

Validate all manual acceptance scenarios listed above.

## Implementation Notes

### File Organization

Prefer keeping v1 small:

- `src/main.js` for runtime logic
- `src/styles.css` for module CSS
- `tests/*.js` for Node built-in tests
- `package.json` for TizenBrew metadata and scripts

If `src/main.js` becomes too large:

- Split only if the repo gains a no-build loading strategy that TizenBrew can
  consume directly.
- Do not introduce bundling for v1 unless there is a strong reason.

### JavaScript Compatibility

Existing code uses broadly compatible JavaScript.

Prefer:

- Simple functions
- Defensive null checks
- No heavy syntax requiring transpilation
- No imported modules unless TizenBrew loading behavior is verified

Avoid:

- Runtime dependencies
- Build-only source that cannot run as injected JS
- Browser APIs that are not checked before use

### Performance

Risks:

- DOM scanning every keypress can be expensive.
- Stremio Web may rerender frequently.
- Player overlays may appear/disappear quickly.

Mitigation:

- Throttle candidate refresh.
- Cache candidates briefly.
- Invalidate cache on mutation, scroll, resize, and route changes.
- Use `getBoundingClientRect()` carefully.
- Keep diagnostics updates lightweight.

### Accessibility

The module is not a full accessibility layer, but it should avoid making things
worse:

- Preserve original DOM.
- Prefer real focus where safe.
- Do not remove labels or ARIA attributes.
- Avoid trapping focus except inside module-owned modal.
- Keep modal buttons clear and reachable.

## Risks

### R-001: Stremio DOM Instability

Stremio Web may change class names, structure, or player controls.

Mitigation:

- Use generic discovery first.
- Keep Stremio-specific selectors grouped.
- Avoid relying on minified implementation details.
- Record selector roles in diagnostics.

### R-002: TizenBrew Injection Timing

The script may run before or after key DOM structures exist.

Mitigation:

- Initialize idempotently.
- Use DOM-ready checks.
- Refresh candidates after mutations.
- Keep `evaluateScriptOnDocumentStart: false` unless testing proves otherwise.

### R-003: Device Key Differences

Samsung models and firmware can differ in key support.

Mitigation:

- Register optional keys only.
- Catch registration errors.
- Record supported/failed keys in diagnostics.
- Validate on the real TV.

### R-004: Player Control Fragility

Playback overlay and seekbar behavior may be implemented differently across
Stremio versions.

Mitigation:

- Prefer visible controls.
- Use conservative media fallback.
- Do not build a replacement overlay.
- Validate with real playback.

### R-005: App Exit May Be Unavailable In Injected Context

`tizen.application.getCurrentApplication().exit()` may not be available or may
refer to TizenBrew rather than a separable module context.

Mitigation:

- Feature-detect and catch errors.
- Test on real TV.
- Treat failure as a blocker requiring architecture discussion.
- Do not use partner-level kill APIs.

### R-006: Emulator Is Not TizenBrew

The emulator can debug Tizen web runtime but may not reproduce TizenBrew site
modification injection.

Mitigation:

- Use emulator only for initial debug.
- Keep real TV TizenBrew validation as final acceptance.

### R-007: Over-Interception

Capturing keys too aggressively can break Stremio Web.

Mitigation:

- Consume only handled keys.
- Keep text inputs hands-off.
- Allow Stremio in-page Back behavior first.
- Use diagnostics to inspect decisions.

## Stop Conditions

Stop and ask before proceeding if:

- A runtime dependency appears necessary.
- A build step appears necessary.
- `serviceFile` appears necessary.
- Generated Tizen Studio files would need to be committed.
- A partner/platform Tizen privilege appears necessary.
- Signing secrets or certificate passwords are needed.
- The same validation command fails twice for related reasons.
- The implementation requires replacing Stremio UI or player behavior.
- Real TV exit cannot be achieved with current-app `exit()`.
- Required files fall outside the allowed TaskCard write set.

## Acceptance Criteria For V1

V1 is done only when:

- Static checks pass.
- Unit tests cover key logic.
- Emulator debug pass is completed or a clear emulator limitation is documented.
- Real Samsung TV with TizenBrew validation passes.
- Original Stremio UI remains visually intact.
- Remote navigation works on main surfaces.
- Text input remains safe.
- Player overlay and seekbar behavior work on hardware.
- Media keys work where supported.
- Back behavior is predictable.
- Exit modal uses `Keep watching` and `End the app`.
- `End the app` exits via current-app `exit()` or the limitation is reported as
  a blocker, not silently ignored.
- No generated artifacts are committed by default.

## Completion Report Format

Each implementation TaskCard should report:

- Files changed
- Behavior implemented
- Validation commands run
- Validation result
- Emulator evidence, if applicable
- Real TV evidence, if applicable
- Risks or limitations
- Follow-up TaskCards recommended
