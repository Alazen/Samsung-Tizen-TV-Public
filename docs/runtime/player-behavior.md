# Player Behavior

Playback remains owned by Stremio Web. The module provides conservative remote-control fallbacks when the real TV does not deliver usable native player button behavior.

## Version 0.1.2 behavior

Version `0.1.2` uses the sanitized player DOM samples to prefer Stremio-specific controls before generic fallbacks. The samples guide selector design only. Real Samsung TV validation remains the acceptance gate.

## Media handling order

Play/Pause:

1. Find the largest visible active `<video>` element.
2. Toggle `video.play()` or `video.pause()` directly.
3. If direct video control fails, click a visible Stremio play or pause control from `stremioSelectorGroups.playerControls`.
4. Record the result in diagnostics.

Seek:

1. Find the largest visible active `<video>` element.
2. Adjust `video.currentTime` by the configured seek step.
3. Clamp between zero and duration when duration is known.
4. If direct seek fails, click visible seek or progress controls when available.
5. Record the result in diagnostics.

Stop:

1. Pause the visible video.
2. Reset `currentTime` to zero when writable.
3. Record the result in diagnostics.

## Player navigation

When a player or visible video is active, directional navigation is restricted to player overlay and player control candidates when possible. This prevents arrow keys from jumping to home, sidebar, or background cards during playback.

If no player controls are visible, the runtime attempts a safe player wake fallback, then keeps navigation scoped to the player before returning to generic behavior.

## Diagnostics evidence

Diagnostics must expose whether a video element was found, paused state, current time, duration, the last player action result, selector source, and the last raw key event that triggered the player path.

## Acceptance note

A real-TV player pass requires playback to start, Play/Pause to toggle playback, seek forward and backward to adjust playback position, player overlay navigation to stay in the player context, and Back to leave the player or return to the previous Stremio screen.
