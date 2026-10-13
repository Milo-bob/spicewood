'use strict';
// ================= Forgotten Trees =================
// Each region (except Hearthmoor and the Heart) holds one withered tree, a rest of the old forest the Great Turning left behind.
// Use the right tool next to it, beat the blight that rises from its roots, and it sprouts again: one Heart Fruit, and the barren ground
// around it turns green. Replaces the old Pieces of Heart. State: flags.ftrees[zone] = true.
const FTREE={
  glade:{tool:'sickle',dry:'Thorns have strangled this old oak down to the roots.'},
  amber:{tool:'boots',dry:'Its bark is dead and loose. A hard shove could shake the rot out of it.'},
  marsh:{tool:'hook',dry:'A root hangs rotting in the mud. Something has to pull it free.'},
  rust:{tool:'lantern',dry:'Iron dust has buried its roots in the dark. Light would show where they hurt.'},
  grove:{tool:'lantern',dry:'The ghostbark has died, but the roots remember. Light might wake them.'},
  saffron:{tool:'windcharm',dry:'Dust and chaff bury the stump. A strong wind could blow it clean.'},
  ember:{tool:'windcharm',dry:'Ash lies thick on the bark. A gust could sweep it off.'},
  tangle:{tool:'sickle',dry:'The jungle chokes it. Cut the creepers and it may breathe again.'},
  delta:{tool:'hook',dry:'Half of it has sunk into the water. Pull the roots back up.'},
  mesa:{tool:'windcharm',dry:'Fossil wood under the sand. The wind that buried it could lift it out.'},
  steppe:{tool:'windcharm',dry:'A lone dead tree, scoured by the wind. The roots want air.'},
  spire:{tool:'hook',dry:'Slag has set around its trunk. Pull the roots out of the stone.'},
  gulch:{tool:'lantern',dry:'Its sap froze to glass. Light could warm the crystal heart of it.'},
  ridge:{tool:'emberglove',dry:'Ice holds it fast. Only fire will thaw the roots.'}
};
const FT_NEAR={boots:56,sickle:64,hook:80,lantern:70,windcharm:80,emberglove:80};
const ftreeDone=z=>!!(flags&&flags.ftrees&&flags.ftrees[z]);
const ftreeCount=()=>Object.keys(FTREE).filter(ftreeDone).length;
const ftreeProp=z=>M&&M.props&&M.props.find(p=>p.k==='ftree'&&p.zone===z);

// the tile ground around a revived tree turns to grass
function applyForgotten(){
  if(!M||!M.props)return;
  const BARE=new Set([T.SAND,T.SCREE,T.ASH,T.SNOW]);
  for(const p of M.props){
    if(p.k!=='ftree'||!ftreeDone(p.zone))continue;
    for(let y=p.ty-6;y<=p.ty+6;y++)for(let x=p.tx-6;x<=p.tx+6;x++){
      if(x<0||y<0||x>=M.w||y>=M.h||Math.hypot(x-p.tx,y-p.ty)>6)continue;
      const i=y*M.w+x;
      if(BARE.has(M.t[i]))M.t[i]=((x*7+y*13)%5===0)?T.FLOWER:T.GRASS;
    }
  }
}

