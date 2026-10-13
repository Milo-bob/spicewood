'use strict';
// ================= Items: gear with bases, affixes, sockets, uniques and sets; gems; consumables =================
const SLOTS=['weapon','helm','chest','gloves','boots','amulet','ring1','ring2'];
const SLOT_LABEL={weapon:'Weapon',helm:'Helm',chest:'Chest',gloves:'Gloves',boots:'Boots',amulet:'Amulet',ring1:'Ring',ring2:'Ring'};
const RARITY=[
  {n:'Common',c:'#d8d8d8',m:1,aff:0},
  {n:'Fine',c:'#5ad05a',m:1.12,aff:1},
  {n:'Rare',c:'#4a9cf0',m:1.25,aff:2},
  {n:'Epic',c:'#b25cf0',m:1.45,aff:3},
  {n:'Legendary',c:'#ff9a2a',m:1.75,aff:4}
];
const PREFIX=['Cinnamon','Clove','Amber','Ember','Thorn','Saffron','Pepper','Anise','Nutmeg','Ginger','Cardamom'];
const STATK=['str','dex','int','vit'];

// ---------- bases ----------
// weapon bases per hero: [name, damage multiplier, attack speed %, icon]
const WBASE={
  warrior:[['Sword',1,0,'sword'],['Axe',1.22,-12,'axe'],['Cleaver',1.4,-22,'axe'],['Blade',.88,10,'sword']],
  ranger:[['Bow',1,0,'bow'],['Longbow',1.25,-14,'bow'],['Shortbow',.85,12,'bow']],
  mage:[['Staff',1,0,'staff'],['Wand',.82,12,'staff'],['Scepter',1.2,-10,'staff']],
  rogue:[['Dagger',1,0,'dagger'],['Dirk',.9,10,'dagger'],['Kris',1.12,-6,'dagger']]
};
// armor and jewelry bases: [name, armor multiplier, implicit stat or null]
const ABASE={
  helm:[['Cap',.8,'dex'],['Hood',.7,'int'],['Helm',1.1,'vit'],['Crown',.9,'hp']],
  chest:[['Jerkin',.9,'dex'],['Tunic',.8,'str'],['Vest',.85,'hp'],['Mail',1.25,'vit'],['Robe',.65,'int']],
  gloves:[['Gloves',.9,'dex'],['Mitts',.7,'int'],['Gauntlets',1.2,'str']],
  boots:[['Boots',.9,'vit'],['Sandals',.65,'speed'],['Greaves',1.2,'armor']],
  amulet:[['Amulet',0,null],['Charm',0,null],['Pendant',0,null]],
  ring:[['Ring',0,null],['Band',0,null],['Signet',0,null]]
};

