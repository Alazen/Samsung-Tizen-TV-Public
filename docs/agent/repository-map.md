# Repository Map (Execution-Focused)

## Core routes
- `AGENTS.md`: repo router and invariant safety rules.
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

## Skills
- `.agents/skills/tizen-doc-lookup/SKILL.md`: official-doc lookup workflow for Tizen TV tasks.
- `.agents/skills/stremio-task-executor/SKILL.md`: bounded TaskCard execution loop for this repository.

## Edit boundaries (default)
- Allowed only when a task explicitly includes the path.
- Treat generated outputs (`target/`, `*.exe`, `*.zip`, `*.log`, caches, temp files) as non-source artifacts; do not commit by default.
