(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.MonsterThroneBindings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STORAGE_KEY='monsterThrone.controlBindings.v1';
  const ACTIONS={moveUp:'Вверх',moveDown:'Вниз',moveLeft:'Влево',moveRight:'Вправо',attack:'Атака',dodge:'Рывок',pickup:'Подобрать',use:'Использовать',character:'Персонаж',inventory:'Инвентарь',craft:'Крафт',book:'Книга',pause:'Пауза',system:'Системное меню',quick1:'Быстрый слот 1',quick2:'Быстрый слот 2',quick3:'Быстрый слот 3',quick4:'Быстрый слот 4',quick5:'Быстрый слот 5',quick6:'Быстрый слот 6',quick7:'Быстрый слот 7',quick8:'Быстрый слот 8'};
  const DEFAULTS={moveUp:['KeyW','ArrowUp'],moveDown:['KeyS','ArrowDown'],moveLeft:['KeyA','ArrowLeft'],moveRight:['KeyD','ArrowRight'],attack:['Space',null],dodge:['ShiftLeft','ShiftRight'],pickup:['KeyE',null],use:['KeyF',null],character:['KeyK',null],inventory:['KeyI',null],craft:['KeyC',null],book:['KeyJ',null],pause:['KeyP',null],system:['Escape',null]};
  for(let i=1;i<=8;i++)DEFAULTS[`quick${i}`]=[`Digit${i}`,null];
  const clone=x=>JSON.parse(JSON.stringify(x));
  function normalize(value){const out=clone(DEFAULTS);for(const id of Object.keys(ACTIONS)){const pair=value&&Array.isArray(value[id])?value[id].slice(0,2):out[id];out[id]=[pair[0]||null,pair[1]||null];}return out;}
  function serialize(bindings){return JSON.stringify(normalize(bindings));}
  function deserialize(raw){try{return normalize(JSON.parse(raw));}catch(_){return normalize();}}
  function conflicts(bindings,code,exceptAction,exceptIndex){const found=[];for(const [action,pair] of Object.entries(bindings))pair.forEach((key,index)=>{if(key===code&&(action!==exceptAction||index!==exceptIndex))found.push({action,index});});return found;}
  function setBinding(bindings,action,index,code,replace=false){const next=normalize(bindings),found=code?conflicts(next,code,action,index):[];if(found.length&&!replace)return {ok:false,conflicts:found,bindings:next};for(const hit of found)next[hit.action][hit.index]=null;next[action][index]=code||null;return {ok:true,conflicts:found,bindings:next};}
  function actionForCode(bindings,code){for(const [action,pair] of Object.entries(bindings))if(pair.includes(code))return action;return null;}
  function load(storage){return deserialize(storage&&storage.getItem(STORAGE_KEY));}
  function save(storage,bindings){if(storage)storage.setItem(STORAGE_KEY,serialize(bindings));return normalize(bindings);}
  return {STORAGE_KEY,ACTIONS,DEFAULTS,normalize,serialize,deserialize,conflicts,setBinding,actionForCode,load,save};
});
