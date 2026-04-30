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

function createMockElement(tagName, options = {}) {
  const rect = options.rect || {};
  const element = {
    tagName: String(tagName).toUpperCase(),
    dataset: {},
    attributes: {},
    children: [],
    textContent: "",
    parentNode: null,
    ownerDocument: null,
    style: {},
    className: typeof options.className === "string" ? options.className : "",
    id: typeof options.id === "string" ? options.id : "",
    isContentEditable: Boolean(options.isContentEditable),
    contentEditable: options.contentEditable || "inherit",
    hidden: Boolean(options.hidden),
    disabled: Boolean(options.disabled),
    tabIndex: typeof options.tabIndex === "number" ? options.tabIndex : -1,
    href: typeof options.href === "string" ? options.href : undefined,
    clickCount: 0,
    appendChild(child) {
      if (typeof child === "string") {
        this.textContent += child;
        return child;
      }

      child.parentNode = this;
      child.ownerDocument = this.ownerDocument;
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      const stringValue = String(value);
      this.attributes[name] = stringValue;
      if (name.startsWith("data-")) {
        this.dataset[toDataKey(name)] = stringValue;
      } else if (name === "hidden") {
        this.hidden = stringValue !== "false";
      } else if (name === "disabled") {
        this.disabled = stringValue !== "false";
      } else if (name === "tabindex") {
        this.tabIndex = Number(stringValue);
      } else if (name === "contenteditable") {
        this.contentEditable = stringValue;
        this.isContentEditable = stringValue === "true";
      } else if (name === "href") {
        this.href = stringValue;
      } else if (name === "class") {
        this.className = stringValue;
      } else if (name === "id") {
        this.id = stringValue;
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
      if (name === "hidden") {
        return this.hidden ? "" : null;
      }
      if (name === "disabled") {
        return this.disabled ? "" : null;
      }
      if (name === "tabindex") {
        return typeof this.tabIndex === "number" ? String(this.tabIndex) : null;
      }
      if (name === "contenteditable") {
        return this.contentEditable;
      }
      if (name === "href") {
        return typeof this.href === "string" ? this.href : null;
      }
      if (name === "class") {
        return this.className || null;
      }
      if (name === "id") {
        return this.id || null;
      }
      return null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
      if (name.startsWith("data-")) {
        delete this.dataset[toDataKey(name)];
      } else if (name === "hidden") {
        this.hidden = false;
      } else if (name === "disabled") {
        this.disabled = false;
      } else if (name === "tabindex") {
        this.tabIndex = -1;
      } else if (name === "contenteditable") {
        this.contentEditable = "inherit";
        this.isContentEditable = false;
      } else if (name === "href") {
        this.href = undefined;
      } else if (name === "class") {
        this.className = "";
      } else if (name === "id") {
        this.id = "";
      }
    },
    focus() {
      if (this.ownerDocument) {
        this.ownerDocument.activeElement = this;
      }
      this.isFocused = true;
    },
    click() {
      this.clickCount += 1;
      if (typeof this.onclick === "function") {
        this.onclick({ target: this });
      }
    },
    getBoundingClientRect() {
      const width = typeof this._rect.width === "number" ? this._rect.width : 0;
      const height = typeof this._rect.height === "number" ? this._rect.height : 0;
      const left = typeof this._rect.left === "number" ? this._rect.left : 0;
      const top = typeof this._rect.top === "number" ? this._rect.top : 0;
      const right = typeof this._rect.right === "number" ? this._rect.right : left + width;
      const bottom = typeof this._rect.bottom === "number" ? this._rect.bottom : top + height;

      return {
        left,
        top,
        right,
        bottom,
        width,
        height
      };
    },
    querySelector(selector) {
      return findInTree(this.children, selector);
    },
    querySelectorAll(selector) {
      return collectInTree(this.children, selector, []);
    },
    matches(selector) {
      return matchesSelector(this, selector);
    }
  };

  element._rect = {
    left: typeof rect.left === "number" ? rect.left : 0,
    top: typeof rect.top === "number" ? rect.top : 0,
    width: typeof rect.width === "number" ? rect.width : 0,
    height: typeof rect.height === "number" ? rect.height : 0,
    right: typeof rect.right === "number" ? rect.right : undefined,
    bottom: typeof rect.bottom === "number" ? rect.bottom : undefined
  };
  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, value);
    }
  }
  if (options.dataset) {
    for (const [name, value] of Object.entries(options.dataset)) {
      element.dataset[name] = String(value);
    }
  }
  if (typeof options.textContent === "string") {
    element.textContent = options.textContent;
  }

  return element;
}

