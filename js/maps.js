'use strict';
const T={GRASS:0,LEAF:1,PATH:2,TREE:3,WATER:4,WALL:5,ROOF:6,DOOR:7,ROCK:8,DFLOOR:9,DWALL:10,VINE:11,LOCK:12,SHROOM:13,FENCE:14,OAK:15,LONE:16,BLOCK:17,FLOWER:18,CROP:19,BARRIER:24,SHALLOW:25,DBLOCK:26};
const SOLID=[0,0,0,1,1,1,1,1,1,0,1,1,1,0,1,0,1,1,0,0,1,1,1,0,1,0,1];

function mk(id,name,w,h,fill){
  return{id,name,w,h,t:new Uint8Array(w*h).fill(fill),warps:[],npcs:[],chests:[],spawns:[],labels:[],props:[],critters:[],chimneys:[],plates:[],gates:[],rooms:[],mist:false,dark:false};
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
    const[a,b]=[pts[k],pts[k+1]],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);
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
function addDeco(m,k,tx,ty,extra){m.props.push(Object.assign({k,tx,ty,w:1,deco:true},extra||{}))}
function scatter(m,r,n,k,ok,avoid,deco){
  let placed=0,guard=0;
  while(placed<n&&guard++<600){
    const x=3+Math.floor(r()*(m.w-6)),y=3+Math.floor(r()*(m.h-6)),t=gt(m,x,y);
    if(t!==T.GRASS&&t!==T.LEAF)continue;
    if(!ok(x,y)||(avoid&&avoid(x,y)))continue;
    if(deco)addDeco(m,k,x,y);else addProp(m,k,x,y);placed++;
  }
}

