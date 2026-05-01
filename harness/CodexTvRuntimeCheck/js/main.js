/// <reference path="../../index.d.ts" />

(function initHarness(globalScope) {
    "use strict";

    function byId(id) {
        return globalScope.document && globalScope.document.getElementById
            ? globalScope.document.getElementById(id)
            : null;
    }

    function setDialogOpen(isOpen) {
        var dialog = byId("fixture-dialog");

        if (!dialog) {
            return;
        }

        if (isOpen) {
            dialog.removeAttribute("hidden");
            return;
        }

        dialog.setAttribute("hidden", "hidden");
    }

    function pushFixtureHistory() {
        var nextPath = "/fixture-history";

        if (!globalScope.history || typeof globalScope.history.pushState !== "function") {
            console.log("Harness history.pushState unavailable");
            return;
        }

        try {
            globalScope.history.pushState({ fixture: true }, "", nextPath);
            console.log("Harness pushed history state", nextPath);
        } catch (error) {
            console.log("Harness history.pushState failed", error && error.message ? error.message : error);
        }
    }

    function updateLog() {
        var logNode = byId("runtime-log");
        var runtime = globalScope.__STREMIO_TIZENBREW_REMOTE__;
        var state;

        if (!logNode) {
            return;
        }

        if (!runtime || typeof runtime.getState !== "function") {
            logNode.textContent = "Runtime API not found.";
            return;
        }

        state = runtime.getState();
        logNode.textContent = JSON.stringify(state, null, 2);
        return state;
    }

    function bindFixtureActions() {
        var openDialogButton = byId("open-dialog");
        var closeDialogButton = byId("close-dialog");
        var pushHistoryButton = byId("push-history");

        if (openDialogButton) {
            openDialogButton.addEventListener("click", function onOpenDialog() {
                setDialogOpen(true);
                updateLog();
                console.log("Harness fixture dialog opened");
            });
        }

        if (closeDialogButton) {
            closeDialogButton.addEventListener("click", function onCloseDialog() {
                setDialogOpen(false);
                updateLog();
                console.log("Harness fixture dialog closed");
            });
        }

        if (pushHistoryButton) {
            pushHistoryButton.addEventListener("click", function onPushHistory() {
                pushFixtureHistory();
                updateLog();
            });
        }
    }

    function init() {
        updateLog();
        bindFixtureActions();

        globalScope.document.addEventListener("keydown", function onKeydown(event) {
            var state = updateLog();
            console.log("Harness keydown", {
                key: event && event.key,
                code: event && event.code,
                lastAction: state && state.lastConsumedAction,
                diagnosticsOpen: state && state.diagnosticsOpen,
                exitModalOpen: state && state.exitModalOpen
            });
        });

        globalScope.setInterval(updateLog, 1000);
        console.log("CodexTvRuntimeCheck harness initialized");
    }

    globalScope.onload = init;
})(typeof globalThis !== "undefined" ? globalThis : window);
