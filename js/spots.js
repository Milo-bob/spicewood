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
    case'rune':{
      const done=flags.trials&&flags.trials[p.id],cxp=x+8,cyp=y+8,pu=.5+.5*Math.sin(t*3);
      cx.save();
      if(!done){glow(cxp,cyp,34+4*pu,'255,210,100',.42)}
      cx.strokeStyle=done?'#6a6a60':'#ffd070';cx.lineWidth=1.5;
      for(const rr of[10,16]){cx.beginPath();cx.ellipse(cxp,cyp,rr,rr*.62,0,0,TAU);cx.stroke()}
      cx.fillStyle=done?'#6a6a60':'#ffe9a0';
      for(let i=0;i<6;i++){const a=i*TAU/6+(done?0:t*.5);cx.fillRect(Math.round(cxp+Math.cos(a)*13-1),Math.round(cyp+Math.sin(a)*8-1),3,3)}
      if(!done){cx.fillStyle=`rgba(255,230,150,${.5+.4*pu})`;cx.fillRect(cxp-1,cyp-6,3,12);cx.fillRect(cxp-6,cyp-1,12,3)}
      cx.restore();break}
    case'pillar':shadow(x+8,y+15,6);R_('#2a2620',3,-6,10,22);R_('#8a867a',4,-5,8,20);R_('#b8b0a0',4,-5,3,20);R_('#6a665c',9,-5,3,20);R_('#4a463e',2,-7,12,3);R_('#ffd070',6,-2,4,2);break;
    case'hedge':shadow(x+8,y+14,7);R_('#1c3a14',1,3,14,12);R_('#2f5a20',1,2,14,11);R_('#4a8a30',3,3,5,3);R_('#6aae44',9,6,4,3);R_('#d05a7a',5,8,2,2);R_('#e0c050',11,4,2,2);if(p.hint){cx.globalAlpha=.5+.4*Math.sin(t*4);R_('#fff0a0',7,-2,2,2);cx.globalAlpha=1}break;
    case'landmark':drawLandmark(p.lm,x,y,t,R_);break;
  }
}
function drawLandmark(k,x,y,t,R_){
  const B=(c,dx,dy,w,h)=>R_(c,dx,dy,w,h);
  shadow(x+8,y+16,18);
  switch(k){
    case'windmill':{
      B('#000',-5,-34,26,50);B('#d8c8a0',-4,-33,24,48);B('#b89868',12,-33,8,48);B('#8a6a40',-4,-8,24,2);B('#6a4a28',5,4,6,12);
      B('#a83a2a',-6,-42,28,10);B('#c8503a',-6,-42,28,3);
      cx.save();cx.translate(x+8,y-30);cx.rotate(t*.6);cx.fillStyle='#4a3018';
      for(let i=0;i<4;i++){cx.save();cx.rotate(i*Math.PI/2);cx.fillRect(-1,-24,3,24);cx.fillStyle='#e8d8b0';cx.fillRect(2,-24,8,13);cx.fillStyle='#4a3018';cx.restore()}
      cx.fillRect(-2,-2,5,5);cx.restore();break}
    case'obelisk':B('#000',0,-52,16,68);B('#e0c488',1,-51,14,66);B('#b89858',9,-51,6,66);B('#e0c488',3,-56,10,5);B('#ffd870',6,-60,4,5);for(let i=0;i<5;i++)B('#8a6a30',4,-44+i*10,8,1);break;
    case'stones':
      for(const[dx,h]of[[-14,26],[-4,34],[8,28],[20,22]]){B('#000',dx-1,-h,11,h+16);B('#9a9a92',dx,-h+1,9,h+14);B('#bcbcb2',dx,-h+1,3,h+14);B('#6a6a62',dx+6,-h+1,3,h+14)}
      B('#8a8a82',-14,-32,36,4);break;
    case'icearch':
      B('#000',-14,-34,12,50);B('#000',18,-34,12,50);B('#000',-14,-40,44,12);
      B('#bfe4ff',-13,-33,10,48);B('#bfe4ff',19,-33,10,48);B('#d8f0ff',-13,-39,42,10);B('#8ac0e8',-6,-33,3,48);B('#8ac0e8',24,-33,3,48);B('#fff',-8,-37,8,2);
      cx.globalAlpha=.4+.3*Math.sin(t*2);B('#ffffff',2,-22,12,30);cx.globalAlpha=1;break;
    case'crystals':
      for(const[dx,h,c]of[[-8,34,'#c8a0ff'],[2,48,'#a0d8ff'],[12,30,'#ff9ae0']]){B('#000',dx-1,-h,11,h+16);B(c,dx,-h+1,9,h+14);B('#fff',dx+2,-h+3,2,h*.6);B('#00000033',dx+6,-h+1,3,h+14)}
      glow(x+8,y-14,30,'200,170,255',.3);break;
    case'spike':B('#000',-4,-48,24,64);B('#2a2428',-3,-47,22,62);B('#3a343a',-3,-47,8,62);B('#c84a1a',2,-30,2,22);B('#ff8a30',9,-14,2,14);glow(x+8,y-4,24,'255,120,40',.28);break;
    case'chimney':B('#000',-4,-44,24,60);B('#5a3a2a',-3,-43,22,58);B('#7a5a42',-3,-43,8,58);B('#2a1a12',-5,-48,26,6);cx.globalAlpha=.4;for(let i=0;i<3;i++)B('#aaa',3+Math.sin(t+i)*3,-56-i*8-(t*10)%8,8,6);cx.globalAlpha=1;break;
    case'ruintower':B('#000',-6,-40,28,56);B('#8a867a',-5,-39,26,54);B('#a8a498',-5,-39,9,54);B('#5a564c',5,-39,3,54);B('#000',0,-30,8,10);B('#2a2620',1,-29,6,8);B('#000',0,-44,8,6);B('#000',12,-46,8,8);B('#4a8a30',-5,-20,8,3);break;
    case'oakgiant':B('#000',-10,-46,36,62);B('#4a2c14',0,-26,16,42);B('#6a4424',2,-26,6,42);B('#c8641e',-10,-48,36,30);B('#e0902a',-6,-52,28,12);B('#a04a14',2,-36,22,10);B('#2a1a0a',5,-6,6,12);break;
    case'shroomtower':B('#000',-6,-44,28,60);B('#d8c8b0',2,-22,12,38);B('#a84a8a',-8,-44,32,24);B('#d870b8',-6,-46,28,10);B('#fff',0,-40,4,4);B('#fff',12,-34,4,4);B('#fff',20,-42,3,3);break;
    case'statue':B('#000',0,-44,16,60);B('#5a8a9a',1,-43,14,58);B('#7ab0c0',1,-43,5,58);B('#2a5a3a',1,-8,14,10);B('#3a7a4a',3,-30,4,12);B('#2a4a6a',-6,10,28,6);break;
    case'gallows':B('#000',-6,-44,34,60);B('#4a3a2a',-5,-43,4,58);B('#4a3a2a',-5,-43,30,4);B('#6a5a42',20,-43,3,20);B('#8a8a8a',20,-23,3,3);B('#e8e0c8',18,-20,7,10);break;
    case'rootarch':B('#000',-14,-40,44,56);B('#6a4424',-12,-39,10,54);B('#6a4424',18,-39,10,54);B('#6a4424',-10,-42,38,10);B('#d8a030',4,-30,8,12);glow(x+8,y-24,26,'255,210,100',.35);break;
    case'vinetree':B('#000',-10,-46,36,62);B('#3a2a14',0,-26,16,42);B('#2a6a2a',-10,-48,36,28);B('#4aa04a',-6,-52,28,12);for(let i=0;i<5;i++)B('#2a8a3a',-8+i*7,-22,2,14+(i%3)*5);break;
    case'pagoda':B('#000',-8,-48,32,64);B('#d8b878',0,-14,16,30);B('#a83a2a',-8,-22,32,8);B('#c8503a',-6,-34,28,6);B('#a83a2a',-4,-44,24,6);B('#e8c858',6,-52,4,6);break;
  }
}
