'use strict';
const assert=require('assert');
const rules=require('../hero072/rules.js');

let passed=0;
function test(name,fn){
  try{fn();passed++;console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}
}

const base={weapon:'spear',strength:10,agility:10,mastery:0,readiness:35,tempPower:0,enemyDefense:2,quality:1};

test('mastery changes the same combat profile used by UI and damage',()=>{
  const novice=rules.combatProfile(base);
  const trained=rules.combatProfile({...base,mastery:52.9,readiness:98});
  assert(trained.minDamage>novice.minDamage);
  assert(trained.maxDamage>novice.maxDamage);
  assert(trained.attackInterval<novice.attackInterval);
  assert(trained.accuracy>novice.accuracy);
  assert(trained.masteryBonus>0.35&&trained.masteryBonus<0.5);
});

test('stronger weapon improves real damage and range',()=>{
  const plain=rules.combatProfile({...base,mastery:30,readiness:80});
  const improved=rules.combatProfile({...base,weapon:'improved_spear',mastery:30,readiness:80,quality:1.12});
  assert(improved.minDamage>plain.minDamage);
  assert(improved.range>plain.range);
});

test('enemy defense is included exactly once',()=>{
  const unarmored=rules.combatProfile({...base,enemyDefense:0});
  const armored=rules.combatProfile({...base,enemyDefense:6});
  assert.strictEqual(unarmored.minDamage-armored.minDamage,6);
  assert.strictEqual(unarmored.maxDamage-armored.maxDamage,6);
});

const recipes=[
  {id:'rope',needs:{fiber:3},out:{rope:1}},
  {id:'bone_tip',needs:{bone:1,stone:1},out:{bone_tip:1}},
  {id:'bone_knife',needs:{bone:2,stone:1,fiber:1},out:{bone_knife:1}},
  {id:'improved_spear',needs:{spear:1,bone_tip:1,rope:1},out:{improved_spear:1}},
  {id:'simple_trap',needs:{branch:2,stone:1,rope:1},out:{simple_trap:1}},
  {id:'bandage',needs:{fiber:2,bloodleaf:1},out:{bandage:1}},
  {id:'roasted_root',needs:{root:1},out:{roasted_root:1}},
  {id:'cooked_meat',needs:{raw_meat:1},out:{cooked_meat:1}}
];

test('every required recipe consumes exact materials',()=>{
  for(const recipe of recipes){
    const inv={};
    for(const [id,n] of Object.entries(recipe.needs))inv[id]=n;
    const result=rules.applyRecipe(inv,recipe,1);
    assert(result.ok,recipe.id);
    for(const id of Object.keys(recipe.needs))assert.strictEqual(result.inventory[id],undefined,`${recipe.id}:${id}`);
    for(const [id,n] of Object.entries(recipe.out))assert.strictEqual(result.inventory[id],n,`${recipe.id}:${id}`);
  }
});

test('bulk crafting and Max use the limiting material',()=>{
  const recipe=recipes.find(r=>r.id==='simple_trap');
  const inv={branch:11,stone:8,rope:4};
  assert.strictEqual(rules.maxCraftable(inv,recipe),4);
  const result=rules.applyRecipe(inv,recipe,4);
  assert(result.ok);
  assert.deepStrictEqual(result.inventory,{branch:3,stone:4,simple_trap:4});
});

test('failed bulk craft does not mutate inventory',()=>{
  const recipe=recipes.find(r=>r.id==='bone_knife');
  const inv={bone:3,stone:2,fiber:1};
  const result=rules.applyRecipe(inv,recipe,2);
  assert(!result.ok);
  assert.deepStrictEqual(result.inventory,inv);
});

test('v0.7 hero migrates with weapon, notes and hotbar',()=>{
  const old={inv:{spear:1,simple_trap:2},hotbar:['spear','simple_trap'],knowledge:{plants:{},enemies:{},reactions:[]}};
  const migrated=rules.migrateHero(old);
  assert.strictEqual(migrated.equipment.weapon,'spear');
  assert.strictEqual(migrated.hotbar.length,8);
  assert.deepStrictEqual(migrated.knowledge.experimentNotes,[]);
});

test('improved weapon survives JSON save round trip',()=>{
  const hero=rules.migrateHero({inv:{improved_spear:1},hotbar:['improved_spear'],equipment:{weapon:'improved_spear'},weaponQuality:{improved_spear:1.17},knowledge:{}});
  const loaded=rules.migrateHero(JSON.parse(JSON.stringify(hero)));
  assert.strictEqual(loaded.equipment.weapon,'improved_spear');
  assert.strictEqual(loaded.weaponQuality.improved_spear,1.17);
  assert.strictEqual(loaded.inv.improved_spear,1);
});

test('next threshold is understandable and monotonic',()=>{
  assert.strictEqual(rules.nextSkillThreshold(0),25);
  assert.strictEqual(rules.nextSkillThreshold(52.9),75);
  const now=rules.combatProfile({...base,mastery:52.9,readiness:98});
  const next=rules.combatProfile({...base,mastery:75,readiness:98});
  assert(next.maxDamage>=now.maxDamage);
});

console.log(`\n${passed}/9 hero v0.7.2 tests passed.`);