// ================= Hearthmoor (village) =================
function buildVillage(){
  const m=mk('village','Hearthmoor',40,30,T.GRASS),r=seeded(11);
  for(let i=0;i<m.t.length;i++)if(r()<.09)m.t[i]=T.LEAF;
  // roads
  rectT(m,2,14,38,2,T.PATH);rectT(m,19,5,2,23,T.PATH);rectT(m,16,12,8,6,T.PATH);
  // buildings
  const B=[[3,6,'Smithy',20,'smithy'],[11,7,'Tavern',T.ROOF,'tavern'],[22,6,'Alchemist',21,'alch'],[31,6,"Elder's House",22,null]];
  for(const[x,w,label,rf,bid]of B){
    building(m,x,5,w,5,rf);
    const dx=x+Math.floor(w/2);
    rectT(m,dx,10,2,4,T.PATH);
    m.labels.push({x:(x+w/2)*TS,y:5*TS-8,text:bid?(()=>`${label} Lv ${baseLv(bid)}`):label});
  }
  // storehouse
  building(m,33,16,5,4,20);rectT(m,35,20,1,1,T.PATH);rectT(m,21,20,15,1,T.PATH);
  m.labels.push({x:35.5*TS,y:16*TS-8,text:()=>`Storehouse Lv ${baseLv('store')}`});
  // pond
  disc(m,7,22,3.6,T.WATER);
  // scattered trees in the south and corners
  for(let y=3;y<m.h;y++)for(let x=2;x<m.w-2;x++){
    const t=gt(m,x,y);
    if((t===T.GRASS||t===T.LEAF)&&y>17&&r()<.07&&Math.hypot(x-20,y-17)>6&&Math.abs(x-19.5)>2.5)st(m,x,y,T.LONE);
    else if((t===T.GRASS)&&r()<.012)st(m,x,y,T.SHROOM);
  }
  const c=t=>(t+.5)*TS;
  // border of trees (east exit stays open)
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
    if(x<2||y<2||x>=m.w-2||y>=m.h-2){if(!(x>=m.w-2&&y>=13&&y<=16))st(m,x,y,T.TREE)}
  }
  rectT(m,38,14,2,2,T.PATH);
  m.warps.push({x:39*TS,y:13*TS,w:TS,h:4*TS,to:'glade',tx:3*TS,ty:21*TS});
  m.npcs.push(
    {id:'elder',name:'Elder Maren',x:c(22.5),y:c(17),pal:{h:'#e8e8e8',c:'#6a5a8a',k:'#3a2a5a',g:'#d8b040'}},
    {id:'smith',name:'Torvald the Smith',x:c(8),y:c(11),pal:{h:'#4a2a1a',c:'#7a5a3a',k:'#3a2a1a',g:'#a0a0a0'}},
    {id:'tavern',name:'Dolly',x:c(15.5),y:c(11.5),pal:{h:'#a8541e',c:'#b0603a',k:'#6a3a1e',g:'#f0e0c0'}},
    {id:'stash',name:'Bruna the Keeper',x:c(37),y:c(20.5),pal:{h:'#7a7a8a',c:'#6a5a4a',k:'#3a2e22',g:'#d8c890'}},
    {id:'alch',name:'Pip the Alchemist',x:c(26),y:c(11),pal:{h:'#2a6a4a',c:'#3a8a5a',k:'#1a4a2a',g:'#8fe0a0'}}
  );

  // ---- life: props, garden, flowers, critters ----
  const prop=(k,tx,ty,w)=>{w=w||1;m.props.push({k,tx,ty,w});for(let i=0;i<w;i++)st(m,tx+i,ty,T.BLOCK)};
  // garden with fence
  rectT(m,27,22,6,4,T.CROP);
  for(let x=26;x<=33;x++){st(m,x,21,T.FENCE);st(m,x,26,T.FENCE)}
  for(let y=21;y<=26;y++){st(m,26,y,T.FENCE);st(m,33,y,T.FENCE)}
  st(m,29,21,T.GRASS);st(m,30,21,T.GRASS);
  // plaza
  prop('fire',17,16);prop('well',22,13);prop('bench',16,12);prop('bench',23,12);
  // smithy
  prop('anvil',4,10);prop('crate',3,10);prop('barrel',8,10);
  // tavern
  prop('barrel',11,10);prop('barrel',12,10);prop('crate',16,10);
  // alchemist
  prop('pot',22,10);prop('crate',27,10);prop('pot',28,10);
  // elder's house
  prop('hay',31,12);prop('hay',32,12);prop('barrel',36,10);prop('bush',31,10);prop('bush',37,10);prop('bush',2,10);prop('bush',9,10);
  // market stalls
  prop('stall',11,17,2);prop('crate',13,17);prop('stall',27,17,2);prop('barrel',26,18);
  // lanterns
  for(const[x,y]of[[9,13],[18,11],[21,11],[29,13],[33,13],[9,16],[29,16],[31,16],[18,19],[21,19]])prop('lantern',x,y);
  // flowers on free grass
  for(let n=0;n<70;n++){
    const x=3+Math.floor(r()*34),y=10+Math.floor(r()*17);
    if(gt(m,x,y)===T.GRASS&&Math.hypot(x-20,y-15)>5)st(m,x,y,T.FLOWER);
  }
  prop('sign',36,13);m.props[m.props.length-1].text='East of Hearthmoor lies Ember Glade. Beetles, wolves and worse... Keep your sword sharp!';
  scatter(m,r,26,'cutbush',(x,y)=>y>=10&&Math.hypot(x-20,y-15)>5);
  scatter(m,r,10,'clay',(x,y)=>y>=10&&y<=12&&Math.hypot(x-20,y-15)>5);
  scatter(m,r,4,'logs',(x,y)=>(x<10||x>30)&&y>=10);
  scatter(m,r,5,'herb',(x,y)=>y>=17&&Math.hypot(x-20,y-15)>5,null,true);
  m.chimneys=[{x:7.2*TS,y:5*TS},{x:16*TS,y:5*TS},{x:26*TS,y:5*TS},{x:35*TS,y:5*TS}];
  // wandering villagers
  const lines=[
    ['The beetles are getting bolder every night.','Elder Maren says the Hollow Oak is stirring.'],
    ['I smell cinnamon on the wind. Autumn is here!','Pip makes the best healing potions, you know.'],
    ['Dolly pours the finest cider this side of the Spicewoods.','Mind the wolves in the glade, traveler.']];
  const walker=(name,tx,ty,pal,ls)=>m.npcs.push({id:'walker',walk:true,name,x:c(tx),y:c(ty),pal,lines:ls,hw:4,hh:3,home:{x:c(tx),y:c(ty)},t:rand(0,2),wx:0,wy:0,moving:false,anim:0});
  walker('Villager',14,18,{h:'#6a4a2a',c:'#9a6a3a',k:'#5a3a1e',g:'#f0d890'},lines[0]);
  walker('Villager',29,19,{h:'#c8a050',c:'#4a7a9a',k:'#2a4a6a',g:'#e8f0f8'},lines[1]);
  walker('Villager',12,13,{h:'#2a2a3a',c:'#9a4a6a',k:'#5a2a3a',g:'#f0c0d0'},lines[2]);
  for(let i=0;i<4;i++)m.critters.push({k:'chicken',x:c(15+i*.8),y:c(22+(i%2)),hw:3,hh:2,home:{x:c(16),y:c(22.5)},t:rand(0,2),wx:0,wy:0,moving:false,anim:rand(0,6)});
  m.critters.push({k:'dog',x:c(13),y:c(12),hw:4,hh:2,home:{x:c(13),y:c(12)},t:0,wx:0,wy:0,moving:false,anim:0});
  m.start={x:20*TS,y:17*TS};
  return m;
}

