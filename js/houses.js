'use strict';
// ================= Hearthmoor: enterable houses, the hero's shed, and a village that grows with the forest =================
// Trading happens inside: Pip in the Alchemist, Dolly in the Tavern, Bruna in the Storehouse, Torvald in the Smithy.
// Every house is a small map (house_<id>) entered through its door. door = [x, y, width of the walkable step in front of it], in village tiles.
const HOUSE={
  // each house: size, door (village tile of the door and the width of the step in front of it), keeper, furniture [kind, x, y, width, {options}], a look (see HSTYLE) and its rug
  smith:{name:'Smithy',w:12,h:9,door:[6,9,2],npc:{id:'smith',name:'Torvald the Smith',pal:{h:'#4a2a1a',c:'#7a5a3a',k:'#3a2a1a',g:'#a0a0a0'}},nx:6,ny:3,rug:null,
    props:[['rack',1,2,2],['forge',5,2,2],['shelf',8,2,2,{v:'tools'}],['barrel',10,3],['anvil',3,4],['sack',10,5],['crate',1,6],['crate',2,6],['window',3,1],['window',8,1]]},
  tavern:{name:'Tavern',w:12,h:9,door:[14,9,2],npc:{id:'tavern',name:'Dolly',pal:{h:'#a8541e',c:'#b0603a',k:'#6a3a1e',g:'#f0e0c0'}},nx:6,ny:3,rug:['#7a2a2a','#a84a3a'],
    props:[['barrel',1,2],['barrel',2,2],['shelf',3,2,2,{v:'mugs'}],['counter',5,2,3],['shelf',8,2,1,{v:'mugs'}],['hearth',9,2,2],['table',2,5],['stool',2,6],['table',8,5],['stool',8,6],['stool',9,5],['table',5,6],['window',4,1],['window',7,1]]},
  alch:{name:'Alchemist',w:12,h:9,door:[25,9,2],npc:{id:'alch',name:'Pip the Alchemist',pal:{h:'#2a6a4a',c:'#3a8a5a',k:'#1a4a2a',g:'#8fe0a0'}},nx:5,ny:3,rug:['#2a5a3a','#4a8a5a'],
    props:[['shelf',1,2,2,{v:'bottles'}],['shelf',3,2,2,{v:'bottles'}],['counter',5,2,3],['shelf',8,2,2,{v:'herbs'}],['plant',10,2],['cauldron',9,4],['table',2,5],['plant',1,7],['stool',3,5],['window',4,1],['window',10,1],['hang',1,1],['hang',7,1]]},
  stash:{name:'Storehouse',w:12,h:9,door:[35,19,1],npc:{id:'stash',name:'Bruna the Keeper',pal:{h:'#7a7a8a',c:'#6a5a4a',k:'#3a2e22',g:'#d8c890'}},nx:6,ny:3,rug:null,
    props:[['shelf',1,2,2,{v:'wares'}],['shelf',3,2,2,{v:'wares'}],['counter',5,2,3],['shelf',8,2,2,{v:'wares'}],['sack',10,3],['crate',1,5],['crate',1,6],['crate',2,6],['barrel',9,6],['barrel',10,6],['table',4,6,1,{scale:true}],['hay',10,5],['window',7,1],['window',2,1]]},
  elder:{name:"Maren's House",w:14,h:9,door:[34,9,2],npc:null,rug:['#4a2a6a','#7a5aa0'],
    props:[['shelf',1,2,2,{v:'books'}],['shelf',3,2,2,{v:'books'}],['clock',6,2,1,{use:'clock'}],['hearth',8,2,2],['shelf',11,2,2,{v:'books'}],['desk',10,4,2,{use:'letters'}],['stool',9,4],['bed',1,5,2],['table',4,5],['stool',3,5],['stool',5,5],['plant',1,7],['hatch',11,7,1,{use:'hatch'}],['lantern',12,6],['window',4,1],['window',10,1]]},
  shed:{name:'Your Shed',w:18,h:10,door:[14,21,2],npc:null,rug:['#2a4a6a','#5a7a9a'],
    props:[['bed',2,3,2],['hearth',8,2,2],['shelf',11,2,2,{v:'books'}],['table',14,3],['plant',16,3],['plant',1,8],['lantern',16,8],['window',5,1],['window',14,1]]}
};
// the look of each house: floor, wall, light
const HSTYLE={
  smith:{floor:['#5a564e','#4a463e','#3a362e'],wall:['#6a665e','#524e46','#3a362e'],kind:'slab',light:'255,150,60'},
  tavern:{floor:['#7a5230','#6a4526','#4a2e16'],wall:['#5a3a22','#4a2e1a','#2e1c0e'],kind:'plank',light:'255,200,110'},
  alch:{floor:['#42604e','#385244','#283c30'],wall:['#c8d4b4','#aab898','#6a4a2a'],kind:'tile',light:'150,255,170'},
  stash:{floor:['#6a5030','#5a4226','#3e2c16'],wall:['#6e5a40','#5a4830','#3a2c1a'],kind:'rough',light:'255,210,130'},
  elder:{floor:['#7a5a3a','#6a4a2c','#4a3220'],wall:['#5a4a6a','#4a3a58','#2e2438'],kind:'plank',light:'255,200,140'},
  shed:{floor:['#9a7a4a','#8a6c40','#6a5030'],wall:['#8a6a42','#745630','#4a3820'],kind:'plank',light:'255,220,140'}
};

