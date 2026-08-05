'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const hud=require('../hero072/hud-layout.js');
let passed=0;
function test(name,fn){fn();passed++;console.log(`✓ ${name}`);}

test('version 2 migrates action mode and individual action elements',()=>{
  const migrated=hud.sanitizeLayouts({version:1,profiles:{mobileLandscape:{actionMode:'individual',elements:{hotbar:{visible:false},minimap:{visible:false}}}}});
  const p=migrated.profiles.mobileLandscape;
  assert.strictEqual(migrated.version,2);
  assert.strictEqual(p.actionMode,'individual');
  for(const id of hud.ACTION_IDS)assert(p.elements[id]);
  assert.strictEqual(p.elements.hotbar.visible,false);
  assert.strictEqual(p.elements.minimap.visible,false);
  assert.strictEqual(p.elements.joystick.visible,true);
  assert.strictEqual(p.elements.actions.visible,true);
});

test('individual action geometry stays inside landscape viewport',()=>{
  const layouts=hud.clone(hud.DEFAULT_LAYOUTS);layouts.profiles.mobileLandscape.actionMode='individual';
  const g=hud.viewportGeometry('mobileLandscape',932,430,layouts);
  assert.strictEqual(g.actionMode,'individual');
  for(const id of hud.ACTION_IDS){
    const a=g.elements[id];
    assert(a.left>=0&&a.top>=0);
    assert(a.left+a.width<=932);
    assert(a.top+a.height<=430);
    assert(a.width>=44&&a.height>=44);
  }
});

test('preview is separate from persisted layouts until commit',()=>{
  const data=new Map();
  const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};
  const body={classList:{remove(){},add(){}},dataset:{}};
  const style={setProperty(){}};
  const doc={body,documentElement:{clientWidth:932,clientHeight:430,style},querySelector(){return null;},getElementById(){return null;}};
  const win={innerWidth:932,innerHeight:430,navigator:{maxTouchPoints:5},matchMedia:q=>({matches:q.includes('coarse'),addEventListener(){},removeEventListener(){}}),addEventListener(){},removeEventListener(){},dispatchEvent(){},CustomEvent:function(){}};
  const rt=hud.createRuntime({window:win,document:doc,storage,capabilities:{touch:true,finePointer:false}});
  const draft=rt.savedLayouts();draft.profiles.mobileLandscape.elements.joystick.left=.3;
  rt.preview(draft);
  assert.strictEqual(rt.current().preview,true);
  assert.notStrictEqual(rt.savedLayouts().profiles.mobileLandscape.elements.joystick.left,.3);
  rt.commit(draft);
  assert.strictEqual(rt.current().preview,false);
  assert.strictEqual(rt.savedLayouts().profiles.mobileLandscape.elements.joystick.left,.3);
});

test('editor UI and loader assets are wired',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../hero072/index.html'),'utf8');
  const boot=fs.readFileSync(path.join(__dirname,'../hero072/boot.js'),'utf8');
  const editor=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor.js'),'utf8');
  assert(html.includes('data-system-tab="interface"'));
  assert(html.includes('id="hudEditCurrent"'));
  assert(html.includes('id="hudActionMode"'));
  assert(boot.includes("loadStyle('./hud-editor.css')"));
  assert(boot.indexOf("loadScript('./hud-layout.js')")<boot.indexOf("loadScript('./hud-editor.js')"));
  assert(boot.indexOf("loadScript('./hud-editor.js')")<boot.indexOf('Promise.all(files.map'));
  assert(editor.includes('runtime()?.preview(editor.draft)'));
  assert(editor.includes('rt?.commit(closing.draft)'));
  assert(editor.includes('rt?.cancelPreview()'));
});

console.log(`\n${passed}/4 HUD editor stage 2 tests passed.`);
