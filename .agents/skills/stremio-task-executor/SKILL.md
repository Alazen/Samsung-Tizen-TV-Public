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

## Emulator Debug Harness
Use this when a bounded TaskCard reaches emulator-debug validation.

1. Use the checked-in `CodexTvRuntimeCheck` project root as the harness path.
2. Before accepting emulator or Web Inspector behavior as evidence, use `.agents/skills/harness-parity-live-served-verification` to prove repo source, ignored Debug output, and live served `js/stremio-remote.js` contain the expected source marker.
3. If optional remote key registration is under validation, ensure `http://tizen.org/privilege/tv.inputdevice` is present in the harness `config.xml`.
4. Package with `E:\tizen-studio\tools\tizen-core\tz.exe pack -w <harness> -t wgt -s EmulatorTVProfile`.
5. Install with `E:\tizen-studio\tools\tizen-core\tz.exe install -e emulator-26101 -w <harness>`.
6. Run with `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w <harness>`.
7. Capture evidence for diagnostics panel presence, key event names and codes, `window.tizen` / `tizen.tvinputdevice` / `tizen.application` availability, registered versus failed optional keys, and Web Inspector or Log Console attachment in debug mode.
8. Generated `Debug/` folders and `.wgt` packages are non-source artifacts; do not commit them.

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