// ================= Ember Glade (compact, hand-placed encounters) =================
function buildGlade(){
  const m=mk('glade','Ember Glade',44,30,T.GRASS),r=seeded(7);
  m.mist=true;
  for(let i=0;i<m.t.length;i++)if(r()<.22)m.t[i]=T.LEAF;
  forest(m,r,.58);
  const ground=()=>r()<.28?T.LEAF:T.GRASS;
  const PATHS=[
    [[0,22],[9,22],[14,21],[20,19],[26,19],[32,18]],
    [[20,19],[19,10]],
    [[32,18],[31,12],[30,8],[30,4]],
    [[32,18],[38,19],[42,19]]
  ];
  for(const p of PATHS)polyline(m,p,(x,y)=>disc(m,x,y,2.6,ground,t=>t===T.TREE||t===T.ROCK));
  const clear=(x,y,rad)=>disc(m,x,y,rad,ground,t=>t===T.TREE);
  clear(9,22,4.2);clear(20,19,4.8);clear(32,18,5.4);clear(30,8,3.8);clear(19,9,2.8);clear(30,4,3.5);clear(40,19,3);
  for(const p of PATHS)polyline(m,p,(x,y)=>disc(m,x,y,1.2,T.PATH));
  disc(m,9,26,2.2,T.WATER);
  // border
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
    if(x<2||y<2||x>=m.w-2||y>=m.h-2){if(!(x<2&&y>=20&&y<=24))st(m,x,y,T.TREE)}
  }
  rectT(m,0,21,3,3,T.PATH);
  // oak entrance
  st(m,29,2,T.OAK);st(m,30,2,T.OAK);
  m.warps.push({x:29*TS,y:2*TS,w:2*TS,h:TS,to:'dungeon',tx:20*TS+8,ty:29*TS});
  // vines at the east edge
  rectT(m,42,17,2,4,T.VINE);
  m.warps.push({x:0,y:20*TS,w:TS,h:5*TS,to:'village',tx:37*TS,ty:14.5*TS});
  m.chests.push({id:'g1',x:19*TS+8,y:9*TS+8});
  // decor
  for(let y=3;y<m.h-3;y++)for(let x=3;x<m.w-3;x++){
    const t=gt(m,x,y);
    if((t===T.GRASS||t===T.LEAF)&&r()<.012)st(m,x,y,T.SHROOM);
  }
  // encounters: fixed groups in each clearing
  const c=t=>t*TS+8;
  const G=(type,x,y,lvl,elite)=>m.spawns.push({type,x:c(x),y:c(y),lvl,elite:!!elite});
  G('beetle',8,21,1);G('beetle',10,23,1);G('beetle',11,21,1);                       // A: warm-up
  G('wolf',19,18,2);G('wolf',22,20,2);G('shroom',20,21,2);                           // B
  G('shroom',18,9,2);G('shroom',20,10,2);                                            // nook guards (chest)
  G('beetle',31,16,3,true);G('wolf',34,18,3);G('shroom',30,20,3);G('shroom',34,15,3);G('wolf',33,20,3); // C: arena
  G('beetle',29,7,4);G('beetle',31,9,4);G('wolf',30,6,4);                            // D: guards the oak
  const near=(x,y)=>m.spawns.some(sp=>Math.hypot(sp.x/TS-x,sp.y/TS-y)<1.6)||Math.hypot(x-3,y-22)<3||Math.hypot(x-30,y-4)<3;
  scatter(m,r,34,'cutbush',(x,y)=>true,near);
  scatter(m,r,10,'clay',(x,y)=>true,near);
  scatter(m,r,9,'ore',(x,y)=>true,near);
  scatter(m,r,8,'logs',(x,y)=>true,near);
  scatter(m,r,14,'herb',(x,y)=>true,near,true);
  addProp(m,'sign',27,6,{text:'The Hollow Oak lies just north. Something ancient sleeps inside... Old Barkfather!'});
  addProp(m,'sign',5,20,{text:'Hearthmoor is back to the west. Rest at the tavern before you go deeper.'});
  m.start={x:3*TS,y:22*TS};
  return m;
}

