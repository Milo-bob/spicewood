'use strict';
// ================= Terrain fields: ice, currents, gusts, quicksand, brambles, geysers =================
// A field is a rectangle (in tiles) on a map that changes how the ground behaves. They give regions and dungeons their own way of moving:
//   ice      the hero slides and has to steer ahead      current  a river or conveyor pushes you along (dir)
//   gust     wind blows in pulses (a warning first)      sand     quicksand, slows you down
//   thorn    brambles: slow, and they sting              vent     a geyser: cracks glow, then it bursts (damage)
// Fields live in M.fields (world fields are merged from the region maps) and need no tiles of their own.
const FIELD_KINDS={ice:1,current:1,gust:1,sand:1,thorn:1,vent:1,crumble:1};
//   crumble  the floor cracks under your feet and falls away; a hole drops you back to where you came in (the cross through the room's middle is solid)
const FCR=new Map();   // crumble field -> {s:state per tile (0 whole, 1 cracking, 2 gone), t:timers}
function crumbleOf(f){let c=FCR.get(f);if(!c){c={s:new Uint8Array(f.w*f.h),t:new Float32Array(f.w*f.h)};FCR.set(f,c)}return c}
const crumbleLane=(f,tx,ty)=>f.lx!==undefined&&(Math.abs(tx-f.lx)<=1||Math.abs(ty-f.ly)<=1);
const FPUSH={current:46,gust:84};
const fieldPeriod={gust:[4.2,1.7],vent:[3.4,1.6]};   // [cycle seconds, active seconds]
let FLD_HIT=new Map();   // vent -> last cycle that damaged the hero

function fieldAt(m,px,py){
  const fl=m.fields;if(!fl||!fl.length)return null;
  const tx=px/TS,ty=py/TS;
  for(const f of fl)if(!(f.gone>time)&&tx>=f.x&&tx<f.x+f.w&&ty>=f.y&&ty<f.y+f.h)return f;
  return null;
}
// where in its cycle a pulsing field is: 0 quiet, 1 warning, 2 active
function fieldPhase(f){
  const pp=fieldPeriod[f.k];if(!pp)return 2;
  const t=(time+(f.off||0))%pp[0],act=pp[1];
  if(t<pp[0]-act-(f.k==='vent'?.9:.7))return 0;
  if(t<pp[0]-act)return 1;
  return 2;
}
function fieldDamage(){return Math.round(9*(1+.2*(P.lvl-1))*.9)}
const DIRV={N:[0,-1],S:[0,1],E:[1,0],W:[-1,0]};

