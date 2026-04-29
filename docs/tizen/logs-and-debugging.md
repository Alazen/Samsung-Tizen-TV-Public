# Logs and debugging

Purpose:
Help agents find runtime errors from Tizen TV web apps without scanning unrelated docs.

Read first:
- docs/tizen/source-map.md

Official sources:
- docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/process/run-debug-app.md
- docs/vendor/samsung-tizen-docs/docs/application/tizen-studio/

Common tasks:
- launch an app in debug mode
- inspect JavaScript runtime errors
- collect logs from a target
- use Tizen Studio debugging tools
- separate packaging failures from runtime failures

Agent rules:
- do not assume logs are available on every TV model
- do not claim Web Inspector behavior without checking official sources
- do not replace reproduction steps with speculative fixes
- include exact source files consulted when diagnosing errors
