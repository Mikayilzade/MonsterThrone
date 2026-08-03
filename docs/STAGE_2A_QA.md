# Monster Throne — Stage 2A QA checklist

This file is the single source of truth for the remaining work in Draft PR #11.

## Workflow

1. Work only in branch `codex` and update existing Draft PR #11.
2. Read this file before each pass.
3. Implement only unchecked items from the current pass.
4. Update this file after implementation: mark completed items, record tests and new head SHA.
5. Do not create a new PR. Do not merge or enable auto-merge.

## Current validated baseline

- Sectorized deterministic world works.
- Mobile joystick and touch action buttons work.
- Mobile aim direction and attack cone work.
- Five-second respawn protection works.
- Camp boundary affects only nearby creatures.
- Mobile hotbar, corpse-pile interaction and keyboard bindings were implemented.
- PR remains Draft.

## Completed pass — final Stage 2A stabilization

### A. Mobile layout

- [x] In portrait mobile, topbar, biome status, minimap, toasts, prompt, hotbar, joystick and action buttons must not overlap.
- [x] Use one coordinated mobile layout with shared CSS variables and safe-area insets.
- [x] Support at least 390×844 and 430×932 portrait viewports, plus landscape.
- [x] Use `100dvh` and account for the Safari bottom bar.

### B. Mobile hotbar

- [x] Show at least four complete slots in portrait mode.
- [x] Allow horizontal scrolling for the remaining slots with scroll snap.
- [x] Automatically scroll the selected slot into view.
- [x] Keep slot number, quantity and item name readable; item name may use up to two lines.
- [x] Keep touch targets at least 54×54 CSS px.

### C. Inventory and selected quick slot

- [x] When the selected hotbar slot changes while inventory is open, refresh the dependent inventory buttons immediately.
- [x] Do not rerender the panel every frame.
- [x] Add a regression test for changing the selected slot with inventory open.

### D. Corpse piles

- [x] Empty corpses must not block interaction with corpses that still contain parts.
- [x] `pickupNearby()` and `useNearby()` must choose the nearest corpse with remaining parts.
- [x] Repeated pickup must process all lootable corpses in a pile.
- [x] Do not show “Здесь почти ничего не осталось” when another lootable corpse is nearby.
- [x] Render dense corpse piles with deterministic visual offsets or one grouped label such as `туши ×N · частей M`.
- [x] Keep logical coordinates and save compatibility unchanged.
- [x] Add a regression test with two corpses at identical coordinates: first empty, second lootable.

### E. Camp sanctuary without exploit

- [x] Draw a visible boundary matching the real camp safe radius.
- [x] Creatures cannot cross the boundary, but remain normal active creatures outside it.
- [x] A hero inside the sanctuary cannot damage a target outside it.
- [x] Blocked attacks must not cancel respawn protection.
- [x] Show a throttled message: `Защита лагеря не позволяет атаковать наружу`.
- [x] Traps cannot be placed inside the sanctuary or across its boundary.
- [x] After the hero exits the sanctuary, normal combat and enemy reactions resume.
- [x] Add regression tests for blocked outgoing damage, blocked incoming damage, normal combat outside, distant AI unaffected, and five-second respawn protection.

### F. Control settings

- [x] System menu contains tabs: `Игра`, `Управление`, `Сохранения`.
- [x] Each keyboard action supports two bindings.
- [x] Include movement, attack, dodge, pickup, use, character, inventory, craft, book, pause, system menu, and quick slots 1–8.
- [x] Escape cancels rebinding; Backspace/Delete clears a binding.
- [x] Detect conflicts and allow confirmed replacement.
- [x] Persist bindings in localStorage independently of save slots.
- [x] Add `Сбросить по умолчанию`.
- [x] Add a desktop option to show on-screen action buttons.
- [x] Mobile touch controls remain independent from keyboard bindings.
- [x] Add tests for defaults, two bindings, conflicts, reset and persistence serialization.

## Current pass — manual mobile QA follow-up

Validated manually on iPhone after merge `08182deb6157648533d24915ace6df931b11c1ba`.

### G. Mobile-only settings visibility

- [x] On touch-only/mobile devices, hide the keyboard-binding `Управление` tab and its long desktop key list.
- [x] Keep mobile controls working unchanged; do not imply that keyboard bindings configure touch controls.
- [x] On hybrid devices with a physical keyboard, allow the tab only when a keyboard/fine pointer is detected or through an explicit advanced option.

### H. Mobile camera zoom

- [x] Add two-finger pinch zoom on the game canvas.
- [x] Clamp zoom to a useful range and keep the hero near the camera center.
- [x] Pinch must not trigger attack, selection, joystick or UI buttons.
- [x] Preserve current desktop wheel/mouse behavior if present.
- [x] Save camera zoom locally as a display preference, not in character save data.

### I. Minimap placement

- [x] Keep the minimap fully visible and tappable; it must not sit under hotbar, action buttons, pause banner or other HUD layers.
- [x] Verify portrait 390×844 and 430×932, Safari expanded/collapsed bars, and landscape.

### J. Mobile target lock and aim clarity

