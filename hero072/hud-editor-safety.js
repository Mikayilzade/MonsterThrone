(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MonsterThroneHudSafety=api;
  if(root.document&&root.addEventListener)api.start(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const EXTRAS_KEY='monsterThrone.hudEditorExtras.v1';
  const LAYOUT_KEY='monsterThrone.hudLayouts.v1';
  const ACTION_IDS=['actionAttack','actionDodge','actionPickup','actionUse'];
  const EDITABLE_IDS=['joystick','actions',...ACTION_IDS,'hotbar','minimap'];
  const LABELS={joystick:'Джойстик',actions:'Кнопки действий',actionAttack:'Удар',actionDodge:'Рывок',actionPickup:'Подобрать',actionUse:'Использовать',hotbar:'Быстрые слоты',minimap:'Миникарта',biomeBadge:'Название местности'};
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const copyRect=r=>({left:r.left,top:r.top,width:r.width,height:r.height,right:r.left+r.width,bottom:r.top+r.height});

  function clampRect(rect,bounds){
    const width=Math.min(rect.width,Math.max(1,bounds.right-bounds.left));
    const height=Math.min(rect.height,Math.max(1,bounds.bottom-bounds.top));
    const left=clamp(rect.left,bounds.left,Math.max(bounds.left,bounds.right-width));
    const top=clamp(rect.top,bounds.top,Math.max(bounds.top,bounds.bottom-height));
    return {left,top,width,height,right:left+width,bottom:top+height};
  }

  function overlapRatio(a,b){
    const left=Math.max(a.left,b.left),top=Math.max(a.top,b.top),right=Math.min(a.right??a.left+a.width,b.right??b.left+b.width),bottom=Math.min(a.bottom??a.top+a.height,b.bottom??b.top+b.height);
    if(right<=left||bottom<=top)return 0;
    const intersection=(right-left)*(bottom-top),base=Math.max(1,Math.min(a.width*a.height,b.width*b.height));
    return intersection/base;
  }

  function nearest(value,candidates,threshold){
    let best=value,delta=threshold+1,guide=null;
    for(const candidate of candidates){
      const d=Math.abs(candidate.value-value);
      if(d<=threshold&&d<delta){best=candidate.value;delta=d;guide=candidate.guide;}
    }
    return {value:best,guide};
  }

  function snapRect(rect,bounds,others=[],threshold=10,gap=8){
    let out=clampRect(rect,bounds);
    const centerX=(bounds.left+bounds.right-out.width)/2,centerY=(bounds.top+bounds.bottom-out.height)/2;
    const x=[
      {value:bounds.left,guide:bounds.left},{value:bounds.right-out.width,guide:bounds.right},{value:centerX,guide:(bounds.left+bounds.right)/2}
    ];
    const y=[
      {value:bounds.top,guide:bounds.top},{value:bounds.bottom-out.height,guide:bounds.bottom},{value:centerY,guide:(bounds.top+bounds.bottom)/2}
    ];
    for(const other of others){
      const r=copyRect(other);
      x.push(
        {value:r.left,guide:r.left},{value:r.right-out.width,guide:r.right},
        {value:r.left-out.width-gap,guide:r.left-gap/2},{value:r.right+gap,guide:r.right+gap/2},
        {value:r.left+(r.width-out.width)/2,guide:r.left+r.width/2}
      );
      y.push(
        {value:r.top,guide:r.top},{value:r.bottom-out.height,guide:r.bottom},
        {value:r.top-out.height-gap,guide:r.top-gap/2},{value:r.bottom+gap,guide:r.bottom+gap/2},
        {value:r.top+(r.height-out.height)/2,guide:r.top+r.height/2}
      );
    }
    const sx=nearest(out.left,x,threshold),sy=nearest(out.top,y,threshold);
    out=clampRect({...out,left:sx.value,top:sy.value},bounds);
    return {rect:out,guides:{x:sx.guide,y:sy.guide}};
  }

  function readInsets(win,doc){
    const fallback={top:0,right:0,bottom:0,left:0};
    if(!doc?.body||!win?.getComputedStyle)return fallback;
    const probe=doc.createElement('div');
    probe.className='hud-safe-area-probe';probe.setAttribute('aria-hidden','true');
    // The body is observed by Stage 3A. Measure under <html> so the probe
    // cannot recursively retrigger the observer and freeze the editor.
    const host=typeof doc.documentElement?.appendChild==='function'?doc.documentElement:doc.body;
    if(!host||typeof host.appendChild!=='function')return fallback;
    host.appendChild(probe);
    const style=win.getComputedStyle(probe),num=name=>Math.max(0,parseFloat(style.getPropertyValue(name))||0);
    const out={top:num('padding-top'),right:num('padding-right'),bottom:num('padding-bottom'),left:num('padding-left')};
    probe.remove();return out;
  }

  // Advisory iOS safe area. Elements may intentionally extend into it.
  function safeBounds(win,doc,margin=6){
    const insets=readInsets(win,doc),width=Math.max(1,win.innerWidth||doc?.documentElement?.clientWidth||1),height=Math.max(1,win.innerHeight||doc?.documentElement?.clientHeight||1);
    return {left:insets.left+margin,top:insets.top+margin,right:width-insets.right-margin,bottom:height-insets.bottom-margin,width,height,insets};
  }

  // Hard editor boundary: only the physical viewport is compulsory. This is
  // deliberately wider than safeBounds in phone landscape so large circular
  // controls can sit naturally near the rounded screen edges.
  function viewportBounds(win,doc,margin=4){
    const width=Math.max(1,win.innerWidth||doc?.documentElement?.clientWidth||1),height=Math.max(1,win.innerHeight||doc?.documentElement?.clientHeight||1);
    return {left:margin,top:margin,right:Math.max(margin,width-margin),bottom:Math.max(margin,height-margin),width,height};
  }

  function geometryRect(id,geometry){
    const e=geometry?.elements?.[id];if(!e)return null;
    if(id==='minimap')return {left:e.x-e.radius,top:e.y-e.radius,width:e.radius*2,height:e.radius*2,right:e.x+e.radius,bottom:e.y+e.radius};
    const left=e.left??(geometry.width-(e.right||0)-(e.width||0)),top=e.top??(geometry.height-(e.bottom||0)-(e.height||0));
    const width=e.width||(id==='actions'?(e.cellWidth*2+e.gap):0),height=e.height||(id==='actions'?(e.cellHeight*2+e.gap):0);
    return {left,top,width,height,right:left+width,bottom:top+height};
  }

  function writeRect(layouts,profile,id,rect,viewport){
    const e=layouts?.profiles?.[profile]?.elements?.[id];if(!e)return false;
    const w=Math.max(1,viewport.width),h=Math.max(1,viewport.height),right=Math.max(0,w-rect.right),bottom=Math.max(0,h-rect.bottom);
    if(id==='joystick'){
      e.left=rect.left/w;e.bottom=bottom/h;e.width=rect.width;e.height=rect.height;
    }else if(id==='actions'){
      e.right=right/w;e.bottom=bottom/h;e.cellWidth=Math.max(44,(rect.width-e.gap)/2);e.cellHeight=Math.max(44,(rect.height-e.gap)/2);
    }else if(ACTION_IDS.includes(id)){
      e.right=right/w;e.bottom=bottom/h;e.width=rect.width;e.height=rect.height;
    }else if(id==='hotbar'){
      e.left=rect.left/w;e.right=right/w;e.bottom=bottom/h;e.height=rect.height;
    }else if(id==='minimap'){
      e.right=right/w;e.bottom=bottom/h;e.radius=Math.max(24,Math.min(rect.width,rect.height)/2);
    }else return false;
    return true;
  }

  function rectCenterInside(rect,bounds){
    const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    return cx>=bounds.left&&cx<=bounds.right&&cy>=bounds.top&&cy<=bounds.bottom;
  }

  function start(win){
    const doc=win.document,HUD=win.MonsterThroneHudLayout;
    if(!doc||!HUD)return null;
    let activeId=null,raf=0;
    const $=id=>doc.getElementById(id);
    const overlay=()=>$('hudEditorOverlay');
    const handles=()=>[...(overlay()?.querySelectorAll?.('.hud-editor-handle[data-editor-id]')||[])].filter(node=>!node.classList.contains('hud-editor-desktop-suppressed'));
    const rectOf=node=>{const r=node?.getBoundingClientRect?.();return r&&r.width>1&&r.height>1?{left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom}:null;};
    const otherRects=id=>handles().filter(node=>node.dataset.editorId!==id&&!node.classList.contains('is-hidden')).map(rectOf).filter(Boolean);

    function ensureDecor(){
      const o=overlay();if(!o)return;
      if(!$('hudEditorSafeBox')){
        const box=doc.createElement('div');box.id='hudEditorSafeBox';box.className='hud-editor-safe-box';o.appendChild(box);
        const vx=doc.createElement('div');vx.id='hudSnapGuideX';vx.className='hud-snap-guide hud-snap-guide-x';o.appendChild(vx);
        const hy=doc.createElement('div');hy.id='hudSnapGuideY';hy.className='hud-snap-guide hud-snap-guide-y';o.appendChild(hy);
        const note=doc.createElement('div');note.id='hudEditorSafetyNote';note.className='hud-editor-safety-note';note.textContent='Пунктир — рекомендованная safe-area · край экрана — граница';o.appendChild(note);
      }
      renderSafeBox();
    }

    function renderSafeBox(){
      const box=$('hudEditorSafeBox');if(!box)return;
      const b=safeBounds(win,doc);box.style.left=`${b.left}px`;box.style.top=`${b.top}px`;box.style.width=`${Math.max(0,b.right-b.left)}px`;box.style.height=`${Math.max(0,b.bottom-b.top)}px`;
    }

    function showGuides(guides){
      const x=$('hudSnapGuideX'),y=$('hudSnapGuideY');
      if(x){x.classList.toggle('active',Number.isFinite(guides?.x));if(Number.isFinite(guides?.x))x.style.left=`${Math.round(guides.x)}px`;}
      if(y){y.classList.toggle('active',Number.isFinite(guides?.y));if(Number.isFinite(guides?.y))y.style.top=`${Math.round(guides.y)}px`;}
    }

    function collisionState(id,node){
      const r=rectOf(node),note=$('hudEditorSafetyNote');if(!r)return;
      let worst=null;
      for(const other of handles()){
        other.classList.remove('hud-editor-collision-peer');
        if(other===node||other.classList.contains('is-hidden'))continue;
        const o=rectOf(other);if(!o)continue;
        const ratio=overlapRatio(r,o);if(ratio>.38&&(!worst||ratio>worst.ratio))worst={other,ratio};
      }
      node.classList.toggle('hud-editor-collision',!!worst);
      if(worst){
        worst.other.classList.add('hud-editor-collision-peer');
        if(note){note.classList.add('warning');note.textContent=`Перекрытие: ${LABELS[id]||id} ↔ ${LABELS[worst.other.dataset.editorId]||worst.other.dataset.editorId}`;}
      }else if(note){
        note.classList.remove('warning');
        note.textContent=rectCenterInside(r,safeBounds(win,doc))?'Пунктир — рекомендованная safe-area · край экрана — граница':'За safe-area допустимо · элемент остаётся внутри экрана';
      }
    }

    function inspectActive(){
      raf=0;const o=overlay();if(!o||!activeId)return;
      ensureDecor();const node=o.querySelector(`.hud-editor-handle[data-editor-id="${activeId}"]`),r=rectOf(node);if(!node||!r)return;
      // Guides are predictive only. Do not mutate the runtime/draft here:
      // Stage 3A used to preview a snapped copy that the base editor did not
      // know about, so moving a second control restored stale coordinates and
      // made the minimap/joystick jump apart in landscape.
      const result=snapRect(r,viewportBounds(win,doc),otherRects(activeId));
      showGuides(result.guides);collisionState(activeId,node);
    }
    function scheduleInspect(){if(!raf)raf=win.requestAnimationFrame(inspectActive);}

    function normalizeBiomeSaved(profileName,bounds){
      const node=$('worldStatus'),r=rectOf(node);if(!r)return;
      const fixed=clampRect(r,bounds);
      if(Math.abs(fixed.left-r.left)<1&&Math.abs(fixed.top-r.top)<1)return;
      try{
        const raw=JSON.parse(win.localStorage.getItem(EXTRAS_KEY)||'null'),p=raw?.profiles?.[profileName];if(!p?.biomeBadge)return;
        p.biomeBadge.left=fixed.left/win.innerWidth;p.biomeBadge.bottom=Math.max(0,win.innerHeight-fixed.bottom)/win.innerHeight;p.biomeBadge.width=fixed.width;
        win.localStorage.setItem(EXTRAS_KEY,JSON.stringify(raw));
      }catch{}
    }

    function normalizeSaved(){
      const runtime=HUD.getRuntime?.(),state=runtime?.current?.();if(!runtime||!state)return;
      const layouts=runtime.savedLayouts?.();if(!layouts)return;
      const bounds=viewportBounds(win,doc),g=state.geometry,profileName=state.profile,rects=[];
      for(const id of EDITABLE_IDS){const r=geometryRect(id,g);if(r)rects.push({id,rect:r});}
      for(const item of rects){
        const others=rects.filter(x=>x.id!==item.id).map(x=>x.rect);
        const fixed=snapRect(item.rect,bounds,others,8).rect;
        writeRect(layouts,profileName,item.id,fixed,{width:win.innerWidth,height:win.innerHeight});
      }
      runtime.replace?.(layouts);normalizeBiomeSaved(profileName,bounds);
    }

    function emergencyReset(){
      if(!win.confirm('Аварийно восстановить стандартный интерфейс на всех экранах? Сохранение игры не удаляется.'))return;
      win.localStorage.removeItem(LAYOUT_KEY);win.localStorage.removeItem(EXTRAS_KEY);
      win.localStorage.removeItem('monsterThrone.desktopJoystickVisible.v1');win.localStorage.removeItem('monsterThrone.desktopHudPolish.v1');
      win.location.reload();
    }
    function ensureEmergencyButton(){
      const footer=doc.querySelector('#systemMenu .system-menu-footer');if(!footer||$('hudEmergencyReset'))return;
      const button=doc.createElement('button');button.id='hudEmergencyReset';button.type='button';button.className='hud-emergency-reset';button.textContent='⚠ Восстановить интерфейс';button.addEventListener('click',emergencyReset);footer.prepend(button);
    }

    doc.addEventListener('pointerdown',event=>{
      const handle=event.target.closest?.('.hud-editor-handle[data-editor-id]');if(!handle)return;
      activeId=handle.dataset.editorId;ensureDecor();scheduleInspect();
    },true);
    doc.addEventListener('pointermove',()=>{if(activeId)scheduleInspect();},{capture:true,passive:true});
    doc.addEventListener('pointerup',()=>{
      if(!activeId)return;activeId=null;
      // Never write a second preview on release. The base editor remains the
      // single source of truth; final clamping/snapping happens once on Save.
      win.setTimeout(()=>showGuides({}),240);
    },true);
    doc.addEventListener('pointercancel',()=>{activeId=null;showGuides({});},true);
    doc.addEventListener('click',event=>{
      if(event.target.closest?.('#hudEditorSave'))win.setTimeout(normalizeSaved,0);
      if(event.target.closest?.('#hudEditorCancel'))showGuides({});
      if(event.target.closest?.('#hudEditCurrent,[data-edit-id]'))win.setTimeout(()=>{ensureDecor();renderSafeBox();},0);
    });
    doc.addEventListener('keydown',event=>{if(event.ctrlKey&&event.shiftKey&&(event.code==='Digit0'||event.key==='0')){event.preventDefault();emergencyReset();}});
    win.addEventListener('resize',()=>{renderSafeBox();if(overlay())scheduleInspect();},{passive:true});
    win.addEventListener('orientationchange',()=>win.setTimeout(()=>{renderSafeBox();if(overlay())scheduleInspect();},80),{passive:true});
    const observer=new MutationObserver(()=>{ensureEmergencyButton();if(overlay())ensureDecor();});observer.observe(doc.body,{childList:true,subtree:true});
    ensureEmergencyButton();return {destroy(){observer.disconnect();}};
  }

  return {clampRect,overlapRatio,snapRect,safeBounds,viewportBounds,geometryRect,writeRect,rectCenterInside,start};
});