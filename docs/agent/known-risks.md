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

## R-003: Local Windows toolchain context can differ from Codex sandbox
- Date: 2026-04-29
- Risk: local npm, Tizen CLI, and SDB behavior can depend on user PATH, user-global npm state, and the Windows identity running the command.
- Impact: validation or device commands can fail in one shell/context while working in another.
- Mitigation: use `docs/agent/local-toolchain.md` diagnostics before changing application code for npm/Tizen/SDB failures.

## R-004: Debug launch can attach to a stale installed harness copy
- Date: 2026-05-01
- Risk: `tz.exe run -d -e emulator-26101 -w <project-path>` can attach Web Inspector to an already installed harness build that does not reflect the latest repo-tracked `js/stremio-remote.js`.
- Impact: emulator results can look like runtime regressions even after the tracked source and ignored `Debug/` build output have been fixed locally.
- Mitigation: confirm the served `js/stremio-remote.js` content inside the live debug target before trusting emulator evidence, and do not treat `tz run` alone as a fresh-code launch path.

## R-005: Fresh install path is blocked by signing password decryption
- Date: 2026-05-01
- Risk: `tz pack -w <project-path> -t wgt` stopped with `ERROR:Decryption error!` while generating the author signature for the harness package.
- Impact: the normal package/install path from the official Tizen run/debug flow cannot currently be used to prove a repeatable fresh deploy from the repo.
- Mitigation: keep Task 3 blocked until the active certificate profile can be used non-interactively in the current user context or a documented alternative refresh path is verified.

## R-006: `tz run -d` can timeout in the Codex sandbox identity
- Date: 2026-05-01
- Risk: in `gabi-pc\codexsandboxonline`, `tz run -d -e emulator-26101 -w <project-path>` can fail with `tz: error: command terminated after timeout` even while `sdb devices` shows the emulator online.
- Impact: the debug launch may fail before producing a Web Inspector endpoint, blocking live served-JS freshness verification in that context.
- Mitigation: treat this identity-specific timeout as a blocker for sandbox-run evidence; re-run under the real desktop user context when available and continue enforcing served-source parity checks.

## R-007: Emulator smoke validation only gives local confidence
- Date: 2026-05-01
- Risk: a Task 5 `web.stremio.com` emulator smoke pass can confirm local wiring, diagnostics, and navigation behavior, but it cannot prove final user acceptance on a real Samsung TV.
- Impact: Task 5 could be mistaken for sign-off even though focus, back, media-key, or input behavior may differ on the real device.
- Mitigation: require source freshness evidence before trusting live emulator observations, record pass/partial/blocked outcomes only, and keep Task 6 real-TV validation mandatory.