// ================= Hollow Oak (dungeon with arena rooms, orb switch, small key) =================
function buildDungeon(){
  const m=mk('dungeon','The Hollow Oak',40,34,T.DWALL);
  m.dark=true;m.gates=[];m.rooms=[];
  const room=(x1,y1,x2,y2)=>rectT(m,x1,y1,x2-x1+1,y2-y1+1,T.DFLOOR);
  room(16,27,24,32);   // entrance
  room(19,24,21,26);   // corridor to hall
  room(12,15,28,23);   // hall (arena)
  room(10,18,11,20);   // west corridor
  room(3,14,9,22);     // west room (key chest)
  room(29,18,30,20);   // east corridor
  room(31,14,37,22);   // east room (arena + orb)
  room(19,10,21,14);   // north corridor (small-key door)
  room(11,2,29,9);     // boss room
  for(const[x,y]of[[15,17],[25,17],[15,21],[25,21]])st(m,x,y,T.DWALL);
  const gate=(id,kind,room_,x,y,w,h)=>{const g={id,kind,room:room_,open:kind==='room',tiles:[]};for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)g.tiles.push([i,j]);m.gates.push(g)};
  gate('hallS','room','hall',19,24,3,1);gate('hallW','room','hall',11,18,1,3);gate('hallE','room','hall',29,18,1,3);
  gate('eastW','room','east',30,18,1,3);
  gate('orbW','orb',null,10,18,1,3);
  gate('key','key',null,19,12,3,1);
  m.rooms.push({id:'hall',x1:12,y1:15,x2:28,y2:23,gates:['hallS','hallW','hallE'],name:'The hall'});
  m.rooms.push({id:'east',x1:31,y1:14,x2:37,y2:22,gates:['eastW'],name:'The east chamber'});
  m.warps.push({x:19*TS,y:32*TS,w:3*TS,h:TS,to:'glade',tx:30*TS,ty:4.5*TS});
  m.chests.push({id:'dL',x:4*TS+8,y:15*TS+8},{id:'dR',x:37*TS+8,y:21*TS+8});
  // props
  for(const[x,y]of[[17,28],[23,28],[17,31],[23,31]])addProp(m,'clay',x,y);
  for(const[x,y]of[[12,15],[28,15],[12,23],[28,23],[11,2],[29,2],[11,9],[29,9]])addProp(m,'brazier',x,y);
  addProp(m,'orb',36,15);
  addProp(m,'sign',22,28,{text:'The Hollow Oak. The doors seal while enemies remain. A small key opens the north door, and a glowing orb can be struck with a weapon or arrow...'});
  addProp(m,'clay',4,21);addProp(m,'clay',8,15);
  for(const[x,y]of[[4,19],[8,19],[14,19],[26,19],[36,19],[32,15],[13,4],[27,4],[13,8],[27,8]])addProp(m,'ore',x,y);
  const c=t=>t*TS+8;
  const S=(type,x,y,lvl,elite,rm)=>m.spawns.push({type,x:c(x),y:c(y),lvl,elite:!!elite,room:rm});
  S('beetle',14,17,4,false,'hall');S('beetle',26,17,4,false,'hall');S('beetle',20,19,4,false,'hall');S('shroom',14,22,4,false,'hall');S('shroom',26,22,4,false,'hall');S('wolf',20,22,4,false,'hall');
  S('shroom',33,15,5,false,'east');S('shroom',35,21,5,false,'east');S('shroom',32,19,5,false,'east');S('beetle',34,17,5,false,'east');S('beetle',36,19,5,false,'east');S('wolf',33,21,5,true,'east');
  S('wolf',5,16,5);S('wolf',7,20,5);S('wolf',5,21,5);
  m.spawns.push({type:'boss',x:20*TS+8,y:5*TS,lvl:6});
  m.start={x:20*TS+8,y:29*TS};
  return m;
}

