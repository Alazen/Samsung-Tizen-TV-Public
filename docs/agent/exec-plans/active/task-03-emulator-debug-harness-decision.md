# ExecPlan: Task 3, Emulator Debug Harness Decision

## Status
- State: blocked
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: keep Task 3 blocked until the real desktop user context can prove a deterministic fresh-code refresh path, or until a later Task 4 decomposition explicitly preserves the blocker and real-TV validation requirement.
- Progress: Task 3A completed, Task 3B produced final blocker evidence, and Task 3C recorded Decision B plus the residual risks.

## Goal
Choose and record the repeatable emulator debug harness path for bounded runtime work.

## Context
Use the Samsung TV emulator as the local runtime/debug proxy while deferring final product acceptance to a real Samsung TV on TizenBrew.

## Relevant files
- `docs/agent/local-toolchain.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/decision-log.md`

## Allowed work area
- `docs/agent/exec-plans/active/`
- `docs/agent/task-cards/active/`
- documentation files directly referenced by the TaskCards

## Forbidden work
- Application behavior changes
- Package/dependency changes
- Generated artifacts

## Steps
1. Create Task 3 bounded TaskCards for debug-path validation and decision capture.
2. Execute documented emulator/debug checks.
3. Record decision and residual limits.
4. Stop if the command path attaches to a stale installed app or requires unavailable signing secrets for a fresh install.

## Validation commands
- `git diff --check -- docs/agent/exec-plans docs/agent/task-cards docs/validation`

## Acceptance criteria
- TaskCards exist with allowed files, validation commands, acceptance criteria, and stop conditions.
- Preferred debug path is explicitly recorded, or a blocker is documented with the exact failing refresh/install step.
