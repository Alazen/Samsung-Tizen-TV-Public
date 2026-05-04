# Focus and Spatial Navigation

Directional navigation stays inside runtime key handling and only considers the current Stremio DOM.

## Rules

- Build the candidate set from visible, interactable elements already present in the app DOM.
- Exclude module-owned diagnostics and exit UI from normal content navigation.
- Include login/auth controls such as inputs, labels, buttons, links, checkbox rows, role buttons, and visible clickable controls.
- Derive the current candidate safely from the focused element; if none is focused, seed a safe visible candidate for the requested direction.
- Move by geometry, using element rectangles to decide the next candidate.
- If geometry yields no directional match, fall back to adjacent DOM order instead of trapping the user.
- If no valid candidate exists, or a required DOM/Tizen API is missing, fail softly without throwing.
- Preserve editable passthrough for arrow and Enter on inputs, textareas, selects, `contenteditable` / `isContentEditable` surfaces, and `role="textbox"` UI.
- Back is handled outside spatial navigation and should follow `docs/runtime/back-exit.md`.

## Real-TV login/auth note

The first real-TV login was possible only after a manual workaround. Auth screen focus is a secondary follow-up after key delivery and diagnostics are proven, but candidate collection now includes common login and auth controls to reduce first-run friction.
