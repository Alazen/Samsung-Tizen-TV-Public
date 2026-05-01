# Emulator Stremio Web Smoke Validation

This smoke validation bridges Task 4 runtime slices to Task 5 real-TV acceptance by checking the repo-tracked module against `https://web.stremio.com/` in the Samsung TV emulator.

## Preconditions

- A Task 4 runtime slice has already passed local validation.
- Source freshness evidence is captured before trusting any emulator observation.
- Emulator results are local confidence only and do not replace real Samsung TV validation.

## Source freshness evidence

Before interpreting emulator behavior, capture evidence that the served source is fresh enough to trust.

- Record a source freshness marker or hash for the repo-tracked module source.
- Confirm the live debug target is serving the expected module content before treating any observation as evidence.
- Treat a mismatch between the repo-tracked source and the live served source as blocked validation.

## Required smoke checks

1. Load `https://web.stremio.com/`.
2. Capture module injection or load evidence.
3. Record the source freshness marker or hash.
4. Open diagnostics with `Info`.
5. Treat optional TV key registration as a soft-fail path if registration is unavailable.
6. Verify the focus marker appears only on safe candidates.
7. Confirm directional navigation does not trap the user.
8. Confirm `Back` behavior does not break baseline Stremio navigation.
9. Confirm media keys do not consume unsafe events.
10. Review console errors.

## Result categories

- `pass`: all required smoke checks succeed, source freshness is proven, and no blocking console errors remain.
- `partial`: the page loads and some checks pass, but one or more non-blocking gaps remain that should be recorded before Task 5.
- `blocked`: source freshness cannot be proven, the module does not load as expected, or navigation/back/media-key behavior is unsafe.

## Record format

Record the outcome with:

- Date and environment
- Emulator or debug target identifier
- Source freshness marker or hash
- Module injection or load evidence
- `Info` diagnostics evidence
- Optional key registration status or soft failure
- Focus, navigation, Back, and media-key observations
- Console error summary
- Result category: `pass`, `partial`, or `blocked`
- Residual risks for Task 5

## Limitations

- This smoke validation is not final acceptance.
- Real Samsung TV validation remains mandatory.
- Known stale-launch, signing/decryption, and sandbox timeout risks still apply.
