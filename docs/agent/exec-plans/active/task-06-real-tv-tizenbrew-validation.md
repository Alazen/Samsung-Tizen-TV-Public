# ExecPlan: Task 6, Real TV TizenBrew Validation

## Status

- State: active
- Current owner: Codex
- Last updated: 2026-05-04
- Current result: install and launch are partially validated; remote-control acceptance is blocked.
- Next action: fix real-TV key event handling, diagnostics toggles, player controls, and Back behavior before claiming Task 6 pass.

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

Because neither `Info` nor A/B/C/D opened diagnostics, the failure is broader than a single Info-key mapping. The next implementation should investigate real-TV key event delivery, optional-key registration, TizenBrew injection timing, and fallback event paths before assuming the focus algorithm alone is the blocker.

## Steps

1. Create or update a bounded Task 6 TaskCard for real-TV key handling.
2. Fix diagnostics key handling so the user can prove whether the runtime is active on the TV.
3. Fix player media controls and Back behavior on the real Stremio player.
4. Improve login/auth focus after the key-event path is understood.
5. Execute the acceptance procedure in `docs/validation/real-tv-validation.md`.
6. Record results and remaining risks.

## Validation commands

- `npm run check:syntax`
- `npm run check:manifest`
- `npm test`
- `git diff --check -- PLAN.md docs/agent docs/runtime docs/validation src tests package.json`

## Stop conditions

Stop if required validation access depends on unavailable signing secrets, Seller Office-only capabilities, generated artifacts, package/lockfile dependency changes, or raw local logs.
