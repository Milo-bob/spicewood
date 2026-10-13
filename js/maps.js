'use strict';
const T={GRASS:0,LEAF:1,PATH:2,TREE:3,WATER:4,WALL:5,ROOF:6,DOOR:7,ROCK:8,DFLOOR:9,DWALL:10,VINE:11,LOCK:12,SHROOM:13,FENCE:14,OAK:15,LONE:16,BLOCK:17,FLOWER:18,CROP:19,BARRIER:24,SHALLOW:25,DBLOCK:26,GORGE:27,BRIDGE:28,SCREE:29,CRAG:30,MOSS:31,GTREE:32,SNOW:33,SAND:34,PINE:35,CACTUS:36,CRYSTAL:37,JTREE:38,ASH:39,OBSID:40};
const SOLID=[0,0,0,1,1,1,1,1,1,0,1,1,1,0,1,0,1,1,0,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,0,1,1,1,1,0,1];

function mk(id,name,w,h,fill){
  return{id,name,w,h,t:new Uint8Array(w*h).fill(fill),warps:[],npcs:[],chests:[],spawns:[],labels:[],props:[],critters:[],chimneys:[],plates:[],gates:[],rooms:[],seals:[],fields:[],mist:false,dark:false};
}
const gt=(m,x,y)=>(x<0||y<0||x>=m.w||y>=m.h)?-1:m.t[y*m.w+x];
const st=(m,x,y,v)=>{if(x>=0&&y>=0&&x<m.w&&y<m.h)m.t[y*m.w+x]=v};
function rectT(m,x,y,w,h,v){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)st(m,i,j,typeof v==='function'?v(i,j):v)}
function disc(m,cx,cy,r,v,only){
  for(let j=Math.floor(cy-r);j<=Math.ceil(cy+r);j++)for(let i=Math.floor(cx-r);i<=Math.ceil(cx+r);i++){
    if((i-cx)*(i-cx)+(j-cy)*(j-cy)<=r*r&&(!only||only(gt(m,i,j))))st(m,i,j,typeof v==='function'?v(i,j):v);
  }
}
function polyline(m,pts,fn){
  for(let k=0;k<pts.length-1;k++){
    const[a,b]=[pts[k],pts[k+1]],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*1.1);
    for(let s=0;s<=n;s++){const t=s/n;fn(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)}
  }
}
function forest(m,r,dens){
  let a=new Uint8Array(m.w*m.h);
  for(let i=0;i<a.length;i++)a[i]=r()<dens?1:0;
  for(let pass=0;pass<3;pass++){
    const b=a.slice();
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      let n=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;
        const xx=x+dx,yy=y+dy;
        n+=(xx<0||yy<0||xx>=m.w||yy>=m.h)?1:a[yy*m.w+xx];
      }
      b[y*m.w+x]=n>=5?1:n<=3?0:a[y*m.w+x];
    }
    a=b;
  }
  for(let i=0;i<a.length;i++)if(a[i])m.t[i]=T.TREE;
}
function building(m,x,y,w,h,roof){
  rectT(m,x,y,w,2,roof||T.ROOF);
  rectT(m,x,y+2,w,h-2,T.WALL);
  st(m,x+Math.floor(w/2),y+h-1,T.DOOR);
}


