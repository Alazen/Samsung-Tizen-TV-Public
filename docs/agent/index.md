# Agent Harness Index

Purpose: route agents to durable repository context and 002-compatible execution workflows.

## Read in order

1. `AGENTS.md`
2. `docs/agent/repository-map.md`
3. `docs/agent/architecture.md`
4. `docs/agent/validation.md`
5. `docs/agent/testing.md`
6. `docs/agent/skills-policy.md`
7. `docs/agent/known-risks.md`
8. `docs/agent/decision-log.md`

## Long-run execution

Use the 002 prompt only after a plan is approved.

Preferred layout:

```text
docs/agent/exec-plans/active/<task-slug>/
  PLAN.md
  EXECUTION_REPORT.md
  EXECUTION_STATE.json
  sequential-manifest.md
  taskcards/
    TC-001-<short-name>.md
```

Templates:

- `docs/agent/templates/PLAN.template.md`
- `docs/agent/templates/TASKCARD.template.md`
- `docs/agent/templates/SEQUENTIAL_MANIFEST.template.md`
- `docs/agent/templates/EXECUTION_REPORT.template.md`
- `docs/agent/templates/EXECUTION_STATE.template.json`

## Task intake rules

- Work from one TaskCard at a time.
- Edit only TaskCard-allowed files.
- Run narrow validation first.
- Broaden validation only when requested or when risk increases.
- Stop before dependencies, lockfiles, scripts, schemas, auth, permissions, billing, deployment, secrets, signing material, generated artifacts, or production data unless explicitly approved.

## Current workspace

- Durable branch: `stremio-webapp-tizen`.
- Canonical current runtime: `src/tizenbrew/stremio-remote/main.js`.
- Future wrapper proof-of-concept should be planned before product code is added.
