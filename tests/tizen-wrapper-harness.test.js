const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Helper to run main.js in a mocked sandbox
function createSandbox() {
    var keydownListeners = [];
    var loadListeners = [];
    var iframeLoadListeners = [];
    var mockIframeSrc = 'about:blank';
    var registeredKeys = {};
    var clearIntervalCalls = 0;
    var setIntervalCalls = 0;
    var mockIntervals = {};
    var activeIntervalId = null;
    var mockTimeouts = [];
    var mockTime = 1719597600000;

    var MockDate = function() {
        var args = Array.prototype.slice.call(arguments);
        if (!(this instanceof MockDate)) {
            return new Date(mockTime).toString();
        }
        if (args.length === 0) {
            return new Date(mockTime);
        }
        return new (Function.prototype.bind.apply(Date, [null].concat(args)));
    };
    MockDate.now = function() {
        return mockTime;
    };
    MockDate.UTC = Date.UTC;
    MockDate.parse = Date.parse;
    MockDate.prototype = Date.prototype;

    var iframeAccessCount = 0;
    var logRenderCount = 0;

    var iframeKeydownListeners = [];
    var mockIframeDoc = {
        addEventListener: function(evt, cb) {
            if (evt === 'keydown') iframeKeydownListeners.push(cb);
        },
        removeEventListener: function(evt, cb) {
            if (evt === 'keydown') {
                var idx = iframeKeydownListeners.indexOf(cb);
                if (idx !== -1) iframeKeydownListeners.splice(idx, 1);
            }
        },
        getElementsByTagName: function(tag) {
            return [];
        },
        querySelectorAll: function(sel) {
            return [];
        },
        activeElement: null
    };

    var mockContentDocument = mockIframeDoc;

    var elements = {
        'toggle-mode-btn': {
            textContent: '',
            addEventListener: function(evt, cb) {
                if (evt === 'click') this.onclick = cb;
            }
        },
        'launch-btn': {
            addEventListener: function(evt, cb) {
                if (evt === 'click') this.onclick = cb;
            }
        },
        'toggle-diag-btn': {
            addEventListener: function(evt, cb) {
                if (evt === 'click') this.onclick = cb;
            }
        },
        'app-iframe': {
            addEventListener: function(evt, cb) {
                if (evt === 'load') this.onload = cb;
            },
            set src(val) { mockIframeSrc = val; },
            get src() { return mockIframeSrc; },
            get contentDocument() {
                iframeAccessCount++;
                return mockContentDocument;
            },
            contentWindow: { document: mockIframeDoc }
        },
        'iframe-container': { style: { display: 'block' } },
        'loading-screen': {
            classList: {
                classes: ['hidden'],
                remove: function(cls) {
                    var idx = this.classes.indexOf(cls);
                    if (idx !== -1) this.classes.splice(idx, 1);
                },
                add: function(cls) {
                    if (this.classes.indexOf(cls) === -1) this.classes.push(cls);
                },
                contains: function(cls) {
                    return this.classes.indexOf(cls) !== -1;
                }
            }
        },
        'loading-status': { textContent: '' },
        'diagnostics-panel': {
            classList: {
                classes: ['hidden'],
                remove: function(cls) {
                    var idx = this.classes.indexOf(cls);
                    if (idx !== -1) this.classes.splice(idx, 1);
                },
                add: function(cls) {
                    if (this.classes.indexOf(cls) === -1) this.classes.push(cls);
                },
                contains: function(cls) {
                    return this.classes.indexOf(cls) !== -1;
                },
                toggle: function(cls) {
                    var idx = this.classes.indexOf(cls);
                    if (idx !== -1) {
                        this.classes.splice(idx, 1);
                    } else {
                        this.classes.push(cls);
                    }
                }
            }
        },
        'runtime-log': {
            _val: '',
            set textContent(val) {
                logRenderCount++;
                this._val = val;
            },
            get textContent() {
                return this._val;
            }
        }
    };

    var mockDocument = {
        readyState: 'complete',
        getElementById: function(id) {
            return elements[id] || null;
        },
        addEventListener: function(evt, cb) {
            if (evt === 'keydown') keydownListeners.push(cb);
            if (evt === 'DOMContentLoaded') loadListeners.push(cb);
        },
        getElementsByTagName: function(tag) {
            return [];
        },
        createElement: function(tag) {
            if (tag === 'video') {
                return {
                    canPlayType: function(mime) {
                        if (mime.indexOf('avc1') !== -1) return 'probably';
                        if (mime.indexOf('hvc1') !== -1) return 'maybe';
                        return 'no';
                    }
                };
            }
            return {};
        }
    };

    var mockLocalStorage = {
        store: {},
        getItem: function(key) { return this.store[key] || null; },
        setItem: function(key, val) { this.store[key] = String(val); }
    };

    var mockNavigator = {
        userAgent: 'Mozilla/5.0 (SmartTV; SmartTV/Tizen; ...)'
    };

    var mockWindow = {
        location: { href: 'http://localhost/index.html' },
        document: mockDocument,
        localStorage: mockLocalStorage,
        navigator: mockNavigator,
        setInterval: function(cb, delay) {
            setIntervalCalls++;
            activeIntervalId = setIntervalCalls;
            mockIntervals[activeIntervalId] = { cb: cb, delay: delay };
            return activeIntervalId;
        },
        clearInterval: function(id) {
            clearIntervalCalls++;
            if (id === activeIntervalId) {
                activeIntervalId = null;
            }
            delete mockIntervals[id];
        },
        setTimeout: function(cb, delay) {
            var timeoutObj = { cb: cb, delay: delay, active: true };
            mockTimeouts.push(timeoutObj);
            return timeoutObj;
        },
        clearTimeout: function(obj) {
            if (obj) {
                obj.active = false;
            }
        },
        MediaSource: {
            isTypeSupported: function(mime) {
                return mime.indexOf('avc1') !== -1 || mime.indexOf('hvc1') !== -1;
            }
        },
        tizen: {
            tvinputdevice: {
                registerKey: function(keyName) {
                    if (keyName === 'ColorF3Blue') {
                        throw new Error('Simulation of registration failure');
                    }
                    registeredKeys[keyName] = true;
                }
            }
        }
    };

    var context = {
        window: mockWindow,
        document: mockDocument,
        navigator: mockNavigator,
        localStorage: mockLocalStorage,
        setInterval: mockWindow.setInterval,
        clearInterval: mockWindow.clearInterval,
        setTimeout: mockWindow.setTimeout,
        clearTimeout: mockWindow.clearTimeout,
        MediaSource: mockWindow.MediaSource,
        tizen: mockWindow.tizen,
        Date: MockDate,
        String: String,
        Math: Math,
        JSON: JSON,
        console: console
    };

    context.globalThis = context;

    // Read main.js and evaluate
    const mainJsPath = path.join(__dirname, '../harness/CodexTvRuntimeCheck/js/main.js');
    const code = fs.readFileSync(mainJsPath, 'utf8');

    // Evaluate in context
    const script = new vm.Script(code);
    script.runInNewContext(context);

    return {
        context: context,
        elements: elements,
        keydownListeners: keydownListeners,
        loadListeners: loadListeners,
        registeredKeys: registeredKeys,
        getMockIframeSrc: function() { return mockIframeSrc; },
        mockIntervals: mockIntervals,
        getActiveIntervalId: function() { return activeIntervalId; },
        getIframeAccessCount: function() { return iframeAccessCount; },
        getLogRenderCount: function() { return logRenderCount; },
        flushTimeouts: function() {
            var pending = mockTimeouts.slice();
            mockTimeouts.length = 0;
            pending.forEach(function(timeout) {
                if (timeout.active !== false) {
                    timeout.cb();
                }
            });
        },
        setMockContentDocument: function(doc) { mockContentDocument = doc; },
        triggerKeydown: function(key, code, keyCode, isRepeat) {
            if (!isRepeat) {
                mockTime += 500;
            } else {
                mockTime += 10;
            }
            var event = {
                key: key,
                code: code,
                keyCode: keyCode,
                preventDefault: function() { this.defaultPrevented = true; }
            };
            keydownListeners.forEach(function(listener) {
                listener(event);
            });
            return event;
        },
        triggerIframeKeydown: function(key, code, keyCode, isRepeat) {
            if (!isRepeat) {
                mockTime += 500;
            } else {
                mockTime += 10;
            }
            var event = {
                key: key,
                code: code,
                keyCode: keyCode,
                preventDefault: function() { this.defaultPrevented = true; },
                stopPropagation: function() { this.propagationStopped = true; },
                stopImmediatePropagation: function() { this.immediatePropagationStopped = true; }
            };
            iframeKeydownListeners.forEach(function(listener) {
                listener(event);
            });
            return event;
        }
    };
}

// Write the test suite
console.log('Running standalone Stremio wrapper POC tests...');

// Test 1: Initialization and defaults
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    assert.ok(api, 'Public API should be exposed');
    assert.strictEqual(api.version, '1.1.0', 'Version should be 1.1.0');

    var state = api.getState();
    assert.strictEqual(state.mode, 'iframe', 'Default mode should be iframe');
    assert.strictEqual(sb.getMockIframeSrc(), 'https://web.stremio.com/', 'Iframe should load target Stremio URL');
    assert.strictEqual(state.diagnosticsOpen, false, 'Diagnostics should start closed');
    console.log('[PASS] Test 1: Initialization and defaults passed');
})();

// Test 2: Tizen key registration and failure simulation
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var state = api.getState();

    // COLORF3Blue was mocked to throw error
    assert.strictEqual(state.registrationResults['Info'], 'registered');
    assert.strictEqual(state.registrationResults['ColorF0Red'], 'registered');
    assert.strictEqual(state.registrationResults['ColorF3Blue'], 'failed: Simulation of registration failure');
    console.log('[PASS] Test 2: Tizen key registration passed');
})();

// Test 3: Key down behavior, toggles (Info, Color keys, 1, Digit1) and ordinary key constraints
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    // Check pre-state
    assert.strictEqual(api.getState().diagnosticsOpen, false);

    // Instrument before ordinary key event
    var initialIframeAccess = sb.getIframeAccessCount();
    var initialLogRender = sb.getLogRenderCount();

    // Keydown 'ArrowLeft' (ordinary key) should only update lastKey, not inspect or render
    sb.triggerKeydown('ArrowLeft', 'ArrowLeft', 37);

    // Verify no inspection or rendering took place on ordinary keydown immediately, before calling getState()
    assert.strictEqual(sb.getIframeAccessCount(), initialIframeAccess, 'Ordinary keydown must not trigger iframe inspection');
    assert.strictEqual(sb.getLogRenderCount(), initialLogRender, 'Ordinary keydown must not trigger diagnostics render');

    // Check state details
    assert.strictEqual(api.getState().diagnosticsOpen, false, 'ArrowLeft should not toggle diagnostics');

    var lastKey1 = api.getState().lastKey;
    assert.strictEqual(lastKey1.key, 'ArrowLeft');
    assert.strictEqual(lastKey1.code, 'ArrowLeft');
    assert.strictEqual(lastKey1.keyCode, 37);

    // 1. Info key -> toggle open, start interval timer
    sb.triggerKeydown('Info', 'Info', 457);
    assert.strictEqual(api.getState().diagnosticsOpen, true, 'Info should open diagnostics');
    assert.ok(sb.getActiveIntervalId(), '1-second inspection timer should start');

    // 2. ColorF0Red key -> switches active tab to red (remains open)
    sb.triggerKeydown('ColorF0Red', 'ColorF0Red', 403);
    assert.strictEqual(api.getState().diagnosticsOpen, true, 'ColorF0Red should switch tab and remain open');
    assert.strictEqual(api.getState().activeTab, 'red', 'Active tab should switch to red');

    // Pressing ColorF0Red again (since it is the active tab) closes diagnostics
    sb.triggerKeydown('ColorF0Red', 'ColorF0Red', 403);
    assert.strictEqual(api.getState().diagnosticsOpen, false, 'ColorF0Red second press should close diagnostics');
    assert.strictEqual(sb.getActiveIntervalId(), null, '1-second inspection timer should stop when closed');

    // 3. '1' key -> toggle open, start interval timer
    sb.triggerKeydown('1', 'Digit1', 49);
    assert.strictEqual(api.getState().diagnosticsOpen, true, '1 should open diagnostics');
    assert.ok(sb.getActiveIntervalId(), '1-second inspection timer should start');

    // 4. Digit1 code key -> toggle closed, stop interval timer
    sb.triggerKeydown('1', 'Digit1', 49);
    assert.strictEqual(api.getState().diagnosticsOpen, false, 'Digit1 should close diagnostics');
    assert.strictEqual(sb.getActiveIntervalId(), null, '1-second inspection timer should stop when closed');

    console.log('[PASS] Test 3: Key down behavior and triggers passed');
})();

