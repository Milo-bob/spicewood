'use strict';
// ======================= Spicewood: vertical slice =======================
const cv=document.getElementById('c'),cx=cv.getContext('2d');
cv.width=W*2;cv.height=H*2;cx.imageSmoothingEnabled=false;

let scene='title',tsel=0,hsel=0,time=0;
let P=null,M=null,E=[],PR=[],EP=[],DR=[],FX=[],FT=[],NP=[],CH=[],toasts=[];
let DELAY=[],TRAPS=[],hitCount=0,hitStop=0,ui=null,shake=0,banner={t:0,text:''},regions=[],lastTouchOverlay=false;
let flags=null;
const fade={a:0,dir:0,fn:null};
const cam={x:0,y:0};
const MAXLVL=15;
const QUEST=['Talk to Elder Maren in the village','Find the Hollow Oak north of Ember Glade','Defeat Old Barkfather in the Hollow Oak','Return to Elder Maren','Cut the thorn vines at the east edge of Ember Glade','Find the Spore Warren in Amber Hollow','Wade through the flooded ford east of Amber Hollow','Find the Sunken Shrine in Mistwater Marsh','Cross the gorge at the east edge of the marsh with your Grapple Hook','Find the Rustpeak Mine in the highlands','Light the dark tunnel east of Rustpeak with the Miner\'s Lantern','Find the Ghostbark Crypt in the grove','Open the root-gate at the east edge of Ghostbark Grove with the Heartseed','End the blight at the Heart of Spicewood','The Spicewood is saved! Roam freely and grow stronger'];
const BOSSES={barkfather:{name:'Old Barkfather',flag:'boss',stage:3,msg:'Old Barkfather has fallen!'},mycelia:{name:'Mother Mycelia',flag:'boss2',stage:6,msg:'Mother Mycelia has withered!'},drowned:{name:'The Drowned Matron',flag:'boss3',stage:8,msg:'The Drowned Matron sinks back into the deep!'},warden:{name:'The Rust Warden',flag:'boss4',stage:10,msg:'The Rust Warden crumbles to scrap!'},king:{name:'The Hollow King',flag:'boss5',stage:12,msg:'The Hollow King falls to dust!'},heartwood:{name:'The Heartwood',flag:'boss6',stage:14,msg:'The Heartwood falls, and the blight lifts!'}};
const bossOf=e=>BOSSES[e.variant||'barkfather'];
const BOSSSPR={mycelia:'boss2',drowned:'boss3',warden:'boss4',king:'boss5',heartwood:'boss6'};
const SAVE_KEY='spicewood_save_v1';
const ZONEMUSIC={village:'village',glade:'forest',amber:'forest',marsh:'marsh',dungeon:'dungeon',spore:'dungeon',shrine:'dungeon',mine:'dungeon',rust:'rust',grove:'grove',crypt:'dungeon',heart:'heart'};
const FONT='"Segoe UI",Tahoma,Verdana,Arial,sans-serif';

// ---------- small helpers ----------
function text(s,x,y,c,size,al,bold){
  size=Math.max(size||8,7);
  cx.font='bold '+size+'px '+FONT;cx.textAlign=al||'left';cx.textBaseline='top';
  cx.fillStyle='rgba(0,0,0,.75)';cx.fillText(s,x+1,y+1);
  cx.fillStyle=c||'#fff';cx.fillText(s,x,y);
}
function wrap(s,maxW,size){
  cx.font='bold '+Math.max(size||8,7)+'px '+FONT;
  const out=[];let line='';
  for(const w of s.split(' ')){
    const t=line?line+' '+w:w;
    if(cx.measureText(t).width>maxW&&line){out.push(line);line=w}else line=t;
  }
  if(line)out.push(line);
  return out;
}
function bar(x,y,w,h,f,c,bg){cx.fillStyle=bg||'#1a1008';cx.fillRect(x-1,y-1,w+2,h+2);cx.fillStyle=c;cx.fillRect(x,y,Math.round(w*clamp(f,0,1)),h)}
function panel(x,y,w,h){cx.fillStyle='#1a110a';cx.fillRect(x,y,w,h);cx.strokeStyle='#8a6a3a';cx.lineWidth=1;cx.strokeRect(x+.5,y+.5,w-1,h-1);cx.strokeStyle='#3a2814';cx.strokeRect(x+2.5,y+2.5,w-5,h-5)}
function reg(x,y,w,h,fn){regions.push({x,y,w,h,fn})}
function toast(s,c){toasts.push({s,c:c||'#ffe9a0',t:2.6})}
function floatText(x,y,s,c,big){FT.push({x,y,s:String(s),c,t:.9,big})}
function fx(o){FX.push(o)}
function puff(x,y,n,color,sp){for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(10,(sp||60));FX.push({k:'p',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10,t:rand(.25,.6),c:color,s:Math.random()<.4?2:1})}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// ---------- collision ----------
function solidAt(px,py){
  const tx=Math.floor(px/TS),ty=Math.floor(py/TS);
  if(tx<0||ty<0||tx>=M.w||ty>=M.h)return true;
  const t=M.t[ty*M.w+tx];
  if(t===25)return!(flags&&flags.boots);
  return SOLID[t]===1;
}
function boxFree(x,y,hw,hh){return!(solidAt(x-hw,y-hh)||solidAt(x+hw,y-hh)||solidAt(x-hw,y+hh)||solidAt(x+hw,y+hh))}
function move(e,dx,dy){
  if(dx&&boxFree(e.x+dx,e.y,e.hw,e.hh))e.x+=dx;
  if(dy&&boxFree(e.x,e.y+dy,e.hw,e.hh))e.y+=dy;
}

// ---------- player ----------
function xpNeed(l){return Math.floor(18*Math.pow(l,1.6))}
function newPlayer(idx){
  const h=HEROES[idx];
  P={heroIdx:idx,hero:h,x:0,y:0,hw:4,hh:3,face:{x:0,y:1},lvl:1,xp:0,pts:0,alloc:{str:0,dex:0,int:0,vit:0},
     gold:0,potions:3,bag:[],eq:{},hp:1,res:0,cd:[0,0],atkT:0,rollT:0,rollCd:0,dashT:0,inv:0,anim:0,flash:0,
     rageT:0,potCd:0,swing:0,moving:false,rvx:0,rvy:0,hitSet:null,dead:false,
     mats:{},buffs:[],learned:{},sp:0,bound:h.skills.map(k=>k.id),cdMax:[1,1],buff:null,mods:{},critMult:1.7,stealth:0,dashMult:1.8};
  P.eq.weapon={slot:'weapon',name:'Worn '+h.weaponNames[0],base:h.weaponNames[0],r:0,ilvl:1,dmg:5,aff:[]};
  recalc();P.hp=P.maxHp;
  flags={stage:0,boss:false,sickle:false,chests:{},dun:{},cut:{},boss2:false,boots:false,boss3:false,boss4:false,boss5:false,boss6:false,hook:false,lantern:false,heartseed:false,rewarded:false,base:{smithy:1,alch:1,tavern:1,store:1}};
  P.keys=0;
}
function recalc(){
  const h=P.hero,s={str:h.base.str+P.alloc.str,dex:h.base.dex+P.alloc.dex,int:h.base.int+P.alloc.int,vit:h.base.vit+P.alloc.vit};
  s[h.primary]+=P.lvl-1;
  let hp=0,armor=0,crit=0,speed=0,wd=0;
  for(const sl of SLOTS){
    const it=P.eq[sl];if(!it)continue;
    wd+=itemDmg(it);armor+=itemArmor(it);
    for(const a of it.aff){
      if(a.k==='hp')hp+=a.v;else if(a.k==='armor')armor+=a.v;else if(a.k==='crit')crit+=a.v;else if(a.k==='speed')speed+=a.v;else s[a.k]+=a.v;
    }
  }
  P.st=s;
  const md={};
  for(const id in P.learned){const nd=NODEBYID[id];if(nd&&nd.mods)for(const k in nd.mods)md[k]=(md[k]||0)+nd.mods[k]}
  for(const b of P.buffs||[])for(const k in b.mods)md[k]=(md[k]||0)+b.mods[k];
  P.mods=md;
  P.maxHp=Math.round((40+s.vit*6+P.lvl*4+hp)*(1+(md.hpPct||0)/100));
  P.armor=armor+(md.armor||0);P.crit=.05+s.dex*.004+(crit+(md.crit||0))/100;P.critMult=1.7+(md.critDmg||0)/100;
  P.spd=70*(1+(speed+(md.spdPct||0))/100);
  P.atk=(wd||3)+s[h.primary]*.9;
  P.atkCd=h.atkCd*(1-Math.min(.4,s.dex*.004))/(1+(md.atkSpdPct||0)/100);
  P.resMax=h.resMax(s);P.regen=h.regen(s)*(1+(md.regenPct||0)/100);
  P.hp=Math.min(P.hp,P.maxHp);P.res=Math.min(P.res,P.resMax);
}
function gainXp(n){
  if(P.lvl>=MAXLVL)return;
  P.xp+=Math.round(n*(1+(P.mods.xpPct||0)/100));
  while(P.lvl<MAXLVL&&P.xp>=xpNeed(P.lvl)){
    P.xp-=xpNeed(P.lvl);P.lvl++;P.pts+=3;recalc();P.hp=P.maxHp;
    const sp=(P.lvl<=10||P.lvl===15);if(sp)P.sp++;
    toast(`LEVEL UP! Level ${P.lvl}: +3 attribute points (I)`+(sp?', +1 skill point (T)':''),'#ffe040');
    fx({k:'ring',x:P.x,y:P.y,r0:4,r1:46,t:0,dur:.7,c:'#ffe040'});puff(P.x,P.y,18,'#ffe040',90);
    Snd.level();
    try{parent.postMessage({type:'score',value:P.lvl*1000+P.xp},'*')}catch(e){}
  }
  if(P.lvl>=MAXLVL)P.xp=0;
}
function addToBag(it){if(P.bag.length>=bagCap())return false;P.bag.push(it);return true}
function equipTarget(it){
  if(it.slot!=='ring')return it.slot;
  if(!P.eq.ring1)return'ring1';if(!P.eq.ring2)return'ring2';return'ring1';
}
function equipFromBag(i){
  const it=P.bag[i];if(!it)return;
  const sl=equipTarget(it),old=P.eq[sl];
  P.eq[sl]=it;P.bag.splice(i,1);if(old)P.bag.splice(i,0,old);
  recalc();Snd.pickup();
}
function unequip(sl){
  const it=P.eq[sl];if(!it)return;
  if(!addToBag(it)){toast('Bag is full','#ff8070');return}
  delete P.eq[sl];recalc();Snd.menu();
}

// ---------- save / load ----------
function hasSave(){try{return!!localStorage.getItem(SAVE_KEY)}catch(e){return false}}
function save(){
  if(!P||!M)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({h:P.heroIdx,lvl:P.lvl,xp:P.xp,pts:P.pts,alloc:P.alloc,gold:P.gold,pot:P.potions,bag:P.bag,eq:P.eq,flags,keys:P.keys,learned:P.learned,bound:P.bound,sp:P.sp,mats:P.mats,map:M.id,x:P.x,y:P.y,hp:P.hp}))}catch(e){}
}
function loadGame(){
  try{
    const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(!s)return false;
    newPlayer(s.h);
    Object.assign(P,{lvl:s.lvl,xp:s.xp,pts:s.pts,alloc:s.alloc,gold:s.gold,potions:s.pot,bag:s.bag,eq:s.eq,learned:s.learned||{},sp:s.sp||0,mats:s.mats||{}});
    if(s.bound)P.bound=s.bound;
    flags=Object.assign({stage:0,boss:false,sickle:false,chests:{},dun:{},cut:{},boss2:false,boots:false,boss3:false,boss4:false,boss5:false,boss6:false,hook:false,lantern:false,heartseed:false,rewarded:false,base:{smithy:1,alch:1,tavern:1,store:1}},s.flags);flags.rewarded=flags.rewarded||flags.stage>=4;P.keys=s.keys||0;
    recalc();P.hp=Math.min(s.hp||P.maxHp,P.maxHp);
    scene='play';ui=null;toasts=[];loadMap(s.map,s.x,s.y);return true;
  }catch(e){return false}
}


// ---------- soft terrain: pre-render the map and dither tile borders so there are no hard edges ----------
const NOBLEND=new Set([T.WALL,T.ROOF,T.DOOR,T.LOCK,T.OAK,20,21,22]);
const fam=id=>id===17?0:(id===24||id===26)?9:id;
function buildLayer(){
  const c=document.createElement('canvas');c.width=M.w*TS;c.height=M.h*TS;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const vr=(x,y)=>(((x*73856093)^(y*19349663))>>>0)%4;
  const tileAt=(x,y)=>gt(M,x,y);
  for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++)g.drawImage(Spr.tiles[tileAt(x,y)][vr(x,y)],x*TS,y*TS);
  const r=seeded(M.w*31+M.h);
  const P_=[.6,.38,.2,.09];
  const dirs=[[0,-1],[0,1],[-1,0],[1,0]];
  for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++){
    const id=tileAt(x,y);if(NOBLEND.has(id))continue;
    for(const[dx,dy]of dirs){
      const nid=tileAt(x+dx,y+dy);
      if(nid<0||fam(nid)===fam(id)||NOBLEND.has(nid))continue;
      // trees keep crisp edges; only the foot of the trunk blends into the ground
      if(id===T.TREE&&dy!==1)continue;
      if(nid===T.TREE&&dy!==-1)continue;
      const src=Spr.tiles[nid][vr(x+dx,y+dy)];
      for(let d=0;d<4;d++)for(let k=0;k<TS;k++){
        if(r()>P_[d])continue;
        const lx=dx?(dx<0?d:TS-1-d):k,ly=dy?(dy<0?d:TS-1-d):k;
        // sample the neighbour's pixel on the other side of the seam
        const sx=dx?TS-1-lx:lx,sy=dy?TS-1-ly:ly;
        g.drawImage(src,sx,sy,1,1,x*TS+lx,y*TS+ly,1,1);
      }
    }
  }
  M.layer=c;
}

// ---------- maps / spawning ----------
function makeEnemy(type,x,y,lvl,elite,variant){
  const d=ENEMIES[type],k=lvl-1;
  const hp=Math.round(d.hp*(1+.3*k)*(elite?2.4:1)),dmg=d.dmg*(1+.2*k)*(elite?1.3:1);
  return{type,variant,x,y,lvl,elite:!!elite,hp,maxHp:hp,dmg,speed:d.speed,hw:d.hw,hh:d.hh,aggro:d.aggro,
    state:type==='boss'?'dormant':'idle',t:rand(0,2),cd:rand(.5,1.5),hitCd:0,kx:0,ky:0,flash:0,slow:0,stun:0,
    wx:0,wy:0,moving:false,dx:0,dy:1,dir:1,tele:null,seq:0,rot:0,anim:rand(0,6),home:{x,y}};
}
function loadMap(id,x,y){
  M=MAPS[id]();E=[];PR=[];EP=[];DR=[];FX=[];FT=[];
  if(flags.cut&&flags.cut[id])applyCut();
  if(flags.hook)for(let i=0;i<M.t.length;i++)if(M.t[i]===T.GORGE)M.t[i]=T.BRIDGE;
  buildLayer();
  NP=M.npcs;
  CH=M.chests.map(c=>Object.assign({},c,{open:!!flags.chests[c.id]}));
  for(const g of M.gates||[]){
    if(g.kind==='orb'&&flags.dun[g.flag||'orb'])g.open=true;
    if(g.kind==='key'&&flags.dun[g.flagKey||'keydoor'])g.open=true;
    if(g.kind==='plate'&&flags.dun[g.flag])g.open=true;
    if(g.kind==='room'&&flags.dun[g.room])g.open=true;
    if(!g.open)for(const[x,y]of g.tiles)M.t[y*M.w+x]=T.BARRIER;
  }
  for(const s of M.spawns){
    if(s.type==='boss'&&flags[bossOf(s).flag])continue;
    if(s.room&&flags.dun[s.room])continue;
    const e=makeEnemy(s.type,s.x,s.y,s.lvl,s.elite,s.variant);e.room=s.room;E.push(e);
  }
  if(id==='dungeon'){
    if(flags.stage===1)flags.stage=2;
    if(flags.boss)bossAftermath(true);
  }
  if(id==='spore'&&flags.boss2)bossAftermath(true);
  if(id==='shrine'&&flags.boss3)bossAftermath(true);
  if(id==='mine'&&flags.boss4)bossAftermath(true);
  if(id==='crypt'&&flags.boss5)bossAftermath(true);
  if(id==='heart'&&flags.boss6)bossAftermath(true);
  if(id==='amber'&&flags.stage>=3&&flags.stage<5)flags.stage=5;
  if(id==='marsh'&&flags.stage<7)flags.stage=7;
  if(id==='rust'&&flags.stage<9)flags.stage=9;
  if(id==='grove'&&flags.stage<11)flags.stage=11;
  if(id==='heart'&&flags.stage<13)flags.stage=13;
  DELAY=[];TRAPS=[];
  Music.play(ZONEMUSIC[id]);
  P.x=x;P.y=y;P.dashT=0;P.rollT=0;P.att=null;P.kx=P.ky=0;
  banner={t:3,text:M.name};
  snapCam();
  save();
}
const AFTER={
  dungeon:{chest:'boss',cx:20,cy:3,wx:19,wy:7,to:'glade',tx:30*TS,ty:4.5*TS},
  spore:{chest:'boss2',cx:22,cy:3,wx:21,wy:7,to:'amber',tx:46*TS,ty:4.5*TS},
  shrine:{chest:'boss3',cx:22,cy:3,wx:21,wy:7,to:'marsh',tx:34*TS,ty:13*TS},
  mine:{chest:'boss4',cx:22,cy:3,wx:21,wy:7,to:'rust',tx:50*TS,ty:4.5*TS},
  crypt:{chest:'boss5',cx:22,cy:3,wx:21,wy:7,to:'grove',tx:44*TS,ty:4.5*TS},
  heart:{chest:'boss6',cx:26,cy:3,wx:25,wy:11,to:'grove',tx:52*TS,ty:26.5*TS}
};
function applyCut(){
  for(let i=0;i<M.t.length;i++)if(M.t[i]===T.VINE)M.t[i]=T.PATH;
  if(M.id==='glade'&&!M.warps.some(w=>w.to==='amber'))M.warps.push({x:43*TS,y:17*TS,w:TS,h:4*TS,to:'amber',tx:3*TS,ty:18.5*TS});
}
function cutVines(){
  flags.cut[M.id]=true;applyCut();buildLayer();Snd.open();shake=3;
  puff(P.x+P.face.x*16,P.y+P.face.y*16,16,'#6a8a30',80);
}
function openDoor(silent){
  for(let i=0;i<M.t.length;i++)if(M.t[i]===T.LOCK)M.t[i]=T.DFLOOR;
  M.doorOpen=true;buildLayer();
  if(!silent){toast('The sealed door grinds open!');Snd.open();shake=4}
}
function bossAftermath(silent){
  const a=AFTER[M.id];if(!a)return;
  if(!CH.some(c=>c.id===a.chest))CH.push({id:a.chest,x:a.cx*TS+8,y:a.cy*TS+8,open:!!flags.chests[a.chest]});
  M.warps.push({x:a.wx*TS,y:a.wy*TS,w:2*TS,h:TS,to:a.to,tx:a.tx,ty:a.ty,portal:true});
}
function startFade(fn){if(fade.dir!==0)return;fade.dir=1;fade.fn=fn}
function snapCam(){
  cam.x=M.w*TS<=W?(M.w*TS-W)/2:clamp(P.x-W/2,0,M.w*TS-W);
  cam.y=M.h*TS<=H?(M.h*TS-H)/2:clamp(P.y-H/2,0,M.h*TS-H);
}

