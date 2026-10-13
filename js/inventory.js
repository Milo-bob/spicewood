'use strict';
// ================= Inventory screen: Gear | Items | Materials | Key Items =================
// ================= Item screen: Gear | Key Items | Codex | Quests =================
const INVTABS=['Gear','Key Items','Codex','Quests'];
function openInv(tab){ui={mode:'inv',tab:tab||0,ki:0}}

// ---------- pixel icons (10x10, scaled) ----------
const ICONP={
  sword:['........ml','.......mlm','......mlm.','.....mlm..','.g..mlm...','..gmlm....','...gg.....','..b.gg....','.b........','b.........'],
  axe:['...mm.....','..mmlm....','.mmlmmb...','.mmmm.b...','..mm..b...','......b...','.....b....','.....b....','....b.....','....b.....'],
  bow:['...mm.....','..m..w....','.m....w...','.m....w...','m.....w...','m.....w...','.m....w...','.m....w...','..m..w....','...mm.....'],
  staff:['....gg....','...gmmg...','...gmlg...','....gg....','....b.....','....b.....','....b.....','....b.....','....b.....','....b.....'],
  dagger:['.......ml.','......mlm.','.....mlm..','....mlm...','..g.mm....','...gg.....','..bg......','.bb.......','.b........','..........'],
  helm:['...mmmm...','..mllmmm..','.mllmmmmm.','.mlmmmmmm.','.mmmmmmmm.','.mddmmddm.','.mdd..ddm.','.mm....mm.','..........','..........'],
  chest:['.mm....mm.','mlmm..mmdm','mlmmddmmdm','.mlmggmmd.','.mlmggmmd.','.mmmggmmd.','.mmmmmmmd.','.mmmmmmmd.','..mmmmmd..','..dddddd..'],
  gloves:['..m.m.m...','.mmmmmmm..','.mlmmmmmm.','.mlmmmmmm.','.mmmmmmmm.','..mmmmmm..','..mmmmmm..','..dddddd..','..dddddd..','..........'],
  boots:['..mmm.....','..mlm.....','..mlm.....','..mmm.....','..mmmm....','..mmmmmm..','.mmmmmmmm.','.mllmmmmm.','.dddddddd.','..........'],
  amulet:['.d......d.','..d....d..','...d..d...','....dd....','....gg....','...gmmg...','...gmlg...','....gg....','..........','..........'],
  ring:['....ll....','...lmml...','..mm..mm..','.mm....mm.','.m......m.','.m......m.','.mm....mm.','..mm..mm..','...mmmm...','..........'],
  gem:['....ll....','...llmm...','..llmmmm..','.lmmmmmmm.','.mmmmmmmd.','..mmmmmd..','...mmmd...','....dd....','..........','..........'],
  potion:['...bbbb...','....dd....','....dd....','...dmmd...','..dmmlmd..','..dmmmmd..','..dmmmmd..','..dmmmmd..','...dddd...','..........'],
  bomb:['......yy..','.....y....','...dddd...','..dmmlmd..','.dmmllmmd.','.dmmmmmmd.','.dmmmmmmd.','..dmmmmd..','...dddd...','..........'],
  scroll:['..bbbbbb..','.bwwwwwwb.','..wmmmmw..','..wwwwww..','..wmmmmw..','..wwwwww..','..wmmmw...','.bwwwwwwb.','..bbbbbb..','..........'],
  key:['..gggg....','.g....g...','.g....g...','..gggg....','...g......','...g......','...gg.....','...g......','...gg.....','..........'],
  fruit:['.....g....','....gg....','..rrrrrr..','.rrllrrrr.','.rlrrrrrr.','.rrrrrrrr.','.rrrrrrrr.','..rrrrrr..','...rrrr...','..........'],
  box:['..........','.dddddddd.','.dmmmmmmd.','.dmmllmmd.','.dmmmmmmd.','.dddddddd.','..........','..........','..........','..........']
};
const iconCache={};
function shade(hex,f){
  const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;
  if(f>=0){r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}else{r*=1+f;g*=1+f;b*=1+f}
  return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}
