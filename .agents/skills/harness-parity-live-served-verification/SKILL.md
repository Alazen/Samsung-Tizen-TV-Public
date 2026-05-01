---
name: harness-parity-live-served-verification
description: Use when emulator or TV debug evidence depends on the repo-tracked Tizen harness, especially after source changes, tz run, tz build, tz pack, install, Debug output, or stale served JavaScript concerns. Verifies that repo source, ignored Debug output, and the live served JS match before accepting runtime evidence. Do not use for generic frontend work, product planning, or fresh feature implementation.
---

# harness-parity-live-served-verification

## Purpose

Prevent false emulator or TV validation caused by stale deployed harness files.

Do not treat `tz run` as proof of a fresh deploy unless the live app is proven to serve the same JavaScript content as the repo-tracked harness source.

This skill exists because Task 3 was blocked after the source bug was fixed but the running debug target still served a stale `js/stremio-remote.js` copy. The repo source and ignored `Debug/` output contained the fix, but `fetch('js/stremio-remote.js')` inside the running app did not.

## Use only when

- A TaskCard asks for emulator, TV, Tizen Studio, Web Inspector, or runtime harness validation.
- Evidence depends on `harness/CodexTvRuntimeCheck`.
- A source change should be visible inside the running harness app.
- `tz run`, `tz build`, `tz pack`, `tz install`, or Web Inspector evidence is being used to prove behavior.
- A previous run may have used stale deployed files.
- The task mentions fresh install, debug refresh, served JS, `Debug/`, `.wgt`, stale app copy, or parity.

## Do not use when

- The task is only product planning, architecture discussion, or docs cleanup.
- The task does not use the Tizen harness or runtime evidence.
- The task can be validated fully by unit tests, syntax checks, or manifest checks.
- The task requires signing secrets, certificate passwords, Samsung account details, or private credentials.
- The task requires committing generated `Debug/`, `.wgt`, logs, caches, or signing material.

## Required inputs

- TaskCard path.
- Harness project path, normally `harness/CodexTvRuntimeCheck`.
- Source JavaScript path being validated, normally `harness/CodexTvRuntimeCheck/js/stremio-remote.js`.
- Live app URL or Web Inspector/CDP target that can execute `fetch('js/stremio-remote.js')`.
- The exact source marker that proves freshness, for example a function name, guard name, version string, or unique code snippet introduced by the change.
- Validation commands required by the TaskCard or `docs/agent/validation.md`.

## Allowed files

Read:

- `AGENTS.md`
- `docs/agent/validation.md`
- `docs/validation/emulator-validation.md`
- `docs/agent/local-toolchain.md`
- The active TaskCard
- `harness/CodexTvRuntimeCheck/config.xml`
- `harness/CodexTvRuntimeCheck/js/stremio-remote.js`
- `.gitignore`

Edit only when the TaskCard allows it:

- Active TaskCard notes
- `docs/validation/emulator-validation.md`
- `docs/agent/local-toolchain.md`
- `docs/agent/known-risks.md`
- `docs/agent/decision-log.md`

Never edit or commit:

- `harness/**/Debug/`
- `*.wgt`
- `*.zip`
- `*.log`
- `.sign/`
- `.package/`
- signing material
- secrets
- vendored docs

## Required checks

### 1. Confirm source marker in repo source

Run from the repo root:

```bash
node -e "const fs=require('fs'); const p='harness/CodexTvRuntimeCheck/js/stremio-remote.js'; const marker=process.argv[1]; const s=fs.readFileSync(p,'utf8'); if(!s.includes(marker)){console.error('missing marker in repo source:', marker); process.exit(1)} console.log('repo source marker present:', marker)"
```

Pass the marker as the first argument.

Example:

```bash
node -e "const fs=require('fs'); const p='harness/CodexTvRuntimeCheck/js/stremio-remote.js'; const marker=process.argv[1]; const s=fs.readFileSync(p,'utf8'); if(!s.includes(marker)){console.error('missing marker in repo source:', marker); process.exit(1)} console.log('repo source marker present:', marker)" "isInteractiveControl"
```

### 2. Check ignored Debug output status

Run:

```bash
git status --short --ignored harness/CodexTvRuntimeCheck
```

Required interpretation:

- `harness/CodexTvRuntimeCheck/Debug/` may exist only as ignored build output.
- No `Debug/`, `.wgt`, `.zip`, `.log`, `.sign/`, or signing artifacts may be staged.
- If generated artifacts are staged, stop and report the violation.