// Test 4: URL Redaction and detailed video state inspection
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    // Set wrapper URL with credentials/query/fragment to test redaction
    sb.context.window.location.href = 'https://admin:secret@localhost/index.html?debug=true#diagnostics';

    // Mock same-origin iframe contentDocument access with video sources containing sensitive credentials/queries
    var mockVideo = {
        error: {
            code: 3,
            message: 'Pipeline playback error'
        },
        networkState: 2,
        readyState: 3,
        src: 'https://usr:pwd@web.stremio.com/path/to/video.mp4?auth=secret&other=1#fragment-id',
        currentSrc: 'https://web.stremio.com/path/to/video.mp4?auth=secret#fragment'
    };

    sb.setMockContentDocument({
        getElementsByTagName: function(tag) {
            if (tag === 'video') return [mockVideo];
            return [];
        }
    });

    var state = api.getState();
    assert.ok(state.sameOrigin.available, 'Same origin access should be active');
    assert.strictEqual(state.sameOrigin.videoCount, 1);

    var fv = state.sameOrigin.firstVideo;
    assert.strictEqual(fv.error.code, 3);
    assert.strictEqual(fv.error.message, 'Pipeline playback error');
    assert.strictEqual(fv.networkState, 2);
    assert.strictEqual(fv.readyState, 3);
    assert.strictEqual(fv.src, 'https://[redacted]@web.stremio.com/path/to/video.mp4', 'Src credentials and queries should be redacted');
    assert.strictEqual(fv.currentSrc, 'https://web.stremio.com/path/to/video.mp4', 'CurrentSrc queries should be redacted');
    assert.strictEqual(state.wrapperUrl, 'https://[redacted]@localhost/index.html', 'Wrapper URL credentials and queries should be redacted');
    console.log('[PASS] Test 4: URL Redaction passed');
})();

// Test 5: Cross-origin failure handling (SecurityError)
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    // Force contentDocument read to throw cross-origin SecurityError
    Object.defineProperty(sb.elements['app-iframe'], 'contentDocument', {
        get: function() {
            throw new Error('SecurityError: Blocked frame from accessing cross-origin frame');
        }
    });

    var state = api.getState();
    assert.strictEqual(state.sameOrigin.available, false, 'Same origin should be unavailable');
    assert.strictEqual(state.sameOrigin.status, 'unavailable (cross-origin SecurityError)');
    assert.ok(state.sameOrigin.error.indexOf('SecurityError') !== -1, 'Should record SecurityError');
    console.log('[PASS] Test 5: Cross-origin failure handling passed');
})();

// Test 6: AVC/HEVC codec check
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var state = api.getState();

    assert.strictEqual(state.mediaSupport.canPlayType.avc_baseline, 'probably');
    assert.strictEqual(state.mediaSupport.canPlayType.hevc, 'maybe');
    assert.strictEqual(state.mediaSupport.isTypeSupported.avc_high, 'yes');
    assert.strictEqual(state.mediaSupport.isTypeSupported.hevc, 'yes');
    console.log('[PASS] Test 6: AVC/HEVC codec check passed');
})();

// Test 7: Throttle logic
(function() {
    var sb = createSandbox();

    // Check that the interval timer is registered with a 1000ms delay when diagnostics is opened
    sb.triggerKeydown('Info', 'Info', 457);
    var activeIntervalId = sb.getActiveIntervalId();
    assert.ok(activeIntervalId, 'Interval should be active');

    var intervalObj = sb.mockIntervals[activeIntervalId];
    assert.strictEqual(intervalObj.delay, 1000, 'Interval should run once per second (1000ms)');

    console.log('[PASS] Test 7: Throttle logic passed');
})();

// Test 8: Iframe key listener attachment and key forwarding
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    // Simulate iframe load completing successfully
    var iframe = sb.elements['app-iframe'];
    assert.ok(iframe.onload, 'Iframe onload handler should be registered');

    // Check initial status
    var stateBefore = api.getState();
    assert.strictEqual(stateBefore.iframeListenerStatus, 'unattached');

    // Trigger load to attach listener
    iframe.onload();

    // Verify status is attached
    var stateAfter = api.getState();
    assert.strictEqual(stateAfter.iframeListenerStatus, 'attached');
    assert.strictEqual(stateAfter.diagnosticsOpen, false);

    // Instrument count check
    var initialIframeAccess = sb.getIframeAccessCount();
    var initialLogRender = sb.getLogRenderCount();

    // 1. Ordinary key (e.g. KeyA) inside the iframe should update lastKey, but NOT inspect DOM or render
    sb.triggerIframeKeydown('a', 'KeyA', 65);
    assert.strictEqual(sb.getIframeAccessCount(), initialIframeAccess, 'Ordinary iframe keydown must not trigger iframe inspection');
    assert.strictEqual(sb.getLogRenderCount(), initialLogRender, 'Ordinary iframe keydown must not trigger diagnostics render');

    var stateKey = api.getState();
    assert.strictEqual(stateKey.diagnosticsOpen, false, 'Ordinary iframe key must not toggle diagnostics');
    assert.strictEqual(stateKey.lastKey.key, 'a');

    // 2. Info key inside the iframe should toggle diagnostics to open and start interval timer
    sb.triggerIframeKeydown('Info', 'Info', 457);
    assert.strictEqual(api.getState().diagnosticsOpen, true, 'Info iframe key must toggle diagnostics open');
    assert.ok(sb.getActiveIntervalId(), '1-second timer must start when diagnostics are opened via iframe');

    // 3. ColorF0Red key inside the iframe should switch tab to red, then second press closes diagnostics
    sb.triggerIframeKeydown('ColorF0Red', 'ColorF0Red', 403);
    assert.strictEqual(api.getState().diagnosticsOpen, true, 'ColorF0Red first press switches tab and remains open');
    sb.triggerIframeKeydown('ColorF0Red', 'ColorF0Red', 403);
    assert.strictEqual(api.getState().diagnosticsOpen, false, 'ColorF0Red second press closes diagnostics');
    assert.strictEqual(sb.getActiveIntervalId(), null, '1-second timer must stop when diagnostics are closed via iframe');

    // 4. '1' key inside the iframe should toggle diagnostics open
    sb.triggerIframeKeydown('1', 'Digit1', 49);
    assert.strictEqual(api.getState().diagnosticsOpen, true, '1 iframe key must toggle diagnostics open');
    assert.ok(sb.getActiveIntervalId(), '1-second timer must start when diagnostics are opened via iframe (key 1)');

    // 5. Digit1 code key inside the iframe should toggle diagnostics closed
    sb.triggerIframeKeydown('1', 'Digit1', 49);
    assert.strictEqual(api.getState().diagnosticsOpen, false, 'Digit1 iframe key must toggle diagnostics closed');
    assert.strictEqual(sb.getActiveIntervalId(), null, '1-second timer must stop when diagnostics are closed via iframe (key Digit1)');

    // 6. Test listener attachment failure is nonfatal
    var sbFailed = createSandbox();
    var apiFailed = sbFailed.context.window.__STREMIO_WEB_WRAPPER_POC__;

    // Force contentDocument getter to throw SecurityError
    Object.defineProperty(sbFailed.elements['app-iframe'], 'contentDocument', {
        get: function() {
            throw new Error('SecurityError: Permission denied to access cross-origin frame');
        }
    });

    // Trigger onload
    var iframeFailed = sbFailed.elements['app-iframe'];
    assert.doesNotThrow(function() {
        iframeFailed.onload();
    }, 'Listener attachment failure must be nonfatal');

    var stateFailed = apiFailed.getState();
    assert.ok(stateFailed.iframeListenerStatus.indexOf('failed') !== -1, 'Status should capture failure details');

    console.log('[PASS] Test 8: Iframe key listener attachment and key forwarding passed');
})();

