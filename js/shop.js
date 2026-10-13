'use strict';
// ================= Hearthmoor: Bruna's Store, Waystone Scrolls, Sprite Jar =================
// The village is the hub (like Mabe Village in Link's Awakening): it is where you spend gold, where a Waystone Scroll or a defeat brings you home,
// and what it offers grows with the forest: every Forgotten Tree that lives again brings traders back to Bruna's shelves.
// State (all in flags, so it saves with the slot): scrolls (carried), satchel (0..2 potion bag upgrades), jar (0..1 Sprite Jar), scrollGift.
const SCROLL_MAX=5,SCROLL_PRICE=60;
const SATCHEL=[{cost:200,trees:2},{cost:500,trees:6}];   // each adds 3 potion slots
const JAR={cost:300,trees:4};
const villageTrees=()=>(typeof ftreeCount==='function'?ftreeCount():0);

// R: read a Waystone Scroll
function useScroll(){
  if(ui||P.dead)return;
  if(!(flags.scrolls>0)){toast('No Waystone Scroll. Bruna sells them in Hearthmoor.','#ff8070');return}
  const d=CONS.scroll;
  if(d.can&&!d.can()){toast(d.cantText||'The scroll will not work here.','#ff8070');return}
  flags.scrolls--;Snd.pickup();d.use();
}

// the Sprite Jar: once, when you would fall, it pulls you back with half your hearts
function jarSaves(){
  if(!(flags.jar>0))return false;
  flags.jar--;P.hp=Math.round(P.maxHp*.5);P.inv=2;P.dead=false;P.kx=P.ky=0;
  fx({k:'ring',x:P.x,y:P.y,r0:4,r1:60,t:0,dur:.6,c:'#a0ff80'});puff(P.x,P.y-6,18,'#a0ff80',80);
  toast('The Sprite Jar shatters and pulls you back to your feet!','#a0ff80');Snd.level();
  return true;
}

function shopMenu(){
  const n=villageTrees();
  const lock=need=>{toast(`Not in stock yet. Traders return as the forgotten trees live again (${n}/${need}).`,'#ffd080');return true};
  const pay=c=>{if(P.gold<c){toast('Not enough gold','#ff8070');return false}P.gold-=c;Snd.coin();return true};
  const opts=[
    {t:()=>`Waystone Scroll (${SCROLL_PRICE}g)   you carry ${flags.scrolls||0}/${SCROLL_MAX}`,fn(){
      if((flags.scrolls||0)>=SCROLL_MAX){toast('You cannot carry more scrolls','#ff8070');return true}
      if(pay(SCROLL_PRICE))flags.scrolls=(flags.scrolls||0)+1;return true}},
    {t:()=>{
      if(flags.jar>0)return'Sprite Jar: you carry one';
      return n<JAR.trees?`??? (traders return after ${JAR.trees} revived trees)`:`Sprite Jar (${JAR.cost}g)   saves you once when you fall`},
      fn(){
        if(flags.jar>0){toast('You already carry a Sprite Jar','#ff8070');return true}
        if(n<JAR.trees)return lock(JAR.trees);
        if(pay(JAR.cost)){flags.jar=1;toast('A sprite hums inside the jar.','#a0ff80')}return true}},
    {t:'Leave',fn(){}}];
  return menu('Bruna\'s Store',opts,true,goldLine);
}

function shopTalk(n){
  const lines=[];
  const vc=villageChat('stash');if(vc)lines.push(...vc);
  if(flags.boss&&!flags.scrollGift){
    flags.scrollGift=true;flags.scrolls=(flags.scrolls||0)+1;
    lines.push('Bruna: You look like someone who walks far. Take this Waystone Scroll, on the house. Press R anywhere and it brings you home to Hearthmoor.');
  }
  const t=villageTrees();
  lines.push(t>=14?'Bruna: Every tree lives again. Look at my shelves, dear. The whole forest sends its goods.'
    :t>=8?'Bruna: Traders walk the roads again. Greener every week! What do you need?'
    :t>=4?'Bruna: The first traders came back. They say the green is spreading. What can I get you?'
    :t>=1?'Bruna: A peddler arrived from the woods, talking about a tree that lives again. Perhaps there is hope. What do you need?'
    :'Bruna: Welcome to my store. Scrolls to carry you home, and jars with sprites in them once the forest recovers. What do you need?');
  say(n.name,lines,()=>{ui=shopMenu()});
}

// ================= the other shops: every one sells what its owner would sell =================
const guardians=()=>(typeof bossesDown==='function'?bossesDown():0);
const price=b=>Math.round(b*(1+.12*guardians()));
const MIN5=300;
function buy(cost){if(P.gold<cost){toast('Not enough gold','#ff8070');return false}P.gold-=cost;Snd.coin();return true}
function brewRow(label,base,cat,name,mods,secs,gate){
  return{t:()=>gate&&!gate.ok()?`??? (${gate.text})`:`${label} (${price(base)}g)`,fn(){
    if(gate&&!gate.ok()){toast(gate.text,'#ffd080');return true}
    if(buy(price(base)))addBuff(cat,name,mods,secs);return true}};
}