Optional marker check if `Debug/` exists:

```bash
node -e "const fs=require('fs'); const p='harness/CodexTvRuntimeCheck/Debug/js/stremio-remote.js'; const marker=process.argv[1]; if(!fs.existsSync(p)){console.log('Debug copy not present; build refresh may be needed'); process.exit(0)} const s=fs.readFileSync(p,'utf8'); if(!s.includes(marker)){console.error('missing marker in ignored Debug copy:', marker); process.exit(1)} console.log('ignored Debug marker present:', marker)"
```

Example:

```bash
node -e "const fs=require('fs'); const p='harness/CodexTvRuntimeCheck/Debug/js/stremio-remote.js'; const marker=process.argv[1]; if(!fs.existsSync(p)){console.log('Debug copy not present; build refresh may be needed'); process.exit(0)} const s=fs.readFileSync(p,'utf8'); if(!s.includes(marker)){console.error('missing marker in ignored Debug copy:', marker); process.exit(1)} console.log('ignored Debug marker present:', marker)" "isInteractiveControl"
```

### 3. Refresh build output only when TaskCard permits

Use the documented local Tizen Studio path when available:

```powershell
E:\tizen-studio\tools\tizen-core\tz.exe build -w <absolute-harness-path> -b Debug
```

After build, repeat the ignored Debug marker check and ignored artifact status check.

Do not stage generated output.

### 4. Install or run only when allowed

Use the documented debug command only if the TaskCard permits emulator execution:

```powershell
E:\tizen-studio\tools\tizen-core\tz.exe run -d -e emulator-26101 -w <absolute-harness-path>
```

If a fresh install is required and `tz pack` or signing fails because signing material is unavailable, stop. Do not request, print, or invent signing secrets.

Record the exact command and failure.

### 5. Verify live served JavaScript

Inside the running app, use Web Inspector or CDP to execute:

```javascript
fetch('js/stremio-remote.js')
  .then((r) => r.text())
  .then((text) => ({
    length: text.length,
    hasMarker: text.includes('<SOURCE_MARKER>'),
    markerIndex: text.indexOf('<SOURCE_MARKER>'),
  }))
```

Replace `<SOURCE_MARKER>` with the freshness marker.

Required result:

- `hasMarker` must be `true`.
- `markerIndex` must be `>= 0`.
- The result must be recorded in the TaskCard or validation doc.

If `hasMarker` is false, runtime evidence is stale. Do not accept emulator behavior as proof of the current repo source.

### 6. Optional parity hash check

When possible, compare repo source and live served content by hash.

Repo-side hash:

```bash
node -e "const fs=require('fs'), crypto=require('crypto'); const p='harness/CodexTvRuntimeCheck/js/stremio-remote.js'; const s=fs.readFileSync(p,'utf8'); console.log(crypto.createHash('sha256').update(s).digest('hex'))"
```

Live-side hash in Web Inspector, if `crypto.subtle` is available:

```javascript
fetch('js/stremio-remote.js')
  .then((r) => r.text())
  .then(async (text) => {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  })
```

If hashes differ but the marker is present, record the mismatch and inspect whether the difference is expected build output transformation.

## Acceptance criteria

The debug or emulator evidence is acceptable only when all are true:

- Repo source contains the expected freshness marker.
- Ignored `Debug/` output is either absent or contains the expected marker after build refresh.
- `git status --short --ignored harness/CodexTvRuntimeCheck` confirms generated harness output is ignored and not staged.
- The running app’s `fetch('js/stremio-remote.js')` result contains the same freshness marker.
- Any `tz pack`, signing, install, or run failure is documented without exposing secrets.
- Validation commands from `docs/agent/validation.md` or the TaskCard were run.
- Remaining real-device limitations are recorded.

## Stop conditions

Stop and report a structured blocker if:

- Live served JS does not contain the source marker.
- `tz pack` fails because signing material is unavailable or non-interactive signing cannot proceed.
- A fresh install path cannot be proven.
- Generated `Debug/`, `.wgt`, `.zip`, `.log`, `.sign/`, or signing files are staged.
- The task would require committing generated output.
- The task would require secrets, certificate passwords, Samsung account details, or private credentials.
- The same command fails twice for the same reason.

## Final response format

- TaskCard:
- Harness path:
- Source marker:
- Commands run:
- Repo source marker result:
- Ignored Debug output result:
- Live served JS result:
- Generated artifact status:
- Validation results:
- Acceptance status:
- Blockers:
- Remaining risks:
