# ExecPlan: Task 6, Real TV TizenBrew Validation

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-05-01
- Next action: prepare validation TaskCards after Task 5 emulator bridge results are recorded

## Goal
Validate behavior on a real Samsung TV running the TizenBrew injection path.

## Context
Emulator results from Task 5 are necessary but not sufficient; final acceptance requires real-device key behavior, playback context checks, and back/exit confirmation.

## Steps
1. Define bounded real-TV validation TaskCards.
2. Execute acceptance procedure in `docs/validation/real-tv-validation.md`.
3. Record results and remaining risks.

## Validation commands
- `git diff --check -- docs/validation docs/agent/exec-plans`

## Stop conditions
Stop if required validation access depends on unavailable signing secrets or Seller Office-only capabilities.
