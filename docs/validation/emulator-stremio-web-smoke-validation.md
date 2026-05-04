# Emulator Stremio Web Smoke Validation

This smoke validation bridges Task 4 runtime slices to Task 6 real-TV acceptance by checking the repo-tracked module against `https://web.stremio.com/` in the Samsung TV emulator.

## Public documentation privacy note

Public validation docs must use placeholders for local paths, emulator IDs, debug ports, CDP target IDs, usernames, machine-specific folder names, and signing profile names. Raw local logs should not be committed. If exact local values are needed during a run, keep them outside the repo or redact them before commit.

## Preconditions

- Task 4 local validation has passed.
- `npm run check:syntax` has passed before emulator launch.
- Source freshness evidence is captured before trusting any emulator observation.
- Module injection or load evidence is captured before interpreting behavior.
- Emulator results are local confidence only and do not replace real Samsung TV validation.

## Source freshness evidence

- Record the source marker `stremio-webapp-src-main-js-task4e-v1` or the current Git commit SHA / repo-tracked source hash that produced it.
- Record the injection marker `stremio-webapp-runtime-injection-v1`.
- Record the served module URL or debug target, using placeholders for local CDP values: `http://127.0.0.1:<debug-port>/json` and `ws://127.0.0.1:<debug-port>/devtools/page/<target-id>`.
- Confirm the live debug target is serving the expected module content before treating any observation as evidence.
- Treat a mismatch between the repo-tracked source and the live served source as blocked validation.

## Module injection or load evidence

Capture at least one proof that the module loaded in the target page:

- `window.__STREMIO_TIZENBREW_REMOTE__` exists.
- `window.__STREMIO_TIZENBREW_REMOTE__.getState()` returns initialized runtime state.
- The diagnostics panel opens with `Info` and shows the source marker, injection marker, injection evidence summary, current path, API availability, key state, Back resolution, exit result, and focus state.
- Module-owned style, diagnostics, and exit-modal DOM markers exist only after runtime-owned UI is created.

## Required smoke checks

1. Load `https://web.stremio.com/`.
2. Wait 15 seconds after a fresh emulator launch before checking `sdb devices` or attaching the debug target.
3. Capture module injection or load evidence.
4. Record `stremio-webapp-src-main-js-task4e-v1` and `stremio-webapp-runtime-injection-v1`.
5. Open diagnostics with `Info`.
6. Treat optional TV key registration as a soft-fail path if registration is unavailable.
7. Verify safe focus candidates, directional navigation, Back priority, exit modal behavior, media-key safety, and console errors.

## Result categories

- `pass`: all required smoke checks succeed, source freshness is proven, module load evidence is captured, and no blocking console errors remain.
- `partial`: the page loads and some checks pass, but non-blocking gaps remain.
- `blocked`: source freshness cannot be proven, the module does not load as expected, or behavior is unsafe.

## Recorded runs

### 2026-05-02 Task 5b blocked attempt

- Environment: local Windows PowerShell.
- Expected target: `<emulator-id>`.
- Actual target state: unavailable; `<tizen-studio-root>\tools\sdb.exe devices` listed no attached emulator devices.
- Repo commit: `199b05ad3f384d9df49f88600aa4e1e6486fff52`.
- `src/main.js`: source marker present, injection marker present, SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`.
- `harness/CodexTvRuntimeCheck/js/stremio-remote.js`: source marker absent, injection marker absent, SHA-256 `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`.
- Command attempted: `<tizen-studio-root>\tools\tizen-core\tz.exe run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck`.
- Result category: `blocked`.
- Residual risk: no emulator observations should be treated as evidence until the live served module content is checked.

### 2026-05-02 Task 5b retry after emulator launch

- Target: `<emulator-id>`.
- Debug page target from `http://127.0.0.1:<debug-port>/json`: title `Codex TV Runtime Check`, URL `file:///index.html`, websocket `ws://127.0.0.1:<debug-port>/devtools/page/<target-id>`.
- Repo commit: `199b05ad3f384d9df49f88600aa4e1e6486fff52`.
- Live served `js/stremio-remote.js`: `length=47244`, `hasNamespace=true`, `hasSrcMarker=false`, `hasInjectionMarker=false`, `hasInteractiveControl=false`.
- Runtime existed in the local harness page and `getState()` returned initialized state, but this was not valid smoke evidence because the target was not `https://web.stremio.com/`.
- Result category: `blocked`.
- Residual risk: the debug path reaches the local harness page, not Stremio Web.

### 2026-05-02 Task 5b retry after emulator relaunch and live-source audit

- Target: `<emulator-id>`.
- Debug page target from `http://127.0.0.1:<debug-port>/json`: URL `file:///index.html`, websocket `ws://127.0.0.1:<debug-port>/devtools/page/<target-id>`.
- Repo commit: `7fdd3acef4a385da4396a776c45cc558a6cd2fec`.
- `src/main.js`: SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`, source marker present, injection marker present, `hasInteractiveControl=true`.
- Live served module: `length=47244`, `hasNamespace=true`, `hasSrcMarker=false`, `hasInjectionMarker=false`, `hasInteractiveControl=false`.
- Result category: `blocked`.
- Residual risk: target and source freshness gates both failed.

### 2026-05-02 Task 5c launch-path troubleshooting conclusion

- `src/main.js` and `harness/CodexTvRuntimeCheck/js/stremio-remote.js` hash-match at SHA-256 `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`.
- `harness/CodexTvRuntimeCheck/config.xml` still defines `<content src="index.html"/>`, so the debug launch remains rooted to the local harness page.
- A harness-only redirect or hosted-start change can potentially reach `https://web.stremio.com/`, but it does not preserve equivalent harness-local runtime evidence inside the cross-origin target page.
- Result category: `blocked`.
- Residual risk: do not score local `file:///index.html` harness evidence as Stremio Web smoke evidence.

### 2026-05-02 Task 5d first target-equivalent TizenBrew retry

- Target: `<emulator-id>` with installed TizenBrew standalone placeholders.
- No fresh TizenBrew Web Inspector target was discovered.
- The only localhost `/json` hit remained a stale disposable-harness target on `http://127.0.0.1:<debug-port>/json`.
- Repo commit: `0c7f8dc59562cb666d0f14672191aa9a2a217d2c`.
- Pinned CDN `package.json` and `src/main.js` were reachable.
- CDN source SHA-256: `f35c6891b13a6229c154a10173a35bcb14b6a972f206aedf2fd3852e052d807f`.
- CDN marker results: `hasSrcMarker=true`, `hasInjectionMarker=true`, `hasInteractiveControl=true`, `hasNamespace=true`.
- A target-equivalent `https://web.stremio.com/` debug page was not captured.
- Result category: `blocked`.
- Residual risk: public jsDelivr reachability is no longer the blocker; emulator-side TizenBrew service/debug observability is the remaining blocker.

## Limitations

This smoke validation is not final acceptance. Real Samsung TV validation remains mandatory.