// Test 9: Standalone Navigation Adapter
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var iframe = sb.elements['app-iframe'];
    iframe.onload();
    var doc = iframe.contentWindow.document;
    iframe.contentWindow.location = { hash: '#/discover' };

    function makeElement(tagName, text, attrs, rect) {
        attrs = attrs || {};
        return {
            tagName: tagName,
            innerText: text || '',
            textContent: text || '',
            className: attrs.className || '',
            disabled: false,
            parentElement: attrs.parentElement || null,
            getAttribute: function(name) {
                if (name === 'class') return this.className;
                return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
            },
            getBoundingClientRect: function() { return rect; },
            focus: function() { this.focused = true; this.focusCount = (this.focusCount || 0) + 1; },
            click: function() { this.clicked = true; this.clickCount = (this.clickCount || 0) + 1; }
        };
    }

    var sidebarDuplicate = makeElement('A', 'Discover', { href: '#/discover' },
        { left: 10, top: 100, width: 100, height: 50 });
    var sidebarSelected = makeElement('A', 'Discover', { href: '#/discover', 'aria-current': 'page' },
        { left: 10, top: 160, width: 100, height: 50 });
    var sidebarNext = makeElement('A', 'Library', { href: '#/library' },
        { left: 10, top: 220, width: 100, height: 50 });
    var firstCard = makeElement('A', 'Toy Story 4', {
        href: '#/detail/movie/tt1979376/tt1979376', 'aria-selected': 'true'
    }, { left: 200, top: 100, width: 150, height: 150 });
    var secondCard = makeElement('A', 'Second card', {
        href: '#/detail/movie/tt0000002/tt0000002'
    }, { left: 380, top: 100, width: 150, height: 150 });
    var thirdCard = makeElement('A', 'Third card', {
        href: '#/detail/movie/tt0000003/tt0000003'
    }, { left: 200, top: 280, width: 150, height: 150 });
    var fourthCard = makeElement('A', 'Fourth card', {
        href: '#/detail/movie/tt0000004/tt0000004'
    }, { left: 380, top: 280, width: 150, height: 150 });
    var candidates = [sidebarDuplicate, sidebarSelected, sidebarNext,
        firstCard, secondCard, thirdCard, fourthCard];
    doc.querySelectorAll = function() {
        return candidates;
    };

    // First-column Left is consumed and focuses the selected current-route sidebar after deferral.
    doc.activeElement = firstCard;
    var leftEvent = sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.strictEqual(sidebarSelected.focusCount, undefined, 'Sidebar focus must be deferred');
    assert.ok(leftEvent.defaultPrevented && leftEvent.propagationStopped && leftEvent.immediatePropagationStopped,
        'Handled Left must be fully consumed');
    sb.flushTimeouts();
    assert.strictEqual(sidebarSelected.focusCount, 1, 'Current selected Discover duplicate should receive focus');
    assert.strictEqual(api.getState().lastNavigation, 'discover-first-column-to-current-sidebar');

    // Left within a card row moves spatially without jumping to the sidebar.
    doc.activeElement = secondCard;
    var secondLeftEvent = sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(secondLeftEvent.defaultPrevented, 'Card Left should be handled');
    assert.strictEqual(firstCard.focusCount, 1, 'Card Left should focus the previous card');
    assert.strictEqual(sidebarSelected.focusCount, 1, 'Non-first-column Left must not focus sidebar');

    // BODY/missing focus resolves through the visible selected content card.
    doc.activeElement = null;
    var bodyLeftEvent = sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(bodyLeftEvent.defaultPrevented, 'Selected first-column card should bridge when BODY owns focus');
    sb.flushTimeouts();
    assert.strictEqual(sidebarSelected.focusCount, 2);

    doc.activeElement = null;
    var firstCardFocusBeforeBodyDown = firstCard.focusCount;
    var bodyDownEvent = sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.strictEqual(bodyDownEvent.defaultPrevented, undefined, 'BODY ArrowDown must remain native');
    assert.strictEqual(firstCard.focusCount, firstCardFocusBeforeBodyDown,
        'BODY ArrowDown must not force selected-card focus');

    // An unmatched route falls back to the visible selected/current sidebar, never an arbitrary item.
    iframe.contentWindow.location.hash = '#/detail/movie/tt1979376';
    doc.activeElement = firstCard;
    sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    sb.flushTimeouts();
    assert.strictEqual(sidebarSelected.focusCount, 3, 'Unmatched route should use selected sidebar fallback');
    assert.strictEqual(sidebarDuplicate.focusCount, undefined, 'Unmatched route must not use arbitrary first sidebar');
    iframe.contentWindow.location.hash = '#/discover';

    // Packaged-app sidebar directions are supplied by the adapter.
    doc.activeElement = sidebarSelected;
    var sidebarDown = sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(sidebarDown.defaultPrevented, 'Sidebar Down must be handled');
    assert.strictEqual(sidebarNext.focusCount, 1, 'Sidebar Down should focus the next item');
    doc.activeElement = sidebarNext;
    var sidebarUp = sb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(sidebarUp.defaultPrevented, 'Sidebar Up must be handled');
    assert.strictEqual(sidebarSelected.focusCount, 4, 'Sidebar Up should focus the previous item');
    doc.activeElement = sidebarSelected;
    var sidebarRight = sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(sidebarRight.defaultPrevented, 'Sidebar Right must be handled');
    assert.strictEqual(firstCard.focusCount, 2, 'Sidebar Right should prefer selected content card');

    // Content-card directions use visible 2x2 geometry.
    doc.activeElement = firstCard;
    var cardRight = sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(cardRight.defaultPrevented, 'Card Right must be handled');
    assert.strictEqual(secondCard.focusCount, 1, 'Card Right should focus same-row next card');
    doc.activeElement = secondCard;
    var cardLeft = sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(cardLeft.defaultPrevented, 'Card Left must be handled');
    assert.strictEqual(firstCard.focusCount, 3, 'Card Left should focus same-row previous card');
    doc.activeElement = firstCard;
    var cardDown = sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(cardDown.defaultPrevented, 'Card Down must be handled');
    assert.strictEqual(thirdCard.focusCount, 1, 'Card Down should focus next-row same-column card');
    doc.activeElement = thirdCard;
    var cardUp = sb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(cardUp.defaultPrevented, 'Card Up must be handled');
    assert.strictEqual(firstCard.focusCount, 4, 'Card Up should focus previous-row same-column card');

    doc.activeElement = firstCard;
    var noTargetUp = sb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.strictEqual(noTargetUp.defaultPrevented, undefined, 'Missing card target must pass through');
    assert.strictEqual(firstCard.focusCount, 4, 'Missing target must not force focus');

    // Anonymous tabindex=-1 toggle and its menu login action are focusable/activatable.
    var mockHeader = { tagName: 'HEADER', getAttribute: function() { return null; } };
    var profileToggle = makeElement('DIV', '', {
        tabindex: '-1',
        parentElement: mockHeader
    }, { left: 900, top: 20, width: 60, height: 40 });
    var loginAction = makeElement('DIV', 'Log in / Sign up', { tabindex: '0' },
        { left: 780, top: 80, width: 180, height: 50 });
    profileToggle.focus = function() {
        this.focused = true;
        this.focusCount = (this.focusCount || 0) + 1;
        doc.activeElement = this;
    };
    loginAction.focus = function() {
        this.focused = true;
        this.focusCount = (this.focusCount || 0) + 1;
        doc.activeElement = this;
    };
    candidates = [profileToggle];
    doc.activeElement = profileToggle;
    sb.triggerIframeKeydown('Enter', 'Enter', 13);
    candidates = [profileToggle, loginAction];
    assert.strictEqual(api.getState().navigationAdapter.candidateCount, 2,
        'Profile toggle and login menu action should be included after the menu opens');
    doc.activeElement = doc.body;
    loginAction.focusCount = 0;
    sb.flushTimeouts();
    assert.strictEqual(profileToggle.clickCount, 1, 'Profile toggle should activate with Enter');
    assert.strictEqual(loginAction.focusCount, 0, 'Anonymous login should not require popup focus');
    assert.strictEqual(loginAction.clickCount, 1, 'Profile Enter should activate Log in / Sign up automatically');
    assert.strictEqual(api.getState().lastNavigation, 'profile-login-direct', 'Direct login activation should be recorded');

    // Intro uses semantic form order and meaningful cross-column actions.
    iframe.contentWindow.location.hash = '#/intro';
    var email = makeElement('INPUT', '', { name: 'email', type: 'email', placeholder: 'Email' },
        { left: 150, top: 100, width: 300, height: 45 });
    var password = makeElement('INPUT', '', { name: 'password', type: 'password', placeholder: 'Password' },
        { left: 150, top: 170, width: 300, height: 45 });
    var confirmPassword = makeElement('INPUT', '', {
        name: 'confirmPassword', type: 'password', placeholder: 'Confirm password'
    }, { left: 150, top: 240, width: 300, height: 45 });
    var accountAction = makeElement('DIV', 'Continue with Google', { tabindex: '0' },
        { left: 600, top: 170, width: 260, height: 50 });
    var terms = makeElement('A', 'Terms of Service', { href: '#/terms' },
        { left: 500, top: 105, width: 160, height: 30 });
    var consent = makeElement('INPUT', '', { type: 'checkbox', name: 'consent' },
        { left: 500, top: 145, width: 25, height: 25 });
    candidates = [email, password, confirmPassword, accountAction, terms, consent];

    doc.activeElement = null;
    var introBodyDown = sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(introBodyDown.defaultPrevented, 'Intro BODY ArrowDown should use Email as logical start');
    assert.strictEqual(password.focusCount, 1, 'Intro BODY ArrowDown should focus Password');
    doc.activeElement = null;
    var introBodyRight = sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(introBodyRight.defaultPrevented, 'Intro BODY ArrowRight should be consumed');
    assert.strictEqual(accountAction.focusCount, 1, 'Intro BODY ArrowRight should focus account action');
    email.focusCount = 0;
    password.focusCount = 0;
    confirmPassword.focusCount = 0;
    accountAction.focusCount = 0;

    doc.activeElement = email;
    sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.strictEqual(password.focusCount, 1, 'Email Down should focus Password');
    doc.activeElement = password;
    sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.strictEqual(confirmPassword.focusCount, 1, 'Password Down should focus Confirm password');
    doc.activeElement = confirmPassword;
    sb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.strictEqual(password.focusCount, 2, 'Confirm password Up should focus Password');
    doc.activeElement = password;
    sb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.strictEqual(email.focusCount, 1, 'Password Up should focus Email');

    doc.activeElement = password;
    sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.strictEqual(accountAction.focusCount, 1, 'Cross-column Right should choose account action');
    assert.strictEqual(terms.focusCount, undefined, 'Legal links must not win ordinary cross-column movement');
    assert.strictEqual(consent.focusCount, undefined, 'Consent must not win ordinary cross-column movement');
    doc.activeElement = accountAction;
    sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.strictEqual(password.focusCount, 3, 'Cross-column Left should return to nearest semantic field');

    // Empty selector fallback remains safe.
    candidates = [];
    doc.activeElement = null;
    var state = api.getState();
    assert.strictEqual(state.navigationAdapter.candidateCount, 0, 'Candidate count should be 0');
    sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);

    Object.defineProperty(sb.elements['app-iframe'], 'contentDocument', {
        get: function() {
            throw new Error('SecurityError: Permission denied to access cross-origin frame');
        },
        configurable: true
    });

    var stateCO = api.getState();
    assert.strictEqual(stateCO.navigationAdapter.status, 'no-document-access', 'Cross-origin should report no-document-access status');

    console.log('[PASS] Test 9: Standalone Navigation Adapter passed');
})();

// Test 10: Back Key Navigation
(function() {
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    // Simulate iframe load completing
    var iframe = sb.elements['app-iframe'];
    iframe.onload();

    var backCalled = 0;
    var preventDefaultCalled = 0;

    // Setup mock contentWindow and contentDocument
    var mockWin = {
        location: { hash: '#/intro' },
        history: {
            back: function() { backCalled++; }
        },
        document: {}
    };

    sb.context.window.document.getElementById('app-iframe').contentWindow = mockWin;
    sb.setMockContentDocument(mockWin.document);
    var mockHeader = {
        tagName: 'HEADER',
        parentElement: null,
        getAttribute: function() { return null; }
    };
    var profileAfterBack = {
        tagName: 'DIV',
        innerText: '',
        textContent: '',
        className: '',
        parentElement: mockHeader,
        getAttribute: function(name) {
            if (name === 'tabindex') return '-1';
            return null;
        },
        getBoundingClientRect: function() {
            return { left: 800, top: 20, width: 60, height: 40 };
        },
        focusCount: 0,
        focus: function() {
            this.focusCount++;
            mockWin.document.activeElement = this;
        }
    };
    mockWin.document.querySelectorAll = function() {
        return [profileAfterBack];
    };
    mockWin.document.body = { tagName: 'BODY' };
    mockWin.document.activeElement = mockWin.document.body;

    // Trigger keydown on document for Back key (keyCode 10009)
    var event = {
        key: 'Back',
        code: 'XF86Back',
        keyCode: 10009,
        preventDefault: function() { preventDefaultCalled++; }
    };

    sb.keydownListeners.forEach(function(listener) {
        listener(event);
    });

    assert.strictEqual(backCalled, 1, 'Should call history.back() from intro');
    assert.strictEqual(preventDefaultCalled, 1, 'Should prevent default event behavior');
    assert.strictEqual(api.getState().lastNavigation, 'back-from-#/intro', 'Back should record navigation');
    sb.flushTimeouts();
    assert.strictEqual(profileAfterBack.focusCount, 1, 'Back from intro should restore profile focus');
    assert.strictEqual(api.getState().lastNavigation, 'back-restore-profile', 'Back restore should be recorded');

    // Reset checks and change hash to root home page
    backCalled = 0;
    preventDefaultCalled = 0;
    mockWin.location.hash = '#/';

    sb.keydownListeners.forEach(function(listener) {
        listener(event);
    });

    assert.strictEqual(backCalled, 0, 'Should NOT call history.back() for home view');
    assert.strictEqual(preventDefaultCalled, 0, 'Should NOT prevent default event behavior for home view');

    // Detail routes restore the first visible card after history back.
    var firstCardAfterBack = {
        tagName: 'A',
        innerText: 'Movie Card',
        textContent: 'Movie Card',
        className: '',
        getAttribute: function(name) {
            if (name === 'href') return '#/detail/movie/tt123';
            return null;
        },
        getBoundingClientRect: function() {
            return { left: 200, top: 120, width: 160, height: 200 };
        },
        focusCount: 0,
        focus: function() {
            this.focusCount++;
            mockWin.document.activeElement = this;
        }
    };
    mockWin.location.hash = '#/detail/movie/tt123';
    mockWin.document.activeElement = mockWin.document.body;
    mockWin.document.querySelectorAll = function() {
        return [firstCardAfterBack];
    };
    sb.keydownListeners.forEach(function(listener) {
        listener(event);
    });
    assert.strictEqual(backCalled, 1, 'Should call history.back() from detail route');
    assert.strictEqual(preventDefaultCalled, 1, 'Should prevent default event behavior for detail route');
    assert.strictEqual(api.getState().lastNavigation, 'back-from-#/detail/movie/tt123', 'Back should record detail navigation');
    sb.flushTimeouts();
    assert.strictEqual(firstCardAfterBack.focusCount, 1, 'Back from detail should restore first-card focus');
    assert.strictEqual(api.getState().lastNavigation, 'back-restore-first-card', 'Detail back restore should be recorded');

    console.log('[PASS] Test 10: Back Key Navigation passed');
})();

