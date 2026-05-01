# TaskCard: Task 3B, Validate Debug Command Path

## Status

- State: active
- Parent ExecPlan: `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- Current owner: unassigned
- Last updated: 2026-04-30

## Objective

Validate the preferred repeatable emulator debug command path for the Samsung TV debug harness.

## Required context

### Files to read

- `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- `docs/agent/local-toolchain.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/validation.md`

### Docs to read

- `docs/tizen/index.md`
- `docs/tizen/source-map.md`

## Files allowed to edit

- `docs/validation/emulator-validation.md`
- `docs/agent/local-toolchain.md`
- `docs/agent/task-cards/active/task-03b-validate-debug-command-path.md`
- `docs/agent/known-risks.md`, only if new risk is discovered

## Files forbidden

- `src/`
- `tests/`
- `package.json`
- `package-lock.json`
- `docs/vendor/`
- Committed temporary harness files
- `target/`
- `*.wgt`
- `*.zip`
- `*.log`
- Secrets
- Signing material

## Constraints

- Validate debug path only.
- Do not implement runtime behavior.
- Do not commit disposable harness files.
- Do not modify vendored docs.
- Do not expose certificate passwords, signing secrets, or Samsung account details.

## Expected debug command

Use the current documented preferred path:

```powershell
E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w <project-path>
```

Where `<project-path>` is the absolute path to the external Samsung TV Basic Project folder containing `config.xml`.

## Evidence to capture

Record evidence in the edited documentation, not as generated artifacts:

- Exact command used.
- Resolved project path used.
- Whether Web Inspector or JavaScript Log Console attached.
- Key event names and codes observed.
- Whether style injection evidence was visible.
- Tizen API availability checks:
  - `window.tizen`
  - `tizen.tvinputdevice`
  - `tizen.application`
- Any failure output relevant to future agents.
- Confirmation that real Tizen 8.0 Samsung TV validation is still required.

## Documentation obligations

- Must update `docs/validation/emulator-validation.md` if the validation procedure changes.
- Must update `docs/agent/local-toolchain.md` if a durable local toolchain fact changes.
- Must update `docs/agent/known-risks.md` if emulator limitations or blockers are discovered.
- Decision log update required: no, unless this TaskCard selects the final debug strategy.
- PLAN.md update required: no, unless status changes.

## Validation

Primary docs validation:

```bash
git diff --check -- docs/agent/local-toolchain.md docs/validation/emulator-validation.md docs/agent/task-cards docs/agent/known-risks.md
```

Generated artifact check before final report:

```bash
git status --short
```

## Done when

- Preferred debug command path is tested or a blocker is recorded.
- Evidence is documented in the allowed files.
- No generated artifacts are committed.
- Real-device limitation remains explicitly documented.

## Stop conditions

- Stop if emulator access is unavailable.
- Stop if signing secrets or private credentials are required.
- Stop if generated files would need to be committed.
- Stop if the same command fails twice for the same reason.
- Stop if the task requires application behavior changes.

## Report format

- Changed files:
- Command attempted:
- Evidence captured:
- Validation run:
- Result:
- Risks:
