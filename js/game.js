'use strict';
// ======================= Spicewood: vertical slice =======================
const cv=document.getElementById('c'),cx=cv.getContext('2d');
cv.width=W*2;cv.height=H*2;cx.imageSmoothingEnabled=false;

let scene='title',tsel=0,hsel=0,time=0;
let P=null,M=null,E=[],PR=[],EP=[],DR=[],FX=[],FT=[],NP=[],CH=[],toasts=[];
let DELAY=[],TRAPS=[],hitCount=0,hitStop=0,ui=null,shake=0,banner={t:0,text:''},regions=[],lastTouchOverlay=false;
let flags=null;
const fade={a:0,dir:0,fn:null};
const cam={x:0,y:0};
const MAXLVL=40;
const QUEST=['Talk to Elder Maren in the village','Find the Hollow Oak in Ember Glade','Defeat Old Barkfather in the Hollow Oak','Return to Elder Maren','Cut the thorn vines on the south road of Ember Glade','Find the Spore Warren in Amber Hollow','Wade through the flooded ford west of Amber Hollow','Find the Sunken Shrine in Mistwater Marsh','Cross the gorge at the west edge of the marsh with your Grapple Hook','Find the Rustpeak Mine in Rustpeak','Take the Miner\'s Lantern through the dark tunnel north of Ember Glade (Saffron Meadows)','Find the Gilded Granary in Saffron Meadows','Follow the wind pass north of Saffron Meadows with the Windcharm','Find the Gale Citadel on the Windward Steppe','Cross the Wind Chasm west of the steppe with the Heraldwing','Find the Magma Core in the Smolder Spire','Cross the Slag Gate south of the Spire in your Slagwalkers','Find the Cinder Forge in Cinderfall Heights','Burn the thorn wall east of Ember Glade with the Ember Glove','Find the Rootmaw in the Tanglewood Depths','Open the Briar Gate south of the Tanglewood with the Briar Key','Find the Great Spice Cellar in the Spice Delta','Cross the sandstorm east of Saffron Meadows in your Dune Goggles','Find the Sunken Sandhall on the Sunbaked Mesa','Part the Crystal Veil north of the Mesa with the Sunstone','Find the Prism Vault in Crystal Gulch','Find the hidden door north of Rustpeak with the Truthglass','Find the Ghostbark Crypt in the grove','Open the Frost Gate west of the Smolder Spire with the Oathcrown','Find the Frozen Reliquary in the Hoarfrost Ridge','Carry the Heartseed through the Frozen Roots to the Heart of Spicewood','End the blight at the Heart of Spicewood','The Spicewood is saved! Roam freely and grow stronger'];
const BOSSES={
  barkfather:{name:'Old Barkfather',epi:'Guardian of the Hollow Oak',flag:'boss',stage:3,msg:'Old Barkfather has fallen!',lines:['The bark splits and roots lash out!','"THE FOREST WILL NOT BE TAKEN!"'],last:['The old guardian sinks to his knees.','"Wren swore to guard this forest, child. I am the oath he left behind. The blight does not flow from me. It flows from the Heart of the woods. End it... please."']},
  mycelia:{name:'Mother Mycelia',epi:'Mother of a Thousand Spores',flag:'boss2',stage:6,msg:'Mother Mycelia has withered!',lines:['Spore pods burst along the walls!','Mycelia shrieks and the whole warren answers.'],last:['"Sorrel fed me from the Heart, and then forgot me. I only wanted... to grow."','The spores fade. A deep hum remains. The Heart is hurting, and she remembered it for all of us.']},
  drowned:{name:'The Drowned Matron',epi:'Matron of the Sunken Shrine',flag:'boss3',stage:8,msg:'The Drowned Matron sinks back into the deep!',lines:['The water rises around her!','The Matron wails. The shrine floods with echoes.'],last:['"Ysolt sang me the tide-song before she bound me. The tide remembers the Heart. It calls us all home..."','She dissolves into the dark water. Scratched into the shrine stone is a name: Ysolt Vane.']},
  warden:{name:'The Rust Warden',epi:'Iron Keeper of Rustpeak',flag:'boss4',stage:10,msg:'The Rust Warden crumbles to scrap!',lines:['Rust flakes off in sheets. He rises higher!','The Warden burns with fury: "NO ONE PASSES!"'],last:['"Halvard forged my chains. I kept the shafts sealed... but the blight came from above, not below."','"Take the lantern. And watch the one who sent you. A debt is a chain, too."']},
  king:{name:'The Hollow King',epi:'Ruler of the Ghostbark Dead',flag:'boss5',stage:28,msg:'The Hollow King falls to dust!',lines:['His crown flares. The court of the dead rises!','"KNEEL!" The crypt itself shudders.'],last:['The Hollow King sinks into dust.','"Protect, never take. I kept the oath until I forgot everything else."']},
  harvest:{name:'The Harvest King',epi:'Lord of the Gilded Granary',flag:'boss7',stage:12,msg:'The Harvest King crumbles into chaff!',lines:['Sacks burst open and grain whirls through the air!','"THE HARVEST IS MINE!"'],last:['"Edda wrote my orders in her ledger: keep the Tithe safe. I only kept it safe... they would have starved me..."','The scarecrow king falls apart. Golden grain pours out of him, and it smells of old smoke. Among the grain lies a ledger page headed: Maren.']},
  cinder:{name:'The Cinder Colossus',epi:'Furnace Guardian of Cinderfall',flag:'boss8',stage:18,msg:'The Cinder Colossus goes cold!',lines:['Vents burst open, and the forge roars!','The Colossus glows white-hot!'],last:['The Colossus kneels, and its fires gutter out.','A dying voice from within: "Guard... the Heart... for ever..." The blight began as a promise to protect.']},
  storm:{name:'The Storm Herald',epi:'Voice of the Windward Steppe',flag:'boss9',stage:14,msg:'The Storm Herald scatters on the wind!',lines:['Lightning splits the sky!','"THE WIND OBEYS ME!"'],last:['The Herald dissolves into drifting feathers.','"I only carried the news. Wren taught me one word, and I have carried it for ever: Heart. Lately there is another one, too: Maren."']},
  magma:{name:'The Magma Tyrant',epi:'Lord of the Smolder Spire',flag:'boss10',stage:16,msg:'The Magma Tyrant cools to stone!',lines:['Lava surges up through the floor!','"BURN! BURN IT ALL!"'],last:['The tyrant\'s fires gutter out.','"Pell wanted a crown. We fed the Heart our fire, and it never gave anything back. Ask the other tyrant, in the sand. He will tell you the rest."']},
  frost:{name:'The Winter Warden',epi:'Keeper of the Hoarfrost Ridge',flag:'boss11',stage:30,msg:'The Winter Warden shatters like ice!',lines:['The air freezes solid!','"THE COLD REMEMBERS EVERYTHING."'],last:['Frost melts from the Warden\'s crown.','"Winter was never the enemy. It was only the blight\'s shadow. Take the seed. Corwin chose you."']},
  prism:{name:'The Prism Wraith',epi:'Light Trapped in Crystal Gulch',flag:'boss12',stage:26,msg:'The Prism Wraith shatters into light!',lines:['The crystals ring and the light splits!','The Wraith breaks into a hundred reflections!'],last:['The light finally escapes into the sky.','"Thank you... it was so bright in there."']},
  sand:{name:'The Sand Tyrant',epi:'King of the Sunbaked Mesa',flag:'boss13',stage:24,msg:'The Sand Tyrant crumbles to dust!',lines:['The dunes rise up around you!','"THE SANDS TAKE ALL!"'],last:['The Tyrant crumbles to grains.','"We were buried... all of us... by the roots of the Heart. The Maren woman knows where the tap is. Stop her."']},
  thorn:{name:'The Thorn Matriarch',epi:'Mother of the Tanglewood',flag:'boss14',stage:20,msg:'The Thorn Matriarch withers!',lines:['Thorns burst from every root!','"MY CHILDREN, TAKE THEM!"'],last:['The Matriarch withers.','"Sorrel gave me life from the Heart\'s own sap. The woods grew wild when the Heart grew sick..."']},
  baron:{name:'The Pepper Baron',epi:'Lord of the Great Spice Cellar',flag:'boss15',stage:22,msg:'The Pepper Baron sneezes his last!',lines:['Spice clouds fill the cellar!','"ACHOO... I MEAN, PERISH!"'],last:['The Baron sneezes one last time.','"Edda made me keeper of the spice. The finest spices... all gone to the Heart..." Behind him stands a barrel stamped with a family crest: Maren.']},
  heartwood:{name:'The Heartwood',epi:'The Blighted Heart',flag:'boss6',stage:31,msg:'The Heartwood falls, and the blight lifts!',lines:['The Heartwood bleeds golden sap!','The whole grove screams as roots erupt!'],last:['The Heartwood sighs. Warmth spreads through the roots.']},
  maren:{name:'Elder Maren',epi:'The Tithe-Binder',flag:'boss16',stage:32,msg:'Maren falls, and the Heart lets go!',lines:['Roots lash out of the ground, and the Tithe Guard rises from the soil!','"NINE GENERATIONS WILL NOT END WITH A CHILD!"'],last:['Maren falls to her knees. The golden roots loosen their grip.','"Nine generations... for what?"']}
};
const bossOf=e=>BOSSES[e.variant||'barkfather'];
// ---- Link's Awakening style fights: a guarded enemy takes almost no damage until its trick opens it up, so spamming does nothing.
// on: what opens it ('charge' = after its rush, 'slam' = after its ground slam, 'spores' = after its volley, 'shot' = after it spits, 'adds' = when its escorts are dead);
// rear: only the back is soft (it turns slowly, so circle around it); guard: damage taken while closed; dur: seconds it stays open.
const BOSSKIT={
  barkfather:{guard:.12,on:['charge'],dur:3.4,hint:'Dodge its charge, then strike while it is stuck!'},
  mycelia:{guard:.15,on:['adds'],dur:4,hint:'Burst the spore pods to open her guard!'},
  drowned:{guard:.18,rear:true,turn:1.3,dur:0,hint:'Her front is armored. Strike her from behind!'},
  warden:{guard:.08,on:['charge'],rear:true,turn:1.6,dur:3,hint:'Rust plates cover his front. Let him ram, or circle behind!'},
  king:{guard:.12,on:['adds'],dur:4,hint:'Cut down his court to break his crown guard!'},
  harvest:{guard:.1,on:['slam'],dur:3.2,hint:'His flail sticks in the ground. Hit him then!'},
  cinder:{guard:.1,on:['slam'],rear:true,turn:1.3,dur:3,hint:'Wait for the slam to cool it, or hit its back!'},
  storm:{guard:.12,on:['adds'],dur:4,hint:'Clear the storm bats to ground the Herald!'},
  magma:{guard:.06,on:['charge','slam'],dur:3,hint:'Let it exhaust itself on a charge or slam, then strike!'},
  frost:{guard:.12,on:['adds'],rear:true,turn:1.4,dur:3.5,hint:'Break the wolf pack, or strike his back!'},
  prism:{guard:.08,on:['adds'],dur:4,hint:'Shatter the crystal shades to expose the Wraith!'},
  sand:{guard:.07,on:['charge'],rear:true,turn:1.7,dur:3,hint:'He rams. Strike him while he is buried, or from behind!'},
  thorn:{guard:.12,on:['adds'],dur:4,hint:'Kill her thorn children to open her bark!'},
  baron:{guard:.08,on:['spores'],dur:3.4,hint:'His spice volley makes him sneeze. Strike then!'},
  heartwood:{guard:.06,on:['slam','adds'],dur:3.6,hint:'Cut down its root guards, or wait for the slam to crack the bark!'},
  maren:{guard:.1,on:['slam','adds'],dur:3.4,hint:'Her Tithe Guard shields her. Cut them down, or strike after her slam!'}
};
const MINIKIT={
  charge:{guard:.15,on:['charge'],dur:2.6,hint:'Dodge the rush, then strike!'},
  slam:{guard:.15,on:['slam'],dur:2.6,hint:'Dodge the slam, then strike!'},
  shot:{guard:.15,on:['shot'],dur:2.4,hint:'Strike it right after it spits!'},
  rear:{guard:.15,rear:true,turn:1.5,dur:0,hint:'Its front is armored. Circle behind it!'}
};
const MINIKIT_OF={beetle:'charge',sandbeetle:'charge',skeleton:'charge',frostskel:'charge',bat:'charge',stormbat:'charge',ghost:'charge',crystalghost:'charge',brute:'slam',thornbrute:'slam',magmabrute:'slam',shroom:'shot',wolf:'rear',frostwolf:'rear'};
// damage multiplier of a guarded enemy for a hit from direction (dx,dy) (player to enemy)
function kitMult(e,dx,dy){
  const k=e.kit;if(!k)return 1;
  if(e.weak>0)return 1.6;
  if(e.shielded)return .05;
  if(k.rear){const l=Math.hypot(dx,dy)||1;if((dx*e.fx+dy*e.fy)/l>.3)return 1.3}
  return k.guard;
}
const BOSSSPR={mycelia:'boss2',drowned:'boss3',warden:'boss4',king:'boss5',heartwood:'boss6',maren:'boss16',harvest:'boss7',cinder:'boss8',storm:'boss9',magma:'boss10',frost:'boss11',prism:'boss12',sand:'boss13',thorn:'boss14',baron:'boss15'};
const SAVE_KEYS=['spicewood_save_v1','spicewood_save_s1','spicewood_save_s2'];   // slot 1 keeps the key of the old single save
let curSlot=0;try{curSlot=Math.max(0,Math.min(2,+localStorage.getItem('spicewood_slot')||0))}catch(e){}
const slotCache={t:-1e9,v:[]};
const SAVE_VER=9;   // 2 = grid world (village in the centre); older saves are moved to their zone's waypoint
const defaultFlags=()=>({sc:{},bond:0,charm:false,lia:{},stage:0,boss:false,sickle:false,chests:{},dun:{},cut:{},boss2:false,boots:false,boss3:false,boss4:false,boss5:false,boss6:false,hook:false,lantern:false,heartseed:false,rewarded:false,base:{smithy:1,alch:1,tavern:1,store:1},wp:{village:true},seen:{},scMarsh:false,scGrove:false,scNorth:false,boss7:false,boss8:false,boss9:false,boss10:false,boss11:false,boss12:false,boss13:false,boss14:false,boss15:false,windcharm:false,emberglove:false,heraldwing:false,slagwalkers:false,briarkey:false,dunegoggles:false,sunstone:false,truthglass:false,oathcrown:false,boss16:false,betrayed:false,seedTaken:false,letters:{},fruits:0});
// the main road is one fixed chain of bosses (DESIGN.md). Old saves: derive the new gate items and the quest stage from the bosses already beaten.
const BOSSCHAIN=[['boss',3],['boss2',6],['boss3',8],['boss4',10],['boss7',12],['boss9',14],['boss10',16],['boss8',18],['boss14',20],['boss15',22],['boss13',24],['boss12',26],['boss5',28],['boss11',30],['boss6',32]];
function migrateFlags(v){
  if(flags.sword===undefined){const adv=flags.stage>=1;flags.sword=adv;flags.shield=adv;flags.tut=adv?3:0}
  if(flags.won&&flags.boss6)flags.boss16=true;   // finished before Maren became the last boss
  if(v>=8)return;
  const L={boss9:'heraldwing',boss10:'slagwalkers',boss14:'briarkey',boss15:'dunegoggles',boss13:'sunstone',boss12:'truthglass',boss5:'oathcrown',boss11:'heartseed'};
  for(const b in L)flags[L[b]]=!!flags[b];
  if(flags.boss7)flags.windcharm=true;if(flags.boss8)flags.emberglove=true;
  if(flags.boss6){flags.won=true;for(const k of['heraldwing','slagwalkers','briarkey','dunegoggles','sunstone','truthglass','oathcrown','heartseed'])flags[k]=true}
  let st=Math.min(flags.stage||0,10);
  for(const[b,n]of BOSSCHAIN)if(flags[b]&&n>st)st=n;
  flags.stage=st;
}
// World grid: village in the centre. Links: item = what opens the way (or the shortcut flag).
const WORLD={
  village:{c:1,r:2,name:'Hearthmoor',col:'#e0a050'},glade:{c:2,r:2,name:'Ember Glade',col:'#c85a2a'},amber:{c:2,r:3,name:'Amber Hollow',col:'#d8a020'},
  marsh:{c:1,r:3,name:'Mistwater Marsh',col:'#4a9a8a'},rust:{c:0,r:3,name:'Rustpeak',col:'#a8704a'},grove:{c:0,r:2,name:'Ghostbark Grove',col:'#7a8ac8'},
  heart:{c:0,r:1,name:'Heart of Spicewood',col:'#d8a030'},saffron:{c:2,r:1,name:'Saffron Meadows',col:'#e0c040'},ember:{c:1,r:1,name:'Cinderfall Heights',col:'#c8503a'},
  tangle:{c:3,r:2,name:'Tanglewood Depths',col:'#3a8a3a'},delta:{c:3,r:3,name:'Spice Delta',col:'#d8a870'},mesa:{c:3,r:1,name:'Sunbaked Mesa',col:'#d8b070'},
  steppe:{c:2,r:0,name:'Windward Steppe',col:'#a8c860'},spire:{c:1,r:0,name:'Smolder Spire',col:'#8a3a3a'},gulch:{c:3,r:0,name:'Crystal Gulch',col:'#9a78d8'},
  ridge:{c:0,r:0,name:'Hoarfrost Ridge',col:'#a8c8e8'}
};
const WLINKS=[['village','glade',null],['glade','amber','sickle'],['amber','marsh','boots'],['marsh','rust','hook'],['rust','grove','truthglass'],['grove','heart','heartseed'],['marsh','village','scMarsh'],['grove','village','scGrove'],['glade','saffron','lantern'],['saffron','ember','slagwalkers'],['ember','village','scNorth'],['heart','ridge','heartseed'],['ridge','spire','oathcrown'],['spire','steppe','heraldwing'],['steppe','gulch','sunstone'],['gulch','mesa','sunstone'],['spire','ember','slagwalkers'],['saffron','steppe','windcharm'],['saffron','mesa','dunegoggles'],['glade','tangle','emberglove'],['tangle','mesa','dunegoggles'],['tangle','delta','briarkey'],['amber','delta','briarkey']];
const ITEMNAME={sickle:'Thornsickle',boots:'Wooden Boots',hook:'Grapple Hook',lantern:'Lantern',heartseed:'Heartseed',scMarsh:'Boulder',scGrove:'Boulder',scNorth:'Boulder',windcharm:'Windcharm',emberglove:'Ember Glove',heraldwing:'Heraldwing',slagwalkers:'Slagwalkers',briarkey:'Briar Key',dunegoggles:'Dune Goggles',sunstone:'Sunstone',truthglass:'Truthglass',oathcrown:'Oathcrown'};
const zoneOf=id=>id.startsWith('grotto_')?id.slice(7):id;
const ZONEMUSIC={village:'village',glade:'forest',amber:'forest',marsh:'marsh',dungeon:'dungeon',spore:'dungeon',shrine:'dungeon',mine:'dungeon',rust:'rust',grove:'grove',crypt:'dungeon',heart:'heart',saffron:'forest',ember:'rust',tangle:'forest',delta:'marsh',mesa:'rust',steppe:'forest',spire:'rust',gulch:'dungeon',ridge:'grove',grotto_village:'dungeon',grotto_glade:'dungeon',grotto_amber:'dungeon',grotto_marsh:'dungeon',grotto_rust:'dungeon'};
const zoneMusic=id=>ZONEMUSIC[id]||'dungeon';
const FONT='"Segoe UI",Tahoma,Verdana,Arial,sans-serif';

// ---------- small helpers ----------
function text(s,x,y,c,size,al,bold){
  size=Math.max(size||8,7);
  cx.font='bold '+size+'px '+FONT;cx.textAlign=al||'left';cx.textBaseline='top';
  cx.fillStyle='rgba(0,0,0,.75)';cx.fillText(s,x+1,y+1);
  cx.fillStyle=c||'#fff';cx.fillText(s,x,y);
}
function wrap(s,maxW,size){
  cx.font='bold '+Math.max(size||8,7)+'px '+FONT;
  const out=[];let line='';
  for(const w of s.split(' ')){
    const t=line?line+' '+w:w;
    if(cx.measureText(t).width>maxW&&line){out.push(line);line=w}else line=t;
  }
  if(line)out.push(line);
  return out;
}
function bar(x,y,w,h,f,c,bg){cx.fillStyle=bg||'#1a1008';cx.fillRect(x-1,y-1,w+2,h+2);cx.fillStyle=c;cx.fillRect(x,y,Math.round(w*clamp(f,0,1)),h)}
function panel(x,y,w,h){cx.fillStyle='#1a110a';cx.fillRect(x,y,w,h);cx.strokeStyle='#8a6a3a';cx.lineWidth=1;cx.strokeRect(x+.5,y+.5,w-1,h-1);cx.strokeStyle='#3a2814';cx.strokeRect(x+2.5,y+2.5,w-5,h-5)}
function reg(x,y,w,h,fn){regions.push({x,y,w,h,fn})}
function toast(s,c){toasts.push({s,c:c||'#ffe9a0',t:2.6})}
function floatText(x,y,s,c,big){FT.push({x,y,s:String(s),c,t:.9,big})}
function fx(o){FX.push(o)}
function puff(x,y,n,color,sp){for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(10,(sp||60));FX.push({k:'p',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10,t:rand(.25,.6),c:color,s:Math.random()<.4?2:1})}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// ---------- collision ----------
function solidAt(px,py){
  const tx=Math.floor(px/TS),ty=Math.floor(py/TS);
  if(tx<0||ty<0||tx>=M.w||ty>=M.h)return true;
  const t=M.t[ty*M.w+tx];
  if(t===25)return!(flags&&flags.boots);
  return SOLID[t]===1;
}
function boxFree(x,y,hw,hh){return!(solidAt(x-hw,y-hh)||solidAt(x+hw,y-hh)||solidAt(x-hw,y+hh)||solidAt(x+hw,y+hh))}
function move(e,dx,dy){
  if(dx&&boxFree(e.x+dx,e.y,e.hw,e.hh))e.x+=dx;
  if(dy&&boxFree(e.x,e.y+dy,e.hw,e.hh))e.y+=dy;
}

// ---------- player ----------
function newPlayer(idx){
  const h=HEROES[idx];
  P={heroIdx:idx,hero:h,x:0,y:0,hw:4,hh:3,face:{x:0,y:1},lvl:1,xp:0,pts:0,alloc:{str:0,dex:0,int:0,vit:0},
     gold:0,potions:3,bag:[],eq:{},hp:1,res:0,cd:[0,0,0],atkT:0,rollT:0,rollCd:0,dashT:0,inv:0,anim:0,flash:0,
     rageT:0,potCd:0,swing:0,moving:false,rvx:0,rvy:0,hitSet:null,dead:false,
     mats:{},cons:{},gems:{},quick:[null,null,null],buffs:[],learned:{},ranks:{},runes:{},sp:0,bound:h.skills.map(k=>k.id).concat([null]),cdMax:[1,1,1],buff:null,mods:{},critMult:1.7,stealth:0,dashMult:1.8};
  flags=defaultFlags();
  recalc();P.hp=P.maxHp;
  P.keys=0;
}
function recalc(){
  // fixed progression (see progress.js): the stats follow the story, not XP, points or loot
  const h=P.hero;P.lvl=powerLevel();
  const s={str:h.base.str,dex:h.base.dex,int:h.base.int,vit:h.base.vit};
  s[h.primary]+=P.lvl-1;
  const g=gearNow();
  const md={};
  for(const b of P.buffs||[])for(const k in b.mods)md[k]=(md[k]||0)+b.mods[k];
  md.dodge=Math.min(40,md.dodge||0);md.reducePct=Math.min(60,md.reducePct||0);md.lifesteal=Math.min(25,md.lifesteal||0);
  for(const k of['dodge','reducePct','lifesteal'])if(!md[k])delete md[k];
  P.st=s;P.mods=md;P.im={};P.setCnt={};P.gear=g;
  P.maxHp=Math.round((40+s.vit*6+P.lvl*4)*1.4*(1+(md.hpPct||0)/100))+20*((flags&&flags.fruits)||0);
  P.armor=g.arm+(md.armor||0);P.crit=.05+s.dex*.004+(md.crit||0)/100;P.critMult=1.7+(md.critDmg||0)/100;
  P.spd=70*(1+(md.spdPct||0)/100);
  P.atk=g.dmg+s[h.primary]*.9;
  P.atkCd=h.atkCd*(1-Math.min(.4,s.dex*.004))/(1+(md.atkSpdPct||0)/100);
  P.resMax=h.resMax(s);P.regen=h.regen(s)*(1+(md.regenPct||0)/100);
  P.hp=Math.min(P.hp,P.maxHp);P.res=Math.min(P.res,P.resMax);
}
function gainXp(){}   // no experience in Spicewood (kept so old call sites stay harmless)

