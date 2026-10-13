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
  skeleton:{name:'Grave Walker',hp:40,dmg:9,speed:34,xp:14,gold:[3,7],hw:5,hh:5,aggro:110},
  ghost:{name:'Wailing Ghost',hp:24,dmg:8,speed:52,xp:14,gold:[3,8],hw:5,hh:5,aggro:150},
  boss:{name:'Old Barkfather',hp:520,dmg:14,speed:22,xp:200,gold:[80,120],hw:12,hh:10,aggro:150}
};
// variants for the far regions (tinted sprites, same behaviours)
Object.assign(ENEMIES,{
  frostwolf:Object.assign({},ENEMIES.wolf,{name:'Frost Wolf',hp:30,dmg:7,speed:68,xp:12}),
  sandbeetle:Object.assign({},ENEMIES.beetle,{name:'Dune Beetle',hp:36,dmg:8,xp:11}),
  thornbrute:Object.assign({},ENEMIES.brute,{name:'Thornback Brute',hp:90,dmg:13,xp:30}),
  stormbat:Object.assign({},ENEMIES.bat,{name:'Storm Bat',hp:20,dmg:7,speed:78,xp:12}),
  magmabrute:Object.assign({},ENEMIES.brute,{name:'Magma Brute',hp:100,dmg:15,xp:36}),
  crystalghost:Object.assign({},ENEMIES.ghost,{name:'Crystal Wraith',hp:34,dmg:10,xp:18}),
  frostskel:Object.assign({},ENEMIES.skeleton,{name:'Frostbound Walker',hp:52,dmg:11,xp:18})
});
