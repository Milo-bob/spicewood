'use strict';
// ================= The world: 16 regions merged into ONE continuous map =================
// Every region is grown on its own local map (zones.js) and the tiles it owns are copied into the world map. The borders between regions
// wobble, the ground and the trees of neighbours blend into each other (ecotone), a thin wall of forest keeps the regions apart,
// and the only ways through are roads (the links below), some of them behind a gate: vines, a gorge, a ford, a sealed tunnel or a boulder.
const WZ=[['ridge','spire','steppe','gulch'],['heart','ember','saffron','mesa'],['grove','village','glade','tangle'],['rust','marsh','amber','delta']];
const WCOLW=[152,140,146,140],WROWH=[100,96,102,102];
const WPAD=22,WBLEND=12,WAMP=7,WEXIT=22;
const WCOL0=[0],WROW0=[0];
for(let i=0;i<3;i++){WCOL0.push(WCOL0[i]+WCOLW[i]);WROW0.push(WROW0[i]+WROWH[i])}
const WW=WCOL0[3]+WCOLW[3],WH=WROW0[3]+WROWH[3];
const ZLIST=[].concat(...WZ);
const ZCELL={};ZLIST.forEach((z,i)=>{ZCELL[z]={c:i%4,r:Math.floor(i/4),i}});
// region borders: a vertical border between columns c-1 and c is a wobbly line x=xBound(c,y), a horizontal one y=yBound(r,x)
const wobV=(c,y)=>WAMP*(.62*Math.sin(y*.047+c*1.9)+.38*Math.sin(y*.131+c*4.3+1));
const wobH=(r,x)=>WAMP*(.62*Math.sin(x*.043+r*2.7)+.38*Math.sin(x*.117+r*5.1+2));
const xBound=(c,y)=>WCOL0[c]+wobV(c,y),yBound=(r,x)=>WROW0[r]+wobH(r,x);
function regionAt(tx,ty){
  let c=0,r=0;
  for(let k=1;k<4;k++){if(tx>=xBound(k,ty))c=k;if(ty>=yBound(k,tx))r=k}
  return WZ[r][c];
}
const regionAtPx=(x,y)=>regionAt(Math.floor(x/TS),Math.floor(y/TS));