// Pip the Alchemist: healing and the bag that carries it
function alchTalk(n){
  const lines=[...(villageChat('alch')||[])];
  lines.push(villageTrees()>=3?'Pip: Look at these herbs! Real glade-green. The forest is giving them back, one tree at a time.':'Pip: Potions, fresh and red! They mend half your hearts. Ask me about a bigger satchel if you want to carry more.');
  say(n.name,lines,()=>{ui=alchMenu()});
}
function alchMenu(){
  const n=villageTrees(),sat=()=>flags.satchel||0;
  return menu("Pip's Potions",[
    {t:()=>`Healing potion (${potionPrice()}g)   you carry ${P.potions}/${potCap()}`,fn(){
      if(P.potions>=potCap()){toast('You cannot carry more potions','#ff8070');return true}
      if(buy(potionPrice()))P.potions++;return true}},
    brewRow('Swiftfoot Tonic, drink now: faster for 5 min',45,'tonic','Swiftfoot Tonic',{spdPct:30},MIN5),
    {t:()=>{
      if(sat()>=SATCHEL.length)return'Potion satchel: you have the biggest one';
      const s=SATCHEL[sat()];return n<s.trees?`??? (Pip needs better herbs: ${s.trees} revived trees)`:`Bigger satchel, +3 potions (${s.cost}g)   holds ${potCap()} now`},
      fn(){
        if(sat()>=SATCHEL.length)return true;
        const s=SATCHEL[sat()];
        if(n<s.trees){toast(`Not yet. Pip needs better herbs: ${n}/${s.trees} forgotten trees alive.`,'#ffd080');return true}
        if(buy(s.cost)){flags.satchel=sat()+1;toast(`Your satchel holds ${potCap()} potions now.`,'#8fd0ff')}return true}},
    {t:'Leave',fn(){}}],true,goldLine);
}

// Dolly in the Hearth: a bed, hot food and gossip
const RUMORS=[
  'They say the Hollow Oak was a tree before it was a prison. Roots remember.',
  'A hunter swore the leaves in Ember Glade burn red even in spring. Not from the cold, she said. From the fever.',
  'Pip claims every herb he sells comes from the glade. I say he buys half from the marsh and lies about it.',
  'The old stumps with the rings? Travellers leave coins on them. Do not ask me why.',
  'Lia hums a song when she thinks no one listens. I have never heard it from anyone else.',
  'If a tree wakes up out there, you can feel it here. The wind smells of rain.',
  'Elder Maren reads her letters aloud, every night. She never says who writes them.'];
function tavernTalk(n){
  const lines=[...(villageChat('tavern')||[])];
  lines.push(villageTrees()>=5?'Dolly: Full house every night now! Traders from the green road, would you believe it.':'Dolly: Welcome to the Hearth! Rest your bones, fill your belly, or sit and listen to me talk.');
  lines.push(...cookIntro());
  say(n.name,lines,()=>{ui=tavernMenu()});
}
function tavernMenu(){
  return menu('The Hearth',[
    {t:'Rest and save game (free)',fn(){P.hp=P.maxHp;P.res=0;save();toast('Fully rested. Game saved.');Snd.level();return true}},
    brewRow('Spiced cider: slowly mends you, 5 min',15,'food','Spiced Cider',{regenHp:1.3},MIN5),
    brewRow('Hearth stew: sturdier, 5 min',40,'food','Hearth Stew',{hpPct:15},MIN5),
    brewRow('Honey cake: hits harder, 5 min',40,'food','Honey Cake',{dmgPct:10},MIN5),
    {t:()=>`Ask Dolly to cook (spices ${spiceCount()}/${Object.keys(SPICEBY).length}, dishes ${mealCount()}/${MEALS.length})`,fn(){ui=cookMenu()}},
    {t:'Listen to the rumors (free)',fn(){
      flags.rumor=((flags.rumor||0)+1)%RUMORS.length;
      ui=null;say('Dolly',['Dolly: '+RUMORS[flags.rumor]],()=>{ui=tavernMenu()});return true}},
    {t:'Leave',fn(){}}],true,goldLine);
}

// Torvald the Smith: edge and mending for the road
function smithTalk(n){
  const g=gearNow(),lines=[...(villageChat('smith')||[])];
  lines.push(`Torvald: I keep your ${g.sword.name} sharp and your ${g.armorSet.name} mended. ${g.tier<GEAR_AT.length-1?'Every guardian you bring down gives me new steel to work with.':'There is nothing left I can teach this steel.'}`);
  say(n.name,lines,()=>{ui=smithMenu()});
}
function smithMenu(){
  return menu("Torvald's Forge",[
    brewRow('Whetstone edge: hits harder, 5 min',60,'edge','Whetstone Edge',{dmgPct:15},MIN5),
    brewRow('Armor mending: takes less damage, 5 min',60,'mend','Mended Armor',{reducePct:12},MIN5,{ok:()=>guardians()>=1,text:'Torvald needs the iron of one defeated guardian first'}),
    {t:'Leave',fn(){}}],true,goldLine);
}
