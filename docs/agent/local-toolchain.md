# Local Toolchain Notes

Purpose: capture local Windows toolchain fixes that affect validation, packaging, and Tizen device work.

## Public documentation privacy note

This public file documents reproducible troubleshooting patterns, not exact local machine fingerprints. Use `<repo-root>`, `<tizen-studio-root>`, `<node-root>`, `<tizen-studio-data-root>`, `<windows-identity>`, `<emulator-id>`, `<emulator-profile>`, `<signing-profile>`, and `<device-identifier>` in place of local paths, usernames, profile names, and IDs. Keep raw logs and signing material outside the repository.

## Windows npm wrapper can prefer a broken user-global npm

- Observed: `npm --version` failed because the wrapper looked for a user-global npm CLI that was stale or inaccessible.
- Cause: Node was installed under `<node-root>`; its npm wrappers can prefer the user prefix returned by `npm-prefix.js`.
- Diagnostic commands:
  - `where.exe npm`
  - `Get-Command npm,npm.cmd,node -ErrorAction SilentlyContinue`
  - `& '<node-root>\node.exe' '<node-root>\node_modules\npm\bin\npm-cli.js' --version`
  - `& '<node-root>\node.exe' '<node-root>\node_modules\npm\bin\npm-prefix.js'`
- Repair used: move the stale user npm package aside so the wrappers fall back to the bundled npm under the Node installation.
- Validation: `npm --version` returned a working npm version.

If npm is broken but the bundled CLI works, use direct Node validation commands from `docs/agent/validation.md` until npm is repaired.

## Tizen Studio CLI and sdb path

- Installed Tizen Studio path placeholder: `<tizen-studio-root>`.
- Tizen CLI path placeholder: `<tizen-studio-root>\tools\ide\bin\tizen.bat`.
- SDB path placeholder: `<tizen-studio-root>\tools\sdb.exe`.
- Issue: `tizen` was on PATH through the IDE bin folder, but `sdb` was not because the tools folder was missing.
- Persistent user PATH repair used: add `<tizen-studio-root>\tools` to the real user PATH.
- Additional user PATH entries: tools, IDE bin, and emulator bin under `<tizen-studio-root>`.
- Current PowerShell session repair:

```powershell
$env:Path = "<tizen-studio-root>\tools;$env:Path"
```

- Validation: `sdb version` returned a Smart Development Bridge version.
- Explicit path validation worked: `<tizen-studio-root>\tools\emulator\bin\em-cli.bat list-vm` returned `<emulator-profile>`.

## Tizen TV emulator setup notes

- Emulator Manager has a TV emulator instance:
  - Name: `<emulator-profile>`
  - Profile: `tv`
  - Platform: `<tv-platform>`
  - Template: `HD1080 TV`
  - Resolution: `HD1080(1920x1080)`
  - Network: `NAT`
  - CPU VT: `ON`
  - GPU: `ON`
- If a launched emulator is visible but missing from `sdb devices`, reboot the emulated TV once before changing repo files or reinstalling tools.
- Validation after reboot: `<tizen-studio-root>\tools\sdb.exe devices` listed `<emulator-id> device <emulator-profile>`.
- Capability checks reported TV profile details including `profile_name:tv`, `vendor_name:Samsung`, `platform_version:10.0`, `cpu_arch:x86_64`, `can_launch:tv-samsung`, and `pkgcmd_debugmode:enabled`.
- Project target reminder: final compatibility must be validated on a real Samsung TV on Tizen 8.0. The local Samsung TV emulator is for local runtime/toolchain debugging only.
- Installed SDK platforms include `<tizen-studio-root>\platforms\tizen-8.0`.
- Sandbox command contexts can hit access-denied errors for local Tizen Studio data locks. Use Tizen Studio Emulator Manager in the desktop user context to confirm or create emulator VMs.
- Outside the sandbox, `tizen security-profiles list` loaded the Tizen Studio data profile file and showed active profile `<signing-profile>`.
- Tizen Studio Package Manager needed TV web app development and TV web app tools extensions for project creation.
- `Run As > Tizen Web Application (Samsung TV)` launched `CodexTvRuntimeCheck` successfully on the emulator. The generic run profile failed and should not be used for the Samsung TV emulator.
- Certificate Manager workflow: update Certificate Manager, sign in, create a Samsung certificate profile, add the connected emulator DUID, set active profile `<signing-profile>`, and retry permit-to-install. Store certificate material outside the repo.
- DevTools/Web Inspector validation confirmed the debug bridge when a manual console log appeared in DevTools.
- `<tizen-studio-root>\tools\tizen-core\tz.exe run --help` advertises `-d, --debug-mode` for Web Inspector.

## Task 3 emulator debug harness recipe

- Primary harness decision: use the repo-tracked Samsung TV Basic Project `CodexTvRuntimeCheck` as the default emulator debug harness.
- Preferred repeatable debug command: `<tizen-studio-root>\tools\tizen-core\tz.exe run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck`.
- Required `-w` value: absolute path to the checked-in `CodexTvRuntimeCheck` project root in the local checkout, represented as `<repo-root>\harness\CodexTvRuntimeCheck` in public docs.
- Generated outputs such as `Debug/` folders and packaged apps remain non-source artifacts and must stay uncommitted.
- Harness scope is intentionally minimal and debug-only: enough DOM/runtime surface to verify keydown events, style injection behavior, and Tizen API availability.