// Test 11: Cold-start focus bootstrap, BODY fallbacks, and style injection
(function() {
    console.log('Running Test 11: Cold-start focus bootstrap and visible selection...');
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    var doc = sb.context.document.getElementById('app-iframe').contentDocument;

    // Helper to make test elements
    function makeElement(targetDoc, tagName, text, attrs, rect) {
        attrs = attrs || {};
        return {
            tagName: tagName,
            innerText: text || '',
            textContent: text || '',
            className: attrs.className || '',
            disabled: false,
            parentElement: attrs.parentElement || null,
            focused: false,
            focusCount: 0,
            clicked: false,
            clickCount: 0,
            blurCount: 0,
            getAttribute: function(name) {
                if (name === 'class') return this.className;
                return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
            },
            getBoundingClientRect: function() { return rect; },
            focus: function() {
                this.focused = true;
                this.focusCount++;
                if (targetDoc) targetDoc.activeElement = this;
            },
            blur: function() {
                this.focused = false;
                this.blurCount++;
                if (targetDoc && targetDoc.activeElement === this) targetDoc.activeElement = null;
            },
            click: function() {
                this.clicked = true;
                this.clickCount++;
            }
        };
    }

    var sidebarBoard = makeElement(doc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    var sidebarDiscover = makeElement(doc, 'A', 'Discover', { href: '#/discover' }, { left: 10, top: 160, width: 100, height: 50 });
    var contentCard = makeElement(doc, 'A', 'Movie Card', { href: '#/detail/movie/tt1' }, { left: 200, top: 100, width: 150, height: 150 });

    var candidates = [sidebarBoard, sidebarDiscover, contentCard];
    var injectedStyles = [];

    doc.querySelectorAll = function(sel) {
        return candidates;
    };
    doc.head = {
        appendChild: function(el) {
            if (el.id) injectedStyles.push(el.id);
        }
    };
    var injectedStyleElements = [];
    doc.getElementById = function(id) {
        if (id === 'codex-tv-focus-style') {
            for (var i = 0; i < injectedStyleElements.length; i++) {
                if (injectedStyleElements[i].id === id) return injectedStyleElements[i];
            }
            return null;
        }
        return null;
    };
    doc.createElement = function(tag) {
        if (tag === 'style') {
            var styleEl = { id: '', textContent: '' };
            injectedStyleElements.push(styleEl);
            return styleEl;
        }
        return { id: '' };
    };

    sb.context.document.getElementById('app-iframe').contentWindow = {
        document: doc,
        location: { hash: '#/' }
    };

    // Trigger iframe onload
    var iframe = sb.elements['app-iframe'];
    iframe.onload();

    // Verify bootstrap is scheduled
    var state = api.getState();
    assert.strictEqual(state.navigationAdapter.bootstrap.active, true, 'Bootstrap timer should be active after load');
    assert.strictEqual(state.navigationAdapter.bootstrap.retryCount, 0, 'Bootstrap retryCount should start at 0');

    // Flush timeout to execute first attempt
    // Selected route is '#/' and selected sidebar element should be sidebarBoard
    sidebarBoard.className = 'selected';
    doc.activeElement = doc; // set activeElement to something other than BODY to check non-BODY behavior

    sb.flushTimeouts();
    assert.strictEqual(sidebarBoard.focusCount, 0, 'Bootstrap should not steal focus if already focused on non-BODY element');

    // Reset activeElement to null (representing BODY/null focus)
    doc.activeElement = null;

    // Trigger onload again to restart bootstrap
    iframe.onload();
    sb.flushTimeouts();

    // Now sidebarBoard should be focused because doc.activeElement was null (BODY)
    assert.strictEqual(sidebarBoard.focusCount, 1, 'Bootstrap should focus the selected sidebar element (Board)');

    // Assert focus-style details
    assert.strictEqual(injectedStyleElements.length, 1, 'Exactly one focus style element should be created');
    var styleEl = injectedStyleElements[0];
    assert.strictEqual(styleEl.id, 'codex-tv-focus-style', 'Style ID must be codex-tv-focus-style');
    assert.ok(styleEl.textContent.indexOf('outline') !== -1, 'Style text content must contain outline');
    assert.ok(styleEl.textContent.indexOf('box-shadow') !== -1, 'Style text content must contain box-shadow');
    assert.ok(styleEl.textContent.indexOf('focus-within') !== -1, 'Style text content must contain focus-within');

    // Assert repeated iframe load/injection is idempotent (one style append)
    iframe.onload();
    assert.strictEqual(injectedStyleElements.length, 1, 'Style element must remain unique on repeated iframe load (idempotent)');

    // Test retry behavior
    var retrySb = createSandbox();
    var retryApi = retrySb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var retryDoc = retrySb.context.document.getElementById('app-iframe').contentDocument;

    retryDoc.querySelectorAll = function() { return []; }; // No candidates initially
    retrySb.context.document.getElementById('app-iframe').contentWindow = {
        document: retryDoc,
        location: { hash: '#/' }
    };

    // Load
    retrySb.elements['app-iframe'].onload();
    // 1st flush -> no candidates, should reschedule and increment retry count
    retrySb.flushTimeouts();
    var retryState = retryApi.getState();
    assert.strictEqual(retryState.navigationAdapter.bootstrap.retryCount, 1, 'Retry count should increment after empty candidates');
    assert.strictEqual(retryState.navigationAdapter.bootstrap.active, true, 'Bootstrap should still be active');

    // Populate candidates
    var freshBoard = makeElement(retryDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    freshBoard.className = 'selected';
    retryDoc.querySelectorAll = function() { return [freshBoard]; };

    // 2nd flush -> should succeed
    retrySb.flushTimeouts();
    assert.strictEqual(freshBoard.focusCount, 1, 'Should focus target on retry success');
    assert.strictEqual(retryApi.getState().navigationAdapter.bootstrap.active, false, 'Bootstrap should stop after success');

    // Test retry cap
    var capSb = createSandbox();
    var capDoc = capSb.context.document.getElementById('app-iframe').contentDocument;
    capDoc.querySelectorAll = function() { return []; };
    capSb.context.document.getElementById('app-iframe').contentWindow = {
        document: capDoc,
        location: { hash: '#/' }
    };
    capSb.elements['app-iframe'].onload();
    for (var i = 0; i < 20; i++) {
        capSb.flushTimeouts();
    }
    var capState = capSb.context.window.__STREMIO_WEB_WRAPPER_POC__.getState();
    assert.strictEqual(capState.navigationAdapter.bootstrap.active, false, 'Bootstrap should deactivate after cap is reached');

    // Test #/intro bootstrap skip
    var introSb = createSandbox();
    var introApi = introSb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var introDoc = introSb.context.document.getElementById('app-iframe').contentDocument;

    var emailInput = makeElement(introDoc, 'INPUT', 'email', { name: 'email', type: 'email' }, { left: 10, top: 100, width: 100, height: 50 });
    introDoc.querySelectorAll = function() { return [emailInput]; };

    introSb.context.document.getElementById('app-iframe').contentWindow = {
        document: introDoc,
        location: { hash: '#/intro' }
    };

    // Simulating Stremio's existing focus on E-mail input:
    introDoc.activeElement = emailInput;
    emailInput.focusCount = 0;

    // Trigger onload
    introSb.elements['app-iframe'].onload();
    introSb.flushTimeouts();

    assert.strictEqual(emailInput.focusCount, 0, 'Bootstrap must not steal existing focus on #/intro route');

    // Case 2: activeElement is BODY/null on #/intro:
    introDoc.activeElement = null;
    introSb.elements['app-iframe'].onload();
    introSb.flushTimeouts();

    assert.strictEqual(introDoc.activeElement, null, 'No wrapper bootstrap focus should occur on #/intro route');
    assert.strictEqual(introApi.getState().navigationAdapter.bootstrap.active, false, 'Bootstrap should not be active on #/intro');

    // Test early-key-before-render
    var earlySb = createSandbox();
    var earlyApi = earlySb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var earlyDoc = earlySb.context.document.getElementById('app-iframe').contentDocument;

    earlyDoc.querySelectorAll = function() { return []; }; // empty/no candidates
    earlySb.context.document.getElementById('app-iframe').contentWindow = {
        document: earlyDoc,
        location: { hash: '#/' }
    };

    earlySb.elements['app-iframe'].onload();

    // Send a directional key event on BODY
    earlyDoc.activeElement = null;
    var earlyEvent = earlySb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.strictEqual(earlyEvent.defaultPrevented, undefined, 'Key should pass through when candidates not rendered yet');
    assert.strictEqual(earlyApi.getState().navigationAdapter.bootstrap.active, true, 'Bootstrap remains active/bounded');

    // Now candidates render
    var earlyBoard = makeElement(earlyDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    earlyBoard.className = 'selected';
    earlyDoc.querySelectorAll = function() { return [earlyBoard]; };

    // Next scheduled bootstrap attempt focuses the control
    earlySb.flushTimeouts();
    assert.strictEqual(earlyBoard.focusCount, 1, 'Next scheduled attempt focuses selected control');
    assert.strictEqual(earlyApi.getState().navigationAdapter.bootstrap.active, false, 'Bootstrap timer should be cancelled on success');

    // Test cancellation/replacement on adapter destroy and iframe reload
    var cancelSb = createSandbox();
    var cancelApi = cancelSb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var cancelDoc = cancelSb.context.document.getElementById('app-iframe').contentDocument;

    var cancelBoard = makeElement(cancelDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    cancelBoard.className = 'selected';
    cancelDoc.querySelectorAll = function() { return [cancelBoard]; };
    cancelSb.context.document.getElementById('app-iframe').contentWindow = {
        document: cancelDoc,
        location: { hash: '#/' }
    };

    // 1. Destroy cancellation
    cancelSb.elements['app-iframe'].onload();
    cancelSb.context.window.__STREMIO_WEB_WRAPPER_POC__.getState(); // Ensure adapter loaded
    cancelDoc.activeElement = null;
    cancelSb.elements['launch-btn'].onclick();

    cancelSb.flushTimeouts();
    assert.strictEqual(cancelBoard.focusCount, 0, 'Destroyed adapter should not run scheduled bootstrap');

    // 2. Reload cancellation/replacement
    var reloadSb = createSandbox();
    var reloadApi = reloadSb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var reloadDoc = reloadSb.context.document.getElementById('app-iframe').contentDocument;

    var reloadBoard = makeElement(reloadDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    reloadBoard.className = 'selected';
    reloadDoc.querySelectorAll = function() { return [reloadBoard]; };
    reloadSb.context.document.getElementById('app-iframe').contentWindow = {
        document: reloadDoc,
        location: { hash: '#/' }
    };

    reloadSb.elements['app-iframe'].onload();
    reloadSb.elements['launch-btn'].onclick();
    reloadDoc.activeElement = null;

    reloadSb.flushTimeouts();
    assert.strictEqual(reloadBoard.focusCount, 0, 'Pending bootstrap must be cancelled/replaced');

    // Test BODY directional fallbacks
    var dirSb = createSandbox();
    var dirDoc = dirSb.context.document.getElementById('app-iframe').contentDocument;

    var sidebarBoardDir = makeElement(dirDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    var sidebarDiscoverDir = makeElement(dirDoc, 'A', 'Discover', { href: '#/discover' }, { left: 10, top: 160, width: 100, height: 50 });
    var contentCardDir = makeElement(dirDoc, 'A', 'Movie Card', { href: '#/detail/movie/tt1' }, { left: 200, top: 100, width: 150, height: 150 });

    dirDoc.querySelectorAll = function() {
        return [sidebarBoardDir, sidebarDiscoverDir, contentCardDir];
    };
    dirSb.context.document.getElementById('app-iframe').contentWindow = {
        document: dirDoc,
        location: { hash: '#/' }
    };
    dirSb.elements['app-iframe'].onload();
    dirSb.flushTimeouts();

    sidebarBoardDir.className = 'selected';
    sidebarBoardDir.focusCount = 0;
    sidebarDiscoverDir.focusCount = 0;
    contentCardDir.focusCount = 0;
    dirDoc.activeElement = null;

    // 1. Cold-start BODY ArrowDown
    var eventDown = dirSb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(eventDown.defaultPrevented, 'BODY ArrowDown should be handled');
    assert.strictEqual(sidebarDiscoverDir.focusCount, 1, 'ArrowDown should move Board -> Discover');

    // Reset select Discover
    dirDoc.activeElement = null;
    dirSb.context.document.getElementById('app-iframe').contentWindow.location.hash = '#/discover';
    sidebarBoardDir.className = '';
    sidebarDiscoverDir.className = 'selected';
    sidebarDiscoverDir.focusCount = 0;
    sidebarBoardDir.focusCount = 0;

    // 2. Cold-start BODY ArrowUp
    var eventUp = dirSb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(eventUp.defaultPrevented, 'BODY ArrowUp should be handled');
    assert.strictEqual(sidebarBoardDir.focusCount, 1, 'ArrowUp should move Discover -> Board');

    // Reset select Board
    dirDoc.activeElement = null;
    dirSb.context.document.getElementById('app-iframe').contentWindow.location.hash = '#/';
    sidebarBoardDir.className = 'selected';
    sidebarDiscoverDir.className = '';
    sidebarBoardDir.focusCount = 0;
    contentCardDir.focusCount = 0;

    // 3. Cold-start BODY ArrowRight: Board -> nearest content card
    var eventRight = dirSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(eventRight.defaultPrevented, 'BODY ArrowRight should be handled');
    assert.strictEqual(contentCardDir.focusCount, 1, 'ArrowRight should move Board -> content card');

    // 4. Cold-start selected first-card Left -> current sidebar still works
    dirDoc.activeElement = null;
    sidebarBoardDir.className = 'selected';
    contentCardDir.className = 'selected';
    sidebarBoardDir.focusCount = 0;
    var eventLeft = dirSb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(eventLeft.defaultPrevented, 'BODY ArrowLeft on card should be handled');
    dirSb.flushTimeouts();
    assert.strictEqual(sidebarBoardDir.focusCount, 1, 'ArrowLeft on card should move to Board');

    // 5. BODY Enter focuses safely without activating; focused Enter activates
    dirDoc.activeElement = null;
    contentCardDir.className = 'selected';
    contentCardDir.focusCount = 0;
    contentCardDir.clickCount = 0;

    var eventEnter1 = dirSb.triggerIframeKeydown('Enter', 'Enter', 13);
    assert.ok(eventEnter1.defaultPrevented, 'First Enter on BODY should focus');
    assert.strictEqual(contentCardDir.focusCount, 1, 'First Enter focuses');
    assert.strictEqual(contentCardDir.clickCount, 0, 'First Enter does not click');

    dirDoc.activeElement = contentCardDir;
    var eventEnter2 = dirSb.triggerIframeKeydown('Enter', 'Enter', 13);
    assert.ok(eventEnter2.defaultPrevented, 'Second Enter clicks');
    assert.strictEqual(contentCardDir.clickCount, 1, 'Second Enter clicks');

    // Test See All trap row-end navigation
    var seeAllSb = createSandbox();
    var seeAllApi = seeAllSb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var seeAllDoc = seeAllSb.context.document.getElementById('app-iframe').contentDocument;

    // Row 1 content card and See All link
    var cardRow1 = makeElement(seeAllDoc, 'A', 'Movie 1', { href: '#/detail/movie/1' }, { left: 1705, top: 139, width: 200, height: 339 });
    var seeAllRow1 = makeElement(seeAllDoc, 'A', 'See All', {
        href: '#/discover/row1',
        parentElement: { className: 'navigation-container', parentElement: null }
    }, { left: 1790, top: 98, width: 100, height: 38 });

    // Row 2 content card and See All link
    var cardRow2 = makeElement(seeAllDoc, 'A', 'Movie 2', { href: '#/detail/movie/2' }, { left: 1705, top: 549, width: 200, height: 339 });
    var seeAllRow2 = makeElement(seeAllDoc, 'A', 'See All', {
        href: '#/discover/row2',
        parentElement: { className: 'navigation-container', parentElement: null }
    }, { left: 1790, top: 508, width: 100, height: 38 });

    seeAllDoc.querySelectorAll = function() {
        return [cardRow1, seeAllRow1, cardRow2, seeAllRow2];
    };
    seeAllSb.context.document.getElementById('app-iframe').contentWindow = {
        document: seeAllDoc,
        location: { hash: '#/' }
    };
    seeAllSb.elements['app-iframe'].onload();
    seeAllSb.flushTimeouts(); // clear bootstrap

    // Set active element to cardRow1 (has DOM focus)
    seeAllDoc.activeElement = cardRow1;
    cardRow1.focusCount = 0;
    seeAllRow1.focusCount = 0;

    // 1. last card Right -> same-row See All
    var evRight1 = seeAllSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evRight1.defaultPrevented, 'ArrowRight on cardRow1 should be handled');
    assert.strictEqual(seeAllRow1.focusCount, 1, 'Right on last card should focus same-row See All');

    // 2. See All Left -> last card
    seeAllDoc.activeElement = seeAllRow1;
    cardRow1.focusCount = 0;
    seeAllRow1.focusCount = 0;
    var evLeft1 = seeAllSb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(evLeft1.defaultPrevented, 'ArrowLeft on See All should be handled');
    assert.strictEqual(cardRow1.focusCount, 1, 'Left on See All should focus same-row card');

    // 3. first-row See All Down -> second-row first card
    seeAllDoc.activeElement = seeAllRow1;
    cardRow2.focusCount = 0;
    var evDown1 = seeAllSb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(evDown1.defaultPrevented, 'ArrowDown on See All should be handled');
    assert.strictEqual(cardRow2.focusCount, 1, 'Down on See All should focus second-row first card');

    // 4. second-row Up -> first-row first card
    seeAllDoc.activeElement = seeAllRow2;
    cardRow1.focusCount = 0;
    var evUp1 = seeAllSb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(evUp1.defaultPrevented, 'ArrowUp on See All should be handled');
    assert.strictEqual(cardRow1.focusCount, 1, 'Up on See All should focus first-row first card');

    // 5. no-target Right passes through
    seeAllDoc.activeElement = seeAllRow2;
    var evRight2 = seeAllSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.strictEqual(evRight2.defaultPrevented, undefined, 'Right with no target should pass through');

    // 6. Enter clicks
    seeAllDoc.activeElement = seeAllRow1;
    seeAllRow1.clickCount = 0;
    var evEnter = seeAllSb.triggerIframeKeydown('Enter', 'Enter', 13);
    assert.ok(evEnter.defaultPrevented, 'Enter on See All should be handled');
    assert.strictEqual(seeAllRow1.clickCount, 1, 'Enter should click See All');

    // Header graph tests
    console.log('Running Test 11 - Header Graph Tests...');
    var graphSb = createSandbox();
    var graphDoc = graphSb.context.document.getElementById('app-iframe').contentDocument;
    var graphApi = graphSb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    var mockHeader = { tagName: 'HEADER', getAttribute: function() { return null; } };
    var searchEl = makeElement(graphDoc, 'INPUT', 'search', { id: 'search-input', type: 'search', parentElement: mockHeader }, { left: 100, top: 20, width: 200, height: 40 });
    var fsEl = makeElement(graphDoc, 'BUTTON', 'Fullscreen', { id: 'fullscreen', parentElement: mockHeader }, { left: 400, top: 20, width: 80, height: 40 });
    var profileEl = makeElement(graphDoc, 'DIV', 'Profile', { id: 'profile', parentElement: mockHeader }, { left: 800, top: 20, width: 60, height: 40 });
    var boardEl = makeElement(graphDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    var cardEl = makeElement(graphDoc, 'A', 'Movie Card', { href: '#/detail/movie/tt1' }, { left: 200, top: 150, width: 150, height: 150 });

    graphDoc.querySelectorAll = function() {
        return [searchEl, fsEl, profileEl, boardEl, cardEl];
    };
    graphSb.context.document.getElementById('app-iframe').contentWindow = {
        document: graphDoc,
        location: { hash: '#/' }
    };
    graphSb.elements['app-iframe'].onload();
    graphSb.flushTimeouts();

    // 1. Board Up -> Search
    graphDoc.activeElement = boardEl;
    searchEl.focusCount = 0;
    var evUp = graphSb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(evUp.defaultPrevented, 'Board Up to Search should be handled');
    assert.strictEqual(searchEl.focusCount, 1, 'Focus should move to Search');

    // 2. Search Left -> Home
    graphDoc.activeElement = searchEl;
    boardEl.focusCount = 0;
    var evLeft = graphSb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(evLeft.defaultPrevented, 'Search Left should be handled');
    assert.strictEqual(boardEl.focusCount, 1, 'Focus should move to Board');

    // 3. Search Right -> Fullscreen
    graphDoc.activeElement = searchEl;
    fsEl.focusCount = 0;
    var evRight = graphSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evRight.defaultPrevented, 'Search Right should be handled');
    assert.strictEqual(fsEl.focusCount, 1, 'Focus should move to Fullscreen');

    // 4. Search Up -> stops (remains on Search)
    graphDoc.activeElement = searchEl;
    searchEl.focusCount = 0;
    var evUpSearch = graphSb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(evUpSearch.defaultPrevented, 'Search Up should stop and consume');
    assert.strictEqual(searchEl.focusCount, 0, 'Focus should remain on Search');

    // 5. Search Down -> first card
    graphDoc.activeElement = searchEl;
    cardEl.focusCount = 0;
    var evDownSearch = graphSb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(evDownSearch.defaultPrevented, 'Search Down should be handled');
    assert.strictEqual(cardEl.focusCount, 1, 'Focus should move to first content card');

    // 6. Search Enter activates native search (not consumed)
    graphDoc.activeElement = searchEl;
    var evEnterSearch = graphSb.triggerIframeKeydown('Enter', 'Enter', 13);
    assert.strictEqual(evEnterSearch.defaultPrevented, undefined, 'Search Enter must pass through natively');

    // 7. Fullscreen Left -> Search
    graphDoc.activeElement = fsEl;
    searchEl.focusCount = 0;
    var evFsLeft = graphSb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(evFsLeft.defaultPrevented, 'FS Left to Search should be handled');
    assert.strictEqual(searchEl.focusCount, 1, 'Focus should move to Search');

    // 8. Fullscreen Right -> Profile
    graphDoc.activeElement = fsEl;
    profileEl.focusCount = 0;
    var evFsRight = graphSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evFsRight.defaultPrevented, 'FS Right to Profile should be handled');
    assert.strictEqual(profileEl.focusCount, 1, 'Focus should move to Profile');

    // 9. Fullscreen Up stops
    graphDoc.activeElement = fsEl;
    fsEl.focusCount = 0;
    var evFsUp = graphSb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(evFsUp.defaultPrevented, 'FS Up should stop');
    assert.strictEqual(fsEl.focusCount, 0);

    // 10. Fullscreen Down -> card
    graphDoc.activeElement = fsEl;
    cardEl.focusCount = 0;
    var evFsDown = graphSb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(evFsDown.defaultPrevented, 'FS Down should focus first card');
    assert.strictEqual(cardEl.focusCount, 1);

    // 11. Profile Left -> Fullscreen
    graphDoc.activeElement = profileEl;
    fsEl.focusCount = 0;
    var evProfLeft = graphSb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(evProfLeft.defaultPrevented, 'Profile Left should focus FS');
    assert.strictEqual(fsEl.focusCount, 1);

    // 12. Profile Right stops
    graphDoc.activeElement = profileEl;
    profileEl.focusCount = 0;
    var evProfRight = graphSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evProfRight.defaultPrevented, 'Profile Right should stop');
    assert.strictEqual(profileEl.focusCount, 0);

    // 13. Profile Down -> card
    graphDoc.activeElement = profileEl;
    cardEl.focusCount = 0;
    var evProfDown = graphSb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(evProfDown.defaultPrevented, 'Profile Down should focus card');
    assert.strictEqual(cardEl.focusCount, 1);

    // Row tests
    console.log('Running Test 11 - Row Tests...');
    var rowSb = createSandbox();
    var rowDoc = rowSb.context.document.getElementById('app-iframe').contentDocument;

    var mockHeader = { tagName: 'HEADER', getAttribute: function() { return null; } };
    var rowSearchEl = makeElement(rowDoc, 'INPUT', 'search', { id: 'search-input', type: 'search', parentElement: mockHeader }, { left: 100, top: 20, width: 200, height: 40 });
    var rowBoardEl = makeElement(rowDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });

    // Row 1
    var cardR1C1 = makeElement(rowDoc, 'A', 'Movie 1', { href: '#/detail/movie/r1c1' }, { left: 200, top: 100, width: 150, height: 150 });
    var cardR1C2 = makeElement(rowDoc, 'A', 'Movie 2', { href: '#/detail/movie/r1c2' }, { left: 380, top: 100, width: 150, height: 150 });
    var seeAllR1 = makeElement(rowDoc, 'A', 'See All', { href: '#/discover/r1' }, { left: 560, top: 100, width: 80, height: 40 });

    // Row 2
    var cardR2C1 = makeElement(rowDoc, 'A', 'Movie 3', { href: '#/detail/movie/r2c1' }, { left: 200, top: 280, width: 150, height: 150 });
    var cardR2C2 = makeElement(rowDoc, 'A', 'Movie 4', { href: '#/detail/movie/r2c2' }, { left: 380, top: 280, width: 150, height: 150 });
    var seeAllR2 = makeElement(rowDoc, 'A', 'See All', { href: '#/discover/r2' }, { left: 560, top: 280, width: 80, height: 40 });

    rowDoc.querySelectorAll = function() {
        return [rowSearchEl, rowBoardEl, cardR1C1, cardR1C2, seeAllR1, cardR2C1, cardR2C2, seeAllR2];
    };
    rowSb.context.document.getElementById('app-iframe').contentWindow = {
        document: rowDoc,
        location: { hash: '#/' }
    };
    rowSb.elements['app-iframe'].onload();
    rowSb.flushTimeouts();

    // 1. first-row card Up -> Search
    rowDoc.activeElement = cardR1C2;
    rowSearchEl.focusCount = 0;
    var evRowUp = rowSb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(evRowUp.defaultPrevented, 'First row card Up should focus search');
    assert.strictEqual(rowSearchEl.focusCount, 1);

    // 2. first-card Left -> Home
    rowDoc.activeElement = cardR1C1;
    rowBoardEl.focusCount = 0;
    var evRowLeft = rowSb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(evRowLeft.defaultPrevented, 'First card Left should focus Board/Home');
    rowSb.flushTimeouts();
    assert.strictEqual(rowBoardEl.focusCount, 1);

    // 3. card -> See All -> next-row traversal
    rowDoc.activeElement = cardR1C2;
    seeAllR1.focusCount = 0;
    var evCardRight = rowSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evCardRight.defaultPrevented, 'Last card Right should focus See All');
    assert.strictEqual(seeAllR1.focusCount, 1);

    rowDoc.activeElement = seeAllR1;
    cardR2C1.focusCount = 0;
    var evSeeAllRight = rowSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evSeeAllRight.defaultPrevented, 'See All Right should focus first card of next row');
    assert.strictEqual(cardR2C1.focusCount, 1);

    // 4. See All Left -> that row's last card
    rowDoc.activeElement = seeAllR1;
    cardR1C2.focusCount = 0;
    var evSeeAllLeft = rowSb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(evSeeAllLeft.defaultPrevented, 'See All Left should focus same-row last card');
    assert.strictEqual(cardR1C2.focusCount, 1);

    // 5. topmost See All Up -> Search
    rowDoc.activeElement = seeAllR1;
    rowSearchEl.focusCount = 0;
    var evSeeAllUp1 = rowSb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(evSeeAllUp1.defaultPrevented, 'Topmost See All Up should focus Search');
    assert.strictEqual(rowSearchEl.focusCount, 1);

    // 6. other See All Up/Down -> adjacent row first card
    rowDoc.activeElement = seeAllR2;
    cardR1C1.focusCount = 0;
    var evSeeAllUp2 = rowSb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(evSeeAllUp2.defaultPrevented, 'Row 2 See All Up should focus Row 1 first card');
    assert.strictEqual(cardR1C1.focusCount, 1);

    rowDoc.activeElement = seeAllR1;
    cardR2C1.focusCount = 0;
    var evSeeAllDown = rowSb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(evSeeAllDown.defaultPrevented, 'Row 1 See All Down should focus Row 2 first card');
    assert.strictEqual(cardR2C1.focusCount, 1);

    // Detail page tests
    console.log('Running Test 11 - Detail page tests...');
    var detailSb = createSandbox();
    var detailDoc = detailSb.context.document.getElementById('app-iframe').contentDocument;
    var detailApi = detailSb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    var detailPlayBtn = makeElement(detailDoc, 'BUTTON', 'Play', {}, { left: 100, top: 200, width: 150, height: 50 });
    var detailSource1 = makeElement(detailDoc, 'A', '1080p Torrent', {}, { left: 600, top: 200, width: 300, height: 50 });
    var detailSource2 = makeElement(detailDoc, 'A', '720p stream', {}, { left: 600, top: 270, width: 300, height: 50 });

    detailDoc.querySelectorAll = function() {
        return [detailPlayBtn, detailSource1, detailSource2];
    };
    detailSb.context.document.getElementById('app-iframe').contentWindow = {
        document: detailDoc,
        location: { hash: '#/detail/movie/tt12345' }
    };
    detailSb.elements['app-iframe'].onload();
    detailDoc.activeElement = null;
    detailSb.flushTimeouts();

    // Verify detail bootstrap focuses the top item in the right-hand source list (detailSource1)
    assert.strictEqual(detailSource1.focusCount, 1, 'Detail bootstrap should focus the topmost stream source filter');
    assert.strictEqual(detailPlayBtn.focusCount, 0, 'Detail bootstrap must not focus the Play button');

    // Editable / Back / Repeat tests
    console.log('Running Test 11 - Editable, Back and Repeat tests...');
    var editSb = createSandbox();
    var editDoc = editSb.context.document.getElementById('app-iframe').contentDocument;
    var editApi = editSb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    var mockHeader = { tagName: 'HEADER', getAttribute: function() { return null; } };
    var editSearchEl = makeElement(editDoc, 'INPUT', 'search text', { id: 'search-input', type: 'search', parentElement: mockHeader }, { left: 100, top: 20, width: 200, height: 40 });
    var editBoardEl = makeElement(editDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    var editFsEl = makeElement(editDoc, 'BUTTON', 'Fullscreen', { parentElement: mockHeader }, { left: 400, top: 20, width: 80, height: 40 });

    editDoc.querySelectorAll = function() {
        return [editSearchEl, editBoardEl, editFsEl];
    };
    editSb.context.document.getElementById('app-iframe').contentWindow = {
        document: editDoc,
        location: { hash: '#/discover' },
        history: {
            backCount: 0,
            back: function() { this.backCount++; }
        }
    };
    editSb.elements['app-iframe'].onload();
    editSb.flushTimeouts();

    // 1. Directional keys always perform TV navigation even when focused in Search input
    editDoc.activeElement = editSearchEl;
    editFsEl.focusCount = 0;
    var evRightEdit = editSb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evRightEdit.defaultPrevented, 'ArrowRight on search input should perform TV navigation');
    assert.strictEqual(editFsEl.focusCount, 1, 'ArrowRight on search input focuses Fullscreen');

    // 2. Digit1 typing versus global toggle
    editDoc.activeElement = editSearchEl;
    assert.strictEqual(editApi.getState().diagnosticsOpen, false);
    var evOneEdit = editSb.triggerIframeKeydown('1', 'Digit1', 49);
    assert.strictEqual(evOneEdit.defaultPrevented, undefined, 'Digit1 key must pass through for typing when editing');
    assert.strictEqual(editApi.getState().diagnosticsOpen, false, 'Digit1 must not toggle diagnostics when editing');

    // 3. Back dismissing editing before history navigation
    editDoc.activeElement = editSearchEl;
    editSearchEl.blurCount = 0;
    var evBackEdit = editSb.triggerKeydown('Back', 'Back', 10009);
    assert.ok(evBackEdit.defaultPrevented, 'Back key should be consumed when dismissing editing');
    assert.strictEqual(editSearchEl.blurCount, 1, 'Back key blurs the active input element');
    assert.strictEqual(editSb.context.document.getElementById('app-iframe').contentWindow.history.backCount, 0, 'Back key does not trigger route back when editing');

    // Next press performs normal history back
    editDoc.activeElement = editBoardEl;
    var evBackHistory = editSb.triggerKeydown('Back', 'Back', 10009);
    assert.ok(evBackHistory.defaultPrevented);
    assert.strictEqual(editSb.context.document.getElementById('app-iframe').contentWindow.history.backCount, 1, 'Next Back key navigates history');

    // System-key tests
    console.log('Running Test 11 - System-key tests...');
    var sysSb = createSandbox();
    var sysDoc = sysSb.context.document.getElementById('app-iframe').contentDocument;
    var sysApi = sysSb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    var sysBoardEl = makeElement(sysDoc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    var sysDiscoverEl = makeElement(sysDoc, 'A', 'Discover', { href: '#/discover' }, { left: 10, top: 160, width: 100, height: 50 });

    sysDoc.querySelectorAll = function() { return [sysBoardEl, sysDiscoverEl]; };
    sysSb.context.document.getElementById('app-iframe').contentWindow = {
        document: sysDoc,
        location: { hash: '#/' }
    };
    sysSb.elements['app-iframe'].onload();
    sysSb.flushTimeouts();

    // 1. Controlled repeat
    sysDoc.activeElement = sysBoardEl;
    sysDiscoverEl.focusCount = 0;
    var evRepeat1 = sysSb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(evRepeat1.defaultPrevented);
    assert.strictEqual(sysDiscoverEl.focusCount, 1);

    // Immediate repeat key event (e.g. 50ms later) should be ignored
    var evRepeat2 = sysSb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40, true);
    assert.ok(evRepeat2.defaultPrevented, 'Repeat event should still be consumed');
    assert.strictEqual(sysDiscoverEl.focusCount, 1, 'Repeat event must not trigger a second move / focus');

    // 2. Volume/mute keys do not end up in keyEventsLog
    var logLenBefore = sysApi.getState().keyEventsLog ? sysApi.getState().keyEventsLog.length : 0;
    sysSb.triggerKeydown('VolumeUp', 'VolumeUp', 447);
    sysSb.triggerKeydown('VolumeDown', 'VolumeDown', 448);
    sysSb.triggerKeydown('VolumeMute', 'VolumeMute', 449);
    var logLenAfter = sysApi.getState().keyEventsLog ? sysApi.getState().keyEventsLog.length : 0;
    assert.strictEqual(logLenAfter, logLenBefore, 'Volume/mute keys must not be pushed into keyEventsLog');

    // 3. Transport keys passed through without navigation
    var evPlay = sysSb.triggerIframeKeydown('Play', 'MediaPlay', 250);
    assert.strictEqual(evPlay.defaultPrevented, undefined, 'Play transport key should pass through natively');

    console.log('[PASS] Test 11: Cold-start focus bootstrap and BODY fallbacks passed');
})();