function iconCanvas(kind,color){
  const key=kind+color;if(iconCache[key])return iconCache[key];
  const pat=ICONP[kind]||ICONP.box,c=document.createElement('canvas');c.width=c.height=10;const g=c.getContext('2d');
  const pal={m:color,l:shade(color,.45),d:shade(color,-.45),b:'#8a5a2a',g:'#f0c040',w:'#e8e0c8',y:'#ffd040',r:'#d03a3a'};
  for(let y=0;y<10;y++)for(let x=0;x<10;x++){const ch=pat[y][x];if(ch!=='.'){g.fillStyle=pal[ch]||color;g.fillRect(x,y,1,1)}}
  iconCache[key]=c;return c;
}
function drawIcon(kind,color,x,y,sc){cx.drawImage(iconCanvas(kind,color),Math.round(x),Math.round(y),10*sc,10*sc)}
// ---------- potion (also used by the Q key) ----------
function usePotion(){
  if(P.potCd>0)return;
  if(P.potions>0&&P.hp<P.maxHp){
    P.potions--;P.potCd=1;
    const h=Math.round((P.maxHp*.45+10)*(1+(P.mods.potPct||0)/100)*(1+.25*(baseLv('alch')-1)));
    P.hp=Math.min(P.maxHp,P.hp+h);floatText(P.x,P.y-14,'+'+h,'#60ff80');puff(P.x,P.y,8,'#60ff80',40);Snd.pickup();
  }else if(P.potions<=0)toast('No potions left (buy more from Pip)','#ff8070');
}

const KEYITEMS=[
  {k:'charm',n:'Heart-leaf Charm',c:'#e0a040',icon:'fruit',d:'A dried amber leaf from Lia. It keeps bad dreams away, and it hums when the Heart is near.'},
  {k:'sickle',n:'Thornsickle',c:'#7ad04a',icon:'axe',d:'Cuts thorn vines. Opens the south road of Ember Glade, the Root Cellar and the thorn wall in Amber Hollow.'},
  {k:'boots',n:'Wooden Boots',c:'#b8844a',icon:'boots',d:'Lets you wade through shallow water: fords, the marsh, the grotto pond in Ember Glade.'},
  {k:'hook',n:'Grapple Hook',c:'#9ab0c8',icon:'key',d:'Turns gorges into rope bridges. Opens the road to Rustpeak and the Hookshot Hollow.'},
  {k:'lantern',n:'Miner\'s Lantern',c:'#f0c040',icon:'staff',d:'Lights dark tunnels and widens your sight in dark places. Opens the black tunnel under the gorge north of Ember Glade.'},
  {k:'bow',n:"Hunter's Bow",c:'#c8a060',icon:'bow',d:'A light hunting bow. Its arrows fly over water and gorges and strike what you cannot reach: distant orbs, archers on the far bank.'},
  {k:'windcharm',n:'Windcharm',c:'#a8e8ff',icon:'gem',d:'Its gusts carry you through the wind passes. Opens the road north of Saffron Meadows.'},
  {k:'heraldwing',n:'Heraldwing',c:'#d8e8ff',icon:'gem',d:'Rides the Wind Chasm. Opens the road from the Windward Steppe to the Smolder Spire.'},
  {k:'slagwalkers',n:'Slagwalkers',c:'#ff7a40',icon:'boots',d:'Cross molten ground. Opens the slag gate south of the Smolder Spire and the Ashen Pass.'},
  {k:'emberglove',n:'Ember Glove',c:'#ff8a30',icon:'gloves',d:'Burns away thorn walls. Opens the road east of Ember Glade into the Tanglewood.'},
  {k:'briarkey',n:'Briar Key',c:'#58b040',icon:'key',d:'Opens the gates of living briars south of the Tanglewood and east of Amber Hollow.'},
  {k:'dunegoggles',n:'Dune Goggles',c:'#e8c070',icon:'gem',d:'See through sandstorms. Opens the roads to the Sunbaked Mesa.'},
  {k:'sunstone',n:'Sunstone',c:'#ffd860',icon:'gem',d:'Parts the crystal veil. Opens the roads to Crystal Gulch.'},
  {k:'truthglass',n:'Truthglass',c:'#c8b0ff',icon:'gem',d:'Shows what hides from the eye. Reveals the door north of Rustpeak that leads to Ghostbark Grove.'},
  {k:'oathcrown',n:'Oathcrown',c:'#b8a8d8',icon:'staff',d:'The crown of the first founder. Opens the gate of black ice west of the Smolder Spire (Hoarfrost Ridge).'},
  {k:'heartseed',n:'Heartseed',c:'#d8a030',icon:'fruit',d:'Wakes the frozen roots south of Hoarfrost Ridge, the root gates of the Heart of Spicewood and the root-bound vault in Rustpeak.'}
];
const BOSSLIST=[['boss','Old Barkfather'],['boss2','Mother Mycelia'],['boss3','Drowned Matron'],['boss4','Rust Warden'],['boss5','Hollow King'],['boss6','The Heartwood'],['boss16','Elder Maren'],['boss7','Harvest King'],['boss8','Cinder Colossus'],['boss14','Thorn Matriarch'],['boss15','Pepper Baron'],['boss13','Sand Tyrant'],['boss9','Storm Herald'],['boss10','Magma Tyrant'],['boss12','Prism Wraith'],['boss11','Winter Warden']];


