'use strict';
// ================= Quests: one per region NPC, a repeatable bounty board, elite modifiers, New Game+ =================
const QDEFS={
  glade:{id:'q_glade',name:'Beetle Trouble',type:'kill',target:'beetle',count:10,ask:['The beetles are eating my kindling, and my kindling is my living. Could you thin them out?','Ten Ember Beetles should do it.'],turn:'Ten fewer beetles! My woodpile thanks you.'},
  amber:{id:'q_amber',name:'Sporecap Trouble',type:'kill',target:'shroom',count:12,ask:['The Nutmeg Shroomlings trample my remedy beds, and I cannot walk to my herbs safely. Please clear out twelve of them.'],turn:'Twelve fewer shroomlings. My remedy beds are safe again.'},
  marsh:{id:'q_marsh',name:'Night Wailers',type:'kill',target:'bat',count:10,ask:['The bats come at night and scare the reeds out of the water. Please drive ten of them off.'],turn:'It is quieter already. Thank you.'},
  rust:{id:'q_rust',name:'Pests of the Shafts',type:'kill',target:'beetle',count:15,ask:['Beetles have taken over the old shafts and nobody can reach the ore. Clear out fifteen of them and I will make it worth your while.'],turn:'Fifteen beetles gone. The shafts are ours again.'},
  grove:{id:'q_grove',name:'Restless Dead',type:'kill',target:'skeleton',count:10,ask:['I keep burying the same bones. Lay ten of the Grave Walkers to rest for good.'],turn:'Ten graves less to dig. May they sleep.'},
  heart:{id:'q_heart',name:'The Hermit\'s Peace',type:'kill',target:'*',zone:'heart',count:15,ask:['The creatures here disturb the Heart. Defeat fifteen of them within the Heart of Spicewood.'],turn:'The Heart rests easier. Thank you, hero.'},
  saffron:{id:'q_saffron',name:'Wolves at the Fence',type:'kill',target:'wolf',count:10,ask:['Wolves keep chewing through my plough harness at night. Put ten of them down and the oxen can rest.'],turn:'Ten wolves fewer. The oxen will be pleased.'},
  ember:{id:'q_ember',name:'Cold Forge',type:'kill',target:'skeleton',count:12,ask:['I am trying to relight the old forge, but the Ash Knights keep stamping out the coals. Lay twelve of them to rest.'],turn:'Twelve down. Now we will see if the fire still remembers.'},
  tangle:{id:'q_tangle',name:'Thornback Hunt',type:'kill',target:'thornbrute',count:6,ask:['Thornback Brutes are trampling the trail. Take down six of them and the road is safe again.'],turn:'Six brutes down! The trail is ours.'},
  delta:{id:'q_delta',name:'Spice Run',type:'kill',target:'shroom',count:15,ask:['Cinnamon sprites have eaten my stock. Chase fifteen of them off and I will blend you something special.'],turn:'Fifteen sprites fewer! The blend smells wonderful.'},
  mesa:{id:'q_mesa',name:'Dune Beetle Plague',type:'kill',target:'sandbeetle',count:10,ask:['Dune Beetles have chewed through my tents. Please rid the mesa of ten of them.'],turn:'Ten beetles gone. My tents survive another season.'},
  steppe:{id:'q_steppe',name:'Sheep-Snatchers',type:'kill',target:'stormbat',count:10,ask:['Storm Bats carry my lambs off. Bring me the heads of ten of them. Or whatever is left.'],turn:'The flock sleeps well tonight.'},
  spire:{id:'q_spire',name:'Slag Brutes',type:'kill',target:'magmabrute',count:6,ask:['The Magma Brutes crawl up from the lower tunnels. Kill six of them, and we may cross the Spire safely.'],turn:'Six brutes cooled. The Spire breathes easier.'},
  gulch:{id:'q_gulch',name:'Trapped Light',type:'kill',target:'crystalghost',count:8,ask:['The Crystal Wraiths are lost souls caught in the glass. Release eight of them.'],turn:'Eight souls free. The gulch is dimmer, and kinder.'},
  ridge:{id:'q_ridge',name:'Frostbitten',type:'kill',target:'frostwolf',count:8,ask:['Frost Wolves have gotten bold since the Warden stopped hunting them. Cull eight and I will make it worth your while.'],turn:'The wolves will think twice now.'}
};
const qDefOf=id=>{for(const z in QDEFS)if(QDEFS[z].id===id)return QDEFS[z];return null};
const qLevel=q=>{const z=Object.keys(QDEFS).find(k=>QDEFS[k]===q);return ZSPEC[z]?Math.round((ZSPEC[z].lvl[0]+ZSPEC[z].lvl[1])/2):10};
function qState(q){return flags.q&&flags.q[q.id]}
function qDoneCheck(q,st){return st.p>=q.count}
function qProgress(q,st){
  const n=Math.min(q.count,st.p||0);
  const what=q.target==='*'?'creatures':(ENEMIES[q.target]?ENEMIES[q.target].name:q.target);
  return`Defeat ${what}: ${n}/${q.count}`;
}
function claimQuest(q,st){
  const L=qLevel(q);
  st.s=2;
  const gold=L*30;
  P.gold+=gold;
  if(P.potions<potCap())P.potions++;
  Snd.level();toast(`Quest complete: ${q.name}! +${gold}g and a potion`,'#f0d890');save();
}
// returns true when the NPC conversation was a quest conversation
function znQuest(n){
  const q=QDEFS[n.zone];if(!q)return false;
  flags.q=flags.q||{};const st=flags.q[q.id];
  if(!st){
    say(n.name,q.ask,()=>{ui=menu(q.name,[{t:'Accept the quest',fn(){flags.q[q.id]={s:1,p:0};toast('Quest accepted: '+q.name,'#f0d890');Snd.pickup();save()}},{t:'Not now',fn(){}}],true)});
    return true;
  }
  if(st.s===1){
    if(qDoneCheck(q,st))say(n.name,[q.turn],()=>claimQuest(q,st));
    else say(n.name,[q.name+'. '+qProgress(q,st)]);
    return true;
  }
  return false;
}
function questKill(e){
  if(flags.q)for(const z in QDEFS){
    const q=QDEFS[z],st=flags.q[q.id];
    if(!st||st.s!==1||q.type!=='kill')continue;
    if(q.zone&&q.zone!==curZone())continue;
    if(q.target!=='*'&&q.target!==e.type)continue;
    if(st.p<q.count){st.p++;if(st.p===q.count)toast(`Quest ready: ${q.name}. Return to the NPC.`,'#f0d890')}
  }
  const b=flags.bounty;
  if(b&&!b.done&&b.type===e.type){b.p++;if(b.p>=b.count){b.done=true;toast('Bounty complete! Claim it at the board in Hearthmoor.','#f0d890')}}
}
function activeQuestLines(){
  const L=[];
  if(flags.q)for(const z in QDEFS){const q=QDEFS[z],st=flags.q[q.id];if(st&&st.s===1&&L.length<2)L.push(`${q.name}: ${Math.min(q.count,st.p||0)}/${q.count}`)}
  const b=flags.bounty;if(b&&!b.done)L.push(`Bounty: ${b.name} ${b.p}/${b.count}`);else if(b&&b.done)L.push('Bounty ready: claim it in Hearthmoor');
  return L;
}

