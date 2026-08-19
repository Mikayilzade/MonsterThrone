# HUD editor landscape stability

Physical iPhone landscape QA after Stage 3A exposed two coupled problems:

1. the dotted iOS safe-area was treated as a hard rectangle, so circular controls near the screen edge jumped far inward on release;
2. Stage 3A wrote a second snapped runtime preview that was not copied back into the base editor draft. Moving another control then restored stale coordinates, making the minimap or joystick jump apart from its editor frame.

## Stabilization

- The iOS safe-area is now advisory only.
- The physical viewport, with a 4 px margin, is the hard editor boundary.
- Safe-area remains visible as a faint guide and can report that an element is intentionally outside it.
- Stage 3A never writes a second runtime preview while dragging or on pointer release.
- The base HUD editor is the single source of truth during the edit session.
- Final light clamping/snapping happens once after Save, against the physical viewport.
- Biome badge is hard-clamped to the physical viewport on Save as well.
- Collision warnings, emergency recovery and safe-area measurement remain active.

## Physical QA

Phone landscape:

1. Move minimap to the right edge; a small movement must not throw it inward.
2. Move joystick near the left edge; the dotted safe-area must not block placement.
3. After placing the minimap, start moving the joystick; the minimap must not jump.
4. Frames and actual controls must remain aligned throughout the edit session.
5. Save, close, reopen and confirm positions persist.
6. Rotate portrait → landscape and confirm the landscape profile remains stable.
