(function (window) {
  "use strict";

  var NAMESPACE = "__STREMIO_TIZENBREW_REMOTE__";
  var VERSION = "0.2.5";
  var DIAGNOSTICS_ATTRIBUTE = "data-stremio-remote-diagnostics-panel";
  var STYLE_ATTRIBUTE = "data-stremio-remote-style";

  if (window[NAMESPACE] && window[NAMESPACE].initialized) {
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
    8: "Back",
    27: "Back",
    403: "ColorF0Red",
    404: "ColorF1Green",
    405: "ColorF2Yellow",
    406: "ColorF3Blue",
    457: "Info",
    10009: "Back"
  };

  var keyAliasMap = {
    Back: "Back",
    Return: "Back",
    Escape: "Back",
    Backspace: "Back",
    XF86Back: "Back",
    BrowserBack: "Back"
  };

  var state = {
    initialized: false,
    version: VERSION,
    diagnosticsOpen: false,
    registeredKeys: [],
    failedKeys: [],
    lastKey: "",
    lastAction: "",
    lastIgnored: "",
    lastBack: "",
    lastPlayer: ""
  };

  function getBodyText() {
    return document && document.body ? String(document.body.textContent || "").toLowerCase() : "";
  }

  function isDetailPage() {
    var text = getBodyText();
    var hash = window.location ? String(window.location.hash || "").toLowerCase() : "";
    return hash.indexOf("detail") >= 0 || (text.indexOf("summary") >= 0 && text.indexOf("genres") >= 0);
  }

  function isLoadingStreams() {
    var text = getBodyText();
    return text.indexOf("addons are still loading") >= 0 || text.indexOf("add-ons are still loading") >= 0 || (text.indexOf("loading") >= 0 && text.indexOf("addon") >= 0);
  }

  function hasUnsupportedVideoText() {
    var text = getBodyText();
    return text.indexOf("video is not supported") >= 0 || (text.indexOf("not supported") >= 0 && text.indexOf("video") >= 0);
  }

  function getVideos() {
    return Array.prototype.slice.call(document.querySelectorAll("video"));
  }

  function getPlayerDebug() {
    var videos = getVideos();
    var video = videos[0] || null;
    var src = video ? String(video.currentSrc || video.src || "") : "";
    var error = "";
    if (video && video.error) {
      error = "code=" + String(video.error.code || "") + " message=" + String(video.error.message || "");
    }
    return {
      count: videos.length,
      src: src.slice(0, 220),
      paused: video ? String(video.paused) : "null",
      readyState: video ? String(video.readyState) : "null",
      networkState: video ? String(video.networkState) : "null",
      error: error || "none"
    };
  }

  function ensureStyles() {
    var style;
    if (document.querySelector("style[" + STYLE_ATTRIBUTE + "='1']")) {
      return;
    }
    style = document.createElement("style");
    style.setAttribute(STYLE_ATTRIBUTE, "1");
    style.textContent = "[" + DIAGNOSTICS_ATTRIBUTE + "='1']{position:fixed;top:14px;right:14px;z-index:2147483647;width:min(720px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;padding:12px 14px;border:1px solid rgba(32,201,151,.6);border-radius:10px;background:rgba(5,10,18,.94);color:#f4fff9;font:12px/1.45 Consolas,'Courier New',monospace;white-space:pre-wrap;display:none}[" + DIAGNOSTICS_ATTRIBUTE + "='1'][data-open='true']{display:block}";
    document.head.appendChild(style);
  }

  function getPanel() {
    var panel = document.querySelector("[" + DIAGNOSTICS_ATTRIBUTE + "='1']");
    if (!panel) {
      panel = document.createElement("pre");
      panel.setAttribute(DIAGNOSTICS_ATTRIBUTE, "1");
      document.body.appendChild(panel);
    }
    return panel;
  }

  function renderDiagnostics() {
    var debug = getPlayerDebug();
    var panel = getPanel();
    panel.setAttribute("data-open", state.diagnosticsOpen ? "true" : "false");
    panel.textContent = [
      "Stremio Web TV Remote Diagnostics",
      "Version: " + VERSION,
      "Mode: passive debug, Arrow and Enter pass through, Back handled",
      "Detail page: " + String(isDetailPage()),
      "Streams loading: " + String(isLoadingStreams()),
      "Video not supported text: " + String(hasUnsupportedVideoText()),
      "Last key: " + (state.lastKey || "none"),
      "Last action: " + (state.lastAction || "none"),
      "Last ignored: " + (state.lastIgnored || "none"),
      "Last back: " + (state.lastBack || "none"),
      "Last player: " + (state.lastPlayer || "none"),
      "Videos: " + debug.count,
      "Video src: " + (debug.src || "none"),
      "Video paused: " + debug.paused,
      "Video readyState: " + debug.readyState,
      "Video networkState: " + debug.networkState,
      "Video error: " + debug.error,
      "Registered: " + (state.registeredKeys.join(", ") || "none"),
      "Failed: " + (state.failedKeys.map(function (item) { return item.keyName + ":" + item.message; }).join(", ") || "none")
    ].join("\n");
  }

  function registerOptionalKeys() {
    var input = window.tizen && (window.tizen.tvinputdevice || window.tizen.inputdevice);
    var i;
    if (!input || !input.registerKey) {
      return;
    }
    for (i = 0; i < optionalKeys.length; i += 1) {
      try {
        input.registerKey(optionalKeys[i]);
        state.registeredKeys.push(optionalKeys[i]);
      } catch (error) {
        state.failedKeys.push({ keyName: optionalKeys[i], message: error && error.message ? error.message : String(error) });
      }
    }
  }

  function normalizeKey(event) {
    var raw = event && (event.keyName || event.key || event.code) || "";
    return keyAliasMap[raw] || keyCodeMap[event && event.keyCode] || raw;
  }

  function consume(event) {
    if (event && event.preventDefault) event.preventDefault();
    if (event && event.stopPropagation) event.stopPropagation();
    if (event && event.stopImmediatePropagation) event.stopImmediatePropagation();
  }

  function dispatchEscapeFallback() {
    var escapeEvent;
    try {
      escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(escapeEvent);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function handleBack(event) {
    if (state.diagnosticsOpen) {
      state.diagnosticsOpen = false;
      state.lastBack = "closed-diagnostics";
      renderDiagnostics();
      consume(event);
      return true;
    }

    try {
      if (window.history && window.history.length > 1 && typeof window.history.back === "function") {
        window.history.back();
        state.lastBack = "history-back";
        renderDiagnostics();
        consume(event);
        return true;
      }
    } catch (_historyError) {}

    if (dispatchEscapeFallback()) {
      state.lastBack = "escape-fallback";
      renderDiagnostics();
      consume(event);
      return true;
    }

    state.lastBack = "pass-through";
    renderDiagnostics();
    return false;
  }

  function handleKey(event) {
    var normalizedKey = normalizeKey(event);
    state.lastKey = normalizedKey;
    state.lastAction = "key:" + normalizedKey;

    if (diagnosticsKeys[normalizedKey]) {
      state.diagnosticsOpen = !state.diagnosticsOpen;
      renderDiagnostics();
      consume(event);
      return true;
    }

    if (normalizedKey === "Back") {
      return handleBack(event);
    }

    state.lastIgnored = "pass-through:" + normalizedKey;
    renderDiagnostics();
    return false;
  }

  function init() {
    if (state.initialized) {
      return;
    }
    ensureStyles();
    registerOptionalKeys();
    document.addEventListener("keydown", handleKey, true);
    document.addEventListener("tizenhwkey", handleKey, true);
    window.addEventListener("keydown", handleKey, true);
    window.addEventListener("tizenhwkey", handleKey, true);
    state.initialized = true;
    window[NAMESPACE] = api;
    renderDiagnostics();
  }

  var api = {
    initialized: false,
    version: VERSION,
    getState: function () {
      return JSON.parse(JSON.stringify(state));
    },
    openDiagnostics: function () {
      state.diagnosticsOpen = true;
      renderDiagnostics();
    },
    closeDiagnostics: function () {
      state.diagnosticsOpen = false;
      renderDiagnostics();
    },
    toggleDiagnostics: function () {
      state.diagnosticsOpen = !state.diagnosticsOpen;
      renderDiagnostics();
    }
  };

  window[NAMESPACE] = api;
  if (document.readyState === "interactive" || document.readyState === "complete") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init, false);
  }
  api.initialized = true;
}(typeof window !== "undefined" ? window : this));
