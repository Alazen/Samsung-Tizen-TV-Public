# Agent Harness Index

Purpose: route implementation agents to minimal, enforceable execution context.

Read in this order:
1. docs/agent/repository-map.md
2. docs/agent/validation.md
3. docs/agent/skills-policy.md
4. docs/agent/task-card-template.md
5. docs/agent/exec-plans/active/mvp.md
6. docs/agent/decision-log.md
7. docs/agent/known-risks.md

Task intake rules:
- Work from one TaskCard at a time.
- Edit only TaskCard-allowed files.
- Run narrow validation first, then broaden only when requested or when risk increases.
- Stop and ask before dependency, schema, auth, permissions, billing, deployment, secrets, or generated-artifact changes.
