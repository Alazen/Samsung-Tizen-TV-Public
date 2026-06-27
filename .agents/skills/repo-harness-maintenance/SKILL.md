---
name: repo-harness-maintenance
description: Maintain AGENTS.md, docs/agent, templates, execution-plan structure, and repo-local skills. Use for harness-only changes. Do not use for product code, dependencies, or generated artifacts.
---

# Repo Harness Maintenance

## Use only when

- The request is to improve agent workflow, docs, templates, or skills.
- The change is harness-only.
- Product code is explicitly out of scope.

## Do not use when

- Runtime or app behavior must change.
- The task requires dependencies, lockfiles, scripts, signing material, deployment, auth, billing, production data, or generated outputs without approval.

## Required inputs

- User instruction or approved harness TaskCard.
- Existing `AGENTS.md` and `docs/agent/index.md`.
- Relevant validation or risk docs.

## Allowed files/folders

- `AGENTS.md`
- `README.md`
- `PLAN.md`
- `docs/agent/`
- `docs/validation/`
- `.agents/skills/`

## Steps

1. Inspect current harness routes.
2. Preserve existing conventions unless stale or conflicting.
3. Add concise missing files instead of giant manuals.
4. Keep root `AGENTS.md` router-like.
5. Update repository map and validation docs when paths change.
6. Record durable decisions and risks.
7. Verify required files exist.

## Validation commands

```bash
git diff --check -- AGENTS.md README.md PLAN.md docs/agent docs/validation .agents/skills
```

Run Node tests only if harness changes affect manifest, tests, or runtime source paths.

## Stop conditions

- Harness edit requires product code.
- Existing instructions conflict.
- Approval-required files are needed.
- Validation command assumptions would be invented.

## Final response format

- Harness status.
- Files changed.
- 002 readiness.
- Validation result or unavailable validation.
- Known unknowns and next recommended action.
