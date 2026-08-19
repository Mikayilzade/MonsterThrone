'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const safety=require('../hero072/hud-editor-safety.js');
let passed=0;
function test(name,fn){fn();passed++;console.log(`✓ ${name}`);}

test('viewportBounds keeps the physical screen as the hard editor boundary',()=>{
  const doc={documentElement:{clientWidth:932,clientHeight:430}};
  const win={innerWidth:932,innerHeight:430};
  assert.deepStrictEqual(safety.viewportBounds(win,doc,4),{left:4,top:4,right:928,bottom:426,width:932,height:430});
});

test('landscape controls may extend beyond advisory iPhone safe-area without being pulled inward',()=>{
  const probe={className:'',setAttribute(){},remove(){}};
  const doc={
    body:{appendChild(){}},
    documentElement:{clientWidth:932,clientHeight:430,appendChild(){}},
    createElement(){return probe;}
  };
  const win={innerWidth:932,innerHeight:430,getComputedStyle(){return {getPropertyValue(name){return {'padding-left':'47','padding-right':'47','padding-top':'0','padding-bottom':'21'}[name]||'0';}};}};
  const safe=safety.safeBounds(win,doc,6),hard=safety.viewportBounds(win,doc,4);
  assert.strictEqual(safe.right,879);
  const minimap={left:856,top:210,width:72,height:72,right:928,bottom:282};
  const result=safety.snapRect(minimap,hard,[],8);
  assert.strictEqual(result.rect.left,856);
  assert.strictEqual(result.rect.right,928);
  assert.strictEqual(safety.rectCenterInside(result.rect,safe),false);
});

test('Stage 3A no longer writes a second runtime preview on pointer release',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor-safety.js'),'utf8');
  assert(!js.includes('runtime.preview'), 'safety layer must not maintain a second editor draft');
  assert(js.includes('single source of truth'));
  assert(js.includes("event.target.closest?.('#hudEditorSave')"));
  assert(js.includes('viewportBounds(win,doc)'));
});

test('safe-area is visibly documented as advisory rather than a hard frame',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor-safety.css'),'utf8');
  assert(css.includes('recommendation, not a hard drag boundary'));
});

console.log(`\n${passed}/4 landscape HUD editor stability tests passed.`);
