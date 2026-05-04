# Public Docs Privacy Checklist

Use this checklist before committing docs that contain validation evidence from local emulator, Tizen Studio, Web Inspector, or Windows shell runs.

## Redact before commit

Replace local environment values with stable placeholders:

- absolute checkout path -> `<repo-root>`
- Tizen Studio install root -> `<tizen-studio-root>`
- Node install root -> `<node-root>`
- Tizen Studio data root -> `<tizen-studio-data-root>`
- Windows user or shell identity -> `<windows-identity>`
- emulator serial -> `<emulator-id>`
- emulator profile name -> `<emulator-profile>`
- local debug port -> `<debug-port>`
- CDP target ID -> `<target-id>`
- signing profile name -> `<signing-profile>`
- device DUID or equivalent local identifier -> `<device-identifier>`
- local app/service IDs that are not needed for public validation -> app/service placeholders

## Keep when needed

- Source marker: `stremio-webapp-src-main-js-task4e-v1`
- Injection marker: `stremio-webapp-runtime-injection-v1`
- The distinction between `file:///index.html` and `https://web.stremio.com/`
- Evidence that the live target was local harness, not Stremio Web
- Commit SHAs and source hashes when they are required to prove source freshness
- The fact that Task 5b is blocked
- The requirement that Task 6 real Samsung TV validation remains mandatory

## Do not commit

- Raw local logs
- Generated build outputs
- Packaged app outputs
- Signing material
- Private credentials
- Machine-specific diagnostic dumps

## Validation habit

After docs updates, run:

```bash
git diff --check -- PLAN.md docs/agent docs/validation
```

Then run the project privacy grep from the active TaskCard or cleanup brief. If the grep finds only generic safety guidance, leave it. If it finds real local values, redact them before commit.
