# TC-000: <short-name>

Status: pending|active|blocked|completed|cancelled

## Parent goal

- Plan: `../PLAN.md`
- Milestone:

## Dependencies

- none

## Objective

<TODO: exact bounded objective>

## Files to inspect

- `TODO`

## Files allowed to edit

- `TODO`

## Files forbidden

- generated artifacts
- signing material
- private credentials
- auth, billing, deployment, or production data unless explicitly approved

## Exact implementation target

<TODO: what must change and what must not change>

## Validation command

```bash
TODO
```

## Done when

- [ ] Implementation target complete.
- [ ] Validation result recorded.
- [ ] Changed files listed in execution report.

## Stop conditions

- unsafe_unknown
- approval_required
- validation_repeated_failure
- forbidden_file_required
- dependency_or_lockfile_required
- generated_artifact_required
- product_scope_ambiguity

## Checkpoint requirements

- Update `../EXECUTION_STATE.json`.
- Update `../EXECUTION_REPORT.md`.
- Record decisions or risks if durable.
