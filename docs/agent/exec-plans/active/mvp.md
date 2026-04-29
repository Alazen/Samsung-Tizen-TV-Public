# ExecPlan: Stremio Web TV Remote for TizenBrew (MVP)

## Goal
Deliver a repository execution harness that allows small TaskCard-driven implementation with clear scope, validation, and safety controls.

## Context
- Router: `AGENTS.md`
- Tizen docs entry: `docs/tizen/index.md`, `docs/tizen/source-map.md`
- Harness docs: `docs/agent/*`
- Execution skill: `.agents/skills/stremio-task-executor/SKILL.md`

## Milestones
1. Keep root router compact and preserve Tizen source-routing rules.
2. Add execution docs for repository map, validation, skills policy, TaskCards, risks, and decisions.
3. Provide repo-local task executor skill with stop conditions and reporting format.
4. Validate harness docs with narrow static checks.

## Acceptance criteria
- Required harness docs exist and are internally consistent.
- Validation command set includes: `npm test`, `npm run check:manifest`, `npm run check:syntax`.
- Commit safety and generated-artifact rules are documented.
- No edits outside assigned ownership.

## Validation plan
- `git diff --check -- AGENTS.md docs/agent .agents/skills/stremio-task-executor/SKILL.md`

## Risks
- Worker B package scripts may not yet exist; command definitions are documented now and should be verified once scripts land.