// Test 12: Non-root Route Card Left preference for Home/Board
(function() {
    console.log('Running Test 12: Non-root Route Card Left preference for Home/Board...');
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var iframe = sb.elements['app-iframe'];
    iframe.onload();
    var doc = iframe.contentWindow.document;
    iframe.contentWindow.location = { hash: '#/discover' };

    function makeElement(tagName, text, attrs, rect) {
        attrs = attrs || {};
        return {
            tagName: tagName,
            innerText: text || '',
            textContent: text || '',
            className: attrs.className || '',
            disabled: false,
            parentElement: attrs.parentElement || null,
            getAttribute: function(name) {
                if (name === 'class') return this.className;
                return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
            },
            getBoundingClientRect: function() { return rect; },
            focus: function() { this.focused = true; this.focusCount = (this.focusCount || 0) + 1; },
            click: function() { this.clicked = true; this.clickCount = (this.clickCount || 0) + 1; }
        };
    }

    var sidebarBoard = makeElement('A', 'Board', { href: '#/' },
        { left: 10, top: 100, width: 100, height: 50 });
    var sidebarDiscover = makeElement('A', 'Discover', { href: '#/discover', 'aria-current': 'page' },
        { left: 10, top: 160, width: 100, height: 50 });
    var firstCard = makeElement('A', 'Movie Card', {
        href: '#/detail/movie/tt123', 'aria-selected': 'true'
    }, { left: 200, top: 100, width: 150, height: 150 });

    var candidates = [sidebarBoard, sidebarDiscover, firstCard];
    doc.querySelectorAll = function() {
        return candidates;
    };

    doc.activeElement = firstCard;
    var leftEvent = sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(leftEvent.defaultPrevented);
    sb.flushTimeouts();
    assert.strictEqual(sidebarBoard.focusCount, 1, 'First-card Left on non-root route must focus Home/Board rather than current Discover');
    assert.strictEqual(sidebarDiscover.focusCount, undefined, 'First-card Left must not focus Discover when Home/Board is present');
    console.log('[PASS] Test 12: Non-root Route Card Left preference passed');
})();

