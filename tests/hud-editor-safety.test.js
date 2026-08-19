'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const safety=require('../hero072/hud-editor-safety.js');
let passed=0;
function test(name,fn){fn();passed++;console.log(`✓ ${name}`);}

test('clampRect keeps controls inside the safe bounds',()=>{
  const b={left:10,top:20,right:390,bottom:790};
  assert.deepStrictEqual(safety.clampRect({left:-40,top:760,width:100,height:80},b),{left:10,top:710,width:100,height:80,right:110,bottom:790});
});

test('snapRect sticks gently to a safe edge and reports its guide',()=>{
  const b={left:10,top:10,right:390,bottom:790};
  const result=safety.snapRect({left:15,top:100,width:100,height:80},b,[],10);
  assert.strictEqual(result.rect.left,10);
  assert.strictEqual(result.guides.x,10);
});

test('snapRect can align beside another HUD element with a gap',()=>{
  const b={left:0,top:0,right:500,bottom:500};
  const other={left:200,top:100,width:80,height:80,right:280,bottom:180};
  const result=safety.snapRect({left:111,top:101,width:80,height:80},b,[other],10,8);
  assert.strictEqual(result.rect.left,112);
  assert.strictEqual(result.rect.top,100);
});

test('overlapRatio catches strong collisions but ignores separated controls',()=>{
  const a={left:0,top:0,width:100,height:100,right:100,bottom:100};
  const b={left:50,top:0,width:100,height:100,right:150,bottom:100};
  const c={left:160,top:0,width:20,height:20,right:180,bottom:20};
  assert.strictEqual(safety.overlapRatio(a,b),.5);
  assert.strictEqual(safety.overlapRatio(a,c),0);
});

test('writeRect persists action and minimap geometry as profile-relative data',()=>{
  const layouts={profiles:{mobileLandscape:{elements:{actionAttack:{right:0,bottom:0,width:54,height:44},minimap:{right:0,bottom:0,radius:36}}}}};
  assert(safety.writeRect(layouts,'mobileLandscape','actionAttack',{left:800,top:300,width:54,height:44,right:854,bottom:344},{width:932,height:430}));
  assert(Math.abs(layouts.profiles.mobileLandscape.elements.actionAttack.right-(78/932))<1e-9);
  assert(Math.abs(layouts.profiles.mobileLandscape.elements.actionAttack.bottom-(86/430))<1e-9);
  assert(safety.writeRect(layouts,'mobileLandscape','minimap',{left:700,top:200,width:80,height:80,right:780,bottom:280},{width:932,height:430}));
  assert.strictEqual(layouts.profiles.mobileLandscape.elements.minimap.radius,40);
});

test('safeBounds reads CSS safe-area probe padding plus an editor margin',()=>{
  const probe={className:'',setAttribute(){},remove(){}};
  const doc={body:{appendChild(){}},documentElement:{clientWidth:390,clientHeight:844},createElement(){return probe;}};
  const win={innerWidth:390,innerHeight:844,getComputedStyle(){return {getPropertyValue(name){return {'padding-top':'47','padding-right':'0','padding-bottom':'34','padding-left':'0'}[name]||'0';}};}};
  assert.deepStrictEqual(safety.safeBounds(win,doc,6),{left:6,top:53,right:384,bottom:804,width:390,height:844,insets:{top:47,right:0,bottom:34,left:0}});
});

test('Stage 3A source contains recovery, release snapping and collision feedback',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor-safety.js'),'utf8');
  const css=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor-safety.css'),'utf8');
  assert(js.includes("monsterThrone.hudLayouts.v1"));
  assert(js.includes("#hudEditorSave"));
  assert(js.includes("pointerup"));
  assert(js.includes("Ctrl")===false); // UI text stays localized; shortcut is implemented by modifiers/code.
  assert(js.includes("event.ctrlKey&&event.shiftKey"));
  assert(css.includes('.hud-editor-handle.hud-editor-collision'));
  assert(css.includes('outline:2px dashed'));
  assert(css.includes('env(safe-area-inset-bottom,0px)'));
});

test('boot loads the safety layer after editor polish and before game assembly',()=>{
  const boot=fs.readFileSync(path.join(__dirname,'../hero072/boot.js'),'utf8');
  assert(boot.includes("loadStyle('./hud-editor-safety.css')"));
  assert(boot.indexOf("loadScript('./hud-editor-polish.js')")<boot.indexOf("loadScript('./hud-editor-safety.js')"));
  assert(boot.indexOf("loadScript('./hud-editor-safety.js')")<boot.indexOf('Promise.all(files.map'));
});

console.log(`\n${passed}/8 HUD editor Stage 3A safety tests passed.`);
