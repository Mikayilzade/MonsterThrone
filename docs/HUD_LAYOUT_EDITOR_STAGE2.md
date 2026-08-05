# HUD Layout Editor — Stage 2

Stage 2 adds an in-game visual editor on top of the profile foundation from Stage 1.

## Profiles

Layouts remain independent for:

- `mobilePortrait` — phone portrait;
- `mobileLandscape` — phone landscape;
- `desktop` — desktop and laptop.

The editor always opens for the profile matching the current viewport. Rotating the phone while editing cancels the unsaved preview, so coordinates cannot be written into the wrong profile.

## Editable elements

- joystick;
- the four action buttons as one `2×2` block or as four independent buttons;
- hotbar;
- minimap.

Every element can be dragged and resized. Hotbar and minimap may also be hidden. Joystick and action controls remain mandatory.

## Workflow

Open **Settings → Interface → Configure current screen**.

The game remains paused while the system menu is hidden and the editor overlay is active.

- **Save** commits the preview to versioned local storage.
- **Cancel** restores the last saved layout.
- **Reset element** restores only the selected element.
- **Reset screen** restores the current profile.
- The Interface page can reset the current profile or all three profiles.

## Storage and migration

The existing storage key is preserved: `monsterThrone.hudLayouts.v1`.

The internal schema version moves to `2`. Stage 1 values are migrated and receive defaults for:

- `actionMode`;
- `actionAttack`;
- `actionDodge`;
- `actionPickup`;
- `actionUse`.

Preview changes are held separately from saved layouts until the user presses Save.

## Deferred to Stage 3

- safe-area-aware drag boundaries and collision warnings;
- snapping guides;
- global HUD scale;
- emergency reset gesture/button;
- import/export of layouts;
- adaptation rules for significantly different screen sizes.
