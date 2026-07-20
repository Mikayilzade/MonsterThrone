(async function(g){
  'use strict';
  await g.MonsterWorldCoreReady;
  const binary=atob(g.__monsterAppGzip);
  delete g.__monsterAppGzip;
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const source=await new Response(stream).text();
  (0,eval)(source);

  const exact=new Map([
    ['member','участник группы'],
    ['general','генерал'],
    ['apex','одиночка 500+'],
    ['wild','дикий'],
    ['wander','бродит'],
    ['rooted','укоренилось'],
    ['surrendered','уступило и отступает'],
    ['flee','убегает'],
    ['eat fresh','ест свежую тушу'],
    ['eat spoiled','ест испорченную тушу'],
    ['seek corpse','ищет тушу'],
    ['pack hunt','охотится стаей'],
    ['defend territory','защищает территорию'],
    ['hunt','охотится'],
    ['duel','участвует в дуэли'],
    ['patrol / drift inward','патрулирует и смещается к центру'],
    ['patrol / forage','патрулирует и ищет пищу'],
    ['snap','атакует из засады'],
    ['HP','Здоровье'],
    ['Временный буст','Временное усиление']
  ]);

  function translate(text){
    let value=String(text);
    const trimmed=value.trim();
    if(exact.has(trimmed)) value=value.replace(trimmed,exact.get(trimmed));
    value=value
      .replace(/\bstrength\b/g,'сила')
      .replace(/\bendurance\b/g,'выносливость')
      .replace(/\bagility\b/g,'ловкость')
      .replace(/\bintelligence\b/g,'интеллект')
      .replace(/^amber-hive-pack-(\d+)$/,'Янтарный улей: стая №$1')
      .replace(/^ash-pack-pack-(\d+)$/,'Пепельная стая: стая №$1')
      .replace(/^stone-line-pack-(\d+)$/,'Каменная линия: стая №$1')
      .replace(/^crimson-wanderers-pack-(\d+)$/,'Багровые странники: стая №$1');
    return value;
  }

  function localizeSelection(){
    const root=document.getElementById('selection');
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const localized=translate(node.nodeValue);
      if(localized!==node.nodeValue)node.nodeValue=localized;
    }
  }

  const root=document.getElementById('selection');
  if(root){
    new MutationObserver(localizeSelection).observe(root,{childList:true,subtree:true,characterData:true});
    localizeSelection();
  }
})(globalThis);
