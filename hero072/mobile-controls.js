(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.MonsterThroneMobile=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function bindPointerButtons(root,onAction){
    const pressed=new Map(),lastPointer=new WeakMap(),synthetic=new WeakSet();
    const buttonFor=e=>e.target&&e.target.closest?e.target.closest('button'):null;
    root.addEventListener('pointerdown',e=>{const b=buttonFor(e);if(!b||b.disabled)return;pressed.set(e.pointerId,b);b.classList.add('pressed');e.preventDefault();e.stopPropagation();},true);
    root.addEventListener('pointerup',e=>{const b=pressed.get(e.pointerId);if(!b)return;pressed.delete(e.pointerId);b.classList.remove('pressed');e.preventDefault();e.stopPropagation();if(b.disabled||buttonFor(e)!==b)return;lastPointer.set(b,Date.now());if(onAction)onAction(b);synthetic.add(b);b.click();synthetic.delete(b);},true);
    root.addEventListener('pointercancel',e=>{const b=pressed.get(e.pointerId);if(b)b.classList.remove('pressed');pressed.delete(e.pointerId);},true);
    root.addEventListener('click',e=>{const b=buttonFor(e);if(b&&synthetic.has(b))return;if(b&&Date.now()-(lastPointer.get(b)||0)<700){e.preventDefault();e.stopImmediatePropagation();}},true);
  }
  function normalizedDirection(x,y,fallback={x:1,y:0}){const l=Math.hypot(x,y);return l>.001?{x:x/l,y:y/l}:{x:fallback.x,y:fallback.y};}
  function forwardTarget(enemies,origin,direction,range,minimumDot=.25){let best=null,bestScore=Infinity;const aim=normalizedDirection(direction.x,direction.y);for(const e of enemies){if(e.dead||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;const dx=e.x-origin.x,dy=e.y-origin.y,d=Math.hypot(dx,dy);if(!d||d>range)continue;const dot=(dx*aim.x+dy*aim.y)/d;if(dot<minimumDot)continue;const score=d+(1-dot)*range;if(score<bestScore){best=e;bestScore=score;}}return best;}
  function inSafeZone(point,camp,radius){return Number.isFinite(point.x)&&Number.isFinite(point.y)&&Math.hypot(point.x-camp.x,point.y-camp.y)<radius;}
  function ejectFromSafeZone(entity,camp,radius,padding=24){let dx=entity.x-camp.x,dy=entity.y-camp.y,l=Math.hypot(dx,dy);if(l>=radius)return false;if(!l){dx=1;dy=0;l=1;}entity.x=camp.x+dx/l*(radius+padding);entity.y=camp.y+dy/l*(radius+padding);entity.state='wander';entity.think=1;return true;}
  function applySafeZoneBoundary(entity,camp,radius,margin=45,padding=28){
    if(!entity||!Number.isFinite(entity.x)||!Number.isFinite(entity.y)||Math.hypot(entity.x-camp.x,entity.y-camp.y)>=radius+margin)return false;
    ejectFromSafeZone(entity,camp,radius,padding);entity.state='wander';entity.dir=Math.atan2(entity.y-camp.y,entity.x-camp.x);return true;
  }
  function canDamageHero(hero,worldTime,camp,radius){return !inSafeZone(hero,camp,radius)&&(hero.invulnerableUntil||0)<=worldTime;}
  function canAttackTarget(){return true;}
  function canPlaceTrap(hero,point,camp,radius){return !inSafeZone(hero,camp,radius)&&!inSafeZone(point,camp,radius);}
  function controlsTabVisible(capabilities,advanced=false){return !!advanced||!!(capabilities?.finePointer||capabilities?.keyboard);}
  function createPinchState(initial=1,min=.65,max=1.65){let zoom=clamp(Number(initial)||1,min,max),points=new Map(),startDistance=0,startZoom=zoom,pinching=false;return {
    down(id,x,y){points.set(id,{x,y});if(points.size===2){const p=[...points.values()];startDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1;startZoom=zoom;pinching=true;}return pinching;},
    move(id,x,y){if(!points.has(id))return {pinching,zoom};points.set(id,{x,y});if(points.size>=2){const p=[...points.values()];zoom=clamp(startZoom*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/startDistance,min,max);}return {pinching,zoom};},
    up(id){points.delete(id);const was=pinching;if(points.size<2)pinching=false;return was;},setZoom(value){zoom=clamp(Number(value)||1,min,max);if(pinching){startZoom=zoom;const p=[...points.values()];startDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)||1;}return zoom;},get zoom(){return zoom;},get pinching(){return pinching;}
  };}
  function minimapLayout(width,height,landscape=false,touchLayout=width<=900){const r=touchLayout?(landscape?42:46):72,bottom=touchLayout?(landscape?132:286):16;return {x:width-r-12,y:Math.max(r+12,height-r-bottom),r};}
  function cameraZoomValue(current,command){if(command==='reset')return 1;const direction=Number(command);return clamp((Number(current)||1)+(direction>0?.1:direction<0?-.1:0),.65,1.65);}
  function targetAfterWorldTap(currentTarget,tappedEnemy){return tappedEnemy||currentTarget||null;}
  function zoomShortcutCommand(code,modifiers={},boundAction=null){if(boundAction||modifiers.ctrlKey||modifiers.metaKey||modifiers.altKey)return null;if(code==='Minus'||code==='NumpadSubtract')return -1;if(code==='Equal'||code==='NumpadAdd')return 1;if(code==='Digit0'||code==='Numpad0')return 'reset';return null;}
  function pointerAimAfterZoom(pointer,hero,camera,zoom,fallback={x:1,y:0}){const worldX=pointer.x/zoom+camera.x,worldY=pointer.y/zoom+camera.y,dx=worldX-hero.x,dy=worldY-hero.y;return {worldX,worldY,direction:Math.hypot(dx,dy)>1?normalizedDirection(dx,dy,fallback):normalizedDirection(fallback.x,fallback.y)};}
  function cameraViewport(hero,width,height,zoom,worldSize){const safeZoom=clamp(Number(zoom)||1,.65,1.65),viewWidth=width/safeZoom,viewHeight=height/safeZoom;return {x:clamp(hero.x-viewWidth/2,0,Math.max(0,worldSize-viewWidth)),y:clamp(hero.y-viewHeight/2,0,Math.max(0,worldSize-viewHeight)),width:viewWidth,height:viewHeight,zoom:safeZoom};}
  function worldToScreen(point,camera,zoom=1){return {x:(point.x-camera.x)*zoom,y:(point.y-camera.y)*zoom};}
  function validTarget(target,enemies,hero,breakDistance=720){if(!target||target.dead||!enemies.includes(target)||Math.hypot(target.x-hero.x,target.y-hero.y)>breakDistance)return null;return target;}
  function targetTransition(target,enemies,hero,breakDistance=720){const next=validTarget(target,enemies,hero,breakDistance);return {target:next,changed:next!==target,cleared:!!target&&!next};}
  function markSanctuaryAvoidance(entity,worldTime,cooldown=4){entity.unfairDamage=true;entity.sanctuaryAvoidUntil=Math.max(entity.sanctuaryAvoidUntil||0,worldTime+cooldown);}
  function retreatState(entity,hero,camp,radius,aggro=140,worldTime=0){if(!entity?.unfairDamage)return null;if(!inSafeZone(hero,camp,radius)){entity.unfairDamage=false;entity.sanctuaryAvoidUntil=0;return {state:'resume'};}const retreatDistance=Math.max(140,aggro+60),boundaryDistance=Math.hypot(entity.x-camp.x,entity.y-camp.y)-radius,coolingDown=(entity.sanctuaryAvoidUntil||0)>worldTime;if(boundaryDistance<retreatDistance||coolingDown)return {state:'sanctuary-retreat',angle:Math.atan2(entity.y-camp.y,entity.x-camp.x),retreatDistance};entity.unfairDamage=false;entity.sanctuaryAvoidUntil=0;return {state:'resume'};}
  function nearestLootableCarcass(carcasses,origin,range=46,part='any'){
    return carcasses.filter(c=>Math.hypot(c.x-origin.x,c.y-origin.y)<range&&Array.isArray(c.parts)&&(part==='meat'?c.parts.includes('raw_meat'):c.parts.length))
      .sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||String(a.uid||'').localeCompare(String(b.uid||'')))[0]||null;
  }
  function shouldRefreshInventory(previousSlot,nextSlot,panel){return panel==='inventory'&&previousSlot!==nextSlot;}
  function corpsePileLayout(carcasses){const groups=new Map();for(const corpse of carcasses){const key=`${Math.round(corpse.x)},${Math.round(corpse.y)}`;(groups.get(key)||groups.set(key,[]).get(key)).push(corpse);}const layout=new Map();for(const group of groups.values())group.forEach((corpse,index)=>{const angle=index*2.3999632297,radius=index?6*Math.sqrt(index):0;layout.set(corpse,{x:Math.cos(angle)*radius,y:Math.sin(angle)*radius,count:group.length,parts:group.reduce((n,c)=>n+(c.parts?.length||0),0),label:index===0});});return layout;}
  function hotbarSignature(hero){return JSON.stringify([hero.selected,hero.hotbar,hero.equipment?.weapon,hero.hotbar.map(id=>id?(hero.inv[id]||0):0)]);}
  return {bindPointerButtons,normalizedDirection,forwardTarget,inSafeZone,ejectFromSafeZone,applySafeZoneBoundary,canDamageHero,canAttackTarget,canPlaceTrap,controlsTabVisible,createPinchState,minimapLayout,cameraZoomValue,targetAfterWorldTap,zoomShortcutCommand,pointerAimAfterZoom,cameraViewport,worldToScreen,validTarget,targetTransition,markSanctuaryAvoidance,retreatState,nearestLootableCarcass,shouldRefreshInventory,corpsePileLayout,hotbarSignature,clamp};
});
