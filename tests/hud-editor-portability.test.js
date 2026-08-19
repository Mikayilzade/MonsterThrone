'use strict';
const assert=require('assert');
const port=require('../hero072/hud-editor-portability.js');

const profile={elements:{
  joystick:{left:.02,bottom:.02,width:100,height:100},
  actions:{right:.02,bottom:.02,cellWidth:60,cellHeight:50,gap:6},
  actionAttack:{right:.2,bottom:.1,width:60,height:50},actionDodge:{right:.02,bottom:.1,width:60,height:50},
  actionPickup:{right:.2,bottom:.02,width:60,height:50},actionUse:{right:.02,bottom:.02,width:60,height:50},
  hotbar:{left:.1,right:.1,bottom:.02,height:70},minimap:{right:.02,bottom:.2,radius:40}
}};

const scaled=port.scaleProfile(profile,1.2);
assert.strictEqual(scaled.elements.joystick.width,120);
assert.strictEqual(scaled.elements.minimap.radius,48);
assert.strictEqual(scaled.elements.hotbar.height,84);
assert.strictEqual(scaled.elements.joystick.left,.02,'normalized anchors must not move when scaling');
assert.strictEqual(profile.elements.joystick.width,100,'scaleProfile must not mutate its input');

assert.strictEqual(port.deviceRatio({width:844,height:390},{width:932,height:430}),Math.min(1.35,Math.min(932/844,430/390)));
assert.strictEqual(port.deviceRatio({width:390,height:844},{width:200,height:300}),.75,'device adaptation must have a safe lower bound');

const layouts={version:2,profiles:{mobilePortrait:profile,mobileLandscape:profile,desktop:profile}};
const extras={version:1,profiles:{
  mobilePortrait:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:false,biomeBadge:true},biomeBadge:{left:.1,bottom:.2,width:180,compact:false}},
  mobileLandscape:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:true,biomeBadge:true},biomeBadge:{left:.1,bottom:.2,width:160,compact:true}},
  desktop:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:true,biomeBadge:true},biomeBadge:{left:.1,bottom:.2,width:240,compact:false}}
}};
const state=port.defaultState();
const bundle=port.buildBundle({layouts,extras,state,options:{desktopJoystick:true,desktopTouch:false}});
assert.strictEqual(bundle.format,port.FORMAT);
assert.strictEqual(bundle.options.desktopJoystick,true);
assert.doesNotThrow(()=>port.validateBundle(bundle));
assert.throws(()=>port.validateBundle({format:'other',version:1,layouts}),/не файл раскладки/i);

const adapted=port.adaptBundle(bundle,{mobilePortrait:{width:430,height:932},mobileLandscape:{width:932,height:430},desktop:{width:1920,height:1080}});
assert(adapted.layouts.profiles.mobileLandscape.elements.joystick.width>100,'larger landscape viewport should adapt pixel-sized controls upward');
assert.strictEqual(adapted.layouts.profiles.mobileLandscape.elements.joystick.left,.02,'adaptation must preserve normalized position anchors');
assert.strictEqual(adapted.extras.profiles.mobilePortrait.visibility.actionUse,false,'visibility must survive export/import adaptation');

const preset={savedAt:1,viewportRef:{width:844,height:390},layoutProfile:profile,extrasProfile:extras.profiles.mobileLandscape,scale:1.1};
const moved=port.adaptPreset(preset,{width:932,height:430},'mobileLandscape');
assert(moved.layoutProfile.elements.minimap.radius>40);
assert.strictEqual(moved.scale,1.1);

console.log('5/5 HUD Stage 3B portability regression checks passed.');
