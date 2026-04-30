const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const mainScriptPath = path.join(rootDir, "src", "main.js");
const stylesPath = path.join(rootDir, "src", "styles.css");
const NAMESPACE = "__STREMIO_TIZENBREW_REMOTE__";

function toDataKey(attributeName) {
  return attributeName.replace(/^data-/, "").replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

function createMockElement(tagName) {
  return {
    tagName: String(tagName).toUpperCase(),
    dataset: {},
    attributes: {},
    children: [],
    textContent: "",
    parentNode: null,
    isContentEditable: false,
    contentEditable: "inherit",
    appendChild(child) {
      if (typeof child === "string") {
        this.textContent += child;
        return child;
      }

      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      const stringValue = String(value);
      this.attributes[name] = stringValue;
      if (name.startsWith("data-")) {
        this.dataset[toDataKey(name)] = stringValue;
      }
    },
    getAttribute(name) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, name)) {
        return this.attributes[name];
      }
      if (name.startsWith("data-")) {
        const dataValue = this.dataset[toDataKey(name)];
        return typeof dataValue === "undefined" ? null : dataValue;
      }
      return null;
    },
    querySelector(selector) {
      return findInTree(this.children, selector);
    }
  };
}

function matchesSelector(node, selector) {
  if (!node || typeof selector !== "string") {
    return false;
  }

  if (selector === "style[data-stremio-remote-style='1']") {
    return node.tagName === "STYLE" && node.dataset.stremioRemoteStyle === "1";
  }

  if (selector === "[data-stremio-remote-diagnostics-panel='1']") {
    return node.dataset.stremioRemoteDiagnosticsPanel === "1";
  }

  if (selector === "[data-stremio-remote-diagnostics-body='1']") {
    return node.dataset.stremioRemoteDiagnosticsBody === "1";
  }

  return false;
}

function findInTree(nodes, selector) {
  for (const node of nodes) {
    if (matchesSelector(node, selector)) {
      return node;
    }

    const nestedMatch = findInTree(node.children || [], selector);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function createMockDocument() {
  const listeners = new Map();
  const document = {
    readyState: "complete",
    head: createMockElement("head"),
    body: createMockElement("body"),
    activeElement: null,
    createElement(tagName) {
      return createMockElement(tagName);
    },
    createTextNode(text) {
      return String(text);
    },
    querySelector(selector) {
      return findInTree([this.head, this.body], selector);
    },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    removeEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      listeners.set(type, handlers.filter((candidate) => candidate !== handler));
    },
    dispatch(type, event) {
      const handlers = listeners.get(type) || [];
      for (const handler of handlers) {
        handler(event);
      }
    },
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    }
  };

  return document;
}

function createKeyEvent(key, options = {}) {
  return {
    key,
    code: options.code || "",
    keyCode: options.keyCode ?? null,
    target: options.target || null,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    }
  };
}

test("src/main.js is valid JavaScript syntax", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  assert.doesNotThrow(() => {
    new vm.Script(code, { filename: mainScriptPath });
  });
});

test("src/main.js bootstraps with runtime state, diagnostics, and TV input helpers", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const registeredKeys = [];
  const document = createMockDocument();
  const context = {
    Date,
    tizen: {
      tvinputdevice: {
        registerKey(keyName) {
          if (keyName === "ColorF0Red") {
            throw new Error("unsupported");
          }
          registeredKeys.push(keyName);
        }
      }
    },
    MutationObserver: function MutationObserver() {},
    requestAnimationFrame() {},
    location: {
      pathname: "/unit-test"
    },
    document
  };

  vm.createContext(context);
  vm.runInContext(code, context, { filename: mainScriptPath });

  assert.equal(document.head.children.length, 1);
  assert.equal(document.head.children[0].tagName, "STYLE");
  assert.equal(document.head.children[0].dataset.stremioRemoteStyle, "1");
  assert.equal(document.listenerCount("keydown"), 1);
  assert.ok(registeredKeys.includes("MediaPlayPause"));
  assert.equal(registeredKeys.includes("Back"), false);
  assert.equal(document.querySelector("[data-stremio-remote-diagnostics-panel='1']").dataset.open, "false");

  const api = context[NAMESPACE];
  assert.equal(api.initialized, true);
  assert.equal(typeof api.getState, "function");
  assert.equal(typeof api.renderDiagnostics, "function");

  const state = api.getState();
  assert.equal(state.initialized, true);
  assert.equal(typeof state.initTime, "number");
  assert.ok(state.registeredKeys.includes("Info"));
  assert.ok(state.failedKeys.some((entry) => entry.keyName === "ColorF0Red"));
  assert.equal(state.apiAvailability.document, true);
  assert.equal(state.apiAvailability.tvInputDevice, true);
  assert.equal(state.apiAvailability.application, false);
  assert.equal(state.diagnosticsOpen, false);

  const snapshot = api.getState();
  snapshot.registeredKeys.length = 0;
  assert.ok(api.getState().registeredKeys.length > 0);

  assert.deepEqual(Array.from(api.registerOptionalKeys(["Back", "Info", "ColorF0Red"])), ["Info"]);
  assert.ok(api.getState().failedKeys.some((entry) => entry.keyName === "ColorF0Red"));
});