function addProp(m,k,tx,ty,extra){m.props.push(Object.assign({k,tx,ty,w:1},extra||{}));st(m,tx,ty,m.dark?T.DBLOCK:T.BLOCK)}
// waypoint plinth (fast travel). Positions per zone; the 3x3 ground around it is cleared.
const WPS={};   // zone id -> waypoint tile in the world map (filled in when the world is built)
function waypoint(m,ground,pos){
  const w=pos||WPS[m.id];if(!w)return;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)st(m,w[0]+i,w[1]+j,ground===undefined?T.GRASS:ground);
  addProp(m,'waypoint',w[0],w[1],{zone:m.id});
  (m.reserve=m.reserve||[]).push([w[0]-2,w[1]-2,w[0]+2,w[1]+2]);
}
// a boulder seal: solid until flag is set (opened from the other side of a shortcut)
function seal(m,flag,tiles,text){m.seals.push({flag,tiles,text});for(const[x,y]of tiles)st(m,x,y,T.ROCK)}
// hidden pocket: carve an L-shaped corridor from (fx,fy) to a clearing at (px,py), gate it, and put a cave mouth at the far end.
// gate: 'boots' (shallow water), 'hook' (gorge) or 'sickle' (vines); the lantern/heartseed caves use plain warps with a `need`.
function pocketGeo(o){const dy=o.py>o.fy?1:-1;return{dy,my:o.py+dy*2,rx:(o.px+1)*TS,ry:(o.py+dy)*TS+8}}
function pocket(m,r,o,cave){
  const g=()=>r()<.3?T.LEAF:T.GRASS,{fx,fy,px,py,gate}=o,G=pocketGeo(o),dy=G.dy,dx=px>fx?1:-1;
  for(let x=fx;x!==px+dx;x+=dx)for(let y=fy-1;y<=fy+1;y++)st(m,x,y,g());
  for(let y=fy;y!==py+dy;y+=dy)for(let x=px-1;x<=px+1;x++)st(m,x,y,g());
  const gy=py-dy*3;
  for(let y=gy-2;y<=gy+2;y++)if(Math.abs(y-fy)>1&&Math.abs(y-py)>2)for(const x of[px-3,px-2,px+2,px+3])st(m,x,y,T.TREE);
  disc(m,px,py,2.8,g);
  const band=gate==='boots'?T.SHALLOW:gate==='hook'?T.GORGE:T.VINE;
  for(let x=px-1;x<=px+1;x++){st(m,x,gy,band);st(m,x,gy-dy,band)}
  st(m,px,G.my,T.OAK);st(m,px+1,G.my,T.OAK);
  m.warps.push({x:px*TS,y:G.my*TS,w:2*TS,h:TS,to:cave,tx:11.5*TS,ty:13*TS});
  (m.reserve=m.reserve||[]).push([Math.min(fx,px)-3,Math.min(fy,py)-3,Math.max(fx,px)+3,Math.max(fy,py)+3]);
}

