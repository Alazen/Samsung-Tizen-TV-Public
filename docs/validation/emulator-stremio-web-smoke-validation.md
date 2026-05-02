# Emulator Stremio Web Smoke Validation

This smoke validation bridges Task 4 runtime slices to Task 6 real-TV acceptance by checking the repo-tracked module against `https://web.stremio.com/` in the Samsung TV emulator.

## Preconditions

- Task 4 local validation has passed.
- Source freshness evidence is captured before trusting any emulator observation.
- Module injection or load evidence is captured before interpreting key, focus, Back, Exit, or diagnostics behavior.
- Emulator results are local confidence only and do not replace real Samsung TV validation.

## Source freshness evidence

Before interpreting emulator behavior, capture evidence that the served source is fresh enough to trust.

- Record the source marker `stremio-webapp-src-main-js-task4e-v1` or the current Git commit SHA / repo-tracked source hash that produced it.
- Record the served module URL or debug target that loaded the module.
- Confirm the live debug target is serving the expected module content before treating any observation as evidence.
- Treat a mismatch between the repo-tracked source and the live served source as blocked validation.
- Treat missing freshness evidence as blocked validation, even if the UI appears to work.

## Module injection or load evidence

Capture at least one observable proof that the module loaded in the target page:

- `window.__STREMIO_TIZENBREW_REMOTE__` exists.
- `window.__STREMIO_TIZENBREW_REMOTE__.getState()` returns an initialized runtime state with `namespacePresent`, `initializedNamespace`, `styleMarkerPresent`, `diagnosticsPanelMarkerPresent`, `exitModalMarkerPresent`, `styleMarkerInjected`, `diagnosticsPanelCreated`, and `exitModalCreated` populated.
- The diagnostics panel can be opened with `Info` and shows the source marker `stremio-webapp-src-main-js-task4e-v1`, the injection marker `stremio-webapp-runtime-injection-v1`, the injection evidence summary, the current path, API availability, key state, Back resolution, exit result, focus state, and the other runtime fields.
- The injected style marker exists as `style[data-stremio-remote-style='1']`.
- The diagnostics panel exists as `[data-stremio-remote-diagnostics-panel='1']` and its body exists as `[data-stremio-remote-diagnostics-body='1']`.
- The exit modal exists as `[data-stremio-remote-exit-modal='1']`, with `[data-stremio-remote-exit-dialog='1']`, `[data-stremio-remote-exit-actions='1']`, and `[data-stremio-remote-exit-button='1']` only after the runtime creates module-owned UI.

## Required smoke checks

1. Load `https://web.stremio.com/`.
2. If the emulator was just launched, wait 15 seconds for boot to finish before checking `sdb devices` or attaching the debug target.
3. Capture module injection or load evidence.
4. Record the source freshness marker `stremio-webapp-src-main-js-task4e-v1` and injection marker `stremio-webapp-runtime-injection-v1`.
5. Open diagnostics with `Info`.
6. Treat optional TV key registration as a soft-fail path if registration is unavailable.
7. Verify the focus marker appears only on safe candidates.
8. Confirm directional navigation does not trap the user.
9. Confirm `Back` behavior follows the documented priority order.
10. Confirm the exit modal can be dismissed with Keep watching and records End the app attempts safely.
11. Confirm media keys do not consume unsafe events.
12. Review console errors.

## Result categories

- `pass`: all required smoke checks succeed, source freshness is proven, module load evidence is captured, and no blocking console errors remain.
- `partial`: the page loads and some checks pass, but one or more non-blocking gaps remain that should be recorded before Task 5.
- `blocked`: source freshness cannot be proven, the module does not load as expected, or navigation, Back, Exit, diagnostics, or media-key behavior is unsafe.

## Record format

Record the outcome with:

- Date and environment
- Emulator or debug target identifier
- Source freshness marker `stremio-webapp-src-main-js-task4e-v1`
- Injection marker `stremio-webapp-runtime-injection-v1`
- Served module URL or debug target
- Module injection or load evidence
- `Info` diagnostics evidence, including the injection evidence summary and the runtime marker fields
- Optional key registration summary or soft failure
- Focus, navigation, Back, Exit, and media-key observations
- Console error summary
- Result category: `pass`, `partial`, or `blocked`
- Residual risks for Task 5

