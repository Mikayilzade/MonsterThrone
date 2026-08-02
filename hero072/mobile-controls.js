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
  function canDamageHero(hero,worldTime,camp,radius){return !inSafeZone(hero,camp,radius)&&(hero.invulnerableUntil||0)<=worldTime;}
  function hotbarSignature(hero){return JSON.stringify([hero.selected,hero.hotbar,hero.equipment?.weapon,hero.hotbar.map(id=>id?(hero.inv[id]||0):0)]);}
  return {bindPointerButtons,normalizedDirection,forwardTarget,inSafeZone,ejectFromSafeZone,canDamageHero,hotbarSignature,clamp};
});
