'use strict';
// ================= HUD: status panel, buffs, quest tracker, minimap, skill bar, quick bar =================
// ---------- skill glyphs ----------
const SKILLGLYPH={cleave:'ring',slam:'ring',multishot:'arrows',pierce:'arrows',fireball:'fire',nova:'frost',dash:'dash',knives:'arrows',shieldbash:'shield',bloodrage:'buff',smite:'light',
  sniper:'arrows',trap:'trap',rain:'arrows',meteor:'fire',frostbolt:'frost',blink:'dash',execute:'blade',smoke:'ring',venom:'poison'};
function glyph(kind,x,y,s,c,c2){
  const p=(a,b,w,h,col)=>{cx.fillStyle=col||c;cx.fillRect(Math.round(x+a*s/16),Math.round(y+b*s/16),Math.max(1,Math.round(w*s/16)),Math.max(1,Math.round(h*s/16)))};
  c2=c2||'#ffffff';
  switch(kind){
    case'ring':p(5,2,6,1);p(5,13,6,1);p(2,5,1,6);p(13,5,1,6);p(3,3,2,2);p(11,3,2,2);p(3,11,2,2);p(11,11,2,2);p(7,7,2,2,c2);break;
    case'arrows':p(7,2,2,11);p(4,4,2,8);p(10,4,2,8);p(5,2,2,2,c2);p(9,2,2,2,c2);p(7,0,2,2,c2);break;
    case'fire':p(6,2,4,2);p(5,4,6,3);p(4,7,8,5);p(6,12,4,2);p(6,7,4,4,c2);break;
    case'frost':p(7,1,2,14);p(1,7,14,2);p(3,3,2,2);p(11,3,2,2);p(3,11,2,2);p(11,11,2,2);p(7,7,2,2,c2);break;
    case'blade':p(10,1,3,3);p(8,4,3,3);p(6,7,3,3);p(4,10,3,3);p(2,10,4,2,c2);p(2,13,3,2,'#8a5a2a');break;
    case'shield':p(3,2,10,2);p(3,4,10,6);p(4,10,8,2);p(6,12,4,2);p(7,5,2,6,c2);break;
    case'buff':p(7,2,2,12);p(4,5,3,2);p(9,5,3,2);p(5,3,2,2);p(9,3,2,2);p(7,2,2,2,c2);break;
    case'dash':p(2,3,3,2);p(4,5,3,2);p(6,7,3,2);p(4,9,3,2);p(2,11,3,2);p(9,3,3,2);p(11,5,3,2);p(13,7,2,2,c2);p(11,9,3,2);p(9,11,3,2);break;
    case'poison':p(7,1,2,2);p(6,3,4,2);p(5,5,6,3);p(4,8,8,4);p(6,12,4,2);p(6,8,2,2,c2);break;
    case'light':p(7,1,2,14);p(1,7,14,2);p(5,5,6,6,c2);break;
    case'trap':p(2,11,12,2);p(3,6,2,5);p(7,4,2,7);p(11,6,2,5);p(7,4,2,2,c2);break;
    case'star':p(7,1,2,14);p(1,7,14,2);p(3,3,2,2);p(11,3,2,2);p(3,11,2,2);p(11,11,2,2);p(6,6,4,4,c2);break;
    case'attack':p(10,1,3,3);p(8,4,3,3);p(6,7,3,3);p(4,10,3,3,c2);p(1,11,5,2,'#e8d8b0');p(2,13,2,2,'#8a5a2a');break;
    case'roll':p(3,3,10,2);p(3,3,2,8);p(3,11,8,2);p(11,8,2,5);p(9,6,4,2,c2);break;
  }
}

// ---------- minimap ----------
const MMW=88,MMH=60;
const MMFOG={};
let mmMode=1;
const MMC={0:[78,96,44],1:[84,64,36],2:[198,164,112],3:[24,40,26],4:[48,92,140],5:[150,100,66],6:[150,100,66],7:[190,150,60],8:[120,118,110],9:[112,94,74],10:[22,16,12],11:[60,110,40],12:[190,150,60],
  13:[78,96,44],14:[130,100,60],15:[230,200,90],16:[24,40,26],17:[78,96,44],18:[96,110,50],19:[110,90,40],20:[150,100,66],21:[150,100,66],22:[150,100,66],24:[90,90,120],25:[96,170,180],26:[22,16,12],27:[6,4,4],
  28:[150,110,56],29:[140,124,100],30:[96,86,76],31:[56,70,66],32:[60,80,76],33:[226,234,242],34:[206,176,114],35:[22,52,34],36:[60,120,56],37:[150,130,200],38:[18,56,26],39:[70,60,60],40:[44,32,56]};
