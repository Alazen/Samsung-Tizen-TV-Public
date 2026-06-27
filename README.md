# Stremio WebApp for Samsung Tizen

This branch is the current workspace for the Samsung Tizen Stremio WebApp effort.

Current branch:

`stremio-webapp-tizen`

## Current direction

The project is moving from versioned TizenBrew experiment branches toward a stable Tizen app workspace. The immediate goal is still to keep Stremio Web as the UI and improve Samsung TV remote-control usability. A standalone Tizen Web App wrapper may be added next so playback and debugging can be compared against the TizenBrew module path.

## Current source layout

- `package.json`: root TizenBrew manifest for the existing module path. Keep it at the repository root while TizenBrew compatibility is still needed.
- `src/tizenbrew/stremio-remote/main.js`: canonical Stremio Web remote-control runtime.
- `harness/tizenbrew/stremio-remote/`: harness notes and future local-debug helpers for the TizenBrew remote layer.
- `docs/agent/`: execution protocol, validation policy, repository map, and TaskCard guidance.
- `docs/validation/`: validation fixtures and execution reports.
- `tests/`: Node-based manifest, syntax, and DOM-sample checks.

## Branch naming

Do not create new version-number branches for normal refactor work. Versioned branch names were useful for TizenBrew cache-busting during real-TV test builds. New durable development should use stable purpose branches, starting with `stremio-webapp-tizen`.

If a TizenBrew real-TV retest is needed and cache-busting requires a fresh module branch, create that explicitly as a test branch and document it as disposable.

## TizenBrew install string rule

When testing through TizenBrew, use this format:

```text
Alazen/Samsung-Tizen-TV-Public@branch-name
```

Do not use a `gh/` prefix.

## Development

No runtime dependencies are required for the current module checks.

```bash
npm test
```

If the local npm launcher is unavailable, run the checks directly:

```bash
node tests/manifest.test.js
node tests/syntax.test.js
node tests/stremio-dom-samples.test.js
```

## Safety

Do not commit generated packages, build outputs, logs, exact emulator IDs, debug ports, local machine names, signing profiles, credentials, or private stream URLs.
