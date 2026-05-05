(function bootstrapStremioTizenBrew(globalScope) {
  "use strict";

  var NAMESPACE = "__STREMIO_TIZENBREW_REMOTE__";
  var RUNTIME_VERSION = "0.1.3";
  var RUNTIME_SOURCE_MARKER = "stremio-webapp-src-main-js-task4e-v1";
  var RUNTIME_INJECTION_MARKER = "stremio-webapp-runtime-injection-v1";
  var STYLE_ATTRIBUTE = "data-stremio-remote-style";
  var DIAGNOSTICS_ATTRIBUTE = "data-stremio-remote-diagnostics-panel";
  var DIAGNOSTICS_BODY_ATTRIBUTE = "data-stremio-remote-diagnostics-body";
  var BOOT_BADGE_ATTRIBUTE = "data-stremio-remote-boot-badge";
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

  var mediaKeys = {
    MediaPlayPause: true,
    MediaPlay: true,
    MediaPause: true,
    MediaStop: true,
    MediaFastForward: true,
    MediaRewind: true
  };

  var keyCodeMap = {
    19: "MediaPause",
    27: "Back",
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
    Return: "Back",
    Escape: "Back",
    Backspace: "Back",
    XF86Back: "Back",
    BrowserBack: "Back",
    Play: "MediaPlay",
    Pause: "MediaPause",
    FastForward: "MediaFastForward",
    Rewind: "MediaRewind",
    Red: "ColorF0Red",
    Green: "ColorF1Green",
    Yellow: "ColorF2Yellow",
    Blue: "ColorF3Blue",
    Info: "Info"
  };

  var state = {
    initialized: false,
    version: RUNTIME_VERSION,
    sourceMarker: RUNTIME_SOURCE_MARKER,
    injectionMarker: RUNTIME_INJECTION_MARKER,
    initTime: null,
    registeredKeys: [],
    failedKeys: [],
    listenerPaths: [],
    diagnosticsOpen: false,
    bootBadgeShown: false,
    lastRawEvent: null,
    lastKey: null,
    lastAction: null,
    lastConsumedAction: null,
    lastBackResolution: null,
    lastVideoState: null,
    lastPlayerActionResult: null,
    apiAvailability: {}
  };

  function getDocument() {
    return globalScope && globalScope.document ? globalScope.document : null;
  }

  function now() {
    return typeof Date.now === "function" ? Date.now() : new Date().getTime();
  }

  function setAttribute(element, name, value) {
    if (element && typeof element.setAttribute === "function") {
      element.setAttribute(name, String(value));
    }
  }

  function getInputDeviceApi() {
    var tizenObject = globalScope && globalScope.tizen;
    var inputDevice = tizenObject && (tizenObject.tvinputdevice || tizenObject.inputdevice);
    return inputDevice && typeof inputDevice.registerKey === "function" ? inputDevice : null;
  }

  function collectApiAvailability() {
    var documentObject = getDocument();
    var tizenObject = globalScope && globalScope.tizen;
    var inputDevice = tizenObject && (tizenObject.tvinputdevice || tizenObject.inputdevice);
    state.apiAvailability = {
      document: Boolean(documentObject),
      documentBody: Boolean(documentObject && documentObject.body),
      tizen: Boolean(tizenObject),
      tvInputDevice: Boolean(inputDevice && typeof inputDevice.registerKey === "function"),
      application: Boolean(tizenObject && tizenObject.application && typeof tizenObject.application.getCurrentApplication === "function")
    };
    return state.apiAvailability;
  }

  function registerOptionalKeys() {
    var inputDevice = getInputDeviceApi();
    var i;
    var keyName;
    state.registeredKeys = [];
    state.failedKeys = [];
    collectApiAvailability();
    if (!inputDevice) {
      return [];
    }
    for (i = 0; i < optionalKeys.length; i += 1) {
      keyName = optionalKeys[i];
      try {
        inputDevice.registerKey(keyName);
        state.registeredKeys.push(keyName);
      } catch (error) {
        state.failedKeys.push({
          keyName: keyName,
          message: error && error.message ? error.message : String(error)
        });
      }
    }
    return state.registeredKeys.slice();
  }

  function injectStyles() {
    var documentObject = getDocument();
    var style;
    if (!documentObject || !documentObject.head || typeof documentObject.createElement !== "function") {
      return false;
    }
    if (documentObject.querySelector && documentObject.querySelector("style[" + STYLE_ATTRIBUTE + "='1']")) {
      return true;
    }
    style = documentObject.createElement("style");
    style.type = "text/css";
    setAttribute(style, STYLE_ATTRIBUTE, "1");
    style.appendChild(documentObject.createTextNode([
      "[" + DIAGNOSTICS_ATTRIBUTE + "='1'] { position: fixed; top: 14px; right: 14px; z-index: 2147483647; width: min(540px, calc(100vw - 28px)); max-height: calc(100vh - 28px); overflow: auto; padding: 12px 14px; border: 1px solid rgba(32,201,151,.6); border-radius: 10px; background: rgba(5,10,18,.94); color: #f4fff9; font: 12px/1.45 Consolas, 'Courier New', monospace; white-space: pre-wrap; display: none; box-shadow: 0 12px 32px rgba(0,0,0,.4); }",
      "[" + DIAGNOSTICS_ATTRIBUTE + "='1'][data-open='true'] { display: block; }",
      "[" + DIAGNOSTICS_BODY_ATTRIBUTE + "='1'] { margin: 0; }",
      "[" + BOOT_BADGE_ATTRIBUTE + "='1'] { position: fixed; left: 14px; bottom: 14px; z-index: 2147483645; padding: 8px 10px; border-radius: 8px; background: rgba(5,10,18,.88); color: #f4fff9; font: 12px/1.3 system-ui, sans-serif; border: 1px solid rgba(32,201,151,.45); }"
    ].join("\n")));
    documentObject.head.appendChild(style);
    return true;
  }

  function showBootBadge() {
    var documentObject = getDocument();
    var badge;
    if (!documentObject || !documentObject.body || typeof documentObject.createElement !== "function") {
      return false;
    }
    if (documentObject.querySelector && documentObject.querySelector("[" + BOOT_BADGE_ATTRIBUTE + "='1']")) {
      return true;
    }
    badge = documentObject.createElement("div");
    setAttribute(badge, BOOT_BADGE_ATTRIBUTE, "1");
    badge.textContent = "Stremio Remote " + RUNTIME_VERSION + " loaded";
    documentObject.body.appendChild(badge);
    state.bootBadgeShown = true;
    if (typeof globalScope.setTimeout === "function") {
      globalScope.setTimeout(function removeBootBadge() {
        if (badge && badge.parentNode) {
          badge.parentNode.removeChild(badge);
        }
      }, 4200);
    }
    return true;
  }

  function getRect(element) {
    var rect;
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return { width: 0, height: 0 };
    }
    rect = element.getBoundingClientRect();
    return {
      width: typeof rect.width === "number" ? rect.width : 0,
      height: typeof rect.height === "number" ? rect.height : 0
    };
  }

  function isVisible(element) {
    var rect = getRect(element);
    var style;
    if (!element || rect.width < 4 || rect.height < 4) {
      return false;
    }
    if (globalScope && typeof globalScope.getComputedStyle === "function") {
      try {
        style = globalScope.getComputedStyle(element);
        if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)) {
          return false;
        }
      } catch (_error) {}
    }
    return true;
  }

  function getPrimaryVideo() {
    var documentObject = getDocument();
    var videos;
    var best = null;
    var bestArea = -1;
    var i;
    var rect;
    var area;
    if (!documentObject || typeof documentObject.querySelectorAll !== "function") {
      return null;
    }
    videos = documentObject.querySelectorAll("video");
    for (i = 0; i < videos.length; i += 1) {
      if (isVisible(videos[i])) {
        rect = getRect(videos[i]);
        area = rect.width * rect.height;
        if (area > bestArea) {
          best = videos[i];
          bestArea = area;
        }
      }
    }
    return best;
  }

  function copyVideoState(video) {
    if (!video) {
      return { found: false };
    }
    return {
      found: true,
      paused: Boolean(video.paused),
      ended: Boolean(video.ended),
      currentTime: typeof video.currentTime === "number" ? video.currentTime : null,
      duration: typeof video.duration === "number" && isFinite(video.duration) ? video.duration : null
    };
  }

  function refreshVideoState() {
    state.lastVideoState = copyVideoState(getPrimaryVideo());
    return state.lastVideoState;
  }

  function normalizeKey(event) {
    var keyName = event && (event.keyName || event.key || event.code);
    var numericCode = event && (event.keyCode || event.which || event.charCode);
    var normalizedKey = keyAliasMap[keyName] || keyCodeMap[numericCode] || keyName || "";
    state.lastKey = {
      normalizedKey: normalizedKey,
      keyName: keyName || "",
      keyCode: numericCode || null
    };
    return normalizedKey;
  }

  function recordRawEvent(event, path) {
    state.lastRawEvent = {
      path: path,
      type: event && event.type || "",
      key: event && event.key || "",
      code: event && event.code || "",
      keyCode: event && event.keyCode || null,
      which: event && event.which || null,
      keyName: event && event.keyName || ""
    };
  }

  function formatDiagnosticsText() {
    var api = collectApiAvailability();
    var videoState = refreshVideoState();
    var raw = state.lastRawEvent || {};
    return [
      "Stremio Web TV Remote Diagnostics",
      "Version: " + RUNTIME_VERSION,
      "Source marker: " + RUNTIME_SOURCE_MARKER,
      "Injection marker: " + RUNTIME_INJECTION_MARKER,
      "Initialized: " + String(state.initialized),
      "Boot badge shown: " + String(state.bootBadgeShown),
      "Diagnostics open: " + String(state.diagnosticsOpen),
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
      "Video: found=" + String(videoState.found) + ", paused=" + String(videoState.paused) + ", time=" + String(videoState.currentTime) + ", duration=" + String(videoState.duration),
      "Registered keys: " + (state.registeredKeys.length ? state.registeredKeys.join(", ") : "(none)"),
      "Failed keys: " + (state.failedKeys.length ? state.failedKeys.map(function mapFailed(item) { return item.keyName + ": " + item.message; }).join(", ") : "(none)"),
      "Listeners: " + (state.listenerPaths.length ? state.listenerPaths.join(", ") : "(none)"),
      "APIs: document=" + String(api.document) + ", body=" + String(api.documentBody) + ", tizen=" + String(api.tizen) + ", tvinputdevice=" + String(api.tvInputDevice) + ", application=" + String(api.application)
    ].join("\n");
  }

  function ensureDiagnosticsPanel() {
    var documentObject = getDocument();
    var panel;
    var body;
    if (!documentObject || !documentObject.body || typeof documentObject.createElement !== "function") {
      return null;
    }
    panel = documentObject.querySelector && documentObject.querySelector("[" + DIAGNOSTICS_ATTRIBUTE + "='1']");
    if (!panel) {
      panel = documentObject.createElement("aside");
      setAttribute(panel, DIAGNOSTICS_ATTRIBUTE, "1");
      body = documentObject.createElement("pre");
      setAttribute(body, DIAGNOSTICS_BODY_ATTRIBUTE, "1");
      panel.appendChild(body);
      documentObject.body.appendChild(panel);
    }
    return panel;
  }

  function renderDiagnostics() {
    var panel = ensureDiagnosticsPanel();
    var body;
    if (!panel) {
      return false;
    }
    setAttribute(panel, "data-open", state.diagnosticsOpen ? "true" : "false");
    setAttribute(panel, "aria-hidden", state.diagnosticsOpen ? "false" : "true");
    body = panel.querySelector && panel.querySelector("[" + DIAGNOSTICS_BODY_ATTRIBUTE + "='1']");
    if (body) {
      body.textContent = formatDiagnosticsText();
    }
    return true;
  }

  function setDiagnosticsOpen(isOpen) {
    state.diagnosticsOpen = Boolean(isOpen);
    state.lastConsumedAction = state.diagnosticsOpen ? "diagnostics:open" : "diagnostics:close";
    renderDiagnostics();
    return true;
  }

  function toggleDiagnostics() {
    return setDiagnosticsOpen(!state.diagnosticsOpen);
  }

  function controlVideo(action) {
    var video = getPrimaryVideo();
    var before;
    var duration;
    if (!video) {
      state.lastPlayerActionResult = action + ":no-video";
      refreshVideoState();
      renderDiagnostics();
      return false;
    }
    before = video.currentTime;
    try {
      if (action === "MediaPlayPause") {
        if (video.paused) {
          if (typeof video.play === "function") {
            video.play();
          }
        } else if (typeof video.pause === "function") {
          video.pause();
        }
      } else if (action === "MediaPlay" && typeof video.play === "function") {
        video.play();
      } else if (action === "MediaPause" && typeof video.pause === "function") {
        video.pause();
      } else if (action === "MediaStop") {
        if (typeof video.pause === "function") {
          video.pause();
        }
        video.currentTime = 0;
      } else if (action === "MediaFastForward" || action === "MediaRewind") {
        duration = typeof video.duration === "number" && isFinite(video.duration) ? video.duration : null;
        video.currentTime = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, before + (action === "MediaFastForward" ? SEEK_STEP_SECONDS : -SEEK_STEP_SECONDS)));
      }
      state.lastPlayerActionResult = action + ":ok";
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

  function dispatchEscapeFallback() {
    var documentObject = getDocument();
    var eventObject;
    if (!documentObject || typeof globalScope.KeyboardEvent !== "function") {
      return false;
    }
    try {
      eventObject = new globalScope.KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true });
      documentObject.dispatchEvent(eventObject);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function handleBack() {
    var video;
    if (state.diagnosticsOpen) {
      setDiagnosticsOpen(false);
      state.lastBackResolution = "closed-diagnostics";
      return true;
    }
    video = getPrimaryVideo();
    if (video) {
      try {
        if (typeof video.pause === "function") {
          video.pause();
        }
      } catch (_error) {}
      if (dispatchEscapeFallback()) {
        state.lastBackResolution = "player-escape";
        renderDiagnostics();
        return true;
      }
    }
    try {
      if (globalScope.history && globalScope.history.length > 1 && typeof globalScope.history.back === "function") {
        globalScope.history.back();
        state.lastBackResolution = video ? "player-history-back" : "history-back";
        renderDiagnostics();
        return true;
      }
    } catch (_error2) {}
    state.lastBackResolution = "passed-through";
    renderDiagnostics();
    return false;
  }

  function consumeEvent(event) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
  }

  function handleKeyEvent(event, path) {
    var normalizedKey;
    recordRawEvent(event, path);
    normalizedKey = normalizeKey(event);
    state.lastAction = "key:" + normalizedKey;

    // Critical hotfix: never consume Arrow/Enter navigation. Let Stremio Web handle its own UI.
    if (normalizedKey === "ArrowLeft" || normalizedKey === "ArrowRight" || normalizedKey === "ArrowUp" || normalizedKey === "ArrowDown" || normalizedKey === "Enter") {
      state.lastConsumedAction = "pass-through:" + normalizedKey;
      renderDiagnostics();
      return false;
    }

    if (diagnosticsKeys[normalizedKey]) {
      toggleDiagnostics();
      consumeEvent(event);
      return true;
    }

    if (mediaKeys[normalizedKey]) {
      if (controlVideo(normalizedKey)) {
        consumeEvent(event);
        return true;
      }
      return false;
    }

    if (normalizedKey === "Back") {
      if (handleBack()) {
        consumeEvent(event);
        return true;
      }
      return false;
    }

    renderDiagnostics();
    return false;
  }

  function addListener(target, eventName, path) {
    if (!target || typeof target.addEventListener !== "function") {
      return false;
    }
    target.addEventListener(eventName, function onRemoteEvent(event) {
      handleKeyEvent(event, path + ":" + eventName);
    }, true);
    state.listenerPaths.push(path + ":" + eventName);
    return true;
  }

  function attachKeyListeners() {
    var documentObject = getDocument();
    addListener(documentObject, "keydown", "document");
    addListener(documentObject, "keyup", "document");
    addListener(documentObject, "keypress", "document");
    addListener(documentObject, "tizenhwkey", "document");
    addListener(globalScope, "keydown", "window");
    addListener(globalScope, "keyup", "window");
    addListener(globalScope, "keypress", "window");
    addListener(globalScope, "tizenhwkey", "window");
    state.keyListenerAttached = state.listenerPaths.length > 0;
    return state.keyListenerAttached;
  }

  function init() {
    state.initTime = now();
    collectApiAvailability();
    registerOptionalKeys();
    injectStyles();
    attachKeyListeners();
    state.initialized = true;
    globalScope[NAMESPACE] = publicApi;
    showBootBadge();
    renderDiagnostics();
    return true;
  }

  function onReady() {
    if (state.initialized) {
      return;
    }
    init();
  }

  var publicApi = {
    initialized: false,
    version: RUNTIME_VERSION,
    sourceMarker: RUNTIME_SOURCE_MARKER,
    injectionMarker: RUNTIME_INJECTION_MARKER,
    getState: function getState() {
      collectApiAvailability();
      refreshVideoState();
      return JSON.parse(JSON.stringify(state));
    },
    openDiagnostics: function openDiagnostics() {
      return setDiagnosticsOpen(true);
    },
    closeDiagnostics: function closeDiagnostics() {
      return setDiagnosticsOpen(false);
    },
    toggleDiagnostics: toggleDiagnostics,
    controlVideo: controlVideo
  };

  globalScope[NAMESPACE] = publicApi;

  if (getDocument() && (getDocument().readyState === "interactive" || getDocument().readyState === "complete")) {
    onReady();
  } else if (getDocument() && typeof getDocument().addEventListener === "function") {
    getDocument().addEventListener("DOMContentLoaded", onReady, false);
    if (typeof globalScope.setTimeout === "function") {
      globalScope.setTimeout(onReady, 1500);
    }
  } else {
    onReady();
  }

  publicApi.initialized = true;
}(typeof window !== "undefined" ? window : this));
