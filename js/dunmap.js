'use strict';
// ================= Dungeons the Link's Awakening way: one room per screen, scrolling between rooms, a dungeon map, rooms that hold their enemies =================
let slideT=0;   // the world holds still for a moment while the screen scrolls into the next room

// the room the hero stands in (the doorway counts for the room it belongs to; corridors keep the previous room)
function dungeonCam(snap){
  const L=M.layout;let r=null;const tx=P.x/TS,ty=P.y/TS;
  for(const q of L.rooms)if(tx>=q.x1-.5&&tx<q.x2+1.5&&ty>=q.y1-.5&&ty<q.y2+1.5){r=q;break}
  if(r&&r!==cam.room){
    if(cam.room&&!snap)slideT=.32;
    cam.room=r;flags.dun['v_'+r.id]=true;
  }
  const q=cam.room||L.rooms[0];
  let x=(q.x1+q.x2+1)/2*TS-W/2,y=(q.y1+q.y2+1)/2*TS-H/2;
  x=clamp(x,P.x-W+44,P.x-44);y=clamp(y,P.y-H+44,P.y-44);   // the hero always stays on screen, even in a long corridor
  return{x:clamp(x,0,Math.max(0,M.w*TS-W)),y:clamp(y,0,Math.max(0,M.h*TS-H))};
}
function stepCam(dt){
  let tx,ty;
  if(M.dungeon&&M.layout){const t=dungeonCam(false);tx=t.x;ty=t.y;const k=Math.min(1,dt*(slideT>0?12:8));cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;return}
  tx=M.w*TS<=W?(M.w*TS-W)/2:clamp(P.x-W/2,0,M.w*TS-W);ty=M.h*TS<=H?(M.h*TS-H)/2:clamp(P.y-H/2,0,M.h*TS-H);
  cam.x+=(tx-cam.x)*Math.min(1,dt*8);cam.y+=(ty-cam.y)*Math.min(1,dt*8);
}

// enemies of a sealed room never leave it, not even before the doors close
function leashRoomFoes(){
  if(!M.rooms||!M.rooms.length)return;
  for(const e of E){
    if(!e.room||e.dead)continue;
    const r=M.rooms.find(q=>q.id===e.room);if(!r||flags.dun[r.id])continue;
    const hw=(e.hw||6)+2,hh=(e.hh||6)+2;
    e.x=clamp(e.x,r.x1*TS+hw,(r.x2+1)*TS-hw);e.y=clamp(e.y,r.y1*TS+hh,(r.y2+1)*TS-hh);
  }
}

// ---------- the dungeon map ----------
function drawDungeonMap(){
  const L=M.layout;if(!L){drawMap();return}
  const w=366,h=222,x=Math.round((W-w)/2),y=Math.round((H-h)/2);
  panel(x,y,w,h);
  text(M.name,x+w/2,y+7,'#ffd040',9,'center',true);
  const known=r=>!!flags.dun['v_'+r.id],byI=new Map(L.rooms.map(r=>[r.i,r]));
  const neigh=new Set();
  for(const e of L.edges){const a=byI.get(e.a),b=byI.get(e.b);if(known(a))neigh.add(b.i);if(known(b))neigh.add(a.i)}
  const cw=Math.min(54,Math.floor((w-40)/L.GW)),ch=Math.min(34,Math.floor((h-60)/L.GH)),ox=x+Math.round((w-cw*L.GW)/2),oy=y+26;
  const rx=r=>ox+r.gx*cw+3,ry=r=>oy+r.gy*ch+3,rw=cw-6,rh=ch-6;
  // doors first
  for(const e of L.edges){
    const a=byI.get(e.a),b=byI.get(e.b);if(!known(a)&&!known(b))continue;
    const mx=(rx(a)+rw/2+rx(b)+rw/2)/2,my=(ry(a)+rh/2+ry(b)+rh/2)/2;
    cx.fillStyle='#5a4a38';
    if(e.vert)cx.fillRect(Math.round(mx-1),Math.round(Math.min(ry(a),ry(b))+rh-1),3,6);else cx.fillRect(Math.round(Math.min(rx(a),rx(b))+rw-1),Math.round(my-1),6,3);
    if(e.lock){const c={key:'#ffe040',plate:'#b0b0b8',orb:'#6ab0ff',tool:'#7ad04a'}[e.lock];cx.fillStyle=c;cx.fillRect(Math.round(mx-2),Math.round(my-2),4,4)}
  }
  for(const r of L.rooms){
    if(!known(r)&&!neigh.has(r.i))continue;
    const seen=known(r),X=rx(r),Y=ry(r);
    cx.fillStyle=seen?'#3a2c1c':'#1c140c';cx.fillRect(X,Y,rw,rh);
    cx.strokeStyle=seen?'#a8886a':'#4a3c2c';cx.strokeRect(X+.5,Y+.5,rw-1,rh-1);
    if(!seen){text('?',X+rw/2,Y+rh/2-3,'#6a5a48',7,'center');continue}
    if(r.role==='boss'||r.role==='final'){cx.fillStyle='#e04a3a';cx.fillRect(X+rw/2-3,Y+rh/2-3,7,7);cx.fillStyle='#1c140c';cx.fillRect(X+rw/2-2,Y+rh/2-1,2,2);cx.fillRect(X+rw/2+1,Y+rh/2-1,2,2)}
    else if(r.role==='stairs'||r.role==='start'){cx.fillStyle='#8fd0ff';cx.fillRect(X+rw/2-3,Y+rh-6,7,3);cx.fillRect(X+rw/2-1,Y+rh-9,3,3)}
    else if(r.role==='tool'){cx.fillStyle='#7ad04a';cx.fillRect(X+rw/2-3,Y+rh/2-3,7,7)}
  }
  // chests of the rooms you have seen
  for(const c of M.chests){
    const tx=c.x/TS,ty=c.y/TS,r=L.rooms.find(q=>tx>=q.x1&&tx<q.x2+1&&ty>=q.y1&&ty<q.y2+1);
    if(!r||!known(r))continue;
    const done=!!flags.chests[c.id];cx.fillStyle=done?'#6a5a3a':'#ffd040';cx.fillRect(rx(r)+3,ry(r)+3,5,4);
  }
  if(cam.room){const r=byI.get(cam.room.i);if(r&&Math.floor(time*3)%2){cx.fillStyle='#ffffff';cx.fillRect(rx(r)+rw/2-2,ry(r)+rh/2-2,5,5)}}
  const fy=y+h-30;
  text(`Floor ${L.floor+1} of ${L.floors}`,x+12,fy,'#a89878',7);
  text(`Small keys: ${P.keys}`,x+12,fy+10,'#ffe040',7);
  const leg=[['#ffe040','key door'],['#6ab0ff','orb door'],['#b0b0b8','plate door'],['#7ad04a','item gate / item'],['#e04a3a','boss'],['#ffd040','chest']];
  leg.forEach(([c,t],i)=>{const lx=x+130+(i%3)*76,ly=fy+Math.floor(i/3)*10;cx.fillStyle=c;cx.fillRect(lx,ly+2,5,5);text(t,lx+8,ly,'#8a7a62',6)});
  text('N / Backspace: close',x+w-10,y+h-12,'#7a6a58',6,'right');
}
