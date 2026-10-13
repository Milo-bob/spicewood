'use strict';
// ================= Inventory screen: Gear | Items | Materials | Key Items =================
const INVTABS=['Gear','Items','Materials','Key Items','Codex','Quests'];
function openInv(tab){ui={mode:'inv',tab:tab||0,focus:'bag',bi:0,ei:0,ci:0,sellArm:-1,rowOff:0}}

// ---------- pixel icons (10x10, scaled) ----------
const ICONP={
  sword:['........ml','.......mlm','......mlm.','.....mlm..','.g..mlm...','..gmlm....','...gg.....','..b.gg....','.b........','b.........'],
  axe:['...mm.....','..mmlm....','.mmlmmb...','.mmmm.b...','..mm..b...','......b...','.....b....','.....b....','....b.....','....b.....'],
  bow:['...mm.....','..m..w....','.m....w...','.m....w...','m.....w...','m.....w...','.m....w...','.m....w...','..m..w....','...mm.....'],
  staff:['....gg....','...gmmg...','...gmlg...','....gg....','....b.....','....b.....','....b.....','....b.....','....b.....','....b.....'],
  dagger:['.......ml.','......mlm.','.....mlm..','....mlm...','..g.mm....','...gg.....','..bg......','.bb.......','.b........','..........'],
  helm:['...mmmm...','..mllmmm..','.mllmmmmm.','.mlmmmmmm.','.mmmmmmmm.','.mddmmddm.','.mdd..ddm.','.mm....mm.','..........','..........'],
  chest:['.mm....mm.','mmmm..mmmm','mmlmmmmlmm','.mlmmmmlm.','.mmmmmmmm.','.mmdmmdmm.','.mmmmmmmm.','.mmmddmmm.','.mmmmmmmm.','..mmmmmm..'],
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
const itemColor=it=>RARITY[it.r].c;

const GEMSHORT={dmgPct:'Damage',regenPct:'Regen',hpPct:'Health',crit:'Crit',cdr:'Cooldowns',armor:'Armor'};
function gemShort(g){const m=GEMS[g.t].mods[g.tier-1],k=Object.keys(m)[0];return(k==='cdr'?'-':'+')+m[k]+(k==='armor'?'':'%')+' '+GEMSHORT[k]}
// ---------- potion (also used by the Q key) ----------
function usePotion(){
  if(P.potCd>0)return;
  if(P.potions>0&&P.hp<P.maxHp){
    P.potions--;P.potCd=1;
    const h=Math.round((P.maxHp*.45+10)*(1+(P.mods.potPct||0)/100)*(1+.25*(baseLv('alch')-1)));
    P.hp=Math.min(P.maxHp,P.hp+h);floatText(P.x,P.y-14,'+'+h,'#60ff80');puff(P.x,P.y,8,'#60ff80',40);Snd.pickup();
  }else if(P.potions<=0)toast('No potions left (buy more from Pip)','#ff8070');
}

// ---------- comparison ----------
function statSnap(){return{hp:P.maxHp,dmg:Math.round(P.atk),armor:P.armor,crit:P.crit*100,spd:P.spd/70*100,atk:100/P.atkCd,res:P.resMax,mods:Object.assign({},P.mods)}}
function compareItem(it){
  const sl=equipTarget(it),old=P.eq[sl];
  if(old===it)return[];
  const hp0=P.hp,res0=P.res,a=statSnap();
  P.eq[sl]=it;recalc();const b=statSnap();
  if(old)P.eq[sl]=old;else delete P.eq[sl];
  recalc();P.hp=Math.min(hp0,P.maxHp);P.res=Math.min(res0,P.resMax);
  const rows=[],row=(label,d,unit,dec)=>{if(Math.abs(d)<(dec?.05:.5))return;const v=dec?d.toFixed(1):Math.round(d);rows.push({t:`${d>0?'+':''}${v}${unit||''} ${label}`,c:d>0?'#60e060':'#e06060'})};
  row('Damage per hit',b.dmg-a.dmg);row('Health',b.hp-a.hp);row('Armor',b.armor-a.armor);row('Crit chance',b.crit-a.crit,'%',1);
  row('Attack speed',(b.atk/a.atk-1)*100,'%',1);row('Move speed',b.spd-a.spd,'%',1);row(P.hero.res,b.res-a.res);
  const keys=new Set(Object.keys(a.mods).concat(Object.keys(b.mods)));
  for(const k of keys){
    if(['crit','atkSpdPct','spdPct','hpPct','armor'].includes(k))continue;
    const d=(b.mods[k]||0)-(a.mods[k]||0);if(Math.abs(d)<.05||!MODLABEL[k])continue;
    rows.push({t:(d<0?'lose: ':'')+MODLABEL[k](Math.round(Math.abs(d)*10)/10),c:d>0?'#60e060':'#e06060'});
  }
  return rows;
}
function activeBonusLines(){
  const L=[];
  for(const id in P.setCnt||{}){
    const S=SETS[id],n=P.setCnt[id];if(!S||n<2)continue;
    L.push({t:`${S.name} (${n}/4)`,c:'#60e0a0'});
    for(const k of[2,3,4])if(n>=k)L.push({t:'  '+Object.keys(S.bonus[k]).map(m=>MODLABEL[m](S.bonus[k][m])).join(', '),c:'#8ac8a0'});
  }
  const skip=new Set(['crit','hpPct','armor','spdPct','atkSpdPct']);
  for(const k in P.mods){if(skip.has(k)||!MODLABEL[k]||!P.mods[k])continue;L.push({t:MODLABEL[k](Math.round(P.mods[k]*10)/10),c:'#8fd0ff'})}
  return L;
}

// ---------- actions ----------
function sortBag(){
  const so={weapon:0,helm:1,chest:2,gloves:3,boots:4,amulet:5,ring:6};
  P.bag.sort((a,b)=>(b.lock?1:0)-(a.lock?1:0)||b.r-a.r||so[a.slot]-so[b.slot]||b.ilvl-a.ilvl);
  Snd.menu();toast('Bag sorted: locked first, then by rarity','#a89878');
}
function toggleLock(it){if(!it)return;it.lock=!it.lock;Snd.menu();toast(it.lock?'Item locked (safe from selling)':'Item unlocked','#a89878')}
function sellBag(i){
  const it=P.bag[i];if(!it)return;
  if(it.lock){toast('Locked. Unlock it first (F).','#ff8070');return}
  if((it.r>=3||it.gems&&it.gems.some(Boolean))&&ui.sellArm!==i){ui.sellArm=i;toast('Press sell again to confirm','#ffb070');return}
  P.gold+=sellValue(it);P.bag.splice(i,1);ui.sellArm=-1;Snd.coin();
}
function assignQuick(id,slot){
  const j=P.quick.indexOf(id);if(j>=0)P.quick[j]=P.quick[slot];
  P.quick[slot]=id;Snd.menu();
}
const KEYITEMS=[
  {k:'sickle',n:'Thornsickle',c:'#7ad04a',icon:'axe',d:'Cuts thorn vines. Opens the south road of Ember Glade, the Root Cellar and the thorn wall in Amber Hollow.'},
  {k:'boots',n:'Wooden Boots',c:'#b8844a',icon:'boots',d:'Lets you wade through shallow water: fords, the marsh, the grotto pond in Ember Glade.'},
  {k:'hook',n:'Grapple Hook',c:'#9ab0c8',icon:'key',d:'Turns gorges into rope bridges. Opens the road to Rustpeak and the Hookshot Hollow.'},
  {k:'lantern',n:'Miner\'s Lantern',c:'#f0c040',icon:'staff',d:'Lights dark tunnels and widens your sight in dark places. Opens the black tunnel under the gorge north of Ember Glade.'},
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
  const s=ui,COLS=5;
  if(Input.cancel()){ui=null;return}
  if(Input.hit('tabl')){s.tab=(s.tab+INVTABS.length-1)%INVTABS.length;Snd.menu();return}
  if(Input.hit('tabr')){s.tab=(s.tab+1)%INVTABS.length;Snd.menu();return}
  const mv=n=>{Snd.menu();s.sellArm=-1;return n};
  if(s.tab===0){
    const bi=s.bi;
    if(s.focus==='bag'){
      if(Input.hit('left')){if(bi%COLS===0)s.focus='eq';else s.bi=mv(bi-1)}
      else if(Input.hit('right'))s.bi=Math.min(bagCap()-1,mv(bi+1));
      else if(Input.hit('up'))s.bi=Math.max(0,mv(bi-COLS));
      else if(Input.hit('down'))s.bi=Math.min(bagCap()-1,mv(bi+COLS));
      if(Input.confirm()&&P.bag[s.bi]){equipFromBag(s.bi);s.sellArm=-1}
      if(Input.hit('sell')&&P.bag[s.bi])sellBag(s.bi);
      if(Input.hit('fav'))toggleLock(P.bag[s.bi]);
    }else{
      if(Input.hit('right'))s.focus='bag';
      else if(Input.hit('up'))s.ei=Math.max(0,mv(s.ei-1));
      else if(Input.hit('down'))s.ei=Math.min(SLOTS.length-1,mv(s.ei+1));
      if(Input.confirm())unequip(SLOTS[s.ei]);
      if(Input.hit('fav'))toggleLock(P.eq[SLOTS[s.ei]]);
    }
    if(Input.hit('sort'))sortBag();
    for(let k=1;k<=4;k++)if(Input.hit('n'+k))spend(['str','dex','int','vit'][k-1]);
  }else if(s.tab===4){
    if(Input.hit('up'))s.ki=Math.max(0,(s.ki||0)-1);
    if(Input.hit('down'))s.ki=Math.min(TOMELIST.length-1,(s.ki||0)+1);
  }else if(s.tab===1){
    const ids=['hp'].concat(CONSORDER);
    if(Input.hit('up'))s.ci=Math.max(0,mv(s.ci-1));
    if(Input.hit('down'))s.ci=Math.min(ids.length-1,mv(s.ci+1));
    const id=ids[s.ci];
    if(Input.confirm()){if(id==='hp')usePotion();else useCons(id)}
    if(id!=='hp')for(let k=1;k<=3;k++)if(Input.hit('n'+k))assignQuick(id,k-1);
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
    text(n,x+25.5,11,on?'#ffe9a0':'#a89878',7,'center',on);reg(x,8,51,12,()=>{ui.tab=i;Snd.menu()});
  });
  text(`Gold ${P.gold}`,W-14,10,'#ffd040',8,'right',true);
  text('Z / C: switch tab',W-90,10,'#6a5a48',6,'right');
  if(ui.tab===0)drawGearTab();
  else if(ui.tab===1)drawItemsTab();
  else if(ui.tab===2)drawMatsTab();
  else if(ui.tab===3)drawKeysTab();
  else if(ui.tab===4)drawCodexTab();
  else drawQuestsTab();
  text(ui.tab===0?'Arrows move  Enter equip  X sell  F lock  O sort  1-4 spend points  I/Backspace close':ui.tab===1?'Up/Down choose  Enter use now  1 2 3 assign to quick slot  I/Backspace close':'I/Backspace close   Z / C switch tab',W/2,H-12,'#7a6a58',6,'center');
}
function drawGearTab(){
  // equipment
  text('Equipment',12,25,'#a89878',7);
  SLOTS.forEach((sl,i)=>{
    const y=35+i*15,it=P.eq[sl],sel=ui.focus==='eq'&&ui.ei===i;
    cx.fillStyle=sel?'rgba(255,200,80,.25)':'rgba(255,255,255,.05)';cx.fillRect(10,y-2,126,14);
    if(it)drawIcon(itemIcon(it),itemColor(it),12,y-2,1);else{cx.fillStyle='#3a2c1c';cx.fillRect(14,y+1,6,6)}
    text(it?it.name.slice(0,26):SLOT_LABEL[sl],26,y+1,it?itemColor(it):'#5a4a38',6);
    if(it&&it.lock)text('L',132,y,'#ffd040',6,'right');
    reg(10,y-2,126,14,()=>{ui.focus='eq';ui.ei=i;if(P.eq[sl])unequip(sl)});
  });
  // bag
  text(`Bag ${P.bag.length}/${bagCap()}`,142,25,'#a89878',7);
  const cap=bagCap(),brows=Math.ceil(cap/5),row=Math.floor(ui.bi/5);
  if(row<ui.rowOff)ui.rowOff=row;if(row>ui.rowOff+3)ui.rowOff=row-3;
  for(let i=ui.rowOff*5;i<Math.min(cap,(ui.rowOff+4)*5);i++){
    const cxn=i%5,cyn=Math.floor(i/5)-ui.rowOff,x=142+cxn*29,y=35+cyn*29,it=P.bag[i],sel=ui.focus==='bag'&&ui.bi===i;
    cx.fillStyle=sel?'#4a3418':'#241810';cx.fillRect(x,y,26,26);
    cx.strokeStyle=it?itemColor(it):'#3a2c1c';cx.strokeRect(x+.5,y+.5,25,25);
    if(sel){cx.strokeStyle='#fff';cx.strokeRect(x-.5,y-.5,27,27)}
    if(it){
      cx.fillStyle=itemColor(it);cx.globalAlpha=.18;cx.fillRect(x+1,y+1,24,24);cx.globalAlpha=1;
      drawIcon(itemIcon(it),itemColor(it),x+3,y+3,2);
      if(it.up)text('+'+it.up,x+24,y+16,'#ffe040',6,'right');
      if(it.lock)text('L',x+3,y+1,'#ffd040',6);
      if(it.set){cx.fillStyle='#60e0a0';cx.fillRect(x+21,y+2,3,3)}
      if(it.gems)for(let g=0;g<it.gems.length;g++){cx.fillStyle=it.gems[g]?GEMS[it.gems[g].t].c:'#4a4a5a';cx.fillRect(x+3+g*4,y+22,3,3)}
    }
    reg(x,y,26,26,()=>{if(ui.focus==='bag'&&ui.bi===i&&P.bag[i])equipFromBag(i);ui.focus='bag';ui.bi=i;ui.sellArm=-1});
  }
  if(brows>4){text(ui.rowOff>0?'^':'',290,25,'#ffd040',8,'center');text(ui.rowOff+4<brows?'v':'',290,152,'#ffd040',8,'center')}
  // action buttons under the grid
  const inBag=ui.focus==='bag',sel=inBag?P.bag[ui.bi]:P.eq[SLOTS[ui.ei]];
  smallBtn(142,153,34,inBag?'Equip':'Unequip',()=>{if(inBag)equipFromBag(ui.bi);else unequip(SLOTS[ui.ei])});
  smallBtn(178,153,34,sel&&inBag?`Sell ${sellValue(sel)}g`:'Sell',()=>{if(inBag)sellBag(ui.bi)});
  smallBtn(214,153,28,sel&&sel.lock?'Unlock':'Lock',()=>toggleLock(sel),sel&&sel.lock);
  smallBtn(244,153,28,'Sort',sortBag);
  smallBtn(274,153,28,'Close',()=>{ui=null});
  // stats
  const sx=312;
  text(`${P.hero.name} the ${P.hero.cls}  Lv ${P.lvl}`,sx,25,P.hero.light,8,'left',true);
  bar(sx,36,158,4,P.lvl>=MAXLVL?1:P.xp/xpNeed(P.lvl),'#c8a0f0');
  text(P.lvl>=MAXLVL?'MAX':`XP ${P.xp}/${xpNeed(P.lvl)}`,sx,42,'#a89878',6);
  const attrs=[['str','Strength'],['dex','Dexterity'],['int','Intellect'],['vit','Vitality']];
  attrs.forEach(([k,n],i)=>{
    const y=51+i*11;
    text(n,sx,y,k===P.hero.primary?'#ffe9a0':'#e8d8b0',7);text(String(P.st[k]),sx+84,y,'#fff',7,'right');
    if(P.pts>0){cx.fillStyle='#2a6a2a';cx.fillRect(sx+90,y-1,11,9);text('+',sx+95,y,'#fff',8,'center',true);reg(sx+88,y-2,15,11,()=>spend(k));text(`[${i+1}]`,sx+106,y,'#8a8',6)}
  });
  text(P.pts>0?`Points to spend: ${P.pts}`:'No unspent points',sx,96,P.pts>0?'#ffe040':'#7a6a58',7);
  const rows=[['Health',P.maxHp],['Damage / hit',Math.round(P.atk)],['Armor',P.armor],['Crit',Math.round(P.crit*100)+'%  x'+P.critMult.toFixed(1)],['Attack speed',(1/P.atkCd).toFixed(2)+'/s'],['Move speed',Math.round(P.spd/70*100)+'%'],[P.hero.res,Math.round(P.resMax)]];
  rows.forEach(([n,v],i)=>{const y=106+i*8.5;text(n,sx,y,'#a89878',6);text(String(v),sx+100,y,'#fff',6,'right')});
  // tooltip panel
  panel(8,168,W-16,84);
  if(sel){
    const L=itemLines(sel);L.pop();
    L.forEach((l,i)=>text(l.t.slice(0,34),16,174+i*7,l.c,i?6:7,'left',i===0));
    const sets=setLines(sel);
    let cmp=[];
    if(inBag){
      if(ui.cmpFor!==sel||ui.cmpSlot!==equipTarget(sel)){ui.cmpFor=sel;ui.cmpSlot=equipTarget(sel);ui.cmp=compareItem(sel)}
      cmp=ui.cmp;
    }
    text(inBag?(P.eq[equipTarget(sel)]?'If you equip it:':'If you equip it (slot empty):'):'Equipped',180,174,'#a89878',6);
    cmp.slice(0,11).forEach((l,i)=>text(l.t,180,182+i*7,l.c,6));
    if(!inBag)text('Enter: take off',180,182,'#7a6a58',6);
    if(sets.length)sets.forEach((l,i)=>text(l.t.slice(0,42),310,174+i*7,l.c,6));
  }else text('(empty)',16,176,'#6a5a48',8);
  const ab=activeBonusLines();
  const by=sel&&setLines(sel).length?174+setLines(sel).length*7+4:174;
  if(by<240){text('Active bonuses',310,by,'#a89878',6);ab.slice(0,Math.floor((248-by-8)/7)).forEach((l,i)=>text(l.t.slice(0,42),310,by+8+i*7,l.c,6))}
  if(!ab.length&&by<240)text('none yet',310,by+8,'#5a4a38',6);
}
function drawItemsTab(){
  const ids=['hp'].concat(CONSORDER);
  text('Consumables',12,25,'#a89878',7);
  ids.forEach((id,i)=>{
    const y=36+i*26,sel=ui.ci===i,hp=id==='hp';
    const d=hp?{n:'Healing Potion',c:'#e04a4a',icon:'potion',desc:'Restores 45% of your health. Press Q.'}:CONS[id];
    const n=hp?P.potions:(P.cons[id]||0);
    cx.fillStyle=sel?'rgba(255,200,80,.22)':'rgba(255,255,255,.05)';cx.fillRect(10,y-2,300,24);
    cx.fillStyle='#241810';cx.fillRect(13,y,20,20);cx.strokeStyle=d.c;cx.strokeRect(13.5,y+.5,19,19);
    drawIcon(d.icon,d.c,13,y,2);
    text(d.n,40,y+1,n?'#fff':'#6a5a48',8,'left',true);
    text(d.desc||CONS[id].desc,40,y+11,'#a89878',6);
    text('x'+n,300,y+4,n?'#ffe9a0':'#5a4a38',9,'right',true);
    const qi=hp?-1:P.quick.indexOf(id);if(qi>=0)text('['+(qi+1)+']',270,y+5,'#8fd0ff',7,'right');
    reg(10,y-2,300,24,()=>{ui.ci=i;if(hp)usePotion();else useCons(id)});
  });
  // quick slots
  text('Quick slots',330,25,'#a89878',7);
  for(let k=0;k<3;k++){
    const x=330,y=36+k*30,id=P.quick[k];
    cx.fillStyle='#241810';cx.fillRect(x,y,26,26);cx.strokeStyle=id?CONS[id].c:'#3a2c1c';cx.strokeRect(x+.5,y+.5,25,25);
    if(id)drawIcon(CONS[id].icon,CONS[id].c,x+3,y+3,2);
    text(String(k+1),x+3,y+1,'#fff',6);
    text(id?`${CONS[id].n}  x${P.cons[id]||0}`:'(empty)',x+32,y+8,id?'#e8d8b0':'#5a4a38',7);
  }
  const id=ids[ui.ci];
  text(id==='hp'?'Enter: drink a potion':'Enter: use now',330,130,'#ffe9a0',7);
  if(id!=='hp')text('Press 1, 2 or 3 to put it on a quick slot.',330,142,'#a89878',6);
  text('In the field the quick slots use keys 1, 2, 3.',330,154,'#7a6a58',6);
  text('Buy and brew items at Pip the Alchemist.',330,164,'#7a6a58',6);
}
function drawMatsTab(){
  text('Materials',12,25,'#a89878',7);
  const use={wood:'Smithy and building upgrades',ore:'Forging, upgrades, sockets',herb:'Potions, elixirs, meals, reforging',leather:'Forging armor, meals',shell:'Jewelry, sockets, reforging'};
  Object.keys(MATS).forEach((k,i)=>{
    const y=36+i*24;
    cx.fillStyle='rgba(255,255,255,.05)';cx.fillRect(10,y-2,200,22);
    cx.fillStyle=MATS[k].c;cx.fillRect(14,y+2,12,12);cx.fillStyle='rgba(255,255,255,.35)';cx.fillRect(14,y+2,12,3);
    text(MATS[k].n,32,y,'#fff',8,'left',true);text(use[k],32,y+10,'#a89878',6);
    text(String(P.mats[k]||0),204,y+3,'#ffe9a0',9,'right',true);
  });
  text('Gems',230,25,'#a89878',7);
  Object.keys(GEMS).forEach((gk,i)=>{
    const y=36+i*21,G=GEMS[gk];
    cx.fillStyle='rgba(255,255,255,.05)';cx.fillRect(228,y-2,242,19);
    drawIcon('gem',G.c,230,y-1,1);
    text(G.n,244,y,'#fff',7,'left',true);
    for(let t=1;t<=3;t++){
      const n=P.gems[gk+t]||0,x=292+(t-1)*58;
      text(`${GEMTIER[t-1]}`,x,y-1,n?G.c:'#4a3a2a',6);text('x'+n,x+44,y-1,n?'#ffe9a0':'#4a3a2a',6,'right');
      text(gemShort({t:gk,tier:t}),x,y+7,'#6a7a88',5);
    }
  });
  text('Socket gems into gear at Torvald the Smith. Three equal gems combine into the next tier.',12,170,'#a89878',6);
  text('Dropped by elites, mini bosses, chests and bosses.',12,180,'#7a6a58',6);
}
function drawKeysTab(){
  text('Key items',12,25,'#a89878',7);
  KEYITEMS.forEach((k,i)=>{
    const y=33+i*19,has=!!flags[k.k];
    cx.fillStyle='rgba(255,255,255,.05)';cx.fillRect(10,y-2,300,18);
    cx.fillStyle='#241810';cx.fillRect(13,y,14,14);cx.strokeStyle=has?k.c:'#3a2c1c';cx.strokeRect(13.5,y+.5,13,13);
    if(has)drawIcon(k.icon,k.c,14.5,y+1.5,1.1);
    text(has?k.n:'???',32,y,has?'#fff':'#5a4a38',7,'left',true);
    wrap(has?k.d:'Not found yet. A boss guards it.',270,5).slice(0,2).forEach((l,j)=>text(l,32,y+7+j*6,has?'#a89878':'#5a4a38',5));
  });
  text('Hearts',330,25,'#a89878',7);
  drawIcon('fruit','#d03a3a',330,34,2);
  text(`Heart Fruits: ${flags.fruits||0}`,356,39,'#fff',8);
  text('Each one adds a heart.',356,50,'#a89878',6);
  text('Bosses',322,66,'#a89878',7);
  BOSSLIST.forEach(([f,n],i)=>text((flags[f]?'[x] ':'[ ] ')+n,i<8?322:398,76+(i%8)*9,flags[f]?'#a8e0a0':'#6a5a48',6));
  const wps=Object.keys(flags.wp||{}).filter(k=>flags.wp[k]).length;
  text(`Waypoints attuned: ${wps}`,322,160,'#8fd0ff',7);
  text(`Quest: ${QUEST[flags.stage]}`,12,176,'#a8e0a0',6);
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
