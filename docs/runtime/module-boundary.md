# Runtime Module Boundary

The module augments `https://web.stremio.com/` with TV-remote usability behavior only.

## Runtime contract
- The bootstrap exposes one namespace at `window.__STREMIO_TIZENBREW_REMOTE__` with `init`, `injectStylesIfPossible`, `registerOptionalKeys`, `getState`, and `renderDiagnostics`.
- Bootstrap is idempotent; repeated loads should reuse the existing namespace instead of re-registering behavior.
- Remote key routing is anchored on the document `keydown` listener.
- Optional key registration is limited to available Tizen remote extras such as media, color, and Info keys; it does not claim ownership of mandatory navigation keys.
- Editable surfaces keep native arrow and Enter behavior so text entry is not hijacked by remote-navigation logic.
- Back is a routing boundary, not a broad exit-policy owner; it can flow into the documented back/exit path, but it does not redefine Stremio or Tizen behavior beyond that boundary.
- Missing `document` or optional Tizen APIs must degrade to non-throwing no-op or soft-fail paths.

## In scope
- Spatial navigation and focus visibility
- Remote/media key handling hooks
- Predictable back/exit affordances
- Optional diagnostics for debug sessions

## Out of scope
- Replacing Stremio Web pages, routing, authentication, settings, catalog, addons, or playback engine
- Native Tizen app behaviors
