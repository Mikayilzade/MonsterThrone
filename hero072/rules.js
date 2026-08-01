(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MonsterThroneRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  const WEAPONS={
    spear:{
      id:'spear',name:'Копьё странника',baseDamage:8,range:72,interval:.52,
      staminaCost:8,accuracy:.82,durability:null,quality:1
    },
    improved_spear:{
      id:'improved_spear',name:'Улучшенное костяное копьё',baseDamage:13,range:82,interval:.47,
      staminaCost:9,accuracy:.86,durability:180,quality:1.12
    }
  };

  function masteryBonus(mastery){
    const m=Math.max(0,Number(mastery)||0);
    return Math.min(.62,Math.sqrt(m)*.055);
  }

  function readinessMultiplier(readiness){
    return .8+clamp(Number(readiness)||0,0,100)*.002;
  }

  function nextSkillThreshold(mastery){
    const m=Math.max(0,Number(mastery)||0);
    return Math.min(1000,Math.floor(m/25+1)*25);
  }

  function combatProfile(input={}){
    const weapon=typeof input.weapon==='string'?WEAPONS[input.weapon]:input.weapon;
    if(!weapon)throw new Error('Unknown weapon');
    const strength=Math.max(1,Number(input.strength)||1);
    const agility=Math.max(1,Number(input.agility)||1);
    const mastery=Math.max(0,Number(input.mastery)||0);
    const readiness=clamp(Number(input.readiness)||0,0,100);
    const tempPower=Math.max(0,Number(input.tempPower)||0);
    const enemyDefense=Math.max(0,Number(input.enemyDefense)||0);
    const quality=Math.max(.5,Number(input.quality)||weapon.quality||1);

    const bodyBase=3;
    const weaponBase=weapon.baseDamage*quality;
    const strengthContribution=strength*.65;
    const agilityContribution=agility*.18;
    const preSkill=bodyBase+weaponBase+strengthContribution+agilityContribution+tempPower;
    const masteryMult=1+masteryBonus(mastery);
    const readyMult=readinessMultiplier(readiness);
    const beforeArmor=preSkill*masteryMult*readyMult;
    const minDamage=Math.max(1,Math.round(beforeArmor*.85-enemyDefense));
    const maxDamage=Math.max(minDamage,Math.round(beforeArmor*1.15-enemyDefense));
    const attackInterval=clamp(weapon.interval/(1+Math.min(.3,mastery/250)+agility*.003),.24,weapon.interval);
    const staminaCost=Math.max(2,weapon.staminaCost*(1-Math.min(.25,mastery/400)-Math.min(.12,agility/200)));
    const accuracy=clamp(weapon.accuracy+mastery*.002+readiness*.001+agility*.002,.55,.98);
    const range=weapon.range;

    return {
      weaponId:weapon.id,weaponName:weapon.name,bodyBase,weaponBase,strengthContribution,agilityContribution,tempPower,
      preSkill,masteryBonus:masteryBonus(mastery),masteryMult,readinessMultiplier:readyMult,
      beforeArmor,enemyDefense,minDamage,maxDamage,attackInterval,staminaCost,accuracy,range,
      durability:weapon.durability,quality
    };
  }

  function maxCraftable(inventory,recipe){
    let max=Infinity;
    for(const [id,n] of Object.entries(recipe.needs||{})){
      max=Math.min(max,Math.floor((inventory[id]||0)/n));
    }
    return Number.isFinite(max)?Math.max(0,max):0;
  }

  function craftLimit(inventory,recipe){
    if(recipe.unique&&(inventory[recipe.id]||0)>0)return 0;
    if(recipe.id==='bone_tip'){
      if((inventory.improved_spear||0)>0||(inventory.bone_tip||0)>0)return 0;
      return Math.min(1,maxCraftable(inventory,recipe));
    }
    return maxCraftable(inventory,recipe);
  }

  function applyRecipe(inventory,recipe,qty=1){
    const q=Math.max(1,Math.floor(Number(qty)||1));
    const max=maxCraftable(inventory,recipe);
    if(max<q)return {ok:false,reason:'materials',inventory:{...inventory}};
    const next={...inventory};
    for(const [id,n] of Object.entries(recipe.needs||{})){
      next[id]=(next[id]||0)-n*q;
      if(next[id]<=0)delete next[id];
    }
    for(const [id,n] of Object.entries(recipe.out||{}))next[id]=(next[id]||0)+n*q;
    return {ok:true,inventory:next};
  }

  function migrateHero(hero={}){
    const next=JSON.parse(JSON.stringify(hero||{}));
    next.inv=next.inv||{};
    next.hotbar=Array.isArray(next.hotbar)?next.hotbar.slice(0,8):[];
    while(next.hotbar.length<8)next.hotbar.push(null);
    next.equipment=next.equipment||{};
    if(!next.equipment.weapon){
      next.equipment.weapon=next.inv.improved_spear?'improved_spear':'spear';
    }
    if(!next.inv[next.equipment.weapon]){
      next.inv[next.equipment.weapon]=1;
    }
    next.weaponQuality=next.weaponQuality||{};
    if(!next.weaponQuality.spear)next.weaponQuality.spear=1;
    if(next.inv.improved_spear&&!next.weaponQuality.improved_spear)next.weaponQuality.improved_spear=1.12;
    next.knowledge=next.knowledge||{};
    next.knowledge.experimentNotes=Array.isArray(next.knowledge.experimentNotes)?next.knowledge.experimentNotes:[];
    next.lastHit=next.lastHit||null;
    return next;
  }

  return {WEAPONS,masteryBonus,readinessMultiplier,nextSkillThreshold,combatProfile,maxCraftable,craftLimit,applyRecipe,migrateHero};
});
