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

  var genericRoleMap = [
    { role: "app-navigation", selector: "nav a, header nav a, [class*='nav'] a, [class*='menu'] a" },
    { role: "content-card", selector: "[class*='card'], [class*='poster'], [class*='tile'], [data-testid*='card']" },
    { role: "dialog-action", selector: "[role='dialog'] button, [role='dialog'] a, [aria-modal='true'] button, [aria-modal='true'] a" },
    { role: "player-control", selector: "[class*='player'] button, [class*='controls'] button, [class*='controls'] a" },
    { role: "subtitles-button", selector: "[aria-label*='subtitle'], [aria-label*='caption'], [class*='subtitle'], [class*='caption']" },
    { role: "seekbar-track", selector: "[role='slider'], [class*='seek']" }
  ];

  var candidateCacheDurationMs = 200;

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
      domReadyHookAttached: false,
      currentFocusRole: null,
      candidateCount: 0
    };
  }

  var runtimeApi = globalScope[NAMESPACE] || {};
  var state = createInitialState();
  var currentFocusedElement = null;
  var candidateCache = {
    timestamp: 0,
    items: []
  };

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

  function clearDataAttribute(element, attributeName) {
    if (!element) {
      return;
    }

    if (typeof element.removeAttribute === "function") {
      element.removeAttribute(attributeName);
      return;
    }

    if (element.dataset) {
      delete element.dataset[toDataKey(attributeName)];
    }
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
    var i;

    for (i = 0; i < failedKeys.length; i += 1) {
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
      diagnosticsOpen: state.diagnosticsOpen,
      currentFocusRole: state.currentFocusRole,
      candidateCount: state.candidateCount
    };
  }

  function getInputDeviceApi() {
    var tizenObject = globalScope && globalScope.tizen;
    var inputdevice;

    if (!tizenObject) {
      return null;
    }

    inputdevice = tizenObject.tvinputdevice || tizenObject.inputdevice;
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
    var existingStyle;
    var style;

    if (!documentObject || !documentObject.head) {
      refreshApiAvailability();
      return false;
    }

    existingStyle = typeof documentObject.querySelector === "function"
      ? documentObject.querySelector("style[data-stremio-remote-style='1']")
      : null;

    if (existingStyle) {
      state.styleInjected = true;
      refreshApiAvailability();
      return true;
    }

    style = documentObject.createElement("style");
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
    var i;
    var keyName;

    state.registeredKeys = [];
    state.failedKeys = [];
    refreshApiAvailability();

    if (!inputdevice) {
      return [];
    }

    for (i = 0; i < keys.length; i += 1) {
      keyName = keys[i];
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
    var tagName;
    var role;

    if (!target) {
      return false;
    }

    if (target.isContentEditable === true || target.contentEditable === "true") {
      return true;
    }

    tagName = typeof target.tagName === "string" ? target.tagName.toLowerCase() : "";
    if (tagName === "input" || tagName === "textarea" || tagName === "select") {
      return true;
    }

    if (typeof target.getAttribute === "function") {
      role = target.getAttribute("role");
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
    var i;

    for (i = 0; i < diagnosticsToggleKeys.length; i += 1) {
      if (diagnosticsToggleKeys[i] === keyName) {
        return true;
      }
    }

    return false;
  }

  function ensureDiagnosticsPanel() {
    var documentObject = getDocument();
    var existingPanel;
    var panel;
    var panelBody;

    if (!documentObject || !documentObject.body || typeof documentObject.createElement !== "function") {
      refreshApiAvailability();
      return null;
    }

    existingPanel = findDiagnosticsPanel();
    if (existingPanel) {
      state.diagnosticsPanelCreated = true;
      refreshApiAvailability();
      return existingPanel;
    }

    panel = documentObject.createElement("aside");
    setDataAttribute(panel, "data-stremio-remote-diagnostics-panel", "1");
    setDataAttribute(panel, "data-open", "false");
    setAttributeIfPossible(panel, "aria-hidden", "true");

    panelBody = documentObject.createElement("pre");
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
    var formatted;
    var i;

    if (!failedKeys.length) {
      return "(none)";
    }

    formatted = [];
    for (i = 0; i < failedKeys.length; i += 1) {
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
      "Current focus role: " + (snapshot.currentFocusRole || "(none)"),
      "Candidate count: " + String(snapshot.candidateCount),
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
    var panelBody;

    if (!panel) {
      return false;
    }

    setDataAttribute(panel, "data-open", state.diagnosticsOpen ? "true" : "false");
    setAttributeIfPossible(panel, "aria-hidden", state.diagnosticsOpen ? "false" : "true");

    panelBody = findDiagnosticsBody(panel);
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

  function getChildren(element) {
    var children = element && element.children ? element.children : null;
    var result = [];
    var i;

    if (!children || typeof children.length !== "number") {
      return result;
    }

    for (i = 0; i < children.length; i += 1) {
      result.push(children[i]);
    }

    return result;
  }

  function collectTreeElements(root, output) {
    var children;
    var i;

    if (!root) {
      return;
    }

    children = getChildren(root);
    for (i = 0; i < children.length; i += 1) {
      output.push(children[i]);
      collectTreeElements(children[i], output);
    }
  }

  function getElementAttribute(element, name) {
    if (!element || typeof element.getAttribute !== "function") {
      return null;
    }

    return element.getAttribute(name);
  }

  function getElementRect(element) {
    var rect;

    if (!element || typeof element.getBoundingClientRect !== "function") {
      return {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0
      };
    }

    rect = element.getBoundingClientRect();
    return {
      left: typeof rect.left === "number" ? rect.left : 0,
      top: typeof rect.top === "number" ? rect.top : 0,
      right: typeof rect.right === "number" ? rect.right : (typeof rect.left === "number" && typeof rect.width === "number" ? rect.left + rect.width : 0),
      bottom: typeof rect.bottom === "number" ? rect.bottom : (typeof rect.top === "number" && typeof rect.height === "number" ? rect.top + rect.height : 0),
      width: typeof rect.width === "number" ? rect.width : 0,
      height: typeof rect.height === "number" ? rect.height : 0
    };
  }

  function getComputedStyleSafe(element) {
    if (!globalScope || typeof globalScope.getComputedStyle !== "function" || !element) {
      return null;
    }

    try {
      return globalScope.getComputedStyle(element);
    } catch (_error) {
      return null;
    }
  }

  function isModuleOwnedElement(element) {
    var current = element;

    while (current) {
      if (current.dataset && (
        current.dataset.stremioRemoteDiagnosticsPanel === "1" ||
        current.dataset.stremioRemoteDiagnosticsBody === "1"
      )) {
        return true;
      }
      current = current.parentNode || null;
    }

    return false;
  }

  function getNonNegativeTabIndex(element) {
    var attributeValue;
    var parsed;

    if (!element) {
      return null;
    }

    if (typeof element.tabIndex === "number") {
      return element.tabIndex >= 0 ? element.tabIndex : null;
    }

    attributeValue = getElementAttribute(element, "tabindex");
    if (attributeValue === null || attributeValue === "") {
      return null;
    }

    parsed = parseInt(attributeValue, 10);
    return parsed >= 0 ? parsed : null;
  }

  function elementMatchesSelector(element, selector) {
    if (!element || typeof selector !== "string") {
      return false;
    }

    if (typeof element.matches === "function") {
      try {
        return element.matches(selector);
      } catch (_error) {
        return false;
      }
    }

    return false;
  }

  function getElementRoleHint(element) {
    var i;
    var attributeRole;
    var className;
    var id;
    var combinedName;

    for (i = 0; i < genericRoleMap.length; i += 1) {
      if (elementMatchesSelector(element, genericRoleMap[i].selector)) {
        return genericRoleMap[i].role;
      }
    }

    attributeRole = getElementAttribute(element, "role");
    className = typeof element.className === "string" ? element.className.toLowerCase() : "";
    id = typeof element.id === "string" ? element.id.toLowerCase() : "";
    combinedName = className + " " + id;

    if (attributeRole === "button") {
      return "button";
    }
    if (combinedName.indexOf("dialog") >= 0 || combinedName.indexOf("modal") >= 0) {
      return "dialog-action";
    }
    if (combinedName.indexOf("player") >= 0 || combinedName.indexOf("control") >= 0) {
      return "player-control";
    }
    if (combinedName.indexOf("nav") >= 0 || combinedName.indexOf("menu") >= 0) {
      return "app-navigation";
    }
    if (combinedName.indexOf("card") >= 0 || combinedName.indexOf("poster") >= 0 || combinedName.indexOf("tile") >= 0) {
      return "content-card";
    }

    return null;
  }

  function getGenericCandidateRole(element) {
    var tagName = typeof element.tagName === "string" ? element.tagName.toLowerCase() : "";

    if (tagName === "a") {
      return "link";
    }
    if (tagName === "button") {
      return "button";
    }
    if (getElementAttribute(element, "role") === "button") {
      return "button";
    }
    if (getNonNegativeTabIndex(element) !== null) {
      return "focusable";
    }

    return null;
  }

  function isGenericCandidateElement(element) {
    var tagName = typeof element.tagName === "string" ? element.tagName.toLowerCase() : "";
    var href = getElementAttribute(element, "href");

    if (tagName === "a" && href) {
      return true;
    }
    if (tagName === "button") {
      return true;
    }
    if (getElementAttribute(element, "role") === "button") {
      return true;
    }
    if (getNonNegativeTabIndex(element) !== null) {
      return true;
    }

    return false;
  }

  function isElementVisible(element) {
    var rect = getElementRect(element);
    var computedStyle = getComputedStyleSafe(element);

    if (!element || isModuleOwnedElement(element)) {
      return false;
    }
    if (element.hidden === true) {
      return false;
    }
    if (element.disabled === true || getElementAttribute(element, "aria-disabled") === "true") {
      return false;
    }
    if (getElementAttribute(element, "aria-hidden") === "true") {
      return false;
    }
    if (isEditableTarget(element)) {
      return false;
    }
    if (computedStyle && (computedStyle.display === "none" || computedStyle.visibility === "hidden")) {
      return false;
    }
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    return true;
  }

  function collectCandidates(forceRefresh) {
    var documentObject = getDocument();
    var elements = [];
    var seen = [];
    var candidates = [];
    var role;
    var candidate;
    var i;
    var element;
    var activeElement;

    if (!forceRefresh && candidateCache.items.length && (now() - candidateCache.timestamp) < candidateCacheDurationMs) {
      state.candidateCount = candidateCache.items.length;
      return candidateCache.items;
    }

    if (!documentObject || !documentObject.body) {
      candidateCache.items = [];
      candidateCache.timestamp = now();
      state.candidateCount = 0;
      return candidateCache.items;
    }

    collectTreeElements(documentObject.body, elements);
    activeElement = documentObject.activeElement;

    for (i = 0; i < elements.length; i += 1) {
      element = elements[i];
      if (seen.indexOf(element) >= 0) {
        continue;
      }
      if (!isGenericCandidateElement(element)) {
        continue;
      }
      if (!isElementVisible(element)) {
        continue;
      }
      if (activeElement && activeElement === element && isEditableTarget(activeElement)) {
        continue;
      }

      role = getElementRoleHint(element) || getGenericCandidateRole(element) || "focusable";
      candidate = {
        element: element,
        role: role,
        rect: getElementRect(element),
        order: candidates.length
      };

      seen.push(element);
      candidates.push(candidate);
    }

    candidateCache.items = candidates;
    candidateCache.timestamp = now();
    state.candidateCount = candidates.length;
    return candidates;
  }

  function clearCurrentFocus() {
    if (currentFocusedElement) {
      clearDataAttribute(currentFocusedElement, "data-stremio-remote-focus");
    }

    currentFocusedElement = null;
    state.currentFocusRole = null;
  }

  function findCandidateByElement(candidates, element) {
    var i;

    for (i = 0; i < candidates.length; i += 1) {
      if (candidates[i].element === element) {
        return candidates[i];
      }
    }

    return null;
  }

  function focusElementIfSafe(element) {
    if (!element || typeof element.focus !== "function" || isEditableTarget(element)) {
      return;
    }

    try {
      element.focus({ preventScroll: true });
    } catch (_error) {
      try {
        element.focus();
      } catch (_nestedError) {
        // No-op: focus is best effort.
      }
    }
  }

  function scrollElementIntoViewIfNeeded(element, rect) {
    var viewportWidth = typeof globalScope.innerWidth === "number" ? globalScope.innerWidth : 0;
    var viewportHeight = typeof globalScope.innerHeight === "number" ? globalScope.innerHeight : 0;
    var needsScroll;

    if (!element || typeof element.scrollIntoView !== "function") {
      return;
    }

    if (!viewportWidth || !viewportHeight) {
      return;
    }

    needsScroll = rect.top < 0 || rect.left < 0 || rect.bottom > viewportHeight || rect.right > viewportWidth;
    if (!needsScroll) {
      return;
    }

    try {
      element.scrollIntoView({
        block: "nearest",
        inline: "nearest"
      });
    } catch (_error) {
      try {
        element.scrollIntoView();
      } catch (_nestedError) {
        // No-op: scroll is best effort.
      }
    }
  }

  function applyFocus(candidate) {
    if (!candidate) {
      clearCurrentFocus();
      return false;
    }

    if (currentFocusedElement && currentFocusedElement !== candidate.element) {
      clearDataAttribute(currentFocusedElement, "data-stremio-remote-focus");
    }

    setDataAttribute(candidate.element, "data-stremio-remote-focus", "true");
    currentFocusedElement = candidate.element;
    state.currentFocusRole = candidate.role;

    focusElementIfSafe(candidate.element);
    scrollElementIntoViewIfNeeded(candidate.element, candidate.rect);
    return true;
  }

  function getRectCenter(rect) {
    return {
      x: rect.left + (rect.width / 2),
      y: rect.top + (rect.height / 2)
    };
  }

  function getDirectionalMetrics(currentRect, candidateRect, direction) {
    var currentCenter = getRectCenter(currentRect);
    var candidateCenter = getRectCenter(candidateRect);
    var majorDistance;
    var crossDistance;
    var overlap;

    if (direction === "ArrowRight") {
      majorDistance = candidateCenter.x - currentCenter.x;
      crossDistance = Math.abs(candidateCenter.y - currentCenter.y);
      overlap = Math.min(currentRect.bottom, candidateRect.bottom) - Math.max(currentRect.top, candidateRect.top);
    } else if (direction === "ArrowLeft") {
      majorDistance = currentCenter.x - candidateCenter.x;
      crossDistance = Math.abs(candidateCenter.y - currentCenter.y);
      overlap = Math.min(currentRect.bottom, candidateRect.bottom) - Math.max(currentRect.top, candidateRect.top);
    } else if (direction === "ArrowDown") {
      majorDistance = candidateCenter.y - currentCenter.y;
      crossDistance = Math.abs(candidateCenter.x - currentCenter.x);
      overlap = Math.min(currentRect.right, candidateRect.right) - Math.max(currentRect.left, candidateRect.left);
    } else {
      majorDistance = currentCenter.y - candidateCenter.y;
      crossDistance = Math.abs(candidateCenter.x - currentCenter.x);
      overlap = Math.min(currentRect.right, candidateRect.right) - Math.max(currentRect.left, candidateRect.left);
    }

    return {
      majorDistance: majorDistance,
      crossDistance: crossDistance,
      overlap: overlap > 0 ? overlap : 0
    };
  }

  function passesDirectionalGate(currentRect, candidateRect, direction) {
    if (direction === "ArrowRight") {
      return candidateRect.left >= currentRect.right;
    }
    if (direction === "ArrowLeft") {
      return candidateRect.right <= currentRect.left;
    }
    if (direction === "ArrowDown") {
      return candidateRect.top >= currentRect.bottom;
    }

    return candidateRect.bottom <= currentRect.top;
  }

  function pickDirectionalCandidate(candidates, currentCandidate, direction) {
    var bestCandidate = null;
    var bestScore = Infinity;
    var i;
    var candidate;
    var metrics;
    var score;

    for (i = 0; i < candidates.length; i += 1) {
      candidate = candidates[i];
      if (candidate.element === currentCandidate.element) {
        continue;
      }
      if (!passesDirectionalGate(currentCandidate.rect, candidate.rect, direction)) {
        continue;
      }

      metrics = getDirectionalMetrics(currentCandidate.rect, candidate.rect, direction);
      if (metrics.majorDistance <= 0) {
        continue;
      }

      score = (metrics.majorDistance * 10000) + (metrics.crossDistance * 100) - Math.min(metrics.overlap, 99);
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  function pickDomOrderFallback(candidates, currentCandidate, direction) {
    var step = (direction === "ArrowRight" || direction === "ArrowDown") ? 1 : -1;
    var nextIndex = currentCandidate.order + step;

    if (nextIndex < 0 || nextIndex >= candidates.length) {
      return null;
    }

    return candidates[nextIndex];
  }

  function moveFocus(direction) {
    var candidates = collectCandidates(false);
    var currentCandidate;
    var nextCandidate;

    if (!candidates.length) {
      clearCurrentFocus();
      state.candidateCount = 0;
      return false;
    }

    currentCandidate = findCandidateByElement(candidates, currentFocusedElement);
    if (!currentCandidate) {
      applyFocus(candidates[0]);
      state.lastConsumedAction = "focus:seed:" + candidates[0].role;
      return true;
    }

    nextCandidate = pickDirectionalCandidate(candidates, currentCandidate, direction);
    if (!nextCandidate) {
      nextCandidate = pickDomOrderFallback(candidates, currentCandidate, direction);
    }

    if (!nextCandidate) {
      return false;
    }

    applyFocus(nextCandidate);
    state.lastConsumedAction = "focus:move:" + direction + ":" + nextCandidate.role;
    return true;
  }

  function activateFocusedCandidate() {
    var candidates = collectCandidates(false);
    var currentCandidate = findCandidateByElement(candidates, currentFocusedElement);

    if (!currentCandidate) {
      return false;
    }

    if (typeof currentCandidate.element.click === "function") {
      currentCandidate.element.click();
      state.lastConsumedAction = "activate:" + currentCandidate.role;
      return true;
    }

    return false;
  }

  function isEditableContext(event) {
    var documentObject = getDocument();

    if (event && event.target && isEditableTarget(event.target)) {
      return true;
    }
    if (documentObject && documentObject.activeElement && isEditableTarget(documentObject.activeElement)) {
      return true;
    }

    return false;
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

    if (isEditableContext(event)) {
      renderDiagnostics();
      return;
    }

    if (
      state.lastKey.key === "ArrowLeft" ||
      state.lastKey.key === "ArrowRight" ||
      state.lastKey.key === "ArrowUp" ||
      state.lastKey.key === "ArrowDown"
    ) {
      if (moveFocus(state.lastKey.key)) {
        if (event && typeof event.preventDefault === "function") {
          event.preventDefault();
        }
        if (event && typeof event.stopPropagation === "function") {
          event.stopPropagation();
        }
      }
      renderDiagnostics();
      return;
    }

    if (state.lastKey.key === "Enter") {
      if (activateFocusedCandidate()) {
        if (event && typeof event.preventDefault === "function") {
          event.preventDefault();
        }
        if (event && typeof event.stopPropagation === "function") {
          event.stopPropagation();
        }
      }
      renderDiagnostics();
      return;
    }

    renderDiagnostics();
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
    collectCandidates(true);

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
