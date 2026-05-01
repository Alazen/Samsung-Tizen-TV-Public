# Emulator Validation

Use Samsung TV emulator checks for local runtime/tooling confidence.

## Procedure
1. Launch `T-samsung-10.0-x86_64` emulator.
2. Confirm connectivity with `sdb devices`.
3. Run the repo-tracked `CodexTvRuntimeCheck` app via Samsung TV launch path.
4. Validate Web Inspector attachment and console output.
5. Capture debug-harness outcome in Task 3 records and keep `Debug/` and `.wgt` outputs uncommitted.

## Limitations
Emulator outcomes do not replace real-device acceptance for TizenBrew injection and physical remote behavior.
