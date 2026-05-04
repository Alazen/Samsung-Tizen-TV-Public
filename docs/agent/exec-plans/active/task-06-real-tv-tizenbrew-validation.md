# ExecPlan: Task 6, Real TV TizenBrew Validation

## Status

- State: active
- Current owner: manual runtime fix executor
- Last updated: 2026-05-04
- Current result: install and launch are partially validated; remote-control acceptance is blocked.
- Next action: test version `0.1.2` real-TV DOM-sample selector handling, diagnostics, player controls, and Back behavior.

## Goal

Validate behavior on a real Samsung TV running the TizenBrew injection path.

## Context

Emulator results from Task 5 are necessary but not sufficient. Final acceptance requires real-device diagnostics, key behavior, playback context checks, and Back/Exit confirmation.

The TV is configured with the TizenBrew GitHub module path. During development, keep the module reference on the branch form:

```text
gh/Alazen/Samsung-Tizen-TV-Public@Stremio-WebApp
```

For every runtime change intended for TV retest, bump `package.json` `version`, commit and push to the branch, fully close and reopen TizenBrewNextGeneration, then confirm the module card shows the new version before retesting. Use pinned commit SHAs only for stable release candidates after a real-TV pass.

## Current real-TV evidence

- TizenBrew loaded the GitHub module metadata and showed `Stremio Web TV Remote`.
- Stremio Web launched through TizenBrew.
- Login was possible only through a manual workaround, so login/auth focus remains weak.
- Home screen loaded after login.
- Playback can start and video content can play.
- `Info` did not open diagnostics on the home screen.
- Color buttons A/B/C/D also did not open diagnostics on the home screen.
- In the video player, Play/Pause, seek/skip, player navigation, and Back did not work.

## Root-cause signal

Because neither `Info` nor A/B/C/D opened diagnostics, the failure is broader than a single Info-key mapping. Version `0.1.2` keeps the v0.1.1 listener fallback strategy and adds a visible boot badge, repeat diagnostics fallback, Stremio-specific selector groups derived from sanitized DOM samples, candidate scoring, precise player control selection, direct video fallback, player-scoped navigation, player-aware Back behavior, and auth/login focus improvements.

## Implementation summary for version 0.1.2

- Runtime version is bumped to `0.1.2`.
- `package.json` version is bumped to `0.1.2` so the TizenBrew card can prove the TV loaded the new test build.
- `src/main.js` and the disposable harness runtime copy stay hash-identical.
- Selector design uses sanitized Stremio DOM samples while preserving generic fallback selectors.
- Fixture tests cover sample availability, privacy checks, selector coverage, runtime selector contract, and harness parity.
- Diagnostics include the boot badge, raw event path, event type, key, code, keyCode, which, keyName, normalized key, video state, candidate groups, and listener paths.
- Key listeners attach to document/window `keydown`, `keyup`, `keypress`, and `tizenhwkey`.
- Common Samsung keyCode values are mapped for Back, Info, color keys, media keys, arrows, and Enter.
- Media keys control the active visible `<video>` element directly when Stremio controls are not reachable.
- Back closes diagnostics, closes module modal state, blurs editables, closes player menus, clicks player Back or Close controls, dispatches Escape, then uses history fallback before opening the module exit modal.

## Steps

1. Extract the version `0.1.2` fix at the branch root.
2. Run validation commands.
3. Commit and push to `Stremio-WebApp`.
4. Reopen TizenBrewNextGeneration and confirm the module card shows `0.1.2`.
5. Execute the acceptance procedure in `docs/validation/real-tv-validation.md`.
6. Record results and remaining risks.

## Validation commands

- `npm run check:syntax`
- `npm run check:manifest`
- `npm test`
- `git diff --check -- PLAN.md docs/agent docs/runtime docs/validation src tests package.json harness/CodexTvRuntimeCheck/js/stremio-remote.js`

## Stop conditions

Stop if required validation access depends on unavailable signing secrets, Seller Office-only capabilities, generated artifacts, package or lockfile dependency changes, or raw local logs.
