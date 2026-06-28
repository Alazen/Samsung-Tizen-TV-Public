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
            mockTimeouts.push({ cb: cb, delay: delay });
            return mockTimeouts.length;
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
        MediaSource: mockWindow.MediaSource,
        tizen: mockWindow.tizen,
        Date: Date,
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
            pending.forEach(function(timeout) { timeout.cb(); });
        },
        setMockContentDocument: function(doc) { mockContentDocument = doc; },
        triggerKeydown: function(key, code, keyCode) {
            var event = {
                key: key,
                code: code,
                keyCode: keyCode,
                preventDefault: function() {}
            };
            keydownListeners.forEach(function(listener) {
                listener(event);
            });
        },
        triggerIframeKeydown: function(key, code, keyCode) {
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

    // 2. ColorF0Red key -> toggle closed, stop interval timer
    sb.triggerKeydown('ColorF0Red', 'ColorF0Red', 403);
    assert.strictEqual(api.getState().diagnosticsOpen, false, 'ColorF0Red should close diagnostics');
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

    // 3. ColorF0Red key inside the iframe should toggle diagnostics back to closed and stop interval timer
    sb.triggerIframeKeydown('ColorF0Red', 'ColorF0Red', 403);
    assert.strictEqual(api.getState().diagnosticsOpen, false, 'ColorF0Red iframe key must toggle diagnostics closed');
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
    var profileToggle = makeElement('DIV', '', {
        tabindex: '-1'
    }, { left: 900, top: 20, width: 60, height: 40 });
    var loginAction = makeElement('BUTTON', 'Log in / Sign up', {},
        { left: 780, top: 80, width: 180, height: 50 });
    candidates = [profileToggle, loginAction];
    assert.strictEqual(api.getState().navigationAdapter.candidateCount, 2,
        'Profile toggle and login menu action should be included');
    doc.activeElement = profileToggle;
    sb.triggerIframeKeydown('Enter', 'Enter', 13);
    doc.activeElement = loginAction;
    sb.triggerIframeKeydown('Enter', 'Enter', 13);
    assert.strictEqual(profileToggle.clickCount, 1, 'Profile toggle should activate with Enter');
    assert.strictEqual(loginAction.clickCount, 1, 'Log in / Sign up should activate with Enter');

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

    // Reset checks and change hash to root home page
    backCalled = 0;
    preventDefaultCalled = 0;
    mockWin.location.hash = '#/';

    sb.keydownListeners.forEach(function(listener) {
        listener(event);
    });

    assert.strictEqual(backCalled, 0, 'Should NOT call history.back() for home view');
    assert.strictEqual(preventDefaultCalled, 0, 'Should NOT prevent default event behavior for home view');

    console.log('[PASS] Test 10: Back Key Navigation passed');
})();

console.log('All tests passed successfully!');
