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
- PR remains Draft.

## Current pass — final Stage 2A stabilization

### A. Mobile layout

- [ ] In portrait mobile, topbar, biome status, minimap, toasts, prompt, hotbar, joystick and action buttons must not overlap.
- [ ] Use one coordinated mobile layout with shared CSS variables and safe-area insets.
- [ ] Support at least 390×844 and 430×932 portrait viewports, plus landscape.
- [ ] Use `100dvh` and account for the Safari bottom bar.

### B. Mobile hotbar

- [ ] Show at least four complete slots in portrait mode.
- [ ] Allow horizontal scrolling for the remaining slots with scroll snap.
- [ ] Automatically scroll the selected slot into view.
- [ ] Keep slot number, quantity and item name readable; item name may use up to two lines.
- [ ] Keep touch targets at least 54×54 CSS px.

### C. Inventory and selected quick slot

- [ ] When the selected hotbar slot changes while inventory is open, refresh the dependent inventory buttons immediately.
- [ ] Do not rerender the panel every frame.
- [ ] Add a regression test for changing the selected slot with inventory open.

### D. Corpse piles

- [ ] Empty corpses must not block interaction with corpses that still contain parts.
- [ ] `pickupNearby()` and `useNearby()` must choose the nearest corpse with remaining parts.
- [ ] Repeated pickup must process all lootable corpses in a pile.
- [ ] Do not show “Здесь почти ничего не осталось” when another lootable corpse is nearby.
- [ ] Render dense corpse piles with deterministic visual offsets or one grouped label such as `туши ×N · частей M`.
- [ ] Keep logical coordinates and save compatibility unchanged.
- [ ] Add a regression test with two corpses at identical coordinates: first empty, second lootable.

### E. Camp sanctuary without exploit

- [ ] Draw a visible boundary matching the real camp safe radius.
- [ ] Creatures cannot cross the boundary, but remain normal active creatures outside it.
- [ ] A hero inside the sanctuary cannot damage a target outside it.
- [ ] Blocked attacks must not cancel respawn protection.
- [ ] Show a throttled message: `Защита лагеря не позволяет атаковать наружу`.
- [ ] Traps cannot be placed inside the sanctuary or across its boundary.
- [ ] After the hero exits the sanctuary, normal combat and enemy reactions resume.
- [ ] Add regression tests for blocked outgoing damage, blocked incoming damage, normal combat outside, distant AI unaffected, and five-second respawn protection.

### F. Control settings

- [ ] System menu contains tabs: `Игра`, `Управление`, `Сохранения`.
- [ ] Each keyboard action supports two bindings.
- [ ] Include movement, attack, dodge, pickup, use, character, inventory, craft, book, pause, system menu, and quick slots 1–8.
- [ ] Escape cancels rebinding; Backspace/Delete clears a binding.
- [ ] Detect conflicts and allow confirmed replacement.
- [ ] Persist bindings in localStorage independently of save slots.
- [ ] Add `Сбросить по умолчанию`.
- [ ] Add a desktop option to show on-screen action buttons.
- [ ] Mobile touch controls remain independent from keyboard bindings.
- [ ] Add tests for defaults, two bindings, conflicts, reset and persistence serialization.

## Out of scope for Stage 2A

Do not add in this pass:

- bows or crossbows;
- new biomes or large content expansions;
- ecosystem AI redesign;
- story objectives;
- major crafting expansion;
- draggable mobile-control layouts.

These belong to Stage 2B.

## Required validation

Run locally:

```text
node tests/sector-world.test.js
node tests/hero-v072.test.js
node tests/mobile-controls.test.js
node --check hero072/mobile-controls.js
node --check hero072/boot.js
git diff --check
```

Also run any new corpse, sanctuary and control-binding tests, plus a browser smoke test on:

- 390×844 portrait;
- 430×932 portrait;
- mobile landscape;
- 1366×768 desktop.

## Completion record

- Current checklist created at head: `68db7de6a32baa596d78dbf5b16d8070c1b11640`.
- Latest implementation head: not yet recorded.
- Test results: not yet recorded.
