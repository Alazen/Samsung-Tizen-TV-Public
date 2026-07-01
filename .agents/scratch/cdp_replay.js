const http = require("http");

const port = Number(process.env.CDP_PORT || "46712");

function getTarget() {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json`, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const targets = JSON.parse(data);
                    resolve(targets[0]);
                } catch (err) {
                    reject(err);
                }
            });
        }).on("error", reject);
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const target = await getTarget();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    const pending = new Map();
    let nextId = 1;

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = nextId++;
            pending.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async function key(keyName, keyCode, code, waitMs) {
        await send("Input.dispatchKeyEvent", {
            type: "keyDown",
            key: keyName,
            code,
            windowsVirtualKeyCode: keyCode,
            nativeVirtualKeyCode: keyCode
        });
        await send("Input.dispatchKeyEvent", {
            type: "keyUp",
            key: keyName,
            code,
            windowsVirtualKeyCode: keyCode,
            nativeVirtualKeyCode: keyCode
        });
        await sleep(waitMs);
    }

    async function snapshot(label) {
        const expression = `(function(){
            var api = window.__STREMIO_WEB_WRAPPER_POC__;
            var st = api && api.getState ? api.getState() : null;
            var iframe = document.getElementById("app-iframe");
            var win = iframe && iframe.contentWindow;
            var doc = iframe && (iframe.contentDocument || (win && win.document));
            var el = doc && doc.activeElement;
            function textOf(node) {
                if (!node) return null;
                return String(node.innerText || node.textContent || node.value || "")
                    .replace(/\\s+/g, " ")
                    .trim()
                    .slice(0, 120);
            }
            return {
                label: ${JSON.stringify(label)},
                href: (win && win.location && win.location.href) || "",
                hash: (win && win.location && win.location.hash) || "",
                activeTag: el && el.tagName || null,
                activeText: textOf(el),
                lastNavigation: st && st.lastNavigation || null,
                lastKey: st && st.lastKey || null,
                navActive: st && st.navigationAdapter && st.navigationAdapter.activeElement || null,
                listener: st && st.iframeListenerStatus || null
            };
        })()`;
        const result = await send("Runtime.evaluate", {
            expression,
            returnByValue: true
        });
        console.log(JSON.stringify(result.result.value, null, 2));
    }

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (!Object.prototype.hasOwnProperty.call(msg, "id")) return;
        const slot = pending.get(msg.id);
        if (!slot) return;
        pending.delete(msg.id);
        if (msg.error) {
            slot.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
            slot.resolve(msg.result || {});
        }
    };

    await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
    });

    const timeout = setTimeout(() => {
        try {
            ws.close();
        } catch (_) {
        }
        process.exit(2);
    }, 45000);

    try {
        await send("Runtime.runIfWaitingForDebugger");
        await sleep(300);

        await snapshot("start-current");
        await key("ArrowUp", 38, "ArrowUp", 500);
        await snapshot("after-up-to-search");
        await key("ArrowRight", 39, "ArrowRight", 500);
        await snapshot("after-right-to-fullscreen");
        await key("ArrowRight", 39, "ArrowRight", 500);
        await snapshot("after-right-to-profile");
        await key("Enter", 13, "Enter", 1000);
        await snapshot("after-profile-enter");
        await key("Enter", 13, "Enter", 1800);
        await snapshot("after-login-enter");
        await key("Back", 10009, "XF86Back", 1200);
        await snapshot("after-back-from-login");
        await key("ArrowDown", 40, "ArrowDown", 500);
        await snapshot("after-down-to-first-card");
        await key("Enter", 13, "Enter", 2400);
        await snapshot("after-enter-detail");
        await key("Back", 10009, "XF86Back", 1200);
        await snapshot("after-back-from-detail");
    } finally {
        clearTimeout(timeout);
        try {
            ws.close();
        } catch (_) {
        }
    }
}

main().catch((err) => {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
});