test("src/main.js bootstrap is idempotent and keeps one listener, one style, and one diagnostics panel", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const document = createMockDocument();
  const context = {
    Date,
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    },
    location: {
      pathname: "/idempotent"
    },
    document
  };

  vm.createContext(context);
  vm.runInContext(code, context, { filename: mainScriptPath });
  const firstInitTime = context[NAMESPACE].getState().initTime;
  vm.runInContext(code, context, { filename: mainScriptPath });

  assert.equal(document.head.children.length, 1);
  assert.equal(document.listenerCount("keydown"), 1);
  assert.equal(document.body.children.length, 1);
  assert.equal(context[NAMESPACE].getState().initTime, firstInitTime);
});

test("src/main.js tolerates missing document and tizen objects", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const context = {
    Date
  };

  vm.createContext(context);
  assert.doesNotThrow(() => {
    vm.runInContext(code, context, { filename: mainScriptPath });
  });

  const state = context[NAMESPACE].getState();
  assert.equal(state.initialized, true);
  assert.equal(state.apiAvailability.document, false);
  assert.equal(state.apiAvailability.tizen, false);
  assert.deepEqual(Array.from(state.registeredKeys), []);
  assert.deepEqual(Array.from(state.failedKeys), []);
});

test("src/main.js toggles diagnostics through key events and closes on Back while open", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const document = createMockDocument();
  const context = {
    Date,
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    },
    location: {
      pathname: "/diagnostics"
    },
    document
  };

  vm.createContext(context);
  vm.runInContext(code, context, { filename: mainScriptPath });

  const openEvent = createKeyEvent("Info", { code: "Info" });
  document.dispatch("keydown", openEvent);

  assert.equal(openEvent.defaultPrevented, true);
  assert.equal(context[NAMESPACE].getState().diagnosticsOpen, true);
  assert.equal(context[NAMESPACE].getState().lastConsumedAction, "diagnostics:open");

  const panel = document.querySelector("[data-stremio-remote-diagnostics-panel='1']");
  const panelBody = panel.querySelector("[data-stremio-remote-diagnostics-body='1']");
  assert.equal(panel.dataset.open, "true");
  assert.match(panelBody.textContent, /Stremio Web TV Remote Diagnostics/);
  assert.match(panelBody.textContent, /Path: \/diagnostics/);

  const closeEvent = createKeyEvent("Back", { code: "BrowserBack" });
  document.dispatch("keydown", closeEvent);

  assert.equal(closeEvent.defaultPrevented, true);
  assert.equal(context[NAMESPACE].getState().diagnosticsOpen, false);
  assert.equal(context[NAMESPACE].getState().lastConsumedAction, "diagnostics:close");
  assert.equal(panel.dataset.open, "false");
});

test("src/main.js preserves editable-context passthrough groundwork", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const document = createMockDocument();
  const input = createMockElement("input");
  const context = {
    Date,
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    },
    document
  };

  vm.createContext(context);
  vm.runInContext(code, context, { filename: mainScriptPath });

  const arrowEvent = createKeyEvent("ArrowRight", {
    code: "ArrowRight",
    target: input
  });
  document.dispatch("keydown", arrowEvent);

  const state = context[NAMESPACE].getState();
  assert.equal(arrowEvent.defaultPrevented, false);
  assert.equal(state.lastConsumedAction, null);
  assert.equal(state.lastKey.editable, true);
});

test("src/styles.css includes diagnostics panel rules", () => {
  const css = fs.readFileSync(stylesPath, "utf8");
  assert.ok(css.trim().length > 0);
  assert.match(css, /\[data-stremio-remote-diagnostics-panel="1"\]/);
});