function mmBuild(){
  const c=document.createElement('canvas');c.width=M.w;c.height=M.h;const g=c.getContext('2d'),img=g.createImageData(M.w,M.h),D=img.data;
  for(let i=0;i<M.t.length;i++){const col=MMC[M.t[i]]||[60,60,60];D[i*4]=col[0];D[i*4+1]=col[1];D[i*4+2]=col[2];D[i*4+3]=255}
  g.putImageData(img,0,0);
  let f=MMFOG[M.id];
  if(!f){const fc=document.createElement('canvas');fc.width=M.w;fc.height=M.h;const fg=fc.getContext('2d');fg.fillStyle='#0c0805';fg.fillRect(0,0,M.w,M.h);f=MMFOG[M.id]={c:fc,g:fg,lx:-99,ly:-99,mask:new Uint8Array(M.w*M.h)}}
  M.mm={base:c,fog:f};
}
function mmReveal(){
  const f=M.mm.fog,px=Math.floor(P.x/TS),py=Math.floor(P.y/TS);
  if(Math.abs(px-f.lx)+Math.abs(py-f.ly)<2)return;
  f.lx=px;f.ly=py;
  f.g.globalCompositeOperation='destination-out';f.g.fillStyle='#000';f.g.beginPath();f.g.arc(px+.5,py+.5,M.dark?9:13,0,TAU);f.g.fill();f.g.globalCompositeOperation='source-over';
  const R=M.dark?9:13;
  for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const x=px+i,y=py+j;if(x>=0&&y>=0&&x<M.w&&y<M.h&&i*i+j*j<=R*R)f.mask[y*M.w+x]=1}
}
function drawMinimap(){
  if(!mmMode)return;
  if(!M.mm)mmBuild();
  mmReveal();
  const sc=mmMode===2?2:1,vw=mmMode===2?78:MMW,vh=mmMode===2?54:MMH,w=vw*sc,h=vh*sc,x=W-w-8,y=8;
  const px=P.x/TS,py=P.y/TS;
  const sx=clamp(Math.round(px-vw/2),0,Math.max(0,M.w-vw)),sy=clamp(Math.round(py-vh/2),0,Math.max(0,M.h-vh));
  const sw=Math.min(vw,M.w),sh=Math.min(vh,M.h),ox=x+Math.round((w-sw*sc)/2),oy=y+Math.round((h-sh*sc)/2);
  cx.fillStyle='#0c0805';cx.fillRect(x-2,y-2,w+4,h+4);
  cx.drawImage(M.mm.base,sx,sy,sw,sh,ox,oy,sw*sc,sh*sc);
  cx.drawImage(M.mm.fog.c,sx,sy,sw,sh,ox,oy,sw*sc,sh*sc);
  const known=(tx,ty)=>{const x=Math.floor(tx),y=Math.floor(ty);return x>=0&&y>=0&&x<M.w&&y<M.h&&M.mm.fog.mask[y*M.w+x]===1};
  const dot=(tx,ty,col,r)=>{
    const dx=ox+(tx-sx)*sc,dy=oy+(ty-sy)*sc;
    if(dx<ox||dy<oy||dx>ox+sw*sc||dy>oy+sh*sc)return;
    cx.fillStyle=col;cx.fillRect(Math.round(dx-r/2),Math.round(dy-r/2),r,r);
  };
  for(const wp of M.warps){const tx=(wp.x+wp.w/2)/TS,ty=(wp.y+wp.h/2)/TS;if(known(tx,ty))dot(tx,ty,wp.need?'#ff8a50':wp.portal?'#fff2a0':'#ffe040',3*sc>3?4:3)}
  for(const c of CH)if(!c.open){const tx=c.x/TS,ty=c.y/TS;if(known(tx,ty))dot(tx,ty,'#ff9a2a',2*sc)}
  if(M.id==='world'){for(const z in WPS)if(known(WPS[z][0],WPS[z][1]))dot(WPS[z][0]+.5,WPS[z][1]+.5,'#60d8ff',3*sc)}
  else if(WPS[M.id]&&!M.dungeon&&known(WPS[M.id][0],WPS[M.id][1]))dot(WPS[M.id][0]+.5,WPS[M.id][1]+.5,'#60d8ff',3*sc);
  for(const e of E)if(e.type==='boss'&&!e.dead&&known(e.x/TS,e.y/TS))dot(e.x/TS,e.y/TS,'#ff3030',4);
  const qt=questTarget();if(qt)dot(qt.x/TS,qt.y/TS,Math.floor(time*2)%2?'#a8ffa0':'#40c040',4);
  const blink=Math.floor(time*3)%2;
  dot(px,py,blink?'#ffffff':'#ffd040',3);
  cx.strokeStyle='#8a6a3a';cx.strokeRect(x-1.5,y-1.5,w+3,h+3);
  if(!lastTouchOverlay)text('N map   V size',x+w,y+h+3,'#a89878',5,'right');
  reg(x-2,y-2,w+4,h+4,()=>{ui={mode:'map'};Snd.menu()});
}