// ---- cave entrances: find a spot on the zone map, embed a cave mouth, register it in CAVES (maps built lazily in dungeons.js)
const CAVES={};
const CAVENAMES={glade:['Hollow Burrow','Thornroot Den','Dewfall Cave'],amber:['Mossy Cleft','Sporefall Cave','Amber Seam'],marsh:['Reedhole','Frog Hollow'],rust:['Slag Pit','Bone Quarry','Scrapyard Cave'],grove:['Whisper Barrow','Pale Hollow','Lantern Barrow'],heart:['Heartroot Cave','Rootwarren'],saffron:['Strawcutter Den','Golden Burrow','Windfall Cave'],ember:['Ashfall Vent','Cinder Hollow','Slagheap Cave','Ember Burrow'],tangle:['Thornroot Cave','Vinecoil Den','Gnarled Hollow','Mossjaw Cave','Strangler Pit'],delta:['Reed Burrow','Amber Cave','Peppercorn Hole'],mesa:['Dust Cave','Scorpion Den','Dune Hollow','Sunstone Cave'],steppe:['Windbreak Cave','Hawk Roost','Barrow Hill','Gale Hollow'],spire:['Slag Vent','Obsidian Cave','Cinder Pit','Magma Seam'],gulch:['Geode Cave','Shard Hollow','Prism Den'],ridge:['Icefall Cave','Frostbite Den','Snowdrift Hollow','Rime Cave','Glacier Seam']};
function caves(m,r,count,reach){
  const names=CAVENAMES[m.id]||[];
  const ok=t=>WALKG.has(t);
  const solid=t=>SOLIDWOOD.has(t);
  const own=m.own||(()=>true),ox=m.ox||0,oy=m.oy||0;   // zone maps inside the world: only inside the region, exits in world coordinates
  const spots=[];
  for(let n=1;n<=count;n++){
    let found=null;
    for(let pass=0;pass<2&&!found;pass++)for(let k=0;k<2400&&!found;k++){
      const x=4+Math.floor(r()*(m.w-9)),y=4+Math.floor(r()*(m.h-10));
      if(!(own(x-3,y-2)&&own(x+4,y-2)&&own(x-3,y+6)&&own(x+4,y+6)&&own(x,y)&&own(x+1,y+4)))continue;
      if(pass===0&&!(solid(gt(m,x,y))&&solid(gt(m,x+1,y))))continue;
      let good=true;
      for(let j=1;j<=3&&good;j++)for(let i=-1;i<=2;i++)if(!ok(gt(m,x+i,y+j))){good=false;break}
      if(!good)continue;
      if(reach&&!(reach[(y+2)*m.w+x]&&reach[(y+2)*m.w+x+1]&&reach[(y+1)*m.w+x]))continue;
      const cxp=(x+1)*TS,cyp=(y+2)*TS;
      if(m.spawns.some(sp=>Math.hypot(sp.x-cxp,sp.y-cyp)<64))continue;
      if(m.warps.some(w=>Math.hypot(w.x+w.w/2-cxp,w.y+w.h/2-cyp)<110))continue;
      if(m.props.some(p=>Math.abs(p.tx-x)<4&&Math.abs(p.ty-y)<5))continue;
      if(m.chests.some(c=>Math.hypot(c.x-cxp,c.y-cyp)<48))continue;
      if(spots.some(s=>Math.hypot(s[0]-x,s[1]-y)<12))continue;
      found=[x,y];
    }
    if(!found)continue;
    const[x,y]=found;spots.push(found);
    const id='cave_'+m.id+'_'+n,name=names[n-1]||('Cave '+n);
    st(m,x,y,T.OAK);st(m,x+1,y,T.OAK);
    m.warps.push({x:x*TS,y:y*TS,w:2*TS,h:TS,to:id,tx:null,ty:null});
    (m.reserve=m.reserve||[]).push([x-2,y-1,x+3,y+4]);
    CAVES[id]={id,n,zone:m.id,name,exit:{to:m.ox===undefined?m.id:'world',tx:(x+1+ox)*TS,ty:(y+2+oy)*TS}};
  }
}
function addDeco(m,k,tx,ty,extra){m.props.push(Object.assign({k,tx,ty,w:1,deco:true},extra||{}))}
// would a solid object on (x,y) cut the walkable ground around it in two? (local check on the 4 neighbours and their corners)
function safeBlock(m,x,y){
  const wk=(i,j)=>{const t=gt(m,i,j);return t>=0&&!SOLID[t]};
  const n=[wk(x,y-1),wk(x+1,y),wk(x,y+1),wk(x-1,y)],c=[wk(x+1,y-1),wk(x+1,y+1),wk(x-1,y+1),wk(x-1,y-1)];
  let cnt=0,pairs=0;
  for(let i=0;i<4;i++){if(n[i])cnt++;if(n[i]&&n[(i+1)%4]&&c[i])pairs++}
  if(!cnt)return true;
  const groups=(cnt===4&&pairs===4)?1:cnt-pairs;
  return groups<=1;
}
const WALKG=new Set([0,1,29,31,33,34,39]);
const SOLIDWOOD=new Set([3,30,32,35,36,37,38,40,8]);
function scatter(m,r,n,k,ok,avoid,deco){
  let placed=0,guard=0;
  const lim=m.own?4000:600;
  while(placed<n&&guard++<lim){
    const x=3+Math.floor(r()*(m.w-6)),y=3+Math.floor(r()*(m.h-6)),t=gt(m,x,y);
    if(!WALKG.has(t))continue;
    if(!ok(x,y)||(avoid&&avoid(x,y)))continue;
    if(m.reserve&&m.reserve.some(q=>x>=q[0]&&y>=q[1]&&x<=q[2]&&y<=q[3]))continue;
    if(!deco&&!safeBlock(m,x,y))continue;
    if(deco)addDeco(m,k,x,y);else addProp(m,k,x,y);placed++;
  }
}