// ---- village side: warps in front of the doors, and the shed itself (called from buildVillage)
function placeHouseDoors(m){
  // the hero's shed: a small wooden hut south of the market
  building(m,12,18,4,4,T.ROOF);
  rectT(m,13,22,3,1,T.PATH);
  m.labels.push({x:14*TS,y:18*TS-8,text:'Your Shed'});
  for(const id in HOUSE){
    const h=HOUSE[id],[dx,dy,w]=h.door;
    m.warps.push({x:dx*TS,y:(dy+1)*TS,w:w*TS,h:TS,to:'house_'+id,tx:null,ty:null});
  }
}

// ---- inside
function buildHouse(id){
  const h=HOUSE[id],W=h.w,H=h.h,m=mk('house_'+id,h.name,W,H,T.WALL);m.zone='village';
  rectT(m,1,2,W-2,H-3,T.DFLOOR);rectT(m,W/2-1,H-1,2,1,T.DFLOOR);
  const [dx,dy,w]=h.door;
  const exit={x:(WVS.x+dx+.5)*TS,y:(WVS.y+dy+2.5)*TS};   // right in front of the door, always kept free (see clearArrival)
  m.warps.push({x:(W/2-1)*TS,y:(H-1)*TS,w:2*TS,h:TS,to:'world',tx:exit.x,ty:exit.y});
  // furniture: every prop blocks its tile(s); interactive ones carry a `use`
  m.house=id;
  for(const[k,tx,ty,pw,ex]of h.props){
    const wd=pw||1,dec=k==='window'||k==='hang';
    m.props.push(Object.assign({k,tx,ty,w:wd,deco:dec},ex||{}));
    if(!dec)for(let i=0;i<wd;i++)st(m,tx+i,ty,T.DBLOCK);
  }
  // a rug in the middle of the room
  if(h.rug)for(let x=W/2-2;x<W/2+2;x++)m.props.push({k:'rug',tx:x,ty:Math.floor(H/2)+1,w:1,deco:true,c:h.rug[0],c2:h.rug[1]});
  if(h.npc)m.npcs.push(Object.assign({x:(h.nx+.5)*TS,y:(h.ny+.5)*TS},h.npc));
  m.labels.push({x:W/2*TS,y:1*TS+2,text:h.name});
  if(id==='shed')shedDecor(m);
  m.start={x:W/2*TS,y:(H-2)*TS+4};
  return m;
}
const BOSSCOL=['#7bd34a','#c98aff','#4ec8e8','#e0a040','#9ad0c0','#ffd24a','#d8a030','#ff7a30','#a8d8ff','#ff4a30','#e0a0ff','#d8f4ff','#f0d080','#58b040','#ff8a30','#c0c0d0'];
function shedDecor(m){
  const done=BOSSLIST.filter(([f])=>flags[f]);
  // trophies of the guardians on the wall, a sapling for every tree that lives again
  BOSSLIST.forEach(([f,n],i)=>{
    const own=!!flags[f];
    m.props.push({k:'trophy',tx:1+i,ty:1,w:1,deco:true,use:'trophy',own,col:BOSSCOL[i%BOSSCOL.length],name:n});
  });
  const zs=Object.keys(FTREE);
  zs.forEach((z,i)=>m.props.push({k:'sapling',tx:1+i,ty:0,w:1,deco:true,use:'trophy',own:ftreeDone(z)}));
  const bed=m.props.find(p=>p.k==='bed');if(bed)bed.use='bed';
}
// props that can be used with E
const HOUSE_USE={
  bed(){say('Your bed',['A straw mattress and a warm blanket. Rest here?'],()=>{ui=menu('Your Shed',[
    {t:'Sleep and save game (free)',fn(){P.hp=P.maxHp;P.res=0;save();toast('Fully rested. Game saved.');Snd.level();return true}},
    {t:'Leave',fn(){}}],true,goldLine)})},
  trophy(){
    const g=BOSSLIST.filter(([f])=>flags[f]).length,t=ftreeCount(),nH=8+(flags.fruits||0);
    say('Your shed',[`Guardians defeated: ${g}/${BOSSLIST.length}. Forgotten trees alive: ${t}/${Object.keys(FTREE).length}. Hearts: ${nH}.`,
      g?'Every trophy on the wall is a guardian you set free.':'The wall is empty. Not for long, hero.'])}
};

