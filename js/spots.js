'use strict';
// ================= Set pieces in the regions: a trial, secret nooks, a landmark =================
// Every region (except the village) gets
//   - a RUNE TRIAL: a clearing with a glowing rune circle. Step on it and three waves rise from the ground. Win, and a chest appears (the region's Piece of Heart).
//   - SECRET NOOKS: a hidden clearing in the forest, its corridor sealed by a hedge that only your sword can cut. A chest waits inside.
//   - a LANDMARK: a tall, unmistakable thing you can see from far away (a windmill, an obelisk, an ice arch...), so the way is never just "walk until something happens".
// They are placed by placeSpots (called from the zone generator, with a random stream of its own so nothing else in the region moves).
const SPOTS={   // landmark and number of secret nooks per region
  glade:{lm:'oakgiant',sec:2},amber:{lm:'shroomtower',sec:2},marsh:{lm:'statue',sec:2},rust:{lm:'ruintower',sec:2},grove:{lm:'gallows',sec:2},heart:{lm:'rootarch',sec:1},
  saffron:{lm:'windmill',sec:2},ember:{lm:'chimney',sec:2},tangle:{lm:'vinetree',sec:3},delta:{lm:'pagoda',sec:2},mesa:{lm:'obelisk',sec:2},steppe:{lm:'stones',sec:2},
  spire:{lm:'spike',sec:2},gulch:{lm:'crystals',sec:2},ridge:{lm:'icearch',sec:2}
};
function placeSpots(c){
  const{m,z,S,nodes,edges,pathOf,owned,ox,oy,rs,lvAt}=c,sp=SPOTS[z],ground=S.mode==='islands'?T.GRASS:S.ground;
  if(!sp)return;
  const camps=()=>nodes.filter(n=>n.kind==='camp'&&!n.gate&&!n.noSpawn&&!n.hasTome&&!n.trial&&!n.lm);
  const far=(n,min)=>nodes.every(o=>o===n||o.kind==='void'||Math.hypot(o.x-n.x,o.y-n.y)>min||!(o.kind==='exit'||o.kind==='main'||o.kind==='dungeon'));
  // ---- the rune trial: the biggest quiet clearing, left empty of ordinary monsters
  {
    const list=camps().filter(n=>far(n,22)).sort((a,b)=>b.r-a.r);
    const n=list[0]||camps().sort((a,b)=>b.r-a.r)[0];
    if(n){
      n.noSpawn=true;n.trial=true;
      const tx=Math.round(n.x),ty=Math.round(n.y);
      m.props.push({k:'rune',tx,ty,w:1,deco:true,id:z,lvl:lvAt(n)});
      for(const[dx,dy]of[[-3,-3],[3,-3],[-3,3],[3,3]])if(!SOLID[gt(m,tx+dx,ty+dy)])addProp(m,'pillar',tx+dx,ty+dy);
      (m.reserve=m.reserve||[]).push([tx-4,ty-4,tx+4,ty+4]);
      m.trial={x:tx,y:ty};
    }
  }
  // ---- a landmark at the edge of another clearing
  {
    const n=camps().filter(q=>q.r>=3.6).sort((a,b)=>b.r-a.r)[Math.floor(rs()*3)]||camps()[0];
    if(n){
      n.lm=true;
      const tx=Math.round(n.x-n.r*.55),ty=Math.round(n.y-n.r*.45);
      if(!SOLID[gt(m,tx,ty)]||gt(m,tx,ty)===T.TREE){addProp(m,'landmark',tx,ty,{lm:sp.lm});(m.reserve=m.reserve||[]).push([tx-3,ty-3,tx+3,ty+1])}
    }
  }
  // ---- secret nooks: a corridor into the forest, closed by a hedge
  let made=0;
  for(let g=0;g<400&&made<sp.sec&&edges.length;g++){
    const e=edges[Math.floor(rs()*edges.length)],p=pathOf(e[0],e[1]),seg=rs()<.5?0:1,t=.2+rs()*.6;
    const ax=p[seg][0]+(p[seg+1][0]-p[seg][0])*t,ay=p[seg][1]+(p[seg+1][1]-p[seg][1])*t;
    const d=[[1,0],[-1,0],[0,1],[0,-1]][Math.floor(rs()*4)],px=-d[1],py=d[0];
    const cx0=Math.round(ax),cy0=Math.round(ay);
    // the way in must be solid forest all along (3..11 tiles), the clearing at the end too
    let ok=true;
    for(let s=3;s<=12&&ok;s++)for(let w=-3;w<=3&&ok;w++){
      const x=cx0+d[0]*s+px*w,y=cy0+d[1]*s+py*w,t2=gt(m,x,y);
      if(t2<0||!owned(x,y)||!SOLIDWOOD.has(t2))ok=false;
    }
    if(!ok)continue;
    const ex=cx0+d[0]*11,ey=cy0+d[1]*11;
    if(nodes.some(o=>Math.hypot(o.x-ex,o.y-ey)<o.r+7)||(m.fields&&m.fields.some(f=>ex>f.x-3&&ex<f.x+f.w+3&&ey>f.y-3&&ey<f.y+f.h+3)))continue;
    if(m.chests.some(q=>Math.hypot(q.x/TS-ox-ex,q.y/TS-oy-ey)<9))continue;
    // carve: corridor 3 wide, clearing radius 2.6
    for(let s=1;s<=11;s++)for(let w=-1;w<=1;w++){const x=cx0+d[0]*s+px*w,y=cy0+d[1]*s+py*w;if(SOLIDWOOD.has(gt(m,x,y)))st(m,x,y,ground)}
    disc(m,ex,ey,2.7,ground,t2=>SOLIDWOOD.has(t2));
    // hedge across the mouth (3 tiles wide, 2 deep)
    for(let s=3;s<=4;s++)for(let w=-1;w<=1;w++)addProp(m,'hedge',cx0+d[0]*s+px*w,cy0+d[1]*s+py*w,{hint:s===3&&w===0});
    m.chests.push({id:`zs_${z}_${made+1}`,x:(ex+ox)*TS+8,y:(ey+oy)*TS+8,tier:lvAt(nodes.find(n=>n.kind==='main')||nodes[0])+1});
    (m.reserve=m.reserve||[]).push([ex-4,ey-4,ex+4,ey+4],[cx0+Math.min(0,d[0]*12)-2,cy0+Math.min(0,d[1]*12)-2,cx0+Math.max(0,d[0]*12)+2,cy0+Math.max(0,d[1]*12)+2]);
    made++;
  }
  // open country (desert, steppe, meadow): a ring of hedge around a quiet patch instead of a corridor in the forest
  for(let g=0;g<1200&&made<sp.sec&&edges.length;g++){
    const e=edges[Math.floor(rs()*edges.length)],p=pathOf(e[0],e[1]),seg=rs()<.5?0:1,t=rs();
    const bx=p[seg][0]+(p[seg+1][0]-p[seg][0])*t,by=p[seg][1]+(p[seg+1][1]-p[seg][1])*t,a=rs()*TAU,dd=9+rs()*7;
    const ex=Math.round(bx+Math.cos(a)*dd),ey=Math.round(by+Math.sin(a)*dd);
    let ok=true;
    for(let y=ey-4;y<=ey+4&&ok;y++)for(let x=ex-4;x<=ex+4&&ok;x++){
      if((x-ex)*(x-ex)+(y-ey)*(y-ey)>17)continue;
      const t2=gt(m,x,y);if(t2<0||!owned(x,y)||SOLID[t2]||t2===T.PATH||t2===T.OAK)ok=false;
    }
    if(!ok)continue;
    if(nodes.some(o=>Math.hypot(o.x-ex,o.y-ey)<o.r+5)||(m.fields&&m.fields.some(f=>ex>f.x-5&&ex<f.x+f.w+5&&ey>f.y-5&&ey<f.y+f.h+5)))continue;
    if(m.chests.some(q=>Math.hypot(q.x/TS-ox-ex,q.y/TS-oy-ey)<8))continue;
    if(m.reserve&&m.reserve.some(q=>ex+4>=q[0]&&ex-4<=q[2]&&ey+4>=q[1]&&ey-4<=q[3]))continue;
    if(m.props.some(q=>Math.abs(q.tx-ex)<5&&Math.abs(q.ty-ey)<5))continue;
    let first=true;
    for(let y=ey-4;y<=ey+4;y++)for(let x=ex-4;x<=ex+4;x++){
      const d2=Math.hypot(x-ex,y-ey);
      if(d2>=2.7&&d2<=3.7){addProp(m,'hedge',x,y,{hint:first&&y<ey-2});first=false}
    }
    m.chests.push({id:`zs_${z}_${made+1}`,x:(ex+ox)*TS+8,y:(ey+oy)*TS+8,tier:lvAt(nodes.find(n=>n.kind==='main')||nodes[0])+1});
    (m.reserve=m.reserve||[]).push([ex-5,ey-5,ex+5,ey+5]);
    made++;
  }
  placePuzzles(c);placePeddler(c);
}


