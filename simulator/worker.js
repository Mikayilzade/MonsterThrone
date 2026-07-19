'use strict';
importScripts('core.js');
const Core = self.MonsterWorldCore;

self.onmessage = function (event) {
  try {
    const baseSeed = event.data.seed || 1;
    const checks = [];
    const add = (name, pass, details) => checks.push({ name, pass: !!pass, details });

    const sameA = new Core.World({ seed: baseSeed, areaScale: 2 });
    const sameB = new Core.World({ seed: baseSeed, areaScale: 2 });
    sameA.runFor(180, 1); sameB.runFor(180, 1);
    add('Одинаковый seed воспроизводим', sameA.stateHash() === sameB.stateHash(), sameA.stateHash());

    const different = new Core.World({ seed: baseSeed + 1, areaScale: 2 });
    different.runFor(180, 1);
    add('Другой seed создаёт другой мир', sameA.stateHash() !== different.stateHash(), different.stateHash());

    const scales = [1, 2, 4].map(areaScale => {
      const world = new Core.World({ seed: baseSeed + 20, areaScale });
      const initial = world.creatures.length;
      const started = performance.now();
      world.runFor(1200, 1);
      const summary = world.summary();
      return { areaScale, initial, summary, ms: performance.now() - started };
    });
    add('Все размеры карты сохраняют популяцию', scales.every(r => r.summary.alive >= r.initial * .65), scales.map(r => `${r.areaScale}×: ${r.summary.alive}`).join(', '));
    add('На широкой карте меньше атак', scales[0].summary.metrics.attacks > scales[2].summary.metrics.attacks, `${scales[0].summary.metrics.attacks} → ${scales[2].summary.metrics.attacks}`);
    add('Стаи реально атакуют', scales.every(r => r.summary.metrics.packAttacks > 0), scales.map(r => r.summary.metrics.packAttacks).join(', '));
    add('Чужие расы имеют приоритет', scales.every(r => {
      const m=r.summary.metrics; const total=m.foreignAttacks+m.sameFactionAttacks; return total && m.foreignAttacks/total>.70;
    }), scales.map(r => {const m=r.summary.metrics;return `${Math.round(100*m.foreignAttacks/Math.max(1,m.foreignAttacks+m.sameFactionAttacks))}%`;}).join(', '));
    add('Дуэли могут закончиться уступкой', scales.some(r => r.summary.metrics.duelSurrenders > 0), scales.map(r => r.summary.metrics.duelSurrenders).join(', '));
    add('Пауза/интерфейс не блокируются тестом', scales.every(r => r.ms < 6000), scales.map(r => `${Math.round(r.ms)}ms`).join(', '));

    const meat = new Core.World({ seed: 8, includeFactions:false, includeNeutralWildlife:false, initialNeutralPopulation:{} });
    const eater=meat.spawnCreature('RazorBeetle',{energy:0}); const victim=meat.spawnCreature('StoneOgre',{stats:meat.scaledStats('StoneOgre',750)});
    const before=Core.combatPower(eater); meat.killCreature(victim,null); eater.x=meat.corpses[0].x;eater.y=meat.corpses[0].y;meat.eatCorpse(eater,meat.corpses[0]);
    add('Свежее мясо вершины даёт имба-буст', Core.combatPower(eater)>before*2, `${before.toFixed(0)} → ${Core.combatPower(eater).toFixed(0)}`);

    self.postMessage({ total: checks.length, passed: checks.filter(c=>c.pass).length, checks });
  } catch (error) {
    self.postMessage({ error: error.stack || String(error) });
  }
};