## Recorded runs

### 2026-05-02 Task 5b blocked attempt

- Date and environment:
  - 2026-05-02, Codex sandbox on Windows PowerShell.
- Emulator or debug target identifier:
  - Expected target: `emulator-26101`.
  - Actual target state: unavailable; `E:\tizen-studio\tools\sdb.exe devices` listed no attached emulator devices.
- Source freshness marker:
  - Required source marker: `stremio-webapp-src-main-js-task4e-v1`.
  - Repo commit: `199b05ad3f384d9df49f88600aa4e1e6486fff52`.
  - `src/main.js`: source marker present, injection marker present, SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`.
  - `harness/CodexTvRuntimeCheck/js/stremio-remote.js`: source marker absent, injection marker absent, SHA-256 `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`.
- Injection marker:
  - Required injection marker: `stremio-webapp-runtime-injection-v1`.
  - The marker was found in `src/main.js` but not in the repo-tracked harness module.
- Served module URL or debug target:
  - Not captured. The emulator target was unavailable, so no Web Inspector/CDP target could be used to prove live served module content.
- Module injection or load evidence:
  - Not captured. The page was not loaded because source freshness and emulator availability gates failed first.
- `Info` diagnostics evidence:
  - Not captured.
- Optional key registration summary or soft failure:
  - Not exercised.
- Focus, navigation, Back, Exit, and media-key observations:
  - Not exercised.
- Console error summary:
  - Not captured.
- Command attempted:
  - `E:\tizen-studio\tools\sdb.exe devices` returned no attached devices.
  - `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck` failed once with `target not found` and `serial number 'emulator-26101' wrong`.
- Result category:
  - `blocked`
- Residual risks for Task 5:
  - Task 5b cannot produce smoke evidence until the emulator is attached in the executing context.
  - Live source freshness remains unproven; no emulator observations should be treated as evidence for the current repo source until the live served module content is checked.
  - Task 6 real Samsung TV plus TizenBrew validation remains mandatory.

### 2026-05-02 Task 5b retry after emulator launch

- Date and environment:
  - 2026-05-02, Codex sandbox on Windows PowerShell, with emulator launch performed in the desktop user context.
- Emulator or debug target identifier:
  - `emulator-26101`
  - Debug page target from `http://127.0.0.1:33211/json`:
    - title: `Codex TV Runtime Check`
    - URL: `file:///index.html`
    - websocket: `ws://127.0.0.1:33211/devtools/page/73275F01B8BC9425630466AA6D776370`
- Source freshness marker:
  - Required smoke marker: `stremio-webapp-src-main-js-task4e-v1`
  - Repo commit: `199b05ad3f384d9df49f88600aa4e1e6486fff52`
  - Repo harness module `harness/CodexTvRuntimeCheck/js/stremio-remote.js`: SHA-256 `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`, `hasInteractiveControl=true`
  - Live served `js/stremio-remote.js` fetched from the debug target: `length=47244`, `hasNamespace=true`, `hasSrcMarker=false`, `hasInjectionMarker=false`, `hasInteractiveControl=false`
  - Freshness result: blocked, because the live served module does not match the repo-tracked harness/runtime evidence.
- Injection marker:
  - Required injection marker: `stremio-webapp-runtime-injection-v1`
  - Not present in the live served module.
- Served module URL or debug target:
  - Live debug target URL was `file:///index.html`, not `https://web.stremio.com/`.
- Module injection or load evidence:
  - `window.__STREMIO_TIZENBREW_REMOTE__` exists.
  - `getState()` exists and returned an initialized runtime snapshot in the local harness page.
  - Registered keys included `Info`.
  - `tizen`, `tizen.tvinputdevice`, and `tizen.application` were available.
- `Info` diagnostics evidence:
  - Not recorded as smoke evidence, because the source freshness gate already failed and the page under test was the local harness rather than `https://web.stremio.com/`.
- Optional key registration summary or soft failure:
  - Optional key registration appeared healthy in the local harness snapshot; no soft-fail was needed in this retry.
- Focus, navigation, Back, Exit, and media-key observations:
  - Not exercised for Task 5 evidence because the smoke target URL was not under test and source freshness was unproven.
