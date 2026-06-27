# TizenBrew Stremio remote harness

This harness area is reserved for test fixtures, emulator notes, and local TV-debug scripts for the Stremio Web remote-control layer.

It intentionally does not duplicate the runtime source. The root `package.json` `main` path is the source of truth and tests read that path directly.

Do not commit generated packages, logs, debug ports, local machine names, signing profiles, or exact emulator IDs.
