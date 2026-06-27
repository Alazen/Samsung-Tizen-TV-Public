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
        }
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
            return setTimeout(cb, delay);
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
        setMockContentDocument: function(doc) { mockContentDocument = doc; },
        triggerKeydown: function(key, code, keyCode) {
            var event = {
                key: key,
                code: code,
                keyCode: keyCode
            };
            keydownListeners.forEach(function(listener) {
                listener(event);
            });
        },
        triggerIframeKeydown: function(key, code, keyCode) {
            var event = {
                key: key,
                code: code,
                keyCode: keyCode
            };
            iframeKeydownListeners.forEach(function(listener) {
                listener(event);
            });
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

    // 1. Ordinary key (e.g. ArrowLeft) inside the iframe should update lastKey, but NOT inspect DOM or render
    sb.triggerIframeKeydown('ArrowLeft', 'ArrowLeft', 37);
    assert.strictEqual(sb.getIframeAccessCount(), initialIframeAccess, 'Ordinary iframe keydown must not trigger iframe inspection');
    assert.strictEqual(sb.getLogRenderCount(), initialLogRender, 'Ordinary iframe keydown must not trigger diagnostics render');

    var stateKey = api.getState();
    assert.strictEqual(stateKey.diagnosticsOpen, false, 'Ordinary iframe key must not toggle diagnostics');
    assert.strictEqual(stateKey.lastKey.key, 'ArrowLeft');

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

console.log('All tests passed successfully!');
