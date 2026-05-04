# Known Risks

## Public documentation privacy baseline

- Date: 2026-05-04
- Risk: public documentation can leak local environment fingerprints through absolute paths, usernames, emulator IDs, debug ports, CDP target IDs, local app IDs, signing profile names, or copied raw logs.
- Impact: validation evidence may reveal details that are not needed for future troubleshooting.
- Mitigation: use placeholders such as `<repo-root>`, `<tizen-studio-root>`, `<emulator-id>`, `<emulator-profile>`, `<debug-port>`, `<target-id>`, `<windows-identity>`, and `<signing-profile>` in public docs. Keep raw logs outside the repository or redact them before commit.

## R-001: Validation scripts may be introduced by parallel work

- Date: 2026-04-29
- Risk: `check:manifest` and `check:syntax` may be unavailable until package scripts are finalized.
- Impact: full validation loop may temporarily fail even when harness docs are correct.
- Mitigation: keep command contract documented; re-run once scripts are merged.

## R-002: Multi-worker overlap

- Date: 2026-04-29
- Risk: parallel edits can cause stale assumptions in task execution.
- Impact: accidental scope creep or conflicting docs.
- Mitigation: keep TaskCards file-scoped, re-check `git status` before validating or committing.

## R-003: Local Windows toolchain context can differ from Codex sandbox

- Date: 2026-04-29
- Risk: local npm, Tizen CLI, and SDB behavior can depend on PATH, user-global npm state, and the Windows identity running the command.
- Impact: validation or device commands can fail in one shell/context while working in another.
- Mitigation: use `docs/agent/local-toolchain.md` diagnostics before changing application code. Keep exact local paths and identities redacted in public docs.

## R-004: Debug launch can attach to a stale installed harness copy

- Date: 2026-05-01
- Risk: `tz.exe run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck` can attach Web Inspector to an already installed harness build that does not reflect the latest repo-tracked `js/stremio-remote.js`.
- Impact: emulator results can look like runtime regressions even after the tracked source and ignored `Debug/` build output have been fixed locally.
- Mitigation: confirm the served module content inside the live debug target before trusting emulator evidence, and do not treat `tz run` alone as a fresh-code launch path.

## R-005: Fresh install path can be blocked by local signing/decryption state

- Date: 2026-05-01
- Risk: `tz pack -w <repo-root>\harness\CodexTvRuntimeCheck -t wgt` stopped with a local signing/decryption error while generating the author signature for the harness package.
- Impact: the normal package/install path cannot currently prove a repeatable fresh deploy from the repo.
- Mitigation: keep Task 3 blocked until the active certificate profile can be used non-interactively in the current user context or a documented alternative refresh path is verified. Do not commit signing material.

## R-006: `tz run -d` can timeout in a sandbox identity

- Date: 2026-05-01
- Risk: under `<windows-identity>`, `tz run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck` can fail with a timeout even while `sdb devices` shows the emulator online.
- Impact: the debug launch may fail before producing a Web Inspector endpoint, blocking live served-JS freshness verification in that context.
- Mitigation: treat this identity-specific timeout as a blocker for sandbox-run evidence; re-run under the real desktop user context when available and continue enforcing served-source parity checks.

## R-007: Emulator smoke validation only gives local confidence

- Date: 2026-05-01
- Risk: a Task 5 `web.stremio.com` emulator smoke pass can confirm local wiring, diagnostics, and navigation behavior, but it cannot prove final user acceptance on a real Samsung TV.
- Impact: Task 5 could be mistaken for sign-off even though focus, Back, media-key, or input behavior may differ on the real device.
- Mitigation: require source freshness evidence before trusting live emulator observations, record pass/partial/blocked outcomes only, and keep Task 6 real-TV validation mandatory.

## R-008: Emulator debug target can be the local harness instead of Stremio Web

- Date: 2026-05-02
- Risk: after restarting `<emulator-profile>`, `tz run -d` can succeed and expose a debug port while the live target is still `file:///index.html` from `CodexTvRuntimeCheck`, not `https://web.stremio.com/`.
- Impact: a working debug port can be mistaken for a valid Task 5b smoke target even though it only proves the disposable local harness launched.
- Mitigation: require `location.href` or equivalent target evidence to show `https://web.stremio.com/` before running Task 5b smoke checks.

## R-009: Harness runtime copy can drift from canonical runtime source

- Date: 2026-05-02
- Risk: `harness/CodexTvRuntimeCheck/js/stremio-remote.js` can serve stale code that lacks the canonical `src/main.js` source marker, injection marker, or interactive-control guard.
- Impact: emulator observations can fail the freshness contract even when `src/main.js` is correct.
- Mitigation: `npm run check:syntax` acts as the repo-local preflight guard; Task 5b must still check served source freshness in the live debug target.

## R-010: Harness freshness contract can drift from the smoke-check marker contract

- Date: 2026-05-02
- Risk: the Task 5 smoke checklist requires Task 4e marker strings, but the disposable harness runtime and canonical runtime source can drift in marker, hash, or guard state.
- Impact: emulator smoke evidence can be blocked before page testing because live source cannot be proven fresh.
- Mitigation: before rerunning Task 5b, confirm repo-tracked marker parity, then verify live served module content through Web Inspector/CDP.

## R-011: Harness launch-path cannot satisfy Task 5b target equivalence

- Date: 2026-05-02
- Risk: `CodexTvRuntimeCheck` launches `file:///index.html` by design, while Task 5b requires smoke evidence from `https://web.stremio.com/`.
- Impact: enabling external navigation alone does not preserve the harness-local runtime evidence contract in the cross-origin target.
- Mitigation: treat the disposable harness as a local fixture/debug vehicle only; keep Task 5b blocked until a launch path reaches `https://web.stremio.com/` with verifiable runtime evidence in that target page.

## R-012: TizenBrew standalone can launch without exposing a usable emulator debug target

- Date: 2026-05-02
- Risk: after the repository became public and the pinned module started resolving from jsDelivr, the TizenBrew standalone app still launched on `<emulator-id>` without exposing a stable forwarded localhost service or a fresh Web Inspector target for `https://web.stremio.com/`.
- Impact: Task 5d can prove CDN freshness for the pinned module, but it still cannot prove runtime injection or smoke behavior inside the real Stremio page.
- Mitigation: treat jsDelivr hosting as unblocked, write `tizenbrewConfig.json` through the temp-plus-move path if direct push fails, ignore stale disposable-harness debug targets, and do not run smoke checks until a fresh Stremio Web debug target appears.