// ================= Hearthmoor (village) =================
function buildVillage(open){
  // open: the village is stamped into the world map (no tree border, no road exits to other maps; the world generator connects the roads)
  const m=mk('village','Hearthmoor',40,30,T.GRASS),r=seeded(11);
  for(let i=0;i<m.t.length;i++)if(r()<.09)m.t[i]=T.LEAF;
  // roads
  rectT(m,2,14,38,2,T.PATH);rectT(m,19,5,2,23,T.PATH);rectT(m,16,12,8,6,T.PATH);
  if(open){rectT(m,0,14,40,2,T.PATH);rectT(m,19,0,2,30,T.PATH)}
  // buildings
  const B=[[3,6,'Smithy',20,'smithy'],[11,7,'Tavern',T.ROOF,'tavern'],[22,6,'Alchemist',21,'alch'],[31,6,"Elder's House",22,null]];
  for(const[x,w,label,rf,bid]of B){
    building(m,x,5,w,5,rf);
    const dx=x+Math.floor(w/2);
    rectT(m,dx,10,2,4,T.PATH);
    m.labels.push({x:(x+w/2)*TS,y:5*TS-8,text:label});
  }
  // storehouse
  building(m,33,16,5,4,20);rectT(m,35,20,1,1,T.PATH);rectT(m,21,20,15,1,T.PATH);
  m.labels.push({x:35.5*TS,y:16*TS-8,text:'Storehouse'});
  // pond
  disc(m,7,22,3.6,T.WATER);
  // scattered trees in the south and corners
  for(let y=3;y<m.h;y++)for(let x=2;x<m.w-2;x++){
    const t=gt(m,x,y);
    if((t===T.GRASS||t===T.LEAF)&&y>17&&r()<.07&&Math.hypot(x-20,y-17)>6&&Math.abs(x-19.5)>2.5)st(m,x,y,T.LONE);
    else if((t===T.GRASS)&&r()<.012)st(m,x,y,T.SHROOM);
  }
  const c=t=>(t+.5)*TS;
  if(!open){
    // border of trees (east exit stays open)
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      if(x<2||y<2||x>=m.w-2||y>=m.h-2){if(!(x>=m.w-2&&y>=13&&y<=16)&&!(x<2&&y>=14&&y<=15)&&!(y>=m.h-2&&x>=19&&x<=20)&&!(y<2&&x>=19&&x<=20))st(m,x,y,T.TREE)}
    }
    rectT(m,38,14,2,2,T.PATH);
    m.warps.push({x:39*TS,y:13*TS,w:TS,h:4*TS,to:'glade',tx:arrTo('glade','W').x,ty:arrTo('glade','W').y});
    // west road: boulder, opened from Ghostbark Grove's side (shortcut)
    rectT(m,0,14,2,2,T.PATH);
    seal(m,'scGrove',[[1,14],[1,15]],'A huge boulder blocks the western road. It looks like it could be moved from the other side...');
    m.warps.push({x:0,y:14*TS,w:TS,h:2*TS,to:'grove',tx:arrTo('grove','E').x,ty:arrTo('grove','E').y});
    // south road: boulder, opened from Mistwater Marsh's side (shortcut)
    rectT(m,19,28,2,2,T.PATH);
    seal(m,'scMarsh',[[19,28],[20,28]],'A huge boulder blocks the southern road. It looks like it could be moved from the other side...');
    m.warps.push({x:19*TS,y:29*TS,w:2*TS,h:TS,to:'marsh',tx:arrTo('marsh','N').x,ty:arrTo('marsh','N').y});
    // north road: boulder, opened from Cinderfall Heights' side (shortcut)
    rectT(m,19,0,2,5,T.PATH);
    seal(m,'scNorth',[[19,1],[20,1]],'A huge boulder blocks the northern road. It looks like it could be moved from the other side...');
    m.warps.push({x:19*TS,y:0,w:2*TS,h:TS,to:'ember',tx:arrTo('ember','S').x,ty:arrTo('ember','S').y});
  }
  // between the smithy and the tavern: thorn vines hide the Root Cellar (needs the Thornsickle)
  rectT(m,9,2,2,3,T.PATH);rectT(m,8,2,1,3,T.TREE);rectT(m,11,2,1,3,T.TREE);rectT(m,9,4,2,1,T.VINE);
  st(m,9,2,T.OAK);st(m,10,2,T.OAK);
  // seal the back: in the open world there is no tree border, so close the north side too (no walking in without the sickle)
  rectT(m,8,0,4,2,T.TREE);
  if(!open)GRET.village={tx:10*TS,ty:3.6*TS};
  m.warps.push({x:9*TS,y:2*TS,w:2*TS,h:TS,to:'grotto_village',tx:11.5*TS,ty:13*TS});
  m.npcs.push(
    {id:'elder',name:'Elder Maren',x:c(22.5),y:c(17),pal:{h:'#e8e8e8',c:'#6a5a8a',k:'#3a2a5a',g:'#d8b040'}},
    {id:'fair',name:'Tilly',x:c(31),y:c(20),pal:{h:'#c04a2a',c:'#e0a030',k:'#6a3a1a',g:'#f8e0c0'}}
    // Torvald, Dolly, Pip and Bruna work inside their houses now (see houses.js)
  );
  if(typeof placeHouseDoors==='function')placeHouseDoors(m);

  // ---- life: props, garden, flowers, critters ----
  const prop=(k,tx,ty,w)=>{w=w||1;m.props.push({k,tx,ty,w});for(let i=0;i<w;i++)st(m,tx+i,ty,T.BLOCK)};
  // garden with fence
  rectT(m,27,22,6,4,T.CROP);
  for(let x=26;x<=33;x++){st(m,x,21,T.FENCE);st(m,x,26,T.FENCE)}
  for(let y=21;y<=26;y++){st(m,26,y,T.FENCE);st(m,33,y,T.FENCE)}
  st(m,29,21,T.GRASS);st(m,30,21,T.GRASS);
  // plaza
  waypoint(m,T.PATH,[24,16]);
  prop('fire',17,16);prop('well',22,13);prop('board',24,19);prop('bench',16,12);prop('bench',23,12);
  // smithy
  prop('anvil',4,10);prop('crate',3,10);prop('barrel',8,10);
  // tavern
  prop('barrel',11,10);prop('barrel',12,10);prop('crate',16,10);
  // alchemist
  prop('crate',27,10);prop('pot',28,10);
  // elder's house
  prop('hay',31,12);prop('hay',32,12);prop('barrel',36,10);prop('bush',31,10);prop('bush',37,10);prop('bush',2,10);prop('bush',9,10);
  // market stalls
  prop('fairbooth',30,19,2);prop('stall',11,17,2);prop('stall',27,17,2);prop('barrel',26,18);
  // lanterns
  for(const[x,y]of[[9,13],[18,11],[21,11],[29,13],[33,13],[9,16],[29,16],[31,16],[18,19],[21,19]])prop('lantern',x,y);
  // flowers on free grass
  for(let n=0;n<70;n++){
    const x=3+Math.floor(r()*34),y=10+Math.floor(r()*17);
    if(gt(m,x,y)===T.GRASS&&Math.hypot(x-20,y-15)>5)st(m,x,y,T.FLOWER);
  }
  prop('sign',36,13);m.props[m.props.length-1].text='East of Hearthmoor lies Ember Glade. Beetles, wolves and worse... Keep your sword sharp!';
  scatter(m,r,26,'cutbush',(x,y)=>y>=10&&Math.hypot(x-20,y-15)>5,null,true);   // walk-through grass (cut it with the sword)
  scatter(m,r,3,'clay',(x,y)=>y>=10&&y<=12&&Math.hypot(x-20,y-15)>5);
  scatter(m,r,4,'logs',(x,y)=>(x<10||x>30)&&y>=10,null,true);
  scatter(m,r,5,'herb',(x,y)=>y>=17&&Math.hypot(x-20,y-15)>5,null,true);
  m.chimneys=[{x:7.2*TS,y:5*TS},{x:16*TS,y:5*TS},{x:26*TS,y:5*TS},{x:35*TS,y:5*TS}];
  // wandering villagers
  const lines=[
    ['The beetles are getting bolder every night.','Elder Maren says the Hollow Oak is stirring.'],
    ['I smell cinnamon on the wind. Autumn is here!','Pip makes the best healing potions, you know.'],
    ['Dolly pours the finest cider this side of the Spicewoods.','Mind the wolves in the glade, traveler.']];
  const walker=(name,tx,ty,pal,ls)=>m.npcs.push({id:'walker',walk:true,name,x:c(tx),y:c(ty),pal,lines:ls,hw:4,hh:3,home:{x:c(tx),y:c(ty)},t:rand(0,2),wx:0,wy:0,moving:false,anim:0});
  walker('Villager',17,20,{h:'#6a4a2a',c:'#9a6a3a',k:'#5a3a1e',g:'#f0d890'},lines[0]);
  walker('Villager',29,19,{h:'#c8a050',c:'#4a7a9a',k:'#2a4a6a',g:'#e8f0f8'},lines[1]);
  walker('Villager',12,13,{h:'#2a2a3a',c:'#9a4a6a',k:'#5a2a3a',g:'#f0c0d0'},lines[2]);
  for(let i=0;i<4;i++)m.critters.push({k:'chicken',x:c(15+i*.8),y:c(22+(i%2)),hw:3,hh:2,home:{x:c(16),y:c(22.5)},t:rand(0,2),wx:0,wy:0,moving:false,anim:rand(0,6)});
  m.critters.push({k:'dog',x:c(13),y:c(12),hw:4,hh:2,home:{x:c(13),y:c(12)},t:0,wx:0,wy:0,moving:false,anim:0});
  // nothing but the market props may stand on or against the hero's shed
  m.props=m.props.filter(p=>!(p.tx>=11&&p.tx<=16&&p.ty>=17&&p.ty<=23&&p.k!=='stall'&&p.k!=='crate'));
  m.start={x:20*TS,y:17*TS};
  return m;
}

