'use strict';

const { World } = require('./core.js');

const world = new World();
const durationSeconds = Number(process.argv[2] || 7200);
const step = 0.5;

for (let t = 0; t < durationSeconds; t += step) world.step(step);

const summary = world.summary();
console.log(JSON.stringify({
  simulatedTime: summary.timeText,
  alive: summary.alive,
  corpses: summary.corpses,
  deaths: summary.metrics.deaths,
  rebirths: summary.metrics.rebirths,
  bites: summary.metrics.bites,
  spoiledTransitions: summary.metrics.spoiledTransitions,
  decomposedTransitions: summary.metrics.decomposedTransitions,
  eatenToBones: summary.metrics.eatenToBones,
  strongest: summary.top.map(c => ({
    id: c.id,
    species: c.label,
    level: c.level,
    kills: c.kills,
    deaths: c.deaths,
    eatenMass: Number(c.eatenMass.toFixed(1))
  }))
}, null, 2));
