# Signing and certificates

Purpose:
Help agents route certificate, signing, and packaging questions to the official Tizen Studio sources.

Read first:
- docs/tizen/source-map.md

Official sources:
- docs/vendor/samsung-tizen-docs/docs/application/web/tutorials/sign-certificate.md
- docs/vendor/samsung-tizen-docs/docs/application/tizen-studio/

Common tasks:
- create or select a certificate profile
- sign a WGT package
- diagnose signing or install failures
- distinguish author and distributor certificate concepts

Agent rules:
- do not ask for or expose signing secrets
- do not invent Samsung Seller Office behavior from local docs
- do not assume a certificate profile exists on the user's machine
- state when a task requires external account, device, or Seller Office access
