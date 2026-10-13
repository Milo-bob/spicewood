'use strict';
// ---------- Materials, crafting and base building (Hearthmoor) ----------
const MATS={
  wood:{n:'Wood',c:'#b8844a'},ore:{n:'Ore',c:'#9ab0c8'},herb:{n:'Herbs',c:'#6ac860'},
  leather:{n:'Leather',c:'#d0905a'},shell:{n:'Shell',c:'#e08a3a'}
};
const matsLine=()=>Object.keys(MATS).map(k=>`${MATS[k].n} ${P.mats[k]||0}`).join('   ')+`   Gold ${P.gold}`;
function costText(c){const o=[];for(const k in c)o.push(k==='gold'?c[k]+'g':c[k]+' '+MATS[k].n);return o.join(', ')}
function canPay(c){for(const k in c){if(k==='gold'){if(P.gold<c[k])return false}else if((P.mats[k]||0)<c[k])return false}return true}
function pay(c){for(const k in c){if(k==='gold')P.gold-=c[k];else P.mats[k]-=c[k]}}
function addMat(k,n){P.mats[k]=(P.mats[k]||0)+n}
const baseLv=id=>(flags.base&&flags.base[id])||1;
const bagCap=()=>20+10*(baseLv('store')-1);
const potCap=()=>9+3*(baseLv('alch')-1);

// ---------- building upgrades ----------
const BUILD={
  smithy:{name:'Smithy',costs:[null,{wood:10,ore:8,gold:100},{wood:25,ore:20,gold:300},{wood:40,ore:35,gold:600},{wood:60,ore:55,gold:1000}],
    gate:[null,()=>flags.boss,()=>flags.boss2,()=>flags.boss3,()=>flags.boss4],gateText:['','Defeat Old Barkfather first','Defeat Mother Mycelia in the Spore Warren first','Defeat The Drowned Matron in the Sunken Shrine first','Defeat The Rust Warden in the Rustpeak Mine first'],
    perk:['Forge Fine gear, upgrade items to +3','Forge Rare gear, upgrade to +6','Forge Epic gear, upgrade to +9','Forge Epic gear, upgrade to +12','Forge Legendary gear, upgrade to +15']},
  alch:{name:'Alchemist',costs:[null,{wood:6,herb:8,gold:80},{wood:12,herb:20,gold:250},{wood:20,herb:35,gold:500},{wood:30,herb:50,gold:900}],
    gate:[null,()=>flags.boss,()=>flags.boss2,()=>flags.boss3,()=>flags.boss4],gateText:['','Defeat Old Barkfather first','Defeat Mother Mycelia in the Spore Warren first','Defeat The Drowned Matron in the Sunken Shrine first','Defeat The Rust Warden in the Rustpeak Mine first'],
    perk:['Brew potions','Elixirs, potions heal 25% more','Greater elixirs, potions heal 50% more','Potions heal 75% more, stronger elixirs','Potions heal 100% more, mightiest elixirs']},
  tavern:{name:'Tavern',costs:[null,{wood:8,leather:5,gold:80},{wood:16,leather:12,gold:250},{wood:28,leather:20,gold:500},{wood:40,leather:30,gold:900}],
    gate:[null,()=>flags.boss,()=>flags.boss2,()=>flags.boss3,()=>flags.boss4],gateText:['','Defeat Old Barkfather first','Defeat Mother Mycelia in the Spore Warren first','Defeat The Drowned Matron in the Sunken Shrine first','Defeat The Rust Warden in the Rustpeak Mine first'],
    perk:['Rest and simple meals','Stronger meals, hunter\'s roast','Feasts, longest buffs','Stronger feasts and longer buffs','Royal feasts, the longest buffs']},
  store:{name:'Storehouse',costs:[null,{wood:12,ore:6,gold:100},{wood:30,ore:15,gold:300},{wood:45,ore:25,gold:600},{wood:60,ore:40,gold:1000}],
    gate:[null,()=>flags.stage>=2,()=>flags.boss,()=>flags.boss2,()=>flags.boss3],gateText:['','Accept the Elder\'s quest first','Defeat Old Barkfather first','Defeat Mother Mycelia in the Spore Warren first','Defeat The Drowned Matron in the Sunken Shrine first'],
    perk:['Bag: 20 slots','Bag: 30 slots','Bag: 40 slots','Bag: 50 slots','Bag: 60 slots']}
};
function upgradeOption(id){
  const B=BUILD[id];
  return{t:()=>{const l=baseLv(id);return l>=5?`${B.name} is at max level (Lv 5)`:`Upgrade ${B.name} to Lv ${l+1}: ${B.perk[l]}  (${costText(B.costs[l])})`},
    fn(){
      const l=baseLv(id);
      if(l>=5){toast(`${B.name} is already at max level`,'#ff8070');return true}
      if(!B.gate[l]()){toast(B.gateText[l],'#ff8070');return true}
      if(!canPay(B.costs[l])){toast('Not enough materials','#ff8070');return true}
      pay(B.costs[l]);flags.base[id]=l+1;Snd.level();toast(`${B.name} upgraded to Lv ${l+1}!`,'#ffe040');
      if(id==='alch'||id==='store'||id==='smithy'||id==='tavern')save();
      return true;
    }};
}

