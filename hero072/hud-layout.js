(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MonsterThroneHudLayout=api;
  if(root.MonsterThroneMobile)api.patchMobile(root.MonsterThroneMobile,root);
  if(root.document&&root.addEventListener)api.start();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_KEY='monsterThrone.hudLayouts.v1';
  const VERSION=2;
  const PROFILE_NAMES=['mobilePortrait','mobileLandscape','desktop'];
  const ACTION_IDS=['actionAttack','actionDodge','actionPickup','actionUse'];
  const MANDATORY=['joystick','actions',...ACTION_IDS];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;

  const DEFAULT_LAYOUTS={
    version:VERSION,
    profiles:{
      mobilePortrait:{
        touch:true,orientation:'portrait',hotbarSlots:4,actionMode:'group',
        elements:{
          joystick:{left:.036,bottom:.017,width:112,height:112,visible:true},
          actions:{right:.026,bottom:.012,cellWidth:64,cellHeight:54,gap:7,visible:true},
          actionAttack:{right:.208,bottom:.084,width:64,height:54,visible:true},
          actionDodge:{right:.026,bottom:.084,width:64,height:54,visible:true},
          actionPickup:{right:.208,bottom:.012,width:64,height:54,visible:true},
          actionUse:{right:.026,bottom:.012,width:64,height:54,visible:true},
          hotbar:{left:.021,right:.021,bottom:.175,height:78,visible:true},
          minimap:{right:.031,bottom:.339,radius:46,visible:true}
        }
      },
      mobileLandscape:{
        touch:true,orientation:'landscape',hotbarSlots:4,actionMode:'group',
        elements:{
          joystick:{left:.008,bottom:.015,width:88,height:88,visible:true},
          actions:{right:.008,bottom:.015,cellWidth:54,cellHeight:44,gap:4,visible:true},
          actionAttack:{right:.070,bottom:.127,width:54,height:44,visible:true},
          actionDodge:{right:.008,bottom:.127,width:54,height:44,visible:true},
          actionPickup:{right:.070,bottom:.015,width:54,height:44,visible:true},
          actionUse:{right:.008,bottom:.015,width:54,height:44,visible:true},
          hotbar:{left:.121,right:.149,bottom:.015,height:58,visible:true},
          minimap:{right:.014,bottom:.267,radius:36,visible:true}
        }
      },
      desktop:{
        touch:false,orientation:'any',hotbarSlots:8,actionMode:'group',
        elements:{
          joystick:{left:.014,bottom:.021,width:112,height:112,visible:true},
          actions:{right:.010,bottom:.018,cellWidth:64,cellHeight:54,gap:7,visible:true},
          actionAttack:{right:.062,bottom:.097,width:64,height:54,visible:true},
          actionDodge:{right:.010,bottom:.097,width:64,height:54,visible:true},
          actionPickup:{right:.062,bottom:.018,width:64,height:54,visible:true},
          actionUse:{right:.010,bottom:.018,width:64,height:54,visible:true},
          hotbar:{left:.18,right:.18,bottom:.020,height:82,visible:true},
          minimap:{right:.009,bottom:.021,radius:72,visible:true}
        }
      }
    }
  };

  function detectTouch(capabilities={}){
    if(typeof capabilities.touch==='boolean')return capabilities.touch;
    if(finite(capabilities.maxTouchPoints,0)>0)return true;
    if(typeof capabilities.coarsePointer==='boolean')return capabilities.coarsePointer;
    try{return !!capabilities.matchMedia?.('(pointer: coarse)').matches;}catch{return false;}
  }

  const usesTouchHud=(profile,touch)=>!!touch&&profile!=='desktop';

  function profileForViewport(viewport={},capabilities={}){
    const width=Math.max(1,finite(viewport.width,1)),height=Math.max(1,finite(viewport.height,1));
    const touch=detectTouch(capabilities),finePointer=!!capabilities.finePointer;
    if(!touch||(finePointer&&width>=900))return 'desktop';
    return width>height?'mobileLandscape':'mobilePortrait';
  }

  function sanitizeElement(value,fallback,name){
    const source=value&&typeof value==='object'?value:{};
    const out={};
    for(const [key,defaultValue] of Object.entries(fallback)){
      if(typeof defaultValue==='boolean')out[key]=MANDATORY.includes(name)?true:source[key]!==false;
      else if(['left','right','bottom'].includes(key))out[key]=clamp(finite(source[key],defaultValue),0,.92);
      else if(key==='radius')out[key]=clamp(finite(source[key],defaultValue),24,160);
      else if(['width','height','cellWidth','cellHeight'].includes(key))out[key]=clamp(finite(source[key],defaultValue),44,260);
      else if(key==='gap')out[key]=clamp(finite(source[key],defaultValue),0,32);
      else out[key]=finite(source[key],defaultValue);
    }
    return out;
  }

  function sanitizeLayouts(value){
    const source=value&&typeof value==='object'?value:{};
    const profiles=source.profiles&&typeof source.profiles==='object'?source.profiles:{};
    const out={version:VERSION,profiles:{}};
    for(const name of PROFILE_NAMES){
      const fallback=DEFAULT_LAYOUTS.profiles[name],candidate=profiles[name]&&typeof profiles[name]==='object'?profiles[name]:{};
      const elements=candidate.elements&&typeof candidate.elements==='object'?candidate.elements:{};
      out.profiles[name]={
        touch:fallback.touch,
        orientation:fallback.orientation,
        hotbarSlots:clamp(Math.round(finite(candidate.hotbarSlots,fallback.hotbarSlots)),1,8),
        actionMode:candidate.actionMode==='individual'?'individual':'group',
        elements:{}
      };
      for(const [elementName,elementFallback] of Object.entries(fallback.elements)){
        out.profiles[name].elements[elementName]=sanitizeElement(elements[elementName],elementFallback,elementName);
      }
    }
    return out;
  }

  function readStorage(storage){
    if(!storage||typeof storage.getItem!=='function')return {layouts:clone(DEFAULT_LAYOUTS),recovered:false};
    const raw=storage.getItem(STORAGE_KEY);
    if(!raw)return {layouts:clone(DEFAULT_LAYOUTS),recovered:false};
    try{
      const parsed=JSON.parse(raw),layouts=sanitizeLayouts(parsed);
      return {layouts,recovered:parsed.version!==VERSION||JSON.stringify(parsed)!==JSON.stringify(layouts)};
    }catch{return {layouts:clone(DEFAULT_LAYOUTS),recovered:true};}
  }

  function save(storage,layouts){
    const clean=sanitizeLayouts(layouts);
    if(storage&&typeof storage.setItem==='function')storage.setItem(STORAGE_KEY,JSON.stringify(clean));
    return clean;
  }

  function anchoredRect(element,safeWidth,safeHeight){
    const width=element.width,height=element.height;
    const right=clamp(Math.round(element.right*safeWidth),0,Math.max(0,safeWidth-width));
    const bottom=clamp(Math.round(element.bottom*safeHeight),0,Math.max(0,safeHeight-height));
    return {...element,width,height,right,bottom,left:safeWidth-right-width,top:safeHeight-bottom-height};
  }

  function viewportGeometry(profileName,width,height,layouts=DEFAULT_LAYOUTS){
    const safeWidth=Math.max(1,finite(width,1)),safeHeight=Math.max(1,finite(height,1));
    const clean=sanitizeLayouts(layouts),resolved=PROFILE_NAMES.includes(profileName)?profileName:'desktop',profile=clean.profiles[resolved];
    const e=profile.elements;
    const px=(ratio,total,max)=>clamp(Math.round(ratio*total),0,max);
    const joystick={...e.joystick,left:px(e.joystick.left,safeWidth,Math.max(0,safeWidth-e.joystick.width)),bottom:px(e.joystick.bottom,safeHeight,Math.max(0,safeHeight-e.joystick.height))};
    joystick.top=safeHeight-joystick.bottom-joystick.height;
    const actionsWidth=e.actions.cellWidth*2+e.actions.gap,actionsHeight=e.actions.cellHeight*2+e.actions.gap;
    const actions={...e.actions,width:actionsWidth,height:actionsHeight,right:px(e.actions.right,safeWidth,Math.max(0,safeWidth-actionsWidth)),bottom:px(e.actions.bottom,safeHeight,Math.max(0,safeHeight-actionsHeight))};
    actions.left=safeWidth-actions.right-actions.width;actions.top=safeHeight-actions.bottom-actions.height;
    const hotbarLeft=px(e.hotbar.left,safeWidth,safeWidth-44),hotbarRight=px(e.hotbar.right,safeWidth,safeWidth-44);
    const hotbar={...e.hotbar,left:hotbarLeft,right:Math.min(hotbarRight,Math.max(0,safeWidth-hotbarLeft-44)),bottom:px(e.hotbar.bottom,safeHeight,Math.max(0,safeHeight-e.hotbar.height))};
    hotbar.width=Math.max(44,safeWidth-hotbar.left-hotbar.right);hotbar.top=safeHeight-hotbar.bottom-hotbar.height;
    const r=e.minimap.radius,miniRight=px(e.minimap.right,safeWidth,Math.max(0,safeWidth-r*2)),miniBottom=px(e.minimap.bottom,safeHeight,Math.max(0,safeHeight-r*2));
    const minimap={...e.minimap,right:miniRight,bottom:miniBottom,x:clamp(safeWidth-r-miniRight,r,safeWidth-r),y:clamp(safeHeight-r-miniBottom,r,safeHeight-r)};
    minimap.left=minimap.x-r;minimap.top=minimap.y-r;minimap.width=r*2;minimap.height=r*2;
    const individual={};
    for(const id of ACTION_IDS)individual[id]=anchoredRect(e[id],safeWidth,safeHeight);
    return {profile:resolved,width:safeWidth,height:safeHeight,touch:profile.touch,hotbarSlots:profile.hotbarSlots,actionMode:profile.actionMode,elements:{joystick,actions,...individual,hotbar,minimap}};
  }

  function registerElements(doc){
    if(!doc?.querySelector)return {};
    const map={
      joystick:doc.getElementById('joystick'),
      actions:doc.querySelector('.mobile-actions'),
      hotbar:doc.getElementById('hotbar'),
      actionAttack:doc.querySelector('[data-mobile-action="attack"]'),
      actionDodge:doc.querySelector('[data-mobile-action="dodge"]'),
      actionPickup:doc.querySelector('[data-mobile-action="pickup"]'),
      actionUse:doc.querySelector('[data-mobile-action="use"]')
    };
    for(const [id,node] of Object.entries(map))if(node)node.dataset.hudId=id;
    return map;
  }

  function applyCssVariables(doc,geometry){
    const style=doc?.documentElement?.style;if(!style)return;
    const e=geometry.elements;
    const set=(name,value)=>style.setProperty(name,`${Math.round(value)}px`);
    set('--hud-joystick-left',e.joystick.left);set('--hud-joystick-bottom',e.joystick.bottom);set('--hud-joystick-width',e.joystick.width);set('--hud-joystick-height',e.joystick.height);
    set('--hud-actions-right',e.actions.right);set('--hud-actions-bottom',e.actions.bottom);set('--hud-action-width',e.actions.cellWidth);set('--hud-action-height',e.actions.cellHeight);set('--hud-action-gap',e.actions.gap);
    for(const id of ACTION_IDS){
      const key=id.replace('action','').toLowerCase(),a=e[id];
      set(`--hud-${key}-right`,a.right);set(`--hud-${key}-bottom`,a.bottom);set(`--hud-${key}-width`,a.width);set(`--hud-${key}-height`,a.height);
    }
    set('--hud-hotbar-left',e.hotbar.left);set('--hud-hotbar-right',e.hotbar.right);set('--hud-hotbar-bottom',e.hotbar.bottom);set('--hud-hotbar-height',e.hotbar.height);
    style.setProperty('--hud-hotbar-slots',String(geometry.hotbarSlots));
    style.setProperty('--hud-slot-basis',`calc((100% - ${(geometry.hotbarSlots-1)*4}px)/${geometry.hotbarSlots})`);
  }

  function applyBodyState(doc,profile,geometry,touch){
    const body=doc?.body;if(!body)return;
    body.classList.remove('hud-profile-mobilePortrait','hud-profile-mobileLandscape','hud-profile-desktop','hud-touch','hud-action-mode-group','hud-action-mode-individual','hud-hide-hotbar','hud-hide-minimap');
    body.classList.add('hud-layout-enabled',`hud-profile-${profile}`,`hud-action-mode-${geometry.actionMode}`);
    if(usesTouchHud(profile,touch))body.classList.add('hud-touch');
    if(!geometry.elements.hotbar.visible)body.classList.add('hud-hide-hotbar');
    if(!geometry.elements.minimap.visible)body.classList.add('hud-hide-minimap');
    body.dataset.hudProfile=profile;
  }

  let runtime=null;
  function createRuntime(options={}){
    const win=options.window||((typeof window!=='undefined')?window:null),doc=options.document||win?.document,storage=options.storage||win?.localStorage;
    const capabilities=options.capabilities||{};
    let state=readStorage(storage),layouts=state.layouts,previewLayouts=null,current=null,frame=0;
    if(storage&&(!storage.getItem(STORAGE_KEY)||state.recovered))layouts=save(storage,layouts);
    registerElements(doc);

    const apply=()=>{
      frame=0;
      const width=finite(options.width,win?.innerWidth||doc?.documentElement?.clientWidth||1),height=finite(options.height,win?.innerHeight||doc?.documentElement?.clientHeight||1);
      const matcher=capabilities.matchMedia||win?.matchMedia?.bind(win);
      const touch=detectTouch({touch:capabilities.touch,maxTouchPoints:capabilities.maxTouchPoints??win?.navigator?.maxTouchPoints,coarsePointer:capabilities.coarsePointer,matchMedia:matcher});
      const finePointer=typeof capabilities.finePointer==='boolean'?capabilities.finePointer:!!matcher?.('(pointer: fine)').matches;
      const profile=profileForViewport({width,height},{touch,finePointer});
      const active=previewLayouts||layouts,geometry=viewportGeometry(profile,width,height,active);geometry.touch=touch;
      current={profile,layouts:clone(active),geometry,touch,preview:!!previewLayouts};
      applyBodyState(doc,profile,geometry,touch);
      applyCssVariables(doc,geometry);
      if(win?.dispatchEvent&&typeof win.CustomEvent==='function')win.dispatchEvent(new win.CustomEvent('hudlayoutchange',{detail:{profile,geometry,touch,preview:!!previewLayouts}}));
      return current;
    };
    const schedule=()=>{if(frame)return;frame=win?.requestAnimationFrame?win.requestAnimationFrame(apply):setTimeout(apply,0);};
    win?.addEventListener?.('resize',schedule,{passive:true});
    win?.addEventListener?.('orientationchange',schedule,{passive:true});
    const media=win?.matchMedia?.('(pointer: coarse)');media?.addEventListener?.('change',schedule);
    apply();
    return {
      current:()=>current,
      layouts:()=>clone(previewLayouts||layouts),
      savedLayouts:()=>clone(layouts),
      apply,
      preview(next){previewLayouts=sanitizeLayouts(next);return apply();},
      cancelPreview(){previewLayouts=null;return apply();},
      commit(next=previewLayouts){if(next)layouts=save(storage,next);previewLayouts=null;return apply();},
      reset(profileName){const defaults=clone(DEFAULT_LAYOUTS);previewLayouts=null;if(PROFILE_NAMES.includes(profileName))layouts.profiles[profileName]=defaults.profiles[profileName];else layouts=defaults;layouts=save(storage,layouts);return apply();},
      replace(next){layouts=save(storage,next);previewLayouts=null;return apply();},
      destroy(){win?.removeEventListener?.('resize',schedule);win?.removeEventListener?.('orientationchange',schedule);media?.removeEventListener?.('change',schedule);}
    };
  }

  function start(options={}){
    if(runtime)return runtime;
    const doc=options.document||((typeof document!=='undefined')?document:null);
    if(!doc)return null;
    const launch=()=>{if(!runtime)runtime=createRuntime(options);};
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',launch,{once:true});else launch();
    return runtime;
  }

  function getRuntime(){return runtime;}
  function current(){return runtime?.current()||null;}
  function minimapLayout(width,height,fallback){const state=current();if(!state)return fallback;const m=state.geometry.elements.minimap;if(!m.visible)return {x:-9999,y:-9999,r:0};return {x:m.x,y:m.y,r:m.radius};}
  function patchMobile(mobile,environment={}){
    if(!mobile||typeof mobile.minimapLayout!=='function'||mobile.__hudLayoutPatched)return false;
    const original=mobile.minimapLayout.bind(mobile);
    mobile.minimapLayout=(width,height,landscape=false,touchLayout=false)=>{
      const state=current();
      if(state){if(state.profile==='desktop')return original(width,height,landscape,touchLayout);const m=state.geometry.elements.minimap;return m.visible?{x:m.x,y:m.y,r:m.radius}:{x:-9999,y:-9999,r:0};}
      const matcher=environment.matchMedia?.bind?.(environment),touch=detectTouch({maxTouchPoints:environment.navigator?.maxTouchPoints,matchMedia:matcher})||touchLayout,finePointer=!!matcher?.('(pointer: fine)').matches;
      if(!touch||(finePointer&&width>=900))return original(width,height,landscape,touchLayout);
      const profile=landscape?'mobileLandscape':'mobilePortrait',m=viewportGeometry(profile,width,height,DEFAULT_LAYOUTS).elements.minimap;return {x:m.x,y:m.y,r:m.radius};
    };
    mobile.__hudLayoutPatched=true;return true;
  }

  return {STORAGE_KEY,VERSION,PROFILE_NAMES,ACTION_IDS,DEFAULT_LAYOUTS,detectTouch,usesTouchHud,profileForViewport,sanitizeLayouts,readStorage,save,viewportGeometry,registerElements,createRuntime,start,getRuntime,current,minimapLayout,patchMobile,clone};
});
