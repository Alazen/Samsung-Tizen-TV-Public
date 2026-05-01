# Focus and Spatial Navigation

Directional navigation stays inside the existing document `keydown` flow and only considers the current Stremio DOM.

## Rules
- Build the candidate set from visible, interactable elements already present in the app DOM.
- Exclude module-owned diagnostics and exit UI from normal content navigation.
- Derive the current candidate safely from the focused element; if none is focused, seed the first usable candidate for the requested direction.
- Move by geometry, using element rectangles to decide the next candidate.
- Do not fall back to DOM order when geometry yields no directional match; keep current focus and soft-fail the key event path.
- If no valid candidate exists, or a required DOM/Tizen API is missing, fail softly without trapping focus.
- Preserve editable passthrough for arrow and Enter on inputs, textareas, selects, `contenteditable` / `isContentEditable` surfaces, and `role="textbox"` UI.
- Modal-specific navigation remains deferred to Task 4e.
- Back is handled outside spatial navigation and should follow `docs/runtime/back-exit.md`.
