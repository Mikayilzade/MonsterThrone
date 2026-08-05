(function(root){
  'use strict';
  const HUD=root.MonsterThroneHudLayout;
  if(!HUD||!root.document)return;

  const PROFILE_LABELS={mobilePortrait:'Телефон · вертикально',mobileLandscape:'Телефон · горизонтально',desktop:'Компьютер'};
  const ELEMENT_LABELS={
    joystick:'Джойстик',actions:'Кнопки действий',actionAttack:'Удар',actionDodge:'Рывок',actionPickup:'Подобрать',actionUse:'Использовать',hotbar:'Быстрые слоты',minimap:'Миникарта'
  };
  const OPTIONAL=new Set(['hotbar','minimap']);
  const ACTION_IDS=HUD.ACTION_IDS||['actionAttack','actionDodge','actionPickup','actionUse'];
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const $=id=>document.getElementById(id);
  let editor=null;

  function runtime(){return HUD.getRuntime?.()||HUD.start?.()||null;}
  function profileLabel(id){return PROFILE_LABELS[id]||id;}
  function activeProfile(){return runtime()?.current()?.profile||document.body.dataset.hudProfile||'desktop';}

  function setInterfaceStatus(){
    const rt=runtime(),state=rt?.current();if(!state)return;
    const name=$('hudProfileName'),mode=$('hudActionMode');
    if(name)name.textContent=profileLabel(state.profile);
    if(mode&&!editor)mode.value=state.layouts.profiles[state.profile].actionMode;
  }

  function setProfileActionMode(mode){
    const rt=runtime();if(!rt)return;
    const profile=activeProfile(),layouts=rt.savedLayouts();
    layouts.profiles[profile].actionMode=mode==='individual'?'individual':'group';
    rt.replace(layouts);setInterfaceStatus();
  }

  function handleIds(profile){
    const mode=editor?.draft?.profiles?.[profile]?.actionMode||runtime()?.current()?.geometry?.actionMode||'group';
    return mode==='individual'?['joystick',...ACTION_IDS,'hotbar','minimap']:['joystick','actions','hotbar','minimap'];
  }

  function rectFor(id,geometry){
    const e=geometry.elements[id];if(!e)return null;
    if(id==='minimap')return {left:e.x-e.radius,top:e.y-e.radius,width:e.radius*2,height:e.radius*2};
    if(id==='hotbar')return {left:e.left,top:e.top,width:e.width,height:e.height};
    if(id==='joystick')return {left:e.left,top:e.top,width:e.width,height:e.height};
    return {left:e.left,top:e.top,width:e.width,height:e.height};
  }

  function elementVisible(id){return editor.draft.profiles[editor.profile].elements[id]?.visible!==false;}

  function makeOverlay(){
    const overlay=document.createElement('div');overlay.id='hudEditorOverlay';overlay.className='hud-editor-overlay';
    overlay.innerHTML=`<div class="hud-editor-toolbar glass">
      <div class="hud-editor-title"><small>РЕДАКТОР ИНТЕРФЕЙСА</small><strong id="hudEditorProfile"></strong><span id="hudEditorSelection">Выбери элемент</span></div>
      <div class="hud-editor-actions">
        <button id="hudEditorMode" title="Переключить расположение кнопок">Кнопки: блок</button>
        <button id="hudEditorSmaller" title="Уменьшить выбранный элемент">−</button>
        <button id="hudEditorLarger" title="Увеличить выбранный элемент">+</button>
        <button id="hudEditorVisibility" class="hidden">Скрыть</button>
        <button id="hudEditorResetElement">Сбросить элемент</button>
        <button id="hudEditorResetProfile">Сбросить экран</button>
        <button id="hudEditorCancel">Отмена</button>
        <button id="hudEditorSave" class="primary">Сохранить</button>
      </div>
    </div><div id="hudEditorStage" class="hud-editor-stage"></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('pointerdown',e=>{if(e.target===overlay||e.target.id==='hudEditorStage')e.preventDefault();});
    $('hudEditorSmaller').onclick=()=>scaleSelected(.9);
    $('hudEditorLarger').onclick=()=>scaleSelected(1.1);
    $('hudEditorVisibility').onclick=toggleSelectedVisibility;
    $('hudEditorResetElement').onclick=resetSelected;
    $('hudEditorResetProfile').onclick=resetProfileDraft;
    $('hudEditorMode').onclick=toggleActionMode;
    $('hudEditorCancel').onclick=()=>finish(false);
    $('hudEditorSave').onclick=()=>finish(true);
    return overlay;
  }

  function begin(){
    if(editor)return;
    const rt=runtime();if(!rt)return;
    const state=rt.current(),profile=state.profile;
    editor={profile,base:rt.savedLayouts(),draft:rt.savedLayouts(),selected:null,drag:null,overlay:makeOverlay(),applying:false};
    document.body.classList.add('hud-editor-active');
    $('systemMenu')?.classList.add('hidden');
    $('hudEditorProfile').textContent=profileLabel(profile);
    updateModeButton();
    preview();
  }

  function finish(saveChanges){
    if(!editor)return;
    const closing=editor,rt=runtime();editor=null;
    if(saveChanges)rt?.commit(closing.draft);else rt?.cancelPreview();
    closing.overlay.remove();
    document.body.classList.remove('hud-editor-active');
    $('systemMenu')?.classList.remove('hidden');
    setInterfaceStatus();
  }

  function preview(render=true){
    if(!editor)return;
    editor.applying=true;runtime()?.preview(editor.draft);editor.applying=false;
    if(render)renderHandles();
  }

  function renderHandles(){
    if(!editor)return;
    const state=runtime()?.current();if(!state)return;
    const stage=$('hudEditorStage');if(!stage)return;stage.innerHTML='';
    for(const id of handleIds(editor.profile)){
      const rect=rectFor(id,state.geometry);if(!rect)continue;
      const handle=document.createElement('div');
      handle.className='hud-editor-handle'+(editor.selected===id?' selected':'')+(elementVisible(id)?'':' is-hidden');
      handle.dataset.editorId=id;
      handle.style.left=`${Math.round(rect.left)}px`;handle.style.top=`${Math.round(rect.top)}px`;handle.style.width=`${Math.round(rect.width)}px`;handle.style.height=`${Math.round(rect.height)}px`;
      handle.innerHTML=`<span>${ELEMENT_LABELS[id]||id}${elementVisible(id)?'':' · скрыто'}</span><i class="hud-editor-resize" title="Изменить размер"></i>`;
      handle.addEventListener('pointerdown',startPointer);
      stage.appendChild(handle);
    }
    updateSelectionUi();
  }

  function selectWithoutRender(id){
    editor.selected=id;
    document.querySelectorAll('.hud-editor-handle').forEach(node=>node.classList.toggle('selected',node.dataset.editorId===id));
    updateSelectionUi();
  }

  function startPointer(e){
    if(!editor)return;e.preventDefault();e.stopPropagation();
    const handle=e.currentTarget,id=handle.dataset.editorId,resize=e.target.classList.contains('hud-editor-resize');
    selectWithoutRender(id);
    const rect={left:parseFloat(handle.style.left),top:parseFloat(handle.style.top),width:parseFloat(handle.style.width),height:parseFloat(handle.style.height)};
    editor.drag={id,resize,startX:e.clientX,startY:e.clientY,rect,pointerId:e.pointerId};
    handle.setPointerCapture?.(e.pointerId);
    handle.addEventListener('pointermove',movePointer);
    handle.addEventListener('pointerup',endPointer,{once:true});
    handle.addEventListener('pointercancel',endPointer,{once:true});
  }

  function movePointer(e){
    if(!editor?.drag||e.pointerId!==editor.drag.pointerId)return;e.preventDefault();
    const d=editor.drag,dx=e.clientX-d.startX,dy=e.clientY-d.startY,w=innerWidth,h=innerHeight;
    let rect={...d.rect};
    if(d.resize){
      if(d.id==='joystick'||d.id==='minimap'){
        const size=clamp(Math.max(44,d.rect.width+Math.max(dx,dy)),44,Math.min(w,h));rect.width=size;rect.height=size;
      }else{
        rect.width=clamp(d.rect.width+dx,44,w-d.rect.left);rect.height=clamp(d.rect.height+dy,44,h-d.rect.top);
      }
    }else{
      rect.left=clamp(d.rect.left+dx,0,Math.max(0,w-d.rect.width));rect.top=clamp(d.rect.top+dy,0,Math.max(0,h-d.rect.height));
    }
    updateDraftFromRect(d.id,rect);preview(false);
    const live=rectFor(d.id,runtime()?.current()?.geometry);
    if(live){e.currentTarget.style.left=`${Math.round(live.left)}px`;e.currentTarget.style.top=`${Math.round(live.top)}px`;e.currentTarget.style.width=`${Math.round(live.width)}px`;e.currentTarget.style.height=`${Math.round(live.height)}px`;}
  }

  function endPointer(e){
    if(!editor?.drag)return;
    e.currentTarget.removeEventListener('pointermove',movePointer);editor.drag=null;renderHandles();
  }

  function updateDraftFromRect(id,rect){
    const p=editor.draft.profiles[editor.profile],e=p.elements[id],w=innerWidth,h=innerHeight;
    if(!e)return;
    if(id==='joystick'){
      e.left=clamp(rect.left/w,0,.92);e.bottom=clamp((h-rect.top-rect.height)/h,0,.92);e.width=rect.width;e.height=rect.height;
    }else if(id==='actions'){
      e.right=clamp((w-rect.left-rect.width)/w,0,.92);e.bottom=clamp((h-rect.top-rect.height)/h,0,.92);e.cellWidth=Math.max(44,(rect.width-e.gap)/2);e.cellHeight=Math.max(44,(rect.height-e.gap)/2);
    }else if(ACTION_IDS.includes(id)){
      e.right=clamp((w-rect.left-rect.width)/w,0,.92);e.bottom=clamp((h-rect.top-rect.height)/h,0,.92);e.width=rect.width;e.height=rect.height;
    }else if(id==='hotbar'){
      e.left=clamp(rect.left/w,0,.92);e.right=clamp((w-rect.left-rect.width)/w,0,.92);e.bottom=clamp((h-rect.top-rect.height)/h,0,.92);e.height=rect.height;
    }else if(id==='minimap'){
      e.right=clamp((w-rect.left-rect.width)/w,0,.92);e.bottom=clamp((h-rect.top-rect.height)/h,0,.92);e.radius=rect.width/2;
    }
    editor.draft=HUD.sanitizeLayouts(editor.draft);
  }

  function selectedRect(){
    const state=runtime()?.current();return editor?.selected&&state?rectFor(editor.selected,state.geometry):null;
  }

  function scaleSelected(factor){
    if(!editor?.selected)return;
    const rect=selectedRect();if(!rect)return;
    const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    let width=clamp(rect.width*factor,44,innerWidth),height=clamp(rect.height*factor,44,innerHeight);
    if(editor.selected==='joystick'||editor.selected==='minimap')height=width=Math.min(width,height);
    const next={left:clamp(cx-width/2,0,innerWidth-width),top:clamp(cy-height/2,0,innerHeight-height),width,height};
    updateDraftFromRect(editor.selected,next);preview();
  }

  function toggleSelectedVisibility(){
    if(!editor?.selected||!OPTIONAL.has(editor.selected))return;
    const e=editor.draft.profiles[editor.profile].elements[editor.selected];e.visible=!e.visible;preview();
  }

  function resetSelected(){
    if(!editor?.selected)return;
    const id=editor.selected,defaults=HUD.clone(HUD.DEFAULT_LAYOUTS.profiles[editor.profile]);
    if(id==='actions')editor.draft.profiles[editor.profile].elements.actions=defaults.elements.actions;
    else editor.draft.profiles[editor.profile].elements[id]=defaults.elements[id];
    preview();
  }

  function resetProfileDraft(){
    if(!editor)return;
    editor.draft.profiles[editor.profile]=HUD.clone(HUD.DEFAULT_LAYOUTS.profiles[editor.profile]);editor.selected=null;preview();updateModeButton();
  }

  function toggleActionMode(){
    if(!editor)return;
    const p=editor.draft.profiles[editor.profile];p.actionMode=p.actionMode==='group'?'individual':'group';editor.selected=p.actionMode==='group'?'actions':'actionAttack';preview();updateModeButton();
  }

  function updateModeButton(){
    if(!editor)return;
    const group=editor.draft.profiles[editor.profile].actionMode==='group';$('hudEditorMode').textContent=group?'Кнопки: блок':'Кнопки: отдельно';
  }

  function updateSelectionUi(){
    if(!editor)return;
    const id=editor.selected,label=$('hudEditorSelection'),visibility=$('hudEditorVisibility'),reset=$('hudEditorResetElement');
    if(label)label.textContent=id?`Выбрано: ${ELEMENT_LABELS[id]||id}`:'Выбери элемент и перетащи его';
    if(visibility){visibility.classList.toggle('hidden',!id||!OPTIONAL.has(id));if(id&&OPTIONAL.has(id))visibility.textContent=elementVisible(id)?'Скрыть':'Показать';}
    if(reset)reset.disabled=!id;
  }

  function resetCurrent(){
    const rt=runtime();if(!rt)return;
    if(confirm(`Сбросить раскладку «${profileLabel(activeProfile())}»?`))rt.reset(activeProfile());setInterfaceStatus();
  }

  function resetAll(){
    const rt=runtime();if(!rt)return;
    if(confirm('Сбросить все три раскладки интерфейса?'))rt.reset();setInterfaceStatus();
  }

  function init(){
    HUD.start?.();
    $('hudEditCurrent')?.addEventListener('click',begin);
    $('hudResetCurrent')?.addEventListener('click',resetCurrent);
    $('hudResetAll')?.addEventListener('click',resetAll);
    $('hudActionMode')?.addEventListener('change',e=>setProfileActionMode(e.target.value));
    root.addEventListener('hudlayoutchange',e=>{
      setInterfaceStatus();
      if(editor&&!editor.applying&&e.detail?.profile!==editor.profile){
        finish(false);setTimeout(()=>alert('Ориентация экрана изменилась. Несохранённые правки отменены; открой редактор снова для нового профиля.'),0);
      }
    });
    setInterfaceStatus();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
