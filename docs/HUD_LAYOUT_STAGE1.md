# HUD layout engine — Stage 1

This pass establishes the foundation for player-configurable HUD layouts without adding the visual editor yet.

## Profiles

The runtime selects one independent profile:

- `mobilePortrait`
- `mobileLandscape`
- `desktop`

Touch detection uses coarse-pointer / touch capability instead of relying only on a width breakpoint. A wide iPhone landscape viewport therefore keeps the joystick and four action buttons visible. Hybrid devices with a fine pointer and desktop-sized viewport stay on the desktop profile and do not inherit mobile minimap/control behavior.

## Managed elements

Stage 1 registers and positions:

- joystick;
- four-button action group;
- hotbar;
- minimap.

The four action buttons also receive individual `data-hud-id` values so Stage 2 can move or resize them separately.

## Storage and migration

Layouts are stored under:

`monsterThrone.hudLayouts.v1`

The schema is versioned. Missing profiles or fields are restored from defaults, invalid numbers are clamped, mandatory controls remain visible, and malformed JSON is replaced safely.

Offsets are stored as viewport proportions while touch-control sizes remain bounded CSS-pixel values. This lets the same layout adapt to nearby screen sizes without shrinking touch targets below 44 px.

## Default landscape layout

The initial mobile-landscape profile provides:

- compact top status bar;
- joystick at bottom-left;
- four action buttons at bottom-right;
- four visible hotbar slots with horizontal scrolling;
- compact minimap above the controls;
- safe-area-aware offsets.

The profile class, not the old `max-width: 900px` media query, decides whether mobile controls are shown. The existing desktop hotbar remains unchanged in Stage 1.

## Next pass

Stage 2 will add the in-game Interface tab and editing mode for drag, resize, save, cancel and reset. No editor UI is included in Stage 1.

## Verification

- `node --check hero072/hud-layout.js`
- `node --check hero072/boot.js`
- `node tests/hud-layout.test.js` — 11/11 passed locally

A physical iPhone landscape smoke test remains required after merging into `codex` and GitHub Pages deployment.
