# Back and Exit Behavior

## Back behavior
- Back enters this boundary through the document `keydown` route, not through focus heuristics.
- First try contextual navigation within current Stremio view.
- Avoid destructive navigation jumps.
- Keep overlay-close and history fallbacks conservative.

## Exit behavior
- Use the public app-exit API only after Back routing reaches the module exit boundary.
- Do not widen this layer into a full exit-policy owner.
