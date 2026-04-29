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

  var defaultCss = [
    ":root { --stremio-remote-focus-outline: #20c997; }",
    "[data-stremio-remote-focus='true'] {",
    "  outline: 3px solid var(--stremio-remote-focus-outline);",
    "  outline-offset: 2px;",
    "}"
  ].join("\n");

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

  function injectStylesIfPossible(cssText) {
    if (!globalScope.document || !globalScope.document.head) {
      return false;
    }
    if (globalScope.document.querySelector("style[data-stremio-remote-style='1']")) {
      return true;
    }

    var style = globalScope.document.createElement("style");
    style.type = "text/css";
    style.dataset.stremioRemoteStyle = "1";
    style.appendChild(globalScope.document.createTextNode(cssText || defaultCss));
    globalScope.document.head.appendChild(style);
    return true;
  }

  function registerOptionalKeys(requestedKeys) {
    var inputdevice = getInputDeviceApi();
    if (!inputdevice) {
      return [];
    }

    var keys = Array.isArray(requestedKeys) ? requestedKeys : defaultOptionalKeys;
    var registered = [];

    for (var i = 0; i < keys.length; i += 1) {
      var keyName = keys[i];
      if (mandatoryKeys.has(keyName)) {
        continue;
      }
      try {
        inputdevice.registerKey(keyName);
        registered.push(keyName);
      } catch (_error) {
        // No-op: key support differs by device and firmware.
      }
    }

    return registered;
  }

  function init() {
    injectStylesIfPossible();
    var keys = registerOptionalKeys();

    // TODO: Wire spatial navigation and key handling once navigation contract is defined.
    return {
      registeredKeys: keys
    };
  }

  globalScope[NAMESPACE] = {
    initialized: true,
    init: init,
    injectStylesIfPossible: injectStylesIfPossible,
    registerOptionalKeys: registerOptionalKeys
  };

  init();
})(typeof globalThis !== "undefined" ? globalThis : window);
