# TaskCard: Task 3B, Validate Debug Command Path

## Status

- State: blocked
- Parent ExecPlan: `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md`
- Current owner: Codex
- Last updated: 2026-05-01

## Objective

Validate the preferred repeatable emulator debug command path for the repo-tracked Samsung TV debug harness.

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
- `docs/agent/task-cards/blocked/task-03b-validate-debug-command-path.md`
- `docs/agent/known-risks.md`, only if new risk is discovered

## Files forbidden

- `src/`
- `tests/`
- `package.json`
- `package-lock.json`
- `docs/vendor/`
- Committed generated `Debug/` or `.wgt` outputs
- `target/`
- `*.wgt`
- `*.zip`
- `*.log`
- Secrets
- Signing material

## Constraints

- Validate debug path only.
- Do not implement runtime behavior.
- Do not commit generated `Debug/` or `.wgt` outputs.
- Do not modify vendored docs.
- Do not expose certificate passwords, signing secrets, or Samsung account details.

## Expected debug command

Use the current documented preferred path:

```powershell
E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w <project-path>
```

Where `<project-path>` is the absolute path to the repo-tracked `CodexTvRuntimeCheck` project folder containing `config.xml`.

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

## Evidence captured

- 2026-05-01 final unblock attempt context:
  - identity: `gabi-pc\codexsandboxonline`
  - harness path: `C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
  - `E:\tizen-studio\tools\sdb.exe devices` still reported
    `emulator-26101 device T-samsung-10.0-x86_64`
- 2026-05-01 debug launch command:
  `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
- Web Inspector attachment resolved through:
  `ws://127.0.0.1:37836/devtools/page/0E7D84496FC845B87D0F90C66E9B8F5C`
- Initial runtime snapshot confirmed:
  `window.tizen`, `tizen.tvinputdevice`, `tizen.application`, and the injected
  style tag were present before branch validation started.
- `Info` opened diagnostics and `Back` closed diagnostics.
- Live CDP inspection identified a real source bug in dialog detection:
  ids such as `open-dialog` and `close-dialog` were misclassified as dialog
  containers. The repo-tracked source now includes a fix and regression coverage
  for that naming pattern.
- Blocker:
  after the source fix, the live debug target still served a stale
  `js/stremio-remote.js` copy. `fetch('js/stremio-remote.js')` inside the
  running app still lacked the `isInteractiveControl` guard even though both the
  repo-tracked harness file and the ignored `Debug/` build copy contained it.
- `tz build -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck -b Debug`
  refreshed the ignored `Debug/` copy with the fix.
- A later `tz build` recheck in the same day returned exit code `0` and
  refreshed generated app copies under:
  - `Debug/.wgt/CodexTvRuntimeCheck/js/stremio-remote.js`
  - `Debug/projects/CodexTvRuntimeCheck/js/stremio-remote.js`
  Both contained `isInteractiveControl` and matched the repo SHA-256 hash
  `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`.
- `tz pack -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck -t wgt`
  failed with `ERROR:Decryption error!` while generating the author signature,
  so the normal fresh install path could not be completed in this session.
- Final unblock attempt stop condition:
  `tz run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
  failed twice with the same output:
  `tz: error: command terminated after timeout`.
  No new Web Inspector endpoint was produced in that context, so live served JS
  parity could not be revalidated in the final attempt.
- Real Samsung TV Tizen 8.0 validation remains required.

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

## Blocking summary

- Blocking reason:
  - A deterministic fresh-code refresh path is still unproven. `tz pack -w <project-path> -t wgt` failed with `ERROR:Decryption error!`, and the final `tz run -d` attempt in `gabi-pc\codexsandboxonline` timed out twice with `tz: error: command terminated after timeout`.
- Evidence observed:
  - Repo source and generated build outputs matched the `isInteractiveControl` freshness marker and SHA-256 hash, but no new Web Inspector target was produced in the final sandbox attempt, so live served-JS parity could not be revalidated there.
- Approval or input needed:
  - Re-run the debug/package path in the real desktop user context that owns the working Samsung certificate profile, without exposing signing secrets in the repo or the thread.
- Safe next action:
  - Preserve Decision B in the Task 3 records and ensure any later Task 4 decomposition states that emulator evidence is limited and real Samsung TV validation remains mandatory.