// movement effects on the hero; called from updatePlay in place of the plain move
function fieldMove(dt,ax,sf){
  const F=fieldAt(M,P.x,P.y);
  let mul=1;
  if(F&&F.k==='sand')mul=.45;else if(F&&F.k==='thorn')mul=.55;
  const tx=ax.l>.1?ax.x*P.spd*sf*mul:0,ty=ax.l>.1?ax.y*P.spd*sf*mul:0;
  if(F&&F.k==='ice'){
    P.sv=P.sv||{x:0,y:0};
    const k=Math.min(1,dt*1.5);P.sv.x+=(tx-P.sv.x)*k;P.sv.y+=(ty-P.sv.y)*k;
    move(P,P.sv.x*dt,P.sv.y*dt);
    P.moving=Math.hypot(P.sv.x,P.sv.y)>8;
  }else{
    if(P.sv){P.sv.x*=.5;P.sv.y*=.5;if(Math.hypot(P.sv.x,P.sv.y)<6)P.sv=null}
    if(tx||ty)move(P,tx*dt,ty*dt);
  }
  if(F&&(F.k==='current'||F.k==='gust')){
    const v=DIRV[F.dir]||[0,0],act=F.k==='gust'?(fieldPhase(F)===2&&!(P.calm>time)?1:0):1;
    const pw=FPUSH[F.k]*(F.strong?1.35:1);if(act)move(P,v[0]*pw*dt,v[1]*pw*dt);
  }
  if(F&&F.k==='thorn'&&ax.l>.1){P.thornT=(P.thornT||0)-dt;if(P.thornT<=0){P.thornT=1.1;hurtPlayer(Math.max(2,Math.round(fieldDamage()*.25)),P.x,P.y+6);puff(P.x,P.y,5,'#4a8a2a',30)}}
}
function updateCrumble(f,dt){
  const c=crumbleOf(f),px=Math.floor(P.x/TS),py=Math.floor(P.y/TS);
  for(let i=0;i<c.s.length;i++){
    if(c.s[i]===0)continue;
    c.t[i]-=dt;
    if(c.t[i]<=0){if(c.s[i]===1){c.s[i]=2;c.t[i]=7;const x=(f.x+i%f.w)*TS+8,y=(f.y+Math.floor(i/f.w))*TS+8;puff(x,y,8,'#5a5048',40);Snd.boom()}else c.s[i]=0}
  }
  const inside=px>=f.x&&px<f.x+f.w&&py>=f.y&&py<f.y+f.h;
  if(!inside)return false;
  const i=(py-f.y)*f.w+(px-f.x);
  if(crumbleLane(f,px,py)||P.dashT>0)return true;
  if(c.s[i]===0){c.s[i]=1;c.t[i]=.55;Snd.menu()}
  else if(c.s[i]===2&&P.rollT<=0){   // fell through: back to where you came in
    const o=P.lastOut||{x:(f.lx!==undefined?f.lx:f.x)*TS+8,y:(f.ly!==undefined?f.ly:f.y)*TS+8};
    hurtPlayer(Math.max(2,Math.round(fieldDamage()*.5)),P.x,P.y);
    puff(P.x,P.y,12,'#3a3028',60);P.x=o.x;P.y=o.y;P.kx=P.ky=0;P.inv=Math.max(P.inv,1.2);
    toast('The floor gave way!','#ff9a70');
  }
  return true;
}
function updateFields(dt){
  const fl=M.fields;if(!fl||!fl.length)return;
  {let on=false,any=false;for(const f of fl)if(f.k==='crumble'){any=true;if(updateCrumble(f,dt))on=true}if(any&&!on)P.lastOut={x:P.x,y:P.y}}   // the last spot on solid ground
  if(typeof fieldTip==='function')fieldTip(fieldAt(M,P.x,P.y));
  for(let i=0;i<fl.length;i++){
    const f=fl[i];if(f.k!=='vent'||f.gone>time)continue;
    const ph=fieldPhase(f),cyc=Math.floor((time+(f.off||0))/fieldPeriod.vent[0]);
    if(ph===2&&FLD_HIT.get(f)!==cyc){
      FLD_HIT.set(f,cyc);
      const cxp=(f.x+f.w/2)*TS,cyp=(f.y+f.h/2)*TS;
      if(Math.abs(cxp-cam.x-W/2)<W&&Math.abs(cyp-cam.y-H/2)<H){shake=Math.max(shake,2);puff(cxp,cyp,10,'#ff8a30',70)}
      if(P.x>f.x*TS&&P.x<(f.x+f.w)*TS&&P.y>f.y*TS&&P.y<(f.y+f.h)*TS)hurtPlayer(fieldDamage(),cxp,cyp);
    }
  }
}
// drawing: an overlay per kind, below props and characters
function drawFields(){
  const fl=M.fields;if(!fl||!fl.length)return;
  const x0=cam.x-20,x1=cam.x+W+20,y0=cam.y-20,y1=cam.y+H+20,t=time;
  for(const f of fl){
    const px=f.x*TS,py=f.y*TS,pw=f.w*TS,ph=f.h*TS;
    if(px>x1||px+pw<x0||py>y1||py+ph<y0)continue;
    if(f.gone>time){   // cut, burnt or melted: a patch of bare ground, a puddle or ash
      if(f.k==='ice'){cx.fillStyle='rgba(120,170,220,.28)';cx.fillRect(px+2,py+2,pw-4,ph-4)}
      else if(f.k==='thorn'){cx.fillStyle='rgba(40,34,30,.35)';cx.fillRect(px,py,pw,ph)}
      continue;
    }
    if(f.k==='crumble'){   // tile by tile: worn floor, cracking floor, hole
      const c=crumbleOf(f);
      for(let ty=0;ty<f.h;ty++)for(let tx=0;tx<f.w;tx++){
        if(crumbleLane(f,f.x+tx,f.y+ty))continue;
        const i=ty*f.w+tx,s=c.s[i],x=px+tx*TS,y=py+ty*TS;
        if(s===0){cx.fillStyle='rgba(20,14,8,.14)';cx.fillRect(x,y,16,16);cx.fillStyle='rgba(0,0,0,.32)';cx.fillRect(x+3,y+4,1,6);cx.fillRect(x+4,y+9,5,1);cx.fillRect(x+10,y+3,1,5);cx.fillRect(x+9,y+7,4,1)}
        else if(s===1){const j=Math.sin(time*50+i)*1.2;cx.fillStyle='rgba(10,6,2,.35)';cx.fillRect(x,y,16,16);cx.fillStyle='rgba(0,0,0,.7)';cx.fillRect(x+2+j,y+3,1,10);cx.fillRect(x+3+j,y+8,9,1);cx.fillRect(x+11+j,y+2,1,9);cx.fillRect(x+6,y+5,1,7)}
        else{cx.fillStyle='#000';cx.fillRect(x,y,16,16);cx.fillStyle='#2a2018';cx.fillRect(x,y,16,2);cx.fillRect(x,y+14,16,2);cx.fillRect(x,y,2,16);cx.fillRect(x+14,y,2,16);cx.fillStyle='#4a3a2a';cx.fillRect(x+1,y+1,14,1)}
      }
      continue;
    }
    cx.save();cx.beginPath();cx.rect(px,py,pw,ph);cx.clip();
    if(f.k==='ice'){
      cx.fillStyle='rgba(190,230,255,.38)';cx.fillRect(px,py,pw,ph);
      cx.fillStyle='rgba(255,255,255,.35)';
      for(let i=0;i<pw+ph;i+=14){cx.fillRect(px+((i+t*8)%(pw+ph))-ph*.5,py,1,ph)}
      cx.fillStyle='rgba(255,255,255,.55)';const s=(Math.floor(t*3)+f.x)%6;cx.fillRect(px+s*5+3,py+s*3+2,2,2);
    }else if(f.k==='current'){
      const v=DIRV[f.dir]||[1,0];
      const sk=f.skin;
      cx.fillStyle=sk==='belt'?'rgba(54,54,62,.62)':sk==='lava'?'rgba(230,90,20,.42)':'rgba(90,150,210,.30)';cx.fillRect(px,py,pw,ph);
      cx.fillStyle=sk==='belt'?'rgba(230,200,120,.6)':sk==='lava'?'rgba(255,230,140,.7)':'rgba(220,240,255,.55)';
      for(let gx=0;gx<f.w;gx+=2)for(let gy=0;gy<f.h;gy+=2){
        const o=(t*22+gx*5+gy*7)%16,ax=px+gx*TS+8+v[0]*(o-8),ay=py+gy*TS+8+v[1]*(o-8);
        cx.fillRect(Math.round(ax-(v[0]?3:0)),Math.round(ay-(v[1]?3:0)),v[0]?6:2,v[1]?6:2);
      }
    }else if(f.k==='gust'){
      const phz=fieldPhase(f),v=DIRV[f.dir]||[1,0],a=phz===2?.5:phz===1?.22+.12*Math.sin(t*14):.08;
      cx.fillStyle=f.skin==='spore'?`rgba(190,255,170,${a})`:`rgba(255,255,235,${a})`;
      for(let k=0;k<f.w*f.h/3;k++){
        const sp=phz===2?170:30,o=(t*sp+k*37)%(v[0]?pw:ph);
        const gx=v[0]?px+(v[0]>0?o:pw-o):px+(k*53)%pw,gy=v[1]?py+(v[1]>0?o:ph-o):py+(k*41)%ph;
        cx.fillRect(Math.round(gx),Math.round(gy),v[0]?9:1,v[1]?9:1);
      }
    }else if(f.k==='sand'){
      const sk=f.skin;cx.fillStyle=sk==='mud'?'rgba(58,62,30,.62)':sk==='ash'?'rgba(70,64,60,.6)':sk==='spice'?'rgba(200,110,40,.55)':'rgba(176,132,62,.55)';cx.fillRect(px,py,pw,ph);
      cx.strokeStyle=sk==='mud'?'rgba(30,36,14,.6)':sk==='ash'?'rgba(30,28,26,.6)':'rgba(110,76,30,.5)';cx.lineWidth=1;
      for(let k=1;k<4;k++){cx.beginPath();cx.ellipse(px+pw/2,py+ph/2,pw*k/8+Math.sin(t*1.5+k)*1.5,ph*k/8,0,0,TAU);cx.stroke()}
    }else if(f.k==='thorn'){
      const roots=f.skin==='roots';cx.fillStyle=roots?'rgba(50,30,60,.55)':'rgba(40,70,20,.55)';cx.fillRect(px,py,pw,ph);
      cx.fillStyle=roots?'#4a2a5a':'#2a4a14';for(let k=0;k<f.w*f.h*1.4;k++){const gx=px+(k*47)%pw,gy=py+(k*29)%ph;cx.fillRect(gx,gy,1,4);cx.fillRect(gx-1,gy+3,3,1)}
      cx.fillStyle='#8a2a2a';for(let k=0;k<f.w*f.h*.3;k++)cx.fillRect(px+(k*61)%pw,py+(k*37)%ph,1,1);
    }else if(f.k==='vent'){
      const phz=fieldPhase(f),cxp=px+pw/2,cyp=py+ph/2;
      cx.fillStyle='rgba(20,10,6,.55)';cx.beginPath();cx.ellipse(cxp,cyp,pw*.42,ph*.38,0,0,TAU);cx.fill();
      if(phz>=1){
        const g=phz===2?1:.45+.35*Math.sin(t*20);
        const steam=f.skin==='steam',soul=f.skin==='soul',gr=cx.createRadialGradient(cxp,cyp,2,cxp,cyp,pw*.7);gr.addColorStop(0,steam?`rgba(240,240,240,${.85*g})`:soul?`rgba(170,230,255,${.9*g})`:`rgba(255,220,100,${.9*g})`);gr.addColorStop(1,steam?'rgba(200,200,200,0)':soul?'rgba(60,120,255,0)':'rgba(255,80,20,0)');
        cx.fillStyle=gr;cx.fillRect(px-8,py-8,pw+16,ph+16);
        if(phz===2){cx.fillStyle=steam?'rgba(245,245,245,.85)':soul?'rgba(190,235,255,.85)':'rgba(255,230,140,.85)';cx.fillRect(cxp-4,cyp-30+Math.sin(t*40)*3,8,30);cx.fillStyle=steam?'rgba(200,200,205,.7)':soul?'rgba(90,150,255,.7)':'rgba(255,120,40,.7)';cx.fillRect(cxp-7,cyp-18,14,18)}
      }else{cx.fillStyle='#c0501a';cx.fillRect(cxp-4,cyp-1,8,1);cx.fillRect(cxp-1,cyp-4,1,8)}
    }
    cx.restore();
  }
}
// placing fields while a region is generated (zones.js): S.hazards = [[kind,count,w,h,{path:true,dir:'path'|'perp'|'N'..}]]
function placeHazards(m,z,S,nodes,edges,pathOf,owned,rndf){
  const H=S.hazards;if(!H)return;
  m.fields=m.fields||[];
  const bad=nodes.filter(n=>n.kind==='exit'||n.kind==='main'||n.kind==='dungeon'||n.kind==='arena'||n.kind==='void'||n.noSpawn);
  const okRect=(x0,y0,w,h)=>{
    let good=0;
    for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
      if(!owned(x,y))return false;
      const t=gt(m,x,y);if(t<0)return false;
      if(!SOLID[t]||t===T.PATH)good++;
      if(t===T.OAK||t===T.VINE||t===T.GORGE)return false;
    }
    if(good<w*h*.85)return false;
    const cxp=x0+w/2,cyp=y0+h/2;
    for(const n of bad)if(Math.hypot(n.x-cxp,n.y-cyp)<n.r+9+Math.max(w,h)/2)return false;
    for(const f of m.fields)if(x0<f.x+f.w+1&&x0+w+1>f.x&&y0<f.y+f.h+1&&y0+h+1>f.y)return false;
    if(m.reserve&&m.reserve.some(q=>x0<=q[2]&&x0+w>=q[0]&&y0<=q[3]&&y0+h>=q[1]))return false;
    for(const w2 of m.warps){const wx=w2.x/TS,wy=w2.y/TS;if(wx>x0-3&&wx<x0+w+3&&wy>y0-3&&wy<y0+h+3)return false}
    return true;
  };
  for(const[kind,count,w,h,opt]of H){
    const o=opt||{};
    for(let k=0,g=0;k<count&&g<count*60;g++){
      let ax,ay,ddx=0,ddy=0;
      if(o.path&&edges.length){
        const e=edges[Math.floor(rndf()*edges.length)],p=pathOf(e[0],e[1]),seg=rndf()<.5?0:1,t=rndf();
        ax=p[seg][0]+(p[seg+1][0]-p[seg][0])*t;ay=p[seg][1]+(p[seg+1][1]-p[seg][1])*t;
        ddx=p[seg+1][0]-p[seg][0];ddy=p[seg+1][1]-p[seg][1];
      }else{
        const camps=nodes.filter(n=>n.kind==='camp'&&!n.gate);if(!camps.length)break;
        const n=camps[Math.floor(rndf()*camps.length)],a=rndf()*TAU,d=rndf()*(n.r+3);ax=n.x+Math.cos(a)*d;ay=n.y+Math.sin(a)*d;
      }
      let fw=w,fh=h,dir=o.dir;
      const horiz=Math.abs(ddx)>=Math.abs(ddy);
      if(o.path&&o.dir==='along'){dir=horiz?(ddx>=0?'E':'W'):(ddy>=0?'S':'N');if(o.oriented){fw=horiz?w:h;fh=horiz?h:w}}
      else if(o.path&&o.dir==='across'){dir=horiz?(rndf()<.5?'N':'S'):(rndf()<.5?'E':'W');if(o.oriented){fw=horiz?h:w;fh=horiz?w:h}}
      else if(!dir||dir==='any')dir=['N','S','E','W'][Math.floor(rndf()*4)];
      const x0=Math.round(ax-fw/2),y0=Math.round(ay-fh/2);
      if(!okRect(x0,y0,fw,fh))continue;
      m.fields.push({k:kind,x:x0,y:y0,w:fw,h:fh,dir,off:rndf()*4,skin:o.skin});k++;
    }
  }
}
