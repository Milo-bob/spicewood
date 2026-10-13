'use strict';
// ================= Dungeons: floors of rooms joined by doors, locks and openers =================
// Every floor is generated from a seed (same dungeon every time), but solvable by construction:
//  - rooms form a tree (plus loops that never bypass a lock), the farthest room is the stairs / boss room
//  - lock doors sit on the main path; each lock's opener (key chest, block + plate, or orb) lives in a room reachable BEFORE that lock
//  - arena rooms seal their doors until every enemy inside is defeated
const CELL=16;
const DUN_META={};
const floorId=(spec,fi)=>fi?spec.id+'_'+(fi+1):spec.id;
// the obstacle each dungeon item is made for: the hook and the windcharm cross a gorge, the sickle, lantern and ember glove clear thorns, the boots wade water
const TOOLGATE={sickle:'vine',lantern:'vine',emberglove:'vine',hook:'gorge',windcharm:'gorge',boots:'water',bow:'bow'};
const itemOf=(spec,fi)=>(spec.items||[{item:spec.item,floor:spec.itemFloor||0}]).find(q=>q.item&&q.floor===fi);
const toolFor=(spec,fi)=>{const L=(spec.items||[{item:spec.item,floor:spec.itemFloor||0}]).filter(q=>q.item&&q.floor<=fi);return L.length?L[L.length-1].item:null};
function floorMeta(spec,fi){const k=spec.id+'#'+fi;if(!DUN_META[k])genFloor(spec,fi);return DUN_META[k]}