// ---- extra props drawn here (called from drawProp)
function drawExtraProp(p){
  const x=p.tx*TS,y=p.ty*TS,t=time;
  const R=(c,a,b,w,h)=>{cx.fillStyle=c;cx.fillRect(x+a,y+b,w,h)};
  switch(p.k){
    case'rug':R(p.c||'#7a2a2a',0,2,16,12);R(p.c2||'#a84a3a',1,3,14,10);R('#d8b060',0,2,16,1);R('#d8b060',0,13,16,1);if(p.tx%2)R('#d8b060',6,7,4,2);return true;
    case'table':shadow(x+8,y+14,8);R('#3a2410',1,6,14,8);R('#8a5a2a',1,5,14,6);R('#a8743a',1,5,14,1);R('#4a2c14',2,11,2,4);R('#4a2c14',12,11,2,4);
      if((p.tx*7+p.ty)%3===0){R('#e8d8b0',5,2,4,4);R('#c03030',9,3,2,2)}return true;
    case'plant':shadow(x+8,y+14,5);R('#6a3a1e',5,10,6,5);R('#8a5a2a',5,10,6,1);R('#3a8a3a',3,4,4,7);R('#4aaa4a',8,2,4,9);R('#2a6a2a',6,6,3,5);return true;
    case'bed':{const w=(p.w||2)*TS;shadow(x+w/2,y+14,w/2);R('#4a2c14',0,4,w,12);R('#e8e0d0',2,3,12,8);R('#c8c0b0',2,3,12,2);R('#8a3a3a',2,8,w-4,8);R('#a84a4a',2,8,w-4,2);R('#4a2c14',0,2,3,3);return true}
    case'trophy':{
      const c=p.col||'#ffd040',own=p.own;
      R('#2a1808',3,3,10,10);R(own?'#4a3220':'#241810',4,4,8,8);
      if(own){R(c,6,6,4,4);R('#ffffff',6,6,2,1);R(c,5,10,6,1)}else R('#3a2c1c',6,7,4,2);
      return true}
    case'sapling':{
      R('#241810',5,10,6,4);R(p.own?'#6a4424':'#3a2c1c',5,9,6,1);
      if(p.own){R('#3a8a3a',7,4,2,6);R('#6ab040',4,4,4,3);R('#8ad060',8,3,4,3)}else R('#5a4a38',7,6,2,3);
      return true}
    case'counter':{const w=(p.w||3)*TS;shadow(x+w/2,y+15,w/2);R('#2a1808',0,5,w,11);R('#7a4c26',0,6,w,9);R('#a8743a',0,4,w,3);R('#c89458',0,4,w,1);for(let i=1;i<p.w;i++)R('#5a3a1c',i*TS,7,1,8);
      if(p.tx===5||p.v==='tray')R('#e8d8b0',w/2-3,0,6,4);return true}
    case'stool':shadow(x+8,y+14,4);R('#3a2410',5,10,6,5);R('#8a5a2a',4,7,8,4);R('#a8743a',4,7,8,1);return true;
    case'sack':shadow(x+8,y+14,6);R('#4a3820',2,5,12,10);R('#c8b078',3,4,10,10);R('#e0cc90',4,4,6,2);R('#8a7448',6,3,4,2);R('#a89058',3,9,10,1);return true;
    case'shelf':{
      const w=(p.w||2)*TS,v=p.v||'wares';R('#2a1808',0,0,w,16);R('#5a3a1c',1,1,w-2,14);R('#7a5230',1,7,w-2,2);R('#7a5230',1,14,w-2,2);
      for(let i=0;i<p.w;i++){const o=i*TS;
        if(v==='bottles'){R('#4aa86a',o+2,2,3,5);R('#c84a6a',o+7,3,3,4);R('#4a8ad8',o+11,2,3,5);R('#e0c040',o+3,9,3,5);R('#a86ad8',o+8,10,3,4);R('#e8f0e0',o+12,9,2,5)}
        else if(v==='mugs'){R('#c8c0a0',o+2,3,4,4);R('#c8c0a0',o+8,3,4,4);R('#8a6a3a',o+3,10,10,4);R('#e0b050',o+4,8,2,2)}
        else if(v==='herbs'){R('#3a8a3a',o+2,2,4,5);R('#6ab04a',o+8,3,5,4);R('#a86ab0',o+3,10,3,4);R('#e0c040',o+9,10,4,4)}
        else if(v==='tools'){R('#9a9a9a',o+2,2,2,6);R('#9a9a9a',o+6,3,5,2);R('#6a4a2a',o+7,5,1,3);R('#9a9a9a',o+12,2,2,5);R('#c0c0c8',o+3,10,9,2)}
        else if(v==='books'){R('#8a2a2a',o+2,2,3,5);R('#2a5a8a',o+5,3,3,4);R('#3a7a3a',o+9,2,3,5);R('#c8a040',o+3,9,10,4)}
        else{R('#a8743a',o+2,2,5,5);R('#d8c890',o+9,3,4,4);R('#6a8a4a',o+3,9,4,5);R('#c84a3a',o+10,10,3,4)}
      }return true}
    case'forge':{const w=(p.w||2)*TS,f=.5+.5*Math.sin(t*9+p.tx);R('#2a2620',0,0,w,16);R('#5a564e',1,1,w-2,14);R('#1a1410',4,5,w-8,10);
      glow(x+w/2,y+9,34+4*f,'255,140,50',.35+.12*f);R('#ff8a30',6,8,w-12,6);R('#ffd060',9,9,w-18,4);R('#fff0a0',w/2-2,10,4,2);return true}
    case'rack':{const w=(p.w||2)*TS;R('#2a1808',0,2,w,13);R('#5a3a1c',1,3,w-2,11);
      R('#c8c8d0',3,1,2,12);R('#c8a040',1,4,6,1);R('#6a3a1c',3,12,2,3);R('#c8c8d0',10,2,2,10);R('#c8a040',8,5,6,1);R('#6a3a1c',10,12,2,3);
      R('#8a5a2a',w-9,5,7,8);R('#a8743a',w-8,6,5,6);R('#c8c8d0',w-7,8,3,2);return true}
    case'hearth':{const w=(p.w||2)*TS,f=.5+.5*Math.sin(t*8+p.tx);R('#2a2620',0,0,w,16);R('#6a665e',1,1,w-2,14);R('#3a362e',3,3,w-6,12);R('#1a1410',4,5,w-8,10);
      glow(x+w/2,y+10,44+5*f,'255,170,70',.4+.12*f);R('#e05a20',5,10,w-10,4);R('#ffb040',7,9,w-14,4);R('#fff0a0',w/2-2,10,4,2);R('#4a2c14',4,14,w-8,2);return true}
    case'cauldron':{const b=Math.sin(t*5+p.tx);shadow(x+8,y+14,8);R('#1a1410',2,6,12,9);R('#3a3a42',3,5,10,9);R('#5a5a64',3,5,10,2);R('#2a8a4a',4,5,8,2);
      glow(x+8,y+3,24,'120,255,150',.3);R('#8affb0',5+b,2,2,2);R('#8affb0',9-b,0,2,2);R('#4a2c14',2,14,3,2);R('#4a2c14',11,14,3,2);if(Math.random()<.05)puff(x+8+rand(-4,4),y,1,'#8affb0',20);return true}
    case'window':{const w=TS;R('#2a1808',2,4,12,11);R('#6a4a2a',3,5,10,9);const st=HSTYLE[M.house]||{light:'255,220,150'};cx.fillStyle='rgb('+st.light+')';cx.globalAlpha=.8;cx.fillRect(x+4,y+6,3,3);cx.fillRect(x+9,y+6,3,3);cx.fillRect(x+4,y+10,3,3);cx.fillRect(x+9,y+10,3,3);cx.globalAlpha=1;
      glow(x+8,y+22,26,st.light,.13);return true}
    case'hang':{R('#4a2c14',3,0,10,2);for(let i=0;i<4;i++){R('#3a8a3a',4+i*3,2,2,6+(i%2)*3);R('#6ab04a',4+i*3,2,1,5)}R('#a86ab0',5,9,2,2);R('#e0c040',11,8,2,2);return true}
    case'banner':{const b=Math.sin(t*2+p.tx)*1;R('#3a2410',7,-6,2,22);R(p.col||'#c03030',9,-5,6+b,8);R('#ffe9a0',10,-3,4+b,2);return true}
    case'flowerbed':{shadow(x+8,y+13,7);R('#5a3a1e',1,9,14,5);R('#3a2412',1,9,14,1);const cs=['#ff6a8a','#ffd040','#ffffff','#b080ff'];for(let i=0;i<5;i++){const f=cs[(p.tx+i)%4];R('#2e7a2e',2+i*3,6,1,4);R(f,1+i*3,4+(i%2),3,3)}return true}
  }
  return false;
}