// ================= Ember Glade (compact, hand-placed encounters) =================

// ================= Hollow Oak (dungeon with arena rooms, orb switch, small key) =================

// ================= Amber Hollow (thorn vines gate, then the Spore Warren) =================

// ================= Spore Warren (dungeon 2: block puzzle, plate gate, key door, Mother Mycelia) =================

// ================= Mistwater Marsh (flooded: the Wooden Boots let you wade) =================
// ================= shared layout for the later dungeons (entrance, hall, west/east rooms, north corridor, boss room) =================

// ================= The Sunken Shrine (dungeon 3, Mistwater Marsh: orb switch, small key, The Drowned Matron) =================

// ================= Rustpeak (rocky highlands: wolves, brutes, the Rustpeak Mine) =================

// ================= The Rustpeak Mine (dungeon 4: two blocks on two plates, small key, The Rust Warden) =================
// ================= Ghostbark Grove (night forest: skeletons, ghosts, graves, the Ghostbark Crypt) =================

// ================= The Ghostbark Crypt (dungeon 5: block and plate, orb, small key, The Hollow King) =================
// ================= Heart of Spicewood (finale: the ancient tree and its guardians) =================
// ================= Hidden grottos: small treasure caves in early zones, opened with gate items found later =================
const GROT={
  village:{name:'Root Cellar',lvl:3,foes:['beetle','shroom'],hint:'Old roots hold this cellar together. Someone hid a treasure here long ago.'},
  glade:{name:'Dewdrop Grotto',lvl:7,foes:['wolf','shroom'],hint:'Water drips from the ceiling. The Wooden Boots carried you through the pond to reach this place.'},
  amber:{name:'Hookshot Hollow',lvl:11,foes:['bat','brute'],hint:'A cave above a deep gorge. Only a Grapple Hook could have brought you here.'},
  marsh:{name:'Sunless Burrow',lvl:15,foes:['bat','skeleton'],hint:'A burrow so dark that even the bats lost their way. Your lantern shows the path.'},
  rust:{name:'Root-Bound Vault',lvl:19,foes:['brute','ghost'],hint:'The roots parted for the Heartseed. A vault of the old miners lies beyond.'}
};
function buildGrotto(zone){
  const d=GROT[zone],ret=GRET[zone]||(ensureZone(zone),GRET[zone])||{tx:0,ty:0},m=mk('grotto_'+zone,d.name,24,16,T.DWALL);m.zone=zone;
  m.dark=true;
  rectT(m,4,3,16,8,T.DFLOOR);rectT(m,11,11,2,4,T.DFLOOR);
  for(const[x,y]of[[4,3],[19,3],[4,10],[19,10]])addProp(m,'brazier',x,y);
  for(const[x,y]of[[7,5],[16,5],[7,9],[16,9]])addProp(m,'clay',x,y);
  addProp(m,'sign',10,10,{text:d.hint});
  m.chests.push({id:'gr_'+zone,x:12*TS,y:4*TS+8});
  m.warps.push({x:11*TS,y:14*TS,w:2*TS,h:TS,to:'world',tx:ret.tx,ty:ret.ty});
  const c=t=>t*TS+8,F=d.foes;
  m.spawns.push({type:F[0],x:c(8),y:c(7),lvl:d.lvl,elite:false},{type:F[0],x:c(15),y:c(7),lvl:d.lvl,elite:false},{type:F[1],x:c(11),y:c(8),lvl:d.lvl,elite:true});
  m.start={x:11.5*TS,y:13*TS};
  return m;
}
const MAPS={
  grotto_village:()=>buildGrotto('village'),grotto_glade:()=>buildGrotto('glade'),grotto_amber:()=>buildGrotto('amber'),grotto_marsh:()=>buildGrotto('marsh'),grotto_rust:()=>buildGrotto('rust')};
