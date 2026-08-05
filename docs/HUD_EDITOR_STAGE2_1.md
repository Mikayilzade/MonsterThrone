# HUD Editor — Stage 2.1 Mobile Stabilization

This follow-up turns the Stage 2 editor prototype into a usable mobile workflow before Stage 3 safety features.

## System menu

The settings card is split into:

- a fixed header with tabs and an always-visible `×` close button;
- a separately scrollable page area;
- a fixed footer with the normal **Close** button.

This prevents low-height landscape Safari from trapping the player below an unreachable close button.

## Element catalogue

**Settings → Interface** now receives a catalogue for the active profile.

### Controls

- Joystick — mandatory on touch profiles;
- Attack;
- Dodge;
- Pick up;
- Use.

The four action buttons can be shown or hidden independently. Hidden controls remain available in the catalogue and can be restored at any time.

### Game HUD

- Hotbar;
- Minimap;
- Biome/location badge.

The location badge supports visibility and full/compact presentation.

## Biome badge editing

The location badge is added to the visual editor as a draggable and resizable element. Portrait defaults place it above the hotbar on the left, reducing competition with the minimap on the right.

Its extra profile data is stored in `monsterThrone.hudEditorExtras.v1`, separately for portrait phone, landscape phone and desktop. Existing Stage 2 layouts remain compatible.

## Editor outlines

The stabilization layer continuously aligns handles for DOM-backed controls to their real `getBoundingClientRect()` boxes. This removes large or shifted outlines caused by calculated geometry differing from rendered CSS and safe-area layout.

Labels are placed outside the outlined control, and the resize handle is smaller.

## Deferred

Stage 3 still owns:

- snapping guides;
- collision warnings;
- stronger safe-area drag bounds;
- global HUD scale;
- layout import/export;
- emergency reset access.

Desktop smoke may be completed later because desktop uses an independent profile and this pass preserves its defaults.