// ---------- update ----------
function updateInv(){
  const s=ui;
  if(Input.cancel()){ui=null;return}
  if(Input.hit('tabl')){s.tab=(s.tab+INVTABS.length-1)%INVTABS.length;Snd.menu();return}
  if(Input.hit('tabr')){s.tab=(s.tab+1)%INVTABS.length;Snd.menu();return}
  if(s.tab===0){
    s.gs=s.gs||0;
    if(Input.hit('up')){s.gs=(s.gs+2)%3;Snd.menu()}
    if(Input.hit('down')){s.gs=(s.gs+1)%3;Snd.menu()}
    if(Input.confirm())usePotion();
  }
  else if(s.tab===1){
    const n=KEYITEMS.length,C=5;s.kt=s.kt||0;
    if(Input.hit('left'))s.kt=(s.kt+n-1)%n;
    if(Input.hit('right'))s.kt=(s.kt+1)%n;
    if(Input.hit('up'))s.kt=(s.kt+n-C)%n;
    if(Input.hit('down'))s.kt=(s.kt+C)%n;
    const k=KEYITEMS[s.kt].k;
    if(Input.hit('skill1'))assignTool(k,0);
    if(Input.hit('skill2'))assignTool(k,1);
  }
  else if(s.tab===2){
    if(Input.hit('up'))s.ki=Math.max(0,(s.ki||0)-1);
    if(Input.hit('down'))s.ki=Math.min(TOMELIST.length-1,(s.ki||0)+1);
  }
}

