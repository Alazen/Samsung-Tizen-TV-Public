# TaskCard Template

```markdown
# TaskCard: <short-name>

## Objective
Implement one bounded change.

## Required context
- Files to read:
- Docs to read:

## Files allowed to edit
- <path>

## Files forbidden
- Generated artifacts and temporary files
- Vendored docs unless explicitly requested
- Secrets/signing material

## Constraints
- Keep scope within allowed files.
- Do not add dependencies unless approved.
- Do not revert unrelated edits by other workers.

## Validation
- Primary: `npm run check:syntax`
- Secondary: `npm run check:manifest`
- Regression: `npm test`

## Done when
- Target behavior is implemented.
- Required validation passes.
- Only related files changed.

## Stop conditions
- Dependency/schema/auth/permissions/billing/deployment/secrets changes become necessary.
- Same validation command fails twice.
- Required edits exceed allowed files.

## Report format
- Changed files:
- Validation run:
- Result:
- Risks:
```
