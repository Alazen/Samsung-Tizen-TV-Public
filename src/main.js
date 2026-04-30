(function bootstrapStremioTizenBrew(globalScope) {
  "use strict";

  var NAMESPACE = "__STREMIO_TIZENBREW_REMOTE__";
  if (globalScope[NAMESPACE] && globalScope[NAMESPACE].initialized) {
    return;
  }

  var mandatoryKeys = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Enter",
    "Back"
  ]);

  var defaultOptionalKeys = [
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
  ];

  var diagnosticsToggleKeys = [
    "Info",
    "ColorF0Red",
    "ColorF1Green",
    "ColorF2Yellow",
    "ColorF3Blue"
  ];

  var defaultCss = [
    ":root { --stremio-remote-focus-outline: #20c997; }",
    "[data-stremio-remote-focus='true'] {",
    "  outline: 3px solid var(--stremio-remote-focus-outline);",
    "  outline-offset: 2px;",
    "}",
    "[data-stremio-remote-diagnostics-panel='1'] {",
    "  position: fixed;",
    "  top: 16px;",
    "  right: 16px;",
    "  z-index: 2147483647;",
    "  width: min(420px, calc(100vw - 32px));",
    "  max-height: calc(100vh - 32px);",
    "  overflow: auto;",
    "  padding: 12px 14px;",
    "  border: 1px solid rgba(32, 201, 151, 0.45);",
    "  border-radius: 10px;",
    "  background: rgba(6, 12, 18, 0.92);",
    "  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);",
    "  color: #f3fff9;",
    "  font: 12px/1.45 Consolas, 'Courier New', monospace;",
    "  white-space: pre-wrap;",
    "  display: none;",
    "}",
    "[data-stremio-remote-diagnostics-panel='1'][data-open='true'] {",
    "  display: block;",
    "}",
    "[data-stremio-remote-diagnostics-body='1'] {",
    "  margin: 0;",
    "}"
  ].join("\n");

  function createInitialState() {
    return {
      initialized: false,
      initTime: null,
      registeredKeys: [],
      failedKeys: [],
      apiAvailability: {},
      lastKey: null,
      lastConsumedAction: null,
      diagnosticsOpen: false,
      styleInjected: false,
      keyListenerAttached: false,
      diagnosticsPanelCreated: false,
      domReadyHookAttached: false
    };
  }

  var runtimeApi = globalScope[NAMESPACE] || {};
  var state = createInitialState();

  function toDataKey(attributeName) {
    return attributeName.replace(/^data-/, "").replace(/-([a-z])/g, function (_match, letter) {
      return letter.toUpperCase();
    });
  }

  function setDataAttribute(element, attributeName, value) {
    if (!element) {
      return;
    }

    if (typeof element.setAttribute === "function") {
      element.setAttribute(attributeName, String(value));
      return;
    }

    element.dataset = element.dataset || {};
    element.dataset[toDataKey(attributeName)] = String(value);
  }

  function setAttributeIfPossible(element, attributeName, value) {
    if (!element) {
      return;
    }

    if (typeof element.setAttribute === "function") {
      element.setAttribute(attributeName, String(value));
      return;
    }

    element[attributeName] = String(value);
  }

  function getDocument() {
    return globalScope && globalScope.document ? globalScope.document : null;
  }

  function getLocationPath() {
    if (!globalScope || !globalScope.location) {
      return "";
    }

    return globalScope.location.pathname || globalScope.location.href || "";
  }

  function now() {
    return typeof Date.now === "function" ? Date.now() : new Date().getTime();
  }

  function collectApiAvailability() {
    var documentObject = getDocument();
    var tizenObject = globalScope && globalScope.tizen;
    var inputDevice = tizenObject && (tizenObject.tvinputdevice || tizenObject.inputdevice);

    return {
      document: Boolean(documentObject),
      documentHead: Boolean(documentObject && documentObject.head),
      documentBody: Boolean(documentObject && documentObject.body),
      tizen: Boolean(tizenObject),
      tvInputDevice: Boolean(inputDevice && typeof inputDevice.registerKey === "function"),
      application: Boolean(
        tizenObject &&
        tizenObject.application &&
        typeof tizenObject.application.getCurrentApplication === "function"
      ),
      mutationObserver: typeof globalScope.MutationObserver === "function",
      requestAnimationFrame: typeof globalScope.requestAnimationFrame === "function"
    };
  }

  function refreshApiAvailability() {
    state.apiAvailability = collectApiAvailability();
    return state.apiAvailability;
  }

  function copyFailedKeys(failedKeys) {
    var copied = [];

    for (var i = 0; i < failedKeys.length; i += 1) {
      copied.push({
        keyName: failedKeys[i].keyName,
        message: failedKeys[i].message
      });
    }

    return copied;
  }

  function getState() {
    refreshApiAvailability();

    return {
      initialized: state.initialized,
      initTime: state.initTime,
      registeredKeys: state.registeredKeys.slice(),
      failedKeys: copyFailedKeys(state.failedKeys),
      apiAvailability: {
        document: state.apiAvailability.document,
        documentHead: state.apiAvailability.documentHead,
        documentBody: state.apiAvailability.documentBody,
        tizen: state.apiAvailability.tizen,
        tvInputDevice: state.apiAvailability.tvInputDevice,
        application: state.apiAvailability.application,
        mutationObserver: state.apiAvailability.mutationObserver,
        requestAnimationFrame: state.apiAvailability.requestAnimationFrame
      },
      lastKey: state.lastKey ? {
        key: state.lastKey.key,
        code: state.lastKey.code,
        keyCode: state.lastKey.keyCode,
        editable: state.lastKey.editable
      } : null,
      lastConsumedAction: state.lastConsumedAction,
      diagnosticsOpen: state.diagnosticsOpen
    };
  }

  function getInputDeviceApi() {
    var tizenObject = globalScope && globalScope.tizen;
    if (!tizenObject) {
      return null;
    }

    var inputdevice = tizenObject.tvinputdevice || tizenObject.inputdevice;
    if (!inputdevice || typeof inputdevice.registerKey !== "function") {
      return null;
    }

    return inputdevice;
  }

  function findDiagnosticsPanel() {
    var documentObject = getDocument();
    if (!documentObject || typeof documentObject.querySelector !== "function") {
      return null;
    }

    return documentObject.querySelector("[data-stremio-remote-diagnostics-panel='1']");
  }

  function findDiagnosticsBody(panel) {
    if (!panel || typeof panel.querySelector !== "function") {
      return null;
    }

    return panel.querySelector("[data-stremio-remote-diagnostics-body='1']");
  }

  function injectStylesIfPossible(cssText) {
    var documentObject = getDocument();
    if (!documentObject || !documentObject.head) {
      refreshApiAvailability();
      return false;
    }

    var existingStyle = typeof documentObject.querySelector === "function"
      ? documentObject.querySelector("style[data-stremio-remote-style='1']")
      : null;

    if (existingStyle) {
      state.styleInjected = true;
      refreshApiAvailability();
      return true;
    }

    var style = documentObject.createElement("style");
    style.type = "text/css";
    setDataAttribute(style, "data-stremio-remote-style", "1");
    style.appendChild(documentObject.createTextNode(cssText || defaultCss));
    documentObject.head.appendChild(style);

    state.styleInjected = true;
    refreshApiAvailability();
    return true;
  }

  function recordFailedKey(keyName, error) {
    state.failedKeys.push({
      keyName: keyName,
      message: error && error.message ? error.message : String(error)
    });
  }

  function registerOptionalKeys(requestedKeys) {
    var inputdevice = getInputDeviceApi();
    var keys = Array.isArray(requestedKeys) ? requestedKeys : defaultOptionalKeys;

    state.registeredKeys = [];
    state.failedKeys = [];
    refreshApiAvailability();

    if (!inputdevice) {
      return [];
    }

    for (var i = 0; i < keys.length; i += 1) {
      var keyName = keys[i];
      if (mandatoryKeys.has(keyName)) {
        continue;
      }

      try {
        inputdevice.registerKey(keyName);
        state.registeredKeys.push(keyName);
      } catch (error) {
        recordFailedKey(keyName, error);
      }
    }

    return state.registeredKeys.slice();
  }

  function isEditableTarget(target) {
    if (!target) {
      return false;
    }

    if (target.isContentEditable === true || target.contentEditable === "true") {
      return true;
    }

    var tagName = typeof target.tagName === "string" ? target.tagName.toLowerCase() : "";
    if (tagName === "input" || tagName === "textarea") {
      return true;
    }

    if (typeof target.getAttribute === "function") {
      var role = target.getAttribute("role");
      if (role === "textbox") {
        return true;
      }
    }

    return false;
  }

  function normalizeKeyEvent(event) {
    return {
      key: event && typeof event.key === "string" ? event.key : "",
      code: event && typeof event.code === "string" ? event.code : "",
      keyCode: event && typeof event.keyCode === "number" ? event.keyCode : null,
      editable: isEditableTarget(event && event.target ? event.target : null)
    };
  }

  function isDiagnosticsToggleKey(keyName) {
    for (var i = 0; i < diagnosticsToggleKeys.length; i += 1) {
      if (diagnosticsToggleKeys[i] === keyName) {
        return true;
      }
    }

    return false;
  }

  function ensureDiagnosticsPanel() {
    var documentObject = getDocument();
    if (!documentObject || !documentObject.body || typeof documentObject.createElement !== "function") {
      refreshApiAvailability();
      return null;
    }

    var existingPanel = findDiagnosticsPanel();
    if (existingPanel) {
      state.diagnosticsPanelCreated = true;
      refreshApiAvailability();
      return existingPanel;
    }

    var panel = documentObject.createElement("aside");
    setDataAttribute(panel, "data-stremio-remote-diagnostics-panel", "1");
    setDataAttribute(panel, "data-open", "false");
    setAttributeIfPossible(panel, "aria-hidden", "true");

    var panelBody = documentObject.createElement("pre");
    setDataAttribute(panelBody, "data-stremio-remote-diagnostics-body", "1");
    panel.appendChild(panelBody);
    documentObject.body.appendChild(panel);

    state.diagnosticsPanelCreated = true;
    refreshApiAvailability();
    return panel;
  }

  function formatKeyList(list) {
    return list.length ? list.join(", ") : "(none)";
  }

  function formatFailedKeys(failedKeys) {
    if (!failedKeys.length) {
      return "(none)";
    }

    var formatted = [];
    for (var i = 0; i < failedKeys.length; i += 1) {
      formatted.push(failedKeys[i].keyName + ": " + failedKeys[i].message);
    }

    return formatted.join(", ");
  }

  function buildDiagnosticsText() {
    var snapshot = getState();
    var lastKey = snapshot.lastKey
      ? snapshot.lastKey.key + (snapshot.lastKey.code ? " (" + snapshot.lastKey.code + ")" : "")
      : "(none)";

    return [
      "Stremio Web TV Remote Diagnostics",
      "Init time: " + (snapshot.initTime !== null ? String(snapshot.initTime) : "(not initialized)"),
      "Path: " + (getLocationPath() || "(unavailable)"),
      "Last key: " + lastKey,
      "Last action: " + (snapshot.lastConsumedAction || "(none)"),
      "Registered keys: " + formatKeyList(snapshot.registeredKeys),
      "Failed keys: " + formatFailedKeys(snapshot.failedKeys),
      "APIs: " +
        "document=" + String(snapshot.apiAvailability.document) +
        ", head=" + String(snapshot.apiAvailability.documentHead) +
        ", body=" + String(snapshot.apiAvailability.documentBody) +
        ", tizen=" + String(snapshot.apiAvailability.tizen) +
        ", tvinputdevice=" + String(snapshot.apiAvailability.tvInputDevice) +
        ", application=" + String(snapshot.apiAvailability.application) +
        ", MutationObserver=" + String(snapshot.apiAvailability.mutationObserver) +
        ", requestAnimationFrame=" + String(snapshot.apiAvailability.requestAnimationFrame)
    ].join("\n");
  }

  function renderDiagnostics() {
    var panel = ensureDiagnosticsPanel();
    if (!panel) {
      return false;
    }

    setDataAttribute(panel, "data-open", state.diagnosticsOpen ? "true" : "false");
    setAttributeIfPossible(panel, "aria-hidden", state.diagnosticsOpen ? "false" : "true");

    var panelBody = findDiagnosticsBody(panel);
    if (panelBody) {
      panelBody.textContent = buildDiagnosticsText();
    } else {
      panel.textContent = buildDiagnosticsText();
    }

    return true;
  }

  function setDiagnosticsOpen(isOpen) {
    state.diagnosticsOpen = Boolean(isOpen);
    state.lastConsumedAction = state.diagnosticsOpen
      ? "diagnostics:open"
      : "diagnostics:close";
    renderDiagnostics();
  }

  function ensureRuntimeUiReady() {
    injectStylesIfPossible();
    ensureDiagnosticsPanel();
    renderDiagnostics();
  }

  function attachDomReadyHookIfNeeded() {
    var documentObject = getDocument();
    if (!documentObject || typeof documentObject.addEventListener !== "function" || state.domReadyHookAttached) {
      return false;
    }

    if (documentObject.readyState && documentObject.readyState !== "loading") {
      ensureRuntimeUiReady();
      return true;
    }

    documentObject.addEventListener("DOMContentLoaded", function onDocumentReady() {
      ensureRuntimeUiReady();
    });
    state.domReadyHookAttached = true;
    return true;
  }

  function handleKeydown(event) {
    state.lastKey = normalizeKeyEvent(event);
    state.lastConsumedAction = null;

    if (isDiagnosticsToggleKey(state.lastKey.key)) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }

      setDiagnosticsOpen(!state.diagnosticsOpen);
      return;
    }

    if (state.diagnosticsOpen && (state.lastKey.key === "Back" || state.lastKey.code === "BrowserBack")) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }

      setDiagnosticsOpen(false);
      return;
    }

    renderDiagnostics();
  }

  function attachKeyListener() {
    var documentObject = getDocument();
    if (!documentObject || typeof documentObject.addEventListener !== "function" || state.keyListenerAttached) {
      return false;
    }

    documentObject.addEventListener("keydown", handleKeydown);
    state.keyListenerAttached = true;
    return true;
  }

  function init() {
    if (!state.initTime) {
      state.initTime = now();
    }

    refreshApiAvailability();
    injectStylesIfPossible();
    registerOptionalKeys();
    attachKeyListener();
    attachDomReadyHookIfNeeded();
    ensureRuntimeUiReady();

    state.initialized = true;
    runtimeApi.initialized = true;

    return {
      registeredKeys: state.registeredKeys.slice()
    };
  }

  runtimeApi.initialized = false;
  runtimeApi.init = init;
  runtimeApi.injectStylesIfPossible = injectStylesIfPossible;
  runtimeApi.registerOptionalKeys = registerOptionalKeys;
  runtimeApi.getState = getState;
  runtimeApi.renderDiagnostics = renderDiagnostics;

  globalScope[NAMESPACE] = runtimeApi;
  init();
})(typeof globalThis !== "undefined" ? globalThis : window);
