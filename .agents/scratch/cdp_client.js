const http = require('http');

function getDevToolsUrl() {
    return new Promise((resolve, reject) => {
        const port = process.env.CDP_PORT || 43861;
        http.get(`http://localhost:${port}/json`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const targets = JSON.parse(data);
                    const target = targets.find(t => t.title === 'StremioWebWrapperPOC' || t.url.includes('index.html'));
                    if (target) {
                        resolve(target.webSocketDebuggerUrl);
                    } else {
                        reject(new Error('Target StremioWebWrapperPOC not found. Available targets: ' + JSON.stringify(targets)));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function runCDP(method, params = {}) {
    return getDevToolsUrl().then(wsUrl => {
        const ws = new WebSocket(wsUrl);
        return new Promise((resolve, reject) => {
            let id = 1;
            ws.onopen = () => {
                const cmd = {
                    id: id,
                    method: method,
                    params: params
                };
                ws.send(JSON.stringify(cmd));
            };
            
            ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.id === id) {
                        ws.close();
                        if (response.error) {
                            reject(response.error);
                        } else if (response.result && response.result.exceptionDetails) {
                            reject(response.result.exceptionDetails);
                        } else {
                            resolve(response.result);
                        }
                    }
                } catch (e) {
                    reject(e);
                }
            };
            
            ws.onerror = (err) => {
                reject(err);
            };
        });
    });
}

async function main() {
    const action = process.argv[2];
    if (action === 'eval') {
        const expr = process.argv.slice(3).join(' ');
        const res = await runCDP('Runtime.evaluate', { expression: expr, returnByValue: true });
        console.log(JSON.stringify(res.result.value, null, 2));
    } else if (action === 'key') {
        const key = process.argv[3]; // e.g. "1" or "Info"
        const keyCode = parseInt(process.argv[4]); // e.g. 49 or 457
        const code = process.argv[5] || '';
        
        console.log(`Dispatching keydown for Key: ${key}, KeyCode: ${keyCode}`);
        
        // Dispatch keydown
        await runCDP('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: key,
            code: code,
            windowsVirtualKeyCode: keyCode,
            nativeVirtualKeyCode: keyCode
        });
        
        // Dispatch keyup
        await runCDP('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: key,
            code: code,
            windowsVirtualKeyCode: keyCode,
            nativeVirtualKeyCode: keyCode
        });
        
        console.log('Key dispatched.');
    } else {
        // Default to showing state
        const res = await runCDP('Runtime.evaluate', { 
            expression: 'window.__STREMIO_WEB_WRAPPER_POC__.getState()', 
            returnByValue: true 
        });
        console.log(JSON.stringify(res.result.value, null, 2));
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
