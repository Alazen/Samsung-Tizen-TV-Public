# Emulator Validation

Use Samsung TV emulator checks for local runtime/tooling confidence.

## Task 5 bridge

- Start this bridge only after Task 4 runtime local validation passes and Task 5 is explicitly started.
- Run `npm run check:syntax` before launching the emulator; it now rejects stale repo-tracked harness runtime copies that drift from the canonical freshness markers or interactive-control guard.
- Use `docs/validation/emulator-stremio-web-smoke-validation.md` as the smoke checklist and result rubric for `https://web.stremio.com/`.
- Require source freshness evidence before trusting any emulator observation.
- Emulator results are local confidence only; Task 6 real Samsung TV validation remains mandatory final acceptance.

## Procedure
1. Launch `T-samsung-10.0-x86_64` emulator.
2. Wait 15 seconds for boot to finish.
3. Confirm connectivity with `sdb devices`.
4. Run the repo-tracked `CodexTvRuntimeCheck` app via Samsung TV launch path.
5. Validate Web Inspector attachment and console output.
6. Capture debug-harness outcome in Task 3 records and keep `Debug/` and `.wgt` outputs uncommitted.

## Observed 2026-05-01 run

- Exact command used:
  `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
- Resolved Web Inspector attachment:
  `ws://127.0.0.1:37836/devtools/page/0E7D84496FC845B87D0F90C66E9B8F5C`
- Initial runtime snapshot confirmed:
  - `window.tizen`
  - `tizen.tvinputdevice`
  - `tizen.application`
  - injected style tag presence
- Source investigation outcome:
  - the visible-dialog failure came from a real source bug: ids such as `open-dialog` and `close-dialog` were being misclassified as dialog containers
  - the repo-tracked source now includes the dialog-detection fix and regression coverage
- Blocker:
  - the live debug target still served a stale `js/stremio-remote.js` copy after the source fix; `fetch('js/stremio-remote.js')` inside the running app did not include the new `isInteractiveControl` guard
  - `tz build -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck -b Debug` refreshed the ignored `Debug/` copy, but `tz pack -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck -t wgt` failed with `ERROR:Decryption error!`
  - because of that, the remaining branch checks were not treated as clean pass evidence from a fresh deployed build

## Observed 2026-05-01 final unblock attempt (Codex sandbox identity)

- Windows identity/context:
  - `whoami` -> `gabi-pc\codexsandboxonline`
  - project path: `C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
- Pre-checks:
  - `node -e "...repo source marker..."` confirmed `isInteractiveControl` in `harness/CodexTvRuntimeCheck/js/stremio-remote.js`
  - `E:\tizen-studio\tools\sdb.exe devices` listed `emulator-26101 device T-samsung-10.0-x86_64`
  - `git status --short --ignored harness/CodexTvRuntimeCheck` showed only ignored `Debug/` output
- Fresh build path:
  - command: `E:\tizen-studio\tools\tizen-core\tz.exe build -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck -b Debug`
  - result: exit code `0` with no stdout
  - generated debug JS paths were under:
    - `harness/CodexTvRuntimeCheck/Debug/.wgt/CodexTvRuntimeCheck/js/stremio-remote.js`
    - `harness/CodexTvRuntimeCheck/Debug/projects/CodexTvRuntimeCheck/js/stremio-remote.js`
  - both generated copies contained `isInteractiveControl`
  - SHA-256 parity matched repo source for all three files:
    `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`
- Debug launch path:
  - command (attempt 1): `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
  - output (attempt 1): `tz: error: command terminated after timeout`
  - command (attempt 2): same command, same context
  - output (attempt 2): `tz: error: command terminated after timeout`
  - stop condition applied: same command failed twice for the same reason
- Result:
  - Web Inspector attachment: not observed in this attempt
  - live served JS parity check via `fetch('js/stremio-remote.js')`: not possible in this attempt
  - deterministic fresh-code emulator debug path remains unproven in the sandbox identity

## Observed 2026-05-02 Task 5b blocked attempt

- Pre-checks:
  - `git rev-parse HEAD` returned `199b05ad3f384d9df49f88600aa4e1e6486fff52`
  - `src/main.js` contained source marker `stremio-webapp-src-main-js-task4e-v1` and injection marker `stremio-webapp-runtime-injection-v1`
  - `harness/CodexTvRuntimeCheck/js/stremio-remote.js` did not contain those Task 4e marker strings
  - `git status --short --ignored harness/CodexTvRuntimeCheck` showed only ignored `Debug/` output
  - `git ls-files harness/CodexTvRuntimeCheck/Debug/*` returned no tracked generated Debug output
- Emulator availability:
  - `E:\tizen-studio\tools\sdb.exe devices` returned no attached emulator devices