// ---------- quest marker: where the current main quest (QUEST[flags.stage]) leads ----------
const QDUN={1:'dungeon',2:'dungeon',5:'spore',7:'shrine',9:'mine',11:'granary',13:'citadel',15:'magmacore',17:'forge',19:'rootmaw',21:'cellar',23:'sandhall',25:'prismvault',27:'crypt',29:'reliquary'};
const QGATE={4:['glade','amber'],6:['marsh','amber'],8:['rust','marsh'],10:['saffron','glade'],12:['steppe','saffron'],14:['spire','steppe'],16:['spire','ember'],18:['glade','tangle'],20:['tangle','delta'],22:['saffron','mesa'],24:['gulch','mesa'],26:['grove','rust'],28:['ridge','spire'],30:['ridge','heart']};
function questTarget(){
  if(!M||M.id!=='world'||!flags)return null;
  const s=flags.stage;
  if(s===0||s===3){const n=NP.find(q=>q.id==='elder');return n?{x:n.x,y:n.y}:null}
  if(QDUN[s]){const w=M.warps.find(q=>q.to===QDUN[s]);return w?{x:w.x+w.w/2,y:w.y+w.h/2}:null}
  if(QGATE[s]){const[a,b]=QGATE[s],g=(M.roadGates||[]).find(q=>(q.a===a&&q.b===b)||(q.a===b&&q.b===a));return g?{x:g.x,y:g.y}:null}
  if(s===31){const sp=M.spawns.find(q=>q.type==='boss'&&q.variant==='heartwood');return sp?{x:sp.x,y:sp.y}:null}
  return null;
}
// quest guide (like the guide line in Minecraft Dungeons II): press G, or when the quest changes, and a golden stag
// runs ahead along the walkable route to the target for a few seconds. The minimap always shows the target as a dot.
const guide={until:0,from:0,stage:-1,path:null,upd:-9,len:0};
const GPASS=new Set([T.VINE,T.GORGE]);   // gates the route may lead through (the quest is to open them)
function guideRoute(){
  const t=questTarget();guide.upd=time;
  if(!t){guide.path=null;return false}
  const w=M.w,h=M.h,sx=Math.floor(P.x/TS),sy=Math.floor(P.y/TS),gx=Math.floor(t.x/TS),gy=Math.floor(t.y/TS);
  const seal=new Set();for(const sl of M.seals)if(!sl.open)for(const[x,y]of sl.tiles)seal.add(y*w+x);
  const par=new Int32Array(w*h).fill(-2),q=new Int32Array(w*h);let qh=0,qt2=0,goal=-1;
  const s0=sy*w+sx;par[s0]=-1;q[qt2++]=s0;
  while(qh<qt2){
    const i=q[qh++],x=i%w,y=(i-x)/w;
    if(Math.abs(x-gx)<=2&&Math.abs(y-gy)<=2){goal=i;break}
    for(let k=0;k<4;k++){
      const nx=x+(k===0?1:k===1?-1:0),ny=y+(k===2?1:k===3?-1:0);
      if(nx<0||ny<0||nx>=w||ny>=h)continue;
      const n=ny*w+nx;if(par[n]!==-2)continue;
      const tt=M.t[n];if(SOLID[tt]&&!GPASS.has(tt)&&!seal.has(n))continue;
      par[n]=i;q[qt2++]=n;
    }
  }
  if(goal<0){guide.path=null;return false}
  const p=[];for(let i=goal;i>=0;i=par[i])p.push([(i%w+.5)*TS,(Math.floor(i/w)+.5)*TS]);
  p.reverse();guide.path=p;guide.len=p.length;
  // smoothed copy (the raw route is a staircase of tiles): a moving average so the stag glides
  guide.sp=p.map((_,i)=>{let x=0,y=0,c=0;for(let j=Math.max(0,i-5);j<=Math.min(p.length-1,i+5);j++){x+=p[j][0];y+=p[j][1];c++}return[x/c,y/c]});
  return true;
}
function startGuide(manual){
  if(M.id!=='world'||!questTarget()){if(manual)toast('Nothing to follow here','#a89878');return}
  stag.alive=false;guide.from=time;guide.until=time+(manual?8:6);
  if(!guideRoute()&&manual)toast('No route found','#a89878');
}
// the stag: four views (side = mirrored for left, front for down, back for up); rects [x,y,w,h,colour], origin = feet
const STAG_G='#ffd24a',STAG_L='#fff0a8',STAG_D='#e0a830';
function stagParts(face,gait){
  const l1=gait>0?4:3,l2=gait>0?3:4;
  if(face==='side')return[
    [-5,-8,10,4,STAG_G],[-5,-8,10,1,STAG_L],[3,-12,3,5,STAG_G],[5,-13,4,3,STAG_G],[8,-12,1,1,'#3a2a08'],[-7,-9,2,2,'#fff6d0'],
    [6,-17,1,4,STAG_L],[8,-16,1,3,STAG_L],[4,-17,1,2,STAG_L],[9,-18,1,2,STAG_L],[5,-18,1,1,STAG_L],
    [-5,-4,1,l1,STAG_D],[-3,-4,1,l2,STAG_D],[2,-4,1,l2,STAG_D],[4,-4,1,l1,STAG_D]];
  const legs=[[-3,-4,1,l1,STAG_D],[2,-4,1,l2,STAG_D],[-1,-4,1,l2,STAG_D],[0,-4,1,l1,STAG_D]];
  const ant=(y0)=>[[-3,y0,1,6,STAG_L],[-4,y0+1,1,2,STAG_L],[-5,y0-1,1,2,STAG_L],[2,y0,1,6,STAG_L],[3,y0+1,1,2,STAG_L],[4,y0-1,1,2,STAG_L]];
  if(face==='down')return[
    ...ant(-15),[-4,-11,8,6,STAG_G],[-4,-11,8,1,STAG_L],[-2,-9,4,4,STAG_G],[-3,-10,1,2,STAG_G],[2,-10,1,2,STAG_G],
    [-1,-6,2,2,STAG_L],[-1,-5,2,1,'#3a2a08'],[-2,-8,1,1,'#3a2a08'],[1,-8,1,1,'#3a2a08'],...legs.slice(0,2)];
  return[
    ...ant(-19),[-2,-13,4,3,STAG_G],[-3,-13,1,2,STAG_G],[2,-13,1,2,STAG_G],[-4,-10,8,6,STAG_G],[-4,-10,8,1,STAG_L],[-1,-6,2,2,'#fff6d0'],...legs.slice(0,2)];
}
const stag={k:0,alive:false,hx:1,hy:0,face:'down',last:0,flip:1};
function drawQuestMarker(){
  if(guide.stage===-1)guide.stage=flags.stage;
  else if(guide.stage!==flags.stage){guide.stage=flags.stage;startGuide(false)}
  const dt=Math.min(.05,Math.max(0,time-stag.last));stag.last=time;
  if(time>=guide.until||M.id!=='world'){stag.alive=false;return}
  if(time-guide.upd>1.2){
    // the route is recomputed from the hero's position: keep the stag where it is (nearest point on the new route)
    const old=stag.alive&&guide.sp?guide.sp[Math.min(guide.sp.length-1,Math.floor(stag.k))]:null;
    guideRoute();
    if(old&&guide.sp){let bd=1e9,bi=0;for(let i=0;i<Math.min(guide.sp.length,80);i++){const d=Math.hypot(guide.sp[i][0]-old[0],guide.sp[i][1]-old[1]);if(d<bd){bd=d;bi=i}}stag.k=bi}
  }
  const p=guide.path,sp=guide.sp;if(!p||p.length<4||!sp)return;
  let i0=0,bd=1e9;for(let i=0;i<Math.min(p.length,40);i++){const d=Math.hypot(p[i][0]-P.x,p[i][1]-P.y);if(d<bd){bd=d;i0=i}}
  const rem=p.length-i0,LEAD=4,SPAN=Math.min(10,rem-LEAD-1),SPEED=1.6;   // tiles per second
  if(SPAN<2)return;
  if(!stag.alive||stag.k<i0+LEAD-1||stag.k>i0+LEAD+SPAN+1){stag.k=i0+LEAD;stag.alive=true}
  stag.k+=SPEED*dt;
  const at=k=>{k=clamp(k,0,sp.length-1);const i=Math.floor(k),j=Math.min(i+1,sp.length-1),f=k-i;return[sp[i][0]+(sp[j][0]-sp[i][0])*f,sp[i][1]+(sp[j][1]-sp[i][1])*f]};
  const u=clamp((stag.k-i0-LEAD)/SPAN,0,1),env=Math.min(1,u/.2,(1-u)/.25),A=clamp((time-guide.from)/.5,0,1)*clamp(guide.until-time,0,1)*clamp(env,0,1);
  const[sx,sy]=at(stag.k),[nx,ny]=at(stag.k+2.5);
  // heading eases, and the view only switches when the other axis clearly dominates
  const dx=nx-sx,dy=ny-sy,dl=Math.hypot(dx,dy)||1,e=Math.min(1,dt*4);
  stag.hx+=(dx/dl-stag.hx)*e;stag.hy+=(dy/dl-stag.hy)*e;
  const horiz=Math.abs(stag.hx),vert=Math.abs(stag.hy);
  if(horiz>vert*1.25)stag.face='side';else if(vert>horiz*1.25)stag.face=stag.hy>0?'down':'up';
  if(stag.face==='side'&&Math.abs(stag.hx)>.25)stag.flip=stag.hx>0?1:-1;
  const X=sx-cam.x,Y=sy-cam.y;
  if(A>0.01&&X>-20&&X<W+20&&Y>-24&&Y<H+24){
    // sparkles left behind on the route
    for(let n=1;n<=5;n++){
      const[qx,qy]=at(stag.k-n*.9),tw=.5+.5*Math.sin(time*4+n*2.1);
      cx.globalAlpha=A*(1-n/6)*tw*.8;cx.fillStyle=n%2?'#ffe9a0':STAG_G;cx.fillRect(Math.round(qx-cam.x+(n%3-1)*2),Math.round(qy-cam.y-3-n%2*2),1,1);
    }
    cx.globalCompositeOperation='lighter';glow(X,Y-5,16,'255,200,80',.45*A);cx.globalCompositeOperation='source-over';
    const gait=Math.sin(stag.k*2.6),bob=-Math.abs(Math.sin(stag.k*2.6))*.8;
    const parts=stagParts(stag.face,gait);
    cx.save();cx.translate(Math.round(X),Math.round(Y+bob));if(stag.face==='side')cx.scale(stag.flip,1);cx.globalAlpha=A;
    cx.fillStyle='#2a1c04';for(const[x,y,w,h]of parts)cx.fillRect(x-1,y-1,w+2,h+2);
    for(const[x,y,w,h,c]of parts){cx.fillStyle=c;cx.fillRect(x,y,w,h)}
    cx.restore();cx.globalAlpha=1;
    if(rem>8&&A>.3)text(rem+' m',Math.round(X),Math.round(Y-30),'#ffe9a0',6,'center',true);
  }
}

