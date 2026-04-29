---
name: stremio-task-executor
description: Execute one bounded Stremio TaskCard end to end using allowed-file scope, required validation commands, and structured stop/report rules. Do not use for product discovery or open-ended architecture design.
---

# stremio-task-executor

## Use only when
- A TaskCard defines objective, allowed files, constraints, and done conditions.
- The task is implementation or documentation execution inside this repository.

## Do not use when
- The request is still planning, ideation, or architecture selection.
- The task needs deployment, secrets, signing material, billing, or production-permission decisions.
- The required scope exceeds TaskCard boundaries.

## Required inputs
- Task summary
- Allowed edit files
- Acceptance criteria
- Validation commands

## Execution steps
1. Read `AGENTS.md` and required TaskCard context.
2. Confirm edit scope and list forbidden paths.
3. Make the smallest change that satisfies the objective.
4. Run validation in order:
   - `npm run check:syntax`
   - `npm run check:manifest`
   - `npm test`
   If npm is unavailable, use `node tests/syntax.test.js` and `node tests/manifest.test.js`.
5. If one command fails, attempt one in-scope fix and retry once.
6. Stop after a second failure of the same command and report structured failure.
7. Report changed files, commands run, results, and remaining risks.

## Safety rules
- Do not revert unrelated edits from other workers.
- Do not commit generated artifacts by default (`target/`, `*.exe`, `*.zip`, `*.log`, caches, temp files).
- Before any commit, run:
  1. `git status --short`
  2. `git diff --cached --stat`
  3. staged-path review and large-file callout

## Stop conditions
- Scope expansion beyond allowed files.
- Dependency/schema/auth/permissions/deployment/secret changes required.
- Two failures of the same validation command.
