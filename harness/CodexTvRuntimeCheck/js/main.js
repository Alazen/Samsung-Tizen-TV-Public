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
        iframeListenerStatus: "unattached",
        navigationAdapter: {
            status: "inactive",
            activeElement: null,
            candidateCount: 0
        }
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

        // Update navigation adapter diagnostics
        if (typeof NavigationAdapter !== "undefined") {
            var doc = NavigationAdapter.getIframeDoc();
            if (doc) {
                try {
                    var activeEl = doc.activeElement;
                    var activeInfo = null;
                    if (activeEl && activeEl !== doc.body) {
                        activeInfo = {
                            tagName: activeEl.tagName,
                            text: (activeEl.innerText || "").substring(0, 30).trim(),
                            className: activeEl.className || "",
                            isSidebar: NavigationAdapter.isSidebarElement(activeEl)
                        };
                    }
                    var cands = NavigationAdapter.getFocusableElements(doc);
                    state.navigationAdapter = {
                        status: NavigationAdapter.enabled ? "enabled" : "disabled",
                        activeElement: activeInfo,
                        candidateCount: cands.length
                    };
                } catch (e) {
                    state.navigationAdapter = {
                        status: "error: " + (e && e.message ? e.message : String(e)),
                        activeElement: null,
                        candidateCount: 0
                    };
                }
            } else {
                state.navigationAdapter = {
                    status: "no-document-access",
                    activeElement: null,
                    candidateCount: 0
                };
            }
        }
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
            if (typeof NavigationAdapter !== "undefined") {
                NavigationAdapter.destroy();
            }
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

    var NavigationAdapter = {
        enabled: true,
        init: function() {
            this.enabled = true;
        },
        destroy: function() {
            this.enabled = false;
        },
        getIframeDoc: function() {
            var iframe = document.getElementById("app-iframe");
            if (!iframe) return null;
            try {
                return iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
            } catch (e) {
                return null;
            }
        },
        getFocusableElements: function(doc) {
            if (!doc) return [];
            var selector = 'a[href], button, [tabindex="0"]';
            try {
                var els = doc.querySelectorAll(selector);
                var result = [];
                for (var i = 0; i < els.length; i++) {
                    var el = els[i];
                    var rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        result.push(el);
                    }
                }
                return result;
            } catch (e) {
                return [];
            }
        },
        isSidebarElement: function(el) {
            if (!el) return false;
            var href = el.getAttribute('href') || '';
            var text = (el.innerText || '').trim().toLowerCase();
            if (text === 'board' || text === 'discover' || text === 'library' || text === 'calendar' || text === 'addons' || text === 'settings') {
                return true;
            }
            if (href === '#/' || href === '/' || href.indexOf('#/discover') !== -1 || href.indexOf('#/library') !== -1 || href.indexOf('#/calendar') !== -1 || href.indexOf('#/addons') !== -1 || href.indexOf('#/settings') !== -1) {
                var parent = el.parentElement;
                while (parent) {
                    var className = (parent.className || '').toLowerCase();
                    if (className.indexOf('sidebar') !== -1 || className.indexOf('menu') !== -1 || className.indexOf('nav') !== -1) {
                        return true;
                    }
                    parent = parent.parentElement;
                }
                if (href === '#/' || href === '#/discover' || href === '#/library' || href === '#/calendar' || href === '#/addons' || href === '#/settings') {
                    return true;
                }
            }
            return false;
        },
        handleKey: function(event) {
            if (!this.enabled) return false;

            var key = event.key || event.code;
            var keyCode = event.keyCode;

            if (keyCode !== 37 && keyCode !== 38 && keyCode !== 39 && keyCode !== 40 && keyCode !== 13) {
                return false;
            }

            var doc = this.getIframeDoc();
            if (!doc) return false;

            var activeEl = doc.activeElement;

            if (keyCode === 13) {
                if (activeEl && activeEl !== doc.body && typeof activeEl.click === 'function') {
                    activeEl.click();
                    event.preventDefault();
                    return true;
                }
                return false;
            }

            var candidates = this.getFocusableElements(doc);
            if (candidates.length === 0) return false;

            if (!activeEl || activeEl === doc.body) {
                var first = candidates[0];
                if (first && typeof first.focus === 'function') {
                    first.focus();
                    event.preventDefault();
                    return true;
                }
                return false;
            }

            var activeRect = activeEl.getBoundingClientRect();
            var isCurrentSidebar = this.isSidebarElement(activeEl);

            if (keyCode === 37) { // Left
                if (!isCurrentSidebar) {
                    var sidebarCandidates = [];
                    for (var i = 0; i < candidates.length; i++) {
                        if (this.isSidebarElement(candidates[i])) {
                            sidebarCandidates.push(candidates[i]);
                        }
                    }
                    if (sidebarCandidates.length > 0) {
                        var bestSidebar = this.findBestSpatial(activeRect, sidebarCandidates, keyCode);
                        if (bestSidebar) {
                            bestSidebar.focus();
                            event.preventDefault();
                            return true;
                        }
                    }
                }
            } else if (keyCode === 39) { // Right
                if (isCurrentSidebar) {
                    var contentCandidates = [];
                    for (var i = 0; i < candidates.length; i++) {
                        if (!this.isSidebarElement(candidates[i])) {
                            contentCandidates.push(candidates[i]);
                        }
                    }
                    if (contentCandidates.length > 0) {
                        var bestContent = this.findBestSpatial(activeRect, contentCandidates, keyCode);
                        if (bestContent) {
                            bestContent.focus();
                            event.preventDefault();
                            return true;
                        }
                    }
                }
            }

            var best = this.findBestSpatial(activeRect, candidates, keyCode);
            if (best && typeof best.focus === 'function') {
                best.focus();
                event.preventDefault();
                return true;
            }

            return false;
        },
        findBestSpatial: function(activeRect, candidates, keyCode) {
            var activeCenterX = activeRect.left + activeRect.width / 2;
            var activeCenterY = activeRect.top + activeRect.height / 2;
            var bestCandidate = null;
            var minScore = Infinity;

            for (var i = 0; i < candidates.length; i++) {
                var cand = candidates[i];
                var rect = cand.getBoundingClientRect();
                var centerX = rect.left + rect.width / 2;
                var centerY = rect.top + rect.height / 2;

                if (rect.left === activeRect.left && rect.top === activeRect.top && rect.width === activeRect.width && rect.height === activeRect.height) {
                    continue;
                }

                var isValidDirection = false;
                var primaryDist = 0;
                var secondaryDist = 0;

                if (keyCode === 37) { // Left
                    isValidDirection = (centerX < activeCenterX);
                    primaryDist = activeCenterX - centerX;
                    secondaryDist = Math.abs(centerY - activeCenterY);
                } else if (keyCode === 39) { // Right
                    isValidDirection = (centerX > activeCenterX);
                    primaryDist = centerX - activeCenterX;
                    secondaryDist = Math.abs(centerY - activeCenterY);
                } else if (keyCode === 38) { // Up
                    isValidDirection = (centerY < activeCenterY);
                    primaryDist = activeCenterY - centerY;
                    secondaryDist = Math.abs(centerX - activeCenterX);
                } else if (keyCode === 40) { // Down
                    isValidDirection = (centerY > activeCenterY);
                    primaryDist = centerY - activeCenterY;
                    secondaryDist = Math.abs(centerX - activeCenterX);
                }

                if (isValidDirection) {
                    var score = primaryDist + 2 * secondaryDist;
                    if (score < minScore) {
                        minScore = score;
                        bestCandidate = cand;
                    }
                }
            }

            return bestCandidate;
        }
    };

    function handleKeyDown(event) {
        var key = event.key || event.code;
        state.lastKey = {
            key: key,
            code: event.code,
            keyCode: event.keyCode
        };

        if (key === "Back" || event.keyCode === 10009 || event.keyCode === 461) {
            if (state.mode === "iframe") {
                var iframe = document.getElementById("app-iframe");
                if (iframe) {
                    try {
                        var win = iframe.contentWindow;
                        var doc = iframe.contentDocument || (win && win.document);
                        if (win && doc) {
                            var currentHash = win.location.hash || "";
                            if (currentHash && currentHash !== "#" && currentHash !== "#/" && currentHash !== "#/board") {
                                win.history.back();
                                event.preventDefault();
                                return;
                            }
                        }
                    } catch (e) {
                        // Ignore cross-origin errors
                    }
                }
            }
        }

        if (key === "Info" || event.keyCode === 457 ||
            key === "ColorF0Red" || event.keyCode === 403 ||
            key === "ColorF1Green" || event.keyCode === 404 ||
            key === "ColorF2Yellow" || event.keyCode === 405 ||
            key === "ColorF3Blue" || event.keyCode === 406 ||
            key === "1" || key === "Digit1" || event.keyCode === 49) {
            toggleDiagnostics();
            return;
        }

        if (!state.diagnosticsOpen) {
            NavigationAdapter.handleKey(event);
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
            NavigationAdapter.init();
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
