# Agent Architecture

Purpose: give agents the architecture boundary without duplicating product docs or Tizen references.

## Current product shape

This repository is the Samsung Tizen Stremio WebApp workspace.

Current direction:

1. Preserve the existing TizenBrew Stremio Web remote-control module while it remains useful for real-TV testing.
2. Prepare a standalone Tizen Web App wrapper proof of concept that loads `https://web.stremio.com/` directly and adds a lightweight TV remote/debug layer.

Do not rebuild the full Stremio UI unless a later approved plan explicitly chooses that direction.

## Current source boundaries

- `package.json`: root TizenBrew manifest for GitHub module installs.
- `src/tizenbrew/stremio-remote/main.js`: canonical TizenBrew Stremio Web remote-control runtime.
- `src/tizenbrew/stremio-remote/README.md`: source boundary for the current runtime.
- `harness/tizenbrew/stremio-remote/`: harness notes and future local-debug helpers; do not duplicate runtime code here.
- `harness/CodexTvRuntimeCheck/`: intentionally repurposed as the standalone Stremio Web Wrapper POC codebase (HTML, CSS, config.xml, and main.js runtime) for standalone TV wrapper validation while older TizenBrew remote testing remains active.
- Future standalone Tizen wrapper production paths will be defined in a later approved plan.

## Runtime constraints

- Vanilla JavaScript only unless explicitly approved.
- No new runtime framework unless explicitly approved.
- No new dependency or lockfile change unless explicitly approved.
- Do not commit packaged binaries, logs, or temporary emulator outputs.
- Do not rely on unsupported TV privileges or undocumented device behavior.

## Tizen-specific rules

- Use `docs/tizen/index.md` and `docs/tizen/source-map.md` for official-doc routing.
- Do not scan the full vendored Samsung docs tree unless routed by `docs/tizen/source-map.md`.
- Emulator validation is useful for local confidence but never final product acceptance.
- Real Samsung TV validation is mandatory for playback and final remote-control behavior.

## TizenBrew compatibility

- TizenBrew module install strings must use `Alazen/Samsung-Tizen-TV-Public@branch-name`.
- Do not use a `gh/` prefix.
- Versioned branches are disposable cache-busting test modules only.
- Durable refactor work stays on `stremio-webapp-tizen` or another explicitly approved stable purpose branch.

## Stop and ask before

- Adding dependencies or scripts.
- Editing package manager lockfiles.
- Changing signing, certificates, deployment, permissions, secrets, auth, billing, database, migrations, or production data.
- Replacing the Stremio Web UI strategy.
- Treating emulator success as real-device acceptance.
