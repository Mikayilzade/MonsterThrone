(function(root){
  'use strict';
  const HUD=root.MonsterThroneHudLayout;
  if(!HUD||!root.document)return;

  const DESKTOP_JOYSTICK_KEY='monsterThrone.desktopJoystickVisible.v1';
  const DESKTOP_MIGRATION_KEY='monsterThrone.desktopHudPolish.v1';
  const $=id=>document.getElementById(id);
  let frame=0;

  function profile(){return HUD.current?.()?.profile||document.body.dataset.hudProfile||'desktop';}
  function desktopTouchEnabled(){return $('desktopTouchControls')?.checked||document.body.classList.contains('desktop-touch-controls');}
  function desktopJoystickVisible(){return localStorage.getItem(DESKTOP_JOYSTICK_KEY)==='1';}

  function ensureDesktopJoystickToggle(){
    const row=document.querySelector('[data-catalog-id="joystick"]');
    if(!row)return;
    let toggle=$('desktopJoystickToggle');
    const mandatory=[...row.children].find(node=>node.tagName==='SMALL');
    if(profile()!=='desktop'){
      toggle?.remove();
      if(mandatory)mandatory.hidden=false;
      return;
    }
    if(mandatory)mandatory.hidden=true;
    if(!toggle){
      toggle=document.createElement('label');
      toggle.id='desktopJoystickToggle';
      toggle.className='hud-visibility-toggle hud-desktop-joystick-toggle';
      toggle.innerHTML='<input type="checkbox"><i></i><em>Показывать</em>';
      toggle.querySelector('input').addEventListener('change',event=>{
        localStorage.setItem(DESKTOP_JOYSTICK_KEY,event.target.checked?'1':'0');
        syncDesktopState();
      });
      const edit=row.querySelector('[data-edit-id]');
      row.insertBefore(toggle,edit||null);
    }
    toggle.querySelector('input').checked=desktopJoystickVisible();
  }

  function syncDesktopState(){
    const desktop=profile()==='desktop';
    document.body.classList.toggle('hud-desktop-no-touch-controls',desktop&&!desktopTouchEnabled());
    document.body.classList.toggle('hud-desktop-hide-joystick',desktop&&!desktopJoystickVisible());
    ensureDesktopJoystickToggle();
  }

  function migrateDesktopDefaultCollision(){
    if(localStorage.getItem(DESKTOP_MIGRATION_KEY)==='1')return;
    const runtime=HUD.getRuntime?.();if(!runtime)return;
    const layouts=runtime.savedLayouts?.();
    const mini=layouts?.profiles?.desktop?.elements?.minimap;
    if(mini&&mini.right<=.05&&mini.bottom<=.08){
      mini.right=.018;
      mini.bottom=.22;
      runtime.replace(layouts);
    }
    localStorage.setItem(DESKTOP_MIGRATION_KEY,'1');
  }

  function unionRects(nodes,clip){
    const rects=[...nodes].map(node=>node.getBoundingClientRect?.()).filter(r=>r&&r.width>1&&r.height>1);
    if(!rects.length)return null;
    let left=Math.min(...rects.map(r=>r.left)),top=Math.min(...rects.map(r=>r.top)),right=Math.max(...rects.map(r=>r.right)),bottom=Math.max(...rects.map(r=>r.bottom));
    if(clip){left=Math.max(left,clip.left);top=Math.max(top,clip.top);right=Math.min(right,clip.right);bottom=Math.min(bottom,clip.bottom);}
    if(right-left<2||bottom-top<2)return null;
    return {left,top,width:right-left,height:bottom-top,right,bottom};
  }

  function visualRect(id){
    if(id==='hotbar'){
      const bar=$('hotbar'),clip=bar?.getBoundingClientRect?.();
      return bar&&clip?unionRects(bar.querySelectorAll('.slot'),clip)||clip:null;
    }
    if(id==='actions')return unionRects(document.querySelectorAll('.mobile-actions button'));
    const node=({
      joystick:$('#joystick'),
      actionAttack:document.querySelector('[data-mobile-action="attack"]'),
      actionDodge:document.querySelector('[data-mobile-action="dodge"]'),
      actionPickup:document.querySelector('[data-mobile-action="pickup"]'),
      actionUse:document.querySelector('[data-mobile-action="use"]'),
      biomeBadge:$('#worldStatus')
    })[id];
    const rect=node?.getBoundingClientRect?.();
    return rect&&rect.width>1&&rect.height>1?rect:null;
  }

  function polishHandles(){
    const overlay=$('hudEditorOverlay');
    if(!overlay){frame=0;return;}
    const desktop=profile()==='desktop',showTouch=!desktop||desktopTouchEnabled();
    for(const handle of overlay.querySelectorAll('.hud-editor-handle[data-editor-id]')){
      const id=handle.dataset.editorId;
      handle.classList.toggle('hud-editor-round-handle',id==='joystick'||id==='minimap');
      handle.classList.toggle('hud-editor-button-handle',id==='actions'||id.startsWith('action'));
      const hideForDesktop=desktop&&((id==='actions'||id.startsWith('action'))&&!showTouch||(id==='joystick'&&(!showTouch||!desktopJoystickVisible())));
      handle.classList.toggle('hud-editor-desktop-suppressed',hideForDesktop);
      if(hideForDesktop)continue;
      if(id==='minimap')continue;
      const rect=visualRect(id);if(!rect)continue;
      handle.style.left=`${Math.round(rect.left)}px`;
      handle.style.top=`${Math.round(rect.top)}px`;
      handle.style.width=`${Math.round(rect.width)}px`;
      handle.style.height=`${Math.round(rect.height)}px`;
    }
    frame=requestAnimationFrame(polishHandles);
  }

  function watchEditor(){
    if($('hudEditorOverlay')){if(!frame)frame=requestAnimationFrame(polishHandles);}
    else if(frame){cancelAnimationFrame(frame);frame=0;}
  }

  function init(){
    migrateDesktopDefaultCollision();
    syncDesktopState();
    $('desktopTouchControls')?.addEventListener('change',syncDesktopState);
    root.addEventListener('hudlayoutchange',()=>{syncDesktopState();watchEditor();});
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#hudEditCurrent,[data-edit-id]'))setTimeout(()=>{syncDesktopState();watchEditor();},0);
      if(event.target.closest?.('#hudEditorSave,#hudEditorCancel,#systemMenuClose,#systemMenuQuickClose'))setTimeout(watchEditor,0);
    },true);
    const observer=new MutationObserver(()=>{syncDesktopState();watchEditor();});
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
