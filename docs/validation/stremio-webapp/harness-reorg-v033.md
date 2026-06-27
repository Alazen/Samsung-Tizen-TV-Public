# Harness reorganization for stremio-webapp-tizen

Current branch: `stremio-webapp-tizen`

Historical source branch: `stremio-webapp-v033-harness-reorg`

Historical base branch: `stremio-webapp-v033`

Purpose: reorganize repository structure for the TizenBrew remote-control module and prepare a cleaner harness boundary before larger Tizen wrapper/refactor work.

## Structural changes

- Runtime entry moved from versioned legacy path to `src/tizenbrew/stremio-remote/main.js`.
- Root `package.json` still remains the TizenBrew manifest because TizenBrew installs from the repository branch root.
- Tests now read `package.json.main` instead of hard-coded legacy runtime paths.
- Harness documentation moved to `harness/tizenbrew/stremio-remote/` and no longer duplicates runtime code.
- Stale legacy runtime files were removed.

## Branch naming decision

`stremio-webapp-tizen` is the durable Tizen app/refactor workspace.

Do not create new version-number branches for normal app, wrapper, harness, or refactor work. Version-number branch names are only for disposable TizenBrew cache-busting test modules.

## Validation

Run:

```bash
node tests/manifest.test.js
node tests/syntax.test.js
node tests/stremio-dom-samples.test.js
```

## Risk

This is a structural/refactor branch. Use a fresh disposable test branch only if a real-TV TizenBrew cache-busting retest is required.
