'use strict';

const assert = require('assert');
const { World, CONFIG } = require('./core.js');

const seeds = [19072026, 4042026, 999041];
const reports = [];
let checksPassed = 0;
let checksTotal = 0;

function check(condition, message) {
  checksTotal += 1;
  if (!condition) throw new Error(message);
  checksPassed += 1;
}

for (const seed of seeds) {
  const world = new World({ seed });
  const started = Date.now();
  world.run(2 * 3600, 5);
  const elapsedMs = Date.now() - started;
  const summary = world.summary();

  const counts = Object.values(summary.species);
  check(counts.every((count) => count > 0), `seed ${seed}: a species disappeared`);
  check(summary.alive >= 90 && summary.alive <= 280, `seed ${seed}: unhealthy population ${summary.alive}`);
  check(summary.metrics.deaths > 0 && summary.metrics.rebirths > 0, `seed ${seed}: death/rebirth loop inactive`);
  check(summary.metrics.permanentPotentialAbsorbed > 0, `seed ${seed}: no permanent potential absorption`);
  check(summary.metrics.temporaryPowerEvents > 0, `seed ${seed}: no temporary power events`);
  check(summary.metrics.levelUps > 0, `seed ${seed}: no level maturation`);
  check(summary.atCapRatio >= 0.45 && summary.atCapRatio <= 1, `seed ${seed}: unexpected at-cap ratio ${summary.atCapRatio}`);
  check(summary.meanSoul > 55, `seed ${seed}: souls collapse too quickly (${summary.meanSoul})`);
  check(elapsedMs < 15000, `seed ${seed}: headless run too slow (${elapsedMs} ms)`);

  reports.push({ seed, elapsedMs, ...summary });
}

assert.strictEqual(checksPassed, checksTotal);
console.log(JSON.stringify({
  version: CONFIG.VERSION,
  scenarioHours: 2,
  seeds,
  checks: `${checksPassed}/${checksTotal}`,
  reports
}, null, 2));
