'use strict';
// ================= Zone generator: the regions of the world, each grown on its own map and then merged into the world map (world.js) =================
// Each region = clearings (nodes) joined by paths (or by fords on island maps), encounter camps, chest nooks, a waypoint, a dungeon mouth and caves.
// A region is generated on a local map a bit larger than its cell (PAD tiles of margin), but only the tiles it owns end up in the world
// (the borders between regions are woven together by the world generator). Everything is seeded: the same world every time.
const DUNEXIT={};   // dungeon id -> where its exit leads back to (world coordinates, set when the world is built)
const GRET={};      // grotto id (zone name) -> return position
// World seed: every save slot has its own (0 = the original world of the first release). The seed only shuffles what lies INSIDE a region and the dungeon layouts;
// the region grid, borders, roads, gates and bosses never change. GEN_SALT mixes seed + retry attempt into every generator seed (0 = unchanged).
let WORLD_SEED=0,GEN_SALT=0;
const GENFAIL=[];   // reasons why the world being built is not acceptable (ensureWorld then retries with the next attempt)
const zs=base=>GEN_SALT?Math.imul((base^GEN_SALT)>>>0,0x9E3779B1)>>>0:base;
const PROPRULE={cutbush:{deco:true},logs:{deco:true},ore:{mul:.22},clay:{mul:.3},hay:{mul:.35},grave:{mul:.65}};
const SIDEV={W:[1,0],E:[-1,0],N:[0,1],S:[0,-1]};   // inward direction of each cell edge

