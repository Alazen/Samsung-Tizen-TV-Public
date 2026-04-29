# Known Risks

## R-001: Validation scripts may be introduced by parallel work
- Date: 2026-04-29
- Risk: `check:manifest` and `check:syntax` may be unavailable until Worker B finalizes package scripts.
- Impact: full validation loop may temporarily fail even when harness docs are correct.
- Mitigation: keep command contract documented; re-run once scripts are merged.

## R-002: Multi-worker overlap
- Date: 2026-04-29
- Risk: parallel edits can cause stale assumptions in task execution.
- Impact: accidental scope creep or conflicting docs.
- Mitigation: keep TaskCards file-scoped, re-check `git status` before validating or committing.