// Test 13: Detail route focus transition test
(function() {
    console.log('Running Test 13: Detail route focus transition...');
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var iframe = sb.elements['app-iframe'];
    iframe.onload();
    var doc = iframe.contentWindow.document;

    function makeElement(tagName, text, attrs, rect) {
        attrs = attrs || {};
        return {
            tagName: tagName,
            innerText: text || '',
            textContent: text || '',
            className: attrs.className || '',
            disabled: false,
            parentElement: attrs.parentElement || null,
            focusCount: 0,
            clickCount: 0,
            getAttribute: function(name) {
                if (name === 'class') return this.className;
                return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
            },
            getBoundingClientRect: function() { return rect; },
            focus: function() {
                this.focusCount++;
                doc.activeElement = this;
            },
            click: function() {
                this.clickCount++;
            }
        };
    }

    var card = makeElement('A', 'Movie Card', { href: '#/detail/movie/tt123' }, { left: 200, top: 100, width: 150, height: 150 });
    doc.querySelectorAll = function() { return [card]; };
    doc.activeElement = card;

    // Press Enter to activate card
    var enterEvent = sb.triggerIframeKeydown('Enter', 'Enter', 13);
    assert.ok(enterEvent.defaultPrevented, 'Enter on card should be handled');

    // Now simulate loading detail page: update hash and queryAll candidates
    iframe.contentWindow.location = { hash: '#/detail/movie/tt123' };
    var detailPlayBtn = makeElement('BUTTON', 'Play', {}, { left: 100, top: 200, width: 150, height: 50 });
    var detailSource = makeElement('A', '1080p stream', {}, { left: 600, top: 200, width: 300, height: 50 });

    doc.querySelectorAll = function() { return [detailPlayBtn, detailSource]; };
    doc.activeElement = null; // simulate page rendering/loading with null focus

    // Flush timeouts to run the detail focus retry attempts
    sb.flushTimeouts();

    assert.strictEqual(detailSource.focusCount, 1, 'Detail source filter should be focused after card activation transition');
    assert.strictEqual(doc.activeElement, detailSource, 'Active element should be set to detail source');
    console.log('[PASS] Test 13: Detail route focus transition passed');
})();

