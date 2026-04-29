const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const mainScriptPath = path.join(rootDir, "src", "main.js");
const stylesPath = path.join(rootDir, "src", "styles.css");

test("src/main.js is valid JavaScript syntax", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  assert.doesNotThrow(() => {
    new vm.Script(code, { filename: mainScriptPath });
  });
});

test("src/main.js bootstraps with inline styles and TV input device helpers", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const registeredKeys = [];
  const styles = [];
  const context = {
    tizen: {
      tvinputdevice: {
        registerKey(keyName) {
          registeredKeys.push(keyName);
        }
      }
    },
    document: {
      head: {
        appendChild(node) {
          styles.push(node);
        }
      },
      querySelector() {
        return null;
      },
      createElement(tagName) {
        return {
          tagName,
          dataset: {},
          appendChild(child) {
            this.textContent = child;
          }
        };
      },
      createTextNode(text) {
        return text;
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(code, context, { filename: mainScriptPath });

  assert.equal(styles.length, 1);
  assert.equal(styles[0].tagName, "style");
  assert.equal(styles[0].dataset.stremioRemoteStyle, "1");
  assert.ok(registeredKeys.includes("MediaPlayPause"));
  assert.equal(registeredKeys.includes("Back"), false);

  const api = context.__STREMIO_TIZENBREW_REMOTE__;
  assert.equal(api.initialized, true);
  assert.deepEqual(Array.from(api.registerOptionalKeys(["Back", "Info"])), ["Info"]);
});

test("src/styles.css exists and is non-empty", () => {
  const css = fs.readFileSync(stylesPath, "utf8");
  assert.ok(css.trim().length > 0);
});
