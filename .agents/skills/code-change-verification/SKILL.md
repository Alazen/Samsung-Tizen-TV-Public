---
name: code-change-verification
description: Verify a completed code/config/docs change against allowed files, validation gates, and artifact safety. Use after edits, before final reporting. Do not use to make product decisions or bypass failing validation.
---

# Code Change Verification

## Use only when

- A change has already been made.
- The task has allowed files, validation commands, or acceptance criteria.
- The agent needs a final consistency pass before reporting.

## Do not use when

- No files were changed.
- The request is planning-only.
- The task requires deployment, signing, secrets, auth, billing, production data, or generated artifacts without explicit approval.

## Required inputs

- TaskCard or explicit chat instruction.
- Changed file list.
- Validation commands run or unavailable reason.

## Allowed files/folders

- Read any task-relevant source, docs, tests, or harness files.
- Edit only report/risk/decision docs when recording verification outcomes unless the task explicitly permits fixes.

## Steps

1. Confirm changed files are inside the allowed file set.
2. Confirm no generated artifacts or private local evidence were committed.
3. Confirm validation commands match `docs/agent/validation.md` or the TaskCard.
4. Confirm docs mention unavailable validation honestly.
5. Record durable risks or decisions if new.
6. Prepare final response with changed files, validation, risks, and next action.

## Validation commands

- Use the TaskCard command first.
- Otherwise use the narrowest relevant command from `docs/agent/validation.md`.

## Stop conditions

- Changed file outside allowed scope.
- Validation repeated failure.
- Generated/private artifact present.
- Approval-required area touched.

## Final response format

- Changed files.
- Validation run and result.
- Scope exceptions or none.
- Risks and next action.
