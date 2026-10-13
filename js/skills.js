'use strict';
// ---------- Skill definitions (base skills come from HEROES, extras unlock through the trees) ----------
const SKILLS={};
for(const h of HEROES)for(const s of h.skills)SKILLS[s.id]=Object.assign({},s,{hero:h.id,desc:{
  cleave:'Spin and hit everything around you.',slam:'Smash the ground: big radius, stuns.',
  multishot:'Fire a fan of five arrows.',pierce:'A heavy arrow that pierces every enemy.',
  fireball:'Explodes on impact.',nova:'Freezing ring that slows enemies.',
  dash:'Dash through enemies, cutting them.',knives:'Throw eight knives in a ring.'}[s.id]||''});
Object.assign(SKILLS,{
  shieldbash:{id:'shieldbash',name:'Shield Bash',cost:20,cd:5,desc:'Slam the shield into enemies ahead: heavy knockback and a long stun.'},
  bloodrage:{id:'bloodrage',name:'Bloodrage',cost:30,cd:12,desc:'For 6s: +25% damage and +30% attack speed.'},
  smite:{id:'smite',name:'Holy Smite',cost:35,cd:6,desc:'Call down light ahead of you. Damages enemies and heals you.'},
  sniper:{id:'sniper',name:'Sniper Shot',cost:40,cd:7,desc:'A long, piercing shot that always crits.'},
  trap:{id:'trap',name:'Spike Trap',cost:25,cd:6,desc:'Drop a trap. It springs on the first enemy, damaging and slowing.'},
  rain:{id:'rain',name:'Rain of Arrows',cost:45,cd:9,desc:'Arrows rain down on the target area after a short delay.'},
  meteor:{id:'meteor',name:'Meteor',cost:45,cd:9,desc:'A meteor crashes down ahead of you after a short delay.'},
  frostbolt:{id:'frostbolt',name:'Frost Bolt',cost:20,cd:2.5,desc:'A piercing bolt that chills everything it hits.'},
  blink:{id:'blink',name:'Blink',cost:25,cd:5,desc:'Teleport forward, brief invulnerability, small blast on arrival.'},
  execute:{id:'execute',name:'Execute',cost:35,cd:5,desc:'Lunge at the nearest enemy and strike for huge damage.'},
  smoke:{id:'smoke',name:'Smoke Bomb',cost:30,cd:8,desc:'Burst of smoke: slows and stuns nearby enemies, you vanish briefly.'},
  venom:{id:'venom',name:'Poison Blade',cost:25,cd:10,desc:'For 8s your hits poison enemies.'},
  // ---- ultimates (unlocked by a specialization capstone)
  roar:{id:'roar',name:'Bulwark Roar',cost:60,cd:24,ult:true,desc:'A thundering shout: stuns nearby enemies and you take 40% less damage for 6 seconds.'},
  whirl:{id:'whirl',name:'Whirlwind',cost:60,cd:22,ult:true,desc:'Spin for 3 seconds, hitting everything around you again and again.'},
  judgment:{id:'judgment',name:'Divine Judgment',cost:70,cd:26,ult:true,desc:'A pillar of light crashes down ahead of you: heavy damage, stun, and it heals you.'},
  deadeye:{id:'deadeye',name:'Deadeye',cost:60,cd:22,ult:true,desc:'Unleash five heavy piercing shots that always crit.'},
  trapfield:{id:'trapfield',name:'Trap Field',cost:60,cd:24,ult:true,desc:'Lay six traps in a ring around you.'},
  arrowstorm:{id:'arrowstorm',name:'Storm of Arrows',cost:70,cd:26,ult:true,desc:'A wide area is hit by arrow volleys for three seconds.'},
  inferno:{id:'inferno',name:'Inferno',cost:70,cd:26,ult:true,desc:'Three expanding rings of fire burn everything around you.'},
  zero:{id:'zero',name:'Absolute Zero',cost:70,cd:28,ult:true,desc:'A freezing blast stuns and slows every enemy nearby.'},
  barrage:{id:'barrage',name:'Arcane Barrage',cost:65,cd:22,ult:true,desc:'Fire arcane bolts in every direction, twice.'},
  deathmark:{id:'deathmark',name:'Death Mark',cost:60,cd:22,ult:true,desc:'Blink through up to four enemies, striking each for heavy damage.'},
  vanish:{id:'vanish',name:'Vanishing Strike',cost:60,cd:22,ult:true,desc:'Become untouchable for two seconds and strike everything near you in a flurry.'},
  plague:{id:'plague',name:'Plague Cloud',cost:55,cd:24,ult:true,desc:'A poison cloud poisons and slows all enemies around you.'}
});

