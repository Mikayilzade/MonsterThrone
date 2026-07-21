'use strict';

const assert = require('assert');
const {
  World,
  levelSupport,
  ringForLevel,
  soulDamageForStreak,
  helpers,
  CONFIG
} = require('./core.js');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function approx(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message || 'values differ'}: ${actual} vs ${expected}`);
}

function stats(value) {
  return { strength: value, endurance: value, agility: value, intellect: value };
}

function createSandboxCreature(world, overrides = {}) {
  const expressed = overrides.expressed || stats(100);
  const latent = overrides.latent || stats(100);
  const creature = world.createCreature({
    speciesId: overrides.speciesId || 'leafhorn',
    x: overrides.x ?? world.center.x + world.radius * 0.9,
    y: overrides.y ?? world.center.y,
    age: overrides.age ?? 800,
    expressed,
    latent,
    maturationReserve: overrides.maturationReserve || stats(0),
    generation: overrides.generation || 0,
    parents: overrides.parents || [],
    bornNaturally: false
  });
  creature.progression.currentLevelFraction = 0;
  creature.energy = 95;
  creature.hunger = 5;
  creature.reproductionCooldown = 0;
  world.refreshCreature(creature);
  creature.hp = creature.maxHp;
  return creature;
}

test('same seed is deterministic', () => {
  const a = new World({ seed: 777 });
  const b = new World({ seed: 777 });
  a.run(900, 3);
  b.run(900, 3);
  assert.strictEqual(a.deterministicDigest(), b.deterministicDigest());
});

test('different seeds create different worlds', () => {
  const a = new World({ seed: 111 });
  const b = new World({ seed: 112 });
  assert.notStrictEqual(a.deterministicDigest(), b.deterministicDigest());
});

test('level rings use the accepted ranges', () => {
  assert.strictEqual(ringForLevel(1).id, 'edge');
  assert.strictEqual(ringForLevel(89).id, 'edge');
  assert.strictEqual(ringForLevel(90).id, 'low');
  assert.strictEqual(ringForLevel(474).id, 'middle');
  assert.strictEqual(ringForLevel(899).id, 'inner');
  assert.strictEqual(ringForLevel(999).id, 'crown');
});

test('soft bottleneck rejects one-stat exploitation', () => {
  const profile = {
    supportWeights: { strength: 0.25, endurance: 0.25, agility: 0.25, intellect: 0.25 },
    statCost: { strength: 10, endurance: 10, agility: 10, intellect: 10 },
    bodyEfficiency: 1,
    powerMeanExponent: 0.25
  };
  const balanced = levelSupport(stats(1000), profile);
  const extreme = levelSupport({ strength: 3970, endurance: 10, agility: 10, intellect: 10 }, profile);
  assert.ok(extreme < balanced * 0.6, `extreme=${extreme}, balanced=${balanced}`);
});

test('level support is homogeneous under 10% death scaling', () => {
  const species = CONFIG.SPECIES.stoneback;
  const profile = {
    supportWeights: species.supportWeights,
    statCost: species.statCost,
    bodyEfficiency: species.bodyEfficiency,
    powerMeanExponent: 0.25
  };
  const original = levelSupport({ strength: 1320, endurance: 910, agility: 360, intellect: 440 }, profile);
  const reduced = levelSupport({ strength: 1188, endurance: 819, agility: 324, intellect: 396 }, profile);
  approx(reduced / original, 0.9, 1e-12, 'death scaling should be exact');
});

test('temporary power does not raise supported cap', () => {
  const world = new World({ seed: 1, initialize: false });
  const creature = createSandboxCreature(world);
  const cap = creature.supportedLevelCap;
  creature.temporary.stats.strength += 100000;
  creature.temporary.stats.endurance += 100000;
  world.refreshCreature(creature);
  assert.strictEqual(creature.supportedLevelCap, cap);
  assert.ok(world.effectiveLevel(creature) > creature.level);
});

test('base maturation is one level per 60 seconds when runway exists', () => {
  const world = new World({ seed: 2, initialize: false, actionInterval: 9999 });
  const creature = createSandboxCreature(world, { expressed: stats(100), latent: stats(500) });
  const before = creature.level;
  world.run(59, 1);
  assert.strictEqual(creature.level, before);
  world.run(1, 1);
  assert.strictEqual(creature.level, before + 1);
});

test('victory impulse is capped at +300%', () => {
  const world = new World({ seed: 3, initialize: false });
  const killer = createSandboxCreature(world, { expressed: stats(100), latent: stats(2000) });
  const victim = createSandboxCreature(world, { speciesId: 'stoneback', expressed: stats(20000), latent: stats(0) });
  world.grantVictoryImpulse(killer, victim);
  assert.ok(killer.progression.strongestImpulse);
  assert.ok(killer.progression.strongestImpulse.baseBonusPct <= 300);
});

test('ordinary death moves 10% expressed strength back to latent', () => {
  const world = new World({ seed: 4, initialize: false });
  const creature = createSandboxCreature(world, { expressed: { strength: 1200, endurance: 900, agility: 600, intellect: 400 }, latent: stats(0) });
  const beforeLevel = creature.level;
  const beforeTotal = helpers.totalPotential(creature);
  world.killCreature(creature, null, 'test');
  const afterTotal = helpers.totalPotential(creature);
  for (const stat of CONFIG.STATS) approx(afterTotal[stat], beforeTotal[stat], 1e-8, `${stat} total should remain`);
  approx(creature.level / beforeLevel, 0.9, 0.025, 'level should drop by about 10%');
  assert.strictEqual(creature.soul.integrity, 93);
  assert.strictEqual(creature.soul.deathStreak, 1);
});

test('soul damage sequence is fixed', () => {
  assert.deepStrictEqual([0, 1, 2, 3, 4, 5].map(soulDamageForStreak), [7, 11, 16, 24, 35, 53]);
  assert.strictEqual(soulDamageForStreak(20), 53);
});

test('rebirth happens in the ring of the reduced level', () => {
  const world = new World({ seed: 5, initialize: false, actionInterval: 9999 });
  const creature = createSandboxCreature(world, { speciesId: 'stoneback', expressed: stats(1000), latent: stats(0) });
  world.killCreature(creature, null, 'test');
  const expectedRing = ringForLevel(creature.level).id;
  const wait = creature.rebirthAt - world.time + 1;
  world.run(wait, 1);
  assert.ok(creature.alive);
  assert.strictEqual(world.localRingAt(creature.x, creature.y).id, expectedRing);
  assert.ok(creature.rebirthGraceUntil > world.time);
});

test('offspring receives a new soul and permanent number', () => {
  const world = new World({ seed: 6, initialize: false, maxCreatures: 20 });
  const a = createSandboxCreature(world, { speciesId: 'leafhorn', x: 100, y: 100, age: 900 });
  const b = createSandboxCreature(world, { speciesId: 'leafhorn', x: 104, y: 100, age: 900 });
  a.sex = 'A';
  b.sex = 'B';
  const before = world.creatures.length;
  world.reproduce(a, b);
  assert.ok(world.creatures.length > before);
  const child = world.creatures[before];
  assert.notStrictEqual(child.soulId, a.soulId);
  assert.notStrictEqual(child.soulId, b.soulId);
  assert.deepStrictEqual(child.parents, [a.id, b.id]);
  assert.ok(a.children.includes(child.id));
});

test('fresh carcass grants latent potential and temporary power below 900', () => {
  const world = new World({ seed: 7, initialize: false });
  const eater = createSandboxCreature(world, { speciesId: 'bonebeak', expressed: stats(100), latent: stats(0), x: 100, y: 100 });
  const donor = createSandboxCreature(world, { speciesId: 'stoneback', expressed: stats(2000), latent: stats(0), x: 100, y: 100 });
  const carcass = world.createCarcass(donor, 'test');
  const latentBefore = eater.potential.latent.strength;
  const tempBefore = eater.temporary.stats.strength;
  world.eatCarcass(eater, carcass);
  assert.ok(eater.potential.latent.strength > latentBefore);
  assert.ok(eater.temporary.stats.strength > tempBefore);
});

test('mutation changes the latent potential and is visible', () => {
  const world = new World({ seed: 8, initialize: false });
  const creature = createSandboxCreature(world, { latent: stats(0) });
  const before = helpers.totalPotential(creature);
  const mutation = world.applyRandomMutation(creature, 'test');
  const after = helpers.totalPotential(creature);
  assert.ok(mutation);
  assert.ok(creature.body.mutations.length === 1);
  assert.ok(CONFIG.STATS.some((stat) => Math.abs(after[stat] - before[stat]) > 0.01));
});

test('inspector snapshot exposes all progression layers', () => {
  const world = new World({ seed: 9 });
  const creature = world.aliveCreatures()[0];
  const snapshot = world.creatureSnapshot(creature);
  for (const key of ['level', 'effectiveLevel', 'supportedLevelCap', 'expressedStats', 'latentStats', 'temporaryStats', 'soul', 'organs', 'skills', 'history']) {
    assert.ok(Object.prototype.hasOwnProperty.call(snapshot, key), `missing ${key}`);
  }
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

console.log(`\n${passed}/${tests.length} tests passed`);
if (passed !== tests.length) process.exitCode = 1;