// ---------- draw ----------
function smallBtn(x,y,w,label,fn,on){
  cx.fillStyle=on?'#5a4220':'#3a2814';cx.fillRect(x,y,w,11);cx.strokeStyle='#8a6a3a';cx.strokeRect(x+.5,y+.5,w-1,10);
  text(label,x+w/2,y+2,'#ffe9a0',6,'center');reg(x,y,w,11,fn);
}
function drawInv(){
  cx.fillStyle='rgba(8,4,2,.84)';cx.fillRect(0,0,W,H);
  panel(4,4,W-8,H-8);
  INVTABS.forEach((n,i)=>{
    const x=10+i*54,on=ui.tab===i;
    cx.fillStyle=on?'#5a4220':'#241810';cx.fillRect(x,8,51,12);cx.strokeStyle=on?'#ffd040':'#5a4220';cx.strokeRect(x+.5,8.5,50,11);
    text(n,x+25.5,11,on?'#ffe9a0':'#a89878',7,'center',on);reg(x,6,51,16,()=>{ui.tab=i;Snd.menu()});
  });
  const tx=touchActive()?36:14;
  text(`Gold ${P.gold}`,W-tx,10,'#ffd040',8,'right',true);
  if(!touchActive())text('Z / C: switch tab',W-90,10,'#6a5a48',6,'right');
  if(ui.tab===0)drawGearTab();
  else if(ui.tab===1)drawKeysTab();
  else if(ui.tab===2)drawCodexTab();
  else drawQuestsTab();
  text(touchActive()?'Tap to choose   X closes':ui.tab===0?'Up/Down choose   Enter drink a potion   I/Backspace close':ui.tab===1?'Arrows choose   K / L put a tool on A / B   I/Backspace close':'I/Backspace close   Z / C switch tab',W/2,H-12,'#7a6a58',6,'center');
}
// ---------- shared pieces: a Link's Awakening style item grid + a detail box (big icon with glow and corner brackets) ----------
function brackets(x,y,w,h,c,l){
  l=l||4;cx.fillStyle=c;
  cx.fillRect(x,y,l,1);cx.fillRect(x,y,1,l);cx.fillRect(x+w-l,y,l,1);cx.fillRect(x+w-1,y,1,l);
  cx.fillRect(x,y+h-1,l,1);cx.fillRect(x,y+h-l,1,l);cx.fillRect(x+w-l,y+h-1,l,1);cx.fillRect(x+w-1,y+h-l,1,l);
}
function cell(x,y,s,col,sel,has){
  cx.fillStyle=sel?'#3a2a14':'#241810';cx.fillRect(x,y,s,s);
  cx.strokeStyle=sel?'#ffd040':has?shade(col,-.3):'#3a2c1c';cx.strokeRect(x+.5,y+.5,s-1,s-1);
}
// box with a big icon, a title and a tag line; returns the y where the body text can start
function detailBox(x,y,w,h,col,kind,icol,has,title,tag){
  panel(x,y,w,h);
  const ix=x+12,iy=y+12,s=44;
  cx.save();cx.globalAlpha=.12+.08*Math.sin(time*3);cx.fillStyle=col;cx.fillRect(ix-5,iy-5,s+10,s+10);cx.restore();
  cx.fillStyle='#120a05';cx.fillRect(ix,iy,s,s);cx.strokeStyle=has?col:'#3a2c1c';cx.strokeRect(ix+.5,iy+.5,s-1,s-1);
  brackets(ix-3,iy-3,s+6,s+6,has?col:'#3a2c1c',5);
  if(has)drawIcon(kind,icol,ix+7,iy+7+Math.round(Math.sin(time*2.5)),3);else text('?',ix+s/2,iy+14,'#5a4a38',16,'center',true);
  text(has?title:'Unknown',ix+s+12,iy+7,has?'#fff':'#6a5a48',11,'left',true);
  text(tag,ix+s+12,iy+25,has?col:'#6a5a48',7);
  cx.fillStyle=has?col:'#3a2c1c';cx.globalAlpha=.35;cx.fillRect(x+10,iy+s+9,w-20,1);cx.globalAlpha=1;
  return iy+s+16;
}
function pips(x,y,n,max,col){for(let i=0;i<max;i++){cx.fillStyle=i<n?col:'#2a1c10';cx.fillRect(x+i*14,y,12,6);if(i<n){cx.fillStyle='rgba(255,255,255,.25)';cx.fillRect(x+i*14,y,12,1)}}}

// the hero: one sword, one set of armor, hearts and potions. Nothing to sort, sell or spend.
function drawGearTab(){
  const g=P.gear||gearNow(),next=GEAR_AT[g.tier+1],sel=ui.gs||0,t=g.tier;
  const cards=[
    {lab:'WEAPON',name:g.sword.name,stat:`Damage ${Math.round(P.atk)}`,kind:'sword',col:SWORD_COL[t],d:g.sword.d},
    {lab:'ARMOR',name:g.armorSet.name,stat:`Defense ${P.armor}`,kind:'chest',col:ARMOR_COL[t],d:g.armorSet.d},
    {lab:'POTIONS',name:'Healing Potion',stat:`${P.potions} / ${potCap()}`,kind:'potion',col:'#e04a4a',d:'A bitter brew of amber herbs. Press Q anywhere to drink one. Pip in Hearthmoor sells more.'}
  ];
  cards.forEach((c,i)=>{
    const on=i===sel,x=12+(on?5:0),y=26+i*46,w=196-(on?5:0);
    cx.fillStyle=on?'#2e2010':'#1e140a';cx.fillRect(x,y,w,42);cx.strokeStyle=on?'#ffd040':'#4a3820';cx.strokeRect(x+.5,y+.5,w-1,41);
    cx.globalAlpha=on?1:.45;cx.fillStyle=c.col;cx.fillRect(x+1,y+4,3,34);cx.globalAlpha=1;
    cell(x+9,y+6,30,c.col,on,true);drawIcon(c.kind,c.col,x+14,y+11+(on?Math.round(Math.sin(time*4)):0),2);
    text(c.lab,x+46,y+6,c.col,7);
    text(c.name,x+46,y+17,on?'#fff':'#a89878',8,'left',true);
    text(c.stat,x+46,y+29,on?'#ffe9a0':'#7a6a58',7);
    reg(12,y,200,42,()=>{ui.gs=i;Snd.menu()});
  });
  // hearts
  const nH=8+(flags.fruits||0);
  text('HEARTS',12,166,'#a89878',7);
  for(let i=0;i<nH;i++)drawHeart(14+(i%18)*10,179+Math.floor(i/18)*10,1,1);
  text(`Quest: ${questNow()}`,12,244,'#a8e0a0',7);
  // detail box of the chosen card
  const c=cards[sel],by=detailBox(214,24,254,212,c.col,c.kind,c.col,true,c.name,c.lab);
  const ls=wrap(c.d,232,7);ls.forEach((l,i)=>text(l,226,by+i*9,'#e8d8b0',7));
  let y=by+ls.length*9+8;
  if(sel<2){
    text(c.stat,226,y,'#ffe9a0',11,'left',true);y+=18;
    text('FORGED GEAR',226,y,'#a89878',7);pips(226,y+11,t+1,GEAR_AT.length,c.col);y+=24;
    const left=next?next-bossesDown():0;
    wrap(next?`The smith reforges your gear after ${left} more guardian${left===1?'':'s'}.`:'Your gear cannot be improved any further.',232,7).forEach((l,i)=>text(l,226,y+i*9,'#8a7a62',7));
  }else{
    text(c.stat,226,y,'#ffe9a0',11,'left',true);y+=18;
    text('Heals about half of your hearts.',226,y,'#a89878',7);
    touchBtn(226,y+14,80,16,'Drink now',usePotion,P.potions>0&&P.hp<P.maxHp?'#ffd040':'#6a5a48');
  }
}