// Test 14: Exit key pass-through test
(function() {
    console.log('Running Test 14: Exit key pass-through...');
    var sb = createSandbox();

    var event = sb.triggerKeydown('Exit', 'Exit', 10182);
    assert.strictEqual(event.defaultPrevented, undefined, 'Exit key event must not be prevented');

    var iframeEvent = sb.triggerIframeKeydown('Exit', 'Exit', 10182);
    assert.strictEqual(iframeEvent.defaultPrevented, undefined, 'Exit key event inside iframe must not be prevented');
    console.log('[PASS] Test 14: Exit key pass-through passed');
})();

// Test 15: Search Boundary Selector and Marking Regression
(function() {
    console.log('Running Test 15: Search Boundary Selector and Marking Regression...');
    var sb = createSandbox();
    var doc = sb.context.document.getElementById('app-iframe').contentDocument;
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;

    // Shared horizontal NAV boundary
    var mockNav = {
        tagName: 'NAV',
        getAttribute: function(name) { return null; },
        parentElement: null
    };

    // Sibling containers under NAV
    var searchContainer = {
        tagName: 'DIV',
        innerText: 'Search or paste link',
        textContent: 'Search or paste link',
        getAttribute: function(name) { return this[name] || null; },
        setAttribute: function(name, val) { this[name] = val; },
        parentElement: mockNav
    };

    var fsContainer = {
        tagName: 'DIV',
        innerText: '',
        textContent: '',
        getAttribute: function(name) { return this[name] || null; },
        setAttribute: function(name, val) { this[name] = val; },
        parentElement: mockNav
    };

    var profileContainer = {
        tagName: 'DIV',
        innerText: '',
        textContent: '',
        getAttribute: function(name) { return this[name] || null; },
        setAttribute: function(name, val) { this[name] = val; },
        parentElement: mockNav
    };

    // Helper to make test elements
    function makeElement(targetDoc, tagName, text, attrs, rect) {
        attrs = attrs || {};
        return {
            tagName: tagName,
            innerText: text || '',
            textContent: text || '',
            className: attrs.className || '',
            disabled: false,
            parentElement: attrs.parentElement || null,
            focused: false,
            focusCount: 0,
            clicked: false,
            clickCount: 0,
            blurCount: 0,
            getAttribute: function(name) {
                if (name === 'class') return this.className;
                return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
            },
            setAttribute: function(name, val) {
                this[name] = val;
            },
            getBoundingClientRect: function() { return rect; },
            focus: function() {
                this.focused = true;
                this.focusCount++;
                if (targetDoc) targetDoc.activeElement = this;
            },
            blur: function() {
                this.focused = false;
                this.blurCount++;
                if (targetDoc && targetDoc.activeElement === this) targetDoc.activeElement = null;
            },
            click: function() {
                this.clicked = true;
                this.clickCount++;
            }
        };
    }

    // Sibling targets
    var searchTarget = makeElement(doc, 'DIV', '', { tabindex: '0', parentElement: searchContainer }, { left: 100, top: 20, width: 200, height: 40 });
    var fsTarget = makeElement(doc, 'DIV', '', { tabindex: '-1', title: 'Enter fullscreen mode', parentElement: fsContainer }, { left: 400, top: 20, width: 80, height: 40 });
    var profileTarget = makeElement(doc, 'DIV', '', { tabindex: '-1', parentElement: profileContainer }, { left: 800, top: 20, width: 60, height: 40 });

    var boardEl = makeElement(doc, 'A', 'Board', { href: '#/' }, { left: 10, top: 100, width: 100, height: 50 });
    var cardEl = makeElement(doc, 'A', 'Movie Card', { href: '#/detail/movie/tt1' }, { left: 200, top: 150, width: 150, height: 150 });

    var candidates = [searchTarget, fsTarget, profileTarget, boardEl, cardEl];
    doc.querySelectorAll = function() {
        return candidates;
    };
    sb.context.document.getElementById('app-iframe').contentWindow = {
        document: doc,
        location: { hash: '#/' }
    };

    // Trigger iframe onload to clear bootstrap
    sb.elements['app-iframe'].onload();
    sb.flushTimeouts();

    // Assert Board Up -> Search
    doc.activeElement = boardEl;
    searchTarget.focusCount = 0;
    var evUp = sb.triggerIframeKeydown('ArrowUp', 'ArrowUp', 38);
    assert.ok(evUp.defaultPrevented, 'Board Up to Search should be handled');
    assert.strictEqual(searchTarget.focusCount, 1, 'Board Up should focus Search');
    assert.strictEqual(api.getState().lastNavigation, 'home-to-search', 'lastNavigation should be home-to-search');

    // Assert Search Right -> Fullscreen
    doc.activeElement = searchTarget;
    fsTarget.focusCount = 0;
    var evRight1 = sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evRight1.defaultPrevented, 'Search Right to Fullscreen should be handled');
    assert.strictEqual(fsTarget.focusCount, 1, 'Search Right should focus Fullscreen');
    assert.strictEqual(api.getState().lastNavigation, 'search-to-fullscreen', 'lastNavigation should be search-to-fullscreen');

    // Assert Fullscreen Right -> Profile (proves Fullscreen is not classified as Search)
    doc.activeElement = fsTarget;
    profileTarget.focusCount = 0;
    var evRight2 = sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(evRight2.defaultPrevented, 'Fullscreen Right to Profile should be handled');
    assert.strictEqual(profileTarget.focusCount, 1, 'Fullscreen Right should focus Profile');
    assert.strictEqual(api.getState().lastNavigation, 'fullscreen-to-profile', 'lastNavigation should be fullscreen-to-profile');

    // Assert Profile Left -> Fullscreen (proves Profile is not classified as Search)
    doc.activeElement = profileTarget;
    fsTarget.focusCount = 0;
    var evLeft1 = sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(evLeft1.defaultPrevented, 'Profile Left should be handled');
    assert.strictEqual(fsTarget.focusCount, 1, 'Profile Left should focus Fullscreen');
    assert.strictEqual(api.getState().lastNavigation, 'profile-to-fullscreen', 'lastNavigation should be profile-to-fullscreen');

    // Verify marking of the semantic below-boundary Search container with data-search-container
    assert.strictEqual(searchContainer['data-search-container'], 'true', 'Direct descendant container should be marked after load');

    // Clear and manually trigger marking
    delete searchContainer['data-search-container'];
    assert.strictEqual(searchContainer['data-search-container'], undefined, 'Cleared');
    sb.elements['app-iframe'].onload();
    assert.strictEqual(searchContainer['data-search-container'], 'true', 'Direct descendant container should be marked');
    assert.strictEqual(fsContainer['data-search-container'], undefined, 'Fullscreen container should NOT be marked');
    assert.strictEqual(profileContainer['data-search-container'], undefined, 'Profile container should NOT be marked');

    console.log('[PASS] Test 15: Search Boundary Selector and Marking Regression passed');
})();

