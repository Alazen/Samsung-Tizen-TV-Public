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
                    resolve(JSON.parse(data)[0]);
                } catch (err) {
                    reject(err);
                }
            });
        }).on("error", reject);
    });
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

    try {
        await send("Runtime.runIfWaitingForDebugger");
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
    } finally {
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
