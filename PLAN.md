# PLAN.md: Stremio WebApp for Samsung Tizen

## Current branch

`stremio-webapp-tizen`

This is now the durable workspace for the Samsung Tizen Stremio WebApp effort. Do not use version-number branch names for normal refactor work. Versioned branches were only useful for TizenBrew cache-busting during real-TV module tests.

## Current direction

The project has two related tracks:

1. Preserve the existing TizenBrew Stremio Web remote-control module while it remains useful for real-TV testing.
2. Prepare a standalone Tizen Web App wrapper proof of concept that loads `https://web.stremio.com/` directly and adds a lightweight TV remote/debug layer.

The preferred product direction is not a full Stremio UI rebuild yet. The goal is to keep Stremio Web as the UI and improve Samsung TV remote-control usability.

## Current repository structure

- `package.json`: root TizenBrew manifest for compatibility with GitHub module installs.
- `src/tizenbrew/stremio-remote/main.js`: canonical runtime for the Stremio Web remote-control module.
- `harness/tizenbrew/stremio-remote/`: harness notes and future local-debug helpers.
- `docs/agent/`: execution protocol, validation policy, repository map, and TaskCard guidance.
- `docs/validation/`: validation fixtures and execution reports.
- `tests/`: Node-based manifest, syntax, and DOM-sample checks.

## TizenBrew install format

Use:

```text
Alazen/Samsung-Tizen-TV-Public@branch-name
```

Do not use `gh/`.

## Active next work

1. Keep `stremio-webapp-tizen` as the durable refactor branch.
2. Let the standalone Tizen Web App wrapper proof of concept proceed in its own branch or subdirectory.
3. Do not mutate old broken test branches such as `stremio-webapp-v032`.
4. If a new real-TV TizenBrew retest is needed, create a fresh disposable test branch from the current source and document that it exists only for cache-busting.
5. Keep tests manifest-driven so agents use `package.json.main` instead of hard-coded legacy paths.

## Validation policy

Run the narrowest relevant command first:

```bash
node tests/manifest.test.js
node tests/syntax.test.js
node tests/stremio-dom-samples.test.js
```

Use `npm test` when npm is available.

## Privacy and safety

Public docs must use placeholders for local checkout paths, Tizen Studio roots, emulator IDs, profile names, debug ports, CDP target IDs, Windows usernames, machine-specific folder names, and signing profile names.

Do not commit generated packages, build outputs, logs, exact emulator IDs, debug ports, local machine names, signing profiles, credentials, or private stream URLs.

## Rule for future work

Every active agent or subagent task must have a bounded TaskCard or clear chat instruction with allowed files, validation commands, acceptance criteria, and stop conditions.
