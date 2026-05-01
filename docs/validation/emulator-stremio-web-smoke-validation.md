# Emulator Stremio Web Smoke Validation

This smoke validation bridges Task 4 runtime slices to Task 5 real-TV acceptance by checking the repo-tracked module against `https://web.stremio.com/` in the Samsung TV emulator.

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
2. Capture module injection or load evidence.
3. Record the source freshness marker `stremio-webapp-src-main-js-task4e-v1` and injection marker `stremio-webapp-runtime-injection-v1`.
4. Open diagnostics with `Info`.
5. Treat optional TV key registration as a soft-fail path if registration is unavailable.
6. Verify the focus marker appears only on safe candidates.
7. Confirm directional navigation does not trap the user.
8. Confirm `Back` behavior follows the documented priority order.
9. Confirm the exit modal can be dismissed with Keep watching and records End the app attempts safely.
10. Confirm media keys do not consume unsafe events.
11. Review console errors.

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

## Limitations

- This smoke validation is not final acceptance.
- Real Samsung TV validation remains mandatory.
- Known stale-launch, signing/decryption, and sandbox timeout risks still apply.
