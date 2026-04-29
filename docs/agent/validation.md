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
- `git diff --check -- AGENTS.md docs/agent .agents/skills/stremio-task-executor/SKILL.md`

If scripts are available and the TaskCard requires full regression, run the standard command set after static checks.

## Commit safety gate (required before any commit)
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
