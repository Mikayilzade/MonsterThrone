# HUD editor — Stage 3B portability

Stage 3B builds on the stabilized Stage 3A editor without changing its drag/snap ownership.

## Added

- Per-profile HUD element size: 80–125% for phone portrait, phone landscape and desktop.
- Three local preset slots per profile.
- Export of all three HUD layouts to a versioned JSON package.
- Import of a HUD JSON package with validation and device-size adaptation.
- Portable package includes action visibility / biome badge extras and desktop HUD options.
- Viewport references are stored per profile so pixel-sized controls can be adapted when moved to a different screen size.

## Portability rules

- Position anchors (`left`, `right`, `bottom`) stay normalized and are preserved across devices.
- Pixel-sized controls are adapted by the smaller source/target viewport ratio, clamped to 0.75–1.35.
- Imported values still pass through the existing HUD sanitizer before runtime use.
- Applying a preset or import reloads the page after preserving the current game auto-save so the older extras module re-reads its storage cleanly.
- Normal slider scaling does not reload the page and only changes core HUD element sizes.

## Not included

- Cloud sync.
- Account-level sharing.
- Arbitrary preset names.
- Stage 4 HUD elements such as topbar, target panel, quest panel and notifications.

## QA

1. Change size in portrait, rotate landscape and confirm landscape keeps its own size.
2. Save Preset 1, move/resize several controls, apply Preset 1 and confirm the saved arrangement returns.
3. Export HUD JSON, change the layout, import the JSON and confirm all three profiles restore.
4. Import on a different phone/screen size and confirm positions remain proportional while control sizes adapt rather than becoming tiny/huge.
5. Confirm game saves are unaffected by HUD import/export/reset operations.
