# Web APIs

Purpose:
Help agents choose the right official references for Tizen Web Device APIs and web runtime behavior.

Read first:
- docs/tizen/source-map.md

Official sources:
- docs/vendor/samsung-tizen-docs/docs/application/web/api/10.0/
- docs/vendor/samsung-tizen-docs/docs/application/web/guides/

Common tasks:
- check whether a Tizen web API exists in version 10.0 docs
- check required privileges
- distinguish Tizen Web Device APIs from standard browser APIs
- find guide pages before opening generated API references
- report missing TV-specific coverage

Agent rules:
- do not scan every API version
- do not assume a generic Web API behaves like a desktop browser
- do not assume generated API docs imply TV support without checking profile and guide context
- open only the relevant API file or guide for the task