// ---------- ranks and runes ----------
// Every active skill can be ranked up to 5 (+12% damage and -4% cooldown per rank). At rank 3 and rank 5 you choose one of two runes.
const RUNEDEF={
  power:{n:'Empowered',d:'+25% damage'},swift:{n:'Swift',d:'-25% cooldown'},frugal:{n:'Efficient',d:'-35% cost'},wide:{n:'Wide',d:'+35% area and range'},
  stun:{n:'Stunning',d:'Hits stun enemies briefly'},vamp:{n:'Vampiric',d:'Heal 8% of the damage you deal'},chill:{n:'Chilling',d:'Hits slow enemies'},
  burn:{n:'Scorching',d:'Hits set enemies ablaze'},pierce:{n:'Piercing',d:'Projectiles pierce enemies'},echo:{n:'Echoing',d:'Casts again at 60% power a moment later'},venom:{n:'Venomous',d:'Hits poison enemies'}
};
const RUNESET={
  cleave:[['wide','vamp'],['stun','echo']],slam:[['wide','stun'],['power','vamp']],multishot:[['pierce','chill'],['echo','power']],pierce:[['power','burn'],['swift','vamp']],
  fireball:[['wide','burn'],['echo','frugal']],nova:[['wide','stun'],['power','swift']],dash:[['swift','vamp'],['power','echo']],knives:[['venom','pierce'],['echo','power']],
  shieldbash:[['stun','wide'],['vamp','power']],bloodrage:[['swift','frugal'],['echo','power']],smite:[['wide','vamp'],['power','swift']],sniper:[['pierce','burn'],['power','swift']],
  trap:[['wide','chill'],['power','venom']],rain:[['wide','chill'],['echo','power']],meteor:[['wide','burn'],['power','echo']],frostbolt:[['pierce','stun'],['power','echo']],
  blink:[['swift','wide'],['power','frugal']],execute:[['vamp','swift'],['power','echo']],smoke:[['wide','swift'],['stun','frugal']],venom:[['swift','frugal'],['power','echo']]
};
const SP_PER_RANK=1,MAXRANK=5;
// skill points earned: one per level from level 2, plus a bonus point at levels 10, 20 and 30
const spTotalAt=l=>Math.max(0,l-1)+Math.floor(l/10);
const spOldAt=l=>{let n=0;for(let i=2;i<=l;i++)if(i<=10||i===15)n++;return n};