// ---------- puzzle ruins: a block, a plate and a sealed chest room ----------
// A small stone ruin by the path. Push the block (walk into it) across the floor onto the plate: the slab in the inner wall slides away and the chest room opens.
// The block returns to its start when you walk away, so nobody can lock themselves out.
function placePuzzles(c){
  const{m,z,S,nodes,edges,pathOf,owned,ox,oy,rs,lvAt}=c,sp=SPOTS[z];
  const ground=S.mode==='islands'?T.GRASS:S.ground,want=sp.pz===undefined?1:sp.pz;
  let made=0;
  const bad=t=>t<0||t===T.WATER||t===T.SHALLOW||t===T.VINE||t===T.GORGE||t===T.OAK||t===T.PATH||t===T.BRIDGE;
  for(let g=0;g<2500&&made<want&&edges.length;g++){
    const e=edges[Math.floor(rs()*edges.length)],p=pathOf(e[0],e[1]),seg=rs()<.5?0:1,t=.15+rs()*.7;
    const ax=p[seg][0]+(p[seg+1][0]-p[seg][0])*t,ay=p[seg][1]+(p[seg+1][1]-p[seg][1])*t;
    const sdx=p[seg+1][0]-p[seg][0],sdy=p[seg+1][1]-p[seg][1],sgn=rs()<.5?1:-1;
    const d=Math.abs(sdx)>=Math.abs(sdy)?[0,sgn]:[sgn,0],px=-d[1],py=d[0];   // the ruin grows away from the path, sideways
    const cx0=Math.round(ax),cy0=Math.round(ay);
    const T_=(u,v)=>[cx0+d[0]*u+px*v,cy0+d[1]*u+py*v];
    let ok=true;
    for(let u=4;u<=17&&ok;u++)for(let v=-3;v<=3&&ok;v++){const[x,y]=T_(u,v);if(!owned(x,y)||bad(gt(m,x,y)))ok=false}
    if(!ok)continue;
    const mid=T_(10,0);
    if(nodes.some(o=>Math.hypot(o.x-mid[0],o.y-mid[1])<o.r+7))continue;
    if(m.fields&&m.fields.some(f=>mid[0]>f.x-9&&mid[0]<f.x+f.w+9&&mid[1]>f.y-9&&mid[1]<f.y+f.h+9))continue;
    if(m.chests.some(q=>Math.hypot(q.x/TS-ox-mid[0],q.y/TS-oy-mid[1])<12))continue;
    if(m.reserve&&m.reserve.some(q=>mid[0]+9>=q[0]&&mid[0]-9<=q[2]&&mid[1]+9>=q[1]&&mid[1]-9<=q[3]))continue;
    if(m.props.some(q=>Math.hypot(q.tx-mid[0],q.ty-mid[1])<9))continue;
    // the stub from the path to the doorway, then the ruin: walls of boulders, floor of the region's own ground
    for(let u=1;u<=4;u++)for(let v=-1;v<=1;v++){const[x,y]=T_(u,v);if(SOLIDWOOD.has(gt(m,x,y))||u===4)st(m,x,y,ground)}
    for(let u=4;u<=17;u++)for(let v=-3;v<=3;v++){
      const[x,y]=T_(u,v),wall=u===4||u===17||v===-3||v===3||u===13;
      st(m,x,y,wall?T.ROCK:ground);
    }
    for(let v=-1;v<=1;v++){const[x,y]=T_(4,v);st(m,x,y,ground)}   // the doorway (3 wide)
    const[gx,gy]=T_(13,0),id=`op_${z}_${made+1}`,flag=id;
    st(m,gx,gy,ground);
    m.gates.push({id,kind:'plate',room:null,open:false,tiles:[[gx,gy]],flag,floor:ground});
    const two=rs()<.5,[chx,chy]=T_(15,0);   // half of the ruins hold two blocks on two plates; the slab wants both
    for(const v of two?[-1,1]:[0]){
      const[bx,by]=T_(6,v),[plx,ply]=T_(11,v);
      addProp(m,'block',bx,by,{under:ground});
      m.plates.push({tx:plx,ty:ply,gate:id,flag});m.props.push({k:'plate',tx:plx,ty:ply,w:1,deco:true,flag});
    }
    m.chests.push({id:`zp_${z}_${made+1}`,x:(chx+ox)*TS+8,y:(chy+oy)*TS+8,tier:lvAt(nodes.find(n=>n.kind==='main')||nodes[0])+2});
    const sg=T_(2,2);addProp(m,'sign',sg[0],sg[1],{text:two?'An old ruin. A heavy slab seals the inner room, and two stone plates wait on the floor. Both have to be weighed down...':'An old ruin. A heavy slab seals the inner room, and a stone plate waits on the floor. Something has to weigh it down...'});
    {const cs=[T_(4,-3),T_(4,3),T_(17,-3),T_(17,3)],xs=cs.map(q=>q[0]),ys=cs.map(q=>q[1]);(m.reserve=m.reserve||[]).push([Math.min(...xs)-1,Math.min(...ys)-1,Math.max(...xs)+1,Math.max(...ys)+1])}
    made++;
  }
}

