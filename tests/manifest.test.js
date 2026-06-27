const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const manifestPath = path.join(rootDir, "package.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const REQUIRED_OPTIONAL_KEYS = new Set([
  "MediaPlayPause",
  "MediaPlay",
  "MediaPause",
  "MediaStop",
  "MediaFastForward",
  "MediaRewind",
  "ColorF0Red",
  "ColorF1Green",
  "ColorF2Yellow",
  "ColorF3Blue",
  "Info"
]);

const MANDATORY_TV_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Enter",
  "Back"
]);

const EXPECTED_MAIN = "src/tizenbrew/stremio-remote/main.js";

test("manifest defines the Stremio Web TizenBrew module", () => {
  assert.equal(manifest.packageType, "mods");
  assert.equal(manifest.websiteURL, "https://web.stremio.com/");
  assert.equal(manifest.main, EXPECTED_MAIN);
  assert.equal(manifest.evaluateScriptOnDocumentStart, false);
});

test("manifest version is the v033 reorg baseline", () => {
  assert.equal(manifest.version, "0.3.3");
});

test("manifest points at an existing runtime file", () => {
  assert.ok(fs.existsSync(path.join(rootDir, manifest.main)), manifest.main + " missing");
});

test("manifest keys contain only optional media/color/info keys", () => {
  assert.ok(Array.isArray(manifest.keys), "keys must be an array");
  assert.ok(manifest.keys.length > 0, "keys array must not be empty");

  for (const keyName of manifest.keys) {
    assert.ok(REQUIRED_OPTIONAL_KEYS.has(keyName), "unexpected key in manifest.keys: " + keyName);
    assert.equal(MANDATORY_TV_KEYS.has(keyName), false, "mandatory key should not be registered: " + keyName);
  }
});

test("manifest has zero runtime dependencies and required scripts", () => {
  assert.equal("dependencies" in manifest, false);
  assert.equal("devDependencies" in manifest, false);
  assert.equal(typeof manifest.scripts, "object");
  assert.equal(manifest.scripts["check:manifest"], "node tests/manifest.test.js");
  assert.equal(manifest.scripts["check:syntax"], "node tests/syntax.test.js");
  assert.equal(manifest.scripts["check:dom-samples"], "node tests/stremio-dom-samples.test.js");
  assert.equal(manifest.scripts.test, "node tests/manifest.test.js && node tests/syntax.test.js && node tests/stremio-dom-samples.test.js");
});
