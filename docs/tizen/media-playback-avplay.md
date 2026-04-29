# Media playback and AVPlay

Purpose:
Help agents route Tizen TV media playback tasks to official multimedia and Samsung Product API sources.

Read first:
- docs/tizen/source-map.md

Official sources:
- docs/vendor/samsung-tizen-docs/docs/application/web/guides/multimedia/
- Samsung Developer Smart TV Product API docs, if vendored separately

Common tasks:
- decide whether HTML media or AVPlay is the relevant playback surface
- inspect multimedia guide concepts
- identify gaps that require Samsung Smart TV Product API documentation
- report model, firmware, or codec uncertainty

Agent rules:
- do not treat AVPlay as standard HTMLMediaElement behavior
- do not invent Samsung Product API details from Tizen generic docs
- stop when the required Smart TV Product API source is not vendored and the task depends on it
- state when external official Samsung TV docs must be consulted
