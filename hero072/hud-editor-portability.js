(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MonsterThroneHudPortability=api;
  if(root.document&&root.addEventListener)api.start(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const FORMAT='monster-throne-hud-layout';
  const VERSION=1;
  const PORTABILITY_KEY='monsterThrone.hudPortability.v1';
  const LAYOUT_KEY='monsterThrone.hudLayouts.v1';
  const EXTRAS_KEY='monsterThrone.hudEditorExtras.v1';
  const DESKTOP_JOYSTICK_KEY='monsterThrone.desktopJoystickVisible.v1';
  const DESKTOP_TOUCH_KEY='monsterThrone.desktopTouchControls';
  const PROFILES=['mobilePortrait','mobileLandscape','desktop'];
  const ACTION_IDS=['actionAttack','actionDodge','actionPickup','actionUse'];
  const CANONICAL_REFS={mobilePortrait:{width:390,height:844},mobileLandscape:{width:844,height:390},desktop:{width:1440,height:900}};
  const EXTRA_DEFAULTS={
    mobilePortrait:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:true,biomeBadge:true},biomeBadge:{left:.04,bottom:.275,width:196,compact:false}},
    mobileLandscape:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:true,biomeBadge:true},biomeBadge:{left:.18,bottom:.17,width:154,compact:true}},
    desktop:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:true,biomeBadge:true},biomeBadge:{left:.02,bottom:.18,width:260,compact:false}}
  };
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;

  function cleanRef(value,fallback){
    const source=value&&typeof value==='object'?value:{};
    return {width:clamp(Math.round(finite(source.width,fallback.width)),240,4096),height:clamp(Math.round(finite(source.height,fallback.height)),240,4096)};
  }
  function deviceRatio(source,target){
    const sw=Math.max(1,finite(source?.width,1)),sh=Math.max(1,finite(source?.height,1));
    const tw=Math.max(1,finite(target?.width,sw)),th=Math.max(1,finite(target?.height,sh));
    return clamp(Math.min(tw/sw,th/sh),.75,1.35);
  }
  function scaleProfile(profile,ratio){
    const out=clone(profile||{}),e=out.elements||{};
    const px=(value,min,max)=>clamp(finite(value,min)*ratio,min,max);
    if(e.joystick){e.joystick.width=px(e.joystick.width,44,260);e.joystick.height=px(e.joystick.height,44,260);}
    if(e.actions){e.actions.cellWidth=px(e.actions.cellWidth,44,260);e.actions.cellHeight=px(e.actions.cellHeight,44,260);e.actions.gap=px(e.actions.gap,0,32);}
    for(const id of ACTION_IDS)if(e[id]){e[id].width=px(e[id].width,44,260);e[id].height=px(e[id].height,44,260);}
    if(e.hotbar)e.hotbar.height=px(e.hotbar.height,44,260);
    if(e.minimap)e.minimap.radius=px(e.minimap.radius,24,160);
    return out;
  }
  function cleanExtras(raw){
    const source=raw&&typeof raw==='object'?raw:{};
    const out={version:1,profiles:{}};
    for(const profile of PROFILES){
      const fallback=EXTRA_DEFAULTS[profile],candidate=source.profiles?.[profile]||{};
      const visibility={};
      for(const id of ACTION_IDS.concat('biomeBadge'))visibility[id]=candidate.visibility?.[id]!==false;
      const badge=candidate.biomeBadge||{};
      out.profiles[profile]={visibility,biomeBadge:{
        left:clamp(finite(badge.left,fallback.biomeBadge.left),0,.92),
        bottom:clamp(finite(badge.bottom,fallback.biomeBadge.bottom),0,.92),
        width:clamp(finite(badge.width,fallback.biomeBadge.width),100,360),
        compact:badge.compact===true
      }};
    }
    return out;
  }
  function scaleExtraProfile(profile,ratio){
    const out=clone(profile||{});
    if(out.biomeBadge)out.biomeBadge.width=clamp(finite(out.biomeBadge.width,160)*ratio,100,360);
    return out;
  }
  function defaultState(){
    const presets={};for(const p of PROFILES)presets[p]=[null,null,null];
    return {version:VERSION,scaleByProfile:{mobilePortrait:1,mobileLandscape:1,desktop:1},viewportRefs:clone(CANONICAL_REFS),presets};
  }
  function cleanPreset(value){
    if(!value||typeof value!=='object'||!value.layoutProfile)return null;
    return {savedAt:Math.max(0,finite(value.savedAt,0)),viewportRef:cleanRef(value.viewportRef,CANONICAL_REFS.mobilePortrait),layoutProfile:clone(value.layoutProfile),extrasProfile:value.extrasProfile?clone(value.extrasProfile):null,scale:clamp(finite(value.scale,1),.8,1.25)};
  }
  function cleanState(raw){
    const source=raw&&typeof raw==='object'?raw:{},out=defaultState();
    for(const profile of PROFILES){
      out.scaleByProfile[profile]=clamp(finite(source.scaleByProfile?.[profile],1),.8,1.25);
      out.viewportRefs[profile]=cleanRef(source.viewportRefs?.[profile],CANONICAL_REFS[profile]);
      const list=Array.isArray(source.presets?.[profile])?source.presets[profile]:[];
      out.presets[profile]=[0,1,2].map(i=>{
        const preset=cleanPreset(list[i]);if(preset)preset.viewportRef=cleanRef(list[i].viewportRef,CANONICAL_REFS[profile]);return preset;
      });
    }
    return out;
  }
  function buildBundle({layouts,extras,state,options={}}){
    const clean=cleanState(state);
    return {format:FORMAT,version:VERSION,exportedAt:new Date().toISOString(),layouts:clone(layouts),extras:cleanExtras(extras),viewportRefs:clone(clean.viewportRefs),scaleByProfile:clone(clean.scaleByProfile),options:{desktopJoystick:options.desktopJoystick===true,desktopTouch:options.desktopTouch===true}};
  }
  function validateBundle(bundle){
    if(!bundle||typeof bundle!=='object')throw new Error('Файл не содержит объект настроек HUD.');
    if(bundle.format!==FORMAT)throw new Error('Это не файл раскладки Monster Throne HUD.');
    if(!Number.isFinite(Number(bundle.version))||Number(bundle.version)>VERSION)throw new Error('Версия файла HUD новее поддерживаемой.');
    if(!bundle.layouts?.profiles)throw new Error('В файле отсутствуют профили раскладки.');
    return true;
  }
  function adaptBundle(bundle,targetRefs){
    validateBundle(bundle);
    const layouts=clone(bundle.layouts),extras=cleanExtras(bundle.extras),refs={};
    for(const profile of PROFILES){
      const sourceRef=cleanRef(bundle.viewportRefs?.[profile],CANONICAL_REFS[profile]);
      const targetRef=cleanRef(targetRefs?.[profile],CANONICAL_REFS[profile]);
      const ratio=deviceRatio(sourceRef,targetRef);refs[profile]=targetRef;
      if(layouts.profiles?.[profile])layouts.profiles[profile]=scaleProfile(layouts.profiles[profile],ratio);
      if(extras.profiles?.[profile])extras.profiles[profile]=scaleExtraProfile(extras.profiles[profile],ratio);
    }
    return {layouts,extras,viewportRefs:refs,scaleByProfile:{...defaultState().scaleByProfile,...bundle.scaleByProfile},options:{desktopJoystick:bundle.options?.desktopJoystick===true,desktopTouch:bundle.options?.desktopTouch===true}};
  }
  function adaptPreset(preset,targetRef,profile){
    const source=cleanRef(preset.viewportRef,CANONICAL_REFS[profile]),target=cleanRef(targetRef,CANONICAL_REFS[profile]),ratio=deviceRatio(source,target);
    return {layoutProfile:scaleProfile(preset.layoutProfile,ratio),extrasProfile:preset.extrasProfile?scaleExtraProfile(preset.extrasProfile,ratio):null,scale:clamp(finite(preset.scale,1),.8,1.25),viewportRef:target};
  }

  function start(win){
    const doc=win.document,HUD=win.MonsterThroneHudLayout;if(!doc||!HUD)return null;
    const $=id=>doc.getElementById(id);
    let state=readState();
    let observer=null;

    function readState(){try{return cleanState(JSON.parse(win.localStorage.getItem(PORTABILITY_KEY)||'null'));}catch{return defaultState();}}
    function saveState(){state=cleanState(state);win.localStorage.setItem(PORTABILITY_KEY,JSON.stringify(state));}
    function activeProfile(){return HUD.current?.()?.profile||doc.body.dataset.hudProfile||'desktop';}
    function runtime(){return HUD.getRuntime?.()||HUD.start?.()||null;}
    function activeRef(){return {width:Math.max(1,win.innerWidth||1),height:Math.max(1,win.innerHeight||1)};}
    function recordRef(){const profile=activeProfile();state.viewportRefs[profile]=cleanRef(activeRef(),CANONICAL_REFS[profile]);saveState();}
    function readExtras(){try{return cleanExtras(JSON.parse(win.localStorage.getItem(EXTRAS_KEY)||'null'));}catch{return cleanExtras(null);}}
    function writeExtras(value){win.localStorage.setItem(EXTRAS_KEY,JSON.stringify(cleanExtras(value)));}
    function applyExtrasVisual(profileData){
      if(!profileData)return;
      const keys={actionAttack:'attack',actionDodge:'dodge',actionPickup:'pickup',actionUse:'use'};
      for(const id of ACTION_IDS)doc.body.classList.toggle(`hud-hide-${keys[id]}`,profileData.visibility?.[id]===false);
      doc.body.classList.toggle('hud-hide-biome',profileData.visibility?.biomeBadge===false);
      doc.body.classList.toggle('hud-biome-compact',profileData.biomeBadge?.compact===true);
      const badge=profileData.biomeBadge||{},width=clamp(finite(badge.width,160),100,Math.max(100,win.innerWidth-16));
      const left=clamp(Math.round(finite(badge.left,0)*win.innerWidth),0,Math.max(0,win.innerWidth-width));
      const bottom=clamp(Math.round(finite(badge.bottom,0)*win.innerHeight),0,Math.max(0,win.innerHeight-38));
      const style=doc.documentElement.style;style.setProperty('--hud-biome-left',`${left}px`);style.setProperty('--hud-biome-bottom',`${bottom}px`);style.setProperty('--hud-biome-width',`${Math.round(width)}px`);
    }
    function persistWorld(){try{win.MonsterThroneV08?.saveGame?.(true,'auto');}catch{}}
    function reloadForExtras(){persistWorld();win.setTimeout(()=>win.location.reload(),40);}

    function setScale(next){
      const rt=runtime();if(!rt)return;
      const profile=activeProfile(),old=state.scaleByProfile[profile]||1,value=clamp(finite(next,old),.8,1.25),ratio=value/old;
      if(Math.abs(ratio-1)<.0001)return syncUi();
      const layouts=rt.savedLayouts();layouts.profiles[profile]=scaleProfile(layouts.profiles[profile],ratio);rt.replace(layouts);
      state.scaleByProfile[profile]=value;state.viewportRefs[profile]=cleanRef(activeRef(),CANONICAL_REFS[profile]);saveState();syncUi();
    }
    function capturePreset(slot){
      const rt=runtime();if(!rt)return;
      const profile=activeProfile(),layouts=rt.savedLayouts(),extras=readExtras();
      state.presets[profile][slot]={savedAt:Date.now(),viewportRef:cleanRef(activeRef(),CANONICAL_REFS[profile]),layoutProfile:clone(layouts.profiles[profile]),extrasProfile:clone(extras.profiles[profile]),scale:state.scaleByProfile[profile]||1};
      saveState();syncUi();
    }
    function applyPreset(slot){
      const profile=activeProfile(),preset=state.presets[profile][slot];if(!preset)return;
      if(!win.confirm(`Применить пресет ${slot+1} для текущего экрана?`))return;
      const rt=runtime();if(!rt)return;
      const adapted=adaptPreset(preset,activeRef(),profile),layouts=rt.savedLayouts(),extras=readExtras();
      layouts.profiles[profile]=adapted.layoutProfile;extras.profiles[profile]=adapted.extrasProfile||extras.profiles[profile];
      rt.replace(layouts);writeExtras(extras);applyExtrasVisual(extras.profiles[profile]);
      state.scaleByProfile[profile]=adapted.scale;state.viewportRefs[profile]=adapted.viewportRef;saveState();reloadForExtras();
    }
    function clearPreset(slot){
      const profile=activeProfile();if(!state.presets[profile][slot])return;
      if(!win.confirm(`Удалить пресет ${slot+1}?`))return;state.presets[profile][slot]=null;saveState();syncUi();
    }
    function exportHud(){
      const rt=runtime();if(!rt)return;recordRef();
      const bundle=buildBundle({layouts:rt.savedLayouts(),extras:readExtras(),state,options:{desktopJoystick:win.localStorage.getItem(DESKTOP_JOYSTICK_KEY)==='1',desktopTouch:win.localStorage.getItem(DESKTOP_TOUCH_KEY)==='1'}});
      const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=doc.createElement('a');
      a.href=url;a.download=`monster-throne-hud-${new Date().toISOString().slice(0,10)}.json`;doc.body.appendChild(a);a.click();a.remove();win.setTimeout(()=>URL.revokeObjectURL(url),500);
    }
    async function importHud(file){
      let bundle;try{bundle=JSON.parse(await file.text());validateBundle(bundle);}catch(error){win.alert(error?.message||'Не удалось прочитать файл HUD.');return;}
      if(!win.confirm('Импорт заменит все три раскладки HUD и настройки видимости. Продолжить?'))return;
      const targetRefs=clone(state.viewportRefs);targetRefs[activeProfile()]=cleanRef(activeRef(),CANONICAL_REFS[activeProfile()]);
      const adapted=adaptBundle(bundle,targetRefs),rt=runtime();if(!rt)return;
      rt.replace(HUD.sanitizeLayouts(adapted.layouts));writeExtras(adapted.extras);applyExtrasVisual(adapted.extras.profiles[activeProfile()]);
      state.scaleByProfile={...state.scaleByProfile,...adapted.scaleByProfile};state.viewportRefs=adapted.viewportRefs;saveState();
      win.localStorage.setItem(DESKTOP_JOYSTICK_KEY,adapted.options.desktopJoystick?'1':'0');
      win.localStorage.setItem(DESKTOP_TOUCH_KEY,adapted.options.desktopTouch?'1':'0');
      reloadForExtras();
    }

    function cardHtml(){
      return `<div id="hudPortabilityCard" class="hud-portability-card">
        <div class="hud-portability-heading"><strong>Размер и перенос HUD</strong><small>Размер хранится отдельно для вертикали, горизонтали и компьютера. Позиции остаются относительными.</small></div>
        <div class="hud-scale-row"><label for="hudProfileScale">Размер основных элементов</label><input id="hudProfileScale" type="range" min="80" max="125" step="5"><output id="hudProfileScaleValue">100%</output></div>
        <div class="hud-portability-actions"><button type="button" id="hudExportLayout">Экспорт HUD</button><button type="button" id="hudImportLayout">Импорт HUD</button><input id="hudImportLayoutInput" type="file" accept="application/json,.json" hidden></div>
        <div class="hud-preset-list">${[0,1,2].map(i=>`<div class="hud-preset-row" data-preset-slot="${i}"><span><b>Пресет ${i+1}</b><small data-preset-status="${i}">пусто</small></span><button type="button" data-preset-save="${i}">Сохранить</button><button type="button" data-preset-apply="${i}">Применить</button><button type="button" data-preset-clear="${i}" title="Удалить">×</button></div>`).join('')}</div>
      </div>`;
    }
    function ensureUi(){
      const page=doc.querySelector('[data-system-page="interface"]');if(!page||$('hudPortabilityCard'))return;
      const holder=doc.createElement('div');holder.innerHTML=cardHtml();const anchor=page.querySelector('.hud-interface-actions');page.insertBefore(holder.firstElementChild,anchor||null);
      $('hudProfileScale')?.addEventListener('input',event=>setScale(Number(event.target.value)/100));
      $('hudExportLayout')?.addEventListener('click',exportHud);
      $('hudImportLayout')?.addEventListener('click',()=>$('hudImportLayoutInput')?.click());
      $('hudImportLayoutInput')?.addEventListener('change',event=>{const file=event.target.files?.[0];if(file)importHud(file);event.target.value='';});
      page.addEventListener('click',event=>{
        const save=event.target.dataset.presetSave,apply=event.target.dataset.presetApply,clear=event.target.dataset.presetClear;
        if(save!==undefined)capturePreset(Number(save));else if(apply!==undefined)applyPreset(Number(apply));else if(clear!==undefined)clearPreset(Number(clear));
      });
      syncUi();
    }
    function syncUi(){
      ensureUi();const profile=activeProfile(),scale=state.scaleByProfile[profile]||1,input=$('hudProfileScale'),out=$('hudProfileScaleValue');
      if(input)input.value=String(Math.round(scale*100));if(out)out.textContent=`${Math.round(scale*100)}%`;
      for(let i=0;i<3;i++){
        const preset=state.presets[profile][i],status=doc.querySelector(`[data-preset-status="${i}"]`),apply=doc.querySelector(`[data-preset-apply="${i}"]`),clear=doc.querySelector(`[data-preset-clear="${i}"]`);
        if(status)status.textContent=preset?`сохранён ${new Date(preset.savedAt).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`:'пусто';
        if(apply)apply.disabled=!preset;if(clear)clear.disabled=!preset;
      }
    }
    function handleBaseReset(event){
      if(event.target.closest?.('#hudResetCurrent')){state.scaleByProfile[activeProfile()]=1;saveState();win.setTimeout(syncUi,0);}
      if(event.target.closest?.('#hudResetAll')){for(const p of PROFILES)state.scaleByProfile[p]=1;saveState();win.setTimeout(syncUi,0);}
    }

    const init=()=>{recordRef();ensureUi();syncUi();doc.addEventListener('click',handleBaseReset,true);win.addEventListener('hudlayoutchange',()=>{recordRef();syncUi();});};
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
    observer=new MutationObserver(()=>ensureUi());observer.observe(doc.body,{childList:true,subtree:true});
    return {destroy(){observer?.disconnect();}};
  }

  return {FORMAT,VERSION,PORTABILITY_KEY,PROFILES,CANONICAL_REFS,cleanRef,deviceRatio,scaleProfile,cleanExtras,scaleExtraProfile,defaultState,cleanState,buildBundle,validateBundle,adaptBundle,adaptPreset,start};
});