// ---------- the roads between regions ----------
// [a,b,f,kind,opts]: f = where along the shared border the road crosses (0..1); kind = path | vine | gorge | ford | tunnel | shortcut
//   tunnel: sealed until flags[need]; shortcut: a boulder in Hearthmoor, shoved aside from the far end (sets flags[set]); sa/sb: signs on a's / b's side
const WLINKDEF=[
  ['village','glade',.5,'path',{sb:'Hearthmoor is back to the west. Rest at the tavern before you go deeper.'}],
  ['glade','amber',.5,'vine',{sa:'Thorn vines choke the road south to Amber Hollow. Only a sharp blade will cut them.',sb:'Amber Hollow. The air is thick with spores. The road north leads back to Ember Glade.'}],
  ['saffron','glade',.3,'tunnel',{need:'lantern',needText:'A black tunnel dives under the old gorge. Without a light you cannot go on.',title:'Dark Tunnel',sb:'The old bridge over the gorge is long gone, but a black tunnel dives beneath it. It leads north to Saffron Meadows. Only a miner\'s lantern can pierce that darkness...',sa:'Saffron Meadows. Golden fields roll to the horizon, but something lurks in the tall grass. The dark tunnel leads back south to Ember Glade.'}],
  ['glade','tangle',.4,'tunnel',{need:'emberglove',needText:'A wall of thorns, far too thick to cut. Only fire could clear it. An ember glove might burn it away.',title:'Thorn Wall',sa:'A wall of living thorns seals the road east into the Tanglewood Depths. Only fire can clear it. The creatures beyond are far stronger than anything here!',sb:'Tanglewood Depths. The jungle is thick and the creatures are strong. The road west leads back to Ember Glade.'}],
  ['marsh','amber',.55,'ford',{sa:'Mistwater Marsh. Solid ground is rare here. Follow the shallow fords from island to island.',sb:'A flooded ford leads west into the Mistwater Marsh. The water is too deep to wade without proper boots.'}],
  ['amber','delta',.1,'tunnel',{need:'briarkey',needText:'A gate of living briars bars the way east. It only answers to a briar key.',title:'Briar Gate',sa:'A gate of living briars blocks the road east into the Spice Delta. It answers only to a briar key.',sb:'The briar gate west leads back to Amber Hollow.'}],
  ['rust','marsh',.3,'gorge',{sa:'Rustpeak. Rust wolves hunt the ridges, and the old mine lies deep in the highlands. The gorge to the east leads back to the marsh.',sb:'A sheer gorge cuts off the west, and the old bridge is long gone. Rustpeak rises beyond it. A grapple hook could span the gap. They say one lies hidden in the Sunken Shrine...'}],
  ['marsh','village',.5,'shortcut',{set:'scMarsh',setText:'You shove the boulder aside. A shortcut to Hearthmoor!',sa:'A hidden trail north leads to Hearthmoor. A boulder will fall away on the far side.',seal:'A huge boulder blocks the southern road. It looks like it could be moved from the other side...'}],
  ['grove','rust',.3,'tunnel',{need:'truthglass',needText:'A smooth wall of rock where a tunnel should be. Something hides the door. Only a truthglass could show it.',title:'Hidden Door',sa:'Ghostbark Grove. The trees here are pale and the dead do not rest. The Ghostbark Crypt lies far from the road.',sb:'The old miners spoke of a tunnel north into Ghostbark Grove, but the rock is seamless. Only a truthglass would show the hidden door.'}],
  ['heart','grove',.6,'tunnel',{need:'heartseed',needText:'A great sealed root-gate. It hungers for a Heartseed.',sa:'The Heart of Spicewood. The old tree stirs and its blight is spreading. End it, and the forest will breathe again.',sb:'A gate of living roots seals the north. Beyond it beats the Heart of Spicewood. Only a Heartseed can open it.',title:'Root Gate'}],
  ['grove','village',.5,'shortcut',{set:'scGrove',setText:'You heave the boulder aside. A shortcut to Hearthmoor!',sa:'A hidden trail leads east, all the way back to Hearthmoor. A boulder will fall away on the far side.',seal:'A huge boulder blocks the western road. It looks like it could be moved from the other side...'}],
  ['ridge','heart',.1,'tunnel',{need:'heartseed',needText:'Frozen roots seal the path south. They answer only to a Heartseed.',title:'Frozen Roots',sa:'Hoarfrost Ridge. The snow squeaks and nothing is warm. The path south leads to the Heart of Spicewood, but frozen roots seal it until you carry the Heartseed.',sb:'The Heart of Spicewood. The old tree stirs and its blight is spreading. The path north leads back to the Hoarfrost Ridge.'}],
  ['ember','saffron',.5,'tunnel',{need:'slagwalkers',needText:'A smoke-black pass of glowing slag. Only slagwalkers can cross it.',title:'Ashen Pass',sa:'Cinderfall Heights. Ash drifts like snow. The Ashen Pass east leads back to Saffron Meadows.',sb:'The Ashen Pass leads west to Cinderfall Heights. The ground there is molten. Only slagwalkers can cross it.'}],
  ['steppe','saffron',.35,'tunnel',{need:'windcharm',needText:'A howling wind pass. Without a charm of the wind you are blown back.',sa:'Windward Steppe. The wind never stops here. The pass south leads back to Saffron Meadows.',sb:'The wind pass north leads to the Windward Steppe. The gale is too strong to walk against, unless you carry a windcharm.',title:'Howling Wind'}],
  ['saffron','mesa',.5,'tunnel',{need:'dunegoggles',needText:'A raging sandstorm blocks the road east. Without goggles you cannot see a step ahead.',title:'Sandstorm',sa:'A sandstorm howls over the road east to the Sunbaked Mesa. Only goggles would let you see through it.',sb:'Sunbaked Mesa. Heat shimmers over the sand. The road west leads back to Saffron Meadows.'}],
  ['ember','village',.5,'shortcut',{set:'scNorth',setText:'You shove the boulder aside. A shortcut to Hearthmoor!',sa:'A hidden road south leads to Hearthmoor. A boulder will fall away on the far side.',seal:'A huge boulder blocks the northern road. It looks like it could be moved from the other side...'}],
  ['spire','ember',.5,'tunnel',{need:'slagwalkers',needText:'A gate of glowing slag blocks the path south. Only slagwalkers can cross it.',title:'Slag Gate',sa:'Smolder Spire. Rivers of slag glow in the cracks. The slag gate south leads to Cinderfall Heights. Only slagwalkers can cross the molten ground.',sb:'The slag gate north leads to the Smolder Spire. The ground is molten. Only slagwalkers can cross it.'}],
  ['mesa','tangle',.5,'tunnel',{need:'dunegoggles',needText:'A raging sandstorm blocks the road north. Without goggles you cannot see a step ahead.',title:'Sandstorm',sa:'The road south descends into the Tanglewood Depths.',sb:'A sandstorm howls over the road north to the Sunbaked Mesa. Only goggles would let you see through it.'}],
  ['tangle','delta',.5,'tunnel',{need:'briarkey',needText:'A gate of living briars bars the way south. It only answers to a briar key.',title:'Briar Gate',sa:'A gate of living briars blocks the road south to the Spice Delta. It answers only to a briar key.',sb:'Spice Delta. Golden reeds and amber water. The road north climbs back to the Tanglewood.'}],
  ['gulch','mesa',.55,'tunnel',{need:'sunstone',needText:'A veil of blinding crystal light. Only a sunstone can part it.',title:'Crystal Veil',sa:'Crystal Gulch. The crystals hum and the light bends strangely. The road south leads down to the Sunbaked Mesa.',sb:'A veil of blinding light hangs over the road north to Crystal Gulch. Only a sunstone could part it.'}],
  ['spire','steppe',.5,'tunnel',{need:'heraldwing',needText:'A chasm of howling air. Only the Heraldwing can ride it.',title:'Wind Chasm',sa:'A chasm of howling air splits the road east to the Windward Steppe. Only the Heraldwing can ride it.',sb:'The road west climbs to the Smolder Spire.'}],
  ['steppe','gulch',.5,'tunnel',{need:'sunstone',needText:'A veil of blinding crystal light. Only a sunstone can part it.',title:'Crystal Veil',sa:'A veil of blinding light hangs over the road east to Crystal Gulch. Only a sunstone could part it.',sb:'Crystal Gulch. The crystals hum and the light bends strangely. The road west leads back to the Windward Steppe.'}],
  ['ridge','spire',.5,'tunnel',{need:'oathcrown',needText:'A gate of black ice. It recognises only the Oathcrown.',title:'Frost Gate',sa:'A gate of black ice seals the road west into the Hoarfrost Ridge. It recognises only the Oathcrown.',sb:'The road west climbs into the Hoarfrost Ridge.'}]
];
// first words you read when you step into a region for the first time: where you are and why it belongs to the Heart
const WENTRY={
  glade:'The forest thickens. Embers drift between the trunks, as if the old tree were breathing.',
  amber:'Spores hang in the air like gold dust. The Heart\'s sap pools here and turns to amber.',
  marsh:'The ground gives way to dark water. Even here, the roots of the Heart run underneath.',
  rust:'Trees give way to bare rock. The old miners dug here, chasing the Heart\'s roots deep underground.',
  grove:'The trees turn pale. This is where the Heart\'s guardians were laid to rest.',
  heart:'The air is warm and sweet. Every root in the forest leads here.',
  saffron:'The forest opens onto golden fields. Saffron is the Heart\'s gift, grown nowhere else.',
  ember:'Ash drifts like snow. The mountain burns on the Heart\'s blood, and so does the forge.',
  tangle:'The trees press close. Roots as thick as walls run toward the Heart.',
  delta:'Amber water splits into a hundred channels. Every spice in the Spicewoods comes down this river.',
  mesa:'The forest thins out to sand. The roots of the Heart still hum under the dunes.',
  steppe:'The land flattens and the wind never stops. It carries a single word: Heart.',
  spire:'Slag rivers glow in the cracks. The fire of the mountain and the sap of the forest are one stream.',
  gulch:'Crystals sing in the cold. Memories of the Heart are trapped in the stone.',
  ridge:'Snow squeaks underfoot. The Heart\'s oldest secrets are kept on ice up here.',
  village:''
};

