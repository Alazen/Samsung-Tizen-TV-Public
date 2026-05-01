# Emulator Validation

Use Samsung TV emulator checks for local runtime/tooling confidence.

## Procedure
1. Launch `T-samsung-10.0-x86_64` emulator.
2. Confirm connectivity with `sdb devices`.
3. Run the repo-tracked `CodexTvRuntimeCheck` app via Samsung TV launch path.
4. Validate Web Inspector attachment and console output.
5. Capture debug-harness outcome in Task 3 records and keep `Debug/` and `.wgt` outputs uncommitted.

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

## Limitations
Emulator outcomes do not replace real-device acceptance for TizenBrew injection and physical remote behavior.
