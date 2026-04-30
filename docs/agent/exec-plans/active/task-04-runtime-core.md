# ExecPlan: Task 4, Runtime Core

## Status
- State: active
- Current owner: Codex
- Last updated: 2026-04-30
- Next action: decompose into TaskCards after Task 3 debug harness decision

## Goal
Implement the thin TV-focused runtime control layer without replacing Stremio Web.

## Context
Durable runtime behavior is defined in `docs/runtime/*.md`; this plan tracks execution sequencing only.

## Steps
1. Convert runtime behavior slices into bounded TaskCards.
2. Implement in small increments with validation after each change.
3. Preserve no-build, no-runtime-dependency constraints.

## Validation commands
- `npm run check:syntax`
- `npm run check:manifest`
- `npm test`

## Stop conditions
Stop if work requires unsupported TV privileges, undocumented device behavior, or Samsung Seller Office-only information.
