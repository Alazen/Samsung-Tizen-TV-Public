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
            var selector = 'a[href], button, input, select, textarea, [role="button"], [tabindex]';
            try {
                var els = doc.querySelectorAll(selector);
                var result = [];
                for (var i = 0; i < els.length; i++) {
                    var el = els[i];
                    var rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && !el.disabled) {
                        result.push(el);
                    }
                }
                return result;
            } catch (e) {
                return [];
            }
        },
        getElementText: function(el) {
            if (!el) return '';
            var parts = [el.innerText, el.textContent, el.value];
            var attrs = ['aria-label', 'title', 'name', 'placeholder', 'type', 'href'];
            for (var i = 0; i < attrs.length; i++) {
                if (el.getAttribute) parts.push(el.getAttribute(attrs[i]));
            }
            return parts.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
        },
        isSelected: function(el) {
            if (!el) return false;
            var className = (' ' + (el.className || '') + ' ').toLowerCase();
            var ariaSelected = el.getAttribute && el.getAttribute('aria-selected');
            var ariaCurrent = el.getAttribute && el.getAttribute('aria-current');
            var dataSelected = el.getAttribute && el.getAttribute('data-selected');
            return ariaSelected === 'true' || !!ariaCurrent || dataSelected === 'true' ||
                /(^|[\s_-])(selected|active)([\s_-]|$)/.test(className);
        },
        isEditable: function(el) {
            if (!el) return false;
            var tag = (el.tagName || '').toLowerCase();
            return tag === 'input' || tag === 'textarea' || tag === 'select' ||
                el.isContentEditable === true || (el.getAttribute && el.getAttribute('contenteditable') === 'true');
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
        getRouteHash: function() {
            var iframe = document.getElementById('app-iframe');
            try {
                return iframe && iframe.contentWindow && iframe.contentWindow.location ?
                    (iframe.contentWindow.location.hash || '') : '';
            } catch (e) {
                return '';
            }
        },
        getContentCards: function(candidates) {
            var cards = [];
            for (var i = 0; i < candidates.length; i++) {
                var el = candidates[i];
                var href = el.getAttribute ? (el.getAttribute('href') || '') : '';
                if (!this.isSidebarElement(el) && href.indexOf('#/detail/') === 0) cards.push(el);
            }
            return cards;
        },
        getSelectedContent: function(candidates) {
            var cards = this.getContentCards(candidates);
            for (var i = 0; i < cards.length; i++) {
                if (this.isSelected(cards[i])) return cards[i];
            }
            return null;
        },
        isFirstVisibleCardColumn: function(el, candidates) {
            var cards = this.getContentCards(candidates);
            var rect = el.getBoundingClientRect();
            var centerY = rect.top + rect.height / 2;
            for (var i = 0; i < cards.length; i++) {
                if (cards[i] === el) continue;
                var other = cards[i].getBoundingClientRect();
                var otherCenterY = other.top + other.height / 2;
                var sameRow = Math.abs(otherCenterY - centerY) < Math.min(rect.height, other.height) / 2;
                if (sameRow && other.left < rect.left) return false;
            }
            return true;
        },
        findRouteSidebar: function(candidates) {
            var hash = this.getRouteHash();
            var route = hash.split('?')[0];
            var best = null;
            var bestScore = 0;
            var selectedFallback = null;
            for (var i = 0; i < candidates.length; i++) {
                var el = candidates[i];
                if (!this.isSidebarElement(el)) continue;
                if (!selectedFallback && this.isSelected(el)) selectedFallback = el;
                var href = el.getAttribute ? (el.getAttribute('href') || '') : '';
                var hrefRoute = href.split('?')[0];
                var score = 0;
                if (hrefRoute === route) score = 4;
                else if (hrefRoute !== '#/' && route.indexOf(hrefRoute + '/') === 0) score = 3;
                else if (route.indexOf('#/discover') === 0 && hrefRoute.indexOf('#/discover') === 0) score = 2;
                if (score && this.isSelected(el)) score += 1;
                if (score > bestScore) {
                    best = el;
                    bestScore = score;
                }
            }
            return best || selectedFallback;
        },
        consume: function(event) {
            if (event.preventDefault) event.preventDefault();
            if (event.stopPropagation) event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        },
        focusHandled: function(el, event, diagnostic, deferred) {
            if (!el || typeof el.focus !== 'function') return false;
            this.consume(event);
            state.lastNavigation = diagnostic;
            if (deferred) {
                setTimeout(function() { el.focus(); }, 0);
            } else {
                el.focus();
            }
            return true;
        },
        isIntroRoute: function() {
            return this.getRouteHash().split('?')[0] === '#/intro';
        },
        getIntroFieldRole: function(el) {
            if (!this.isEditable(el)) return '';
            var text = this.getElementText(el);
            if (text.indexOf('confirm') !== -1 && text.indexOf('password') !== -1) return 'confirm-password';
            if (text.indexOf('password') !== -1) return 'password';
            if (text.indexOf('email') !== -1 || text.indexOf('e-mail') !== -1) return 'email';
            return '';
        },
        findIntroField: function(candidates, role) {
            for (var i = 0; i < candidates.length; i++) {
                if (this.getIntroFieldRole(candidates[i]) === role) return candidates[i];
            }
            return null;
        },
        isLegalOrConsent: function(el) {
            var text = this.getElementText(el);
            var type = el && el.getAttribute ? (el.getAttribute('type') || '').toLowerCase() : '';
            return type === 'checkbox' || text.indexOf('terms') !== -1 ||
                text.indexOf('privacy') !== -1 || text.indexOf('consent') !== -1 ||
                text.indexOf('agree') !== -1;
        },
        isMeaningfulAccountAction: function(el) {
            if (!el || this.isEditable(el) || this.isLegalOrConsent(el) || this.isSidebarElement(el)) return false;
            var tag = (el.tagName || '').toLowerCase();
            var role = el.getAttribute ? el.getAttribute('role') : '';
            var tabIndex = el.getAttribute ? el.getAttribute('tabindex') : null;
            return tag === 'button' || tag === 'a' || role === 'button' || tabIndex !== null;
        },
        findNearest: function(activeEl, candidates, predicate, keyCode) {
            var filtered = [];
            for (var i = 0; i < candidates.length; i++) {
                if (predicate.call(this, candidates[i])) filtered.push(candidates[i]);
            }
            return this.findBestSpatial(activeEl.getBoundingClientRect(), filtered, keyCode);
        },
        handleIntroKey: function(activeEl, candidates, keyCode, event) {
            var role = this.getIntroFieldRole(activeEl);
            var order = ['email', 'password', 'confirm-password'];
            var i;
            if (role && (keyCode === 38 || keyCode === 40)) {
                var nextIndex = order.indexOf(role) + (keyCode === 40 ? 1 : -1);
                if (nextIndex >= 0 && nextIndex < order.length) {
                    for (i = 0; i < candidates.length; i++) {
                        if (this.getIntroFieldRole(candidates[i]) === order[nextIndex]) {
                            return this.focusHandled(candidates[i], event,
                                'intro-form-' + role + '-to-' + order[nextIndex], false);
                        }
                    }
                }
                return false;
            }
            if (role && keyCode === 39) {
                var action = this.findNearest(activeEl, candidates, this.isMeaningfulAccountAction, keyCode);
                if (action) return this.focusHandled(action, event, 'intro-form-to-account-action', false);
            }
            if (this.isMeaningfulAccountAction(activeEl) && keyCode === 37) {
                var field = this.findNearest(activeEl, candidates, function(el) {
                    return !!this.getIntroFieldRole(el);
                }, keyCode);
                if (field) return this.focusHandled(field, event, 'intro-account-action-to-form', false);
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
                    this.consume(event);
                    state.lastNavigation = 'activate-' + (this.getElementText(activeEl).substring(0, 30) || 'control');
                    return true;
                }
                return false;
            }

            var candidates = this.getFocusableElements(doc);
            if (candidates.length === 0) return false;

            var hasDomFocus = !!activeEl && activeEl !== doc.body;
            if (!hasDomFocus) {
                if (this.isIntroRoute()) {
                    activeEl = this.findIntroField(candidates, 'email');
                } else if (keyCode === 37) {
                    activeEl = this.getSelectedContent(candidates);
                } else {
                    return false;
                }
            }

            if (!activeEl) return false;

            if (this.isIntroRoute()) return this.handleIntroKey(activeEl, candidates, keyCode, event);

            var isCurrentSidebar = this.isSidebarElement(activeEl);
            var contentCards = this.getContentCards(candidates);
            var isCurrentCard = contentCards.indexOf(activeEl) !== -1;
            var target = null;

            if (isCurrentSidebar) {
                if (keyCode === 38 || keyCode === 40) {
                    var sidebarCandidates = [];
                    for (var i = 0; i < candidates.length; i++) {
                        if (this.isSidebarElement(candidates[i])) sidebarCandidates.push(candidates[i]);
                    }
                    target = this.findBestSpatial(activeEl.getBoundingClientRect(), sidebarCandidates, keyCode);
                    if (target) return this.focusHandled(target, event,
                        keyCode === 38 ? 'sidebar-up' : 'sidebar-down', false);
                } else if (keyCode === 39) {
                    target = this.getSelectedContent(candidates) ||
                        this.findBestSpatial(activeEl.getBoundingClientRect(), contentCards, keyCode);
                    if (target) return this.focusHandled(target, event, 'sidebar-to-content-right', false);
                }
                return false;
            }

            if (isCurrentCard && !this.isEditable(activeEl)) {
                if (keyCode === 37 && this.isFirstVisibleCardColumn(activeEl, candidates)) {
                    var sidebar = this.findRouteSidebar(candidates);
                    if (sidebar) return this.focusHandled(sidebar, event,
                        'discover-first-column-to-current-sidebar', true);
                }
                target = this.findBestSpatial(activeEl.getBoundingClientRect(), contentCards, keyCode);
                if (target) {
                    var direction = keyCode === 37 ? 'left' : keyCode === 38 ? 'up' :
                        keyCode === 39 ? 'right' : 'down';
                    return this.focusHandled(target, event, 'content-card-' + direction, false);
                }
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

        if (!state.keyEventsLog) state.keyEventsLog = [];
        state.keyEventsLog.push({
            key: key,
            code: event.code,
            keyCode: event.keyCode,
            target: event.target ? event.target.tagName + (event.target.id ? '#' + event.target.id : '') : 'unknown',
            time: new Date().toLocaleTimeString()
        });
        if (state.keyEventsLog.length > 50) state.keyEventsLog.shift();

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
                                NavigationAdapter.consume(event);
                                state.lastNavigation = "back-from-" + currentHash.split('?')[0];
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
                doc.removeEventListener("keydown", handleKeyDown, true);
            } catch (err) {
                // Ignore
            }

            doc.addEventListener("keydown", handleKeyDown, true);
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

        window.document.addEventListener("keydown", handleKeyDown, true);

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
