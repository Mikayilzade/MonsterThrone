(function(root){
  'use strict';
  if(!root||!root.document)return;

  const timers=new Set();
  let raf=0;

  function clearScheduled(){
    if(raf){root.cancelAnimationFrame?.(raf);raf=0;}
    for(const id of timers)root.clearTimeout(id);
    timers.clear();
  }

  function emit(reason){
    try{root.dispatchEvent(new Event('resize'));}catch{}
    try{root.dispatchEvent(new CustomEvent('monsterthroneviewportresync',{detail:{reason,width:root.innerWidth,height:root.innerHeight}}));}catch{}
  }

  function schedule(reason){
    clearScheduled();
    raf=root.requestAnimationFrame?.(()=>{raf=0;emit(`${reason}:raf`);})||0;
    for(const delay of [80,240,650]){
      const id=root.setTimeout(()=>{timers.delete(id);emit(`${reason}:${delay}`);},delay);
      timers.add(id);
    }
  }

  root.addEventListener('pageshow',()=>schedule('pageshow'),{passive:true});
  root.addEventListener('orientationchange',()=>schedule('orientationchange'),{passive:true});
  root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden)schedule('visible');},{passive:true});
  root.visualViewport?.addEventListener?.('resize',()=>schedule('visualViewport'),{passive:true});

  // Safari/PWA can report the pre-settled viewport during the first script pass.
  // A short burst after the assembled game runtime exists gives canvas + HUD one
  // more chance to consume the final innerWidth/innerHeight without requiring a
  // manual portrait/landscape round-trip.
  schedule('bootstrap');
})(typeof globalThis!=='undefined'?globalThis:this);
