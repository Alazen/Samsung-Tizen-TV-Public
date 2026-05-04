(function bootstrapStremioTizenBrew(globalScope) {
  "use strict";

  var NAMESPACE = "__STREMIO_TIZENBREW_REMOTE__";
  var RUNTIME_VERSION = "0.1.1";
  var RUNTIME_SOURCE_MARKER = "stremio-webapp-src-main-js-task4e-v1";
  var RUNTIME_INJECTION_MARKER = "stremio-webapp-runtime-injection-v1";
  var FOCUS_ATTRIBUTE = "data-stremio-remote-focus";
  var STYLE_ATTRIBUTE = "data-stremio-remote-style";
  var DIAGNOSTICS_ATTRIBUTE = "data-stremio-remote-diagnostics-panel";
  var DIAGNOSTICS_BODY_ATTRIBUTE = "data-stremio-remote-diagnostics-body";
  var EXIT_MODAL_ATTRIBUTE = "data-stremio-remote-exit-modal";
  var EXIT_BUTTON_ATTRIBUTE = "data-stremio-remote-exit-button";
  var DUPLICATE_EVENT_WINDOW_MS = 220;
  var FOCUS_CACHE_MS = 160;
  var SEEK_STEP_SECONDS = 15;

  if (globalScope[NAMESPACE] && globalScope[NAMESPACE].initialized) {
    return;
  }

  var optionalKeys = [
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

  var diagnosticsKeys = {
    Info: true,
    ColorF0Red: true,
    ColorF1Green: true,
    ColorF2Yellow: true,
    ColorF3Blue: true
  };

  var keyCodeMap = {
    13: "Enter",
    19: "MediaPause",
    27: "Back",
    32: "Enter",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    403: "ColorF0Red",
    404: "ColorF1Green",
    405: "ColorF2Yellow",
    406: "ColorF3Blue",
    412: "MediaRewind",
    413: "MediaStop",
    415: "MediaPlay",
    417: "MediaFastForward",
    457: "Info",
    10009: "Back",
    10252: "MediaPlayPause"
  };

  var keyAliasMap = {
    Left: "ArrowLeft",
    Right: "ArrowRight",
    Up: "ArrowUp",
    Down: "ArrowDown",
    Return: "Back",
    Escape: "Back",
    Backspace: "Back",
    XF86Back: "Back",
    Play: "MediaPlay",
    Pause: "MediaPause",
    MediaPlayPause: "MediaPlayPause",
    MediaPlay: "MediaPlay",
    MediaPause: "MediaPause",
    MediaStop: "MediaStop",
    MediaFastForward: "MediaFastForward",
    MediaRewind: "MediaRewind",
    FastForward: "MediaFastForward",
    Rewind: "MediaRewind",
    Red: "ColorF0Red",
    Green: "ColorF1Green",
    Yellow: "ColorF2Yellow",
    Blue: "ColorF3Blue",
    ColorF0Red: "ColorF0Red",
    ColorF1Green: "ColorF1Green",
    ColorF2Yellow: "ColorF2Yellow",
    ColorF3Blue: "ColorF3Blue"
  };

  var candidateSelectors = [
    "button",
    "a[href]",
    "input",
    "textarea",
    "select",
    "label",
    "summary",
    "[role='button']",
    "[role='link']",
    "[role='menuitem']",
    "[role='checkbox']",
    "[role='tab']",
    "[tabindex]",
    "[onclick]",
    "[data-testid]",
    "[class*='button']",
    "[class*='Button']",
    "[class*='btn']",
    "[class*='card']",
    "[class*='Card']",
    "[class*='poster']",
    "[class*='Poster']",
    "[class*='tile']",
    "[class*='Tile']",
    "[class*='nav']",
    "[class*='Nav']",
    "[class*='menu']",
    "[class*='Menu']",
    "[class*='control']",
    "[class*='Control']",
    "[class*='login']",
    "[class*='Login']",
    "[class*='signup']",
    "[class*='Signup']",
    "[class*='auth']",
    "[class*='Auth']"
  ].join(",");

  var state = {
    initialized: false,
    version: RUNTIME_VERSION,
    sourceMarker: RUNTIME_SOURCE_MARKER,
    injectionMarker: RUNTIME_INJECTION_MARKER,
    initTime: null,
    registeredKeys: [],
    failedKeys: [],
    listenerPaths: [],
    apiAvailability: {},
    diagnosticsOpen: false,
    diagnosticsPanelCreated: false,
    styleInjected: false,
    exitModalCreated: false,
    exitModalOpen: false,
    keyListenerAttached: false,
    domReadyHookAttached: false,
    currentFocusRole: null,
    currentFocusText: "",
    candidateCount: 0,
    lastRawEvent: null,
    lastKey: null,
    lastAction: null,
    lastConsumedAction: null,
    lastBackResolution: null,
    lastExitAttempt: null,
    lastExitResult: null,
    lastVideoState: null,
    lastPlayerActionResult: null,
    initialPath: "",
    initialHistoryLength: null
  };

  var currentFocusedElement = null;
  var previousFocusBeforeExitModal = null;
  var candidateCache = {
    timestamp: 0,
    items: []
  };
  var lastHandled = {
    signature: "",
    timestamp: 0
  };

  function getDocument() {
    return globalScope && globalScope.document ? globalScope.document : null;
  }

  function now() {
    return typeof Date.now === "function" ? Date.now() : new Date().getTime();
  }

  function toLower(value) {
    return typeof value === "string" ? value.toLowerCase() : "";
  }

  function trimText(value) {
    if (typeof value !== "string") {
      return "";
    }
    return value.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").slice(0, 80);
  }

  function getLocationPath() {
    if (!globalScope || !globalScope.location) {
      return "";
    }
    return globalScope.location.pathname || globalScope.location.href || "";
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function setAttribute(element, name, value) {
    if (!element) {
      return;
    }
    if (typeof element.setAttribute === "function") {
      element.setAttribute(name, String(value));
      return;
    }
    element[name] = String(value);
  }

  function removeAttribute(element, name) {
    if (!element) {
      return;
    }
    if (typeof element.removeAttribute === "function") {
      element.removeAttribute(name);
    }
  }

  function getAttribute(element, name) {
    if (!element || typeof element.getAttribute !== "function") {
      return null;
    }
    return element.getAttribute(name);
  }

  function elementMatches(element, selector) {
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

  function isInsideModuleUi(element) {
    var current = element;
    while (current) {
      if (getAttribute(current, DIAGNOSTICS_ATTRIBUTE) === "1" ||
          getAttribute(current, DIAGNOSTICS_BODY_ATTRIBUTE) === "1" ||
          getAttribute(current, EXIT_MODAL_ATTRIBUTE) === "1" ||
          getAttribute(current, EXIT_BUTTON_ATTRIBUTE) === "1") {
        return true;
      }
      current = current.parentNode || null;
    }
    return false;
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
      application: Boolean(tizenObject && tizenObject.application && typeof tizenObject.application.getCurrentApplication === "function"),
      mutationObserver: typeof globalScope.MutationObserver === "function",
      requestAnimationFrame: typeof globalScope.requestAnimationFrame === "function"
    };
  }

  function refreshApiAvailability() {
    state.apiAvailability = collectApiAvailability();
    return state.apiAvailability;
  }

  function getInputDeviceApi() {
    var tizenObject = globalScope && globalScope.tizen;
    var inputDevice;
    if (!tizenObject) {
      return null;
    }
    inputDevice = tizenObject.tvinputdevice || tizenObject.inputdevice;
    if (!inputDevice || typeof inputDevice.registerKey !== "function") {
      return null;
    }
    return inputDevice;
  }

  function recordFailedKey(keyName, error) {
    state.failedKeys.push({
      keyName: keyName,
      message: error && error.message ? error.message : String(error)
    });
  }

  function registerOptionalKeys() {
    var inputDevice = getInputDeviceApi();
    var i;
    var keyName;
    state.registeredKeys = [];
    state.failedKeys = [];
    refreshApiAvailability();
    if (!inputDevice) {
      return [];
    }
    for (i = 0; i < optionalKeys.length; i += 1) {
      keyName = optionalKeys[i];
      try {
        inputDevice.registerKey(keyName);
        state.registeredKeys.push(keyName);
      } catch (error) {
        recordFailedKey(keyName, error);
      }
    }
    return state.registeredKeys.slice();
  }

  function injectStyles() {
    var documentObject = getDocument();
    var style;
    if (!documentObject || !documentObject.head || typeof documentObject.createElement !== "function") {
      refreshApiAvailability();
      return false;
    }
    if (documentObject.querySelector && documentObject.querySelector("style[" + STYLE_ATTRIBUTE + "='1']")) {
      state.styleInjected = true;
      return true;
    }
    style = documentObject.createElement("style");
    style.type = "text/css";
    setAttribute(style, STYLE_ATTRIBUTE, "1");
    style.appendChild(documentObject.createTextNode([
      ":root { --stremio-remote-focus-outline: #20c997; }",
      "[" + FOCUS_ATTRIBUTE + "='true'] { outline: 3px solid var(--stremio-remote-focus-outline); outline-offset: 3px; border-radius: 6px; }",
      "[" + DIAGNOSTICS_ATTRIBUTE + "='1'] { position: fixed; top: 14px; right: 14px; z-index: 2147483647; width: min(520px, calc(100vw - 28px)); max-height: calc(100vh - 28px); overflow: auto; padding: 12px 14px; border: 1px solid rgba(32,201,151,.6); border-radius: 10px; background: rgba(5,10,18,.94); color: #f4fff9; font: 12px/1.45 Consolas, 'Courier New', monospace; white-space: pre-wrap; display: none; box-shadow: 0 12px 32px rgba(0,0,0,.4); }",
      "[" + DIAGNOSTICS_ATTRIBUTE + "='1'][data-open='true'] { display: block; }",
      "[" + DIAGNOSTICS_BODY_ATTRIBUTE + "='1'] { margin: 0; }",
      "[" + EXIT_MODAL_ATTRIBUTE + "='1'] { position: fixed; inset: 0; z-index: 2147483646; display: none; align-items: center; justify-content: center; background: rgba(2,7,12,.38); }",
      "[" + EXIT_MODAL_ATTRIBUTE + "='1'][data-open='true'] { display: flex; }",
      "[data-stremio-remote-exit-dialog='1'] { width: min(420px, calc(100vw - 48px)); padding: 20px; border-radius: 14px; background: rgba(7,15,24,.96); color: #f4fff9; font: 16px/1.4 system-ui, sans-serif; }",
      "[data-stremio-remote-exit-actions='1'] { display: flex; gap: 12px; margin-top: 16px; }",
      "[" + EXIT_BUTTON_ATTRIBUTE + "='1'] { min-width: 136px; padding: 10px 14px; border: 1px solid rgba(255,255,255,.2); border-radius: 10px; background: rgba(255,255,255,.08); color: inherit; font: inherit; }"
    ].join("\n")));
    documentObject.head.appendChild(style);
    state.styleInjected = true;
    refreshApiAvailability();
    return true;
  }

  function findDiagnosticsPanel() {
    var documentObject = getDocument();
    if (!documentObject || typeof documentObject.querySelector !== "function") {
      return null;
    }
    return documentObject.querySelector("[" + DIAGNOSTICS_ATTRIBUTE + "='1']");
  }

  function ensureDiagnosticsPanel() {
    var documentObject = getDocument();
    var panel;
    var body;
    if (!documentObject || !documentObject.body || typeof documentObject.createElement !== "function") {
      refreshApiAvailability();
      return null;
    }
    panel = findDiagnosticsPanel();
    if (panel) {
      state.diagnosticsPanelCreated = true;
      return panel;
    }
    panel = documentObject.createElement("aside");
    setAttribute(panel, DIAGNOSTICS_ATTRIBUTE, "1");
    setAttribute(panel, "data-open", "false");
    setAttribute(panel, "aria-hidden", "true");
    body = documentObject.createElement("pre");
    setAttribute(body, DIAGNOSTICS_BODY_ATTRIBUTE, "1");
    panel.appendChild(body);
    documentObject.body.appendChild(panel);
    state.diagnosticsPanelCreated = true;
    refreshApiAvailability();
    return panel;
  }

  function findDiagnosticsBody(panel) {
    if (!panel || typeof panel.querySelector !== "function") {
      return null;
    }
    return panel.querySelector("[" + DIAGNOSTICS_BODY_ATTRIBUTE + "='1']");
  }

  function findExitModal() {
    var documentObject = getDocument();
    if (!documentObject || typeof documentObject.querySelector !== "function") {
      return null;
    }
    return documentObject.querySelector("[" + EXIT_MODAL_ATTRIBUTE + "='1']");
  }

  function ensureExitModal() {
    var documentObject = getDocument();
    var modal;
    var dialog;
    var text;
    var actions;
    var keepButton;
    var endButton;
    if (!documentObject || !documentObject.body || typeof documentObject.createElement !== "function") {
      return null;
    }
    modal = findExitModal();
    if (modal) {
      state.exitModalCreated = true;
      return modal;
    }
    modal = documentObject.createElement("div");
    setAttribute(modal, EXIT_MODAL_ATTRIBUTE, "1");
    setAttribute(modal, "data-open", "false");
    setAttribute(modal, "aria-hidden", "true");
    dialog = documentObject.createElement("div");
    setAttribute(dialog, "data-stremio-remote-exit-dialog", "1");
    setAttribute(dialog, "role", "dialog");
    setAttribute(dialog, "aria-modal", "true");
    text = documentObject.createElement("div");
    text.textContent = "Leave Stremio?";
    actions = documentObject.createElement("div");
    setAttribute(actions, "data-stremio-remote-exit-actions", "1");
    keepButton = documentObject.createElement("button");
    keepButton.textContent = "Keep watching";
    setAttribute(keepButton, EXIT_BUTTON_ATTRIBUTE, "1");
    keepButton.onclick = function onKeepWatching() {
      closeExitModal("keep-watching");
    };
    endButton = documentObject.createElement("button");
    endButton.textContent = "End the app";
    setAttribute(endButton, EXIT_BUTTON_ATTRIBUTE, "1");
    endButton.onclick = function onEndApp() {
      attemptAppExit();
    };
    actions.appendChild(keepButton);
    actions.appendChild(endButton);
    dialog.appendChild(text);
    dialog.appendChild(actions);
    modal.appendChild(dialog);
    documentObject.body.appendChild(modal);
    state.exitModalCreated = true;
    return modal;
  }

  function findVisibleVideos() {
    var documentObject = getDocument();
    var videos;
    var result = [];
    var i;
    if (!documentObject || typeof documentObject.querySelectorAll !== "function") {
      return result;
    }
    videos = documentObject.querySelectorAll("video");
    for (i = 0; i < videos.length; i += 1) {
      if (isVisible(videos[i])) {
        result.push(videos[i]);
      }
    }
    return result;
  }

  function getPrimaryVideo() {
    var videos = findVisibleVideos();
    var best = null;
    var bestArea = -1;
    var i;
    var rect;
    var area;
    for (i = 0; i < videos.length; i += 1) {
      rect = getRect(videos[i]);
      area = rect.width * rect.height;
      if (!best || area > bestArea) {
        best = videos[i];
        bestArea = area;
      }
    }
    return best;
  }

  function copyVideoState(video) {
    if (!video) {
      return {
        found: false
      };
    }
    return {
      found: true,
      paused: Boolean(video.paused),
      ended: Boolean(video.ended),
      currentTime: typeof video.currentTime === "number" ? video.currentTime : null,
      duration: typeof video.duration === "number" && isFinite(video.duration) ? video.duration : null,
      muted: Boolean(video.muted)
    };
  }

  function refreshVideoState() {
    state.lastVideoState = copyVideoState(getPrimaryVideo());
    return state.lastVideoState;
  }

  function formatVideoState(videoState) {
    if (!videoState || !videoState.found) {
      return "found=false";
    }
    return "found=true, paused=" + String(videoState.paused) +
      ", time=" + String(videoState.currentTime) +
      ", duration=" + String(videoState.duration);
  }

  function buildDiagnosticsText() {
    var api = refreshApiAvailability();
    var videoState = refreshVideoState();
    var raw = state.lastRawEvent || {};
    return [
      "Stremio Web TV Remote Diagnostics",
      "Version: " + RUNTIME_VERSION,
      "Source marker: " + RUNTIME_SOURCE_MARKER,
      "Injection marker: " + RUNTIME_INJECTION_MARKER,
      "Path: " + getLocationPath(),
      "Initialized: " + String(state.initialized),
      "Init time: " + String(state.initTime),
      "Diagnostics open: " + String(state.diagnosticsOpen),
      "Candidate count: " + String(state.candidateCount),
      "Current focus role: " + (state.currentFocusRole || "(none)"),
      "Current focus text: " + (state.currentFocusText || "(none)"),
      "Last event path: " + (raw.path || "(none)"),
      "Last event type: " + (raw.type || "(none)"),
      "Last raw key: " + (raw.key || "(none)"),
      "Last raw code: " + (raw.code || "(none)"),
      "Last keyCode: " + String(raw.keyCode),
      "Last which: " + String(raw.which),
      "Last keyName: " + (raw.keyName || "(none)"),
      "Last normalized key: " + (state.lastKey ? state.lastKey.normalizedKey : "(none)"),
      "Last action: " + (state.lastAction || "(none)"),
      "Last consumed action: " + (state.lastConsumedAction || "(none)"),
      "Last Back resolution: " + (state.lastBackResolution || "(none)"),
      "Last player result: " + (state.lastPlayerActionResult || "(none)"),
      "Video: " + formatVideoState(videoState),
      "Registered keys: " + (state.registeredKeys.length ? state.registeredKeys.join(", ") : "(none)"),
      "Failed keys: " + (state.failedKeys.length ? state.failedKeys.map(function mapFailed(item) { return item.keyName + ": " + item.message; }).join(", ") : "(none)"),
      "Listeners: " + (state.listenerPaths.length ? state.listenerPaths.join(", ") : "(none)"),
      "APIs: document=" + String(api.document) + ", body=" + String(api.documentBody) + ", tizen=" + String(api.tizen) + ", tvinputdevice=" + String(api.tvInputDevice) + ", application=" + String(api.application)
    ].join("\n");
  }

  function renderDiagnostics() {
    var panel = ensureDiagnosticsPanel();
    var body;
    if (!panel) {
      return false;
    }
    setAttribute(panel, "data-open", state.diagnosticsOpen ? "true" : "false");
    setAttribute(panel, "aria-hidden", state.diagnosticsOpen ? "false" : "true");
    body = findDiagnosticsBody(panel);
    if (body) {
      body.textContent = buildDiagnosticsText();
    } else {
      panel.textContent = buildDiagnosticsText();
    }
    return true;
  }

  function setDiagnosticsOpen(isOpen) {
    state.diagnosticsOpen = Boolean(isOpen);
    state.lastConsumedAction = state.diagnosticsOpen ? "diagnostics:open" : "diagnostics:close";
    renderDiagnostics();
  }

  function toggleDiagnostics() {
    setDiagnosticsOpen(!state.diagnosticsOpen);
  }

  function openExitModal() {
    var modal = ensureExitModal();
    if (!modal) {
      return false;
    }
    previousFocusBeforeExitModal = currentFocusedElement;
    state.exitModalOpen = true;
    setAttribute(modal, "data-open", "true");
    setAttribute(modal, "aria-hidden", "false");
    state.lastConsumedAction = "exit-modal:open";
    return true;
  }

  function closeExitModal(reason) {
    var modal = findExitModal();
    state.exitModalOpen = false;
    if (modal) {
      setAttribute(modal, "data-open", "false");
      setAttribute(modal, "aria-hidden", "true");
    }
    state.lastConsumedAction = "exit-modal:close:" + (reason || "unknown");
    if (previousFocusBeforeExitModal) {
      applyFocus(previousFocusBeforeExitModal, "restore");
    }
    renderDiagnostics();
    return true;
  }

  function attemptAppExit() {
    var tizenObject = globalScope && globalScope.tizen;
    var app;
    state.lastExitAttempt = now();
    try {
      app = tizenObject && tizenObject.application && tizenObject.application.getCurrentApplication ? tizenObject.application.getCurrentApplication() : null;
      if (app && typeof app.exit === "function") {
        app.exit();
        state.lastExitResult = { ok: true, message: "tizen.application.exit called" };
        return true;
      }
    } catch (error) {
      state.lastExitResult = { ok: false, message: error && error.message ? error.message : String(error) };
      return false;
    }
    state.lastExitResult = { ok: false, message: "Tizen application exit API unavailable" };
    return false;
  }

  function isEditableTarget(element) {
    var tagName;
    var role;
    if (!element) {
      return false;
    }
    if (element.isContentEditable === true || element.contentEditable === "true") {
      return true;
    }
    tagName = toLower(element.tagName || "");
    if (tagName === "input" || tagName === "textarea" || tagName === "select") {
      return true;
    }
    role = getAttribute(element, "role");
    return role === "textbox";
  }

  function getRect(element) {
    var rect;
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    rect = element.getBoundingClientRect();
    return {
      left: typeof rect.left === "number" ? rect.left : 0,
      top: typeof rect.top === "number" ? rect.top : 0,
      right: typeof rect.right === "number" ? rect.right : 0,
      bottom: typeof rect.bottom === "number" ? rect.bottom : 0,
      width: typeof rect.width === "number" ? rect.width : 0,
      height: typeof rect.height === "number" ? rect.height : 0
    };
  }

  function isVisible(element) {
    var rect;
    var style;
    if (!element || isInsideModuleUi(element)) {
      return false;
    }
    rect = getRect(element);
    if (rect.width < 4 || rect.height < 4) {
      return false;
    }
    if (globalScope && typeof globalScope.getComputedStyle === "function") {
      try {
        style = globalScope.getComputedStyle(element);
        if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)) {
          return false;
        }
      } catch (_error) {
        return true;
      }
    }
    return true;
  }

  function isCandidate(element) {
    var tagName;
    var role;
    var tabIndex;
    if (!isVisible(element)) {
      return false;
    }
    tagName = toLower(element.tagName || "");
    role = toLower(getAttribute(element, "role") || "");
    if (tagName === "button" || tagName === "a" || tagName === "input" || tagName === "textarea" || tagName === "select" || tagName === "label" || tagName === "summary") {
      return true;
    }
    if (role === "button" || role === "link" || role === "menuitem" || role === "checkbox" || role === "tab") {
      return true;
    }
    if (typeof element.tabIndex === "number" && element.tabIndex >= 0) {
      return true;
    }
    tabIndex = getAttribute(element, "tabindex");
    if (tabIndex !== null && tabIndex !== "" && parseInt(tabIndex, 10) >= 0) {
      return true;
    }
    if (typeof element.onclick === "function") {
      return true;
    }
    return elementMatches(element, "[data-testid], [class*='button'], [class*='Button'], [class*='btn'], [class*='card'], [class*='Card'], [class*='poster'], [class*='Poster'], [class*='tile'], [class*='Tile'], [class*='nav'], [class*='Nav'], [class*='menu'], [class*='Menu'], [class*='control'], [class*='Control'], [class*='login'], [class*='Login'], [class*='signup'], [class*='Signup'], [class*='auth'], [class*='Auth']");
  }

  function getRoleHint(element) {
    var tagName = toLower(element && element.tagName || "");
    var role = toLower(getAttribute(element, "role") || "");
    var className = toLower(element && element.className || "");
    var id = toLower(element && element.id || "");
    var text = className + " " + id + " " + role;
    if (tagName === "input" || tagName === "textarea" || role === "textbox") {
      return "auth-input";
    }
    if (tagName === "button" || role === "button") {
      return "button";
    }
    if (tagName === "a" || role === "link") {
      return "link";
    }
    if (text.indexOf("player") >= 0 || text.indexOf("control") >= 0 || text.indexOf("seek") >= 0) {
      return "player-control";
    }
    if (text.indexOf("login") >= 0 || text.indexOf("signup") >= 0 || text.indexOf("auth") >= 0) {
      return "auth-control";
    }
    if (text.indexOf("card") >= 0 || text.indexOf("poster") >= 0 || text.indexOf("tile") >= 0) {
      return "content-card";
    }
    if (text.indexOf("nav") >= 0 || text.indexOf("menu") >= 0) {
      return "app-navigation";
    }
    return role || tagName || "candidate";
  }

  function collectCandidates() {
    var documentObject = getDocument();
    var selected;
    var candidates = [];
    var seen = [];
    var i;
    var element;
    if (!documentObject || typeof documentObject.querySelectorAll !== "function") {
      state.candidateCount = 0;
      return candidates;
    }
    if (candidateCache.items.length && now() - candidateCache.timestamp < FOCUS_CACHE_MS) {
      return candidateCache.items.slice();
    }
    selected = documentObject.querySelectorAll(candidateSelectors);
    for (i = 0; i < selected.length; i += 1) {
      element = selected[i];
      if (seen.indexOf(element) < 0 && isCandidate(element)) {
        seen.push(element);
        candidates.push(element);
      }
    }
    state.candidateCount = candidates.length;
    candidateCache.items = candidates.slice();
    candidateCache.timestamp = now();
    return candidates;
  }

  function invalidateCandidateCache() {
    candidateCache.items = [];
    candidateCache.timestamp = 0;
  }

  function getElementText(element) {
    var label;
    var text;
    if (!element) {
      return "";
    }
    label = getAttribute(element, "aria-label") || getAttribute(element, "title") || getAttribute(element, "placeholder") || "";
    text = label || element.textContent || element.value || "";
    return trimText(String(text));
  }

  function clearCurrentFocus() {
    if (currentFocusedElement) {
      removeAttribute(currentFocusedElement, FOCUS_ATTRIBUTE);
    }
  }

  function applyFocus(element, reason) {
    if (!element || !isVisible(element)) {
      return false;
    }
    clearCurrentFocus();
    currentFocusedElement = element;
    setAttribute(element, FOCUS_ATTRIBUTE, "true");
    state.currentFocusRole = getRoleHint(element);
    state.currentFocusText = getElementText(element);
    state.lastConsumedAction = "focus:" + (reason || "set");
    try {
      if (typeof element.focus === "function") {
        element.focus({ preventScroll: false });
      }
    } catch (_error) {
      try {
        element.focus();
      } catch (__error) {}
    }
    try {
      if (typeof element.scrollIntoView === "function") {
        element.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    } catch (_ignore) {}
    renderDiagnostics();
    return true;
  }

  function getCenter(rect) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  function directionScore(fromRect, candidateRect, direction) {
    var from = getCenter(fromRect);
    var to = getCenter(candidateRect);
    var primary;
    var secondary;
    if (direction === "ArrowLeft") {
      primary = from.x - to.x;
      secondary = Math.abs(from.y - to.y);
    } else if (direction === "ArrowRight") {
      primary = to.x - from.x;
      secondary = Math.abs(from.y - to.y);
    } else if (direction === "ArrowUp") {
      primary = from.y - to.y;
      secondary = Math.abs(from.x - to.x);
    } else {
      primary = to.y - from.y;
      secondary = Math.abs(from.x - to.x);
    }
    if (primary <= 2) {
      return Infinity;
    }
    return primary * 1000 + secondary;
  }

  function focusInitial(direction) {
    var candidates = collectCandidates();
    var index = 0;
    if (!candidates.length) {
      return false;
    }
    if (direction === "ArrowUp" || direction === "ArrowLeft") {
      index = candidates.length - 1;
    }
    return applyFocus(candidates[index], "initial");
  }

  function moveFocus(direction) {
    var candidates = collectCandidates();
    var currentRect;
    var best = null;
    var bestScore = Infinity;
    var currentIndex;
    var i;
    var score;
    if (!candidates.length) {
      state.lastConsumedAction = "focus:no-candidates";
      return false;
    }
    if (!currentFocusedElement || candidates.indexOf(currentFocusedElement) < 0 || !isVisible(currentFocusedElement)) {
      return focusInitial(direction);
    }
    currentRect = getRect(currentFocusedElement);
    for (i = 0; i < candidates.length; i += 1) {
      if (candidates[i] === currentFocusedElement) {
        continue;
      }
      score = directionScore(currentRect, getRect(candidates[i]), direction);
      if (score < bestScore) {
        best = candidates[i];
        bestScore = score;
      }
    }
    if (!best || bestScore === Infinity) {
      currentIndex = candidates.indexOf(currentFocusedElement);
      if (direction === "ArrowRight" || direction === "ArrowDown") {
        best = candidates[(currentIndex + 1) % candidates.length];
      } else {
        best = candidates[(currentIndex - 1 + candidates.length) % candidates.length];
      }
    }
    return applyFocus(best, direction);
  }

  function clickElement(element) {
    if (!element) {
      return false;
    }
    try {
      if (typeof element.click === "function") {
        element.click();
        return true;
      }
    } catch (_error) {}
    return false;
  }

  function activateFocused() {
    var element = currentFocusedElement;
    var tagName;
    var role;
    if (!element || !isVisible(element)) {
      if (!focusInitial("ArrowDown")) {
        return false;
      }
      element = currentFocusedElement;
    }
    if (!element) {
      return false;
    }
    tagName = toLower(element.tagName || "");
    role = toLower(getAttribute(element, "role") || "");
    if (tagName === "input" || tagName === "textarea" || tagName === "select" || role === "textbox") {
      try {
        if (typeof element.focus === "function") {
          element.focus();
        }
      } catch (_ignore) {}
      state.lastConsumedAction = "activate:editable-focus";
      renderDiagnostics();
      return true;
    }
    state.lastConsumedAction = "activate:" + getRoleHint(element);
    clickElement(element);
    renderDiagnostics();
    return true;
  }

  function getEventKeyName(event) {
    var keyName = "";
    var numericCode;
    if (!event) {
      return "";
    }
    keyName = event.keyName || (event.detail && event.detail.keyName) || event.key || event.code || "";
    if (keyName && hasOwn(keyAliasMap, keyName)) {
      return keyAliasMap[keyName];
    }
    if (keyName && (keyName.indexOf("Arrow") === 0 || hasOwn(diagnosticsKeys, keyName) || keyName.indexOf("Media") === 0 || keyName === "Enter" || keyName === "Back")) {
      return keyName;
    }
    numericCode = typeof event.keyCode === "number" ? event.keyCode : (typeof event.which === "number" ? event.which : null);
    if (numericCode !== null && hasOwn(keyCodeMap, numericCode)) {
      return keyCodeMap[numericCode];
    }
    return keyName || "";
  }

  function normalizeEvent(event, pathName) {
    var keyCode = event && typeof event.keyCode === "number" ? event.keyCode : null;
    var which = event && typeof event.which === "number" ? event.which : null;
    var normalizedKey = getEventKeyName(event);
    var raw = {
      path: pathName || "unknown",
      type: event && event.type ? event.type : "unknown",
      key: event && typeof event.key === "string" ? event.key : "",
      code: event && typeof event.code === "string" ? event.code : "",
      keyCode: keyCode,
      which: which,
      keyName: event && event.keyName ? event.keyName : (event && event.detail && event.detail.keyName ? event.detail.keyName : ""),
      normalizedKey: normalizedKey,
      editable: isEditableTarget(event && event.target ? event.target : null)
    };
    state.lastRawEvent = raw;
    state.lastKey = raw;
    return raw;
  }

  function shouldIgnoreDuplicate(raw) {
    var signature = raw.type + ":" + raw.normalizedKey + ":" + String(raw.keyCode) + ":" + String(raw.which);
    var timestamp = now();
    if (signature === lastHandled.signature && timestamp - lastHandled.timestamp < DUPLICATE_EVENT_WINDOW_MS) {
      return true;
    }
    lastHandled.signature = signature;
    lastHandled.timestamp = timestamp;
    return false;
  }

  function consumeEvent(event) {
    if (!event) {
      return;
    }
    if (typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
    event.cancelBubble = true;
    event.returnValue = false;
  }

  function tryClickByTextOrLabel(keywords) {
    var candidates = collectCandidates();
    var i;
    var text;
    for (i = 0; i < candidates.length; i += 1) {
      text = toLower(getElementText(candidates[i]) + " " + getAttribute(candidates[i], "aria-label") + " " + (candidates[i].className || "") + " " + (candidates[i].id || ""));
      if (containsAny(text, keywords)) {
        clickElement(candidates[i]);
        return true;
      }
    }
    return false;
  }

  function containsAny(text, keywords) {
    var i;
    for (i = 0; i < keywords.length; i += 1) {
      if (text.indexOf(keywords[i]) >= 0) {
        return true;
      }
    }
    return false;
  }

  function controlVideo(action) {
    var video = getPrimaryVideo();
    var duration;
    if (!video) {
      state.lastPlayerActionResult = action + ":no-video";
      refreshVideoState();
      return false;
    }
    try {
      if (action === "toggle") {
        if (video.paused || video.ended) {
          if (typeof video.play === "function") {
            video.play();
          }
          state.lastPlayerActionResult = "toggle:play";
        } else {
          if (typeof video.pause === "function") {
            video.pause();
          }
          state.lastPlayerActionResult = "toggle:pause";
        }
      } else if (action === "play") {
        if (typeof video.play === "function") {
          video.play();
        }
        state.lastPlayerActionResult = "play";
      } else if (action === "pause") {
        if (typeof video.pause === "function") {
          video.pause();
        }
        state.lastPlayerActionResult = "pause";
      } else if (action === "stop") {
        if (typeof video.pause === "function") {
          video.pause();
        }
        video.currentTime = 0;
        state.lastPlayerActionResult = "stop";
      } else if (action === "forward") {
        duration = typeof video.duration === "number" && isFinite(video.duration) ? video.duration : null;
        video.currentTime = duration === null ? video.currentTime + SEEK_STEP_SECONDS : Math.min(duration, video.currentTime + SEEK_STEP_SECONDS);
        state.lastPlayerActionResult = "seek:forward";
      } else if (action === "rewind") {
        video.currentTime = Math.max(0, video.currentTime - SEEK_STEP_SECONDS);
        state.lastPlayerActionResult = "seek:rewind";
      }
      refreshVideoState();
      renderDiagnostics();
      return true;
    } catch (error) {
      state.lastPlayerActionResult = action + ":error:" + (error && error.message ? error.message : String(error));
      refreshVideoState();
      renderDiagnostics();
      return false;
    }
  }

  function isPlayerRouteOrVideoActive() {
    var path = toLower(getLocationPath());
    var video = getPrimaryVideo();
    return Boolean(video) || path.indexOf("player") >= 0 || path.indexOf("stream") >= 0 || path.indexOf("watch") >= 0;
  }

  function dispatchEscapeFallback() {
    var documentObject = getDocument();
    var event;
    if (!documentObject || typeof globalScope.KeyboardEvent !== "function") {
      return false;
    }
    try {
      event = new globalScope.KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true
      });
      documentObject.dispatchEvent(event);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function handleBack() {
    var video = getPrimaryVideo();
    if (state.diagnosticsOpen) {
      setDiagnosticsOpen(false);
      state.lastBackResolution = "closed-diagnostics";
      return true;
    }
    if (state.exitModalOpen) {
      closeExitModal("back");
      state.lastBackResolution = "closed-exit-modal";
      return true;
    }
    if (currentFocusedElement && isEditableTarget(currentFocusedElement)) {
      try {
        currentFocusedElement.blur();
      } catch (_ignore) {}
      state.lastBackResolution = "blurred-editable";
      renderDiagnostics();
      return true;
    }
    if (isPlayerRouteOrVideoActive()) {
      if (video && typeof video.pause === "function") {
        try {
          video.pause();
        } catch (_ignorePause) {}
      }
      if (tryClickByTextOrLabel(["back", "close", "exit", "return", "arrow"])) {
        state.lastBackResolution = "clicked-player-back-control";
        renderDiagnostics();
        return true;
      }
      dispatchEscapeFallback();
      if (globalScope.history && typeof globalScope.history.back === "function") {
        try {
          globalScope.history.back();
          state.lastBackResolution = "history-back-from-player";
          renderDiagnostics();
          return true;
        } catch (_error) {}
      }
      state.lastBackResolution = "player-back-fallback-failed";
      renderDiagnostics();
      return true;
    }
    if (globalScope.history && typeof globalScope.history.back === "function" && typeof globalScope.history.length === "number" && state.initialHistoryLength !== null && globalScope.history.length > state.initialHistoryLength) {
      try {
        globalScope.history.back();
        state.lastBackResolution = "history-back";
        renderDiagnostics();
        return true;
      } catch (_ignoreHistory) {}
    }
    openExitModal();
    state.lastBackResolution = "opened-exit-modal";
    renderDiagnostics();
    return true;
  }

  function handleNormalizedKey(raw, event) {
    var keyName = raw.normalizedKey;
    var handled = false;
    var action = "";
    if (!keyName) {
      return false;
    }
    state.lastAction = keyName;
    if (hasOwn(diagnosticsKeys, keyName)) {
      toggleDiagnostics();
      action = "diagnostics-toggle";
      handled = true;
    } else if (keyName === "Back") {
      handled = handleBack();
      action = "back";
    } else if (keyName === "MediaPlayPause") {
      handled = controlVideo("toggle");
      action = "media-toggle";
    } else if (keyName === "MediaPlay") {
      handled = controlVideo("play");
      action = "media-play";
    } else if (keyName === "MediaPause") {
      handled = controlVideo("pause");
      action = "media-pause";
    } else if (keyName === "MediaStop") {
      handled = controlVideo("stop");
      action = "media-stop";
    } else if (keyName === "MediaFastForward") {
      handled = controlVideo("forward");
      action = "media-forward";
    } else if (keyName === "MediaRewind") {
      handled = controlVideo("rewind");
      action = "media-rewind";
    } else if (!raw.editable && (keyName === "ArrowLeft" || keyName === "ArrowRight" || keyName === "ArrowUp" || keyName === "ArrowDown")) {
      handled = moveFocus(keyName);
      action = "focus-move";
    } else if (!raw.editable && keyName === "Enter") {
      handled = activateFocused();
      action = "activate";
    }
    if (handled) {
      state.lastConsumedAction = action;
      consumeEvent(event);
      renderDiagnostics();
    }
    return handled;
  }

  function onRemoteKey(event, pathName) {
    var raw = normalizeEvent(event, pathName);
    if (shouldIgnoreDuplicate(raw)) {
      return false;
    }
    return handleNormalizedKey(raw, event);
  }

  function onTizenHardwareKey(event) {
    var keyName = event && event.keyName ? event.keyName : (event && event.detail && event.detail.keyName ? event.detail.keyName : "");
    if (toLower(keyName) === "back") {
      event.keyName = "Back";
      return onRemoteKey(event, "tizenhwkey");
    }
    return onRemoteKey(event, "tizenhwkey");
  }

  function addListener(target, eventName, handler, pathName) {
    if (!target || typeof target.addEventListener !== "function") {
      return false;
    }
    target.addEventListener(eventName, function onEvent(event) {
      handler(event, pathName);
    }, true);
    state.listenerPaths.push(pathName + ":" + eventName);
    return true;
  }

  function attachKeyListeners() {
    var documentObject = getDocument();
    if (state.keyListenerAttached) {
      return false;
    }
    addListener(documentObject, "keydown", onRemoteKey, "document");
    addListener(documentObject, "keyup", onRemoteKey, "document");
    addListener(documentObject, "keypress", onRemoteKey, "document");
    addListener(globalScope, "keydown", onRemoteKey, "window");
    addListener(globalScope, "keyup", onRemoteKey, "window");
    addListener(documentObject, "tizenhwkey", onTizenHardwareKey, "document");
    addListener(globalScope, "tizenhwkey", onTizenHardwareKey, "window");
    state.keyListenerAttached = true;
    return true;
  }

  function ensureRuntimeUiReady() {
    injectStyles();
    ensureDiagnosticsPanel();
    ensureExitModal();
    renderDiagnostics();
  }

  function attachDomReadyHook() {
    var documentObject = getDocument();
    if (!documentObject || typeof documentObject.addEventListener !== "function" || state.domReadyHookAttached) {
      return false;
    }
    if (documentObject.readyState && documentObject.readyState !== "loading") {
      ensureRuntimeUiReady();
      return true;
    }
    documentObject.addEventListener("DOMContentLoaded", function onDomReady() {
      ensureRuntimeUiReady();
    });
    state.domReadyHookAttached = true;
    return true;
  }

  function observeDomChanges() {
    var documentObject = getDocument();
    var observer;
    if (!documentObject || !documentObject.body || typeof globalScope.MutationObserver !== "function") {
      return false;
    }
    try {
      observer = new globalScope.MutationObserver(function onMutation() {
        invalidateCandidateCache();
        refreshVideoState();
        if (state.diagnosticsOpen) {
          renderDiagnostics();
        }
      });
      observer.observe(documentObject.body, { childList: true, subtree: true, attributes: true });
      return true;
    } catch (_error) {
      return false;
    }
  }

  function getState() {
    refreshApiAvailability();
    refreshVideoState();
    return {
      initialized: state.initialized,
      version: state.version,
      sourceMarker: state.sourceMarker,
      injectionMarker: state.injectionMarker,
      initTime: state.initTime,
      registeredKeys: state.registeredKeys.slice(),
      failedKeys: state.failedKeys.slice(),
      listenerPaths: state.listenerPaths.slice(),
      apiAvailability: state.apiAvailability,
      diagnosticsOpen: state.diagnosticsOpen,
      diagnosticsPanelCreated: state.diagnosticsPanelCreated,
      styleInjected: state.styleInjected,
      exitModalCreated: state.exitModalCreated,
      exitModalOpen: state.exitModalOpen,
      keyListenerAttached: state.keyListenerAttached,
      currentFocusRole: state.currentFocusRole,
      currentFocusText: state.currentFocusText,
      candidateCount: state.candidateCount,
      lastRawEvent: state.lastRawEvent,
      lastKey: state.lastKey,
      lastAction: state.lastAction,
      lastConsumedAction: state.lastConsumedAction,
      lastBackResolution: state.lastBackResolution,
      lastExitAttempt: state.lastExitAttempt,
      lastExitResult: state.lastExitResult,
      lastVideoState: state.lastVideoState,
      lastPlayerActionResult: state.lastPlayerActionResult,
      runtimeMarkers: {
        namespacePresent: Boolean(globalScope[NAMESPACE]),
        initializedNamespace: Boolean(globalScope[NAMESPACE] && globalScope[NAMESPACE].initialized),
        styleMarkerPresent: Boolean(getDocument() && getDocument().querySelector && getDocument().querySelector("style[" + STYLE_ATTRIBUTE + "='1']")),
        diagnosticsPanelMarkerPresent: Boolean(findDiagnosticsPanel()),
        exitModalMarkerPresent: Boolean(findExitModal())
      }
    };
  }

  function init() {
    state.initTime = now();
    state.initialPath = getLocationPath();
    state.initialHistoryLength = globalScope.history && typeof globalScope.history.length === "number" ? globalScope.history.length : null;
    refreshApiAvailability();
    registerOptionalKeys();
    attachDomReadyHook();
    ensureRuntimeUiReady();
    attachKeyListeners();
    observeDomChanges();
    state.initialized = true;
    globalScope[NAMESPACE] = runtimeApi;
    renderDiagnostics();
  }

  var runtimeApi = globalScope[NAMESPACE] || {};
  runtimeApi.version = RUNTIME_VERSION;
  runtimeApi.sourceMarker = RUNTIME_SOURCE_MARKER;
  runtimeApi.injectionMarker = RUNTIME_INJECTION_MARKER;
  runtimeApi.initialized = false;
  runtimeApi.getState = getState;
  runtimeApi.openDiagnostics = function openDiagnostics() {
    setDiagnosticsOpen(true);
    return getState();
  };
  runtimeApi.closeDiagnostics = function closeDiagnostics() {
    setDiagnosticsOpen(false);
    return getState();
  };
  runtimeApi.toggleDiagnostics = function publicToggleDiagnostics() {
    toggleDiagnostics();
    return getState();
  };
  runtimeApi.refreshCandidates = function publicRefreshCandidates() {
    invalidateCandidateCache();
    return collectCandidates().length;
  };
  runtimeApi.handleBack = handleBack;
  runtimeApi.controlVideo = controlVideo;
  globalScope[NAMESPACE] = runtimeApi;

  init();
  runtimeApi.initialized = true;
}(typeof window !== "undefined" ? window : globalThis));