// ================= Amber Hollow (thorn vines gate, then the Spore Warren) =================
function buildAmber(){
  const m=mk('amber','Amber Hollow',56,36,T.GRASS),r=seeded(21);
  m.mist=true;
  for(let i=0;i<m.t.length;i++)if(r()<.26)m.t[i]=T.LEAF;
  forest(m,r,.6);
  const ground=()=>r()<.3?T.LEAF:T.GRASS;
  const PATHS=[
    [[0,18],[8,18],[14,17],[22,14],[34,17],[38,20]],
    [[22,14],[22,26],[26,28]],
    [[38,20],[44,12],[46,6],[46,3]],
    [[38,20],[46,26],[52,28]]
  ];
  for(const p of PATHS)polyline(m,p,(x,y)=>disc(m,x,y,2.6,ground,t=>t===T.TREE||t===T.ROCK));
  const clear=(x,y,rad)=>disc(m,x,y,rad,ground,t=>t===T.TREE);
  clear(9,18,4.2);clear(22,14,4.6);clear(23,27,4.2);clear(38,20,5.4);clear(46,6,3.8);clear(51,28,3.2);
  for(const p of PATHS)polyline(m,p,(x,y)=>disc(m,x,y,1.2,T.PATH));
  disc(m,10,29,2.4,T.WATER);
  // wall of thorn vines splits the map in two
  for(let y=2;y<m.h-2;y++){st(m,31,y,y>=14&&y<=18?T.VINE:T.TREE);st(m,32,y,y>=14&&y<=18?T.VINE:T.TREE)}
  // shallow ford to the marsh (needs the Wooden Boots)
  rectT(m,50,27,6,3,T.SHALLOW);
  for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
    if(x<2||y<2||x>=m.w-2||y>=m.h-2){if(!(x<2&&y>=17&&y<=20)&&!(x>=m.w-2&&y>=27&&y<=29))st(m,x,y,T.TREE)}
  }
  rectT(m,0,18,3,2,T.PATH);
  st(m,45,2,T.OAK);st(m,46,2,T.OAK);
  m.warps.push({x:0,y:17*TS,w:TS,h:4*TS,to:'glade',tx:41*TS,ty:18.5*TS});
  m.warps.push({x:45*TS,y:2*TS,w:2*TS,h:TS,to:'spore',tx:22*TS+8,ty:31*TS});
  m.warps.push({x:54*TS,y:27*TS,w:2*TS,h:3*TS,to:'marsh',tx:4*TS,ty:15*TS});
  m.chests.push({id:'a1',x:23*TS+8,y:27*TS+8},{id:'a2',x:41*TS+8,y:16*TS+8});
  for(let y=3;y<m.h-3;y++)for(let x=3;x<m.w-3;x++){
    const t=gt(m,x,y);
    if((t===T.GRASS||t===T.LEAF)&&r()<.03)st(m,x,y,T.SHROOM);
  }
  const c=t=>t*TS+8;
  const G=(type,x,y,lvl,elite)=>m.spawns.push({type,x:c(x),y:c(y),lvl,elite:!!elite});
  G('bat',8,17,5);G('bat',10,19,5);G('bat',9,16,5);G('shroom',11,18,5);                        // A
  G('brute',22,14,5);G('shroom',20,12,5);G('shroom',24,16,5);G('bat',21,16,5);               // B
  G('shroom',21,27,5);G('shroom',25,27,5);G('bat',23,25,5);G('brute',24,29,6);               // C: chest meadow
  G('brute',37,19,6,true);G('bat',39,21,6);G('bat',36,22,6);G('shroom',40,19,6);G('shroom',38,17,6); // D: arena
  G('brute',45,6,7);G('bat',44,8,7);G('bat',47,7,7);                                          // E: guards the warren
  const near=(x,y)=>m.spawns.some(sp=>Math.hypot(sp.x/TS-x,sp.y/TS-y)<1.6)||Math.hypot(x-2,y-18)<3||Math.hypot(x-46,y-3)<3||(x>=49&&y>=26&&y<=30);
  scatter(m,r,34,'cutbush',(x,y)=>true,near);
  scatter(m,r,10,'clay',(x,y)=>true,near);
  scatter(m,r,9,'ore',(x,y)=>true,near);
  scatter(m,r,7,'logs',(x,y)=>true,near);
  scatter(m,r,14,'herb',(x,y)=>true,near,true);
  scatter(m,r,26,'glowcap',(x,y)=>true,near,true);
  addProp(m,'sign',6,19,{text:'Amber Hollow. The air is thick with spores. Beyond the thorns to the east lies the Spore Warren, far to the north.'});
  addProp(m,'sign',48,5,{text:'The Spore Warren. Mushrooms grow where nothing else can. Crates of stone can be pushed onto pressure plates...'});
  addProp(m,'sign',49,27,{text:'A flooded ford leads east into the Mistwater Marsh. The water is too deep to wade without proper boots.'});
  m.start={x:3*TS,y:18.5*TS};
  return m;
}

