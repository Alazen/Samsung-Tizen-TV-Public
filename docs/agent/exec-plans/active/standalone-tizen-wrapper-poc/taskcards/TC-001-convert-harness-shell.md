# TC-001: Convert Existing Harness Shell

Status: completed

## Objective

Convert the tracked `harness/CodexTvRuntimeCheck` shell in place into the standalone Stremio Web Wrapper POC. Work directly in the repository; do not create a replacement app directory.

## Files allowed to edit

- `harness/CodexTvRuntimeCheck/config.xml`
- `harness/CodexTvRuntimeCheck/index.html`
- `harness/CodexTvRuntimeCheck/css/style.css`
- `harness/CodexTvRuntimeCheck/tizen_web_project.yaml`

## Exact implementation target

- Preserve package/application ID `1cfJsyQB4G.CodexTvRuntimeCheck` for in-place upgrade compatibility.
- Set widget version `1.1.0`, display name and output name `StremioWebWrapperPOC`.
- Keep local `index.html` as the entrypoint and `tv-samsung` profile.
- Add only the public `internet` and `tv.inputdevice` privileges plus external access/navigation policy required for `https://web.stremio.com/` and its resources.
- Replace the fixture page with a lightweight full-screen wrapper containing an iframe, loading/status surfaces, diagnostics container, and an accessible iframe-versus-redirect mode control. Default to iframe mode.
- Load only `js/main.js`; remove the stale missing `js/stremio-remote.js` reference from HTML and YAML.
- Keep CSS suitable for 1920x1080 Samsung TV and avoid expensive effects or frameworks.
- Do not modify JavaScript in this TaskCard.

## Validation

- Parse `config.xml` as XML.
- Confirm every YAML source path exists.
- `git diff --check -- harness/CodexTvRuntimeCheck`

## Stop conditions

- Dependency or signing changes required.
- Application/package ID must change.
- Any file outside the allowed list would need editing.

## Response

Print `AGY_DONE`, changed files, validation performed, issues, and no unrelated commentary.

## Codex review feedback for correction attempt 2

- Remove all inline JavaScript from `index.html`; TC-002 owns runtime behavior.
- Remove the obsolete fixture dialog, fixture buttons, history controls, and Task 4 compatibility UI.
- Keep the shell minimal: full-screen iframe, loading/status node, compact mode controls, diagnostics container, and `js/main.js` only.
- Simplify CSS for slow TVs: no `backdrop-filter`, large animated/transitional effects, or fixture styles. Use straightforward positioning, colors, focus outlines, and overlay visibility classes.
- Ensure iframe mode is structurally the default without duplicating runtime logic in HTML.
- Run the exact XML parse, YAML file-existence, and `git diff --check` validations from this TaskCard.
- Write the required absolute result file `.agent-tmp/agy-tc001-result.txt`.
