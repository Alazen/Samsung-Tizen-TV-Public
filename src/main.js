(function bootstrapStremioTizenBrew(globalScope) {
  "use strict";

  var NAMESPACE = "__STREMIO_TIZENBREW_REMOTE__";
  var RUNTIME_VERSION = "0.1.2";
  var RUNTIME_SOURCE_MARKER = "stremio-webapp-src-main-js-task4e-v1";
  var RUNTIME_INJECTION_MARKER = "stremio-webapp-runtime-injection-v1";
  var FOCUS_ATTRIBUTE = "data-stremio-remote-focus";
  var STYLE_ATTRIBUTE = "data-stremio-remote-style";
  var DIAGNOSTICS_ATTRIBUTE = "data-stremio-remote-diagnostics-panel";
  var DIAGNOSTICS_BODY_ATTRIBUTE = "data-stremio-remote-diagnostics-body";
  var EXIT_MODAL_ATTRIBUTE = "data-stremio-remote-exit-modal";
  var EXIT_BUTTON_ATTRIBUTE = "data-stremio-remote-exit-button";
  var BOOT_BADGE_ATTRIBUTE = "data-stremio-remote-boot-badge";
  var DUPLICATE_EVENT_WINDOW_MS = 220;
  var FOCUS_CACHE_MS = 160;
  var SEEK_STEP_SECONDS = 15;
  var DIAGNOSTICS_REPEAT_WINDOW_MS = 1400;

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
    BrowserBack: "Back",
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
    ColorF3Blue: "ColorF3Blue",
    Info: "Info"
  };

  var stremioSelectorGroups = {
    authControls: [
      "input[type='email']",
      "input[type='password']",
      "input[name*='email']",
      "input[name*='password']",
      "input[placeholder*='email']",
      "input[placeholder*='password']",
      "textarea",
      "select",
      "label",
      "[role='textbox']",
      "[role='checkbox']",
      "[class*='login']",
      "[class*='signup']",
      "[class*='auth']",
      "[class*='guest']",
      "[class*='oauth']",
      "[class*='button-container']"
    ],
    homeNavigation: [
      "nav a",
      "nav [tabindex]",
      "[class*='nav-tab-button']",
      "[class*='vertical-nav-bar'] a",
      "[class*='horizontal-nav-bar'] [tabindex]",
      "[class*='search-bar']",
      "[class*='search-input']",
      "[class*='submit-button']",
      "[class*='menu-button']",
      "[class*='button-container'][title]"
    ],
    contentCards: [
      "a[href*='#/detail']",
      "a[href*='#/discover']",
      "a[href*='#/continuewatching']",
      "[class*='meta-item']",
      "[class*='poster']",
      "[class*='card']",
      "[class*='tile']",
      "[class*='see-all']",
      "[class*='dismiss-icon']",
      "[class*='menu-label']"
    ],
    detailsActions: [
      "[class*='detail'] [class*='button']",
      "[class*='details'] [class*='button']",
      "[class*='watch']",
      "[class*='add'][class*='button']",
      "[class*='trailer']",
      "[class*='season']",
      "[class*='episode']",
      "a[href*='#/detail'] [class*='button']"
    ],
    streamRows: [
      "[class*='stream']",
      "[class*='streams']",
      "[class*='provider']",
      "[class*='source']",
      "[class*='addon']",
      "[class*='episode']",
      "[class*='season']",
      "[role='listitem'][tabindex]"
    ],
    playerContainers: [
      "video",
      "[class*='player']",
      "[class*='video']",
      "[class*='cinema']",
      "[class*='streaming']"
    ],
    playerControls: [
      "video",
      "[aria-label*='play']",
      "[aria-label*='pause']",
      "[aria-label*='seek']",
      "[aria-label*='forward']",
      "[aria-label*='rewind']",
      "[title*='play']",
      "[title*='pause']",
      "[title*='seek']",
      "[title*='fullscreen']",
      "[class*='player'] [class*='button']",
      "[class*='player'] [tabindex]",
      "[class*='control']",
      "[class*='control-bar']",
      "[class*='controls']",
      "[class*='seek']",
      "[class*='progress']",
      "[class*='fullscreen']",
      "[class*='volume']"
    ],
    playerBackControls: [
      "[aria-label*='back']",
      "[aria-label*='close']",
      "[aria-label*='exit']",
      "[title*='back']",
      "[title*='close']",
      "[title*='exit']",
      "[class*='back']",
      "[class*='close']",
      "[class*='dismiss']",
      "[class*='return']"
    ],
    playerMenuControls: [
      "[aria-label*='subtitle']",
      "[aria-label*='audio']",
      "[aria-label*='settings']",
      "[title*='subtitle']",
      "[title*='audio']",
      "[title*='settings']",
      "[class*='subtitle']",
      "[class*='subtitles']",
      "[class*='audio']",
      "[class*='settings']",
      "[class*='menu'] [class*='button']"
    ],
    menuControls: [
      "[role='menu'] [role='menuitem']",
      "[class*='menu'] [tabindex]",
      "[class*='popup'] [tabindex]",
      "[class*='dropdown'] [tabindex]",
      "[class*='menu-button']",
      "[class*='nav-menu-popup']"
    ],
    focusGuards: [
      "[data-focus-guard]",
      "[class*='focus-guard']",
      "[class*='focuslock']",
      "[data-radix-focus-guard]",
      "[tabindex='0'][aria-hidden='true']"
    ],
    excludedControls: [
      "script",
      "style",
      "template",
      "[hidden]",
      "[aria-hidden='true']",
      "[disabled]",
      "[data-stremio-remote-diagnostics-panel]",
      "[data-stremio-remote-diagnostics-panel] *",
      "[data-stremio-remote-exit-modal]",
      "[data-stremio-remote-exit-modal] *",
      "[data-stremio-remote-boot-badge]"
    ]
  };

  var genericCandidateSelectors = [
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
    "[class*='btn']",
    "[class*='card']",
    "[class*='poster']",
    "[class*='tile']",
    "[class*='nav']",
    "[class*='menu']",
    "[class*='control']",
    "[class*='login']",
    "[class*='signup']",
    "[class*='auth']"
  ];

  var orderedSelectorGroups = [
    "playerControls",
    "playerBackControls",
    "playerMenuControls",
    "menuControls",
    "authControls",
    "detailsActions",
    "streamRows",
    "homeNavigation",
    "contentCards"
  ];

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
    bootBadgeShown: false,
    exitModalCreated: false,
    exitModalOpen: false,
    keyListenerAttached: false,
    domReadyHookAttached: false,
    currentFocusRole: null,
    currentFocusText: "",
    candidateCount: 0,
    candidateGroups: {},
    lastRawEvent: null,
    lastKey: null,
    lastAction: null,
    lastConsumedAction: null,
    lastBackResolution: null,
    lastExitAttempt: null,
    lastExitResult: null,
    lastVideoState: null,
    lastPlayerActionResult: null,
    lastSelectorSource: null,
    lastDiagnosticsFallback: null,
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
  var lastDiagnosticKey = {
    normalizedKey: "",
    timestamp: 0,
    count: 0
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
    return value.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").slice(0, 100);
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function getLocationPath() {
    if (!globalScope || !globalScope.location) {
      return "";
    }
    return globalScope.location.pathname || globalScope.location.hash || globalScope.location.href || "";
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
    if (element && typeof element.removeAttribute === "function") {
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
    if (!element || typeof selector !== "string" || !selector) {
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

  function closestMatches(element, selector) {
    var current = element;
    while (current) {
      if (elementMatches(current, selector)) {
        return current;
      }
      current = current.parentNode || null;
    }
    return null;
  }

  function matchesAny(element, selectors) {
    var i;
    if (!element || !selectors) {
      return false;
    }
    for (i = 0; i < selectors.length; i += 1) {
      if (elementMatches(element, selectors[i]) || closestMatches(element, selectors[i])) {
        return true;
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
          getAttribute(current, EXIT_BUTTON_ATTRIBUTE) === "1" ||
          getAttribute(current, BOOT_BADGE_ATTRIBUTE) === "1") {
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
      "[" + DIAGNOSTICS_ATTRIBUTE + "='1'] { position: fixed; top: 14px; right: 14px; z-index: 2147483647; width: min(540px, calc(100vw - 28px)); max-height: calc(100vh - 28px); overflow: auto; padding: 12px 14px; border: 1px solid rgba(32,201,151,.6); border-radius: 10px; background: rgba(5,10,18,.94); color: #f4fff9; font: 12px/1.45 Consolas, 'Courier New', monospace; white-space: pre-wrap; display: none; box-shadow: 0 12px 32px rgba(0,0,0,.4); }",
      "[" + DIAGNOSTICS_ATTRIBUTE + "='1'][data-open='true'] { display: block; }",
      "[" + DIAGNOSTICS_BODY_ATTRIBUTE + "='1'] { margin: 0; }",
      "[" + EXIT_MODAL_ATTRIBUTE + "='1'] { position: fixed; inset: 0; z-index: 2147483646; display: none; align-items: center; justify-content: center; background: rgba(2,7,12,.38); }",
      "[" + EXIT_MODAL_ATTRIBUTE + "='1'][data-open='true'] { display: flex; }",
      "[data-stremio-remote-exit-dialog='1'] { width: min(420px, calc(100vw - 48px)); padding: 20px; border-radius: 14px; background: rgba(7,15,24,.96); color: #f4fff9; font: 16px/1.4 system-ui, sans-serif; }",
      "[data-stremio-remote-exit-actions='1'] { display: flex; gap: 12px; margin-top: 16px; }",
      "[" + EXIT_BUTTON_ATTRIBUTE + "='1'] { min-width: 136px; padding: 10px 14px; border: 1px solid rgba(255,255,255,.2); border-radius: 10px; background: rgba(255,255,255,.08); color: inherit; font: inherit; }",
      "[" + BOOT_BADGE_ATTRIBUTE + "='1'] { position: fixed; left: 14px; bottom: 14px; z-index: 2147483645; padding: 8px 10px; border-radius: 8px; background: rgba(5,10,18,.88); color: #f4fff9; font: 12px/1.3 system-ui, sans-serif; border: 1px solid rgba(32,201,151,.45); }"
    ].join("\n")));
    documentObject.head.appendChild(style);
    state.styleInjected = true;
    refreshApiAvailability();
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
    if (matchesAny(element, stremioSelectorGroups.excludedControls)) {
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
      return { found: false };
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
    role = toLower(getAttribute(element, "role") || "");
    return role === "textbox";
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

  function getCandidateGroups(element) {
    var groups = [];
    var i;
    var groupName;
    for (i = 0; i < orderedSelectorGroups.length; i += 1) {
      groupName = orderedSelectorGroups[i];
      if (matchesAny(element, stremioSelectorGroups[groupName])) {
        groups.push(groupName);
      }
    }
    return groups;
  }

  function getRoleHintFromGroups(element, groups) {
    var tagName = toLower(element && element.tagName || "");
    var role = toLower(getAttribute(element, "role") || "");
    var group = groups && groups.length ? groups[0] : "";
    if (group === "playerControls" || group === "playerBackControls" || group === "playerMenuControls") {
      return "player-control";
    }
    if (group === "authControls" || tagName === "input" || tagName === "textarea" || role === "textbox") {
      return "auth-control";
    }
    if (group === "streamRows") {
      return "stream-row";
    }
    if (group === "detailsActions") {
      return "details-action";
    }
    if (group === "homeNavigation" || group === "menuControls") {
      return "app-navigation";
    }
    if (group === "contentCards") {
      return "content-card";
    }
    if (tagName === "button" || role === "button") {
      return "button";
    }
    if (tagName === "a" || role === "link") {
      return "link";
    }
    return role || tagName || "candidate";
  }

  function isAuthSurfaceLikely() {
    var documentObject = getDocument();
    var text = documentObject && documentObject.body ? toLower(documentObject.body.textContent || "") : "";
    return text.indexOf("login") >= 0 || text.indexOf("sign up") >= 0 || text.indexOf("signup") >= 0 || text.indexOf("email") >= 0 || text.indexOf("password") >= 0 || text.indexOf("guest") >= 0;
  }

  function isPlayerSurfaceLikely() {
    var path = toLower(getLocationPath());
    return Boolean(getPrimaryVideo()) || path.indexOf("player") >= 0 || path.indexOf("stream") >= 0 || querySelectorList(stremioSelectorGroups.playerContainers).length > 0;
  }

  function getCandidatePriority(element, groups) {
    var tagName = toLower(element && element.tagName || "");
    var priority = 10;
    var rect = getRect(element);
    var area = rect.width * rect.height;
    if (groups.indexOf("playerControls") >= 0 || groups.indexOf("playerBackControls") >= 0 || groups.indexOf("playerMenuControls") >= 0) {
      priority += isPlayerSurfaceLikely() ? 120 : 45;
    }
    if (groups.indexOf("menuControls") >= 0) {
      priority += 70;
    }
    if (groups.indexOf("authControls") >= 0) {
      priority += isAuthSurfaceLikely() ? 75 : 25;
    }
    if (groups.indexOf("streamRows") >= 0 || groups.indexOf("detailsActions") >= 0) {
      priority += 50;
    }
    if (groups.indexOf("homeNavigation") >= 0) {
      priority += 35;
    }
    if (groups.indexOf("contentCards") >= 0) {
      priority += 30;
    }
    if (tagName === "button" || tagName === "a" || tagName === "input" || tagName === "textarea" || tagName === "select") {
      priority += 18;
    }
    if (typeof element.onclick === "function") {
      priority += 8;
    }
    if (area > 250000) {
      priority -= 45;
    }
    if (matchesAny(element, stremioSelectorGroups.focusGuards)) {
      priority -= 999;
    }
    return priority;
  }

  function isGenericCandidate(element) {
    var tagName;
    var role;
    var tabIndex;
    if (!element || matchesAny(element, stremioSelectorGroups.focusGuards)) {
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
    return matchesAny(element, genericCandidateSelectors);
  }

  function makeCandidate(element, sourceName) {
    var groups = getCandidateGroups(element);
    var rect = getRect(element);
    var role = getRoleHintFromGroups(element, groups);
    return {
      element: element,
      role: role,
      priority: getCandidatePriority(element, groups),
      rect: rect,
      text: getElementText(element),
      selectorSource: sourceName || (groups.length ? groups[0] : "generic"),
      groups: groups,
      isStremioSpecific: groups.length > 0,
      isPlayerControl: groups.indexOf("playerControls") >= 0 || groups.indexOf("playerBackControls") >= 0 || groups.indexOf("playerMenuControls") >= 0,
      isAuthControl: groups.indexOf("authControls") >= 0,
      isMenuControl: groups.indexOf("menuControls") >= 0,
      isFocusGuard: matchesAny(element, stremioSelectorGroups.focusGuards),
      isEditable: isEditableTarget(element)
    };
  }

  function querySelectorList(selectors) {
    var documentObject = getDocument();
    var result = [];
    var selected;
    var i;
    var j;
    if (!documentObject || typeof documentObject.querySelectorAll !== "function") {
      return result;
    }
    for (i = 0; i < selectors.length; i += 1) {
      try {
        selected = documentObject.querySelectorAll(selectors[i]);
        for (j = 0; j < selected.length; j += 1) {
          result.push(selected[j]);
        }
      } catch (_error) {}
    }
    return result;
  }

  function collectCandidateElementsForGroups(groupNames) {
    var elements = [];
    var i;
    var groupName;
    for (i = 0; i < groupNames.length; i += 1) {
      groupName = groupNames[i];
      if (stremioSelectorGroups[groupName]) {
        elements = elements.concat(querySelectorList(stremioSelectorGroups[groupName]));
      }
    }
    return elements;
  }

  function collectCandidates(options) {
    var elements;
    var candidates = [];
    var seen = [];
    var groupNames;
    var i;
    var element;
    var candidate;
    var groupName;
    var counts = {};
    options = options || {};
    groupNames = options.groups || orderedSelectorGroups;
    if (candidateCache.items.length && !options.bypassCache && now() - candidateCache.timestamp < FOCUS_CACHE_MS) {
      return candidateCache.items.slice();
    }
    elements = collectCandidateElementsForGroups(groupNames).concat(querySelectorList(genericCandidateSelectors));
    for (i = 0; i < elements.length; i += 1) {
      element = elements[i];
      if (seen.indexOf(element) >= 0) {
        continue;
      }
      seen.push(element);
      if (!isVisible(element) || !isGenericCandidate(element)) {
        continue;
      }
      candidate = makeCandidate(element, "selector-map");
      if (candidate.isFocusGuard || candidate.priority < -100) {
        continue;
      }
      candidates.push(candidate);
      for (groupName in stremioSelectorGroups) {
        if (hasOwn(stremioSelectorGroups, groupName) && candidate.groups.indexOf(groupName) >= 0) {
          counts[groupName] = (counts[groupName] || 0) + 1;
        }
      }
    }
    candidates.sort(function sortCandidates(a, b) {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      if (a.rect.top !== b.rect.top) {
        return a.rect.top - b.rect.top;
      }
      return a.rect.left - b.rect.left;
    });
    state.candidateCount = candidates.length;
    state.candidateGroups = counts;
    candidateCache.items = candidates.slice();
    candidateCache.timestamp = now();
    return candidates;
  }

  function invalidateCandidateCache() {
    candidateCache.items = [];
    candidateCache.timestamp = 0;
  }

  function isAuthSurfaceVisible() {
    return isAuthSurfaceLikely() || querySelectorList(stremioSelectorGroups.authControls).some(function someVisible(element) {
      return isVisible(element);
    });
  }

  function isPlayerActive() {
    return isPlayerSurfaceLikely() || querySelectorList(stremioSelectorGroups.playerControls).some(function someVisible(element) {
      return isVisible(element);
    });
  }

  function clearCurrentFocus() {
    if (currentFocusedElement) {
      removeAttribute(currentFocusedElement, FOCUS_ATTRIBUTE);
    }
  }

  function applyFocus(target, reason) {
    var candidate = target && target.element ? target : makeCandidate(target, "direct");
    var element = candidate && candidate.element ? candidate.element : target;
    if (!element || !isVisible(element)) {
      return false;
    }
    clearCurrentFocus();
    currentFocusedElement = element;
    setAttribute(element, FOCUS_ATTRIBUTE, "true");
    state.currentFocusRole = candidate.role || getRoleHintFromGroups(element, candidate.groups || []);
    state.currentFocusText = candidate.text || getElementText(element);
    state.lastSelectorSource = candidate.selectorSource || "direct";
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

  function getActiveElement() {
    var documentObject = getDocument();
    return documentObject ? documentObject.activeElement : null;
  }

  function getFocusedCandidate(candidates) {
    var active = getActiveElement();
    var i;
    if (currentFocusedElement && isVisible(currentFocusedElement)) {
      for (i = 0; i < candidates.length; i += 1) {
        if (candidates[i].element === currentFocusedElement) {
          return candidates[i];
        }
      }
    }
    if (active) {
      for (i = 0; i < candidates.length; i += 1) {
        if (candidates[i].element === active) {
          return candidates[i];
        }
      }
    }
    return null;
  }

  function candidateCenter(candidate) {
    var rect = candidate.rect;
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  function chooseInitialCandidate(candidates, direction) {
    if (!candidates.length) {
      return null;
    }
    if (direction === "ArrowLeft" || direction === "ArrowUp") {
      return candidates[candidates.length - 1];
    }
    return candidates[0];
  }

  function chooseByDirection(candidates, current, direction) {
    var currentCenter;
    var best = null;
    var bestScore = Infinity;
    var i;
    var candidate;
    var center;
    var primary;
    var secondary;
    var score;
    if (!current) {
      return chooseInitialCandidate(candidates, direction);
    }
    currentCenter = candidateCenter(current);
    for (i = 0; i < candidates.length; i += 1) {
      candidate = candidates[i];
      if (candidate.element === current.element) {
        continue;
      }
      center = candidateCenter(candidate);
      primary = 0;
      secondary = 0;
      if (direction === "ArrowRight") {
        primary = center.x - currentCenter.x;
        secondary = Math.abs(center.y - currentCenter.y);
      } else if (direction === "ArrowLeft") {
        primary = currentCenter.x - center.x;
        secondary = Math.abs(center.y - currentCenter.y);
      } else if (direction === "ArrowDown") {
        primary = center.y - currentCenter.y;
        secondary = Math.abs(center.x - currentCenter.x);
      } else if (direction === "ArrowUp") {
        primary = currentCenter.y - center.y;
        secondary = Math.abs(center.x - currentCenter.x);
      }
      if (primary <= 2) {
        continue;
      }
      score = primary * 5 + secondary - candidate.priority;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    if (best) {
      return best;
    }
    i = candidates.indexOf(current);
    if (i < 0) {
      return chooseInitialCandidate(candidates, direction);
    }
    if (direction === "ArrowLeft" || direction === "ArrowUp") {
      return candidates[(i - 1 + candidates.length) % candidates.length];
    }
    return candidates[(i + 1) % candidates.length];
  }

  function scopeCandidatesForKey(keyName) {
    var candidates;
    if (state.exitModalOpen) {
      return collectCandidates({ groups: [], bypassCache: true }).filter(function filterExitModal(candidate) {
        return isInsideModuleUi(candidate.element);
      });
    }
    if (isPlayerActive()) {
      candidates = collectCandidates({ groups: ["playerControls", "playerBackControls", "playerMenuControls"], bypassCache: true });
      if (candidates.length) {
        return candidates;
      }
      wakePlayerControls();
      candidates = collectCandidates({ groups: ["playerControls", "playerBackControls", "playerMenuControls"], bypassCache: true });
      if (candidates.length) {
        return candidates;
      }
    }
    if (isAuthSurfaceVisible()) {
      candidates = collectCandidates({ groups: ["authControls", "menuControls"], bypassCache: true });
      if (candidates.length) {
        return candidates;
      }
    }
    return collectCandidates({ bypassCache: false });
  }

  function moveFocus(direction) {
    var candidates = scopeCandidatesForKey(direction);
    var current = getFocusedCandidate(candidates);
    var next = chooseByDirection(candidates, current, direction);
    if (!next) {
      state.lastConsumedAction = "focus:no-candidate:" + direction;
      renderDiagnostics();
      return false;
    }
    return applyFocus(next, direction);
  }

  function clickElement(element) {
    var documentObject = getDocument();
    var event;
    if (!element) {
      return false;
    }
    try {
      if (typeof element.click === "function") {
        element.click();
        return true;
      }
    } catch (_error) {}
    try {
      if (documentObject && typeof documentObject.createEvent === "function") {
        event = documentObject.createEvent("MouseEvents");
        event.initMouseEvent("click", true, true, globalScope, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        return element.dispatchEvent(event);
      }
    } catch (__error) {}
    return false;
  }

  function activateCurrent() {
    var active = getActiveElement();
    var target = currentFocusedElement || active;
    if (!target) {
      if (moveFocus("ArrowRight")) {
        target = currentFocusedElement;
      }
    }
    if (!target || !isVisible(target)) {
      state.lastConsumedAction = "activate:no-target";
      renderDiagnostics();
      return false;
    }
    if (isEditableTarget(target)) {
      state.lastConsumedAction = "activate:editable-passthrough";
      renderDiagnostics();
      return false;
    }
    if (clickElement(target)) {
      state.lastConsumedAction = "activate:click";
      renderDiagnostics();
      return true;
    }
    state.lastConsumedAction = "activate:failed";
    renderDiagnostics();
    return false;
  }

  function clickFirstVisible(groupNames) {
    var candidates = collectCandidates({ groups: groupNames, bypassCache: true });
    var i;
    for (i = 0; i < candidates.length; i += 1) {
      if (clickElement(candidates[i].element)) {
        state.lastSelectorSource = candidates[i].selectorSource;
        return true;
      }
    }
    return false;
  }

  function dispatchEscapeFallback() {
    var documentObject = getDocument();
    var event;
    try {
      if (typeof globalScope.KeyboardEvent === "function") {
        event = new globalScope.KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true });
        if (documentObject && typeof documentObject.dispatchEvent === "function") {
          documentObject.dispatchEvent(event);
          return true;
        }
      }
    } catch (_error) {}
    try {
      if (documentObject && typeof documentObject.createEvent === "function") {
        event = documentObject.createEvent("Events");
        event.initEvent("keydown", true, true);
        event.key = "Escape";
        event.keyCode = 27;
        event.which = 27;
        documentObject.dispatchEvent(event);
        return true;
      }
    } catch (__error) {}
    return false;
  }

  function wakePlayerControls() {
    var video = getPrimaryVideo();
    var rect;
    var event;
    if (!video) {
      return false;
    }
    rect = getRect(video);
    try {
      if (typeof globalScope.MouseEvent === "function") {
        event = new globalScope.MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        });
        video.dispatchEvent(event);
        state.lastPlayerActionResult = "wake-controls:mousemove";
        return true;
      }
    } catch (_error) {}
    return dispatchEscapeFallback();
  }

  function finishVideoAction(message) {
    state.lastPlayerActionResult = message;
    refreshVideoState();
    renderDiagnostics();
    return true;
  }

  function clampTime(value, duration) {
    if (typeof duration === "number" && isFinite(duration) && duration > 0) {
      return Math.max(0, Math.min(duration, value));
    }
    return Math.max(0, value);
  }

  function fallbackClickPlayerControl(action) {
    var groups = ["playerControls", "playerMenuControls"];
    if (action === "back") {
      groups = ["playerBackControls"];
    }
    if (clickFirstVisible(groups)) {
      return finishVideoAction("clicked-player-control:" + action);
    }
    return false;
  }

  function controlVideo(action) {
    var video = getPrimaryVideo();
    var duration;
    var promise;
    if (!video) {
      if (fallbackClickPlayerControl(action)) {
        return true;
      }
      state.lastPlayerActionResult = "no-visible-video:" + action;
      renderDiagnostics();
      return false;
    }
    try {
      if (action === "toggle") {
        if (video.paused || video.ended) {
          promise = video.play();
          if (promise && typeof promise.catch === "function") {
            promise.catch(function onPlayError() {
              fallbackClickPlayerControl(action);
            });
          }
          return finishVideoAction("direct-video-play");
        }
        video.pause();
        return finishVideoAction("direct-video-pause");
      }
      if (action === "play") {
        promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function onPlayError() {
            fallbackClickPlayerControl(action);
          });
        }
        return finishVideoAction("direct-video-play");
      }
      if (action === "pause") {
        video.pause();
        return finishVideoAction("direct-video-pause");
      }
      if (action === "stop") {
        video.pause();
        video.currentTime = 0;
        return finishVideoAction("direct-video-stop");
      }
      if (action === "seek-forward" || action === "seek-back") {
        duration = typeof video.duration === "number" ? video.duration : null;
        if (action === "seek-forward") {
          video.currentTime = clampTime((video.currentTime || 0) + SEEK_STEP_SECONDS, duration);
        } else {
          video.currentTime = clampTime((video.currentTime || 0) - SEEK_STEP_SECONDS, duration);
        }
        return finishVideoAction("direct-video-" + action);
      }
    } catch (error) {
      state.lastPlayerActionResult = "direct-video-error:" + (error && error.message ? error.message : String(error));
      if (fallbackClickPlayerControl(action)) {
        return true;
      }
      renderDiagnostics();
      return false;
    }
    state.lastPlayerActionResult = "unknown-video-action:" + action;
    renderDiagnostics();
    return false;
  }

  function isHistoryPastInitialBoundary() {
    var length;
    if (!globalScope || !globalScope.history) {
      return false;
    }
    length = typeof globalScope.history.length === "number" ? globalScope.history.length : null;
    if (length !== null && state.initialHistoryLength !== null && length > state.initialHistoryLength) {
      return true;
    }
    return getLocationPath() !== state.initialPath;
  }

  function useHistoryBack(reason) {
    try {
      if (globalScope && globalScope.history && typeof globalScope.history.back === "function") {
        globalScope.history.back();
        state.lastBackResolution = reason || "history.back";
        renderDiagnostics();
        return true;
      }
    } catch (_error) {}
    return false;
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
    renderDiagnostics();
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
        renderDiagnostics();
        return true;
      }
    } catch (error) {
      state.lastExitResult = { ok: false, message: error && error.message ? error.message : String(error) };
      renderDiagnostics();
      return false;
    }
    state.lastExitResult = { ok: false, message: "Tizen application exit API unavailable" };
    renderDiagnostics();
    return false;
  }

  function closeStremioOverlayMenu() {
    if (clickFirstVisible(["playerBackControls"])) {
      state.lastBackResolution = "closed-stremio-overlay";
      return true;
    }
    return false;
  }

  function handleBack(raw) {
    var active = getActiveElement();
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
    if (isEditableTarget(active)) {
      try {
        if (typeof active.blur === "function") {
          active.blur();
        }
      } catch (_error) {}
      state.lastBackResolution = "blurred-editable";
      renderDiagnostics();
      return true;
    }
    if (isPlayerActive()) {
      if (closeStremioOverlayMenu()) {
        state.lastBackResolution = "clicked-player-back-control";
        renderDiagnostics();
        return true;
      }
      if (dispatchEscapeFallback()) {
        state.lastBackResolution = "dispatched-escape-from-player";
        if (isHistoryPastInitialBoundary() && useHistoryBack("history.back-from-player-after-escape")) {
          return true;
        }
        renderDiagnostics();
        return true;
      }
      if (useHistoryBack("history.back-from-player")) {
        return true;
      }
      state.lastBackResolution = "player-back-no-fallback";
      renderDiagnostics();
      return true;
    }
    if (isHistoryPastInitialBoundary()) {
      return useHistoryBack("history.back");
    }
    state.lastBackResolution = raw && raw.editable ? "editable-boundary" : "opened-exit-modal";
    return openExitModal();
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
      "Diagnostics fallback: " + (state.lastDiagnosticsFallback || "(none)"),
      "Candidate count: " + String(state.candidateCount),
      "Candidate groups: " + JSON.stringify(state.candidateGroups || {}),
      "Current focus role: " + (state.currentFocusRole || "(none)"),
      "Current focus text: " + (state.currentFocusText || "(none)"),
      "Last selector source: " + (state.lastSelectorSource || "(none)"),
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

  function openDiagnostics() {
    setDiagnosticsOpen(true);
    return true;
  }

  function closeDiagnostics() {
    setDiagnosticsOpen(false);
    return true;
  }

  function toggleDiagnostics() {
    setDiagnosticsOpen(!state.diagnosticsOpen);
    return true;
  }

  function recordRawEvent(eventObject, pathName, normalizedKey, editable) {
    state.lastRawEvent = {
      path: pathName,
      type: eventObject && eventObject.type ? eventObject.type : "",
      key: eventObject && eventObject.key ? eventObject.key : "",
      code: eventObject && eventObject.code ? eventObject.code : "",
      keyCode: eventObject && typeof eventObject.keyCode !== "undefined" ? eventObject.keyCode : null,
      which: eventObject && typeof eventObject.which !== "undefined" ? eventObject.which : null,
      keyName: eventObject && eventObject.keyName ? eventObject.keyName : "",
      normalizedKey: normalizedKey || "",
      editable: Boolean(editable)
    };
  }

  function normalizeKey(eventObject) {
    var rawKey = eventObject && eventObject.key ? eventObject.key : "";
    var rawCode = eventObject && eventObject.code ? eventObject.code : "";
    var keyName = eventObject && eventObject.keyName ? eventObject.keyName : "";
    var keyCode = eventObject && typeof eventObject.keyCode !== "undefined" ? eventObject.keyCode : null;
    var which = eventObject && typeof eventObject.which !== "undefined" ? eventObject.which : null;
    var candidates = [keyName, rawKey, rawCode];
    var i;
    var value;
    for (i = 0; i < candidates.length; i += 1) {
      value = candidates[i];
      if (value && hasOwn(keyAliasMap, value)) {
        return keyAliasMap[value];
      }
      if (value && (value.indexOf("Arrow") === 0 || value.indexOf("Media") === 0 || value === "Enter" || value === "Back" || value === "Info")) {
        return value;
      }
    }
    if (keyCode !== null && hasOwn(keyCodeMap, keyCode)) {
      return keyCodeMap[keyCode];
    }
    if (which !== null && hasOwn(keyCodeMap, which)) {
      return keyCodeMap[which];
    }
    return rawKey || keyName || rawCode || "Unidentified";
  }

  function shouldSuppressDuplicate(normalizedKey, pathName, eventType) {
    var signature = normalizedKey + ":" + pathName + ":" + eventType;
    var timestamp = now();
    if (lastHandled.signature === signature && timestamp - lastHandled.timestamp < DUPLICATE_EVENT_WINDOW_MS) {
      return true;
    }
    lastHandled.signature = signature;
    lastHandled.timestamp = timestamp;
    return false;
  }

  function updateDiagnosticsRepeatFallback(normalizedKey) {
    var timestamp = now();
    if (!hasOwn(diagnosticsKeys, normalizedKey)) {
      return false;
    }
    if (lastDiagnosticKey.normalizedKey === normalizedKey && timestamp - lastDiagnosticKey.timestamp < DIAGNOSTICS_REPEAT_WINDOW_MS) {
      lastDiagnosticKey.count += 1;
    } else {
      lastDiagnosticKey.normalizedKey = normalizedKey;
      lastDiagnosticKey.count = 1;
    }
    lastDiagnosticKey.timestamp = timestamp;
    if (lastDiagnosticKey.count >= 2 && !state.diagnosticsOpen) {
      state.lastDiagnosticsFallback = "repeat-" + normalizedKey;
      openDiagnostics();
      return true;
    }
    return false;
  }

  function preventEvent(eventObject) {
    if (!eventObject) {
      return;
    }
    try {
      if (typeof eventObject.preventDefault === "function") {
        eventObject.preventDefault();
      }
    } catch (_error) {}
    try {
      if (typeof eventObject.stopPropagation === "function") {
        eventObject.stopPropagation();
      }
    } catch (__error) {}
  }

  function handleNormalizedKey(normalizedKey, raw, eventObject) {
    state.lastKey = { normalizedKey: normalizedKey, raw: raw };
    state.lastAction = "key:" + normalizedKey;
    if (hasOwn(diagnosticsKeys, normalizedKey)) {
      updateDiagnosticsRepeatFallback(normalizedKey);
      toggleDiagnostics();
      return true;
    }
    if (normalizedKey === "Back") {
      return handleBack(raw);
    }
    if (raw.editable && (normalizedKey === "ArrowLeft" || normalizedKey === "ArrowRight" || normalizedKey === "ArrowUp" || normalizedKey === "ArrowDown" || normalizedKey === "Enter")) {
      state.lastConsumedAction = "editable-passthrough:" + normalizedKey;
      renderDiagnostics();
      return false;
    }
    if (normalizedKey === "MediaPlayPause") {
      return controlVideo("toggle");
    }
    if (normalizedKey === "MediaPlay") {
      return controlVideo("play");
    }
    if (normalizedKey === "MediaPause") {
      return controlVideo("pause");
    }
    if (normalizedKey === "MediaStop") {
      return controlVideo("stop");
    }
    if (normalizedKey === "MediaFastForward") {
      return controlVideo("seek-forward");
    }
    if (normalizedKey === "MediaRewind") {
      return controlVideo("seek-back");
    }
    if (normalizedKey === "ArrowLeft" || normalizedKey === "ArrowRight" || normalizedKey === "ArrowUp" || normalizedKey === "ArrowDown") {
      return moveFocus(normalizedKey);
    }
    if (normalizedKey === "Enter" && !raw.editable) {
      return activateCurrent();
    }
    renderDiagnostics();
    return false;
  }

  function handleKeyEvent(eventObject, pathName) {
    var normalizedKey = normalizeKey(eventObject);
    var target = eventObject && eventObject.target ? eventObject.target : getActiveElement();
    var editable = isEditableTarget(target);
    var raw;
    recordRawEvent(eventObject, pathName, normalizedKey, editable);
    raw = state.lastRawEvent;
    if (shouldSuppressDuplicate(normalizedKey, pathName, eventObject && eventObject.type ? eventObject.type : "")) {
      return false;
    }
    if (!raw.editable || normalizedKey === "Back" || hasOwn(diagnosticsKeys, normalizedKey)) {
      if (handleNormalizedKey(normalizedKey, raw, eventObject)) {
        preventEvent(eventObject);
        return true;
      }
    }
    return false;
  }

  function addListener(target, eventName, pathName) {
    if (!target || typeof target.addEventListener !== "function") {
      return false;
    }
    try {
      target.addEventListener(eventName, function onRemoteEvent(eventObject) {
        handleKeyEvent(eventObject, pathName || eventName);
      }, true);
      state.listenerPaths.push((pathName || "listener") + ":" + eventName);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function attachKeyListeners() {
    var documentObject = getDocument();
    var attached = false;
    if (documentObject) {
      attached = addListener(documentObject, "keydown", "document") || attached;
      attached = addListener(documentObject, "keyup", "document") || attached;
      attached = addListener(documentObject, "keypress", "document") || attached;
      attached = addListener(documentObject, "tizenhwkey", "document") || attached;
    }
    attached = addListener(globalScope, "keydown", "window") || attached;
    attached = addListener(globalScope, "keyup", "window") || attached;
    attached = addListener(globalScope, "keypress", "window") || attached;
    attached = addListener(globalScope, "tizenhwkey", "window") || attached;
    state.keyListenerAttached = attached;
    return attached;
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
      });
      observer.observe(documentObject.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden", "tabindex"] });
      return true;
    } catch (_error) {
      return false;
    }
  }

  function ensureUi() {
    injectStyles();
    ensureDiagnosticsPanel();
    ensureExitModal();
    showBootBadge();
  }

  function attachDomReadyHook() {
    var documentObject = getDocument();
    if (!documentObject || typeof documentObject.addEventListener !== "function" || state.domReadyHookAttached) {
      return false;
    }
    state.domReadyHookAttached = true;
    documentObject.addEventListener("DOMContentLoaded", function onDomReady() {
      ensureUi();
      observeDomChanges();
      attachKeyListeners();
      registerOptionalKeys();
    });
    return true;
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
      bootBadgeShown: state.bootBadgeShown,
      exitModalCreated: state.exitModalCreated,
      exitModalOpen: state.exitModalOpen,
      keyListenerAttached: state.keyListenerAttached,
      currentFocusRole: state.currentFocusRole,
      currentFocusText: state.currentFocusText,
      candidateCount: state.candidateCount,
      candidateGroups: state.candidateGroups,
      lastRawEvent: state.lastRawEvent,
      lastKey: state.lastKey,
      lastAction: state.lastAction,
      lastConsumedAction: state.lastConsumedAction,
      lastBackResolution: state.lastBackResolution,
      lastExitAttempt: state.lastExitAttempt,
      lastExitResult: state.lastExitResult,
      lastVideoState: state.lastVideoState,
      lastPlayerActionResult: state.lastPlayerActionResult,
      lastSelectorSource: state.lastSelectorSource,
      lastDiagnosticsFallback: state.lastDiagnosticsFallback,
      selectorGroups: Object.keys(stremioSelectorGroups)
    };
  }

  function init() {
    state.initialized = true;
    state.initTime = new Date().toISOString();
    state.initialPath = getLocationPath();
    state.initialHistoryLength = globalScope && globalScope.history && typeof globalScope.history.length === "number" ? globalScope.history.length : null;
    refreshApiAvailability();
    attachKeyListeners();
    attachDomReadyHook();
    registerOptionalKeys();
    ensureUi();
    observeDomChanges();
    collectCandidates({ bypassCache: true });
    globalScope[NAMESPACE] = {
      initialized: true,
      version: RUNTIME_VERSION,
      sourceMarker: RUNTIME_SOURCE_MARKER,
      injectionMarker: RUNTIME_INJECTION_MARKER,
      stremioSelectorGroups: stremioSelectorGroups,
      getState: getState,
      openDiagnostics: openDiagnostics,
      closeDiagnostics: closeDiagnostics,
      toggleDiagnostics: toggleDiagnostics,
      renderDiagnostics: renderDiagnostics,
      collectCandidates: function publicCollectCandidates() {
        return collectCandidates({ bypassCache: true }).map(function mapCandidate(candidate) {
          return {
            role: candidate.role,
            priority: candidate.priority,
            rect: candidate.rect,
            text: candidate.text,
            selectorSource: candidate.selectorSource,
            groups: candidate.groups,
            isStremioSpecific: candidate.isStremioSpecific,
            isPlayerControl: candidate.isPlayerControl,
            isAuthControl: candidate.isAuthControl,
            isMenuControl: candidate.isMenuControl,
            isFocusGuard: candidate.isFocusGuard,
            isEditable: candidate.isEditable
          };
        });
      },
      controlVideo: controlVideo,
      handleBack: handleBack,
      registerOptionalKeys: registerOptionalKeys
    };
    renderDiagnostics();
  }

  init();
})(typeof window !== "undefined" ? window : this);
