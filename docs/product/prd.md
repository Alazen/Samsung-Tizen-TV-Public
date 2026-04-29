# PRD: Stremio Web TV Remote (Initial Skeleton)

## Objective

Create a safe, testable baseline module for future TV remote enhancements on Stremio Web through TizenBrew.

## In Scope (Phase 0)

- TizenBrew manifest for `mods` targeting `https://web.stremio.com/`
- Script entrypoint at `src/main.js`
- Optional stylesheet file at `src/styles.css`
- Soft-fail key registration helpers for optional keys
- Basic static checks with Node built-in test runner

## Out of Scope (Phase 0)

- Full spatial navigation
- UI rewrites
- Background services (`serviceFile`)
- Packaging artifacts (WGT/ZIP)

## Functional Requirements

1. Module manifest must declare:
   - `packageType: "mods"`
   - `websiteURL: "https://web.stremio.com/"`
   - `main: "src/main.js"`
2. Manifest `keys` must avoid mandatory TV keys (`Arrow*`, `Enter`, `Back`).
3. Runtime code must not crash in non-Tizen environments.
4. CSS injection should be best-effort and optional.

## Quality Requirements

- No runtime dependencies
- No build step
- Tests pass via `npm test`