// ---- each dungeon moves differently: terrain fields (fields.js) fill a share of its ordinary rooms. [kind, chance per eligible room, options]
const DGIM={
  dungeon:[['thorn',.5,{skin:'roots'}]],
  spore:[['gust',.5,{skin:'spore'}],['vent',.35,{skin:'steam',n:3}],['thorn',.2,{skin:'roots'}]],
  shrine:[['crumble',.25,{}],['current',.55,{skin:'water'}],['sand',.2,{skin:'mud'}]],
  mine:[['crumble',.3,{}],['current',.5,{skin:'belt'}],['vent',.3,{skin:'steam',n:3}]],
  crypt:[['crumble',.3,{}],['vent',.45,{skin:'soul',n:4}],['thorn',.2,{skin:'roots'}]],
  granary:[['crumble',.2,{}],['gust',.6,{strong:true}],['current',.35,{skin:'belt'}]],
  forge:[['vent',.65,{n:5}],['current',.3,{skin:'belt'}]],
  rootmaw:[['thorn',.75,{}]],
  cellar:[['current',.5,{skin:'water'}],['sand',.3,{skin:'spice'}]],
  sandhall:[['crumble',.3,{}],['sand',.5,{}],['gust',.35,{}]],
  citadel:[['crumble',.25,{}],['gust',.75,{strong:true}]],
  magmacore:[['vent',.8,{n:6}],['current',.25,{skin:'lava'}]],
  prismvault:[['ice',.75,{}]],
  reliquary:[['ice',.6,{}],['gust',.4,{}]]
};
function dungeonFields(m,spec,rooms,r,rnd){
  const G=DGIM[spec.id];if(!G)return;
  for(const R of rooms){
    if(!['roam','plain','treasure','arena'].includes(R.role))continue;
    for(const[kind,p,o]of G){
      if(r()>=p)continue;
      const dir=['E','W','N','S'][rnd(4)];
      if(kind==='vent'){
        // geysers in the room, but never on the lanes in front of the doors
        let k=0;for(let g=0;g<30&&k<(o.n||4);g++){
          const x=R.x1+1+rnd(Math.max(1,R.w-3)),y=R.y1+1+rnd(Math.max(1,R.h-3));
          if(Math.abs(x+1-R.cx)<=2||Math.abs(y+1-R.cy)<=2)continue;
          if(m.fields.some(f=>Math.abs(f.x-x)<4&&Math.abs(f.y-y)<4))continue;
          m.fields.push({k:'vent',x,y,w:2,h:2,off:r()*3.4,skin:o.skin});k++;
        }
      }else if(kind==='crumble'){
        m.fields.push({k:'crumble',x:R.x1+1,y:R.y1+1,w:R.w-2,h:R.h-2,lx:R.cx,ly:R.cy});
      }else{
        m.fields.push({k:kind,x:R.x1+1,y:R.y1+1,w:R.w-2,h:R.h-2,dir,off:r()*4,skin:o.skin,strong:o.strong});
      }
      break;
    }
  }
}
function genFloor(spec,fi){
  const nf=spec.floors,last=fi===nf-1,id=floorId(spec,fi);
  const GW=spec.grid[0],GH=spec.grid[1],EX=(DUNEXIT[spec.id]||(ensureZone(spec.zone),DUNEXIT[spec.id]))||spec.exit;
  const r=seeded(zs(spec.seed*7919+fi*104729+11));
  const rnd=n=>Math.floor(r()*n),pickr=a=>a[rnd(a.length)];
  const m=mk(id,spec.name+(nf>1?' - Floor '+(fi+1):''),GW*CELL+4,GH*CELL+4,T.DWALL);
  m.dark=true;m.dungeon=true;m.tint=spec.tint||null;m.zone=spec.zone;
  const rooms=[],grid={},edges=[];
  const mkRoom=(gx,gy)=>{
    const w=2*(4+rnd(3)),h=2*(3+rnd(3)),cx=2+gx*CELL+8,cy=2+gy*CELL+8;
    const R={i:rooms.length,gx,gy,cx,cy,w,h,x1:cx-w/2,x2:cx+w/2-1,y1:cy-h/2,y2:cy+h/2-1,edges:[],role:'plain',used:false,arena:false};
    R.id=spec.id+'_f'+fi+'_r'+R.i;rooms.push(R);grid[gx+','+gy]=R;return R;
  };
  const resize=(R,w,h)=>{R.w=w;R.h=h;R.x1=R.cx-w/2;R.x2=R.cx+w/2-1;R.y1=R.cy-h/2;R.y2=R.cy+h/2-1};
  const link=(a,b)=>{const e={a,b,vert:a.gx===b.gx,lock:null};edges.push(e);a.edges.push(e);b.edges.push(e);return e};
  const order=(a,b)=>(a.gx<b.gx||a.gy<b.gy)?[a,b]:[b,a];
  // ---- room tree
  const start=mkRoom(rnd(GW),GH-1);start.role='start';start.used=true;
  const N=Math.max(6,Math.round(GW*GH*(spec.fill||.78)));
  const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  while(rooms.length<N){
    const cand=[];
    for(const R of rooms)for(const[dx,dy]of DIRS){const gx=R.gx+dx,gy=R.gy+dy;if(gx<0||gy<0||gx>=GW||gy>=GH||grid[gx+','+gy])continue;cand.push([R,gx,gy])}
    if(!cand.length)break;
    const[R,gx,gy]=pickr(cand),B=mkRoom(gx,gy),[a,b]=order(R,B);link(a,b);
  }
  const bfs=blocked=>{
    const dist=new Map([[start,0]]),par=new Map(),q=[start];
    while(q.length){const R=q.shift();for(const e of R.edges){if(blocked&&blocked.has(e))continue;const o=e.a===R?e.b:e.a;if(dist.has(o))continue;dist.set(o,dist.get(R)+1);par.set(o,e);q.push(o)}}
    return{dist,par};
  };
  const full=bfs(null);
  let target=start;
  for(const R of rooms){const dR=full.dist.get(R),dT=full.dist.get(target);if(dR>dT||(dR===dT&&R!==start&&r()<.5))target=R}
  target.used=true;
  const path=[];
  for(let R=target;R!==start;){const e=full.par.get(R);path.unshift(e);R=e.a===R?e.b:e.a}
  if(last)resize(target,spec.boss?14:10,spec.boss?12:8);
  target.role=last?(spec.boss?'boss':'final'):'stairs';
  // ---- locks along the main path
  const L0=Math.min((spec.locks&&spec.locks[fi])||0,path.length-1);
  const mech=(spec.mech&&spec.mech[fi])||['key'];
  const locks=[];let prev=0;
  for(let i=0;i<L0;i++){
    let idx=Math.round((i+1)*path.length/(L0+1));
    idx=Math.max(idx,prev+1);
    if(idx>path.length-1)break;
    prev=idx;locks.push({i,edge:path[idx],type:mech[i%mech.length]});
    path[idx].lock=locks[locks.length-1];
  }
  // Link's Awakening: the dungeon's item lies in the middle of the dungeon and the last gate of its floor can only be passed with it
  const itemHere=itemOf(spec,fi);
  if(itemHere&&locks.length){const L=locks[locks.length-1];L.type='tool';L.tool=itemHere.item}
  const onPath=new Set();for(const e of path){onPath.add(e.a);onPath.add(e.b)}
  // ---- openers (each lies in the region reachable before its own lock)
  for(const L of locks){
    const blocked=new Set(locks.filter(q=>q.i>=L.i).map(q=>q.edge));
    const reach=bfs(blocked);
    const cand=[...reach.dist.keys()].filter(R=>!R.used).sort(()=>r()-.5).sort((a,b)=>(onPath.has(a)?1:0)-(onPath.has(b)?1:0));
    let R=cand[0];
    if(!R){R=start;if(L.type==='plate')L.type='key'}
    L.room=R;
    if(R!==start){R.used=true;R.role=L.type;if(L.type==='tool')R.arena=true;else if(L.type!=='plate'&&r()<.55)R.arena=true}
  }
  // ---- remaining rooms
  const rest=rooms.filter(R=>!R.used);
  const miniSpec=!last||spec.boss?(spec.mini&&spec.mini[fi]):null;
  if(miniSpec&&rest.length){
    rest.sort((a,b)=>full.dist.get(b)-full.dist.get(a));
    const R=rest.shift();R.role='mini';R.arena=true;R.used=true;R.miniSpec=miniSpec;
  }
  for(const R of rest){
    const x=r();R.role=x<.4?'arena':x<.6?'treasure':x<.85?'roam':'plain';R.arena=R.role==='arena';R.used=true;
  }
  if(target.role==='stairs'&&r()<.6)target.arena=true;
  if(target.role==='final'||target.role==='boss')target.arena=true;
  // ---- loops that can never bypass a lock
  {
    const comp=new Map(),blocked=new Set(locks.map(l=>l.edge));let c=0;
    for(const R of rooms){
      if(comp.has(R))continue;const q=[R];comp.set(R,c);
      while(q.length){const X=q.shift();for(const e of X.edges){if(blocked.has(e))continue;const o=e.a===X?e.b:e.a;if(!comp.has(o)){comp.set(o,c);q.push(o)}}}
      c++;
    }
    for(const R of rooms)for(const[dx,dy]of[[1,0],[0,1]]){
      const B=grid[(R.gx+dx)+','+(R.gy+dy)];
      if(!B||R.edges.some(e=>e.a===B||e.b===B)||R===target||B===target)continue;
      if(comp.get(R)!==comp.get(B))continue;
      if(r()<(spec.loops==null?.4:spec.loops))link(R,B);
    }
  }
  // ---- carve
  for(const R of rooms)rectT(m,R.x1,R.y1,R.w,R.h,T.DFLOOR);
  const glen=e=>e.vert?(e.b.y1-e.a.y2-1):(e.b.x1-e.a.x2-1);
  const slice=(e,t)=>{
    const o=[];
    if(!e.vert){const x=e.a.x2+1+t;for(let j=-1;j<=1;j++)o.push([x,e.a.cy+j])}
    else{const y=e.a.y2+1+t;for(let j=-1;j<=1;j++)o.push([e.a.cx+j,y])}
    return o;
  };
  for(const e of edges){
    const g=glen(e);if(g<3)throw new Error('corridor too short '+g);
    for(let t=0;t<g;t++)for(const[x,y]of slice(e,t))st(m,x,y,T.DFLOOR);
  }
  // ---- gates
  const gate=(gid,kind,room,tiles,extra)=>{const g=Object.assign({id:gid,kind,room,open:kind==='room',tiles},extra||{});m.gates.push(g);return g};
  let gi=0;
  for(const R of rooms)if(R.arena){
    const ids=[];
    for(const e of R.edges){const g=glen(e),t=e.a===R?0:g-1;ids.push(gate('ag'+(gi++),'room',R.id,slice(e,t)).id)}
    m.rooms.push({id:R.id,x1:R.x1,y1:R.y1,x2:R.x2,y2:R.y2,gates:ids,name:R.role==='boss'?'The boss chamber':'This chamber'});
  }
  for(const L of locks){
    const e=L.edge,t=Math.floor(glen(e)/2),tiles=slice(e,t),tag=`${spec.id}_${fi}_${L.i}`;
    if(L.type==='tool'&&TOOLGATE[L.tool]==='bow'){
      // the bow gate: a normal orb door, but the orb sits on a ledge behind a moat in the room in front of the door (arrows cross water)
      L.gate=gate('lk'+L.i,'orb',null,tiles,{flag:'ob_'+tag});
      L.moat=full.dist.get(e.a)<=full.dist.get(e.b)?e.a:e.b;
      m.toolGate={kind:'bow',tool:'bow'};
      continue;
    }
    if(L.type==='tool'){
      const kind=TOOLGATE[L.tool]||'vine',tile={vine:T.VINE,gorge:T.GORGE,water:T.SHALLOW}[kind],g=glen(e),thick=g>=5?2:1;
      for(let k=0;k<thick;k++)for(const[x,y]of slice(e,Math.max(0,Math.min(g-1,t-(thick>1?1:0)+k))))st(m,x,y,tile);
      m.toolGate={kind,tool:L.tool,x:(slice(e,t)[1][0]+.5)*TS,y:(slice(e,t)[1][1]+.5)*TS};
      continue;
    }
    if(L.type==='key')L.gate=gate('lk'+L.i,'key',null,tiles,{flagKey:'kd_'+tag});
    else if(L.type==='plate')L.gate=gate('lk'+L.i,'plate',null,tiles,{flag:'pl_'+tag});
    else L.gate=gate('lk'+L.i,'orb',null,tiles,{flag:'ob_'+tag});
  }
  // ---- contents
  const occ=new Set();
  const take=(x,y)=>occ.add(x+','+y);
  const spot=(R,pad)=>{pad=pad||1;for(let k=0;k<60;k++){const x=R.x1+pad+rnd(R.w-2*pad),y=R.y1+pad+rnd(R.h-2*pad);if(occ.has(x+','+y))continue;take(x,y);return[x,y]}return null};
  const lvBase=spec.lvl+fi*2;
  const spawn=(R,n,o)=>{o=o||{};for(let k=0;k<n;k++){const p=spot(R);if(!p)break;m.spawns.push({type:o.type||pickr(spec.foes),x:p[0]*TS+8,y:p[1]*TS+8,lvl:lvBase+(o.dl||0),elite:!!o.elite||(o.firstElite&&k===0),room:o.room,mini:o.mini})}};
  const chest=(cid,R,dx,dy,extra)=>{take(R.cx+dx,R.cy+dy);m.chests.push(Object.assign({id:cid,x:(R.cx+dx)*TS+8,y:(R.cy+dy)*TS+8,tier:lvBase},extra||{}))};
  for(const R of rooms){
    const dark=R.role==='roam'&&spec.dark&&r()<spec.dark;
    R.dark=dark;
    for(const[x,y]of[[R.x1,R.y1],[R.x2,R.y1],[R.x1,R.y2],[R.x2,R.y2]]){take(x,y);if(!dark)addProp(m,'brazier',x,y)}
    // a door-clear lane in front of every doorway
    for(let j=-1;j<=1;j++)for(const[x,y]of[[R.cx+j,R.y1],[R.cx+j,R.y2],[R.x1,R.cy+j],[R.x2,R.cy+j]])take(x,y);
  }
  // stairs / exit
  const stairs=(R,top,warp)=>{
    const y=top?R.y1:R.y2;
    m.props.push({k:'stairs',tx:R.cx-1,ty:y,w:2,deco:true,dir:warp.dir,top});
    for(const x of[R.cx-1,R.cx])for(let j=0;j<=2;j++){take(x,top?y+j:y-j)}
    m.warps.push({x:(R.cx-1)*TS,y:y*TS,w:2*TS,h:TS,to:warp.to,tx:warp.tx,ty:warp.ty});
    return{x:R.cx*TS,y:(top?y+2:y-2)*TS+8};
  };
  // start room: stairs back out / up (bottom wall)
  if(fi===0)m.start=stairs(start,false,{to:EX.to,tx:EX.tx,ty:EX.ty,dir:'up'});
  else{
    const pm=floorMeta(spec,fi-1);
    m.start=stairs(start,false,{to:floorId(spec,fi-1),tx:pm.arrive.x,ty:pm.arrive.y,dir:'up'});
  }
  let arrive={x:0,y:0};
  if(target.role==='stairs'){
    const vertAbove=target.edges.some(e=>e.vert&&e.b===target);
    arrive=stairs(target,!vertAbove,{to:floorId(spec,fi+1),tx:null,ty:null,dir:'down'});
  }
  // start sign
  if(fi===0&&spec.hint)addProp(m,'sign',start.cx+2,start.y2-1,{text:spec.hint});
  // locks' openers
  for(const L of locks){
    const R=L.room,tag=`${spec.id}_${fi}_${L.i}`;
    if(L.type==='tool'){
      if(L.moat){   // the orb on its ledge in a corner of the room before the door
        const M2=L.moat,cs=[[M2.x1,M2.y1,1,1],[M2.x2,M2.y1,-1,1],[M2.x1,M2.y2,1,-1],[M2.x2,M2.y2,-1,-1]],[cx0,cy0,sx,sy]=cs[rnd(4)];
        const ox=cx0+sx,oy=cy0;   // orb next to the corner brazier
        for(const[x,y]of[[cx0,cy0],[ox,oy],[cx0,cy0+sy],[ox,oy+sy],[cx0+2*sx,oy],[cx0+2*sx,oy+sy],[ox,oy+2*sy],[cx0,cy0+2*sy],[cx0+2*sx,cy0+2*sy]])take(x,y);
        for(const[x,y]of[[cx0+2*sx,oy],[cx0+2*sx,oy+sy],[ox,oy+2*sy],[cx0,cy0+2*sy],[cx0+2*sx,cy0+2*sy]])st(m,x,y,T.WATER);
        addProp(m,'orb',ox,oy,{flag:L.gate.flag});
      }
      continue;   // otherwise its opener is the item chest of the item room (role contents)
    }
    if(L.type==='key'){chest('key_'+tag,R,R===start?-2:2,-1,{req:R.arena?R.id:undefined})}
    else if(L.type==='orb'){
      const x=R.x2-1,y=R.y1;take(x,y);addProp(m,'orb',x,y,{flag:L.gate.flag});
    }else{
      const row=Math.max(R.y1+1,Math.min(R.y2-1,R.cy+(rnd(2)?2:-2))),bx=R.x1+2,px=Math.min(R.x2-2,bx+3+rnd(2));
      const rows=[row];
      if(R.h>=8&&r()<(fi>0?.65:.3))rows.push(2*R.cy-row);   // a big room: two blocks, two plates, and the gate wants both
      for(const rw of rows){
        for(let x=bx-1;x<=px+1;x++)take(x,rw);
        addProp(m,'block',bx,rw);
        m.plates.push({tx:px,ty:rw,gate:L.gate.id,flag:L.gate.flag});
        m.props.push({k:'plate',tx:px,ty:rw,w:1,deco:true,flag:L.gate.flag});
      }
    }
  }
  // role contents
  for(const R of rooms){
    const rid=R.id,sealed=R.arena?rid:undefined,count=Math.max(4,Math.min(9,3+Math.floor(R.w*R.h/18)+fi));
    if(R.role==='arena'||R.role==='key'&&R.arena||R.role==='orb'&&R.arena)spawn(R,count,{room:sealed,firstElite:true});
    else if(R.role==='tool'){
      const ms=spec.mini&&(spec.mini[fi]||spec.mini[0]),p=spot(R,2);
      if(p&&ms)m.spawns.push({type:ms[0],x:p[0]*TS+8,y:p[1]*TS+8,lvl:lvBase+2,elite:true,room:rid,mini:ms[1]});
      spawn(R,Math.max(2,count-3),{room:rid});
      chest('item_'+itemHere.item,R,0,-2,{req:R.arena?rid:undefined,tier:lvBase+2});
    }
    else if(R.role==='roam')spawn(R,R.dark?4:2+rnd(3),{type:R.dark?'bat':undefined});
    else if(R.role==='treasure'){chest('tr_'+rid,R,2,-1);spawn(R,2+rnd(2),{});}
    else if(R.role==='mini'){
      const ms=R.miniSpec;
      const p=spot(R,2);if(p)m.spawns.push({type:ms[0],x:p[0]*TS+8,y:p[1]*TS+8,lvl:lvBase+2,elite:true,room:rid,mini:ms[1]});
      spawn(R,2+fi,{room:rid});
      chest('tr_'+rid,R,0,-2,{req:rid,tier:lvBase+3});
    }else if(R.role==='stairs'&&R.arena)spawn(R,count,{room:rid,firstElite:true});
    else if(R.role==='final'){
      const ms=spec.finalMini,p=spot(R,2);
      if(p&&ms)m.spawns.push({type:ms[0],x:p[0]*TS+8,y:p[1]*TS+8,lvl:lvBase+2,elite:true,room:rid,mini:ms[1]});
      spawn(R,3,{room:rid});
      chest('cvc_'+spec.id,R,0,-2,{req:rid,tier:lvBase+3});
    }else if(R.role==='boss'){
      m.spawns.push({type:'boss',variant:spec.boss==='barkfather'?undefined:spec.boss,x:R.cx*TS+8,y:(R.y1+3)*TS,lvl:spec.bossLvl,room:rid});
      m.after={flag:spec.bossFlag,chest:spec.bossChest,cx:R.cx,cy:R.y1+1,wx:R.cx-1,wy:R.cy+2,to:EX.to,tx:EX.tx,ty:EX.ty};
      for(const[x,y]of[[R.cx-4,R.y1],[R.cx+4,R.y1],[R.cx-4,R.y2],[R.cx+4,R.y2]])if(!occ.has(x+','+y)){take(x,y);addProp(m,'brazier',x,y)}
    }
    // decoration
    if(R.role!=='boss'){
      const n=R.role==='plate'?0:1+rnd(3);
      for(let k=0;k<n;k++){
        const top=r()<.5,x=R.x1+1+rnd(R.w-2),y=top?R.y1:R.y2;
        if(Math.abs(x-R.cx)<=1||occ.has(x+','+y))continue;
        take(x,y);addProp(m,pickr(spec.props),x,y);
      }
    }
    for(let k=0;k<(R.dark?3:rnd(3));k++){const p=spot(R,1);if(p)addDeco(m,spec.deco||'glowcap',p[0],p[1])}
    if(R.role==='plain'&&r()<.4&&spec.lore&&spec.lore.length){
      const p=spot(R,1);if(p)addProp(m,'sign',p[0],p[1],{text:pickr(spec.lore)});
    }
  }
  // ---- the twist of the item dungeons: secrets only the dungeon's own item can reach
  {
    const tl=toolFor(spec,fi),tgk=tl&&TOOLGATE[tl];
    if(tgk&&tgk!=='bow'){
      // alcoves in the wall of ordinary rooms: a gate of the dungeon's own obstacle (thorns, gorge, water) and a chest behind it
      const gTile={vine:T.VINE,gorge:T.GORGE,water:T.SHALLOW}[tgk];let made=0;
      const cand=rooms.filter(R=>!['start','boss','final','stairs','tool'].includes(R.role)).sort(()=>r()-.5);
      for(const R of cand){
        if(made>=2)break;
        for(const side of(r()<.5?[1,-1]:[-1,1])){
          const x=R.x1+2+rnd(Math.max(1,R.w-4)),y0=side<0?R.y1:R.y2,gy=y0+side,cy=y0+2*side;
          if(Math.abs(x-R.cx)<=1)continue;
          const ok=[[x,gy],[x,cy],[x-1,gy],[x+1,gy],[x-1,cy],[x+1,cy],[x,y0+3*side],[x-1,y0+3*side],[x+1,y0+3*side]].every(([a,b])=>gt(m,a,b)===T.DWALL);
          if(!ok)continue;
          st(m,x,gy,gTile);st(m,x,cy,T.DFLOOR);
          m.chests.push({id:'zs_'+R.id,x:x*TS+8,y:cy*TS+8,tier:lvBase+1});made++;break;
        }
      }
    }
    // the lantern's dungeon: treasure sits unseen in the dark rooms until a flare lights it
    if(tl==='lantern'){let n=0;for(const R of rooms.filter(q=>!['start','boss','final','stairs','tool'].includes(q.role)).sort(()=>r()-.5)){if(n>=2)break;const p=spot(R,1);if(p){m.chests.push({id:'zs_'+R.id+'_h',x:p[0]*TS+8,y:p[1]*TS+8,tier:lvBase+1,hidden:true});n++}}}
  }
  if(typeof dungeonFields==='function'&&!spec.cave)dungeonFields(m,spec,rooms,r,rnd);
  m.layout={rooms:rooms.map(R=>({id:R.id,i:R.i,gx:R.gx,gy:R.gy,x1:R.x1,y1:R.y1,x2:R.x2,y2:R.y2,role:R.role})),
    edges:edges.map(e=>({a:e.a.i,b:e.b.i,vert:e.vert,lock:e.lock?e.lock.type:null,tool:e.lock&&e.lock.tool||null})),GW,GH,floor:fi,floors:nf};
  DUN_META[spec.id+'#'+fi]={arrive,start:m.start,rooms:rooms.length,locks:locks.map(l=>l.type)};
  return m;
}

