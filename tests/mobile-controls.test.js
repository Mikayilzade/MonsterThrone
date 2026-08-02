'use strict';
const assert=require('assert');
const mobile=require('../hero072/mobile-controls.js');
let passed=0;function test(name,fn){fn();passed++;console.log(`✓ ${name}`);}

test('aim direction remains normalized in four directions',()=>{for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]])assert.deepStrictEqual(mobile.normalizedDirection(x*4,y*4),{x,y});});
test('zero joystick input preserves last aim',()=>assert.deepStrictEqual(mobile.normalizedDirection(0,0,{x:0,y:-1}),{x:0,y:-1}));
test('forward attack chooses an enemy in front instead of a closer enemy behind',()=>{const hero={x:0,y:0},front={x:50,y:5},behind={x:-20,y:0};assert.strictEqual(mobile.forwardTarget([behind,front],hero,{x:1,y:0},80),front);});
test('forward attack ignores targets outside weapon range and cone',()=>assert.strictEqual(mobile.forwardTarget([{x:90,y:0},{x:5,y:40}],{x:0,y:0},{x:1,y:0},70),null));
test('safe zone ejects a pursuing wolf and clears attack state',()=>{const camp={x:100,y:100},wolf={x:110,y:100,state:'attack'};assert(mobile.ejectFromSafeZone(wolf,camp,260));assert(!mobile.inSafeZone(wolf,camp,260));assert.strictEqual(wolf.state,'wander');});
test('respawn protection and camp both prevent immediate repeat damage',()=>{const camp={x:0,y:0},hero={x:40,y:0,invulnerableUntil:5};assert(!mobile.canDamageHero(hero,0,camp,260));hero.x=400;assert(!mobile.canDamageHero(hero,4.9,camp,260));assert(mobile.canDamageHero(hero,5,camp,260));});
test('hotbar signature changes only for visible quick-slot state',()=>{const hero={selected:0,hotbar:['spear',null],equipment:{weapon:'spear'},inv:{spear:1,root:2},hp:10};const a=mobile.hotbarSignature(hero);hero.hp=9;assert.strictEqual(mobile.hotbarSignature(hero),a);hero.selected=1;assert.notStrictEqual(mobile.hotbarSignature(hero),a);});
test('pointer confirmation fires a button once and suppresses the compatibility click',()=>{
  const listeners={},classes=new Set(),root={addEventListener:(type,fn)=>(listeners[type]||(listeners[type]=[])).push(fn)};let actions=0;
  const button={disabled:false,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},closest:s=>s==='button'?button:null,click(){const e=event('click',0);for(const fn of listeners.click||[])fn(e);if(!e.blocked)actions++;}};
  const event=(type,detail=1)=>({type,detail,pointerId:3,target:button,preventDefault(){this.prevented=true;},stopPropagation(){},stopImmediatePropagation(){this.blocked=true;}});
  mobile.bindPointerButtons(root);for(const fn of listeners.pointerdown)fn(event('pointerdown'));assert(classes.has('pressed'));for(const fn of listeners.pointerup)fn(event('pointerup'));assert(!classes.has('pressed'));assert.strictEqual(actions,1);
  const native=event('click',1);for(const fn of listeners.click)fn(native);if(!native.blocked)actions++;assert.strictEqual(actions,1);
});
console.log(`\n${passed}/8 mobile control tests passed.`);