// ================= Spore Warren (dungeon 2: block puzzle, plate gate, key door, Mother Mycelia) =================
function buildSpore(){
  const m=mk('spore','The Spore Warren',44,36,T.DWALL);
  m.dark=true;
  const room=(x1,y1,x2,y2)=>rectT(m,x1,y1,x2-x1+1,y2-y1+1,T.DFLOOR);
  room(18,28,26,33);   // entrance
  room(21,25,23,27);   // corridor
  room(14,17,30,24);   // hall (arena)
  room(12,19,13,21);   // west corridor
  room(3,16,11,24);    // west room: block puzzle
  room(31,19,32,21);   // east corridor
  room(33,16,41,24);   // east room (arena + key)
  room(21,11,23,16);   // north corridor: plate gate, key door
  room(12,2,32,10);    // boss room
  for(const[x,y]of[[17,20],[27,20],[7,19],[7,24]])st(m,x,y,T.DWALL);
  const gate=(id,kind,rm,x,y,w,h,extra)=>{const g=Object.assign({id,kind,room:rm,open:kind==='room',tiles:[]},extra||{});for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)g.tiles.push([i,j]);m.gates.push(g)};
  gate('hallS1','room','hall1',21,25,3,1);gate('hallW1','room','hall1',13,19,1,3);gate('hallE1','room','hall1',31,19,1,3);
  gate('eastW2','room','east2',32,19,1,3);
  gate('plateG','plate',null,21,15,3,1,{flag:'plate1'});
  gate('keyG','key',null,21,12,3,1,{flagKey:'keydoor2'});
  m.rooms.push({id:'hall1',x1:14,y1:17,x2:30,y2:24,gates:['hallS1','hallW1','hallE1'],name:'The warren hall'});
  m.rooms.push({id:'east2',x1:33,y1:16,x2:41,y2:24,gates:['eastW2'],name:'The spore chamber'});
  m.plates.push({tx:9,ty:22,gate:'plateG',flag:'plate1'});
  m.props.push({k:'plate',tx:9,ty:22,w:1,deco:true});
  addProp(m,'block',5,19);
  m.warps.push({x:21*TS,y:33*TS,w:3*TS,h:TS,to:'amber',tx:46*TS,ty:4.5*TS});
  m.chests.push({id:'sL',x:40*TS+8,y:17*TS+8},{id:'sR',x:4*TS+8,y:17*TS+8});
  for(const[x,y]of[[14,17],[30,17],[14,24],[30,24],[12,2],[32,2],[12,10],[32,10]])addProp(m,'brazier',x,y);
  for(const[x,y]of[[19,29],[25,29],[19,32],[25,32],[10,24],[40,24]])addProp(m,'clay',x,y);
  for(const[x,y]of[[4,23],[11,17],[35,23],[39,19],[16,22],[28,22],[14,4],[30,4],[14,9],[30,9]])addProp(m,'ore',x,y);
  for(const[x,y]of[[16,19],[28,19],[6,17],[10,20],[34,17],[38,23],[20,5],[24,5],[16,28],[28,28]])addDeco(m,'glowcap',x,y);
  addProp(m,'sign',20,30,{text:'The Spore Warren. Stone blocks can be pushed (walk into them), but never pulled. If a block gets stuck, leave and come back in.'});
  const c=t=>t*TS+8;
  const S=(type,x,y,lvl,elite,rm)=>m.spawns.push({type,x:c(x),y:c(y),lvl,elite:!!elite,room:rm});
  S('bat',16,19,6,false,'hall1');S('bat',28,22,6,false,'hall1');S('bat',20,22,6,false,'hall1');S('shroom',16,23,6,false,'hall1');S('shroom',28,18,6,false,'hall1');S('brute',22,20,6,false,'hall1');
  S('brute',35,18,7,false,'east2');S('brute',38,22,7,false,'east2');S('bat',36,20,7,false,'east2');S('bat',34,23,7,false,'east2');S('shroom',39,17,7,true,'east2');
  m.spawns.push({type:'boss',variant:'mycelia',x:22*TS+8,y:5*TS,lvl:9});
  m.start={x:22*TS+8,y:31*TS};
  return m;
}

