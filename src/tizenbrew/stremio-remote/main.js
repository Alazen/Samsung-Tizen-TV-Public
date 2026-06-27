(function bootstrapStremioRemote(globalScope) {
  "use strict";

  var NAMESPACE = "__STREMIO_TIZENBREW_REMOTE__";
  var RUNTIME_VERSION = "0.3.3";
  var RUNTIME_SOURCE_MARKER = "stremio-webapp-reorg-runtime-v1";
  var DIAGNOSTICS_ATTRIBUTE = "data-stremio-remote-diagnostics-panel";
  var STYLE_ATTRIBUTE = "data-stremio-remote-style";
  var FOCUS_ATTRIBUTE = "data-stremio-tv-focus";
  var EVENT_MARK = "__stremioRemoteSeen";
  var SEEK_SECONDS = 15;
  var PLAYER_MIN_SCREEN_AREA = 0.12;
  var CACHE_MS = 180;

  if (globalScope[NAMESPACE] && globalScope[NAMESPACE].initialized) return;

  var state = {
    initialized: false,
    version: RUNTIME_VERSION,
    diagnosticsOpen: false,
    lastKey: "",
    lastAction: "",
    lastSpatial: "",
    lastTarget: "",
    lastPlayer: "",
    lastError: "",
    registeredKeys: [],
    failedKeys: []
  };

  var focusElement = null;
  var mediaEvents = [];
  var cache = { at: 0, scrollY: -1, cards: [], rails: [] };

  var optionalKeys = ["MediaPlayPause", "MediaPlay", "MediaPause", "MediaStop", "MediaFastForward", "MediaRewind", "ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue", "Info"];
  var diagnosticsKeys = { Info: true, ColorF0Red: true, ColorF1Green: true, ColorF2Yellow: true, ColorF3Blue: true, Digit1: true };
  var mediaKeys = { MediaPlayPause: true, MediaPlay: true, MediaPause: true, MediaFastForward: true, MediaRewind: true };
  var arrowKeys = { ArrowLeft: true, ArrowRight: true, ArrowUp: true, ArrowDown: true };

  var keyCodeMap = {
    8: "Back", 13: "Enter", 27: "Back", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 49: "Digit1", 97: "Digit1",
    403: "ColorF0Red", 404: "ColorF1Green", 405: "ColorF2Yellow", 406: "ColorF3Blue", 412: "MediaRewind", 415: "MediaPlay", 417: "MediaFastForward",
    457: "Info", 10009: "Back", 10252: "MediaPlayPause"
  };

  var keyAliasMap = {
    Back: "Back", Return: "Back", Escape: "Back", Backspace: "Back", Left: "ArrowLeft", Right: "ArrowRight", Up: "ArrowUp", Down: "ArrowDown",
    ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", Play: "MediaPlay", Pause: "MediaPause",
    MediaPlay: "MediaPlay", MediaPause: "MediaPause", MediaPlayPause: "MediaPlayPause", FastForward: "MediaFastForward", Rewind: "MediaRewind",
    "1": "Digit1", Digit1: "Digit1", Numpad1: "Digit1"
  };

  var selectorGroups = {
    contentCards: "a[href*='#/detail'],a[href*='/detail'],a[class*='meta-item'],[class*='meta-item'][tabindex],[class*='poster'][tabindex]",
    sidebarRails: "nav[class*='vertical-nav-bar'] a,[class*='vertical-nav-bar'] a,[class*='nav-tab-button']",
    videoElements: "video"
  };

  function rect(element) {
    var raw, left, top, width, height;
    if (!element || !element.getBoundingClientRect) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, cx: 0, cy: 0, area: 0 };
    raw = element.getBoundingClientRect();
    left = Number(raw.left) || 0; top = Number(raw.top) || 0; width = Number(raw.width) || 0; height = Number(raw.height) || 0;
    return { left: left, top: top, right: left + width, bottom: top + height, width: width, height: height, cx: left + width / 2, cy: top + height / 2, area: width * height };
  }

  function queryAll(selector) { try { return Array.prototype.slice.call(document.querySelectorAll(selector)); } catch (_error) { return []; } }

  function visible(element) {
    var box, style;
    if (!element || !element.getBoundingClientRect) return false;
    if (element.closest && element.closest("[" + DIAGNOSTICS_ATTRIBUTE + "='1']")) return false;
    box = rect(element);
    if (box.width < 4 || box.height < 4) return false;
    try {
      style = globalScope.getComputedStyle(element);
      if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)) return false;
    } catch (_error) {}
    return true;
  }

  function label(element) {
    return String(element && ((element.getAttribute && (element.getAttribute("aria-label") || element.getAttribute("title"))) || element.textContent) || "").replace(/\s+/g, " ").slice(0, 80);
  }

  function collect(selector, kind) {
    var result = [], seen = [], railLimit = (globalScope.innerWidth || 1920) * 0.34;
    queryAll(selector).forEach(function addCandidate(element) {
      var box;
      if (seen.indexOf(element) >= 0 || !visible(element)) return;
      box = rect(element);
      if (kind === "card" && ((element.closest && element.closest(selectorGroups.sidebarRails)) || box.width < 40 || box.height < 35)) return;
      if (kind === "rail" && (box.cx > railLimit || box.width < 12 || box.height < 12)) return;
      seen.push(element);
      result.push({ element: element, box: box, label: label(element) });
    });
    result.sort(function sortSpatial(a, b) { return Math.abs(a.box.cy - b.box.cy) > 24 ? a.box.cy - b.box.cy : a.box.cx - b.box.cx; });
    return result;
  }

  function spatialCache() {
    var now = Date.now(), y = globalScope.scrollY || globalScope.pageYOffset || 0;
    if (cache.cards && now - cache.at < CACHE_MS && cache.scrollY === y) return cache;
    cache = { at: now, scrollY: y, cards: collect(selectorGroups.contentCards, "card"), rails: collect(selectorGroups.sidebarRails, "rail") };
    return cache;
  }

  function role(element) {
    if (!element) return "none";
    if (element.closest && element.closest(selectorGroups.sidebarRails)) return "rail";
    if ((element.matches && element.matches(selectorGroups.contentCards)) || (element.closest && element.closest(selectorGroups.contentCards))) return "card";
    return "none";
  }

  function activeTarget() {
    var current = document.activeElement, spatial = spatialCache();
    if (focusElement && visible(focusElement)) return focusElement;
    if (current && current !== document.body && current !== document.documentElement && visible(current) && role(current) !== "none") {
      return role(current) === "rail" ? current.closest(selectorGroups.sidebarRails) || current : current.closest(selectorGroups.contentCards) || current;
    }
    return spatial.cards[0] && spatial.cards[0].element;
  }

  function focusTarget(element, reason) {
    var box;
    if (!element || !visible(element)) { state.lastSpatial = "no-target:" + reason; return false; }
    if (focusElement && focusElement !== element && focusElement.removeAttribute) focusElement.removeAttribute(FOCUS_ATTRIBUTE);
    focusElement = element;
    if (element.getAttribute && element.getAttribute("tabindex") === null) element.setAttribute("tabindex", "0");
    element.setAttribute(FOCUS_ATTRIBUTE, "true");
    try { element.focus({ preventScroll: true }); } catch (_error) { try { element.focus(); } catch (_error2) {} }
    box = rect(element);
    try { if (box.top < 90 || box.bottom > (globalScope.innerHeight || 1080) - 70) element.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" }); } catch (_error3) {}
    state.lastSpatial = reason;
    state.lastTarget = role(element) + ":" + label(element);
    return true;
  }

  function itemFor(element, list) {
    var i;
    for (i = 0; i < list.length; i += 1) if (list[i].element === element || (list[i].element.contains && list[i].element.contains(element))) return list[i];
    return null;
  }

  function best(list, reference, filter, score) {
    var winner = null, winnerScore = Infinity;
    list.forEach(function testItem(item) {
      var value;
      if (item.element === reference.element) return;
      if (filter && !filter(item.box, reference.box)) return;
      value = score(item.box, reference.box);
      if (value < winnerScore) { winnerScore = value; winner = item; }
    });
    return winner;
  }

  function horizontal(list, reference, direction) {
    return best(list, reference, function filter(box, ref) {
      var overlap = Math.max(0, Math.min(box.bottom, ref.bottom) - Math.max(box.top, ref.top));
      if (overlap < 18 && Math.abs(box.cy - ref.cy) > 50) return false;
      return direction < 0 ? box.cx < ref.cx - 8 : box.cx > ref.cx + 8;
    }, function score(box, ref) { return Math.abs(box.cx - ref.cx) * 1000 + Math.abs(box.cy - ref.cy); });
  }

  function vertical(list, reference, direction) {
    return best(list, reference, function filter(box, ref) { return direction < 0 ? box.cy < ref.cy - 25 : box.cy > ref.cy + 25; }, function score(box, ref) { return Math.abs(box.cy - ref.cy) * 1000 + Math.abs(box.cx - ref.cx); });
  }

  function nearestRail(spatial, reference) { return best(spatial.rails, reference, null, function score(box, ref) { return Math.abs(box.cy - ref.cy) * 1000 + Math.abs(box.cx - ref.cx); }) || spatial.rails[0]; }
  function nearestCard(spatial, reference) { return best(spatial.cards, reference, function rightOfRail(box, ref) { return box.cx > ref.cx + 10; }, function score(box, ref) { return Math.abs(box.cy - ref.cy) * 1000 + Math.abs(box.cx - ref.cx); }) || spatial.cards[0]; }
  function listMove(list, reference, delta) { var index = list.indexOf(reference); return list.length ? list[Math.max(0, Math.min(list.length - 1, index + delta))] || list[0] : null; }

  function handleNavigation(keyName) {
    var spatial, target, current, currentRole, reference;
    if (getPrimaryVideo()) return false;
    spatial = spatialCache(); current = activeTarget(); currentRole = role(current);
    if (currentRole === "none" && keyName === "ArrowLeft" && spatial.rails.length) return focusTarget(spatial.rails[0].element, "fallback-left-rail");
    reference = itemFor(current, currentRole === "rail" ? spatial.rails : spatial.cards);
    if (!reference) return false;
    if (currentRole === "rail") {
      if (keyName === "ArrowUp") target = listMove(spatial.rails, reference, -1);
      else if (keyName === "ArrowDown") target = listMove(spatial.rails, reference, 1);
      else if (keyName === "ArrowRight") target = nearestCard(spatial, reference);
      else if (keyName === "ArrowLeft") { state.lastSpatial = "rail-left-noop"; return true; }
      return target ? focusTarget(target.element, "rail-" + keyName) : false;
    }
    if (keyName === "ArrowLeft") target = horizontal(spatial.cards, reference, -1) || nearestRail(spatial, reference);
    else if (keyName === "ArrowRight") target = horizontal(spatial.cards, reference, 1);
    else if (keyName === "ArrowUp") target = vertical(spatial.cards, reference, -1);
    else if (keyName === "ArrowDown") target = vertical(spatial.cards, reference, 1);
    return target ? focusTarget(target.element, "card-" + keyName) : false;
  }

  function getPrimaryVideo() {
    var bestVideo = null, bestArea = -1, screenArea = (globalScope.innerWidth || 1920) * (globalScope.innerHeight || 1080);
    queryAll(selectorGroups.videoElements).forEach(function checkVideo(video) {
      var box = rect(video), hasEvidence = video && (video.currentSrc || video.src || video.readyState > 0 || video.currentTime > 0 || video.paused === false);
      if (visible(video) && hasEvidence && box.area > screenArea * PLAYER_MIN_SCREEN_AREA && box.area >= bestArea) { bestVideo = video; bestArea = box.area; }
    });
    return bestVideo;
  }

  function debugVideo() { return getPrimaryVideo() || queryAll("video")[0] || null; }
  function redactUrl(value) { var link; if (!value) return "none"; try { link = document.createElement("a"); link.href = String(value); return String((link.protocol || "") + "//" + (link.host || "") + (link.pathname || "")).slice(0, 180); } catch (_error) { return String(value).split("?")[0].slice(0, 180); } }
  function videoError(video) { return video && video.error ? "code=" + String(video.error.code || "") + " message=" + String(video.error.message || "") : "none"; }
  function canPlay(video, type) { try { return video && video.canPlayType ? (video.canPlayType(type) || "no") : "no-method"; } catch (_error) { return "error"; } }
  function mediaSourceSupport(type) { try { return globalScope.MediaSource && globalScope.MediaSource.isTypeSupported ? String(globalScope.MediaSource.isTypeSupported(type)) : "no-mediasource"; } catch (_error) { return "error"; } }

  function attachVideoWatchers() {
    queryAll("video").forEach(function attach(video) {
      if (video.__stremioRemoteWatch) return;
      video.__stremioRemoteWatch = true;
      "loadstart loadedmetadata loadeddata canplay playing waiting stalled suspend error emptied abort ended pause".split(" ").forEach(function add(name) {
        try { video.addEventListener(name, function onMediaEvent(event) { mediaEvents.push(event.type + " rs=" + video.readyState + " ns=" + video.networkState + " t=" + Math.floor(video.currentTime || 0) + " err=" + videoError(video)); while (mediaEvents.length > 12) mediaEvents.shift(); }, false); } catch (_error) {}
      });
    });
  }

  function playbackLines() {
    var video = debugVideo(), videos = queryAll("video"), box = video ? rect(video) : { width: 0, height: 0, area: 0 }, screenArea = (globalScope.innerWidth || 1920) * (globalScope.innerHeight || 1080);
    attachVideoWatchers();
    return [
      "Playback diagnostics", "UA: " + String(navigator.userAgent || "none").slice(0, 150), "URL: " + redactUrl(location && location.href), "MediaSource: " + String(Boolean(globalScope.MediaSource)),
      "video count: " + videos.length, "real player: " + String(Boolean(getPrimaryVideo())), "video rect: " + Math.round(box.width) + "x" + Math.round(box.height) + " area%=" + (screenArea ? Math.round(box.area / screenArea * 1000) / 10 : 0),
      "currentSrc: " + redactUrl(video && video.currentSrc), "src: " + redactUrl(video && video.src), "error: " + videoError(video), "networkState: " + (video ? String(video.networkState) : "null"),
      "readyState: " + (video ? String(video.readyState) : "null"), "paused: " + (video ? String(video.paused) : "null"), "time: " + (video && typeof video.currentTime === "number" ? Math.floor(video.currentTime) : "null") + " / " + (video && isFinite(video.duration) ? Math.floor(video.duration) : "null"),
      "can AVC baseline: " + canPlay(video, 'video/mp4; codecs="avc1.42E01E"'), "can AVC high: " + canPlay(video, 'video/mp4; codecs="avc1.640028"'), "can HEVC hvc1: " + canPlay(video, 'video/mp4; codecs="hvc1.1.6.L120.90"'),
      "MSE AVC baseline: " + mediaSourceSupport('video/mp4; codecs="avc1.42E01E"'), "MSE AVC high: " + mediaSourceSupport('video/mp4; codecs="avc1.640028"'), "MSE HEVC hvc1: " + mediaSourceSupport('video/mp4; codecs="hvc1.1.6.L120.90"'),
      "events:", mediaEvents.length ? mediaEvents.join("\n") : "none"
    ];
  }

  function ensureStyles() {
    var style;
    if (document.querySelector("style[" + STYLE_ATTRIBUTE + "='1']")) return;
    style = document.createElement("style");
    style.setAttribute(STYLE_ATTRIBUTE, "1");
    style.textContent = "[" + DIAGNOSTICS_ATTRIBUTE + "='1']{position:fixed;top:14px;right:14px;z-index:2147483647;width:min(900px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;padding:12px 14px;background:rgba(5,10,18,.94);color:#f4fff9;font:12px/1.45 monospace;white-space:pre-wrap;display:none}[" + DIAGNOSTICS_ATTRIBUTE + "='1'][data-open='true']{display:block}[" + FOCUS_ATTRIBUTE + "='true']{outline:3px solid #20c997!important;outline-offset:3px!important;border-radius:6px!important}";
    document.head.appendChild(style);
  }

  function panel(create) { var existing = document.querySelector("[" + DIAGNOSTICS_ATTRIBUTE + "='1']"); if (!existing && create) { existing = document.createElement("pre"); existing.setAttribute(DIAGNOSTICS_ATTRIBUTE, "1"); document.body.appendChild(existing); } return existing; }

  function renderDiagnostics() {
    var existing, spatial;
    if (!state.diagnosticsOpen) return;
    spatial = spatialCache(); existing = panel(true); existing.setAttribute("data-open", "true");
    existing.textContent = ["Stremio Web TV Remote Diagnostics", "Version: " + RUNTIME_VERSION, "Source: " + RUNTIME_SOURCE_MARKER, "Mode: reorganized TizenBrew runtime", "Toggle: 1, Info, or color buttons", "Cards: " + spatial.cards.length, "Rails: " + spatial.rails.length, "Last key: " + (state.lastKey || "none"), "Last action: " + (state.lastAction || "none"), "Last spatial: " + (state.lastSpatial || "none"), "Target: " + (state.lastTarget || "none"), "Last player: " + (state.lastPlayer || "none"), "Last error: " + (state.lastError || "none"), "Registered: " + (state.registeredKeys.join(", ") || "none"), "Failed: " + (state.failedKeys.map(function (item) { return item.keyName + ":" + item.message; }).join(", ") || "none"), ""].concat(playbackLines()).join("\n");
  }

  function registerOptionalKeys() {
    var input = globalScope.tizen && (globalScope.tizen.tvinputdevice || globalScope.tizen.inputdevice);
    if (!input || !input.registerKey) return;
    optionalKeys.forEach(function register(keyName) { try { input.registerKey(keyName); state.registeredKeys.push(keyName); } catch (error) { state.failedKeys.push({ keyName: keyName, message: error && error.message ? error.message : String(error) }); } });
  }

  function normalizeKey(event) { var raw = event && (event.keyName || event.key || event.code) || ""; return keyAliasMap[raw] || keyCodeMap[event && event.keyCode] || raw; }
  function consume(event) { if (event && event.preventDefault) event.preventDefault(); if (event && event.stopPropagation) event.stopPropagation(); if (event && event.stopImmediatePropagation) event.stopImmediatePropagation(); }
  function toggleDiagnostics(event) { var existing; state.diagnosticsOpen = !state.diagnosticsOpen; if (!state.diagnosticsOpen) { existing = panel(false); if (existing) existing.setAttribute("data-open", "false"); consume(event); return true; } renderDiagnostics(); consume(event); return true; }

  function seekVideo(keyName, amount) {
    var video = getPrimaryVideo(), before, duration;
    if (!video) { state.lastPlayer = keyName + ":no-real-player"; renderDiagnostics(); return false; }
    try { before = video.currentTime || 0; duration = isFinite(video.duration) ? video.duration : Number.MAX_SAFE_INTEGER; video.currentTime = Math.max(0, Math.min(duration, before + amount)); state.lastPlayer = keyName + ":seek"; renderDiagnostics(); return true; } catch (error) { state.lastError = error && error.message ? error.message : String(error); renderDiagnostics(); return false; }
  }

  function handleMediaKey(keyName) {
    var video = getPrimaryVideo();
    if (!video) { state.lastPlayer = keyName + ":no-real-player"; renderDiagnostics(); return false; }
    if (keyName === "MediaPlay") { try { video.play(); } catch (_error) {} state.lastPlayer = keyName + ":play"; return true; }
    if (keyName === "MediaPause") { try { video.pause(); } catch (_error2) {} state.lastPlayer = keyName + ":pause"; return true; }
    if (keyName === "MediaPlayPause") return video.paused ? handleMediaKey("MediaPlay") : handleMediaKey("MediaPause");
    if (keyName === "MediaFastForward") return seekVideo(keyName, SEEK_SECONDS);
    if (keyName === "MediaRewind") return seekVideo(keyName, -SEEK_SECONDS);
    return false;
  }

  function handleBack(event) { var existing; if (state.diagnosticsOpen) { state.diagnosticsOpen = false; existing = panel(false); if (existing) existing.setAttribute("data-open", "false"); consume(event); return true; } return false; }

  function handleKey(event) {
    var keyName;
    try {
      if (!event) return false;
      if (event[EVENT_MARK]) return false;
      event[EVENT_MARK] = true;
      keyName = normalizeKey(event); state.lastKey = keyName; state.lastAction = "key:" + keyName;
      if (diagnosticsKeys[keyName]) return toggleDiagnostics(event);
      if (keyName === "Back") return handleBack(event);
      if (mediaKeys[keyName] && handleMediaKey(keyName)) { consume(event); return true; }
      if (arrowKeys[keyName]) {
        if (getPrimaryVideo() && (keyName === "ArrowLeft" || keyName === "ArrowRight") && seekVideo(keyName, keyName === "ArrowLeft" ? -SEEK_SECONDS : SEEK_SECONDS)) { consume(event); return true; }
        if (handleNavigation(keyName)) { consume(event); renderDiagnostics(); return true; }
      }
      return false;
    } catch (error) { state.lastError = error && error.message ? error.message : String(error); state.diagnosticsOpen = true; renderDiagnostics(); return false; }
  }

  function init() {
    if (state.initialized) return;
    ensureStyles(); registerOptionalKeys();
    document.addEventListener("keydown", handleKey, true); document.addEventListener("tizenhwkey", handleKey, true);
    globalScope.addEventListener("keydown", handleKey, true); globalScope.addEventListener("tizenhwkey", handleKey, true);
    state.initialized = true; globalScope[NAMESPACE] = api;
  }

  var api = {
    initialized: false,
    version: RUNTIME_VERSION,
    getState: function getState() { return JSON.parse(JSON.stringify(state)); },
    openDiagnostics: function openDiagnostics() { state.diagnosticsOpen = true; renderDiagnostics(); },
    closeDiagnostics: function closeDiagnostics() { var existing; state.diagnosticsOpen = false; existing = panel(false); if (existing) existing.setAttribute("data-open", "false"); },
    toggleDiagnostics: function publicToggle() { state.diagnosticsOpen = !state.diagnosticsOpen; renderDiagnostics(); }
  };

  globalScope[NAMESPACE] = api;
  if (document.readyState === "interactive" || document.readyState === "complete") init();
  else document.addEventListener("DOMContentLoaded", init, false);
  api.initialized = true;
}(typeof window !== "undefined" ? window : this));