let WTEMPLATE=null,WVS={x:0,y:0};
const WBLOCKED=[];

function worldLinks(vs){
  const L=[];
  WLINKDEF.forEach(([a,b,f,kind,o],idx)=>{
    const ca=ZCELL[a],cb=ZCELL[b],horiz=ca.r===cb.r;
    const A=(horiz?ca.c<cb.c:ca.r<cb.r)?a:b,B=A===a?b:a;   // A = left / top, B = right / bottom
    const sA=A===a?o.sa:o.sb,sB=A===a?o.sb:o.sa;
    const k={idx,a:A,b:B,horiz,kind,need:o.need,needText:o.needText,set:o.set,setText:o.setText,sealText:o.seal,title:o.title,signA:sA,signB:sB};
    const vil=a==='village'||b==='village';
    if(horiz){
      const r=ca.r,py=vil?vs.y+15:clamp(Math.round(WROW0[r]+f*WROWH[r]),WROW0[r]+16,WROW0[r]+WROWH[r]-16),cR=ZCELL[B].c;
      k.cross=Math.ceil(xBound(cR,py));k.line=py;
    }else{
      const c=ca.c,px=vil?vs.x+20:clamp(Math.round(WCOL0[c]+f*WCOLW[c]),WCOL0[c]+16,WCOL0[c]+WCOLW[c]-16),rB=ZCELL[B].r;
      k.cross=Math.ceil(yBound(rB,px));k.line=px;
    }
    L.push(k);
  });
  return L;
}

