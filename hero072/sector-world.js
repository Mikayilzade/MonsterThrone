(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MonsterThroneSectorWorld=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='0.8-stage2a';
  const DEFAULTS={seed:'monster-throne',size:16800,radius:8000,sectorSize:640,activeRadius:1,loadedRadius:2};
  const BIOMES={water:'Море',coast:'Побережье',meadow:'Луга',forest:'Лес',darkforest:'Тёмный лес',swamp:'Болото',rock:'Каменистые возвышенности',inlandwater:'Внутренние воды'};
  const ALLOWED_BY_SPECIES={
    tick:['swamp','forest','darkforest'],grazer:['meadow','forest'],boar:['forest','darkforest','swamp'],wolf:['forest','darkforest','rock']
  };
  const RESOURCE_BIOMES={
    meadow:['root','root','fiber','fiber','branch'],forest:['root','ghostfern','branch','branch','resin'],darkforest:['bluecap','ghostfern','resin','branch'],
    swamp:['bloodleaf','bloodleaf','fiber','root'],rock:['stone','stone','branch'],coast:['stone','fiber','branch']
  };
  const hashString=value=>{let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const hash=(seed,...values)=>{let h=hashString(seed);for(const v of values){h^=hashString(v);h=Math.imul(h,2246822519);h^=h>>>13;}return (h>>>0)/4294967296;};
  const smooth=t=>t*t*(3-2*t);
  function valueNoise(seed,x,y,scale){
    const fx=x/scale,fy=y/scale,x0=Math.floor(fx),y0=Math.floor(fy),tx=smooth(fx-x0),ty=smooth(fy-y0);
    const a=hash(seed,x0,y0),b=hash(seed,x0+1,y0),c=hash(seed,x0,y0+1),d=hash(seed,x0+1,y0+1);
    return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;
  }
  const key=(sx,sy)=>`${sx},${sy}`;
  const clone=value=>JSON.parse(JSON.stringify(value));

  function createConfig(options={}){
    const cfg={...DEFAULTS,...options};cfg.cx=cfg.size/2;cfg.cy=cfg.size/2;
    cfg.camp=cfg.camp||{x:cfg.cx-cfg.radius+360,y:cfg.cy};return cfg;
  }
  function sectorCoords(x,y,cfg=DEFAULTS){return {sx:Math.floor(x/cfg.sectorSize),sy:Math.floor(y/cfg.sectorSize)};}
  function terrainAt(x,y,options={}){
    if(!Number.isFinite(x)||!Number.isFinite(y))return 'water';
    const c=createConfig(options),dx=x-c.cx,dy=y-c.cy,d=Math.hypot(dx,dy),edge=c.radius-d;
    if(edge<=0)return 'water';if(edge<150)return 'coast';
    const broad=valueNoise(`${c.seed}:${VERSION}:broad`,x,y,2100),detail=valueNoise(`${c.seed}:${VERSION}:detail`,x,y,900);
    const moisture=valueNoise(`${c.seed}:${VERSION}:wet`,x+3300,y-1700,2400);
    const ridge=valueNoise(`${c.seed}:${VERSION}:ridge`,x-1500,y+2800,2600);
    const channel=Math.abs(valueNoise(`${c.seed}:${VERSION}:river`,x,y,1800)-.5);
    if(edge>520&&channel<.018&&moisture>.58)return 'inlandwater';
    if(ridge>.72&&broad>.5)return 'rock';
    if(moisture>.69&&detail<.57)return 'swamp';
    if(broad>.66)return detail>.48?'darkforest':'forest';
    if(broad>.48||moisture>.55)return 'forest';
    return 'meadow';
  }
  function isLand(x,y,options){return !['water','inlandwater'].includes(terrainAt(x,y,options));}

  function pointInSector(seed,sx,sy,index,cfg){
    return {x:(sx+hash(seed,sx,sy,index,'x'))*cfg.sectorSize,y:(sy+hash(seed,sx,sy,index,'y'))*cfg.sectorSize};
  }
  function generateSector(sx,sy,options={}){
    const cfg=createConfig(options),seed=`${cfg.seed}:${VERSION}`,id=key(sx,sy),entities=[];
    for(let i=0;i<18;i++){
      const p=pointInSector(seed,sx,sy,i,cfg),biome=terrainAt(p.x,p.y,cfg),choices=RESOURCE_BIOMES[biome];
      if(!choices||hash(seed,sx,sy,i,'resource')<.34)continue;
      const item=choices[Math.floor(hash(seed,sx,sy,i,'item')*choices.length)];
      const plants=['root','bluecap','bloodleaf','ghostfern'];
      entities.push({uid:`${id}:r:${i}`,kind:plants.includes(item)?'plant':'resource',id:item,x:p.x,y:p.y,r:8});
    }
    const species=Object.keys(ALLOWED_BY_SPECIES);
    for(let i=0;i<7;i++){
      const p=pointInSector(seed,sx,sy,100+i,cfg),biome=terrainAt(p.x,p.y,cfg);
      if(Math.hypot(p.x-cfg.camp.x,p.y-cfg.camp.y)<520)continue;
      const candidates=species.filter(type=>ALLOWED_BY_SPECIES[type].includes(biome));
      if(!candidates.length||hash(seed,sx,sy,i,'creature')<.5)continue;
      const type=candidates[Math.floor(hash(seed,sx,sy,i,'species')*candidates.length)];
      entities.push({uid:`${id}:e:${i}`,id:`${id}:e:${i}`,kind:'creature',type,x:p.x,y:p.y,dead:false});
    }
    return {id,sx,sy,biome:terrainAt((sx+.5)*cfg.sectorSize,(sy+.5)*cfg.sectorSize,cfg),entities,carcasses:[],updatedAt:0};
  }

  class SectorManager{
    constructor(options={}){this.config=createConfig(options);this.loaded=new Map();this.active=new Set();this.saved=new Map();this.visited=new Set();this.current=null;this.onFirstBiome=options.onFirstBiome||null;this.visitedBiomes=new Set();}
    getSector(sx,sy){const id=key(sx,sy);if(!this.loaded.has(id))this.loaded.set(id,this.saved.has(id)?clone(this.saved.get(id)):generateSector(sx,sy,this.config));return this.loaded.get(id);}
    update(x,y){
      if(!Number.isFinite(x)||!Number.isFinite(y))return false;
      const center=sectorCoords(x,y,this.config),nextActive=new Set(),keep=new Set();this.current=key(center.sx,center.sy);
      for(let oy=-this.config.loadedRadius;oy<=this.config.loadedRadius;oy++)for(let ox=-this.config.loadedRadius;ox<=this.config.loadedRadius;ox++){
        const sx=center.sx+ox,sy=center.sy+oy,id=key(sx,sy);keep.add(id);this.getSector(sx,sy);
        if(Math.abs(ox)<=this.config.activeRadius&&Math.abs(oy)<=this.config.activeRadius)nextActive.add(id);
      }
      for(const [id,sector] of this.loaded)if(!keep.has(id)){this.saved.set(id,clone(sector));this.loaded.delete(id);}
      this.active=nextActive;this.visited.add(this.current);
      const biome=terrainAt(x,y,this.config);if(!this.visitedBiomes.has(biome)){this.visitedBiomes.add(biome);if(this.onFirstBiome)this.onFirstBiome(biome,BIOMES[biome]);}
      return true;
    }
    activeEntities(kind){const out=[];for(const id of this.active){const sector=this.loaded.get(id);if(sector)for(const entity of sector.entities)if(!kind||entity.kind===kind)out.push(entity);}return out;}
    remove(uid){for(const sector of this.loaded.values()){const i=sector.entities.findIndex(e=>e.uid===uid);if(i>=0){sector.entities.splice(i,1);return true;}}return false;}
    upsert(entity){if(!entity||!entity.uid||!Number.isFinite(entity.x)||!Number.isFinite(entity.y))return false;const c=sectorCoords(entity.x,entity.y,this.config),sector=this.getSector(c.sx,c.sy),i=sector.entities.findIndex(e=>e.uid===entity.uid);if(i>=0)sector.entities[i]=clone(entity);else sector.entities.push(clone(entity));return true;}
    debug(){return {activeSectors:this.active.size,loadedSectors:this.loaded.size,savedSectors:this.saved.size,activeObjects:this.activeEntities().length,visitedSectors:this.visited.size};}
    serialize(){for(const [id,s] of this.loaded)this.saved.set(id,clone(s));return {version:VERSION,seed:this.config.seed,config:{size:this.config.size,radius:this.config.radius,sectorSize:this.config.sectorSize},sectors:Object.fromEntries(this.saved),visited:[...this.visited],visitedBiomes:[...this.visitedBiomes]};}
    restore(data={}){if(data.seed&&data.seed!==this.config.seed)throw new Error('Sector save seed mismatch');this.saved=new Map(Object.entries(data.sectors||{}).map(([id,s])=>[id,clone(s)]));this.loaded.clear();this.active.clear();this.visited=new Set(data.visited||[]);this.visitedBiomes=new Set(data.visitedBiomes||[]);}
    tickDistant(){return 0;} // Stable extension point for a later coarse population simulation.
  }
  return {VERSION,DEFAULTS,BIOMES,ALLOWED_BY_SPECIES,RESOURCE_BIOMES,createConfig,sectorCoords,terrainAt,isLand,generateSector,SectorManager};
});
