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
test('upsert removes every stale duplicate from loaded and saved sectors',()=>{
  const m=new world.SectorManager(options);m.update(8400,8400);const duplicate={uid:'duplicate',kind:'trap',x:8420,y:8420};
  m.getSector(13,13).entities.push({...duplicate});m.getSector(14,13).entities.push({...duplicate,x:9060});m.saved.set('saved-copy',{id:'saved-copy',sx:2,sy:2,entities:[{...duplicate,x:1300,y:1300}]});
  m.upsert({...duplicate,x:9700});let count=0;for(const s of m.loaded.values())count+=s.entities.filter(e=>e.uid==='duplicate').length;for(const s of m.saved.values())count+=s.entities.filter(e=>e.uid==='duplicate').length;assert.strictEqual(count,1);
});
test('active entity crossing into a loaded neighbor is not dropped',()=>{
  const m=new world.SectorManager(options);m.update(8400,8400);m.replaceActiveEntities([{uid:'crossing',kind:'creature',type:'wolf',x:9700,y:8420}]);
  m.update(9700,8420);assert.strictEqual(m.activeEntities().filter(e=>e.uid==='crossing').length,1);
});
test('blocked water movement never teleports to the distant shore',()=>{
  const c=world.createConfig(options),x=c.cx+c.radius-2,y=c.cy,result=world.resolveLandMove(x,y,100,0,c);
  assert.deepStrictEqual(result,{x,y,moved:false});assert(Math.hypot(result.x-x,result.y-y)<1);
});
test('invalid movement keeps the last finite position',()=>{const c=world.createConfig(options);assert.deepStrictEqual(world.resolveLandMove(10,20,NaN,1,c),{x:10,y:20,moved:false});});
test('movement cannot tunnel across a narrow inland water channel',()=>{
  const c=world.createConfig(options),start={x:6360,y:1200},end={x:6460,y:1200};assert(world.isLand(start.x,start.y,c));assert(world.isLand(end.x,end.y,c));
  assert.strictEqual(world.pathIsLand(start.x,start.y,end.x,end.y,c),false);assert.strictEqual(world.resolveLandMove(start.x,start.y,end.x-start.x,0,c).moved,false);
});
test('serialized snapshots do not alias later manager mutations',()=>{
  const m=new world.SectorManager(options);m.update(8400,8400);m.upsert({uid:'snapshot',kind:'trap',x:8420,y:8420,armed:true});const save=m.serialize();m.upsert({uid:'snapshot',kind:'trap',x:8420,y:8420,armed:false});
  const restored=new world.SectorManager(options);restored.restore(save);restored.update(8400,8400);assert.strictEqual(restored.activeEntities().find(e=>e.uid==='snapshot').armed,true);
});
test('restore rejects sector data from another generator version',()=>{const m=new world.SectorManager(options);assert.throws(()=>m.restore({version:'future',seed:options.seed}),/version/);});
test('two biomes visited inside one sector are both recorded once',()=>{
  const c=world.createConfig(options),a={x:7510,y:450},b={x:7610,y:590},ca=world.sectorCoords(a.x,a.y,c),cb=world.sectorCoords(b.x,b.y,c),visited=[];
  assert.deepStrictEqual(ca,cb);const first=world.terrainAt(a.x,a.y,c),second=world.terrainAt(b.x,b.y,c);assert.notStrictEqual(first,second);
  assert(world.recordBiomeVisit(visited,first));assert(world.recordBiomeVisit(visited,second));assert(!world.recordBiomeVisit(visited,second));assert.deepStrictEqual(visited,[first,second]);
});
test('creature update preflight separates invalid coordinates before simulation',()=>{
  const c=world.createConfig(options),valid={uid:'valid',x:c.camp.x,y:c.camp.y},nan={uid:'nan',x:NaN,y:c.camp.y},water={uid:'water',x:0,y:0};
  const result=world.partitionLandEntities([nan,valid,water],c);assert.deepStrictEqual(result.valid,[valid]);assert.deepStrictEqual(result.removed,[nan,water]);
});
test('legacy hero with invalid, outside, or water coordinates returns to camp',()=>{
  const c=world.createConfig(options);for(const hero of [{x:NaN,y:1},{x:-1,y:c.cy},{x:0,y:0}])assert.deepStrictEqual(world.safeLandPoint(hero,c.camp,c),c.camp);
  const valid={x:c.camp.x+20,y:c.camp.y};assert.deepStrictEqual(world.safeLandPoint(valid,c.camp,c),valid);
});
test('legacy migration excludes invalid and water entities',()=>{
  const c=world.createConfig(options),valid={uid:'valid',x:c.camp.x+30,y:c.camp.y},entities=[valid,{uid:'nan',x:NaN,y:4},{uid:'outside',x:c.size+1,y:c.cy},{uid:'water',x:0,y:0}];
  assert.deepStrictEqual(world.sanitizeLegacyEntities(entities,c),[valid]);
});
console.log(`\n${passed}/23 sector world tests passed.`);
