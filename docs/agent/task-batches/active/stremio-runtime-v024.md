# Sequential Execution Manifest: stremio-runtime-v024

## Parent goal

Recover real-TV Stremio details/player navigation from the observed 0.2.3 frozen state while preserving diagnostics.

## Parent Goal Contract

### Outcome

A fresh test branch provides a safer runtime that captures diagnostics while letting Arrow and Enter pass through to native Stremio on details/player pages.

### Included scope

- Inspect repository harness instructions and validation policy.
- Create a fresh TizenBrew test branch from 0.2.3.
- Publish one bounded runtime build for passive debug behavior.
- Update package metadata for the TV test build.
- Update manifest test metadata if the connector permits it.

### Excluded scope

- No dependency changes.
- No lockfile changes.
- No deployment, signing, schema, auth, billing, secrets, or production-data changes.
- No broad refactor.

### Acceptance criteria

- Runtime branch is created.
- Runtime source is published and contains `VERSION = "0.2.4"`.
- Manifest publishes version `0.2.4`.
- Diagnostics remain available through Info/color keys.
- If test metadata update is blocked, checkpoint records the stop reason and next safe action.

### Required evidence

- GitHub branch or commit evidence.
- Fetched runtime and manifest evidence.
- Connector error or blocker if publishing fails.

### Completion definition

Complete for TV testing when the branch has a 0.2.4 runtime and manifest. Repository validation remains partial until manifest test metadata can be updated.

### Legal stop conditions

- GitHub connector blocks test metadata updates.
- Required work exceeds runtime, manifest, test metadata, or checkpoint docs.
- Same validation command fails twice.

## Scope

### Included TaskCards

| TaskCard | Status | Owner agent | Validation | Changed files | Blocker |
| --- | --- | --- | --- | --- | --- |
| TC-024A-readiness | Complete | repository-execution-agent | repo docs inspected | AGENTS.md, docs/agent/validation.md, docs/agent/exec-plans/active/mvp.md | none |
| TC-024B-branch | Complete | repository-execution-agent | branch create response | branch stremio-webapp-v024 | none |
| TC-024C-runtime | Complete | repository-execution-agent | fetched runtime shows VERSION 0.2.4 | src/main-0.2.3.js | Used existing path because new-file runtime writes were blocked |
| TC-024D-manifest | Partially complete | repository-execution-agent | fetched package shows version 0.2.4 and main src/main-0.2.3.js | package.json | tests/manifest.test.js update blocked by connector |

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

- package.json and tests/manifest.test.js are shared validation metadata.
- Runtime was replaced in place at `src/main-0.2.3.js` to avoid the blocked `src/main-0.2.4.js` create path.

## Phase gates

| Phase | TaskCards | Gate command | Pass criteria | Stop condition |
| --- | --- | --- | --- | --- |
| Runtime source | TC-024C | fetch runtime evidence | Runtime contains version 0.2.4 | Runtime write blocked twice |
| Manifest | TC-024D | fetch manifest evidence | Manifest version is 0.2.4 | Test metadata update blocked |

## Checkpoints

| Time | Completed | Current | Changed files | Validation | Next action |
| --- | --- | --- | --- | --- | --- |
| 2026-05-10 | TC-024A, TC-024B | TC-024C | docs/agent/task-batches/active/stremio-runtime-v024.md | node --check passed locally for candidate runtime | Stop: GitHub connector blocked runtime source write twice |
| 2026-05-10 | TC-024A, TC-024B, TC-024C, partial TC-024D | TC-024D | src/main-0.2.3.js, package.json, docs/agent/task-batches/active/stremio-runtime-v024.md | fetched runtime and manifest from GitHub | Stop: tests/manifest.test.js update blocked by connector |

## Decisions

- Prefer a passive debug build over another aggressive spatial-navigation build because the TV shows 0.2.3 receiving keys while focus remains unusable.
- Replace the existing `src/main-0.2.3.js` file in the isolated `stremio-webapp-v024` branch because creating a new runtime file was blocked.
- Keep manifest `main` as `src/main-0.2.3.js` while publishing version `0.2.4`.

## Risks

- `tests/manifest.test.js` remains stale and will fail until updated to expect version `0.2.4` and main `src/main-0.2.3.js`.
- The observed video unsupported state may be a stream/codec issue independent of remote navigation.
- This build intentionally disables spatial navigation fixes so native Stremio input behavior can be isolated.

## Resume instructions

Resume TC-024D by updating `tests/manifest.test.js` to expect manifest version `0.2.4` and main `src/main-0.2.3.js`. Then run:

- `node tests/manifest.test.js`
- `node tests/syntax.test.js`

## Next-Action Invariant

- Stop: stop condition is `GitHub connector blocked tests/manifest.test.js update`.

## Final validation plan

- `node tests/manifest.test.js`
- `node tests/syntax.test.js`

## Completion report

Branch is ready for TV testing as `Alazen/Samsung-Tizen-TV-Public@stremio-webapp-v024`. Repository validation is partial because test metadata could not be updated through the connector.
