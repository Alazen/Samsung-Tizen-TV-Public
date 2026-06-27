# Repository Map (Execution-Focused)

## Core routes

- `AGENTS.md`: compact repo router and invariant safety rules.
- `package.json`: root TizenBrew manifest. Keep this at repository root because TizenBrew installs modules from the branch root.
- `src/tizenbrew/stremio-remote/main.js`: canonical runtime for the Stremio Web remote-control TizenBrew module.
- `harness/tizenbrew/stremio-remote/`: harness notes and future local-debug helpers for the Stremio remote module. Do not duplicate runtime code here.
- `docs/tizen/`: curated navigation for Samsung Tizen TV web app docs.
- `docs/vendor/samsung-tizen-docs/`: vendored official sources; read only through `docs/tizen/source-map.md`.

## Execution harness docs

- `docs/agent/index.md`: entrypoint.
- `docs/agent/validation.md`: command policy and validation order.
- `docs/agent/skills-policy.md`: when to invoke repo-local skills.
- `docs/agent/task-card-template.md`: bounded TaskCard contract.
- `docs/agent/exec-plans/active/`: current implementation plans.
- `docs/agent/decision-log.md`: durable execution decisions.
- `docs/agent/known-risks.md`: active risks and mitigations.
- `docs/agent/local-toolchain.md`: local toolchain notes and generated-output rules.
- `docs/validation/stremio-dom-samples/`: sanitized Stremio DOM samples used by selector-contract tests.
- `docs/validation/stremio-webapp/`: execution reports for Stremio WebApp branch work.

## Tests

- `tests/manifest.test.js`: validates root TizenBrew manifest invariants.
- `tests/syntax.test.js`: validates the runtime named by `package.json.main`.
- `tests/stremio-dom-samples.test.js`: validates sanitized DOM fixtures and selector coverage.

## Skills

- `.agents/skills/tizen-doc-lookup/SKILL.md`: official-doc lookup workflow for Tizen TV tasks.
- `.agents/skills/stremio-task-executor/SKILL.md`: bounded TaskCard execution loop for this repository.
- `.agents/skills/techlead/SKILL.md`: repository-level planning, orchestration, TaskBatch checks, and ExecPlan maintenance.

## Edit boundaries (default)

- Allowed only when a task explicitly includes the path.
- Treat generated outputs (`target/`, `Debug/`, `*.exe`, `*.zip`, `*.wgt`, `*.log`, caches, temp files) as non-source artifacts; do not commit by default.