function drawKeysTab(){
  const C=5,CS=34,GP=4,gx=12,gy=36,sel=ui.kt||0;
  text('KEY ITEMS',gx,24,'#a89878',7);
  KEYITEMS.forEach((k,i)=>{
    const x=gx+(i%C)*(CS+GP),y=gy+Math.floor(i/C)*(CS+GP),has=!!flags[k.k],on=i===sel;
    cell(x,y,CS,k.c,on,has);
    if(has)drawIcon(k.icon,k.c,x+(CS-20)/2,y+(CS-20)/2+(on?Math.round(Math.sin(time*4)):0),2);
    if(has&&TOOLS[k.k]){const sl=flags.toolA===k.k?'A':flags.toolB===k.k?'B':'';if(sl)text(sl,x+CS-3,y+CS-10,'#ffe040',7,'right',true)}
    if(on)brackets(x-2,y-2,CS+4,CS+4,'#ffd040',5);
    reg(x,y,CS,CS,()=>{if(ui.kt===i&&has&&TOOLS[k.k])assignTool(k.k,flags.toolA===k.k?1:0);ui.kt=i});
  });
  // the two tool slots, like the A and B buttons
  const sy=156;
  [0,1].forEach(i=>{
    const x=gx+i*98,k=toolIn(i),def=KEYITEMS.find(q=>q.k===k);
    text(i?'B':'A',x,sy,'#ffd040',8,'left',true);if(!touchActive())text(i?'[L]':'[K]',x+11,sy+1,'#8a7a62',7);
    cell(x,sy+12,34,def?def.c:'#5a4220',false,!!def);
    if(def)drawIcon(def.icon,def.c,x+7,sy+19,2);
    wrap(def?def.n:'empty',56,7).slice(0,2).forEach((l,j)=>text(l,x+40,sy+19+j*9,def?'#e8d8b0':'#5a4a38',7));
  });
  // guardians, like the instruments
  const nb=BOSSLIST.filter(([f])=>flags[f]).length;
  text(`GUARDIANS ${nb}/${BOSSLIST.length}`,gx,206,'#a89878',7);
  BOSSLIST.forEach(([f],i)=>{const x=gx+i*11;cx.fillStyle=flags[f]?'#ffd040':'#241810';cx.fillRect(x,218,9,9);cx.strokeStyle=flags[f]?'#fff2a0':'#4a3820';cx.strokeRect(x+.5,218.5,8,8)});
  const wps=Object.keys(flags.wp||{}).filter(k=>flags.wp[k]).length;
  text(`Waypoints attuned: ${wps}`,gx,236,'#8fd0ff',7);
  text(`Forgotten trees ${ftreeCount()}/${Object.keys(FTREE).length}`,gx+120,236,'#a0ff80',7);
  // detail box
  const k=KEYITEMS[sel],has=!!flags[k.k],tl=TOOLS[k.k],slot=flags.toolA===k.k?'A':flags.toolB===k.k?'B':'';
  const by=detailBox(214,24,254,212,k.c,k.icon,k.c,has,k.n,has?(tl?'TOOL'+(slot?'  -  SLOT '+slot:''):'KEY ITEM'):'NOT FOUND YET');
  const ls=wrap(has?k.d:'A guardian holds this item.',232,7);
  ls.forEach((l,i)=>text(l,226,by+i*9,has?'#e8d8b0':'#7a6a58',7));
  if(has&&tl){
    const y=by+ls.length*9+8;
    wrap('Use: '+tl.d,232,7).forEach((l,i)=>text(l,226,y+i*9,'#ffe9a0',7));
    touchBtn(226,24+212-24,76,16,'Put on A',()=>assignTool(k.k,0));touchBtn(308,24+212-24,76,16,'Put on B',()=>assignTool(k.k,1));
  }
}