// ---------- loot ----------
function dropItem(x,y,it){DR.push({kind:'item',x,y,item:it,t:0,vx:rand(-30,30),vy:rand(-30,30)})}
function dropMat(x,y,mat,n){DR.push({kind:'mat',mat,amt:n,x,y,t:0,vx:rand(-40,40),vy:rand(-40,40)})}
function dropGold(x,y,n){DR.push({kind:'gold',x,y,amt:n,t:0,vx:rand(-40,40),vy:rand(-40,40)})}
function pickups(dt){
  for(const p of M.props){if(p.k!=='herb')continue;const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS;if(Math.hypot(px-P.x,py-P.y)<10){p.dead=true;const n=randi(1,2);addMat('herb',n);floatText(P.x,P.y-12,`+${n} Herbs`,MATS.herb.c);Snd.coin()}}
  if(M.props.some(p=>p.dead))M.props=M.props.filter(p=>!p.dead);
  for(const d of DR){
    d.t+=dt;
    if(Math.abs(d.vx)+Math.abs(d.vy)>2){
      if(boxFree(d.x+d.vx*dt,d.y,1,1))d.x+=d.vx*dt;
      if(boxFree(d.x,d.y+d.vy*dt,1,1))d.y+=d.vy*dt;
      d.vx*=.9;d.vy*=.9;
    }
    const dd=dist(d,P);
    if(d.kind!=='item'&&dd<46&&d.t>.3){d.x+=(P.x-d.x)*Math.min(1,dt*8);d.y+=(P.y-d.y)*Math.min(1,dt*8)}
    if(dd<9&&d.t>.25){
      if(d.kind==='mat'){addMat(d.mat,d.amt);floatText(P.x,P.y-12,`+${d.amt} ${MATS[d.mat].n}`,MATS[d.mat].c);Snd.coin();d.dead=true}
      else if(d.kind==='gold'){P.gold+=d.amt;floatText(P.x,P.y-12,'+'+d.amt+'g','#ffd040');Snd.coin();d.dead=true}
      else if(d.kind==='hp'){P.hp=Math.min(P.maxHp,P.hp+Math.round(P.maxHp*.15));floatText(P.x,P.y-12,'+HP','#ff6060');Snd.coin();d.dead=true}
      else if(d.kind==='item'){
        if(addToBag(d.item)){floatText(P.x,P.y-12,d.item.name,RARITY[d.item.r].c);Snd.pickup();d.dead=true}
        else if(!d.warned||d.t-d.warned>2){d.warned=d.t;floatText(P.x,P.y-12,'Bag full','#ff8070')}
      }
    }
  }
  DR=DR.filter(d=>!d.dead);
}