// ================= Mistwater Marsh (flooded: the Wooden Boots let you wade) =================
function buildMarsh(){
  const m=mk('marsh','Mistwater Marsh',54,34,T.WATER),r=seeded(33);
  m.mist=true;
  const ground=()=>r()<.35?T.LEAF:T.GRASS;
  const isl=(x,y,rad)=>disc(m,x,y,rad,ground);
  isl(9,15,4);isl(20,9,4.6);isl(21,22,4.6);isl(33,15,5.2);isl(44,8,3.8);isl(44,24,4);
  const FORDS=[[[0,15],[9,15],[14,12],[20,9]],[[9,15],[14,19],[21,22]],[[20,9],[27,12],[33,15]],[[21,22],[28,19],[33,15]],[[33,15],[40,11],[44,8]],[[33,15],[38,20],[44,24]]];
  for(const p of FORDS)polyline(m,p,(x,y)=>disc(m,x,y,1.4,T.SHALLOW,t=>t===T.WATER));
  rectT(m,0,14,4,3,T.SHALLOW);
  // reeds, rocks and a cliff to the east
  for(let y=1;y<m.h-1;y++)for(let x=1;x<m.w-1;x++){
    const t=gt(m,x,y);
    if((t===T.GRASS||t===T.LEAF)&&r()<.05)st(m,x,y,T.ROCK);
    if(x>=50&&t===T.WATER)st(m,x,y,T.ROCK);
  }
  rectT(m,50,0,4,m.h,T.ROCK);
  rectT(m,0,0,m.w,1,T.WATER);
  m.warps.push({x:0,y:14*TS,w:TS,h:3*TS,to:'amber',tx:51*TS,ty:28.5*TS});
  m.chests.push({id:'m1',x:44*TS+8,y:7*TS+8},{id:'m2',x:44*TS+8,y:25*TS+8},{id:'m3',x:20*TS+8,y:8*TS+8});
  const c=t=>t*TS+8;
  const G=(type,x,y,lvl,elite)=>m.spawns.push({type,x:c(x),y:c(y),lvl,elite:!!elite});
  G('bat',19,8,8);G('bat',22,10,8);G('shroom',20,11,8);G('shroom',18,10,8);
  G('brute',21,21,8);G('wolf',23,23,8);G('bat',19,24,8);
  G('brute',32,14,9,true);G('bat',34,16,9);G('bat',31,17,9);G('shroom',35,14,9);G('wolf',33,12,9);
  G('brute',43,23,9);G('shroom',45,25,9);
  G('bat',43,8,9);G('bat',46,9,9);
  const near=(x,y)=>m.spawns.some(sp=>Math.hypot(sp.x/TS-x,sp.y/TS-y)<1.6)||Math.hypot(x-9,y-15)<2;
  scatter(m,r,10,'herb',(x,y)=>true,near,true);
  scatter(m,r,8,'cutbush',(x,y)=>true,near);
  scatter(m,r,6,'ore',(x,y)=>true,near);
  scatter(m,r,6,'logs',(x,y)=>true,near);
  scatter(m,r,12,'glowcap',(x,y)=>true,near,true);
  addProp(m,'sign',7,14,{text:'Mistwater Marsh. Solid ground is rare here. Follow the shallow fords from island to island.'});
  addProp(m,'sign',47,9,{text:'A sheer gorge cuts off the east. Rustpeak rises beyond it, but you will need a hook to cross... (coming in a future update)'});
  m.start={x:4*TS,y:15*TS};
  return m;
}
const MAPS={village:buildVillage,glade:buildGlade,dungeon:buildDungeon,amber:buildAmber,spore:buildSpore,marsh:buildMarsh};