function drawCodexTab(){
  const found=TOMELIST.filter(t=>flags.lore&&flags.lore[t.id]).length;
  text(`Codex  ${found}/${TOMELIST.length} pages found`,12,25,'#a89878',7);
  const ki=ui.ki||0,VIS=14,off=clamp(ki-6,0,Math.max(0,TOMELIST.length-VIS));
  for(let k=0;k<VIS;k++){
    const i=off+k,t=TOMELIST[i];if(!t)break;
    const has=flags.lore&&flags.lore[t.id],y=34+k*13,sel=i===ki;
    cx.fillStyle=sel?'rgba(255,200,80,.22)':'rgba(255,255,255,.04)';cx.fillRect(10,y-2,190,12);
    text(has?t.title:'???',14,y,has?'#e8d8b0':'#5a4a38',7);
    text(WORLD[t.zone]?WORLD[t.zone].name.split(' ')[0]:'',196,y+1,'#6a5a48',5,'right');
    reg(10,y-2,190,12,()=>{ui.ki=i});
  }
  const t=TOMELIST[ki];
  panel(208,24,W-216,214);
  if(flags.lore&&flags.lore[t.id]){
    text(t.title,216,30,'#ffd040',9,'left',true);
    text(WORLD[t.zone]?WORLD[t.zone].name:'',216,42,'#8a7a62',6);
    wrap(t.text,W-236,7).forEach((l,i)=>text(l,216,56+i*10,'#f0e6d0',7));
  }else{
    text('Undiscovered',216,30,'#6a5a48',9,'left',true);
    wrap('Read the tomes lying in the camps of '+(WORLD[t.zone]?WORLD[t.zone].name:'this region')+' to fill this page.',W-236,7).forEach((l,i)=>text(l,216,46+i*10,'#7a6a58',7));
  }
}

function drawQuestsTab(){
  text('Quests',12,25,'#a89878',7);
  let y=36;
  const rows=[];
  for(const z in QDEFS){const q=QDEFS[z],st=flags.q&&flags.q[q.id];if(st)rows.push({q,st,z})}
  rows.sort((a,b)=>a.st.s-b.st.s);
  rows.slice(0,12).forEach(({q,st,z})=>{
    cx.fillStyle='rgba(255,255,255,.05)';cx.fillRect(10,y-2,300,19);
    text(q.name,14,y,st.s===2?'#6a8a60':'#ffe9a0',7,'left',true);
    text(WORLD[z]?WORLD[z].name:'',306,y+1,'#6a5a48',5,'right');
    text(st.s===2?'Completed':qProgress(q,st),14,y+9,st.s===2?'#5a7a50':qDoneCheck(q,st)?'#a8e0a0':'#a89878',6);
    y+=21;
  });
  if(!rows.length)text('No quests yet. Talk to the wanderers waiting at the waypoints in each region.',12,40,'#7a6a58',7);
  const b=flags.bounty;
  text('Bounty',330,25,'#a89878',7);
  if(b){text(b.name,330,38,'#ffb870',8,'left',true);text(`${Math.min(b.count,b.p)}/${b.count}  -  ${b.gold}g`,330,50,b.done?'#a8e0a0':'#a89878',7);text(b.done?'Claim it at the board in Hearthmoor.':'Hunt them anywhere in the world.',330,62,'#7a6a58',6)}
  else text('No contract. Visit the bounty board in the village plaza.',330,38,'#7a6a58',6);
  if(flags.ngp)text(`New Game+ ${flags.ngp}`,330,90,'#e8a030',8,'left',true);
}