// ---- the village grows with the forest: tier 1 at 1 revived tree, then 4, 8 and 12
const villageTier=()=>{const n=ftreeCount();return n>=12?4:n>=8?3:n>=4?2:n>=1?1:0};
function applyVillageGrowth(){
  if(!M||M.id!=='world'||!WVS)return;
  const tier=villageTier();
  M.props=M.props.filter(p=>!p.vg);M.npcs=M.npcs.filter(n=>!n.vg);
  if(!tier)return;
  const vs=WVS;
  const ok=(x,y)=>{const t=gt(M,vs.x+x,vs.y+y);return t===T.GRASS||t===T.LEAF||t===T.FLOWER};
  const free=(x,y)=>!M.props.some(p=>p.tx===vs.x+x&&p.ty===vs.y+y);
  const put=(k,x,y,extra)=>{if(ok(x,y)&&free(x,y))M.props.push(Object.assign({k,tx:vs.x+x,ty:vs.y+y,w:1,deco:true,vg:true},extra||{}))};
  const beds=[[4,13],[7,13],[12,13],[27,13],[30,13],[37,13],[4,16],[8,16],[13,16],[30,16],[34,16],[36,21]];
  const bedN=[0,5,8,12,12][tier];
  beds.slice(0,bedN).forEach(([x,y])=>put('flowerbed',x,y));
  if(tier>=2){
    const cols=['#c03030','#e0a030','#3a8a4a','#4a6ab0'];
    [[5,12],[13,12],[18,12],[22,12],[30,12],[37,12]].forEach(([x,y],i)=>put('banner',x,y,{col:cols[i%4]}));
  }
  if(tier>=4){
    [[19,13],[21,13],[19,16],[21,16],[24,18],[16,18]].forEach(([x,y])=>put('lantern',x,y));
    [[10,12],[26,16],[33,12],[9,17],[24,13],[35,17]].forEach(([x,y],i)=>put('banner',x,y,{col:cols4(i)}));
  }
  // grass turns green again; more villagers move in
  if(tier>=3)for(let y=0;y<30;y++)for(let x=0;x<40;x++){const i=(vs.y+y)*M.w+vs.x+x;if(M.t[i]===T.LEAF&&(x*3+y)%2===0)M.t[i]=T.GRASS}
  const walkers=[
    ['Peddler',17,14,{h:'#5a3a1a',c:'#3a6a9a',k:'#2a4a6a',g:'#e8d8b0'},['I walked a long road to see the green again.','Word is the trees are waking.']],
    ['Child',22,17,{h:'#c8a050',c:'#e0a030',k:'#8a5a1a',g:'#f8e8c0'},['Look! A flower grew by our door!','Will you tell me about the guardians?']],
    ['Traveller',28,15,{h:'#2a2a3a',c:'#5a8a5a',k:'#2a4a2a',g:'#f0e0c0'},['The roads are safer since the forest remembers itself.','I might settle here.']],
    ['Old Farmer',29,24,{h:'#d8d8d8',c:'#8a6a3a',k:'#4a3a1a',g:'#e8d8a0'},['My crops are coming back. After all these years.','The soil smells of rain again.']]
  ];
  walkers.slice(0,[0,1,2,3,4][tier]).forEach(([name,x,y,pal,lines])=>{
    const px=(vs.x+x+.5)*TS,py=(vs.y+y+.5)*TS;
    M.npcs.push({id:'walker',walk:true,vg:true,name,x:px,y:py,pal,lines,hw:4,hh:3,home:{x:px,y:py},t:rand(0,2),wx:0,wy:0,moving:false,anim:0});
  });
  NP=M.npcs;
}
const cols4=i=>['#c03030','#e0a030','#3a8a4a','#4a6ab0'][i%4];
for(const id in HOUSE)MAPS['house_'+id]=()=>buildHouse(id);

