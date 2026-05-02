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

## R-008: Emulator debug target can be the local harness instead of Stremio Web
- Date: 2026-05-02
- Risk: after restarting `T-samsung-10.0-x86_64`, `tz run -d` can succeed and expose a debug port while the live target is still `file:///index.html` from `CodexTvRuntimeCheck`, not `https://web.stremio.com/`.
- Impact: a working debug port can be mistaken for a valid Task 5b smoke target even though it only proves the disposable local harness launched.
- Mitigation: require `location.href` or equivalent debug-target evidence to show `https://web.stremio.com/` before running Task 5b smoke checks; use Task 5c to troubleshoot whether the harness can safely load Stremio Web or whether a different module launch path is required.

## R-009: Harness runtime copy can drift from canonical runtime source
- Date: 2026-05-02
- Risk: `harness/CodexTvRuntimeCheck/js/stremio-remote.js` can serve stale code that lacks the canonical `src/main.js` source marker, injection marker, or interactive-control guard.
- Impact: emulator observations can fail the freshness contract even when `src/main.js` is correct.
- Mitigation: `npm run check:syntax` now acts as the repo-local preflight guard for canonical marker and interactive-control parity; Task 5b must still check served source freshness in the live debug target before trusting emulator evidence.

## R-010: Harness freshness contract can drift from the smoke-check marker contract
- Date: 2026-05-02
- Risk: the Task 5 smoke checklist requires the Task 4e marker strings, but the disposable harness runtime and the canonical runtime source can drift in which marker, hash, or guard is actually present.
- Impact: emulator smoke evidence can be blocked before page testing because the live harness/module source cannot be proven fresh against the documented contract.
- Mitigation: before rerunning Task 5b, confirm the repo-tracked harness copy passes the marker parity check, then verify the live served module content through Web Inspector/CDP and treat any mismatch as blocked validation.

## R-011: Harness launch-path cannot satisfy Task 5b target equivalence
- Date: 2026-05-02
- Risk: `CodexTvRuntimeCheck` launches a local packaged start page (`file:///index.html`) by design, while Task 5b requires smoke evidence from `https://web.stremio.com/`.
- Impact: enabling external navigation alone does not preserve the harness-local runtime evidence contract in the cross-origin target, so Task 5b can be mis-scored from non-equivalent local-harness evidence.
- Mitigation: treat the disposable harness as a local fixture/debug vehicle only; keep Task 5b blocked until a launch path reaches `https://web.stremio.com/` with verifiable runtime evidence in that target page.

## R-012: TizenBrew standalone can launch without exposing a usable emulator debug target
- Date: 2026-05-02
- Risk: after the repository became public and the pinned module started resolving from jsDelivr, `xvvl3S1bvH.TizenBrewStandalone` still launched on `emulator-26101` without exposing a stable forwarded localhost service on `tcp:8081` or a fresh Web Inspector `/json` target for `https://web.stremio.com/`.
- Impact: Task 5d can prove CDN freshness for the pinned module, but it still cannot prove runtime injection, `window.__STREMIO_TIZENBREW_REMOTE__`, or smoke behavior inside the real Stremio page.
- Mitigation: treat jsDelivr hosting as unblocked, write `tizenbrewConfig.json` through `/home/owner/share/tmp/sdk_tools/tmp/` plus `shell 0 mv` if direct push fails, ignore stale disposable-harness debug targets, and do not run smoke checks until a fresh `https://web.stremio.com/` debug target appears.
