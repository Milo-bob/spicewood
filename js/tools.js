'use strict';
// ================= Gate items as active tools (Zelda: Link's Awakening style) =================
// Six gate items can be used in a fight on two item slots: A (K) and B (L). They keep opening the world as before.
// Tools have no resource cost, only a short cooldown. They are the answer to guarded bosses: the Grapple Hook opens a boss up and stuns small foes.
// use() returns the cooldown in seconds.
const TOOLORDER=['sickle','boots','hook','bow','lantern','windcharm','emberglove'];
const foesNear=r=>E.filter(e=>!e.dead&&e.state!=='dormant'&&Math.hypot(e.x-P.x,e.y-P.y)<r+(e.hw||8));
// world use, like in Link's Awakening: the sickle cuts the thorn vines, the hook spans the gorge
function tileAhead(d){return M.t[Math.floor((P.y+P.face.y*d)/TS)*M.w+Math.floor((P.x+P.face.x*d)/TS)]}
function vineAhead(){for(const d of[8,18,28])if(tileAhead(d)===T.VINE)return true;return false}
function gorgeAhead(L){for(let d=10;d<=L;d+=8)if(tileAhead(d)===T.GORGE)return true;return false}
function bridgeGorge(how){
  flags.bridged=flags.bridged||{};flags.bridged[M.id]=true;applyBridge();buildLayer();Snd.open();shake=3;
  puff(P.x+P.face.x*30,P.y+P.face.y*30,14,'#c8d4e0',70);
  say(how==='wind'?'Windcharm':'Grapple Hook',[how==='wind'?'The gust carries a bridge of leaves and roots across the gorge!':'The hook bites into a post on the far side. A rope bridge spans the gorge!']);
}
const TOOLS={
  sickle:{d:'Wide sweep around you. Cuts down escorts and pods in one stroke.',use(){
    fx({k:'ring',x:P.x,y:P.y,r0:6,r1:46,t:0,dur:.25,c:'#7ad04a'});puff(P.x,P.y,10,'#7ad04a',70);Snd.swing();
    for(const e of foesNear(40))hitEnemy(e,e.minion?8:1.1,e.x-P.x,e.y-P.y,60,{stun:.3});
    cutAround(P.x,P.y,40);
    if(vineAhead())interact({k:'vine',cut:true});
    return .9}},
  boots:{d:'Dash forward through enemies. You cannot be hit while dashing.',use(){
    const f=P.face;P.att=null;P.swing=0;P.dashT=.22;P.dvx=f.x*430;P.dvy=f.y*430;P.hitSet=new Set();P.dashMult=1.1;P.dashExec=false;Snd.swing();return 1.2}},
  hook:{d:'Hook the nearest foe ahead. Opens a guarded boss, stuns and pulls small foes.',use(){
    const f=P.face,L=130;let best=null,bd=1e9;
    for(const e of E){
      if(e.dead||e.state==='dormant'||e.shielded)continue;
      const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);
      if(d>L+e.hw||d<1||(dx*f.x+dy*f.y)/d<.75)continue;
      if(d<bd){bd=d;best=e}
    }
    const len=best?bd:L;
    for(let i=1;i<=8;i++)puff(P.x+f.x*len*i/8,P.y+f.y*len*i/8-2,1,'#c8d4e0',8);
    Snd.swing();
    if(!best){if(gorgeAhead(L)){bridgeGorge();return 1.6}return .5}
    const dx=best.x-P.x,dy=best.y-P.y;
    if(best.kit&&best.weak<=0){
      const dur=best.kit.dur>0?best.kit.dur:2.2;
      best.weak=dur;best.cd=Math.max(best.cd,dur+.4);best.tele=null;
      fx({k:'ring',x:best.x,y:best.y,r0:4,r1:40,t:0,dur:.35,c:'#ffe040'});Snd.boom();
    }
    hitEnemy(best,.3,-dx,-dy,best.type==='boss'?0:35,{stun:best.kit?0:2});
    return 1.6}},
  bow:{d:'Shoots an arrow the way you face. Arrows cross water and gorges and strike distant orbs.',use(){
    const f=P.face;shoot('arrow',Math.atan2(f.y,f.x),1.5,{speed:300,life:.8});Snd.shoot();return .45}},
  lantern:{d:'A flare of light: burns and dazes everything close.',use(){
    fx({k:'ring',x:P.x,y:P.y,r0:6,r1:70,t:0,dur:.35,c:'#ffd060'});puff(P.x,P.y,14,'#ffd060',80);Snd.spell();
    for(const e of foesNear(66)){applyPoison(e);hitEnemy(e,.5,e.x-P.x,e.y-P.y,30,{stun:.6})}
    if(vineAhead())interact({k:'vine',cut:true,fire:true});   // the flame burns thorns away
    for(const c of M.chests)if(c.hidden&&!CH.some(q=>q.id===c.id)&&Math.hypot(c.x-P.x,c.y-P.y)<110){CH.push(Object.assign({},c,{hidden:false,open:!!flags.chests[c.id]}));puff(c.x,c.y,12,'#ffe9a0',60);toast('The light reveals a hidden chest!','#ffe9a0');Snd.pickup()}
    return 3.5}},
  windcharm:{d:'A gust that shoves foes back and blows enemy shots away.',use(){
    const f=P.face;
    for(let i=0;i<8;i++)puff(P.x+f.x*(10+i*10),P.y+f.y*(10+i*10),2,'#a8e8ff',30);Snd.spell();
    for(const e of foesNear(96)){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if((dx*f.x+dy*f.y)/d>.35)hitEnemy(e,.2,dx,dy,e.type==='boss'?0:140,{slow:2})}
    EP=EP.filter(p=>{const dx=p.x-P.x,dy=p.y-P.y,d=Math.hypot(dx,dy)||1;const hit=d<110&&(dx*f.x+dy*f.y)/d>.35;if(hit)puff(p.x,p.y,3,'#a8e8ff',30);return!hit});
    if(gorgeAhead(110))bridgeGorge('wind');   // the gust builds a bridge over a gorge
    return 2.5}},
  emberglove:{d:'Hurl a fireball that bursts on impact.',use(){
    const d=aimDir(220,true);P.face=d;shoot('fire',Math.atan2(d.y,d.x),1.8,{aoe:30,speed:170,life:1.2});Snd.spell();
    if(vineAhead())interact({k:'vine',cut:true,fire:true});
    return 1.5}}
};
// fill the two item slots with new tools automatically
function syncToolSlots(){
  if(!flags)return;
  if(flags.toolA&&!flags[flags.toolA])flags.toolA=null;
  if(flags.toolB&&!flags[flags.toolB])flags.toolB=null;
  for(const k of TOOLORDER){
    if(!flags[k]||flags.toolA===k||flags.toolB===k)continue;
    if(!flags.toolA)flags.toolA=k;else if(!flags.toolB)flags.toolB=k;
  }
}
// put a tool on slot i (0 = A, 1 = B); a tool sits on one slot only
function assignTool(k,i){
  if(!TOOLS[k]||!flags[k])return;
  if(flags.toolA===k)flags.toolA=null;
  if(flags.toolB===k)flags.toolB=null;
  if(i===0)flags.toolA=k;else flags.toolB=k;
  Snd.menu();
}
function toolIn(i){return i?flags.toolB:flags.toolA}
// touch screens have no precise aiming: tools snap to the four directions and lock on to the nearest foe (vines and gorges ahead win over foes)
function touchAim(range,snap){
  if(typeof touchActive!=='function'||!touchActive())return;
  if(snap!==false){const f=P.face;P.face=Math.abs(f.x)>=Math.abs(f.y)?{x:Math.sign(f.x),y:0}:{x:0,y:Math.sign(f.y)};if(vineAhead()||gorgeAhead(range))return}
  let best=null,bd=range;
  for(const e of E){if(e.dead||e.state==='dormant')continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;best=e}}
  if(best){const l=Math.hypot(best.x-P.x,best.y-P.y)||1;P.face={x:(best.x-P.x)/l,y:(best.y-P.y)/l}}
}
function useTool(i){
  const k=toolIn(i),t=k&&TOOLS[k];if(!t)return;
  P.tcd=P.tcd||[0,0];P.tcdMax=P.tcdMax||[1,1];
  if(P.tcd[i]>0||P.dead)return;
  if(k==='hook'||k==='windcharm'||k==='emberglove')touchAim(150);
  else if(k==='bow')touchAim(220,false);
  const cd=t.use();
  P.tcd[i]=cd;P.tcdMax[i]=Math.max(.1,cd);
  ftreeTool(k);
}
