'use strict';
// ================= Story: prologues, cutscenes, region NPCs, lore tomes (Codex), village chatter =================
// The Heart of Spicewood is an ancient tree-spirit. Its sap seasons the whole forest. Long ago the founders of Hearthmoor bound seven guardians to the Heart
// so that it could be harvested safely. Every harvest drained it a little more. The blight is not an enemy: it is the Heart's fever, and the guardians
// that went mad were its pain made flesh. Beating them eases the fever, the Heartwood ends the blight, and the Heartseed makes a promise for the future.

const STORY={
  prologue:{
    warrior:['Brann put down his sword years ago and took up a plough.','But the smoke over the Spicewoods reached even his quiet farm. And Elder Maren once pulled him out of a river, half dead.','Now she is calling in that debt.'],
    ranger:['Sylva grew up under these trees. She knows every path, every bird.','When the leaves began to rot from the inside, she understood that the forest was dying. And nobody else was listening.'],
    mage:['Merin has read about the Heart of Spicewood in a dozen forgotten books.','The blight is no plague, he is certain. It is a symptom.','He has come to find out what it is a symptom of.'],
    rogue:['Vex came to Hearthmoor for the spice trade and for rumours of a tree whose sap is worth a king\'s ransom.','Then the blight spread, and the rumours turned into something else.'],
    common:['Hearthmoor, a village on the edge of the Spicewoods. Autumn, as always.','But the woods are wrong. The leaves rot from the inside, and the old guardians of the forest have turned on the roads.','Elder Maren has called for a hero. In forty years she has never asked the village for anything.']
  },
  mid:['The Rust Warden falls, and a tremor runs through the earth.','Far away, deep in the forest, something groans like a sleeper turning over.','Every guardian you have defeated spoke of the Heart. None of them spoke of the blight as an enemy.','Maren\'s letters call the guardians locks that must be opened. But locks do not weep when they open.'],
  finale:['Maren falls. The golden roots let go of her, and the Heartseed rolls across the moss to your feet.','MAREN: "Nine generations... for what? A stew pot."','The Heart takes back what it is owed. The roots draw her down gently, the way one carries a sleeping child. She is not a monster now. Only tired.','You press the Heartseed into the soil. The Heartseed was never a key. It was a promise.','Light runs down every root. Across the Spicewoods the blight fades, and fourteen guardians dream at last. Hearthmoor will plant its harvests again, and take only what the forest gives.','THE END. The far lands are open, hero. Roam freely.'],
  charter:['The Cinder Colossus kneels. Behind its furnace door, wrapped in oilcloth, lies a charter pressed in copper: THE OATH OF HEARTHMOOR.','Seven names are hammered under it: Corwin Ashgrove, Halvard, Sorrel Pike, Wren Dunmore, Ysolt Vane, Pell Cardamon, and Edda Maren.','Beneath the oath someone added a second plate: THE TITHE. One part in three of the Heart\'s sap, owed to Hearthmoor, every year, for ever. Signed: Edda Maren.','You know that name. It hangs over the elder\'s door in Hearthmoor. You had never thought about it before.'],
  mirror:['The Prism Wraith shatters, and one shard stays lit. It shows a room you know: the elder\'s cellar in Hearthmoor, barrel upon barrel of Heart-sap.','Maren stands among them with a ledger. "Fourteen guardians," she says to nobody. "Nine have fallen. The hero is better than I dared hope. Soon there will be nothing left between me and the tap."','The shard goes dark. Maren\'s letters always arrived so quickly. Now you understand why: she never needed to ask how you were.'],
  founder:['The Hollow King does not rise. Corwin Ashgrove, first of the seven, stands in the dust of his crown. He speaks in a voice like dry leaves.','"Protect, never take. That was the oath. I kept the first half until I forgot everything else. Edda kept the second half in her ledger, and called it the Tithe. The shame is ours."','"The Maren line has fed on the Heart for nine generations. The last of them sends heroes to cut the Heart\'s chains, so that nothing stands between her and the sap."','He presses the Oathcrown into your hands. "Go to the Hoarfrost Ridge. My last guardian keeps the Heart\'s last seed. Plant it. Do not give it to her."'],
  warden:['The Winter Warden\'s crown melts, and beneath the ice you find the Heart\'s last secret: a single seed, still green.','The Heartseed was never a key. It was a promise.','"She comes behind you," the Warden whispers. "She has been behind you all along. Plant it, hero. Quickly."'],
  betrayal:['The Frozen Roots part, and the Heart of Spicewood opens before you: warm, golden, trembling. The Heartseed hums in your pack.','Someone is waiting at the foot of the great tree: Elder Maren, a lantern in her hand, and behind her a hundred men in Hearthmoor grey. The Tithe Guard.','MAREN: "You did it, my dear. Fourteen guardians, and not one left to stand between the Heart and the village. I could never have done it without you."','MAREN: "Now the seed, please. If it takes root the Heart will heal, and a healed Heart gives nothing. I will bind myself to it as the founders did, and Hearthmoor will never be hungry again."','@REACTION','You refuse. The Tithe Guard strike you down, and the Heartseed is torn from your pack.','MAREN: "Thank you for everything. Truly." She drives a silver spigot into the great root, and the Heart screams.','The Heartwood wakes in agony. You drag yourself up. The Heart\'s fever is a living wall, and Maren is on the other side of it.'],
  bind:['The Heartwood sags, and for a moment the blight lifts. Then Maren walks into the light, the silver spigot in one hand and the Heartseed in the other.','MAREN: "So close. The Heart has no strength left to fight me." She presses the spigot to her own chest. Roots lash around her, and she rises, wreathed in sap and gold.','MAREN: "I am the Heart now. Every drop of the Spicewoods will be mine. And you will be a story the village tells at supper."'],
  reaction:{warrior:'BRANN: "You pulled me out of that river so that I could drown a forest for you?"',ranger:'Sylva says nothing. She nocks an arrow, and her hand does not shake.',mage:'MERIN: "A symptom. I should have known it was a symptom of greed."',rogue:'VEX: "Never a price named, never a contract. I should have known from the first letter."'},
  epi:{warrior:'Brann returns to the plough. He keeps Maren\'s letters in a drawer, and never answers them, and never burns them.',ranger:'Sylva walks the quiet paths. The birds are back before the first snow.',mage:'Merin writes one sentence in his book: "The symptom was us."',rogue:'Vex keeps a single jar of Heart-sap, unopened, as a reminder of a price nobody ever paid.'},
  true:['The Winter Warden\'s crown melts, and beneath the ice you find the Heart\'s last secret: a single seed, still green.','You carry it back to the roots of the old tree and press it into the soil. The Heartseed was never a key. It was a promise.','Hearthmoor will plant its harvests again, and take only what the forest gives. The guardians sleep at last, and the Spicewoods dream of spring.','THE TRUE END. Thank you for playing Spicewood.']
};