// ---------- affixes ----------
const rr=(a,b)=>a+Math.random()*(b-a);
const MODKEYS=new Set(['dmgPct','critDmg','lifesteal','cdr','atkSpdPct','regenHp','regenPct','reducePct','thorns','dodge','xpPct','goldPct','mf']);
const AFFDEF={
  str:{fmt:v=>`+${v} Strength`,roll:i=>Math.max(1,Math.round(i*.55*rr(.7,1.2)+1))},
  dex:{fmt:v=>`+${v} Dexterity`,roll:i=>Math.max(1,Math.round(i*.55*rr(.7,1.2)+1))},
  int:{fmt:v=>`+${v} Intellect`,roll:i=>Math.max(1,Math.round(i*.55*rr(.7,1.2)+1))},
  vit:{fmt:v=>`+${v} Vitality`,roll:i=>Math.max(1,Math.round(i*.55*rr(.7,1.2)+1))},
  hp:{fmt:v=>`+${v} Health`,roll:i=>Math.round(i*3.5*rr(.8,1.3)+4)},
  armor:{fmt:v=>`+${v} Armor`,roll:i=>Math.round(i*.7*rr(.8,1.2)+1)},
  crit:{fmt:v=>`+${v}% Crit`,roll:i=>Math.round(rr(1,2)+i*.15)},
  speed:{fmt:v=>`+${v}% Move Speed`,roll:i=>Math.round(rr(2,4)+i*.15)},
  dmgPct:{fmt:v=>`+${v}% Damage`,roll:i=>Math.max(2,Math.round(2+i*.55*rr(.7,1.2)))},
  critDmg:{fmt:v=>`+${v}% Crit Damage`,roll:i=>Math.round(6+i*1.4*rr(.7,1.2))},
  lifesteal:{fmt:v=>`${v}% Lifesteal`,roll:i=>Math.max(1,Math.round(1+i*.1*rr(.7,1.2)))},
  cdr:{fmt:v=>`-${v}% Skill Cooldowns`,roll:i=>Math.max(2,Math.round(2+i*.35*rr(.7,1.2)))},
  atkSpdPct:{fmt:v=>`+${v}% Attack Speed`,roll:i=>Math.max(2,Math.round(2+i*.4*rr(.7,1.2)))},
  regenHp:{fmt:v=>`Regenerate ${v} HP/s`,roll:i=>Math.round((.5+i*.07*rr(.8,1.2))*10)/10},
  regenPct:{fmt:v=>`+${v}% Resource Regen`,roll:i=>Math.round(6+i*1.1*rr(.7,1.2))},
  reducePct:{fmt:v=>`-${v}% Damage Taken`,roll:i=>Math.max(1,Math.round(1+i*.18*rr(.7,1.2)))},
  thorns:{fmt:v=>`Reflect ${v}% of damage taken`,roll:i=>Math.round(4+i*.7*rr(.7,1.2))},
  dodge:{fmt:v=>`${v}% chance to dodge`,roll:i=>Math.max(1,Math.round(1+i*.12*rr(.7,1.2)))},
  xpPct:{fmt:v=>`+${v}% Experience`,roll:i=>Math.round(3+i*.3*rr(.7,1.2))},
  goldPct:{fmt:v=>`+${v}% Gold Found`,roll:i=>Math.round(6+i*1.2*rr(.7,1.2))},
  mf:{fmt:v=>`+${v}% Magic Find`,roll:i=>Math.round(4+i*.9*rr(.7,1.2))}
};
MODLABEL.goldPct=v=>`+${v}% Gold Found`;MODLABEL.mf=v=>`+${v}% Magic Find`;
// '$p' = the hero's primary stat, '$o' = any basic stat
const AFFPOOL={
  weapon:[['dmgPct',4],['critDmg',3],['crit',3],['lifesteal',2],['atkSpdPct',3],['$p',4],['$o',1],['mf',1]],
  helm:[['hp',3],['armor',2],['cdr',3],['regenPct',2],['xpPct',2],['$o',2],['$p',2],['reducePct',1],['mf',1]],
  chest:[['hp',4],['armor',3],['vit',3],['reducePct',3],['thorns',2],['regenHp',2],['$p',2]],
  gloves:[['atkSpdPct',3],['crit',3],['dmgPct',3],['lifesteal',2],['$o',2],['armor',1],['critDmg',2]],
  boots:[['speed',4],['dodge',3],['regenHp',2],['hp',2],['armor',2],['vit',1],['cdr',1]],
  amulet:[['cdr',3],['xpPct',3],['goldPct',2],['mf',3],['crit',2],['critDmg',2],['dmgPct',2],['regenPct',2],['hp',2],['$p',2]],
  ring:[['dmgPct',2],['crit',3],['lifesteal',2],['atkSpdPct',2],['goldPct',2],['mf',2],['regenHp',1],['cdr',2],['hp',2],['$p',3],['thorns',1]]
};
const SUFFIX={dmgPct:'of Might',critDmg:'of Ruin',lifesteal:'of the Leech',cdr:'of Haste',atkSpdPct:'of Swiftness',regenHp:'of Mending',regenPct:'of the Well',reducePct:'of the Bulwark',
  thorns:'of Thorns',dodge:'of Evasion',xpPct:'of Wisdom',goldPct:'of Plenty',mf:'of Fortune',hp:'of Vigor',armor:'of Warding',crit:'of Precision',speed:'of the Wind',
  str:'of the Bear',dex:'of the Fox',int:'of the Owl',vit:'of the Oak'};
function pickW(list){let t=0;for(const[,w]of list)t+=w;let x=Math.random()*t;for(const[k,w]of list){x-=w;if(x<=0)return k}return list[0][0]}
function rollAffixKey(slot,hero,used){
  const pool=AFFPOOL[slot==='ring1'||slot==='ring2'?'ring':slot];
  for(let g=0;g<40;g++){
    let k=pickW(pool);
    if(k==='$p')k=hero.primary;else if(k==='$o')k=STATK[Math.floor(Math.random()*4)];
    if(!used.has(k)){used.add(k);return k}
  }
  return null;
}
const allAff=it=>it.imp?[it.imp].concat(it.aff):it.aff;