// ---------- quest tracker ----------
let qtLast='',qtT=0;
function drawTracker(y){
  const lines=[{t:QUEST[flags.stage],c:'#a8e0a0'}];
  for(const sq of sideQuests())lines.push({t:sq,c:'#f0d890'});
  for(const q of activeQuestLines())lines.push({t:q,c:'#ffb870'});
  const key=lines.map(l=>l.t).join('|');
  if(key!==qtLast){qtLast=key;qtT=time}
  const age=time-qtT,a=age<10?1:.55;
  cx.globalAlpha=a;
  const wrapped=[];
  for(const l of lines)for(const w of wrap(l.t,150,6))wrapped.push({t:w,c:l.c});
  const h=wrapped.length*8+10;
  cx.fillStyle='rgba(16,10,6,.7)';cx.fillRect(6,y,158,h);cx.strokeStyle='#5a4228';cx.strokeRect(6.5,y+.5,157,h-1);
  text('QUEST',10,y+2,'#8a7a62',5);
  wrapped.forEach((l,i)=>text(l.t,10,y+10+i*8-1,l.c,6));
  cx.globalAlpha=1;
  return y+h+3;
}


// ---------- small pixel sprites for the status panel (built once) ----------
let HUDSPR=null;
function hudSprites(){
  if(HUDSPR)return HUDSPR;
  const mk=(rows,pal)=>{const w=rows[0].length,h=rows.length,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
    rows.forEach((r,y)=>{for(let x=0;x<w;x++){const k=r[x];if(pal[k]){g.fillStyle=pal[k];g.fillRect(x,y,1,1)}}});return c};
  const H=['.XX.XX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'];
  const heart=(fillL,fillR,line)=>{const c=mk(H.map(r=>r.replace(/X/g,'o')),{o:line}),g=c.getContext('2d');
    H.forEach((r,y)=>{for(let x=0;x<7;x++)if(r[x]==='X'){g.fillStyle=x<=3?fillL:fillR;g.fillRect(x,y,1,1)}});return c};
  const hl=(c,col)=>{const g=c.getContext('2d');g.fillStyle=col;g.fillRect(1,1,1,1);return c};
  const S={
    heart:hl(heart('#d82828','#d82828','#601010'),'#ff9090'),
    heartLow:hl(heart('#ff5a40','#ff5a40','#901818'),'#ffd0b0'),
    heartHalf:hl(heart('#d82828','#2a1212','#601010'),'#ff9090'),
    heartEmpty:heart('#2a1212','#2a1212','#4a1c1c'),
    res:{}
  };
  const shapes={
    Rage:['..X..','..XX.','.XXX.','XXXXX','XXXXX','XXXXX','.XXX.'],
    Stamina:['...XX','..XXX','.XXXX','XXXXX','XXXX.','XXX..','X....'],
    Mana:['..X..','.XXX.','XXXXX','XXXXX','XXXXX','.XXX.','..X..'],
    Energy:['...XX','..XX.','.XX..','XXXXX','..XX.','.XX..','XX...']
  };
  const cols={Rage:['#e0502e','#ffb070'],Stamina:['#7fd06a','#d0ffb0'],Mana:['#5aa0ff','#c0e0ff'],Energy:['#e8d040','#fff8a0']};
  for(const k in shapes){
    const rows=shapes[k];
    S.res[k]={empty:mk(rows,{X:'#2a2018'}),full:mk(rows.map((r,y)=>r),{X:cols[k][0]})};
    const g=S.res[k].full.getContext('2d');g.fillStyle=cols[k][1];for(const yy of[2,3])if(rows[yy][2]==='X')g.fillRect(2,yy,1,1);
  }
  const star=['..X..','.XXX.','XXXXX','.XXX.','..X..'];
  S.xpEmpty=mk(star,{X:'#2a2038'});S.xpFull=mk(star,{X:'#b890e8'});
  const g2=S.xpFull.getContext('2d');g2.fillStyle='#f0e0ff';g2.fillRect(2,2,1,1);
  return HUDSPR=S;
}