// ---------- save / load ----------
function hasSave(){try{return SAVE_KEYS.some(k=>!!localStorage.getItem(k))}catch(e){return false}}
function slotInfo(i){
  try{
    const s=JSON.parse(localStorage.getItem(SAVE_KEYS[i]));if(!s||typeof s.h!=='number')return null;
    const z=s.map==='world'?WORLD[regionAtPx(s.x,s.y)].name:WORLD[s.map]?WORLD[s.map].name:(s.map&&s.map.startsWith('grotto')?'A hidden grotto':s.map&&s.map.startsWith('cave_')?'A cave':'A dungeon');
    return{hero:HEROES[s.h]?HEROES[s.h].name+' the '+HEROES[s.h].cls:'?',color:HEROES[s.h]?HEROES[s.h].color:'#888',lvl:s.lvl,where:z,won:!!(s.flags&&(s.flags.won||s.flags.trueEnd)),ngp:(s.flags&&s.flags.ngp)||0,pt:s.pt||0,true_:!!(s.flags&&s.flags.trueEnd)};
  }catch(e){return null}
}
function slots(){const now=performance.now();if(now-slotCache.t>1000){slotCache.v=[0,1,2].map(slotInfo);slotCache.t=now}return slotCache.v}
const fmtTime=t=>{const m=Math.floor(t/60);return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')+' h'};
function save(){
  if(!P||!M)return;
  try{localStorage.setItem('spicewood_slot',String(curSlot));localStorage.setItem(SAVE_KEYS[curSlot],JSON.stringify({pt:Math.round(P.pt||0),h:P.heroIdx,lvl:P.lvl,gold:P.gold,pot:P.potions,flags,keys:P.keys,map:M.id,x:P.x,y:P.y,hp:P.hp,ws:WORLD_SEED,v:SAVE_VER}));slotCache.t=-1e9;Account.dirty()}catch(e){}
}
function slotSeed(i){try{const s=JSON.parse(localStorage.getItem(SAVE_KEYS[i]));return(s&&s.ws)|0}catch(e){return 0}}   // saves without a seed (older ones) live in the original world, seed 0
// newSeed: New Game+ (the slot keeps its hero but gets a fresh world)
function loadGame(slot,newSeed){
  try{
    if(slot===undefined)slot=curSlot;
    const s=JSON.parse(localStorage.getItem(SAVE_KEYS[slot]));if(!s)return false;
    curSlot=slot;setWorldSeed(newSeed!==undefined?newSeed:(s.ws|0));if(newSeed!==undefined){s.map='world';s.x=null;s.y=null}
    newPlayer(HERO_START);P.pt=s.pt||0;   // one hero for now; the hero index of old saves is ignored
    Object.assign(P,{gold:s.gold||0,potions:s.pot===undefined?3:s.pot});   // old saves: level, XP, gear, skills and materials are dropped, the story progress (bosses, hearts, key items) carries the power
    flags=Object.assign(defaultFlags(),s.flags);migrateFlags(s.v||1);flags.rewarded=flags.rewarded||flags.stage>=4;P.keys=s.keys||0;
    if(flags.cut&&!flags.cut.world&&Object.keys(flags.cut).some(k=>flags.cut[k]))flags.cut.world=true;   // vines were cut per region before; now the sickle opens them all
    recalc();P.hp=Math.min(s.hp||P.maxHp,P.maxHp);
    scene='play';ui=null;toasts=[];
    let mx=s.x,my=s.y;
    if(((s.v||1)<3&&['dungeon','spore','shrine','mine','crypt'].includes(s.map))||((s.v||1)<4&&s.map.startsWith('cave_'))){mx=null;my=null}   // dungeons were rebuilt: enter at the start
    let mapId=s.map;
    if(WORLD[mapId]){   // saved on an old per-region map: put the hero at that region's waypoint in the big world
      ensureWorld();
      if(mapId==='village'){const v=toVillage();mx=v[1];my=v[2]}
      else{const w=WPS[mapId];mx=(w[0]+.5)*TS;my=(w[1]+1.5)*TS;flags.wp[mapId]=true}
      mapId='world';
    }
    loadMap(mapId,mx,my);return true;
  }catch(e){return false}
}


// ---------- soft terrain: pre-render the map and dither tile borders so there are no hard edges ----------
const NOBLEND=new Set([T.WALL,T.ROOF,T.DOOR,T.LOCK,T.OAK,20,21,22]);
const fam=id=>id===17?0:(id===24||id===26)?9:id;
const CHK=32;   // the world map is drawn from chunks of 32x32 tiles (one canvas for the whole map would be far too big)
function renderTiles(x0,y0,tw,th,seed){
  const cw=tw*TS,ch=th*TS;
  const c=document.createElement('canvas');c.width=cw;c.height=ch;
  const g=c.getContext('2d');
  const img=g.createImageData(cw,ch),D=img.data;
  const cache=buildLayer.px||(buildLayer.px={});
  const px=(id,v)=>{const k=id*4+v;return cache[k]||(cache[k]=Spr.tiles[id][v].getContext('2d').getImageData(0,0,TS,TS).data)};
  const vr=(x,y)=>(((x*73856093)^(y*19349663))>>>0)%4;
  const tileAt=(x,y)=>gt(M,x,y);
  for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
    const src=px(tileAt(x0+x,y0+y),vr(x0+x,y0+y));
    for(let j=0;j<TS;j++){
      const di=((y*TS+j)*cw+x*TS)*4,si=j*TS*4;
      for(let i=0;i<TS*4;i++)D[di+i]=src[si+i];
    }
  }
  const r=seeded(seed);
  const P_=[.6,.38,.2,.09];
  const dirs=[[0,-1],[0,1],[-1,0],[1,0]];
  for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
    const gx=x0+x,gy=y0+y,id=tileAt(gx,gy);if(NOBLEND.has(id))continue;
    for(const[dx,dy]of dirs){
      const nid=tileAt(gx+dx,gy+dy);
      if(nid<0||fam(nid)===fam(id)||NOBLEND.has(nid))continue;
      // trees keep crisp edges; only the foot of the trunk blends into the ground
      if(id===T.TREE&&dy!==1)continue;
      if(nid===T.TREE&&dy!==-1)continue;
      const src=px(nid,vr(gx+dx,gy+dy));
      for(let d=0;d<4;d++)for(let k=0;k<TS;k++){
        if(r()>P_[d])continue;
        const lx=dx?(dx<0?d:TS-1-d):k,ly=dy?(dy<0?d:TS-1-d):k;
        // sample the neighbour's pixel on the other side of the seam
        const sx=dx?TS-1-lx:lx,sy=dy?TS-1-ly:ly;
        const di=((y*TS+ly)*cw+x*TS+lx)*4,si=(sy*TS+sx)*4;
        D[di]=src[si];D[di+1]=src[si+1];D[di+2]=src[si+2];D[di+3]=src[si+3];
      }
    }
  }
  if(M.tintRGB){   // the world map: every tile has its own colour grade (it fades between regions)
    for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
      const ti=((y0+y)*M.w+x0+x)*3,tr=M.tintRGB[ti],tg=M.tintRGB[ti+1],tb=M.tintRGB[ti+2];
      if(tr===255&&tg===255&&tb===255)continue;
      for(let j=0;j<TS;j++){let di=((y*TS+j)*cw+x*TS)*4;for(let i=0;i<TS;i++,di+=4){D[di]=D[di]*tr/255;D[di+1]=D[di+1]*tg/255;D[di+2]=D[di+2]*tb/255}}
    }
  }
  g.putImageData(img,0,0);
  if(M.tint){g.globalCompositeOperation='multiply';g.fillStyle=M.tint;g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation='source-over'}
  return c;
}
function buildLayer(){
  if(M.w*M.h>60000){M.layer={chunked:true,cache:new Map()};return}
  M.layer=renderTiles(0,0,M.w,M.h,M.w*31+M.h);
}
function layerChunk(ci,cj){
  const L=M.layer,k=cj*1000+ci;
  let c=L.cache.get(k);
  if(c){L.cache.delete(k);L.cache.set(k,c);return c}   // most recently used goes last
  const x0=ci*CHK,y0=cj*CHK;
  c=renderTiles(x0,y0,Math.min(CHK,M.w-x0),Math.min(CHK,M.h-y0),ci*7919+cj*104729+13);
  L.cache.set(k,c);
  if(L.cache.size>40)L.cache.delete(L.cache.keys().next().value);
  return c;
}

// ---------- maps / spawning ----------
function applyMini(e,name){
  e.mini=name;e.elite=true;e.kit=MINIKIT[MINIKIT_OF[e.type]||'slam'];e.hp=e.maxHp=Math.round(e.maxHp*6);e.dmg*=1.25;e.big=1.5;e.hw=Math.round(e.hw*1.4);e.hh=Math.round(e.hh*1.4);e.aggro=Math.max(e.aggro,140);
}
function makeEnemy(type,x,y,lvl,elite,variant){
  const d=ENEMIES[type],k=lvl-1;
  const hp=Math.round(d.hp*(1+.3*k)*(elite?2.4:1)),dmg=d.dmg*(1+.2*k)*(elite?1.3:1);
  return{type,variant,x,y,lvl,elite:!!elite,hp,maxHp:hp,dmg,speed:d.speed,hw:d.hw,hh:d.hh,aggro:d.aggro,
    state:type==='boss'?'dormant':'idle',t:rand(0,2),cd:rand(.5,1.5),hitCd:0,kx:0,ky:0,flash:0,slow:0,stun:0,
    wx:0,wy:0,moving:false,dx:0,dy:1,dir:1,tele:null,seq:0,rot:0,anim:rand(0,6),home:{x,y},kit:type==='boss'?(BOSSKIT[variant||'barkfather']||null):null,weak:0,fx:0,fy:1,shielded:false};
}
function loadMap(id,x,y){
  ensureMapId(id);M=MAPS[id]();E=[];PR=[];EP=[];DR=[];FX=[];FT=[];curReg=null;
  if(x==null){x=M.start.x;y=M.start.y}
  clearArrival(x,y);
  for(const sl of M.seals)if(flags[sl.flag]){sl.open=true;for(const[x,y]of sl.tiles)M.t[y*M.w+x]=T.PATH}
  if(flags.cut&&flags.cut[id])applyCut();
  if(flags.bridged&&flags.bridged[id])applyBridge();
  applyForgotten();
  applyVillageGrowth();
  buildLayer();
  NP=M.npcs;placeLia();
  CH=M.chests.filter(c=>(!c.req||flags.dun[c.req])&&!c.hidden).map(c=>Object.assign({},c,{open:!!flags.chests[c.id]}));
  trialChests();
  for(const g of M.gates||[]){
    if(g.kind==='orb'&&flags.dun[g.flag||'orb'])g.open=true;
    if(g.kind==='key'&&flags.dun[g.flagKey||'keydoor'])g.open=true;
    if(g.kind==='plate'&&flags.dun[g.flag])g.open=true;
    if(g.kind==='room'&&flags.dun[g.room])g.open=true;
    if(!g.open)for(const[x,y]of g.tiles)M.t[y*M.w+x]=T.BARRIER;
  }
  for(let s of M.spawns){
    if(s.type==='boss'&&s.variant==='heartwood'&&flags.boss6&&!flags.boss16)s=Object.assign({},s,{variant:'maren',x:s.mx,y:s.my});   // the Heartwood fell, Maren is still standing
    if(s.type==='boss'&&flags[bossOf(s).flag])continue;
    if(s.room&&flags.dun[s.room])continue;
    const e=makeEnemy(s.type,s.x,s.y,s.lvl+10*(flags.ngp||0),s.elite,s.variant);e.room=s.room;if(s.variant==='heartwood'){e.hw=26;e.hh=14;e.mx=s.mx;e.my=s.my}if(s.mini)applyMini(e,s.mini);else if(e.elite&&e.type!=='boss'&&Math.random()<.7)applyEliteMod(e);if(e.type==='boss'){e.hp=e.maxHp=Math.round(e.maxHp*(2.3+.5*(flags.ngp||0)));e.phase=0}E.push(e);
  }
  if(id==='dungeon'&&flags.stage===1)flags.stage=2;
  if(M.after&&flags[M.after.flag])bossAftermath(true);
  DELAY=[];TRAPS=[];
  P.x=x;P.y=y;P.dashT=0;P.rollT=0;P.att=null;P.kx=P.ky=0;
  banner={t:3,text:M.name};
  if(id==='world')regionTick(true);else Music.play(zoneMusic(id));
  snapCam();
  save();
  onMapEntered(id);
}
const AFTER={};
// the big world: which region the hero stands in (ambience, story stage, banner, first-visit text), gates that open, shortcut triggers
let curReg=null;
function regionTick(force){
  if(M.id!=='world'||!P)return;
  for(const t of M.triggers)if(!flags[t.set]&&P.x>t.x&&P.x<t.x+t.w&&P.y>t.y&&P.y<t.y+t.h){flags[t.set]=true;toast(t.text,'#a8e0a0');save()}
  let opened=false;
  for(const sl of M.seals)if(!sl.open&&flags[sl.flag]){
    sl.open=true;opened=true;for(const[x,y]of sl.tiles)M.t[y*M.w+x]=T.PATH;
    if(!force&&sl.tiles.some(([x,y])=>Math.hypot((x+.5)*TS-P.x,(y+.5)*TS-P.y)<260)){toast('The way opens!','#a8e0a0');Snd.open();shake=3}
  }
  if(opened)buildLayer();
  const z=regionAtPx(P.x,P.y);
  if(z===curReg)return;
  const first=!flags.seen[z];
  curReg=z;flags.seen[z]=true;
  const S=ZSPEC[z];
  M.mist=!!S.mist;M.night=!!S.night;M.cold=!!S.cold;M.fx=S.fx||null;M.grade=S.grade||null;
  if(force)gradeBlend.snap=true;   // teleport / map load: no slow blend
  if(z==='amber'&&flags.stage>=3&&flags.stage<5)flags.stage=5;
  if(z==='marsh'&&flags.stage<7)flags.stage=7;
  if(z==='rust'&&flags.stage<9)flags.stage=9;
  for(const[rz,rs]of[['saffron',11],['steppe',13],['spire',15],['ember',17],['tangle',19],['delta',21],['mesa',23],['gulch',25],['grove',27],['ridge',29],['heart',31]])if(z===rz&&flags.stage<rs&&flags.stage>=rs-1)flags.stage=rs;
  banner={t:3,text:WORLD[z].name};
  if(first&&WENTRY[z]){toast(WENTRY[z],'#e8d8a8');toasts[toasts.length-1].t=6}
  Music.play(zoneMusic(z));
}
function applyCut(){
  for(let i=0;i<M.t.length;i++)if(M.t[i]===T.VINE)M.t[i]=T.PATH;
}
function applyBridge(){
  for(let i=0;i<M.t.length;i++)if(M.t[i]===T.GORGE)M.t[i]=T.BRIDGE;
}
function cutVines(){
  flags.cut[M.id]=true;applyCut();buildLayer();Snd.open();shake=3;
  puff(P.x+P.face.x*16,P.y+P.face.y*16,16,'#6a8a30',80);
}
function openDoor(silent){
  for(let i=0;i<M.t.length;i++)if(M.t[i]===T.LOCK)M.t[i]=T.DFLOOR;
  M.doorOpen=true;buildLayer();
  if(!silent){toast('The sealed door grinds open!');Snd.open();shake=4}
}
function bossAftermath(silent){
  const a=M.after||AFTER[M.id];if(!a)return;
  if(!CH.some(c=>c.id===a.chest))CH.push({id:a.chest,x:a.cx*TS+8,y:a.cy*TS+8,open:!!flags.chests[a.chest]});
  M.warps.push({x:a.wx*TS,y:a.wy*TS,w:2*TS,h:TS,to:a.to,tx:a.tx,ty:a.ty,portal:true});
}
function startFade(fn){if(fade.dir!==0)return;fade.dir=1;fade.fn=fn}
function snapCam(){
  if(M.dungeon&&M.layout){slideT=0;cam.room=null;const t=dungeonCam(true);cam.x=t.x;cam.y=t.y;return}
  cam.x=M.w*TS<=W?(M.w*TS-W)/2:clamp(P.x-W/2,0,M.w*TS-W);
  cam.y=M.h*TS<=H?(M.h*TS-H)/2:clamp(P.y-H/2,0,M.h*TS-H);
}

// ---------- loot ----------
// No random loot in Spicewood: gear, gems, materials and consumables are gone. These stay as empty hooks for the old call sites.
function dropItem(){}
function dropMat(){}
function dropCons(){}
function dropGem(){}
function randomCons(){return null}
function rollGem(){return null}
function giveItem(){}
function dropGold(x,y,n){n=Math.round(n*(1+((P&&P.mods&&P.mods.goldPct)||0)/100));DR.push({kind:'gold',x,y,amt:n,t:0,vx:rand(-40,40),vy:rand(-40,40)})}
function pickups(dt){
  for(const p of M.props){if(p.k!=='cutbush'||!p.deco)continue;const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS;if(Math.abs(px-P.x)<9&&Math.abs(py-P.y)<9&&(!p.rus||time>p.rus+.35)){p.rus=time;puff(px,py+4,3,'#8abc4a',26)}}   // rustle
  for(const p of M.props){if(p.k!=='herb')continue;const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS;if(Math.hypot(px-P.x,py-P.y)<10){p.dead=true;P.hp=Math.min(P.maxHp,P.hp+Math.round(P.maxHp*.06));floatText(P.x,P.y-12,'+HP','#ff6060');Snd.coin()}}   // herbs in the grass heal a little
  if(M.props.some(p=>p.dead))M.props=M.props.filter(p=>!p.dead);
  for(const d of DR){
    d.t+=dt;
    if(Math.abs(d.vx)+Math.abs(d.vy)>2){
      if(boxFree(d.x+d.vx*dt,d.y,1,1))d.x+=d.vx*dt;
      if(boxFree(d.x,d.y+d.vy*dt,1,1))d.y+=d.vy*dt;
      d.vx*=.9;d.vy*=.9;
    }
    const dd=dist(d,P);
    if(d.kind!=='item'&&dd<46&&d.t>.3){d.x+=(P.x-d.x)*Math.min(1,dt*8);d.y+=(P.y-d.y)*Math.min(1,dt*8)}
    if(dd<9&&d.t>.25){
      if(d.kind==='gold'){P.gold+=d.amt;floatText(P.x,P.y-12,'+'+d.amt+'g','#ffd040');Snd.coin();d.dead=true}
      else if(d.kind==='hp'){P.hp=Math.min(P.maxHp,P.hp+Math.round(P.maxHp*.15));floatText(P.x,P.y-12,'+HP','#ff6060');Snd.coin();d.dead=true}
    }
  }
  DR=DR.filter(d=>!d.dead);
}

