const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const samplesDir = path.join(rootDir, "docs", "validation", "stremio-dom-samples");
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const runtimeSource = fs.readFileSync(path.join(rootDir, manifest.main), "utf8");
const expectedHtmlSamples = [
  "login-signup-overlay.html",
  "login-form.html",
  "details-page-with-streams.html",
  "player-controls-visible.html",
  "player-controls-visible-variant.html",
  "player-controls-menu-open.html",
  "nav-menu-open-home.html",
  "home-after-login-extra.html"
];

function readSample(fileName) {
  return fs.readFileSync(path.join(samplesDir, fileName), "utf8");
}

function allSamplesText() {
  return expectedHtmlSamples.map(readSample).join("\n");
}

test("sanitized Stremio DOM sample files are present", () => {
  assert.ok(fs.existsSync(path.join(samplesDir, "README.md")), "README.md missing");
  assert.ok(fs.existsSync(path.join(samplesDir, "samples-manifest.json")), "samples-manifest.json missing");
  assert.ok(fs.existsSync(path.join(samplesDir, "sanitization-report.json")), "sanitization-report.json missing");
  for (const fileName of expectedHtmlSamples) {
    assert.ok(fs.existsSync(path.join(samplesDir, fileName)), `${fileName} missing`);
  }
});

test("sanitized DOM samples do not contain obvious private values", () => {
  const text = allSamplesText();
  assert.doesNotMatch(text, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, "email found");
  assert.doesNotMatch(text, /Bearer\s+[A-Za-z0-9._-]+/i, "bearer token found");
  assert.doesNotMatch(text, /access[_-]?token\s*[:=]/i, "access token found");
  assert.doesNotMatch(text, /refresh[_-]?token\s*[:=]/i, "refresh token found");
  assert.doesNotMatch(text, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, "jwt found");
  assert.doesNotMatch(text, /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i, "raw uuid found");
  assert.doesNotMatch(text, /https?:\/\/(?!web\.stremio\.com\b)[^\s"'<>]+/i, "raw external URL found");
});

test("selector fixtures contain navigation, detail, stream, and player signals", () => {
  const loginText = readSample("login-form.html") + readSample("login-signup-overlay.html");
  const homeText = readSample("home-after-login-extra.html") + readSample("nav-menu-open-home.html");
  const detailText = readSample("details-page-with-streams.html");
  const playerText = readSample("player-controls-visible.html") + readSample("player-controls-visible-variant.html") + readSample("player-controls-menu-open.html");

  assert.match(loginText, /login|signup|auth|email|password|button-container/i);
  assert.match(homeText, /nav-tab-button|vertical-nav-bar|horizontal-nav-bar|menu-button|meta-item|poster/i);
  assert.match(detailText, /detail|stream|provider|source|season|episode|button-container/i);
  assert.match(playerText, /player|video|control|seek|progress|fullscreen|menu/i);
});

test("runtime selectors stay aligned with sanitized Stremio samples", () => {
  const sourceAndSamples = runtimeSource + "\n" + allSamplesText();
  for (const expected of ["vertical-nav-bar", "nav-tab-button", "meta-item", "poster", "stream", "player", "control", "progress"]) {
    assert.match(sourceAndSamples, new RegExp(expected, "i"), `${expected} missing`);
  }
});
