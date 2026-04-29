# Local Toolchain Notes

Purpose: capture local Windows toolchain fixes that affect validation, packaging, and Tizen device work.

## Windows npm wrapper can prefer a broken user-global npm

- Observed: `npm --version` failed with `Cannot find module 'C:\Users\gabip\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js'`.
- Cause: Node installed under `E:\Program Files\nodejs`; its `npm.ps1`/`npm.cmd` wrappers can prefer the user prefix returned by `npm-prefix.js`. A stale or inaccessible `%APPDATA%\npm\node_modules\npm` can override the bundled working npm.
- Diagnostic commands:
  - `where.exe npm`
  - `Get-Command npm,npm.cmd,node -ErrorAction SilentlyContinue`
  - `& 'E:\Program Files\nodejs\node.exe' 'E:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' --version`
  - `& 'E:\Program Files\nodejs\node.exe' 'E:\Program Files\nodejs\node_modules\npm\bin\npm-prefix.js'`
- Repair used: move the stale `%APPDATA%\npm\node_modules\npm` package aside so the wrappers fall back to the bundled npm under the Node installation.
- Validation: `npm --version` returned `11.12.1`.

If npm is broken but the bundled CLI works, use direct Node validation commands from `docs/agent/validation.md` until npm is repaired.

## Tizen Studio CLI and sdb path

- Installed Tizen Studio path observed: `E:\tizen-studio`.
- Tizen CLI path observed: `E:\tizen-studio\tools\ide\bin\tizen.bat`.
- SDB path observed: `E:\tizen-studio\tools\sdb.exe`.
- Issue: `tizen` was on PATH through `E:\tizen-studio\tools\ide\bin`, but `sdb` was not because `E:\tizen-studio\tools` was missing.
- Persistent user PATH repair used: add `E:\tizen-studio\tools` to the real user PATH.
- Additional user PATH entries added for Tizen CLI and emulator tooling:
  - `E:\tizen-studio\tools`
  - `E:\tizen-studio\tools\ide\bin`
  - `E:\tizen-studio\tools\emulator\bin`
- Existing terminals may not see the PATH update. For the current PowerShell session, prepend:

```powershell
$env:Path = "E:\tizen-studio\tools;$env:Path"
```

- Validation: `sdb version` returned `Smart Development Bridge version 4.2.25`.
- After the additional PATH update, real-user command resolution found:
  - `sdb` at `E:\tizen-studio\tools\sdb.exe`
  - `tizen` at `E:\tizen-studio\tools\ide\bin\tizen.bat`
- Existing Codex/app processes may not pick up the new `E:\tizen-studio\tools\emulator\bin` entry until they are restarted. Explicit path validation still worked: `E:\tizen-studio\tools\emulator\bin\em-cli.bat list-vm` returned `T-samsung-10.0-x86_64`.

## Tizen TV emulator setup notes

- Emulator Manager has a TV emulator instance:
  - Name: `T-samsung-10.0-x86_64`
  - Profile: `tv`
  - Platform: `tv-samsung-10.0-x86_64`
  - Template: `HD1080 TV`
  - Resolution: `HD1080(1920x1080)`
  - Network: `NAT`
  - CPU VT: `ON`
  - GPU: `ON`
- Observed on 2026-04-29: after the emulator first launched, `sdb devices` returned an empty device list even though the emulator UI was visible.
- Repair used: reboot the emulated TV from the emulator UI.
- Validation after reboot:
  - `E:\tizen-studio\tools\sdb.exe version` returned `Smart Development Bridge version 4.2.36`.
  - `E:\tizen-studio\tools\sdb.exe devices` listed `emulator-26101 device T-samsung-10.0-x86_64`.
- `E:\tizen-studio\tools\sdb.exe -s emulator-26101 capability` reported:
  - `profile_name:tv`
  - `vendor_name:Samsung`
  - `platform_version:10.0`
  - `cpu_arch:x86_64`
  - `can_launch:tv-samsung`
  - `pkgcmd_debugmode:enabled`
  - `log_enable:disabled`