// ---------- gems ----------
const GEMS={
  ruby:{n:'Ruby',c:'#e04050',mods:[{dmgPct:3},{dmgPct:6},{dmgPct:10}]},
  sapphire:{n:'Sapphire',c:'#4a90f0',mods:[{regenPct:12},{regenPct:24},{regenPct:40}]},
  emerald:{n:'Emerald',c:'#40c860',mods:[{hpPct:3},{hpPct:6},{hpPct:10}]},
  topaz:{n:'Topaz',c:'#f0c030',mods:[{crit:2},{crit:4},{crit:7}]},
  amethyst:{n:'Amethyst',c:'#b070f0',mods:[{cdr:3},{cdr:6},{cdr:10}]},
  onyx:{n:'Onyx',c:'#9a98a8',mods:[{armor:4},{armor:9},{armor:15}]}
};
const GEMTIER=['Chipped','Flawed','Perfect'];
const gemName=g=>`${GEMTIER[g.tier-1]} ${GEMS[g.t].n}`;
const gemKey=g=>g.t+g.tier;
function gemLabel(g){const m=GEMS[g.t].mods[g.tier-1];return Object.keys(m).map(k=>MODLABEL[k](m[k])).join(', ')}
function rollGem(ilvl){
  const tw=ilvl<8?[[1,10]]:ilvl<14?[[1,6],[2,4]]:ilvl<20?[[1,2],[2,6],[3,2]]:[[2,5],[3,5]];
  return{t:Object.keys(GEMS)[Math.floor(Math.random()*6)],tier:pickW(tw)};
}

// ---------- uniques and sets ----------
const UNIQ=[
  {id:'u_branch',name:'Barkfather\'s Branch',slot:'weapon',il:3,mods:{lifesteal:6,dmgPct:12},desc:'The sap of the Hollow Oak mends the wielder.'},
  {id:'u_fang',name:'Sporefang',slot:'weapon',il:8,mods:{critDmg:50,crit:8},desc:'Its edge itches with spores.'},
  {id:'u_tide',name:'Tidebreaker',slot:'weapon',il:11,mods:{atkSpdPct:18,cdr:10},desc:'Strikes in rhythm with the tide.'},
  {id:'u_rivet',name:'Warden\'s Rivet',slot:'weapon',il:14,mods:{dmgPct:25,thorns:15},desc:'One of the rivets that held the mine together.'},
  {id:'u_thorns',name:'Crown of Thorns',slot:'helm',il:5,mods:{thorns:30,reducePct:6},desc:'Whoever strikes you bleeds.'},
  {id:'u_hood',name:'Lantern Hood',slot:'helm',il:12,mods:{xpPct:15,mf:15},desc:'A miner\'s hood with a lamp still burning.'},
  {id:'u_plate',name:'Heartwood Plate',slot:'chest',il:10,mods:{hpPct:15,regenHp:3},desc:'Bark that heals what it protects.'},
  {id:'u_cloak',name:'Cloak of Embers',slot:'chest',il:16,mods:{dmgPct:10,thorns:20},desc:'Still warm from the forge.'},
  {id:'u_harvest',name:'Gauntlets of the Harvest',slot:'gloves',il:12,mods:{goldPct:40,mf:20},desc:'Everything these hands touch turns to gold.'},
  {id:'u_grip',name:'Swiftgrip',slot:'gloves',il:7,mods:{atkSpdPct:20,crit:5},desc:'Quick as a fox.'},
  {id:'u_winds',name:'Wind-Walkers',slot:'boots',il:6,mods:{spdPct:15,dodge:8},desc:'Light as autumn leaves.'},
  {id:'u_strider',name:'Tidestriders',slot:'boots',il:11,mods:{regenHp:2.5,dodge:6},desc:'You never sink in them.'},
  {id:'u_heart',name:'Spicewood Heart',slot:'amulet',il:14,mods:{skillDmg:25,cdr:8},desc:'It beats in time with the forest.'},
  {id:'u_locket',name:'Hollow Locket',slot:'amulet',il:9,mods:{killHeal:6,lifesteal:5},desc:'The hollow king\'s keepsake.'},
  {id:'u_ember',name:'Ring of the Last Ember',slot:'ring',il:10,mods:{dmgPct:15,critDmg:35},desc:'The last warm thing in the forge.'},
  {id:'u_plenty',name:'Band of Plenty',slot:'ring',il:6,mods:{xpPct:12,goldPct:30,mf:12},desc:'A farmer\'s wedding band.'}
];
const SETS={
  barkhide:{name:'Barkhide',il:[1,10],pieces:{helm:'Cap',chest:'Jerkin',gloves:'Mitts',boots:'Boots'},bonus:{2:{hpPct:8,armor:6},3:{thorns:15,regenHp:1},4:{reducePct:12,dmgPct:10}}},
  sporeweave:{name:'Sporeweave',il:[6,14],pieces:{helm:'Hood',chest:'Robe',gloves:'Gloves',boots:'Sandals'},bonus:{2:{regenPct:20,cdr:5},3:{skillDmg:15},4:{cdr:10,skillDmg:20}}},
  tidecaller:{name:'Tidecaller',il:[10,17],pieces:{helm:'Cowl',chest:'Vest',gloves:'Wraps',boots:'Treads'},bonus:{2:{dodge:5,spdPct:6},3:{regenHp:1.5,reducePct:6},4:{dodge:8,atkSpdPct:15}}},
  ironwarden:{name:'Ironwarden',il:[13,20],pieces:{helm:'Helm',chest:'Mail',gloves:'Gauntlets',boots:'Greaves'},bonus:{2:{armor:12,reducePct:5},3:{hpPct:10},4:{reducePct:12,thorns:25}}},
  goldenhusk:{name:'Goldenhusk',il:[11,19],pieces:{helm:'Straw Hat',chest:'Tunic',gloves:'Gloves',boots:'Boots'},bonus:{2:{goldPct:25,mf:12},3:{xpPct:10},4:{xpPct:15,mf:20,dmgPct:8}}},
  hollowregalia:{name:'Hollow Regalia',il:[16,23],pieces:{helm:'Crown',chest:'Robe',gloves:'Gloves',boots:'Boots'},bonus:{2:{lifesteal:3,critDmg:20},3:{crit:6},4:{lifesteal:5,critDmg:40,killHeal:4}}},
  emberforged:{name:'Emberforged',il:[19,27],pieces:{helm:'Visor',chest:'Plate',gloves:'Gauntlets',boots:'Sabatons'},bonus:{2:{dmgPct:10},3:{crit:8,critDmg:25},4:{dmgPct:18,atkSpdPct:12,burn:1}}},
  heartwood:{name:'Heartwood',il:[22,40],pieces:{helm:'Crown',chest:'Bark Mail',gloves:'Roots',boots:'Boots'},bonus:{2:{hpPct:10,regenHp:2},3:{cdr:8,regenPct:25},4:{hpPct:15,dmgPct:15,xpPct:10}}}
};
const BOSSSET={boss:'barkhide',boss2:'sporeweave',boss3:'tidecaller',boss4:'ironwarden',boss5:'hollowregalia',boss7:'goldenhusk',boss8:'emberforged',boss16:'heartwood'};
function setForIlvl(il){
  const ok=Object.keys(SETS).filter(k=>il>=SETS[k].il[0]-2&&il<=SETS[k].il[1]+3);
  const list=ok.length?ok:Object.keys(SETS);
  return list[Math.floor(Math.random()*list.length)];
}

