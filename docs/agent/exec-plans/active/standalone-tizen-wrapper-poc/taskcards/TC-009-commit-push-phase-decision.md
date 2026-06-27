# TC-009: Commit, Push, and Phase 2 Decision Gate

Status: completed

## Objective

Commit and push all Phase 1 work (TC-005 through TC-008), verify GitHub state, and produce a phase-decision document that routes the next improvement cycle based on accumulated TV and emulator evidence.

## Parent ExecPlan

`docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/PLAN.md`

## Required context

- Files to read:
  - `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md` (full evidence)
  - `docs/agent/decision-log.md`
  - `docs/agent/known-risks.md`
- Docs to read:
  - `docs/agent/validation.md`

## Depends on

- TC-008 (completed)

## Can run in parallel with

- none

## Conflicts with files

- none known (docs-only)

## Files allowed to edit

- `docs/agent/exec-plans/active/standalone-tizen-wrapper-poc/EXECUTION_REPORT.md`
- `docs/agent/decision-log.md`
- `docs/agent/known-risks.md`

## Files forbidden

- Product source code (`harness/CodexTvRuntimeCheck/**`)
- Dependencies, lockfiles, root package scripts
- Signing material, credentials
- Generated artifacts
- TaskCards, `PLAN.md`, `EXECUTION_STATE.json`

## Exact target

### Step 1: Pre-commit validation

- Run `npm test`, `npm run check:syntax`, `npm run check:manifest`.
- Run `git status --short`, `git diff --cached --stat`.
- Review staged paths. Refuse generated artifacts.
- Run privacy check on staged docs per `docs/agent/validation.md`.

### Step 2: Commit and push

- Commit on `stremio-webapp-tizen` with a descriptive message referencing TC-005 through TC-008.
- Push to origin.
- Verify GitHub shows the commit and updated files.

### Step 3: Phase-decision document

Record in `docs/agent/decision-log.md`:

**Decision: Phase 2 routing based on TC-005 playback result and TC-008 navigation result.**

Three possible outcomes:

| TC-005 playback | TC-008 navigation | Phase 2 route |
|---|---|---|
| Works | Works | UX polish: player controls, Back/Exit refinement, diagnostics cleanup |
| Works | Partial | Navigation adapter tuning: real-TV selector refinement, focus ring visibility |
| Fails | Any | Playback investigation: AVPlay integration, player-path analysis, codec check |

### Step 4: Update known-risks

Add or update risks based on all evidence:
- Iframe same-origin status on real TV.
- Physical remote key-code mapping completeness.
- Stremio DOM stability for cached selectors.
- Playback codec support on real TV vs. emulator.

## Constraints

- This is a docs-only and commit/push TaskCard. No product code changes.
- The phase-decision document must be evidence-backed, not speculative.

## Documentation obligations

- Update `EXECUTION_REPORT.md` with final summary.
- Update `docs/agent/decision-log.md` with phase-decision.
- Update `docs/agent/known-risks.md` with accumulated risks.

## Validation

- `npm test`
- `npm run check:syntax`
- `npm run check:manifest`
- `git diff --check`
- `git status --short` (pre-commit review)
- `git diff --cached --stat` (pre-commit review)

## Done when

- All validation commands pass.
- Commit is pushed to `stremio-webapp-tizen`.
- GitHub shows the updated files.
- `decision-log.md` contains the phase-decision with evidence references.
- `known-risks.md` is updated.

## Stop conditions

- Push fails due to auth or remote issues.
- Privacy check finds leaked local environment details.
- Evidence is insufficient to make the phase-decision (record as "needs more data").

## Report format

- Changed files:
- Validation run:
- Commit SHA:
- GitHub verification:
- Phase 2 route:
- Remaining risks:
