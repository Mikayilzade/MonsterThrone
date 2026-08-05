'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

const css=fs.readFileSync(path.join(__dirname,'../hero072/hud-layout.css'),'utf8');
const joystick=css.match(/\.hud-layout-enabled \.joystick\{([\s\S]*?)\}/)?.[1]||'';
const knob=css.match(/\.hud-layout-enabled \.joystick>div\{([\s\S]*?)\}/)?.[1]||'';

assert(joystick.includes('position:fixed!important'));
assert(joystick.includes('border-radius:50%'));
assert(joystick.includes('background:rgba(9,30,36,.62)'));
assert(joystick.includes('border:1px solid rgba(170,220,210,.25)'));
assert(knob.includes('position:absolute'));
assert(knob.includes('border-radius:50%'));
assert(knob.includes('background:rgba(104,204,178,.72)'));

console.log('1/1 joystick visual regression test passed.');