const ELDER_MID=['The Rust Warden is scrap, and you carry the Miner\'s Lantern. A black tunnel dives under the gorge north of Ember Glade. Saffron Meadows lies beyond. Hurry, hero.','Saffron Meadows... the Harvest King keeps the granary. Bring him down before the harvest rots.','The Windcharm! A wind pass north of Saffron leads to the Windward Steppe. The Storm Herald waits at the top of his citadel.','The Gale Citadel. The wind there carries news to every corner of the world. Be careful what it says about you.','The Heraldwing! The road west climbs to the Smolder Spire. A tyrant of fire sits at its core.','The Magma Tyrant fell? Good. Slagwalkers will carry you south to Cinderfall Heights.','Cinderfall, the forge of old. The Colossus must stop before the fires go out.','The Ember Glove. It can burn the thorn wall east of Ember Glade. The Tanglewood is wild, so go carefully.','The Thorn Matriarch rules the Rootmaw. Her children are everywhere.','A Briar Key. South of the Tanglewood lies the Spice Delta, where the Baron hoards the world\'s spice.','The Pepper Baron\'s cellar. Spice, hero. Bring me a taste of it when you are done.','Dune Goggles! East of Saffron Meadows a sandstorm rages. The Mesa is beyond it.','The Sunken Sandhall. A king with a crown of roots sits there still.','A Sunstone. It will part the crystal veil north of the Mesa. Crystal Gulch awaits.','The Prism Vault. The Wraith cannot leave it. Be quick, hero. Time is short.','A Truthglass. The old miners spoke of a hidden door north of Rustpeak. Ghostbark Grove is beyond it.','The Ghostbark Crypt. The Hollow King has waited a long time for someone to kneel to him.','The Oathcrown! West of the Smolder Spire the gate of black ice will know it. The Hoarfrost Ridge is the last stop before the Heart.','The Frozen Reliquary. The Winter Warden guards the oldest secret in the forest. Bring it back to me.','The Heartseed! You have done it. Carry it through the frozen roots south of the ridge, to the Heart of Spicewood. I will follow, hero.','The old tree at the Heart of Spicewood is the source of the blight. End it, hero. All of us are counting on you.','The Heart of Spicewood. The end of the road, hero.'];   // placeholder: stages 10..31 (replaced by the Story step)