function getSelectorAttributeValue(node, attributeName) {
  if (!node) {
    return null;
  }
  if (attributeName === "class") {
    return node.className || null;
  }
  if (attributeName === "id") {
    return node.id || null;
  }
  return typeof node.getAttribute === "function" ? node.getAttribute(attributeName) : null;
}

function matchesSimpleSelector(node, selector) {
  if (!node || typeof selector !== "string" || selector.length === 0) {
    return false;
  }

  const tagAndAttrMatch = selector.match(/^([a-zA-Z0-9_-]+)\[(.+)\]$/);
  if (tagAndAttrMatch) {
    if (node.tagName !== tagAndAttrMatch[1].toUpperCase()) {
      return false;
    }
    selector = `[${tagAndAttrMatch[2]}]`;
  }

  const containsAttrMatch = selector.match(/^\[([^\]=]+)\*=(["']?)(.*?)\2\]$/);
  if (containsAttrMatch) {
    const actualValue = getSelectorAttributeValue(node, containsAttrMatch[1]);
    return typeof actualValue === "string" && actualValue.includes(containsAttrMatch[3]);
  }

  const attrMatch = selector.match(/^\[([^\]=]+)(?:=(["']?)(.*?)\2)?\]$/);
  if (attrMatch) {
    const attributeName = attrMatch[1];
    const expectedValue = typeof attrMatch[3] === "string" && attrMatch[3].length > 0 ? attrMatch[3] : null;
    const actualValue = getSelectorAttributeValue(node, attributeName);

    if (expectedValue === null) {
      return actualValue !== null;
    }

    return actualValue === expectedValue;
  }

  return /^[a-zA-Z0-9_-]+$/.test(selector) && node.tagName === selector.toUpperCase();
}

function matchesSelector(node, selector) {
  if (!node || typeof selector !== "string") {
    return false;
  }

  return selector
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => {
      const segments = part.split(/\s+/).filter(Boolean);
      let currentNode = node;

      if (!segments.length || !matchesSimpleSelector(currentNode, segments[segments.length - 1])) {
        return false;
      }

      for (let index = segments.length - 2; index >= 0; index -= 1) {
        currentNode = currentNode.parentNode;
        while (currentNode && !matchesSimpleSelector(currentNode, segments[index])) {
          currentNode = currentNode.parentNode;
        }
        if (!currentNode) {
          return false;
        }
      }

      return true;
    });
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

function collectInTree(nodes, selector, results) {
  for (const node of nodes) {
    if (matchesSelector(node, selector)) {
      results.push(node);
    }

    collectInTree(node.children || [], selector, results);
  }

  return results;
}

function createMockDocument() {
  const listeners = new Map();
  const document = {
    readyState: "complete",
    head: createMockElement("head"),
    body: createMockElement("body"),
    activeElement: null,
    createElement(tagName) {
      const element = createMockElement(tagName);
      element.ownerDocument = document;
      return element;
    },
    createTextNode(text) {
      return String(text);
    },
    querySelector(selector) {
      return findInTree([this.head, this.body], selector);
    },
    querySelectorAll(selector) {
      return collectInTree([this.head, this.body], selector, []);
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

  document.head.ownerDocument = document;
  document.body.ownerDocument = document;

  return document;
}

function setElementRect(element, rect) {
  element._rect = {
    left: typeof rect.left === "number" ? rect.left : 0,
    top: typeof rect.top === "number" ? rect.top : 0,
    width: typeof rect.width === "number" ? rect.width : 0,
    height: typeof rect.height === "number" ? rect.height : 0,
    right: typeof rect.right === "number" ? rect.right : undefined,
    bottom: typeof rect.bottom === "number" ? rect.bottom : undefined
  };
  return element;
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

function createMockHistory(options = {}) {
  return {
    length: typeof options.length === "number" ? options.length : 1,
    backCount: 0,
    back() {
      this.backCount += 1;
    }
  };
}

function bootstrapMainScript(options = {}) {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const document = options.document || createMockDocument();
  const context = {
    Date,
    document,
    location: options.location || { pathname: "/unit-test" },
    history: options.history,
    tizen: options.tizen,
    MutationObserver: options.MutationObserver,
    requestAnimationFrame: options.requestAnimationFrame,
    getComputedStyle: options.getComputedStyle,
    innerWidth: options.innerWidth,
    innerHeight: options.innerHeight
  };

  vm.createContext(context);
  vm.runInContext(code, context, { filename: mainScriptPath });

  return {
    context,
    document,
    api: context[NAMESPACE]
  };
}

function dispatchKey(document, key, options = {}) {
  const event = createKeyEvent(key, options);
  document.dispatch("keydown", event);
  return event;
}

function primeExitModalLayout(document) {
  const modal = document.querySelector("[data-stremio-remote-exit-modal='1']");
  const dialog = modal.querySelector("[data-stremio-remote-exit-dialog='1']");
  const [keepWatchingButton, endAppButton] = dialog.querySelectorAll("[data-stremio-remote-exit-button='1']");

  setElementRect(modal, { left: 0, top: 0, width: 1280, height: 720 });
  setElementRect(dialog, { left: 360, top: 220, width: 420, height: 220 });
  setElementRect(keepWatchingButton, { left: 392, top: 356, width: 160, height: 48 });
  setElementRect(endAppButton, { left: 572, top: 356, width: 160, height: 48 });

  return {
    modal,
    dialog,
    keepWatchingButton,
    endAppButton
  };
}

test("src/main.js is valid JavaScript syntax", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  assert.doesNotThrow(() => {
    new vm.Script(code, { filename: mainScriptPath });
  });
});

test("src/main.js bootstraps with runtime state, diagnostics, and TV input helpers", () => {
  const registeredKeys = [];
  const { context, document, api } = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/unit-test"
    },
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
    requestAnimationFrame() {}
  });

  assert.equal(document.head.children.length, 1);
  assert.equal(document.head.children[0].tagName, "STYLE");
  assert.equal(document.head.children[0].dataset.stremioRemoteStyle, "1");
  assert.equal(document.listenerCount("keydown"), 1);
  assert.ok(registeredKeys.includes("MediaPlayPause"));
  assert.equal(registeredKeys.includes("Back"), false);
  assert.equal(document.querySelector("[data-stremio-remote-diagnostics-panel='1']").dataset.open, "false");
  assert.equal(document.querySelector("[data-stremio-remote-exit-modal='1']").dataset.open, "false");

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
  assert.equal(state.exitModalOpen, false);
  assert.equal(state.lastExitAttempt, null);
  assert.equal(state.lastExitResult, null);
  assert.equal(state.lastBackResolution, null);

  const snapshot = api.getState();
  snapshot.registeredKeys.length = 0;
  assert.ok(api.getState().registeredKeys.length > 0);

  assert.deepEqual(Array.from(api.registerOptionalKeys(["Back", "Info", "ColorF0Red"])), ["Info"]);
  assert.ok(api.getState().failedKeys.some((entry) => entry.keyName === "ColorF0Red"));
});

test("src/main.js bootstrap is idempotent and keeps one listener, one style, one diagnostics panel, and one exit modal", () => {
  const { context, document } = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/idempotent"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });
  const firstInitTime = context[NAMESPACE].getState().initTime;
  const code = fs.readFileSync(mainScriptPath, "utf8");
  vm.runInContext(code, context, { filename: mainScriptPath });

  assert.equal(document.head.children.length, 1);
  assert.equal(document.listenerCount("keydown"), 1);
  assert.equal(document.body.children.length, 2);
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
  assert.equal(context[NAMESPACE].getState().lastBackResolution, "diagnostics:close");
  assert.equal(panel.dataset.open, "false");
});

test("src/main.js Back closes diagnostics first and opens the exit modal when no safe action exists", () => {
  const { document, api } = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/back-priority"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  const openDiagnosticsEvent = dispatchKey(document, "Info", { code: "Info" });
  assert.equal(openDiagnosticsEvent.defaultPrevented, true);
  assert.equal(api.getState().diagnosticsOpen, true);

  const closeDiagnosticsEvent = dispatchKey(document, "Back", { code: "BrowserBack" });
  assert.equal(closeDiagnosticsEvent.defaultPrevented, true);
  assert.equal(api.getState().diagnosticsOpen, false);
  assert.equal(api.getState().exitModalOpen, false);
  assert.equal(api.getState().lastBackResolution, "diagnostics:close");

  const openExitModalEvent = dispatchKey(document, "Back", { code: "BrowserBack" });
  const exitModal = document.querySelector("[data-stremio-remote-exit-modal='1']");
  assert.equal(openExitModalEvent.defaultPrevented, true);
  assert.equal(api.getState().exitModalOpen, true);
  assert.equal(api.getState().lastBackResolution, "exit-modal:open");
  assert.equal(exitModal.dataset.open, "true");
});

test("src/main.js Back on the exit modal behaves like Keep watching and restores focus when possible", () => {
  const document = createMockDocument();
  const contentButton = createMockElement("button", {
    rect: { left: 40, top: 40, width: 160, height: 60 }
  });
  contentButton.textContent = "Resume";
  document.body.appendChild(contentButton);

  const { api } = bootstrapMainScript({
    document,
    location: {
      pathname: "/back-restore"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  dispatchKey(document, "ArrowRight", { code: "ArrowRight" });
  assert.equal(document.activeElement, contentButton);
  assert.equal(contentButton.getAttribute("data-stremio-remote-focus"), "true");

  dispatchKey(document, "Back", { code: "BrowserBack" });
  assert.equal(api.getState().exitModalOpen, true);
  assert.equal(api.getState().lastBackResolution, "exit-modal:open");

  const closeModalEvent = dispatchKey(document, "Back", { code: "BrowserBack" });
  assert.equal(closeModalEvent.defaultPrevented, true);
  assert.equal(api.getState().exitModalOpen, false);
  assert.equal(api.getState().lastBackResolution, "exit-modal:keep-watching");
  assert.equal(document.activeElement, contentButton);
  assert.equal(contentButton.getAttribute("data-stremio-remote-focus"), "true");
});

test("src/main.js keeps modal navigation between Keep watching and End the app, and Enter on Keep watching closes the modal", () => {
  const { document, api } = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/exit-modal-nav"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  dispatchKey(document, "Back", { code: "BrowserBack" });
  const { modal, keepWatchingButton, endAppButton } = primeExitModalLayout(document);

  const seedFocusEvent = dispatchKey(document, "ArrowRight", { code: "ArrowRight" });
  assert.equal(seedFocusEvent.defaultPrevented, true);
  assert.equal(document.activeElement, keepWatchingButton);
  assert.equal(keepWatchingButton.getAttribute("data-stremio-remote-focus"), "true");

  const moveRightEvent = dispatchKey(document, "ArrowRight", { code: "ArrowRight" });
  assert.equal(moveRightEvent.defaultPrevented, true);
  assert.equal(document.activeElement, endAppButton);
  assert.equal(endAppButton.getAttribute("data-stremio-remote-focus"), "true");

  const stayWithinModalEvent = dispatchKey(document, "ArrowRight", { code: "ArrowRight" });
  assert.equal(stayWithinModalEvent.defaultPrevented, false);
  assert.equal(document.activeElement, endAppButton);
  assert.equal(api.getState().candidateCount, 2);

  const moveLeftEvent = dispatchKey(document, "ArrowLeft", { code: "ArrowLeft" });
  assert.equal(moveLeftEvent.defaultPrevented, true);
  assert.equal(document.activeElement, keepWatchingButton);

  const keepWatchingEnterEvent = dispatchKey(document, "Enter", { code: "Enter" });
  assert.equal(keepWatchingEnterEvent.defaultPrevented, true);
  assert.equal(api.getState().exitModalOpen, false);
  assert.equal(api.getState().lastConsumedAction, "exit-modal:keep-watching");
  assert.equal(api.getState().currentFocusRole, null);
  assert.equal(modal.dataset.open, "false");
});

test("src/main.js Enter on End the app attempts Tizen exit and records the result", () => {
  let exitCount = 0;
  const { document, api } = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/exit-success"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      },
      application: {
        getCurrentApplication() {
          return {
            exit() {
              exitCount += 1;
            }
          };
        }
      }
    }
  });

  dispatchKey(document, "Back", { code: "BrowserBack" });
  const { endAppButton } = primeExitModalLayout(document);

  dispatchKey(document, "ArrowRight", { code: "ArrowRight" });
  dispatchKey(document, "ArrowRight", { code: "ArrowRight" });
  assert.equal(document.activeElement, endAppButton);

  const enterEvent = dispatchKey(document, "Enter", { code: "Enter" });
  const diagnosticsBody = document.querySelector("[data-stremio-remote-diagnostics-body='1']");
  const lastExitResult = api.getState().lastExitResult;

  assert.equal(enterEvent.defaultPrevented, true);
  assert.equal(exitCount, 1);
  assert.equal(api.getState().lastConsumedAction, "exit-modal:end-app");
  assert.equal(lastExitResult.ok, true);
  assert.equal(lastExitResult.message, "exit requested");
  assert.match(diagnosticsBody.textContent, /Last exit result: ok: exit requested/);
});

test("src/main.js keeps missing or failing Tizen exit attempts non-throwing", () => {
  const missingRuntime = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/exit-missing"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  dispatchKey(missingRuntime.document, "Back", { code: "BrowserBack" });
  primeExitModalLayout(missingRuntime.document);
  dispatchKey(missingRuntime.document, "ArrowRight", { code: "ArrowRight" });
  dispatchKey(missingRuntime.document, "ArrowRight", { code: "ArrowRight" });
  assert.doesNotThrow(() => {
    dispatchKey(missingRuntime.document, "Enter", { code: "Enter" });
  });
  assert.equal(missingRuntime.api.getState().lastExitResult.ok, false);
  assert.equal(missingRuntime.api.getState().lastExitResult.message, "application API unavailable");

  const failingRuntime = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/exit-failing"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      },
      application: {
        getCurrentApplication() {
          return {
            exit() {
              throw new Error("exit blocked");
            }
          };
        }
      }
    }
  });

  dispatchKey(failingRuntime.document, "Back", { code: "BrowserBack" });
  primeExitModalLayout(failingRuntime.document);
  dispatchKey(failingRuntime.document, "ArrowRight", { code: "ArrowRight" });
  dispatchKey(failingRuntime.document, "ArrowRight", { code: "ArrowRight" });
  assert.doesNotThrow(() => {
    dispatchKey(failingRuntime.document, "Enter", { code: "Enter" });
  });
  assert.equal(failingRuntime.api.getState().lastExitResult.ok, false);
  assert.equal(failingRuntime.api.getState().lastExitResult.message, "exit blocked");
});

test("src/main.js Back activates a single visible dialog close control and falls through safely when ambiguous", () => {
  const singleDocument = createMockDocument();
  const singleDialog = createMockElement("div", {
    rect: { left: 240, top: 120, width: 400, height: 260 }
  });
  singleDialog.setAttribute("role", "dialog");
  const singleCloseButton = createMockElement("button", {
    rect: { left: 560, top: 140, width: 48, height: 48 }
  });
  singleCloseButton.setAttribute("aria-label", "Close");
  singleDialog.appendChild(singleCloseButton);
  singleDocument.body.appendChild(singleDialog);

  const singleRuntime = bootstrapMainScript({
    document: singleDocument,
    location: {
      pathname: "/dialog-single-close"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  const singleBackEvent = dispatchKey(singleDocument, "Back", { code: "BrowserBack" });
  assert.equal(singleBackEvent.defaultPrevented, true);
  assert.equal(singleCloseButton.clickCount, 1);
  assert.equal(singleRuntime.api.getState().lastBackResolution, "dialog:close-affordance");
  assert.equal(singleRuntime.api.getState().exitModalOpen, false);

  const ambiguousDocument = createMockDocument();
  const ambiguousDialog = createMockElement("div", {
    rect: { left: 240, top: 120, width: 400, height: 260 }
  });
  ambiguousDialog.setAttribute("role", "dialog");
  const firstCloseButton = createMockElement("button", {
    rect: { left: 520, top: 140, width: 48, height: 48 }
  });
  firstCloseButton.textContent = "Close";
  const secondCloseButton = createMockElement("button", {
    rect: { left: 576, top: 140, width: 48, height: 48 }
  });
  secondCloseButton.setAttribute("aria-label", "Close");
  ambiguousDialog.appendChild(firstCloseButton);
  ambiguousDialog.appendChild(secondCloseButton);
  ambiguousDocument.body.appendChild(ambiguousDialog);

  const ambiguousRuntime = bootstrapMainScript({
    document: ambiguousDocument,
    location: {
      pathname: "/dialog-ambiguous-close"
    },
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  const ambiguousBackEvent = dispatchKey(ambiguousDocument, "Back", { code: "BrowserBack" });
  assert.equal(ambiguousBackEvent.defaultPrevented, true);
  assert.equal(firstCloseButton.clickCount, 0);
  assert.equal(secondCloseButton.clickCount, 0);
  assert.equal(ambiguousRuntime.api.getState().lastBackResolution, "exit-modal:open");
  assert.equal(ambiguousRuntime.api.getState().exitModalOpen, true);
});

test("src/main.js uses history.back only when the current history state is eligible", () => {
  const eligibleHistory = createMockHistory({ length: 1 });
  const eligibleRuntime = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/history-start"
    },
    history: eligibleHistory,
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  eligibleHistory.length = 2;
  const eligibleBackEvent = dispatchKey(eligibleRuntime.document, "Back", { code: "BrowserBack" });
  assert.equal(eligibleBackEvent.defaultPrevented, true);
  assert.equal(eligibleHistory.backCount, 1);
  assert.equal(eligibleRuntime.api.getState().lastBackResolution, "history:back");
  assert.equal(eligibleRuntime.api.getState().exitModalOpen, false);

  const pathHistory = createMockHistory({ length: 1 });
  const pathRuntime = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/path-start"
    },
    history: pathHistory,
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  pathRuntime.context.location.pathname = "/path-next";
  dispatchKey(pathRuntime.document, "Back", { code: "BrowserBack" });
  assert.equal(pathHistory.backCount, 1);
  assert.equal(pathRuntime.api.getState().lastBackResolution, "history:back");

  const ineligibleHistory = createMockHistory({ length: 1 });
  const ineligibleRuntime = bootstrapMainScript({
    document: createMockDocument(),
    location: {
      pathname: "/history-start"
    },
    history: ineligibleHistory,
    tizen: {
      tvinputdevice: {
        registerKey() {}
      }
    }
  });

  dispatchKey(ineligibleRuntime.document, "Back", { code: "BrowserBack" });
  assert.equal(ineligibleHistory.backCount, 0);
  assert.equal(ineligibleRuntime.api.getState().lastBackResolution, "exit-modal:open");
  assert.equal(ineligibleRuntime.api.getState().exitModalOpen, true);
});

test("src/main.js preserves editable-context passthrough groundwork", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const document = createMockDocument();
  const input = createMockElement("input");
  document.body.appendChild(input);
  document.activeElement = input;
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
  const enterEvent = createKeyEvent("Enter", {
    code: "Enter",
    target: input
  });
  document.dispatch("keydown", enterEvent);

  const state = context[NAMESPACE].getState();
  assert.equal(arrowEvent.defaultPrevented, false);
  assert.equal(enterEvent.defaultPrevented, false);
  assert.equal(state.lastConsumedAction, null);
  assert.equal(state.lastKey.editable, true);
});

test("src/main.js discovers visible navigation candidates, excludes diagnostics internals, and seeds focus from the first arrow key", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const document = createMockDocument();
  const visibleCandidate = createMockElement("button", {
    rect: { left: 40, top: 40, width: 160, height: 60 }
  });
  visibleCandidate.setAttribute("role", "button");
  visibleCandidate.setAttribute("data-test-id", "visible");

  const hiddenCandidate = createMockElement("button", {
    hidden: true,
    rect: { left: 240, top: 40, width: 160, height: 60 }
  });
  hiddenCandidate.setAttribute("role", "button");
  hiddenCandidate.setAttribute("data-test-id", "hidden");

  const disabledCandidate = createMockElement("button", {
    disabled: true,
    rect: { left: 440, top: 40, width: 160, height: 60 }
  });
  disabledCandidate.setAttribute("role", "button");
  disabledCandidate.setAttribute("data-test-id", "disabled");

  const zeroSizeCandidate = createMockElement("button", {
    rect: { left: 640, top: 40, width: 0, height: 0 }
  });
  zeroSizeCandidate.setAttribute("role", "button");
  zeroSizeCandidate.setAttribute("data-test-id", "zero-size");

  document.body.appendChild(visibleCandidate);
  document.body.appendChild(hiddenCandidate);
  document.body.appendChild(disabledCandidate);
  document.body.appendChild(zeroSizeCandidate);

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

  const openDiagnostics = createKeyEvent("Info", { code: "Info" });
  document.dispatch("keydown", openDiagnostics);
  assert.equal(openDiagnostics.defaultPrevented, true);
  assert.equal(context[NAMESPACE].getState().diagnosticsOpen, true);

  const panel = document.querySelector("[data-stremio-remote-diagnostics-panel='1']");
  const panelBody = panel.querySelector("[data-stremio-remote-diagnostics-body='1']");
  const diagnosticsButton = createMockElement("button", {
    rect: { left: 20, top: 20, width: 180, height: 48 }
  });
  diagnosticsButton.setAttribute("role", "button");
  diagnosticsButton.setAttribute("data-test-id", "diagnostics-action");
  panelBody.appendChild(diagnosticsButton);

  const seedEvent = createKeyEvent("ArrowRight", { code: "ArrowRight" });
  document.dispatch("keydown", seedEvent);

  const focusMarker = document.querySelector("[data-stremio-remote-focus='true']");
  const state = context[NAMESPACE].getState();

  assert.equal(seedEvent.defaultPrevented, true);
  assert.equal(document.activeElement, visibleCandidate);
  assert.equal(focusMarker, visibleCandidate);
  assert.equal(visibleCandidate.getAttribute("data-stremio-remote-focus"), "true");
  assert.equal(hiddenCandidate.getAttribute("data-stremio-remote-focus"), null);
  assert.equal(disabledCandidate.getAttribute("data-stremio-remote-focus"), null);
  assert.equal(zeroSizeCandidate.getAttribute("data-stremio-remote-focus"), null);
  assert.equal(diagnosticsButton.getAttribute("data-stremio-remote-focus"), null);
  assert.equal(state.candidateCount, 1);
  assert.equal(typeof state.currentFocusRole, "string");
  assert.ok(state.currentFocusRole.length > 0);
});

test("src/main.js moves focus directionally, falls back to DOM order when geometry has no match, removes the old marker, and activates Enter on the focused candidate", () => {
  const code = fs.readFileSync(mainScriptPath, "utf8");
  const document = createMockDocument();

  const firstCandidate = createMockElement("button", {
    rect: { left: 40, top: 40, width: 160, height: 60 }
  });
  firstCandidate.setAttribute("role", "button");
  firstCandidate.setAttribute("data-test-id", "first");

  const rightCandidate = createMockElement("button", {
    rect: { left: 260, top: 40, width: 160, height: 60 }
  });
  rightCandidate.setAttribute("role", "button");
  rightCandidate.setAttribute("data-test-id", "right");

  const fallbackCandidate = createMockElement("button", {
    rect: { left: 60, top: 180, width: 160, height: 60 }
  });
  fallbackCandidate.setAttribute("role", "button");
  fallbackCandidate.setAttribute("data-test-id", "fallback");

  let clickCount = 0;
  fallbackCandidate.onclick = () => {
    clickCount += 1;
  };

  document.body.appendChild(firstCandidate);
  document.body.appendChild(rightCandidate);
  document.body.appendChild(fallbackCandidate);

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

  const seedEvent = createKeyEvent("ArrowRight", { code: "ArrowRight" });
  document.dispatch("keydown", seedEvent);
  assert.equal(seedEvent.defaultPrevented, true);
  assert.equal(document.activeElement, firstCandidate);
  assert.equal(firstCandidate.getAttribute("data-stremio-remote-focus"), "true");
  assert.equal(document.querySelectorAll("[data-stremio-remote-focus='true']").length, 1);

  const moveRightEvent = createKeyEvent("ArrowRight", { code: "ArrowRight" });
  document.dispatch("keydown", moveRightEvent);
  assert.equal(moveRightEvent.defaultPrevented, true);
  assert.equal(document.activeElement, rightCandidate);
  assert.equal(firstCandidate.getAttribute("data-stremio-remote-focus"), null);
  assert.equal(rightCandidate.getAttribute("data-stremio-remote-focus"), "true");
  assert.equal(document.querySelectorAll("[data-stremio-remote-focus='true']").length, 1);

  const fallbackEvent = createKeyEvent("ArrowRight", { code: "ArrowRight" });
  document.dispatch("keydown", fallbackEvent);
  assert.equal(fallbackEvent.defaultPrevented, true);
  assert.equal(document.activeElement, fallbackCandidate);
  assert.equal(rightCandidate.getAttribute("data-stremio-remote-focus"), null);
  assert.equal(fallbackCandidate.getAttribute("data-stremio-remote-focus"), "true");
  assert.equal(document.querySelectorAll("[data-stremio-remote-focus='true']").length, 1);

  const enterEvent = createKeyEvent("Enter", { code: "Enter" });
  document.dispatch("keydown", enterEvent);
  assert.equal(enterEvent.defaultPrevented, true);
  assert.equal(clickCount, 1);
  assert.equal(fallbackCandidate.clickCount, 1);
  assert.equal(context[NAMESPACE].getState().currentFocusRole, "button");
});

test("src/styles.css includes diagnostics panel rules", () => {
  const css = fs.readFileSync(stylesPath, "utf8");
  assert.ok(css.trim().length > 0);
  assert.match(css, /\[data-stremio-remote-diagnostics-panel="1"\]/);
});