// ---------- the traveling peddler: potions and rumors ----------
const PEDDLER={
  glade:'Business is slow. Nobody walks past the oak after dark.',amber:'Mind your step, friend. The spores make my wares sweat.',marsh:'Everything here is damp. My matches, my maps, my mood.',
  rust:'Ore, scrap, rust. Nothing in my pack that does not rattle.',grove:'I sell by day only. At night my customers do not pay.',heart:'You came all this way? Then you deserve a potion.',
  saffron:'Fresh from the road. The wind has not spoiled it yet.',ember:'Hot goods, hot prices. Do not touch the pack.',tangle:'I follow the path. The path does not follow me.',
  delta:'Spices? No spices. The Baron has them. I sell what is left.',mesa:'Water costs more than gold out here. Potions are a bargain.',steppe:'Hold your hat. Hold your purse. Hold on.',
  spire:'I only sell what survives the heat.',gulch:'Everything glitters here. Not everything is for sale.',ridge:'Cold hands, warm goods. What will it be?'
};
function placePeddler(c){
  const{m,z,nodes,lvAt}=c;
  const camps=nodes.filter(n=>n.kind==='camp'&&!n.gate&&!n.noSpawn&&!n.hasTome&&!n.trial&&!n.lm);
  const n=camps.sort((a,b)=>b.r-a.r)[Math.floor(c.rs()*Math.min(3,camps.length))];
  if(!n)return;
  n.noSpawn=true;n.merchant=true;
  const tx=Math.round(n.x),ty=Math.round(n.y),pals=[{h:'#6a4a2a',c:'#a8602a',k:'#4a2a14',g:'#f0d890'},{h:'#2a3a4a',c:'#4a6a8a',k:'#1a2a3a',g:'#e0e8f0'},{h:'#a83a2a',c:'#8a7a3a',k:'#4a3a14',g:'#f0e0b0'}];
  m.npcs.push({id:'merchant',name:'Traveling Peddler',zone:z,x:(tx+.5)*TS,y:(ty+.5)*TS,pal:pals[Math.floor(c.rs()*3)]});
  for(const[dx,dy,k]of[[-2,-1,'crate'],[2,-1,'barrel'],[-2,1,'barrel']]){const x=tx+dx,y=ty+dy;if(!SOLID[gt(m,x,y)]&&!m.props.some(q=>q.tx===x&&q.ty===y))addProp(m,k,x,y)}
  (m.reserve=m.reserve||[]).push([tx-3,ty-3,tx+3,ty+3]);
}
// where is it? compass and distance in steps
function compass(tx,ty){
  const dx=tx*TS+8-P.x,dy=ty*TS+8-P.y,d=Math.round(Math.hypot(dx,dy)/TS),a=Math.atan2(dy,dx),dirs=['east','south-east','south','south-west','west','north-west','north','north-east'];
  return`${dirs[(Math.round(a/(Math.PI/4))+8)%8]}, about ${d} steps`;
}
function rumorTargets(){
  const out=[];if(M.id!=='world'||!flags.rumor)return out;
  for(const p of M.props)if(p.k==='rune'&&flags.rumor['t_'+p.id]&&!(flags.trials&&flags.trials[p.id]))out.push({x:p.tx+.5,y:p.ty+.5});
  for(const c of M.chests)if(flags.rumor['c_'+c.id]&&!flags.chests[c.id])out.push({x:c.x/TS,y:c.y/TS});
  return out;
}
function merchantMenu(n){
  const z=n.zone,name=WORLD[z]?WORLD[z].name:'',price=potionPrice();
  const buy=(g,fn)=>{if(P.gold<g){toast('Not enough gold','#ff8070');return true}P.gold-=g;fn();Snd.coin();return true};
  flags.rumor=flags.rumor||{};
  const rune=M.props.find(p=>p.k==='rune'&&p.id===z);
  const nook=M.chests.find(c=>c.id.startsWith('zs_'+z)&&!flags.chests[c.id]&&!flags.rumor['c_'+c.id]);
  const ruin=M.chests.find(c=>c.id.startsWith('zp_'+z)&&!flags.chests[c.id]&&!flags.rumor['c_'+c.id]);
  const opts=[{t:()=>`Healing potion (${price}g)   you carry ${P.potions}/${potCap()}`,fn(){if(P.potions>=potCap()){toast('You cannot carry more','#ff8070');return true}return buy(price,()=>P.potions++)}}];
  if(rune&&!(flags.trials&&flags.trials[z])&&!flags.rumor['t_'+z])opts.push({t:'Rumor: the glowing rune circle (40g)',fn(){return buy(40,()=>{flags.rumor['t_'+z]=true;say('Peddler',[`A ring of runes, glowing in an old clearing. It lies ${compass(rune.tx,rune.ty)}. It is marked on your map now.`])})}});
  if(nook)opts.push({t:'Rumor: a hidden nook (60g)',fn(){return buy(60,()=>{flags.rumor['c_'+nook.id]=true;say('Peddler',[`Somebody hid something behind a hedge. ${compass(nook.x/TS-.5,nook.y/TS-.5).replace(/^./,s=>s.toUpperCase())}. It is marked on your map now.`])})}});
  if(ruin)opts.push({t:'Rumor: the puzzle ruin (60g)',fn(){return buy(60,()=>{flags.rumor['c_'+ruin.id]=true;say('Peddler',[`A stone ruin with a sealed room. Push the block onto the plate. ${compass(ruin.x/TS-.5,ruin.y/TS-.5).replace(/^./,s=>s.toUpperCase())}. It is marked on your map now.`])})}});
  opts.push({t:'Leave',fn(){}});
  say(n.name,[PEDDLER[z]||'Wares for the road.'],()=>{ui=menu(`Peddler of ${name}`,opts,true,goldLine)});
}

