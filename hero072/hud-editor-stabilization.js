(function(root){
  'use strict';
  const HUD=root.MonsterThroneHudLayout;
  if(!HUD||!root.document)return;

  const STORAGE_KEY='monsterThrone.hudEditorExtras.v1';
  const VERSION=1;
  const PROFILES=['mobilePortrait','mobileLandscape','desktop'];
  const ACTION_IDS=['actionAttack','actionDodge','actionPickup','actionUse'];
  const ACTION_KEYS={actionAttack:'attack',actionDodge:'dodge',actionPickup:'pickup',actionUse:'use'};
  const LABELS={
    joystick:'Джойстик',actionAttack:'Удар',actionDodge:'Рывок',actionPickup:'Подобрать',actionUse:'Использовать',
    hotbar:'Быстрые слоты',minimap:'Миникарта',biomeBadge:'Название местности'
  };
  const DEFAULTS={
    version:VERSION,
    profiles:{
      mobilePortrait:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:true,biomeBadge:true},biomeBadge:{left:.04,bottom:.275,width:196,compact:false}},
      mobileLandscape:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:true,biomeBadge:true},biomeBadge:{left:.18,bottom:.17,width:154,compact:true}},
      desktop:{visibility:{actionAttack:true,actionDodge:true,actionPickup:true,actionUse:true,biomeBadge:true},biomeBadge:{left:.02,bottom:.18,width:260,compact:false}}
    }
  };
  const clone=value=>JSON.parse(JSON.stringify(value));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const $=id=>document.getElementById(id);
  let extras=read();
  let editorSession=null;
  let frame=0;

  function activeProfile(){return HUD.current?.()?.profile||document.body.dataset.hudProfile||'desktop';}
  function clean(raw){
    const source=raw&&typeof raw==='object'?raw:{};
    const out=clone(DEFAULTS);
    for(const profile of PROFILES){
      const candidate=source.profiles?.[profile]||{};
      for(const id of ACTION_IDS.concat('biomeBadge'))out.profiles[profile].visibility[id]=candidate.visibility?.[id]!==false;
      const badge=candidate.biomeBadge||{};
      out.profiles[profile].biomeBadge.left=clamp(Number.isFinite(+badge.left)?+badge.left:out.profiles[profile].biomeBadge.left,0,.92);
      out.profiles[profile].biomeBadge.bottom=clamp(Number.isFinite(+badge.bottom)?+badge.bottom:out.profiles[profile].biomeBadge.bottom,0,.92);
      out.profiles[profile].biomeBadge.width=clamp(Number.isFinite(+badge.width)?+badge.width:out.profiles[profile].biomeBadge.width,100,360);
      out.profiles[profile].biomeBadge.compact=badge.compact===true;
    }
    return out;
  }
  function read(){
    try{return clean(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'));}catch{return clone(DEFAULTS);}
  }
  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(clean(extras)));extras=clean(extras);}
  function currentExtras(){return extras.profiles[activeProfile()]||extras.profiles.desktop;}

  function setClass(name,on){document.body.classList.toggle(name,!!on);}
  function applyExtras(){
    const profile=currentExtras();
    for(const id of ACTION_IDS)setClass(`hud-hide-${ACTION_KEYS[id]}`,profile.visibility[id]===false);
    setClass('hud-hide-biome',profile.visibility.biomeBadge===false);
    setClass('hud-biome-compact',profile.biomeBadge.compact===true);
    const style=document.documentElement.style;
    const width=Math.min(profile.biomeBadge.width,Math.max(100,innerWidth-16));
    const left=clamp(Math.round(profile.biomeBadge.left*innerWidth),0,Math.max(0,innerWidth-width));
    const estimatedHeight=profile.biomeBadge.compact?38:56;
    const bottom=clamp(Math.round(profile.biomeBadge.bottom*innerHeight),0,Math.max(0,innerHeight-estimatedHeight));
    style.setProperty('--hud-biome-left',`${left}px`);
    style.setProperty('--hud-biome-bottom',`${bottom}px`);
    style.setProperty('--hud-biome-width',`${Math.round(width)}px`);
    renderCatalog();
  }

  function restructureSystemMenu(){
    const card=document.querySelector('#systemMenu .pausecard');
    if(!card||card.classList.contains('system-menu-shell'))return;
    card.classList.add('system-menu-shell');
    const header=document.createElement('div');header.className='system-menu-header';
    const pages=document.createElement('div');pages.className='system-menu-pages';
    const footer=document.createElement('div');footer.className='system-menu-footer';
    for(const node of [...card.children]){
      if(node.matches?.('.system-page'))pages.appendChild(node);
      else if(node.id==='systemMenuClose')footer.appendChild(node);
      else header.appendChild(node);
    }
    const quick=document.createElement('button');
    quick.id='systemMenuQuickClose';quick.className='system-menu-quick-close';quick.type='button';quick.setAttribute('aria-label','Закрыть настройки');quick.textContent='×';
    quick.addEventListener('click',()=>$('systemMenuClose')?.click());
    header.appendChild(quick);
    card.append(header,pages,footer);
  }

  function catalogTemplate(){
    return `<div id="hudElementCatalog" class="hud-element-catalog">
      <div class="hud-catalog-heading"><strong>Элементы игрового экрана</strong><small>Скрытие и размещение сохраняются отдельно для текущего профиля.</small></div>
      <div class="hud-catalog-group"><b>Управление</b>
        ${row('joystick',false)}${row('actionAttack')}${row('actionDodge')}${row('actionPickup')}${row('actionUse')}
      </div>
      <div class="hud-catalog-group"><b>Игровой HUD</b>
        ${row('hotbar')}${row('minimap')}${row('biomeBadge',true,true)}
      </div>
    </div>`;
  }
  function row(id,hideable=true,compact=false){
    return `<div class="hud-catalog-row" data-catalog-id="${id}"><span>${LABELS[id]}</span>
      ${hideable?`<label class="hud-visibility-toggle"><input type="checkbox" data-visible-id="${id}"><i></i><em>Показывать</em></label>`:'<small>Обязательный</small>'}
      ${compact?'<label class="hud-compact-toggle"><input type="checkbox" id="hudBiomeCompact"> Компактно</label>':''}
      <button type="button" data-edit-id="${id}">На экране</button>
      <button type="button" data-reset-id="${id}" title="Сбросить элемент">↺</button>
    </div>`;
  }

  function ensureCatalog(){
    const page=document.querySelector('[data-system-page="interface"]');
    if(!page||$('hudElementCatalog'))return;
    const anchor=page.querySelector('.hud-interface-actions');
    const holder=document.createElement('div');holder.innerHTML=catalogTemplate();
    page.insertBefore(holder.firstElementChild,anchor||null);
    page.addEventListener('change',catalogChange);
    page.addEventListener('click',catalogClick);
    renderCatalog();
  }

  function catalogChange(event){
    const visible=event.target.dataset.visibleId;
    if(visible){setVisible(visible,event.target.checked);return;}
    if(event.target.id==='hudBiomeCompact'){
      currentExtras().biomeBadge.compact=event.target.checked;save();applyExtras();
    }
  }
  function catalogClick(event){
    const edit=event.target.dataset.editId,reset=event.target.dataset.resetId;
    if(edit){openEditorFor(edit);return;}
    if(reset)resetElement(reset);
  }

  function layoutElement(id){return HUD.getRuntime?.()?.savedLayouts?.()?.profiles?.[activeProfile()]?.elements?.[id];}
  function layoutVisible(id){return layoutElement(id)?.visible!==false;}
  function setLayoutVisible(id,visible){
    const runtime=HUD.getRuntime?.();if(!runtime)return;
    const layouts=runtime.savedLayouts(),profile=activeProfile();
    if(layouts.profiles?.[profile]?.elements?.[id]){
      layouts.profiles[profile].elements[id].visible=visible;
      runtime.replace(layouts);
    }
  }
  function isVisible(id){
    if(id==='hotbar'||id==='minimap')return layoutVisible(id);
    if(id==='joystick')return true;
    return currentExtras().visibility[id]!==false;
  }
  function setVisible(id,visible){
    if(id==='hotbar'||id==='minimap')setLayoutVisible(id,visible);
    else if(id!=='joystick'){currentExtras().visibility[id]=visible;save();}
    applyExtras();
  }
  function renderCatalog(){
    const catalog=$('hudElementCatalog');if(!catalog)return;
    for(const box of catalog.querySelectorAll('[data-visible-id]'))box.checked=isVisible(box.dataset.visibleId);
    const compact=$('hudBiomeCompact');if(compact)compact.checked=currentExtras().biomeBadge.compact===true;
    const title=$('hudProfileName');if(title&&HUD.current?.())title.textContent=({mobilePortrait:'Телефон · вертикально',mobileLandscape:'Телефон · горизонтально',desktop:'Компьютер'})[activeProfile()]||activeProfile();
  }

  function resetElement(id){
    const profile=activeProfile();
    if(id==='hotbar'||id==='minimap'){
      const runtime=HUD.getRuntime?.();if(!runtime)return;
      const layouts=runtime.savedLayouts();layouts.profiles[profile].elements[id]=clone(HUD.DEFAULT_LAYOUTS.profiles[profile].elements[id]);runtime.replace(layouts);
    }else if(id==='biomeBadge'){
      extras.profiles[profile].biomeBadge=clone(DEFAULTS.profiles[profile].biomeBadge);
      extras.profiles[profile].visibility.biomeBadge=true;save();
    }else if(ACTION_IDS.includes(id)){
      extras.profiles[profile].visibility[id]=true;save();
    }
    applyExtras();
  }

  function openEditorFor(id){
    if(ACTION_IDS.includes(id)){
      const mode=$('hudActionMode');
      if(mode&&mode.value!=='individual'){mode.value='individual';mode.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    $('hudEditCurrent')?.click();
    setTimeout(()=>{
      if(id==='biomeBadge')selectBiomeHandle();
      else document.querySelector(`.hud-editor-handle[data-editor-id="${id}"]`)?.scrollIntoView?.({block:'center',inline:'center'});
    },80);
  }

  function actualNode(id){
    return ({joystick:$('#joystick'),actions:document.querySelector('.mobile-actions'),actionAttack:document.querySelector('[data-mobile-action="attack"]'),actionDodge:document.querySelector('[data-mobile-action="dodge"]'),actionPickup:document.querySelector('[data-mobile-action="pickup"]'),actionUse:document.querySelector('[data-mobile-action="use"]'),hotbar:$('#hotbar')})[id]||null;
  }
  function correctHandleRects(){
    const overlay=$('hudEditorOverlay');
    if(!overlay){frame=0;return;}
    for(const handle of overlay.querySelectorAll('.hud-editor-handle[data-editor-id]')){
      const id=handle.dataset.editorId;if(id==='minimap'||id==='biomeBadge')continue;
      const node=actualNode(id),rect=node?.getBoundingClientRect?.();
      if(!rect||rect.width<2||rect.height<2)continue;
      handle.style.left=`${Math.round(rect.left)}px`;handle.style.top=`${Math.round(rect.top)}px`;handle.style.width=`${Math.round(rect.width)}px`;handle.style.height=`${Math.round(rect.height)}px`;
    }
    frame=requestAnimationFrame(correctHandleRects);
  }

  function biomeRect(profile=currentExtras()){
    const width=Math.min(profile.biomeBadge.width,Math.max(100,innerWidth-16));
    const node=$('worldStatus'),actual=node?.getBoundingClientRect?.();
    const height=actual?.height|| (profile.biomeBadge.compact?38:56);
    const left=clamp(Math.round(profile.biomeBadge.left*innerWidth),0,Math.max(0,innerWidth-width));
    const bottom=clamp(Math.round(profile.biomeBadge.bottom*innerHeight),0,Math.max(0,innerHeight-height));
    return {left,top:innerHeight-bottom-height,width,height,bottom};
  }
  function addBiomeHandle(){
    const stage=$('hudEditorStage');if(!stage||stage.querySelector('[data-editor-id="biomeBadge"]'))return;
    const rect=biomeRect(editorSession?.draft||currentExtras());
    const handle=document.createElement('div');handle.className='hud-editor-handle hud-editor-extension';handle.dataset.editorId='biomeBadge';
    handle.style.left=`${rect.left}px`;handle.style.top=`${rect.top}px`;handle.style.width=`${rect.width}px`;handle.style.height=`${rect.height}px`;
    handle.innerHTML='<span>Название местности</span><i class="hud-editor-resize" title="Изменить размер"></i>';
    handle.addEventListener('pointerdown',startBiomePointer);
    stage.appendChild(handle);
  }
  function selectBiomeHandle(){
    if(!editorSession)return;
    editorSession.selected='biomeBadge';
    document.querySelectorAll('.hud-editor-handle').forEach(node=>node.classList.toggle('selected',node.dataset.editorId==='biomeBadge'));
    const label=$('hudEditorSelection');if(label)label.textContent='Выбрано: Название местности';
    const visibility=$('hudEditorVisibility');if(visibility){visibility.classList.remove('hidden');visibility.textContent=editorSession.draft.visibility.biomeBadge===false?'Показать':'Скрыть';}
    const reset=$('hudEditorResetElement');if(reset)reset.disabled=false;
  }
  function clearBiomeSelection(){if(editorSession)editorSession.selected=null;}
  function startBiomePointer(event){
    event.preventDefault();event.stopPropagation();selectBiomeHandle();
    const handle=event.currentTarget,rect=handle.getBoundingClientRect(),resize=event.target.classList.contains('hud-editor-resize');
    editorSession.drag={resize,startX:event.clientX,startY:event.clientY,rect,pointerId:event.pointerId};
    handle.setPointerCapture?.(event.pointerId);handle.addEventListener('pointermove',moveBiomePointer);handle.addEventListener('pointerup',endBiomePointer,{once:true});handle.addEventListener('pointercancel',endBiomePointer,{once:true});
  }
  function moveBiomePointer(event){
    const drag=editorSession?.drag;if(!drag||event.pointerId!==drag.pointerId)return;event.preventDefault();
    const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
    let left=drag.rect.left,top=drag.rect.top,width=drag.rect.width,height=drag.rect.height;
    if(drag.resize)width=clamp(drag.rect.width+dx,100,Math.min(360,innerWidth-drag.rect.left));
    else{left=clamp(drag.rect.left+dx,0,innerWidth-width);top=clamp(drag.rect.top+dy,0,innerHeight-height);}
    editorSession.draft.biomeBadge.left=left/innerWidth;editorSession.draft.biomeBadge.bottom=(innerHeight-top-height)/innerHeight;editorSession.draft.biomeBadge.width=width;
    applyEditorDraft();
    event.currentTarget.style.left=`${Math.round(left)}px`;event.currentTarget.style.top=`${Math.round(top)}px`;event.currentTarget.style.width=`${Math.round(width)}px`;
  }
  function endBiomePointer(event){event.currentTarget.removeEventListener('pointermove',moveBiomePointer);if(editorSession)editorSession.drag=null;}
  function applyEditorDraft(){
    if(!editorSession)return;
    const profile=editorSession.draft;
    setClass('hud-hide-biome',profile.visibility.biomeBadge===false);setClass('hud-biome-compact',profile.biomeBadge.compact===true);
    const width=Math.min(profile.biomeBadge.width,Math.max(100,innerWidth-16));
    document.documentElement.style.setProperty('--hud-biome-left',`${clamp(Math.round(profile.biomeBadge.left*innerWidth),0,innerWidth-width)}px`);
    document.documentElement.style.setProperty('--hud-biome-bottom',`${clamp(Math.round(profile.biomeBadge.bottom*innerHeight),0,innerHeight-38)}px`);
    document.documentElement.style.setProperty('--hud-biome-width',`${Math.round(width)}px`);
  }

  function interceptToolbar(buttonId,handler){
    const button=$(buttonId);if(!button||button.dataset.extraIntercept)return;button.dataset.extraIntercept='1';
    button.addEventListener('click',event=>{if(editorSession?.selected!=='biomeBadge')return;event.preventDefault();event.stopImmediatePropagation();handler();},true);
  }
  function installEditorHooks(){
    const overlay=$('hudEditorOverlay');if(!overlay)return;
    if(editorSession){addBiomeHandle();return;}
    const profile=activeProfile(),saved=clone(extras.profiles[profile]);
    editorSession={profile,saved,draft:clone(saved),selected:null,drag:null};
    addBiomeHandle();
    overlay.addEventListener('pointerdown',event=>{if(event.target.closest?.('.hud-editor-handle')?.dataset.editorId!=='biomeBadge')clearBiomeSelection();},true);
    interceptToolbar('hudEditorSmaller',()=>scaleBiome(.9));
    interceptToolbar('hudEditorLarger',()=>scaleBiome(1.1));
    interceptToolbar('hudEditorVisibility',()=>{editorSession.draft.visibility.biomeBadge=!editorSession.draft.visibility.biomeBadge;applyEditorDraft();selectBiomeHandle();});
    interceptToolbar('hudEditorResetElement',()=>{editorSession.draft.biomeBadge=clone(DEFAULTS.profiles[profile].biomeBadge);editorSession.draft.visibility.biomeBadge=true;applyEditorDraft();refreshBiomeHandle();});
    $('hudEditorResetProfile')?.addEventListener('click',()=>{editorSession.draft=clone(DEFAULTS.profiles[profile]);applyEditorDraft();refreshBiomeHandle();},true);
    $('hudEditorSave')?.addEventListener('click',()=>{extras.profiles[profile]=clean({profiles:{[profile]:editorSession.draft}}).profiles[profile];save();editorSession=null;applyExtras();},true);
    $('hudEditorCancel')?.addEventListener('click',()=>{editorSession=null;applyExtras();},true);
    if(!frame)frame=requestAnimationFrame(correctHandleRects);
  }
  function refreshBiomeHandle(){
    const handle=document.querySelector('.hud-editor-handle[data-editor-id="biomeBadge"]');if(!handle||!editorSession)return;
    const rect=biomeRect(editorSession.draft);handle.style.left=`${rect.left}px`;handle.style.top=`${rect.top}px`;handle.style.width=`${rect.width}px`;handle.style.height=`${rect.height}px`;
  }
  function scaleBiome(factor){
    if(!editorSession)return;editorSession.draft.biomeBadge.width=clamp(editorSession.draft.biomeBadge.width*factor,100,360);applyEditorDraft();refreshBiomeHandle();selectBiomeHandle();
  }
  function cleanupEditorHooks(){
    if($('hudEditorOverlay'))return;
    if(editorSession){editorSession=null;applyExtras();}
  }

  function observeEditor(){
    const observer=new MutationObserver(()=>{installEditorHooks();cleanupEditorHooks();});
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function init(){
    restructureSystemMenu();ensureCatalog();applyExtras();observeEditor();
    root.addEventListener('hudlayoutchange',()=>{applyExtras();});
    root.addEventListener('resize',applyExtras,{passive:true});
    root.addEventListener('orientationchange',applyExtras,{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