- Debug launch path:
  - command: `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
  - output: `target not found` and `serial number 'emulator-26101' wrong`
  - the command was not retried because the TaskCard stops on repeated emulator-command failure and the device was not visible
- Result:
  - Task 5b result category: `blocked`
  - Web Inspector attachment: not observed
  - live served JS freshness check: not possible
  - smoke checklist execution: not started
  - real Samsung TV validation remains mandatory

## Observed 2026-05-02 Task 5b retry after emulator launch

- Emulator launch path:
  - `E:\tizen-studio\tools\emulator\bin\em-cli.bat launch -n T-samsung-10.0-x86_64` succeeded in the desktop user context
  - after boot, `E:\tizen-studio\tools\sdb.exe devices` listed `emulator-26101 device T-samsung-10.0-x86_64`
- Debug launch path:
  - `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
  - result: launched successfully with debug port `33211`
  - debug page target: `file:///index.html`
- Live runtime evidence:
  - `window.__STREMIO_TIZENBREW_REMOTE__` existed in the debug target
  - `getState()` existed and returned an initialized runtime snapshot
  - Tizen APIs were available and `Info` was among the registered keys
- Live source evidence:
  - repo-tracked `harness/CodexTvRuntimeCheck/js/stremio-remote.js` still contained `isInteractiveControl`
  - `fetch('js/stremio-remote.js')` inside the running debug target returned content that did not contain `isInteractiveControl`
  - the live served module also did not contain `stremio-webapp-src-main-js-task4e-v1` or `stremio-webapp-runtime-injection-v1`
- Result:
  - Task 5b result category remained `blocked`
  - the emulator/device blocker was cleared, but the live source-freshness blocker remained
  - the current debug launch path also targets the local harness page rather than `https://web.stremio.com/`
  - real Samsung TV validation remains mandatory

## Observed 2026-05-02 Task 5b retry after emulator relaunch and live-source audit

- Repo and runtime evidence:
  - `git rev-parse HEAD` returned `7fdd3acef4a385da4396a776c45cc558a6cd2fec`
  - `src/main.js` contained source marker `stremio-webapp-src-main-js-task4e-v1` and injection marker `stremio-webapp-runtime-injection-v1`
  - `harness/CodexTvRuntimeCheck/js/stremio-remote.js` still did not contain those Task 4e marker strings
  - `harness/CodexTvRuntimeCheck/js/stremio-remote.js` still had `hasInteractiveControl=true`
  - `git status --short --ignored harness/CodexTvRuntimeCheck` showed only ignored `Debug/` output
- Emulator and debug path:
  - `E:\tizen-studio\tools\emulator\bin\em-cli.bat launch -n T-samsung-10.0-x86_64` relaunched the emulator in the desktop user context
  - `E:\tizen-studio\tools\sdb.exe devices` listed `emulator-26101 device T-samsung-10.0-x86_64`
  - `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck` launched successfully with debug port `38333`
  - the debug page target still reported `file:///index.html`, not `https://web.stremio.com/`
- Live served source audit:
  - `fetch('js/stremio-remote.js')` inside the debug target returned `length=47244`
  - the live served module had `hasNamespace=true`, `hasSrcMarker=false`, `hasInjectionMarker=false`, and `hasInteractiveControl=false`
  - `window.__STREMIO_TIZENBREW_REMOTE__` existed and `getState()` returned an initialized runtime snapshot
- Result:
  - Task 5b result category remained `blocked`
  - the live served module freshness still failed the marker contract
  - the debug target still did not reach `https://web.stremio.com/`
  - real Samsung TV validation remains mandatory

## Limitations
Emulator outcomes do not replace real-device acceptance for TizenBrew injection and physical remote behavior.

## Observed 2026-05-02 Task 5c launch-path troubleshooting conclusion

- Repo source parity check:
  - `src/main.js` and `harness/CodexTvRuntimeCheck/js/stremio-remote.js` both resolved to SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`.
  - Task 4e source marker, injection marker, and interactive-control guard were present in both repo-tracked files.
- Launch-path root cause:
  - `harness/CodexTvRuntimeCheck/config.xml` still declares `<content src="index.html"/>`, so the debug launch target is the local packaged harness page.
  - Official Tizen docs allow external start/navigation (`<tizen:content/>`, `<tizen:allow-navigation>`, and policy entries), but they do not make a local packaged runtime equivalent to injected runtime evidence inside a cross-origin page.
  - Official Tizen Web Runtime guidance states Tizen Device APIs are unavailable in cross-origin pages, so moving the harness to `https://web.stremio.com/` does not preserve the same runtime evidence contract used by local harness checks.
- Result:
  - Task 5b stays `blocked`.
  - Task 5c found no safe harness-only launch-path change that both reaches `https://web.stremio.com/` and preserves equivalent injected runtime evidence in that target page.

## Observed 2026-05-02 Task 5c post-guard emulator retry

- Preflight:
  - `npm run check:syntax` passed after the harness runtime copy was refreshed from `src/main.js`.
  - `E:\tizen-studio\tools\sdb.exe devices` listed `emulator-26101 device T-samsung-10.0-x86_64`.
- Debug launch path:
  - command (attempt 1): `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
  - output (attempt 1): `tz: error: command terminated after timeout`
  - command (attempt 2): same command, same context
  - output (attempt 2): `tz: error: command terminated after timeout`
  - stop condition applied: same emulator command failed twice for the same reason after local guards passed
- Result:
  - no fresh debug port or live target inspection was produced in this shell context
  - the Task 5c launch-path equivalence blocker remains, and the sandbox-identity timeout remains an additional execution blocker for live source verification here
