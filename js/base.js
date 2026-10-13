'use strict';
// ---------- Hearthmoor shops (Zelda style: a potion shop and an inn, no crafting, no materials, no building upgrades) ----------
const MATS={};   // materials are gone; kept empty so old call sites do not crash
const baseLv=()=>1;
const potCap=()=>9+3*((flags&&flags.satchel)||0);
const potionPrice=()=>30+Math.round(P.lvl*2);
const goldLine=()=>`Gold ${P.gold}`;
function addBuff(cat,name,mods,secs){
  P.buffs=P.buffs.filter(b=>b.cat!==cat);
  P.buffs.push({cat,name,mods,t:secs});recalc();Snd.pickup();toast(secs<120?`${name} (${secs}s)`:`${name} (${Math.round(secs/60)} min)`,'#8fd0ff');
}

// ---------- Pip the alchemist: healing potions ----------
function alchMenu(){
  return menu('Pip\'s Potions',[
    {t:()=>`Buy a healing potion (${potionPrice()}g)   you carry ${P.potions}/${potCap()}`,fn(){
      if(P.potions>=potCap()){toast('You cannot carry more potions','#ff8070');return true}
      if(P.gold<potionPrice()){toast('Not enough gold','#ff8070');return true}
      P.gold-=potionPrice();P.potions++;Snd.coin();return true}},
    {t:'Leave',fn(){}}],true,goldLine);
}

// ---------- the Hearth inn: rest and save ----------
function tavernMenu(){
  return menu('The Hearth',[
    {t:'Rest and save game (free)',fn(){P.hp=P.maxHp;P.res=0;save();toast('Fully rested. Game saved.');Snd.level();return true}},
    {t:'Leave',fn(){}}],true,goldLine);
}
