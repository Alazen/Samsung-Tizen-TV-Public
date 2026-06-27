# Validation Policy

Run the narrowest relevant command first.

## Standard command set

1. `npm run check:syntax`
2. `npm run check:manifest`
3. `npm test`

Use this order unless a TaskCard specifies a stricter sequence.

If the local npm launcher is unavailable, use the direct Node equivalents:

- `node tests/syntax.test.js`
- `node tests/manifest.test.js`
- `node tests/stremio-dom-samples.test.js`

## TizenBrew TV test-build rule

For any runtime change that should be tested through the TizenBrew GitHub module on a real TV:

1. Bump `package.json` `version` before the TV retest commit.
2. Use the TizenBrew module reference in this form:
   `Alazen/Samsung-Tizen-TV-Public@branch-name`.
3. Do not use the `gh/` prefix.
4. If TizenBrew cache-busting requires a fresh module, create a disposable test branch from the current source and document it.
5. Commit and push the runtime change and version bump to that branch.
6. Remove the old module entry on the TV, add the new branch module entry, and confirm the module card shows the new version before retesting.

If the TV is configured with a pinned commit SHA, pushed branch updates will not be picked up automatically. Use pinned SHAs only for stable release candidates.

## Durable Tizen app branch rule

`stremio-webapp-tizen` is the durable refactor and Tizen app workspace. Do not create new version-number branches for normal harness, wrapper, or app refactor work. Version-number branch names are only for disposable TizenBrew cache-busting test modules.

## Docs-only or harness-only edits

Use static checks first:

```bash
git diff --check -- AGENTS.md PLAN.md README.md docs/agent .agents/skills
```

For validation-doc updates, include `docs/validation`:

```bash
git diff --check -- PLAN.md README.md docs/agent docs/validation
```

If scripts are available and the TaskCard requires full regression, run the standard command set after static checks.

## Public docs privacy check

Before committing public documentation that records local validation evidence, scan non-vendored docs for local environment fingerprints. Redact:

- absolute local checkout paths
- local Windows usernames and machine identities
- exact Tizen Studio install roots
- exact emulator IDs and emulator profile names
- exact debug ports and CDP target IDs
- signing profile names and certificate file locations
- raw local logs
- private credentials or signing material

Placeholders to use:

- `<repo-root>`
- `<tizen-studio-root>`
- `<emulator-id>`
- `<emulator-profile>`
- `<debug-port>`
- `<target-id>`
- `<windows-identity>`
- `<signing-profile>`

Keep commit SHAs and source hashes only when they are needed for source-freshness evidence.

## Commit safety gate

1. `git status --short`
2. `git diff --cached --stat`
3. Review staged paths; refuse generated artifacts unless explicitly requested.
4. Call out unusually large staged files before committing.

## Generated artifacts policy

Do not commit by default:

- `target/`
- `*.exe`
- `*.zip`
- `*.wgt`
- `*.log`
- caches
- temporary files
