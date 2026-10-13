'use strict';
// ================= Receiving items (Link's Awakening style), the sword and shield tutorial, the shield =================
// itemGet(id, then): the hero holds the item over his head, then a short box explains how to use it. Used for the sword, the shield,
// and every gate item/tool. Nothing is shown in the HUD before the hero has it.
function itemInfo(id){
  if(id==='sword')return{n:'Old Sword',pages:['Brann\'s old sword, kept safe for you.','Press J to swing it. Swing again to chain a combo: the third strike hits hardest.'],grant(){flags.sword=true}};
  if(id==='shield')return{n:'Old Shield',pages:['A sturdy wooden shield.','Hold SPACE to raise it. It blocks blows from the front, but you cannot swing while you hold it, and you move slowly.'],grant(){flags.shield=true}};
  const k=KEYITEMS.find(q=>q.k===id);
  if(!k)return{n:id,pages:['You found something.'],grant(){flags[id]=true}};
  const t=TOOLS[id];
  const pages=[k.d];
  if(t)pages.push(`Press K or L to use it. ${t.d}`);
  return{n:k.n,pages,grant(){flags[id]=true},icon:k.icon,c:k.c};
}
function itemGet(id,then){
  const d=itemInfo(id);d.grant();
  P.hold=id;P.face={x:0,y:1};P.att=null;P.moving=false;P.blocking=false;
  ui={mode:'itemget',t:0,id,d,then};
  Snd.level();
}
function updateItemGet(dt){
  const s=ui;s.t+=dt;
  if(s.t>2.1||(s.t>1&&Input.confirm())){
    P.hold=null;const d=s.d,then=s.then;
    say(`You got the ${d.n}!`,d.pages,()=>{if(then)then()});
  }
}
// the hero holds the item above his head (called from drawPlayer inside the hero's translated context; top = top of the sprite)
function drawHoldItem(top){
  const id=P.hold;if(!id)return;
  const p=.5+.5*Math.sin(time*8),y0=top-16,R=(c,a,b,w,h)=>{cx.fillStyle=c;cx.fillRect(a,y0+b,w,h)};
  cx.fillStyle='#f0c8a0';cx.fillRect(-5,top+2,2,-8);cx.fillRect(3,top+2,2,-8);   // raised arms
  glow(0,y0+8,22+4*p,'255,230,140',.4);
  if(id==='sword'){R('#e8e8f0',-1,0,3,12);R('#ffffff',-1,0,1,12);R('#c8a040',-4,12,9,2);R('#6a3a1c',-1,14,3,4);R('#c8a040',-1,18,3,1)}
  else if(id==='shield'){R('#2a1808',-6,1,13,15);R('#8a5a2a',-5,2,11,13);R('#a8743a',-5,2,11,3);R('#c8a040',-1,3,3,11);R('#c8a040',-5,8,11,3);R('#e8d8b0',0,8,1,1)}
  else{const k=KEYITEMS.find(q=>q.k===id);if(k)drawIcon(k.icon,k.c,-10,y0-2,2)}
  if(Math.random()<.3)puff(rand(-8,8)+P.x,P.y+y0+rand(0,14),1,'#fff0a0',24);
}
// the raised shield while SPACE is held
function drawShield(){
  if(!P.blocking)return;
  const f=P.face,x=Math.round(f.x*7),y=-5+Math.round(f.y*4);
  cx.fillStyle='#2a1808';cx.fillRect(x-4,y-5,9,11);cx.fillStyle='#8a5a2a';cx.fillRect(x-3,y-4,7,9);cx.fillStyle='#a8743a';cx.fillRect(x-3,y-4,7,2);cx.fillStyle='#c8a040';cx.fillRect(x-1,y-3,3,7);
}
// a hit from (sx,sy): true when the shield took it
function shieldBlocks(sx,sy){
  if(!P.blocking)return false;
  const l=Math.hypot(sx-P.x,sy-P.y)||1;
  if(((sx-P.x)*P.face.x+(sy-P.y)*P.face.y)/l<.3)return false;
  P.inv=.3;shake=Math.max(shake,1.5);
  const bx=P.x+P.face.x*10,by=P.y-4+P.face.y*8;
  puff(bx,by,6,'#ffe9a0',60);fx({k:'ring',x:bx,y:by,r0:2,r1:12,t:0,dur:.18,c:'#fff0a0'});
  P.kx=(P.x-sx)/l*70;P.ky=(P.y-sy)/l*70;Snd.swing();
  return true;
}

