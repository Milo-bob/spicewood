'use strict';
// All art is generated in code: pixel arrays for characters, procedural speckle for tiles.
const Spr=(()=>{
  function make(rows,pal,sc){
    sc=sc||1;
    const w=Math.max(...rows.map(r=>r.length)),h=rows.length;
    const c=document.createElement('canvas');c.width=w*sc;c.height=h*sc;
    const g=c.getContext('2d');
    rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const col=pal[r[i]];if(col){g.fillStyle=col;g.fillRect(i*sc,j*sc,sc,sc)}}});
    return c;
  }
  function outline(c,col){
    const o=document.createElement('canvas');o.width=c.width+2;o.height=c.height+2;
    const g=o.getContext('2d');
    const d=tint(c,col||'#1a0c06');
    for(const[x,y]of[[0,1],[2,1],[1,0],[1,2]])g.drawImage(d,x,y);
    g.drawImage(c,1,1);
    return o;
  }
  function tint(c,color){
    const f=document.createElement('canvas');f.width=c.width;f.height=c.height;
    const g=f.getContext('2d');g.drawImage(c,0,0);
    g.globalCompositeOperation='source-atop';g.fillStyle=color;g.fillRect(0,0,f.width,f.height);
    return f;
  }

  // ----- humanoids: big blocky head (like the mob poster), tiny body; legs are drawn in code -----
  function human(kind,pal,back){
    let top=['.hhhhhhhh.','hhhhhhhhhh','hhhhhhhhhh'];
    if(kind==='warrior')top=['....cc....','.hhhccchh.','hhhhhhhhhh'];
    if(kind==='mage')top=['....hh....','..hhhhhh..','hhhhhhhhhh','hhhhhhhhhh'];
    if(kind==='rogue')top=['.hhhhhhhh.','hhhhhhhhhh','hhhhhhhhhh'];
    const face=kind==='rogue'?['hssssssssh','hswesswesh','hkkkkkkkkh','.hkkkkkkh.']:['hssssssssh','hswesswesh','hsssmmsssh','.hssssssh.'];
    let rows=[...top,'hssssssssh',...face,'.kcccccck.','.kccggcck.','..kkkkkk..'];
    if(kind==='rogue')rows=[...top,'hssssssssh',...face,'.kcccccck.','.kccggcck.','..kkkkkk..'];
    if(back)rows=rows.map(r=>r.replace(/[we]/g,'h').replace(/m/g,'s'));
    return outline(make(rows,Object.assign({s:'#f2c9a0',e:'#1b1b1b',w:'#ffffff',m:'#b0605a'},pal)));
  }
  const heroes={};
  for(const h of HEROES){
    const pal={h:h.hair,c:h.color,k:h.dark,g:h.light};
    heroes[h.id]={front:human(h.id,pal,false),back:human(h.id,pal,true)};
  }
  function npc(pal){return{front:human('villager',pal,false),back:human('villager',pal,true)}}

  // ----- enemies -----
  const enemy={},elite={},flash={};
  const sym=h=>h.map(r=>r+[...r].reverse().join(''));
  enemy.beetle=make(sym([
    '.k...',
    '..ooo',
    '.oooo',
    '.oweo',
    '.oooo',
    '.odoo',
    '..ddd',
    '.d.d.']),{o:'#c2551d',d:'#7a2e10',l:'#e68a3a',k:'#2a140a',e:'#1b1b1b',w:'#ffffff'});
  enemy.wolf=make(sym([
    '.dd..',
    '.dggg',
    'dgggg',
    'dgwEg',
    'dgggg',
    '.ggww',
    '..wwn',
    '..ggg',
    '..d.d']),{g:'#8b8478',d:'#4f4a42',w:'#d8d2c4',E:'#1b1b1b',n:'#2a2a2a'});
  enemy.shroom=make(sym([
    '..rrr',
    '.rwrr',
    'rrrrr',
    'rwrrr',
    '.dddd',
    '.swes',
    '.ssss',
    '..s..']),{r:'#c8501e',w:'#ffffff',d:'#7a2e10',s:'#e8d8b8',e:'#1b1b1b'});
  enemy.boss=make(sym([
    '..gg..gg',
    '.ggggggg',
    'gggggggg',
    '.gggbbbb',
    '..bbbbbb',
    '..bdwebb',
    '..bbbbbb',
    '..bbdmmm',
    '..bbbdmm',
    '...bbbbb',
    '..lbbbbb',
    '.lbbbbbb',
    'lb.bbbbb',
    'b..bbbbb',
    '...bb.bb',
    '...b..b.']),{g:'#d8741e',b:'#6a4424',d:'#3a2412',l:'#8a5c30',e:'#1b1b1b',w:'#ffffff',m:'#140a06'},2);
  for(const k in enemy)enemy[k]=outline(enemy[k]);
  for(const k in enemy){elite[k]=tint(enemy[k],'rgba(255,200,40,.38)');flash[k]=tint(enemy[k],'#ffffff')}

  // ----- tiles -----
  const tiles={};
  function mkTile(fn){const c=document.createElement('canvas');c.width=c.height=16;fn(c.getContext('2d'));return c}
  function speck(g,r,cols,n){for(let i=0;i<n;i++){g.fillStyle=cols[Math.floor(r()*cols.length)];g.fillRect(Math.floor(r()*16),Math.floor(r()*16),r()<.3?2:1,1)}}
  function R(g,c,x,y,w,h){g.fillStyle=c;g.fillRect(x,y,w,h)}
  const grass=(g,r)=>{R(g,'#65702e',0,0,16,16);speck(g,r,['#737c35','#545f26','#808840'],16);speck(g,r,['#c4651f','#a8431a'],r()<.5?3:0)};
  const CANOPY=[['#a83a16','#d05a24','#6e220c'],['#c8801e','#eaa638','#8a5010'],['#8e2a14','#bc4224','#5a1a0a'],['#b4561a','#dc7c2a','#6e3410']];
  const G=T=>T;
  function build(){
    const T={GRASS:0,LEAF:1,PATH:2,TREE:3,WATER:4,WALL:5,ROOF:6,DOOR:7,ROCK:8,DFLOOR:9,DWALL:10,VINE:11,LOCK:12,SHROOM:13,FENCE:14,OAK:15};
    const V=4;
    const multi=(id,fn)=>{tiles[id]=[];for(let v=0;v<V;v++){const r=seeded(id*100+v+1);tiles[id].push(mkTile(g=>fn(g,r,v)))}};
    multi(T.GRASS,grass);
    multi(T.LEAF,(g,r)=>{R(g,'#7a4a20',0,0,16,16);speck(g,r,['#96592a','#b06a28','#5e3818','#c8802c','#8a2e14'],26)});
    multi(T.PATH,(g,r)=>{R(g,'#a07c52',0,0,16,16);speck(g,r,['#8f6f48','#b79468','#7c5e3c'],20)});
    multi(T.TREE,(g,r,v)=>{
      const c=CANOPY[v%4];
      R(g,'#2a160a',0,0,16,16);
      R(g,'#4a2c14',6,12,4,4);R(g,'#2a160a',6,12,1,4);
      R(g,c[2],0,3,16,10);R(g,c[0],0,0,16,10);
      for(let i=0;i<5;i++)R(g,c[1],Math.floor(r()*12),Math.floor(r()*7),2+Math.floor(r()*3),2);
      for(let i=0;i<4;i++)R(g,c[2],Math.floor(r()*13),Math.floor(r()*8)+1,3,2);
      R(g,'#2a160a',0,12,16,1);R(g,c[2],1,10,14,2);
    });
    multi(16,(g,r,v)=>{
      grass(g,r);const c=CANOPY[v%4];
      R(g,'rgba(0,0,0,.25)',3,12,10,3);R(g,'#4a2c14',6,10,4,5);
      R(g,c[2],1,3,14,9);R(g,c[0],1,1,14,8);R(g,c[0],3,0,10,1);R(g,c[1],3,2,5,3);R(g,c[1],10,5,3,2);R(g,c[2],2,9,12,2);
    });
    multi(T.WATER,(g,r)=>{R(g,'#3b6e8f',0,0,16,16);for(let i=0;i<4;i++)R(g,'#5b8fb0',Math.floor(r()*12),Math.floor(r()*15),3+Math.floor(r()*3),1);speck(g,r,['#2f5c7a'],6)});
    multi(T.WALL,(g,r,v)=>{R(g,'#7a5a3a',0,0,16,16);for(let y=3;y<16;y+=4)R(g,'#5a3e24',0,y,16,1);for(let y=0;y<16;y+=4)R(g,'#8c6c46',(y*3)%11,y,3,1);if(v===1){R(g,'#2a1808',4,3,8,8);R(g,'#ffc860',5,4,6,6);R(g,'#ffe8a0',5,4,6,2);R(g,'#2a1808',8,4,1,6);R(g,'#2a1808',5,7,6,1)}});
    const roof=(base,dk,lt)=>(g,r)=>{R(g,base,0,0,16,16);for(let y=3;y<16;y+=4){R(g,dk,0,y,16,1);R(g,lt,0,y-3,16,1)}for(let y=0;y<16;y+=4)for(let x=(y%8?0:4);x<16;x+=8)R(g,dk,x,y,1,3)};
    multi(T.ROOF,roof('#7a3020','#561e12','#964428'));
    multi(20,roof('#3a5a8a','#243c60','#5a7eb0'));
    multi(21,roof('#3a7a4a','#24502e','#5aa06a'));
    multi(22,roof('#b0802a','#7a5416','#d8a848'));
    multi(T.DOOR,(g,r)=>{R(g,'#7a5a3a',0,0,16,16);for(let y=3;y<16;y+=4)R(g,'#5a3e24',0,y,16,1);R(g,'#3d2a18',3,2,10,14);R(g,'#4e3720',4,3,8,13);R(g,'#2a1a0c',8,3,1,13);R(g,'#c9a040',10,9,2,2)});
    multi(T.ROCK,(g,r,v)=>{grass(g,r);R(g,'#5d5a54',2,5,12,9);R(g,'#7d7a74',2,4,11,8);R(g,'#a09c94',4,5,4,2);R(g,'#4a4742',3,12,10,2)});
    multi(T.DFLOOR,(g,r)=>{R(g,'#4a3a2e',0,0,16,16);speck(g,r,['#5a4838','#3a2c22','#6a5444'],22);if(r()<.3)R(g,'#2e2218',Math.floor(r()*10),Math.floor(r()*14),5,1)});
    multi(T.DWALL,(g,r)=>{R(g,'#2a2018',0,0,16,16);speck(g,r,['#3a2c1e','#1c140e'],20);for(let i=0;i<3;i++)R(g,'#4a3016',Math.floor(r()*14),Math.floor(r()*14),1,3+Math.floor(r()*5));R(g,'#4a3016',0,Math.floor(r()*14),2+Math.floor(r()*10),1)});
    multi(T.VINE,(g,r)=>{R(g,'#3a4a22',0,0,16,16);for(let i=0;i<5;i++){R(g,'#6a8a30',Math.floor(r()*14),0,1,16);R(g,'#4e6a26',0,Math.floor(r()*14),16,1)}speck(g,r,['#a02a2a'],5);speck(g,r,['#c8c8a0'],4)});
    multi(T.LOCK,(g,r)=>{R(g,'#2a2018',0,0,16,16);R(g,'#6a4a22',0,0,16,16);for(let x=3;x<16;x+=5)R(g,'#4a3010',x,0,1,16);R(g,'#4a3010',0,7,16,2);R(g,'#d8b030',6,5,4,5);R(g,'#8a6a10',7,7,2,2)});
    multi(T.SHROOM,(g,r)=>{grass(g,r);R(g,'#e8d8b8',7,9,2,4);R(g,'#c8501e',5,6,6,4);R(g,'#f0e0c0',6,7,1,1);R(g,'#f0e0c0',9,8,1,1)});
    multi(T.FENCE,(g,r)=>{grass(g,r);R(g,'#7a5a30',1,4,2,10);R(g,'#7a5a30',13,4,2,10);R(g,'#9a7a48',0,6,16,2);R(g,'#9a7a48',0,10,16,2)});
    multi(17,grass);
    multi(18,(g,r)=>{grass(g,r);const cs=['#e8d040','#e86a8a','#f0f0f0','#c070e0','#ff9a2a'];for(let i=0;i<6;i++){const x=Math.floor(r()*14)+1,y=Math.floor(r()*13)+2;R(g,'#4a6a22',x,y+1,1,2);R(g,cs[Math.floor(r()*cs.length)],x,y,1+(r()<.4?1:0),1)}});
    multi(19,(g,r)=>{R(g,'#4a3018',0,0,16,16);for(let y=1;y<16;y+=4)R(g,'#5e3c20',0,y,16,2);for(let x=2;x<16;x+=5)for(let y=0;y<16;y+=4){R(g,'#6a9a30',x,y,1,2);R(g,r()<.5?'#d8741e':'#8abc40',x-1,y-1<0?0:y-1,3,1)}});
    multi(T.OAK,(g,r)=>{R(g,'#5a3a1c',0,0,16,16);R(g,'#3e2810',0,0,2,16);R(g,'#3e2810',14,0,2,16);R(g,'#120a06',2,1,12,15);R(g,'#1e120a',4,3,8,13);R(g,'#2a1a0e',6,6,4,10);R(g,'#7a5a2c',1,0,14,1)});
  }
  build();
  tiles[24]=tiles[9];tiles[23]=tiles[9];
  return{make,tint,heroes,npc,enemy,elite,flash,tiles};
})();
