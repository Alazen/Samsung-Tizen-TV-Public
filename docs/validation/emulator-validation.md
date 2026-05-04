# Emulator Validation

Use Samsung TV emulator checks for local runtime/tooling confidence.

## Public documentation privacy note

Public validation docs must use placeholders for local paths, emulator IDs, debug ports, CDP target IDs, usernames, machine-specific folder names, and signing profile names. Raw local logs should not be committed. If exact local values are needed during a run, keep them outside the repo or redact them before commit.

## Task 5 bridge

- Start this bridge only after Task 4 runtime local validation passes and Task 5 is explicitly started.
- Run `npm run check:syntax` before launching the emulator.
- Use `docs/validation/emulator-stremio-web-smoke-validation.md` as the smoke checklist and result rubric for `https://web.stremio.com/`.
- Require source freshness evidence before trusting any emulator observation.
- For the standalone TizenBrew app, if direct `sdb push` to `/home/owner/share/tizenbrewConfig.json` fails, push to `/home/owner/share/tmp/sdk_tools/tmp/tizenbrewConfig.json`, then move it into place with `sdb shell 0 mv`.
- Ignore stale Web Inspector targets left behind by the disposable harness; only a fresh `https://web.stremio.com/` target counts for Task 5 evidence.
- Emulator results are local confidence only; Task 6 real Samsung TV validation remains mandatory final acceptance.

## Procedure

1. Launch `<emulator-profile>`.
2. Wait 15 seconds for boot to finish.
3. Confirm connectivity with `sdb devices`.
4. Run the repo-tracked `CodexTvRuntimeCheck` app through the Samsung TV launch path.
5. Validate Web Inspector attachment and console output.
6. Capture debug-harness outcome in Task 3 records and keep `Debug/` and packaged outputs uncommitted.

## Observed 2026-05-01 run

- Command: `<tizen-studio-root>\tools\tizen-core\tz.exe run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck`.
- Web Inspector attachment: `ws://127.0.0.1:<debug-port>/devtools/page/<target-id>`.
- Initial runtime snapshot confirmed `window.tizen`, `tizen.tvinputdevice`, `tizen.application`, and injected style tag presence.
- Source investigation found a real dialog-detection source bug involving ids such as `open-dialog` and `close-dialog`.
- The repo-tracked source later included the dialog-detection fix and regression coverage.
- The live debug target still served a stale `js/stremio-remote.js` after the source fix; live fetch did not include `isInteractiveControl`.
- `tz build -w <repo-root>\harness\CodexTvRuntimeCheck -b Debug` refreshed ignored build output, but packaging failed with a local signing/decryption error.

## Observed 2026-05-01 final unblock attempt

- Identity redacted as `<windows-identity>`.
- Project path redacted as `<repo-root>\harness\CodexTvRuntimeCheck`.
- `<tizen-studio-root>\tools\sdb.exe devices` listed `<emulator-id> device <emulator-profile>`.
- `tz build` succeeded and generated copies contained `isInteractiveControl`.
- Generated copies matched repo SHA-256 `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`.
- `tz run -d` timed out twice with the same command shape, so the TaskCard stop condition applied.
- No fresh Web Inspector endpoint or live served-JS parity check was possible.

## Observed 2026-05-02 Task 5b attempts

- First attempt: no emulator device was attached, so smoke execution was not started.
- Retry after launch: `<tizen-studio-root>\tools\tizen-core\tz.exe run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck` launched with `<debug-port>`, but the debug target was `file:///index.html`.
- Live served module returned `hasNamespace=true`, `hasSrcMarker=false`, `hasInjectionMarker=false`, and `hasInteractiveControl=false`.
- Retry after relaunch kept the same blockers: target was still `file:///index.html`, not `https://web.stremio.com/`, and live source freshness failed.
- Result: Task 5b remained `blocked` and real Samsung TV validation remained mandatory.

## Observed 2026-05-02 Task 5c conclusion

- `src/main.js` and `harness/CodexTvRuntimeCheck/js/stremio-remote.js` both resolved to SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`.
- Task 4e source marker, injection marker, and interactive-control guard were present in both repo-tracked files.
- `harness/CodexTvRuntimeCheck/config.xml` declares `<content src="index.html"/>`, so the debug launch target is the local packaged harness page.
- A harness-only launch-path change cannot safely prove target-equivalent injected runtime evidence inside `https://web.stremio.com/`.

## Observed 2026-05-02 Task 5d first target-equivalent TizenBrew retry

- `npm run check:syntax`, `npm run check:manifest`, and `npm test` passed before emulator work resumed.
- Pinned CDN `package.json` and `src/main.js` returned successful responses.
- CDN-served `src/main.js` had SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f` and contained the source marker, injection marker, `isInteractiveControl`, and `__STREMIO_TIZENBREW_REMOTE__`.
- TizenBrew config used the temp-plus-move device write path.
- Forwarded local probes did not yield a stable TizenBrew localhost service.
- Repeated scans found only a stale disposable-harness target, not a fresh TizenBrew or `https://web.stremio.com/` target.
- Result: Task 5d remained `blocked`; jsDelivr hosting was cleared, but emulator-side service/debug observability remained blocked.

## Limitations

Emulator outcomes do not replace real-device acceptance for TizenBrew injection and physical remote behavior.