// ---------- item generation ----------
function rollRarity(minR,mf){
  let x=Math.random();
  if(mf)x=1-(1-x)/(1+mf/100);
  const r=x<.60?0:x<.85?1:x<.95?2:x<.99?3:4;
  return Math.max(r,minR||0);
}
function genItem(ilvl,o){
  o=o||{};
  const hero=o.hero||(typeof P!=='undefined'&&P?P.hero:HEROES[0]);
  const mf=o.mf!==undefined?o.mf:(typeof P!=='undefined'&&P&&P.mods?P.mods.mf||0:0);
  let slot=o.slot,setId=o.set,setPiece=null;
  if(setId){
    const S=SETS[setId],free=Object.keys(S.pieces).filter(sl=>!o.have||!o.have.has(setId+sl));
    slot=o.slot&&S.pieces[o.slot]?o.slot:(free.length?free:Object.keys(S.pieces))[Math.floor(Math.random()*(free.length||4))];
    setPiece=S.pieces[slot];
  }
  if(!slot){
    const x=Math.random();
    slot=x<.22?'weapon':x<.34?'helm':x<.48?'chest':x<.60?'gloves':x<.72?'boots':x<.86?'amulet':'ring';
  }
  const baseSlot=slot==='ring1'||slot==='ring2'?'ring':slot;
  let r=setId?Math.max(3,o.minR||0):rollRarity(o.minR,mf);
  // epic drops sometimes turn out to be set pieces
  if(!setId&&r===3&&['helm','chest','gloves','boots'].includes(baseSlot)&&Math.random()<.08){setId=setForIlvl(ilvl);setPiece=SETS[setId].pieces[baseSlot]}
  const R=RARITY[r];
  const it={cat:'gear',slot:baseSlot,r,ilvl,aff:[],name:''};
  let aspd=0;
  if(baseSlot==='weapon'){
    const wb=WBASE[hero.id]||WBASE.warrior,b=wb[Math.floor(Math.random()*wb.length)];
    it.base=b[0];it.icon=b[3];aspd=b[2];
    it.dmg=Math.max(1,Math.round((3+ilvl*1.7)*R.m*rr(.9,1.1)*b[1]));
    if(aspd)it.aspd=aspd;
  }else{
    const ab=ABASE[baseSlot],b=ab[Math.floor(Math.random()*ab.length)];
    it.base=b[0];it.icon=baseSlot;
    const sm={chest:1.4,helm:1,gloves:.7,boots:.7,amulet:0,ring:0}[baseSlot];
    if(sm)it.armor=Math.max(1,Math.round((1+ilvl*.9)*R.m*sm*b[1]));
    if(b[2])it.imp={k:b[2],v:Math.max(1,Math.round(AFFDEF[b[2]].roll(ilvl)*.6))};
  }
  let n=R.aff;if((baseSlot==='amulet'||baseSlot==='ring')&&n<1)n=1;
  const used=new Set();if(it.imp)used.add(it.imp.k);
  for(let g=0;it.aff.length<n&&g<30;g++){
    const k=rollAffixKey(baseSlot,hero,used);if(!k)break;
    it.aff.push({k,v:AFFDEF[k].roll(ilvl)});
  }
  // sockets
  const sk=r===0?0:r===1?(Math.random()<.35?1:0):r===2?Math.floor(Math.random()*3):r===3?1+Math.floor(Math.random()*3):2+Math.floor(Math.random()*2);
  if(sk)it.gems=new Array(sk).fill(null);
  // naming
  const prefix=PREFIX[Math.floor(Math.random()*PREFIX.length)];
  const main=it.aff.length?it.aff.slice().sort((a,b)=>b.v-a.v)[0].k:null;
  it.name=prefix+' '+it.base+(r>=2&&main&&SUFFIX[main]?' '+SUFFIX[main]:'');
  if(setId){it.set=setId;it.name=SETS[setId].name+' '+setPiece}
  else if(r===4&&!o.noUniq&&Math.random()<.75){
    const pool=UNIQ.filter(u=>u.slot===baseSlot&&ilvl>=u.il-3);
    if(pool.length){const u=pool[Math.floor(Math.random()*pool.length)];it.uniq=u.id;it.mods=Object.assign({},u.mods);it.name=u.name;if(it.aff.length>2)it.aff.length=2}
  }
  if(r===4&&!it.uniq&&!it.set)it.name='Ancient '+it.name.slice(it.name.indexOf(' ')+1);
  return it;
}
const upMul=it=>1+.12*(it.up||0);
const itemDmg=it=>it.dmg?Math.round(it.dmg*upMul(it)):0;
const itemArmor=it=>it.armor?Math.round(it.armor*upMul(it)):0;
// every flat bonus an item gives: affixes + implicit + fixed mods + gems + weapon speed (used by recalc and the comparison)
function itemModList(it){
  const L=[];
  if(it.mods)for(const k in it.mods)L.push([k,it.mods[k]]);
  if(it.gems)for(const g of it.gems)if(g){const m=GEMS[g.t].mods[g.tier-1];for(const k in m)L.push([k,m[k]])}
  if(it.aspd)L.push(['atkSpdPct',it.aspd]);
  return L;
}
function sellValue(it){
  const g=it.gems?it.gems.filter(Boolean).reduce((s,x)=>s+8*x.tier*x.tier,0):0;
  return Math.round((1+it.r*it.r*1.5)*it.ilvl*1.5+3)+(it.up||0)*6+g+(it.set?20:0)+(it.uniq?60:0);
}
const itemIcon=it=>it.icon||it.slot;
function setCount(id){let n=0;for(const sl of SLOTS){const e=typeof P!=='undefined'&&P&&P.eq[sl];if(e&&e.set===id)n++}return n}
function itemLines(it){
  const L=[];
  L.push({t:it.name+(it.lock?'  [locked]':''),c:RARITY[it.r].c});
  L.push({t:`${RARITY[it.r].n} ${it.base||SLOT_LABEL[it.slot==='ring'?'ring1':it.slot]}  (iLvl ${it.ilvl})`,c:'#a89878'});
  if(it.dmg)L.push({t:`${itemDmg(it)} Damage`+(it.up?` (+${it.up})`:''),c:'#ffffff'});
  if(it.armor)L.push({t:`${itemArmor(it)} Armor`+(it.up?` (+${it.up})`:''),c:'#ffffff'});
  if(it.aspd)L.push({t:`${it.aspd>0?'+':''}${it.aspd}% Attack Speed`,c:it.aspd>0?'#a8e8a8':'#e8a8a8'});
  if(it.imp)L.push({t:AFFDEF[it.imp.k].fmt(it.imp.v),c:'#c8d8e8'});
  for(const a of it.aff)L.push({t:AFFDEF[a.k].fmt(a.v),c:'#8fd0ff'});
  if(it.mods)for(const k in it.mods)L.push({t:MODLABEL[k](it.mods[k]),c:'#ffb050'});
  if(it.gems)for(const g of it.gems)L.push(g?{t:`<${gemName(g)}> ${gemLabel(g)}`,c:GEMS[g.t].c}:{t:'<empty socket>',c:'#6a6a7a'});
  if(it.uniq){const u=UNIQ.find(q=>q.id===it.uniq);if(u)L.push({t:'"'+u.desc+'"',c:'#c89858'})}
  L.push({t:`Sells for ${sellValue(it)}g`,c:'#e8c050'});
  return L;
}
function setLines(it){
  if(!it.set)return[];
  const S=SETS[it.set],n=setCount(it.set),L=[{t:`${S.name} (${n}/4)`,c:'#60e0a0'}];
  for(const k of[2,3,4])L.push({t:`${k}: `+Object.keys(S.bonus[k]).map(m=>MODLABEL[m](S.bonus[k][m])).join(', '),c:n>=k?'#60e0a0':'#6a7a70'});
  return L;
}

