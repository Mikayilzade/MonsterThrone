'use strict';
const assert = require('assert');
const UI = require('./ui-helpers.js');

assert.strictEqual(UI.translateAction('flee'), 'убегает');
assert.strictEqual(UI.translateReason('nearby superior threat'), 'рядом находится значительно более сильная угроза');
assert.strictEqual(UI.translateCause('starvation'), 'голод');
assert.ok(UI.translateText('death by starvation').includes('смерть'));
assert.strictEqual(UI.formatTime(3723), '01:02:03');
assert.strictEqual(UI.creatureTitle({ id: 'C95', number: 95 }, { name: 'Костеклюв' }), 'Костеклюв №95');

const nearest = UI.findNearest(100, 100, [
  { id: 'a', screenX: 120, screenY: 100, hitRadius: 22 },
  { id: 'b', screenX: 106, screenY: 104, hitRadius: 22 }
]);
assert.strictEqual(nearest.id, 'b');

const world = {
  center: { x: 50, y: 50 },
  radius: 50,
  aliveCreatures() {
    return [
      { id: 'inside', x: 60, y: 60, alive: true },
      { id: 'near', x: 99, y: 50, alive: true },
      { id: 'outside', x: 108, y: 50, alive: true }
    ];
  }
};
const diagnostics = UI.boundaryDiagnostics(world);
assert.strictEqual(diagnostics.outside.length, 1);
assert.strictEqual(diagnostics.nearBoundary.length, 1);

const explanation = UI.explainCreature(
  { id: 'C1', number: 1, action: 'wander', reason: 'no more urgent goal', hunger: 20, energy: 80, hp: 90, maxHp: 100, level: 10, supportedLevelCap: 12, alive: true },
  { level: 10, supportedLevelCap: 12, hunger: 20, energy: 80, hp: 90, maxHp: 100 },
  { name: 'Листорог', diet: 'herbivore', social: 'herd' }
);
assert.ok(explanation.headline.includes('бродит'));
assert.ok(explanation.details.some((line) => line.includes('запас')));

console.log('10/10 ui helper checks passed');