const ZSPEC={
  // ------------------------------------------------ the home region
  village:{name:'Hearthmoor',ground:T.GRASS,alt:T.LEAF,altp:.1,wood:T.TREE,dens:.68,mist:false,camps:8,chests:3,caves:0,lvl:[1,3],foes:['beetle','shroom'],main:'E',seed:3,village:true,
    props:[['cutbush',110],['clay',420],['logs',400],['herb',220,1]]},
  // ------------------------------------------------ the original nine (now much bigger and denser)
  glade:{name:'Ember Glade',ground:T.GRASS,alt:T.LEAF,altp:.22,wood:T.TREE,dens:.67,mist:true,camps:28,chests:10,caves:4,lvl:[1,6],foes:['beetle','wolf','shroom'],main:'W',seed:7,
    dungeon:{id:'dungeon',sign:'The Hollow Oak lies just ahead. Something ancient sleeps inside... Old Barkfather!'},
    pocket:{gate:'boots'},
    props:[['cutbush',65],['clay',220],['ore',200],['logs',230],['herb',200,1]]},
  amber:{name:'Amber Hollow',ground:T.GRASS,alt:T.LEAF,altp:.3,wood:T.TREE,dens:.7,mist:true,camps:40,chests:12,caves:4,lvl:[5,10],foes:['bat','shroom','brute'],main:'N',seed:21,
    split:{f:.56,vy:.5},
    dungeon:{id:'spore',sign:'The Spore Warren. Mushrooms grow where nothing else can. Stone blocks can be pushed onto pressure plates...',east:true},
    pocket:{gate:'hook'},
    props:[['cutbush',70],['clay',240],['ore',200],['logs',260],['herb',220,1],['glowcap',110,1]]},
  marsh:{name:'Mistwater Marsh',hazards:[['sand',9,6,5,{skin:'mud'}]],fx:'fireflies',grade:'green',ground:T.GRASS,alt:T.MOSS,altp:.4,wood:T.TREE,dens:.6,ponds:34,mist:true,camps:30,chests:10,caves:3,lvl:[9,14],foes:['bat','shroom','wolf','brute'],main:'E',seed:33,
    dungeon:{id:'shrine',sign:'The Sunken Shrine. Strike the glowing orb with a weapon or arrow to raise the water gate. Small keys open locked doors.'},
    needcave:{id:'grotto_marsh',need:'lantern',text:'The burrow is pitch black. You need a light.'},
    props:[['herb',260,1],['cutbush',320],['ore',300],['logs',320],['glowcap',160,1]]},
  rust:{name:'Rustpeak',hazards:[['vent',7,2,2,{skin:'steam'}]],ground:T.SCREE,alt:T.SCREE,altp:0,wood:T.CRAG,dens:.66,mist:false,camps:40,chests:12,caves:4,lvl:[12,18],foes:['wolf','beetle','brute','bat'],main:'E',seed:47,
    dungeon:{id:'mine',sign:'The Rustpeak Mine. Blocks, plates and keys. If a block gets stuck, leave and come back in.'},
    needcave:{id:'grotto_rust',need:'heartseed',text:'A knot of living roots seals the cave. Something here hungers for a Heartseed.'},
    props:[['ore',90],['clay',250],['logs',320],['herb',420,1],['cutbush',500]]},
  grove:{name:'Ghostbark Grove',hazards:[['thorn',8,5,4,{skin:'roots'}]],fx:'fireflies',ground:T.MOSS,alt:T.MOSS,altp:0,wood:T.GTREE,dens:.7,mist:true,night:true,camps:38,chests:11,caves:4,lvl:[36,39],foes:['skeleton','ghost','shroom'],main:'S',seed:59,
    dungeon:{id:'crypt',sign:'The Ghostbark Crypt. Three floors of the dead. The Hollow King does not forgive trespassers.'},
    props:[['grave',70],['lantern',500],['ore',380],['glowcap',130,1],['herb',420,1]]},
  heart:{name:'Heart of Spicewood',ground:T.GRASS,alt:T.LEAF,altp:.45,wood:T.TREE,dens:.68,mist:true,camps:26,chests:9,caves:3,lvl:[40,42],foes:['skeleton','ghost','brute','wolf','bat'],main:'N',seed:83,
    arena:true,
    props:[['ore',300],['logs',300],['herb',280,1],['glowcap',150,1],['cutbush',220]]},
  saffron:{name:'Saffron Meadows',hazards:[['gust',3,10,6,{path:true,dir:'across'}]],fx:'pollen',grade:'wind',ground:T.GRASS,alt:T.FLOWER,altp:.07,wood:T.TREE,dens:.5,mist:false,camps:34,chests:10,caves:4,lvl:[16,21],foes:['wolf','bat','brute','beetle'],main:'S',seed:101,tint:'#fff4c8',fields:9,
    dungeon:{id:'granary',sign:'The Gilded Granary. The harvest never ended here, and neither did the Harvest King.'},
    props:[['cutbush',180],['hay',140],['logs',300],['clay',260],['herb',200,1],['ore',420]]},
  ember:{name:'Cinderfall Heights',hazards:[['vent',10,2,2],['sand',4,6,5,{skin:'ash'}]],fx:'ash',grade:'ash',ground:T.SCREE,alt:T.SCREE,altp:0,wood:T.CRAG,dens:.62,mist:false,camps:32,chests:10,caves:4,lvl:[25,29],foes:['brute','skeleton','wolf','ghost','bat'],main:'E',seed:131,tint:'#f4b898',braziers:22,
    dungeon:{id:'forge',sign:'The Cinder Forge. Something hot is still working in the dark.'},
    props:[['ore',110],['clay',260],['logs',340],['herb',460,1],['cutbush',520]]},
  // ------------------------------------------------ the seven far regions
  tangle:{name:'Tanglewood Depths',hazards:[['thorn',10,6,5]],fx:'fireflies',grade:'green',ground:T.GRASS,alt:T.LEAF,altp:.35,wood:T.JTREE,dens:.76,mist:true,camps:44,chests:13,caves:5,lvl:[28,32],foes:['thornbrute','wolf','beetle','shroom'],main:'W',seed:151,tint:'#d8f0d0',
    dungeon:{id:'rootmaw',sign:'The Rootmaw. The roots of the Tanglewood twist down into a living cave. The Thorn Matriarch rules here.'},
    props:[['cutbush',60],['logs',200],['herb',160,1],['glowcap',120,1],['ore',360],['clay',360]]},
  delta:{name:'Spice Delta',hazards:[['current',9,9,3,{path:true,dir:'along',oriented:true}]],fx:'fireflies',mode:'islands',altp:.3,mist:true,camps:28,chests:9,caves:3,lvl:[30,34],foes:['bat','shroom','wolf','thornbrute'],main:'N',seed:171,tint:'#ffe8c8',
    dungeon:{id:'cellar',sign:'The Great Spice Cellar. Every spice in the Spicewoods is stored here, and the Pepper Baron guards them all.'},
    props:[['herb',200,1],['cutbush',300],['ore',320],['logs',300],['glowcap',160,1]]},
  mesa:{name:'Sunbaked Mesa',hazards:[['sand',9,6,5]],fx:'dust',grade:'hot',ground:T.SAND,alt:T.SAND,altp:0,wood:T.CACTUS,dens:.5,mist:false,camps:36,chests:11,caves:4,lvl:[32,36],foes:['sandbeetle','wolf','brute','bat'],main:'W',seed:191,tint:'#fff0d0',
    dungeon:{id:'sandhall',sign:'The Sunken Sandhall. A buried palace, half drowned in sand. The Sand Tyrant still sits on his throne.'},
    props:[['clay',120],['ore',200],['hay',320],['logs',420],['herb',500,1]]},
  steppe:{name:'Windward Steppe',hazards:[['gust',8,12,6,{path:true,dir:'across'}],['gust',3,10,8,{dir:'any'}]],fx:'wind',grade:'wind',ground:T.GRASS,alt:T.FLOWER,altp:.05,wood:T.TREE,dens:.32,mist:false,camps:34,chests:11,caves:4,lvl:[19,24],foes:['stormbat','wolf','brute','beetle'],main:'S',seed:211,tint:'#fff4cc',
    dungeon:{id:'citadel',sign:'The Gale Citadel. A tower of wind and lightning. The Storm Herald waits at the top.'},
    props:[['cutbush',120],['hay',260],['logs',320],['clay',380],['herb',260,1],['ore',420]]},
  spire:{name:'Smolder Spire',hazards:[['vent',16,2,2]],fx:'ash',grade:'ash',ground:T.ASH,alt:T.ASH,altp:0,wood:T.OBSID,dens:.5,mist:false,camps:30,chests:10,caves:4,lvl:[22,27],foes:['magmabrute','skeleton','ghost','bat'],main:'S',seed:231,tint:'#ffb090',braziers:26,
    dungeon:{id:'magmacore',sign:'The Magma Core. The mountain\'s molten heart. The Magma Tyrant sits in a lake of fire.'},
    props:[['ore',100],['clay',280],['logs',420],['herb',520,1],['cutbush',640]]},
  gulch:{name:'Crystal Gulch',hazards:[['ice',7,5,4],['ice',3,7,3,{path:true}]],fx:'sparkle',grade:'dream',ground:T.SCREE,alt:T.ASH,altp:.3,wood:T.CRYSTAL,dens:.52,mist:true,cold:true,camps:28,chests:9,caves:3,lvl:[34,37],foes:['crystalghost','skeleton','brute','stormbat'],main:'W',seed:251,tint:'#e8d8ff',
    dungeon:{id:'prismvault',sign:'The Prism Vault. A vault of living light. The Prism Wraith cannot leave it.'},
    props:[['glowcap',90,1],['ore',200],['lantern',420],['logs',700],['herb',600,1]]},
  ridge:{name:'Hoarfrost Ridge',hazards:[['ice',10,6,4],['ice',6,5,4,{path:true}]],fx:'snow',grade:'cold',ground:T.SNOW,alt:T.SNOW,altp:0,wood:T.PINE,dens:.64,mist:true,cold:true,camps:38,chests:12,caves:5,lvl:[38,41],foes:['frostwolf','frostskel','ghost','brute'],main:'S',seed:271,tint:'#e0f0ff',
    dungeon:{id:'reliquary',sign:'The Frozen Reliquary. Where the Heart\'s oldest secrets are kept on ice. The Winter Warden guards them.'},
    props:[['ore',200],['logs',260],['lantern',520],['herb',700,1],['cutbush',800]]}
};

