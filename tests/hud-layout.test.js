'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const hud=require('../hero072/hud-layout.js');
let passed=0;
function test(name,fn){fn();passed++;console.log(`✓ ${name}`);}
function memoryStorage(initial={}){const data=new Map(Object.entries(initial));return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),dump:()=>Object.fromEntries(data)};}

test('viewport profiles separate portrait, landscape and desktop',()=>{
  assert.strictEqual(hud.profileForViewport({width:390,height:844},{touch:true}),'mobilePortrait');
  assert.strictEqual(hud.profileForViewport({width:932,height:430},{touch:true}),'mobileLandscape');
  assert.strictEqual(hud.profileForViewport({width:932,height:430},{touch:false}),'desktop');
  assert.strictEqual(hud.profileForViewport({width:1200,height:700},{touch:true,finePointer:true}),'desktop');
});

test('desktop hybrid capability does not activate the touch HUD',()=>{
  assert(hud.usesTouchHud('mobileLandscape',true));
  assert(!hud.usesTouchHud('desktop',true));
});

test('touch detection accepts maxTouchPoints and coarse pointer',()=>{
  assert(hud.detectTouch({maxTouchPoints:1}));
  assert(hud.detectTouch({coarsePointer:true}));
  assert(!hud.detectTouch({maxTouchPoints:0,coarsePointer:false}));
});

test('malformed storage recovers to complete versioned defaults',()=>{
  const storage=memoryStorage({[hud.STORAGE_KEY]:'{broken'});
  const result=hud.readStorage(storage);
  assert(result.recovered);
  assert.strictEqual(result.layouts.version,hud.VERSION);
  for(const name of hud.PROFILE_NAMES)for(const id of ['joystick','actions','hotbar','minimap'])assert(result.layouts.profiles[name].elements[id]);
});

test('old or partial layouts migrate missing fields and clamp invalid values',()=>{
  const migrated=hud.sanitizeLayouts({version:0,profiles:{mobileLandscape:{hotbarSlots:99,elements:{joystick:{left:-4,width:2,visible:false},minimap:{radius:999}}}}});
  const p=migrated.profiles.mobileLandscape;
  assert.strictEqual(migrated.version,hud.VERSION);
  assert.strictEqual(p.hotbarSlots,8);
  assert.strictEqual(p.elements.joystick.left,0);
  assert.strictEqual(p.elements.joystick.width,44);
  assert.strictEqual(p.elements.joystick.visible,true);
  assert.strictEqual(p.elements.minimap.radius,120);
  assert(p.elements.actions&&p.elements.hotbar);
});

test('932px touch landscape keeps mandatory controls and four hotbar slots',()=>{
  const geometry=hud.viewportGeometry('mobileLandscape',932,430,hud.DEFAULT_LAYOUTS);
  assert(geometry.touch);
  assert.strictEqual(geometry.hotbarSlots,4);
  assert(geometry.elements.joystick.visible);
  assert(geometry.elements.actions.visible);
  assert(geometry.elements.joystick.left+geometry.elements.joystick.width<=932);
  assert(geometry.elements.joystick.bottom+geometry.elements.joystick.height<=430);
  assert(geometry.elements.actions.right+geometry.elements.actions.width<=932);
  assert(geometry.elements.actions.bottom+geometry.elements.actions.height<=430);
});

test('minimap geometry stays inside all three viewports',()=>{
  for(const [name,w,h] of [['mobilePortrait',390,844],['mobileLandscape',932,430],['desktop',1366,768]]){
    const m=hud.viewportGeometry(name,w,h).elements.minimap;
    assert(m.x-m.radius>=0);assert(m.x+m.radius<=w);assert(m.y-m.radius>=0);assert(m.y+m.radius<=h);
  }
});

test('save writes sanitized layouts under the versioned key',()=>{
  const storage=memoryStorage();
  const clean=hud.save(storage,{profiles:{}});
  assert.strictEqual(clean.version,hud.VERSION);
  assert(JSON.parse(storage.dump()[hud.STORAGE_KEY]).profiles.desktop);
});

test('mobile minimap patch follows touch profiles but preserves hybrid desktop',()=>{
  const phone={minimapLayout:()=>({x:1,y:1,r:72})};
  assert(hud.patchMobile(phone,{navigator:{maxTouchPoints:5}}));
  const m=phone.minimapLayout(932,430,true,false);
  assert.strictEqual(m.r,36);
  assert(m.x+m.r<=932);assert(m.y+m.r<=430);
  const hybrid={minimapLayout:()=>({x:1,y:1,r:72})};
  hud.patchMobile(hybrid,{navigator:{maxTouchPoints:5},matchMedia:q=>({matches:q==='(pointer: fine)'})});
  assert.strictEqual(hybrid.minimapLayout(1200,700,true,false).r,72);
});

test('runtime CSS guarantees touch controls beyond the old 900px breakpoint',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../hero072/hud-layout.css'),'utf8');
  assert(css.includes('.hud-layout-enabled.hud-touch .mobile-controls{display:block}'));
  assert(css.includes('.hud-profile-mobileLandscape .topbar'));
  assert(css.includes('var(--hud-slot-basis'));
  assert(!css.includes('var(--hud-hotbar-slots,4) - 1'));
  assert(!css.includes('.hud-layout-enabled .hotbar{'));
});

test('boot waits for HUD layout assets before assembling the game runtime',()=>{
  const boot=fs.readFileSync(path.join(__dirname,'../hero072/boot.js'),'utf8');
  assert(boot.includes("loadStyle('./hud-layout.css')"));
  assert(boot.includes("loadScript('./hud-layout.js')"));
  assert(boot.indexOf("loadScript('./hud-layout.js')")<boot.indexOf('Promise.all(files.map'));
});

console.log(`\n${passed}/11 HUD layout stage 1 tests passed.`);