function regDungeon(spec){for(let fi=0;fi<spec.floors;fi++){const f=fi;MAPS[floorId(spec,f)]=()=>genFloor(spec,f)}}

// ================= The five main dungeons =================
const DUNGEONS=[
  {id:'dungeon',item:'sickle',name:'The Hollow Oak',zone:'glade',seed:101,grid:[4,3],floors:2,locks:[1,2],mech:[['key'],['plate','key']],fill:.8,lvl:4,bossLvl:6,
   boss:'barkfather',bossFlag:'boss',bossChest:'boss',foes:['beetle','wolf','shroom'],mini:[['wolf','Alpha Rust Wolf'],['beetle','Barkshell Guardian']],
   props:['clay','ore'],deco:'glowcap',tint:'#ecdcc0',exit:{to:'glade',tx:30*TS,ty:4.5*TS},
   hint:'The Hollow Oak. Doors seal while enemies remain. A small key opens a locked door, and a pushed block on a plate opens a heavy slab.',
   lore:['Scratched into the bark: "The Barkfather was a gentle guardian once."','A child\'s toy lies here. Someone fled in a hurry.']},
  {id:'spore',item:'boots',name:'The Spore Warren',zone:'amber',seed:202,grid:[5,4],floors:2,locks:[2,3],mech:[['plate','key'],['plate','plate','key']],fill:.8,lvl:8,bossLvl:11,
   boss:'mycelia',bossFlag:'boss2',bossChest:'boss2',foes:['bat','shroom','brute'],mini:[['brute','Sporecap Tyrant'],['brute','Mushroom Matron']],
   props:['ore','clay'],deco:'glowcap',tint:'#c0e8b0',dark:.5,exit:{to:'amber',tx:46*TS,ty:4.5*TS},
   hint:'The Spore Warren. Stone blocks can be pushed (walk into them), never pulled. If one gets stuck, leave the room and come back in.',
   lore:['The mushrooms hum. Do not breathe too deeply.','"Mother Mycelia grows with every spring." - a researcher\'s last note.']},
  {id:'shrine',item:'hook',items:[{item:'hook',floor:0},{item:'bow',floor:1}],name:'The Sunken Shrine',zone:'marsh',seed:303,grid:[5,4],floors:2,locks:[2,3],mech:[['orb','key'],['orb','orb','key']],fill:.8,lvl:11,bossLvl:14,
   boss:'drowned',bossFlag:'boss3',bossChest:'boss3',foes:['bat','shroom','wolf','brute'],mini:[['brute','Drowned Acolyte'],['wolf','Tide Hound']],
   props:['ore','clay'],deco:'glowcap',tint:'#a8c8f0',exit:{to:'marsh',tx:34*TS,ty:13*TS},
   hint:'The Sunken Shrine. Strike a glowing orb with a weapon or an arrow to open the matching gate. Some orbs sit across the water, out of reach of any blade.',
   lore:['Water drips. Somewhere, a gate remembers being closed.','"We bound her in rope and iron. It will not hold forever."']},
  {id:'mine',item:'lantern',name:'The Rustpeak Mine',zone:'rust',seed:404,grid:[5,4],floors:2,locks:[3,3],mech:[['plate','plate','key'],['key','plate','key']],fill:.82,lvl:14,bossLvl:17,
   boss:'warden',bossFlag:'boss4',bossChest:'boss4',foes:['wolf','beetle','brute','bat'],mini:[['brute','Foreman Slag'],['wolf','Cave-in Hound']],
   props:['ore','ore','clay'],deco:'glowcap',tint:'#f0c090',dark:.55,loops:.5,exit:{to:'rust',tx:50*TS,ty:4.5*TS},
   hint:'The Rustpeak Mine. Blocks and plates, orders and keys. The old foreman left many doors locked. In the dark rooms, light shows what the shadows hide.',
   lore:['A rusted cart. The rails end in a wall of stone.','"Warden, keep the lower shafts sealed." - orders, never carried out.']},
  {id:'crypt',name:'The Ghostbark Crypt',zone:'grove',seed:505,grid:[5,4],floors:3,locks:[2,3,3],mech:[['orb','key'],['plate','orb','key'],['orb','plate','key']],fill:.82,lvl:36,bossLvl:39,
   boss:'king',bossFlag:'boss5',bossChest:'boss5',foes:['skeleton','ghost'],mini:[['skeleton','Bone Captain'],['ghost','Weeping Widow'],['skeleton','Grave Knight']],
   props:['grave','grave','clay'],deco:'glowcap',tint:'#c0b0e0',dark:.6,exit:{to:'grove',tx:44*TS,ty:4.5*TS},
   hint:'The Ghostbark Crypt. Three floors of the dead. Orbs, plates and keys will open the way down to the Hollow King.',
   lore:['The names on the stones have been scratched away.','"The king still waits for his heir." The ink is still wet.']},
  {id:'granary',item:'windcharm',name:'The Gilded Granary',zone:'saffron',seed:606,grid:[5,4],floors:2,locks:[2,3],mech:[['key','plate'],['orb','key','plate']],fill:.82,lvl:18,bossLvl:21,
   boss:'harvest',bossFlag:'boss7',bossChest:'boss7',foes:['wolf','bat','brute','beetle'],mini:[['brute','Scarecrow Sentinel'],['wolf','Granary Hound']],
   props:['hay','logs','clay'],deco:'glowcap',tint:'#f0e0a0',loops:.45,exit:{to:'saffron',tx:0,ty:0},
   hint:'The Gilded Granary. Every harvest is stored here, and every sack is guarded. Keys, plates and orbs lead to the Harvest King.',
   lore:['Sacks of golden grain, rotted to dust.','"The King took the last harvest and would not share it."']},
  {id:'forge',item:'emberglove',name:'The Cinder Forge',zone:'ember',seed:707,grid:[5,4],floors:3,locks:[2,3,3],mech:[['plate','key'],['orb','plate','key'],['plate','orb','plate','key']],fill:.82,lvl:26,bossLvl:29,
   boss:'cinder',bossFlag:'boss8',bossChest:'boss8',foes:['brute','skeleton','wolf','ghost','bat'],mini:[['brute','Slag Foreman'],['skeleton','Ember Knight'],['brute','Furnace Warden']],
   props:['ore','ore','brazier'],deco:'glowcap',tint:'#f0a880',loops:.5,exit:{to:'ember',tx:0,ty:0},
   hint:'The Cinder Forge. Three floors of molten machinery. Something is still hammering in the dark.',
   lore:['The anvil is warm. It has not been used for years.','"The Colossus was built to guard the Heart. It never stopped guarding."']},
  {id:'rootmaw',name:'The Rootmaw',zone:'tangle',seed:808,grid:[5,4],floors:2,locks:[2,3],mech:[['key','plate'],['orb','key','plate']],fill:.82,lvl:29,bossLvl:32,
   boss:'thorn',bossFlag:'boss14',bossChest:'boss14',foes:['thornbrute','wolf','beetle','shroom'],mini:[['thornbrute','Gnarled Stalker'],['wolf','Root Hound']],
   props:['logs','clay','ore'],deco:'glowcap',tint:'#c8e8b8',dark:.5,loops:.45,exit:{to:'tangle',tx:0,ty:0},
   hint:'The Rootmaw. The Tanglewood\'s roots twist down into a living cave. Keys, plates and orbs lead to the Thorn Matriarch.',
   lore:['The walls are woven roots, and they move.','"Every tree here remembers when the Heart was well."']},
  {id:'cellar',name:'The Great Spice Cellar',zone:'delta',seed:909,grid:[5,4],floors:2,locks:[2,3],mech:[['plate','key'],['key','orb','plate']],fill:.82,lvl:31,bossLvl:34,
   boss:'baron',bossFlag:'boss15',bossChest:'boss15',foes:['bat','shroom','wolf','thornbrute'],mini:[['shroom','Spice Sprite'],['thornbrute','Cellar Brute']],
   props:['barrel','crate','clay'],deco:'glowcap',tint:'#ffe0b0',loops:.4,exit:{to:'delta',tx:0,ty:0},
   hint:'The Great Spice Cellar. Casks, crates and the sharp smell of pepper. The Pepper Baron guards every sack.',
   lore:['A cask labelled "Do not open. Seriously."','"The Baron pays in pepper. Do not take the pepper."']},
  {id:'sandhall',name:'The Sunken Sandhall',zone:'mesa',seed:1010,grid:[5,4],floors:2,locks:[2,3],mech:[['orb','key'],['plate','orb','key']],fill:.82,lvl:33,bossLvl:36,
   boss:'sand',bossFlag:'boss13',bossChest:'boss13',foes:['sandbeetle','wolf','brute','bat'],mini:[['brute','Sand Colossus'],['sandbeetle','Hive Mother']],
   props:['clay','ore','hay'],deco:'glowcap',tint:'#f0d8a0',loops:.4,exit:{to:'mesa',tx:0,ty:0},
   hint:'The Sunken Sandhall. A buried palace, half drowned in sand. The Sand Tyrant still sits on his throne.',
   lore:['Hieroglyphs of a king with a crown of roots.','"The sands rose the day the Heart fell ill."']},
  {id:'citadel',name:'The Gale Citadel',zone:'steppe',seed:1111,grid:[5,4],floors:2,locks:[3,3],mech:[['orb','plate','key'],['orb','orb','key']],fill:.82,lvl:21,bossLvl:24,
   boss:'storm',bossFlag:'boss9',bossChest:'boss9',foes:['stormbat','wolf','brute','beetle'],mini:[['stormbat','Thunder Roc'],['brute','Gale Warden']],
   props:['ore','clay','brazier'],deco:'glowcap',tint:'#d8d0f0',loops:.5,exit:{to:'steppe',tx:0,ty:0},
   hint:'The Gale Citadel. A tower of wind and lightning. The Storm Herald waits at the top.',
   lore:['The wind howls a single word, over and over: "Heart".','"We keep the message. We have forgotten what it says."']},
  {id:'magmacore',name:'The Magma Core',zone:'spire',seed:1212,grid:[5,4],floors:3,locks:[2,3,3],mech:[['plate','key'],['orb','plate','key'],['plate','orb','plate','key']],fill:.82,lvl:24,bossLvl:27,
   boss:'magma',bossFlag:'boss10',bossChest:'boss10',foes:['magmabrute','skeleton','ghost','bat'],mini:[['magmabrute','Slag Titan'],['skeleton','Ember Knight'],['magmabrute','Furnace Lord']],
   props:['ore','brazier','ore'],deco:'glowcap',tint:'#f09870',loops:.5,exit:{to:'spire',tx:0,ty:0},
   hint:'The Magma Core. The mountain\'s molten heart. The Magma Tyrant sits in a lake of fire.',
   lore:['The stone is warm. Somewhere below, something is breathing.','"The heat is the Heart\'s fever."']},
  {id:'prismvault',name:'The Prism Vault',zone:'gulch',seed:1313,grid:[5,4],floors:2,locks:[3,3],mech:[['orb','orb','key'],['plate','orb','key','orb']],fill:.82,lvl:34,bossLvl:37,
   boss:'prism',bossFlag:'boss12',bossChest:'boss12',foes:['crystalghost','skeleton','brute','stormbat'],mini:[['crystalghost','Refracted Soul'],['brute','Crystal Guardian']],
   props:['ore','lantern','clay'],deco:'glowcap',tint:'#e0d0ff',dark:.6,loops:.45,exit:{to:'gulch',tx:0,ty:0},
   hint:'The Prism Vault. A vault of living light. The Prism Wraith cannot leave it.',
   lore:['Your reflection waves at you a moment too late.','"Light that has nowhere to go turns to glass."']},
  {id:'reliquary',name:'The Frozen Reliquary',zone:'ridge',seed:1414,grid:[5,4],floors:3,locks:[2,3,3],mech:[['orb','key'],['plate','orb','key'],['orb','plate','orb','key']],fill:.82,lvl:38,bossLvl:41,
   boss:'frost',bossFlag:'boss11',bossChest:'boss11',foes:['frostwolf','frostskel','ghost','brute'],mini:[['frostskel','Rime Captain'],['ghost','Winter Widow'],['brute','Glacier Warden']],
   props:['grave','ore','clay'],deco:'glowcap',tint:'#d0e8ff',dark:.5,loops:.5,exit:{to:'ridge',tx:0,ty:0},
   hint:'The Frozen Reliquary. The Heart\'s oldest secrets are kept on ice here. The Winter Warden guards them.',
   lore:['Frost has written a name on the wall. It is yours.','"All winter, the Heart whispered. All winter, we listened."']}
];
for(const d of DUNGEONS)regDungeon(d);