// ---- floor and walls of a house, drawn once into an image (each house has its own look)
const HSKIN={};
function drawHouseSkin(){
  const id=M.house,st=HSTYLE[id];if(!st)return;
  let c=HSKIN[id+M.w];
  if(!c){
    c=document.createElement('canvas');c.width=M.w*TS;c.height=M.h*TS;const g=c.getContext('2d');
    const hs=(x,y,n)=>{let h=(x*73856093^y*19349663^n*83492791)>>>0;return(h%1000)/1000};
    const R=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
    for(let ty=0;ty<M.h;ty++)for(let tx=0;tx<M.w;tx++){
      const t=M.t[ty*M.w+tx],x=tx*TS,y=ty*TS;
      if(t===T.DFLOOR||t===T.DBLOCK){
        const[a,b,l]=st.floor,v=hs(tx,ty,1);
        if(st.kind==='slab'){R((tx+ty)%2?a:b,x,y,16,16);R(l,x,y+15,16,1);R(l,x+15,y,1,16);if(v<.3)R('#2a2620',x+4+(v*20|0)%6,y+5,5,2);R('#6a665e',x+1,y+1,5,1)}
        else if(st.kind==='plank'){R(a,x,y,16,16);R(b,x,y+(ty%2?0:8),16,8);R(l,x,y+7,16,1);R(l,x,y+15,16,1);const o=(hs(tx,ty,2)*12|0);R(l,x+o,y+(ty%2?3:11),1,5);if(v<.2)R(b,x+3,y+4,3,2)}
        else if(st.kind==='tile'){R((tx+ty)%2?a:b,x,y,16,16);R(l,x,y,16,1);R(l,x,y,1,16);if(v<.25)R('#5a8a5a',x+5,y+6,3,2);if(v>.9)R('#e0c040',x+9,y+9,2,2)}
        else{R(a,x,y,16,16);for(let k=0;k<4;k++)R(k%2?b:a,x+k*4,y,3,16);R(l,x,y+15,16,1);if(v<.35)R('#c8b060',x+(v*30|0)%12,y+(hs(tx,ty,3)*14|0),3,1)}
      }else if(t===T.WALL){
        const[a,b,l]=st.wall,v=hs(tx,ty,4);
        if(st.kind==='slab'){R(a,x,y,16,16);for(let k=0;k<4;k++){const o=(k%2)*8;R(b,x,y+k*4+3,16,1);R(b,x+o+7,y+k*4,1,4)}R('#2a2620',x,y,16,2);if(v<.3)R(b,x+4,y+6,6,3)}
        else if(st.kind==='tile'){R(a,x,y,16,16);R(l,x,y,16,2);R(b,x+7,y+2,2,14);if(ty>1)R(l,x,y+14,16,2);if(v<.25)R('#98b088',x+3,y+6,4,3)}
        else{R(a,x,y,16,16);for(let k=0;k<4;k++)R(b,x,y+k*4+3,16,1);R(l,x,y,16,1);if(v<.4)R(b,x+(v*30|0)%12,y+(hs(tx,ty,5)*12|0),3,2)}
        const below=M.t[(ty+1)*M.w+tx];if(below===T.DFLOOR||below===T.DBLOCK){R('rgba(0,0,0,.35)',x,y+13,16,3);R(l,x,y+12,16,1)}
      }
    }
    HSKIN[id+M.w]=c;
  }
  cx.drawImage(c,0,0);
}

