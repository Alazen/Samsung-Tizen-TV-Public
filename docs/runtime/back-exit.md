# Back and Exit Behavior

Back and Exit behavior belongs to the runtime routing boundary. It must stay conservative, observable, and reversible whenever possible.

## Back behavior priority

Back enters through the existing document `keydown` route, not through spatial focus heuristics.

Process Back in this order:

1. If diagnostics are open, close diagnostics and consume the event.
2. If the module exit modal is open, treat Back as Keep watching, close the modal, and restore the previous content focus when possible.
3. If a safe Stremio dialog or overlay action is available, prefer closing that contextual surface instead of opening the module exit modal.
4. If browser history is safely past the captured initial boundary, use the conservative history fallback.
5. If no safer contextual action exists, open the module exit modal.

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

## Diagnostics requirements

Diagnostics should expose enough evidence for the Task 4.5 emulator smoke bridge without requiring emulator execution during Task 4:

- current path
- last key
- last consumed action
- current focus role
- candidate count
- diagnostics open state
- exit modal open state
- last Back resolution
- last exit attempt
- last exit result
- optional key registration status
- API availability
- source freshness or served-source marker when available
- module injection or load marker when available

## Soft-fail rules

- Missing `document`, focus, history, or Tizen APIs must not throw.
- A failed exit attempt must be reported, not retried in a loop.
- Emulator observations remain local confidence only and do not replace real Samsung TV validation.
