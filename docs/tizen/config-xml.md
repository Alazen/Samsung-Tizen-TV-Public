# config.xml

Purpose:
Help agents inspect and update Tizen TV web app metadata, entrypoints, privileges, and package identity.

Read first:
- docs/tizen/source-map.md

Official sources:
- docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/sec-privileges.md
- docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/old-versioned-sec-privileges.md
- docs/vendor/samsung-tizen-docs/docs/application/web/get-started/tv/first-app.md

Common tasks:
- locate the application entrypoint
- inspect app ID, package ID, icon, and content settings
- add only required privileges
- check TV profile assumptions
- diagnose install or launch failures caused by metadata

Agent rules:
- do not add privileges speculatively
- do not assume config.xml follows generic web app conventions
- check source-map.md before opening broader Web Application docs
- state when a config change requires repackaging and reinstalling