function makeWX(){
  const vs={x:WCOL0[1]+Math.floor((WCOLW[1]-40)/2),y:WROW0[2]+Math.floor((WROWH[2]-30)/2)};
  const L=worldLinks(vs);   // the village roads leave the stamp at y=vs.y+14..15 and x=vs.x+19..20
  const WX={w:WW,h:WH,PAD:WPAD,cell:{},zi:{},own:new Uint8Array(WW*WH),links:{},vstamp:vs,heartReturn:{x:0,y:0},linkList:L};
  ZLIST.forEach((z,i)=>{const c=ZCELL[z];WX.cell[z]={x:WCOL0[c.c],y:WROW0[c.r],w:WCOLW[c.c],h:WROWH[c.r]};WX.zi[z]=i;WX.links[z]=[]});
  // ownership map
  const xb=[null,new Float32Array(WH),new Float32Array(WH),new Float32Array(WH)],yb=[null,new Float32Array(WW),new Float32Array(WW),new Float32Array(WW)];
  for(let k=1;k<4;k++){for(let y=0;y<WH;y++)xb[k][y]=xBound(k,y);for(let x=0;x<WW;x++)yb[k][x]=yBound(k,x)}
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){
    let c=0,r=0;
    for(let k=1;k<4;k++){if(x>=xb[k][y])c=k;if(y>=yb[k][x])r=k}
    WX.own[y*WW+x]=r*4+c;
  }
  // exit nodes (where each region's own paths meet the road) and the gate position
  for(const k of L){
    const nodes=[];
    if(k.horiz){
      nodes.push({z:k.a,x:k.cross-WEXIT,y:k.line,side:'E'},{z:k.b,x:k.cross+WEXIT,y:k.line,side:'W'});
    }else{
      nodes.push({z:k.a,x:k.line,y:k.cross-WEXIT,side:'S'},{z:k.b,x:k.line,y:k.cross+WEXIT,side:'N'});
    }
    for(const n of nodes){
      if(n.z==='village'){   // the village road leaves the stamp; its node sits just outside it
        if(n.side==='E')n.x=vs.x+39;else if(n.side==='W')n.x=vs.x;else if(n.side==='S')n.y=vs.y+29;else n.y=vs.y;
      }
      k['n_'+n.z]=n;
      WX.links[n.z].push({x:n.x,y:n.y,side:n.side,link:k});
    }
  }
  // after the finale the portal leads back to the grove side of the root gate
  const hg=L.find(k=>k.a==='heart'&&k.b==='grove');
  WX.heartReturn={x:(hg.n_grove.x+.5)*TS,y:(hg.n_grove.y+.5)*TS};
  return WX;
}

