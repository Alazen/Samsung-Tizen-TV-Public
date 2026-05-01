# Focus and Spatial Navigation

Define directional navigation among existing Stremio DOM elements using non-invasive heuristics.

## Rules
- Directional navigation is evaluated only after the document-level `keydown` route has accepted the event.
- Prefer visible, interactable elements.
- Preserve editable passthrough for arrow and Enter so inputs, textareas, selects, contenteditable or `isContentEditable` surfaces, and `role="textbox"` UI keep native behavior.
- Maintain high-contrast focus treatment.
- Fail softly when target elements are missing.
- Back is handled outside spatial navigation and should follow `docs/runtime/back-exit.md`.
