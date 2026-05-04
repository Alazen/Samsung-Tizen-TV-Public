# Focus and Spatial Navigation

Directional navigation stays inside runtime key handling and only considers the current Stremio DOM.

## Version 0.1.2 selector model

Selector design now starts from the sanitized Stremio DOM samples in `docs/validation/stremio-dom-samples/`. Those samples guide the runtime selector map, but they are not acceptance proof. Real Samsung TV validation remains required.

The runtime keeps a centralized `stremioSelectorGroups` contract with these groups:

- `authControls`
- `homeNavigation`
- `contentCards`
- `detailsActions`
- `streamRows`
- `playerContainers`
- `playerControls`
- `playerBackControls`
- `playerMenuControls`
- `menuControls`
- `focusGuards`
- `excludedControls`

The generic candidate fallback remains available, but Stremio-specific selectors are considered first.

## Candidate priority

Candidate collection follows this order:

1. Module-owned modal controls, only while a module modal is open.
2. Stremio player controls, when a player or visible video is active.
3. Stremio menu controls, when a menu appears open.
4. Auth and login controls, when auth UI is visible.
5. Detail and stream controls.
6. Home navigation and content controls.
7. Generic fallback controls.

## Candidate scoring

Each candidate carries a role, priority, rectangle, text, selector source, selector groups, and flags for Stremio-specific, player, auth, menu, focus-guard, and editable status.

Scoring rules:

- Exclude invisible or zero-size elements.
- Exclude focus guards and module-owned diagnostics or exit UI from normal content navigation.
- Penalize huge layout containers.
- Prefer actual controls over broad containers.
- Prefer Stremio-specific selectors over generic clickable elements.
- Prefer currently active player or overlay controls over background controls.
- Preserve editable passthrough for inputs, textareas, selects, contenteditable surfaces, and `role="textbox"` UI.

## Real-TV login/auth note

The first real-TV login was possible only after a manual workaround. Version `0.1.2` includes targeted auth controls and input safety so future login retests can move through email, password, checkboxes, login/signup buttons, OAuth controls, guest login, and mode switches without hijacking typing.
