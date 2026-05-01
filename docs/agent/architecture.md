# Agent Architecture Router

Purpose: provide a short architecture entrypoint for implementation agents without duplicating product, runtime, validation, or Tizen documentation.

## Product shape

This repository builds a thin TizenBrew site-modification module for Stremio Web on Samsung Tizen TVs.

The goal is to improve remote-control usability without replacing Stremio Web.

## Runtime source

Use these files as the first source-level entrypoints:

- `src/main.js`: runtime bootstrap and behavior entrypoint.
- `src/styles.css`: optional style injection surface.
- `package.json`: TizenBrew module metadata, key declarations, and validation scripts.
- `tests/`: static validation for manifest and syntax.

## Runtime design docs

Read `docs/runtime/` before changing runtime behavior.

Use runtime docs to understand:
- Remote-control behavior.
- Key registration.
- Focus and navigation assumptions.
- Playback-context behavior.
- Soft-fail behavior outside Tizen.

## Product docs

Use:

- `docs/product/scope.md`
- `docs/product/non-goals.md`
- `docs/product/acceptance.md`

These define what the module is allowed to become and what it must not attempt.

## Validation docs

Use:

- `docs/agent/validation.md`
- `docs/validation/emulator-validation.md`
- `docs/validation/real-tv-validation.md`

Validation rule:

- Emulator validation is useful for local confidence.
- Real Samsung TV plus TizenBrew validation is required for final product acceptance.

## Tizen docs

Start with:

- `docs/tizen/index.md`
- `docs/tizen/source-map.md`

Do not scan the full vendored Samsung docs tree unless `docs/tizen/source-map.md` points to a specific official source.

## Execution plans and TaskCards

Use:

- `docs/agent/exec-plans/active/`
- `docs/agent/task-cards/index.md`
- `docs/agent/task-cards/active/`

Execution rule:

- ExecPlans define sequencing and risk.
- TaskCards define exact bounded work.
- Application behavior changes require an active TaskCard with allowed files, validation commands, done conditions, and stop conditions.

## Architecture constraints

- Vanilla JavaScript only unless explicitly approved.
- No runtime framework unless explicitly approved.
- No new runtime dependency unless explicitly approved.
- Do not edit generated artifacts.
- Do not commit packaged binaries, logs, or temporary emulator harness outputs.
- Do not rely on unsupported TV privileges or undocumented device behavior.
- Treat emulator validation as insufficient for final acceptance.

## Stop and ask before

- Adding dependencies.
- Editing package manager lockfiles.
- Changing signing, certificates, deployment, permissions, secrets, auth, billing, or production data.
- Replacing the TizenBrew module approach.
- Treating emulator success as real-device acceptance.
