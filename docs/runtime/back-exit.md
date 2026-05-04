# Back and Exit Behavior

Back and Exit behavior belongs to the runtime routing boundary. It must stay conservative, observable, and reversible whenever possible.

## Back behavior priority

Back can enter through `keydown`, `keyup`, `keypress`, or the Tizen `tizenhwkey` route. Real-TV validation showed that relying only on the document `keydown` path is not enough.

Process Back in this order:

1. If diagnostics are open, close diagnostics and consume the event.
2. If the module exit modal is open, treat Back as Keep watching, close the modal, and restore the previous content focus when possible.
3. If an editable field is focused, blur that field and consume the event.
4. If a Stremio player or visible video is active, prefer player exit behavior:
   - pause the video when possible;
   - click a visible Back, Close, Exit, Return, or arrow-like player control when possible;
   - dispatch an Escape fallback when available;
   - call `history.back()` as the final player-route fallback.
5. If browser history is safely past the captured initial boundary, use history back.
6. If no safer contextual action exists, open the module exit modal.

## Dialog and overlay boundaries

- Module-owned diagnostics and exit UI are not normal content-navigation candidates.
- Modal-specific navigation is allowed only while the module exit modal is open.
- Directional navigation inside the module exit modal is limited to the modal actions.
- Back must never trap focus inside a dialog or require unsupported Tizen privileges.

## Exit behavior

The module exit modal is the explicit boundary before attempting application exit.

- Keep watching closes the modal and restores focus when possible.
- End the app attempts the public Tizen application exit path only when that API exists.
- Missing Tizen application APIs are recorded as a soft failure.
- Exit results must be visible through diagnostics.

## Real-TV diagnostics requirements

Diagnostics should expose enough evidence for real-TV debugging without Web Inspector access:

- current path;
- runtime version;
- last event listener path;
- last raw event type;
- last raw key;
- last raw code;
- last keyCode;
- last `which`;
- last `keyName`;
- normalized key;
- last consumed action;
- current focus role;
- candidate count;
- last Back resolution;
- player/video state;
- optional key registration status;
- API availability;
- source and injection markers.

## Soft-fail rules

- Missing `document`, focus, history, video, or Tizen APIs must not throw.
- A failed exit attempt must be reported, not retried in a loop.
- Real Samsung TV validation is mandatory before acceptance.
