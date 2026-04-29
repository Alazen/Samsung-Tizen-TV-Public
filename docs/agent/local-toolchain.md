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
- Existing terminals may not see the PATH update. For the current PowerShell session, prepend:

```powershell
$env:Path = "E:\tizen-studio\tools;$env:Path"
```

- Validation: `sdb version` returned `Smart Development Bridge version 4.2.25`.

## Tizen CLI log permissions

- Observed error: Tizen CLI emitted `FileNotFoundException: E:\tizen-studio-data\cli\logs\cli.log (Acesso negado)`.
- Data path observed: `E:\tizen-studio-data\cli\logs\cli.log`.
- Important local detail: Codex sandbox commands can run as `GABI-PC\CodexSandboxOnline`, while the real desktop/user context is `GABI-PC\gabip`. Permission tests in the sandbox may not match the real Tizen CLI runtime context.
- Repair used in the real user context: rotate/recreate `cli.log` and ensure the directory/file inherit writable ACLs for the user context.
- Validation in real user context: `E:\tizen-studio\tools\ide\bin\tizen.bat version` returned `Tizen CLI 2.5.25` without the log access-denied stack trace.

When this error reappears, verify the command under the same Windows identity that owns the Tizen Studio data path before changing repository files.
