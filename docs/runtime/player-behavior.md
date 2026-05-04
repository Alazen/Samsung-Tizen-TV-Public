# Player Behavior

Playback remains owned by Stremio Web. The module provides conservative remote-control fallbacks when the real TV does not deliver usable native player button behavior.

## Module responsibilities

- Map remote/media keys to existing player actions where safely detectable.
- Avoid overriding Stremio playback internals.
- Preserve compatibility across browser-like and Tizen runtime contexts.
- Prefer direct control of the active visible `<video>` element when native player controls are not reachable.

## Real-TV fallback behavior

The real Samsung TV test showed that video playback could start, but Play/Pause, seek/skip, player navigation, and Back did not work. The runtime now treats this as a first-class player fallback case.

Media handling order:

1. Find the largest visible `<video>` element in the current document.
2. For Play/Pause, call `video.play()` or `video.pause()` directly.
3. For fast-forward and rewind, adjust `video.currentTime` by the configured seek step.
4. For Stop, pause the video and reset `currentTime` to zero.
5. Record the outcome in diagnostics without throwing when no video is found.

## Diagnostics evidence

Diagnostics must expose:

- whether a video element was found;
- paused state;
- current time;
- duration;
- the last player action result;
- the last raw key event that triggered the player path.

## Acceptance note

A real-TV player pass requires playback to start, Play/Pause to toggle playback, seek forward/back to adjust playback position, and Back to leave the player or return to the previous Stremio screen.
