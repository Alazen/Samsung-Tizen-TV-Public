# Stremio DOM Samples

Sanitized DOM samples captured from Stremio Web for real-TV remote navigation debugging.

## Privacy rules

These samples are sanitized before being committed. The sanitized files remove or redact:

- email addresses and usernames
- auth/session/token-like values
- concrete asset URLs and image URLs
- media IDs in Stremio routes
- inline scripts and styles
- SVG path payloads
- most media titles and personal content labels
- value attributes and private-looking data attributes

## Samples

- `login-signup-overlay.html`: first-run signup and guest-login controls.
- `login-form.html`: login form controls.
- `details-page-with-streams.html`: detail and stream-selection structure.
- `player-controls-visible.html`: video player with controls visible.
- `player-controls-visible-variant.html`: second player-controls sample.
- `player-controls-menu-open.html`: player state with a menu or extra controls open.
- `nav-menu-open-home.html`: home screen with account/navigation menu open.
- `anonymous-profile-menu-open.html`: anonymous profile toggle with its nested login popup open.
- `home-after-login-extra.html`: additional post-login/home or mixed-state sample.

## Use

Use these files for selector design, focus-candidate tests, player-control heuristics, and Back/Exit behavior analysis. They are not validation proof by themselves. Real Samsung TV validation remains required.

## Capture note

The original unsanitized paste files are intentionally not included in this directory.