// ---------- item helpers ----------
function entries(filter,bagOnly){
  const L=[];
  if(!bagOnly)for(const sl of SLOTS)if(P.eq[sl]&&(!filter||filter(P.eq[sl])))L.push({it:P.eq[sl],tag:'E'});
  for(const it of P.bag)if(!filter||filter(it))L.push({it,tag:'B'});
  return L;
}
function setUp(it,n){it.bn=it.bn||it.name;it.up=n;it.name=n?`${it.bn} +${n}`:it.bn}
function rollAffixList(ilvl,n,slot){
  const out=[],used=new Set();
  for(let g=0;out.length<n&&g<40;g++){const k=rollAffixKey(slot||'weapon',P.hero,used);if(!k)break;out.push({k,v:AFFDEF[k].roll(ilvl)})}
  return out;
}
function salvageYield(it){
  const r=it.r,y={ore:1+r};
  if(r>=1)y.leather=r;if(r>=2)y.shell=r-1;if(r>=3)y.herb=r-1;if(r>=2)y.wood=r;
  return y;
}
function giveItem(it){if(!addToBag(it))dropItem(P.x,P.y+10,it)}
function back(fn){return{t:'< Back',fn(){ui=fn();return true}}}

// ---------- Smithy ----------
const FORGE=[
  {slot:'weapon',n:'Weapon',cost:{ore:6,wood:2,leather:1}},
  {slot:'helm',n:'Helm',cost:{ore:4,leather:2}},
  {slot:'chest',n:'Chest armor',cost:{ore:5,leather:4}},
  {slot:'gloves',n:'Gloves',cost:{ore:3,leather:2}},
  {slot:'boots',n:'Boots',cost:{ore:3,leather:3}},
  {slot:'amulet',n:'Amulet',cost:{ore:3,herb:3,shell:2}},
  {slot:'ring',n:'Ring',cost:{ore:2,herb:2,shell:2}}
];
const RNAME=['Common','Fine','Rare','Epic','Legendary'];
function smithMenu(){
  return menu(()=>`Smithy Lv ${baseLv('smithy')}`,[
    {t:'Forge new gear',fn(){ui=forgeMenu();return true}},
    {t:'Upgrade an item (+)',fn(){ui=upgradeMenu();return true}},
    {t:'Reforge affixes',fn(){ui=reforgeMenu();return true}},
    {t:'Salvage items for materials',fn(){ui=salvageMenu();return true}},
    {t:'Sockets and gems',fn(){ui=socketMenu();return true}},
    {t:()=>`Sell all Common and Fine items (${P.bag.filter(i=>i.r<=1&&!i.lock&&!i.gems).reduce((s,i)=>s+sellValue(i),0)}g, locked and socketed items stay)`,fn(){
      const junk=P.bag.filter(i=>i.r<=1&&!i.lock&&!i.gems);if(!junk.length){toast('Nothing to sell','#ff8070');return true}
      const g=junk.reduce((s,i)=>s+sellValue(i),0);P.bag=P.bag.filter(i=>!junk.includes(i));P.gold+=g;Snd.coin();toast(`Sold ${junk.length} items for ${g}g`);return true}},
    upgradeOption('smithy'),
    {t:'Leave',fn(){}}],true,matsLine);
}
function forgeMenu(){
  const lv=baseLv('smithy'),minR=lv>=5?4:Math.min(3,lv);
  const opts=FORGE.map(f=>{
    const cost=Object.assign({},f.cost,{gold:15+P.lvl*8});
    return{t:()=>`${f.n}  (${costText(cost)})  ${RNAME[minR]}+`,fn(){
      if(!canPay(cost)){toast('Not enough materials','#ff8070');return true}
      pay(cost);const it=genItem(P.lvl+1,{slot:f.slot,minR});giveItem(it);
      Snd.level();toast(`Forged ${it.name}`,RARITY[it.r].c);return true}};
  });
  opts.push(back(smithMenu));
  return menu('Forge new gear',opts,true,matsLine);
}
function upgradeMenu(){
  const cap=3*baseLv('smithy');
  const opts=entries().map(({it,tag})=>{
    const cost=()=>({ore:2+2*(it.up||0),gold:10*((it.up||0)+1)+P.lvl*3});
    return{t:()=>(it.up||0)>=cap?`[${tag}] ${it.name}  (max for this Smithy level)`:`[${tag}] ${it.name}  -> +${(it.up||0)+1}  (${costText(cost())})`,fn(){
      if((it.up||0)>=cap){toast('Upgrade the Smithy for higher upgrades','#ff8070');return true}
      const c=cost();if(!canPay(c)){toast('Not enough materials','#ff8070');return true}
      pay(c);setUp(it,(it.up||0)+1);recalc();Snd.level();toast(`${it.name}!`,RARITY[it.r].c);return true}};
  });
  opts.push(back(smithMenu));
  return menu('Upgrade which item?',opts,true,matsLine);
}
function reforgeMenu(){
  const cost={herb:3,shell:2,gold:30+P.lvl*8};
  const opts=entries(it=>it.aff.length>0).map(({it,tag})=>({
    t:()=>`[${tag}] ${it.name}  (${costText(cost)})`,
    fn(){if(!canPay(cost)){toast('Not enough materials','#ff8070');return true}
      pay(cost);it.aff=rollAffixList(it.ilvl,it.aff.length,it.slot);recalc();Snd.spell();toast('Affixes reforged: '+it.aff.map(a=>AFFDEF[a.k].fmt(a.v)).join(', '),'#8fd0ff');return true}}));
  if(!opts.length)opts.push({t:'(no items with affixes)',fn(){return true}});
  opts.push(back(smithMenu));
  return menu('Reforge which item?',opts,true,matsLine);
}
const gemLine=()=>Object.keys(P.gems).filter(k=>P.gems[k]>0).map(k=>`${P.gems[k]}x ${gemName(gemFromKey(k))}`).join('  ')||'No gems yet (they drop from elites, chests and bosses)';
function socketMenu(){
  return menu('Sockets and gems',[
    {t:'Add a socket to an item (max 3)',fn(){ui=addSocketMenu();return true}},
    {t:'Insert a gem',fn(){ui=insertGemMenu();return true}},
    {t:'Remove a gem (destroys it)',fn(){ui=removeGemMenu();return true}},
    {t:'Combine 3 gems into the next tier',fn(){ui=combineGemMenu();return true}},
    back(smithMenu)],true,gemLine);
}
function addSocketMenu(){
  const opts=entries(it=>(it.gems?it.gems.length:0)<3).map(({it,tag})=>{
    const n=it.gems?it.gems.length:0,cost={ore:6+4*n,shell:2+n,gold:30+P.lvl*5};
    return{t:()=>`[${tag}] ${it.name}  (${n} sockets)  ${costText(cost)}`,fn(){
      if(!canPay(cost)){toast('Not enough materials','#ff8070');return true}
      pay(cost);it.gems=(it.gems||[]).concat([null]);Snd.level();toast('A new socket!','#8fd0ff');ui=addSocketMenu();return true}};
  });
  if(!opts.length)opts.push({t:'(nothing to add sockets to)',fn(){return true}});
  opts.push(back(socketMenu));
  return menu('Add a socket to which item?',opts,true,matsLine);
}
function insertGemMenu(){
  const opts=entries(it=>it.gems&&it.gems.includes(null)).map(({it,tag})=>({
    t:()=>`[${tag}] ${it.name}  (${it.gems.filter(g=>!g).length} empty)`,
    fn(){ui=pickGemMenu(it);return true}}));
  if(!opts.length)opts.push({t:'(no item with an empty socket)',fn(){return true}});
  opts.push(back(socketMenu));
  return menu('Insert into which item?',opts,true,gemLine);
}
function pickGemMenu(it){
  const keys=Object.keys(P.gems).filter(k=>P.gems[k]>0);
  const opts=keys.map(k=>{const g=gemFromKey(k);return{t:()=>`${gemName(g)}  x${P.gems[k]}   ${gemLabel(g)}`,fn(){
    const i=it.gems.indexOf(null);if(i<0)return true;
    it.gems[i]=g;P.gems[k]--;recalc();Snd.level();toast(`${gemName(g)} set in ${it.name}`,GEMS[g.t].c);
    ui=it.gems.includes(null)?pickGemMenu(it):insertGemMenu();return true}}});
  if(!opts.length)opts.push({t:'(you have no gems)',fn(){return true}});
  opts.push(back(insertGemMenu));
  return menu(`Which gem for ${it.name}?`,opts,true,gemLine);
}
function removeGemMenu(){
  const cost={gold:40+P.lvl*3},opts=[];
  for(const{it,tag}of entries(i=>i.gems&&i.gems.some(Boolean)))it.gems.forEach((g,gi)=>{if(!g)return;opts.push({t:()=>`[${tag}] ${it.name}: ${gemName(g)}  (${cost.gold}g)`,fn(){
    if(!canPay(cost)){toast('Not enough gold','#ff8070');return true}
    pay(cost);it.gems[gi]=null;recalc();Snd.coin();toast('Gem crushed','#ffb070');ui=removeGemMenu();return true}})});
  if(!opts.length)opts.push({t:'(no socketed gems)',fn(){return true}});
  opts.push(back(socketMenu));
  return menu('Remove which gem?',opts,true,matsLine);
}
function combineGemMenu(){
  const opts=Object.keys(P.gems).filter(k=>P.gems[k]>=3&&+k.slice(-1)<3).map(k=>{
    const g=gemFromKey(k),cost={gold:25*g.tier};
    return{t:()=>`3x ${gemName(g)}  ->  ${gemName({t:g.t,tier:g.tier+1})}  (${cost.gold}g)`,fn(){
      if(!canPay(cost)){toast('Not enough gold','#ff8070');return true}
      pay(cost);P.gems[k]-=3;addGem({t:g.t,tier:g.tier+1});Snd.level();toast('A finer gem!',GEMS[g.t].c);ui=combineGemMenu();return true}};
  });
  if(!opts.length)opts.push({t:'(you need 3 gems of the same kind and tier)',fn(){return true}});
  opts.push(back(socketMenu));
  return menu('Combine which gems?',opts,true,gemLine);
}
function salvageMenu(){
  const opts=entries(i=>!i.lock,true).map(({it})=>({
    t:()=>`${it.name}  ->  ${costText(salvageYield(it))}`,
    fn(){const y=salvageYield(it);const i=P.bag.indexOf(it);if(i<0)return true;P.bag.splice(i,1);for(const k in y)addMat(k,y[k]);Snd.coin();toast('Salvaged: '+costText(y));ui=salvageMenu();return true}}));
  if(!opts.length)opts.push({t:'(bag is empty)',fn(){return true}});
  opts.push(back(smithMenu));
  return menu('Salvage which item?',opts,true,matsLine);
}

