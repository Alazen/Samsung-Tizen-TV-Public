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
        activeTab: "green",
        iframeListenerStatus: "unattached",
        lastNavigation: null,
        navigationAdapter: {
            status: "inactive",
            activeElement: null,
            candidateCount: 0
        }
    };

    var bootstrapTimeoutId = null;
    var bootstrapRetryCount = 0;
    var MAX_BOOTSTRAP_RETRIES = 15;

    var rectCache = null;
    var textCache = null;
    var elementTextCache = null;
    var detailSemanticTextCache = null;
    var isSidebarCache = null;
    var isSearchCache = null;
    var isFullscreenCache = null;
    var isProfileCache = null;
    var isSeeAllCache = null;
    var isInHeaderCache = null;
    var isHomeCache = null;

    function getRect(el) {
        if (!el) {
            return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
        }
        var getRectFn = el.getBoundingClientRect || el["getBoundingClientRect"];
        if (!getRectFn) {
            return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
        }
        if (rectCache) {
            var cached = rectCache.get(el);
            if (cached) return cached;
            var rect = getRectFn.call(el);
            rectCache.set(el, rect);
            return rect;
        }
        return getRectFn.call(el);
    }

    function getText(el) {
        if (!el) return "";
        if (textCache) {
            var cached = textCache.get(el);
            if (cached !== undefined) return cached;
            var text = (el.innerText || el.textContent || "").trim().toLowerCase();
            textCache.set(el, text);
            return text;
        }
        return (el.innerText || el.textContent || "").trim().toLowerCase();
    }


    function cancelBootstrap() {
        if (bootstrapTimeoutId) {
            clearTimeout(bootstrapTimeoutId);
            bootstrapTimeoutId = null;
        }
    }

    function runBootstrapAttempt() {
        if (!NavigationAdapter.enabled) return;

        var doc = NavigationAdapter.getIframeDoc();
        if (!doc) {
            bootstrapRetryCount++;
            scheduleBootstrap();
            return;
        }

        if (NavigationAdapter.isIntroRoute()) {
            cancelBootstrap();
            return;
        }

        var activeEl = doc.activeElement;
        if (activeEl && activeEl !== doc.body) {
            cancelBootstrap();
            return;
        }

        var candidates = NavigationAdapter.getFocusableElements(doc);
        if (candidates.length === 0) {
            bootstrapRetryCount++;
            scheduleBootstrap();
            return;
        }

        var target = NavigationAdapter.findBestVisibleSelectedControl(candidates);
        if (target && typeof target.focus === "function") {
            try {
                target.focus();
                if (doc.activeElement && doc.activeElement !== doc.body) {
                    state.lastNavigation = "bootstrap-focus-" + (NavigationAdapter.getElementText(target).substring(0, 30) || "control");
                    cancelBootstrap();
                    refreshDiagnostics(true);
                    NavigationAdapter.injectFocusStyle(doc);
                    return;
                }
            } catch (e) {
                // Focus failed
            }
        }

        bootstrapRetryCount++;
        scheduleBootstrap();
    }

    function scheduleBootstrap() {
        cancelBootstrap();
        if (bootstrapRetryCount >= MAX_BOOTSTRAP_RETRIES) {
            return;
        }
        bootstrapTimeoutId = setTimeout(function() {
            bootstrapTimeoutId = null;
            runBootstrapAttempt();
        }, 200);
    }

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
                        candidateCount: cands.length,
                        bootstrap: {
                            retryCount: bootstrapRetryCount,
                            active: !!bootstrapTimeoutId
                        }
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

    function getDiagnosticsOutput() {
        var s = getState();
        var data = {};
        data.activeTab = state.activeTab;

        if (state.activeTab === "red") {
            data.keyEventsLog = s.keyEventsLog || [];
        } else if (state.activeTab === "green") {
            data.lastNavigation = s.lastNavigation;
            data.navigationAdapter = s.navigationAdapter;
        } else if (state.activeTab === "yellow") {
            data.mediaSupport = s.mediaSupport;
            if (s.sameOrigin && s.sameOrigin.videoCount !== undefined) {
                data.videoCount = s.sameOrigin.videoCount;
                data.firstVideo = s.sameOrigin.firstVideo;
            }
        } else if (state.activeTab === "blue") {
            data.sameOrigin = s.sameOrigin;
            data.registrationResults = s.registrationResults;
        }
        return data;
    }

    function updateTabBar() {
        var panel = document.getElementById("diagnostics-panel");
        if (!panel || typeof panel.appendChild !== "function") return;

        try {
            var testDiv = document.createElement("div");
            if (!testDiv || !testDiv.style) return;
        } catch (e) {
            return;
        }

        var tabBar = document.getElementById("diagnostics-tab-bar");
        if (!tabBar) {
            tabBar = document.createElement("div");
            tabBar.id = "diagnostics-tab-bar";
            tabBar.style.display = "flex";
            tabBar.style.gap = "8px";
            tabBar.style.marginBottom = "8px";
            var pre = document.getElementById("runtime-log");
            if (pre) {
                panel.insertBefore(tabBar, pre);
            } else {
                panel.appendChild(tabBar);
            }
        }

        tabBar.innerHTML = "";
        var tabs = [
            { id: "red", label: "Red: Key Events", color: "#ff4d4d" },
            { id: "green", label: "Green: Nav/Focus", color: "#4daf50" },
            { id: "yellow", label: "Yellow: Media", color: "#ffeb3b" },
            { id: "blue", label: "Blue: Net/Err", color: "#2196f3" }
        ];

        tabs.forEach(function(t) {
            var btn = document.createElement("span");
            btn.textContent = t.label;
            btn.style.padding = "4px 8px";
            btn.style.borderRadius = "4px";
            btn.style.fontSize = "12px";
            btn.style.fontWeight = "bold";
            btn.style.border = "1px solid " + t.color;
            if (state.activeTab === t.id) {
                btn.style.backgroundColor = t.color;
                btn.style.color = t.id === "yellow" ? "#000" : "#fff";
            } else {
                btn.style.backgroundColor = "transparent";
                btn.style.color = t.color;
            }
            tabBar.appendChild(btn);
        });
    }

    function refreshDiagnostics(force) {
        var now = new Date().getTime();
        if (!force && (now - lastRefreshTime < refreshThrottleMs)) {
            return;
        }
        lastRefreshTime = now;

        var logNode = document.getElementById("runtime-log");
        if (logNode) {
            var diagData = getDiagnosticsOutput();
            logNode.textContent = JSON.stringify(diagData, null, 2);
        }
        updateTabBar();
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
                var tb = document.getElementById("diagnostics-tab-bar");
                if (tb && tb.parentElement) {
                    tb.parentElement.removeChild(tb);
                }
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
        cancelBootstrap();
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
            cancelBootstrap();
            bootstrapRetryCount = 0;
            scheduleBootstrap();
            if (this._detailFocusTimeoutId) {
                clearTimeout(this._detailFocusTimeoutId);
                this._detailFocusTimeoutId = null;
            }
            if (this._profileMenuFocusTimeoutId) {
                clearTimeout(this._profileMenuFocusTimeoutId);
                this._profileMenuFocusTimeoutId = null;
            }
        },
        destroy: function() {
            this.enabled = false;
            cancelBootstrap();
            if (this._detailFocusTimeoutId) {
                clearTimeout(this._detailFocusTimeoutId);
                this._detailFocusTimeoutId = null;
            }
            if (this._profileMenuFocusTimeoutId) {
                clearTimeout(this._profileMenuFocusTimeoutId);
                this._profileMenuFocusTimeoutId = null;
            }
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
                    var rect = getRect(el);
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
            var parts = [getText(el), el.value];
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
            if (this.isSeeAllElement && this.isSeeAllElement(el)) return false;
            if (this.isSearchElement && this.isSearchElement(el)) return false;
            if (this.isFullscreenElement && this.isFullscreenElement(el)) return false;
            if (this.isProfileElement && this.isProfileElement(el)) return false;
            var href = el.getAttribute('href') || '';
            var text = getText(el);
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
        isSeeAllElement: function(el) {
            if (!el) return false;
            var text = getText(el);
            var href = el.getAttribute ? (el.getAttribute('href') || '') : '';
            return text === 'see all' && href.indexOf('#/discover/') === 0;
        },
        isSameVisualRow: function(firstRect, secondRect) {
            var overlaps = firstRect.top < secondRect.bottom && secondRect.top < firstRect.bottom;
            var topDelta = Math.abs(firstRect.top - secondRect.top);
            var tolerance = Math.max(firstRect.height, secondRect.height) / 2;
            return overlaps || topDelta <= tolerance;
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
            var rect = getRect(el);
            var centerY = rect.top + rect.height / 2;
            for (var i = 0; i < cards.length; i++) {
                if (cards[i] === el) continue;
                var other = getRect(cards[i]);
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
            cancelBootstrap();
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
            return this.findBestSpatial(getRect(activeEl), filtered, keyCode);
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
        isInHeaderOrNav: function(el) {
            if (!el) return false;
            var parent = el;
            while (parent) {
                var tag = (parent.tagName || '').toLowerCase();
                var role = parent.getAttribute ? (parent.getAttribute('role') || '').toLowerCase() : '';
                var id = (parent.id || '').toLowerCase();
                var className = (parent.className || '').toLowerCase();
                if (tag === 'header' || tag === 'nav' ||
                    role === 'navigation' || role === 'banner' ||
                    id.indexOf('header') !== -1 || id.indexOf('nav') !== -1 ||
                    (/(^|[\s_-])(header|nav|topbar)([\s_-]|$)/i).test(className)) {
                    return true;
                }
                parent = parent.parentElement;
            }
            return false;
        },
        getHeaderNavBoundary: function(el) {
            if (!el) return null;
            var parent = el;
            while (parent) {
                var tag = (parent.tagName || '').toLowerCase();
                var role = parent.getAttribute ? (parent.getAttribute('role') || '').toLowerCase() : '';
                var id = (parent.id || '').toLowerCase();
                var className = (parent.className || '').toLowerCase();
                if (tag === 'header' || tag === 'nav' ||
                    role === 'navigation' || role === 'banner' ||
                    id.indexOf('header') !== -1 || id.indexOf('nav') !== -1 ||
                    (/(^|[\s_-])(header|nav|topbar)([\s_-]|$)/i).test(className)) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        },
        hasSemanticSearchEvidence: function(el) {
            if (!el) return false;
            var tag = (el.tagName || '').toLowerCase();
            var type = el.getAttribute ? (el.getAttribute('type') || '').toLowerCase() : '';
            var placeholder = el.getAttribute ? (el.getAttribute('placeholder') || '').toLowerCase() : '';
            var ariaLabel = el.getAttribute ? (el.getAttribute('aria-label') || '').toLowerCase() : '';
            var title = el.getAttribute ? (el.getAttribute('title') || '').toLowerCase() : '';
            var name = el.getAttribute ? (el.getAttribute('name') || '').toLowerCase() : '';
            var id = (el.id || '').toLowerCase();
            var role = el.getAttribute ? (el.getAttribute('role') || '').toLowerCase() : '';
            var text = (el.innerText || el.textContent || '').trim().toLowerCase();

            if (role === 'search' || id.indexOf('search') !== -1) {
                return true;
            }
            if (tag === 'input' && (type === 'search' || name === 'search' || placeholder.indexOf('search') !== -1)) {
                return true;
            }
            if (ariaLabel.indexOf('search') !== -1 || title.indexOf('search') !== -1 || name.indexOf('search') !== -1) {
                return true;
            }
            if (text.indexOf('search') !== -1 || text.indexOf('search or paste link') !== -1) {
                return true;
            }
            return false;
        },
        isSearchElement: function(el) {
            if (!el) return false;
            var boundary = this.getHeaderNavBoundary(el);
            if (!boundary) return false;

            var curr = el;
            while (curr && curr !== boundary) {
                if (this.hasSemanticSearchEvidence(curr)) {
                    return true;
                }
                curr = curr.parentElement;
            }
            return false;
        },
        isFullscreenElement: function(el) {
            if (!el) return false;
            if (!this.isInHeaderOrNav(el)) return false;
            var text = (el.innerText || el.textContent || '').trim().toLowerCase();
            var title = el.getAttribute ? (el.getAttribute('title') || '').toLowerCase() : '';
            var ariaLabel = el.getAttribute ? (el.getAttribute('aria-label') || '').toLowerCase() : '';
            var id = (el.id || '').toLowerCase();

            if (text.indexOf('fullscreen') !== -1 || text.indexOf('full screen') !== -1 ||
                title.indexOf('fullscreen') !== -1 || title.indexOf('full screen') !== -1 ||
                ariaLabel.indexOf('fullscreen') !== -1 || ariaLabel.indexOf('full screen') !== -1 ||
                id.indexOf('fullscreen') !== -1) {
                return true;
            }
            return false;
        },
        isProfileElement: function(el, candidates) {
            if (!el) return false;
            if (!this.isInHeaderOrNav(el)) return false;

            if (!candidates) {
                var doc = this.getIframeDoc();
                candidates = this.getFocusableElements(doc);
            }

            var headerCands = [];
            for (var i = 0; i < candidates.length; i++) {
                var cand = candidates[i];
                if (this.isInHeaderOrNav(cand)) {
                    headerCands.push(cand);
                }
            }

            var remaining = [];
            for (var i = 0; i < headerCands.length; i++) {
                var cand = headerCands[i];
                if (this.isSearchElement(cand)) continue;
                if (this.isFullscreenElement(cand)) continue;
                remaining.push(cand);
            }

            if (remaining.length === 0) return false;

            remaining.sort(function(a, b) {
                return getRect(a).left - getRect(b).left;
            });

            return el === remaining[remaining.length - 1];
        },
        isHomeControl: function(el) {
            if (!this.isSidebarElement(el)) return false;
            var text = (el.innerText || el.textContent || '').trim().toLowerCase();
            var href = el.getAttribute ? (el.getAttribute('href') || '') : '';
            return text === 'board' || text === 'home' || href === '#/' || href === '/';
        },
        findHomeControl: function(candidates) {
            for (var i = 0; i < candidates.length; i++) {
                if (this.isHomeControl(candidates[i])) return candidates[i];
            }
            return null;
        },
        findSearchControl: function(candidates) {
            for (var i = 0; i < candidates.length; i++) {
                if (this.isSearchElement(candidates[i])) return candidates[i];
            }
            return null;
        },
        findFullscreenControl: function(candidates) {
            for (var i = 0; i < candidates.length; i++) {
                if (this.isFullscreenElement(candidates[i])) return candidates[i];
            }
            return null;
        },
        findProfileControl: function(candidates) {
            for (var i = 0; i < candidates.length; i++) {
                if (this.isProfileElement(candidates[i], candidates)) return candidates[i];
            }
            return null;
        },
        isProfileMenuAction: function(el, candidates) {
            if (!el || this.isEditable(el) || this.isSeeAllElement(el)) return false;
            if (this.isSidebarElement(el) || this.isSearchElement(el) || this.isFullscreenElement(el)) return false;
            if (this.isProfileElement(el, candidates)) return false;
            if (this.getContentCards(candidates).indexOf(el) !== -1) return false;
            var tag = (el.tagName || '').toLowerCase();
            var role = el.getAttribute ? (el.getAttribute('role') || '').toLowerCase() : '';
            var tabIndex = el.getAttribute ? el.getAttribute('tabindex') : null;
            return tag === 'button' || tag === 'a' || role === 'button' || tabIndex !== null;
        },
        findProfileMenuAction: function(anchorRect, candidates) {
            var actions = [];
            var preferred = [];
            var i;

            for (i = 0; i < candidates.length; i++) {
                var cand = candidates[i];
                if (!this.isProfileMenuAction(cand, candidates)) continue;
                var rect = getRect(cand);
                if (anchorRect) {
                    var candCenterY = rect.top + rect.height / 2;
                    var anchorCenterY = anchorRect.top + anchorRect.height / 2;
                    if (candCenterY <= anchorCenterY) continue;
                }
                actions.push(cand);
                var text = this.getElementText(cand);
                if (text.indexOf('log in') !== -1 || text.indexOf('sign up') !== -1 ||
                    text.indexOf('sign in') !== -1 || text.indexOf('anonymous') !== -1 ||
                    text.indexOf('account') !== -1 || text.indexOf('profile') !== -1) {
                    preferred.push(cand);
                }
            }

            if (preferred.length > 0) {
                return this.findBestSpatial(anchorRect, preferred, 40) || preferred[0];
            }
            if (actions.length > 0) {
                return this.findBestSpatial(anchorRect, actions, 40) || actions[0];
            }
            return null;
        },
        getDetailSemanticText: function(el) {
            if (!el) return '';
            var parts = [getText(el), el.id];
            var attrs = ['aria-label', 'title', 'name', 'placeholder', 'role', 'href'];
            for (var i = 0; i < attrs.length; i++) {
                if (el.getAttribute) parts.push(el.getAttribute(attrs[i]));
            }
            return parts.join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
        },
        hasDetailSourceSignal: function(el) {
            if (!el) return false;
            var text = this.getDetailSemanticText(el);
            var tag = (el.tagName || '').toLowerCase();
            var role = el.getAttribute ? (el.getAttribute('role') || '').toLowerCase() : '';
            return text.indexOf('stream') !== -1 || text.indexOf('source') !== -1 ||
                text.indexOf('torrent') !== -1 || text.indexOf('no streams') !== -1 ||
                text.indexOf('install addon') !== -1 || text.indexOf('quality') !== -1 ||
                text.indexOf('filter') !== -1 || tag === 'select' ||
                role === 'combobox' || role === 'listbox';
        },
        findDetailSourceGroup: function(el) {
            var node = el;
            while (node) {
                if (this.hasDetailSourceSignal(node)) return node;
                node = node.parentElement;
            }
            return null;
        },
        isHiddenOrUploadControl: function(el) {
            if (!el) return true;
            var tag = (el.tagName || '').toLowerCase();
            var type = el.getAttribute ? (el.getAttribute('type') || '').toLowerCase() : '';
            var hidden = el.getAttribute ? el.getAttribute('hidden') : null;
            var ariaHidden = el.getAttribute ? el.getAttribute('aria-hidden') : null;
            var text = this.getDetailSemanticText(el);
            return el.hidden === true || hidden !== null || ariaHidden === 'true' ||
                (tag === 'input' && (type === 'file' || type === 'hidden')) ||
                text.indexOf('upload') !== -1 || text.indexOf('choose file') !== -1 ||
                text.indexOf('browse file') !== -1;
        },
        isFullViewportSemanticEmptyControl: function(el, candidates) {
            if (!el || this.getDetailSemanticText(el)) return false;
            var rect = getRect(el);
            var minLeft = Infinity;
            var minTop = Infinity;
            var maxRight = -Infinity;
            var maxBottom = -Infinity;
            var visibleCount = 0;
            for (var i = 0; i < candidates.length; i++) {
                if (!candidates[i] || !candidates[i].getBoundingClientRect) continue;
                var other = getRect(candidates[i]);
                if (!(other.width > 0 && other.height > 0)) continue;
                visibleCount++;
                minLeft = Math.min(minLeft, other.left);
                minTop = Math.min(minTop, other.top);
                maxRight = Math.max(maxRight, other.left + other.width);
                maxBottom = Math.max(maxBottom, other.top + other.height);
            }
            return visibleCount > 1 && rect.left <= minLeft && rect.top <= minTop &&
                rect.left + rect.width >= maxRight && rect.top + rect.height >= maxBottom;
        },
        isMeaningfulDetailAction: function(el) {
            if (!el) return false;
            var text = this.getDetailSemanticText(el);
            var tag = (el.tagName || '').toLowerCase();
            var role = el.getAttribute ? (el.getAttribute('role') || '').toLowerCase() : '';
            if (text.indexOf('no streams') !== -1 && text.indexOf('install addon') === -1) return false;
            return !!text || tag === 'select' || role === 'combobox' || role === 'listbox';
        },
        findDetailSourceFilter: function(candidates) {
            var groups = [];
            for (var i = 0; i < candidates.length; i++) {
                var el = candidates[i];
                if (!el) continue;
                var group = this.findDetailSourceGroup(el);
                if (this.isSidebarElement(el) && !group) continue;
                if (this.isInHeaderOrNav && this.isInHeaderOrNav(el)) continue;
                if (this.isHiddenOrUploadControl(el)) continue;
                if (this.isFullViewportSemanticEmptyControl(el, candidates)) continue;
                if (!this.isMeaningfulDetailAction(el)) continue;

                if (!group) continue;
                var groupRect = group.getBoundingClientRect ? getRect(group) : getRect(el);
                var entry = null;
                for (var g = 0; g < groups.length; g++) {
                    if (groups[g].group === group) {
                        entry = groups[g];
                        break;
                    }
                }
                if (!entry) {
                    entry = { group: group, rect: groupRect, candidates: [] };
                    groups.push(entry);
                }
                entry.candidates.push(el);
            }

            if (groups.length === 0) return null;
            var rightmost = null;
            var rightmostCenter = -Infinity;
            for (var j = 0; j < groups.length; j++) {
                var center = groups[j].rect.left + groups[j].rect.width / 2;
                if (center > rightmostCenter) {
                    rightmostCenter = center;
                    rightmost = groups[j];
                }
            }
            var rightCandidates = [];
            for (var k = 0; k < groups.length; k++) {
                var overlapsRightmost = groups[k].rect.left < rightmost.rect.left + rightmost.rect.width &&
                    rightmost.rect.left < groups[k].rect.left + groups[k].rect.width;
                if (overlapsRightmost) {
                    rightCandidates = rightCandidates.concat(groups[k].candidates);
                }
            }
            rightCandidates.sort(function(a, b) {
                var ar = getRect(a);
                var br = getRect(b);
                return ar.top === br.top ? ar.left - br.left : ar.top - br.top;
            });
            return rightCandidates.length > 0 ? rightCandidates[0] : null;
        },
        getRowMap: function(candidates) {
            var cards = this.getContentCards(candidates);
            if (cards.length === 0) return [];

            var sorted = cards.slice().sort(function(a, b) {
                var ra = getRect(a);
                var rb = getRect(b);
                if (Math.abs(ra.top - rb.top) < 15) {
                    return ra.left - rb.left;
                }
                return ra.top - rb.top;
            });

            var rows = [];
            for (var i = 0; i < sorted.length; i++) {
                var card = sorted[i];
                var rect = getRect(card);
                var placed = false;
                for (var r = 0; r < rows.length; r++) {
                    var rowRect = getRect(rows[r][0]);
                    if (this.isSameVisualRow(rowRect, rect)) {
                        rows[r].push(card);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    rows.push([card]);
                }
            }

            rows.forEach(function(row) {
                row.sort(function(a, b) {
                    return getRect(a).left - getRect(b).left;
                });
            });
            rows.sort(function(a, b) {
                return getRect(a[0]).top - getRect(b[0]).top;
            });

            return rows;
        },
        findSameRowSeeAll: function(el, candidates) {
            var rect = getRect(el);
            for (var i = 0; i < candidates.length; i++) {
                var cand = candidates[i];
                if (this.isSeeAllElement(cand)) {
                    if (this.isSameVisualRow(rect, getRect(cand))) {
                        return cand;
                    }
                }
            }
            return null;
        },
        findBestVisibleSelectedControl: function(candidates) {
            if (this.getRouteHash().indexOf('#/detail/') !== -1) {
                return this.findDetailSourceFilter(candidates);
            }
            var selectedContent = this.getSelectedContent(candidates);
            if (selectedContent) return selectedContent;
            return this.findRouteSidebar(candidates);
        },
        markSearchContainer: function(doc) {
            if (!doc) return;
            try {
                var candidates = this.getFocusableElements(doc);
                var searchEl = this.findSearchControl(candidates);
                if (searchEl) {
                    var boundary = this.getHeaderNavBoundary(searchEl);
                    if (boundary) {
                        var curr = searchEl;
                        while (curr && curr.parentElement && curr.parentElement !== boundary) {
                            curr = curr.parentElement;
                        }
                        if (curr && curr !== boundary) {
                            curr.setAttribute('data-search-container', 'true');
                        }
                    } else {
                        var parent = searchEl.parentElement;
                        while (parent && parent !== doc.body) {
                            var tag = (parent.tagName || '').toLowerCase();
                            if (tag === 'form' || tag === 'div' || parent.getAttribute('role') === 'search') {
                                parent.setAttribute('data-search-container', 'true');
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    }
                }
            } catch (e) {
                // Ignore
            }
        },
        injectFocusStyle: function(doc) {
            if (!doc) return;
            try {
                this.markSearchContainer(doc);
                var styleId = "codex-tv-focus-style";
                if (doc.getElementById(styleId)) return;
                var style = doc.createElement("style");
                style.id = styleId;
                style.textContent =
                    "a:focus, button:focus, input:focus, select:focus, textarea:focus, [tabindex]:focus, [role=\"button\"]:focus {\n" +
                    "    outline: 3px solid #ffcc00 !important;\n" +
                    "    box-shadow: 0 0 10px #ffcc00 !important;\n" +
                    "}\n" +
                    "[data-search-container]:focus-within {\n" +
                    "    outline: 3px solid #ffcc00 !important;\n" +
                    "    box-shadow: 0 0 10px #ffcc00 !important;\n" +
                    "}";
                (doc.head || doc.body || doc.documentElement).appendChild(style);
            } catch (e) {
                // Ignore cross-origin errors
            }
        },
        scheduleDetailFocusRetry: function() {
            var self = this;
            var attempts = 0;
            var maxAttempts = 15;

            if (this._detailFocusTimeoutId) {
                clearTimeout(this._detailFocusTimeoutId);
                this._detailFocusTimeoutId = null;
            }

            function attemptFocus() {
                if (!self.enabled) return;
                var doc = self.getIframeDoc();
                if (!doc) {
                    reschedule();
                    return;
                }
                var hash = self.getRouteHash();
                if (hash.indexOf('#/detail/') === -1) {
                    reschedule();
                    return;
                }
                var candidates = self.getFocusableElements(doc);
                var filter = self.findDetailSourceFilter(candidates);
                if (filter && typeof filter.focus === 'function') {
                    try {
                        filter.focus();
                        if (doc.activeElement === filter) {
                            state.lastNavigation = 'detail-route-focus-filter';
                            refreshDiagnostics(true);
                            self._detailFocusTimeoutId = null;
                            return;
                        }
                    } catch (e) {
                        // ignore
                    }
                }
                reschedule();
            }

            function reschedule() {
                attempts++;
                if (attempts < maxAttempts) {
                    self._detailFocusTimeoutId = setTimeout(attemptFocus, 100);
                } else {
                    self._detailFocusTimeoutId = null;
                }
            }

            self._detailFocusTimeoutId = setTimeout(attemptFocus, 100);
        },
        scheduleProfileMenuFocusRetry: function(anchorEl) {
            var self = this;
            var attempts = 0;
            var maxAttempts = 12;
            var anchorRect = anchorEl && anchorEl.getBoundingClientRect ? getRect(anchorEl) : null;

            if (this._profileMenuFocusTimeoutId) {
                clearTimeout(this._profileMenuFocusTimeoutId);
                this._profileMenuFocusTimeoutId = null;
            }

            function attemptFocus() {
                if (!self.enabled) return;
                var doc = self.getIframeDoc();
                if (!doc) {
                    reschedule();
                    return;
                }
                if (self.isIntroRoute()) {
                    self._profileMenuFocusTimeoutId = null;
                    return;
                }
                var active = doc.activeElement;
                if (active && active !== doc.body && active !== anchorEl) {
                    self._profileMenuFocusTimeoutId = null;
                    return;
                }
                var candidates = self.getFocusableElements(doc);
                var action = self.findProfileMenuAction(anchorRect, candidates);
                if (action && typeof action.focus === 'function') {
                    try {
                        action.focus();
                        if (doc.activeElement === action) {
                            state.lastNavigation = 'profile-menu-focus';
                            refreshDiagnostics(true);
                            self._profileMenuFocusTimeoutId = null;
                            return;
                        }
                    } catch (e) {
                        // ignore
                    }
                }
                reschedule();
            }

            function reschedule() {
                attempts++;
                if (attempts < maxAttempts) {
                    self._profileMenuFocusTimeoutId = setTimeout(attemptFocus, 100);
                } else {
                    self._profileMenuFocusTimeoutId = null;
                }
            }

            self._profileMenuFocusTimeoutId = setTimeout(attemptFocus, 100);
        },
        handleKey: function(event) {
            if (!this.enabled) return false;

            var key = event.key || event.code;
            var keyCode = event.keyCode;

            if (keyCode !== 37 && keyCode !== 38 && keyCode !== 39 && keyCode !== 40 && keyCode !== 13) {
                return false;
            }

            // Directional repeat cap
            if (keyCode >= 37 && keyCode <= 40) {
                var now = new Date().getTime();
                if (keyCode !== this._lastDirectionalCode) {
                    this._lastDirectionalTime = 0;
                    this._lastDirectionalCode = keyCode;
                }
                if (!this._lastDirectionalTime) this._lastDirectionalTime = 0;
                if (now - this._lastDirectionalTime < 200) {
                    this.consume(event);
                    return true;
                }
                this._lastDirectionalTime = now;
            }

            var doc = this.getIframeDoc();
            if (!doc) return false;

            var candidates = this.getFocusableElements(doc);
            if (candidates.length === 0) return false;

            var activeEl = doc.activeElement;
            var hasDomFocus = !!activeEl && activeEl !== doc.body;
            if (hasDomFocus) {
                cancelBootstrap();
            }

            if (!hasDomFocus) {
                if (this.isIntroRoute()) {
                    var email = this.findIntroField(candidates, 'email');
                    if (email) {
                        return this.handleIntroKey(email, candidates, keyCode, event);
                    }
                    return false;
                }

                var selected = this.findBestVisibleSelectedControl(candidates);
                if (!selected) return false;

                if (keyCode === 13) {
                    return this.focusHandled(selected, event, 'body-enter-focus', false);
                }

                var rows = this.getRowMap(candidates);
                var isSidebar = this.isSidebarElement(selected);
                if (isSidebar) {
                    if (keyCode === 40) {
                        var sidebarCandidates = [];
                        for (var i = 0; i < candidates.length; i++) {
                            if (this.isSidebarElement(candidates[i])) sidebarCandidates.push(candidates[i]);
                        }
                        var target = this.findBestSpatial(getRect(selected), sidebarCandidates, keyCode);
                        if (target) return this.focusHandled(target, event, 'sidebar-down', false);
                    } else if (keyCode === 38) {
                        var sidebarCandidates = [];
                        for (var i = 0; i < candidates.length; i++) {
                            if (this.isSidebarElement(candidates[i])) sidebarCandidates.push(candidates[i]);
                        }
                        var target = this.findBestSpatial(getRect(selected), sidebarCandidates, keyCode);
                        if (target) return this.focusHandled(target, event, 'sidebar-up', false);
                    } else if (keyCode === 39) {
                        if (rows.length > 0 && rows[0].length > 0) {
                            return this.focusHandled(rows[0][0], event, 'sidebar-to-content-right', false);
                        }
                    }
                } else {
                    if (keyCode === 37) {
                        var home = this.findHomeControl(candidates);
                        if (home) return this.focusHandled(home, event, 'card-to-home', false);
                        var sidebar = this.findRouteSidebar(candidates);
                        if (sidebar) return this.focusHandled(sidebar, event,
                            'discover-first-column-to-current-sidebar', true);
                    }
                }
                return false;
            }

            var logicalActiveEl = activeEl;

            var contentCards = this.getContentCards(candidates);
            if (keyCode === 13) {
                if (this.isSearchElement(logicalActiveEl)) {
                    return false;
                }
                if (logicalActiveEl && typeof logicalActiveEl.click === 'function') {
                    var isCard = contentCards.indexOf(logicalActiveEl) !== -1;
                    var isProfile = this.isProfileElement(logicalActiveEl, candidates);
                    logicalActiveEl.click();
                    this.consume(event);
                    state.lastNavigation = 'activate-' + (this.getElementText(logicalActiveEl).substring(0, 30) || 'control');
                    if (isCard) {
                        this.scheduleDetailFocusRetry();
                    } else if (isProfile) {
                        this.scheduleProfileMenuFocusRetry(logicalActiveEl);
                    }
                    return true;
                }
                return false;
            }

            if (this.isIntroRoute()) return this.handleIntroKey(logicalActiveEl, candidates, keyCode, event);

            var rows = this.getRowMap(candidates);

            var isCurrentHome = this.isHomeControl(logicalActiveEl);
            var isCurrentSearch = this.isSearchElement(logicalActiveEl);
            var isCurrentFullscreen = this.isFullscreenElement(logicalActiveEl);
            var isCurrentProfile = this.isProfileElement(logicalActiveEl);

            if (isCurrentSearch) {
                if (keyCode === 37) {
                    var home = this.findHomeControl(candidates);
                    if (home) return this.focusHandled(home, event, 'search-to-home', false);
                } else if (keyCode === 39) {
                    var fs = this.findFullscreenControl(candidates);
                    if (fs) return this.focusHandled(fs, event, 'search-to-fullscreen', false);
                } else if (keyCode === 40) {
                    if (rows.length > 0 && rows[0].length > 0) {
                        return this.focusHandled(rows[0][0], event, 'search-to-first-card', false);
                    }
                } else if (keyCode === 38) {
                    this.consume(event);
                    return true;
                }
                return false;
            }

            if (isCurrentFullscreen) {
                if (keyCode === 37) {
                    var search = this.findSearchControl(candidates);
                    if (search) return this.focusHandled(search, event, 'fullscreen-to-search', false);
                } else if (keyCode === 39) {
                    var profile = this.findProfileControl(candidates);
                    if (profile) return this.focusHandled(profile, event, 'fullscreen-to-profile', false);
                } else if (keyCode === 40) {
                    if (rows.length > 0 && rows[0].length > 0) {
                        return this.focusHandled(rows[0][0], event, 'fullscreen-to-first-card', false);
                    }
                } else if (keyCode === 38) {
                    this.consume(event);
                    return true;
                }
                return false;
            }

            if (isCurrentProfile) {
                if (keyCode === 37) {
                    var fs = this.findFullscreenControl(candidates);
                    if (fs) return this.focusHandled(fs, event, 'profile-to-fullscreen', false);
                } else if (keyCode === 39) {
                    this.consume(event);
                    return true;
                } else if (keyCode === 40) {
                    if (rows.length > 0 && rows[0].length > 0) {
                        return this.focusHandled(rows[0][0], event, 'profile-to-first-card', false);
                    }
                } else if (keyCode === 38) {
                    this.consume(event);
                    return true;
                }
                return false;
            }

            var isCurrentSidebar = this.isSidebarElement(logicalActiveEl);
            var isCurrentCard = contentCards.indexOf(logicalActiveEl) !== -1;
            var isCurrentSeeAll = this.isSeeAllElement(logicalActiveEl);

            if (isCurrentSidebar) {
                if (keyCode === 38) {
                    if (isCurrentHome) {
                        var search = this.findSearchControl(candidates);
                        if (search) return this.focusHandled(search, event, 'home-to-search', false);
                    } else {
                        var sidebarCandidates = [];
                        for (var i = 0; i < candidates.length; i++) {
                            if (this.isSidebarElement(candidates[i])) sidebarCandidates.push(candidates[i]);
                        }
                        var target = this.findBestSpatial(getRect(logicalActiveEl), sidebarCandidates, keyCode);
                        if (target) return this.focusHandled(target, event, 'sidebar-up', false);
                    }
                } else if (keyCode === 40) {
                    var sidebarCandidates = [];
                    for (var i = 0; i < candidates.length; i++) {
                        if (this.isSidebarElement(candidates[i])) sidebarCandidates.push(candidates[i]);
                    }
                    var target = this.findBestSpatial(getRect(logicalActiveEl), sidebarCandidates, keyCode);
                    if (target) return this.focusHandled(target, event, 'sidebar-down', false);
                } else if (keyCode === 39) {
                    if (rows.length > 0 && rows[0].length > 0) {
                        return this.focusHandled(rows[0][0], event, 'sidebar-to-content-right', false);
                    }
                }
                return false;
            }

            if (isCurrentCard && !this.isEditable(logicalActiveEl)) {
                var activeRect = getRect(logicalActiveEl);

                if (keyCode === 38 && rows.length > 0 && rows[0].indexOf(logicalActiveEl) !== -1) {
                    var search = this.findSearchControl(candidates);
                    if (search) return this.focusHandled(search, event, 'first-row-card-to-search', false);
                }

                if (keyCode === 37) {
                    var isFirstInRow = false;
                    for (var r = 0; r < rows.length; r++) {
                        if (rows[r][0] === logicalActiveEl) {
                            isFirstInRow = true;
                            break;
                        }
                    }
                    if (isFirstInRow) {
                        var home = this.findHomeControl(candidates);
                        if (home) return this.focusHandled(home, event, 'card-to-home', false);
                        var sidebar = this.findRouteSidebar(candidates);
                        if (sidebar) return this.focusHandled(sidebar, event,
                            'discover-first-column-to-current-sidebar', true);
                    }
                }

                if (keyCode === 39) {
                    var isLastInRow = false;
                    for (var r = 0; r < rows.length; r++) {
                        if (rows[r][rows[r].length - 1] === logicalActiveEl) {
                            isLastInRow = true;
                            break;
                        }
                    }
                    if (isLastInRow) {
                        var seeAll = this.findSameRowSeeAll(logicalActiveEl, candidates);
                        if (seeAll) return this.focusHandled(seeAll, event, 'card-to-see-all', false);
                    }
                }

                var target = this.findBestSpatial(activeRect, contentCards, keyCode);
                if (target) {
                    var direction = keyCode === 37 ? 'left' : keyCode === 38 ? 'up' :
                        keyCode === 39 ? 'right' : 'down';
                    return this.focusHandled(target, event, 'content-card-' + direction, false);
                }
                return false;
            }

            if (isCurrentSeeAll) {
                var sameRowIdx = -1;
                for (var r = 0; r < rows.length; r++) {
                    if (this.findSameRowSeeAll(rows[r][0], candidates) === logicalActiveEl) {
                        sameRowIdx = r;
                        break;
                    }
                }

                if (keyCode === 37) {
                    if (sameRowIdx !== -1 && rows[sameRowIdx].length > 0) {
                        var lastCard = rows[sameRowIdx][rows[sameRowIdx].length - 1];
                        return this.focusHandled(lastCard, event, 'see-all-to-content-left', false);
                    }
                } else if (keyCode === 39) {
                    if (sameRowIdx !== -1 && sameRowIdx + 1 < rows.length && rows[sameRowIdx + 1].length > 0) {
                        var nextFirstCard = rows[sameRowIdx + 1][0];
                        return this.focusHandled(nextFirstCard, event, 'see-all-to-next-row-first', false);
                    }
                } else if (keyCode === 38) {
                    if (sameRowIdx === 0) {
                        var search = this.findSearchControl(candidates);
                        if (search) return this.focusHandled(search, event, 'top-see-all-to-search', false);
                    } else if (sameRowIdx > 0) {
                        if (rows[sameRowIdx - 1] && rows[sameRowIdx - 1].length > 0) {
                            var prevFirstCard = rows[sameRowIdx - 1][0];
                            return this.focusHandled(prevFirstCard, event, 'see-all-to-adjacent-row-first-up', false);
                        }
                    }
                } else if (keyCode === 40) {
                    if (sameRowIdx !== -1 && sameRowIdx + 1 < rows.length) {
                        if (rows[sameRowIdx + 1] && rows[sameRowIdx + 1].length > 0) {
                            var nextFirstCard = rows[sameRowIdx + 1][0];
                            return this.focusHandled(nextFirstCard, event, 'see-all-to-adjacent-row-first-down', false);
                        }
                    }
                }
                return false;
            }

            var target = this.findBestSpatial(getRect(logicalActiveEl), candidates, keyCode);
            if (target) {
                var direction = keyCode === 37 ? 'left' : keyCode === 38 ? 'up' :
                    keyCode === 39 ? 'right' : 'down';
                return this.focusHandled(target, event, 'spatial-' + direction, false);
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
                var rect = getRect(cand);
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

        (function() {
            var originalIsSidebar = NavigationAdapter.isSidebarElement;
            NavigationAdapter.isSidebarElement = function(el) {
                if (!el) return false;
                if (isSidebarCache) {
                    var cached = isSidebarCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalIsSidebar.call(this, el);
                if (isSidebarCache) {
                    isSidebarCache.set(el, res);
                }
                return res;
            };

            var originalIsSeeAll = NavigationAdapter.isSeeAllElement;
            NavigationAdapter.isSeeAllElement = function(el) {
                if (!el) return false;
                if (isSeeAllCache) {
                    var cached = isSeeAllCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalIsSeeAll.call(this, el);
                if (isSeeAllCache) {
                    isSeeAllCache.set(el, res);
                }
                return res;
            };

            var originalIsInHeader = NavigationAdapter.isInHeaderOrNav;
            NavigationAdapter.isInHeaderOrNav = function(el) {
                if (!el) return false;
                if (isInHeaderCache) {
                    var cached = isInHeaderCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalIsInHeader.call(this, el);
                if (isInHeaderCache) {
                    isInHeaderCache.set(el, res);
                }
                return res;
            };

            var originalIsSearch = NavigationAdapter.isSearchElement;
            NavigationAdapter.isSearchElement = function(el) {
                if (!el) return false;
                if (isSearchCache) {
                    var cached = isSearchCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalIsSearch.call(this, el);
                if (isSearchCache) {
                    isSearchCache.set(el, res);
                }
                return res;
            };

            var originalIsFullscreen = NavigationAdapter.isFullscreenElement;
            NavigationAdapter.isFullscreenElement = function(el) {
                if (!el) return false;
                if (isFullscreenCache) {
                    var cached = isFullscreenCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalIsFullscreen.call(this, el);
                if (isFullscreenCache) {
                    isFullscreenCache.set(el, res);
                }
                return res;
            };

            var originalIsProfile = NavigationAdapter.isProfileElement;
            NavigationAdapter.isProfileElement = function(el, candidates) {
                if (!el) return false;
                if (isProfileCache) {
                    var cached = isProfileCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalIsProfile.call(this, el, candidates);
                if (isProfileCache) {
                    isProfileCache.set(el, res);
                }
                return res;
            };

            var originalIsHome = NavigationAdapter.isHomeControl;
            NavigationAdapter.isHomeControl = function(el) {
                if (!el) return false;
                if (isHomeCache) {
                    var cached = isHomeCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalIsHome.call(this, el);
                if (isHomeCache) {
                    isHomeCache.set(el, res);
                }
                return res;
            };

            var originalGetElementText = NavigationAdapter.getElementText;
            NavigationAdapter.getElementText = function(el) {
                if (!el) return '';
                if (elementTextCache) {
                    var cached = elementTextCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalGetElementText.call(this, el);
                if (elementTextCache) {
                    elementTextCache.set(el, res);
                }
                return res;
            };

            var originalGetDetailSemanticText = NavigationAdapter.getDetailSemanticText;
            NavigationAdapter.getDetailSemanticText = function(el) {
                if (!el) return '';
                if (detailSemanticTextCache) {
                    var cached = detailSemanticTextCache.get(el);
                    if (cached !== undefined) return cached;
                }
                var res = originalGetDetailSemanticText.call(this, el);
                if (detailSemanticTextCache) {
                    detailSemanticTextCache.set(el, res);
                }
                return res;
            };
        })();


    function handleColorKey(colorName) {
        if (!state.diagnosticsOpen) {
            state.activeTab = colorName;
            setDiagnosticsOpen(true);
        } else {
            if (state.activeTab === colorName) {
                setDiagnosticsOpen(false);
            } else {
                state.activeTab = colorName;
                refreshDiagnostics(true);
            }
        }
    }

    function handleKeyDown(event) {


        rectCache = new WeakMap();


        textCache = new WeakMap();


        isSidebarCache = new WeakMap();


        isSearchCache = new WeakMap();


        isFullscreenCache = new WeakMap();


        isProfileCache = new WeakMap();


        isSeeAllCache = new WeakMap();


        isInHeaderCache = new WeakMap();


        isHomeCache = new WeakMap();


        elementTextCache = new WeakMap();


        detailSemanticTextCache = new WeakMap();



        try {
        var key = event.key || event.code;
        state.lastKey = {
            key: key,
            code: event.code,
            keyCode: event.keyCode
        };

        var isVolumeKey = (key === "VolumeUp" || key === "VolumeDown" || key === "VolumeMute" ||
                           event.keyCode === 447 || event.keyCode === 448 || event.keyCode === 449);
        if (!isVolumeKey) {
            if (!state.keyEventsLog) state.keyEventsLog = [];
            state.keyEventsLog.push({
                key: key,
                code: event.code,
                keyCode: event.keyCode,
                target: event.target ? event.target.tagName + (event.target.id ? '#' + event.target.id : '') : 'unknown',
                time: new Date().toLocaleTimeString()
            });
            if (state.keyEventsLog.length > 50) state.keyEventsLog.shift();
        }

        if (key === "Back" || event.keyCode === 10009 || event.keyCode === 461) {
            if (state.mode === "iframe") {
                var iframe = document.getElementById("app-iframe");
                if (iframe) {
                    try {
                        var win = iframe.contentWindow;
                        var doc = iframe.contentDocument || (win && win.document);
                        if (win && doc) {
                            if (doc.activeElement && NavigationAdapter.isEditable(doc.activeElement)) {
                                doc.activeElement.blur();
                                NavigationAdapter.consume(event);
                                state.lastNavigation = "dismiss-editing";
                                return;
                            }
                            var currentHash = win.location.hash || "";
                            if (currentHash && currentHash !== "#" && currentHash !== "#/" && currentHash !== "#/board") {
                                var targetAction = null;
                                if (currentHash.indexOf("#/intro") === 0) {
                                    targetAction = "focus-profile";
                                } else if (currentHash.indexOf("#/detail/") === 0) {
                                    targetAction = "focus-first-card";
                                }

                                win.history.back();
                                NavigationAdapter.consume(event);
                                state.lastNavigation = "back-from-" + currentHash.split('?')[0];

                                if (targetAction) {
                                    var attempts = 0;
                                    var maxAttempts = 15;
                                    var checkAndFocus = function() {
                                        var d = NavigationAdapter.getIframeDoc();
                                        if (!d) return;
                                        var cands = NavigationAdapter.getFocusableElements(d);
                                        if (targetAction === "focus-profile") {
                                            var profile = NavigationAdapter.findProfileControl(cands);
                                            if (profile) {
                                                profile.focus();
                                                state.lastNavigation = "back-restore-profile";
                                                return;
                                            }
                                        } else if (targetAction === "focus-first-card") {
                                            var rows = NavigationAdapter.getRowMap(cands);
                                            if (rows.length > 0 && rows[0].length > 0) {
                                                rows[0][0].focus();
                                                state.lastNavigation = "back-restore-first-card";
                                                return;
                                            }
                                        }
                                        attempts++;
                                        if (attempts < maxAttempts) {
                                            setTimeout(checkAndFocus, 100);
                                        }
                                    };
                                    setTimeout(checkAndFocus, 150);
                                }
                                return;
                            }
                        }
                    } catch (e) {
                        // Ignore cross-origin errors
                    }
                }
            }
        }

        if (key === "Info" || event.keyCode === 457) {
            toggleDiagnostics();
            NavigationAdapter.consume(event);
            return;
        } else if (key === "ColorF0Red" || event.keyCode === 403) {
            handleColorKey("red");
            NavigationAdapter.consume(event);
            return;
        } else if (key === "ColorF1Green" || event.keyCode === 404) {
            handleColorKey("green");
            NavigationAdapter.consume(event);
            return;
        } else if (key === "ColorF2Yellow" || event.keyCode === 405) {
            handleColorKey("yellow");
            NavigationAdapter.consume(event);
            return;
        } else if (key === "ColorF3Blue" || event.keyCode === 406) {
            handleColorKey("blue");
            NavigationAdapter.consume(event);
            return;
        } else if (key === "1" || key === "Digit1" || event.keyCode === 49) {
            var docForEditing = NavigationAdapter.getIframeDoc();
            var isEditing = docForEditing && NavigationAdapter.isEditable(docForEditing.activeElement);
            if (!isEditing) {
                toggleDiagnostics();
                NavigationAdapter.consume(event);
                return;
            }
        }

        NavigationAdapter.handleKey(event);
      } finally {


            rectCache = null;


            textCache = null;


            isSidebarCache = null;


            isSearchCache = null;


            isFullscreenCache = null;


            isProfileCache = null;


            isSeeAllCache = null;


            isInHeaderCache = null;


            isHomeCache = null;


            elementTextCache = null;


            detailSemanticTextCache = null;
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
            NavigationAdapter.injectFocusStyle(doc);
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
