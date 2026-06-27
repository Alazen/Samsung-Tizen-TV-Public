# Testing Policy

Purpose: define evidence rules for agent work without inventing unavailable validation.

## Test levels

| Level | Purpose | Final acceptance? |
|---|---|---:|
| Static checks | Catch manifest, syntax, docs, and selector-contract issues | No |
| Emulator checks | Confirm local packaging, launch, key events, and debug overlay | No |
| Real TV checks | Confirm Samsung TV remote behavior and playback | Yes |

## Standard checks

Run the narrowest relevant command first:

```bash
node tests/syntax.test.js
node tests/manifest.test.js
node tests/stremio-dom-samples.test.js
```

Use `npm test` when npm is available and broader regression is appropriate.

## Evidence rules

- Record exact command run.
- Record pass, fail, partial, blocked, or not-run.
- For TV/emulator evidence, record target type without leaking exact local IDs, debug ports, usernames, signing profiles, or private URLs.
- Do not treat screenshots, logs, or copied HTML as safe to commit until redacted.
- Do not treat emulator playback as final playback acceptance.

## TizenBrew test evidence

For TizenBrew test modules:

- Use `Alazen/Samsung-Tizen-TV-Public@branch-name`.
- Do not use `gh/`.
- Confirm the TV module card version before testing.
- Treat versioned branches as disposable cache-busting modules only.

## Wrapper proof-of-concept evidence

For a standalone Tizen Web App wrapper:

- Prove the app loads.
- Prove `https://web.stremio.com/` loads or document the blocker.
- Prove remote key events are observable.
- Prove diagnostics can be opened.
- Test final playback on the real TV.

## Unavailable validation

If a command cannot run in the current environment, report:

- command
- reason unavailable
- closest completed check
- risk added or updated in `docs/agent/known-risks.md`
