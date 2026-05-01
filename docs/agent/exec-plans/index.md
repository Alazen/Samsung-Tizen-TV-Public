# Exec Plans Index

| Task | Plan file | State | Owner | Next action |
| --- | --- | --- | --- | --- |
| Task 1 | `docs/agent/exec-plans/completed/task-01-detailed-plan.md` | completed | Codex | Historical reference only |
| Task 2 | `docs/agent/exec-plans/completed/task-02-tizen-studio-tv-emulator-setup.md` | completed | Codex | Revisit only if toolchain changes |
| Task 3 | `docs/agent/exec-plans/active/task-03-emulator-debug-harness-decision.md` | blocked | Codex | Preserve Decision B and keep the blocker documented |
| Task 4 | `docs/agent/exec-plans/active/task-04-runtime-core.md` | active | Codex | Confirm runtime-core closeout and keep the emulator bridge queued |
| Task 5 | `docs/agent/exec-plans/active/task-05-emulator-stremio-web-smoke-validation.md` | active | Codex | Task 5a completed; Task 5b remains gated until Task 4 local validation is confirmed and the bridge is explicitly started |
| Task 6 | `docs/agent/exec-plans/active/task-06-real-tv-tizenbrew-validation.md` | active | Codex | Prepare and execute real-TV validation gates after Task 5 results are recorded |

## Notes

- Keep this index as the top-level router for exec-plan status.
- Put durable architecture/product/validation details in dedicated docs under `docs/runtime`, `docs/product`, and `docs/validation`.
- Keep task-level source notes inside each ExecPlan file.
