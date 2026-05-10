# Sequential Execution Manifest: stremio-runtime-v024

## Parent goal

Recover real-TV Stremio details/player navigation from the observed 0.2.3 frozen state while preserving diagnostics.

## Parent Goal Contract

### Outcome

A new test branch provides a safer runtime that either restores navigation by passing Arrow and Enter through on detail/player pages or captures enough diagnostics to identify whether the freeze is native Stremio, stream loading, or video playback related.

### Included scope

- Inspect repository harness instructions and validation policy.
- Create a fresh TizenBrew test branch from 0.2.3.
- Add one bounded runtime build for debug/pass-through behavior.
- Update package metadata and manifest tests only if the runtime file can be written.

### Excluded scope

- No dependency changes.
- No lockfile changes.
- No deployment, signing, schema, auth, billing, secrets, or production-data changes.
- No broad refactor.

### Acceptance criteria

- Runtime branch is created.
- Runtime source is syntactically valid before publish.
- Manifest points to the new runtime and version.
- Manifest test metadata matches the new version.
- If publishing is blocked, checkpoint records the stop reason and next safe action.

### Required evidence

- GitHub branch or commit evidence.
- Validation command and result.
- Connector error or blocker if publishing fails.

### Completion definition

Complete when the branch has a validated 0.2.4 runtime and manifest, or stopped when no safe GitHub write path remains after two recovery attempts.

### Legal stop conditions

- GitHub connector blocks runtime source writes twice.
- Required work exceeds runtime, manifest, test metadata, or checkpoint docs.
- Same validation command fails twice.

## Scope

### Included TaskCards

| TaskCard | Status | Owner agent | Validation | Changed files | Blocker |
| --- | --- | --- | --- | --- | --- |
| TC-024A-readiness | Complete | repository-execution-agent | repo docs inspected | AGENTS.md, docs/agent/validation.md, docs/agent/exec-plans/active/mvp.md | none |
| TC-024B-branch | Complete | repository-execution-agent | branch create response | branch stremio-webapp-v024 | none |
| TC-024C-runtime | Blocked | repository-execution-agent | node --check passed locally before publish | pending | GitHub connector blocked create_file for JavaScript runtime twice |
| TC-024D-manifest | Pending | repository-execution-agent | not run | package.json, tests/manifest.test.js | waits on runtime file |

### Excluded work

Anything outside the above files and branch.

## Execution order

1. TC-024A-readiness
2. TC-024B-branch
3. TC-024C-runtime
4. TC-024D-manifest

## Dependency map

- TC-024D depends on TC-024C because package.json should not point to a missing runtime file.

## File conflict map

- package.json and tests/manifest.test.js are shared validation metadata and must be updated only after runtime source exists.

## Phase gates

| Phase | TaskCards | Gate command | Pass criteria | Stop condition |
| --- | --- | --- | --- | --- |
| Runtime source | TC-024C | node --check src/main-0.2.4.js | Syntax passes | Same command fails twice or GitHub write blocked twice |
| Manifest | TC-024D | node tests/manifest.test.js | Manifest points to new runtime and version | Runtime missing |

## Checkpoints

| Time | Completed | Current | Changed files | Validation | Next action |
| --- | --- | --- | --- | --- | --- |
| 2026-05-10 | TC-024A, TC-024B | TC-024C | docs/agent/task-batches/active/stremio-runtime-v024.md | node --check passed locally for candidate runtime | Stop: GitHub connector blocked runtime source write twice |

## Decisions

- Prefer a passive debug build over another aggressive spatial-navigation build because the TV shows 0.2.3 receiving keys while focus remains unusable.
- Do not update package.json until the runtime file exists.

## Risks

- Without a committed runtime file, TizenBrew cannot test 0.2.4.
- The observed video unsupported state may be a stream/codec issue independent of remote navigation.

## Resume instructions

Resume TC-024C by writing `src/main-0.2.4.js` through a working GitHub write path or a local clone, then update `package.json` to version `0.2.4` with `main: src/main-0.2.4.js`, update `tests/manifest.test.js`, and run the standard validation sequence.

## Next-Action Invariant

- Stop: stop condition is `GitHub connector blocked runtime source writes twice`.

## Final validation plan

- `node --check src/main-0.2.4.js`
- `node tests/manifest.test.js`
- `node tests/syntax.test.js`

## Completion report

Stopped early because the JavaScript runtime file could not be written through the connector after two attempts.