const LETTERS=[{s:4,pages:['My dear hero,','You cannot know how proud Hearthmoor is. Old Barkfather was the hardest of them, I think. The road south into Amber Hollow is yours now.','Burn this letter if you like. I only sign for the village.','- Maren']},{s:8,pages:['The reports from the marsh say the Matron wailed as she fell. Do not be moved by it. They are not people, hero. They are locks, and every one you open brings us closer to peace.','- Maren']},{s:10,pages:['The Rust Warden. I confess I did not think you would manage him. Hurry now: winter is coming and the village cannot wait. The lantern will lead you north. Do not dawdle in the tunnels.','- M.']},{s:14,pages:['You are quicker than I dared hope. A rider tells me the wind has spoken your name across the steppe. I wish it had stayed silent.','Say nothing to the guardians about me. They are liars, the lot of them.','- M.']},{s:18,pages:['Cinderfall. You will have found the old forge. There are papers there, hero, nothing but old papers. A family name is only a name. I would not read too much into a copper plate.','Come home for supper when you can.','- Maren']},{s:22,pages:['The Baron is down? I hear the spice markets are... never mind.','Keep to your road. Only five more to go. I mean, five more of the pests.','- M.']},{s:26,pages:['You went into the Gulch. A pity. Some mirrors show more than they should, and nothing they show is kind.','I have only ever wished you well.','- Maren']},{s:28,pages:['You have the crown. Good. Bring it to the Ridge, and then to the Heart, and I will meet you there with the village. Do not stop. The seed is what matters.','- Maren']},{s:30,pages:['You have the seed. I knew you would. Come to the Heart quickly, my dear. We are all waiting for you.','- Maren']}];
function nextLetter(){
  flags.letters=flags.letters||{};
  for(let i=0;i<LETTERS.length;i++)if(flags.stage>=LETTERS[i].s&&!flags.letters[i]){flags.letters[i]=true;return LETTERS[i]}
  return null;
}
function finalePages(){
  const pg=STORY.finale.slice(),last=pg.pop();
  const e=STORY.epi[P.hero.id];if(e)pg.push(e);
  const helped=[];for(const z in QDEFS){const st=flags.q&&flags.q[QDEFS[z].id];if(st&&st.s===2&&ZNPC[z])helped.push(ZNPC[z].name)}
  if(helped.length)pg.push('In the crowd around the roots stand '+helped.slice(0,5).join(', ')+(helped.length>5?' and '+(helped.length-5)+' more':'')+'. They remember what you did for them.');
  pg.push(last);
  return pg;
}
function betrayalPages(){return STORY.betrayal.map(p=>p==='@REACTION'?(STORY.reaction[P.hero.id]||'You say nothing.'):p)}