// ---------- the trial (runtime) ----------
const TRIAL={active:null};
function trialFoes(p){const S=ZSPEC[p.id];return S?S.foes:['beetle']}
function trialSpawn(p,wave){
  const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS,foes=trialFoes(p),n=wave===3?5:3+wave;
  for(let i=0;i<n;i++){
    const a=i*TAU/n+rand(0,.5),d=64+rand(0,10),x=px+Math.cos(a)*d,y=py+Math.sin(a)*d;
    const e=makeEnemy(pick(foes),x,y,p.lvl+wave-1,wave===3&&i===0);
    e.state='chase';e.trial=p;e.aggro=400;
    if(boxFree(e.x,e.y,e.hw,e.hh)||true){E.push(e);puff(x,y,8,'#ffd070',50)}
  }
  fx({k:'ring',x:px,y:py,r0:6,r1:90,t:0,dur:.6,c:'#ffd070'});shake=Math.max(shake,4);Snd.boom();
}
function updateTrials(dt){
  if(M.id!=='world')return;
  const T_=TRIAL;
  if(!T_.active){
    for(const p of M.props){
      if(p.k!=='rune')continue;
      if(flags.trials&&flags.trials[p.id])continue;
      const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS;
      if(Math.hypot(px-P.x,py-P.y)<14){
        flags.trials=flags.trials||{};
        T_.active={p,wave:1,t:0};
        toast('The rune circle awakens!','#ffd070');trialSpawn(p,1);break;
      }
    }
    return;
  }
  const A=T_.active,p=A.p;
  if(P.dead||M.id!=='world'){TRIAL.active=null;for(const e of E)if(e.trial)e.dead=true;return}   // failed: the rune sleeps again
  if(Math.hypot((p.tx+.5)*TS-P.x,(p.ty+.5)*TS-P.y)>230){TRIAL.active=null;for(const e of E)if(e.trial){e.dead=true}toast('The rune circle falls silent.','#a89878');return}
  if(E.some(e=>e.trial===p&&!e.dead))return;
  if(A.wave<3){A.wave++;toast(`Wave ${A.wave} of 3`,'#ffd070');trialSpawn(p,A.wave);return}
  // done: the chest rises
  flags.trials[p.id]=2;TRIAL.active=null;
  const cxp=(p.tx+.5)*TS,cyp=(p.ty+.5)*TS;
  CH.push({id:'zt_'+p.id,x:cxp,y:cyp,open:!!flags.chests['zt_'+p.id],tier:p.lvl+1});
  fx({k:'ring',x:cxp,y:cyp,r0:6,r1:100,t:0,dur:.8,c:'#fff0a0'});puff(cxp,cyp,22,'#ffe070',90);Snd.level();
  toast('The trial is won. A chest rises from the rune!','#ffe070');save();
}
function trialChests(){
  if(M.id!=='world'||!flags.trials)return;
  for(const p of M.props)if(p.k==='rune'&&flags.trials[p.id]===2&&!CH.some(c=>c.id==='zt_'+p.id))CH.push({id:'zt_'+p.id,x:(p.tx+.5)*TS,y:(p.ty+.5)*TS,open:!!flags.chests['zt_'+p.id],tier:p.lvl+1});
}

// ---------- drawing ----------
function drawSpotProp(p,x,y,t,R_){
  switch(p.k){
    case'rune':drawRune(p,x,y,t,R_);break;
    case'pillar':drawPillar(p,x,y,t,R_);break;
    case'hedge':shadow(x+8,y+14,7);R_('#1c3a14',1,3,14,12);R_('#2f5a20',1,2,14,11);R_('#4a8a30',3,3,5,3);R_('#6aae44',9,6,4,3);R_('#d05a7a',5,8,2,2);R_('#e0c050',11,4,2,2);if(p.hint){cx.globalAlpha=.5+.4*Math.sin(t*4);R_('#fff0a0',7,-2,2,2);cx.globalAlpha=1}break;
    case'landmark':drawLandmark(p.lm,x,y,t,R_);break;
  }
}
