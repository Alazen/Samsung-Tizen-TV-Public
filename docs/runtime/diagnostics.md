# Diagnostics

Diagnostics are optional and development-focused, but they are now the first real-TV verification surface.

## Version 0.1.2 requirements

- Keep diagnostics unobtrusive and easy to disable.
- Show a temporary boot badge that says `Stremio Remote 0.1.2 loaded` so testers can distinguish missing injection from missing key delivery.
- Open diagnostics from `Info` and color keys when real TV optional key registration works.
- Support repeated Info or color-key fallback within the diagnostics repeat window.
- Map common Samsung `keyCode` values for Info, color keys, media keys, arrows, Enter, and Back.
- Listen on both `document` and `window` for `keydown`, `keyup`, `keypress`, and `tizenhwkey`.
- Do not require persistent runtime dependencies.

## Contract

- `window.__STREMIO_TIZENBREW_REMOTE__.getState()` is the stable snapshot for namespace and availability checks.
- `openDiagnostics()`, `closeDiagnostics()`, and `toggleDiagnostics()` are public debugging helpers.
- Diagnostics rendering stays best-effort and returns without throwing when `document` or `body` is unavailable.
- Diagnostics must include runtime version, markers, listener paths, raw key values, normalized key, candidate groups, video state, player state, candidate count, and Back resolution.

## Real-TV root-cause signal

The first real-TV run showed that `Info` and A/B/C/D did not open diagnostics. That means the issue is broader than a single Info-key name. Version `0.1.2` is designed to prove whether the module loads, whether optional keys register, which listener path receives events, and whether normalized key routing reaches diagnostics.