- If a launched emulator is visible but missing from `sdb devices`, reboot the emulated TV once before changing repo files or reinstalling tools.
- `E:\tizen-studio\tools\ide\bin\tizen.bat version` still returned `Tizen CLI 2.5.25` in the Codex shell, but also emitted access-denied errors for `E:\tizen-studio-data\cli\logs\cli.log` and `E:\tizen-studio\tools\.tizen-cli-config`; treat this as the known Windows identity/permissions issue below unless it also reproduces in the real desktop user context.
- Rechecked on 2026-04-29: `E:\tizen-studio\tools\sdb.exe devices` still listed `emulator-26101 device T-samsung-10.0-x86_64`.
- `E:\tizen-studio\tools\sdb.exe -s emulator-26101 capability` still reported TV profile details, including `profile_name:tv`, `vendor_name:Samsung`, `platform_version:10.0`, `cpu_arch:x86_64`, `can_launch:tv-samsung`, and `pkgcmd_debugmode:enabled`.
- `E:\tizen-studio\tools\ide\bin\tizen.bat list web-project` ran far enough to list generic templates, but emitted the known Codex-shell access-denied errors for both `E:\tizen-studio-data\cli\logs\cli.log` and `E:\tizen-studio\tools\.tizen-cli-config`.
- A temporary CLI-created `WebBasicApplication` probe produced a generic `<tizen:profile name="tizen"/>` app, not a Samsung TV profile app. Do not use that generic CLI template as Task 2 acceptance evidence.
- Project target reminder: the final module targets a real Samsung TV on Tizen 8.0. The local Tizen 8.0 emulator image is generic `tizen` profile (`HD1080 Tizen`), not Samsung TV. The local Samsung TV emulator option is Tizen 10.0 (`T-samsung-10.0-x86_64`, `tv-samsung-10.0-x86_64`), so use it for local TV runtime/toolchain debugging only.
- Installed SDK platforms include `E:\tizen-studio\platforms\tizen-8.0`.
- `E:\tizen-studio\tools\emulator\bin\em-cli.bat list-vm` from the Codex sandbox hit `AccessDeniedException` for `E:\tizen-studio-data\emulator\vms\.em-gabip.serialize.lock`. Use Tizen Studio Emulator Manager in the desktop user context to confirm or create the Tizen 8.0 TV emulator VM.
- User confirmed in Emulator Manager that the available Tizen 8.0 images are generic `HD1080 Tizen`; the available Samsung TV emulator is `HD1080 TV` on `tv-samsung-10.0-x86_64`.
- Outside the sandbox, `E:\tizen-studio\tools\ide\bin\tizen.bat version` returned `Tizen CLI 2.5.25` without access-denied errors.
- Outside the sandbox, `tizen security-profiles list` loaded `E:\tizen-studio-data\profile\profiles.xml` and showed active profile `MyTVProfile`.
- A disposable Samsung TV web runtime-check app under `.agent-tmp` built successfully with `tizen build-web` and packaged successfully with `tizen package -t wgt -s MyTVProfile`.
- `tizen install -n "Codex TV Runtime Check.wgt" -t emulator-26101` failed with `There is no emulator-26101 target`, even though `sdb devices` listed the emulator.
- `sdb -s emulator-26101 install` pushed the WGT but ended with `closed`; direct pushes to common target paths also reported `You cannot push files to this path`.
- Remaining Task 2 acceptance should be completed in Tizen Studio under the real desktop user context:
  - Create a Samsung TV profile web project with the Basic Project template, or use an existing Samsung TV web project.
  - Run it with `Run As > Tizen Web Application` on `T-samsung-10.0-x86_64`.
  - Open `Window > Show View > Log` and confirm runtime messages appear.
  - Launch with `Debug As > Tizen Web Application`; the JavaScript Log Console and Web Inspector path are expected in debug mode.
  - Record that Tizen 8.0 final compatibility must be validated on the real Samsung TV, not the local generic Tizen 8.0 emulator.

## Tizen CLI log permissions

- Observed error: Tizen CLI emitted `FileNotFoundException: E:\tizen-studio-data\cli\logs\cli.log (Acesso negado)`.
- Data path observed: `E:\tizen-studio-data\cli\logs\cli.log`.
- Important local detail: Codex sandbox commands can run as `GABI-PC\CodexSandboxOnline`, while the real desktop/user context is `GABI-PC\gabip`. Permission tests in the sandbox may not match the real Tizen CLI runtime context.
- Repair used in the real user context: rotate/recreate `cli.log` and ensure the directory/file inherit writable ACLs for the user context.
- Validation in real user context: `E:\tizen-studio\tools\ide\bin\tizen.bat version` returned `Tizen CLI 2.5.25` without the log access-denied stack trace.

When this error reappears, verify the command under the same Windows identity that owns the Tizen Studio data path before changing repository files.