// Test 16: Detail source-group fallback regression
(function() {
    console.log('Running Test 16: Detail source-group fallback regression...');

    function createDetailFixture() {
        var sb = createSandbox();
        var iframe = sb.elements['app-iframe'];
        var doc = iframe.contentWindow.document;

        function makeNode(tagName, text, attrs, rect) {
            attrs = attrs || {};
            return {
                tagName: tagName,
                innerText: text || '',
                textContent: text || '',
                id: attrs.id || '',
                className: '',
                parentElement: attrs.parentElement || null,
                disabled: false,
                focusCount: 0,
                getAttribute: function(name) {
                    return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
                },
                getBoundingClientRect: function() { return rect; },
                focus: function() {
                    this.focusCount++;
                    doc.activeElement = this;
                }
            };
        }

        iframe.contentWindow = {
            document: doc,
            location: { hash: '#/detail/movie/tt-live-proof' }
        };
        return { sb: sb, iframe: iframe, doc: doc, makeNode: makeNode };
    }

    // No-stream state: ignore viewport overlays/uploads and focus Install addons.
    var noStream = createDetailFixture();
    var noStreamGroup = noStream.makeNode('DIV', 'No streams were found Install addons', {},
        { left: 560, top: 120, width: 360, height: 400 });
    var fileInput = noStream.makeNode('INPUT', '', { type: 'file', parentElement: noStreamGroup },
        { left: 0, top: 0, width: 1000, height: 700 });
    var emptyOverlay = noStream.makeNode('DIV', '', { tabindex: '0', parentElement: noStreamGroup },
        { left: 0, top: 0, width: 1000, height: 700 });
    var trailer = noStream.makeNode('A', 'Trailer', { href: 'https://example.invalid/trailer' },
        { left: 100, top: 180, width: 220, height: 45 });
    var noStreamStatus = noStream.makeNode('DIV', 'No streams were found', {
        tabindex: '0', parentElement: noStreamGroup
    }, { left: 600, top: 170, width: 280, height: 40 });
    var installAddons = noStream.makeNode('A', 'Install addons', {
        href: '#/addons', parentElement: noStreamGroup
    }, { left: 600, top: 230, width: 280, height: 50 });
    noStream.doc.querySelectorAll = function() {
        return [fileInput, emptyOverlay, trailer, noStreamStatus, installAddons];
    };
    noStream.doc.activeElement = null;
    noStream.iframe.onload();
    noStream.sb.flushTimeouts();
    assert.strictEqual(installAddons.focusCount, 1, 'No-stream detail should focus Install addons');
    assert.strictEqual(fileInput.focusCount, 0, 'Full-screen file input must be excluded');
    assert.strictEqual(emptyOverlay.focusCount, 0, 'Semantic-empty viewport control must be excluded');
    assert.strictEqual(trailer.focusCount, 0, 'Left metadata must not win detail focus');
    assert.strictEqual(noStreamStatus.focusCount, 0, 'No-stream status text is not an action');

    // Source state: semantic ancestry identifies the group and its top filter wins.
    var withSources = createDetailFixture();
    var sourceGroup = withSources.makeNode('SECTION', 'Streams and sources', { role: 'list' },
        { left: 560, top: 110, width: 360, height: 450 });
    var metadataLink = withSources.makeNode('A', 'Cast and crew', { href: '#/person/example' },
        { left: 90, top: 140, width: 240, height: 45 });
    var sourceFilter = withSources.makeNode('DIV', 'All', {
        tabindex: '0', role: 'combobox', parentElement: sourceGroup
    }, { left: 600, top: 145, width: 280, height: 45 });
    var sourceAction = withSources.makeNode('A', '1080p stream', {
        href: '#/play/source', parentElement: sourceGroup
    }, { left: 620, top: 220, width: 240, height: 50 });
    withSources.doc.querySelectorAll = function() {
        return [metadataLink, sourceFilter, sourceAction];
    };
    withSources.doc.activeElement = null;
    withSources.iframe.onload();
    withSources.sb.flushTimeouts();
    assert.strictEqual(sourceFilter.focusCount, 1, 'Source group should prefer its top filter');
    assert.strictEqual(sourceAction.focusCount, 0, 'Lower source action should not beat top filter');
    assert.strictEqual(metadataLink.focusCount, 0, 'Left metadata must remain excluded');

    // With no semantic source/stream group, detail bootstrap must focus nothing unrelated.
    var noGroup = createDetailFixture();
    var unrelatedFile = noGroup.makeNode('INPUT', '', { type: 'file' },
        { left: 0, top: 0, width: 1000, height: 700 });
    var unrelatedTrailer = noGroup.makeNode('A', 'Trailer', { href: '#/detail/series/unrelated' },
        { left: 100, top: 170, width: 220, height: 45 });
    unrelatedTrailer.className = 'selected';
    var unrelatedPlay = noGroup.makeNode('BUTTON', 'Play', {},
        { left: 100, top: 230, width: 220, height: 50 });
    noGroup.doc.querySelectorAll = function() {
        return [unrelatedFile, unrelatedTrailer, unrelatedPlay];
    };
    noGroup.doc.activeElement = null;
    noGroup.iframe.onload();
    noGroup.sb.flushTimeouts();
    assert.strictEqual(noGroup.doc.activeElement, null, 'Missing source group should leave focus unchanged');
    assert.strictEqual(unrelatedFile.focusCount, 0);
    assert.strictEqual(unrelatedTrailer.focusCount, 0, 'Unrelated metadata must not receive fallback focus');
    assert.strictEqual(unrelatedPlay.focusCount, 0, 'Unrelated left action must not receive fallback focus');

    console.log('[PASS] Test 16: Detail source-group fallback regression passed');
})();

// Test 17: Settings route sidebar exit and nested settings navigation
(function() {
    console.log('Running Test 17: Settings route sidebar exit and nested settings navigation...');
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var iframe = sb.elements['app-iframe'];
    iframe.onload();
    var doc = iframe.contentWindow.document;

    function makeElement(tagName, text, attrs, rect) {
        attrs = attrs || {};
        return {
            tagName: tagName,
            innerText: text || '',
            textContent: text || '',
            className: attrs.className || '',
            disabled: false,
            parentElement: attrs.parentElement || null,
            focusCount: 0,
            clickCount: 0,
            getAttribute: function(name) {
                if (name === 'class') return this.className;
                return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
            },
            getBoundingClientRect: function() { return rect; },
            focus: function() {
                this.focusCount++;
                doc.activeElement = this;
            },
            click: function() {
                this.clickCount++;
            }
        };
    }

    var mockSettingsNav = {
        tagName: 'NAV',
        className: 'settings-menu',
        getAttribute: function(name) {
            if (name === 'class') return this.className;
            return null;
        },
        parentElement: null
    };

    iframe.contentWindow = {
        document: doc,
        location: { hash: '#/settings' }
    };

    var outerSettings = makeElement('A', 'Settings', { href: '#/settings' },
        { left: 10, top: 260, width: 60, height: 60 });
    var generalTab = makeElement('A', 'General', {
        href: '#/settings/general',
        parentElement: mockSettingsNav,
        'aria-current': 'page'
    }, { left: 70, top: 80, width: 120, height: 40 });
    var interfaceTab = makeElement('A', 'Interface', {
        href: '#/settings/interface',
        parentElement: mockSettingsNav
    }, { left: 70, top: 120, width: 120, height: 40 });
    var loginLink = makeElement('A', 'Log in / Sign up', { href: '#/intro' },
        { left: 220, top: 90, width: 180, height: 30 });
    var authButton = makeElement('BUTTON', 'Authenticate', {},
        { left: 360, top: 240, width: 180, height: 40 });

    var candidates = [outerSettings, generalTab, interfaceTab, loginLink, authButton];
    doc.querySelectorAll = function() {
        return candidates;
    };

    doc.activeElement = outerSettings;
    var sidebarRight = sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(sidebarRight.defaultPrevented, 'Settings sidebar Right should be handled');
    assert.strictEqual(generalTab.focusCount, 1, 'Settings sidebar Right should enter the nested settings panel');
    assert.strictEqual(api.getState().lastNavigation, 'sidebar-to-primary-content-right');

    doc.activeElement = generalTab;
    var generalRight = sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(generalRight.defaultPrevented, 'General Right should be handled spatially');
    assert.strictEqual(loginLink.focusCount, 1, 'General Right should reach the account login link');
    assert.strictEqual(authButton.focusCount, 0, 'Nearest account link should win before distant buttons');

    doc.activeElement = loginLink;
    var loginLeft = sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(loginLeft.defaultPrevented, 'Login Left should be handled spatially');
    assert.strictEqual(generalTab.focusCount, 2, 'Login Left should return to the nested settings navigation');
})();

// Test 18: Profile Down reaches visible login action in the open menu
(function() {
    console.log('Running Test 18: Profile Down reaches visible login action...');
    var sb = createSandbox();
    var api = sb.context.window.__STREMIO_WEB_WRAPPER_POC__;
    var iframe = sb.elements['app-iframe'];
    iframe.onload();
    var doc = iframe.contentWindow.document;

    function makeElement(tagName, text, attrs, rect) {
        attrs = attrs || {};
        return {
            tagName: tagName,
            innerText: text || '',
            textContent: text || '',
            className: attrs.className || '',
            disabled: false,
            parentElement: attrs.parentElement || null,
            focusCount: 0,
            getAttribute: function(name) {
                if (name === 'class') return this.className;
                return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
            },
            getBoundingClientRect: function() { return rect; },
            focus: function() {
                this.focusCount++;
                doc.activeElement = this;
            },
            click: function() {
                this.clickCount = (this.clickCount || 0) + 1;
            }
        };
    }

    var mockHeader = {
        tagName: 'HEADER',
        getAttribute: function() { return null; },
        parentElement: null
    };

    iframe.contentWindow = {
        document: doc,
        location: { hash: '#/' }
    };

    var profileToggle = makeElement('DIV', '', {
        tabindex: '-1',
        className: 'label-container nav-menu-popup-label active menu-toggle',
        parentElement: mockHeader
    }, { left: 900, top: 20, width: 60, height: 40 });
    var menuRoot = makeElement('DIV', '', {
        className: 'nav-menu-container',
        parentElement: profileToggle
    }, { left: 760, top: 60, width: 200, height: 300 });
    var loginAction = makeElement('DIV', 'Log in / Sign up', {
        tabindex: '0',
        title: 'Log in / Sign up',
        className: 'button-container',
        parentElement: menuRoot
    },
        { left: 780, top: 80, width: 180, height: 50 });
    var settingsAction = makeElement('A', 'Settings', {
        tabindex: '0',
        href: '#/settings',
        className: 'nav-menu-option button-container',
        parentElement: menuRoot
    }, { left: 780, top: 140, width: 180, height: 40 });
    var addonsAction = makeElement('A', 'Addons', {
        tabindex: '0',
        href: '#/addons',
        className: 'nav-menu-option button-container',
        parentElement: menuRoot
    }, { left: 780, top: 190, width: 180, height: 40 });
    var card = makeElement('A', 'Movie Card', { href: '#/detail/movie/tt123' },
        { left: 200, top: 150, width: 150, height: 150 });

    var candidates = [profileToggle, loginAction, settingsAction, addonsAction, card];
    profileToggle.innerText = 'Anonymous user Log in / Sign up Settings Addons Play URL/Magnet link Help & Feedback';
    profileToggle.textContent = profileToggle.innerText;
    doc.querySelectorAll = function() {
        return candidates;
    };

    doc.activeElement = profileToggle;
    var profileDown = sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(profileDown.defaultPrevented, 'Profile Down should be handled');
    assert.strictEqual(loginAction.focusCount, 1, 'Profile Down should enter the visible login action');
    assert.strictEqual(card.focusCount, 0, 'Profile Down should prefer the open menu over home-page cards');
    assert.strictEqual(api.getState().lastNavigation, 'open-profile-menu-capture-focus');

    doc.activeElement = profileToggle;
    var profileEnter = sb.triggerIframeKeydown('Enter', 'Enter', 13);
    assert.ok(profileEnter.defaultPrevented, 'Profile Enter should be handled while the popup is open');
    assert.strictEqual(loginAction.clickCount, 1,
        'Profile Enter should activate the open popup login instead of closing the menu');
    assert.strictEqual(profileToggle.clickCount || 0, 0,
        'Profile Enter must not toggle an already-open menu closed');
    assert.strictEqual(api.getState().lastNavigation, 'activate-profile-popup-login');

    doc.activeElement = doc.body;
    var bodyDown = sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(bodyDown.defaultPrevented, 'Open popup must capture Down after Stremio drops focus to BODY');
    assert.strictEqual(loginAction.focusCount, 2, 'BODY Down should focus the popup login control');
    assert.strictEqual(api.getState().lastNavigation, 'open-profile-menu-capture-focus');

    doc.activeElement = loginAction;
    var loginDown = sb.triggerIframeKeydown('ArrowDown', 'ArrowDown', 40);
    assert.ok(loginDown.defaultPrevented, 'Popup login Down should be handled inside the popup');
    assert.strictEqual(settingsAction.focusCount, 1, 'Popup login Down should focus Settings');

    doc.activeElement = settingsAction;
    var settingsRight = sb.triggerIframeKeydown('ArrowRight', 'ArrowRight', 39);
    assert.ok(settingsRight.defaultPrevented, 'Popup Right should advance through popup controls');
    assert.strictEqual(addonsAction.focusCount, 1, 'Popup Right should focus Addons');

    doc.activeElement = addonsAction;
    var addonsLeft = sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.ok(addonsLeft.defaultPrevented, 'Popup Left should move backward through popup controls');
    assert.strictEqual(settingsAction.focusCount, 2, 'Popup Left should return to Settings');
})();

console.log('All tests passed successfully!');
