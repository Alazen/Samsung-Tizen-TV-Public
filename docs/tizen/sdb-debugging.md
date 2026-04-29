# SDB debugging

Purpose:
Help agents debug Tizen TV web apps using SDB, Tizen Studio, and device logs.

Read first:
- docs/tizen/source-map.md

Official sources:
- docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/process/run-debug-app.md
- docs/vendor/samsung-tizen-docs/docs/application/tizen-studio/

Common tasks:
- connect to TV
- inspect installed apps
- install or uninstall a WGT
- launch app
- view logs
- capture app runtime errors

Agent rules:
- do not assume Android adb behavior
- do not suggest reinstalling unless explicitly requested
- prefer log collection and reproduction steps
- report exact commands and observed output