// ---------- Talent trees: 3 branches x 6 nodes. Learn in order; the capstone costs 2, unlocks an ultimate, and only one branch can have one. ----------
const P_=(id,name,mods)=>({id,name,type:'passive',mods});
const A_=(skill)=>({id:skill,name:SKILLS[skill].name,type:'skill',skill});
const C_=(id,name,mods,ult)=>({id,name:name,type:'cap',mods,cost:2,ult});
const TREES={
  warrior:[
    {name:'Guardian',color:'#6a9ae0',nodes:[P_('w1a','Thick Skin',{hpPct:10}),A_('shieldbash'),P_('w1c','Iron Will',{armor:8,potPct:25}),P_('w1d','Stalwart',{reducePct:5,regenHp:1}),P_('w1e','Bastion',{hpPct:12,thorns:15}),C_('w1f','Bulwark',{reducePct:12,thorns:25},'roar')]},
    {name:'Berserker',color:'#e04a3a',nodes:[P_('w2a','Bloodlust',{dmgPct:8,lifesteal:3}),A_('bloodrage'),P_('w2c','Brutality',{crit:8,critDmg:30}),P_('w2d','Reckless',{atkSpdPct:8,dmgPct:6}),P_('w2e','Carnage',{critDmg:30,killHeal:3}),C_('w2f','Executioner',{execute:50,killHeal:8},'whirl')]},
    {name:'Crusader',color:'#f0d060',nodes:[P_('w3a','Blessed Blade',{heavyPct:30}),A_('smite'),P_('w3c','Vigil',{regenHp:1.5,armor:4}),P_('w3d','Zeal',{dmgPct:8,regenHp:1}),P_('w3e','Sanctuary',{reducePct:6,hpPct:8}),C_('w3f','Radiance',{finisherRing:.7},'judgment')]}
  ],
  ranger:[
    {name:'Marksman',color:'#e8d060',nodes:[P_('r1a','Keen Eye',{crit:6,critDmg:20}),A_('sniper'),P_('r1c','Steady Aim',{dmgPct:10}),P_('r1d','Hawk Sight',{crit:5,critDmg:20}),P_('r1e','Predator',{dmgPct:8,execute:25}),C_('r1f','Eagle Eye',{critDmg:60,pierce:1},'deadeye')]},
    {name:'Trapper',color:'#7fd06a',nodes:[P_('r2a','Light Foot',{armor:5,spdPct:6}),A_('trap'),P_('r2c','Quick Hands',{cdr:12}),P_('r2d','Snare Craft',{trapPct:40,cdr:5}),P_('r2e','Evasion',{dodge:6,spdPct:6}),C_('r2f','Master Trapper',{cdr:20,trapPct:100},'trapfield')]},
    {name:'Stormcaller',color:'#8ad0ff',nodes:[P_('r3a','Fletching',{atkSpdPct:10}),A_('rain'),P_('r3c','Wind Walker',{spdPct:8,regenPct:25}),P_('r3d','Gale Force',{atkSpdPct:8,skillDmg:10}),P_('r3e','Tailwind',{spdPct:8,cdr:6}),C_('r3f','Tempest',{atkSpdPct:20,skillDmg:30},'arrowstorm')]}
  ],
  mage:[
    {name:'Pyromancer',color:'#ff8a2a',nodes:[P_('m1a','Ember Touch',{skillDmg:12}),A_('meteor'),P_('m1c','Fuel the Flame',{dmgPct:10}),P_('m1d','Kindling',{skillDmg:10,crit:4}),P_('m1e','Wildfire',{skillDmg:12,burn:1}),C_('m1f','Inferno',{skillDmg:30,burn:1},'inferno')]},
    {name:'Cryomancer',color:'#80d0ff',nodes:[P_('m2a','Chill',{armor:5,hpPct:6}),A_('frostbolt'),P_('m2c','Brittle',{crit:8,critDmg:30}),P_('m2d','Permafrost',{armor:6,reducePct:4}),P_('m2e','Shatter',{critDmg:30,skillDmg:8}),C_('m2f','Deep Freeze',{freeze:1,skillDmg:15},'zero')]},
    {name:'Arcanist',color:'#c080ff',nodes:[P_('m3a','Focus',{regenPct:30}),A_('blink'),P_('m3c','Quick Casting',{cdr:12}),P_('m3d','Mana Flow',{regenPct:25,skillDmg:8}),P_('m3e','Overchannel',{cdr:8,skillDmg:10}),C_('m3f','Arcane Mastery',{cdr:20,regenPct:50},'barrage')]}
  ],
  rogue:[
    {name:'Assassin',color:'#e04a5a',nodes:[P_('x1a','Sharp Edge',{crit:8}),A_('execute'),P_('x1c','Deadly',{critDmg:40}),P_('x1d','Opportunist',{dmgPct:8,crit:5}),P_('x1e','Lethality',{critDmg:30,execute:25}),C_('x1f','Death Dealer',{execute:40,crit:10},'deathmark')]},
    {name:'Trickster',color:'#b87be8',nodes:[P_('x2a','Nimble',{spdPct:8,dodge:4}),A_('smoke'),P_('x2c','Slippery',{rollCd:25}),P_('x2d','Evasive',{dodge:5,rollCd:15}),P_('x2e','Fleetfoot',{spdPct:10,dodge:4}),C_('x2f','Shadow Dancer',{rollCd:25,dodge:15},'vanish')]},
    {name:'Poisoner',color:'#8ae04a',nodes:[P_('x3a','Toxins',{dmgPct:6}),A_('venom'),P_('x3c','Virulence',{poisonX:50}),P_('x3d','Noxious',{poisonX:40,dmgPct:4}),P_('x3e','Epidemic',{poisonX:60,lifesteal:3}),C_('x3f','Venomous',{poisonX:100,lifesteal:5},'plague')]}
  ]
};
const LASTNODE=5;
const NODEBYID={};
for(const hid in TREES)TREES[hid].forEach((br,bi)=>br.nodes.forEach((n,ni)=>{n.hero=hid;n.b=bi;n.n=ni;n.cost=n.cost||1;NODEBYID[n.id]=n}));

const MODLABEL={
  hpPct:v=>`+${v}% Health`,armor:v=>`+${v} Armor`,potPct:v=>`+${v}% potion healing`,reducePct:v=>`-${v}% damage taken`,thorns:v=>`Reflect ${v}% of damage taken`,
  dmgPct:v=>`+${v}% Damage`,lifesteal:v=>`${v}% Lifesteal`,crit:v=>`+${v}% Crit chance`,critDmg:v=>`+${v}% Crit damage`,execute:v=>`+${v}% damage to enemies below 30% health`,
  killHeal:v=>`Heal ${v}% health on kill`,heavyPct:v=>`+${v}% finisher damage`,regenHp:v=>`Regenerate ${v} HP/s`,finisherRing:v=>`Finisher releases a ring (${Math.round(v*100)}% damage)`,
  spdPct:v=>`+${v}% Move speed`,cdr:v=>`-${v}% skill cooldowns`,trapPct:v=>`+${v}% trap damage`,atkSpdPct:v=>`+${v}% Attack speed`,regenPct:v=>`+${v}% resource regen`,
  skillDmg:v=>`+${v}% skill damage`,pierce:()=>'Basic shots pierce enemies',burn:()=>'Fire skills burn enemies',freeze:()=>'Cold skills stun briefly',
  xpPct:v=>`+${v}% experience`,
  dodge:v=>`${v}% chance to dodge hits`,rollCd:v=>`-${v}% roll cooldown`,poisonX:v=>`+${v}% poison damage`
};
function describeNode(n){
  if(n.type==='skill')return SKILLS[n.skill].desc+`  (cost ${SKILLS[n.skill].cost}, cooldown ${SKILLS[n.skill].cd}s)`;
  const m=Object.keys(n.mods).map(k=>MODLABEL[k](n.mods[k])).join('. ');
  return n.ult?`${m}. Unlocks the ultimate ${SKILLS[n.ult].name}: ${SKILLS[n.ult].desc}`:m;
}
