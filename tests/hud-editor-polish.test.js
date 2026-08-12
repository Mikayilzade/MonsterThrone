'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
let passed=0;
function test(name,fn){fn();passed++;console.log(`✓ ${name}`);}
const css=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor-polish.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../hero072/hud-editor-polish.js'),'utf8');
const boot=fs.readFileSync(path.join(__dirname,'../hero072/boot.js'),'utf8');

test('grouped hidden actions preserve their grid slots',()=>{
  assert(css.includes('.hud-action-mode-group.hud-hide-use [data-mobile-action="use"]'));
  assert(css.includes('visibility:hidden!important'));
  assert(css.includes('pointer-events:none!important'));
  assert(css.includes('.hud-action-mode-individual.hud-hide-use [data-mobile-action="use"]'));
  assert(css.includes('display:none!important'));
});

test('desktop editor can suppress unused touch controls and joystick',()=>{
  assert(css.includes('.hud-profile-desktop.hud-desktop-no-touch-controls .mobile-controls{display:none!important}'));
  assert(css.includes('.hud-profile-desktop.hud-desktop-hide-joystick #joystick{display:none!important}'));
  assert(js.includes('desktopTouchControls'));
  assert(js.includes('monsterThrone.desktopJoystickVisible.v1'));
});

test('legacy desktop minimap collision receives a one-time migration',()=>{
  assert(js.includes('monsterThrone.desktopHudPolish.v1'));
  assert(js.includes('mini.bottom=.22'));
  assert(js.includes('mini.right=.018'));
});

test('editor handles use visual child bounds and round geometry where appropriate',()=>{
  assert(js.includes("bar.querySelectorAll('.slot')"));
  assert(js.includes("document.querySelectorAll('.mobile-actions button')"));
  assert(js.includes("id==='joystick'||id==='minimap'"));
  assert(css.includes('.hud-editor-handle.hud-editor-round-handle{border-radius:50%!important}'));
  assert(css.includes('background:transparent!important'));
});

test('polish assets load after stabilization and before assembled runtime',()=>{
  assert(boot.includes("loadStyle('./hud-editor-polish.css')"));
  assert(boot.indexOf("loadScript('./hud-editor-stabilization.js')")<boot.indexOf("loadScript('./hud-editor-polish.js')"));
  assert(boot.indexOf("loadScript('./hud-editor-polish.js')")<boot.indexOf('Promise.all(files.map'));
});

console.log(`\n${passed}/5 HUD editor Stage 2.2 tests passed.`);