// ---------- bounty board (repeatable) ----------
function bountyOptions(){
  const types=new Set();
  for(const z in flags.seen)if(flags.seen[z]&&ZSPEC[z])for(const t of ZSPEC[z].foes)types.add(t);
  if(!types.size)for(const t of['beetle','wolf','shroom'])types.add(t);
  const arr=[...types].filter(t=>ENEMIES[t]),opts=[];
  for(let i=0;i<3&&arr.length;i++){
    const t=arr.splice(Math.floor(Math.random()*arr.length),1)[0],d=ENEMIES[t],count=12+Math.floor(Math.random()*9);
    opts.push({type:t,count,p:0,done:false,name:`${count} ${d.name}`,gold:Math.round(count*(8+d.xp*1.4+P.lvl*2)),lvl:Math.max(1,P.lvl)});
  }
  return opts;
}
function useBoard(){
  const b=flags.bounty;
  if(!b){
    const opts=bountyOptions();
    ui=menu('Bounty board: choose a contract',opts.map(o=>({t:`Defeat ${o.name}  -  ${o.gold}g`,fn(){flags.bounty=o;toast('Bounty accepted','#f0d890');Snd.pickup();save()}})).concat([{t:'Leave',fn(){}}]),true);
    return;
  }
  if(b.done){
    say('Bounty board',[`Contract fulfilled: ${b.name}. Payment: ${b.gold} gold.`],()=>{
      P.gold+=b.gold;
      flags.bounty=null;Snd.level();toast(`Bounty paid: +${b.gold}g`,'#f0d890');save();
    });
    return;
  }
  ui=menu('Bounty board',[{t:`Active: ${b.name}  (${b.p}/${b.count})`,fn(){return true}},{t:'Abandon this contract',fn(){flags.bounty=null;toast('Contract abandoned','#ff8070')}},{t:'Leave',fn(){}}],true);
}