// ---------- consumables ----------
const CONS={
  respot:{n:'Focus Draught',icon:'potion',c:'#5aa0ff',desc:'Restores 60% of your resource.',use(){P.res=Math.min(P.resMax,P.res+P.resMax*.6);floatText(P.x,P.y-14,'+'+P.hero.res,P.hero.resColor);puff(P.x,P.y,8,P.hero.resColor,40);return true},can(){return P.res<P.resMax-1}},
  swift:{n:'Swiftfoot Tonic',icon:'potion',c:'#a0e860',desc:'+30% movement speed for 30 seconds.',use(){addBuff('tonic','Swiftfoot Tonic',{spdPct:30},30);return true}},
  stone:{n:'Stoneskin Salve',icon:'potion',c:'#b0a890',desc:'+25 armor for 90 seconds.',use(){addBuff('salve','Stoneskin Salve',{armor:25},90);return true}},
  bomb:{n:'Ember Bomb',icon:'bomb',c:'#ff8a30',desc:'Thrown at your aim point. Explodes for heavy damage.',use(){const t=targetPoint(110);mark(t.x,t.y,44,.5);later(.5,()=>{aoeAt(t.x,t.y,44,3.4,140,{},'#ff8a30');fx({k:'ring',x:t.x,y:t.y,r0:4,r1:44,t:0,dur:.35,c:'#ff8a30'});Snd.boom();shake=4});Snd.spell();return true}},
  scroll:{n:'Waystone Scroll',icon:'scroll',c:'#e8d8a0',desc:'Returns you to Hearthmoor at once.',use(){startFade(()=>loadMap(...toVillage()));return true},
    can(){if(curZone()==='village')return false;if(E.some(e=>e.type==='boss'&&e.state==='fight'&&!e.dead))return false;return true},cantText:'The scroll will not work here.'}
};
const CONSORDER=['respot','swift','stone','bomb','scroll'];
function addCons(id,n){
  P.cons[id]=(P.cons[id]||0)+(n||1);
  if(!P.quick.includes(id)){const i=P.quick.indexOf(null);if(i>=0)P.quick[i]=id}
}
function useCons(id){
  const d=CONS[id];
  if(!d||!(P.cons[id]>0))return false;
  if(d.can&&!d.can()){toast(d.cantText||'No use right now','#ff8070');return false}
  if(d.use()){P.cons[id]--;Snd.pickup();return true}
  return false;
}
function addGem(g,n){const k=gemKey(g);P.gems[k]=(P.gems[k]||0)+(n||1)}
function gemFromKey(k){return{t:k.slice(0,-1),tier:+k.slice(-1)}}