// ---- the spot where the hero arrives (leaving a house, a dungeon, a cave) is always free: furniture, pots and bushes around it make way
const KEEPPROPS=new Set(['waypoint','tome','sign','board','stairs','orb','plate','block','ftree','worldtree','bed','trophy','sapling','well','fire','anvil','forge','hearth','counter','shelf','cauldron','clock','desk','hatch','spice']);
function clearArrival(x,y){
  if(!M||!M.props)return;
  const tx=x/TS,ty=y/TS;let any=false;
  for(const p of M.props){
    if(p.deco||KEEPPROPS.has(p.k))continue;
    const w=p.w||1;let near=false;
    for(let i=0;i<w;i++)if(Math.hypot(p.tx+i+.5-tx,p.ty+.5-ty)<2.3)near=true;
    if(!near)continue;
    p.dead=true;any=true;
    for(let i=0;i<w;i++){
      const idx=p.ty*M.w+p.tx+i,t=M.t[idx];
      if(t===T.BLOCK||t===T.DBLOCK){
        let g=M.dark?T.DFLOOR:T.GRASS;
        for(const[ox,oy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=gt(M,p.tx+i+ox,p.ty+oy);if(n>=0&&!SOLID[n]&&n!==T.PATH&&n!==T.WATER&&n!==T.BLOCK&&n!==T.DBLOCK){g=n;break}}
        M.t[idx]=g;
      }
    }
  }
  if(any)M.props=M.props.filter(p=>!p.dead);
}

// ---- the shops look from the outside like they do inside: roofs, walls, windows, door and a sign for each trade
const FACADE={
  smith:{x:3,y:5,w:6,h:5,door:6,roof:['#4a4e58','#383c46','#2a2e36'],wall:'slab',sign:'anvil',chimney:true},
  tavern:{x:11,y:5,w:7,h:5,door:14,roof:['#9a3a2c','#7a2a20','#5a1e16'],wall:'tudor',sign:'mug'},
  alch:{x:22,y:5,w:6,h:5,door:25,roof:['#3a7a4a','#2a5a36','#1e4228'],wall:'plaster',sign:'bottle'},
  stash:{x:33,y:16,w:5,h:4,door:35,roof:['#8a6a3a','#6a4e28','#4a361c'],wall:'rough',sign:'sack'},
  elder:{x:31,y:5,w:6,h:5,door:34,roof:['#8a6a3a','#6a4e28','#4a361c'],wall:'rough',sign:'sack'},   // looks like the Storehouse
  shed:{x:12,y:18,w:4,h:4,door:14,roof:['#7a5230','#5a3a20','#3e2812'],wall:'pine',sign:null}
};
const HFAC={};
function facadeImage(id){
  if(HFAC[id])return HFAC[id];
  const f=FACADE[id],c=document.createElement('canvas'),W2=f.w*TS,H2=f.h*TS+8;c.width=W2;c.height=H2;
  const g=c.getContext('2d'),R=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y+8,w,h)};   // 8px of headroom for chimneys
  const hs=(x,y)=>((x*73856093^y*19349663)>>>0)%1000/1000;
  // roof: two rows of shingles with a dark eave
  const[ra,rb,rc]=f.roof;
  R(ra,0,0,W2,2*TS);
  for(let y=0;y<2*TS;y+=4)for(let x=(y/4%2)*4;x<W2;x+=8){R(rb,x,y+3,8,1);R(rb,x+7,y,1,3)}
  R(rc,0,2*TS-3,W2,3);R(ra,0,0,W2,1);
  // walls
  const wy=2*TS,wh=(f.h-2)*TS;
  const wc={slab:['#6a665e','#524e46','#3a362e'],tudor:['#d8c8a0','#c0ac80','#4a2e16'],plaster:['#c8d4b4','#aab898','#6a4a2a'],rough:['#6e5a40','#5a4830','#3a2c1a'],pine:['#9a7a4a','#8a6c40','#6a5030']}[f.wall];
  R(wc[0],0,wy,W2,wh);
  if(f.wall==='slab'){for(let y=0;y<wh;y+=4){for(let x=(y/4%2)*8;x<W2;x+=16)R(wc[1],x,wy+y,1,4);R(wc[1],0,wy+y+3,W2,1)}}
  else if(f.wall==='tudor'){for(let x=0;x<W2;x+=TS*2){R(wc[2],x,wy,2,wh)}R(wc[2],0,wy,W2,2);R(wc[2],0,wy+wh-3,W2,3);for(let x=TS*2;x<W2;x+=TS*2){R(wc[2],x-TS+1,wy+2,1,wh-5);}}
  else if(f.wall==='plaster'){for(let x=0;x<W2;x+=TS*3)R(wc[2],x,wy,2,wh);R(wc[2],0,wy,W2,2);R(wc[2],0,wy+wh-2,W2,2);for(let i=0;i<10;i++)R(wc[1],Math.floor(hs(i,3)*W2),wy+4+Math.floor(hs(i,5)*(wh-8)),3,2)}
  else{for(let y=3;y<wh;y+=4)R(wc[1],0,wy+y,W2,1);for(let i=0;i<14;i++)R(wc[1],Math.floor(hs(i,7)*W2),wy+Math.floor(hs(i,9)*wh),3,2)}
  R('rgba(0,0,0,.28)',0,wy,W2,3);R('rgba(0,0,0,.25)',0,wy+wh-2,W2,2);
  // door
  const dx=(f.door-f.x)*TS;
  R('#2a1808',dx-1,wy+wh-TS-1,TS+2,TS+1);R('#6a4424',dx+1,wy+wh-TS+1,TS-2,TS-1);R('#4a2e16',dx+7,wy+wh-TS+1,1,TS-1);R('#d8b040',dx+11,wy+wh-6,2,2);R('#8a8478',dx-2,wy+wh-1,TS+4,1);
  // windows with a warm light
  const wins=f.w>=6?[1,f.w-2]:f.w>=5?[0,f.w-1]:[0];
  for(const i of wins){const wx=i*TS+2;if(Math.abs(i*TS-dx)<TS)continue;
    R('#2a1808',wx,wy+6,12,11);R('#ffc860',wx+1,wy+7,10,9);R('#ffe8a0',wx+1,wy+7,10,3);R('#2a1808',wx+5,wy+7,1,9);R('#2a1808',wx+1,wy+11,10,1);
    if(f.wall==='plaster'){R('#5a3a1e',wx-1,wy+17,14,4);R('#3a8a3a',wx,wy+15,3,3);R('#e060a0',wx+4,wy+14,3,3);R('#e0c040',wx+8,wy+15,3,3)}
    if(f.wall==='tudor'){R('#e8d8b0',wx+1,wy+9,3,2)}
  }
  // the sign of the trade, hanging beside the door
  const sx=dx+TS+4;
  if(f.sign){R('#3a2410',sx-1,wy+3,2,12);R('#3a2410',sx-1,wy+3,10,2);R('#2a1808',sx+1,wy+5,10,10);R('#6a4424',sx+2,wy+6,8,8);
    if(f.sign==='anvil'){R('#c0c0c8',sx+3,wy+8,6,2);R('#a0a0a8',sx+4,wy+10,4,2);R('#c0c0c8',sx+3,wy+7,2,1)}
    else if(f.sign==='mug'){R('#e0b050',sx+4,wy+8,4,5);R('#fff0c0',sx+4,wy+7,4,1);R('#e0b050',sx+8,wy+9,2,3)}
    else if(f.sign==='bottle'){R('#4aa86a',sx+5,wy+7,2,2);R('#4aa86a',sx+4,wy+9,4,4);R('#e8f0e0',sx+5,wy+9,1,2)}
    else{R('#c8b078',sx+3,wy+8,6,5);R('#e0cc90',sx+4,wy+7,4,2)}}
  // trade goods at the foot of the wall
  if(id==='smith'){R('#4a4e58',2,wy+wh-8,10,8);R('#6a6e78',3,wy+wh-9,8,3)}
  if(id==='alch'){R('#5a3a1e',(f.w-2)*TS,wy+wh-5,14,5);R('#3a8a3a',(f.w-2)*TS+1,wy+wh-8,4,4);R('#6ab04a',(f.w-2)*TS+7,wy+wh-9,5,5)}
  if(id==='stash'||id==='elder'){R('#4a3820',2,wy+wh-7,9,7);R('#c8b078',3,wy+wh-8,7,7)}
  if(id==='tavern'){R('#4a2e16',(f.w-2)*TS,wy+wh-9,10,9);R('#7a5230',(f.w-2)*TS+1,wy+wh-8,8,7);R('#2a1808',(f.w-2)*TS+1,wy+wh-5,8,1)}
  if(f.chimney){R('#3a362e',W2-14,-6+0,8,14);R('#2a2620',W2-15,-7,10,3)}
  return HFAC[id]=c;
}
function drawFacades(){
  if(M.id!=='world'||!WVS)return;
  for(const id in FACADE){
    const f=FACADE[id],x=(WVS.x+f.x)*TS,y=(WVS.y+f.y)*TS-8;
    if(x>cam.x+W+8||x+f.w*TS<cam.x-8||y>cam.y+H+8||y+f.h*TS+8<cam.y-8)continue;
    cx.drawImage(facadeImage(id),x,y);
  }
}
