# Repository Map (Execution-Focused)

## Core routes

- `AGENTS.md`: compact repo router and invariant safety rules.
- `README.md`: human-readable current workspace summary.
- `PLAN.md`: current high-level project direction and branch policy.
- `package.json`: root TizenBrew manifest. Keep this at repository root because TizenBrew installs modules from the branch root.
- `src/tizenbrew/stremio-remote/main.js`: canonical runtime for the current Stremio Web remote-control TizenBrew module.
- `harness/tizenbrew/stremio-remote/`: harness notes and future local-debug helpers for the Stremio remote module. Do not duplicate runtime code here.
- `docs/tizen/`: curated navigation for Samsung Tizen TV web app docs.
- `docs/vendor/samsung-tizen-docs/`: vendored official sources; read only through `docs/tizen/source-map.md`.

## Agent harness docs

- `docs/agent/index.md`: entrypoint for agents.
- `docs/agent/repository-map.md`: this file.
- `docs/agent/architecture.md`: architecture and boundary rules.
- `docs/agent/validation.md`: command policy and validation order.
- `docs/agent/testing.md`: test levels and evidence rules.
- `docs/agent/skills-policy.md`: when to invoke repo-local skills.
- `docs/agent/decision-log.md`: durable decisions.
- `docs/agent/known-risks.md`: active risks and mitigations.
- `docs/agent/templates/`: 002-compatible templates.
- `docs/agent/exec-plans/active/`: active long-run execution plans.
- `docs/agent/exec-plans/completed/`: completed long-run execution plans.
- `docs/validation/stremio-dom-samples/`: sanitized Stremio DOM samples used by selector-contract tests.
- `docs/validation/stremio-webapp/`: execution reports for Stremio WebApp branch work.

## 002 execution layout

```text
docs/agent/exec-plans/active/<task-slug>/
  PLAN.md
  EXECUTION_REPORT.md
  EXECUTION_STATE.json
  sequential-manifest.md
  taskcards/
    TC-001-<short-name>.md
```

## Tests

- `tests/manifest.test.js`: validates root TizenBrew manifest invariants.
- `tests/syntax.test.js`: validates the runtime named by `package.json.main`.
- `tests/stremio-dom-samples.test.js`: validates sanitized DOM fixtures and selector coverage.

## Skills

- `.agents/skills/code-change-verification/SKILL.md`: final verification after edits.
- `.agents/skills/long-run-execution/SKILL.md`: 002-compatible plan execution.
- `.agents/skills/repo-harness-maintenance/SKILL.md`: harness-only maintenance.
- `.agents/skills/tizen-doc-lookup/SKILL.md`: official-doc lookup workflow for Tizen TV tasks.
- `.agents/skills/stremio-task-executor/SKILL.md`: bounded TaskCard execution loop for this repository.
- `.agents/skills/techlead/SKILL.md`: repository-level planning, orchestration, TaskBatch checks, and ExecPlan maintenance.

## Edit boundaries

- Allowed only when a task explicitly includes the path or the user instruction clearly requests the path class.
- Treat generated outputs (`target/`, `Debug/`, `*.exe`, `*.zip`, `*.wgt`, `*.log`, caches, temp files) as non-source artifacts; do not commit by default.
- Do not touch signing material, secrets, auth, billing, production data, deployment, dependencies, lockfiles, or generated/vendor files without explicit approval.
