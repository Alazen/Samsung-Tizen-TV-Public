# Real TV Validation

Real Samsung TV validation is the final acceptance gate.

## TizenBrew module update workflow

Use this workflow for every runtime change that must be tested on the TV:

1. Update the runtime code.
2. Bump `package.json` `version` for the TV test build.
3. Run the standard validation commands.
4. Commit and push to the same branch used by the TizenBrew GitHub module reference.
5. Fully close and reopen TizenBrewNextGeneration on the TV.
6. Confirm the TizenBrew module card shows the new version.
7. Launch Stremio Web through TizenBrew and retest.

Recommended development module reference:

```text
gh/Alazen/Samsung-Tizen-TV-Public@Stremio-WebApp
```

When TizenBrew is configured with the branch reference above, future pushed commits should be available without changing the module entry. Reopen TizenBrew after each push so it refreshes the GitHub module. If TizenBrew was configured with a pinned commit SHA instead of a branch, update the module reference for each new test build or switch back to the branch reference.

Use a pinned commit SHA only for a stable release candidate after a real-TV pass.

## Agent release-note requirement

Any agent that changes `src/main.js`, `src/styles.css`, runtime behavior, diagnostics, key handling, or TizenBrew-facing package metadata must also:

- bump `package.json` `version` before final validation;
- mention the new version in the final report;
- tell the user to reopen TizenBrewNextGeneration and confirm the module card shows that version;
- avoid claiming real-TV validation from a stale version.

Docs-only changes do not require a package version bump.

## Current real-TV evidence

- TizenBrew loaded the GitHub module metadata and showed `Stremio Web TV Remote`.
- Stremio Web launched through TizenBrew.
- Login was possible only through a manual workaround, so login/auth focus remains weak.
- Home screen loaded after login.
- Playback can start and video content can play.
- `Info` did not open diagnostics on the home screen.
- Color buttons A/B/C/D also did not open diagnostics on the home screen.
- In the video player, Play/Pause, seek/skip, player navigation, and Back did not work.

Current result: `partial` for install and launch, `blocked` for remote-control acceptance.

## Version 0.1.2 retest checklist

After extracting the runtime fix, committing, and pushing:

1. Fully close and reopen TizenBrewNextGeneration.
2. Confirm the module card shows version `0.1.2`.
3. Launch Stremio Web through TizenBrew.
4. Confirm the temporary boot badge appears, or use Web Inspector `getState()` if it does not.
5. On the home screen, press `Info`.
6. If `Info` fails, press A/B/C/D and record whether diagnostics opens.
7. Navigate home cards and side nav.
8. Open a detail page.
9. Select a stream and start playback.
10. Test Play/Pause.
11. Test seek forward and seek backward.
12. Test directional navigation over player controls.
13. Press Back and confirm it exits the player or returns to the previous Stremio screen.
14. If login is needed again, verify arrows can reach login inputs, buttons, checkboxes, and Guest login.
15. Record result as `pass`, `partial`, or `blocked`.

## Acceptance note

No feature is fully accepted until this real-device path is completed. A successful install or Stremio launch is not enough. Diagnostics, navigation, player media keys, and Back/Exit behavior must work on the real TV.
