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

## Procedure

1. Install and enable the module through the TizenBrew flow.
2. Confirm the module card shows the expected `package.json` version.
3. Launch Stremio Web through TizenBrew.
4. Validate diagnostics on the home screen.
5. Validate remote navigation and focus behavior in real Stremio pages.
6. Validate media-key behavior during playback.
7. Validate Back and Exit handling.
8. Record pass, partial, or blocked plus residual risks.

## Current real-TV evidence

- TizenBrew loaded the GitHub module metadata and showed `Stremio Web TV Remote`.
- Stremio Web launched through TizenBrew.
- Login was possible only through a manual workaround, so login/auth focus remains weak.
- Home screen loaded after login.
- Playback can start and video content can play.
- `Info` did not open diagnostics on the home screen.
- In the video player, Play/Pause, seek/skip, player navigation, and Back did not work.

Current result: `partial` for install and launch, `blocked` for remote-control acceptance.

## Acceptance note

No feature is fully accepted until this real-device path is completed. A successful install or Stremio launch is not enough; diagnostics, navigation, player media keys, and Back/Exit behavior must work on the real TV.
