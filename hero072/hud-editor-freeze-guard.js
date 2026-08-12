(function(root){
  'use strict';
  // Regression marker for the Stage 3A editor freeze hotfix.
  // The actual fix lives in hud-editor-safety.js: its safe-area probe must
  // not mutate document.body while a body MutationObserver is active.
  root.MonsterThroneHudEditorFreezeGuard={version:1};
})(typeof globalThis!=='undefined'?globalThis:this);