// ---------- combat ----------
function aimDir(maxd,any){
  let best=null,bd=maxd;
  for(const e of E){
    if(e.state==='dormant')continue;
    const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);
    if(d>bd)continue;
    if(!any&&(dx*P.face.x+dy*P.face.y)/(d||1)<.55)continue;
    best=e;bd=d;
  }
  if(best){const dx=best.x-P.x,dy=best.y-P.y,d=Math.hypot(dx,dy)||1;return{x:dx/d,y:dy/d}}
  return{x:P.face.x,y:P.face.y};
}
function gainRes(n){if(P.hero.id==='warrior'){P.res=Math.min(P.resMax,P.res+n);P.rageT=2.5}}
function applyPoison(e){
  const dps=P.atk*.3*(1+(P.mods.poisonX||0)/100);
  e.poison={t:4,dps,acc:0,tick:0};
}
function hitEnemy(e,mult,dx,dy,kb,o){
  o=o||{};const md=P.mods;
  if(e.type==='boss'&&e.phaseLock>0)return;
  let d=P.atk*mult*rand(.9,1.1);
  d*=1+((md.dmgPct||0)+(P.buff&&P.buff.dmg?P.buff.dmg*100:0))/100;
  if(o.heavy)d*=1+(md.heavyPct||0)/100;
  if(md.execute&&e.hp<e.maxHp*.3)d*=1+md.execute/100;
  const crit=o.crit||Math.random()<P.crit;if(crit)d*=P.critMult;
  if(e.kit){const km=kitMult(e,dx,dy);d*=km;}
  d=Math.max(1,Math.round(d));
  e.hp-=d;e.flash=.1;
  if(md.lifesteal)P.hp=Math.min(P.maxHp,P.hp+d*md.lifesteal/100);
  if((P.buff&&P.buff.poison)||(md.burn&&o.fire)||o.dot)applyPoison(e);
  if(o.vamp)P.hp=Math.min(P.maxHp,P.hp+d*o.vamp);
  if(e.state==='dormant'&&e.type==='boss')wakeBoss(e);
  const l=Math.hypot(dx,dy)||1,k=e.type==='boss'?kb*.1:kb;
  e.kx+=dx/l*k*5;e.ky+=dy/l*k*5;
  if(e.type!=='boss'){
    e.stun=Math.max(e.stun,e.kit&&!(e.weak>0)?.03:(o.stun||.18));   // a guarded enemy cannot be stun-locked
    if(o.slow&&md.freeze)e.stun=Math.max(e.stun,.5);
    if(e.state==='wind'){e.state='chase';e.cd=1}
  }
  if(o.slow)e.slow=o.slow;
  floatText(e.x,e.y-12,d,crit?'#ffd040':'#ffffff',crit);
  puff(e.x,e.y,crit?7:3,crit?'#ffd040':'#ffffff',50);
  gainRes(6);crit?Snd.crit():Snd.hit();
  hitCount++;hitStop=Math.max(hitStop,crit?.075:.04);shake=Math.max(shake,crit?3:1.2);
  if(e.hp<=0&&!e.dead)killEnemy(e);
}
function hurtPlayer(dmg,sx,sy){
  if(P.inv>0||P.rollT>0||P.dashT>0||P.dead)return;
  if(P.mods.dodge&&Math.random()<P.mods.dodge/100){floatText(P.x,P.y-14,'Dodge!','#bde0ff');return}
  if(shieldBlocks(sx,sy))return;
  const red=P.armor/(P.armor+25+P.lvl*4);
  const d=Math.max(1,Math.round(dmg*(1-red)*(1-(P.mods.reducePct||0)/100)));
  if(P.mods.thorns){let n=null,nd=22;for(const e of E){const dd=Math.hypot(e.x-sx,e.y-sy);if(!e.dead&&dd<nd){nd=dd;n=e}}if(n)hitEnemy(n,Math.max(.1,d*P.mods.thorns/100/P.atk),n.x-P.x,n.y-P.y,40)}
  P.hp-=d;P.inv=.8;P.flash=.12;shake=Math.max(shake,3);hitStop=.07;
  const l=Math.hypot(P.x-sx,P.y-sy)||1;
  P.kx=(P.x-sx)/l*170;P.ky=(P.y-sy)/l*170;
  floatText(P.x,P.y-14,'-'+d,'#ff5050',false);Snd.hurt();gainRes(4);
  if(P.hp<=0)playerDied();
}
function playerDied(){
  if(jarSaves())return;
  P.dead=true;P.hp=0;
  ui={mode:'dialog',d:{name:'You fell...',pages:['Darkness takes you for a moment. You wake up in Hearthmoor, a little poorer (-10% gold).'],i:0,onEnd(){
    P.gold=Math.floor(P.gold*.9);P.hp=P.maxHp;P.res=0;P.dead=false;P.inv=1;
    startFade(()=>{loadMap(...toVillage())});
  }}};
}
function killEnemy(e){
  e.dead=true;questKill(e);if(e.tut)tutKill();
  if(e.mod==='boom'){mark(e.x,e.y,40,.5);const ex=e.x,ey=e.y,dm=e.dmg;later(.5,()=>{fx({k:'ring',x:ex,y:ey,r0:4,r1:40,t:0,dur:.3,c:'#ff9030'});puff(ex,ey,14,'#ff9030',90);Snd.boom();if(Math.hypot(P.x-ex,P.y-ey)<40)hurtPlayer(dm*1.5,ex,ey)})}
  if(P.mods.killHeal)P.hp=Math.min(P.maxHp,P.hp+P.maxHp*P.mods.killHeal/100);
  const d=ENEMIES[e.type];
  dropGold(e.x,e.y,Math.round(randi(d.gold[0],d.gold[1])*(1+.4*(e.lvl-1))*(e.elite?3:1)));
  if(Math.random()<(e.elite?.3:.12))DR.push({kind:'hp',x:e.x,y:e.y,t:0,vx:rand(-20,20),vy:rand(-20,20)});
  if(e.type==='boss'){bossDefeated(e);return}
  if(e.mini){
    toast(e.mini+' is defeated!','#ffd040');Snd.boom();shake=6;
    dropGold(e.x+8,e.y,Math.round(30+e.lvl*8));
    for(let i=0;i<3;i++)DR.push({kind:'hp',x:e.x+rand(-14,14),y:e.y+rand(-10,10),t:0,vx:rand(-30,30),vy:rand(-30,30)});
    fx({k:'ring',x:e.x,y:e.y,r0:6,r1:80,t:0,dur:.6,c:'#ffd080'});
  }
  puff(e.x,e.y,12,e.type==='shroom'?'#c8501e':e.type==='wolf'?'#8b8478':'#c2551d',80);
}
function bossDefeated(e){
  EP=[];const bi=bossOf(e);
  const tier0=gearTier();
  flags[bi.flag]=true;flags.dun[bi.flag]=true;if(flags.stage<bi.stage)flags.stage=bi.stage;
  recalc();P.hp=P.maxHp;
  if(gearTier()>tier0){const g=gearNow();later(3.2,()=>toast(`Your gear is reforged: ${g.sword.name} and ${g.armorSet.name}!`,'#ffe040'))}
  for(let i=0;i<30;i++)puff(e.x+rand(-14,14),e.y+rand(-14,14),3,'#d8741e',110);
  fx({k:'ring',x:e.x,y:e.y,r0:6,r1:120,t:0,dur:1,c:'#ffd080'});
  Snd.boom();shake=10;
  toast(bi.msg,'#ffd040');
  banner={t:3.5,text:bi.name+' defeated'};hitStop=.6;
  fx({k:'ring',x:e.x,y:e.y,r0:6,r1:220,t:0,dur:1.4,c:'#ffffff'});
  const bind=bi===BOSSES.heartwood&&!flags.boss16;
  if(bind)later(1.6,()=>bindScene(()=>spawnMaren(e.mx||e.x,e.my||e.y)));
  else later(1.5,()=>{if(!ui)say(bi.name,bi.last,()=>{const bk=e.variant||'barkfather';if(M.dungeon&&BOSSVIS[bk])playScene('bossVision',null,bk)})});
  if(!bind)bossAftermath();
  E.forEach(o=>{if(o!==e&&!o.dead&&o.type!=='boss'){o.hp=0;o.dead=true}});
  save();
}
function spawnMaren(x,y){
  const e=makeEnemy('boss',x,y,42+10*(flags.ngp||0),false,'maren');
  e.hp=e.maxHp=Math.round(e.maxHp*(2.3+.5*(flags.ngp||0)));e.phase=0;
  E.push(e);wakeBoss(e);
}
// the Heart of Spicewood: Maren waits at the foot of the great tree and takes the Heartseed
function betrayalCheck(){
  if(M.id!=='world'||ui||!flags||flags.betrayed||flags.boss6||flags.stage<31||regionAtPx(P.x,P.y)!=='heart')return;
  flags.betrayed=true;
  betrayalScenes(()=>{flags.seedTaken=true;P.hp=Math.max(1,Math.round(P.maxHp*.5));toast('Maren took the Heartseed!','#ff8070');Snd.boom();shake=8;save()});
}
function openChest(c){
  const had={};for(const k of KEYITEMS)had[k.k]=!!flags[k.k];
  const fr0=flags.fruits||0;
  openChestInner(c);
  const got=KEYITEMS.find(k=>flags[k.k]&&!had[k.k]);
  if(got){const then=ui&&ui.mode==='dialog'?ui.d.onEnd:null;if(ui&&ui.mode==='dialog')ui=null;itemGet(got.k,()=>{if((flags.fruits||0)>fr0)toast('A Heart Fruit grows your health by one heart!','#ff8a8a');if(then)then()})}
}
function openChestInner(c){
  c.open=true;flags.chests[c.id]=true;Snd.open();
  const lv=P.lvl;
  const drop=()=>{};
  if(/^zc_[a-z]+_2$/.test(c.id)){dropGold(c.x,c.y+8,Math.round(40+(c.tier||lv)*8));puff(c.x,c.y,10,'#ffe040',60);return}   // placeholder reward until the heart pieces are replaced
  if(c.id==='g1'){drop(2,1,Math.max(2,lv+1));dropGold(c.x,c.y+8,25);dropMat(c.x,c.y+10,'herb',3);dropMat(c.x+6,c.y+10,'wood',3)}
  else if(c.id==='boss'){
    drop(2,2,9);drop(1,3,9);dropGold(c.x,c.y+8,150);
    for(const[m_,n_]of[['shell',5],['ore',10],['wood',6],['leather',4],['herb',4]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.fruits=(flags.fruits||0)+1;recalc();P.hp=Math.min(P.maxHp,P.hp+20);
    ui={mode:'dialog',d:{name:'Treasure',pages:['You found a HEART FRUIT! Your maximum health grows by one heart.'],i:0}};
  }else if(c.id==='boss2'){
    drop(2,2,12);drop(1,3,12);dropGold(c.x,c.y+8,250);
    for(const[m_,n_]of[['shell',6],['ore',12],['wood',8],['leather',6],['herb',8]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.fruits=(flags.fruits||0)+1;recalc();P.hp=Math.min(P.maxHp,P.hp+20);
    ui={mode:'dialog',d:{name:'Treasure',pages:['You found a HEART FRUIT! Your maximum health grows by one heart.'],i:0}};
  }else if(c.id==='boss3'){
    drop(2,3,15);drop(1,3,15);dropGold(c.x,c.y+8,350);
    for(const[m_,n_]of[['shell',8],['ore',14],['wood',10],['leather',8],['herb',10]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.fruits=(flags.fruits||0)+1;recalc();P.hp=Math.min(P.maxHp,P.hp+20);
    ui={mode:'dialog',d:{name:'Treasure',pages:['You found a HEART FRUIT! Your maximum health grows by one heart.'],i:0}};
  }else if(c.id==='boss4'){
    drop(2,3,18);drop(1,4,18);dropGold(c.x,c.y+8,500);
    for(const[m_,n_]of[['shell',10],['ore',20],['wood',12],['leather',10],['herb',12]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.fruits=(flags.fruits||0)+1;recalc();P.hp=Math.min(P.maxHp,P.hp+20);
    ui={mode:'dialog',d:{name:'Treasure',pages:['You found a HEART FRUIT! Your maximum health grows by one heart.'],i:0,onEnd(){if(!flags.midShown){flags.midShown=true;midScene()}}}};
  }else if(c.id==='boss16'){
    drop(3,4,26);drop(2,3,26);dropGold(c.x,c.y+8,1500);
    for(const[m_,n_]of[['shell',20],['ore',40],['wood',25],['leather',20],['herb',25]])dropMat(c.x+rand(-14,14),c.y+rand(8,18),m_,n_);
    flags.won=true;flags.trueEnd=true;
    if(flags.sc&&flags.sc.finale)showStory(finalePages());else playScene('finale');
    try{parent.postMessage({type:'gameOver',score:P.lvl*1000+P.xp},'*')}catch(e){}
  }else if(c.id==='boss5'){
    drop(2,3,22);drop(1,4,22);dropGold(c.x,c.y+8,700);
    for(const[m_,n_]of[['shell',12],['ore',24],['wood',14],['leather',12],['herb',14]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.oathcrown=true;
    ui={mode:'dialog',d:{name:'Treasure',pages:['You obtained the OATHCROWN!','A gate item: the crown of the first founder. The gate of black ice west of the Smolder Spire recognises it.'],i:0,onEnd(){revealScene('founder')}}};
  }else if(c.id.length===2&&'mrpq'.includes(c.id[0])){const tier={m:[8,90,5],r:[13,140,8],p:[18,200,10],q:[24,350,14]}[c.id[0]];drop(2,3,Math.max(tier[0],lv+2));dropGold(c.x,c.y+8,tier[1]);dropMat(c.x,c.y+10,'ore',tier[2]);dropMat(c.x+6,c.y+10,'herb',4)}
  else if(c.id.startsWith('item_')){flags[c.id.slice(5)]=true;dropGold(c.x,c.y+8,60);puff(c.x,c.y,14,'#ffe040',70)}
  else if(c.id.startsWith('zs_')){dropGold(c.x,c.y+8,Math.round(60+(c.tier||lv)*9));if(P.potions<9){P.potions++;toast('Found a healing potion','#ff8a8a')}toast('A secret nook! Well found.','#a8e0a0')}
  else if(c.id.startsWith('zt_')){dropGold(c.x,c.y+8,Math.round(120+(c.tier||lv)*16));for(let i=0;i<2;i++)if(P.potions<9)P.potions++;toast('The trial chest holds gold and potions.','#ffe070');puff(c.x,c.y,12,'#ffe070',70)}
  else if(c.id.startsWith('key_')){P.keys++;toast('You found a Small Key!','#ffe040');drop(1,2,Math.max(4,(c.tier||lv)+1));dropGold(c.x,c.y+8,30)}
  else if(c.id.startsWith('tr_')||c.id.startsWith('cvc_')){
    const t=c.tier||lv,big=c.id.startsWith('cvc_')||c.req;
    drop(big?3:1,big?3:1,Math.max(t,lv));dropGold(c.x,c.y+8,Math.round(30+t*(big?14:6)));dropMat(c.x,c.y+10,'ore',2+Math.floor(t/4));dropMat(c.x+6,c.y+10,'leather',1+Math.floor(t/6));
    if(Math.random()<.5)dropMat(c.x-6,c.y+10,'herb',2+Math.floor(t/5));
  }
  else if(c.id.startsWith('zc_')){
    if(Math.random()<.4&&P.potions<9){P.potions++;toast('Found a healing potion','#ff8a8a')}
    const t=c.tier||lv;
    drop(1,2,Math.max(t,lv));if(Math.random()<.5)drop(1,3,Math.max(t,lv));dropGold(c.x,c.y+8,Math.round(25+t*6));dropMat(c.x,c.y+10,'ore',2+Math.floor(t/4));dropMat(c.x+6,c.y+10,'wood',2+Math.floor(t/5));dropMat(c.x-6,c.y+10,'herb',2);
  }
  else if(c.id==='boss7'||c.id==='boss8'||/^boss(9|1[0-5])$/.test(c.id)){
    const n=+c.id.slice(4),il={7:21,8:29,9:24,10:27,11:41,12:37,13:36,14:32,15:34}[n];
    drop(2,3,il);drop(1,4,il);dropGold(c.x,c.y+8,500+n*40);
    for(const[m_,n_]of[['shell',10],['ore',20],['wood',12],['leather',10],['herb',12]])dropMat(c.x+rand(-12,12),c.y+rand(8,16),m_,n_);
    flags.fruits=(flags.fruits||0)+1;recalc();P.hp=Math.min(P.maxHp,P.hp+20);
    const GI={7:['windcharm','WINDCHARM','its gusts carry you through the wind passes. The road north of Saffron Meadows is open.'],8:['emberglove','EMBER GLOVE','it burns away the thorn wall east of Ember Glade.'],9:['heraldwing','HERALDWING','it rides the Wind Chasm between the Windward Steppe and the Smolder Spire.'],10:['slagwalkers','SLAGWALKERS','boots that cross molten ground. The slag gate south of the Smolder Spire and the Ashen Pass will bear you.'],11:['heartseed','HEARTSEED','the Heart\'s last seed. Frozen roots south of Hoarfrost Ridge will part for it, and the root gates of the Heart of Spicewood.'],12:['truthglass','TRUTHGLASS','it shows what hides from the eye. The tunnel north of Rustpeak has a door that nobody can see.'],13:['sunstone','SUNSTONE','it parts the crystal veil north of the Sunbaked Mesa and east of the Windward Steppe.'],14:['briarkey','BRIAR KEY','it opens the gates of living briars south of the Tanglewood and east of Amber Hollow.'],15:['dunegoggles','DUNE GOGGLES','you can see through the sandstorm east of Saffron Meadows and north of the Tanglewood.']}[n];
    if(n!==7&&n!==8)flags[GI[0]]=true;   // the windcharm and the ember glove are found inside their dungeons
    const REV={8:'charter',11:'warden',12:'mirror'}[n];
    ui={mode:'dialog',d:{name:'Treasure',pages:(n===7||n===8)?['You found a HEART FRUIT! Your maximum health grows by one heart.']:['You found the '+GI[1]+' and a HEART FRUIT!','A gate item: '+GI[2]],i:0,onEnd(){if(REV)revealScene(REV)}}};
    save();
  }
  else if(c.id.startsWith('gr_')){
    const z=c.id.slice(3),tier={village:[4,60],glade:[8,120],amber:[12,200],marsh:[16,300],rust:[20,450]}[z];
    drop(2,3,Math.max(tier[0],lv+1));drop(1,4,Math.max(tier[0],lv+1));dropGold(c.x,c.y+8,tier[1]);dropMat(c.x,c.y+10,'ore',tier[0]);dropMat(c.x+6,c.y+10,'leather',Math.ceil(tier[0]/2));
    flags.fruits=(flags.fruits||0)+1;recalc();P.hp=Math.min(P.maxHp,P.hp+20);
    ui={mode:'dialog',d:{name:'Treasure',pages:['You found a HEART FRUIT! Your maximum health grows by one heart.'],i:0}};
  }
  else if(c.id==='dL'||c.id==='sL'||c.id==='hL'||c.id==='xL'||c.id==='kL'){P.keys++;toast('You found a Small Key!','#ffe040');drop(1,2,Math.max(4,lv+1));dropGold(c.x,c.y+8,30)}
  else{dropGold(c.x,c.y+8,40)}
  puff(c.x,c.y,10,'#ffd040',60);
}

// ---------- projectiles & skills ----------
function shoot(kind,ang,mult,o){
  o=o||{};if(SKACT){o=Object.assign({},o);if(SKS.pierce&&!o.aoe)o.pierce=true;if(SKS.slow&&!o.slow)o.slow=SKS.slow}const sp=o.speed||(kind==='fire'?150:kind==='knife'?240:220);
  PR.push({kind,x:P.x,y:P.y-2,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,mult,life:o.life||.9,aoe:o.aoe||0,pierce:!!o.pierce,hit:new Set(),ang,slow:o.slow,crit:o.crit,sk:SKACT?{stun:SKS.stun,dot:SKS.burn||SKS.poison,vamp:SKS.vamp}:null});
}
function ringHit(r,mult,kb,o,color){
  r=skRad(r);o=skOpts(o);
  cutAround(P.x,P.y,r);
  fx({k:'ring',x:P.x,y:P.y,r0:4,r1:r,t:0,dur:.28,c:color});
  for(const e of E.slice())if(!e.dead&&e.state!=='dormant'||e.type==='boss'){const d=dist(e,P);if(d<r+e.hw)hitEnemy(e,mult,e.x-P.x,e.y-P.y,kb,o)}
}
// Active skills run with SKACT=true. SKS holds the rank and rune effects of the skill being cast; delayed parts and projectiles keep a snapshot.
let SKACT=false,SKS={mult:1,rad:1,stun:0,slow:0,burn:false,poison:false,vamp:0,pierce:false};
const sm=()=>(1+(P.mods.skillDmg||0)/100)*(SKACT?SKS.mult:1);
const skRad=r=>SKACT?r*SKS.rad:r;
function skOpts(o){
  if(!SKACT)return o;
  o=Object.assign({},o);
  if(SKS.stun)o.stun=Math.max(o.stun||0,SKS.stun);
  if(SKS.slow)o.slow=Math.max(o.slow||0,SKS.slow);
  if(SKS.burn||SKS.poison)o.dot=true;
  if(SKS.vamp)o.vamp=SKS.vamp;
  return o;
}
const rankOf=id=>P.ranks[id]||1;
function runeIds(id){
  const set=RUNESET[id],r=rankOf(id),out=[];
  if(!set)return out;
  if(r>=3&&P.runes[id]&&P.runes[id][0])out.push(P.runes[id][0]);
  if(r>=5&&P.runes[id]&&P.runes[id][1])out.push(P.runes[id][1]);
  return out;
}
function buildSKS(id){
  const r=rankOf(id),rn=runeIds(id),S={mult:1+.12*(r-1),rad:1,stun:0,slow:0,burn:false,poison:false,vamp:0,pierce:false,echo:false,cdm:1-.04*(r-1),costm:1};
  for(const k of rn){
    if(k==='power')S.mult*=1.25;else if(k==='swift')S.cdm*=.75;else if(k==='frugal')S.costm*=.65;else if(k==='wide')S.rad=1.35;
    else if(k==='stun')S.stun=.8;else if(k==='vamp')S.vamp=.08;else if(k==='chill')S.slow=2.5;else if(k==='burn')S.burn=true;
    else if(k==='pierce')S.pierce=true;else if(k==='echo')S.echo=true;else if(k==='venom')S.poison=true;
  }
  return S;
}
function mark(x,y,r,dur){fx({k:'mark',x,y,r,t:0,dur})}
function later(t,fn){DELAY.push({t,fn,sk:SKACT?Object.assign({},SKS):null})}
function aoeAt(x,y,r,mult,kb,o,color){
  r=skRad(r);o=skOpts(o);
  fx({k:'ring',x,y,r0:4,r1:r,t:0,dur:.3,c:color||'#fff'});puff(x,y,12,color||'#fff',80);shake=Math.max(shake,4);Snd.boom();
  for(const e of E.slice())if(!e.dead&&Math.hypot(e.x-x,e.y-y)<r+e.hw)hitEnemy(e,mult,e.x-x,e.y-y,kb,o);
  cutAround(x,y,r);
}
function coneHit(range,arcDeg,mult,kb,o,d,color){
  range=skRad(range);o=skOpts(o);
  fx({k:'slash',x:P.x,y:P.y,dir:Math.atan2(d.y,d.x),arc:arcDeg*Math.PI/180,range,t:0,dur:.2,c:color,w:7});
  for(const e of E.slice()){
    if(e.dead)continue;
    const dx=e.x-P.x,dy=e.y-P.y,dd=Math.hypot(dx,dy);
    if(dd>range+e.hw)continue;
    const ang=Math.acos(clamp((dx*d.x+dy*d.y)/(dd||1),-1,1));
    if(ang<arcDeg*Math.PI/360||dd<e.hw+4)hitEnemy(e,mult,dx,dy,kb,o);
  }
  cutAround(P.x+d.x*15,P.y+d.y*15,22);
}
function targetPoint(maxd){
  let best=null,bd=maxd;
  for(const e of E){if(e.dead||e.state==='dormant'&&e.type!=='boss')continue;const dd=Math.hypot(e.x-P.x,e.y-P.y);if(dd<bd){bd=dd;best=e}}
  if(best)return{x:best.x,y:best.y};
  return{x:P.x+P.face.x*maxd*.6,y:P.y+P.face.y*maxd*.6};
}
const SKILL={
  cleave(){ringHit(36,1.7*sm(),90,{},'#ff7050')},
  slam(){ringHit(60,1.6*sm(),150,{stun:.9},'#ffb050');shake=6;Snd.boom()},
  multishot(){const d=aimDir(200,true),a=Math.atan2(d.y,d.x);for(let i=-2;i<=2;i++)shoot('arrow',a+i*.2,.85*sm())},
  pierce(){const d=aimDir(220,true);shoot('pierce',Math.atan2(d.y,d.x),2.4*sm(),{pierce:true,speed:340,life:1.1})},
  fireball(){const d=aimDir(220,true);shoot('fire',Math.atan2(d.y,d.x),2.4*sm(),{aoe:36,speed:150,life:1.4})},
  nova(){ringHit(66,1.5*sm(),70,{slow:2.5},'#80d0ff')},
  dash(){const d=aimDir(120);P.face=d;P.dashT=.16;P.dvx=d.x*480;P.dvy=d.y*480;P.hitSet=new Set();P.dashMult=1.8*sm();P.dashExec=false},
  knives(){for(let i=0;i<8;i++)shoot('knife',i*TAU/8,1.0*sm(),{life:.5,speed:230})},
  // ---- tree skills ----
  shieldbash(){const d=aimDir(60);P.face=d;coneHit(38,110,1.3*sm(),170,{stun:1.4},d,'#9ab8ff');shake=4;Snd.boom()},
  bloodrage(){P.buff={t:6,dmg:.25,as:.3};fx({k:'ring',x:P.x,y:P.y,r0:4,r1:40,t:0,dur:.4,c:'#e03020'});puff(P.x,P.y,14,'#e03020',70)},
  smite(){const d=aimDir(90,true),x=P.x+d.x*38,y=P.y+d.y*38;aoeAt(x,y,38,2.0*sm(),90,{},'#ffe9a0');const h=Math.round(P.maxHp*.06);P.hp=Math.min(P.maxHp,P.hp+h);floatText(P.x,P.y-14,'+'+h,'#60ff80')},
  sniper(){const d=aimDir(260,true);shoot('pierce',Math.atan2(d.y,d.x),3.5*sm(),{pierce:true,speed:440,life:1.0,crit:true})},
  trap(){TRAPS.push({x:P.x,y:P.y,t:14,mult:2.2*sm()*(1+(P.mods.trapPct||0)/100)})},
  rain(){const t=targetPoint(150);mark(t.x,t.y,44,.6);later(.6,()=>aoeAt(t.x,t.y,44,2.4*sm(),60,{slow:2},'#c8ff90'))},
  meteor(){const t=targetPoint(150);mark(t.x,t.y,48,.8);later(.8,()=>aoeAt(t.x,t.y,48,3.2*sm(),120,{fire:true},'#ff8a2a'))},
  frostbolt(){const d=aimDir(220,true);shoot('bolt',Math.atan2(d.y,d.x),1.6*sm(),{pierce:true,speed:200,life:1.0,slow:3})},
  blink(){
    const d=P.face;let s2=0;
    for(let k=76;k>=8;k-=8){if(boxFree(P.x+d.x*k,P.y+d.y*k,P.hw,P.hh)){s2=k;break}}
    puff(P.x,P.y,10,'#c080ff',70);P.x+=d.x*s2;P.y+=d.y*s2;P.inv=Math.max(P.inv,.5);
    aoeAt(P.x,P.y,32,1.0*sm(),90,{},'#c080ff');
  },
  execute(){
    let best=null,bd=140;
    for(const e of E){if(e.dead)continue;const dd=Math.hypot(e.x-P.x,e.y-P.y);if(dd<bd){bd=dd;best=e}}
    const d=best?{x:(best.x-P.x)/bd,y:(best.y-P.y)/bd}:P.face;
    P.face=d;P.dashT=Math.min(.3,Math.max(.1,(best?bd:60)/520));P.dvx=d.x*520;P.dvy=d.y*520;P.hitSet=new Set();P.dashMult=2.6*sm();P.dashExec=true;
  },
  smoke(){
    ringHit(52,1.0*sm(),40,{slow:2.5,stun:.7},'#b0b0b0');
    for(const e of E)if(e.type!=='boss'&&Math.hypot(e.x-P.x,e.y-P.y)<120){e.blind=2.2;e.state='idle'}
    P.inv=Math.max(P.inv,1.2);P.stealth=1.2;
  },
  venom(){P.buff={t:8,dmg:0,as:0,poison:true};fx({k:'ring',x:P.x,y:P.y,r0:4,r1:36,t:0,dur:.4,c:'#8ae04a'});puff(P.x,P.y,12,'#8ae04a',60)},
  // ---- ultimates
  roar(){ringHit(95,1.2*sm(),120,{stun:1.6},'#ffd080');addBuff('roar','Bulwark',{reducePct:40},6);shake=6;Snd.boom()},
  whirl(){for(let i=0;i<8;i++)later(i*.4,()=>{ringHit(46,1.0*sm(),90,{},'#ff7050');puff(P.x,P.y,6,'#ff7050',70)})},
  judgment(){const d=aimDir(110,true),x=P.x+d.x*50,y=P.y+d.y*50;mark(x,y,62,.7);later(.7,()=>{aoeAt(x,y,62,4.2*sm(),150,{stun:.8},'#fff2b0');const h=Math.round(P.maxHp*.18);P.hp=Math.min(P.maxHp,P.hp+h);floatText(P.x,P.y-14,'+'+h,'#60ff80')})},
  deadeye(){const d=aimDir(260,true),a=Math.atan2(d.y,d.x);for(let i=0;i<5;i++)later(i*.14,()=>shoot('pierce',a+(i-2)*.05,3.0*sm(),{pierce:true,speed:440,life:1,crit:true}))},
  trapfield(){for(let i=0;i<6;i++){const a=i*TAU/6;TRAPS.push({x:P.x+Math.cos(a)*36,y:P.y+Math.sin(a)*36,t:14,mult:2.2*sm()*(1+(P.mods.trapPct||0)/100)})}fx({k:'ring',x:P.x,y:P.y,r0:4,r1:40,t:0,dur:.4,c:'#7fd06a'})},
  arrowstorm(){const t=targetPoint(150);for(let k=0;k<7;k++)later(k*.45,()=>{const x=t.x+rand(-44,44),y=t.y+rand(-44,44);mark(x,y,30,.3);later(.3,()=>aoeAt(x,y,30,1.8*sm(),50,{slow:1.5},'#c8ff90'))})},
  inferno(){for(let k=0;k<3;k++)later(k*.35,()=>ringHit(50+k*26,1.6*sm(),80,{fire:true},'#ff8a2a'))},
  zero(){ringHit(115,2.0*sm(),60,{slow:4,stun:1.4},'#a0e0ff');shake=6;Snd.boom()},
  barrage(){for(let n=0;n<2;n++)later(n*.3,()=>{for(let i=0;i<12;i++)shoot('bolt',i*TAU/12+n*.26,1.3*sm(),{speed:210,life:.9})})},
  deathmark(){
    const ts=E.filter(e=>!e.dead&&e.state!=='dormant'&&dist(e,P)<150).sort((a,b)=>dist(a,P)-dist(b,P)).slice(0,4);
    if(!ts.length){const d=P.face;P.dashT=.2;P.dvx=d.x*480;P.dvy=d.y*480;P.hitSet=new Set();P.dashMult=2*sm();P.dashExec=false;return}
    P.inv=Math.max(P.inv,ts.length*.3+.4);
    ts.forEach((e,i)=>later(i*.3,()=>{
      if(e.dead)return;
      const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
      puff(P.x,P.y,8,'#e04a5a',60);P.x=e.x-dx/d*10;P.y=e.y-dy/d*10;if(!boxFree(P.x,P.y,P.hw,P.hh)){P.x=e.x;P.y=e.y+10}
      hitEnemy(e,3.2*sm(),dx,dy,120,{crit:true});puff(e.x,e.y,10,'#e04a5a',70);Snd.crit();
    }));
  },
  vanish(){P.inv=Math.max(P.inv,2.2);P.stealth=2;for(let k=0;k<6;k++)later(k*.3,()=>{for(const e of E)if(!e.dead&&e.state!=='dormant'&&dist(e,P)<72)hitEnemy(e,1.6*sm(),e.x-P.x,e.y-P.y,60,{});puff(P.x,P.y,8,'#b87be8',70)})},
  plague(){for(let k=0;k<6;k++)later(k*.5,()=>{fx({k:'ring',x:P.x,y:P.y,r0:4,r1:84,t:0,dur:.4,c:'#8ae04a'});for(const e of E)if(!e.dead&&e.state!=='dormant'&&dist(e,P)<84){applyPoison(e);e.slow=1.5;hitEnemy(e,.5*sm(),e.x-P.x,e.y-P.y,20,{})}})}
};
function castSkill(i){
  const id=P.bound[i],sk=SKILLS[id];
  if(!sk)return;
  if(P.cd[i]>0)return;
  const S=sk.ult?{mult:1,rad:1,stun:0,slow:0,burn:false,poison:false,vamp:0,pierce:false,echo:false,cdm:1,costm:1}:buildSKS(id);
  const cost=Math.round(sk.cost*S.costm);
  if(P.res<cost){if(!P.noRes||P.noRes<=0){floatText(P.x,P.y-14,'No '+P.hero.res,'#8090ff');P.noRes=.8}return}
  P.res-=cost;P.cd[i]=sk.cd*S.cdm*(1-Math.min(.6,(P.mods.cdr||0)/100));P.cdMax[i]=Math.max(.1,P.cd[i]);P.att=null;P.swing=0;
  SKS=S;SKACT=true;
  try{SKILL[sk.id]()}finally{SKACT=false}
  if(S.echo){
    const E2=Object.assign({},S,{mult:S.mult*.6,echo:false});
    later(.55,()=>{SKS=E2;SKACT=true;try{SKILL[sk.id]()}finally{SKACT=false}puff(P.x,P.y,8,'#ffe9a0',50)});
  }
  Snd.spell();
}
// 3-hit combo: every swing has wind-up, strike and recovery. The 3rd hit is a heavy finisher.
// Movement stays free between swings, but a swing commits you (locked facing, slow steps, forward lunge).
function doAttack(){
  if(P.atkT>0||P.att||!flags.sword||P.blocking)return;
  const h=P.hero;
  P.combo=(P.comboT>0)?(P.combo+1)%3:0;
  const heavy=P.combo===2;
  const d=aimDir(h.melee?70:200,!h.melee);P.face=d;
  const dur=P.atkCd*(heavy?1.7:1)/(1+(P.buff&&P.buff.as||0));
  P.att={t:0,wind:heavy?.14:.07,dur,dir:d,heavy,hit:false};
  P.atkT=dur;P.swing=dur;
  Snd.swing();
}
function updateAttack(dt){
  const a=P.att;if(!a)return;
  a.t+=dt;
  if(a.t<a.wind+.07&&P.hero.melee){const sp=(a.heavy?150:105)*(a.t>=a.wind?1:.5);move(P,a.dir.x*sp*dt,a.dir.y*sp*dt)}
  if(!a.hit&&a.t>=a.wind){a.hit=true;strike(a)}
  if(a.t>=a.dur){P.att=null;P.comboT=.5}
}
function strike(a){
  const h=P.hero,d=a.dir,hv=a.heavy;
  hitCount=0;
  if(h.melee){
    const range=h.melee.range*(hv?1.3:1),arc=(h.melee.arc+(hv?50:0))*Math.PI/180;
    fx({k:'slash',x:P.x,y:P.y,dir:Math.atan2(d.y,d.x),arc,range,t:0,dur:hv?.2:.14,c:hv?'#ffffff':h.light,w:hv?6:4});
    for(const e of E.slice()){
      if(e.dead)continue;
      const dx=e.x-P.x,dy=e.y-P.y,dd=Math.hypot(dx,dy);
      if(dd>range+e.hw)continue;
      const ang=Math.acos(clamp((dx*d.x+dy*d.y)/(dd||1),-1,1));
      if(ang<arc/2||dd<e.hw+4)hitEnemy(e,hv?1.7:1,dx,dy,hv?150:90,{stun:hv?.4:.18,heavy:hv});
    }
    cutAround(P.x+d.x*15,P.y+d.y*15,hv?26:18);
  }else{
    const ang=Math.atan2(d.y,d.x),kind=h.ranged==='arrow'?'arrow':'bolt';
    if(hv)shoot(kind,ang,1.6,h.ranged==='arrow'?{pierce:true,speed:300}:{aoe:24,speed:180});
    else shoot(kind,ang,1,P.mods.pierce?{pierce:true}:null);
    move(P,-d.x*(hv?4:2),-d.y*(hv?4:2));   // small recoil
    Snd.shoot();
  }
  if(hv&&P.mods.finisherRing)ringHit(46,1.7*P.mods.finisherRing,120,{},'#ffe9a0');
  if(hv){shake=Math.max(shake,4);fx({k:'ring',x:P.x+d.x*10,y:P.y+d.y*10,r0:4,r1:26,t:0,dur:.2,c:'#ffffff'});Snd.boom()}
  if(hitCount>0)hitStop=Math.max(hitStop,hv?.11:.05);
}
function updateProjectiles(dt){
  for(const p of PR){
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(solidAt(p.x,p.y)&&!((p.kind==='arrow'||p.kind==='pierce')&&(gt(M,Math.floor(p.x/TS),Math.floor(p.y/TS))===T.WATER||gt(M,Math.floor(p.x/TS),Math.floor(p.y/TS))===T.GORGE))){p.life=0;cutAround(p.x,p.y,12);if(p.aoe)explode(p);continue}
    for(const e of E){
      if(e.dead||p.hit.has(e)||e.state==='dormant'&&e.type!=='boss')continue;
      if(Math.abs(p.x-e.x)<e.hw+3&&Math.abs(p.y-e.y)<e.hh+4){
        p.hit.add(e);
        if(p.aoe){explode(p);p.life=0;break}
        hitEnemy(e,p.mult,p.vx,p.vy,50,Object.assign({slow:p.slow,crit:p.crit},p.sk||{}));
        if(!p.pierce){p.life=0;break}
      }
    }
  }
  PR=PR.filter(p=>p.life>0);
}
function explode(p){
  fx({k:'ring',x:p.x,y:p.y,r0:4,r1:p.aoe,t:0,dur:.3,c:'#ff9030'});puff(p.x,p.y,14,'#ff9030',90);Snd.boom();
  for(const e of E.slice())if(!e.dead&&dist(e,p)<p.aoe+e.hw)hitEnemy(e,p.mult,e.x-p.x,e.y-p.y,80,Object.assign({fire:true},p.sk||{}));
}
function updateEnemyProjectiles(dt){
  for(const p of EP){
    p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(solidAt(p.x,p.y)){p.life=0;continue}
    if(Math.hypot(p.x-P.x,p.y-P.y)<6){hurtPlayer(p.dmg,p.x-p.vx,p.y-p.vy);p.life=0}
  }
  EP=EP.filter(p=>p.life>0);
}
function spore(e,ang,sp,dmg){EP.push({x:e.x,y:e.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,dmg,life:3})}

// ---------- boss helpers ----------
function openUp(e){if(e.kit&&e.kit.dur>0&&e.weak<=0){e.weak=e.kit.dur;e.cd=Math.max(e.cd,e.kit.dur+.4);fx({k:'ring',x:e.x,y:e.y,r0:4,r1:36,t:0,dur:.35,c:'#ffe040'})}}
function summonAdds(e,sm,n){
  if(E.filter(o=>!o.dead&&o.type===sm[0]).length>=sm[1]+(e.phase||0)*2)return;
  let made=0;
  for(let i=0;i<n;i++){const s2=makeEnemy(sm[0],e.x+(i%2?-30:30)+rand(-8,8),e.y+22+rand(-6,6),Math.max(1,e.lvl-3));s2.state='chase';s2.minion=e;if(boxFree(s2.x,s2.y,s2.hw,s2.hh)){E.push(s2);made++}}
  if(made&&e.kit&&e.kit.on&&e.kit.on.includes('adds'))e.shielded=true;
}
function wakeBoss(e){
  e.state='fight';e.cd=1.4;e.phase=0;e.seq=0;
  ui={mode:'bossintro',t:0,e};Music.play('boss');Snd.boom();
}
function phaseShift(e,ph){
  const bi=bossOf(e);
  e.phase=ph;e.tele=null;e.dash=null;e.windup=null;e.phaseLock=1.4;e.cd=1.2;
  fx({k:'ring',x:e.x,y:e.y,r0:6,r1:160,t:0,dur:.9,c:'#ffd080'});shake=10;Snd.boom();puff(e.x,e.y,26,'#ffd080',130);
  toast(bi.lines[ph-1],'#ffb070');banner={t:2.2,text:ph===1?'Phase II':'Final Phase'};
  if(Math.hypot(P.x-e.x,P.y-e.y)<80)hurtPlayer(e.dmg*.7,e.x,e.y);
  const sm={barkfather:['beetle',5],mycelia:['shroom',6],drowned:['bat',6],warden:['wolf',4],king:['skeleton',5],harvest:['wolf',4],cinder:['beetle',6],storm:['stormbat',6],magma:['magmabrute',3],frost:['frostwolf',4],prism:['crystalghost',4],sand:['sandbeetle',5],thorn:['beetle',5],baron:['shroom',6],heartwood:['beetle',6],maren:['skeleton',5]}[e.variant||'barkfather'];
  summonAdds(e,sm,3);
}
// ---------- enemy AI ----------
const AI={
  beetle(e,dt,d,ux,uy,sp){
    switch(e.state){
      case'idle':wander(e,dt,sp);if(d<e.aggro)e.state='chase';break;
      case'chase':
        move(e,ux*sp*dt,uy*sp*dt);
        if(d<62&&e.cd<=0&&attackers()<2){e.state='wind';e.t=.65;e.dx=ux;e.dy=uy}
        if(d>e.aggro*2.2)e.state='idle';break;
      case'wind':e.t-=dt;e.dx=ux;e.dy=uy;if(e.t<=0){e.state='charge';e.t=.38}break;
      case'charge':e.t-=dt;move(e,e.dx*135*dt,e.dy*135*dt);if(e.t<=0){e.state='chase';e.cd=2;if(e.mini&&e.kit&&e.kit.on&&e.kit.on.includes('charge'))openUp(e)}break;
    }
  },
  wolf(e,dt,d,ux,uy,sp){
    switch(e.state){
      case'idle':wander(e,dt,sp);if(d<e.aggro)e.state='chase';break;
      case'chase':
        move(e,ux*sp*dt,uy*sp*dt);
        if(d<64){e.state='circle';e.t=rand(1.2,2);e.dir=Math.random()<.5?1:-1}
        if(d>e.aggro*2.2)e.state='idle';break;
      case'circle':{
        const tx=-uy*e.dir,ty=ux*e.dir,rad=(d-52)*.04;
        move(e,(tx*.9+ux*rad)*sp*dt,(ty*.9+uy*rad)*sp*dt);
        e.t-=dt;if(e.t<=0&&attackers()<2){e.state='wind';e.t=.4;e.dx=ux;e.dy=uy}else if(e.t<=0)e.t=.5;
        break}
      case'wind':e.t-=dt;e.dx=ux;e.dy=uy;if(e.t<=0){e.state='charge';e.t=.32}break;
      case'charge':e.t-=dt;move(e,e.dx*185*dt,e.dy*185*dt);if(e.t<=0){e.state='chase';e.cd=1}break;
    }
  },
  shroom(e,dt,d,ux,uy,sp){
    if(e.state==='idle'){wander(e,dt,sp);if(d<e.aggro)e.state='chase';return}
    if(d<70)move(e,-ux*sp*1.3*dt,-uy*sp*1.3*dt);else if(d>105)move(e,ux*sp*dt,uy*sp*dt);
    if(e.cd<=0&&d<160){spore(e,Math.atan2(uy,ux),75,e.dmg);e.cd=2.3;if(e.mini&&e.kit&&e.kit.on&&e.kit.on.includes('shot'))openUp(e)}
    if(d>e.aggro*2.2)e.state='idle';
  },
  bat(e,dt,d,ux,uy,sp){
    switch(e.state){
      case'idle':wander(e,dt,sp);if(d<e.aggro)e.state='chase';break;
      case'chase':{
        const w=Math.sin(time*7+e.anim)*.9;
        move(e,(ux-uy*w)*sp*dt,(uy+ux*w)*sp*dt);
        if(d<70&&e.cd<=0&&attackers()<2){e.state='wind';e.t=.4;e.dx=ux;e.dy=uy}
        if(d>e.aggro*2.2)e.state='idle';break}
      case'wind':e.t-=dt;e.dx=ux;e.dy=uy;if(e.t<=0){e.state='charge';e.t=.35}break;
      case'charge':e.t-=dt;move(e,e.dx*175*dt,e.dy*175*dt);if(e.t<=0){e.state='chase';e.cd=1.8;if(e.mini&&e.kit&&e.kit.on&&e.kit.on.includes('charge'))openUp(e)}break;
    }
  },
  brute(e,dt,d,ux,uy,sp){
    if(e.state==='idle'){wander(e,dt,sp);if(d<e.aggro)e.state='chase';return}
    if(e.tele){
      e.tele.t-=dt;
      if(e.tele.t<=0){
        fx({k:'ring',x:e.tele.x,y:e.tele.y,r0:6,r1:e.tele.r,t:0,dur:.3,c:'#c070ff'});shake=4;Snd.boom();
        if(Math.hypot(P.x-e.tele.x,P.y-e.tele.y)<e.tele.r)hurtPlayer(e.dmg*1.3,e.tele.x,e.tele.y);
        for(let i=0;i<8;i++)spore(e,i*TAU/8,70,e.dmg*.4);
        e.tele=null;e.cd=3;if(e.mini&&e.kit&&e.kit.on&&e.kit.on.includes('slam'))openUp(e);
      }
      return;
    }
    if(d>24)move(e,ux*sp*dt,uy*sp*dt);
    if(d<50&&e.cd<=0)e.tele={x:e.x,y:e.y,r:38,t:.8,dur:.8};
    if(d>e.aggro*2.2)e.state='idle';
  },
  boss(e,dt,d,ux,uy,sp){
    if(e.state==='dormant'){if(d<150&&!ui)wakeBoss(e);return}
    if(e.phaseLock>0){e.phaseLock-=dt;return}
    const ph=e.hp<e.maxHp*.34?2:e.hp<e.maxHp*.67?1:0;
    if(ph>e.phase){phaseShift(e,ph);return}
    const spd=sp*(1+.18*ph),ck=1-.14*ph,still=e.variant==='heartwood';
    if(still){e.x=e.home.x;e.y=e.home.y;e.kx=e.ky=0}   // a tree: the Heart never moves
    if(e.dash){
      const D=e.dash;D.t-=dt;move(e,D.dx*265*dt,D.dy*265*dt);
      if(!D.hit&&Math.hypot(P.x-e.x,P.y-e.y)<e.hw+10){D.hit=true;hurtPlayer(e.dmg*1.15,e.x,e.y)}
      if(Math.random()<.7)puff(e.x,e.y,1,'#ffb070',30);
      if(D.t<=0){e.dash=null;e.cd=1.4*ck;shake=5;fx({k:'ring',x:e.x,y:e.y,r0:4,r1:34,t:0,dur:.25,c:'#ff7040'});if(e.kit&&e.kit.on&&e.kit.on.includes('charge'))openUp(e)}
      return;
    }
    if(e.windup){
      const W_=e.windup;W_.t-=dt;
      if(W_.t<=0){e.windup=null;e.dash={t:.5,dx:W_.dx,dy:W_.dy,hit:false};Snd.roll()}
      return;
    }
    if(e.tele){
      e.tele.t-=dt;
      if(e.tele.t<=0){
        fx({k:'ring',x:e.tele.x,y:e.tele.y,r0:6,r1:e.tele.r,t:0,dur:.3,c:'#ff7040'});shake=7;Snd.boom();
        if(Math.hypot(P.x-e.tele.x,P.y-e.tele.y)<e.tele.r)hurtPlayer(e.dmg*1.2,e.tele.x,e.tele.y);
        if(ph>=1){const n=ph===2?10:6;for(let i=0;i<n;i++)spore(e,i*TAU/n+e.rot,65,e.dmg*.4)}
        e.tele=null;e.cd=2.4*ck;if(e.kit&&e.kit.on&&e.kit.on.includes('slam'))openUp(e);
      }
      return;
    }
    if(d>28&&!still)move(e,ux*spd*dt,uy*spd*dt);
    if(e.cd<=0){
      const v=e.variant||'barkfather';
      const SEQ={
        barkfather:[['charge','fan','slam','spores'],['slam','charge','fan','summon'],['charge','slam','wave','summon','spiral']],
        mycelia:[['summon','spores','fan','rain'],['spores','wave','summon','sweep','rain'],['spiral','wave','summon','rain','sweep','slam']],
        drowned:[['rain','fan','summon','spores'],['rain','sweep','summon','wave'],['rain','spiral','summon','sweep','slam','wave']],
        warden:[['slam','fan','charge','summon'],['charge','slam','rain','summon','sweep'],['charge','charge','slam','wave','summon','spiral']],
        king:[['summon','fan','slam','rain'],['wave','summon','charge','sweep'],['spiral','summon','wave','charge','slam','rain']],
        harvest:[['fan','summon','slam','spores'],['wave','slam','summon','rain','sweep'],['spiral','wave','charge','summon','slam','rain']],
        cinder:[['slam','charge','fan','summon'],['charge','sweep','slam','rain','summon'],['spiral','charge','wave','slam','sweep','summon','rain']],
        storm:[['summon','fan','wave','rain'],['sweep','wave','charge','rain','summon'],['spiral','charge','wave','sweep','rain','summon']],
        magma:[['slam','charge','sweep','summon'],['slam','rain','charge','summon','sweep'],['spiral','slam','charge','sweep','summon','rain']],
        frost:[['fan','sweep','summon','slam'],['wave','charge','sweep','summon','rain'],['spiral','wave','charge','rain','summon','slam']],
        prism:[['summon','spores','fan','rain'],['wave','sweep','spores','summon','rain'],['spiral','wave','rain','sweep','summon']],
        sand:[['slam','charge','fan','summon'],['charge','sweep','summon','slam','rain'],['charge','charge','spiral','summon','wave','slam']],
        thorn:[['fan','summon','rain','spores'],['sweep','wave','summon','spores','charge'],['spiral','summon','sweep','wave','rain','slam']],
        baron:[['spores','fan','rain','summon'],['wave','spores','summon','sweep','rain'],['spiral','spores','wave','summon','rain','slam']],
        heartwood:[['slam','spores','fan','summon'],['wave','sweep','summon','rain','spores'],['spiral','wave','summon','slam','rain','spores','sweep']],
        maren:[['fan','summon','slam','rain'],['wave','charge','summon','sweep','rain'],['spiral','wave','charge','summon','slam','rain','sweep']]
      };
      const seq=SEQ[v][ph],a=seq[e.seq++%seq.length],ang=Math.atan2(uy,ux);
      const big=v==='heartwood'?72:v==='cinder'?74:v==='warden'?66:v==='barkfather'?54:60;
      if(a==='slam')e.tele={x:e.x,y:e.y,r:big,t:.9-.1*ph,dur:.9-.1*ph};
      else if(a==='rain'){const n=4+ph*2;for(let i=0;i<n;i++){const a2=rand(0,TAU),rr=i?rand(20,80):0;hazardAt(P.x+Math.cos(a2)*rr,P.y+Math.sin(a2)*rr,26,e.dmg*.9,.9)}e.cd=2.3*ck;Snd.spell()}
      else if(a==='spores'){const n=12+ph*3;for(let i=0;i<n;i++)spore(e,i*TAU/n+e.rot,70,e.dmg*.5);e.rot+=.26;e.cd=2.1*ck;Snd.spell();if(e.kit&&e.kit.on&&e.kit.on.includes('spores'))openUp(e)}
      else if(a==='fan'){const k=2+ph;for(let i=-k;i<=k;i++)spore(e,ang+i*.2,95,e.dmg*.5);e.cd=2.1*ck;Snd.spell()}
      else if(a==='wave'){const n=20;for(let i=0;i<n;i++){const an=i*TAU/n;const df=Math.abs(((an-ang+Math.PI*3)%TAU)-Math.PI);if(df>Math.PI-.34)continue;spore(e,an,78,e.dmg*.5)}e.cd=2.2*ck;Snd.spell();fx({k:'ring',x:e.x,y:e.y,r0:4,r1:30,t:0,dur:.3,c:'#c070ff'})}
      else if(a==='sweep'){const n=6+ph;for(let i=0;i<n;i++)hazardAt(e.x+Math.cos(ang)*(30+i*26),e.y+Math.sin(ang)*(30+i*26),22,e.dmg*.9,.5+i*.16);e.cd=2.6*ck;Snd.spell()}
      else if(a==='spiral'){for(let k=0;k<4;k++)later(k*.38,()=>{if(e.dead)return;for(let i=0;i<8;i++)spore(e,i*TAU/8+k*.4+e.rot,72,e.dmg*.45);Snd.spell()});e.rot+=.7;e.cd=3*ck}
      else if(a==='charge'){e.windup={t:.85-.1*ph,dx:ux,dy:uy};e.aim=Math.atan2(uy,ux);Snd.spell()}
      else if(a==='summon'){
        const sm={barkfather:['beetle',5,'Beetles crawl out of the bark!'],mycelia:['shroom',6,'Spore pods burst open!'],drowned:['bat',6,'The Matron calls the swarm!'],warden:['wolf',4,'Rust wolves leap from the shadows!'],king:['skeleton',5,'Skeletons claw out of the ground!'],harvest:['wolf',4,'Straw hounds burst from the sacks!'],cinder:['beetle',6,'Cinder beetles crawl out of the vents!'],storm:['stormbat',6,'Storm bats dive from the clouds!'],magma:['magmabrute',3,'Magma brutes rise from the lava!'],frost:['frostwolf',4,'Frost wolves howl in the snow!'],prism:['crystalghost',4,'Crystal wraiths split off!'],sand:['sandbeetle',5,'Dune beetles burrow up!'],thorn:['beetle',5,'Thorn beetles burst from the roots!'],baron:['shroom',6,'Pepper pods burst open!'],heartwood:['beetle',6,'Heart-beetles swarm from the roots!'],maren:['skeleton',5,'The Tithe Guard answers her call!']}[v];
        summonAdds(e,sm,2+(ph?1:0));toast(sm[2],'#c070ff');e.cd=1.6*ck;
      }
    }
  }
};
AI.skeleton=AI.beetle;AI.ghost=AI.bat;
AI.frostwolf=AI.wolf;AI.sandbeetle=AI.beetle;AI.thornbrute=AI.brute;AI.stormbat=AI.bat;AI.magmabrute=AI.brute;AI.crystalghost=AI.bat;AI.frostskel=AI.beetle;
function hazardAt(x,y,r,dmg,delay){
  mark(x,y,r,delay);
  later(delay,()=>{fx({k:'ring',x,y,r0:4,r1:r,t:0,dur:.3,c:'#c070ff'});puff(x,y,10,'#c070ff',60);Snd.boom();if(Math.hypot(P.x-x,P.y-y)<r)hurtPlayer(dmg,x,y)});
}
function attackers(){let n=0;for(const e of E)if(e.state==='wind'||e.state==='charge')n++;return n}
function wander(e,dt,sp){
  e.t-=dt;
  if(e.t<=0){e.t=rand(1,2.5);const a=rand(0,TAU);e.wx=Math.cos(a);e.wy=Math.sin(a);e.moving=Math.random()<.6}
  if(e.moving)move(e,e.wx*sp*.4*dt,e.wy*sp*.4*dt);
}
function updateEnemy(e,dt){
  if(e.poison){
    const po=e.poison;po.t-=dt;po.acc+=po.dps*dt;po.tick+=dt;
    if(po.tick>=.5){const dd=Math.max(1,Math.round(po.acc));po.acc=0;po.tick=0;e.hp-=dd;e.flash=.05;floatText(e.x,e.y-12,dd,'#8ae04a');if(e.hp<=0&&!e.dead){killEnemy(e);return}}
    if(po.t<=0)e.poison=null;
  }
  if(e.blind>0){e.blind-=dt;e.flash=Math.max(0,e.flash-dt);wander(e,dt,e.speed*.5);return}
  e.flash=Math.max(0,e.flash-dt);e.cd-=dt;e.hitCd-=dt;e.slow-=dt;e.stun-=dt;e.anim+=dt*6;
  if(Math.abs(e.kx)+Math.abs(e.ky)>1){move(e,e.kx*dt,e.ky*dt);const f=Math.pow(.02,dt);e.kx*=f;e.ky*=f}
  if(e.stun>0)return;
  const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
  if(e.kit){
    // facing: it turns towards the hero at a limited rate (a back weak point needs a slow turner)
    if(e.kit.rear&&!e.dash&&!e.windup&&e.state!=='charge'&&e.state!=='wind'){
      const cur=Math.atan2(e.fy,e.fx),want=Math.atan2(dy,dx);let df=((want-cur+Math.PI*3)%TAU)-Math.PI;
      const st=Math.min(Math.abs(df),(e.kit.turn||1.4)*(e.type==='boss'?1+.2*(e.phase||0):1)*dt);
      const na=cur+Math.sign(df)*st;e.fx=Math.cos(na);e.fy=Math.sin(na);
    }else if(!e.kit.rear){e.fx=dx/d;e.fy=dy/d}
    // escorts: the shield falls when the last one is dead
    if(e.shielded&&!E.some(o=>o.minion===e&&!o.dead)){e.shielded=false;e.weak=e.kit.dur;fx({k:'ring',x:e.x,y:e.y,r0:4,r1:50,t:0,dur:.5,c:'#ffe040'});Snd.boom();toast('The guard is broken! Strike now!','#ffe040')}
    if(e.weak>0){
      e.weak-=dt;e.hitCd=Math.max(e.hitCd,.3);e.tele=null;
      if(Math.random()<.25)puff(e.x+rand(-6,6),e.y-e.hh-6,1,'#ffe040',25);
      return;
    }
  }
  AI[e.type](e,dt,d,dx/d,dy/d,e.speed*(e.slow>0?.5:1));
  if(d<e.hw+P.hw+3&&e.hitCd<=0&&e.state!=='dormant'){
    hurtPlayer(e.dmg*(e.state==='charge'?1.5:e.type==='boss'?.6:1),e.x,e.y);e.hitCd=.9;
    if(e.mod==='vamp')e.hp=Math.min(e.maxHp,e.hp+e.dmg*.6);
  }
}
function separate(){
  const L=M.id==='world'?E.filter(e=>Math.abs(e.x-P.x)<320&&Math.abs(e.y-P.y)<240):E;
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){
    const a=L[i],b=L[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.hw+b.hw;
    if(d>0&&d<m){const p=(m-d)*.25,ux=dx/d,uy=dy/d;move(a,-ux*p,-uy*p);move(b,ux*p,uy*p)}
  }
}

// ---------- interaction ----------
function nearestInteract(){
  let best=null,bd=26;
  for(const n of NP){const d=Math.hypot(n.x-P.x,n.y-P.y);if(d<bd){bd=d;best={k:'npc',o:n,x:n.x,y:n.y-16}}}
  for(const c of CH){if(c.open)continue;const d=Math.hypot(c.x-P.x,c.y-P.y);if(d<bd){bd=d;best={k:'chest',o:c,x:c.x,y:c.y-12}}}
  for(const p of M.props){if(p.k!=='sign'&&p.k!=='waypoint'&&p.k!=='tome'&&p.k!=='board'&&p.k!=='ftree'&&!p.use)continue;const sx=(p.tx+.5)*TS,sy=(p.ty+.5)*TS,d=Math.hypot(sx-P.x,sy-P.y);if(d<24&&d<bd){bd=d;best={k:p.k==='sign'?'sign':p.k==='tome'?'tome':p.k==='board'?'board':p.use?'use':p.k==='ftree'?'ftree':'wp',o:p,x:sx,y:sy-12}}}
  // vines in front of the player
  const fx2=P.x+P.face.x*14,fy2=P.y+P.face.y*14;
  for(const sl of M.seals)if(!flags[sl.flag]&&sl.tiles.some(([x,y])=>Math.hypot((x+.5)*TS-fx2,(y+.5)*TS-fy2)<12)&&bd>12)best={k:'seal',o:sl,x:fx2,y:fy2-10};
  if(M.t[Math.floor(fy2/TS)*M.w+Math.floor(fx2/TS)]===T.VINE&&bd>12)best={k:'vine',x:Math.floor(fx2/TS)*TS+8,y:Math.floor(fy2/TS)*TS-4};
  return best;
}
function say(name,pages,onEnd){ui={mode:'dialog',d:{name,pages,i:0,onEnd}}}
function interact(it){
  if(it.k==='chest'){openChest(it.o);return}
  if(it.k==='sign'){say('Signpost',[it.o.text]);return}
  if(it.k==='seal'){say(it.o.title||'Boulder',[it.o.text]);return}
  if(it.k==='wp'){useWaypoint();return}
  if(it.k==='vine'){
    if(it.cut){
      cutVines();
      say('Thorn Vines',[it.fire?'The flames eat through the thorns. The way is open!':curZone()==='glade'&&P.y>(WROW0[2]+WROWH[2]*.5)*TS?'You cut through the thorn vines with the Thornsickle! The road south to Amber Hollow is open.':curZone()==='village'?'The Thornsickle cuts the roots away. A hidden cellar lies beyond!':'The Thornsickle makes short work of the thorns. The way is open!']);
    }else say('Thorn Vines',[flags.sickle?'Thick thorny vines block the way. Put the Thornsickle on K or L and swing it at them.':'Thick thorny vines block the way. You need something sharp to cut through.']);
    return;
  }
  if(it.k==='use'){HOUSE_USE[it.o.use](it.o);return}
  if(it.k==='ftree'){ftreeTalk(it.o);return}
  if(it.k==='tome'){readTome(it.o.id);return}
  const n=it.o;
  if(it.k==='board'){useBoard();return}
  if(it.k==='npc'&&tradeTalk(n))return;
  if(n.id==='zn'){if(znQuest(n))return;const z=ZNPC[n.zone];say(n.name,flags[ZNPCBOSS[n.zone]]?z.post:z.pre);return}
  if(n.walk){say(n.name,[pick(n.lines)]);return}
  if(n.id==='lia'){liaTalk();return}
  if(n.id==='merchant'){merchantMenu(n);return}
  if(n.id==='elder'){
    if(flags.stage===0&&!flags.sword)say(n.name,[`Welcome home, ${P.hero.name}. The forest is sick: the leaves rot from the inside, and beetles and wolves grow bolder every night.`,'The old guardians of the woods have gone mad. Someone has to go in and end it. I think you know who.','Wait. I kept something for you. Your old sword. I hoped you would never need it again.','Now you do.'],()=>itemGet('sword',()=>{flags.tut=1;toast('Quest: '+questNow());save()}));
    else if(flags.stage===0&&!flags.shield&&!(flags.tut>=2))say(n.name,['Show me you have not forgotten how to swing it. A few beetles are creeping around the square.','Strike them down, then come back to me.']);
    else if(flags.stage===0&&!flags.shield)say(n.name,['Not bad at all. Your arm remembers.','Take this too. It hung beside your sword. A swing is only half of fighting.'],()=>itemGet('shield',()=>{flags.stage=1;flags.tut=3;say(n.name,['Now go east into Ember Glade. The Hollow Oak lies at its northern end. Defeat Old Barkfather and bring me what he protects.','Visit the Smith and the Alchemist first!'],()=>{toast('Quest: '+QUEST[1]);save()})}));
    else if(flags.boss&&!flags.rewarded)say(n.name,['You did it! The Thornsickle... with it, the thorn vines on the south road of Ember Glade will finally yield.','Take this reward. The smith has reforged your blade and tunic from the heartwood, and the Alchemist has potions waiting.'],()=>{
      flags.rewarded=true;if(flags.stage<4)flags.stage=4;P.gold+=150;P.potions=Math.min(9,P.potions+2);toast('Received 150g and 2 potions','#ffe9a0');save()});
    else if(flags.stage<3)say(n.name,['The road east leads into Ember Glade. The Hollow Oak is at its northern end. Be careful out there.']);
    else if(flags.stage===3)say(n.name,['Come back once you have defeated Old Barkfather and opened the oak chest.']);
    else if(flags.stage===4)say(n.name,['The thorn vines on the south road of Ember Glade will yield to your Thornsickle. Beyond them lies Amber Hollow. Also, the lane between the smithy and the tavern has been overgrown for years. Who knows what hides behind those thorns?']);
    else if(flags.stage===5)say(n.name,['Amber Hollow is thick with spores. The Spore Warren lies beyond the thorn wall. Mother Mycelia rules there. Take care.']);
    else if(flags.stage===6)say(n.name,['The Wooden Boots! With them you can wade the flooded ford at the west end of Amber Hollow, into the Mistwater Marsh.']);
    else if(flags.stage===7)say(n.name,['Mistwater Marsh... Rustpeak rises beyond it, but a gorge cuts it off. We would need a hook to cross. Old tales speak of a Sunken Shrine in the marsh, guarded by the Drowned Matron.']);
    else if(flags.stage===8)say(n.name,['The Grapple Hook! With it you can cross the gorge at the west edge of the marsh. Rustpeak awaits. And some gorges in the earlier lands might be worth a second look...']);
    else if(flags.stage===9)say(n.name,['Rustpeak is a hard land of rust wolves and brutes. The old mine lies deep in the highlands. Its warden has slept there for ages. Remember the waypoints: touch one and you can travel between them.']);
    else if(flags.stage>=10&&flags.stage<32)say(n.name,[ELDER_MID[flags.stage-10]]);
    else say(n.name,['You saved the Spicewoods! The village will never forget your name.',flags.boss11?'You have seen every corner of the world, hero. The Heart rests, and so can we.':'Travelers speak of strange lands beyond the road: jungle to the east, mesa and meadow to the north, and a frozen ridge past the Heart. There is always more to find.']);
  }else if(n.id==='smith'){smithTalk(n);
  }else if(n.id==='alch'){alchTalk(n);
  }else if(n.id==='tavern'){tavernTalk(n);
  }else if(n.id==='stash'){
    shopTalk(n);
  }
}
function menu(title,opts,closable,foot){return{mode:'menu',title,opts,sel:0,closable,foot}}

// ---------- side quests (the far regions) ----------
const SIDEQ=[];   // the main road is one fixed chain now (QUEST), see DESIGN.md
function sideQuests(){
  const L=[];
  for(const q of SIDEQ){if(flags[q.boss]||!q.open())continue;L.push('Side: '+(flags.seen[q.z]?q.inside:q.hint));if(L.length>=2)break}
  for(const h of hearthHints())L.push(h);
  return L;
}

// ---------- waypoints and world map ----------
const DUNZONE={dungeon:'glade',spore:'amber',shrine:'marsh',mine:'rust',crypt:'grove'};
const curZone=()=>M.id==='world'?regionAtPx(P.x,P.y):(WORLD[M.id]?M.id:(M.zone||zoneOf(M.id)));
function useWaypoint(){
  const id=curZone();
  if(!flags.wp[id]){flags.wp[id]=true;toast('Waypoint attuned! You can travel here from any other waypoint.','#8fd0ff');Snd.open();puff(P.x,P.y-8,14,'#8fd0ff',70);save()}
  const lt=nextLetter();
  if(lt){say('A letter from Elder Maren',lt.pages,()=>useWaypoint());save();return}
  const opts=[];
  for(const z in WORLD){
    if(z===id||!flags.wp[z])continue;
    ensureZone(z);const w=WPS[z];
    opts.push({t:`Travel to ${WORLD[z].name}`,fn(){startFade(()=>{if(M.id==='world'){P.x=(w[0]+.5)*TS;P.y=(w[1]+1.5)*TS;P.kx=P.ky=0;snapCam();regionTick(true)}else loadMap('world',(w[0]+.5)*TS,(w[1]+1.5)*TS)})}});
  }
  opts.push({t:'World map',fn(){ui={mode:'map'};return true}});
  opts.push({t:'Cancel',fn(){}});
  ui=menu('Waypoint: '+WORLD[id].name,opts,true,()=>opts.length<3?'Find more waypoints to travel between zones.':'');
}
function drawBossIntro(){
  const t=ui.t,bi=bossOf(ui.e),a=Math.min(1,t*3),out=t>2.2?Math.max(0,1-(t-2.2)/.4):1;
  cx.fillStyle='#000';cx.fillRect(0,0,W,Math.round(46*a));cx.fillRect(0,H-Math.round(46*a),W,Math.round(46*a));
  if(t<.25){cx.fillStyle=`rgba(255,240,200,${.6*(1-t/.25)})`;cx.fillRect(0,0,W,H)}
  cx.globalAlpha=out*Math.min(1,Math.max(0,(t-.3)*3));
  text(bi.name,W/2,H-46*a+4,'#ffd0a0',16,'center',true);
  text(bi.epi,W/2,H-46*a+24,'#c8a888',8,'center');
  cx.globalAlpha=1;
  reg(0,0,W,H,()=>{if(ui&&ui.t>.9)ui=null});
}
let WMMBASE=null,WMMHINT=null,WMMTMP=null;
// unexplored land: beige parchment with darker beige drawings of what is there (waves, trees, peaks, dunes ...), like the Link's Awakening map
const HINTCELL=13;   // one drawing per 13x13 screen pixels
const HINTOF={4:'water',25:'water',3:'forest',15:'forest',16:'forest',38:'forest',32:'pine',35:'pine',8:'rock',30:'rock',29:'rock',27:'rock',34:'sand',36:'sand',33:'snow',37:'crystal',39:'ash',40:'ash'};
const HINTART={
  water:['.......','.##..##','#..##..'],
  forest:['..###..','.#####.','#######','...#...'],
  pine:['...#...','..###..','.#####.','...#...'],
  rock:['...#...','..#.#..','.#...#.','#..#..#'],
  sand:['.......','.###...','#...###'],
  snow:['#..#..#','.#.#.#.','..###..','.#.#.#.'],
  crystal:['...#...','..###..','.#####.','..###..','...#...'],
  ash:['...#...','..###..','.#####.','#######'],
  ground:['.......','...#...','.......']
};
function buildMapHint(mw,mh,sc){
  const c=document.createElement('canvas');c.width=mw;c.height=mh;c.key=mw+'x'+mh;
  const g=c.getContext('2d'),w=WTEMPLATE.w,h=WTEMPLATE.h,tpc=HINTCELL/sc;   // tiles per drawing cell
  g.fillStyle='#d9c9a0';g.fillRect(0,0,mw,mh);
  g.fillStyle='#cdbb8e';for(let i=0;i<mw*mh/40;i++)g.fillRect(((i*7919)%mw),((i*104729)%mh),1,1);   // a little grain
  for(let cy=0;cy*HINTCELL<mh;cy++)for(let cx2=0;cx2*HINTCELL<mw;cx2++){
    const n={};let best='ground',bn=0;
    for(let j=0;j<tpc;j+=2)for(let i=0;i<tpc;i+=2){
      const x=Math.floor(cx2*tpc+i),y=Math.floor(cy*tpc+j);if(x>=w||y>=h)continue;
      const k=HINTOF[WTEMPLATE.t[y*w+x]]||'ground';n[k]=(n[k]||0)+(k==='ground'?.5:1);
      if(n[k]>bn){bn=n[k];best=k}
    }
    if(best==='ground'&&(((cx2*73856093)^(cy*19349663))>>>0)%3)continue;   // open ground stays mostly bare
    const art=HINTART[best];
    g.fillStyle=best==='water'?'#b9b08a':'#a8956a';
    art.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='#')g.fillRect(cx2*HINTCELL+i+3,cy*HINTCELL+j+3,1,1)});
  }
  return c;
}
function drawMap(){
  const w=366,h=222,x=Math.round((W-w)/2),y=Math.round((H-h)/2);
  panel(x,y,w,h);
  text('The Spicewoods',x+w/2,y+7,'#ffd040',9,'center',true);
  ensureWorld();
  // the explored world: terrain of the whole map under the fog of what the hero has not seen yet
  if(!WMMBASE||WMMBASE.w!==WTEMPLATE.w){
    const c=document.createElement('canvas');c.width=WTEMPLATE.w;c.height=WTEMPLATE.h;const g=c.getContext('2d'),img=g.createImageData(c.width,c.height),D=img.data;
    for(let i=0;i<WTEMPLATE.t.length;i++){const col=MMC[WTEMPLATE.t[i]]||[60,60,60];D[i*4]=col[0];D[i*4+1]=col[1];D[i*4+2]=col[2];D[i*4+3]=255}
    g.putImageData(img,0,0);WMMBASE=c;
  }
  const WWt=WTEMPLATE.w,WHt=WTEMPLATE.h,sc=Math.min(240/WWt,(h-34)/WHt),mw=Math.round(WWt*sc),mh=Math.round(WHt*sc),mx=x+8,my=y+22;
  cx.fillStyle='#0c0805';cx.fillRect(mx-1,my-1,mw+2,mh+2);
  if(!WMMHINT||WMMHINT.key!==mw+'x'+mh)WMMHINT=buildMapHint(mw,mh,sc);
  cx.drawImage(WMMHINT,mx,my);
  const fog=MMFOG.world;
  if(fog){   // the explored part: the real terrain, cut out of the fog
    if(!WMMTMP||WMMTMP.width!==WMMBASE.width){WMMTMP=document.createElement('canvas');WMMTMP.width=WMMBASE.width;WMMTMP.height=WMMBASE.height}
    const tg=WMMTMP.getContext('2d');tg.globalCompositeOperation='source-over';tg.clearRect(0,0,WMMTMP.width,WMMTMP.height);
    tg.drawImage(WMMBASE,0,0);tg.globalCompositeOperation='destination-out';tg.drawImage(fog.c,0,0,WMMTMP.width,WMMTMP.height);
    cx.drawImage(WMMTMP,mx,my,mw,mh);
  }
  cx.strokeStyle='#8a6a3a';cx.strokeRect(mx-.5,my-.5,mw+1,mh+1);
  const cen=id=>{const c=ZCELL[id];return{x:mx+(WCOL0[c.c]+WCOLW[c.c]/2)*sc,y:my+(WROW0[c.r]+WROWH[c.r]/2)*sc}};
  const cur=curZone();
  // region names (only of regions the hero has been to)
  for(const id in WORLD){
    const p=cen(id),seen=flags.seen[id];
    if(seen)text(WORLD[id].name,p.x,p.y-3,'#ffffff',6,'center',true);
    if(flags.wp[id]&&WPS[id]){const wx=mx+(WPS[id][0]+.5)*sc,wy=my+(WPS[id][1]+.5)*sc;cx.fillStyle='#8fd0ff';cx.fillRect(Math.round(wx)-2,Math.round(wy)-2,5,5);cx.fillStyle='#fff';cx.fillRect(Math.round(wx)-1,Math.round(wy)-1,2,2)}
  }
  for(const r of rumorTargets()){const rx=mx+r.x*sc,ry=my+r.y*sc;cx.fillStyle='#000';cx.fillRect(Math.round(rx)-3,Math.round(ry)-3,7,7);cx.fillStyle=Math.floor(time*3)%2?'#fff0a0':'#ffc840';cx.fillRect(Math.round(rx)-2,Math.round(ry)-2,5,5)}   // peddler rumors
  // the hero
  if(M.id==='world'&&Math.floor(time*2.5)%2){const hx=mx+P.x/TS*sc,hy=my+P.y/TS*sc;cx.fillStyle='#ffe040';cx.fillRect(Math.round(hx)-2,Math.round(hy)-2,5,5);cx.strokeStyle='#000';cx.strokeRect(Math.round(hx)-2.5,Math.round(hy)-2.5,5,5)}
  const lx=mx+mw+10;
  text('Yellow: you   Blue: waypoint',lx,my+mh-24,'#a89878',5);
  text('N or Backspace: close',lx,my+mh-8,'#a89878',5);
  reg(0,0,W,H,()=>{ui=null});
}

// ---------- update ----------
function updatePlay(dt){
  if(M.dungeon&&slideT>0){slideT-=dt;stepCam(dt);return}   // the screen scrolls into the next room
  P.comboT=(P.comboT||0)-dt;updateAttack(dt);
  if(P.buff){P.buff.t-=dt;if(P.buff.t<=0)P.buff=null}
  if(P.buffs.length){for(const b of P.buffs)b.t-=dt;if(P.buffs.some(b=>b.t<=0)){P.buffs=P.buffs.filter(b=>b.t>0);recalc();toast('A buff wore off')}}
  P.stealth=Math.max(0,P.stealth-dt);
  if(P.mods.regenHp)P.hp=Math.min(P.maxHp,P.hp+P.mods.regenHp*dt);
  for(const d of DELAY)d.t-=dt;
  for(const d of DELAY.filter(d=>d.t<=0)){if(d.sk){const sv=SKS;SKS=d.sk;SKACT=true;try{d.fn()}finally{SKACT=false;SKS=sv}}else d.fn()}
  DELAY=DELAY.filter(d=>d.t>0);
  for(const t of TRAPS){t.t-=dt;for(const e of E){if(!e.dead&&Math.hypot(e.x-t.x,e.y-t.y)<e.hw+8){t.t=0;aoeAt(t.x,t.y,26,t.mult,60,{slow:3},'#7fd06a');break}}}
  TRAPS=TRAPS.filter(t=>t.t>0);
  P.atkT-=dt;P.rollCd-=dt;P.potCd-=dt;P.inv-=dt;P.flash-=dt;P.swing-=dt;P.noRes=(P.noRes||0)-dt;
  P.cd[0]-=dt;P.cd[1]-=dt;P.cd[2]-=dt;
  if(P.tcd){P.tcd[0]-=dt;P.tcd[1]-=dt}
  ftreeUpdate(dt);tutUpdate();syncTouch();unstickTick(dt);
  // resource
  if(P.hero.id==='warrior'){P.rageT-=dt;if(P.rageT<=0)P.res=Math.max(0,P.res-5*dt)}
  else P.res=Math.min(P.resMax,P.res+P.regen*dt);

  const ax=Input.axis();
  if(P.kx||P.ky){move(P,P.kx*dt,P.ky*dt);P.kx*=Math.pow(.003,dt);P.ky*=Math.pow(.003,dt);if(Math.abs(P.kx)+Math.abs(P.ky)<5)P.kx=P.ky=0}
  if(Input.hit('attack'))P.buf=.18;
  P.buf=(P.buf||0)-dt;
  if(P.rollT>0){
    P.rollT-=dt;move(P,P.rvx*dt,P.rvy*dt);
  }else if(P.dashT>0){
    P.dashT-=dt;move(P,P.dvx*dt,P.dvy*dt);
    for(const e of E)if(!e.dead&&!P.hitSet.has(e)&&dist(e,P)<e.hw+12){P.hitSet.add(e);hitEnemy(e,P.dashMult,P.face.x,P.face.y,90,{crit:P.dashExec&&e.hp<e.maxHp*.4})}
    cutAround(P.x,P.y,14);
    if(Math.random()<.8)puff(P.x,P.y,1,P.hero.light,20);
  }else{
    P.moving=ax.l>.1;
    if(P.moving){
      if(!P.att&&!P.blocking)P.face={x:ax.x/ax.l,y:ax.y/ax.l};
      P.anim+=dt*9;
      const sf=P.att?.2:(P.blocking?.5:1);
      fieldMove(dt,ax,sf);
    }else if(M.fields&&M.fields.length)fieldMove(dt,ax,1);   // ice keeps you sliding, currents keep pushing
    if(Input.down('attack')||P.buf>0){if(P.atkT<=0){P.buf=0;doAttack()}}
    syncToolSlots();
    if(Input.hit('skill1'))useTool(0);
    if(Input.hit('skill2'))useTool(1);
    P.blocking=!!flags.shield&&Input.down('roll')&&!P.att&&P.dashT<=0;   // the shield replaces the roll
    if(Input.hit('potion'))usePotion();
    if(Input.hit('scroll'))useScroll();
    if(Input.hit('interact')||Input.hit('enter')){const it=nearestInteract();if(it){interact(it);return}}
  }
  if(Input.hit('map')){ui={mode:M.dungeon&&M.layout?'dmap':'map'};Snd.menu();return}
  if(Input.hit('mm'))mmMode=(mmMode+1)%3;
  if(Input.hit('guide'))startGuide(true);
  if(Input.hit('inv')){openInv(0);Snd.menu();return}
  if(Input.hit('codex')){openInv(2);Snd.menu();return}
  if(Input.hit('pause')||Input.hit('back')){openPause();return}
  if(Input.hit('mute'))toast(Snd.toggle()?'Sound on':'Sound off');
  updateAmbient(dt);updateFields(dt);updateTrials(dt);
  Music.play(E.some(e=>e.type==='boss'&&e.state==='fight'&&!e.dead)?'boss':zoneMusic(curZone()));
  if(M.dungeon||(M.plates&&M.plates.length))updateBlocks(dt);
  if(M.id==='world')regionTick(false);
  betrayalCheck();
  sceneTick();
  if(M.id==='world'){for(const e of E){if(e.type!=='boss'&&e.state==='idle'&&(Math.abs(e.x-P.x)>360||Math.abs(e.y-P.y)>260)){e.flash=0;continue}updateEnemy(e,dt)}}
  else for(const e of E)updateEnemy(e,dt);
  E=E.filter(e=>!e.dead);
  separate();
  updateProjectiles(dt);updateEnemyProjectiles(dt);pickups(dt);
  // doors
  if(M.rooms)updateRooms();
  if(M.gates)tryKeyDoor();
  // warps
  if(fade.dir===0)for(const w of M.warps){
    if(P.x>w.x&&P.x<w.x+w.w&&P.y>w.y&&P.y<w.y+w.h){
      if(w.need&&!flags[w.need]){if(w.back){P.x=w.back.x;P.y=w.back.y}else P.x=w.x-4;if(!P.needMsg||P.needMsg<time-2.5){P.needMsg=time;toast(w.needText,'#ff8070')}break}
      if(w.set&&!flags[w.set]){flags[w.set]=true;toast(w.setText,'#a8e0a0')}
      if(w.to===M.id){const wx=w.tx,wy=w.ty;startFade(()=>{P.x=wx;P.y=wy;P.kx=P.ky=0;E=E.filter(e=>!e.dead);snapCam();regionTick(true)})}
      else startFade(()=>loadMap(w.to,w.tx,w.ty));break}
  }
  // camera
  stepCam(dt);
}
// ---- entrance markers (drawn over the tile layer so mouths stand out in the world, not only on the map)
// main dungeons: individual gate (accent colour + emblem); side caves: one shared glowing marker
const ENTR={
  dungeon:{c:'#7bd34a',e:'leaf'},spore:{c:'#c98aff',e:'shroom'},shrine:{c:'#4ec8e8',e:'drop'},mine:{c:'#e0a040',e:'pick'},crypt:{c:'#9ad0c0',e:'skull'},
  granary:{c:'#ffd24a',e:'grain'},forge:{c:'#ff7a30',e:'flame'},rootmaw:{c:'#7ac060',e:'root'},cellar:{c:'#ff9a50',e:'jar'},sandhall:{c:'#f0d080',e:'sun'},
  citadel:{c:'#a8d8ff',e:'wind'},magmacore:{c:'#ff4a30',e:'flame'},prismvault:{c:'#e0a0ff',e:'gem'},reliquary:{c:'#d8f4ff',e:'snow'}
};
// each dungeon has its own doorway (colour and emblem were not enough)
const ENTSTYLE={dungeon:'oak',spore:'shroom',shrine:'moss',mine:'timber',crypt:'bone',granary:'barn',forge:'forge',rootmaw:'thorn',cellar:'barrel',sandhall:'sand',citadel:'white',magmacore:'obsidian',prismvault:'crystal',reliquary:'ice'};
for(const k in ENTSTYLE)ENTR[k].s=ENTSTYLE[k];
function drawEntranceFrame(style,x0,y0,w,c,fl){
  const R=(col,dx,dy,ww,hh)=>{cx.fillStyle=col;cx.fillRect(x0+dx,y0+dy,ww,hh)};
  const pil=(base,lit,dark,top)=>{   // two pillars and a lintel in the given colours
    R('#000',-7,-14,7,30);R('#000',w,-14,7,30);R('#000',-7,-18,w+14,7);
    R(base,-6,-13,5,28);R(base,w+1,-13,5,28);R(top||base,-6,-17,w+12,5);
    R(lit,-6,-17,w+12,1);R(lit,-6,-13,1,28);R(lit,w+1,-13,1,28);R(dark,-2,-13,1,28);R(dark,w+5,-13,1,28);
  };
  switch(style){
    case'oak':pil('#5a3a1c','#8a5c30','#2a1a0a','#3a6a20');R('#2a5a18',-8,-20,w+16,4);for(const dx of[-9,w+5]){R('#4a2c14',dx,12,5,4);R('#4a2c14',dx+(dx<0?-2:6),14,3,2)}R('#6aae3a',-4,-21,6,2);R('#6aae3a',w-2,-21,6,2);break;
    case'shroom':pil('#d8c8b0','#f0e8d8','#a89878','#a84a8a');R('#d870b8',-9,-21,w+18,5);R('#fff',-4,-20,3,2);R('#fff',w,-19,3,2);R('#fff',w/2,-21,2,2);break;
    case'moss':pil('#5a7a6a','#8ab0a0','#2a4a3a','#4a6a5a');R('#3a8a4a',-6,-17,w+12,2);R('#3a8a4a',-6,-5,3,8);R('#3a8a4a',w+3,-9,3,10);R('#4ec8e8',-2,8,w+4,2);break;
    case'timber':pil('#7a5230','#a87a48','#3a2410','#6a4424');R('#3a2410',-6,-3,w+12,2);R('#3a2410',-6,5,w+12,2);R('#b0b0b8',-2,14,w+4,1);R('#b0b0b8',-2,17,w+4,1);for(let i=0;i<w;i+=4)R('#5a3a20',i,15,2,4);break;
    case'bone':pil('#d8d0b8','#f4eedc','#a09878','#e0d8c0');R('#000',w/2-4,-30,9,11);R('#f0eada',w/2-3,-29,7,9);R('#1a1410',w/2-2,-27,2,2);R('#1a1410',w/2+1,-27,2,2);break;
    case'barn':pil('#b08a3a','#e0b858','#6a4a14','#8a5a22');R('#e8c860',-8,-22,w+16,3);R('#d8b040',-10,10,5,6);R('#d8b040',w+5,10,5,6);R('#8a6a1a',-10,10,5,1);break;
    case'forge':pil('#4a3a36','#7a6258','#1a1210','#3a2a26');R('#ff7a30',-6,-9,5,2);R('#ff7a30',w+1,-9,5,2);R('#2a1a14',-6,-26,4,9);R('#2a1a14',w+2,-26,4,9);R('#ff9a50',-5,-12,3,3);break;
    case'thorn':pil('#3a5a22','#6a9a3a','#1a2a10','#2a4a18');for(const[dx,dy]of[[-8,-8],[-8,2],[w+6,-6],[w+6,4],[-3,-19],[w-1,-19]])R('#a83a3a',dx,dy,2,2);R('#2a4a18',-8,-14,2,10);R('#2a4a18',w+6,-14,2,10);break;
    case'barrel':pil('#8a5a2a','#b88040','#4a2a10','#6a3a18');for(let i=0;i<4;i++){R('#3a2410',-6,-12+i*7,5,1);R('#3a2410',w+1,-12+i*7,5,1)}R('#c8d0d8',w/2-1,-12,3,2);break;
    case'sand':pil('#d8b878','#f0d498','#a88848','#c8a868');R('#8a6a30',-6,-14,w+12,1);R('#8a6a30',w/2-3,-16,7,1);R('#a88848',-5,-6,3,3);R('#a88848',w+2,0,3,3);break;
    case'white':pil('#e8e8f0','#ffffff','#a8a8b8','#d8d8e4');R('#4a7ad8',-5,-12,3,12);R('#4a7ad8',w+2,-12,3,12);R('#fff',-4,-12,1,12);break;
    case'obsidian':pil('#2a2430','#4a4058','#0a080e','#1a1620');R('#ff4a30',-6,-8,5,2);R('#ff4a30',w+1,-3,5,2);R('#ff8a40',-4,10,w+8,2);break;
    case'crystal':pil('#b890e8','#e8d0ff','#6a48a0','#9a70d0');R('#fff',-4,-24,2,8);R('#fff',w+2,-22,2,6);R('#e0a0ff',-8,-22,3,6);R('#e0a0ff',w+6,-24,3,8);break;
    case'ice':pil('#b8e0f4','#f0fbff','#78a8c8','#a0d0e8');R('#fff',-5,-12,3,4);R('#d8f4ff',w+2,-10,3,6);R('#78a8c8',-8,-24,3,7);R('#78a8c8',w+6,-22,3,5);R('#78a8c8',w/2-1,-24,3,5);break;
    default:pil('#8a8478','#b8b0a0','#4a463e');
  }
  R(c,-6,-12,5,2);R(c,w+1,-12,5,2);
}
const EMBLEM={
  leaf:['..##.','.###.','####.','.##..','#....'],shroom:['.###.','#####','.###.','..#..','..#..'],drop:['..#..','.###.','#####','#####','.###.'],
  pick:['.###.','#...#','..#..','..#..','..#..'],skull:['.###.','#####','#.#.#','.###.','.#.#.'],grain:['#.#.#','.###.','#.#.#','..#..','..#..'],
  flame:['..#..','.##..','.###.','#####','.###.'],root:['#.#.#','.###.','..#..','.#.#.','#...#'],jar:['.###.','#####','#####','#####','.###.'],
  sun:['#.#.#','.###.','#####','.###.','#.#.#'],wind:['####.','....#','.###.','....#','####.'],gem:['.###.','#####','.###.','..#..','.....'],snow:['#.#.#','.###.','#####','.###.','#.#.#']
};
function drawEmblem(name,x,y,c,s){
  const b=EMBLEM[name];if(!b)return;
  cx.fillStyle='#000';for(let j=0;j<5;j++)for(let i=0;i<5;i++)if(b[j][i]==='#')cx.fillRect(x+i*s-1,y+j*s-1,s+2,s+2);
  cx.fillStyle=c;for(let j=0;j<5;j++)for(let i=0;i<5;i++)if(b[j][i]==='#')cx.fillRect(x+i*s,y+j*s,s,s);
}
function glow(x,y,r,rgb,a){
  const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);
  cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2);
}
function hexRgb(h){return parseInt(h.slice(1,3),16)+','+parseInt(h.slice(3,5),16)+','+parseInt(h.slice(5,7),16)}
function drawEntrances(){
  if(M.id!=='world')return;
  for(const w of M.warps){
    const dun=ENTR[w.to],cave=!dun&&typeof w.to==='string'&&w.to.startsWith('cave_');
    if(!dun&&!cave)continue;
    const mx=w.x+w.w/2,my=w.y+w.h/2;
    if(mx<cam.x-60||mx>cam.x+W+60||my<cam.y-70||my>cam.y+H+60)continue;
    const fl=.5+.5*Math.sin(time*6+w.x);
    if(dun){
      const c=dun.c,rgb=hexRgb(c),x0=w.x,y0=w.y;
      glow(mx,my+4,34+4*fl,rgb,.38+.12*fl);
      // stone pillars and lintel
      drawEntranceFrame(dun.s||'stone',x0,y0,w.w,c,fl);
      // flickering torches on the pillars
      for(const tx of[x0-4,x0+w.w+3]){
        const fy=y0-20-fl*2;
        glow(tx,fy+2,12,'255,190,80',.55);
        cx.fillStyle='#ffd060';cx.fillRect(tx-1,fy,3,4);cx.fillStyle='#ff7a20';cx.fillRect(tx-1,fy+2,3,2);
      }
      // emblem plaque above the gate
      const ey=y0-37+Math.sin(time*2)*1.5;
      cx.fillStyle='#000';cx.fillRect(mx-11,ey-3,22,17);cx.fillStyle=c;cx.fillRect(mx-10,ey-2,20,15);cx.fillStyle='#1a1410';cx.fillRect(mx-9,ey-1,18,13);
      drawEmblem(dun.e,mx-7,ey,c,3);
    }else{
      // side cave: warm pulsing beacon + two little lanterns + bobbing arrow
      const x0=w.x,y0=w.y,by=Math.sin(time*3+w.x)*2;
      glow(mx,my+6,26+3*fl,'255,200,90',.34+.14*fl);
      for(const lx of[x0-5,x0+w.w+4]){
        cx.fillStyle='#000';cx.fillRect(lx-2,y0+4,5,9);cx.fillStyle='#5a3e24';cx.fillRect(lx-1,y0+5,3,8);
        glow(lx,y0+3,9,'255,190,80',.5+.2*fl);
        cx.fillStyle='#ffe08a';cx.fillRect(lx-1,y0+1,3,3);
      }
      const ay=y0-9+by;
      cx.fillStyle='#000';cx.fillRect(mx-5,ay-1,10,3);cx.fillRect(mx-4,ay+2,8,2);cx.fillRect(mx-3,ay+4,6,2);cx.fillRect(mx-2,ay+6,4,2);
      cx.fillStyle='#ffd24a';cx.fillRect(mx-4,ay,8,2);cx.fillRect(mx-3,ay+2,6,1);cx.fillRect(mx-2,ay+3,4,1);cx.fillRect(mx-1,ay+4,2,1);
    }
  }
}
const VOL=[0,.3,.6,.9];
const SFXV=[0,.4,.7,1];
function nextOf(list,v){let i=list.findIndex(x=>Math.abs(x-v)<.05);return list[(i+1)%list.length]}
function openPause(){
  ui=menu('Paused',[
    {t:'Resume',fn(){}},
    {t:'World map',fn(){ui={mode:'map'};return true}},
    {t:'Save game',fn(){save();toast('Game saved')}},
    {t:()=>`Music: ${Math.round(Snd.cfg.music*100)}%`,fn(){Snd.setMusic(nextOf(VOL,Snd.cfg.music));Snd.init();return true}},
    {t:()=>`Sound effects: ${Math.round(Snd.cfg.sfx*100)}%`,fn(){Snd.setSfx(nextOf(SFXV,Snd.cfg.sfx));Snd.menu();return true}},
    {t:()=>`Minimap: ${['off','small','large'][mmMode]}`,fn(){mmMode=(mmMode+1)%3;return true}},
    {t:'Controls',fn(){showControls()}},
    {t:'Account and save codes',fn(){Account.open()}},
    {t:'Quit to title',fn(){save();scene='title';tsel=0;ui=null;Music.play('title')}}],true);
}
function showControls(){
  say('Controls',[
    'Move: WASD or arrow keys. Attack: J (hit up to three times in a row for a heavy finisher). Shield: hold Space to block hits from the front.',
    'Tools: K and L (choose them in the bag under Key Items). Potion: Q. Interact, talk, open chests: E or Enter. Cut bushes, pots, logs and ore with your weapon.',
    'Bag: I. World map: N. Pause: P. Back or close: Backspace. Mute: M. ',
    'On a phone: the stick on the left moves you. ATK attacks, hold SHIELD to block, A and B use your two tools (aimed at the nearest foe), USE talks and opens. POT drinks a potion, BAG and II open the menus, and a tap on the minimap opens the world map. X closes a menu. Tap the screen to read on.',
    'Waypoints: touch a glowing plinth (E) to attune it. From any waypoint you can travel to the others. Boulders marked on the map open from the other side.',
    'Tips: sealed rooms open when every enemy is defeated. Push stone blocks by walking into them. Gate items found in dungeons open new areas.'
  ],()=>{ui=null;openPause()});
}
function updateFx2(dt){
  for(const f of FX){
    if(f.k==='p'){f.age=(f.age||0)+dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92;f.vy+=(f.g===undefined?30:f.g)*dt}
    else f.t+=dt;
  }
  FX=FX.filter(f=>f.k==='p'?f.age<f.t:f.t<f.dur);
  for(const f of FT){f.t-=dt;f.y-=22*dt}
  FT=FT.filter(f=>f.t>0);
  for(const t of toasts)t.t-=dt;
  toasts=toasts.filter(t=>t.t>0);
  if(banner.t>0)banner.t-=dt;
  shake=Math.max(0,shake-dt*20);
}

// ---------- UI logic ----------
function updateUI(dt){
  if(ui.mode==='dialog'){
    if(Input.confirm()||Input.hit('back'))advanceDialog();
  }else if(ui.mode==='menu'){
    const n=ui.opts.length;
    if(Input.hit('up')){ui.sel=(ui.sel+n-1)%n;Snd.menu()}
    if(Input.hit('down')){ui.sel=(ui.sel+1)%n;Snd.menu()}
    if(Input.confirm()){runMenu(ui,ui.sel)}
    else if(ui.closable&&(Input.hit('back')||Input.hit('pause')))ui=null;
  }else if(ui.mode==='fair')updateFair(dt);
  else if(ui.mode==='story')updateStory(dt);
  else if(ui.mode==='codexpage')updateCodexPage(dt);
  else if(ui.mode==='bossintro'){ui.t+=dt;if(ui.t>2.6||(ui.t>.9&&Input.confirm()))ui=null}
  else if(ui.mode==='dmap'||ui.mode==='map'){if(Input.confirm()||Input.hit('back')||Input.hit('map')||Input.hit('pause'))ui=null}
  else if(ui.mode==='itemget')updateItemGet(dt);
  else if(ui.mode==='inv')updateInv();
}
function advanceDialog(){
  const d=ui.d;d.i++;Snd.menu();
  if(d.i>=d.pages.length){const f=d.onEnd;ui=null;if(f)f()}
}
function runMenu(m,i){
  const o=m.opts[i];if(!o)return;
  Snd.menu();
  const keep=o.fn();
  if(keep!==true&&ui===m)ui=null;
}


// ---------- skill tree ----------
// ---------- rendering: world ----------
function drawWorld(){
  const sx=shake?rand(-shake,shake):0,sy=shake?rand(-shake,shake):0;
  const ox=-Math.round(cam.x)+Math.round(sx),oy=-Math.round(cam.y)+Math.round(sy);
  cx.save();cx.translate(ox,oy);
  // tiles (pre-rendered, softly blended)
  const lx=Math.max(0,Math.floor(cam.x)),ly=Math.max(0,Math.floor(cam.y));
  const lw=Math.min(M.w*TS-lx,W+2),lh=Math.min(M.h*TS-ly,H+2);
  if(M.layer.chunked){
    const c0=Math.floor(lx/(CHK*TS)),c1=Math.floor((lx+W+1)/(CHK*TS)),r0=Math.floor(ly/(CHK*TS)),r1=Math.floor((ly+H+1)/(CHK*TS));
    for(let j=r0;j<=r1;j++)for(let i=c0;i<=c1;i++)if(i*CHK<M.w&&j*CHK<M.h)cx.drawImage(layerChunk(i,j),i*CHK*TS,j*CHK*TS);
  }else if(lw>0&&lh>0)cx.drawImage(M.layer,lx,ly,lw,lh,lx,ly,lw,lh);
  if(M.house)drawHouseSkin();
  if(M.id==='world')drawFacades();
  drawWaterShimmer();
  drawFields();
  drawGates();
  for(const l of M.labels){text(typeof l.text==='function'?l.text():l.text,l.x,l.y,'#ffe9a0',8,'center',true)}
  drawEntrances();
  // portals
  for(const w of M.warps)if(w.portal){
    const a=.5+.3*Math.sin(time*4);cx.fillStyle=`rgba(255,220,120,${a})`;
    cx.beginPath();cx.ellipse(w.x+w.w/2,w.y+w.h/2,w.w/2,w.h/1.2,0,0,TAU);cx.fill();
  }
  // loot on the ground
  for(const d of DR){
    const b=Math.sin(d.t*5)*1.5;
    if(d.kind==='item'){
      const c=RARITY[d.item.r].c;
      if(d.item.r>=3){const g=cx.createLinearGradient(0,d.y-34,0,d.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,c);cx.globalAlpha=.55;cx.fillStyle=g;cx.fillRect(d.x-2,d.y-34,4,34);cx.globalAlpha=1}
      cx.fillStyle='#000';cx.fillRect(d.x-4,d.y-5+b,8,8);cx.fillStyle=c;cx.fillRect(d.x-3,d.y-4+b,6,6);cx.fillStyle='#fff';cx.fillRect(d.x-2,d.y-3+b,2,2);
    }else if(d.kind==='cons'){cx.fillStyle='#000';cx.fillRect(d.x-4,d.y-5+b,8,9);cx.fillStyle=CONS[d.id].c;cx.fillRect(d.x-3,d.y-4+b,6,7);cx.fillStyle='#fff';cx.fillRect(d.x-2,d.y-3+b,2,2)
    }else if(d.kind==='gem'){cx.fillStyle='#000';cx.fillRect(d.x-4,d.y-4+b,8,8);cx.fillStyle=GEMS[d.g.t].c;cx.fillRect(d.x-3,d.y-3+b,6,6);cx.fillStyle='#fff';cx.fillRect(d.x-2,d.y-2+b,2,2)
    }else if(d.kind==='mat'){cx.fillStyle='#000';cx.fillRect(d.x-3,d.y-3+b,6,6);cx.fillStyle=MATS[d.mat].c;cx.fillRect(d.x-2,d.y-2+b,4,4);cx.fillStyle='#fff';cx.fillRect(d.x-2,d.y-2+b,1,1)
    }else if(d.kind==='gold'){cx.fillStyle='#8a6010';cx.fillRect(d.x-2,d.y-2+b,5,5);cx.fillStyle='#ffd040';cx.fillRect(d.x-2,d.y-2+b,4,4)}
    else drawHeart(Math.round(d.x)-4,Math.round(d.y)-4+b,1,1);
  }
  // sorted entities
  const list=[];
  const big=M.id==='world',vx0=cam.x-48,vx1=cam.x+W+48,vy0=cam.y-64,vy1=cam.y+H+48,vis=(x,y)=>!big||(x>vx0&&x<vx1&&y>vy0&&y<vy1);
  const hush=visionActive();   // during a vision only the land, the stump and the hero are drawn
  for(const n of NP)if(!hush&&vis(n.x,n.y)&&!(SC&&(n.id==='lia'||(SC.id==='meet'&&n.id==='elder'))))list.push({y:n.y,f:()=>drawNpc(n)});
  sceneActorsForDraw(list,vis);
  for(const p of M.props)if((!hush||p.k==='tome')&&vis((p.tx+.5)*TS,(p.ty+.5)*TS))list.push({y:p.k==='rug'||p.k==='plate'||p.k==='rune'?-1e9:(p.ty+1)*TS-2,f:()=>drawProp(p)});   // flat floor pieces always lie under everyone
  if(!hush){
  for(const c of M.critters)if(vis(c.x,c.y))list.push({y:c.y,f:()=>drawCritter(c)});
  for(const c of CH)if(vis(c.x,c.y))list.push({y:c.y,f:()=>drawChest(c)});
  for(const e of E)if(vis(e.x,e.y))list.push({y:e.y,f:()=>drawEnemy(e)});
  }
  list.push({y:P.y,f:drawPlayer});
  list.sort((a,b)=>a.y-b.y);
  for(const o of list)o.f();
  // telegraphs
  for(const e of E)if(e.tele){
    const f=1-e.tele.t/e.tele.dur;
    cx.fillStyle=`rgba(230,60,30,${.15+.25*f})`;cx.beginPath();cx.arc(e.tele.x,e.tele.y,e.tele.r,0,TAU);cx.fill();
    cx.strokeStyle='rgba(255,120,60,.9)';cx.lineWidth=1;cx.beginPath();cx.arc(e.tele.x,e.tele.y,e.tele.r*f,0,TAU);cx.stroke();
  }
  // projectiles
  for(const p of PR){
    const c=p.kind==='fire'?'#ff8a20':p.kind==='bolt'?'#8ab8ff':p.kind==='knife'?'#d8c0ff':p.kind==='pierce'?'#c8ff90':'#e8d8a0';
    cx.save();cx.translate(Math.round(p.x),Math.round(p.y));cx.rotate(p.ang);
    if(p.kind==='arrow'||p.kind==='pierce'){cx.fillStyle='#6a4a20';cx.fillRect(-5,-.5,8,1);cx.fillStyle=c;cx.fillRect(3,-1,3,2)}
    else if(p.kind==='knife'){cx.fillStyle=c;cx.fillRect(-3,-1,6,2)}
    else{cx.fillStyle=c;cx.fillRect(-3,-3,6,6);cx.fillStyle='#fff';cx.fillRect(-1,-1,2,2)}
    cx.restore();
  }
  for(const t of TRAPS){cx.fillStyle='#3a3a40';cx.fillRect(Math.round(t.x)-4,Math.round(t.y)-1,8,4);cx.fillStyle='#b8b8c4';for(let i=-3;i<=3;i+=3)cx.fillRect(Math.round(t.x)+i,Math.round(t.y)-3,1,3)}
  for(const p of EP){cx.fillStyle='#4a2a10';cx.fillRect(Math.round(p.x)-3,Math.round(p.y)-3,6,6);cx.fillStyle='#e0702a';cx.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,4,4);cx.fillStyle='#ffd080';cx.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,2,2)}
  // effects
  for(const f of FX){
    if(f.k==='p'){cx.globalAlpha=clamp(1-f.age/f.t,0,1);cx.fillStyle=f.c;cx.fillRect(Math.round(f.x),Math.round(f.y),f.s,f.s);cx.globalAlpha=1}
    else if(f.k==='mark'){const q=f.t/f.dur;cx.strokeStyle='rgba(255,100,60,.9)';cx.lineWidth=1;cx.beginPath();cx.arc(f.x,f.y,f.r,0,TAU);cx.stroke();cx.fillStyle=`rgba(255,60,30,${.08+.22*q})`;cx.fill();cx.beginPath();cx.arc(f.x,f.y,f.r*q,0,TAU);cx.stroke()}
    else if(f.k==='ring'){const q=f.t/f.dur,r=f.r0+(f.r1-f.r0)*q;cx.globalAlpha=1-q;cx.strokeStyle=f.c;cx.lineWidth=3;cx.beginPath();cx.arc(f.x,f.y,r,0,TAU);cx.stroke();cx.globalAlpha=1}
    else if(f.k==='slash'){const q=f.t/f.dur;cx.globalAlpha=1-q*.8;cx.strokeStyle=f.c;cx.lineWidth=f.w||4;cx.beginPath();cx.arc(f.x,f.y,f.range*.8,f.dir-f.arc/2+q*f.arc*.3,f.dir+f.arc/2);cx.stroke();cx.globalAlpha=1}
  }
  for(const f of FT){cx.globalAlpha=clamp(f.t*2,0,1);text(f.s,Math.round(f.x),Math.round(f.y),f.c,f.big?10:8,'center',true);cx.globalAlpha=1}
  cx.restore();
}
function drawNpc(n){
  const s=npcSprite(n),x=Math.round(n.x),y=Math.round(n.y);
  const sh=s.front.height;
  shadow(x,y+3,6);cx.drawImage(s.front,x-Math.floor(s.front.width/2),y+1-sh);
  Spr.legs(cx,x,y,n.pal.k,n.moving?Math.floor(n.anim)%2:0);
  const q=(n.id==='elder'&&(flags.stage===0||flags.stage===3));
  text(q?'!':'',x,y-sh-12+Math.round(Math.sin(time*5)*1.5),'#ffe040',10,'center',true);
  if(!n.walk)text(n.name,x,y-sh-4,'#e8d8b0',7,'center');
}
function npcSprite(n){return n.spr||(n.spr=Spr.npc(n.pal))}
function shadow(x,y,r){cx.fillStyle='rgba(0,0,0,.28)';cx.beginPath();cx.ellipse(x,y,r,r*.45,0,0,TAU);cx.fill()}
function drawChest(c){
  const x=Math.round(c.x),y=Math.round(c.y);shadow(x,y+5,7);
  cx.fillStyle='#4a2c10';cx.fillRect(x-7,y-4,14,10);cx.fillStyle='#8a5a22';cx.fillRect(x-6,y-3,12,8);
  if(c.open){cx.fillStyle='#2a1a08';cx.fillRect(x-6,y-3,12,3);cx.fillStyle='#a87a3a';cx.fillRect(x-7,y-9,14,4)}
  else{cx.fillStyle='#a87a3a';cx.fillRect(x-7,y-5,14,4);cx.fillStyle='#ffd040';cx.fillRect(x-1,y-2,3,3)}
}
function drawEnemy(e){
  const k=BOSSSPR[e.variant]||e.type,base=Spr.enemy[k],x=Math.round(e.x),y=Math.round(e.y);
  const w=base.width,h=base.height;
  if(e.variant==='heartwood'){   // the tree itself is a prop; the Heart only flashes over it
    if(e.flash>0||e.windup||e.phaseLock>0||e.state==='wind'){cx.globalAlpha=e.flash>0?.55:.3+.2*Math.sin(time*30);cx.drawImage(Spr.flash.boss6,Math.round(x-w/2),y+e.hh+1-h);cx.globalAlpha=1}
    return;
  }
  shadow(x,y+e.hh,Math.max(5,w/2));
  let spr=e.flash>0?Spr.flash[k]:(e.elite?Spr.elite[k]:base);
  let ox=0,oy=Math.round(Math.sin(e.anim)*(e.state==='idle'?.4:1));
  if(e.state==='wind'||e.phaseLock>0||e.windup){ox=Math.round(Math.sin(time*60)*1.5);if(Math.floor(time*16)%2)spr=Spr.flash[k]}
  if(e.windup){cx.strokeStyle=`rgba(255,80,40,${.35+.3*Math.sin(time*30)})`;cx.lineWidth=6;cx.beginPath();cx.moveTo(e.x,e.y);cx.lineTo(e.x+Math.cos(e.aim)*150,e.y+Math.sin(e.aim)*150);cx.stroke()}
  if(e.slow>0)cx.globalAlpha=.8;
  if(e.big){const bw=Math.round(w*e.big),bh=Math.round(h*e.big);cx.drawImage(spr,x-Math.floor(bw/2)+ox,y+e.hh+1-bh+oy,bw,bh)}
  else cx.drawImage(spr,x-Math.floor(w/2)+ox,y+e.hh+1-h+oy);
  cx.globalAlpha=1;
  if(e.slow>0){cx.fillStyle='rgba(120,200,255,.35)';cx.fillRect(x-w/2,y+e.hh+1-h,w,h)}
  if(e.hp<e.maxHp&&e.type!=='boss'&&!e.mini)bar(x-8,y-h+e.hh-3,16,2,e.hp/e.maxHp,e.elite?'#ffd040':'#e04030');
  if(e.mod&&!e.dead)text(ELITEMOD[e.mod].n,x,y-h-5,ELITEMOD[e.mod].c,5,'center',true);
  if(e.stun>0)text('*',x,y-h,'#ffe040',8,'center',true);
  if(e.state==='wind')text('!',x,y-h-6,'#ff4030',12,'center',true);
}
function drawPlayer(){
  const h=P.hero,x=Math.round(P.x),y=Math.round(P.y),sp=Spr.heroes[h.id];
  if(P.inv>0&&P.rollT<=0&&P.stealth<=0&&Math.floor(time*20)%2)return;
  shadow(x,y+3,6);
  if(P.buff){cx.globalAlpha=.3+.15*Math.sin(time*10);cx.fillStyle=P.buff.poison?'#8ae04a':'#e03020';cx.beginPath();cx.ellipse(x,y+2,9,4.5,0,0,TAU);cx.fill();cx.globalAlpha=1}
  if(P.stealth>0)cx.globalAlpha=.4;
  cx.save();cx.translate(x,y);
  if(P.rollT>0){cx.rotate(P.rollT*22*(P.rvx>=0?1:-1));cx.translate(0,-2)}
  const back=P.face.y<-.5&&Math.abs(P.face.x)<.8;
  const gtier=P.gear?P.gear.tier:0,col=s=>s==='weapon'?SWORD_COL[gtier]:(s==='chest'&&gtier>0?ARMOR_COL[gtier]:null);
  const walk=P.moving||P.dashT>0?Math.floor(P.anim)%2:0;
  const spr=back?sp.back:sp.front,sh=spr.height,top=1-sh;
  const bc=col('boots')||h.dark;
  Spr.legs(cx,0,0,bc,walk);
  if(back)drawWeapon(h,col('weapon'));
  cx.drawImage(P.flash>0?Spr.tint(spr,'#fff'):spr,-Math.floor(spr.width/2),top);
  // gear colours
  if(col('helm')){cx.fillStyle=col('helm');cx.fillRect(-4,top+(h.id==='mage'?3:1),8,1)}
  if(col('chest')){cx.fillStyle=col('chest');cx.fillRect(-2,-2,4,2)}
  if(col('gloves')){cx.fillStyle=col('gloves');cx.fillRect(-4,-2,1,2);cx.fillRect(3,-2,1,2)}
  if(col('amulet')){cx.fillStyle=col('amulet');cx.fillRect(-1,-3,2,1)}
  if(!back)drawWeapon(h,col('weapon'));
  drawShield();
  if(P.hold)drawHoldItem(top);
  cx.restore();cx.globalAlpha=1;
}
function drawWeapon(h,wc){
  if(!flags.sword)return;
  const f=P.face,A=P.att,atk=A?1:0,len=(h.melee?8:6)+atk*(A&&A.heavy?7:4),c=wc||'#c8c8c8';
  const ang=Math.atan2(f.y,f.x),pr=A?clamp(A.t/A.dur*1.6,0,1):0,off=A?(-1.3+2.6*pr)*(A.heavy?1.15:1):0;
  cx.save();cx.translate(Math.round(f.x*6),-3+Math.round(f.y*3));cx.rotate(ang+(h.melee?off:0));
  if(h.id==='ranger'){cx.strokeStyle='#8a5a2a';cx.lineWidth=1;cx.beginPath();cx.arc(2,0,5,-1.2,1.2);cx.stroke();cx.fillStyle=c;cx.fillRect(6,-1,1,2)}
  else if(h.id==='mage'){cx.fillStyle='#6a4a20';cx.fillRect(-2,-1,len+2,1);cx.fillStyle=c;cx.fillRect(len,-2,3,3)}
  else{cx.fillStyle='#5a3a1c';cx.fillRect(0,-1,3,2);cx.fillStyle=c;cx.fillRect(3,-1,len-2,2);cx.fillStyle='#fff';cx.fillRect(3,-1,len-2,1)}
  cx.restore();
}

// ---------- rendering: HUD & overlays ----------
function drawDark(){
  if(!M.dark&&!M.night)return;
  const lk=flags.lantern?'c2':'c';
  if(!drawDark[lk]){
    const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const g=c.getContext('2d');
    const gr=flags.lantern?g.createRadialGradient(W,H,80,W,H,300):g.createRadialGradient(W,H,40,W,H,230);gr.addColorStop(0,'rgba(8,4,2,0)');gr.addColorStop(.55,'rgba(8,4,2,.55)');gr.addColorStop(1,'rgba(8,4,2,.93)');
    g.fillStyle=gr;g.fillRect(0,0,W*2,H*2);drawDark[lk]=c;
  }
  cx.drawImage(drawDark[lk],Math.round(P.x-cam.x-W),Math.round(P.y-cam.y-H));
}



// ---------- dungeon logic: arena rooms, orb switch, small-key door ----------
function setGate(g,open){
  g.open=open;
  for(const[x,y]of g.tiles)M.t[y*M.w+x]=open?(g.floor===undefined?T.DFLOOR:g.floor):T.BARRIER;
}
function updateRooms(){
  leashRoomFoes();
  for(const r of M.rooms){
    if(flags.dun[r.id])continue;
    const tx=P.x/TS,ty=P.y/TS;
    const inside=tx>=r.x1&&tx<r.x2+1&&ty>=r.y1&&ty<r.y2+1;   // the seal falls the moment the hero steps into the room
    const alive=E.some(e=>e.room===r.id&&!e.dead);
    if(!r.active&&inside&&alive){
      r.active=true;
      for(const id of r.gates)setGate(M.gates.find(g=>g.id===id),false);
      toast(r.name+' seals shut! Defeat every enemy.','#ff9a70');Snd.boom();shake=4;
    }
    if(r.active&&!alive){
      r.active=false;flags.dun[r.id]=true;
      for(const id of r.gates)setGate(M.gates.find(g=>g.id===id),true);
      toast('The way opens.','#a8e0a0');Snd.open();
      for(const c of M.chests)if(c.req===r.id&&!CH.some(q=>q.id===c.id)){CH.push(Object.assign({},c,{open:!!flags.chests[c.id]}));puff(c.x,c.y,10,'#ffd040',50)}
    }
  }
}
function tryKeyDoor(){
  if(!P.moving)return;
  for(const kg of M.gates){
    if(kg.kind!=='key'||kg.open)continue;
    let near=false;
    for(const[tx,ty]of kg.tiles){
      const dx=(tx+.5)*TS-P.x,dy=(ty+.5)*TS-P.y,d=Math.hypot(dx,dy);
      if(d<20&&(P.face.x*dx+P.face.y*dy)/(d||1)>.5){near=true;break}
    }
    if(!near)continue;
    if(P.keys>0){P.keys--;setGate(kg,true);flags.dun[kg.flagKey||'keydoor']=true;toast('The small key unlocks the door!','#ffe040');Snd.open();shake=3}
    else if(!P.keyMsg||P.keyMsg<time-2.5){P.keyMsg=time;toast('Locked. You need a small key.','#ff8070')}
    return;
  }
}
function hitOrbs(x,y,r){
  for(const p of M.props){
    if(p.k!=='orb'||flags.dun[p.flag||'orb'])continue;
    const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS;
    if(Math.hypot(px-x,py-y)<r){
      flags.dun[p.flag||'orb']=true;const g=M.gates.find(g=>g.kind==='orb'&&(g.flag||'orb')===(p.flag||'orb'));if(g)setGate(g,true);
      toast('Click! A distant gate swings open.','#8fd0ff');Snd.open();shake=3;puff(px,py,16,'#8fd0ff',80);
    }
  }
}

function updateBlocks(dt){
  for(const b of M.props){
    if(b.k!=='block')continue;
    for(const ax of['ox','oy'])if(b[ax]){const v=b[ax];b[ax]=Math.abs(v)<1?0:v-Math.sign(v)*Math.min(Math.abs(v),120*dt)}
  }
  if(!M.dungeon)for(const b of M.props){   // an unsolved block returns to its start when the hero walks away (a ruin can never be locked)
    if(b.k!=='block')continue;
    b.home=b.home||{tx:b.tx,ty:b.ty};
    if((b.tx!==b.home.tx||b.ty!==b.home.ty)&&Math.hypot((b.tx+.5)*TS-P.x,(b.ty+.5)*TS-P.y)>300&&!M.plates.some(pl=>flags.dun[pl.flag])){
      M.t[b.ty*M.w+b.tx]=b.under!==undefined?b.under:T.GRASS;b.tx=b.home.tx;b.ty=b.home.ty;b.under=gt(M,b.tx,b.ty)===T.BLOCK?b.under:b.under;M.t[b.ty*M.w+b.tx]=T.BLOCK;b.ox=b.oy=0;
    }
  }
  P.pushT=(P.pushT||0)-dt;
  if(P.pushT<=0&&P.moving&&!P.att&&P.rollT<=0&&M.props.some(p=>p.k==='block')){
    const a=Input.axis();let dx=0,dy=0;
    if(Math.abs(a.x)>Math.abs(a.y)*1.2)dx=Math.sign(a.x);else if(Math.abs(a.y)>Math.abs(a.x)*1.2)dy=Math.sign(a.y);
    if(dx||dy){
      const tx=Math.floor((P.x+dx*9)/TS),ty=Math.floor((P.y+dy*9)/TS);
      const b=M.props.find(p=>p.k==='block'&&p.tx===tx&&p.ty===ty);
      if(b){
        const nx=tx+dx,ny=ty+dy;
        const nt=gt(M,nx,ny),floorOK=M.dungeon?nt===T.DFLOOR:(WALKG.has(nt)||nt===T.PATH);
        if(floorOK&&!M.props.some(p=>p.tx===nx&&p.ty===ny&&!p.deco)&&!E.some(e=>Math.floor(e.x/TS)===nx&&Math.floor(e.y/TS)===ny)){
          M.t[ty*M.w+tx]=M.dungeon?T.DFLOOR:(b.under!==undefined?b.under:T.GRASS);b.under=nt;M.t[ny*M.w+nx]=M.dungeon?T.DBLOCK:T.BLOCK;b.tx=nx;b.ty=ny;b.ox=-dx*TS;b.oy=-dy*TS;P.pushT=.3;
          Snd.menu();puff(b.tx*TS+8,b.ty*TS+14,5,'#8a867a',40);
        }
      }
    }
  }
  for(const pl of M.plates)pl.on=M.props.some(p=>p.k==='block'&&p.tx===pl.tx&&p.ty===pl.ty);
  for(const g of M.gates){
    if(g.kind!=='plate'||flags.dun[g.flag])continue;
    const ps=M.plates.filter(q=>q.gate===g.id);
    if(ps.length&&ps.every(q=>q.on)){
      flags.dun[g.flag]=true;setGate(g,true);
      toast('Click! A heavy slab slides away.','#8fd0ff');Snd.open();shake=3;
    }
  }
}
function cyanHalo(){
  if(!cyanHalo.c){
    const c=document.createElement('canvas');c.width=c.height=120;const q=c.getContext('2d');
    const rg=q.createRadialGradient(60,60,2,60,60,60);rg.addColorStop(0,'rgba(80,255,230,.5)');rg.addColorStop(1,'rgba(80,255,230,0)');
    q.fillStyle=rg;q.fillRect(0,0,120,120);cyanHalo.c=c;
  }
  return cyanHalo.c;
}
function drawGates(){
  for(const g of M.gates||[]){
    if(g.open)continue;
    for(const[tx,ty]of g.tiles){
      const x=tx*TS,y=ty*TS;
      if(g.kind==='key'){
        cx.fillStyle='#2a1808';cx.fillRect(x,y,16,16);cx.fillStyle='#7a5226';cx.fillRect(x+1,y+1,14,14);cx.fillStyle='#5a3a18';cx.fillRect(x+1,y+7,14,2);
        cx.fillStyle='#d8b030';cx.fillRect(x+6,y+4,4,5);cx.fillStyle='#4a3008';cx.fillRect(x+7,y+6,2,2);
      }else if(g.kind==='plate'){
        cx.fillStyle='#2a2620';cx.fillRect(x,y,16,16);cx.fillStyle='#5a564c';cx.fillRect(x+1,y+1,14,14);cx.fillStyle='#3a362e';cx.fillRect(x+7,y+1,2,14);cx.fillStyle='#8fd0ff';cx.fillRect(x+6,y+6,4,4);
      }else{
        cx.fillStyle='#14100c';cx.fillRect(x,y,16,16);
        for(let i=1;i<16;i+=4){cx.fillStyle=g.kind==='orb'?'#4a6a9a':'#7a7a84';cx.fillRect(x+i,y,2,16);cx.fillStyle='#b8b8c4';cx.fillRect(x+i,y,1,16)}
        cx.fillStyle='#4a4a54';cx.fillRect(x,y+3,16,2);cx.fillRect(x,y+11,16,2);
        if(g.kind==='orb'){cx.globalAlpha=.3+.2*Math.sin(time*4);cx.fillStyle='#6ab0ff';cx.fillRect(x,y,16,16);cx.globalAlpha=1}
      }
    }
  }
}
function drawDarkLights(){
  if(!M.dark&&!M.night)return;
  if(!drawDarkLights.h){
    const gl=document.createElement('canvas');gl.width=gl.height=120;const q=gl.getContext('2d');
    const rg=q.createRadialGradient(60,60,2,60,60,60);rg.addColorStop(0,'rgba(255,170,80,.4)');rg.addColorStop(1,'rgba(255,170,80,0)');
    q.fillStyle=rg;q.fillRect(0,0,120,120);drawDarkLights.h=gl;
  }
  cx.globalCompositeOperation='lighter';
  for(const l of propLights()){cx.globalAlpha=clamp(l.a,0,1);cx.drawImage(l.c?cyanHalo():drawDarkLights.h,Math.round(l.x-cam.x-l.r),Math.round(l.y-cam.y-l.r),l.r*2,l.r*2)}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
}

// ---------- props, critters, ambient life ----------
function drawProp(p){
  if(drawExtraProp(p)||drawHearthProp(p))return;
  if(p.k==='ftree'){drawForgottenTree(p);return}
  if(p.k==='tome'&&!(flags.lore&&flags.lore[p.id])){const gx=p.tx*TS+8,gy=p.ty*TS+8,pu=.5+.5*Math.sin(time*3+p.tx);glow(gx,gy,18+4*pu,'255,214,110',.28+.18*pu);if(Math.random()<.08)puff(gx+rand(-5,5),gy+rand(-6,2),1,'#ffe9a0',16)}
  const x=p.tx*TS+(p.ox||0),y=p.ty*TS+(p.oy||0),t=time,R_=(c,a,b,w,h)=>{cx.fillStyle=c;cx.fillRect(x+a,y+b,w,h)};
  switch(p.k){
    case'barrel':shadow(x+8,y+14,6);R_('#3a2410',3,2,10,13);R_('#8a5a22',4,3,8,12);R_('#a87a3a',5,4,2,10);R_('#4a3014',3,6,10,1);R_('#4a3014',3,11,10,1);break;
    case'crate':shadow(x+8,y+14,7);R_('#3a2410',2,4,12,11);R_('#9a6a30',3,5,10,9);R_('#6a4620',3,9,10,1);R_('#6a4620',7,5,1,9);break;
    case'hay':shadow(x+8,y+14,7);R_('#8a6a10',1,5,14,10);R_('#d8b840',2,5,12,8);R_('#a88a20',2,8,12,1);R_('#a88a20',2,11,12,1);R_('#f0d870',3,6,4,1);break;
    case'bench':shadow(x+8,y+14,7);R_('#3a2410',1,6,14,4);R_('#8a5a22',1,5,14,3);R_('#3a2410',2,10,2,5);R_('#3a2410',12,10,2,5);break;
    case'bush':shadow(x+8,y+14,7);R_('#2a4a18',1,4,14,11);R_('#4a7a28',2,3,12,10);R_('#6a9a3a',3,4,4,3);R_('#d05a24',9,8,2,2);R_('#d05a24',5,10,2,2);break;
    case'rune':case'pillar':case'hedge':case'landmark':drawSpotProp(p,x,y,t,R_);break;
    case'cutbush':shadow(x+8,y+14,6);R_('#2a4a18',2,5,12,10);R_('#4a7a28',2,4,12,9);R_('#6a9a3a',4,5,4,3);R_('#8abc4a',9,6,3,2);R_('#d05a24',6,10,2,2);break;
    case'ore':shadow(x+8,y+14,6);R_('#3a3a44',2,6,12,9);R_('#6a6a78',3,5,10,9);R_('#8a8a98',4,5,4,3);R_('#9ae0e8',9,7,2,4);R_('#e8b050',5,10,2,2);R_('#6ad0d8',7,9,1,1);break;
    case'logs':shadow(x+8,y+14,7);R_('#3a2410',1,9,14,6);R_('#8a5a28',2,9,12,5);R_('#c89a58',3,10,2,3);R_('#c89a58',8,10,2,3);R_('#6a4018',2,5,12,5);R_('#a87a3a',3,5,10,4);R_('#e0b878',4,6,2,2);break;
    case'herb':R_('#2a5a1a',6,8,2,6);R_('#4a9a30',3,6,5,4);R_('#4a9a30',8,5,5,4);R_('#7ad04a',4,6,2,2);R_('#d03a2a',5,4,2,2);R_('#d03a2a',10,4,2,2);R_('#e86a5a',10,4,1,1);break;
    case'clay':shadow(x+8,y+14,5);R_('#6a2e10',4,5,8,10);R_('#b8602a',5,4,6,10);R_('#d8803a',6,6,2,5);R_('#6a2e10',5,3,6,2);break;
    case'sign':shadow(x+8,y+14,5);R_('#3a2410',7,8,2,7);R_('#2a1808',1,2,14,8);R_('#a87a3a',2,3,12,6);R_('#6a4620',4,5,8,1);R_('#6a4620',4,7,6,1);break;
    case'well':shadow(x+8,y+14,8);R_('#4a4640',1,6,14,9);R_('#8a867e',2,6,12,8);R_('#a8a49c',3,7,4,2);R_('#1a2a3a',4,6,8,4);R_('#5a3a1c',1,0,2,8);R_('#5a3a1c',13,0,2,8);R_('#7a4a22',0,0,16,3);R_('#b8602a',0,-1,16,2);break;
    case'anvil':shadow(x+8,y+14,6);R_('#2a2a30',3,8,10,3);R_('#5a5a64',2,6,12,3);R_('#8a8a96',3,6,9,1);R_('#2a2a30',5,11,6,4);{const f=.5+.5*Math.sin(t*9);R_('#ff7a20',12,11,3,3);R_('#ffd060',13,12,1,1);cx.globalAlpha=f*.6;R_('#ffb040',11,10,5,5);cx.globalAlpha=1}break;
    case'pot':shadow(x+8,y+14,6);R_('#1a1a20',3,6,10,9);R_('#3a3a44',4,5,8,9);R_('#5ab04a',4,5,8,2);{const b=Math.sin(t*5)*1.5;R_('#9aff7a',6,3+b,2,2);R_('#9aff7a',9,2-b,1,1)}break;
    case'grave':shadow(x+8,y+14,6);R_('#3a3a40',3,4,10,11);R_('#7a7a84',4,3,8,11);R_('#9a9aa4',5,4,3,2);R_('#4a4a54',7,6,2,5);R_('#4a4a54',5,8,6,1);break;
    case'lantern':shadow(x+8,y+14,4);R_('#2a1808',7,5,2,10);R_('#2a1808',4,2,8,2);R_('#ffd060',5,3,6,4);R_('#fff0a0',6,4,4,2);R_('#2a1808',4,7,8,1);break;
    case'stall':
      shadow(x+16,y+14,14);R_('#4a2c10',1,8,30,7);R_('#8a5a22',1,7,30,6);
      R_('#e8d8b0',3,9,5,3);R_('#d05a24',9,9,4,3);R_('#e8c040',14,9,4,3);R_('#6a9a3a',19,9,5,3);R_('#b04a6a',25,9,4,3);
      R_('#3a2410',2,-4,2,12);R_('#3a2410',28,-4,2,12);
      for(let i=0;i<8;i++)R_(i%2?'#f0e8d0':'#c0382a',i*4,-5,4,6);
      R_('#7a2418',0,1,32,1);break;
    case'block':shadow(x+8,y+14,7);R_('#2a2620',0,1,16,15);R_('#6a665c',1,1,14,13);R_('#8a867a',1,1,14,3);R_('#4a463e',1,11,14,3);R_('#5a8a4a',3,5,3,2);R_('#5a8a4a',10,8,2,2);break;
    case'plate':{const on=M.plates.some(q=>q.tx===p.tx&&q.ty===p.ty&&q.on)||flags.dun[p.flag];R_('#2a2620',1,1,14,14);R_('#4a463e',2,2,12,12);R_(on?'#8fd0ff':'#6a665c',5,5,6,6);R_(on?'#d8f4ff':'#8a867a',6,6,2,2);break}
    case'glowcap':{const g=.6+.4*Math.sin(t*3+p.tx*2);R_('#2a4a5a',7,9,2,5);R_('#2a4a5a',3,12,1,3);R_('#2a4a5a',12,11,1,4);cx.globalAlpha=g;R_('#40e0d0',5,6,6,4);R_('#40e0d0',1,10,5,3);R_('#40e0d0',10,9,5,3);R_('#c8fff4',6,7,2,1);cx.globalAlpha=1;break}
    case'board':{shadow(x+8,y+14,7);R_('#3a2410',2,2,12,10);R_('#8a5a2a',3,3,10,8);R_('#e8d8b0',4,4,3,3);R_('#e8d8b0',8,4,3,2);R_('#e8d8b0',5,8,4,2);R_('#c03030',11,8,1,1);R_('#4a2c14',3,12,2,3);R_('#4a2c14',11,12,2,3);break}
    case'tome':if(TOMEBYID[p.id]&&TOMEBYID[p.id].title==='The Ringed Stump'){   // a tree stump with visible rings: the Great Turning's lore hint
      const z=TOMEBYID[p.id].zone,b=Math.sin(t*2+p.tx)*.6,dry=z==='mesa'||z==='steppe'||z==='saffron',cold=z==='ridge'||z==='gulch',burnt=z==='spire'||z==='ember'||z==='grove';
      const bark=burnt?'#3a3028':'#6a4424',lit=burnt?'#5a4c40':'#8a5c30',dark=burnt?'#1e1812':'#3a2412',face=burnt?'#7a6a58':dry?'#e0c488':'#c8a064',ring=burnt?'#4a3c30':dry?'#a8884a':'#8a6a3a';
      shadow(x+8,y+14,9);
      R_(dark,0,12,4,3);R_(dark,12,12,4,3);R_(dark,1,13,2,2);R_(dark,13,13,2,2);R_(bark,1,12,3,2);R_(bark,12,12,3,2);   // roots flaring out
      R_(dark,3,8,10,6);R_(bark,4,8,8,5);R_(lit,4,8,3,5);R_(dark,10,9,1,4);R_(dark,2,11,1,3);R_(dark,13,11,1,3);
      R_(dark,2,4,12,5);R_(face,3,4,10,4);R_(face,2,5,12,2);R_(dark,2,8,12,1);   // wide, flat cut face
      R_(ring,4,5,8,1);R_(ring,3,6,1,1);R_(ring,12,6,1,1);R_(ring,4,7,8,1);R_(ring,6,5,1,3);R_(ring,9,5,1,3);R_(bark,7,6,2,1);   // growth rings
      if(cold){R_('#e8f4ff',3,3,10,2);R_('#ffffff',4,3,4,1)}
      R_('#ffd040',13,1+b,1,1);R_('#fff0a0',2,2-b,1,1);R_('#ffd040',8,0+b,1,1);R_('#fff0a0',7,-1-b,2,1);
      break}
    {shadow(x+8,y+14,6);const b=Math.sin(t*2+p.tx)*.6;R_('#3a2410',3,10,10,5);R_('#6a3a2a',3,6+b,10,6);R_('#a85a3a',3,5+b,10,2);R_('#e8d8b0',4,7+b,8,4);R_('#8a6a4a',7,7+b,1,4);R_('#ffd040',5,3+b,2,1);R_('#ffd040',9,2+b,1,1);break}
    case'stairs':{
      const down=p.dir==='down';
      R_('#14100c',0,0,32,16);
      for(let i=0;i<4;i++){const c=down?['#4a4238','#3a342c','#2a241e','#1a1612'][i]:['#8a7a62','#7a6a54','#6a5a46','#5a4a38'][i];R_(c,1,(p.top?i:3-i)*4,30,4);R_(down?'#000':'#b8a888',1,(p.top?i:3-i)*4,30,1)}
      if(!down){const g=.3+.2*Math.sin(t*3);cx.globalAlpha=g;R_('#ffe9a0',4,2,24,12);cx.globalAlpha=1}
      break}
    case'worldtree':{   // the great tree of the Heart; the Heartwood boss is its heart and never leaves it
      const spr=Spr.enemy.boss6,bx=x+8,by=y+TS,pulse=.5+.5*Math.sin(t*(flags.boss6?1.2:2.4));
      shadow(bx,by-2,38);
      cx.drawImage(spr,Math.round(bx-spr.width/2),by-spr.height+1);
      const hx=Math.round(bx),hy=by-spr.height+1+34*3;   // the Heart in the hollow of the trunk
      cx.fillStyle='rgba(255,224,96,'+(.25+.3*pulse)+')';cx.beginPath();cx.ellipse(hx,hy,8+pulse*2,15+pulse*3,0,0,TAU);cx.fill();
      cx.fillStyle='rgba(255,250,200,'+(.5+.4*pulse)+')';cx.beginPath();cx.ellipse(hx,hy,3,7+pulse,0,0,TAU);cx.fill();
      break}
    case'brazier':shadow(x+8,y+14,6);R_('#2a2a30',4,9,8,6);R_('#4a4a54',3,8,10,3);{const f=Math.sin(t*12+p.tx)*1.2;R_('#d03a10',5,3-f,6,6+f);R_('#ff9a2a',6,2,4,6);R_('#ffe070',7,5,2,3)}break;
    case'orb':shadow(x+8,y+14,6);R_('#2a2a30',4,10,8,5);R_('#4a4a54',5,9,6,2);{const on=flags.dun[p.flag||'orb'],b=Math.sin(t*3)*1;R_(on?'#3a5a3a':'#2a5a9a',4,2+b,8,8);R_(on?'#6a9a6a':'#6ab0ff',5,3+b,6,6);R_(on?'#a8d0a8':'#c8e8ff',6,4+b,2,2)}break;
    case'waypoint':{
      shadow(x+8,y+14,8);const on=flags.wp[p.zone||M.id],b=Math.sin(t*3)*1.2;
      R_('#2a2a30',2,10,12,5);R_('#5a5a66',3,8,10,3);R_('#3a3a44',5,6,6,3);R_('#8a8a96',3,8,3,1);
      R_(on?'#2a7ac8':'#3a4a5a',6,-1+b,4,7);R_(on?'#6ac8ff':'#5a6a7a',7,0+b,2,4);R_(on?'#e0f8ff':'#8a9aaa',7,1+b,1,2);
      break}
    case'fire':{
      shadow(x+8,y+14,8);
      R_('#6a6660',0,9,16,6);R_('#4a4640',1,10,14,4);
      R_('#4a2c10',3,10,10,3);R_('#6a4018',4,9,8,2);
      const f=Math.sin(t*13)*1.3,g=Math.sin(t*9+1)*1;
      R_('#d03a10',4,4-f,8,7+f);R_('#ff7a20',5,3+g*.5,6,8);R_('#ffc040',6,5,4,5);R_('#fff0a0',7,7,2,3);
      for(let i=0;i<6;i++)R_('#8a867e',i*3,14,2,2);
      break}
  }
}
function propLights(){
  const L=[];
  for(const p of M.props){
    const x=(p.tx+.5)*TS,y=(p.ty+.5)*TS,f=1+Math.sin(time*11+p.tx)*.1;
    if(M.id==='world'&&(x<cam.x-130||x>cam.x+W+130||y<cam.y-130||y>cam.y+H+130))continue;
    if(p.k==='fire')L.push({x,y:y-2,r:86,a:.95*f});
    else if(p.k==='lantern')L.push({x,y:y-4,r:36,a:.7});
    else if(p.k==='anvil')L.push({x:x+4,y,r:30,a:.6*f});
    else if(p.k==='pot')L.push({x,y,r:26,a:.4});
    else if(p.k==='glowcap')L.push({x,y,r:36,a:.55,c:'cyan'});
    else if(p.k==='brazier')L.push({x,y:y-3,r:80,a:.9*f});
    else if(p.k==='worldtree')L.push({x,y:y-24,r:120,a:.85+.1*Math.sin(time*1.6)});
    else if(p.k==='waypoint'&&flags.wp[p.zone||M.id])L.push({x,y:y-4,r:56,a:.75,c:'cyan'});
    else if(p.k==='orb'&&!flags.dun[p.flag||'orb'])L.push({x,y:y-3,r:34,a:.6});
  }
  return L;
}
const BREAK={hedge:'#2f5a20',cutbush:'#5a8a2a',clay:'#b8602a',ore:'#9ab0c8',logs:'#b8844a'};
function cutAround(x,y,r){
  hitOrbs(x,y,r);
  let any=false;
  for(const p of M.props){
    if(!BREAK[p.k])continue;
    const px=(p.tx+.5)*TS,py=(p.ty+.5)*TS;
    if(Math.hypot(px-x,py-y)<r){
      p.dead=true;any=true;if(!p.deco){   // a rock or pot leaves bare ground of the surrounding kind
        let g=M.dark?T.DFLOOR:T.GRASS;for(const[ox,oy]of[[1,0],[-1,0],[0,1],[0,-1]]){const t=gt(M,p.tx+ox,p.ty+oy);if(t>=0&&!SOLID[t]&&t!==T.PATH&&t!==T.WATER){g=t;break}}
        M.t[p.ty*M.w+p.tx]=g}
      puff(px,py,9,BREAK[p.k],60);
      {const q=Math.random();if(q<.35)dropGold(px,py,randi(1,3));else if(q<.5)DR.push({kind:'hp',x:px,y:py,t:0,vx:0,vy:0})}
    }
  }
  if(any){M.props=M.props.filter(p=>!p.dead);Snd.swing()}
}
function wanderer(e,dt,sp,rad){
  e.t-=dt;
  if(e.t<=0){
    e.t=rand(1,3);e.moving=Math.random()<.55;const a=rand(0,TAU);e.wx=Math.cos(a);e.wy=Math.sin(a);
    const dd=Math.hypot(e.home.x-e.x,e.home.y-e.y);
    if(dd>rad){e.wx=(e.home.x-e.x)/dd;e.wy=(e.home.y-e.y)/dd;e.moving=true}
  }
  if(e.moving){e.anim+=dt*6;move(e,e.wx*sp*dt,e.wy*sp*dt)}
}
function updateAmbient(dt){
  for(const n of NP)if(n.walk)wanderer(n,dt,16,44);
  for(const c of M.critters)wanderer(c,dt,c.k==='dog'?26:12,c.k==='dog'?60:26);
  if(Math.random()<dt*5&&M.chimneys.length){
    const c=pick(M.chimneys);
    FX.push({k:'p',x:c.x,y:c.y,vx:rand(-3,5),vy:-rand(8,16),g:-2,t:rand(1.4,2.2),age:0,c:'rgba(200,190,185,.55)',s:2});
  }
  for(const p of M.props)if(p.k==='fire'&&Math.random()<dt*10)
    FX.push({k:'p',x:p.tx*TS+8+rand(-3,3),y:p.ty*TS+6,vx:rand(-6,6),vy:-rand(20,40),g:0,t:rand(.5,1),age:0,c:Math.random()<.5?'#ffb040':'#ff7a20',s:1});
}
function drawCritter(c){
  const x=Math.round(c.x),y=Math.round(c.y),b=c.moving?Math.round(Math.abs(Math.sin(c.anim))*1):0;
  if(c.k==='chicken'){
    shadow(x,y+2,4);cx.fillStyle='#f4f0e4';cx.fillRect(x-3,y-4-b,6,5);cx.fillStyle='#c8c0ac';cx.fillRect(x-3,y-1-b,6,2);
    cx.fillStyle='#d03a2a';cx.fillRect(x+(c.wx>=0?1:-2),y-6-b,2,2);cx.fillStyle='#e8a020';cx.fillRect(x+(c.wx>=0?3:-4),y-3-b,1,1);cx.fillStyle='#1a1a1a';cx.fillRect(x+(c.wx>=0?2:-3),y-4-b,1,1);
  }else{
    shadow(x,y+3,6);const d=c.wx>=0?1:-1;
    cx.fillStyle='#4a2c14';cx.fillRect(x-5,y-4-b,9,5);cx.fillStyle='#8a5a28';cx.fillRect(x-4,y-5-b,9,5);
    cx.fillStyle='#8a5a28';cx.fillRect(x+(d>0?4:-8),y-8-b,4,4);cx.fillStyle='#4a2c14';cx.fillRect(x+(d>0?4:-8),y-9-b,2,2);
    cx.fillStyle='#1a1a1a';cx.fillRect(x+(d>0?6:-7),y-7-b,1,1);
    cx.fillStyle='#6a4018';cx.fillRect(x+(d>0?-7:6),y-7-b+Math.round(Math.sin(time*14)),2,3);
    cx.fillStyle='#4a2c14';cx.fillRect(x-4,y+1-b,2,2);cx.fillRect(x+2,y+1-b,2,2);
  }
}
function drawHeart(x,y,f,sc){
  const rows=['.xx.xx.','xxxxxxx','xxxxxxx','.xxxxx.','..xxx..','...x...'];
  rows.forEach((r,j)=>{for(let i=0;i<7;i++)if(r[i]==='x'){
    cx.fillStyle=f>=1||(f>=.5&&i<4)?(j<2&&i>0&&i<3?'#ff8a8a':'#e02828'):'#3a0c0c';
    cx.fillRect(x+i*sc,y+j*sc,sc,sc)}});
  cx.fillStyle='#1a0505';cx.fillRect(x-sc,y+sc,sc,3*sc);cx.fillRect(x+7*sc,y+sc,sc,3*sc);cx.fillRect(x+sc,y-sc,2*sc,sc);cx.fillRect(x+4*sc,y-sc,2*sc,sc);
}

// warm dusk grading, vignette and drifting mist (matches the title screen mood)
const MIST=Array.from({length:7},(_,i)=>({x:i*90,y:30+Math.random()*210,r:70+Math.random()*60,s:rand(4,10)}));
function drawGrade(dt){
  cx.globalCompositeOperation='multiply';
  const gb=gradeStep(dt);
  const g=cx.createLinearGradient(0,0,0,H);gb.g.forEach((c,i)=>g.addColorStop(i/2,`rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`));
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.globalCompositeOperation='source-over';
  if(gb.mist>.01){
    cx.globalAlpha=gb.mist;
    for(const m of MIST){m.x+=m.s*dt;if(m.x>W+m.r)m.x=-m.r;
      const rg=cx.createRadialGradient(m.x,m.y,4,m.x,m.y,m.r);rg.addColorStop(0,'rgba(255,200,150,.14)');rg.addColorStop(1,'rgba(255,200,150,0)');
      cx.fillStyle=rg;cx.fillRect(m.x-m.r,m.y-m.r,m.r*2,m.r*2)}
    cx.globalAlpha=1;
  }
  if(!drawGrade.v){
    const c=document.createElement('canvas');c.width=W;c.height=H;const k=c.getContext('2d');
    const vg=k.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.62);vg.addColorStop(0,'rgba(14,8,34,0)');vg.addColorStop(1,'rgba(14,8,34,.6)');
    k.fillStyle=vg;k.fillRect(0,0,W,H);drawGrade.v=c;
    const gl=document.createElement('canvas');gl.width=gl.height=120;const q=gl.getContext('2d');
    const rg=q.createRadialGradient(60,60,2,60,60,60);rg.addColorStop(0,'rgba(255,170,80,.34)');rg.addColorStop(1,'rgba(255,190,100,0)');
    q.fillStyle=rg;q.fillRect(0,0,120,120);drawGrade.g=gl;
  }
  // low sun: warm orange light raking in from the right
  cx.globalCompositeOperation='lighter';
  for(const l of propLights()){cx.globalAlpha=clamp(l.a,0,1);cx.drawImage(l.c?cyanHalo():drawGrade.g,Math.round(l.x-cam.x-l.r),Math.round(l.y-cam.y-l.r),l.r*2,l.r*2)}
  cx.globalAlpha=1;
  const sun=cx.createLinearGradient(W,0,W*.35,0);const sc=gb.sun.map((v,i)=>i<3?Math.round(v):v);sun.addColorStop(0,`rgba(${sc[0]},${sc[1]},${sc[2]},${sc[3]})`);sun.addColorStop(1,`rgba(${sc[0]},${sc[1]},${sc[2]},0)`);
  cx.fillStyle=sun;cx.fillRect(0,0,W,H);
  cx.globalCompositeOperation='source-over';
  cx.drawImage(drawGrade.v,0,0);
}
const LEAVES=Array.from({length:40},(_,i)=>({x:Math.random()*W,y:Math.random()*H,s:rand(8,22),p:rand(0,6),c:pick(['#d9622a','#e0902a','#b8451a','#f0b13c'])}));
function drawLeaves(dt,alpha){
  for(const l of LEAVES){
    l.y+=l.s*dt;l.x+=Math.sin(time*1.4+l.p)*14*dt+6*dt;
    if(l.y>H+4){l.y=-4;l.x=Math.random()*W}if(l.x>W+4)l.x=-4;
    cx.globalAlpha=alpha;cx.fillStyle=(M&&M.cold)?'#f4f8ff':l.c;cx.fillRect(Math.round(l.x),Math.round(l.y),2,2);
  }
  cx.globalAlpha=1;
}

// ---------- rendering: menus ----------
function drawDialog(){
  const d=ui.d;
  panel(16,H-84,W-32,72);
  text(d.name,26,H-78,'#ffd040',9,'left',true);
  wrap(d.pages[d.i],W-64,8).forEach((l,i)=>text(l,26,H-64+i*11,'#f0e6d0',8));
  if(Math.floor(time*2)%2)text(d.i<d.pages.length-1?'>>':'OK',W-30,H-26,'#ffd040',8,'right',true);
  reg(0,0,W,H,advanceDialog);
}
function drawMenu(){
  const m=ui,VIS=9,n=m.opts.length,w=Math.min(W-20,Math.max(250,m.wide||360)),vis=Math.min(VIS,n);
  const h=40+vis*15+(m.foot?12:0),x=(W-w)/2,y=Math.max(8,(H-h)/2);
  const off=clamp(m.sel-Math.floor(vis/2),0,Math.max(0,n-vis));
  panel(x,y,w,h);
  const title=typeof m.title==='function'?m.title():m.title;
  text(title,W/2,y+8,'#ffd040',9,'center',true);
  for(let k=0;k<vis;k++){
    const i=off+k,o=m.opts[i],ty=y+26+k*15,lab=typeof o.t==='function'?o.t():o.t;
    if(i===m.sel){cx.fillStyle='rgba(255,200,80,.18)';cx.fillRect(x+6,ty-2,w-12,14)}
    text(lab,x+12,ty,i===m.sel?'#fff':'#c8b890',8);
    reg(x+6,ty-2,w-12,14,()=>{m.sel=i;runMenu(m,i)});
  }
  if(n>vis){text(off>0?'^':'',x+w-10,y+24,'#ffd040',8,'center');text(off+vis<n?'v':'',x+w-10,y+26+(vis-1)*15,'#ffd040',8,'center')}
  if(m.foot)text(m.foot(),W/2,y+h-14,'#8fd0ff',7,'center');
  if(m.closable)text('Backspace: close',W/2,y+h+3,'#a89878',6,'center');
}
function drawTitle(){
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a1308');g.addColorStop(.6,'#8a3a14');g.addColorStop(1,'#d9802a');
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.fillStyle='#f0b13c';cx.beginPath();cx.arc(340,150,34,0,TAU);cx.fill();
  const r=seeded(5);
  for(let layer=0;layer<3;layer++){
    cx.fillStyle=['#5a2410','#3a1608','#1e0c04'][layer];
    for(let i=0;i<22;i++){const x=i*24+(layer*9)-6,h=40+r()*50+layer*26,w=10+layer*6;cx.fillRect(x,H-h-layer*6,w,h+layer*6);cx.beginPath();cx.arc(x+w/2,H-h-layer*6,w*1.1,0,TAU);cx.fill()}
  }
  drawLeaves(.016,.9);
  text('SPICEWOOD',W/2,38,'#ffe9a0',34,'center',true);
  text('An autumn action-RPG',W/2,80,'#ffd9a0',8,'center');
  const opts=[];if(hasSave())opts.push({t:'Continue',fn:()=>{Snd.init();openSlots('continue')}});
  if(hasSave()&&ngpAvailable())opts.push({t:'New Game+',fn:()=>{Snd.init();openSlots('ngp')}});
  opts.push({t:'New Game',fn:()=>{pendingHero=HERO_START;openSlots('new')}});
  opts.push({t:Account.on?'Account: '+Account.meta.name:'Account',fn:()=>Account.open()});
  if(tsel>=opts.length)tsel=0;
  opts.forEach((o,i)=>{
    const y=120+i*20;
    if(i===tsel){cx.fillStyle='rgba(0,0,0,.45)';cx.fillRect(W/2-70,y-3,140,16)}
    text((i===tsel?'> ':'  ')+o.t,W/2,y,i===tsel?'#fff':'#e8c890',11,'center',true);
    reg(W/2-70,y-3,140,16,()=>{tsel=i;Snd.menu();o.fn()});
  });
  text('WASD move   J attack   K L ; skills   Space shield   I bag   T skills   N map   G guide   Q potion   E use   P pause',W/2,H-16,'#ffd9a0',6,'center');
  drawTitle.opts=opts;
}
function drawSelect(){
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1e0c04');g.addColorStop(1,'#5a2410');cx.fillStyle=g;cx.fillRect(0,0,W,H);
  drawLeaves(.016,.5);
  text('Choose your hero',W/2,10,'#ffe9a0',14,'center',true);
  HEROES.forEach((h,i)=>{
    const x=12+i*116,y=36,w=108,sel=i===hsel;
    panel(x,y,w,200);
    if(sel){cx.strokeStyle=h.color;cx.lineWidth=2;cx.strokeRect(x+1,y+1,w-2,198);cx.lineWidth=1}
    const spr=Spr.heroes[h.id].front,bob=sel?Math.round(Math.sin(time*5)*2):0;
    cx.drawImage(spr,x+w/2-spr.width*2,y+66-spr.height*4+bob,spr.width*4,spr.height*4);
    Spr.legs(cx,x+w/2,y+66+bob-4,h.dark,0,4);
    text(h.name,x+w/2,y+76,h.light,10,'center',true);
    text(h.cls,x+w/2,y+89,'#e8d8b0',8,'center');
    text(h.res,x+w/2,y+100,h.resColor,7,'center');
    wrap(h.desc,w-14,7).forEach((l,j)=>text(l,x+w/2,y+114+j*9,'#c8b890',7,'center'));
    const sb=(lab,v,yy)=>{text(lab,x+8,yy,'#a89878',6);bar(x+34,yy+1,w-44,4,v/12,h.color)};
    sb('STR',h.base.str,y+148);sb('DEX',h.base.dex,y+157);sb('INT',h.base.int,y+166);sb('VIT',h.base.vit,y+175);
    text(h.skills[0].name+', '+h.skills[1].name,x+w/2,y+187,'#e8d8b0',5,'center');
    reg(x,y,w,200,()=>{if(hsel===i)startNew(i);else{hsel=i;Snd.menu()}});
  });
  if(touchActive())touchBtn(8,H-26,52,16,'< Back',()=>tapKey('back'));
  else text('Left/Right choose   Enter start   Backspace back',W/2,H-16,'#ffd9a0',7,'center');
}
// building the world takes a few seconds: show a loading screen first (two frames are painted before the build blocks the thread)
let loading=null;
function whenWorldReady(fn,seed){
  seed=seed|0;
  if(worldSeedIs(seed)){fn();return}
  loading={};
  requestAnimationFrame(()=>requestAnimationFrame(()=>{try{setWorldSeed(seed);ensureWorld()}finally{loading=null}fn()}));
}
function drawLoading(){
  cx.fillStyle='#0d0906';cx.fillRect(0,0,W,H);
  text('SPICEWOOD',W/2,H/2-30,'#ffd040',20,'center',true);
  text('Growing the Spicewoods...',W/2,H/2+4,'#e8d8b0',8,'center');
  const bw=140,bx=Math.round((W-bw)/2),by=Math.round(H/2+20);
  cx.fillStyle='#000';cx.fillRect(bx-2,by-2,bw+4,8);cx.fillStyle='#3a2a18';cx.fillRect(bx,by,bw,4);
  const p=(time*.6)%1;cx.fillStyle='#e0902a';cx.fillRect(bx+Math.round(p*(bw-40)),by,40,4);
}
function startNew(i,slot,seed){
  if(seed===undefined)seed=newWorldSeed();   // every new hero grows a world of their own
  if(!worldSeedIs(seed)){whenWorldReady(()=>startNew(i,slot,seed),seed);return}
  if(slot!==undefined)curSlot=slot;
  Snd.init();newPlayer(i);scene='play';ui=null;toasts=[];
  loadMap(...toVillage());
  showStory(STORY.prologue[P.hero.id].concat(STORY.prologue.common),()=>playScene('meet'),'SPICEWOOD');
}


// ---------- save slots ----------
let slotArmSeed=0,slotMode='continue',ssel=0,pendingHero=0,slotArm=-1,slotArmT=0;
function openSlots(mode){slotMode=mode;scene='slots';ssel=curSlot;slotArm=-1;slotCache.t=-1e9}
function slotPick(i){
  const info=slots()[i];
  if(slotMode==='continue'){if(!info){toast('That slot is empty','#ff8070');return}Snd.init();const ws=slotSeed(i);if(!worldSeedIs(ws)){whenWorldReady(()=>slotPick(i),ws);return}if(!loadGame(i))toast('Could not load save','#ff8070')}
  else if(slotMode==='ngp'){if(!info||!info.won){toast('Finish the game in that slot first (defeat the Heartwood)','#ff8070');return}Snd.init();const ns=slotArmSeed||(slotArmSeed=newWorldSeed());if(!worldSeedIs(ns)){whenWorldReady(()=>slotPick(i),ns);return}slotArmSeed=0;startNgPlus(i,ns)}
  else{
    if(info&&slotArm!==i){slotArm=i;slotArmT=time;toast('Slot in use: press again to overwrite it','#ffb070');return}
    startNew(pendingHero,i);
  }
}
function updateSlots(){
  if(slotArm>=0&&time-slotArmT>3)slotArm=-1;
  if(Input.hit('up')){ssel=(ssel+2)%3;slotArm=-1;Snd.menu()}
  if(Input.hit('down')){ssel=(ssel+1)%3;slotArm=-1;Snd.menu()}
  if(Input.confirm())slotPick(ssel);
  if(Input.hit('sell')){
    const info=slots()[ssel];
    if(info){
      if(slotArm!==-2-ssel){slotArm=-2-ssel;slotArmT=time;toast(touchActive()?'Tap Delete again to DELETE this slot':'Press X again to DELETE this slot','#ff8070')}
      else{try{localStorage.removeItem(SAVE_KEYS[ssel])}catch(e){}if(Account.on)Account.deleteSlot(ssel);slotCache.t=-1e9;slotArm=-1;toast('Slot deleted','#ffb070');Snd.menu()}
    }
  }
  if(Input.hit('back'))scene=slotMode==='new'?'select':'title';
}
function drawSlots(){
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a1308');g.addColorStop(1,'#5a2410');cx.fillStyle=g;cx.fillRect(0,0,W,H);
  drawLeaves(.016,.7);
  text(slotMode==='new'?'Choose a slot for your new hero':slotMode==='ngp'?'Choose a finished slot for New Game+':'Choose a slot to continue',W/2,20,'#ffe9a0',12,'center',true);
  const sl=slots();
  for(let i=0;i<3;i++){
    const y=48+i*64,sel=ssel===i,info=sl[i];
    cx.fillStyle=sel?'rgba(0,0,0,.6)':'rgba(0,0,0,.4)';cx.fillRect(60,y,W-120,56);cx.strokeStyle=sel?'#ffd040':'#5a4228';cx.strokeRect(60.5,y+.5,W-121,55);
    text('SLOT '+(i+1),70,y+6,sel?'#ffd040':'#a89878',8,'left',true);
    if(info){
      cx.fillStyle=info.color;cx.fillRect(70,y+20,24,24);cx.fillStyle='rgba(255,255,255,.3)';cx.fillRect(72,y+22,8,8);
      text(info.hero,102,y+20,'#fff',10,'left',true);
      text(`Level ${info.lvl}   ${info.where}`,102,y+34,'#e8d8b0',7);
      text(fmtTime(info.pt),W-72,y+8,'#a89878',7,'right');
      if(info.ngp)text('New Game+ '+info.ngp,W-72,y+20,'#e8a030',7,'right',true);
      if(info.true_)text('TRUE END',W-72,y+32,'#8fd0ff',7,'right',true);
      else if(info.won)text('FINISHED',W-72,y+32,'#a8e0a0',7,'right',true);
      if(slotArm===-2-i)text(touchActive()?'Tap Delete again':'Press X again to delete',W/2,y+44,'#ff8070',7,'center',true);
      else if(slotArm===i&&slotMode==='new')text('Press again to overwrite',W/2,y+44,'#ffb070',7,'center',true);
    }else text('(empty)',102,y+26,'#6a5a48',10);
    reg(60,y,W-120,56,()=>{ssel=i;Snd.menu();slotPick(i)});
    if(info&&touchActive())touchBtn(W-108,y+36,44,15,'Delete',()=>{ssel=i;tapKey('sell')},'#ff8070');
  }
  if(touchActive())touchBtn(8,H-26,52,16,'< Back',()=>tapKey('back'));
  else text('Up/Down choose   Enter select   X delete   Backspace back',W/2,H-14,'#ffd9a0',7,'center');
  if(Account.on)text('Cloud: '+Account.meta.name,W-10,6,'#7fd6b0',7,'right');
}

// ---------- main loop ----------
function update(dt){
  time+=dt;
  if(loading){Input.end();return}
  if(scene==='play'&&P)P.pt=(P.pt||0)+dt;
  if(scene==='title'){
    const n=(hasSave()?(ngpAvailable()?3:2):1)+1;
    Account.menuTick();
    if(Input.hit('up'))tsel=(tsel+n-1)%n,Snd.menu();
    if(Input.hit('down'))tsel=(tsel+1)%n,Snd.menu();
    if(Input.confirm()&&drawTitle.opts){Snd.init();drawTitle.opts[tsel]&&drawTitle.opts[tsel].fn()}
    for(const t of toasts)t.t-=dt;toasts=toasts.filter(t=>t.t>0);
  }else if(scene==='slots'){
    updateSlots();
  }else if(scene==='select'){
    if(Input.hit('left')){hsel=(hsel+3)%4;Snd.menu()}
    if(Input.hit('right')){hsel=(hsel+1)%4;Snd.menu()}
    if(Input.confirm()){pendingHero=hsel;openSlots('new')}
    if(Input.hit('back'))scene='title';
  }else if(scene==='play'){
    if(fade.dir===1){fade.a+=dt*3.5;if(fade.a>=1){fade.a=1;if(fade.fn)fade.fn();fade.fn=null;fade.dir=-1}}
    else if(fade.dir===-1){fade.a-=dt*3.5;if(fade.a<=0){fade.a=0;fade.dir=0}}
    if(ui){updateUI(dt)}
    else if(hitStop>0)hitStop-=dt;
    else if(fade.dir!==1&&!P.dead){if(SC)updateScene(dt);else updatePlay(dt)}
    updateFx2(dt);
    if(M&&P&&fade.dir!==1&&!ui){/* camera handled in updatePlay */}
  }
  Input.end();
}
function render(dt){
  regions=[];cx.setTransform(2,0,0,2,0,0);cx.imageSmoothingEnabled=false;
  cx.fillStyle='#0d0906';cx.fillRect(0,0,W,H);
  if(loading){drawLoading();return}
  if(scene==='title')drawTitle();
  else if(scene==='select')drawSelect();
  else if(scene==='slots')drawSlots();
  else{
    drawWorld();drawDark();drawDarkLights();
    if(!M.dark){drawGrade(dt);drawAmbient(dt,.9)}
    if(SC)drawSceneOverlay();else{drawHUD();drawCodexBadge()}
    if(ui){
      if(ui.mode==='dialog')drawDialog();
      else if(ui.mode==='menu')drawMenu();
      else if(ui.mode==='inv')drawInv();
      else if(ui.mode==='map')drawMap();
      else if(ui.mode==='dmap')drawDungeonMap();
      else if(ui.mode==='bossintro')drawBossIntro();
      else if(ui.mode==='fair')drawFair();
      else if(ui.mode==='story')drawStory();
      else if(ui.mode==='codexpage')drawCodexPage();
    }
  }
  if(scene!=='play')for(const t of toasts)text(t.s,W/2,H-30,t.c,8,'center');
  if(fade.a>0){cx.fillStyle=`rgba(0,0,0,${fade.a})`;cx.fillRect(0,0,W,H)}
  drawTouchChrome();
  updateTouchOverlay();
}
let last=performance.now();
function frame(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  update(dt);render(dt);
  requestAnimationFrame(frame);
}

// ---------- pointer / touch ----------
cv.addEventListener('pointerdown',e=>{
  Snd.init();
  const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;
  for(let i=regions.length-1;i>=0;i--){
    const g=regions[i];
    if(x>=g.x&&x<g.x+g.w&&y>=g.y&&y<g.y+g.h){g.fn();break}
  }
});
let touchSeen=false,tcFrame=0;
const touchActive=()=>touchSeen||(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
function tapKey(k){Input.setV(k,true);Input.setV(k,false)}   // a tap on a canvas button acts like pressing that key once
// a button drawn on the canvas, for touch screens (menus have no keyboard there)
function touchBtn(x,y,w,h,label,fn,col){
  cx.fillStyle='rgba(0,0,0,.7)';cx.fillRect(x,y,w,h);cx.strokeStyle=col||'#ffd040';cx.strokeRect(x+.5,y+.5,w-1,h-1);
  text(label,x+w/2,y+Math.floor(h/2)-4,col||'#ffe9a0',8,'center',true);reg(x,y,w,h,fn);
}
// close / skip buttons for the screens that otherwise need Backspace
function drawTouchChrome(){
  if(!touchActive()||scene!=='play'||!ui)return;
  if(ui.mode==='inv'||(ui.mode==='menu'&&ui.closable))touchBtn(W-28,3,24,16,'X',()=>tapKey('back'));
  else if(ui.mode==='itemget')reg(0,0,W,H,()=>tapKey('interact'));
}
const TOOLSHORT={sickle:'Sickle',boots:'Dash',hook:'Hook',bow:'Bow',lantern:'Flare',windcharm:'Gust',emberglove:'Fire'};
const tbEl={};
function tbSet(id,html,cls){
  const e=tbEl[id]||(tbEl[id]=document.getElementById(id));const k=html+'|'+cls;if(e._k===k)return;e._k=k;
  e.innerHTML=html;e.classList.toggle('hot',cls==='hot');e.classList.toggle('dim',cls==='dim');e.classList.toggle('off',cls==='off');
}
function updateTouchOverlay(){
  const on=touchActive()&&scene==='play'&&!ui&&!SC;
  if(on!==lastTouchOverlay){lastTouchOverlay=on;document.getElementById('touch').classList.toggle('on',on);if(!on){Input.joy.x=Input.joy.y=0}}
  if(!on||!P||tcFrame++%6)return;
  // the buttons show what they will do right now
  const it=nearestInteract();
  tbSet('bE',it?({npc:'TALK',chest:'OPEN',sign:'READ',tome:'READ',board:'BOARD',wp:'TRAVEL',seal:'CUT',vine:'CUT'}[it.k]||'USE'):'USE',it?'hot':'');
  [0,1].forEach(i=>{const k=toolIn(i);tbSet(i?'bL':'bK',(i?'B':'A')+'<small>'+(k?TOOLSHORT[k]||'':'-')+'</small>',k?'':'dim')});
  tbSet('bQ','POT<small>'+P.potions+'</small>',P.potions>0?'':'dim');
  tbSet('bS','HOME',flags&&flags.scrolls>0?'':'off');
}
(function setupTouch(){
  addEventListener('touchstart',()=>{touchSeen=true},{passive:true});
  for(const b of document.querySelectorAll('.tb')){
    const k=b.dataset.k;
    b.addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();b.setPointerCapture(e.pointerId);Input.setV(k,true)});
    const up=e=>{Input.setV(k,false)};
    b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
  }
  const zone=document.getElementById('joy'),base=document.getElementById('joyBase'),knob=document.getElementById('joyKnob');
  let id=null,ox=0,oy=0;
  zone.addEventListener('pointerdown',e=>{
    e.preventDefault();id=e.pointerId;zone.setPointerCapture(id);
    const r=zone.getBoundingClientRect();ox=e.clientX;oy=e.clientY;
    base.style.display='block';base.style.left=(e.clientX-r.left)+'px';base.style.top=(e.clientY-r.top)+'px';
    knob.style.left='50%';knob.style.top='50%';
  });
  zone.addEventListener('pointermove',e=>{
    if(e.pointerId!==id)return;
    const rad=base.getBoundingClientRect().width/2||40;
    let dx=e.clientX-ox,dy=e.clientY-oy;const l=Math.hypot(dx,dy);
    if(l>rad){dx=dx/l*rad;dy=dy/l*rad}
    knob.style.left=(50+dx/rad*40)+'%';knob.style.top=(50+dy/rad*40)+'%';
    const f=Math.hypot(dx,dy)/rad;
    Input.joy.x=f<.18?0:dx/rad;Input.joy.y=f<.18?0:dy/rad;
  });
  const end=e=>{if(e.pointerId!==id)return;id=null;Input.joy.x=Input.joy.y=0;base.style.display='none'};
  zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end);
})();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&scene==='play'&&!ui&&P&&!P.dead)openPause()});
Music.want='title';
try{parent.postMessage({type:'ready'},'*')}catch(e){}
requestAnimationFrame(frame);
