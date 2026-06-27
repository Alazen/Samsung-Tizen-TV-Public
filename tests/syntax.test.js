const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const packagePath = path.join(rootDir, "package.json");
const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const runtimePath = path.join(rootDir, manifest.main);
const source = fs.readFileSync(runtimePath, "utf8");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("runtime source is valid JavaScript", () => {
  assert.doesNotThrow(() => new Function(source));
});

test("runtime version matches package version", () => {
  assert.match(source, new RegExp(`RUNTIME_VERSION = "${escapeRegExp(manifest.version)}"`));
});

test("runtime keeps public namespace and reorg marker", () => {
  assert.match(source, /__STREMIO_TIZENBREW_REMOTE__/);
  assert.match(source, /stremio-webapp-reorg-runtime-v1/);
});

test("runtime maps Samsung TV key codes used by the remote layer", () => {
  for (const expected of [
    "10009: \"Back\"",
    "10252: \"MediaPlayPause\"",
    "457: \"Info\"",
    "49: \"Digit1\"",
    "403: \"ColorF0Red\"",
    "404: \"ColorF1Green\"",
    "405: \"ColorF2Yellow\"",
    "406: \"ColorF3Blue\"",
    "415: \"MediaPlay\"",
    "417: \"MediaFastForward\"",
    "412: \"MediaRewind\""
  ]) {
    assert.ok(source.includes(expected), `missing key mapping ${expected}`);
  }
});

test("runtime includes fast Stremio-specific navigation selectors", () => {
  for (const expected of [
    "vertical-nav-bar",
    "nav-tab-button",
    "meta-item",
    "poster",
    "href*='#/detail'"
  ]) {
    assert.match(source, new RegExp(escapeRegExp(expected)));
  }
  assert.match(source, /CACHE_MS = 180/);
  assert.doesNotMatch(source, /querySelectorAll\("\[tabindex\]"\)/);
});

test("runtime includes playback diagnostics without raw URL logging", () => {
  assert.match(source, /canPlayType/);
  assert.match(source, /MediaSource\.isTypeSupported/);
  assert.match(source, /video\.error/);
  assert.match(source, /redactUrl/);
});
