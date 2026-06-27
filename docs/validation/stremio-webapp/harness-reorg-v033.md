# Harness reorganization from v033

Branch: `stremio-webapp-v033-harness-reorg`

Base branch: `stremio-webapp-v033`

Purpose: reorganize repository structure for the TizenBrew remote-control module and prepare a cleaner harness boundary before larger wrapper/refactor work.

## Structural changes

- Runtime entry moved from versioned legacy path to `src/tizenbrew/stremio-remote/main.js`.
- Root `package.json` still remains the TizenBrew manifest because TizenBrew installs from the repository branch root.
- Tests now read `package.json.main` instead of hard-coded legacy runtime paths.
- Harness documentation moved to `harness/tizenbrew/stremio-remote/` and no longer duplicates runtime code.
- Stale legacy runtime files are removed from this branch.

## Validation

Local syntax validation performed on the reorganized files before pushing:

```bash
node tests/manifest.test.js
node tests/syntax.test.js
node --check src/tizenbrew/stremio-remote/main.js
```

Full DOM sample validation still depends on the repository `docs/validation/stremio-dom-samples/` fixtures being present in the checkout.

## Risk

This is a structural branch, not a real-TV behavior branch. Use a fresh user-test branch if this reorganized runtime is promoted to TV testing.
