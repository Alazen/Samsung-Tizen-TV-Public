# Stremio TizenBrew remote module

This directory is the canonical source location for the TizenBrew Stremio Web remote-control module.

## Runtime entry

- `main.js`: single-file runtime referenced by the root `package.json` `main` field.

The root manifest must continue to live at the repository root because TizenBrew installs GitHub modules from the repository branch root.

## Refactor boundary

Keep user-testable runtime behavior in `main.js` until a bundling step exists. Split source files only after adding a deterministic build command that regenerates the manifest `main` file and is covered by tests.