const zGround=(z,r)=>{const S=ZSPEC[z];return S.mode==='islands'?T.GRASS:(r&&S.altp&&r()<S.altp?S.alt:S.ground)};
const zWall=z=>ZSPEC[z].mode==='islands'?T.WATER:ZSPEC[z].wood;
function hexRGB(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}

function ensureWorld(){
  if(WTEMPLATE)return;
  const WX=makeWX(),res={};
  for(const z of ZLIST)res[z]=genZoneLocal(z,WX);
  const w=WX.w,h=WX.h,own=WX.own,W=mk('world','The Spicewoods',w,h,T.TREE),r=seeded(4242);
  W.regOwn=own;W.zones=ZLIST;
  const tint=new Uint8Array(w*h*3).fill(255);
  const zt=ZLIST.map(z=>ZSPEC[z].tint?hexRGB(ZSPEC[z].tint):[255,255,255]);
  // ---- 1. copy the tiles every region owns
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,zi=own[i],q=res[ZLIST[zi]];
    W.t[i]=q.m.t[(y-q.oy)*q.m.w+(x-q.ox)];
  }
  // ---- 2. ecotone: ground and trees of the neighbour creep in, stronger towards the border; the colour grade fades too
  const DX=[1,-1,0,0],DY=[0,0,1,-1];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,zi=own[i];
    let best=99,zj=-1;
    for(let d=1;d<=WBLEND&&d<best;d++){
      for(let k=0;k<4;k++){
        const xx=x+DX[k]*d,yy=y+DY[k]*d;
        if(xx<0||yy<0||xx>=w||yy>=h)continue;
        const o=own[yy*w+xx];
        if(o!==zi){best=d;zj=o;break}
      }
    }
    if(zj<0){const c=zt[zi];tint[i*3]=c[0];tint[i*3+1]=c[1];tint[i*3+2]=c[2];continue}
    const f=.5*(1-best/(WBLEND+1)),a=zt[zi],b=zt[zj];
    for(let c=0;c<3;c++)tint[i*3+c]=Math.round(a[c]+(b[c]-a[c])*f);
    if(r()>=f)continue;
    const nq=res[ZLIST[zj]],nt=nq.m.t[(y-nq.oy)*nq.m.w+(x-nq.ox)],cur=W.t[i];
    if(WALKG.has(cur)&&WALKG.has(nt))W.t[i]=nt;
    else if(SOLIDWOOD.has(cur)&&(SOLIDWOOD.has(nt)||WALKG.has(nt)))W.t[i]=nt;
  }
  // ---- 3. a thin wall of forest on both sides of every border (the roads cut through it)
  const wall=new Uint8Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,zi=own[i];
    let hit=false;
    for(let d=1;d<=2&&!hit;d++)for(let k=0;k<4;k++){
      const xx=x+DX[k]*d,yy=y+DY[k]*d;
      if(xx>=0&&yy>=0&&xx<w&&yy<h&&own[yy*w+xx]!==zi){hit=true;break}
    }
    if(!hit)for(const[dx,dy]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&own[yy*w+xx]!==zi){hit=true;break}}
    if(hit)wall[i]=1;
  }
  for(let i=0;i<wall.length;i++)if(wall[i])W.t[i]=zWall(ZLIST[own[i]]);
  // the outer rim of the world
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x<2||y<2||x>=w-2||y>=h-2)W.t[y*w+x]=zWall(ZLIST[own[y*w+x]]);

  // ---- 4. Hearthmoor, stamped into the middle of its region
  const vs=WX.vstamp,V=buildVillage(true),sh=(o,dx,dy)=>{if(o.x!==undefined)o.x+=dx*TS;if(o.y!==undefined)o.y+=dy*TS;if(o.home){o.home={x:o.home.x+dx*TS,y:o.home.y+dy*TS}}return o};
  for(let y=0;y<V.h;y++)for(let x=0;x<V.w;x++){W.t[(vs.y+y)*w+vs.x+x]=V.t[y*V.w+x];own[(vs.y+y)*w+vs.x+x]=WX.zi.village}
  // the stamp is a 40x30 rectangle: turn its corners and edges into forest so the village sits in an irregular, oval clearing
  const vr=seeded(777),gone=new Set(),NATURAL=new Set([T.GRASS,T.LEAF,T.LONE,T.SHROOM,T.FLOWER]);
  for(let y=0;y<V.h;y++)for(let x=0;x<V.w;x++){
    const nx=(x+.5-V.w/2)/(V.w/2),ny=(y+.5-V.h/2)/(V.h/2),a=Math.atan2(ny,nx);
    const d=Math.pow(Math.abs(nx),2.6)+Math.pow(Math.abs(ny),2.6),thr=1.16+.1*Math.sin(3*a+1)+.07*Math.sin(5*a+2)+.05*Math.sin(9*a);
    const i=(vs.y+y)*w+vs.x+x;
    if(!NATURAL.has(W.t[i]))continue;
    if(d>thr||(d>thr-.12&&vr()<.45*(1-(thr-d)/.12))){W.t[i]=T.TREE;gone.add(y*V.w+x)}
  }
  W.props.push(...V.props.filter(p=>!gone.has(p.ty*V.w+p.tx)).map(p=>Object.assign(p,{tx:p.tx+vs.x,ty:p.ty+vs.y})));
  W.npcs.push(...V.npcs.map(n=>sh(n,vs.x,vs.y)));
  W.critters.push(...V.critters.map(c=>sh(c,vs.x,vs.y)));
  W.labels.push(...V.labels.map(l=>({x:l.x+vs.x*TS,y:l.y+vs.y*TS,text:l.text})));
  W.chimneys.push(...V.chimneys.map(c=>({x:c.x+vs.x*TS,y:c.y+vs.y*TS})));
  W.warps.push(...V.warps.map(q=>Object.assign(q,{x:q.x+vs.x*TS,y:q.y+vs.y*TS})));
  // the forest starts right at the village edge: a ring of trees around the stamp (the roads are cut through it below)
  for(let y=vs.y-4;y<vs.y+V.h+4;y++)for(let x=vs.x-4;x<vs.x+V.w+4;x++){
    if(x>=vs.x&&x<vs.x+V.w&&y>=vs.y&&y<vs.y+V.h)continue;
    const d=Math.max(vs.x-x,x-(vs.x+V.w-1),vs.y-y,y-(vs.y+V.h-1));
    if(d<=3||(d===4&&r()<.5)){const i=y*w+x;if(WALKG.has(W.t[i])||SOLIDWOOD.has(W.t[i])||W.t[i]===T.PATH)W.t[i]=T.TREE}
  }
  W.start={x:(vs.x+20)*TS,y:(vs.y+17)*TS};
  WPS.village=[vs.x+24,vs.y+16];
  GRET.village={tx:(vs.x+10)*TS,ty:(vs.y+3.6)*TS};
  WVS=vs;
  // ---- 5. what the regions placed on their local maps
  for(const z of ZLIST){
    if(z==='village')continue;
    const q=res[z],m=q.m,dx=q.ox,dy=q.oy;
    for(const p of m.props)W.props.push(Object.assign(p,{tx:p.tx+dx,ty:p.ty+dy}));
    for(const n of m.npcs)W.npcs.push(sh(n,dx,dy));
    for(const s of m.spawns)W.spawns.push(Object.assign(s,{x:s.x+dx*TS,y:s.y+dy*TS}));
    for(const c of m.chests)W.chests.push(c);   // chests are already in world pixels
    for(const q2 of m.warps)W.warps.push(Object.assign(q2,{x:q2.x+dx*TS,y:q2.y+dy*TS}));
    if(m.after)W.after=m.after;
  }
  for(const s of V.spawns)W.spawns.push(Object.assign(s,{x:s.x+vs.x*TS,y:s.y+vs.y*TS}));
  W.chests.push(...V.chests.map(c=>Object.assign(c,{x:c.x+vs.x*TS,y:c.y+vs.y*TS})));
  // ---- 6. the roads
  W.triggers=[];W.roadGates=[];   // gates: where each road is blocked (the quest marker points there)
  for(const k of WX.linkList)carveLink(W,k,vs,r);
  // ---- 7. village: path tiles that no one can reach (walled in by trees or props) turn into trees
  {
    const sx=Math.floor(W.start.x/TS),sy=Math.floor(W.start.y/TS),seen=new Uint8Array(w*W.h);
    const sealed=new Set();for(const s of W.seals)for(const[x,y]of s.tiles)sealed.add(y*w+x);
    const ok=i=>{const t=W.t[i];return!SOLID[t]||t===T.VINE||t===T.GORGE||t===T.SHALLOW||sealed.has(i)};
    const q=[sy*w+sx];seen[q[0]]=1;
    for(let h=0;h<q.length;h++){
      const i=q[h],x=i%w,y=(i-x)/w;
      for(let k=0;k<4;k++){
        const xx=x+DX[k],yy=y+DY[k];
        if(xx<0||yy<0||xx>=w||yy>=W.h)continue;
        const j=yy*w+xx;
        if(!seen[j]&&ok(j)){seen[j]=1;q.push(j)}
      }
    }
    for(let y=vs.y-4;y<vs.y+V.h+4;y++)for(let x=vs.x-4;x<vs.x+V.w+4;x++){
      const i=y*w+x;
      if(W.t[i]===T.PATH&&!seen[i])W.t[i]=T.TREE;
    }
  }
  W.tintRGB=tint;
  W.mist=false;W.dark=false;
  WTEMPLATE=W;
  MAPS.world=()=>cloneWorld(WTEMPLATE);
}

