# Known Risks

Update this file when a risk affects future agents, validation, privacy, or architecture decisions.

## Public documentation privacy baseline

- Date: 2026-05-04
- Risk: public documentation can leak local environment fingerprints through absolute paths, usernames, emulator IDs, debug ports, CDP target IDs, local app IDs, signing profile names, or copied raw logs.
- Impact: validation evidence may reveal details that are not needed for future troubleshooting.
- Mitigation: use placeholders such as `<repo-root>`, `<tizen-studio-root>`, `<emulator-id>`, `<emulator-profile>`, `<debug-port>`, `<target-id>`, `<windows-identity>`, and `<signing-profile>` in public docs. Keep raw logs outside the repository or redact them before commit.

## R-001: Multi-worker overlap

- Date: 2026-04-29
- Risk: parallel edits can cause stale assumptions in task execution.
- Impact: accidental scope creep or conflicting docs.
- Mitigation: keep TaskCards file-scoped, re-check the active branch and changed files before validating or reporting.

## R-002: Local Windows toolchain context can differ from Codex sandbox

- Date: 2026-04-29
- Risk: local npm, Tizen CLI, and SDB behavior can depend on PATH, user-global npm state, and the Windows identity running the command.
- Impact: validation or device commands can fail in one shell/context while working in another.
- Mitigation: keep exact local paths and identities redacted; record unavailable validation honestly.

## R-003: Emulator validation is not final TV acceptance

- Date: 2026-05-01
- Risk: emulator passes can confirm local wiring, diagnostics, and key events but not real Samsung TV playback or final remote-control behavior.
- Impact: a local pass can be mistaken for product acceptance.
- Mitigation: require real Samsung TV validation for playback and final acceptance.

## R-004: TizenBrew cache can require disposable branch names

- Date: 2026-06-27
- Risk: TizenBrew may keep stale module code when a branch is reused.
- Impact: TV results may test cached code instead of the latest pushed runtime.
- Mitigation: for real-TV TizenBrew retests only, create a fresh disposable branch and use `Alazen/Samsung-Tizen-TV-Public@branch-name` without `gh/`.

## R-005: Legacy branch and file names may confuse agents

- Date: 2026-06-27
- Risk: older branches and docs referenced `src/main.js`, `src/main-0.2.3.js`, `CodexTvRuntimeCheck`, or versioned branch names as active paths.
- Impact: agents could inspect or edit stale paths.
- Mitigation: current docs route agents to `stremio-webapp-tizen` and `src/tizenbrew/stremio-remote/main.js`; `package.json.main` is the source of truth.

## R-006: Standalone Tizen wrapper feasibility is not yet proven

- Date: 2026-06-27
- Risk: a packaged Tizen Web App wrapper may load or play differently from Samsung Browser and TizenBrew.
- Impact: wrapper path may not solve playback or debugging differences.
- Mitigation: create an approved wrapper proof-of-concept with explicit emulator and real-TV validation gates before larger UI or API work.

## R-007: 002 prompt file is external to repo

- Date: 2026-06-27
- Risk: this harness is prepared for `002_Long_run_proceed_with_execution_v2026.06.16_v1.md`, but the 002 prompt text is not yet committed to this repo.
- Impact: future agents need the user-provided 002 prompt or a committed copy to execute long-run mode exactly.
- Mitigation: keep templates and execution-state layout compatible; commit 002 only if the user explicitly approves adding that prompt text.

## R-008: Cross-origin iframe same-origin telemetry access failure

- Date: 2026-06-27
- Risk: Stremio Web loads cross-origin, triggering standard browser SecurityErrors when accessing the iframe's DOM or media state.
- Impact: diagnostics runtime cannot inspect player element status or video properties directly unless same-origin policies are bypassable or redirection is used.
- Mitigation: catch SecurityError in same-origin checks, output descriptive status, and expose API for external validation.

## R-009: Focus and key-routing within iframe wrapper

- Date: 2026-06-27
- Risk: remote keydowns captured by Tizen wrapper outer shell might not naturally propagate to cross-origin iframe content.
- Impact: Stremio Web interface inside the iframe might not respond to standard remote controller buttons unless focus is actively routed or redirect mode is chosen.
- Mitigation: validate key-routing on TV emulator and actual device, and keep redirect mode as a fallback.

## R-010: TV Emulator vs Real TV device differences

- Date: 2026-06-27
- Risk: Tizen TV emulator might succeed in key capture, rendering, or codec negotiation where real Samsung TV hardware fails or exhibits different timing/performance.
- Impact: false positives in emulator validation.
- Mitigation: emulator is a syntax/logic check only; final verification must run on real Samsung TV hardware.

## R-011: Video playback format limitations in web container

- Date: 2026-06-27
- Risk: the standalone Tizen web app container runtime might lack hardware codecs (such as HEVC or high-profile AVC) or DRM support that are available in the system Samsung Browser.
- Impact: streams that play in the TV browser might fail in the standalone app.
- Mitigation: log media capabilities (`canPlayType` and `MediaSource.isTypeSupported`) in the wrapper diagnostics interface to troubleshoot playback failures.

## R-012: Bypassing Real TV Acceptance

- Date: 2026-06-27
- Risk: validation performed exclusively on the emulator bypassing real Samsung TV validation leaves physical remote key codes and hardware media decoders unverified.
- Impact: risk of deploying broken focus routing or unplayable media paths to production TVs.
- Mitigation: maintain emulator validation as a logic gate only; require physical TV validation for release candidates.

## R-013: Stremio DOM Layout Shifts and Selector Stability

- Date: 2026-06-27
- Risk: the navigation adapter relies on cached selectors to identify the Stremio Web sidebar and card elements.
- Impact: updates to the Stremio Web frontend layout or class names could break focus transition rules, causing focus to get stuck or misrouted.
- Mitigation: keep selectors lightweight and generic where possible, fall back gracefully to Stremio's native focus handling, and output adapter status in wrapper diagnostics.
