# AGENTS.md

Purpose: compact router for Codex execution and Tizen documentation work.

## Repository role
Stremio WebApp repository with a Tizen TV docs harness and execution harness docs for bounded TaskCard implementation.

## Start here for Tizen tasks
- docs/tizen/index.md
- docs/tizen/source-map.md

## Tizen doc routing rules
- Do not read the full vendored Samsung tree.
- Use docs/vendor/samsung-tizen-docs only when docs/tizen/source-map.md points to a specific official source.
- Do not edit vendored docs except during intentional upstream sync.
- Prefer Tizen TV Web Application docs over generic Tizen, .NET, Native, IoT, or Wearable docs.
- In answers/plans, name curated docs and official source files consulted.
- Stop if a task requires unsupported TV privileges, undocumented device behavior, signing secrets, or Samsung Seller Office-only information.

## Execution harness docs
- docs/agent/index.md
- docs/agent/repository-map.md
- docs/agent/validation.md
- docs/agent/skills-policy.md
- docs/agent/task-card-template.md
- docs/agent/exec-plans/active/mvp.md
- docs/agent/decision-log.md
- docs/agent/known-risks.md

## Commit and artifact safety
- Before commit: run `git status --short`, then `git diff --cached --stat`, review staged paths, and call out unusually large staged files.
- Do not commit generated artifacts by default (`target/`, `*.exe`, `*.zip`, `*.log`, caches, temporary files) unless explicitly requested.

## Definition of done
- TaskCard acceptance criteria met.
- Relevant validation commands run per docs/agent/validation.md.
- Uncertainty and remaining risks stated explicitly.
