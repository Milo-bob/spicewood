'use strict';
// ================= Look and feel: zone colour grades, ambient particles, water shimmer =================
const GRADES={
  warm:{g:['rgb(132,112,184)','rgb(190,128,120)','rgb(236,150,100)'],sun:'rgba(255,130,40,.30)'},
  cold:{g:['rgb(150,170,226)','rgb(200,214,240)','rgb(236,240,250)'],sun:'rgba(190,220,255,.22)'},
  hot:{g:['rgb(205,170,120)','rgb(240,196,126)','rgb(255,220,140)'],sun:'rgba(255,200,80,.30)'},
  ash:{g:['rgb(110,70,90)','rgb(170,90,80)','rgb(224,112,70)'],sun:'rgba(255,90,30,.28)'},
  green:{g:['rgb(112,140,156)','rgb(150,190,140)','rgb(196,224,142)'],sun:'rgba(200,255,150,.20)'},
  dream:{g:['rgb(150,120,210)','rgb(190,160,230)','rgb(226,202,246)'],sun:'rgba(220,180,255,.22)'},
  wind:{g:['rgb(150,150,196)','rgb(204,182,150)','rgb(244,214,132)'],sun:'rgba(255,220,120,.26)'}
};
const gradeOf=()=>GRADES[M.grade||(M.cold?'cold':'warm')];
const fxType=()=>M.fx||(M.cold?'snow':'leaves');
// region borders: the grade and the mist ease over (~2 s) instead of switching at the border
const nums=s=>s.match(/[\d.]+/g).map(Number);
const GRADEN={};for(const k in GRADES)GRADEN[k]={g:GRADES[k].g.map(nums),sun:nums(GRADES[k].sun)};
const gradeBlend={map:null,key:null,g:null,sun:null,mist:0};
function gradeStep(dt){
  const key=M.grade||(M.cold?'cold':'warm'),T_=GRADEN[key],b=gradeBlend;
  if(b.map!==M.id||!b.g||b.snap){b.map=M.id;b.snap=false;b.g=T_.g.map(c=>c.slice());b.sun=T_.sun.slice();b.mist=M.mist?1:0}
  const k=1-Math.exp(-dt*1.6);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)b.g[i][j]+=(T_.g[i][j]-b.g[i][j])*k;
  for(let j=0;j<4;j++)b.sun[j]+=(T_.sun[j]-b.sun[j])*k;
  b.mist+=((M.mist?1:0)-b.mist)*k;
  return b;
}
// 40 shared particles; each ambient type moves and draws them its own way.
// every particle fades out, takes on the new region's type, and fades back in (staggered per particle)
function drawAmbient(dt,alpha){
  const target=fxType();
  for(const l of LEAVES){
    if(l.t===undefined){l.t=target;l.k=1;l.fr=rand(.5,1.4)}
    if(l.t!==target){l.k-=dt*l.fr;if(l.k<=0){l.k=0;l.t=target}}
    else if(l.k<1)l.k=Math.min(1,l.k+dt*l.fr);
    const t=l.t;
    let x=l.x,y=l.y,c=l.c,sz=2,a=alpha;
    if(t==='leaves'){l.y+=l.s*dt;l.x+=Math.sin(time*1.4+l.p)*14*dt+6*dt}
    else if(t==='snow'){l.y+=l.s*.7*dt;l.x+=Math.sin(time*1.1+l.p)*9*dt+3*dt;c='#f4f8ff';sz=l.s>16?2:1}
    else if(t==='ash'){l.y-=l.s*.8*dt;l.x+=Math.sin(time*1.7+l.p)*10*dt-4*dt;c=l.p>3?'#ff9a3a':'#7a6a6a';sz=1;a=alpha*(.5+.5*Math.sin(time*3+l.p))}
    else if(t==='dust'){l.x+=(34+l.s*2)*dt;l.y+=Math.sin(time*2+l.p)*6*dt;c='#e8cc90';sz=1;a=alpha*.55}
    else if(t==='wind'){l.x+=(60+l.s*3)*dt;l.y+=Math.sin(time*3+l.p)*8*dt;c=l.p>3?'#e8f0a0':'#c8e090';sz=l.s>15?3:2;a=alpha*.6}
    else if(t==='fireflies'||t==='pollen'){l.x+=Math.sin(time*.8+l.p)*10*dt;l.y+=Math.cos(time*.7+l.p*1.3)*8*dt;c=t==='pollen'?'#fff0a0':'#d8ff90';sz=2;a=alpha*clamp(.5+.6*Math.sin(time*2.2+l.p*5),0,1)}
    else if(t==='sparkle'){l.y+=Math.sin(time+l.p)*3*dt;c=l.p>3?'#e8d0ff':'#a0f0ff';sz=l.s>15?2:1;a=alpha*clamp(Math.sin(time*3+l.p*4),0,1)}
    if(l.y>H+4){l.y=-4;l.x=Math.random()*W}if(l.y<-6){l.y=H+4;l.x=Math.random()*W}
    if(l.x>W+4)l.x=-4;if(l.x<-6)l.x=W+4;
    a*=l.k;
    if(a<=0)continue;
    cx.globalAlpha=a;cx.fillStyle=c;cx.fillRect(Math.round(l.x),Math.round(l.y),sz,sz);
    if((t==='fireflies'||t==='pollen')&&a>.5){cx.globalAlpha=a*.25;cx.fillRect(Math.round(l.x)-1,Math.round(l.y)-1,sz+2,sz+2)}
  }
  cx.globalAlpha=1;
}
// water tiles get a few moving highlights (the tile layer itself is static)
function drawWaterShimmer(){
  const tx0=Math.max(0,Math.floor(cam.x/TS)),ty0=Math.max(0,Math.floor(cam.y/TS)),tx1=Math.min(M.w-1,tx0+Math.ceil(W/TS)+1),ty1=Math.min(M.h-1,ty0+Math.ceil(H/TS)+1);
  cx.fillStyle='rgba(255,255,255,.38)';
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){
    const t=M.t[ty*M.w+tx];
    if(t!==4&&t!==25)continue;
    const ph=Math.sin(time*1.6+tx*.9+ty*1.7);
    if(ph>.6)cx.fillRect(tx*TS+((tx*7+ty*3)%9)+Math.round(ph*2),ty*TS+((ty*5+tx)%11)+2,3,1);
  }
}