// ---------- buffs (elixirs and meals) ----------
function addBuff(cat,name,mods,secs){
  P.buffs=P.buffs.filter(b=>b.cat!==cat);
  P.buffs.push({cat,name,mods,t:secs});recalc();Snd.pickup();toast(secs<120?`${name} (${secs}s)`:`${name} (${Math.round(secs/60)} min)`,'#8fd0ff');
}

// ---------- Alchemist ----------
function alchMenu(){
  const lv=()=>baseLv('alch');
  const brew=(n,cost,label)=>({t:()=>`${label}  (${costText(cost)})   you have ${P.potions}/${potCap()}`,fn(){
    if(P.potions+n>potCap()){toast('You cannot carry more potions','#ff8070');return true}
    if(!canPay(cost)){toast('Not enough materials','#ff8070');return true}
    pay(cost);P.potions+=n;Snd.pickup();return true}});
  const elixir=(cat,name,cost,mods,need)=>({t:()=>lv()<need?`${name}  (needs Alchemist Lv ${need})`:`${name}: ${Object.keys(mods(lv())).map(k=>MODLABEL[k]?MODLABEL[k](mods(lv())[k]):k).join(', ')}  (${costText(cost)})`,fn(){
    if(lv()<need){toast(`Upgrade the Alchemist to Lv ${need}`,'#ff8070');return true}
    if(!canPay(cost)){toast('Not enough materials','#ff8070');return true}
    pay(cost);addBuff(cat,name,mods(lv()),300);return true}});
  return menu(()=>`Alchemist Lv ${lv()}`,[
    {t:()=>`Buy Healing Potion  20g   (you have ${P.potions}/${potCap()})`,fn(){if(P.gold<20||P.potions>=potCap()){toast(P.potions>=potCap()?'You cannot carry more':'Not enough gold','#ff8070');return true}P.gold-=20;P.potions++;Snd.coin();return true}},
    brew(1,{herb:2},'Brew 1 potion'),brew(5,{herb:8},'Brew 5 potions'),
    elixir('elixir','Elixir of Might',{herb:3,shell:1},l=>({dmgPct:10*l}),2),
    elixir('elixir','Elixir of Stone',{herb:3,leather:1},l=>({armor:10*l-5}),2),
    {t:'Consumables: Focus Draught, bombs, scrolls, tonics...',fn(){ui=consMenu();return true}},
    upgradeOption('alch'),
    {t:'Leave',fn(){}}],true,matsLine);
}
function consMenu(){
  const lv=baseLv('alch'),cap=9+3*(lv-1);
  const item=(id,cost,need)=>({t:()=>lv<need?`${CONS[id].n}  (needs Alchemist Lv ${need})`:`${CONS[id].n}  (${costText(cost)})  have ${P.cons[id]||0}/${cap}`,fn(){
    if(lv<need){toast(`Upgrade the Alchemist to Lv ${need}`,'#ff8070');return true}
    if((P.cons[id]||0)>=cap){toast('You cannot carry more','#ff8070');return true}
    if(!canPay(cost)){toast('Not enough materials','#ff8070');return true}
    pay(cost);addCons(id);Snd.pickup();return true}});
  return menu('Alchemist: consumables',[
    item('respot',{herb:2,gold:15},1),item('bomb',{ore:2,shell:1,gold:20},1),item('scroll',{shell:1,gold:60},1),
    item('swift',{herb:3,leather:1},2),item('stone',{ore:2,herb:2},2),
    back(alchMenu)],true,()=>CONSORDER.map(id=>`${CONS[id].n.split(' ')[0]} ${P.cons[id]||0}`).join('  '));
}