## Task 3B debug run evidence

- On 2026-05-01, the preferred debug command launched the harness and exposed a page target through Web Inspector.
- Command shape: `<tizen-studio-root>\tools\tizen-core\tz.exe run -d -e <emulator-id> -w <repo-root>\harness\CodexTvRuntimeCheck`.
- Debug attachment shape: `ws://127.0.0.1:<debug-port>/devtools/page/<target-id>`.
- Initial snapshot: `window.tizen=true`, `tizen.tvinputdevice=true`, `tizen.application=true`, `styleTagPresent=true`.
- Root cause: dialog-close failure came from a real source bug where ids such as `open-dialog` and `close-dialog` were being treated as dialog containers.
- Refresh blocker: after the source fix landed, the live debug target still served a stale `js/stremio-remote.js` copy that did not include `isInteractiveControl`.
- Build evidence: `tz build -w <repo-root>\harness\CodexTvRuntimeCheck -b Debug` refreshed ignored build output and contained `isInteractiveControl`.
- Fresh install blocker: `tz pack -w <repo-root>\harness\CodexTvRuntimeCheck -t wgt` failed with a local signing/decryption error while generating the author signature.

## Task 3B final unblock attempt evidence

- Context: date `2026-05-01`, identity `<windows-identity>`, project `<repo-root>\harness\CodexTvRuntimeCheck`.
- `<tizen-studio-root>\tools\sdb.exe devices` showed `<emulator-id> device <emulator-profile>`.
- `tz build` succeeded and generated copies matched repo SHA-256 `157a26938024e8ab6c6d7aa476000960f0c37efb16cb0600226b467c553c617b`.
- `tz run -d` timed out twice in the same context, so the stop condition applied.
- No new debug session attached and no live served-source parity check was possible.

## Tizen CLI log permissions

- Observed error: Tizen CLI emitted access-denied output while writing to local Tizen Studio data logs.
- Data path placeholder: `<tizen-studio-data-root>\cli\logs\cli.log`.
- Codex sandbox commands can run as `<windows-identity>`, while the real desktop user context may be different. Permission tests in the sandbox may not match the real Tizen CLI runtime context.
- Repair used in the real user context: rotate/recreate the CLI log and ensure writable ACLs for the user context.
- When this error reappears, verify the command under the same Windows identity that owns the Tizen Studio data path before changing repository files.

## Bypassing Session 0 Isolation for GUI Windows

- Issue: When the editor server or agent daemon runs in Windows Session 0 (as a background service), GUI applications (like the Tizen Emulator or Chrome DevTools browser tabs launched via `Start-Process` or CLI commands) run invisibly in the background.
- Workaround: Use the Windows Task Scheduler from the shell to run the GUI commands in the interactive user session (Session 1+).
- Script pattern to launch a visible Emulator:
  ```powershell
  $action = New-ScheduledTaskAction -Execute "E:\tizen-studio\tools\emulator\bin\em-cli.bat" -Argument "launch -n T-samsung-10.0-x86_64"
  $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
  Register-ScheduledTask -TaskName "LaunchTizenEmulator" -Action $action -Principal $principal
  Start-ScheduledTask -TaskName "LaunchTizenEmulator"
  ```
  *(Note: Keep the task registered until done with the emulator to prevent Windows from killing the child process, then unregister it when finished).*
- Script pattern to launch a visible DevTools browser window:
  ```powershell
  $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c start http://localhost:<port>/devtools/inspector.html?ws=localhost:<port>/devtools/page/<id>"
  $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
  Register-ScheduledTask -TaskName "LaunchTizenDevTools" -Action $action -Principal $principal
  Start-ScheduledTask -TaskName "LaunchTizenDevTools"
  Start-Sleep -Seconds 3
  Unregister-ScheduledTask -TaskName "LaunchTizenDevTools" -Confirm:$false
  ```

## TV Remote keydown Latency and DOM Query Caching

- Issue: Arrow keypresses on the TV remote had a 3-second latency before the UI updated.
- Cause: The `NavigationAdapter` was scanning the entire iframe DOM and performing up to 1300+ synchronous layout-triggering queries (`getBoundingClientRect` and `innerText`) per keydown event, causing severe layout thrashing/reflow.
- Solution:
  - Initialize short-lived ES6 `WeakMaps` for Rects, text, and element classifiers at the start of `handleKeyDown`.
  - Clean up and nullify all WeakMap references inside a `finally` block at the end of `handleKeyDown`.
  - Wrap DOM queries in `getRect(el)` and `getText(el)`.
  - Wrap `NavigationAdapter` classifier methods to check the WeakMap caches first.
- Mock DOM Testing Rule:
  - Unit tests run in a mock DOM environment where elements are plain JavaScript objects.
  - To prevent `TypeError: Illegal invocation` when calling `HTMLElement.prototype.getBoundingClientRect.call(el)` on plain objects, the `getRect(el)` wrapper dynamically resolves `el.getBoundingClientRect || el["getBoundingClientRect"]` and invokes it safely with `.call(el)`.