// ---------- elite modifiers ----------
const ELITEMOD={swift:{n:'Swift',c:'#80e0ff'},tough:{n:'Tough',c:'#c0b090'},vamp:{n:'Vampiric',c:'#e05070'},boom:{n:'Explosive',c:'#ff9030'}};
function applyEliteMod(e){
  const k=Object.keys(ELITEMOD)[Math.floor(Math.random()*4)];
  e.mod=k;
  if(k==='swift'){e.speed*=1.35}
  else if(k==='tough'){e.hp=e.maxHp=Math.round(e.maxHp*1.5)}
}

// ---------- New Game+ ----------
function ngpAvailable(){return slots().some(i=>i&&i.won)}
function startNgPlus(slot,seed){   // seed: the new world of this run (New Game+ never reuses the old one)
  if(!loadGame(slot,seed===undefined?newWorldSeed():seed)){toast('Could not load save');return}
  const keep={spice:flags.spice,meals:flags.meals,tr:flags.tr,trStarted:flags.trStarted,fairBest:flags.fairBest,fairMet:flags.fairMet,fairIntro:flags.fairIntro,cookIntro:flags.cookIntro,lore:flags.lore,fruits:flags.fruits,ftrees:flags.ftrees,satchel:flags.satchel,scrolls:flags.scrolls,jar:flags.jar,base:flags.base,ngp:(flags.ngp||0)+1,won:true,trueEnd:flags.trueEnd,
    sickle:true,boots:true,hook:true,bow:true,lantern:true,heartseed:true,windcharm:true,emberglove:true,heraldwing:true,slagwalkers:true,briarkey:true,dunegoggles:true,sunstone:true,truthglass:true,oathcrown:true,wp:flags.wp,seen:flags.seen,sc:flags.sc,bond:flags.bond,charm:flags.charm,lia:flags.lia,stage:32,rewarded:true,midShown:true,letters:Object.fromEntries(LETTERS.map((_,i)=>[i,true]))};
  flags=Object.assign(defaultFlags(),keep);
  P.keys=0;
  scene='play';ui=null;
  loadMap(...toVillage());
  P.hp=P.maxHp;
  showStory([`New Game+ ${flags.ngp}. The forest has grown wild again, and its creatures are stronger than ever.`,'Every guardian has returned. Their treasure is richer. Your gear, skills and key items come with you.'],null,'NEW GAME+');
  save();
}