// ---------- Tavern ----------
function tavernMenu(){
  const lv=()=>baseLv('tavern'),dur=()=>300+120*(lv()-1);
  const meal=(name,cost,mods,need)=>({t:()=>lv()<need?`${name}  (needs Tavern Lv ${need})`:`${name}: ${Object.keys(mods(lv())).map(k=>MODLABEL[k]?MODLABEL[k](mods(lv())[k]):k).join(', ')}  (${costText(cost)})`,fn(){
    if(lv()<need){toast(`Upgrade the Tavern to Lv ${need}`,'#ff8070');return true}
    if(!canPay(cost)){toast('Not enough materials','#ff8070');return true}
    pay(cost);addBuff('meal',name,mods(lv()),dur());return true}});
  return menu(()=>`Tavern Lv ${lv()}`,[
    {t:'Rest and save game (free)',fn(){P.hp=P.maxHp;P.res=0;save();toast('Fully rested. Game saved.');Snd.level();return true}},
    meal('Spiced Stew',{gold:25,herb:2},l=>({hpPct:15+5*l,regenHp:1.5}),1),
    meal('Autumn Cider',{gold:20,herb:1},l=>({xpPct:10+5*l}),1),
    meal('Hunter\'s Roast',{gold:45,shell:1,leather:1},l=>({dmgPct:8+3*l,crit:4}),2),
    upgradeOption('tavern'),
    {t:'Leave',fn(){}}],true,matsLine);
}

// ---------- Storehouse ----------
function storeMenu(){
  return menu(()=>`Storehouse Lv ${baseLv('store')}`,[
    {t:()=>`Bag capacity: ${bagCap()} slots   (you carry ${P.bag.length})`,fn(){return true}},
    upgradeOption('store'),
    {t:'Leave',fn(){}}],true,matsLine);
}