const NPCPALS=[{h:'#6a3a1a',c:'#4a7a4a',k:'#2a4a2a',g:'#e8d8a0'},{h:'#c8a050',c:'#8a4a3a',k:'#5a2a22',g:'#f0d0b0'},{h:'#2a2a3a',c:'#5a5a8a',k:'#3a3a5a',g:'#d8d8f0'},{h:'#a8541e',c:'#7a6a3a',k:'#4a3e22',g:'#f0e0c0'},{h:'#e8e8e8',c:'#6a5a8a',k:'#3a2a5a',g:'#d8b040'},{h:'#4a2a1a',c:'#9a7a4a',k:'#5a4a22',g:'#e8d0a0'}];
const ZNPC={
  glade:{name:'Fenn the Woodcutter',pre:['The oak up north? Barkfather was our guardian once. Now the sap on his bark runs black.'],post:['Barkfather has gone quiet. First time in my life the glade is silent.']},
  amber:{name:'Lira the Herbalist',pre:['The Spore Warren keeps growing. Mother Mycelia never used to leave her cave.'],post:['Without Mycelia the spores drift on their own. Dangerous, but gentler.']},
  marsh:{name:'Old Gurt the Ferryman',pre:['No ferries here, only fords. And the Matron wails at night. Not in anger, I think. In pain.'],post:['The water is calmer. Still no ferries.']},
  rust:{name:'Dagna the Prospector',pre:['The Warden sealed the lower shafts. The ore down there is strange. Warm, like it has a pulse.'],post:['The Warden is scrap. We may mine the lower shafts now, though the ore is still warm.']},
  grove:{name:'Edric the Gravedigger',pre:['The dead do not rest here. The Hollow King keeps calling them home.'],post:['Quiet nights now. I still keep the shovel handy.']},
  heart:{name:'Willow the Hermit',pre:['Do you hear it? The Heart beats slower every day.'],post:['It beats stronger. But slowly, like a sleeper\'s heart. It is not healed, only calm.']},
  saffron:{name:'Marta the Farmer',pre:['The Harvest King took our granary and never gave a single grain back.'],post:['We have our harvest again. The King only wanted it kept safe, they say.']},
  ember:{name:'Brokk the Smith',pre:['The Colossus guards a forge nobody lit. The fire inside is far older than Hearthmoor.'],post:['The forge is cold. Strange, but I miss the heat.']},
  tangle:{name:'Sprig the Scout',pre:['Stay on the road. The Matriarch\'s children eat anything that steps off it.'],post:['The thorns are calmer. The jungle still grows, but like a garden now.']},
  delta:{name:'Cumin the Merchant',pre:['The Baron hoards every spice in the world. I would pay anything for a barrel of cinnamon.'],post:['The Baron is gone and spices flow again. Business is wonderful!']},
  mesa:{name:'Zahra the Nomad',pre:['The Tyrant buried a whole palace. They say the Heart\'s roots reach even here.'],post:['The sands have settled. The palace sleeps.']},
  steppe:{name:'Gale the Shepherd',pre:['The wind carries one message, always the same word. Heart. Heart. Heart.'],post:['The wind is only wind now.']},
  spire:{name:'Ash the Hermit',pre:['The mountain has a fever. So does the forest. Same sickness, I think.'],post:['The mountain cools. The fever has broken.']},
  gulch:{name:'Prism the Crystal-Seer',pre:['The light here cannot escape. Neither can I, some days.'],post:['The light flows out. For the first time the gulch is dim.']},
  ridge:{name:'Hilda the Snow-Warden',pre:['The Warden guards the oldest thing in the forest. Not a treasure. A secret.'],post:['The Warden\'s dust blows down the ridge. The secret is in your hands now.']}
};
const ZNPCBOSS={glade:'boss',amber:'boss2',marsh:'boss3',rust:'boss4',grove:'boss5',heart:'boss16',saffron:'boss7',ember:'boss8',tangle:'boss14',delta:'boss15',mesa:'boss13',steppe:'boss9',spire:'boss10',gulch:'boss12',ridge:'boss11'};

