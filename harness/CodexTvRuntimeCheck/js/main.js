/* source marker: stremio-web-wrapper-poc-v1.1.0 */

(function() {
    "use strict";

    var TARGET_URL = "https://web.stremio.com/";
    var lastRefreshTime = 0;
    var refreshThrottleMs = 1000;
    var refreshIntervalId = null;

    var state = {
        version: "1.1.0",
        userAgent: navigator.userAgent,
        wrapperUrl: "",
        wrapperLoadState: "unloaded",
        iframeLoadState: "unloaded",
        mode: "iframe",
        lastKey: null,
        registrationResults: {},
        sameOrigin: null,
        mediaSupport: null,
        diagnosticsOpen: false,
        iframeListenerStatus: "unattached"
    };

    function redactUrl(url) {
        if (!url) return "";
        try {
            var queryIdx = url.indexOf("?");
            var hashIdx = url.indexOf("#");
            var endIdx = url.length;
            if (queryIdx !== -1) endIdx = Math.min(endIdx, queryIdx);
            if (hashIdx !== -1) endIdx = Math.min(endIdx, hashIdx);

            var cleanUrl = url.substring(0, endIdx);

            var protoEnd = cleanUrl.indexOf("://");
            if (protoEnd !== -1) {
                var rest = cleanUrl.substring(protoEnd + 3);
                var atIdx = rest.indexOf("@");
                if (atIdx !== -1) {
                    cleanUrl = cleanUrl.substring(0, protoEnd + 3) + "[redacted]@" + rest.substring(atIdx + 1);
                }
            }
            return cleanUrl;
        } catch (e) {
            return "[redacted error]";
        }
    }

    function checkMediaSupport() {
        var results = {
            canPlayType: {},
            isTypeSupported: {}
        };

        try {
            var video = document.createElement("video");
            var types = {
                avc_baseline: 'video/mp4; codecs="avc1.42E01E"',
                avc_high: 'video/mp4; codecs="avc1.64002A"',
                hevc: 'video/mp4; codecs="hvc1.1.6.L93.B0"'
            };

            for (var key in types) {
                if (types.hasOwnProperty(key)) {
                    var mime = types[key];
                    if (video && typeof video.canPlayType === "function") {
                        results.canPlayType[key] = video.canPlayType(mime) || "no";
                    } else {
                        results.canPlayType[key] = "unsupported-api";
                    }

                    if (window.MediaSource && typeof window.MediaSource.isTypeSupported === "function") {
                        results.isTypeSupported[key] = window.MediaSource.isTypeSupported(mime) ? "yes" : "no";
                    } else {
                        results.isTypeSupported[key] = "unsupported-api";
                    }
                }
            }
        } catch (e) {
            results.error = e && e.message ? e.message : String(e);
        }

        return results;
    }

    function inspectIframe() {
        var iframe = document.getElementById("app-iframe");
        if (!iframe) {
            return { available: false, status: "Iframe element not found" };
        }

        try {
            var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
            if (!doc) {
                return { available: false, status: "No document access" };
            }

            var videos = doc.getElementsByTagName("video");
            var videoCount = videos.length;
            var firstVideoInfo = null;

            if (videoCount > 0) {
                var v = videos[0];
                var errorInfo = null;
                if (v.error) {
                    errorInfo = {
                        code: v.error.code,
                        message: v.error.message || ""
                    };
                }
                firstVideoInfo = {
                    error: errorInfo,
                    networkState: v.networkState,
                    readyState: v.readyState,
                    src: redactUrl(v.src),
                    currentSrc: redactUrl(v.currentSrc)
                };
            }

            return {
                available: true,
                videoCount: videoCount,
                firstVideo: firstVideoInfo
            };
        } catch (e) {
            return {
                available: false,
                status: "unavailable (cross-origin SecurityError)",
                error: e && e.message ? e.message : String(e)
            };
        }
    }

    function getState() {
        state.wrapperLoadState = document.readyState;
        state.wrapperUrl = redactUrl(window.location.href);
        state.sameOrigin = inspectIframe();
        state.mediaSupport = checkMediaSupport();
        return state;
    }

    function refreshDiagnostics(force) {
        var now = new Date().getTime();
        if (!force && (now - lastRefreshTime < refreshThrottleMs)) {
            return;
        }
        lastRefreshTime = now;

        var logNode = document.getElementById("runtime-log");
        if (logNode) {
            logNode.textContent = JSON.stringify(getState(), null, 2);
        }
    }

    function setDiagnosticsOpen(open) {
        state.diagnosticsOpen = !!open;

        var diagPanel = document.getElementById("diagnostics-panel");
        if (diagPanel) {
            if (state.diagnosticsOpen) {
                diagPanel.classList.remove("hidden");
                if (!refreshIntervalId) {
                    refreshIntervalId = setInterval(function() {
                        refreshDiagnostics(true);
                    }, 1000);
                }
            } else {
                diagPanel.classList.add("hidden");
                if (refreshIntervalId) {
                    clearInterval(refreshIntervalId);
                    refreshIntervalId = null;
                }
            }
        }
        refreshDiagnostics(true);
    }

    function setMode(newMode) {
        if (newMode !== "iframe" && newMode !== "redirect") {
            return;
        }
        state.mode = newMode;

        var toggleModeBtn = document.getElementById("toggle-mode-btn");
        var iframeContainer = document.getElementById("iframe-container");

        if (newMode === "iframe") {
            if (toggleModeBtn) toggleModeBtn.textContent = "Mode: Iframe";
            if (iframeContainer) iframeContainer.style.display = "block";
        } else {
            if (toggleModeBtn) toggleModeBtn.textContent = "Mode: Redirect";
            if (iframeContainer) iframeContainer.style.display = "none";
        }
        refreshDiagnostics(true);
    }

    function toggleDiagnostics() {
        setDiagnosticsOpen(!state.diagnosticsOpen);
    }

    function launchApp() {
        var loadingScreen = document.getElementById("loading-screen");
        var loadingStatus = document.getElementById("loading-status");

        if (loadingScreen) {
            loadingScreen.classList.remove("hidden");
        }

        if (state.mode === "iframe") {
            if (loadingStatus) {
                loadingStatus.textContent = "Loading iframe...";
            }
            state.iframeLoadState = "loading";
            var iframe = document.getElementById("app-iframe");
            if (iframe) {
                iframe.src = TARGET_URL;
            }
        } else {
            if (loadingStatus) {
                loadingStatus.textContent = "Redirecting to Stremio...";
            }
            setTimeout(function() {
                window.location.href = TARGET_URL;
            }, 500);
        }
        refreshDiagnostics(true);
    }

    function registerTizenKeys() {
        var optionalKeys = ["Info", "ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue"];
        if (window.tizen && window.tizen.tvinputdevice && typeof window.tizen.tvinputdevice.registerKey === "function") {
            optionalKeys.forEach(function(keyName) {
                try {
                    window.tizen.tvinputdevice.registerKey(keyName);
                    state.registrationResults[keyName] = "registered";
                } catch (e) {
                    state.registrationResults[keyName] = "failed: " + (e && e.message ? e.message : e);
                }
            });
        } else {
            optionalKeys.forEach(function(keyName) {
                state.registrationResults[keyName] = "unavailable";
            });
        }
    }

    function handleKeyDown(event) {
        var key = event.key || event.code;
        state.lastKey = {
            key: key,
            code: event.code,
            keyCode: event.keyCode
        };

        if (key === "Info" || event.keyCode === 457 ||
            key === "ColorF0Red" || event.keyCode === 403 ||
            key === "ColorF1Green" || event.keyCode === 404 ||
            key === "ColorF2Yellow" || event.keyCode === 405 ||
            key === "ColorF3Blue" || event.keyCode === 406 ||
            key === "1" || key === "Digit1" || event.keyCode === 49) {
            toggleDiagnostics();
        }
    }

    function attachIframeKeyListener() {
        var iframe = document.getElementById("app-iframe");
        if (!iframe) {
            state.iframeListenerStatus = "missing-iframe";
            return;
        }

        try {
            var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
            if (!doc) {
                state.iframeListenerStatus = "no-document-access";
                return;
            }

            try {
                doc.removeEventListener("keydown", handleKeyDown);
            } catch (err) {
                // Ignore
            }

            doc.addEventListener("keydown", handleKeyDown);
            state.iframeListenerStatus = "attached";
        } catch (e) {
            state.iframeListenerStatus = "failed: " + (e && e.message ? e.message : String(e));
        }
    }

    function init() {
        registerTizenKeys();

        var toggleModeBtn = document.getElementById("toggle-mode-btn");
        var launchBtn = document.getElementById("launch-btn");
        var toggleDiagBtn = document.getElementById("toggle-diag-btn");
        var iframe = document.getElementById("app-iframe");

        if (toggleModeBtn) {
            toggleModeBtn.addEventListener("click", function() {
                var nextMode = state.mode === "iframe" ? "redirect" : "iframe";
                setMode(nextMode);
            });
        }

        if (launchBtn) {
            launchBtn.addEventListener("click", function() {
                launchApp();
            });
        }

        if (toggleDiagBtn) {
            toggleDiagBtn.addEventListener("click", function() {
                toggleDiagnostics();
            });
        }

        if (iframe) {
            iframe.addEventListener("load", function() {
                state.iframeLoadState = "loaded";
                attachIframeKeyListener();
                refreshDiagnostics(true);
                var loadingScreen = document.getElementById("loading-screen");
                if (loadingScreen) {
                    loadingScreen.classList.add("hidden");
                }
            });
        }

        window.document.addEventListener("keydown", handleKeyDown);

        // Set initial state
        state.diagnosticsOpen = false;
        var diagPanel = document.getElementById("diagnostics-panel");
        if (diagPanel) {
            if (!diagPanel.classList.contains("hidden")) {
                setDiagnosticsOpen(true);
            }
        }

        // Set initial mode (always iframe on startup)
        setMode("iframe");

        // Auto-launch
        launchApp();
    }

    // Expose public API
    window.__STREMIO_WEB_WRAPPER_POC__ = {
        version: "1.1.0",
        getState: getState,
        setMode: setMode,
        toggleDiagnostics: toggleDiagnostics,
        refreshDiagnostics: function() { refreshDiagnostics(true); }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