function carveLink(W,k,vs,r){
  const w=W.w,own=W.regOwn,hz=k.horiz;
  const nA=k['n_'+k.a],nB=k['n_'+k.b];
  const along=hz?'x':'y',across=hz?'y':'x';
  const a0=nA[along],a1=nB[along],cross=k.cross,line=k.line;
  const at=(i,off)=>hz?[i,line+off]:[line+off,i];
  const put=(i,off,t)=>{const[x,y]=at(i,off+wob(i));st(W,x,y,t)};
  const wob=i=>{const d=Math.abs(i-cross);return Math.round(1.4*Math.sin(i*.21+k.idx)*clamp((d-8)/6,0,1))};
  // start/end of the road: village roads begin at the stamp edge, everything else at the exit nodes
  let s0=Math.min(a0,a1),s1=Math.max(a0,a1);
  const gA=zGround(k.a),gB=zGround(k.b);
  for(let i=s0;i<=s1;i++){
    const dd=i-cross,pickB=dd>=0?(dd<7?r()<.5+dd*.05:true):(dd>-7?r()<.5+dd*.05:false);
    for(let off=-2;off<=2;off++){
      const rb=off===-2||off===2;
      let g=pickB?gB:gA;
      const z=pickB?k.b:k.a;
      if(rb&&ZSPEC[z].altp&&r()<ZSPEC[z].altp)g=ZSPEC[z].alt;
      if(ZSPEC[z].mode==='islands')g=T.GRASS;
      put(i,off,rb?g:T.PATH);
    }
  }
  // signs on both sides, at the edge of the road
  const sg=(side,text)=>{
    if(!text)return;
    const i=cross+(side<0?-9:9),[x,y]=at(i,2+wob(i)+(hz?0:0));
    const zz=side<0?k.a:k.b;
    if(own[y*w+x]===undefined||SOLID[gt(W,x,y)])return;
    addProp(W,'sign',x,y,{text});
  };
  sg(-1,k.signA);sg(1,k.signB);
  // the gate
  const band=(i0,i1,t,offs)=>{for(let i=i0;i<=i1;i++)for(let off=-(offs||2);off<=(offs||2);off++)put(i,off,t)};
  const sealAt=(i0,i1,flag,text,title)=>{
    const tiles=[];
    for(let i=i0;i<=i1;i++)for(let off=-2;off<=2;off++){const[x,y]=at(i,off+wob(i));tiles.push([x,y]);st(W,x,y,T.ROCK)}
    W.seals.push({flag,tiles,text,title:title||'Boulder'});
  };
  {const[gx,gy]=at(cross,0);W.roadGates.push({a:k.a,b:k.b,kind:k.kind,x:(gx+.5)*TS,y:(gy+.5)*TS})}
  if(k.kind==='vine')band(cross-1,cross,T.VINE);
  else if(k.kind==='gorge')band(cross-2,cross+1,T.GORGE);
  else if(k.kind==='ford'){
    band(cross-4,cross+4,T.SHALLOW);
    band(cross-4,cross+4,T.WATER,4);band(cross-4,cross+4,T.SHALLOW,2);
  }
  else if(k.kind==='tunnel')sealAt(cross-1,cross,k.need,k.needText,k.title||'Sealed Way');
  else if(k.kind==='shortcut'){
    // the boulder sits just outside Hearthmoor; the far side of the road holds the trigger that shoves it away
    const vil=k.a==='village'?'village':'village',vSide=k.a==='village'?-1:1;
    const edge=hz?(k.a==='village'?vs.x+40:vs.x):(k.a==='village'?vs.y+30:vs.y);
    const pos=edge+(vSide<0?4:-4);
    sealAt(Math.min(pos,pos+(vSide<0?1:-1)),Math.max(pos,pos+(vSide<0?1:-1)),k.set,k.sealText,'Boulder');
    // forest walls along the road beyond the boulder, so nobody walks around it
    for(let i=Math.min(pos,cross)-1;i<=Math.max(pos,cross)+1;i++)for(const off of[-4,-3,3,4]){const[x,y]=at(i,off+wob(i));if(x>=0&&y>=0&&x<w&&y<W.h)st(W,x,y,zWall(W.zones[own[y*w+x]]))}
    const farSide=k.a==='village'?1:-1,ti=cross+farSide*14;
    const[tx,ty]=at(ti,-2);
    W.triggers.push({x:(hz?ti:tx)*TS,y:(hz?ty:ti)*TS,w:(hz?3:5)*TS,h:(hz?5:3)*TS,set:k.set,text:k.setText});
  }
}

function cloneWorld(T){
  const m=Object.assign({},T);
  m.t=T.t.slice();
  m.warps=T.warps.map(q=>Object.assign({},q));
  m.npcs=T.npcs.map(q=>Object.assign({},q));
  m.props=T.props.map(q=>Object.assign({},q));
  m.critters=T.critters.map(q=>Object.assign({},q));
  m.chests=T.chests.map(q=>Object.assign({},q));
  m.seals=T.seals.map(q=>Object.assign({},q));
  m.triggers=T.triggers.map(q=>Object.assign({},q));
  m.spawns=T.spawns;
  m.mm=undefined;m.layer=undefined;
  return m;
}
const toVillage=()=>{ensureWorld();return['world',(WVS.x+20)*TS,(WVS.y+17)*TS]};