const TOMES={
  glade:[['Founder\'s Journal I','Corwin Ashgrove, first day of autumn: We found the great tree. Its sap tasted of cinnamon and woodsmoke. Seven of us swore the Oath that day: protect, never take.'],['A Woodcutter\'s Note','Never cut within a day\'s walk of the Hollow Oak. The Barkfather does not forgive. But he is fair. He only wants the forest left whole.']],
  amber:[['Founder\'s Journal II','The sap is thin this year. Edda says we must tap twice as much, so the market will not notice. Sorrel wept when the spigot went in. The tree sighed.'],['Spore Research','Mycelia is no monster. She is the forest\'s memory, spread through every root. When the Heart hurts, she remembers it for all of us.']],
  marsh:[['The Matron\'s Lullaby','"Sleep, little tide, the Heart is near. Sleep, little reed, nothing to fear." The words are scratched into the shrine in a dozen hands.'],['Founder\'s Journal III','Halvard forged the chains and Ysolt sang the binding. Each of us gave two guardians a piece of the Heart\'s life. A guardian that cannot die while the Heart lives. We did not ask what that cost the Heart.']],
  rust:[['Miner\'s Log','Day 41: The lower shafts are warm. The ore pulses, I swear it. The Warden says to leave it sealed. Day 42: I unsealed it.'],['Warden\'s Orders','"Guard the shafts. Let nothing down and let nothing up." Whoever wrote this was afraid, not of what lies below but of what we would do to it.']],
  grove:[['Epitaph of the Hollow King','Here stands Corwin Ashgrove, who swore to protect a tree and forgot everything else, even his own name.'],['A Gravedigger\'s Diary','The dead rise because the Heart calls them. It is lonely, down there in the roots. It wants company.']],
  heart:[['The Root-Gate Inscription','Only one who carries a promise may enter. The Heartseed is that promise.'],['Last Page of the Founder\'s Journal','We have taken too much. The Heart is dying and the blight is its scream. Edda\'s Tithe will drain it before the century is out. If anyone reads this: stop her line. Plant instead.']],
  saffron:[['Granary Ledger','The harvest was good. The King stored all of it. When we asked for our share he said: "Wait for winter. Winter always comes."'],['A Child\'s Drawing','A scarecrow with a crown, and the words: "He is not angry. He is hungry."']],
  ember:[['Forge Notes','The Colossus was built to forge the guardians\' weapons. It never stopped, long after there was anything left to guard.'],['A Smith\'s Warning','If the fires of Cinderfall ever go out, the Heart is nearly dead. They have been flickering for years.']],
  tangle:[['Scout\'s Map Note','The Thorn Matriarch\'s jungle grew from a single seed the Heart dropped. All of this forest is the Heart\'s child.'],['Vine Song','The roots hum when you step on them. It is not a threat. It is a heartbeat.']],
  delta:[['Spice Ledger','Cinnamon, clove, nutmeg, pepper, anise: all of them taste of the Heart. The Baron only wanted to keep it forever.'],['A Cook\'s Confession','I put a pinch of Heart-sap in every stew. The villagers say it tastes like home. I never told them what home costs.']],
  mesa:[['Palace Frieze','A king with a crown of roots kneels before a tree. The tree is smiling. The king is not.'],['Nomad Proverb','"Sand remembers what stone forgets, and stone remembers what trees forget." Only the Heart remembers everything.']],
  steppe:[['Storm Herald\'s Oath','I carry the news of the Heart to every corner of the world. The news is always the same: it is hurting.'],['Windwalker\'s Song','Under the hill, under the grass, the Heart is dreaming. Do not wake it too quickly.']],
  spire:[['Obsidian Tablet','The mountain\'s fire and the forest\'s sap are one river. The Heart feeds both. When it weakens, both burn.'],['Magma Tyrant\'s Boast','I am the Heart\'s fever. I burn so it does not have to.']],
  gulch:[['Crystal Inscription','Every crystal remembers a light that once shone on the Heart. Break one and you free a memory.'],['Seer\'s Notes','There are two reflections of everything in the Gulch: one that obeys you, and one that tells the truth.']],
  ridge:[['Warden\'s Last Wish','I froze the Heart\'s last seed to keep it safe. When the blight ends, someone must carry it home and plant it. Not harvest. Plant.'],['The Frozen Page','The founders\' real sin was not taking. It was never planting anything in return.']]
};
const TOMELIST=[];for(const z in TOMES)TOMES[z].forEach((t,i)=>TOMELIST.push({id:z+'_'+i,zone:z,title:t[0],text:t[1]}));
const TOMEBYID={};for(const t of TOMELIST)TOMEBYID[t.id]=t;

