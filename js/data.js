'use strict';
// ---------- Heroes ----------
const HEROES=[
  {id:'warrior',name:'Brann',cls:'Warrior',color:'#d63a30',dark:'#7d1c18',light:'#f0766a',hair:'#9ba3ad',
   res:'Rage',resColor:'#e0502e',primary:'str',base:{str:9,dex:4,int:2,vit:8},atkCd:.42,melee:{range:28,arc:110},
   weaponNames:['Sword','Axe','Cleaver','Blade'],
   resMax:()=>100,regen:()=>0,
   desc:'Frontline bruiser. Builds Rage by fighting.',
   skills:[{id:'cleave',name:'Cleave',cost:25,cd:2.5},{id:'slam',name:'Ground Slam',cost:40,cd:6}]},
  {id:'ranger',name:'Sylva',cls:'Ranger',color:'#3f9a3a',dark:'#1f5a22',light:'#7fd06a',hair:'#2f5a2a',
   res:'Stamina',resColor:'#7fd06a',primary:'dex',base:{str:4,dex:9,int:3,vit:6},atkCd:.5,ranged:'arrow',
   weaponNames:['Bow','Longbow','Shortbow'],
   resMax:s=>60+s.dex,regen:s=>12+s.dex*.2,
   desc:'Keeps her distance and shoots arrows from afar.',
   skills:[{id:'multishot',name:'Multishot',cost:25,cd:3},{id:'pierce',name:'Piercing Shot',cost:35,cd:5}]},
  {id:'mage',name:'Merin',cls:'Mage',color:'#3a6fd8',dark:'#1e3c82',light:'#7fa8f5',hair:'#2a4aa8',
   res:'Mana',resColor:'#5aa0ff',primary:'int',base:{str:2,dex:3,int:10,vit:5},atkCd:.55,ranged:'bolt',
   weaponNames:['Staff','Wand','Scepter'],
   resMax:s=>30+s.int*4,regen:s=>4+s.int*.4,
   desc:'Glass cannon with explosive spells.',
   skills:[{id:'fireball',name:'Fireball',cost:25,cd:3},{id:'nova',name:'Frost Nova',cost:40,cd:7}]},
  {id:'rogue',name:'Vex',cls:'Rogue',color:'#8a3fc9',dark:'#4a1d78',light:'#b87be8',hair:'#3a1d5a',
   res:'Energy',resColor:'#e8d040',primary:'dex',base:{str:4,dex:10,int:3,vit:4},atkCd:.28,melee:{range:20,arc:90},
   weaponNames:['Dagger','Dirk','Kris'],
   resMax:()=>100,regen:s=>20+s.dex*.2,
   desc:'Lightning-fast stabs and shadowy tricks.',
   skills:[{id:'dash',name:'Shadow Strike',cost:30,cd:3.5},{id:'knives',name:'Knife Fan',cost:50,cd:6}]}
];

// ---------- Enemies ----------
const ENEMIES={
  beetle:{name:'Ember Beetle',hp:26,dmg:6,speed:30,xp:8,gold:[1,4],hw:5,hh:4,aggro:100},
  wolf:{name:'Rust Wolf',hp:22,dmg:5,speed:64,xp:8,gold:[1,5],hw:6,hh:4,aggro:130},
  shroom:{name:'Nutmeg Shroomling',hp:18,dmg:5,speed:22,xp:8,gold:[2,5],hw:4,hh:4,aggro:130},
  bat:{name:'Mire Bat',hp:14,dmg:5,speed:70,xp:9,gold:[2,5],hw:5,hh:4,aggro:140},
  brute:{name:'Capcrusher',hp:70,dmg:11,speed:18,xp:22,gold:[4,9],hw:7,hh:6,aggro:120},
  boss:{name:'Old Barkfather',hp:520,dmg:14,speed:22,xp:200,gold:[80,120],hw:12,hh:10,aggro:150}
};

// ---------- Items ----------
const SLOTS=['weapon','helm','chest','gloves','boots','amulet','ring1','ring2'];
const SLOT_LABEL={weapon:'Weapon',helm:'Helm',chest:'Chest',gloves:'Gloves',boots:'Boots',amulet:'Amulet',ring1:'Ring',ring2:'Ring'};
const SLOT_ICON={weapon:'W',helm:'H',chest:'C',gloves:'G',boots:'B',amulet:'A',ring:'R'};
const RARITY=[
  {n:'Common',c:'#d8d8d8',m:1,aff:0},
  {n:'Fine',c:'#5ad05a',m:1.12,aff:1},
  {n:'Rare',c:'#4a9cf0',m:1.25,aff:2},
  {n:'Epic',c:'#b25cf0',m:1.45,aff:3},
  {n:'Legendary',c:'#ff9a2a',m:1.75,aff:4}
];
const BASES={helm:['Cap','Hood','Helm','Crown'],chest:['Jerkin','Tunic','Vest','Mail','Robe'],gloves:['Gloves','Mitts','Gauntlets'],
  boots:['Boots','Sandals','Greaves'],amulet:['Amulet','Charm','Pendant'],ring:['Ring','Band','Signet']};
