'use strict';
// ================= The gate items against the terrain =================
// Each tool answers one kind of ground (js/tools.js holds the tools themselves, js/fields.js the terrain):
//   Thornsickle     cuts brambles and roots        Ember Glove (fireball)  burns brambles
//   Miner's Lantern melts ice into a puddle        Windcharm               calms the wind around you for a few seconds (gusts cannot push you)
//   Grapple Hook    pulls you across quicksand, currents and brambles in one swoop
//   Wooden Boots    the dash makes you immune for a moment, so geysers cannot hurt you while you cross
// A cut, burnt or melted field is "gone" for a while (f.gone = game time when it comes back), then it regrows.
const FIELD_TIPS={
  thorn:'Brambles slow and sting you. The Thornsickle cuts them, the Ember Glove burns them.',
  ice:'Slippery ice. The Miner\'s Lantern melts it.',
  sand:'Quicksand drags at your feet. The Grapple Hook pulls you across.',
  current:'A strong current. The Grapple Hook pulls you across.',
  gust:'Gusts blow you off course. The Windcharm calms the wind around you.',
  vent:'Geysers! Dash with the Wooden Boots to cross unharmed.',
  crumble:'The floor crumbles under your feet. Keep moving, stay on the solid cross, or dash across with the Wooden Boots.'
};
function fieldTip(F){
  if(!F||!FIELD_TIPS[F.k])return;
  flags.tips=flags.tips||{};
  if(flags.tips[F.k])return;
  flags.tips[F.k]=true;toast(FIELD_TIPS[F.k],'#e8d8a8');toasts[toasts.length-1].t=5;
}
// every live field of these kinds within r pixels of (x,y)
function fieldsNear(x,y,r,kinds){
  const out=[];
  for(const f of M.fields||[]){
    if(!kinds.includes(f.k)||f.gone>time)continue;
    const nx=clamp(x,f.x*TS,(f.x+f.w)*TS),ny=clamp(y,f.y*TS,(f.y+f.h)*TS);
    if(Math.hypot(nx-x,ny-y)<r)out.push(f);
  }
  return out;
}
function clearFields(list,secs,col,msg){
  for(const f of list){
    f.gone=time+secs;
    for(let i=0;i<6;i++)puff((f.x+Math.random()*f.w)*TS,(f.y+Math.random()*f.h)*TS,2,col,40);
  }
  if(list.length&&msg)toast(msg,'#a8e0a0');
}
function burnFields(x,y,r){clearFields(fieldsNear(x,y,r,['thorn']),50,'#ffa040','The brambles burn away.')}

(function(){
  if(typeof TOOLS==='undefined')return;
  const wrap=(k,after)=>{const o=TOOLS[k].use;TOOLS[k].use=function(){const cd=o.call(this);after();return cd}};
  wrap('sickle',()=>clearFields(fieldsNear(P.x,P.y,44,['thorn']),40,'#7ad04a','You cut a way through the brambles.'));
  wrap('lantern',()=>clearFields(fieldsNear(P.x,P.y,72,['ice']),30,'#ffd890','The ice melts into a puddle.'));
  wrap('windcharm',()=>{P.calm=time+4.5;if(fieldsNear(P.x,P.y,200,['gust']).length)toast('The wind falls calm around you.','#a8e8ff')});
  // the hook: pull across a field if no foe is in the way
  const hookOld=TOOLS.hook.use;
  TOOLS.hook.use=function(){
    const f=P.face,L=130;
    for(const e of E)if(!e.dead&&e.state!=='dormant'){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<L+e.hw&&d>1&&(dx*f.x+dy*f.y)/d>.75)return hookOld.call(this)}
    const KINDS=['sand','current','thorn'];let enter=-1,exit=-1;
    for(let d=8;d<=L;d+=4){
      const fl=fieldsNear(P.x+f.x*d,P.y+f.y*d,1,KINDS).filter(q=>P.x+f.x*d>=q.x*TS&&P.x+f.x*d<(q.x+q.w)*TS&&P.y+f.y*d>=q.y*TS&&P.y+f.y*d<(q.y+q.h)*TS);
      if(fl.length){if(enter<0)enter=d}
      else if(enter>=0){exit=d;break}
    }
    if(enter<0||exit<0)return hookOld.call(this);
    const tx=P.x+f.x*(exit+6),ty=P.y+f.y*(exit+6);
    if(!boxFree(tx,ty,P.hw,P.hh))return hookOld.call(this);
    for(let i=1;i<=8;i++)puff(P.x+f.x*(exit+6)*i/8,P.y+f.y*(exit+6)*i/8-2,1,'#c8d4e0',8);
    Snd.swing();P.att=null;P.swing=0;P.dashT=(exit+6)/620;P.dvx=f.x*620;P.dvy=f.y*620;P.hitSet=new Set();P.dashMult=.0001;P.dashExec=false;
    return 1.4;
  };
  // fireballs burn brambles where they burst
  if(typeof explode==='function'){const ex=explode;explode=function(p){ex(p);burnFields(p.x,p.y,36)}}
})();
