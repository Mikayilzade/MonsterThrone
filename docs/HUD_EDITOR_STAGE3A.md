# HUD Editor — Stage 3A safety pass

Stage 3A hardens the visual HUD editor after the Stage 2 mobile/desktop stabilization passes.

## Safe-area boundaries

The editor now reads the browser/device `safe-area-inset-*` values and shows a dotted safe rectangle while editing. On release and on Save, editable controls are clamped inside that area with a small margin.

This prevents a layout from being saved under an iPhone notch/home-indicator region or partly outside the usable viewport.

## Snap guides

Dragging near a useful alignment point shows temporary guides. Release snapping supports:

- viewport safe edges;
- viewport horizontal/vertical center;
- matching edges and centers of other visible HUD elements;
- placement immediately beside another element with a small gap.

Snapping is intentionally light (about a 10 px threshold) so free placement still feels free.

## Collision feedback

Strong overlap between editable HUD elements is not blocked, because intentional overlap can be useful. Instead, the selected frame and the strongest conflicting frame are highlighted and a short warning names the two elements.

## Frame precision

Editor frames now use CSS outlines instead of borders. The outline no longer changes the measured box dimensions, reducing the remaining 1–2 px frame drift seen during physical phone QA.

## Emergency recovery

The system-menu footer contains **⚠ Восстановить интерфейс**.

Emergency recovery removes only HUD-layout/editor-layout preferences and reloads the page. Game saves are not deleted. Desktop also supports `Ctrl+Shift+0` as an emergency shortcut.

## Persistence

Stage 3A does not introduce a new layout format. It normalizes the existing Stage 2 layout/extras data on Save, so current user profiles migrate without a separate conversion step.

## Deferred to Stage 3B

- global HUD scale;
- import/export;
- named user presets;
- adaptation between significantly different device sizes/resolutions.