// a gold-framed bar: dark trough, vertical gradient fill, notches every 10%, gloss line and a bright leading edge; small studs on the corners
function fancyBar(x,y,w,h,f,c){
  cx.fillStyle='#0c0805';cx.fillRect(x-2,y-2,w+4,h+4);
  cx.strokeStyle='#8a6a3a';cx.strokeRect(x-1.5,y-1.5,w+3,h+3);
  cx.fillStyle='#241810';cx.fillRect(x,y,w,h);
  const fw=Math.round(w*f);
  if(fw>0){
    const g=cx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,c[0]);g.addColorStop(.45,c[1]);g.addColorStop(1,c[2]);
    cx.fillStyle=g;cx.fillRect(x,y,fw,h);
    cx.fillStyle='rgba(255,255,255,.28)';cx.fillRect(x,y,fw,1);
    if(fw<w){cx.fillStyle=c[0];cx.fillRect(x+fw-1,y,1,h)}
  }
  cx.fillStyle='rgba(12,8,5,.45)';
  for(let i=1;i<10;i++)cx.fillRect(x+Math.round(w*i/10),y,1,h);
  cx.fillStyle='#e8c870';
  cx.fillRect(x-3,y-3,2,2);cx.fillRect(x+w+1,y-3,2,2);cx.fillRect(x-3,y+h+1,2,2);cx.fillRect(x+w+1,y+h+1,2,2);
}
// emblem in a small framed socket: the symbol is dark and lights up in the bar's colour
function emblem(spr,x,y,w,h,col){
  cx.fillStyle='#0c0805';cx.fillRect(x-2,y-2,w+4,h+4);cx.strokeStyle='#8a6a3a';cx.strokeRect(x-1.5,y-1.5,w+3,h+3);
  cx.drawImage(spr.full,x,y);
}

