# Monster Throne — Stage 2B backlog

This file collects gameplay and progression work that should not be mixed into the current Stage 2A stabilization pass.

## Workflow

1. Keep Stage 2A fixes in `docs/STAGE_2A_QA.md`.
2. Use this file for gameplay systems, progression and content.
3. Split Stage 2B into small implementation passes before coding.
4. Update checkboxes, tests and head SHA after each pass.

## Combat and movement progression

### Dash progression

- [ ] Add dash as a visible trainable skill rather than a fixed utility action.
- [ ] Track dash use, successful evasions and distance avoided.
- [ ] Progression may improve stamina cost, cooldown, distance, recovery or brief evasion frames.
- [ ] Avoid unlimited chain-dashing and preserve meaningful stamina decisions.
- [ ] Explain current dash level and next improvement in the Skills panel.

### Ranged combat

- [ ] Add a basic bow progression after the current spear path.
- [ ] Add arrows, ammunition recovery and appropriate crafting costs.
- [ ] Later consider crossbows, different arrowheads and ranged traps.
- [ ] Preserve manual aiming while supporting sensible mobile target assistance.

### Equipment choices

- [ ] Add meaningful alternatives to the single spear upgrade.
- [ ] Add equipment slots and clear item effects.
- [ ] Provide trade-offs rather than one universally best upgrade path.

## Corpse containers and tactical looting

### Corpse as a container

- [ ] Opening a corpse shows its remaining contents as an inventory-style panel.
- [ ] Player can inspect parts, freshness, weight and known uses before taking them.
- [ ] Player can take selected items, take all, or leave unwanted parts.
- [ ] Multiple corpses in a pile can be switched between without closing the panel.
- [ ] Empty corpses stop being interactive and decay normally.

### Queued looting during tactical pause

- [ ] Tactical pause allows planning transfers without completing them instantly.
- [ ] Selected transfers are shown as a queue.
- [ ] On resume, the hero performs the queued actions over believable time.
- [ ] Actions fail or pause safely if the corpse disappears, danger interrupts, capacity changes or the hero moves away.
- [ ] Add cancellation and queue editing before resume.
- [ ] Do not allow pause to become free teleportation of loot.

## Death and recovery loop

- [ ] Replace consequence-free death with a recoverable loss system.
- [ ] Consider leaving ordinary backpack contents at the death location while preserving equipment, permanent progression and knowledge.
- [ ] Make recovery expeditions meaningful without deleting hours of progress.
- [ ] Communicate exactly what is retained and lost.

## World goals and exploration

- [ ] Add meaningful destinations away from the first camp.
- [ ] Add points of interest, rare resources and escalating regional threats.
- [ ] Add a reason to reach the middle or distant parts of the island.
- [ ] Consider temporary camps or additional safe locations with costs and limitations.

## Ecosystem AI

- [ ] Predators choose and pursue prey, not only the hero.
- [ ] Grazers, predators and scavengers interact with carcasses and each other.
- [ ] Creatures maintain targets, hunger, retreat conditions and territorial behavior.
- [ ] Predators should not ignore easy prey while unrealistically following the hero forever.
- [ ] Preserve deterministic sector persistence.

## Biome identity

- [ ] Give each biome unique resource combinations, hazards, creatures and reasons to visit.
- [ ] Reduce the feeling that biomes are only different ground colors.
- [ ] Add discoveries and recipes tied to particular environments.

## Crafting and item usefulness

- [ ] Expand uses for bone, hide, poison glands and other materials.
- [ ] Avoid recipes that create permanently useless surplus items.
- [ ] Explain tool bonuses and whether duplicates matter.
- [ ] Add branching upgrades and recipes discovered through experimentation.

## Future presentation

- [ ] Improve visual readability before large art investment.
- [ ] Consider richer 2D art first; evaluate 3D only after the gameplay loop is strong.

## Source of current notes

Manual QA on desktop and iPhone, 2026-08-02.
