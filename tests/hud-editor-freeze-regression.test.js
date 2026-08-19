'use strict';
const assert=require('assert');
const safety=require('../hero072/hud-editor-safety.js');

let bodyAppends=0,htmlAppends=0;
const probe={className:'',setAttribute(){},remove(){}};
const doc={
  body:{appendChild(){bodyAppends++;}},
  documentElement:{clientWidth:390,clientHeight:844,appendChild(){htmlAppends++;}},
  createElement(){return probe;}
};
const win={
  innerWidth:390,innerHeight:844,
  getComputedStyle(){return {getPropertyValue(name){return {'padding-top':'47','padding-right':'0','padding-bottom':'34','padding-left':'0'}[name]||'0';}};}
};

const bounds=safety.safeBounds(win,doc,6);
assert.strictEqual(htmlAppends,1,'safe-area probe must be appended outside document.body');
assert.strictEqual(bodyAppends,0,'safe-area probe must not retrigger the body MutationObserver');
assert.deepStrictEqual(bounds,{left:6,top:53,right:384,bottom:804,width:390,height:844,insets:{top:47,right:0,bottom:34,left:0}});

console.log('1/1 Stage 3A editor freeze regression test passed.');