const PREFIX=['Cinnamon','Clove','Amber','Ember','Thorn','Saffron','Pepper','Anise','Nutmeg','Ginger','Cardamom'];
const AFFDEF={
  str:{fmt:v=>`+${v} Strength`,roll:i=>Math.max(1,Math.round(i*.55*rand(.7,1.2)+1))},
  dex:{fmt:v=>`+${v} Dexterity`,roll:i=>Math.max(1,Math.round(i*.55*rand(.7,1.2)+1))},
  int:{fmt:v=>`+${v} Intellect`,roll:i=>Math.max(1,Math.round(i*.55*rand(.7,1.2)+1))},
  vit:{fmt:v=>`+${v} Vitality`,roll:i=>Math.max(1,Math.round(i*.55*rand(.7,1.2)+1))},
  hp:{fmt:v=>`+${v} Health`,roll:i=>Math.round(i*3.5*rand(.8,1.3)+4)},
  armor:{fmt:v=>`+${v} Armor`,roll:i=>Math.round(i*.7*rand(.8,1.2)+1)},
  crit:{fmt:v=>`+${v}% Crit`,roll:i=>Math.round(rand(1,2)+i*.15)},
  speed:{fmt:v=>`+${v}% Move Speed`,roll:i=>Math.round(rand(2,4)+i*.15)}
};
function rollRarity(minR){
  const x=Math.random();
  const r=x<.60?0:x<.85?1:x<.95?2:x<.99?3:4;
  return Math.max(r,minR||0);
}
function genItem(ilvl,o){
  o=o||{};
  const hero=o.hero||(typeof P!=='undefined'&&P?P.hero:HEROES[0]);
  let slot=o.slot;
  if(!slot){
    const x=Math.random();
    slot=x<.22?'weapon':x<.34?'helm':x<.48?'chest':x<.60?'gloves':x<.72?'boots':x<.86?'amulet':'ring';
  }
  const r=rollRarity(o.minR),R=RARITY[r];
  const it={slot,r,ilvl,aff:[],name:''};
  if(slot==='weapon'){
    it.dmg=Math.round((3+ilvl*1.7)*R.m*rand(.9,1.1));
    it.base=pick(hero.weaponNames);
  }else{
    const sm={chest:1.4,helm:1,gloves:.7,boots:.7,amulet:0,ring:0}[slot];
    if(sm)it.armor=Math.max(1,Math.round((1+ilvl*.9)*R.m*sm));
    it.base=pick(BASES[slot]);
  }
  let n=R.aff;if((slot==='amulet'||slot==='ring')&&n<1)n=1;
  const pool=['str','dex','int','vit','hp','armor','crit','speed','hp',hero.primary,hero.primary,hero.primary,'vit'];
  const used=new Set();
  let guard=0;
  while(it.aff.length<n&&guard++<50){
    const k=pick(pool);if(used.has(k))continue;used.add(k);
    it.aff.push({k,v:AFFDEF[k].roll(ilvl)});
  }
  it.name=pick(PREFIX)+' '+it.base+(r===4?' of Spicewood':'');
  return it;
}
const upMul=it=>1+.12*(it.up||0);
const itemDmg=it=>it.dmg?Math.round(it.dmg*upMul(it)):0;
const itemArmor=it=>it.armor?Math.round(it.armor*upMul(it)):0;
function sellValue(it){return Math.round((1+it.r*it.r*1.5)*it.ilvl*1.5+3)+(it.up||0)*6}
function itemLines(it){
  const L=[];
  L.push({t:it.name,c:RARITY[it.r].c});
  L.push({t:`${RARITY[it.r].n} ${SLOT_LABEL[it.slot==='ring'?'ring1':it.slot]}  (iLvl ${it.ilvl})`,c:'#a89878'});
  if(it.dmg)L.push({t:`${itemDmg(it)} Damage`+(it.up?` (+${it.up})`:''),c:'#ffffff'});
  if(it.armor)L.push({t:`${itemArmor(it)} Armor`+(it.up?` (+${it.up})`:''),c:'#ffffff'});
  for(const a of it.aff)L.push({t:AFFDEF[a.k].fmt(a.v),c:'#8fd0ff'});
  L.push({t:`Sells for ${sellValue(it)}g`,c:'#e8c050'});
  return L;
}