// ================= Caves: small one-floor dungeons found in the zones (entrances placed by caves() in maps.js) =================
const ZDATA={
  glade:{lvl:3,foes:['beetle','wolf','shroom'],mini:[['beetle','Thornback Matriarch'],['wolf','Dire Rust Wolf']],tint:'#ecdcc0',props:['clay','ore']},
  amber:{lvl:8,foes:['bat','shroom','brute'],mini:[['brute','Sporecap Brute'],['shroom','Elder Nutmeg']],tint:'#c0e8b0',props:['ore','clay']},
  marsh:{lvl:11,foes:['bat','shroom','wolf','brute'],mini:[['brute','Bog Lurker'],['wolf','Mire Stalker']],tint:'#a8c8f0',props:['ore','clay']},
  rust:{lvl:14,foes:['wolf','beetle','brute','bat'],mini:[['wolf','Slag Hound'],['brute','Iron Crusher']],tint:'#f0c090',props:['ore','ore','clay']},
  grove:{lvl:36,foes:['skeleton','ghost'],mini:[['skeleton','Bone Warden'],['ghost','Wailing Matron']],tint:'#c0b0e0',props:['grave','clay']},
  heart:{lvl:40,foes:['skeleton','ghost','brute'],mini:[['brute','Rootbound Colossus'],['skeleton','Heart Knight']],tint:'#e0d0a0',props:['ore','clay']},
  saffron:{lvl:17,foes:['wolf','bat','brute','beetle'],mini:[['wolf','Straw Stalker'],['brute','Harvest Hound']],tint:'#f0e0a0',props:['hay','clay']},
  ember:{lvl:26,foes:['brute','skeleton','wolf','ghost'],mini:[['brute','Cinder Brute'],['skeleton','Ash Knight']],tint:'#f0a880',props:['ore','clay']},
  tangle:{lvl:29,foes:['thornbrute','wolf','beetle','shroom'],mini:[['thornbrute','Thornback Alpha'],['wolf','Fang Matron']],tint:'#c8e8b8',props:['logs','clay']},
  delta:{lvl:31,foes:['bat','shroom','wolf','thornbrute'],mini:[['shroom','Cinnamon Sprite'],['thornbrute','Reed Brute']],tint:'#ffe0b0',props:['barrel','crate']},
  mesa:{lvl:33,foes:['sandbeetle','wolf','brute','bat'],mini:[['sandbeetle','Dune Queen'],['brute','Mesa Crusher']],tint:'#f0d8a0',props:['clay','ore']},
  steppe:{lvl:20,foes:['stormbat','wolf','brute','beetle'],mini:[['stormbat','Gale Roc'],['wolf','Windrunner']],tint:'#d8d0f0',props:['ore','clay']},
  spire:{lvl:24,foes:['magmabrute','skeleton','ghost','bat'],mini:[['magmabrute','Slag Brute'],['skeleton','Obsidian Knight']],tint:'#f09870',props:['ore','brazier']},
  gulch:{lvl:34,foes:['crystalghost','skeleton','brute','stormbat'],mini:[['crystalghost','Prism Shade'],['brute','Geode Guardian']],tint:'#e0d0ff',props:['ore','lantern']},
  ridge:{lvl:38,foes:['frostwolf','frostskel','ghost','brute'],mini:[['frostwolf','Rime Alpha'],['frostskel','Frozen Captain']],tint:'#d0e8ff',props:['grave','ore']}
};
function caveSpec(c){
  const zi=['glade','amber','marsh','rust','grove','heart','saffron','ember','tangle','delta','mesa','steppe','spire','gulch','ridge'].indexOf(c.zone),z=ZDATA[c.zone],seed=700+c.n*13+zi*101;
  const mechs=[['key'],['orb'],['plate']];
  return{id:c.id,name:c.name,zone:c.zone,seed,grid:[3,2],floors:1,locks:[1],mech:[mechs[(c.n+zi)%3]],fill:.9,loops:.2,
    lvl:z.lvl+c.n,boss:null,finalMini:z.mini[(c.n-1)%z.mini.length],foes:z.foes,mini:[],props:z.props,deco:'glowcap',tint:z.tint,exit:c.exit,
    hint:c.name+'. A small cave: find the opener, defeat the guardian, claim the chest.'};
}
// build the zone maps once so every cave entrance is registered, then add the cave maps
function registerCaves(z){for(const id in CAVES){const c=CAVES[id];if(c.zone===z&&!MAPS[id])MAPS[id]=()=>genFloor(caveSpec(c),0)}}
