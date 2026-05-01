# Diagnostics

Diagnostics are optional and development-focused.

## Requirements
- Keep diagnostics unobtrusive and easy to disable.
- Prefer console-visible signals for emulator and Web Inspector checks.
- Do not require persistent runtime dependencies.

## Contract
- `getState()` is the stable snapshot for namespace and availability checks.
- `renderDiagnostics()` should stay best-effort and return without throwing when `document` or `body` is unavailable.
- Diagnostics may surface the active namespace state, key handling, and API availability, but they should not become a persistent app dependency.
