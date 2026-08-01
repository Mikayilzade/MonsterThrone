'use strict';
const assert=require('assert');
const world=require('../hero072/sector-world.js');
let passed=0;
function test(name,fn){fn();passed++;console.log(`✓ ${name}`);}
const options={seed:'stage-2a-test'};

test('same seed creates byte-identical sectors',()=>assert.deepStrictEqual(world.generateSector(7,9,options),world.generateSector(7,9,options)));
test('different seeds produce different sector contents',()=>assert.notDeepStrictEqual(world.generateSector(7,9,options),world.generateSector(7,9,{seed:'other'})));
test('biome transitions agree across sector edges',()=>{
  const c=world.createConfig(options),x=8*c.sectorSize;
  for(let y=3000;y<9000;y+=37)assert.strictEqual(world.terrainAt(x-.001,y,c),world.terrainAt(x+.001,y,c));
});
test('round island sea is impassable and has no rectangular edge',()=>{
  const c=world.createConfig(options);assert(world.isLand(c.cx+c.radius-200,c.cy,c));assert(!world.isLand(c.cx+c.radius+1,c.cy,c));assert(!world.isLand(c.cx+c.radius*.8,c.cy+c.radius*.8,c));
});
test('unload and restore keeps state without duplicate ids',()=>{
  const m=new world.SectorManager(options);m.update(8400,8400);const first=m.activeEntities()[0];assert(first);m.upsert({...first,armed:true});m.update(14000,8400);m.update(8400,8400);
  assert.strictEqual(m.activeEntities().filter(e=>e.uid===first.uid).length,1);assert.strictEqual(m.activeEntities().find(e=>e.uid===first.uid).armed,true);
});
test('collected resource stays removed after unload and save/load',()=>{
  const m=new world.SectorManager(options);m.update(8400,8400);const item=m.activeEntities().find(e=>e.kind==='plant'||e.kind==='resource');assert(item);m.remove(item.uid);m.update(14000,8400);
  const copy=new world.SectorManager(options);copy.restore(m.serialize());copy.update(8400,8400);assert(!copy.activeEntities().some(e=>e.uid===item.uid));
});
test('installed and disarmed trap state survives',()=>{
  const m=new world.SectorManager(options);m.update(8400,8400);m.upsert({uid:'player:trap:1',kind:'trap',id:'simple_trap',x:8420,y:8420,armed:true});m.upsert({uid:'player:trap:1',kind:'trap',id:'simple_trap',x:8420,y:8420,armed:false});
  const copy=new world.SectorManager(options);copy.restore(m.serialize());copy.update(8400,8400);assert.strictEqual(copy.activeEntities().find(e=>e.uid==='player:trap:1').armed,false);
});
test('visited sectors survive save/load',()=>{const m=new world.SectorManager(options);m.update(8400,8400);m.update(11000,8400);const copy=new world.SectorManager(options);copy.restore(m.serialize());assert.deepStrictEqual([...copy.visited].sort(),[...m.visited].sort());});
test('long travel keeps detailed and loaded object counts bounded',()=>{
  const m=new world.SectorManager(options);let peak=0;for(let x=1000;x<15800;x+=160)m.update(x,8400),peak=Math.max(peak,m.debug().activeObjects);
  assert(m.debug().activeSectors<=9);assert(m.debug().loadedSectors<=25);assert.strictEqual(m.debug().savedSectors,0);assert(peak<250);
});
test('NaN coordinates are rejected',()=>{const m=new world.SectorManager(options);assert.strictEqual(m.update(NaN,1),false);assert.strictEqual(m.upsert({uid:'bad',x:NaN,y:1}),false);});
test('restore resets current sector and immediately hydrates restored data',()=>{
  const m=new world.SectorManager(options);m.update(8400,8400);m.upsert({uid:'trap:restore',kind:'trap',x:8420,y:8420,armed:true});const save=m.serialize();
  m.update(12000,8400);m.restore(save);assert.strictEqual(m.current,null);m.update(8400,8400);assert.strictEqual(m.activeEntities().filter(e=>e.uid==='trap:restore').length,1);
});
test('moving an entity between sectors never leaves a duplicate behind',()=>{
  const m=new world.SectorManager(options);m.update(8400,8400);m.upsert({uid:'moving',kind:'trap',x:8420,y:8420});m.upsert({uid:'moving',kind:'trap',x:9060,y:8420});
  let count=0;for(const s of m.loaded.values())count+=s.entities.filter(e=>e.uid==='moving').length;for(const s of m.saved.values())count+=s.entities.filter(e=>e.uid==='moving').length;assert.strictEqual(count,1);
});
test('blocked water movement never teleports to the distant shore',()=>{
  const c=world.createConfig(options),x=c.cx+c.radius-2,y=c.cy,result=world.resolveLandMove(x,y,100,0,c);
  assert.deepStrictEqual(result,{x,y,moved:false});assert(Math.hypot(result.x-x,result.y-y)<1);
});
test('invalid movement keeps the last finite position',()=>{const c=world.createConfig(options);assert.deepStrictEqual(world.resolveLandMove(10,20,NaN,1,c),{x:10,y:20,moved:false});});
console.log(`\n${passed}/14 sector world tests passed.`);