// ---------- main HUD ----------
function drawHUD(){
  // ---- status panel: portrait, hearts, resource symbols, experience stars
  const px0=6,py0=6,bx=px0+35,nH=8+((flags&&flags.fruits)||0),HPR=14,rows=Math.ceil(nH/HPR),ph=rows*8+38;
  cx.fillStyle='rgba(16,10,6,.78)';cx.fillRect(px0,py0,158,ph);cx.strokeStyle='#8a6a3a';cx.strokeRect(px0+.5,py0+.5,157,ph-1);
  // portrait
  cx.fillStyle='#241810';cx.fillRect(px0+3,py0+3,28,28);cx.strokeStyle=P.hero.color;cx.strokeRect(px0+3.5,py0+3.5,27,27);
  cx.fillStyle=P.hero.color;cx.fillRect(px0+9,py0+9,16,16);cx.fillStyle=P.hero.light;cx.fillRect(px0+11,py0+11,6,6);
  cx.fillStyle='#1a110a';cx.fillRect(px0+3,py0+23,13,8);text(String(P.lvl),px0+9.5,py0+23.5,'#ffe9a0',7,'center',true);
  if(P.pts>0){cx.fillStyle='#2a6a2a';cx.fillRect(px0+20,py0+23,11,8);text('+',px0+25.5,py0+23,'#fff',7,'center',true)}
  // hearts: every heart is maxHp/nH health (more hearts with every Heart Fruit), half-hearts count
  const HS=hudSprites(),hf=clamp(P.hp/P.maxHp,0,1),low=hf<.3&&Math.floor(time*5)%2;
  for(let i=0;i<nH;i++){
    const fill=clamp(hf*nH-i,0,1),hx=bx+(i%HPR)*8,hy=py0+4+Math.floor(i/HPR)*8;
    cx.drawImage(fill>=.75?(low?HS.heartLow:HS.heart):fill>=.25?HS.heartHalf:HS.heartEmpty,hx,hy);
  }
  // resource and experience: ornate bars (gold frame, bevel, notches, gloss) with an emblem socket on the left
  const ry=py0+4+rows*8+3,bw=104,bbx=bx+10;
  const RC={Rage:['#ffb070','#e0502e','#8a2410'],Stamina:['#d0ffb0','#7fd06a','#357a2a'],Mana:['#c0e0ff','#5aa0ff','#254f9a'],Energy:['#fff8a0','#e8d040','#8a7416']};
  const rc=RC[P.hero.res]||RC.Rage;
  emblem(HS.res[P.hero.res]||HS.res.Rage,bx,ry,5,7,rc[1]);
  fancyBar(bbx,ry,bw,7,clamp(P.res/P.resMax,0,1),rc);
  text(String(Math.floor(P.res)),bbx+bw/2,ry+.5,'#fff',5,'center');
  const xy=ry+12,xf=P.lvl>=MAXLVL?1:clamp(P.xp/xpNeed(P.lvl),0,1);
  emblem({empty:HS.xpEmpty,full:HS.xpFull},bx,xy,5,5,'#b890e8');
  fancyBar(bbx,xy,bw,5,xf,['#f0e0ff','#b890e8','#5a3a8a']);
  // gold, keys, hints
  const gy=py0+ph-10;
  text(`${P.gold}g`,px0+6,gy,'#ffd040',6);
  if(M.dungeon)text(`Keys ${P.keys}`,px0+52,gy,'#ffe040',6);
  if(P.sp>0)text(`${P.sp} skill pt (T)`,px0+154,gy,'#8fd0ff',6,'right');
  else if(P.pts>0)text(`${P.pts} attr pt (I)`,px0+154,gy,'#ffe040',6,'right');
  // ---- buffs
  let by=py0+ph+4;
  P.buffs.forEach((b,i)=>{
    const x=px0+i*22;cx.fillStyle='rgba(16,10,6,.78)';cx.fillRect(x,by,20,14);cx.strokeStyle='#5a4228';cx.strokeRect(x+.5,by+.5,19,13);
    cx.fillStyle='#8fd0ff';cx.fillRect(x+2,by+2,4,4);text(b.name.slice(0,4),x+7,by+1,'#e8d8b0',5);text(Math.ceil(b.t)+'s',x+10,by+7,'#8fd0ff',6,'center');
  });
  if(P.buff){const i=P.buffs.length,x=px0+i*22;cx.fillStyle='rgba(16,10,6,.78)';cx.fillRect(x,by,20,14);cx.strokeStyle='#8a3a2a';cx.strokeRect(x+.5,by+.5,19,13);text('RAGE',x+10,by+1,'#ff8060',5,'center');text(Math.ceil(P.buff.t)+'s',x+10,by+7,'#ffb090',6,'center')}
  by+=(P.buffs.length||P.buff)?17:0;
  drawTracker(by);
  drawQuestMarker();
  // ---- minimap
  drawMinimap();
  // ---- skill bar
  if(!lastTouchOverlay){
    const slots=[
      {key:'J',kind:'attack',cd:P.atkT/P.atkCd,label:'Attack'},
      ...[0,1,2].map(i=>{const sk=SKILLS[P.bound[i]];return sk?{key:['K','L',';'][i],kind:sk.ult?'star':(SKILLGLYPH[sk.id]||'star'),cd:P.cd[i]/P.cdMax[i],cdT:P.cd[i],cost:sk.cost,label:sk.name,ult:sk.ult,slot:i}:{key:['K','L',';'][i],empty:true}}),
      {key:'SPC',kind:'roll',cd:P.rollCd/.8,label:'Roll'}
    ];
    slots.forEach((s,i)=>{
      const x=W-5*29-6+i*29,y=H-34;
      cx.fillStyle='#1a110a';cx.fillRect(x,y,26,26);
      const poor=s.cost&&P.res<s.cost;
      cx.strokeStyle=s.empty?'#3a2c1c':s.ult?'#e8a030':poor?'#6a3030':'#8a6a3a';cx.strokeRect(x+.5,y+.5,25,25);
      if(!s.empty){glyph(s.kind,x+4,y+4,18,poor?'#7a5a5a':P.hero.light,'#ffffff')}
      if(s.cd>0){cx.fillStyle='rgba(0,0,0,.65)';cx.fillRect(x+1,y+1,24,Math.round(24*clamp(s.cd,0,1)));if(s.cdT>0)text(s.cdT.toFixed(s.cdT<10?1:0),x+13,y+9,'#fff',7,'center',true)}
      text(s.key,x+2,y+1,'#fff',5);
      if(s.cost)text(String(s.cost),x+24,y+1,poor?'#ff8070':'#8fd0ff',5,'right');
    });
  }
  // ---- low hp vignette
  if(P.hp<P.maxHp*.3&&!P.dead){const a=.1+.07*Math.sin(time*6);cx.fillStyle=`rgba(190,0,0,${a})`;cx.fillRect(0,0,W,6);cx.fillRect(0,H-6,W,6);cx.fillRect(0,0,6,H);cx.fillRect(W-6,0,6,H)}
  // ---- boss bar
  for(const e of E)if(e.type==='boss'&&e.state!=='dormant'&&!e.dead){
    const bi=bossOf(e),bw=168,bx=W/2-bw/2-6,f=clamp(e.hp/e.maxHp,0,1);
    cx.fillStyle='#0c0805';cx.fillRect(bx-2,13,bw+4,12);cx.strokeStyle='#8a6a3a';cx.strokeRect(bx-1.5,13.5,bw+3,11);
    cx.fillStyle=['#b82020','#d86a1a','#e8c020'][e.phase||0];cx.fillRect(bx,15,Math.round(bw*f),8);
    cx.fillStyle='rgba(255,255,255,.18)';cx.fillRect(bx,15,Math.round(bw*f),2);
    cx.fillStyle='#0c0805';cx.fillRect(bx+Math.round(bw*.67)-1,14,2,10);cx.fillRect(bx+Math.round(bw*.34)-1,14,2,10);
    text(bi.name,bx+bw/2,2,'#ffd0a0',8,'center',true);
    if(e.phaseLock>0)text('IMMUNE',bx+bw/2,26,'#aab0b8',6,'center',true);
  }
  for(const e of E)if(e.mini&&!e.dead&&e.state!=='idle'){bar(W/2-70,H-52,140,6,e.hp/e.maxHp,'#d89a20');text(e.mini,W/2,H-62,'#ffe0a0',7,'center',true);break}
  // ---- quick bar: potion (Q) and three quick slots (1 2 3)
  {
    const qs=[{id:'hp',key:'Q'},{id:P.quick[0],key:'1'},{id:P.quick[1],key:'2'},{id:P.quick[2],key:'3'}],qx=W/2-54;
    qs.forEach((q,i)=>{
      const x=qx+i*28,y=H-27,hp=q.id==='hp',d=hp?{icon:'potion',c:'#e04a4a'}:(q.id?CONS[q.id]:null),n=hp?P.potions:(q.id?(P.cons[q.id]||0):0);
      cx.fillStyle='#1a110a';cx.fillRect(x,y,24,22);cx.strokeStyle=d&&n?'#8a6a3a':'#3a2c1c';cx.strokeRect(x+.5,y+.5,23,21);
      if(d){cx.globalAlpha=n?1:.35;drawIcon(d.icon,d.c,x+4,y+1,2);cx.globalAlpha=1;text('x'+n,x+22,y+12,n?'#ffe9a0':'#6a5a48',6,'right')}
      text(q.key,x+3,y+1,'#fff',5);
      reg(x,y,24,22,()=>{if(hp)usePotion();else if(q.id)useCons(q.id)});
    });
  }
  // ---- banner and toasts
  if(banner.t>0){cx.globalAlpha=clamp(banner.t,0,1);text(banner.text,W/2,56,'#ffe9a0',18,'center',true);cx.globalAlpha=1}
  toasts.slice(-3).forEach((t,i)=>{cx.globalAlpha=clamp(t.t,0,1);text(t.s,W/2,84+i*10,t.c,8,'center');cx.globalAlpha=1});
  // ---- interact prompt
  if(!ui){
    const it=nearestInteract();
    if(it){
      const x=Math.round(it.x-Math.round(cam.x)),y=Math.round(it.y-Math.round(cam.y)-6);
      cx.fillStyle='#1a110a';cx.fillRect(x-6,y-8,12,12);cx.strokeStyle='#ffe9a0';cx.strokeRect(x-5.5,y-7.5,11,11);
      text(lastTouchOverlay?'USE':'E',x,y-6,'#ffe9a0',8,'center',true);
    }
  }
}