// called by the tools: a tool used next to a withered tree starts the ritual
function ftreeTool(k){
  if(!M||!M.props)return;
  for(const p of M.props){
    if(p.k!=='ftree'||ftreeDone(p.zone)||p.ritual)continue;
    const c=FTREE[p.zone];if(!c||c.tool!==k)continue;
    if(Math.hypot((p.tx+.5)*TS-P.x,(p.ty+.5)*TS-P.y)>(FT_NEAR[k]||70))continue;
    startRitual(p);return;
  }
}
function startRitual(p){
  const S=ZSPEC[p.zone],cxp=(p.tx+.5)*TS,cyp=(p.ty+.5)*TS,lvl=Math.round((S.lvl[0]+S.lvl[1])/2),n=4+(lvl>14?1:0)+(lvl>26?1:0);
  p.ritual=[];
  for(let i=0;i<n;i++){
    const a=i*TAU/n+.5;let x=cxp+Math.cos(a)*54,y=cyp+Math.sin(a)*54;
    if(!boxFree(x,y,6,6)){x=cxp+Math.cos(a)*30;y=cyp+Math.sin(a)*30}
    const e=makeEnemy(S.foes[i%S.foes.length],x,y,lvl,false);
    e.state='chase';e.aggro=999;E.push(e);p.ritual.push(e);
    puff(x,y,8,'#8a5a8a',60);
  }
  fx({k:'ring',x:cxp,y:cyp,r0:6,r1:70,t:0,dur:.5,c:'#b070c0'});Snd.boom();shake=4;
  toast('The roots writhe! The blight rises!','#d890e0');
}
function reviveTree(p){
  flags.ftrees=flags.ftrees||{};flags.ftrees[p.zone]=true;p.ritual=null;
  flags.fruits=(flags.fruits||0)+1;recalc();P.hp=P.maxHp;
  applyForgotten();applyVillageGrowth();buildLayer();
  const x=(p.tx+.5)*TS,y=(p.ty+.5)*TS;
  fx({k:'ring',x,y,r0:6,r1:90,t:0,dur:.8,c:'#a0ff80'});puff(x,y-10,24,'#a0ff80',90);puff(x,y-10,16,'#ffe9a0',70);
  Snd.level();shake=3;
  toast(`The tree sprouts! A Heart Fruit grows (${ftreeCount()}/${Object.keys(FTREE).length}).`,'#a0ff80');
  save();
}
function ftreeUpdate(dt){
  if(!M||!M.props)return;
  for(const p of M.props){
    if(p.k!=='ftree'||!p.ritual)continue;
    if(P.dead){p.ritual=null;continue}
    if(p.ritual.every(e=>e.dead))reviveTree(p);
  }
}
function ftreeTalk(p){
  const c=FTREE[p.zone],nm=KEYITEMS.find(q=>q.k===c.tool).n;
  if(ftreeDone(p.zone)){say('Forgotten Tree',['Fresh green leaves. The Spicewood remembers this place now.']);return}
  if(p.ritual){say('Forgotten Tree',['The blight is still alive. Put it down!']);return}
  if(!flags[c.tool]){say('Forgotten Tree',[c.dry,'You have nothing that could help yet. Perhaps a tool found elsewhere in the Spicewood.']);return}
  say('Forgotten Tree',[c.dry,`Put the ${nm} on K or L and use it here.`]);
}

// ---------- drawing: a bare, grey trunk; green and lit once it lives again ----------
function drawForgottenTree(p){
  const x=p.tx*TS,y=p.ty*TS,t=time,live=ftreeDone(p.zone),ritual=!!p.ritual;
  const R=(c,a,b,w,h)=>{cx.fillStyle=c;cx.fillRect(x+a,y+b,w,h)};
  const dark=live?'#2a1a0c':'#2a2420',bark=live?'#6a4424':'#5a5048',lit=live?'#8a5c30':'#7a6e62';
  shadow(x+8,y+14,13);
  R(dark,-1,11,6,4);R(dark,11,11,6,4);R(bark,0,12,4,2);R(bark,12,12,4,2);   // roots flaring out
  R(dark,3,-6,10,20);R(bark,4,-6,8,19);R(lit,4,-6,3,19);R(dark,10,-3,1,14);   // trunk
  if(live){
    const b=Math.sin(t*1.4+p.tx)*.6;
    R('#1e3a14',-12,-24+b,40,9);R('#2e5a1c',-10,-27+b,36,10);R('#4a8a2c',-6,-30+b,28,8);R('#6ab040',-2,-31+b,16,4);R('#8ad060',2,-30+b,6,2);
    R('#2e5a1c',-8,-18,8,6);R('#4a8a2c',16,-19,9,6);R('#6ab040',-5,-18,4,2);
    if(Math.random()<.04)puff(x+8+rand(-14,14),y-18+rand(-8,4),1,'#a0ff80',16);
  }else{
    R(dark,-6,-12,8,3);R(dark,-9,-16,5,3);R(dark,14,-10,9,3);R(dark,20,-15,5,3);R(dark,6,-14,3,8);R(dark,0,-20,3,6);R(dark,12,-19,3,9);   // dead branches
    R(bark,-5,-12,6,2);R(bark,15,-10,7,2);R(bark,1,-19,2,5);
    const pu=.5+.5*Math.sin(t*2+p.tx);
    if(ritual){glow(x+8,y,34,'176,90,192',.3+.2*pu)}
    else glow(x+8,y-2,22+3*pu,'150,120,200',.14+.1*pu);   // a faint glow: something is still alive in there
  }
}
