# Stremio Web TV Remote (TizenBrew Module Skeleton)

This repository now includes an initial TizenBrew `mods` module skeleton for Stremio Web on Samsung Tizen TVs.

## Scope

- Vanilla JavaScript only (`src/main.js`)
- Optional stylesheet injection (`src/styles.css`)
- Tizen key registration helpers with soft-fail behavior outside Tizen
- Node built-in static checks (`tests/*.test.js`)

## Development

No build step and no runtime dependencies are required.

```bash
npm test
```

If the local npm launcher is unavailable, run the checks directly:

```bash
node tests/manifest.test.js
node tests/syntax.test.js
```

Additional checks:

```bash
npm run check:manifest
npm run check:syntax
```