// the forecourt in front of every dungeon: scenery that fits the place (the lane right in front of the mouth stays clear)
const PLAZA={dungeon:['logs','logs','glowcap','cutbush','logs','cutbush'],spore:['glowcap','glowcap','clay','glowcap','glowcap','glowcap'],shrine:['clay','glowcap','clay','cutbush','clay','glowcap'],
  mine:['crate','ore','lantern','barrel','crate','lantern'],crypt:['grave','grave','brazier','grave','brazier','grave'],granary:['hay','hay','barrel','crate','hay','barrel'],
  forge:['brazier','ore','brazier','barrel','ore','brazier'],rootmaw:['cutbush','glowcap','logs','cutbush','glowcap','cutbush'],cellar:['barrel','barrel','crate','barrel','crate','barrel'],
  sandhall:['ore','clay','lantern','ore','clay','lantern'],citadel:['lantern','ore','lantern','crate','lantern','ore'],magmacore:['brazier','ore','brazier','ore','brazier','ore'],
  prismvault:['glowcap','lantern','glowcap','ore','glowcap','lantern'],reliquary:['lantern','grave','lantern','ore','lantern','grave']};
const PLAZA_DECO=new Set(['logs','glowcap','cutbush']);
function dungeonPlaza(m,id,dx,dy,owned){
  const list=PLAZA[id];if(!list)return;
  const spots=[[-5,-1],[4,-1],[-6,3],[5,3],[-5,6],[4,6]];
  spots.forEach(([ox,oy],i)=>{
    const x=dx+ox,y=dy+oy,t=gt(m,x,y);
    if(t<0||SOLID[t]||t===T.PATH||t===T.OAK||!owned(x,y)||m.props.some(q=>q.tx===x&&q.ty===y))return;
    if(PLAZA_DECO.has(list[i]))addDeco(m,list[i],x,y);else addProp(m,list[i],x,y);
  });
}
// ---------- one region on its own local map ----------
function genZoneLocal(z,WX){
  const S=ZSPEC[z],cell=WX.cell[z],PAD=WX.PAD,zi=WX.zi[z];
  const CW=cell.w,CH=cell.h,LW=CW+2*PAD,LH=CH+2*PAD,ox=cell.x-PAD,oy=cell.y-PAD,r=seeded(zs(S.seed));
  const rnd=n=>Math.floor(r()*n),pk=a=>a[rnd(a.length)],ri=(a,b)=>a+r()*(b-a);
  const isle=S.mode==='islands';
  const owned=(x,y)=>{const wx=Math.floor(x)+ox,wy=Math.floor(y)+oy;return wx>=0&&wy>=0&&wx<WX.w&&wy<WX.h&&WX.own[wy*WX.w+wx]===zi};
  const ownedDisc=(x,y,rad)=>{
    if(!owned(x,y))return false;
    const n=Math.max(8,Math.ceil(rad*2.5));
    for(let k=0;k<n;k++){const a=k/n*TAU;if(!owned(x+Math.cos(a)*rad,y+Math.sin(a)*rad))return false}
    return true;
  };
  const m=mk(z,S.name,LW,LH,isle?T.WATER:S.ground);
  m.ox=ox;m.oy=oy;m.own=owned;
  const wood=S.wood,ground=isle?(()=>r()<S.altp?T.LEAF:T.GRASS):(()=>r()<S.altp?S.alt:S.ground);
  if(!isle){
    for(let i=0;i<m.t.length;i++)if(r()<S.altp)m.t[i]=S.alt;
    forest(m,r,S.dens);
    if(wood!==T.TREE)for(let i=0;i<m.t.length;i++)if(m.t[i]===T.TREE)m.t[i]=wood;
  }
  // ---------------- nodes
  const nodes=[];
  const addNode=(x,y,rad,kind,extra)=>{const n=Object.assign({x,y,r:rad,kind,i:nodes.length,adj:[],hop:0},extra||{});nodes.push(n);return n};
  const far=(x,y,min)=>nodes.every(n=>Math.hypot(n.x-x,n.y-y)>=min+(n.r>6?n.r-6:0));
  const links=WX.links[z]||[],linkNodes={};
  for(const L of links){const n=addNode(L.x-ox,L.y-oy,3.4,'exit',{side:L.side,link:L});linkNodes[L.side]=n}
  const main=linkNodes[S.main];main.kind='main';
  if(S.village){const vc=WX.vstamp;addNode(vc.x+20-ox,vc.y+15-oy,24,'void');(m.reserve=m.reserve||[]).push([vc.x-ox-3,vc.y-oy-3,vc.x-ox+43,vc.y-oy+33])}
  let arena=null;
  if(S.arena){
    let ay=PAD+CH-40;   // the Heart is entered from the north (Hoarfrost Ridge), so the arena lies in the south
    while(ay>PAD+CH-70&&!ownedDisc(PAD+Math.round(CW/2),ay,14))ay-=3;
    arena=addNode(PAD+Math.round(CW/2),ay,9,'arena');
  }
  const x0=S.split?PAD+Math.round(CW*S.split.f):-1,vy=S.split?PAD+Math.round(CH*S.split.vy):0;
  let gateW=null,gateE=null;
  if(S.split){gateW=addNode(x0-7,vy,3.2,'camp',{gate:true});gateE=addNode(x0+8,vy,3.2,'camp',{gate:true})}
  const sample=(tries,margin,fn)=>{for(let k=0;k<tries;k++){const x=PAD+margin+rnd(CW-2*margin),y=PAD+margin+rnd(CH-2*margin);if(fn(x,y))return[x,y]}return null};
  // dungeon clearing: as far from the main anchor as the region allows
  let dun=null;
  if(S.dungeon){
    let best=null;
    for(let k=0;k<400;k++){
      const x=PAD+10+rnd(CW-20),y=PAD+10+rnd(CH-20);
      if(!far(x,y,16)||!ownedDisc(x,y,(isle?5.2:4.6)+4))continue;
      if(S.split&&S.dungeon.east&&x<x0+14)continue;
      if(S.split&&Math.abs(x-x0)<10)continue;
      const d=Math.hypot(x-main.x,y-main.y);
      if(!best||d>best[2])best=[x,y,d];
    }
    if(!best){best=[PAD+Math.round(CW/2),PAD+Math.round(CH/2),0];GENFAIL.push(z+': no room for the dungeon')}
    dun=addNode(best[0],best[1],isle?5.2:4.6,'dungeon');
  }
  const minD=isle?11:12.5;
  let guard=0;
  while(nodes.filter(n=>n.kind==='camp'&&!n.gate).length<S.camps&&guard++<2500){
    const rad=ri(3.2,5.4);
    const p=sample(1,6,(x,y)=>far(x,y,minD)&&Math.hypot(x-main.x,y-main.y)>=19&&(!S.split||Math.abs(x-x0)>7)&&ownedDisc(x,y,rad+3));
    if(!p)continue;
    addNode(p[0],p[1],rad,'camp');
  }
  if(nodes.filter(n=>n.kind==='camp'&&!n.gate).length<S.camps*.85)GENFAIL.push(z+': too few camps');
  // ---------------- graph (two halves when a wall splits the region)
  const mid=(a,b)=>{const d=Math.hypot(a.x-b.x,a.y-b.y);return[(a.x+b.x)/2+ri(-.16,.16)*d,(a.y+b.y)/2+ri(-.16,.16)*d]};
  const pathCache=new Map(),okCache=new Map();
  const pathOf=(a,b)=>{
    const A=a.i<b.i?a:b,B=a.i<b.i?b:a,k=A.i*4096+B.i;let p=pathCache.get(k);
    if(!p){p=[[A.x,A.y],mid(A,B),[B.x,B.y]];pathCache.set(k,p)}
    return p;
  };
  // a path only counts when it stays on this region's own ground (paths that wander into a neighbour's land would be cut off when the regions are merged)
  const pathOK=(a,b)=>{
    const A=a.i<b.i?a:b,B=a.i<b.i?b:a,k=A.i*4096+B.i;let v=okCache.get(k);
    if(v===undefined){
      v=true;const p=pathOf(a,b);
      for(let s=0;s<2&&v;s++){const[p0,p1]=[p[s],p[s+1]],n=Math.ceil(Math.hypot(p1[0]-p0[0],p1[1]-p0[1])/1.5);for(let q=0;q<=n;q++){const t=q/n;if(!owned(p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t)){v=false;break}}}
      okCache.set(k,v);
    }
    return v;
  };
  const mst=list=>{
    const e=[];if(list.length<2)return e;const inT=new Set([list[0]]);
    while(inT.size<list.length){
      let b=null,bv=null;
      for(const a of inT)for(const c of list){
        if(inT.has(c))continue;
        const d=Math.hypot(a.x-c.x,a.y-c.y);
        if(pathOK(a,c)){if(!b||d<b.d)b={a,c,d}}else if(!bv||d<bv.d)bv={a,c,d};
      }
      const pick=b||bv;inT.add(pick.c);e.push([pick.a,pick.c]);
    }
    return e;
  };
  const edges=[];
  const connect=(a,b)=>{if(a.adj.includes(b))return;a.adj.push(b);b.adj.push(a);edges.push([a,b])};
  const live=nodes.filter(n=>n.kind!=='void');
  const groups=S.split?[live.filter(n=>n.x<x0),live.filter(n=>n.x>=x0)]:[live];
  for(const g of groups){
    for(const[a,b]of mst(g))connect(a,b);
    for(const a of g){
      const near=g.filter(b=>b!==a).sort((p,q)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(q.x-a.x,q.y-a.y));
      if(near[1]&&r()<.55&&Math.hypot(near[1].x-a.x,near[1].y-a.y)<34&&pathOK(a,near[1]))connect(a,near[1]);
    }
  }
  if(S.split)connect(gateW,gateE);
  // hops from the main anchor
  {const q=[main];main.hop=0;const seen=new Set([main]);while(q.length){const a=q.shift();for(const b of a.adj){if(seen.has(b))continue;seen.add(b);b.hop=a.hop+1;q.push(b)}}}
  const maxHop=Math.max(1,...nodes.map(n=>n.hop));
  const lvAt=n=>Math.max(1,Math.round(S.lvl[0]+(S.lvl[1]-S.lvl[0])*Math.min(1,n.hop/maxHop)));
  // ---------------- carve
  const lines=edges.map(([a,b])=>pathOf(a,b));
  if(isle){
    for(const n of nodes)if(n.kind!=='void')disc(m,n.x,n.y,n.r,ground);
    for(const p of lines)polyline(m,p,(x,y)=>disc(m,x,y,1.5,T.SHALLOW,t=>t===T.WATER));
  }else{
    const clearT=t=>t===wood||t===T.ROCK;
    for(const p of lines)polyline(m,p,(x,y)=>disc(m,x,y,2.2,ground,clearT));
    for(const n of nodes)if(n.kind!=='void')disc(m,n.x,n.y,n.r,ground,clearT);
    for(const p of lines)polyline(m,p,(x,y)=>disc(m,x,y,1.0,T.PATH));
  }
  // nooks: small dead-end clearings that hold a chest
  const nooks=[];
  for(let k=0,g=0;k<S.chests&&g<600;g++){
    const base=pk(nodes.filter(n=>n.kind==='camp'&&!n.gate));if(!base)break;
    const a=ri(0,TAU),d=ri(9,13),x=Math.round(base.x+Math.cos(a)*d),y=Math.round(base.y+Math.sin(a)*d);
    if(!far(x,y,8)||!ownedDisc(x,y,(isle?2.8:2.5)+2))continue;
    if(S.split&&(base.x<x0)!==(x<x0))continue;
    if(S.split&&Math.abs(x-x0)<6)continue;
    const n=addNode(x,y,isle?2.8:2.5,'nook',{base,hop:base.hop});
    connect(base,n);
    if(isle){disc(m,x,y,n.r,ground);polyline(m,[[base.x,base.y],[x,y]],(px,py)=>disc(m,px,py,1.5,T.SHALLOW,t=>t===T.WATER))}
    else{polyline(m,[[base.x,base.y],[x,y]],(px,py)=>disc(m,px,py,2.2,ground,t=>t===wood||t===T.ROCK));disc(m,x,y,n.r,ground,t=>t===wood||t===T.ROCK);polyline(m,[[base.x,base.y],[x,y]],(px,py)=>disc(m,px,py,1.1,T.PATH))}
    nooks.push(n);k++;
  }
  if(nooks.length<S.chests-1)GENFAIL.push(z+': too few chest nooks');
  // ponds (bog regions): irregular pools with a shallow rim, kept clear of every clearing and path
  if(S.ponds){
    const track=[];
    for(const[a,b]of edges){for(const p of pathOf(a,b))track.push(p);for(let q=0;q<=8;q++)track.push([a.x+(b.x-a.x)*q/8,a.y+(b.y-a.y)*q/8])}
    for(let k=0,g=0;k<S.ponds&&g<900;g++){
      const rad=ri(2.2,4.4),x=PAD+4+rnd(CW-8),y=PAD+4+rnd(CH-8);
      if(!ownedDisc(x,y,rad+4))continue;
      if(!nodes.every(n=>n.kind==='void'?Math.hypot(n.x-x,n.y-y)>n.r+rad+2:Math.hypot(n.x-x,n.y-y)>n.r+rad+3))continue;
      if(!track.every(p=>Math.hypot(p[0]-x,p[1]-y)>rad+3.5))continue;
      const a=ri(0,TAU),ox2=Math.cos(a)*rad*.5,oy2=Math.sin(a)*rad*.5;
      for(const[dx,dy,rr]of[[0,0,rad],[ox2,oy2,rad*.8],[-ox2,-oy2,rad*.7]])disc(m,x+dx,y+dy,rr+1,T.SHALLOW,t=>t!==T.PATH);
      for(const[dx,dy,rr]of[[0,0,rad],[ox2,oy2,rad*.8],[-ox2,-oy2,rad*.7]])disc(m,x+dx,y+dy,rr,T.WATER);
      k++;
    }
  }
  // wall of thorns that splits the region (Amber Hollow); the only crossing is a stretch of vines
  if(S.split){
    for(let y=0;y<LH;y++)for(const x of[x0,x0+1])st(m,x,y,(y>=vy-2&&y<=vy+2)?T.VINE:wood);
  }
  // ---------------- features
  const placeMouth=(x,y,to,extra)=>{
    st(m,x-1,y,T.OAK);st(m,x,y,T.OAK);
    m.warps.push(Object.assign({x:(x-1)*TS,y:y*TS,w:2*TS,h:TS,to,tx:null,ty:null},extra||{}));
  };
  // waypoint at the main anchor (the village has its own plinth)
  if(!S.village){const v=SIDEV[S.main],wx=Math.round(main.x+v[0]*3),wy=Math.round(main.y+v[1]*3);WPS[z]=[wx+ox,wy+oy];waypoint(m,isle?T.GRASS:S.ground,[wx,wy])}
  // dungeon mouth
  if(dun){
    const dx=Math.round(dun.x),dy=Math.round(dun.y)-4;
    placeMouth(dx,dy,S.dungeon.id);
    DUNEXIT[S.dungeon.id]={to:'world',tx:(dx+ox)*TS,ty:(dy+2+oy)*TS+8};
    addProp(m,'sign',dx+2,dy+1,{text:S.dungeon.sign});
    dungeonPlaza(m,S.dungeon.id,dx,dy,owned);
    (m.reserve=m.reserve||[]).push([dx-3,dy-1,dx+3,dy+4]);
  }
  // region NPC next to the waypoint and lore tomes in some of the camps
  if(ZNPC[z]){
    const v=SIDEV[S.main],pp=[v[1],v[0]];
    for(const[a,b]of[[3,4],[-3,4],[3,2],[-3,2],[0,6]]){
      const tx=Math.round(main.x+pp[0]*a+v[0]*b),ty=Math.round(main.y+pp[1]*a+v[1]*b),t=gt(m,tx,ty);
      if(t<0||SOLID[t]||t===T.OAK||!owned(tx,ty))continue;
      m.npcs.push({id:'zn',zone:z,name:ZNPC[z].name,x:(tx+.5)*TS,y:(ty+.5)*TS,pal:NPCPALS[S.seed%NPCPALS.length]});
      break;
    }
  }
  if(TOMES[z]){
    const camps=nodes.filter(n=>n.kind==='camp'&&!n.gate);
    for(let i=0;i<TOMES[z].length&&camps.length;i++){
      const n=camps.splice(rnd(camps.length),1)[0],tx=Math.round(n.x),ty=Math.round(n.y);
      addProp(m,'tome',tx,ty,{id:z+'_'+i});n.hasTome=true;
    }
  }
  // the forgotten tree of the region (picked without the random generator, so old worlds keep their layout)
  if(typeof FTREE!=='undefined'&&FTREE[z]){
    const camps=nodes.filter(n=>n.kind==='camp'&&!n.gate&&!n.hasTome);
    if(camps.length){const n=camps[(S.seed*7)%camps.length];addProp(m,'ftree',Math.round(n.x),Math.round(n.y),{zone:z});n.hasTome=true}
  }
  // a spice plant of the region (also picked without the random generator; not placed again once it has been found)
  if(typeof SPICE!=='undefined'&&SPICE[z]&&!spiceHave(SPICE[z].id)){
    const camps=nodes.filter(n=>n.kind==='camp'&&!n.gate&&!n.hasTome);
    if(camps.length){const n=camps[(S.seed*5+3)%camps.length];addProp(m,'spice',Math.round(n.x),Math.round(n.y),{id:SPICE[z].id,use:'spice'});n.hasTome=true}
  }
  // pocket (hidden gated cave): an L-shaped corridor through untouched forest, starting at a clearing
  if(S.pocket){
    const pool=nodes.filter(n=>n.kind==='camp'&&!n.gate&&(!S.split||n.x<x0-10));
    outer:for(let k=0;k<1500&&pool.length;k++){
      const C=pk(pool),fx=Math.round(C.x),fy=Math.round(C.y),sx=rnd(2)?1:-1,sy=rnd(2)?1:-1;
      const px=fx+sx*(8+rnd(5)),py=fy+sy*(7+rnd(5)),dy=py>fy?1:-1;
      if(px<PAD+7||px>LW-PAD-8||py<PAD+8||py>LH-PAD-9)continue;
      if(S.split&&px>x0-6)continue;
      // footprint: the corridor and the cave disc must not touch paths, exits or other clearings; leftover open ground is re-forested
      const fp=[];
      for(let x=Math.min(fx,px)-4;x<=Math.max(fx,px)+4;x++)for(let y=fy-4;y<=fy+4;y++)fp.push([x,y]);
      for(let y=Math.min(fy,py)-4;y<=Math.max(fy,py)+4;y++)for(let x=px-4;x<=px+4;x++)fp.push([x,y]);
      for(const[x,y]of fp){
        if(Math.hypot(x-fx,y-fy)<6)continue;
        if(!owned(x,y))continue outer;
        const t=gt(m,x,y);if(t<0||t===T.PATH||t===T.OAK||t===T.VINE||t===T.SHALLOW||t===T.GORGE)continue outer;
        if(nodes.some(n=>n!==C&&Math.hypot(n.x-x,n.y-y)<n.r+1.2))continue outer;
      }
      for(const[x,y]of fp){if(Math.hypot(x-fx,y-fy)<6)continue;st(m,x,y,wood)}
      const o={fx,fy,px,py,gate:S.pocket.gate},G=pocketGeo(o);
      pocket(m,r,o,'grotto_'+z);
      GRET[z]={tx:G.rx+ox*TS,ty:G.ry+oy*TS};
      break;
    }
    if(!GRET[z])GENFAIL.push(z+': no room for the pocket cave');
  }
  // gated cave in an existing clearing (lantern burrow / heartseed vault)
  if(S.needcave){
    const pool=nodes.filter(n=>n.kind==='camp'&&!n.gate&&n.r>=4.2);
    const n=pool.length?pk(pool):nodes.find(q=>q.kind==='camp');
    if(n){
      const mx=Math.round(n.x),my=Math.round(n.y-Math.floor(n.r));
      n.noSpawn=true;
      placeMouth(mx,my,S.needcave.id,{need:S.needcave.need,needText:S.needcave.text,back:{x:(mx+ox)*TS,y:(my+2+oy)*TS}});
      GRET[z]={tx:(mx+ox)*TS,ty:(my+2+oy)*TS};
      (m.reserve=m.reserve||[]).push([mx-3,my-1,mx+3,my+4]);
    }else GENFAIL.push(z+': no clearing for the gated cave');
  }
  // arena (Heart of Spicewood): the Heartwood sleeps in the middle
  if(arena){
    const ax=Math.round(arena.x),ay=Math.round(arena.y);
    disc(m,ax,ay,1.6,T.PATH);
    for(const[dx,dy]of[[-7,-4],[7,-4],[-7,5],[7,5]])addProp(m,'brazier',ax+dx,ay+dy);
    // the great tree that holds the Heart: it stands behind the arena, its trunk is solid
    disc(m,ax,ay-9,4.5,T.GRASS);
    addProp(m,'worldtree',ax,ay-9);
    for(const[dx,dy]of[[-1,0],[1,0],[-1,-1],[0,-1],[1,-1]])st(m,ax+dx,ay-9+dy,T.BLOCK);
    m.spawns.push({type:'boss',variant:'heartwood',x:ax*TS+8,y:(ay-9)*TS+1,lvl:42,mx:ax*TS+8,my:(ay-4)*TS});   // the Heart sits in the trunk; Maren later steps out into the arena
    m.after={flag:'boss16',chest:'boss16',cx:ax+ox,cy:ay-7+oy,wx:ax-1+ox,wy:ay+2+oy,to:'world',tx:WX.heartReturn.x,ty:WX.heartReturn.y};
    (m.reserve=m.reserve||[]).push([ax-9,ay-14,ax+9,ay+9]);
    arena.noSpawn=true;
  }
  // ---------------- set pieces (spots.js): rune trial, landmark, secret nooks. Own random stream.
  if(typeof placeSpots==='function')placeSpots({m,z,S,nodes,edges,pathOf,owned,ox,oy,lvAt,rs:seeded(zs(S.seed*977+31))});
  // ---------------- encounters
  const pset=new Set(m.props.map(p=>p.ty*LW+p.tx));
  const grp=(n,count,o)=>{
    o=o||{};
    for(let k=0,g=0;k<count&&g<40;g++){
      const a=ri(0,TAU),d=ri(.4,.8)*n.r,x=n.x+Math.cos(a)*d,y=n.y+Math.sin(a)*d;
      const tx=Math.floor(x),ty=Math.floor(y),t=gt(m,tx,ty);
      if(t<0||SOLID[t]||t===T.OAK||pset.has(ty*LW+tx)||!owned(tx,ty))continue;
      if(m.spawns.some(s=>Math.hypot(s.x/TS-x,s.y/TS-y)<1.7))continue;
      m.spawns.push({type:o.type||pk(S.foes),x:x*TS,y:y*TS,lvl:lvAt(n)+(o.dl||0),elite:!!o.elite||(o.first&&k===0)});k++;
    }
  };
  for(const n of nodes){
    if(n.noSpawn||n.kind==='main'||n.kind==='arena'||n.kind==='void')continue;
    if(n.kind==='camp'){const big=n.r>=4.4;grp(n,big?4+rnd(3):3+rnd(2),{first:big})}
    else if(n.kind==='dungeon')grp(n,3,{dl:1});
    else if(n.kind==='exit'&&!S.village){const v=SIDEV[n.side];grp({x:n.x+v[0]*2,y:n.y+v[1]*2,r:2.2,hop:n.hop},2)}
  }
  // chests (a guard pair waits beside each one)
  nooks.forEach((n,i)=>{
    m.chests.push({id:`zc_${z}_${i+1}`,x:(Math.round(n.x)+ox)*TS+8,y:(Math.round(n.y)+oy)*TS+8,tier:lvAt(n)+1});
    grp({x:n.x,y:n.y+1.2,r:1.8,hop:n.hop},2,{dl:1,first:true});
  });
  // ---------------- caves, decoration, props
  {
    const mainPx0={x:main.x+SIDEV[S.main][0]*3,y:main.y+SIDEV[S.main][1]*3};
    const seen=new Uint8Array(LW*LH),q=[[Math.floor(mainPx0.x),Math.floor(mainPx0.y)]];
    const okT=t=>t>=0&&(!SOLID[t]||t===T.VINE||t===T.GORGE||t===T.SHALLOW);
    seen[q[0][1]*LW+q[0][0]]=1;
    while(q.length){const[x,y]=q.pop();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,t=gt(m,nx,ny);if(!okT(t)||seen[ny*LW+nx]||!owned(nx,ny))continue;seen[ny*LW+nx]=1;q.push([nx,ny])}}
    caves(m,r,S.caves||0,seen);
  }
  if(S.fields){
    for(let k=0;k<S.fields;k++){
      const n=pk(nodes.filter(q=>q.kind==='camp'&&!q.gate)),x=Math.round(n.x-3+rnd(3)),y=Math.round(n.y-3+rnd(3)),w=6,h=4;
      let ok=true;
      for(let j=-1;j<=h&&ok;j++)for(let i=-1;i<=w;i++){const t=gt(m,x+i,y+j);if((t!==T.GRASS&&t!==T.FLOWER&&t!==T.LEAF)||!owned(x+i,y+j)){ok=false;break}if(m.spawns.some(s=>Math.hypot(s.x/TS-(x+i),s.y/TS-(y+j))<1.5)){ok=false;break}}
      if(!ok)continue;
      rectT(m,x,y,w,h,T.CROP);
      for(let i=-1;i<=w;i++){st(m,x+i,y-1,T.FENCE);st(m,x+i,y+h,T.FENCE)}
      for(let j=-1;j<=h;j++){st(m,x-1,y+j,T.FENCE);st(m,x+w,y+j,T.FENCE)}
      st(m,x+2,y+h,T.GRASS);st(m,x+3,y+h,T.GRASS);
      (m.reserve=m.reserve||[]).push([x-2,y-2,x+w+1,y+h+1]);
    }
  }
  const nearExit=(x,y)=>{for(const n of nodes)if(n.kind==='exit'&&Math.hypot(x-n.x,y-n.y)<6)return true;return false};
  const avoid=(x,y)=>nearExit(x,y)||m.spawns.some(s=>Math.hypot(s.x/TS-x,s.y/TS-y)<1.6)||m.chests.some(c=>Math.hypot(c.x/TS-ox-x,c.y/TS-oy-y)<2.2);
  const area=CW*CH,okOwn=(x,y)=>owned(x,y);
  // Zelda rules for scenery: grass and fallen logs can be walked through (and grass cut), rocks and pots are rare and never in the way
  for(const[k,per,deco]of S.props){const rule=PROPRULE[k]||{};scatter(m,r,Math.floor(area/per*(rule.mul||1)),k,okOwn,avoid,!!deco||!!rule.deco)}
  if(S.braziers)scatter(m,r,S.braziers,'brazier',okOwn,avoid);
  if(S.altp&&S.alt===T.FLOWER){for(let n=0;n<area/45;n++){const x=PAD+rnd(CW),y=PAD+rnd(CH);if(gt(m,x,y)===T.GRASS&&owned(x,y)&&!avoid(x,y))st(m,x,y,T.FLOWER)}}
  // terrain hazards of the region (fields.js); own random stream so the rest of the region does not change
  if(S.hazards&&typeof placeHazards==='function'){const rh=seeded(zs(S.seed*131+17));placeHazards(m,z,S,nodes,edges,pathOf,owned,rh)}
  if(typeof registerCaves==='function')registerCaves(z);
  return{z,m,nodes,linkNodes,ox,oy,zi,S,isle,wood};
}

// The world is built once and then handed out as a copy (see world.js). ensureZone/ensureMapId stay as the single "make sure everything is registered" hooks.
function ensureZone(z){ensureWorld()}
function ensureMapId(id){
  if(id==='world'||id.startsWith('cave_')||id.startsWith('grotto_'))ensureWorld();
  else ensureWorld();
}
