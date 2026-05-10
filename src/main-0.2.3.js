(function (window) {
  "use strict";

  var NS = "__STREMIO_TIZENBREW_REMOTE__";
  var VERSION = "0.2.7";
  var DIAG = "data-stremio-remote-diagnostics-panel";
  var STYLE = "data-stremio-remote-style";
  var FOCUS = "data-stremio-remote-player-focus";
  var LOCK = "data-stremio-player-overlay-locked";
  var FALLBACK = "data-stremio-remote-player-overlay";
  var SEEK_SECONDS = 15;
  var SEEK_PREVIEW_MS = 3500;

  if (window[NS] && window[NS].initialized) return;

  var optionalKeys = ["MediaPlayPause", "MediaPlay", "MediaPause", "MediaStop", "MediaFastForward", "MediaRewind", "ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue", "Info"];
  var diagnosticsKeys = { Info: true, ColorF0Red: true, ColorF1Green: true, ColorF2Yellow: true, ColorF3Blue: true };
  var mediaKeys = { MediaPlayPause: true, MediaPlay: true, MediaPause: true, MediaStop: true, MediaFastForward: true, MediaRewind: true };
  var arrowKeys = { ArrowLeft: true, ArrowRight: true, ArrowUp: true, ArrowDown: true };
  var keyCodeMap = { 8: "Back", 13: "Enter", 19: "MediaPause", 27: "Back", 32: "Enter", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 403: "ColorF0Red", 404: "ColorF1Green", 405: "ColorF2Yellow", 406: "ColorF3Blue", 412: "MediaRewind", 413: "MediaStop", 415: "MediaPlay", 417: "MediaFastForward", 457: "Info", 10009: "Back", 10252: "MediaPlayPause" };
  var keyAliasMap = { Back: "Back", Return: "Back", Escape: "Back", Backspace: "Back", XF86Back: "Back", BrowserBack: "Back", Play: "MediaPlay", Pause: "MediaPause", MediaPlay: "MediaPlay", MediaPause: "MediaPause", MediaPlayPause: "MediaPlayPause", FastForward: "MediaFastForward", Rewind: "MediaRewind", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", Left: "ArrowLeft", Right: "ArrowRight", Up: "ArrowUp", Down: "ArrowDown" };

  var state = {
    initialized: false,
    version: VERSION,
    diagnosticsOpen: false,
    overlayLocked: false,
    overlayMode: "none",
    playerMode: false,
    registeredKeys: [],
    failedKeys: [],
    lastKey: "",
    lastAction: "",
    lastIgnored: "",
    lastBack: "",
    lastPlayer: "",
    lastOverlay: "",
    lastFocusedControl: "",
    focusedControlIndex: -1,
    lastSeek: ""
  };

  var focusedControl = null;
  var seekPreviewTimer = null;

  function bodyText() {
    return document && document.body ? String(document.body.textContent || "").toLowerCase() : "";
  }

  function isDetailPage() {
    var text = bodyText();
    var hash = window.location ? String(window.location.hash || "").toLowerCase() : "";
    return hash.indexOf("detail") >= 0 || (text.indexOf("summary") >= 0 && text.indexOf("genres") >= 0);
  }

  function isLoadingStreams() {
    var text = bodyText();
    return text.indexOf("addons are still loading") >= 0 || text.indexOf("add-ons are still loading") >= 0 || (text.indexOf("loading") >= 0 && text.indexOf("addon") >= 0);
  }

  function hasUnsupportedVideoText() {
    var text = bodyText();
    return text.indexOf("video is not supported") >= 0 || (text.indexOf("not supported") >= 0 && text.indexOf("video") >= 0);
  }

  function rect(element) {
    var r, left, top, width, height;
    if (!element || !element.getBoundingClientRect) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, cx: 0, cy: 0 };
    r = element.getBoundingClientRect();
    left = Number(r.left) || 0;
    top = Number(r.top) || 0;
    width = Number(r.width) || 0;
    height = Number(r.height) || 0;
    return { left: left, top: top, right: left + width, bottom: top + height, width: width, height: height, cx: left + width / 2, cy: top + height / 2 };
  }

  function visible(element) {
    var r, style;
    if (!element || !element.getBoundingClientRect) return false;
    if (element.closest && element.closest("[" + DIAG + "='1'],[" + FALLBACK + "='1']")) return false;
    r = rect(element);
    if (r.width < 4 || r.height < 4) return false;
    try {
      style = window.getComputedStyle(element);
      if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)) return false;
    } catch (_error) {}
    return true;
  }

  function getVideos() {
    return Array.prototype.slice.call(document.querySelectorAll("video"));
  }

  function getPrimaryVideo() {
    var videos = getVideos();
    var best = null;
    var bestArea = -1;
    var i, r, area;
    for (i = 0; i < videos.length; i += 1) {
      r = rect(videos[i]);
      area = r.width * r.height;
      if ((visible(videos[i]) || videos[i].currentSrc || videos[i].src) && area >= bestArea) {
        best = videos[i];
        bestArea = area;
      }
    }
    return best || videos[0] || null;
  }

  function hasPlayerVideo() {
    var video = getPrimaryVideo();
    return Boolean(video && (video.currentSrc || video.src || video.readyState > 0 || video.currentTime > 0 || video.paused === false));
  }

  function textOf(element) {
    return String(element && ((element.getAttribute && (element.getAttribute("aria-label") || element.getAttribute("title"))) || element.textContent || element.value) || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").slice(0, 100);
  }

  function looksLikePlayerControl(element) {
    var r = rect(element);
    var classText = String(element.className || element.id || "").toLowerCase();
    var label = textOf(element).toLowerCase();
    var bottomHalf = r.cy > ((window.innerHeight || 1080) * 0.42);
    var playerAncestor = element.closest && element.closest("[class*='player'],[class*='Player'],[class*='control'],[class*='Control'],[class*='video'],[class*='Video']");
    var named = /play|pause|seek|audio|subtitle|caption|cast|volume|fullscreen|screen|speed|quality|settings|menu|more|back|next|previous|rewind|forward/.test(classText + " " + label);
    var roleButton = element.getAttribute && (element.getAttribute("role") === "button" || element.getAttribute("tabindex") !== null);
    return bottomHalf && (playerAncestor || named || roleButton) && r.width >= 8 && r.height >= 8 && r.width <= 520 && r.height <= 240;
  }

  function getPlayerControls() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll("button,[role='button'],[tabindex],[aria-label],[title]"));
    var result = [];
    var seen = [];
    var i, element;
    for (i = 0; i < candidates.length; i += 1) {
      element = candidates[i];
      if (seen.indexOf(element) >= 0 || !visible(element) || !looksLikePlayerControl(element)) continue;
      seen.push(element);
      result.push(element);
    }
    return result.sort(function (a, b) {
      var ar = rect(a);
      var br = rect(b);
      if (Math.abs(ar.cy - br.cy) > 24) return ar.cy - br.cy;
      return ar.cx - br.cx;
    });
  }

  function getPlayerDebug() {
    var videos = getVideos();
    var video = getPrimaryVideo();
    var src = video ? String(video.currentSrc || video.src || "") : "";
    var error = "";
    var controls = getPlayerControls();
    if (video && video.error) error = "code=" + String(video.error.code || "") + " message=" + String(video.error.message || "");
    return {
      count: videos.length,
      controls: controls.length,
      src: src.slice(0, 220),
      paused: video ? String(video.paused) : "null",
      readyState: video ? String(video.readyState) : "null",
      networkState: video ? String(video.networkState) : "null",
      currentTime: video && typeof video.currentTime === "number" ? String(Math.floor(video.currentTime)) : "null",
      duration: video && typeof video.duration === "number" && isFinite(video.duration) ? String(Math.floor(video.duration)) : "null",
      error: error || "none"
    };
  }

  function ensureStyles() {
    var style;
    if (document.querySelector("style[" + STYLE + "='1']")) return;
    style = document.createElement("style");
    style.setAttribute(STYLE, "1");
    style.textContent = [
      "[" + DIAG + "='1']{position:fixed;top:14px;right:14px;z-index:2147483647;width:min(760px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;padding:12px 14px;border:1px solid rgba(32,201,151,.6);border-radius:10px;background:rgba(5,10,18,.94);color:#f4fff9;font:12px/1.45 Consolas,'Courier New',monospace;white-space:pre-wrap;display:none}",
      "[" + DIAG + "='1'][data-open='true']{display:block}",
      "html[" + LOCK + "='true'] [class*='player'],html[" + LOCK + "='true'] [class*='Player'],html[" + LOCK + "='true'] [class*='control'],html[" + LOCK + "='true'] [class*='Control'],html[" + LOCK + "='true'] [class*='seek'],html[" + LOCK + "='true'] [class*='Seek'],html[" + LOCK + "='true'] [class*='progress'],html[" + LOCK + "='true'] [class*='Progress']{opacity:1!important;visibility:visible!important;pointer-events:auto!important}",
      "html[" + LOCK + "='true'] button,html[" + LOCK + "='true'] [role='button'],html[" + LOCK + "='true'] [tabindex]{pointer-events:auto!important}",
      "[" + FOCUS + "='true']{outline:3px solid #20c997!important;outline-offset:3px!important;border-radius:6px!important}",
      "[" + FALLBACK + "='1']{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:2147483646;padding:10px 14px;border-radius:10px;background:rgba(5,10,18,.88);color:#f4fff9;font:14px/1.4 system-ui,sans-serif;border:1px solid rgba(32,201,151,.5);display:none}",
      "html[" + LOCK + "='true'] [" + FALLBACK + "='1'][data-show='true']{display:block}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function getPanel() {
    var panel = document.querySelector("[" + DIAG + "='1']");
    if (!panel) {
      panel = document.createElement("pre");
      panel.setAttribute(DIAG, "1");
      document.body.appendChild(panel);
    }
    return panel;
  }

  function getFallbackOverlay() {
    var overlay = document.querySelector("[" + FALLBACK + "='1']");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.setAttribute(FALLBACK, "1");
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function updateFallbackOverlay() {
    var overlay = getFallbackOverlay();
    var debug = getPlayerDebug();
    overlay.setAttribute("data-show", state.overlayLocked && debug.controls === 0 ? "true" : "false");
    if (state.overlayMode === "seek-preview") {
      overlay.textContent = "Seeking: " + debug.currentTime + " / " + debug.duration + ". Press Left/Right to keep seeking.";
    } else {
      overlay.textContent = "Paused. Controls found: " + debug.controls + ". Press Play to resume or Back to close overlay.";
    }
  }

  function renderDiagnostics() {
    var debug = getPlayerDebug();
    var panel = getPanel();
    state.playerMode = hasPlayerVideo();
    panel.setAttribute("data-open", state.diagnosticsOpen ? "true" : "false");
    panel.textContent = [
      "Stremio Web TV Remote Diagnostics",
      "Version: " + VERSION,
      "Mode: player overlay + seek preview build",
      "Player mode: " + String(state.playerMode),
      "Overlay locked: " + String(state.overlayLocked),
      "Overlay mode: " + state.overlayMode,
      "Detail page: " + String(isDetailPage()),
      "Streams loading: " + String(isLoadingStreams()),
      "Video not supported text: " + String(hasUnsupportedVideoText()),
      "Last key: " + (state.lastKey || "none"),
      "Last action: " + (state.lastAction || "none"),
      "Last ignored: " + (state.lastIgnored || "none"),
      "Last back: " + (state.lastBack || "none"),
      "Last player: " + (state.lastPlayer || "none"),
      "Last seek: " + (state.lastSeek || "none"),
      "Last overlay: " + (state.lastOverlay || "none"),
      "Focused control: " + (state.lastFocusedControl || "none"),
      "Videos: " + debug.count + ", Controls: " + debug.controls,
      "Video src: " + (debug.src || "none"),
      "Video paused: " + debug.paused,
      "Video time: " + debug.currentTime + " / " + debug.duration,
      "Video readyState: " + debug.readyState,
      "Video networkState: " + debug.networkState,
      "Video error: " + debug.error,
      "Registered: " + (state.registeredKeys.join(", ") || "none"),
      "Failed: " + (state.failedKeys.map(function (item) { return item.keyName + ":" + item.message; }).join(", ") || "none")
    ].join("\n");
    updateFallbackOverlay();
  }

  function registerOptionalKeys() {
    var input = window.tizen && (window.tizen.tvinputdevice || window.tizen.inputdevice);
    var i;
    if (!input || !input.registerKey) return;
    for (i = 0; i < optionalKeys.length; i += 1) {
      try { input.registerKey(optionalKeys[i]); state.registeredKeys.push(optionalKeys[i]); }
      catch (error) { state.failedKeys.push({ keyName: optionalKeys[i], message: error && error.message ? error.message : String(error) }); }
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

  function revealNativeOverlay() {
    var video = getPrimaryVideo();
    var moveEvent;
    try {
      moveEvent = new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: Math.floor((window.innerWidth || 1920) / 2), clientY: Math.floor((window.innerHeight || 1080) - 90) });
      if (video) video.dispatchEvent(moveEvent);
      document.dispatchEvent(moveEvent);
      document.body.dispatchEvent(moveEvent);
      state.lastOverlay = "mousemove + css-lock";
      return true;
    } catch (_error) {
      state.lastOverlay = "css-lock-only";
      return false;
    }
  }

  function clearSeekPreviewTimer() {
    if (seekPreviewTimer) {
      window.clearTimeout(seekPreviewTimer);
      seekPreviewTimer = null;
    }
  }

  function unlockOverlay(reason) {
    var root = document.documentElement;
    clearSeekPreviewTimer();
    state.overlayLocked = false;
    state.overlayMode = "none";
    if (root && root.removeAttribute) root.removeAttribute(LOCK);
    if (focusedControl && focusedControl.removeAttribute) focusedControl.removeAttribute(FOCUS);
    focusedControl = null;
    state.focusedControlIndex = -1;
    state.lastFocusedControl = "";
    state.lastOverlay = reason || "unlock-overlay";
    renderDiagnostics();
  }

  function lockOverlay(mode, reason) {
    var root = document.documentElement;
    clearSeekPreviewTimer();
    state.overlayLocked = true;
    state.overlayMode = mode || "paused-controls";
    if (root && root.setAttribute) root.setAttribute(LOCK, "true");
    revealNativeOverlay();
    if (state.overlayMode === "paused-controls") focusPlayerControl(0, reason || "lock-overlay");
    renderDiagnostics();
  }

  function scheduleSeekPreviewUnlock() {
    clearSeekPreviewTimer();
    seekPreviewTimer = window.setTimeout(function () {
      var video = getPrimaryVideo();
      if (state.overlayMode === "seek-preview" && video && !video.paused) unlockOverlay("seek-preview-timeout");
    }, SEEK_PREVIEW_MS);
  }

  function focusPlayerControl(index, reason) {
    var controls = getPlayerControls();
    var control;
    if (!controls.length) {
      state.focusedControlIndex = -1;
      state.lastFocusedControl = "none";
      state.lastOverlay = reason + ":no-controls";
      return false;
    }
    index = Math.max(0, Math.min(controls.length - 1, index));
    if (focusedControl && focusedControl.removeAttribute) focusedControl.removeAttribute(FOCUS);
    control = controls[index];
    focusedControl = control;
    state.focusedControlIndex = index;
    state.lastFocusedControl = textOf(control) || control.tagName || "control";
    state.lastOverlay = reason;
    if (control.getAttribute && control.getAttribute("tabindex") === null && control.setAttribute) control.setAttribute("tabindex", "0");
    if (control.setAttribute) control.setAttribute(FOCUS, "true");
    try { control.focus({ preventScroll: true }); } catch (_error) { try { control.focus(); } catch (_error2) {} }
    return true;
  }

  function movePlayerFocus(direction) {
    var controls = getPlayerControls();
    var nextIndex;
    if (!state.overlayLocked || state.overlayMode !== "paused-controls") return false;
    if (!controls.length) { state.lastPlayer = "player-controls:none"; renderDiagnostics(); return true; }
    nextIndex = state.focusedControlIndex;
    if (nextIndex < 0 || !focusedControl) nextIndex = 0;
    if (direction === "left") nextIndex = Math.max(0, nextIndex - 1);
    if (direction === "right") nextIndex = Math.min(controls.length - 1, nextIndex + 1);
    if (direction === "up" || direction === "down") { state.lastPlayer = "player-" + direction + ":kept-overlay"; renderDiagnostics(); return true; }
    focusPlayerControl(nextIndex, "player-focus-" + direction);
    state.lastPlayer = "player-focus-" + direction;
    renderDiagnostics();
    return true;
  }

  function clickFocusedControl() {
    if (!state.overlayLocked || state.overlayMode !== "paused-controls" || !focusedControl) return false;
    try { focusedControl.click(); state.lastPlayer = "clicked-control:" + (textOf(focusedControl) || focusedControl.tagName || "control"); renderDiagnostics(); return true; }
    catch (error) { state.lastPlayer = "click-control-error:" + (error && error.message ? error.message : String(error)); renderDiagnostics(); return true; }
  }

  function pauseAndLockOverlay(action) {
    var video = getPrimaryVideo();
    if (!video) { state.lastPlayer = action + ":no-video"; renderDiagnostics(); return false; }
    try {
      if (video.pause) video.pause();
      state.lastPlayer = action + ":pause-lock-overlay";
      lockOverlay("paused-controls", action);
      return true;
    } catch (error) { state.lastPlayer = action + ":error:" + (error && error.message ? error.message : String(error)); renderDiagnostics(); return false; }
  }

  function playAndUnlockOverlay(action) {
    var video = getPrimaryVideo();
    if (!video) { state.lastPlayer = action + ":no-video"; renderDiagnostics(); return false; }
    try {
      if (video.play) video.play();
      state.lastPlayer = action + ":play-unlock-overlay";
      unlockOverlay(action);
      return true;
    } catch (error) { state.lastPlayer = action + ":error:" + (error && error.message ? error.message : String(error)); renderDiagnostics(); return false; }
  }

  function seekVideo(action, delta, previewMode) {
    var video = getPrimaryVideo();
    var duration;
    var before;
    if (!video) { state.lastPlayer = action + ":no-video"; renderDiagnostics(); return false; }
    try {
      before = typeof video.currentTime === "number" ? video.currentTime : 0;
      duration = typeof video.duration === "number" && isFinite(video.duration) ? video.duration : Number.MAX_SAFE_INTEGER;
      video.currentTime = Math.max(0, Math.min(duration, before + delta));
      state.lastPlayer = action + ":seek";
      state.lastSeek = Math.floor(before) + " -> " + Math.floor(video.currentTime);
      if (previewMode) {
        lockOverlay("seek-preview", action);
        scheduleSeekPreviewUnlock();
      } else {
        lockOverlay("paused-controls", action);
      }
      return true;
    } catch (error) { state.lastPlayer = action + ":error:" + (error && error.message ? error.message : String(error)); renderDiagnostics(); return false; }
  }

  function handleMediaKey(keyName) {
    var video = getPrimaryVideo();
    if (!video) { state.lastPlayer = keyName + ":no-video"; renderDiagnostics(); return false; }
    if (keyName === "MediaPause") return pauseAndLockOverlay(keyName);
    if (keyName === "MediaPlay") return playAndUnlockOverlay(keyName);
    if (keyName === "MediaPlayPause") return video.paused ? playAndUnlockOverlay(keyName) : pauseAndLockOverlay(keyName);
    if (keyName === "MediaStop") { try { video.currentTime = 0; } catch (_error) {} return pauseAndLockOverlay(keyName); }
    if (keyName === "MediaFastForward") return seekVideo(keyName, SEEK_SECONDS, true);
    if (keyName === "MediaRewind") return seekVideo(keyName, -SEEK_SECONDS, true);
    return false;
  }

  function handleArrowSeek(keyName) {
    if (!hasPlayerVideo()) return false;
    if (state.overlayMode === "paused-controls") return false;
    if (keyName === "ArrowLeft") return seekVideo("ArrowLeft", -SEEK_SECONDS, true);
    if (keyName === "ArrowRight") return seekVideo("ArrowRight", SEEK_SECONDS, true);
    if (state.overlayMode === "seek-preview" && (keyName === "ArrowUp" || keyName === "ArrowDown")) { state.lastPlayer = keyName + ":seek-preview-kept"; renderDiagnostics(); return true; }
    return false;
  }

  function dispatchEscapeFallback() {
    var escapeEvent;
    try { escapeEvent = new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }); document.dispatchEvent(escapeEvent); return true; }
    catch (_error) { return false; }
  }

  function handleBack(event) {
    if (state.diagnosticsOpen) { state.diagnosticsOpen = false; state.lastBack = "closed-diagnostics"; renderDiagnostics(); consume(event); return true; }
    if (state.overlayLocked) { unlockOverlay("back-unlock-overlay"); state.lastBack = "unlocked-overlay"; renderDiagnostics(); consume(event); return true; }
    try { if (window.history && window.history.length > 1 && typeof window.history.back === "function") { window.history.back(); state.lastBack = "history-back"; renderDiagnostics(); consume(event); return true; } } catch (_historyError) {}
    if (dispatchEscapeFallback()) { state.lastBack = "escape-fallback"; renderDiagnostics(); consume(event); return true; }
    state.lastBack = "pass-through"; renderDiagnostics(); return false;
  }

  function handleKey(event) {
    var normalizedKey = normalizeKey(event);
    state.lastKey = normalizedKey;
    state.lastAction = "key:" + normalizedKey;

    if (diagnosticsKeys[normalizedKey]) { state.diagnosticsOpen = !state.diagnosticsOpen; renderDiagnostics(); consume(event); return true; }
    if (normalizedKey === "Back") return handleBack(event);
    if (mediaKeys[normalizedKey]) { if (handleMediaKey(normalizedKey)) { consume(event); return true; } return false; }
    if (arrowKeys[normalizedKey]) {
      if (handleArrowSeek(normalizedKey)) { consume(event); return true; }
      if (state.overlayLocked && state.overlayMode === "paused-controls") {
        if (normalizedKey === "ArrowLeft") movePlayerFocus("left");
        if (normalizedKey === "ArrowRight") movePlayerFocus("right");
        if (normalizedKey === "ArrowUp") movePlayerFocus("up");
        if (normalizedKey === "ArrowDown") movePlayerFocus("down");
        consume(event);
        return true;
      }
    }
    if (state.overlayLocked && state.overlayMode === "paused-controls" && normalizedKey === "Enter") { clickFocusedControl(); consume(event); return true; }

    state.lastIgnored = "pass-through:" + normalizedKey;
    renderDiagnostics();
    return false;
  }

  function init() {
    if (state.initialized) return;
    ensureStyles();
    registerOptionalKeys();
    document.addEventListener("keydown", handleKey, true);
    document.addEventListener("tizenhwkey", handleKey, true);
    window.addEventListener("keydown", handleKey, true);
    window.addEventListener("tizenhwkey", handleKey, true);
    state.initialized = true;
    window[NS] = api;
    renderDiagnostics();
  }

  var api = {
    initialized: false,
    version: VERSION,
    getState: function () { return JSON.parse(JSON.stringify(state)); },
    openDiagnostics: function () { state.diagnosticsOpen = true; renderDiagnostics(); },
    closeDiagnostics: function () { state.diagnosticsOpen = false; renderDiagnostics(); },
    toggleDiagnostics: function () { state.diagnosticsOpen = !state.diagnosticsOpen; renderDiagnostics(); },
    lockOverlay: function () { return pauseAndLockOverlay("api-lock-overlay"); },
    unlockOverlay: function () { unlockOverlay("api-unlock-overlay"); },
    play: function () { return playAndUnlockOverlay("api-play"); },
    pause: function () { return pauseAndLockOverlay("api-pause"); },
    seekPreview: function (delta) { return seekVideo("api-seek-preview", Number(delta) || SEEK_SECONDS, true); }
  };

  window[NS] = api;
  if (document.readyState === "interactive" || document.readyState === "complete") init();
  else document.addEventListener("DOMContentLoaded", init, false);
  api.initialized = true;
}(typeof window !== "undefined" ? window : this));