// ---------- combat ----------
function aimDir(maxd,any){
  let best=null,bd=maxd;
  for(const e of E){
    if(e.state==='dormant')continue;
    const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);
    if(d>bd)continue;
    if(!any&&(dx*P.face.x+dy*P.face.y)/(d||1)<.55)continue;
    best=e;bd=d;
  }
  if(best){const dx=best.x-P.x,dy=best.y-P.y,d=Math.hypot(dx,dy)||1;return{x:dx/d,y:dy/d}}
  return{x:P.face.x,y:P.face.y};
}
function gainRes(n){if(P.hero.id==='warrior'){P.res=Math.min(P.resMax,P.res+n);P.rageT=2.5}}
function applyPoison(e){
  const dps=P.atk*.3*(1+(P.mods.poisonX||0)/100);
  e.poison={t:4,dps,acc:0,tick:0};
}
function hitEnemy(e,mult,dx,dy,kb,o){
  o=o||{};const md=P.mods;
  let d=P.atk*mult*rand(.9,1.1);
  d*=1+((md.dmgPct||0)+(P.buff&&P.buff.dmg?P.buff.dmg*100:0))/100;
  if(o.heavy)d*=1+(md.heavyPct||0)/100;
  if(md.execute&&e.hp<e.maxHp*.3)d*=1+md.execute/100;
  const crit=o.crit||Math.random()<P.crit;if(crit)d*=P.critMult;
  d=Math.max(1,Math.round(d));
  e.hp-=d;e.flash=.1;
  if(md.lifesteal)P.hp=Math.min(P.maxHp,P.hp+d*md.lifesteal/100);
  if((P.buff&&P.buff.poison)||(md.burn&&o.fire))applyPoison(e);
  if(e.state==='dormant'&&e.type==='boss')e.state='fight';
  const l=Math.hypot(dx,dy)||1,k=e.type==='boss'?kb*.1:kb;
  e.kx+=dx/l*k*5;e.ky+=dy/l*k*5;
  if(e.type!=='boss'){
    e.stun=Math.max(e.stun,o.stun||.18);
    if(o.slow&&md.freeze)e.stun=Math.max(e.stun,.5);
    if(e.state==='wind'){e.state='chase';e.cd=1}
  }
  if(o.slow)e.slow=o.slow;
  floatText(e.x,e.y-12,d,crit?'#ffd040':'#ffffff',crit);
  puff(e.x,e.y,crit?7:3,crit?'#ffd040':'#ffffff',50);
  gainRes(6);crit?Snd.crit():Snd.hit();
  hitCount++;hitStop=Math.max(hitStop,crit?.075:.04);shake=Math.max(shake,crit?3:1.2);
  if(e.hp<=0&&!e.dead)killEnemy(e);
}
function hurtPlayer(dmg,sx,sy){
  if(P.inv>0||P.rollT>0||P.dashT>0||P.dead)return;
  if(P.mods.dodge&&Math.random()<P.mods.dodge/100){floatText(P.x,P.y-14,'Dodge!','#bde0ff');return}
  const red=P.armor/(P.armor+25+P.lvl*4);
  const d=Math.max(1,Math.round(dmg*(1-red)*(1-(P.mods.reducePct||0)/100)));
  if(P.mods.thorns){let n=null,nd=22;for(const e of E){const dd=Math.hypot(e.x-sx,e.y-sy);if(!e.dead&&dd<nd){nd=dd;n=e}}if(n)hitEnemy(n,Math.max(.1,d*P.mods.thorns/100/P.atk),n.x-P.x,n.y-P.y,40)}
  P.hp-=d;P.inv=.8;P.flash=.12;shake=Math.max(shake,3);hitStop=.07;
  const l=Math.hypot(P.x-sx,P.y-sy)||1;
  P.kx=(P.x-sx)/l*170;P.ky=(P.y-sy)/l*170;
  floatText(P.x,P.y-14,'-'+d,'#ff5050',false);Snd.hurt();gainRes(4);
  if(P.hp<=0)playerDied();
}
function playerDied(){
  P.dead=true;P.hp=0;
  ui={mode:'dialog',d:{name:'You fell...',pages:['Darkness takes you for a moment. You wake up in Hearthmoor, a little poorer (-10% gold).'],i:0,onEnd(){
    P.gold=Math.floor(P.gold*.9);P.hp=P.maxHp;P.res=0;P.dead=false;P.inv=1;
    startFade(()=>{loadMap('village',20*TS,17*TS)});
  }}};
}
function killEnemy(e){
  e.dead=true;
  if(P.mods.killHeal)P.hp=Math.min(P.maxHp,P.hp+P.maxHp*P.mods.killHeal/100);
  const d=ENEMIES[e.type],m=1+.3*(e.lvl-1);
  gainXp(Math.round(d.xp*m*(e.elite?2.5:1)*1.4));
  dropGold(e.x,e.y,Math.round(randi(d.gold[0],d.gold[1])*(1+.4*(e.lvl-1))*(e.elite?3:1)));
  if(Math.random()<.12)DR.push({kind:'hp',x:e.x,y:e.y,t:0,vx:rand(-20,20),vy:rand(-20,20)});
  const mt={beetle:'shell',wolf:'leather',shroom:'herb',bat:'leather',brute:'herb',skeleton:'ore',ghost:'herb'}[e.type];
  if(mt&&Math.random()<(e.elite?1:.6))dropMat(e.x,e.y,mt,(e.elite?2:1)+(e.type==='brute'?1:0));
  if(e.type==='brute'&&Math.random()<.4)dropMat(e.x,e.y,'shell',1);
  if(e.type==='beetle'&&Math.random()<.25)dropMat(e.x,e.y,'ore',1);
  if(e.type==='boss'){bossDefeated(e);return}
  if(e.elite||Math.random()<.18)dropItem(e.x,e.y,genItem(Math.max(1,e.lvl+(e.elite?1:0)),{minR:e.elite?1:0}));
  puff(e.x,e.y,12,e.type==='shroom'?'#c8501e':e.type==='wolf'?'#8b8478':'#c2551d',80);
}
function bossDefeated(e){
  EP=[];const bi=bossOf(e);
  flags[bi.flag]=true;flags.dun[bi.flag]=true;if(flags.stage<bi.stage)flags.stage=bi.stage;
  for(let i=0;i<30;i++)puff(e.x+rand(-14,14),e.y+rand(-14,14),3,'#d8741e',110);
  fx({k:'ring',x:e.x,y:e.y,r0:6,r1:120,t:0,dur:1,c:'#ffd080'});
  Snd.boom();shake=10;
  toast(bi.msg,'#ffd040');
  bossAftermath();
  E.forEach(o=>{if(o!==e&&!o.dead&&o.type!=='boss'){o.hp=0;o.dead=true}});
  save();
}
function openChest(c){
  c.open=true;flags.chests[c.id]=true;Snd.open();
  const lv=P.lvl;
  const drop=(n,minR,il)=>{for(let i=0;i<n;i++)dropItem(c.x+rand(-10,10),c.y+rand(6,14),genItem(il,{minR}))};
  if(c.id==='g1'){drop(2,1,Math.max(2,lv+1));dropGold(c.x,c.y+8,25);dropMat(c.x,c.y+10,'herb',3);dropMat(c.x+6,c.y+10,'wood',3)}
  else if(c.id==='boss'){
    drop(2,2,9);drop(1,3,9);dropGold(c.x,c.y+8,150);
    for(const[m_,n_]of[['shell',5],['ore',10],['wood',6],['leather',4],['herb',4]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.sickle=true;
    ui={mode:'dialog',d:{name:'Treasure',pages:['You obtained the THORNSICKLE!','A gate item: it can cut the thorn vines at the far east edge of Ember Glade.'],i:0}};
  }else if(c.id==='boss2'){
    drop(2,2,12);drop(1,3,12);dropGold(c.x,c.y+8,250);
    for(const[m_,n_]of[['shell',6],['ore',12],['wood',8],['leather',6],['herb',8]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.boots=true;
    ui={mode:'dialog',d:{name:'Treasure',pages:['You obtained the WOODEN BOOTS!','A gate item: with them you can wade through the flooded fords. The ford east of Amber Hollow leads to the Mistwater Marsh.'],i:0}};
  }else if(c.id==='boss3'){
    drop(2,3,15);drop(1,3,15);dropGold(c.x,c.y+8,350);
    for(const[m_,n_]of[['shell',8],['ore',14],['wood',10],['leather',8],['herb',10]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.hook=true;
    ui={mode:'dialog',d:{name:'Treasure',pages:['You obtained the GRAPPLE HOOK!','A gate item: it spans the gorge at the east edge of Mistwater Marsh. Rustpeak lies beyond.'],i:0}};
  }else if(c.id==='boss4'){
    drop(2,3,18);drop(1,4,18);dropGold(c.x,c.y+8,500);
    for(const[m_,n_]of[['shell',10],['ore',20],['wood',12],['leather',10],['herb',12]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.lantern=true;
    ui={mode:'dialog',d:{name:'Treasure',pages:['You obtained the MINER\'S LANTERN!','A gate item: its light will pierce the darkness of Ghostbark Grove. That tale is for a future update.'],i:0}};
  }else if(c.id==='boss6'){
    drop(3,4,26);drop(2,3,26);dropGold(c.x,c.y+8,1500);
    for(const[m_,n_]of[['shell',20],['ore',40],['wood',25],['leather',20],['herb',25]])dropMat(c.x+rand(-14,14),c.y+rand(8,18),m_,n_);
    flags.won=true;
    ui={mode:'dialog',d:{name:'The Heart of Spicewood',pages:['The Heartwood sighs, and its golden leaves drift down like embers.','The blight fades. Across the Spicewoods, from Hearthmoor to Rustpeak, the forest breathes again.','THE END. Thank you for playing Spicewood!','The world is yours to roam. Grow stronger, gather gear and explore every corner.'],i:0}};
    try{parent.postMessage({type:'gameOver',score:P.lvl*1000+P.xp},'*')}catch(e){}
  }else if(c.id==='boss5'){
    drop(2,3,22);drop(1,4,22);dropGold(c.x,c.y+8,700);
    for(const[m_,n_]of[['shell',12],['ore',24],['wood',14],['leather',12],['herb',14]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.heartseed=true;
    ui={mode:'dialog',d:{name:'Treasure',pages:['You obtained the HEARTSEED!','A gate item: it wakes the ancient tree at the Heart of Spicewood. That tale is for a future update.'],i:0}};
  }else if(c.id.length===2&&'mrpq'.includes(c.id[0])){const tier={m:[8,90,5],r:[13,140,8],p:[18,200,10],q:[24,350,14]}[c.id[0]];drop(2,3,Math.max(tier[0],lv+2));dropGold(c.x,c.y+8,tier[1]);dropMat(c.x,c.y+10,'ore',tier[2]);dropMat(c.x+6,c.y+10,'herb',4)}
  else if(c.id==='dL'||c.id==='sL'||c.id==='hL'||c.id==='xL'||c.id==='kL'){P.keys++;toast('You found a Small Key!','#ffe040');drop(1,2,Math.max(4,lv+1));dropGold(c.x,c.y+8,30)}
  else{drop(2,2,Math.max(4,lv+1));dropGold(c.x,c.y+8,40);dropMat(c.x,c.y+10,'ore',4);dropMat(c.x+6,c.y+10,'leather',2)}
  puff(c.x,c.y,10,'#ffd040',60);
}

// ---------- projectiles & skills ----------
function shoot(kind,ang,mult,o){
  o=o||{};const sp=o.speed||(kind==='fire'?150:kind==='knife'?240:220);
  PR.push({kind,x:P.x,y:P.y-2,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,mult,life:o.life||.9,aoe:o.aoe||0,pierce:!!o.pierce,hit:new Set(),ang,slow:o.slow,crit:o.crit});
}
function ringHit(r,mult,kb,o,color){
  cutAround(P.x,P.y,r);
  fx({k:'ring',x:P.x,y:P.y,r0:4,r1:r,t:0,dur:.28,c:color});
  for(const e of E.slice())if(!e.dead&&e.state!=='dormant'||e.type==='boss'){const d=dist(e,P);if(d<r+e.hw)hitEnemy(e,mult,e.x-P.x,e.y-P.y,kb,o)}
}
const sm=()=>1+(P.mods.skillDmg||0)/100;
function mark(x,y,r,dur){fx({k:'mark',x,y,r,t:0,dur})}
function later(t,fn){DELAY.push({t,fn})}
function aoeAt(x,y,r,mult,kb,o,color){
  fx({k:'ring',x,y,r0:4,r1:r,t:0,dur:.3,c:color||'#fff'});puff(x,y,12,color||'#fff',80);shake=Math.max(shake,4);Snd.boom();
  for(const e of E.slice())if(!e.dead&&Math.hypot(e.x-x,e.y-y)<r+e.hw)hitEnemy(e,mult,e.x-x,e.y-y,kb,o);
  cutAround(x,y,r);
}
function coneHit(range,arcDeg,mult,kb,o,d,color){
  fx({k:'slash',x:P.x,y:P.y,dir:Math.atan2(d.y,d.x),arc:arcDeg*Math.PI/180,range,t:0,dur:.2,c:color,w:7});
  for(const e of E.slice()){
    if(e.dead)continue;
    const dx=e.x-P.x,dy=e.y-P.y,dd=Math.hypot(dx,dy);
    if(dd>range+e.hw)continue;
    const ang=Math.acos(clamp((dx*d.x+dy*d.y)/(dd||1),-1,1));
    if(ang<arcDeg*Math.PI/360||dd<e.hw+4)hitEnemy(e,mult,dx,dy,kb,o);
  }
  cutAround(P.x+d.x*15,P.y+d.y*15,22);
}
function targetPoint(maxd){
  let best=null,bd=maxd;
  for(const e of E){if(e.dead||e.state==='dormant'&&e.type!=='boss')continue;const dd=Math.hypot(e.x-P.x,e.y-P.y);if(dd<bd){bd=dd;best=e}}
  if(best)return{x:best.x,y:best.y};
  return{x:P.x+P.face.x*maxd*.6,y:P.y+P.face.y*maxd*.6};
}
const SKILL={
  cleave(){ringHit(36,1.7*sm(),90,{},'#ff7050')},
  slam(){ringHit(60,1.6*sm(),150,{stun:.9},'#ffb050');shake=6;Snd.boom()},
  multishot(){const d=aimDir(200,true),a=Math.atan2(d.y,d.x);for(let i=-2;i<=2;i++)shoot('arrow',a+i*.2,.85*sm())},
  pierce(){const d=aimDir(220,true);shoot('pierce',Math.atan2(d.y,d.x),2.4*sm(),{pierce:true,speed:340,life:1.1})},
  fireball(){const d=aimDir(220,true);shoot('fire',Math.atan2(d.y,d.x),2.4*sm(),{aoe:36,speed:150,life:1.4})},
  nova(){ringHit(66,1.5*sm(),70,{slow:2.5},'#80d0ff')},
  dash(){const d=aimDir(120);P.face=d;P.dashT=.16;P.dvx=d.x*480;P.dvy=d.y*480;P.hitSet=new Set();P.dashMult=1.8*sm();P.dashExec=false},
  knives(){for(let i=0;i<8;i++)shoot('knife',i*TAU/8,1.0*sm(),{life:.5,speed:230})},
  // ---- tree skills ----
  shieldbash(){const d=aimDir(60);P.face=d;coneHit(38,110,1.3*sm(),170,{stun:1.4},d,'#9ab8ff');shake=4;Snd.boom()},
  bloodrage(){P.buff={t:6,dmg:.25,as:.3};fx({k:'ring',x:P.x,y:P.y,r0:4,r1:40,t:0,dur:.4,c:'#e03020'});puff(P.x,P.y,14,'#e03020',70)},
  smite(){const d=aimDir(90,true),x=P.x+d.x*38,y=P.y+d.y*38;aoeAt(x,y,38,2.0*sm(),90,{},'#ffe9a0');const h=Math.round(P.maxHp*.06);P.hp=Math.min(P.maxHp,P.hp+h);floatText(P.x,P.y-14,'+'+h,'#60ff80')},
  sniper(){const d=aimDir(260,true);shoot('pierce',Math.atan2(d.y,d.x),3.5*sm(),{pierce:true,speed:440,life:1.0,crit:true})},
  trap(){TRAPS.push({x:P.x,y:P.y,t:14,mult:2.2*sm()*(1+(P.mods.trapPct||0)/100)})},
  rain(){const t=targetPoint(150);mark(t.x,t.y,44,.6);later(.6,()=>aoeAt(t.x,t.y,44,2.4*sm(),60,{slow:2},'#c8ff90'))},
  meteor(){const t=targetPoint(150);mark(t.x,t.y,48,.8);later(.8,()=>aoeAt(t.x,t.y,48,3.2*sm(),120,{fire:true},'#ff8a2a'))},
  frostbolt(){const d=aimDir(220,true);shoot('bolt',Math.atan2(d.y,d.x),1.6*sm(),{pierce:true,speed:200,life:1.0,slow:3})},
  blink(){
    const d=P.face;let s2=0;
    for(let k=76;k>=8;k-=8){if(boxFree(P.x+d.x*k,P.y+d.y*k,P.hw,P.hh)){s2=k;break}}
    puff(P.x,P.y,10,'#c080ff',70);P.x+=d.x*s2;P.y+=d.y*s2;P.inv=Math.max(P.inv,.5);
    aoeAt(P.x,P.y,32,1.0*sm(),90,{},'#c080ff');
  },
  execute(){
    let best=null,bd=140;
    for(const e of E){if(e.dead)continue;const dd=Math.hypot(e.x-P.x,e.y-P.y);if(dd<bd){bd=dd;best=e}}
    const d=best?{x:(best.x-P.x)/bd,y:(best.y-P.y)/bd}:P.face;
    P.face=d;P.dashT=Math.min(.3,Math.max(.1,(best?bd:60)/520));P.dvx=d.x*520;P.dvy=d.y*520;P.hitSet=new Set();P.dashMult=2.6*sm();P.dashExec=true;
  },
  smoke(){
    ringHit(52,1.0*sm(),40,{slow:2.5,stun:.7},'#b0b0b0');
    for(const e of E)if(e.type!=='boss'&&Math.hypot(e.x-P.x,e.y-P.y)<120){e.blind=2.2;e.state='idle'}
    P.inv=Math.max(P.inv,1.2);P.stealth=1.2;
  },
  venom(){P.buff={t:8,dmg:0,as:0,poison:true};fx({k:'ring',x:P.x,y:P.y,r0:4,r1:36,t:0,dur:.4,c:'#8ae04a'});puff(P.x,P.y,12,'#8ae04a',60)}
};
function castSkill(i){
  const sk=SKILLS[P.bound[i]];
  if(!sk)return;
  if(P.cd[i]>0)return;
  if(P.res<sk.cost){if(!P.noRes||P.noRes<=0){floatText(P.x,P.y-14,'No '+P.hero.res,'#8090ff');P.noRes=.8}return}
  P.res-=sk.cost;P.cd[i]=sk.cd*(1-Math.min(.6,(P.mods.cdr||0)/100));P.cdMax[i]=Math.max(.1,P.cd[i]);P.att=null;P.swing=0;SKILL[sk.id]();Snd.spell();
}
// 3-hit combo: every swing has wind-up, strike and recovery. The 3rd hit is a heavy finisher.
// Movement stays free between swings, but a swing commits you (locked facing, slow steps, forward lunge).
function doAttack(){
  if(P.atkT>0||P.att)return;
  const h=P.hero;
  P.combo=(P.comboT>0)?(P.combo+1)%3:0;
  const heavy=P.combo===2;
  const d=aimDir(h.melee?70:200,!h.melee);P.face=d;
  const dur=P.atkCd*(heavy?1.7:1)/(1+(P.buff&&P.buff.as||0));
  P.att={t:0,wind:heavy?.14:.07,dur,dir:d,heavy,hit:false};
  P.atkT=dur;P.swing=dur;
  Snd.swing();
}
function updateAttack(dt){
  const a=P.att;if(!a)return;
  a.t+=dt;
  if(a.t<a.wind+.07&&P.hero.melee){const sp=(a.heavy?150:105)*(a.t>=a.wind?1:.5);move(P,a.dir.x*sp*dt,a.dir.y*sp*dt)}
  if(!a.hit&&a.t>=a.wind){a.hit=true;strike(a)}
  if(a.t>=a.dur){P.att=null;P.comboT=.5}
}
function strike(a){
  const h=P.hero,d=a.dir,hv=a.heavy;
  hitCount=0;
  if(h.melee){
    const range=h.melee.range*(hv?1.3:1),arc=(h.melee.arc+(hv?50:0))*Math.PI/180;
    fx({k:'slash',x:P.x,y:P.y,dir:Math.atan2(d.y,d.x),arc,range,t:0,dur:hv?.2:.14,c:hv?'#ffffff':h.light,w:hv?6:4});
    for(const e of E.slice()){
      if(e.dead)continue;
      const dx=e.x-P.x,dy=e.y-P.y,dd=Math.hypot(dx,dy);
      if(dd>range+e.hw)continue;
      const ang=Math.acos(clamp((dx*d.x+dy*d.y)/(dd||1),-1,1));
      if(ang<arc/2||dd<e.hw+4)hitEnemy(e,hv?1.7:1,dx,dy,hv?150:90,{stun:hv?.4:.18,heavy:hv});
    }
    cutAround(P.x+d.x*15,P.y+d.y*15,hv?26:18);
  }else{
    const ang=Math.atan2(d.y,d.x),kind=h.ranged==='arrow'?'arrow':'bolt';
    if(hv)shoot(kind,ang,1.6,h.ranged==='arrow'?{pierce:true,speed:300}:{aoe:24,speed:180});
    else shoot(kind,ang,1,P.mods.pierce?{pierce:true}:null);
    move(P,-d.x*(hv?4:2),-d.y*(hv?4:2));   // small recoil
    Snd.shoot();
  }
  if(hv&&P.mods.finisherRing)ringHit(46,1.7*P.mods.finisherRing,120,{},'#ffe9a0');
  if(hv){shake=Math.max(shake,4);fx({k:'ring',x:P.x+d.x*10,y:P.y+d.y*10,r0:4,r1:26,t:0,dur:.2,c:'#ffffff'});Snd.boom()}
  if(hitCount>0)hitStop=Math.max(hitStop,hv?.11:.05);
}
function updateProjectiles(dt){
  for(const p of PR){
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(solidAt(p.x,p.y)){p.life=0;cutAround(p.x,p.y,12);if(p.aoe)explode(p);continue}
    for(const e of E){
      if(e.dead||p.hit.has(e)||e.state==='dormant'&&e.type!=='boss')continue;
      if(Math.abs(p.x-e.x)<e.hw+3&&Math.abs(p.y-e.y)<e.hh+4){
        p.hit.add(e);
        if(p.aoe){explode(p);p.life=0;break}
        hitEnemy(e,p.mult,p.vx,p.vy,50,{slow:p.slow,crit:p.crit});
        if(!p.pierce){p.life=0;break}
      }
    }
  }
  PR=PR.filter(p=>p.life>0);
}
function explode(p){
  fx({k:'ring',x:p.x,y:p.y,r0:4,r1:p.aoe,t:0,dur:.3,c:'#ff9030'});puff(p.x,p.y,14,'#ff9030',90);Snd.boom();
  for(const e of E.slice())if(!e.dead&&dist(e,p)<p.aoe+e.hw)hitEnemy(e,p.mult,e.x-p.x,e.y-p.y,80,{fire:true});
}
function updateEnemyProjectiles(dt){
  for(const p of EP){
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(solidAt(p.x,p.y)){p.life=0;continue}
    if(Math.hypot(p.x-P.x,p.y-P.y)<6){hurtPlayer(p.dmg,p.x-p.vx,p.y-p.vy);p.life=0}
  }
  EP=EP.filter(p=>p.life>0);
}
function spore(e,ang,sp,dmg){EP.push({x:e.x,y:e.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,dmg,life:3})}

// ---------- enemy AI ----------
const AI={
  beetle(e,dt,d,ux,uy,sp){
    switch(e.state){
      case'idle':wander(e,dt,sp);if(d<e.aggro)e.state='chase';break;
      case'chase':
        move(e,ux*sp*dt,uy*sp*dt);
        if(d<62&&e.cd<=0&&attackers()<2){e.state='wind';e.t=.65;e.dx=ux;e.dy=uy}
        if(d>e.aggro*2.2)e.state='idle';break;
      case'wind':e.t-=dt;e.dx=ux;e.dy=uy;if(e.t<=0){e.state='charge';e.t=.38}break;
      case'charge':e.t-=dt;move(e,e.dx*135*dt,e.dy*135*dt);if(e.t<=0){e.state='chase';e.cd=2}break;
    }
  },
  wolf(e,dt,d,ux,uy,sp){
    switch(e.state){
      case'idle':wander(e,dt,sp);if(d<e.aggro)e.state='chase';break;
      case'chase':
        move(e,ux*sp*dt,uy*sp*dt);
        if(d<64){e.state='circle';e.t=rand(1.2,2);e.dir=Math.random()<.5?1:-1}
        if(d>e.aggro*2.2)e.state='idle';break;
      case'circle':{
        const tx=-uy*e.dir,ty=ux*e.dir,rad=(d-52)*.04;
        move(e,(tx*.9+ux*rad)*sp*dt,(ty*.9+uy*rad)*sp*dt);
        e.t-=dt;if(e.t<=0&&attackers()<2){e.state='wind';e.t=.4;e.dx=ux;e.dy=uy}else if(e.t<=0)e.t=.5;
        break}
      case'wind':e.t-=dt;e.dx=ux;e.dy=uy;if(e.t<=0){e.state='charge';e.t=.32}break;
      case'charge':e.t-=dt;move(e,e.dx*185*dt,e.dy*185*dt);if(e.t<=0){e.state='chase';e.cd=1}break;
    }
  },
  shroom(e,dt,d,ux,uy,sp){
    if(e.state==='idle'){wander(e,dt,sp);if(d<e.aggro)e.state='chase';return}
    if(d<70)move(e,-ux*sp*1.3*dt,-uy*sp*1.3*dt);else if(d>105)move(e,ux*sp*dt,uy*sp*dt);
    if(e.cd<=0&&d<160){spore(e,Math.atan2(uy,ux),75,e.dmg);e.cd=2.3}
    if(d>e.aggro*2.2)e.state='idle';
  },
  bat(e,dt,d,ux,uy,sp){
    switch(e.state){
      case'idle':wander(e,dt,sp);if(d<e.aggro)e.state='chase';break;
      case'chase':{
        const w=Math.sin(time*7+e.anim)*.9;
        move(e,(ux-uy*w)*sp*dt,(uy+ux*w)*sp*dt);
        if(d<70&&e.cd<=0&&attackers()<2){e.state='wind';e.t=.4;e.dx=ux;e.dy=uy}
        if(d>e.aggro*2.2)e.state='idle';break}
      case'wind':e.t-=dt;e.dx=ux;e.dy=uy;if(e.t<=0){e.state='charge';e.t=.35}break;
      case'charge':e.t-=dt;move(e,e.dx*175*dt,e.dy*175*dt);if(e.t<=0){e.state='chase';e.cd=1.8}break;
    }
  },
  brute(e,dt,d,ux,uy,sp){
    if(e.state==='idle'){wander(e,dt,sp);if(d<e.aggro)e.state='chase';return}
    if(e.tele){
      e.tele.t-=dt;
      if(e.tele.t<=0){
        fx({k:'ring',x:e.tele.x,y:e.tele.y,r0:6,r1:e.tele.r,t:0,dur:.3,c:'#c070ff'});shake=4;Snd.boom();
        if(Math.hypot(P.x-e.tele.x,P.y-e.tele.y)<e.tele.r)hurtPlayer(e.dmg*1.3,e.tele.x,e.tele.y);
        for(let i=0;i<8;i++)spore(e,i*TAU/8,70,e.dmg*.4);
        e.tele=null;e.cd=3;
      }
      return;
    }
    if(d>24)move(e,ux*sp*dt,uy*sp*dt);
    if(d<50&&e.cd<=0)e.tele={x:e.x,y:e.y,r:38,t:.8,dur:.8};
    if(d>e.aggro*2.2)e.state='idle';
  },
  boss(e,dt,d,ux,uy,sp){
    if(e.state==='dormant'){if(d<150){e.state='fight';e.cd=1.5;toast(`${bossOf(e).name} awakens!`,'#ff8060');Snd.boom()}return}
    const enr=e.hp<e.maxHp*.5;
    if(e.tele){
      e.tele.t-=dt;
      if(e.tele.t<=0){
        fx({k:'ring',x:e.tele.x,y:e.tele.y,r0:6,r1:e.tele.r,t:0,dur:.3,c:'#ff7040'});shake=7;Snd.boom();
        if(Math.hypot(P.x-e.tele.x,P.y-e.tele.y)<e.tele.r)hurtPlayer(e.dmg*1.2,e.tele.x,e.tele.y);
        e.tele=null;e.cd=enr?1.8:2.6;
      }
      return;
    }
    if(d>28)move(e,ux*sp*(enr?1.4:1)*dt,uy*sp*(enr?1.4:1)*dt);
    if(e.cd<=0){
      const v=e.variant,my=!!v;
      const SEQ={mycelia:[['spores','fan','summon','rain'],['spores','rain','summon','slam','fan']],drowned:[['rain','fan','summon','spores'],['rain','spores','summon','slam','fan']],warden:[['slam','fan','rain','summon'],['slam','rain','fan','slam','summon']],king:[['fan','summon','slam','rain'],['spores','fan','summon','slam','rain']],heartwood:[['slam','fan','spores','rain','summon'],['spores','rain','slam','fan','summon','slam']]};
      const seq=SEQ[v]?SEQ[v][enr?1:0]:(enr?['slam','spores','summon','fan']:['slam','spores','fan']);
      const a=seq[e.seq++%seq.length];
      if(a==='slam')e.tele={x:e.x,y:e.y,r:v==='heartwood'?72:v==='warden'?66:my?60:54,t:.9,dur:.9};
      else if(a==='rain'){for(let i=0;i<4;i++){const a2=rand(0,TAU),rr=i?rand(20,70):0;hazardAt(P.x+Math.cos(a2)*rr,P.y+Math.sin(a2)*rr,26,e.dmg*.9,.9)}e.cd=enr?1.8:2.4;Snd.spell()}
      else if(a==='spores'){const n=my?16:12;for(let i=0;i<n;i++)spore(e,i*TAU/n+e.rot,70,e.dmg*.5);e.rot+=.26;e.cd=enr?1.6:2.2;Snd.spell()}
      else if(a==='fan'){const b=Math.atan2(uy,ux);for(let i=-2;i<=2;i++)spore(e,b+i*.22,95,e.dmg*.5);e.cd=enr?1.6:2.2;Snd.spell()}
      else if(my){
        const sm={mycelia:['shroom',6,'Spore pods burst open!'],drowned:['bat',6,'The Matron calls the swarm!'],warden:['wolf',4,'Rust wolves leap from the shadows!'],king:['skeleton',5,'Skeletons claw out of the ground!'],heartwood:['beetle',6,'Heart-beetles swarm from the roots!']}[v];
        if(E.filter(o=>!o.dead&&o.type===sm[0]).length<sm[1])for(let i=0;i<2;i++){const s2=makeEnemy(sm[0],e.x+(i?-30:30),e.y+22,Math.max(1,e.lvl-3));s2.state='chase';if(boxFree(s2.x,s2.y,s2.hw,s2.hh))E.push(s2)}
        e.cd=1.5;toast(sm[2],'#c070ff');
      }else{
        if(E.filter(o=>!o.dead&&o.type==='beetle').length<5)for(let i=0;i<2;i++){const s=makeEnemy('beetle',e.x+(i?-26:26),e.y+20,Math.max(1,e.lvl-3));s.state='chase';if(boxFree(s.x,s.y,s.hw,s.hh))E.push(s)}
        e.cd=1.5;toast('Beetles crawl out of the bark!','#ffb070');
      }
    }
  }
};
AI.skeleton=AI.beetle;AI.ghost=AI.bat;
function hazardAt(x,y,r,dmg,delay){
  mark(x,y,r,delay);
  later(delay,()=>{fx({k:'ring',x,y,r0:4,r1:r,t:0,dur:.3,c:'#c070ff'});puff(x,y,10,'#c070ff',60);Snd.boom();if(Math.hypot(P.x-x,P.y-y)<r)hurtPlayer(dmg,x,y)});
}
function attackers(){let n=0;for(const e of E)if(e.state==='wind'||e.state==='charge')n++;return n}
function wander(e,dt,sp){
  e.t-=dt;
  if(e.t<=0){e.t=rand(1,2.5);const a=rand(0,TAU);e.wx=Math.cos(a);e.wy=Math.sin(a);e.moving=Math.random()<.6}
  if(e.moving)move(e,e.wx*sp*.4*dt,e.wy*sp*.4*dt);
}
function updateEnemy(e,dt){
  if(e.poison){
    const po=e.poison;po.t-=dt;po.acc+=po.dps*dt;po.tick+=dt;
    if(po.tick>=.5){const dd=Math.max(1,Math.round(po.acc));po.acc=0;po.tick=0;e.hp-=dd;e.flash=.05;floatText(e.x,e.y-12,dd,'#8ae04a');if(e.hp<=0&&!e.dead){killEnemy(e);return}}
    if(po.t<=0)e.poison=null;
  }
  if(e.blind>0){e.blind-=dt;e.flash=Math.max(0,e.flash-dt);wander(e,dt,e.speed*.5);return}
  e.flash=Math.max(0,e.flash-dt);e.cd-=dt;e.hitCd-=dt;e.slow-=dt;e.stun-=dt;e.anim+=dt*6;
  if(Math.abs(e.kx)+Math.abs(e.ky)>1){move(e,e.kx*dt,e.ky*dt);const f=Math.pow(.02,dt);e.kx*=f;e.ky*=f}
  if(e.stun>0)return;
  const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
  AI[e.type](e,dt,d,dx/d,dy/d,e.speed*(e.slow>0?.5:1));
  if(d<e.hw+P.hw+3&&e.hitCd<=0&&e.state!=='dormant'){
    hurtPlayer(e.dmg*(e.state==='charge'?1.5:e.type==='boss'?.6:1),e.x,e.y);e.hitCd=.9;
  }
}
function separate(){
  for(let i=0;i<E.length;i++)for(let j=i+1;j<E.length;j++){
    const a=E[i],b=E[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.hw+b.hw;
    if(d>0&&d<m){const p=(m-d)*.25,ux=dx/d,uy=dy/d;move(a,-ux*p,-uy*p);move(b,ux*p,uy*p)}
  }
}

// ---------- interaction ----------
function nearestInteract(){
  let best=null,bd=26;
  for(const n of NP){const d=Math.hypot(n.x-P.x,n.y-P.y);if(d<bd){bd=d;best={k:'npc',o:n,x:n.x,y:n.y-16}}}
  for(const c of CH){if(c.open)continue;const d=Math.hypot(c.x-P.x,c.y-P.y);if(d<bd){bd=d;best={k:'chest',o:c,x:c.x,y:c.y-12}}}
  for(const p of M.props){if(p.k!=='sign')continue;const sx=(p.tx+.5)*TS,sy=(p.ty+.5)*TS,d=Math.hypot(sx-P.x,sy-P.y);if(d<24&&d<bd){bd=d;best={k:'sign',o:p,x:sx,y:sy-12}}}
  // vines in front of the player
  const fx2=P.x+P.face.x*14,fy2=P.y+P.face.y*14;
  if(M.t[Math.floor(fy2/TS)*M.w+Math.floor(fx2/TS)]===T.VINE&&bd>12)best={k:'vine',x:Math.floor(fx2/TS)*TS+8,y:Math.floor(fy2/TS)*TS-4};
  return best;
}
function say(name,pages,onEnd){ui={mode:'dialog',d:{name,pages,i:0,onEnd}}}
function interact(it){
  if(it.k==='chest'){openChest(it.o);return}
  if(it.k==='sign'){say('Signpost',[it.o.text]);return}
  if(it.k==='vine'){
    if(flags.sickle){
      cutVines();
      say('Thorn Vines',[M.id==='glade'?'You cut through the thorn vines with the Thornsickle! A path to Amber Hollow opens to the east.':'The Thornsickle makes short work of the thorns. The way east is open!']);
    }else say('Thorn Vines',['Thick thorny vines block the way. You need something sharp to cut through.']);
    return;
  }
  const n=it.o;
  if(n.walk){say(n.name,[pick(n.lines)]);return}
  if(n.id==='elder'){
    if(flags.stage===0)say(n.name,['Welcome to Hearthmoor, traveler. Our village sits at the edge of the Spicewoods.','Something stirs in the Hollow Oak, north of Ember Glade. Beetles and wolves grow bolder every night.','Defeat the guardian, Old Barkfather, and bring me what he protects. Visit the Smith and the Alchemist first!'],()=>{flags.stage=1;toast('Quest: '+QUEST[1]);save()});
    else if(flags.boss&&!flags.rewarded)say(n.name,['You did it! The Thornsickle... with it, the thorn vines at the east edge of Ember Glade will finally yield.','Take this reward. Your deeds have earned the village a share of the forest: the Smith, the Alchemist and the Tavern can now be expanded.'],()=>{
      flags.rewarded=true;if(flags.stage<4)flags.stage=4;P.gold+=150;const it2=genItem(9,{minR:3});if(!addToBag(it2))dropItem(P.x,P.y+10,it2);toast('Received 150g and '+it2.name,RARITY[it2.r].c);save()});
    else if(flags.stage<3)say(n.name,['The road east leads into Ember Glade. The Hollow Oak is at its northern end. Be careful out there.']);
    else if(flags.stage===3)say(n.name,['Come back once you have defeated Old Barkfather and opened the oak chest.']);
    else if(flags.stage===4)say(n.name,['The thorn vines at the east edge of Ember Glade will yield to your Thornsickle. Beyond them lies Amber Hollow.']);
    else if(flags.stage===5)say(n.name,['Amber Hollow is thick with spores. The Spore Warren lies in the far north. Mother Mycelia rules there. Take care.']);
    else if(flags.stage===6)say(n.name,['The Wooden Boots! With them you can wade the flooded ford east of Amber Hollow, into the Mistwater Marsh.']);
    else if(flags.stage===7)say(n.name,['Mistwater Marsh... Rustpeak rises beyond it, but a gorge cuts it off. We would need a hook to cross. Old tales speak of a Sunken Shrine in the marsh, guarded by the Drowned Matron.']);
    else if(flags.stage===8)say(n.name,['The Grapple Hook! With it you can cross the gorge at the east edge of the marsh. Rustpeak awaits.']);
    else if(flags.stage===9)say(n.name,['Rustpeak is a hard land of rust wolves and brutes. The old mine lies in the north-east. Its warden has slept there for ages.']);
    else if(flags.stage===10)say(n.name,['The Rust Warden is scrap, and you carry the Miner\'s Lantern! A dark tunnel at the east edge of Rustpeak leads to Ghostbark Grove. Beware the dead.']);
    else if(flags.stage===11)say(n.name,['Ghostbark Grove... the Hollow King sleeps in the crypt at its north-eastern end. Bring him down.']);
    else if(flags.stage===12)say(n.name,['The Hollow King is dust, and the Heartseed is yours! A gate of living roots at the east edge of Ghostbark Grove will open for it. Beyond lies the Heart of Spicewood.']);
    else if(flags.stage===13)say(n.name,['The old tree at the Heart of Spicewood is the source of the blight. End it, hero. All of us are counting on you.']);
    else say(n.name,['You saved the Spicewoods! The village will never forget your name. Keep exploring and grow stronger, there is always more to find.']);
  }else if(n.id==='smith'){
    say(n.name,[baseLv('smithy')>1?'Back at the anvil! What can I do for you?':'My forge is ready. Bring me ore, leather and wood and I will make you something good.'],()=>{ui=smithMenu()});
  }else if(n.id==='alch'){
    say(n.name,['Potions, elixirs, anything that bubbles! Herbs from the glade are all I need.'],()=>{ui=alchMenu()});
  }else if(n.id==='tavern'){
    say(n.name,['Welcome to the Hearth! Rest your bones, or fill your belly.'],()=>{ui=tavernMenu()});
  }else if(n.id==='stash'){
    say(n.name,['I keep the village stores. Bring me wood and ore and I will build more shelves for you.'],()=>{ui=storeMenu()});
  }
}
function menu(title,opts,closable,foot){return{mode:'menu',title,opts,sel:0,closable,foot}}

// ---------- update ----------
function updatePlay(dt){
  P.comboT=(P.comboT||0)-dt;updateAttack(dt);
  if(P.buff){P.buff.t-=dt;if(P.buff.t<=0)P.buff=null}
  if(P.buffs.length){for(const b of P.buffs)b.t-=dt;if(P.buffs.some(b=>b.t<=0)){P.buffs=P.buffs.filter(b=>b.t>0);recalc();toast('A buff wore off')}}
  P.stealth=Math.max(0,P.stealth-dt);
  if(P.mods.regenHp)P.hp=Math.min(P.maxHp,P.hp+P.mods.regenHp*dt);
  for(const d of DELAY)d.t-=dt;
  for(const d of DELAY.filter(d=>d.t<=0))d.fn();
  DELAY=DELAY.filter(d=>d.t>0);
  for(const t of TRAPS){t.t-=dt;for(const e of E){if(!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<e.hw+8){t.t=0;aoeAt(t.x,t.y,26,t.mult,60,{slow:3},'#7fd06a');break}}}
  TRAPS=TRAPS.filter(t=>t.t>0);
  P.atkT-=dt;P.rollCd-=dt;P.potCd-=dt;P.inv-=dt;P.flash-=dt;P.swing-=dt;P.noRes=(P.noRes||0)-dt;
  P.cd[0]-=dt;P.cd[1]-=dt;
  // resource
  if(P.hero.id==='warrior'){P.rageT-=dt;if(P.rageT<=0)P.res=Math.max(0,P.res-5*dt)}
  else P.res=Math.min(P.resMax,P.res+P.regen*dt);

  const ax=Input.axis();
  if(P.kx||P.ky){move(P,P.kx*dt,P.ky*dt);P.kx*=Math.pow(.003,dt);P.ky*=Math.pow(.003,dt);if(Math.abs(P.kx)+Math.abs(P.ky)<5)P.kx=P.ky=0}
  if(Input.hit('attack'))P.buf=.18;
  P.buf=(P.buf||0)-dt;
  if(P.rollT>0){
    P.rollT-=dt;move(P,P.rvx*dt,P.rvy*dt);
  }else if(P.dashT>0){
    P.dashT-=dt;move(P,P.dvx*dt,P.dvy*dt);
    for(const e of E)if(!e.dead&&!P.hitSet.has(e)&&dist(e,P)<e.hw+12){P.hitSet.add(e);hitEnemy(e,P.dashMult,P.face.x,P.face.y,90,{crit:P.dashExec&&e.hp<e.maxHp*.4})}
    cutAround(P.x,P.y,14);
    if(Math.random()<.8)puff(P.x,P.y,1,P.hero.light,20);
  }else{
    P.moving=ax.l>.1;
    if(P.moving){
      if(!P.att)P.face={x:ax.x/ax.l,y:ax.y/ax.l};
      P.anim+=dt*9;
      const sf=P.att?.2:1;
      move(P,ax.x*P.spd*dt*sf,ax.y*P.spd*dt*sf);
    }
    if(Input.down('attack')||P.buf>0){if(P.atkT<=0){P.buf=0;doAttack()}}
    if(Input.hit('skill1')||Input.down('skill1'))castSkill(0);
    if(Input.hit('skill2')||Input.down('skill2'))castSkill(1);
    if(Input.hit('roll')&&P.rollCd<=0){
      P.att=null;P.swing=0;const d=P.face;P.rollT=.3;P.rollCd=.8*(1-(P.mods.rollCd||0)/100);P.rvx=d.x*215;P.rvy=d.y*215;P.inv=Math.max(P.inv,.36);Snd.roll();
    }
    if(Input.hit('potion')&&P.potCd<=0){
      if(P.potions>0&&P.hp<P.maxHp){P.potions--;P.potCd=1;const h=Math.round((P.maxHp*.45+10)*(1+(P.mods.potPct||0)/100)*(1+.25*(baseLv('alch')-1)));P.hp=Math.min(P.maxHp,P.hp+h);floatText(P.x,P.y-14,'+'+h,'#60ff80');puff(P.x,P.y,8,'#60ff80',40);Snd.pickup()}
      else if(P.potions<=0)toast('No potions left (buy more from Pip)','#ff8070');
    }
    if(Input.hit('interact')||Input.hit('enter')){const it=nearestInteract();if(it){interact(it);return}}
  }
  if(Input.hit('tree')){ui={mode:'tree',row:'nodes',b:0,n:0,ci:0};Snd.menu();return}
  if(Input.hit('inv')){ui={mode:'inv',focus:'bag',bi:0,ei:0,sellArm:-1};Snd.menu();return}
  if(Input.hit('pause')||Input.hit('back')){openPause();return}
  if(Input.hit('mute'))toast(Snd.toggle()?'Sound on':'Sound off');

  updateAmbient(dt);
  Music.play(E.some(e=>e.type==='boss'&&e.state==='fight'&&!e.dead)?'boss':ZONEMUSIC[M.id]);
  if(M.id==='spore'||M.id==='mine'||M.id==='crypt')updateBlocks(dt);
  for(const e of E)updateEnemy(e,dt);
  E=E.filter(e=>!e.dead);
  separate();
  updateProjectiles(dt);updateEnemyProjectiles(dt);pickups(dt);
  // doors
  if(M.rooms)updateRooms();
  if(M.gates)tryKeyDoor();
  // warps
  if(fade.dir===0)for(const w of M.warps){
    if(P.x>w.x&&P.x<w.x+w.w&&P.y>w.y&&P.y<w.y+w.h){
      if(w.need&&!flags[w.need]){P.x=w.x-4;if(!P.needMsg||P.needMsg<time-2.5){P.needMsg=time;toast(w.needText,'#ff8070')}break}
      startFade(()=>loadMap(w.to,w.tx,w.ty));break}
  }
  // camera
  const tx=M.w*TS<=W?(M.w*TS-W)/2:clamp(P.x-W/2,0,M.w*TS-W),ty=M.h*TS<=H?(M.h*TS-H)/2:clamp(P.y-H/2,0,M.h*TS-H);
  cam.x+=(tx-cam.x)*Math.min(1,dt*8);cam.y+=(ty-cam.y)*Math.min(1,dt*8);
}
const VOL=[0,.3,.6,.9];
const SFXV=[0,.4,.7,1];
function nextOf(list,v){let i=list.findIndex(x=>Math.abs(x-v)<.05);return list[(i+1)%list.length]}
function openPause(){
  ui=menu('Paused',[
    {t:'Resume',fn(){}},
    {t:'Save game',fn(){save();toast('Game saved')}},
    {t:()=>`Music: ${Math.round(Snd.cfg.music*100)}%`,fn(){Snd.setMusic(nextOf(VOL,Snd.cfg.music));Snd.init();return true}},
    {t:()=>`Sound effects: ${Math.round(Snd.cfg.sfx*100)}%`,fn(){Snd.setSfx(nextOf(SFXV,Snd.cfg.sfx));Snd.menu();return true}},
    {t:'Controls',fn(){showControls()}},
    {t:'Quit to title',fn(){save();scene='title';tsel=0;ui=null;Music.play('title')}}],true);
}
function showControls(){
  say('Controls',[
    'Move: WASD or arrow keys. Attack: J (hit up to three times in a row for a heavy finisher). Roll: Space, you cannot be hit while rolling.',
    'Skills: K and L (change them in the skill menu). Potion: Q. Interact, talk, open chests: E or Enter. Cut bushes, pots, logs and ore with your weapon.',
    'Bag: I. Skills and talents: T. Pause: P. Back or close: Backspace. Mute: M. On a phone use the on-screen stick and buttons.',
    'Tips: sealed rooms open when every enemy is defeated. Push stone blocks by walking into them. Gate items found in dungeons open new areas.'
  ],()=>{ui=null;openPause()});
}
function updateFx2(dt){
  for(const f of FX){
    if(f.k==='p'){f.age=(f.age||0)+dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92;f.vy+=(f.g===undefined?30:f.g)*dt}
    else f.t+=dt;
  }
  FX=FX.filter(f=>f.k==='p'?f.age<f.t:f.t<f.dur);
  for(const f of FT){f.t-=dt;f.y-=22*dt}
  FT=FT.filter(f=>f.t>0);
  for(const t of toasts)t.t-=dt;
  toasts=toasts.filter(t=>t.t>0);
  if(banner.t>0)banner.t-=dt;
  shake=Math.max(0,shake-dt*20);
}

// ---------- UI logic ----------
function updateUI(dt){
  if(ui.mode==='dialog'){
    if(Input.confirm()||Input.hit('back'))advanceDialog();
  }else if(ui.mode==='menu'){
    const n=ui.opts.length;
    if(Input.hit('up')){ui.sel=(ui.sel+n-1)%n;Snd.menu()}
    if(Input.hit('down')){ui.sel=(ui.sel+1)%n;Snd.menu()}
    if(Input.confirm()){runMenu(ui,ui.sel)}
    else if(ui.closable&&(Input.hit('back')||Input.hit('pause')))ui=null;
  }else if(ui.mode==='inv')updateInv();
  else if(ui.mode==='tree')updateTree();
}
function advanceDialog(){
  const d=ui.d;d.i++;Snd.menu();
  if(d.i>=d.pages.length){const f=d.onEnd;ui=null;if(f)f()}
}
function runMenu(m,i){
  const o=m.opts[i];if(!o)return;
  Snd.menu();
  const keep=o.fn();
  if(keep!==true&&ui===m)ui=null;
}
function updateInv(){
  const s=ui,COLS=5;
  const bi=s.bi;
  if(Input.cancel()){ui=null;return}
  const mv=(n)=>{Snd.menu();s.sellArm=-1;return n};
  if(s.focus==='bag'){
    if(Input.hit('left')){if(bi%COLS===0)s.focus='eq';else s.bi=mv(bi-1)}
    else if(Input.hit('right'))s.bi=Math.min(bagCap()-1,mv(bi+1));
    else if(Input.hit('up'))s.bi=Math.max(0,mv(bi-COLS));
    else if(Input.hit('down'))s.bi=Math.min(bagCap()-1,mv(bi+COLS));
    if(Input.confirm()&&P.bag[s.bi]){equipFromBag(s.bi);s.sellArm=-1}
    if(Input.hit('sell')&&P.bag[s.bi])sellBag(s.bi);
  }else{
    if(Input.hit('right'))s.focus='bag';
    else if(Input.hit('up'))s.ei=Math.max(0,mv(s.ei-1));
    else if(Input.hit('down'))s.ei=Math.min(SLOTS.length-1,mv(s.ei+1));
    if(Input.confirm())unequip(SLOTS[s.ei]);
  }
  for(let k=1;k<=4;k++)if(Input.hit('n'+k))spend(['str','dex','int','vit'][k-1]);
}
function spend(k){if(P.pts<=0)return;P.pts--;P.alloc[k]++;recalc();Snd.pickup()}
function sellBag(i){
  const it=P.bag[i];if(!it)return;
  if(it.r>=3&&ui.sellArm!==i){ui.sellArm=i;toast('Press sell again to confirm','#ffb070');return}
  P.gold+=sellValue(it);P.bag.splice(i,1);ui.sellArm=-1;Snd.coin();
}


// ---------- skill tree ----------
function knownSkills(){
  const ids=P.hero.skills.map(k=>k.id);
  for(const id in P.learned){const n=NODEBYID[id];if(n&&n.type==='skill')ids.push(n.skill)}
  return ids;
}
function learnReason(n){
  if(P.learned[n.id])return'Already learned';
  const br=TREES[n.hero][n.b];
  if(n.n>0&&!P.learned[br.nodes[n.n-1].id])return'Learn the previous talent first';
  if(n.type==='cap'&&TREES[n.hero].some((b,bi)=>bi!==n.b&&P.learned[b.nodes[3].id]))return'Only one specialization allowed';
  if(P.sp<n.cost)return`Needs ${n.cost} skill point${n.cost>1?'s':''}`;
  return'';
}
function learnNode(n){
  const r=learnReason(n);
  if(r){toast(r,'#ff8070');return}
  P.sp-=n.cost;P.learned[n.id]=true;recalc();Snd.level();puff(P.x,P.y,12,'#8fd0ff',70);
}
function bindSkill(id,slot){
  if(!SKILLS[id])return;
  const old=P.bound[slot];
  if(P.bound[1-slot]===id)P.bound[1-slot]=old;
  P.bound[slot]=id;P.cd[0]=P.cd[1]=0;Snd.pickup();
  toast(`${SKILLS[id].name} bound to ${slot?'L':'K'}`,'#8fd0ff');
}
function respec(){
  const cost=40*P.lvl;
  if(P.gold<cost){toast(`Respec costs ${cost} gold`,'#ff8070');return}
  let back=0;for(const id in P.learned)back+=NODEBYID[id].cost;
  if(!back){toast('Nothing to reset','#ff8070');return}
  P.gold-=cost;P.sp+=back;P.learned={};P.bound=P.hero.skills.map(k=>k.id);recalc();Snd.coin();toast('Talents reset');
}
function updateTree(){
  const s=ui,tr=TREES[P.hero.id];
  if(Input.cancel()||Input.hit('tree')){ui=null;return}
  const chips=knownSkills();
  if(s.row==='chips'){
    if(Input.hit('left')){s.ci=(s.ci+chips.length-1)%chips.length;Snd.menu()}
    if(Input.hit('right')){s.ci=(s.ci+1)%chips.length;Snd.menu()}
    if(Input.hit('down')){s.row='nodes';Snd.menu()}
    if(Input.hit('n1'))bindSkill(chips[s.ci],0);
    if(Input.hit('n2'))bindSkill(chips[s.ci],1);
  }else{
    if(Input.hit('left')){s.b=(s.b+2)%3;Snd.menu()}
    if(Input.hit('right')){s.b=(s.b+1)%3;Snd.menu()}
    if(Input.hit('down')){s.n=Math.min(3,s.n+1);Snd.menu()}
    if(Input.hit('up')){if(s.n===0){s.row='chips';s.ci=Math.min(s.ci,chips.length-1)}else s.n--;Snd.menu()}
    const nd=tr[s.b].nodes[s.n];
    if(Input.confirm())learnNode(nd);
    if(nd.type==='skill'&&P.learned[nd.id]){if(Input.hit('n1'))bindSkill(nd.skill,0);if(Input.hit('n2'))bindSkill(nd.skill,1)}
  }
}
function drawTree(){
  const s=ui,tr=TREES[P.hero.id],chips=knownSkills();
  cx.fillStyle='rgba(8,4,2,.88)';cx.fillRect(0,0,W,H);
  panel(4,4,W-8,H-8);
  text(`${P.hero.name} the ${P.hero.cls}: Skills & Talents`,12,9,P.hero.light,9,'left',true);
  text(`Skill points: ${P.sp}`,W-14,9,P.sp>0?'#8fd0ff':'#7a6a58',9,'right',true);
  // known skills
  text('Known skills (select, then 1 = bind K, 2 = bind L)',12,22,'#a89878',7);
  chips.forEach((id,i)=>{
    const sk=SKILLS[id],x=12+i*84,y=32,sel=s.row==='chips'&&s.ci===i;
    cx.fillStyle=sel?'#4a3418':'#241810';cx.fillRect(x,y,80,20);cx.strokeStyle=sel?'#fff':'#5a4228';cx.strokeRect(x+.5,y+.5,79,19);
    text(sk.name,x+4,y+2,'#ffe9a0',7);
    const slot=P.bound.indexOf(id);
    text(slot>=0?`Bound: ${slot?'L':'K'}`:`${sk.cost} / ${sk.cd}s`,x+4,y+11,slot>=0?'#8fd0ff':'#a89878',7);
    reg(x,y,80,20,()=>{s.row='chips';s.ci=i});
  });
  // branches
  tr.forEach((br,bi)=>{
    const x=10+bi*157;
    text(br.name,x+72,60,br.color,9,'center',true);
    br.nodes.forEach((nd,ni)=>{
      const y=72+ni*28,learned=!!P.learned[nd.id],sel=s.row==='nodes'&&s.b===bi&&s.n===ni;
      const can=!learned&&!learnReason(nd);
      cx.fillStyle=learned?'#2e3a1c':sel?'#4a3418':'#241810';cx.fillRect(x,y,144,24);
      cx.strokeStyle=sel?'#fff':learned?br.color:can?'#a8884a':'#4a3a28';cx.lineWidth=1;cx.strokeRect(x+.5,y+.5,143,23);
      if(ni>0){cx.fillStyle=P.learned[br.nodes[ni-1].id]?br.color:'#4a3a28';cx.fillRect(x+72,y-4,1,4)}
      const tag=nd.type==='skill'?'ACTIVE':nd.type==='cap'?'CAPSTONE':'PASSIVE';
      text(nd.name,x+5,y+2,learned?'#d8f0b0':can?'#ffe9a0':'#8a7a62',8,'left',true);
      text(learned?'LEARNED':`${tag}  ${nd.cost} pt`,x+5,y+13,learned?br.color:'#a89878',7);
      reg(x,y,144,24,()=>{s.row='nodes';s.b=bi;s.n=ni;learnNode(nd)});
    });
  });
  // detail
  const nd=s.row==='nodes'?tr[s.b].nodes[s.n]:null,csk=s.row==='chips'?SKILLS[chips[s.ci]]:null;
  panel(8,190,W-16,72);
  if(nd){
    text(nd.name,16,196,'#ffd040',9,'left',true);
    wrap(describeNode(nd),W-150,8).slice(0,3).forEach((l,i)=>text(l,16,208+i*10,'#f0e6d0',8));
    const r=P.learned[nd.id]?'':learnReason(nd);
    if(r)text(r,16,242,'#ff8070',7);
  }else if(csk){
    text(csk.name,16,196,'#ffd040',9,'left',true);
    wrap(csk.desc,W-150,8).slice(0,3).forEach((l,i)=>text(l,16,208+i*10,'#f0e6d0',8));
    text(`Cost ${csk.cost}   Cooldown ${csk.cd}s`,16,242,'#a89878',7);
  }
  const bt=(x,y,w,label,fn)=>{cx.fillStyle='#3a2814';cx.fillRect(x,y,w,13);cx.strokeStyle='#8a6a3a';cx.strokeRect(x+.5,y+.5,w-1,12);text(label,x+w/2,y+3,'#ffe9a0',7,'center');reg(x,y,w,13,fn)};
  if(nd)bt(W-130,196,112,P.learned[nd.id]?'Learned':'Learn (Enter)',()=>learnNode(nd));
  if(nd&&nd.type==='skill'&&P.learned[nd.id]){bt(W-130,212,54,'Bind K',()=>bindSkill(nd.skill,0));bt(W-72,212,54,'Bind L',()=>bindSkill(nd.skill,1))}
  if(csk){bt(W-130,196,54,'Bind K',()=>bindSkill(chips[s.ci],0));bt(W-72,196,54,'Bind L',()=>bindSkill(chips[s.ci],1))}
  bt(W-130,230,112,`Respec (${40*P.lvl}g)`,respec);
  bt(W-130,246,112,'Close',()=>{ui=null});
  text('Arrows move  Enter learn  1/2 bind  T/Backspace close',16,251,'#7a6a58',7);
}

// ---------- rendering: world ----------
function drawWorld(){
  const sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;
  const ox=-Math.round(cam.x)+Math.round(sx),oy=-Math.round(cam.y)+Math.round(sy);
  cx.save();cx.translate(ox,oy);
  // tiles (pre-rendered, softly blended)
  const lx=Math.max(0,Math.floor(cam.x)),ly=Math.max(0,Math.floor(cam.y));
  const lw=Math.min(M.w*TS-lx,W+2),lh=Math.min(M.h*TS-ly,H+2);
  if(lw>0&&lh>0)cx.drawImage(M.layer,lx,ly,lw,lh,lx,ly,lw,lh);
  drawGates();
  for(const l of M.labels){text(typeof l.text==='function'?l.text():l.text,l.x,l.y,'#ffe9a0',8,'center',true)}
  // portals
  for(const w of M.warps)if(w.portal){
    const a=.5+.3*Math.sin(time*4);cx.fillStyle=`rgba(255,220,120,${a})`;
    cx.beginPath();cx.ellipse(w.x+w.w/2,w.y+w.h/2,w.w/2,w.h/1.2,0,0,TAU);cx.fill();
  }
  // loot on the ground
  for(const d of DR){
    const b=Math.sin(d.t*5)*1.5;
    if(d.kind==='item'){
      const c=RARITY[d.item.r].c;
      if(d.item.r>=3){const g=cx.createLinearGradient(0,d.y-34,0,d.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,c);cx.globalAlpha=.55;cx.fillStyle=g;cx.fillRect(d.x-2,d.y-34,4,34);cx.globalAlpha=1}
      cx.fillStyle='#000';cx.fillRect(d.x-4,d.y-5+b,8,8);cx.fillStyle=c;cx.fillRect(d.x-3,d.y-4+b,6,6);cx.fillStyle='#fff';cx.fillRect(d.x-2,d.y-3+b,2,2);
    }else if(d.kind==='mat'){cx.fillStyle='#000';cx.fillRect(d.x-3,d.y-3+b,6,6);cx.fillStyle=MATS[d.mat].c;cx.fillRect(d.x-2,d.y-2+b,4,4);cx.fillStyle='#fff';cx.fillRect(d.x-2,d.y-2+b,1,1)
    }else if(d.kind==='gold'){cx.fillStyle='#8a6010';cx.fillRect(d.x-2,d.y-2+b,5,5);cx.fillStyle='#ffd040';cx.fillRect(d.x-2,d.y-2+b,4,4)}
    else drawHeart(Math.round(d.x)-4,Math.round(d.y)-4+b,1,1);
  }
  // sorted entities
  const list=[];
  for(const n of NP)list.push({y:n.y,f:()=>drawNpc(n)});
  for(const p of M.props)list.push({y:(p.ty+1)*TS-2,f:()=>drawProp(p)});
  for(const c of M.critters)list.push({y:c.y,f:()=>drawCritter(c)});
  for(const c of CH)list.push({y:c.y,f:()=>drawChest(c)});
  for(const e of E)list.push({y:e.y,f:()=>drawEnemy(e)});
  list.push({y:P.y,f:drawPlayer});
  list.sort((a,b)=>a.y-b.y);
  for(const o of list)o.f();
  // telegraphs
  for(const e of E)if(e.tele){
    const f=1-e.tele.t/e.tele.dur;
    cx.fillStyle=`rgba(230,60,30,${.15+.25*f})`;cx.beginPath();cx.arc(e.tele.x,e.tele.y,e.tele.r,0,TAU);cx.fill();
    cx.strokeStyle='rgba(255,120,60,.9)';cx.lineWidth=1;cx.beginPath();cx.arc(e.tele.x,e.tele.y,e.tele.r*f,0,TAU);cx.stroke();
  }
  // projectiles
  for(const p of PR){
    const c=p.kind==='fire'?'#ff8a20':p.kind==='bolt'?'#8ab8ff':p.kind==='knife'?'#d8c0ff':p.kind==='pierce'?'#c8ff90':'#e8d8a0';
    cx.save();cx.translate(Math.round(p.x),Math.round(p.y));cx.rotate(p.ang);
    if(p.kind==='arrow'||p.kind==='pierce'){cx.fillStyle='#6a4a20';cx.fillRect(-5,-.5,8,1);cx.fillStyle=c;cx.fillRect(3,-1,3,2)}
    else if(p.kind==='knife'){cx.fillStyle=c;cx.fillRect(-3,-1,6,2)}
    else{cx.fillStyle=c;cx.fillRect(-3,-3,6,6);cx.fillStyle='#fff';cx.fillRect(-1,-1,2,2)}
    cx.restore();
  }
  for(const t of TRAPS){cx.fillStyle='#3a3a40';cx.fillRect(Math.round(t.x)-4,Math.round(t.y)-1,8,4);cx.fillStyle='#b8b8c4';for(let i=-3;i<=3;i+=3)cx.fillRect(Math.round(t.x)+i,Math.round(t.y)-3,1,3)}
  for(const p of EP){cx.fillStyle='#4a2a10';cx.fillRect(Math.round(p.x)-3,Math.round(p.y)-3,6,6);cx.fillStyle='#e0702a';cx.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,4,4);cx.fillStyle='#ffd080';cx.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,2,2)}
  // effects
  for(const f of FX){
    if(f.k==='p'){cx.globalAlpha=clamp(1-f.age/f.t,0,1);cx.fillStyle=f.c;cx.fillRect(Math.round(f.x),Math.round(f.y),f.s,f.s);cx.globalAlpha=1}
    else if(f.k==='mark'){const q=f.t/f.dur;cx.strokeStyle='rgba(255,100,60,.9)';cx.lineWidth=1;cx.beginPath();cx.arc(f.x,f.y,f.r,0,TAU);cx.stroke();cx.fillStyle=`rgba(255,60,30,${.08+.22*q})`;cx.fill();cx.beginPath();cx.arc(f.x,f.y,f.r*q,0,TAU);cx.stroke()}
    else if(f.k==='ring'){const q=f.t/f.dur,r=f.r0+(f.r1-f.r0)*q;cx.globalAlpha=1-q;cx.strokeStyle=f.c;cx.lineWidth=3;cx.beginPath();cx.arc(f.x,f.y,r,0,TAU);cx.stroke();cx.globalAlpha=1}
    else if(f.k==='slash'){const q=f.t/f.dur;cx.globalAlpha=1-q*.8;cx.strokeStyle=f.c;cx.lineWidth=f.w||4;cx.beginPath();cx.arc(f.x,f.y,f.range*.8,f.dir-f.arc/2+q*f.arc*.3,f.dir+f.arc/2);cx.stroke();cx.globalAlpha=1}
  }
  for(const f of FT){cx.globalAlpha=clamp(f.t*2,0,1);text(f.s,Math.round(f.x),Math.round(f.y),f.c,f.big?10:8,'center',true);cx.globalAlpha=1}
  cx.restore();
}
function drawNpc(n){
  const s=npcSprite(n),x=Math.round(n.x),y=Math.round(n.y);
  const sh=s.front.height;
  shadow(x,y+3,6);cx.drawImage(s.front,x-Math.floor(s.front.width/2),y+1-sh);
  cx.fillStyle=n.pal.k;cx.fillRect(x-4,y+1,3,3);cx.fillRect(x+1,y+1,3,3);
  const q=(n.id==='elder'&&(flags.stage===0||flags.stage===3));
  text(q?'!':'',x,y-sh-12+Math.round(Math.sin(time*5)*1.5),'#ffe040',10,'center',true);
  if(!n.walk)text(n.name,x,y-sh-4,'#e8d8b0',7,'center');
}
function npcSprite(n){return n.spr||(n.spr=Spr.npc(n.pal))}
function shadow(x,y,r){cx.fillStyle='rgba(0,0,0,.28)';cx.beginPath();cx.ellipse(x,y,r,r*.45,0,0,TAU);cx.fill()}
function drawChest(c){
  const x=Math.round(c.x),y=Math.round(c.y);shadow(x,y+5,7);
  cx.fillStyle='#4a2c10';cx.fillRect(x-7,y-4,14,10);cx.fillStyle='#8a5a22';cx.fillRect(x-6,y-3,12,8);
  if(c.open){cx.fillStyle='#2a1a08';cx.fillRect(x-6,y-3,12,3);cx.fillStyle='#a87a3a';cx.fillRect(x-7,y-9,14,4)}
  else{cx.fillStyle='#a87a3a';cx.fillRect(x-7,y-5,14,4);cx.fillStyle='#ffd040';cx.fillRect(x-1,y-2,3,3)}
}
function drawEnemy(e){
  const k=BOSSSPR[e.variant]||e.type,base=Spr.enemy[k],x=Math.round(e.x),y=Math.round(e.y);
  const w=base.width,h=base.height;
  shadow(x,y+e.hh,Math.max(5,w/2));
  let spr=e.flash>0?Spr.flash[k]:(e.elite?Spr.elite[k]:base);
  let ox=0,oy=Math.round(Math.sin(e.anim)*(e.state==='idle'?.4:1));
  if(e.state==='wind'){ox=Math.round(Math.sin(time*60)*1.5);if(Math.floor(time*16)%2)spr=Spr.flash[k]}
  if(e.slow>0)cx.globalAlpha=.8;
  cx.drawImage(spr,x-Math.floor(w/2)+ox,y+e.hh+1-h+oy);
  cx.globalAlpha=1;
  if(e.slow>0){cx.fillStyle='rgba(120,200,255,.35)';cx.fillRect(x-w/2,y+e.hh+1-h,w,h)}
  if(e.hp<e.maxHp&&e.type!=='boss')bar(x-8,y-h+e.hh-3,16,2,e.hp/e.maxHp,e.elite?'#ffd040':'#e04030');
  if(e.stun>0)text('*',x,y-h,'#ffe040',8,'center',true);
  if(e.state==='wind')text('!',x,y-h-6,'#ff4030',12,'center',true);
}
function drawPlayer(){
  const h=P.hero,x=Math.round(P.x),y=Math.round(P.y),sp=Spr.heroes[h.id];
  if(P.inv>0&&P.rollT<=0&&P.stealth<=0&&Math.floor(time*20)%2)return;
  shadow(x,y+3,6);
  if(P.buff){cx.globalAlpha=.3+.15*Math.sin(time*10);cx.fillStyle=P.buff.poison?'#8ae04a':'#e03020';cx.beginPath();cx.ellipse(x,y+2,9,4.5,0,0,TAU);cx.fill();cx.globalAlpha=1}
  if(P.stealth>0)cx.globalAlpha=.4;
  cx.save();cx.translate(x,y);
  if(P.rollT>0){cx.rotate(P.rollT*22*(P.rvx>=0?1:-1));cx.translate(0,-2)}
  const back=P.face.y<-.5&&Math.abs(P.face.x)<.8;
  const eq=P.eq,col=s=>eq[s]?RARITY[eq[s].r].c:null;
  const walk=P.moving||P.dashT>0?Math.floor(P.anim)%2:0;
  const spr=back?sp.back:sp.front,sh=spr.height,top=1-sh;
  const bc=col('boots')||h.dark;
  cx.fillStyle=bc;cx.fillRect(-4,1-(walk?1:0),3,3);cx.fillRect(1,1-(walk?0:1),3,3);
  if(back)drawWeapon(h,col('weapon'));
  cx.drawImage(P.flash>0?Spr.tint(spr,'#fff'):spr,-Math.floor(spr.width/2),top);
  // gear colours
  if(col('helm')){cx.fillStyle=col('helm');cx.fillRect(-4,top+(h.id==='mage'?3:1),8,1)}
  if(col('chest')){cx.fillStyle=col('chest');cx.fillRect(-2,-2,4,2)}
  if(col('gloves')){cx.fillStyle=col('gloves');cx.fillRect(-5,-2,1,2);cx.fillRect(4,-2,1,2)}
  if(col('amulet')){cx.fillStyle=col('amulet');cx.fillRect(-1,-3,2,1)}
  if(!back)drawWeapon(h,col('weapon'));
  cx.restore();cx.globalAlpha=1;
}
function drawWeapon(h,wc){
  const f=P.face,A=P.att,atk=A?1:0,len=(h.melee?8:6)+atk*(A&&A.heavy?7:4),c=wc||'#c8c8c8';
  const ang=Math.atan2(f.y,f.x),pr=A?clamp(A.t/A.dur*1.6,0,1):0,off=A?(-1.3+2.6*pr)*(A.heavy?1.15:1):0;
  cx.save();cx.translate(Math.round(f.x*6),-3+Math.round(f.y*3));cx.rotate(ang+(h.melee?off:0));
  if(h.id==='ranger'){cx.strokeStyle='#8a5a2a';cx.lineWidth=1;cx.beginPath();cx.arc(2,0,5,-1.2,1.2);cx.stroke();cx.fillStyle=c;cx.fillRect(6,-1,1,2)}
  else if(h.id==='mage'){cx.fillStyle='#6a4a20';cx.fillRect(-2,-1,len+2,1);cx.fillStyle=c;cx.fillRect(len,-2,3,3)}
  else{cx.fillStyle='#5a3a1c';cx.fillRect(0,-1,3,2);cx.fillStyle=c;cx.fillRect(3,-1,len-2,2);cx.fillStyle='#fff';cx.fillRect(3,-1,len-2,1)}
  cx.restore();
}

// ---------- rendering: HUD & overlays ----------
function drawHUD(){
  // hearts (20 HP each, half hearts)
  const hearts=Math.ceil(P.maxHp/20),per=10;
  for(let i=0;i<hearts;i++){
    const f=clamp((P.hp-i*20)/20,0,1),fq=f>=.75?1:f>=.25?.5:0;
    drawHeart(10+(i%per)*17,8+Math.floor(i/per)*14,fq,2);
  }
  const hy=12+Math.ceil(hearts/per)*14;
  text(`${P.hero.name}  Lv ${P.lvl}   Gold ${P.gold}   Potions ${P.potions} (Q)`+(M.dark?`   Keys ${P.keys}`:''),8,hy,'#ffe9a0',8,'left',true);
  let ly=hy+10;
  if(P.pts>0){text(`${P.pts} attribute points! (I)`,8,ly,'#ffe040',7);ly+=10}
  if(P.sp>0){text(`${P.sp} skill points! (T)`,8,ly,'#8fd0ff',7);ly+=10}
  text(QUEST[flags.stage],8,ly,'#a8e0a0',7);ly+=10;
  for(const b of P.buffs){text(`${b.name} ${Math.ceil(b.t)}s`,8,ly,'#8fd0ff',7);ly+=9}
  // bars
  bar(8,H-18,96,6,P.res/P.resMax,P.hero.resColor);
  text(`${P.hero.res} ${Math.floor(P.res)}`,12,H-19,'#fff',6);
  const xf=P.lvl>=MAXLVL?1:P.xp/xpNeed(P.lvl);
  bar(8,H-8,96,3,xf,'#c8a0f0');
  // skill slots
  if(!lastTouchOverlay){
    const s0=SKILLS[P.bound[0]],s1=SKILLS[P.bound[1]];
    const labels=['J','K','L','SPC'],names=['Attack',s0.name,s1.name,'Roll'];
    const cds=[P.atkT/P.atkCd,P.cd[0]/P.cdMax[0],P.cd[1]/P.cdMax[1],P.rollCd/.8];
    const costs=[0,s0.cost,s1.cost,0];
    for(let i=0;i<4;i++){
      const x=W-4*30-6+i*30,y=H-36;
      cx.fillStyle='#1a110a';cx.fillRect(x,y,26,26);cx.strokeStyle=i&&P.res<costs[i]?'#5a3030':'#8a6a3a';cx.strokeRect(x+.5,y+.5,25,25);
      cx.fillStyle=P.hero.color;cx.fillRect(x+8,y+8,10,10);cx.fillStyle=P.hero.light;cx.fillRect(x+9,y+9,4,4);
      if(cds[i]>0){cx.fillStyle='rgba(0,0,0,.65)';cx.fillRect(x+1,y+1,24,Math.round(24*clamp(cds[i],0,1)))}
      text(labels[i],x+13,y+1,'#fff',6,'center');
      text(names[i].split(' ')[0].slice(0,6),x+13,y+19,'#e8d8b0',5,'center');
    }
  }
  if(P.hp<P.maxHp*.3&&!P.dead){const a=.1+.07*Math.sin(time*6);cx.fillStyle=`rgba(190,0,0,${a})`;cx.fillRect(0,0,W,6);cx.fillRect(0,H-6,W,6);cx.fillRect(0,0,6,H);cx.fillRect(W-6,0,6,H)}
  // boss bar
  for(const e of E)if(e.type==='boss'&&e.state!=='dormant'){
    bar(W/2-100,12,200,8,e.hp/e.maxHp,'#b82020');
    text(bossOf(e).name,W/2,2,'#ffd0a0',8,'center',true);
  }
  // banner and toasts
  if(banner.t>0){cx.globalAlpha=clamp(banner.t,0,1);text(banner.text,W/2,56,'#ffe9a0',18,'center',true);cx.globalAlpha=1}
  toasts.slice(-3).forEach((t,i)=>{cx.globalAlpha=clamp(t.t,0,1);text(t.s,W/2,84+i*10,t.c,8,'center');cx.globalAlpha=1});
  // interact prompt
  if(!ui){
    const it=nearestInteract();
    if(it){
      const x=Math.round(it.x-Math.round(cam.x)),y=Math.round(it.y-Math.round(cam.y)-6);
      cx.fillStyle='#1a110a';cx.fillRect(x-6,y-8,12,12);cx.strokeStyle='#ffe9a0';cx.strokeRect(x-5.5,y-7.5,11,11);
      text(lastTouchOverlay?'USE':'E',x,y-6,'#ffe9a0',8,'center',true);
    }
  }
}
function drawDark(){
  if(!M.dark&&!M.night)return;
  const lk=flags.lantern?'c2':'c';
  if(!drawDark[lk]){
    const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');
    const gr=flags.lantern?g.createRadialGradient(W,H,80,W,H,300):g.createRadialGradient(W,H,40,W,H,230);gr.addColorStop(0,'rgba(8,4,2,0)');gr.addColorStop(.55,'rgba(8,4,2,.55)');gr.addColorStop(1,'rgba(8,4,2,.93)');
    g.fillStyle=gr;g.fillRect(0,0,W*2,H*2);drawDark[lk]=c;
  }
  cx.drawImage(drawDark[lk],Math.round(P.x-cam.x-W),Math.round(P.y-cam.y-H));
}



// ---------- dungeon logic: arena rooms, orb switch, small-key door ----------
function setGate(g,open){
  g.open=open;
  for(const[x,y]of g.tiles)M.t[y*M.w+x]=open?T.DFLOOR:T.BARRIER;
}
function updateRooms(){
  for(const r of M.rooms){
    if(flags.dun[r.id])continue;
    const tx=P.x/TS,ty=P.y/TS;
    const inside=tx>r.x1+1&&tx<r.x2&&ty>r.y1+1&&ty<r.y2;
    const alive=E.some(e=>e.room===r.id&&!e.dead);
    if(!r.active&&inside&&alive){
      r.active=true;
      for(const id of r.gates)setGate(M.gates.find(g=>g.id===id),false);
      toast(r.name+' seals shut! Defeat every enemy.','#ff9a70');Snd.boom();shake=4;
    }
    if(r.active&&!alive){
      r.active=false;flags.dun[r.id]=true;
      for(const id of r.gates)setGate(M.gates.find(g=>g.id===id),true);
      toast('The way opens.','#a8e0a0');Snd.open();
    }
  }
}
function tryKeyDoor(){
  const kg=M.gates.find(g=>g.kind==='key'&&!g.open);
  if(!kg)return;
  const gx=(kg.tiles[1][0]+.5)*TS,gy=(kg.tiles[1][1]+.5)*TS;
  if(Math.abs(P.x-gx)<30&&Math.abs(P.y-gy)<18&&P.y>gy&&P.face.y<-.3&&Input.axis().l>.1){
    if(P.keys>0){P.keys--;setGate(kg,true);flags.dun[kg.flagKey||'keydoor']=true;toast('The small key unlocks the door!','#ffe040');Snd.open();shake=3}
    else if(!P.keyMsg||P.keyMsg<time-2.5){P.keyMsg=time;toast('Locked. You need a small key.','#ff8070')}
  }
}
function hitOrbs(x,y,r){
  for(const p of M.props){
    if(p.k!=='orb'||flags.dun[p.flag||'orb'])continue;
    const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS;
    if(Math.hypot(px-x,py-y)<r){
      flags.dun[p.flag||'orb']=true;const g=M.gates.find(g=>g.kind==='orb'&&(g.flag||'orb')===(p.flag||'orb'));if(g)setGate(g,true);
      toast('Click! A distant gate swings open.','#8fd0ff');Snd.open();shake=3;puff(px,py,16,'#8fd0ff',80);
    }
  }
}

function updateBlocks(dt){
  for(const b of M.props){
    if(b.k!=='block')continue;
    for(const ax of['ox','oy'])if(b[ax]){const v=b[ax];b[ax]=Math.abs(v)<1?0:v-Math.sign(v)*Math.min(Math.abs(v),120*dt)}
  }
  P.pushT=(P.pushT||0)-dt;
  if(P.pushT<=0&&P.moving&&!P.att&&P.rollT<=0&&M.props.some(p=>p.k==='block')){
    const a=Input.axis();let dx=0,dy=0;
    if(Math.abs(a.x)>Math.abs(a.y)*1.2)dx=Math.sign(a.x);else if(Math.abs(a.y)>Math.abs(a.x)*1.2)dy=Math.sign(a.y);
    if(dx||dy){
      const tx=Math.floor((P.x+dx*9)/TS),ty=Math.floor((P.y+dy*9)/TS);
      const b=M.props.find(p=>p.k==='block'&&p.tx===tx&&p.ty===ty);
      if(b){
        const nx=tx+dx,ny=ty+dy;
        if(gt(M,nx,ny)===T.DFLOOR&&!M.props.some(p=>p.tx===nx&&p.ty===ny&&!p.deco)&&!E.some(e=>Math.floor(e.x/TS)===nx&&Math.floor(e.y/TS)===ny)){
          M.t[ty*M.w+tx]=T.DFLOOR;M.t[ny*M.w+nx]=T.DBLOCK;b.tx=nx;b.ty=ny;b.ox=-dx*TS;b.oy=-dy*TS;P.pushT=.3;
          Snd.menu();puff(b.tx*TS+8,b.ty*TS+14,5,'#8a867a',40);
        }
      }
    }
  }
  for(const pl of M.plates)pl.on=M.props.some(p=>p.k==='block'&&p.tx===pl.tx&&p.ty===pl.ty);
  for(const g of M.gates){
    if(g.kind!=='plate'||flags.dun[g.flag])continue;
    const ps=M.plates.filter(q=>q.gate===g.id);
    if(ps.length&&ps.every(q=>q.on)){
      flags.dun[g.flag]=true;setGate(g,true);
      toast('Click! A heavy slab slides away.','#8fd0ff');Snd.open();shake=3;
    }
  }
}
function cyanHalo(){
  if(!cyanHalo.c){
    const c=document.createElement('canvas');c.width=c.height=120;const q=c.getContext('2d');
    const rg=q.createRadialGradient(60,60,2,60,60,60);rg.addColorStop(0,'rgba(80,255,230,.5)');rg.addColorStop(1,'rgba(80,255,230,0)');
    q.fillStyle=rg;q.fillRect(0,0,120,120);cyanHalo.c=c;
  }
  return cyanHalo.c;
}
function drawGates(){
  for(const g of M.gates||[]){
    if(g.open)continue;
    for(const[tx,ty]of g.tiles){
      const x=tx*TS,y=ty*TS;
      if(g.kind==='key'){
        cx.fillStyle='#2a1808';cx.fillRect(x,y,16,16);cx.fillStyle='#7a5226';cx.fillRect(x+1,y+1,14,14);cx.fillStyle='#5a3a18';cx.fillRect(x+1,y+7,14,2);
        cx.fillStyle='#d8b030';cx.fillRect(x+6,y+4,4,5);cx.fillStyle='#4a3008';cx.fillRect(x+7,y+6,2,2);
      }else if(g.kind==='plate'){
        cx.fillStyle='#2a2620';cx.fillRect(x,y,16,16);cx.fillStyle='#5a564c';cx.fillRect(x+1,y+1,14,14);cx.fillStyle='#3a362e';cx.fillRect(x+7,y+1,2,14);cx.fillStyle='#8fd0ff';cx.fillRect(x+6,y+6,4,4);
      }else{
        cx.fillStyle='#14100c';cx.fillRect(x,y,16,16);
        for(let i=1;i<16;i+=4){cx.fillStyle=g.kind==='orb'?'#4a6a9a':'#7a7a84';cx.fillRect(x+i,y,2,16);cx.fillStyle='#b8b8c4';cx.fillRect(x+i,y,1,16)}
        cx.fillStyle='#4a4a54';cx.fillRect(x,y+3,16,2);cx.fillRect(x,y+11,16,2);
        if(g.kind==='orb'){cx.globalAlpha=.3+.2*Math.sin(time*4);cx.fillStyle='#6ab0ff';cx.fillRect(x,y,16,16);cx.globalAlpha=1}
      }
    }
  }
}
function drawDarkLights(){
  if(!M.dark&&!M.night)return;
  if(!drawDarkLights.h){
    const gl=document.createElement('canvas');gl.width=gl.height=120;const q=gl.getContext('2d');
    const rg=q.createRadialGradient(60,60,2,60,60,60);rg.addColorStop(0,'rgba(255,170,80,.4)');rg.addColorStop(1,'rgba(255,170,80,0)');
    q.fillStyle=rg;q.fillRect(0,0,120,120);drawDarkLights.h=gl;
  }
  cx.globalCompositeOperation='lighter';
  for(const l of propLights()){cx.globalAlpha=clamp(l.a,0,1);cx.drawImage(l.c?cyanHalo():drawDarkLights.h,Math.round(l.x-cam.x-l.r),Math.round(l.y-cam.y-l.r),l.r*2,l.r*2)}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
}

// ---------- props, critters, ambient life ----------
function drawProp(p){
  const x=p.tx*TS+(p.ox||0),y=p.ty*TS+(p.oy||0),t=time,R_=(c,a,b,w,h)=>{cx.fillStyle=c;cx.fillRect(x+a,y+b,w,h)};
  switch(p.k){
    case'barrel':shadow(x+8,y+14,6);R_('#3a2410',3,2,10,13);R_('#8a5a22',4,3,8,12);R_('#a87a3a',5,4,2,10);R_('#4a3014',3,6,10,1);R_('#4a3014',3,11,10,1);break;
    case'crate':shadow(x+8,y+14,7);R_('#3a2410',2,4,12,11);R_('#9a6a30',3,5,10,9);R_('#6a4620',3,9,10,1);R_('#6a4620',7,5,1,9);break;
    case'hay':shadow(x+8,y+14,7);R_('#8a6a10',1,5,14,10);R_('#d8b840',2,5,12,8);R_('#a88a20',2,8,12,1);R_('#a88a20',2,11,12,1);R_('#f0d870',3,6,4,1);break;
    case'bench':shadow(x+8,y+14,7);R_('#3a2410',1,6,14,4);R_('#8a5a22',1,5,14,3);R_('#3a2410',2,10,2,5);R_('#3a2410',12,10,2,5);break;
    case'bush':shadow(x+8,y+14,7);R_('#2a4a18',1,4,14,11);R_('#4a7a28',2,3,12,10);R_('#6a9a3a',3,4,4,3);R_('#d05a24',9,8,2,2);R_('#d05a24',5,10,2,2);break;
    case'cutbush':shadow(x+8,y+14,6);R_('#2a4a18',2,5,12,10);R_('#4a7a28',2,4,12,9);R_('#6a9a3a',4,5,4,3);R_('#8abc4a',9,6,3,2);R_('#d05a24',6,10,2,2);break;
    case'ore':shadow(x+8,y+14,6);R_('#3a3a44',2,6,12,9);R_('#6a6a78',3,5,10,9);R_('#8a8a98',4,5,4,3);R_('#9ae0e8',9,7,2,4);R_('#e8b050',5,10,2,2);R_('#6ad0d8',7,9,1,1);break;
    case'logs':shadow(x+8,y+14,7);R_('#3a2410',1,9,14,6);R_('#8a5a28',2,9,12,5);R_('#c89a58',3,10,2,3);R_('#c89a58',8,10,2,3);R_('#6a4018',2,5,12,5);R_('#a87a3a',3,5,10,4);R_('#e0b878',4,6,2,2);break;
    case'herb':R_('#2a5a1a',6,8,2,6);R_('#4a9a30',3,6,5,4);R_('#4a9a30',8,5,5,4);R_('#7ad04a',4,6,2,2);R_('#d03a2a',5,4,2,2);R_('#d03a2a',10,4,2,2);R_('#e86a5a',10,4,1,1);break;
    case'clay':shadow(x+8,y+14,5);R_('#6a2e10',4,5,8,10);R_('#b8602a',5,4,6,10);R_('#d8803a',6,6,2,5);R_('#6a2e10',5,3,6,2);break;
    case'sign':shadow(x+8,y+14,5);R_('#3a2410',7,8,2,7);R_('#2a1808',1,2,14,8);R_('#a87a3a',2,3,12,6);R_('#6a4620',4,5,8,1);R_('#6a4620',4,7,6,1);break;
    case'well':shadow(x+8,y+14,8);R_('#4a4640',1,6,14,9);R_('#8a867e',2,6,12,8);R_('#a8a49c',3,7,4,2);R_('#1a2a3a',4,6,8,4);R_('#5a3a1c',1,0,2,8);R_('#5a3a1c',13,0,2,8);R_('#7a4a22',0,0,16,3);R_('#b8602a',0,-1,16,2);break;
    case'anvil':shadow(x+8,y+14,6);R_('#2a2a30',3,8,10,3);R_('#5a5a64',2,6,12,3);R_('#8a8a96',3,6,9,1);R_('#2a2a30',5,11,6,4);{const f=.5+.5*Math.sin(t*9);R_('#ff7a20',12,11,3,3);R_('#ffd060',13,12,1,1);cx.globalAlpha=f*.6;R_('#ffb040',11,10,5,5);cx.globalAlpha=1}break;
    case'pot':shadow(x+8,y+14,6);R_('#1a1a20',3,6,10,9);R_('#3a3a44',4,5,8,9);R_('#5ab04a',4,5,8,2);{const b=Math.sin(t*5)*1.5;R_('#9aff7a',6,3+b,2,2);R_('#9aff7a',9,2-b,1,1)}break;
    case'grave':shadow(x+8,y+14,6);R_('#3a3a40',3,4,10,11);R_('#7a7a84',4,3,8,11);R_('#9a9aa4',5,4,3,2);R_('#4a4a54',7,6,2,5);R_('#4a4a54',5,8,6,1);break;
    case'lantern':shadow(x+8,y+14,4);R_('#2a1808',7,5,2,10);R_('#2a1808',4,2,8,2);R_('#ffd060',5,3,6,4);R_('#fff0a0',6,4,4,2);R_('#2a1808',4,7,8,1);break;
    case'stall':
      shadow(x+16,y+14,14);R_('#4a2c10',1,8,30,7);R_('#8a5a22',1,7,30,6);
      R_('#e8d8b0',3,9,5,3);R_('#d05a24',9,9,4,3);R_('#e8c040',14,9,4,3);R_('#6a9a3a',19,9,5,3);R_('#b04a6a',25,9,4,3);
      R_('#3a2410',2,-4,2,12);R_('#3a2410',28,-4,2,12);
      for(let i=0;i<8;i++)R_(i%2?'#f0e8d0':'#c0382a',i*4,-5,4,6);
      R_('#7a2418',0,1,32,1);break;
    case'block':shadow(x+8,y+14,7);R_('#2a2620',0,1,16,15);R_('#6a665c',1,1,14,13);R_('#8a867a',1,1,14,3);R_('#4a463e',1,11,14,3);R_('#5a8a4a',3,5,3,2);R_('#5a8a4a',10,8,2,2);break;
    case'plate':{const on=M.plates.some(q=>q.tx===p.tx&&q.ty===p.ty&&q.on)||flags.dun.plate1;R_('#2a2620',1,1,14,14);R_('#4a463e',2,2,12,12);R_(on?'#8fd0ff':'#6a665c',5,5,6,6);R_(on?'#d8f4ff':'#8a867a',6,6,2,2);break}
    case'glowcap':{const g=.6+.4*Math.sin(t*3+p.tx*2);R_('#2a4a5a',7,9,2,5);R_('#2a4a5a',3,12,1,3);R_('#2a4a5a',12,11,1,4);cx.globalAlpha=g;R_('#40e0d0',5,6,6,4);R_('#40e0d0',1,10,5,3);R_('#40e0d0',10,9,5,3);R_('#c8fff4',6,7,2,1);cx.globalAlpha=1;break}
    case'brazier':shadow(x+8,y+14,6);R_('#2a2a30',4,9,8,6);R_('#4a4a54',3,8,10,3);{const f=Math.sin(t*12+p.tx)*1.2;R_('#d03a10',5,3-f,6,6+f);R_('#ff9a2a',6,2,4,6);R_('#ffe070',7,5,2,3)}break;
    case'orb':shadow(x+8,y+14,6);R_('#2a2a30',4,10,8,5);R_('#4a4a54',5,9,6,2);{const on=flags.dun[p.flag||'orb'],b=Math.sin(t*3)*1;R_(on?'#3a5a3a':'#2a5a9a',4,2+b,8,8);R_(on?'#6a9a6a':'#6ab0ff',5,3+b,6,6);R_(on?'#a8d0a8':'#c8e8ff',6,4+b,2,2)}break;
    case'fire':{
      shadow(x+8,y+14,8);
      R_('#6a6660',0,9,16,6);R_('#4a4640',1,10,14,4);
      R_('#4a2c10',3,10,10,3);R_('#6a4018',4,9,8,2);
      const f=Math.sin(t*13)*1.3,g=Math.sin(t*9+1)*1;
      R_('#d03a10',4,4-f,8,7+f);R_('#ff7a20',5,3+g*.5,6,8);R_('#ffc040',6,5,4,5);R_('#fff0a0',7,7,2,3);
      for(let i=0;i<6;i++)R_('#8a867e',i*3,14,2,2);
      break}
  }
}
function propLights(){
  const L=[];
  for(const p of M.props){
    const x=(p.tx+.5)*TS,y=(p.ty+.5)*TS,f=1+Math.sin(time*11+p.tx)*.1;
    if(p.k==='fire')L.push({x,y:y-2,r:86,a:.95*f});
    else if(p.k==='lantern')L.push({x,y:y-4,r:36,a:.7});
    else if(p.k==='anvil')L.push({x:x+4,y,r:30,a:.6*f});
    else if(p.k==='pot')L.push({x,y,r:26,a:.4});
    else if(p.k==='glowcap')L.push({x,y,r:36,a:.55,c:'cyan'});
    else if(p.k==='brazier')L.push({x,y:y-3,r:80,a:.9*f});
    else if(p.k==='orb'&&!flags.dun[p.flag||'orb'])L.push({x,y:y-3,r:34,a:.6});
  }
  return L;
}
const BREAK={cutbush:'#5a8a2a',clay:'#b8602a',ore:'#9ab0c8',logs:'#b8844a'};
function cutAround(x,y,r){
  hitOrbs(x,y,r);
  let any=false;
  for(const p of M.props){
    if(!BREAK[p.k])continue;
    const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS;
    if(Math.hypot(px-x,py-y)<r){
      p.dead=true;any=true;M.t[p.ty*M.w+p.tx]=M.dark?T.DFLOOR:T.GRASS;
      puff(px,py,9,BREAK[p.k],60);
      if(p.k==='ore'){dropMat(px,py,'ore',randi(1,3));if(Math.random()<.2)dropMat(px,py,'shell',1)}
      else if(p.k==='logs')dropMat(px,py,'wood',randi(2,3));
      else{const q=Math.random();if(q<.35)dropGold(px,py,randi(1,3));else if(q<.5)DR.push({kind:'hp',x:px,y:py,t:0,vx:0,vy:0})}
    }
  }
  if(any){M.props=M.props.filter(p=>!p.dead);Snd.swing()}
}
function wanderer(e,dt,sp,rad){
  e.t-=dt;
  if(e.t<=0){
    e.t=rand(1,3);e.moving=Math.random()<.55;const a=rand(0,TAU);e.wx=Math.cos(a);e.wy=Math.sin(a);
    const dd=Math.hypot(e.home.x-e.x,e.home.y-e.y);
    if(dd>rad){e.wx=(e.home.x-e.x)/dd;e.wy=(e.home.y-e.y)/dd;e.moving=true}
  }
  if(e.moving){e.anim+=dt*6;move(e,e.wx*sp*dt,e.wy*sp*dt)}
}
function updateAmbient(dt){
  for(const n of NP)if(n.walk)wanderer(n,dt,16,44);
  for(const c of M.critters)wanderer(c,dt,c.k==='dog'?26:12,c.k==='dog'?60:26);
  if(Math.random()<dt*5&&M.chimneys.length){
    const c=pick(M.chimneys);
    FX.push({k:'p',x:c.x,y:c.y,vx:rand(-3,5),vy:-rand(8,16),g:-2,t:rand(1.4,2.2),age:0,c:'rgba(200,190,185,.55)',s:2});
  }
  for(const p of M.props)if(p.k==='fire'&&Math.random()<dt*10)
    FX.push({k:'p',x:p.tx*TS+8+rand(-3,3),y:p.ty*TS+6,vx:rand(-6,6),vy:-rand(20,40),g:0,t:rand(.5,1),age:0,c:Math.random()<.5?'#ffb040':'#ff7a20',s:1});
}
function drawCritter(c){
  const x=Math.round(c.x),y=Math.round(c.y),b=c.moving?Math.round(Math.abs(Math.sin(c.anim))*1):0;
  if(c.k==='chicken'){
    shadow(x,y+2,4);cx.fillStyle='#f4f0e4';cx.fillRect(x-3,y-4-b,6,5);cx.fillStyle='#c8c0ac';cx.fillRect(x-3,y-1-b,6,2);
    cx.fillStyle='#d03a2a';cx.fillRect(x+(c.wx>=0?1:-2),y-6-b,2,2);cx.fillStyle='#e8a020';cx.fillRect(x+(c.wx>=0?3:-4),y-3-b,1,1);cx.fillStyle='#1a1a1a';cx.fillRect(x+(c.wx>=0?2:-3),y-4-b,1,1);
  }else{
    shadow(x,y+3,6);const d=c.wx>=0?1:-1;
    cx.fillStyle='#4a2c14';cx.fillRect(x-5,y-4-b,9,5);cx.fillStyle='#8a5a28';cx.fillRect(x-4,y-5-b,9,5);
    cx.fillStyle='#8a5a28';cx.fillRect(x+(d>0?4:-8),y-8-b,4,4);cx.fillStyle='#4a2c14';cx.fillRect(x+(d>0?4:-8),y-9-b,2,2);
    cx.fillStyle='#1a1a1a';cx.fillRect(x+(d>0?6:-7),y-7-b,1,1);
    cx.fillStyle='#6a4018';cx.fillRect(x+(d>0?-7:6),y-7-b+Math.round(Math.sin(time*14)),2,3);
    cx.fillStyle='#4a2c14';cx.fillRect(x-4,y+1-b,2,2);cx.fillRect(x+2,y+1-b,2,2);
  }
}
function drawHeart(x,y,f,sc){
  const rows=['.xx.xx.','xxxxxxx','xxxxxxx','.xxxxx.','..xxx..','...x...'];
  rows.forEach((r,j)=>{for(let i=0;i<7;i++)if(r[i]==='x'){
    cx.fillStyle=f>=1||(f>=.5&&i<4)?(j<2&&i>0&&i<3?'#ff8a8a':'#e02828'):'#3a0c0c';
    cx.fillRect(x+i*sc,y+j*sc,sc,sc)}});
  cx.fillStyle='#1a0505';cx.fillRect(x-sc,y+sc,sc,3*sc);cx.fillRect(x+7*sc,y+sc,sc,3*sc);cx.fillRect(x+sc,y-sc,2*sc,sc);cx.fillRect(x+4*sc,y-sc,2*sc,sc);
}

// warm dusk grading, vignette and drifting mist (matches the title screen mood)
const MIST=Array.from({length:7},(_,i)=>({x:i*90,y:30+Math.random()*210,r:70+Math.random()*60,s:rand(4,10)}));
function drawGrade(dt){
  cx.globalCompositeOperation='multiply';
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgb(132,112,184)');g.addColorStop(.5,'rgb(190,128,120)');g.addColorStop(1,'rgb(236,150,100)');
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.globalCompositeOperation='source-over';
  if(M.mist){
    for(const m of MIST){m.x+=m.s*dt;if(m.x>W+m.r)m.x=-m.r;
      const rg=cx.createRadialGradient(m.x,m.y,4,m.x,m.y,m.r);rg.addColorStop(0,'rgba(255,200,150,.14)');rg.addColorStop(1,'rgba(255,200,150,0)');
      cx.fillStyle=rg;cx.fillRect(m.x-m.r,m.y-m.r,m.r*2,m.r*2)}
  }
  if(!drawGrade.v){
    const c=document.createElement('canvas');c.width=W;c.height=H;const k=c.getContext('2d');
    const vg=k.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.62);vg.addColorStop(0,'rgba(14,8,34,0)');vg.addColorStop(1,'rgba(14,8,34,.6)');
    k.fillStyle=vg;k.fillRect(0,0,W,H);drawGrade.v=c;
    const gl=document.createElement('canvas');gl.width=gl.height=120;const q=gl.getContext('2d');
    const rg=q.createRadialGradient(60,60,2,60,60,60);rg.addColorStop(0,'rgba(255,170,80,.34)');rg.addColorStop(1,'rgba(255,190,100,0)');
    q.fillStyle=rg;q.fillRect(0,0,120,120);drawGrade.g=gl;
  }
  // low sun: warm orange light raking in from the right
  cx.globalCompositeOperation='lighter';
  for(const l of propLights()){cx.globalAlpha=clamp(l.a,0,1);cx.drawImage(l.c?cyanHalo():drawGrade.g,Math.round(l.x-cam.x-l.r),Math.round(l.y-cam.y-l.r),l.r*2,l.r*2)}
  cx.globalAlpha=1;
  const sun=cx.createLinearGradient(W,0,W*.35,0);sun.addColorStop(0,'rgba(255,130,40,.30)');sun.addColorStop(1,'rgba(255,130,40,0)');
  cx.fillStyle=sun;cx.fillRect(0,0,W,H);
  cx.globalCompositeOperation='source-over';
  cx.drawImage(drawGrade.v,0,0);
}
const LEAVES=Array.from({length:40},(_,i)=>({x:Math.random()*W,y:Math.random()*H,s:rand(8,22),p:rand(0,6),c:pick(['#d9622a','#e0902a','#b8451a','#f0b13c'])}));
function drawLeaves(dt,alpha){
  for(const l of LEAVES){
    l.y+=l.s*dt;l.x+=Math.sin(time*1.4+l.p)*14*dt+6*dt;
    if(l.y>H+4){l.y=-4;l.x=Math.random()*W}if(l.x>W+4)l.x=-4;
    cx.globalAlpha=alpha;cx.fillStyle=l.c;cx.fillRect(Math.round(l.x),Math.round(l.y),2,2);
  }
  cx.globalAlpha=1;
}

// ---------- rendering: menus ----------
function drawDialog(){
  const d=ui.d;
  panel(16,H-84,W-32,72);
  text(d.name,26,H-78,'#ffd040',9,'left',true);
  wrap(d.pages[d.i],W-64,8).forEach((l,i)=>text(l,26,H-64+i*11,'#f0e6d0',8));
  if(Math.floor(time*2)%2)text(d.i<d.pages.length-1?'>>':'OK',W-30,H-26,'#ffd040',8,'right',true);
  reg(0,0,W,H,advanceDialog);
}
function drawMenu(){
  const m=ui,VIS=9,n=m.opts.length,w=Math.min(W-20,Math.max(250,m.wide||360)),vis=Math.min(VIS,n);
  const h=40+vis*15+(m.foot?12:0),x=(W-w)/2,y=Math.max(8,(H-h)/2);
  const off=clamp(m.sel-Math.floor(vis/2),0,Math.max(0,n-vis));
  panel(x,y,w,h);
  const title=typeof m.title==='function'?m.title():m.title;
  text(title,W/2,y+8,'#ffd040',9,'center',true);
  for(let k=0;k<vis;k++){
    const i=off+k,o=m.opts[i],ty=y+26+k*15,lab=typeof o.t==='function'?o.t():o.t;
    if(i===m.sel){cx.fillStyle='rgba(255,200,80,.18)';cx.fillRect(x+6,ty-2,w-12,14)}
    text(lab,x+12,ty,i===m.sel?'#fff':'#c8b890',8);
    reg(x+6,ty-2,w-12,14,()=>{m.sel=i;runMenu(m,i)});
  }
  if(n>vis){text(off>0?'^':'',x+w-10,y+24,'#ffd040',8,'center');text(off+vis<n?'v':'',x+w-10,y+26+(vis-1)*15,'#ffd040',8,'center')}
  if(m.foot)text(m.foot(),W/2,y+h-14,'#8fd0ff',7,'center');
  if(m.closable)text('Backspace: close',W/2,y+h+3,'#a89878',6,'center');
}
function itemBlock(it,x,y,title){
  if(title)text(title,x,y-9,'#a89878',6);
  if(!it){text('(empty)',x,y,'#6a5a48',8);return}
  itemLines(it).forEach((l,i)=>text(l.t,x,y+i*9,l.c,i?7:8,'left',i===0));
}
function drawInv(){
  cx.fillStyle='rgba(8,4,2,.82)';cx.fillRect(0,0,W,H);
  panel(4,4,W-8,H-8);
  text('Inventory',12,9,'#ffd040',9,'left',true);
  text(`Gold ${P.gold}`,W-14,9,'#ffd040',8,'right',true);
  // equipment
  text('Equipment',12,22,'#a89878',7);
  SLOTS.forEach((sl,i)=>{
    const y=33+i*15,it=P.eq[sl],sel=ui.focus==='eq'&&ui.ei===i;
    cx.fillStyle=sel?'rgba(255,200,80,.25)':'rgba(255,255,255,.05)';cx.fillRect(10,y-2,122,13);
    text(SLOT_LABEL[sl].slice(0,6),13,y,'#a89878',7);
    text(it?it.name.slice(0,17):'-',50,y,it?RARITY[it.r].c:'#5a4a38',7);
    reg(10,y-2,122,13,()=>{ui.focus='eq';ui.ei=i;if(P.eq[sl])unequip(sl)});
  });
  // bag
  text(`Bag ${P.bag.length}/${bagCap()}`,142,22,'#a89878',7);
  const cap=bagCap(),brows=Math.ceil(cap/5),row=Math.floor(ui.bi/5);
  ui.rowOff=ui.rowOff||0;if(row<ui.rowOff)ui.rowOff=row;if(row>ui.rowOff+3)ui.rowOff=row-3;
  for(let i=ui.rowOff*5;i<Math.min(cap,(ui.rowOff+4)*5);i++){
    const cxn=i%5,cyn=Math.floor(i/5)-ui.rowOff,x=142+cxn*29,y=33+cyn*30,it=P.bag[i],sel=ui.focus==='bag'&&ui.bi===i;
    cx.fillStyle=sel?'#4a3418':'#241810';cx.fillRect(x,y,26,26);
    cx.strokeStyle=it?RARITY[it.r].c:'#3a2c1c';cx.strokeRect(x+.5,y+.5,25,25);
    if(sel){cx.strokeStyle='#fff';cx.strokeRect(x-.5,y-.5,27,27)}
    if(it){cx.fillStyle=RARITY[it.r].c;cx.globalAlpha=.25;cx.fillRect(x+1,y+1,24,24);cx.globalAlpha=1;text(SLOT_ICON[it.slot],x+13,y+8,RARITY[it.r].c,10,'center',true);if(it.up)text('+'+it.up,x+24,y+16,'#ffe040',7,'right')}
    reg(x,y,26,26,()=>{if(ui.focus==='bag'&&ui.bi===i&&P.bag[i])equipFromBag(i);ui.focus='bag';ui.bi=i;ui.sellArm=-1});
  }
  if(brows>4){text(ui.rowOff>0?'^':'',282,22,'#ffd040',8,'center');text(ui.rowOff+4<brows?'v':'',282,150,'#ffd040',8,'center')}
  text(Object.keys(MATS).map(k=>`${MATS[k].n} ${P.mats[k]||0}`).join('  '),W/2,9,'#a8d0a0',7,'center');
  // stats
  const sx=300;
  text(`${P.hero.name} the ${P.hero.cls}  Lv ${P.lvl}`,sx,22,P.hero.light,8,'left',true);
  bar(sx,33,170,4,P.lvl>=MAXLVL?1:P.xp/xpNeed(P.lvl),'#c8a0f0');
  text(P.lvl>=MAXLVL?'MAX':`XP ${P.xp}/${xpNeed(P.lvl)}`,sx,39,'#a89878',6);
  const attrs=[['str','Strength'],['dex','Dexterity'],['int','Intellect'],['vit','Vitality']];
  attrs.forEach(([k,n],i)=>{
    const y=50+i*12;
    text(`${n}`,sx,y,k===P.hero.primary?'#ffe9a0':'#e8d8b0',7);text(String(P.st[k]),sx+88,y,'#fff',7,'right');
    if(P.pts>0){cx.fillStyle='#2a6a2a';cx.fillRect(sx+96,y-1,12,10);text('+',sx+102,y,'#fff',8,'center',true);reg(sx+94,y-2,16,12,()=>spend(k));text(`[${i+1}]`,sx+112,y,'#8a8',6)}
  });
  text(P.pts>0?`Points to spend: ${P.pts}`:'No unspent points',sx,100,P.pts>0?'#ffe040':'#7a6a58',7);
  const dm=Math.round(P.atk*.9),dM=Math.round(P.atk*1.1);
  const rows=[['Health',P.maxHp],['Damage',`${dm}-${dM}`],['Armor',P.armor],['Crit',Math.round(P.crit*100)+'%'],['Speed',Math.round(P.spd/70*100)+'%'],[P.hero.res,Math.round(P.resMax)]];
  rows.forEach(([n,v],i)=>{const y=111+i*9;text(n,sx,y,'#a89878',7);text(String(v),sx+88,y,'#fff',7,'right')});
  // tooltip
  panel(8,166,W-16,84);
  const sel=ui.focus==='bag'?P.bag[ui.bi]:P.eq[SLOTS[ui.ei]];
  const blk=(it,x,y,title)=>{
    if(title)text(title,x,y-9,'#a89878',6);
    if(!it){text('(empty)',x,y,'#6a5a48',8);return}
    itemLines(it).forEach((l,i)=>text(l.t,x,y+i*8,l.c,i?7:8,'left',i===0));
  };
  blk(sel,16,182,sel?'Selected':'');
  if(sel&&ui.focus==='bag'){
    const cmp=P.eq[equipTarget(sel)];
    blk(cmp,180,182,'Currently equipped');
    let yy=238;
    if(sel.dmg){const dd=itemDmg(sel)-(cmp?itemDmg(cmp):0);text((dd>=0?'+':'')+dd+' damage',180,yy,dd>=0?'#60e060':'#e06060',7)}
    else if(sel.armor!==undefined){const da=itemArmor(sel)-(cmp?itemArmor(cmp):0);text((da>=0?'+':'')+da+' armor',180,yy,da>=0?'#60e060':'#e06060',7)}
  }
  // buttons
  const bt=(x,y,w,label,fn)=>{cx.fillStyle='#3a2814';cx.fillRect(x,y,w,13);cx.strokeStyle='#8a6a3a';cx.strokeRect(x+.5,y+.5,w-1,12);text(label,x+w/2,y+3,'#ffe9a0',7,'center');reg(x,y,w,13,fn)};
  bt(380,176,84,ui.focus==='bag'?'Equip':'Unequip',()=>{if(ui.focus==='bag')equipFromBag(ui.bi);else unequip(SLOTS[ui.ei])});
  if(ui.focus==='bag')bt(380,194,84,'Sell',()=>sellBag(ui.bi));
  bt(380,212,84,'Close',()=>{ui=null});
  bt(380,230,84,P.sp>0?`Skills (${P.sp})`:'Skills (T)',()=>{ui={mode:'tree',row:'nodes',b:0,n:0,ci:0}});
  text('Arrows move  Enter equip  X sell  1-4 spend points  I/Backspace close',W/2,H-12,'#7a6a58',6,'center');
}
function drawTitle(){
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a1308');g.addColorStop(.6,'#8a3a14');g.addColorStop(1,'#d9802a');
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.fillStyle='#f0b13c';cx.beginPath();cx.arc(340,150,34,0,TAU);cx.fill();
  const r=seeded(5);
  for(let layer=0;layer<3;layer++){
    cx.fillStyle=['#5a2410','#3a1608','#1e0c04'][layer];
    for(let i=0;i<22;i++){const x=i*24+(layer*9)-6,h=40+r()*50+layer*26,w=10+layer*6;cx.fillRect(x,H-h-layer*6,w,h+layer*6);cx.beginPath();cx.arc(x+w/2,H-h-layer*6,w*1.1,0,TAU);cx.fill()}
  }
  drawLeaves(.016,.9);
  text('SPICEWOOD',W/2,38,'#ffe9a0',34,'center',true);
  text('An autumn action-RPG   (vertical slice)',W/2,80,'#ffd9a0',8,'center');
  const opts=[];if(hasSave())opts.push({t:'Continue',fn:()=>{Snd.init();if(!loadGame())toast('Could not load save')}});
  opts.push({t:'New Game',fn:()=>{scene='select';hsel=0}});
  if(tsel>=opts.length)tsel=0;
  opts.forEach((o,i)=>{
    const y=120+i*20;
    if(i===tsel){cx.fillStyle='rgba(0,0,0,.45)';cx.fillRect(W/2-70,y-3,140,16)}
    text((i===tsel?'> ':'  ')+o.t,W/2,y,i===tsel?'#fff':'#e8c890',11,'center',true);
    reg(W/2-70,y-3,140,16,()=>{tsel=i;Snd.menu();o.fn()});
  });
  text('WASD move   J attack   K L skills   Space roll   I bag   Q potion   E use   P pause',W/2,H-16,'#ffd9a0',6,'center');
  drawTitle.opts=opts;
}
function drawSelect(){
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1e0c04');g.addColorStop(1,'#5a2410');cx.fillStyle=g;cx.fillRect(0,0,W,H);
  drawLeaves(.016,.5);
  text('Choose your hero',W/2,10,'#ffe9a0',14,'center',true);
  HEROES.forEach((h,i)=>{
    const x=12+i*116,y=36,w=108,sel=i===hsel;
    panel(x,y,w,200);
    if(sel){cx.strokeStyle=h.color;cx.lineWidth=2;cx.strokeRect(x+1,y+1,w-2,198);cx.lineWidth=1}
    const spr=Spr.heroes[h.id].front,bob=sel?Math.round(Math.sin(time*5)*2):0;
    cx.drawImage(spr,x+w/2-spr.width*2,y+66-spr.height*4+bob,spr.width*4,spr.height*4);
    cx.fillStyle=h.dark;cx.fillRect(x+w/2-14,y+66+bob,10,8);cx.fillRect(x+w/2+4,y+66+bob,10,8);
    text(h.name,x+w/2,y+76,h.light,10,'center',true);
    text(h.cls,x+w/2,y+89,'#e8d8b0',8,'center');
    text(h.res,x+w/2,y+100,h.resColor,7,'center');
    wrap(h.desc,w-14,7).forEach((l,j)=>text(l,x+w/2,y+114+j*9,'#c8b890',7,'center'));
    const sb=(lab,v,yy)=>{text(lab,x+8,yy,'#a89878',6);bar(x+34,yy+1,w-44,4,v/12,h.color)};
    sb('STR',h.base.str,y+148);sb('DEX',h.base.dex,y+157);sb('INT',h.base.int,y+166);sb('VIT',h.base.vit,y+175);
    text(h.skills[0].name+', '+h.skills[1].name,x+w/2,y+187,'#e8d8b0',5,'center');
    reg(x,y,w,200,()=>{if(hsel===i)startNew(i);else{hsel=i;Snd.menu()}});
  });
  text('Left/Right choose   Enter start   Backspace back',W/2,H-16,'#ffd9a0',7,'center');
}
function startNew(i){
  Snd.init();newPlayer(i);scene='play';ui=null;toasts=[];
  loadMap('village',20*TS,17*TS);
  say('Hearthmoor',['Welcome to Hearthmoor! Move with WASD or the stick, attack with J, skills on K and L, roll with Space.','Talk to Elder Maren (press E near people). Open your bag with I to equip loot and spend attribute points.']);
}

// ---------- main loop ----------
function update(dt){
  time+=dt;
  if(scene==='title'){
    const n=(hasSave()?2:1);
    if(Input.hit('up'))tsel=(tsel+n-1)%n,Snd.menu();
    if(Input.hit('down'))tsel=(tsel+1)%n,Snd.menu();
    if(Input.confirm()&&drawTitle.opts){Snd.init();drawTitle.opts[tsel]&&drawTitle.opts[tsel].fn()}
    for(const t of toasts)t.t-=dt;toasts=toasts.filter(t=>t.t>0);
  }else if(scene==='select'){
    if(Input.hit('left')){hsel=(hsel+3)%4;Snd.menu()}
    if(Input.hit('right')){hsel=(hsel+1)%4;Snd.menu()}
    if(Input.confirm())startNew(hsel);
    if(Input.hit('back'))scene='title';
  }else if(scene==='play'){
    if(fade.dir===1){fade.a+=dt*3.5;if(fade.a>=1){fade.a=1;if(fade.fn)fade.fn();fade.fn=null;fade.dir=-1}}
    else if(fade.dir===-1){fade.a-=dt*3.5;if(fade.a<=0){fade.a=0;fade.dir=0}}
    if(ui){updateUI(dt)}
    else if(hitStop>0)hitStop-=dt;
    else if(fade.dir!==1&&!P.dead)updatePlay(dt);
    updateFx2(dt);
    if(M&&P&&fade.dir!==1&&!ui){/* camera handled in updatePlay */}
  }
  Input.end();
}
function render(dt){
  regions=[];cx.setTransform(2,0,0,2,0,0);cx.imageSmoothingEnabled=false;
  cx.fillStyle='#0d0906';cx.fillRect(0,0,W,H);
  if(scene==='title')drawTitle();
  else if(scene==='select')drawSelect();
  else{
    drawWorld();drawDark();drawDarkLights();
    if(!M.dark){drawGrade(dt);drawLeaves(dt,.9)}
    drawHUD();
    if(ui){
      if(ui.mode==='dialog')drawDialog();
      else if(ui.mode==='menu')drawMenu();
      else if(ui.mode==='inv')drawInv();
      else if(ui.mode==='tree')drawTree();
    }
  }
  if(scene!=='play')for(const t of toasts)text(t.s,W/2,H-30,t.c,8,'center');
  if(fade.a>0){cx.fillStyle=`rgba(0,0,0,${fade.a})`;cx.fillRect(0,0,W,H)}
  updateTouchOverlay();
}
let last=performance.now();
function frame(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  update(dt);render(dt);
  requestAnimationFrame(frame);
}

// ---------- pointer / touch ----------
cv.addEventListener('pointerdown',e=>{
  Snd.init();
  const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;
  for(let i=regions.length-1;i>=0;i--){
    const g=regions[i];
    if(x>=g.x&&x<g.x+g.w&&y>=g.y&&y<g.y+g.h){g.fn();break}
  }
});
let touchSeen=false;
function updateTouchOverlay(){
  const coarse=touchSeen||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
  const on=coarse&&scene==='play'&&!ui;
  if(on!==lastTouchOverlay){lastTouchOverlay=on;document.getElementById('touch').classList.toggle('on',on);if(!on){Input.joy.x=Input.joy.y=0}}
}
(function setupTouch(){
  addEventListener('touchstart',()=>{touchSeen=true},{passive:true});
  for(const b of document.querySelectorAll('.tb')){
    const k=b.dataset.k;
    b.addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();b.setPointerCapture(e.pointerId);Input.setV(k,true)});
    const up=e=>{Input.setV(k,false)};
    b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
  }
  const zone=document.getElementById('joy'),base=document.getElementById('joyBase'),knob=document.getElementById('joyKnob');
  let id=null,ox=0,oy=0;
  zone.addEventListener('pointerdown',e=>{
    e.preventDefault();id=e.pointerId;zone.setPointerCapture(id);
    const r=zone.getBoundingClientRect();ox=e.clientX;oy=e.clientY;
    base.style.display='block';base.style.left=(e.clientX-r.left)+'px';base.style.top=(e.clientY-r.top)+'px';
    knob.style.left='50%';knob.style.top='50%';
  });
  zone.addEventListener('pointermove',e=>{
    if(e.pointerId!==id)return;
    const rad=base.getBoundingClientRect().width/2||40;
    let dx=e.clientX-ox,dy=e.clientY-oy;const l=Math.hypot(dx,dy);
    if(l>rad){dx=dx/l*rad;dy=dy/l*rad}
    knob.style.left=(50+dx/rad*40)+'%';knob.style.top=(50+dy/rad*40)+'%';
    const f=Math.hypot(dx,dy)/rad;
    Input.joy.x=f<.18?0:dx/rad;Input.joy.y=f<.18?0:dy/rad;
  });
  const end=e=>{if(e.pointerId!==id)return;id=null;Input.joy.x=Input.joy.y=0;base.style.display='none'};
  zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end);
})();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&scene==='play'&&!ui&&P&&!P.dead)openPause()});
Music.want='title';
try{parent.postMessage({type:'ready'},'*')}catch(e){}
requestAnimationFrame(frame);
