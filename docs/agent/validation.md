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

## Docs-only or harness-only edits

Use static checks first:

```bash
git diff --check -- AGENTS.md PLAN.md docs/agent .agents/skills
```

For validation-doc updates, include `docs/validation`:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
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
- `*.log`
- caches
- temporary files
