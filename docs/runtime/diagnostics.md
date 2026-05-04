# Diagnostics

Diagnostics are optional and development-focused, but they are now the first real-TV verification surface.

## Requirements

- Keep diagnostics unobtrusive and easy to disable.
- Open diagnostics from `Info` and color keys when real TV optional key registration works.
- Also tolerate real-TV fallback key events by mapping common Samsung `keyCode` values.
- Do not require persistent runtime dependencies.

## Contract

- `window.__STREMIO_TIZENBREW_REMOTE__.getState()` is the stable snapshot for namespace and availability checks.
- `openDiagnostics()`, `closeDiagnostics()`, and `toggleDiagnostics()` are public debugging helpers.
- Diagnostics rendering stays best-effort and returns without throwing when `document` or `body` is unavailable.
- Diagnostics must include runtime version, markers, listener paths, raw key values, normalized key, video state, candidate count, and Back resolution.

## Real-TV root-cause signal

The first real-TV run showed that `Info` and A/B/C/D did not open diagnostics. That means the issue is broader than a single Info-key name. The runtime must inspect optional-key registration, listener attachment, fallback event paths, raw keyCode mapping, and Tizen hardware Back events before focusing only on spatial navigation.
