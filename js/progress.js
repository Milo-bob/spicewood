'use strict';
// ================= Fixed progression (Zelda: Link's Awakening style) =================
// No XP, no levels, no attribute points, no skill trees and no random loot. The hero gets stronger through the story:
//  - hearts: Heart Fruits (bosses, hidden grottos)
//  - gear: sword and armor in fixed tiers, forged for the hero after certain bosses
//  - gate items: tools that open the world (see KEYITEMS)
// Behind the scenes the enemy scaling still uses a hidden "power level" (P.lvl), derived from the bosses already defeated, so every region
// keeps its difficulty without any grinding. Nobody sees it, it never goes up by killing things.
const HERO_START=0;   // only one hero for now (Brann the warrior). The other three stay in data.js for later.
const GEAR_AT=[0,1,3,6,9,12];   // number of defeated bosses needed for tier 0..5
const GEAR_POWER=[2,8,15,23,31,40];   // power level a tier is balanced for
const SWORDS=[
  {name:'Worn Sword',d:'A hand-me-down blade from the Hearthmoor smithy.'},
  {name:'Oakheart Blade',d:'Edged with the heartwood of the Hollow Oak.'},
  {name:'Amber Edge',d:'Spore-hardened steel that bites deep.'},
  {name:'Rustbreaker',d:'Forged from the Warden\'s own iron.'},
  {name:'Ember Brand',d:'Still warm from the Cinder Forge.'},
  {name:'Winter Fang',d:'A blade of living frost. It never dulls.'}
];
const ARMORS=[
  {name:'Linen Tunic',d:'Soft, plain and warm.'},
  {name:'Leather Jerkin',d:'Stitched by the village tanner.'},
  {name:'Spore-weave Coat',d:'Woven from Amber Hollow fibres.'},
  {name:'Ironbark Mail',d:'Bark and iron, hammered together.'},
  {name:'Cinderplate',d:'Scorched plates that shrug off flame.'},
  {name:'Frostmail',d:'Rime-covered links, light as snow.'}
];
// colours the hero shows for each gear tier
const SWORD_COL=['#c8c8c8','#d8b060','#e0c860','#c8885a','#ff8a40','#9ad8ff'];
const ARMOR_COL=['#8a6a3a','#9a6a3a','#6aa05a','#8a8a98','#e0603a','#a8d0f0'];
const bossesDown=()=>DUNGEONS.reduce((n,d)=>n+(flags&&flags[d.bossFlag]?1:0),0);
function gearTier(n){n=n===undefined?bossesDown():n;let t=0;for(let i=0;i<GEAR_AT.length;i++)if(n>=GEAR_AT[i])t=i;return t}
// the hidden power level: the level of the last boss defeated plus two (2 at the very start)
function powerLevel(){
  let l=0;
  if(flags)for(const d of DUNGEONS)if(flags[d.bossFlag])l=Math.max(l,d.bossLvl);
  if(flags&&flags.boss6)l=Math.max(l,42);
  return Math.min(44,l?l+2:2);
}
// damage and armor of the current gear (balanced like a hero with decent loot at that power level)
function gearNow(){
  const t=gearTier(),L=GEAR_POWER[t];
  return{tier:t,sword:SWORDS[t],armorSet:ARMORS[t],dmg:Math.round((3+1.7*L)*1.3),arm:Math.round(3.8*(1+.9*L)*.9)};
}