// ---------- the first quest: a tutorial in the village ----------
const TUTN=3;
function questNow(){
  if(flags.stage===0&&flags.sword&&!flags.shield)return flags.tut>=2?'Return to Elder Maren':`Practice with your sword: defeat ${TUTN} beetles near the village square (${flags.tutKills||0}/${TUTN})`;
  return QUEST[flags.stage];
}
function tutUpdate(){
  if(flags.tut!==1||!M||M.id!=='world'||!WVS)return;
  const need=TUTN-(flags.tutKills||0),have=E.filter(e=>e.tut&&!e.dead).length;
  if(need<=0||have>=need||Math.hypot(P.x-(WVS.x+20)*TS,P.y-(WVS.y+17)*TS)>26*TS)return;
  const spots=[[23,20],[27,19],[25,22],[21,21],[29,21]];
  for(const[tx,ty]of spots){
    if(E.filter(e=>e.tut&&!e.dead).length>=need)break;
    const x=(WVS.x+tx+.5)*TS,y=(WVS.y+ty+.5)*TS;
    if(!boxFree(x,y,6,6)||Math.hypot(x-P.x,y-P.y)<60)continue;
    const e=makeEnemy('beetle',x,y,1,false);e.tut=true;e.aggro=130;e.hp=e.maxHp=Math.round(e.maxHp*.8);E.push(e);puff(x,y,6,'#c8b080',40);
  }
}
function tutKill(){
  flags.tutKills=(flags.tutKills||0)+1;
  if(flags.tutKills>=TUTN){flags.tut=2;toast('Well fought! Return to Elder Maren.','#a8e0a0');Snd.level()}
  else toast(`Beetle down (${flags.tutKills}/${TUTN})`,'#a8e0a0');
  save();
}

// ---------- touch buttons only for what the hero has ----------
let touchState='';
function syncTouch(){
  const st=[flags.sword,toolIn(0),toolIn(1),flags.shield].map(v=>v?1:0).join('');
  if(st===touchState)return;touchState=st;
  const set=(id,on)=>{const e=document.getElementById(id);if(e)e.style.display=on?'':'none'};
  set('bJ',flags.sword);set('bK',toolIn(0));set('bL',toolIn(1));set('bR',flags.shield);
}

// ---------- never stuck: cutscenes, exits and teleports can leave the hero inside a solid tile or walled in by pots ----------
const tileFree=(tx,ty)=>boxFree((tx+.5)*TS,(ty+.5)*TS,P.hw,P.hh);
function regionSize(tx,ty,cap){
  const seen=new Set([tx+','+ty]),q=[[tx,ty]];let n=0;
  while(q.length&&n<cap){
    const[x,y]=q.pop();n++;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(seen.has(k)||!tileFree(x+dx,y+dy))continue;seen.add(k);q.push([x+dx,y+dy])}
  }
  return n;
}
// true when the hero had to be moved to the nearest tile in open ground
function unstick(){
  const tx=Math.floor(P.x/TS),ty=Math.floor(P.y/TS);
  if(boxFree(P.x,P.y,P.hw,P.hh)&&regionSize(tx,ty,24)>=24)return false;
  for(let r=1;r<=14;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const x=tx+dx,y=ty+dy;
    if(tileFree(x,y)&&regionSize(x,y,24)>=24){P.x=(x+.5)*TS;P.y=(y+.5)*TS;P.kx=P.ky=0;puff(P.x,P.y,6,'#ffffff',30);return true}
  }
  return false;
}
function unstickTick(dt){
  P.ustT=(P.ustT||0)-dt;if(P.ustT>0)return;
  P.ustT=.4;
  if(SC||(typeof fade!=='undefined'&&fade.dir!==0)||P.dead)return;
  unstick();
}
