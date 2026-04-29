# Privileges

Purpose:
Help agents map Tizen web API usage to the minimum required privileges.

Read first:
- docs/tizen/source-map.md

Official sources:
- docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/sec-privileges.md
- docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/old-versioned-sec-privileges.md
- docs/vendor/samsung-tizen-docs/docs/application/web/api/10.0/

Common tasks:
- identify whether an API requires a privilege
- add required privileges to config.xml
- explain public, partner, and platform privilege limits when documented
- stop when a task requires unsupported TV privileges

Agent rules:
- do not assume a privilege is available on retail TVs
- do not suggest partner or platform privileges as normal app fixes
- do not use mobile or wearable privilege pages for TV tasks unless explicitly routed
- cite the exact official file used for each privilege decision