// Village chatter by chapter (A: before Barkfather's chest ... E: after the finale)
const chapter=()=>flags.won?4:flags.boss8?3:flags.boss4?2:flags.boss?1:0;   // 0 start, 1 Barkfather down, 2 Rust Warden down, 3 the Cinderfall charter found, 4 the end
const VCHAT={
  smith:[['Torvald: Beetles on the north road have shells like plate. Bring me some and I will show you what a smith can do.'],['Torvald: The sap on the Barkfather\'s bark, it burned my tongs. Strange. It is not poison. It is pain.'],['Torvald: Rust and iron, hero. Do you know the Warden was forged in this very anvil, three centuries ago?'],['Torvald: My great-grandfather made the guardians\' weapons. He wrote on every blade: "Protect, never take."'],['Torvald: Peaceful days. I am forging ploughs again. And, for the first time, a sapling-spade.']],
  tavern:[['Dolly: Cider is on the house if you bring the village good news. Everyone is afraid of the woods tonight.'],['Dolly: The travellers say the guardians cry at night. Wolves, I tell them. They do not believe me.'],['Dolly: A merchant swore he saw a crowned skeleton waving at the roadside. I gave him double cider.'],['Dolly: The old stories say the founders swore an oath to the Heart. Nobody remembers the oath, only the sap.'],['Dolly: Your cider is on me, forever. And tell me: is it true the forest is quiet again?']],
  alch:[['Pip: Herbs from the glade, nothing finer. But look: the leaves are brown at the edges. That is not autumn.'],['Pip: Spore samples from the Warren react to every medicine I own. As if the forest were asking for help.'],['Pip: I tested a drop of marsh-water against Heart-sap. The sap rejects the blight, but only for a moment. It is fighting.'],['Pip: The blight is a fever. I would stake my licence on it. And fevers break when you stop what caused them.'],['Pip: My medicines work again! The forest sends better herbs than ever.']],
  stash:[['Bruna: Storage is storage, dear. But if you find a Heart Fruit, bring it to me, and I will weigh it for you.'],['Bruna: Bring ore and wood and I will build more shelves. The village will need them when this is over.'],['Bruna: The deeper you go, the heavier the loot. Make sure your bag has room for it.'],['Bruna: Funny. All those relics and not a single one of them is a seed.'],['Bruna: The shelves are overflowing, and the cellar is full of seedlings. Hearthmoor plants again.']]
};
function villageChat(id){
  const l=VCHAT[id];if(!l)return null;
  const k='vc_'+id+'_'+chapter();
  if(flags.talked&&flags.talked[k])return null;
  flags.talked=flags.talked||{};flags.talked[k]=true;
  return l[chapter()];
}

// ---------- cutscene screen ----------
function showStory(pages,done,title){ui={mode:'story',pages,i:0,t:0,done,title}}
function updateStory(dt){
  const s=ui;s.t+=dt;
  const full=s.pages[s.i].length/38;
  if(Input.confirm()||Input.hit('back')){
    if(s.t<full){s.t=full+.01}
    else{s.i++;s.t=0;Snd.menu();if(s.i>=s.pages.length){const f=s.done;ui=null;if(f)f()}}
  }
}
function drawStory(){
  const s=ui;
  cx.fillStyle='#050302';cx.fillRect(0,0,W,H);
  if(s.title)text(s.title,W/2,22,'#8a6a3a',9,'center',true);
  const pg=s.pages[s.i],n=Math.min(pg.length,Math.floor(s.t*38));
  const lines=wrap(pg.slice(0,n),W-120,10);
  const y0=H/2-(wrap(pg,W-120,10).length*14)/2;
  lines.forEach((l,i)=>text(l,W/2,y0+i*14,'#e8dcc0',10,'center'));
  if(n>=pg.length&&Math.floor(time*2)%2)text(s.i<s.pages.length-1?'>>':'OK',W-24,H-22,'#ffd040',8,'right',true);
  text(`${s.i+1}/${s.pages.length}`,16,H-22,'#5a4a38',6);
  reg(0,0,W,H,()=>{if(s.t<pg.length/38)s.t=pg.length/38+.01;else{s.i++;s.t=0;if(s.i>=s.pages.length){const f=s.done;ui=null;if(f)f()}}});
}

// ---------- tomes ----------
function readTome(id){
  const t=TOMEBYID[id];if(!t)return;
  flags.lore=flags.lore||{};
  const first=!flags.lore[id];flags.lore[id]=true;
  say(t.title,[t.text],()=>{if(first){toast(`Codex entry added (${Object.keys(flags.lore).length}/${TOMELIST.length})`,'#8fd0ff');Snd.level();save()}});
}