- [x] Tapping a creature creates a persistent target lock with a clearly visible selected-target marker.
- [x] Dodge must not clear the selected target unless the target dies, unloads, leaves a defined break distance, or the player explicitly cancels/switches it.
- [x] After dodge, the hero should resume facing/aiming at the locked target.
- [x] When no target is locked, the facing and attack direction must remain visually unambiguous.
- [x] Add regression tests for target persistence through dodge and target cleanup on death/unload/range break.

### K. Sanctuary behavior revision

- [x] Hero attacks from inside the sanctuary may damage creatures outside.
- [x] A creature that detects it cannot damage the protected hero while receiving damage must retreat beyond a safe disengage distance instead of standing at the boundary.
- [x] Retreating creatures must not remain passive targets at the boundary; once safely away they resume normal AI.
- [x] Creatures still cannot cross the sanctuary boundary or damage a protected hero.
- [x] Preserve five-second respawn protection.
- [x] Add tests for retreat-on-unfair-damage, disengage distance and normal AI resumption.

## Stage 2B notes

Detailed future work belongs in `docs/STAGE_2B_BACKLOG.md`.

## Out of scope for the current Stage 2A follow-up

Do not add in this pass:

- bows or crossbows;
- new biomes or large content expansions;
- ecosystem AI redesign;
- story objectives;
- major crafting expansion;
- draggable mobile-control layouts;
- full corpse-container and queued-looting system;
- dash skill progression.

## Required validation

Run locally:

```text
npm run test:v08
node --check hero072/mobile-controls.js
node --check hero072/control-bindings.js
node --check hero072/boot.js
git diff --check
```

Also run new regression tests for mobile visibility, pinch state, minimap layout helpers, target persistence and sanctuary retreat, plus manual browser smoke on:

- 390×844 portrait;
- 430×932 portrait;
- mobile landscape;
- 1366×768 desktop.

## Completion record

- Current checklist created at head: `68db7de6a32baa596d78dbf5b16d8070c1b11640`.
- Latest merged implementation head: `08182deb6157648533d24915ace6df931b11c1ba`.
- Mobile QA follow-up implementation commit: `6eaf8773668b80936d271806798a5d45a5e3e779`.
- PR #13 review-fix commit: `472b9694bfe39a7e8ac550183f417803417db1fa`.
- PR #13 final review-fix commit: `28ec0a00c46b49e0e32aad9d05b8c9a8e846f618`.
- Final review test results (2026-08-03):
  - `npm run test:v08` — passed (23/23 sector, 12/12 hero, 9/9 mobile, 8/8 stabilization, 5/5 bindings, 10/10 mobile follow-up).
  - `node tests/stage2a-mobile-followup.test.js` — 10/10 passed, including logical camera draw/culling bounds and target-to-null UI redraw regressions.
  - `node --check hero072/mobile-controls.js` — passed.
  - `node --check hero072/control-bindings.js` — passed.
  - `node --check hero072/boot.js` — passed.
  - `git diff --check` — passed.
- Review-fix test results (2026-08-03):
  - `npm run test:v08` — passed (23/23 sector, 12/12 hero, 9/9 mobile, 8/8 stabilization, 5/5 bindings, 8/8 mobile follow-up).
  - `node tests/stage2a-mobile-followup.test.js` — 8/8 passed, including replacement-pointer pinch, landscape control clearance, zoom-coordinate mapping and stale-retreat cleanup regressions.
  - `node --check hero072/mobile-controls.js` — passed.
  - `node --check hero072/control-bindings.js` — passed.
  - `node --check hero072/boot.js` — passed.
  - `git diff --check` — passed.
  - Manual browser smoke remains unavailable in this container because it has no browser runtime; viewport and HUD-clearance helpers cover every required viewport programmatically.
- Follow-up test results (2026-08-02):
  - `npm run test:v08` — passed (23/23 sector, 12/12 hero, 9/9 mobile, 8/8 stabilization, 5/5 bindings, 5/5 mobile follow-up).
  - `node tests/stage2a-mobile-followup.test.js` — 5/5 passed (visibility, pinch state, minimap layout, target lock, sanctuary retreat).
  - `node --check hero072/mobile-controls.js` — passed.
  - `node --check hero072/control-bindings.js` — passed.
  - `node --check hero072/boot.js` — passed.
  - `git diff --check` — passed.
  - Browser viewport smoke could not be automated in this container because no browser runtime is installed; deterministic layout coverage includes 390×844, 430×932, mobile landscape and 1366×768.
- Test results (2026-08-02):
  - `npm run test:v08` — passed (23/23 sector, 12/12 hero, 9/9 mobile, 8/8 stabilization, 5/5 bindings).
  - `node tests/sector-world.test.js` — 23/23 passed.
  - `node tests/hero-v072.test.js` — 12/12 passed.
  - `node tests/mobile-controls.test.js` — 9/9 passed.
  - `node tests/stage2a-stabilization.test.js` — 8/8 passed.
  - `node tests/control-bindings.test.js` — 5/5 passed.
  - `node --check hero072/mobile-controls.js` — passed.
  - `node --check hero072/control-bindings.js` — passed.
  - `node --check hero072/boot.js` — passed.
  - `git diff --check` — passed.
  - Manual iPhone QA: core touch controls and respawn protection work; follow-up items G–K remain open.
