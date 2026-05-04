# Back and Exit Behavior

Back and Exit behavior belongs to the runtime routing boundary. It must stay conservative, observable, and reversible whenever possible.

## Version 0.1.2 Back priority

Back can enter through `keydown`, `keyup`, `keypress`, or the Tizen `tizenhwkey` route. Version `0.1.2` keeps those listener paths and adds player-aware Back behavior derived from the sanitized player samples.

Process Back in this order:

1. If diagnostics are open, close diagnostics and consume the event.
2. If the module exit modal is open, treat Back as Keep watching, close the modal, and restore previous content focus when possible.
3. If an editable field is focused, blur that field and consume the event.
4. If a Stremio player menu or overlay menu appears open, click a visible close, back, or menu control when available.
5. If a player or visible video is active, click a visible Stremio Back, Close, Exit, Return, or arrow-like player control when available.
6. Dispatch an Escape fallback when available.
7. Use `history.back()` if the route moved beyond the captured initial boundary.
8. If no safer contextual action exists, open the module exit modal.

## Dialog and overlay boundaries

- Module-owned diagnostics and exit UI are not normal content-navigation candidates.
- Modal-specific navigation is allowed only while the module exit modal is open.
- Directional navigation inside the module exit modal is limited to modal actions.
- Back must never trap focus inside a dialog or require unsupported Tizen privileges.

## Exit behavior

The module exit modal is the explicit boundary before attempting application exit.

- Keep watching closes the modal and restores focus when possible.
- End the app attempts the public Tizen application exit path only when that API exists.
- Missing Tizen application APIs are recorded as a soft failure.
- Exit results must be visible through diagnostics.

## Real-TV diagnostics requirements

Diagnostics should expose current path, runtime version, listener path, raw event type, raw key, raw code, keyCode, `which`, `keyName`, normalized key, last consumed action, current focus role, candidate count, last Back resolution, player and video state, optional key registration status, API availability, source marker, and injection marker.

## Soft-fail rules

- Missing `document`, focus, history, video, or Tizen APIs must not throw.
- A failed exit attempt must be reported, not retried in a loop.
- Real Samsung TV validation is mandatory before acceptance.
