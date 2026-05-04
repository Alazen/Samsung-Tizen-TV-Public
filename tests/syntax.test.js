const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "src", "main.js");
const harnessPath = path.join(rootDir, "harness", "CodexTvRuntimeCheck", "js", "stremio-remote.js");
const packagePath = path.join(rootDir, "package.json");
const source = fs.readFileSync(sourcePath, "utf8");
const harnessSource = fs.readFileSync(harnessPath, "utf8");
const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8"));

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

test("runtime source is valid JavaScript", () => {
  assert.doesNotThrow(() => new Function(source));
});

test("runtime preserves public source and injection markers", () => {
  assert.match(source, /stremio-webapp-src-main-js-task4e-v1/);
  assert.match(source, /stremio-webapp-runtime-injection-v1/);
  assert.match(source, /__STREMIO_TIZENBREW_REMOTE__/);
});

test("runtime version matches package version for TizenBrew refresh checks", () => {
  assert.match(source, new RegExp(`RUNTIME_VERSION = "${manifest.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
});

test("runtime listens on real-TV fallback event paths", () => {
  assert.match(source, /keydown/);
  assert.match(source, /keyup/);
  assert.match(source, /keypress/);
  assert.match(source, /tizenhwkey/);
  assert.match(source, /addListener\(documentObject, "tizenhwkey"/);
  assert.match(source, /addListener\(globalScope, "tizenhwkey"/);
});

test("runtime maps common Samsung keyCode values", () => {
  for (const expected of [
    "10009: \"Back\"",
    "10252: \"MediaPlayPause\"",
    "457: \"Info\"",
    "403: \"ColorF0Red\"",
    "404: \"ColorF1Green\"",
    "405: \"ColorF2Yellow\"",
    "406: \"ColorF3Blue\"",
    "415: \"MediaPlay\"",
    "19: \"MediaPause\"",
    "417: \"MediaFastForward\"",
    "412: \"MediaRewind\""
  ]) {
    assert.ok(source.includes(expected), `missing key mapping ${expected}`);
  }
});

test("diagnostics can be opened by Info and color keys", () => {
  assert.match(source, /var diagnosticsKeys = \{/);
  for (const expected of ["Info", "ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue"]) {
    assert.ok(source.includes(`${expected}: true`), `missing diagnostics key ${expected}`);
  }
  assert.match(source, /toggleDiagnostics/);
  assert.match(source, /openDiagnostics/);
  assert.match(source, /DIAGNOSTICS_REPEAT_WINDOW_MS/);
  assert.match(source, /showBootBadge/);
});

test("runtime has direct video control fallbacks", () => {
  assert.match(source, /function getPrimaryVideo/);
  assert.match(source, /function controlVideo/);
  assert.match(source, /video\.play\(\)/);
  assert.match(source, /video\.pause\(\)/);
  assert.match(source, /video\.currentTime/);
  assert.match(source, /SEEK_STEP_SECONDS/);
  assert.match(source, /fallbackClickPlayerControl/);
});

test("runtime has player/back fallback logic", () => {
  assert.match(source, /function handleBack/);
  assert.match(source, /tizenhwkey/);
  assert.match(source, /history\.back/);
  assert.match(source, /dispatchEscapeFallback/);
  assert.match(source, /clicked-player-back-control/);
});

test("runtime keeps editable-input safety", () => {
  assert.match(source, /function isEditableTarget/);
  assert.match(source, /!raw\.editable/);
  assert.match(source, /blurred-editable/);
});

test("runtime has a Stremio-specific selector contract", () => {
  assert.match(source, /var stremioSelectorGroups = \{/);
  for (const groupName of [
    "authControls",
    "homeNavigation",
    "contentCards",
    "detailsActions",
    "streamRows",
    "playerContainers",
    "playerControls",
    "playerBackControls",
    "playerMenuControls",
    "menuControls",
    "focusGuards",
    "excludedControls"
  ]) {
    assert.match(source, new RegExp(groupName));
  }
  assert.match(source, /selectorSource/);
  assert.match(source, /isStremioSpecific/);
  assert.match(source, /isPlayerControl/);
  assert.match(source, /isAuthControl/);
  assert.match(source, /isFocusGuard/);
});

test("auth and login controls are included as focus candidates", () => {
  assert.match(source, /input/);
  assert.match(source, /label/);
  assert.match(source, /login/);
  assert.match(source, /signup/);
  assert.match(source, /auth/);
});

test("harness runtime copy matches src main for parity", () => {
  assert.equal(sha256(harnessSource), sha256(source));
});
