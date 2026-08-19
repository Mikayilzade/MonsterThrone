'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');

const boot=fs.readFileSync(path.join(__dirname,'../hero072/boot.js'),'utf8');
const viewport=fs.readFileSync(path.join(__dirname,'../hero072/viewport-stabilization.js'),'utf8');

assert(boot.includes("loadScript('./viewport-stabilization.js')"));
assert(boot.indexOf("Function(`${source}\\n//# sourceURL=hero072/game.js`)();")<boot.indexOf("loadScript('./viewport-stabilization.js')"));
assert(viewport.includes("addEventListener('pageshow'"));
assert(viewport.includes("addEventListener('orientationchange'"));
assert(viewport.includes("visualViewport?.addEventListener?.('resize'"));
assert(viewport.includes("document.addEventListener('visibilitychange'"));
assert(viewport.includes("dispatchEvent(new Event('resize'))"));
assert(viewport.includes("[80,240,650]"));

console.log('8/8 mobile viewport resync regression checks passed.');