- Console error summary:
  - No blocking console finding was needed to stop the run; the source-freshness and target-URL gates already blocked it.
- Command attempted:
  - `E:\tizen-studio\tools\emulator\bin\em-cli.bat launch -n T-samsung-10.0-x86_64`
  - `E:\tizen-studio\tools\sdb.exe devices`
  - `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
- Result category:
  - `blocked`
- Residual risks for Task 5:
  - The current debug path reaches the local harness page, not `https://web.stremio.com/`.
  - The live served module remains stale relative to the repo-tracked harness/runtime evidence.
  - Task 6 real Samsung TV plus TizenBrew validation remains mandatory.

### 2026-05-02 Task 5b retry after emulator relaunch and live-source audit

- Date and environment:
  - 2026-05-02, Codex sandbox on Windows PowerShell, after relaunching `T-samsung-10.0-x86_64`.
- Emulator or debug target identifier:
  - `emulator-26101`
  - Debug page target from `http://127.0.0.1:38333/json`:
    - title: `Codex TV Runtime Check`
    - URL: `file:///index.html`
    - websocket: `ws://127.0.0.1:38333/devtools/page/573C4B89C354BBC27B74106461D3B6D9`
- Source freshness marker:
  - Required smoke marker: `stremio-webapp-src-main-js-task4e-v1`
  - Repo commit: `7fdd3acef4a385da4396a776c45cc558a6cd2fec`
  - `src/main.js`: SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`, source marker present, injection marker present, `hasInteractiveControl=true`
  - `harness/CodexTvRuntimeCheck/js/stremio-remote.js`: SHA-256 `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`, source marker absent, injection marker absent, `hasInteractiveControl=true`
  - Live served `js/stremio-remote.js` fetched from the debug target: `length=47244`, `hasNamespace=true`, `hasSrcMarker=false`, `hasInjectionMarker=false`, `hasInteractiveControl=false`
  - Freshness result: blocked, because the live served module does not satisfy the documented marker contract and the debug target is not the intended `https://web.stremio.com/` smoke page.
- Injection marker:
  - Required injection marker: `stremio-webapp-runtime-injection-v1`
  - Not present in the live served module.
- Served module URL or debug target:
  - Live debug target URL was `file:///index.html`, not `https://web.stremio.com/`.
- Module injection or load evidence:
  - `window.__STREMIO_TIZENBREW_REMOTE__` existed.
  - `getState()` existed and returned an initialized runtime snapshot.
  - Registered keys included `Info`, `media`, and color keys.
  - `tizen`, `tizen.tvinputdevice`, and `tizen.application` were available.
- `Info` diagnostics evidence:
  - `getState()` reported `initialized=true`, `registeredKeys` populated, `failedKeys=[]`, `diagnosticsOpen=false`, `exitModalOpen=false`, and `candidateCount=0`.
  - DOM markers were present for the diagnostics panel, diagnostics body, exit modal, exit dialog, exit actions, and exit button.
- Optional key registration summary or soft failure:
  - Optional key registration was healthy in the local harness snapshot; no soft-fail was needed.
- Focus, navigation, Back, Exit, and media-key observations:
  - Not exercised for Task 5 smoke evidence because the target URL remained the local harness page and source freshness was still unproven.
- Console error summary:
  - No additional blocking console evidence was required to keep the run blocked.
- Command attempted:
  - `E:\tizen-studio\tools\emulator\bin\em-cli.bat launch -n T-samsung-10.0-x86_64`
  - `E:\tizen-studio\tools\sdb.exe devices`
  - `E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w C:\Users\gabip\GitHub\Stremio-WebApp\harness\CodexTvRuntimeCheck`
- Result category:
  - `blocked`
- Residual risks for Task 5:
  - The current debug path still stops at `file:///index.html` rather than `https://web.stremio.com/`.
  - The live served module freshness remains unproven against the documented marker contract.
  - Task 6 real Samsung TV plus TizenBrew validation remains mandatory.

## Limitations

- This smoke validation is not final acceptance.
- Real Samsung TV validation remains mandatory.
- Known stale-launch, signing/decryption, and sandbox timeout risks still apply.
