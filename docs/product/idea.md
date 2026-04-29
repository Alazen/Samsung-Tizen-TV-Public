# Product Idea: Stremio Web TV Remote for TizenBrew

## Problem

Stremio Web runs in the TV browser context, but remote-first ergonomics can be inconsistent on Samsung Tizen TVs.

## Idea

Ship a lightweight TizenBrew `mods` package that injects a safe bootstrap script into `https://web.stremio.com/` and progressively adds TV remote affordances.

## First Increment

- Establish a stable injection namespace
- Add optional stylesheet hooks
- Register only non-mandatory optional keys (media/color/info)
- Keep behavior no-op by default until navigation contracts are defined
