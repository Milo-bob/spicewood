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
  enemy.bat=make(sym([
    'bb...',
    'bbd..',
    'bbddd',
    '.bdwe',
    '..ddd',
    '...d.']),{b:'#6a4a7a',d:'#3a2448',w:'#ffffff',e:'#1b1b1b'});
  enemy.brute=make(sym([
    '..rrrr',
    '.rrwrr',
    'rrrrrr',
    'rwrrrr',
    'rrrrwr',
    '.ddddd',
    '.swess',
    '.ssssm',
    '..ssss',
    '..s...']),{r:'#8a4a9a',w:'#f0e0ff',d:'#4a2a5a',s:'#d8c8b0',e:'#1b1b1b',m:'#6a2a2a'});
  const B2ROWS=[
    '..rrrrrr',
    '.rrwrrrr',
    'rrrrrrwr',
    'rwrrrrrr',
    'rrrrwrrr',
    '.ddddddd',
    '..ssssss',
    '..sswess',
    '..ssssss',
    '..sssmmm',
    '..ssssmm',
    '...sssss',
    '..lssssl',
    '.l.sssss',
    'l..ss.ss',
    '...s..s.'];
  enemy.boss2=make(sym(B2ROWS),{r:'#8a3aaa',w:'#f0d8ff',d:'#3a1a4a',s:'#d0c0a8',e:'#1b1b1b',m:'#2a0a1a',l:'#a08a68'},2);
  // The Drowned Matron: hooded bog witch with dripping tendrils
  enemy.boss3=make(sym([
    '...rrrrr',
    '..rrwrrr',
    '.rrrrrrr',
    '.rrddddd',
    '.rdsssss',
    '.rdsessw',
    '.rdssmmm',
    '.rrdssdd',
    '..rrrrrr',
    '.rrwrrrr',
    'rrrrrrrr',
    'rrdrrrdr',
    'rd.rrd.r',
    'd.lrrl.d',
    '..l.l.l.']),{r:'#2f8a8a',w:'#a8f0e0',d:'#123a3a',s:'#7aa898',e:'#ffe060',m:'#0a1a1a',l:'#5a8a7a'},2);
  // The Rust Warden: horned stone and iron golem
  enemy.boss4=make(sym([
    'lll...dd',
    '.lldddss',
    '..ddssss',
    '..dsseww',
    '..dsssss',
    '..dsmmmm',
    'dddddddd',
    'dsssrrss',
    'dsssrrss',
    'dsssssss',
    '.dssssss',
    '.dddddd.',
    '.dss..ss',
    '.dss..ss',
    '.ddd..dd']),{s:'#8b8478',d:'#4a4238',r:'#a0522d',l:'#d8c8a0',e:'#ff9a20',w:'#b8b0a0',m:'#1a0e08'},2);
  // The Hollow King: crowned skeleton in a violet cloak
  enemy.boss5=make(sym([
    '..l.l.l.',
    '..llllll',
    '..wwwwww',
    '.wwwwwww',
    '.wweewww',
    '.wwwwwww',
    '..wddddd',
    '.pppwwww',
    'pppwbbbb',
    'pppwbbbb',
    'pppppbbb',
    'pppppppb',
    'ppppppp.',
    'pppp.ppp',
    'ppp..ppp',
    '.pp..ppp']),{l:'#e8c040',w:'#e8e4d0',e:'#7af0ff',d:'#7a7460',p:'#4a2a6a',b:'#b8b4a0'},2);
  // The Heartwood: the ancient tree itself
  enemy.boss6=make(sym([
    '..gggooo',
    '.ggyggog',
    'gggggygg',
    'goggggog',
    '.gbbbbbb',
    '..bdeebb',
    '..bbbbbb',
    '..bdmmmm',
    '..bbbdmm',
    '...bbbbb',
    '..lbbbbb',
    '.lbbbbbb',
    'lb.bbbbb',
    'b..bbbbb',
    'l..bb.bb',
    '...b..b.']),{g:'#5aa03a',o:'#d8741e',y:'#e8b838',b:'#6a4424',d:'#3a2412',e:'#ffe060',m:'#140a06',l:'#8a5c30'},2);
  enemy.skeleton=make(sym([
    '..www',
    '.wwww',
    'wwwww',
    'wekww',
    '.wwww',
    '.wddw',
    '..www',
    '.wbbb',
    'wwbwb',
    '.wbbb',
    '..w.w',
    '..w.w']),{w:'#e8e4d0',e:'#1b1b1b',k:'#1b1b1b',d:'#8a8470',b:'#b8b4a0'});
  enemy.ghost=make(sym([
    '..gggg',
    '.ggggg',
    'gggggg',
    'gggegg',
    'gggegg',
    'gggmmm',
    'gggggg',
    'gggggg',
    'g.gg.g',
    '.g..g.']),{g:'rgba(190,232,224,.9)',e:'#102020',m:'#102020'});
  // The Harvest King: crowned scarecrow in a green cloak
  enemy.boss7=make(sym([
    '..l.l.l.',
    '..llllll',
    '..wwwwww',
    '.wwwwwww',
    '.wweewww',
    '.wwwwwww',
    '..wddddd',
    '.pppwwww',
    'pppwbbbb',
    'pppwbbbb',
    'pppppbbb',
    'pppppppb',
    'ppppppp.',
    'pppp.ppp',
    'ppp..ppp',
    '.pp..ppp']),{l:'#f0c040',w:'#d8b860',e:'#401000',d:'#8a6a20',p:'#6a8a2a',b:'#c8a850'},2);
  // The Cinder Colossus: furnace golem
  enemy.boss8=make(sym([
    'lll...dd',
    '.lldddss',
    '..ddssss',
    '..dsseww',
    '..dsssss',
    '..dsmmmm',
    'dddddddd',
    'dsssrrss',
    'dsssrrss',
    'dsssssss',
    '.dssssss',
    '.dddddd.',
    '.dss..ss',
    '.dss..ss',
    '.ddd..dd']),{s:'#4a3a3a',d:'#1a1212',r:'#ff5a1a',l:'#ffb040',e:'#ffe040',w:'#7a6060',m:'#000000'},2);
  enemy.boss9=make(sym([
    '...rrrrr',
    '..rrwrrr',
    '.rrrrrrr',
    '.rrddddd',
    '.rdsssss',
    '.rdsessw',
    '.rdssmmm',
    '.rrdssdd',
    '..rrrrrr',
    '.rrwrrrr',
    'rrrrrrrr',
    'rrdrrrdr',
    'rd.rrd.r',
    'd.lrrl.d',
    '..l.l.l.']),{r:'#6a3ac8',w:'#fff0a0',d:'#2a1a60',s:'#a898e8',e:'#ffe040',m:'#1a1040',l:'#8a78d8',g:'rgba(190,170,255,.9)'},2);
  enemy.boss10=make(sym([
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
    '...b..b.']),{g:'#ff5a1a',b:'#3a2020',d:'#1a0e0e',l:'#6a3030',e:'#ffe040',w:'#ffd890',m:'#000000'},2);
  enemy.boss11=make(sym([
    '..l.l.l.',
    '..llllll',
    '..wwwwww',
    '.wwwwwww',
    '.wweewww',
    '.wwwwwww',
    '..wddddd',
    '.pppwwww',
    'pppwbbbb',
    'pppwbbbb',
    'pppppbbb',
    'pppppppb',
    'ppppppp.',
    'pppp.ppp',
    'ppp..ppp',
    '.pp..ppp']),{l:'#bfe8ff',w:'#e8f4fc',e:'#40a0ff',d:'#6a8aa8',p:'#2a5a9a',b:'#a8c8e0'},2);
  enemy.boss12=make(sym(B2ROWS),{r:'#40c8c8',w:'#fff0ff',d:'#1a4a5a',s:'#f0a0e0',e:'#202040',m:'#401a40',l:'#a0e8f0'},2);
  enemy.boss13=make(sym([
    'lll...dd',
    '.lldddss',
    '..ddssss',
    '..dsseww',
    '..dsssss',
    '..dsmmmm',
    'dddddddd',
    'dsssrrss',
    'dsssrrss',
    'dsssssss',
    '.dssssss',
    '.dddddd.',
    '.dss..ss',
    '.dss..ss',
    '.ddd..dd']),{s:'#d8b070',d:'#8a6030',r:'#c8502a',l:'#f0d890',e:'#40e0ff',w:'#fff0c0',m:'#2a1808'},2);
  enemy.boss14=make(sym([
    '..gggooo',
    '.ggyggog',
    'gggggygg',
    'goggggog',
    '.gbbbbbb',
    '..bdeebb',
    '..bbbbbb',
    '..bdmmmm',
    '..bbbdmm',
    '...bbbbb',
    '..lbbbbb',
    '.lbbbbbb',
    'lb.bbbbb',
    'b..bbbbb',
    'l..bb.bb',
    '...b..b.']),{g:'#2a6a2a',o:'#a02a3a',y:'#e8b030',b:'#1a3a1a',d:'#0e2a10',e:'#ff4040',w:'#fff0f0',m:'#0a1a0a',l:'#4a8a3a',r:'#c03030',s:'#3a5a2a'},2);
  enemy.boss15=make(sym(B2ROWS),{r:'#c8402a',w:'#ffe8c0',d:'#5a1a10',s:'#e8b878',e:'#202020',m:'#2a0a0a',l:'#a86a3a'},2);
  // Elder Maren, the Tithe-Binder: a red-robed elder in a crown of gold, rooted in green
  enemy.boss16=make(sym([
    '....llll',
    '...wwwww',
    '..wwwwww',
    '..wsssss',
    '..wsesss',
    '..wsssmm',
    '..rddddd',
    '.rrrlrrr',
    'rrrrlrrr',
    'rrrrrrrr',
    'grrrrrrr',
    'gdrrrrrr',
    'ggdrrrrr',
    'g.ddrrrr',
    'gg.ddddd',
    '.g..gggg']),{w:'#d8d8e0',s:'#e8c8a8',e:'#c01818',m:'#6a2a2a',r:'#7a1a2a',d:'#3a0a14',l:'#e8c040',g:'#3a6a2a'},2);
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
  enemy.frostwolf=tint(enemy.wolf,'rgba(140,200,255,.55)');enemy.sandbeetle=tint(enemy.beetle,'rgba(240,200,100,.5)');enemy.thornbrute=tint(enemy.brute,'rgba(40,160,60,.45)');
  enemy.stormbat=tint(enemy.bat,'rgba(180,160,255,.5)');enemy.magmabrute=tint(enemy.brute,'rgba(255,80,30,.55)');enemy.crystalghost=tint(enemy.ghost,'rgba(120,240,230,.5)');enemy.frostskel=tint(enemy.skeleton,'rgba(180,230,255,.5)');

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
    multi(T.WATER,(g,r)=>{R(g,'#2a4e6a',0,0,16,16);for(let i=0;i<3;i++)R(g,'#3f6e8c',Math.floor(r()*12),Math.floor(r()*15),3+Math.floor(r()*3),1);speck(g,r,['#1f3e56'],6)});
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
    multi(25,(g,r)=>{R(g,'#4d9aa6',0,0,16,16);for(let i=0;i<5;i++)R(g,'#9fd8de',Math.floor(r()*12),Math.floor(r()*15),3+Math.floor(r()*3),1);speck(g,r,['#2f6672'],6);for(let i=0;i<3;i++){const x=Math.floor(r()*14)+1;R(g,'#3e7a2a',x,Math.floor(r()*6)+3,1,6);R(g,'#7ab04a',x,Math.floor(r()*6)+2,1,2)}});
    multi(27,(g,r)=>{R(g,'#5a4a3a',0,0,16,16);R(g,'#0c0806',2,0,12,16);R(g,'#1a120c',3,0,10,16);for(let i=0;i<4;i++)R(g,'#2a1c12',3+Math.floor(r()*8),Math.floor(r()*14),2+Math.floor(r()*3),1);R(g,'#7a6650',0,0,2,16);R(g,'#7a6650',14,0,2,16);R(g,'#3e3226',2,0,1,16);R(g,'#3e3226',13,0,1,16);speck(g,r,['#8a7660','#4a3c2e'],6)});
    multi(28,(g,r)=>{R(g,'#0c0806',0,0,16,16);R(g,'#1a120c',0,3,16,10);R(g,'#7a6650',0,0,16,2);R(g,'#7a6650',0,14,16,2);for(let x=0;x<16;x+=4){R(g,'#8a5a2a',x,2,3,12);R(g,'#b07a3a',x,2,3,2);R(g,'#5a3a18',x+3,2,1,12)}R(g,'#6a4a22',0,4,16,1);R(g,'#6a4a22',0,11,16,1)});
    multi(29,(g,r)=>{R(g,'#8a7a66',0,0,16,16);speck(g,r,['#9c8c76','#76664f','#a89880','#6a5640'],24);if(r()<.35)R(g,'#a0522d',Math.floor(r()*12),Math.floor(r()*14),3,1);if(r()<.25)R(g,'#5e5240',Math.floor(r()*12),Math.floor(r()*14),4,1)});
    multi(30,(g,r)=>{R(g,'#8a7a66',0,0,16,16);speck(g,r,['#9c8c76','#76664f','#a89880'],16);R(g,'rgba(0,0,0,.25)',1,12,14,3);R(g,'#4e463c',1,2,14,12);R(g,'#6e665a',1,1,13,11);R(g,'#8e867a',3,2,5,2);R(g,'#a0522d',9,5,3,2);R(g,'#3a342c',2,11,12,2)});
    multi(31,(g,r)=>{R(g,'#2e3a3a',0,0,16,16);speck(g,r,['#3a4848','#243030','#46585a','#566a6a'],24);if(r()<.3)R(g,'#7a9a8a',Math.floor(r()*13),Math.floor(r()*14),2,1)});
    multi(32,(g,r,v)=>{R(g,'#2e3a3a',0,0,16,16);speck(g,r,['#3a4848','#243030'],10);R(g,'rgba(0,0,0,.3)',2,12,12,3);R(g,'#1a1a1e',6,7,4,8);R(g,'#8a9a98',1,1,14,9);R(g,'#b8c8c4',3,1,8,3);R(g,'#5a6a68',1,8,14,2);for(let i=0;i<3;i++)R(g,'#d8e8e4',Math.floor(r()*12)+1,Math.floor(r()*6)+1,2,1)});
    multi(33,(g,r)=>{R(g,'#e6edf5',0,0,16,16);speck(g,r,['#cfdbe9','#f7fbff','#b9c9dc','#d9e4f0'],26);if(r()<.2)R(g,'#a8b8cc',Math.floor(r()*12),Math.floor(r()*14),3,1)});
    multi(34,(g,r)=>{R(g,'#d9b975',0,0,16,16);speck(g,r,['#c9a55c','#e8cd8a','#b89449','#d2b068'],26);if(r()<.25)R(g,'#a8864a',Math.floor(r()*12),Math.floor(r()*14),4,1)});
    multi(35,(g,r,v)=>{R(g,'#102018',0,0,16,16);R(g,'#4a3020',6,12,4,4);R(g,'#1c4a30',1,4,14,9);R(g,'#2a6a44',2,2,12,7);R(g,'#1c4a30',3,0,10,4);R(g,'#eef4fa',2,2,5,2);R(g,'#eef4fa',9,5,4,2);R(g,'#eef4fa',4,0,6,1);R(g,'#c8d8e8',1,12,14,1)});
    multi(36,(g,r,v)=>{R(g,'#d9b975',0,0,16,16);speck(g,r,['#c9a55c','#e8cd8a'],14);R(g,'rgba(0,0,0,.2)',3,13,10,2);const x=5+(v%3);R(g,'#2c6a30',x,3,4,11);R(g,'#4a9a48',x,3,2,11);R(g,'#2c6a30',x-3,6,3,2);R(g,'#2c6a30',x-3,4,2,3);R(g,'#2c6a30',x+4,8,3,2);R(g,'#2c6a30',x+5,5,2,4);R(g,'#e8c8d0',x+1,3,1,1)});
    multi(37,(g,r,v)=>{R(g,'#3a3446',0,0,16,16);speck(g,r,['#4a4458','#2a2636'],14);R(g,'rgba(0,0,0,.3)',1,13,14,2);const cs=[['#7ad8e8','#4aa0b8'],['#c8a0ff','#8a60c8'],['#ff9ad0','#c0608a'],['#a0f0c0','#50b080']],c=cs[v%4];R(g,c[0],6,2,4,11);R(g,'#ffffff',7,3,1,6);R(g,c[1],9,4,1,9);R(g,c[0],2,6,3,7);R(g,c[1],4,7,1,6);R(g,c[0],11,7,3,6);R(g,c[1],13,8,1,5)});
    multi(38,(g,r,v)=>{R(g,'#0a1c0e',0,0,16,16);R(g,'#3a2412',6,12,4,4);R(g,'#16401c',0,3,16,10);R(g,'#1e5a26',0,0,16,9);for(let i=0;i<6;i++)R(g,'#2e7a34',Math.floor(r()*12),Math.floor(r()*7),3,2);for(let i=0;i<3;i++)R(g,'#0e2e14',Math.floor(r()*13),Math.floor(r()*8)+1,3,2);if(v%2)R(g,'#e8683a',Math.floor(r()*12)+1,Math.floor(r()*7)+1,2,2);R(g,'#0a1c0e',0,12,16,1);R(g,'#14401a',1,10,14,2)});
    multi(39,(g,r)=>{R(g,'#3a3232',0,0,16,16);speck(g,r,['#4a3e3e','#2a2222','#564848','#332a2a'],26);if(r()<.18)R(g,'#c8501e',Math.floor(r()*14),Math.floor(r()*14),1,1);if(r()<.15)R(g,'#5a3a2a',Math.floor(r()*12),Math.floor(r()*14),3,1)});
    multi(40,(g,r)=>{R(g,'#16101a',0,0,16,16);speck(g,r,['#241a2c','#0e0a12'],12);R(g,'rgba(0,0,0,.3)',1,13,14,2);R(g,'#2e2438',1,2,14,11);R(g,'#3c2e4a',2,2,10,4);R(g,'#16101a',1,12,14,1);for(let i=0;i<3;i++){const x=Math.floor(r()*11)+2,y=Math.floor(r()*8)+3;R(g,'#c0401a',x,y,1,3);R(g,'#ff8a2a',x,y,1,1)}});
    multi(T.OAK,(g,r)=>{R(g,'#5a3a1c',0,0,16,16);R(g,'#3e2810',0,0,2,16);R(g,'#3e2810',14,0,2,16);R(g,'#120a06',2,1,12,15);R(g,'#1e120a',4,3,8,13);R(g,'#2a1a0e',6,6,4,10);R(g,'#7a5a2c',1,0,14,1)});
  }
  build();
  tiles[24]=tiles[9];tiles[23]=tiles[9];tiles[26]=tiles[9];
  return{make,tint,heroes,npc,enemy,elite,flash,tiles};
})();
