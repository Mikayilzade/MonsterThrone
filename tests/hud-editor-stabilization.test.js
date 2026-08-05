'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const js=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor-stabilization.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor-stabilization.css'),'utf8');
const boot=fs.readFileSync(path.join(__dirname,'../hero072/boot.js'),'utf8');
let passed=0;
function test(name,fn){fn();passed++;console.log(`✓ ${name}`);}

test('system menu gets fixed header, scroll body and footer',()=>{
  for(const token of ['system-menu-header','system-menu-pages','system-menu-footer','systemMenuQuickClose'])assert(js.includes(token));
  assert(css.includes('overflow-y:auto'));
  assert(css.includes('.system-menu-footer'));
});

test('catalog supports individual action visibility and biome badge',()=>{
  for(const token of ['actionAttack','actionDodge','actionPickup','actionUse','biomeBadge'])assert(js.includes(token));
  assert(css.includes('.hud-hide-use [data-mobile-action="use"]'));
  assert(js.includes('data-visible-id'));
});

test('editor outlines use rendered DOM rectangles',()=>{
  assert(js.includes('getBoundingClientRect'));
  assert(js.includes('correctHandleRects'));
  assert(css.includes('.hud-editor-handle>span{top:-23px'));
});

test('biome badge is draggable, resizable, hideable and compactable',()=>{
  for(const token of ['startBiomePointer','moveBiomePointer','scaleBiome','hudBiomeCompact'])assert(js.includes(token));
  assert(css.includes('--hud-biome-left'));
  assert(css.includes('.hud-biome-compact .world-status'));
});

test('stabilization assets load after the base editor and before game assembly',()=>{
  assert(boot.includes("loadStyle('./hud-editor-stabilization.css')"));
  assert(boot.indexOf("loadScript('./hud-editor.js')")<boot.indexOf("loadScript('./hud-editor-stabilization.js')"));
  assert(boot.indexOf("loadScript('./hud-editor-stabilization.js')")<boot.indexOf('Promise.all(files.map'));
});

console.log(`\n${passed}/5 HUD editor stabilization tests passed.`);
