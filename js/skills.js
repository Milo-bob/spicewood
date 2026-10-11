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
  venom:{id:'venom',name:'Poison Blade',cost:25,cd:10,desc:'For 8s your hits poison enemies.'}
});

// ---------- Talent trees: 3 branches x 4 nodes. Learn in order; capstones cost 2 and only one branch can have one. ----------
const P_=(id,name,mods)=>({id,name,type:'passive',mods});
const A_=(skill)=>({id:skill,name:SKILLS[skill].name,type:'skill',skill});
const C_=(id,name,mods)=>({id,name,type:'cap',mods,cost:2});
const TREES={
  warrior:[
    {name:'Guardian',color:'#6a9ae0',nodes:[P_('w1a','Thick Skin',{hpPct:10}),A_('shieldbash'),P_('w1c','Iron Will',{armor:8,potPct:25}),C_('w1d','Bulwark',{reducePct:15,thorns:25})]},
    {name:'Berserker',color:'#e04a3a',nodes:[P_('w2a','Bloodlust',{dmgPct:8,lifesteal:3}),A_('bloodrage'),P_('w2c','Brutality',{crit:8,critDmg:30}),C_('w2d','Executioner',{execute:50,killHeal:8})]},
    {name:'Crusader',color:'#f0d060',nodes:[P_('w3a','Blessed Blade',{heavyPct:30}),A_('smite'),P_('w3c','Vigil',{regenHp:1.5,armor:4}),C_('w3d','Radiance',{finisherRing:.7})]}
  ],
  ranger:[
    {name:'Marksman',color:'#e8d060',nodes:[P_('r1a','Keen Eye',{crit:6,critDmg:20}),A_('sniper'),P_('r1c','Steady Aim',{dmgPct:10}),C_('r1d','Eagle Eye',{critDmg:60,pierce:1})]},
    {name:'Trapper',color:'#7fd06a',nodes:[P_('r2a','Light Foot',{armor:5,spdPct:6}),A_('trap'),P_('r2c','Quick Hands',{cdr:12}),C_('r2d','Master Trapper',{cdr:20,trapPct:100})]},
    {name:'Stormcaller',color:'#8ad0ff',nodes:[P_('r3a','Fletching',{atkSpdPct:10}),A_('rain'),P_('r3c','Wind Walker',{spdPct:8,regenPct:25}),C_('r3d','Tempest',{atkSpdPct:20,skillDmg:30})]}
  ],
  mage:[
    {name:'Pyromancer',color:'#ff8a2a',nodes:[P_('m1a','Ember Touch',{skillDmg:12}),A_('meteor'),P_('m1c','Fuel the Flame',{dmgPct:10}),C_('m1d','Inferno',{skillDmg:30,burn:1})]},
    {name:'Cryomancer',color:'#80d0ff',nodes:[P_('m2a','Chill',{armor:5,hpPct:6}),A_('frostbolt'),P_('m2c','Brittle',{crit:8,critDmg:30}),C_('m2d','Deep Freeze',{freeze:1,skillDmg:15})]},
    {name:'Arcanist',color:'#c080ff',nodes:[P_('m3a','Focus',{regenPct:30}),A_('blink'),P_('m3c','Quick Casting',{cdr:12}),C_('m3d','Arcane Mastery',{cdr:20,regenPct:50})]}
  ],
  rogue:[
    {name:'Assassin',color:'#e04a5a',nodes:[P_('x1a','Sharp Edge',{crit:8}),A_('execute'),P_('x1c','Deadly',{critDmg:40}),C_('x1d','Death Dealer',{execute:40,crit:10})]},
    {name:'Trickster',color:'#b87be8',nodes:[P_('x2a','Nimble',{spdPct:8,dodge:4}),A_('smoke'),P_('x2c','Slippery',{rollCd:25}),C_('x2d','Shadow Dancer',{rollCd:25,dodge:15})]},
    {name:'Poisoner',color:'#8ae04a',nodes:[P_('x3a','Toxins',{dmgPct:6}),A_('venom'),P_('x3c','Virulence',{poisonX:50}),C_('x3d','Venomous',{poisonX:100,lifesteal:5})]}
  ]
};
const NODEBYID={};
for(const hid in TREES)TREES[hid].forEach((br,bi)=>br.nodes.forEach((n,ni)=>{n.hero=hid;n.b=bi;n.n=ni;n.cost=n.cost||1;NODEBYID[n.id]=n}));

const MODLABEL={
  hpPct:v=>`+${v}% Health`,armor:v=>`+${v} Armor`,potPct:v=>`+${v}% potion healing`,reducePct:v=>`-${v}% damage taken`,thorns:v=>`Reflect ${v}% of damage taken`,
  dmgPct:v=>`+${v}% Damage`,lifesteal:v=>`${v}% Lifesteal`,crit:v=>`+${v}% Crit chance`,critDmg:v=>`+${v}% Crit damage`,execute:v=>`+${v}% damage to enemies below 30% health`,
  killHeal:v=>`Heal ${v}% health on kill`,heavyPct:v=>`+${v}% finisher damage`,regenHp:v=>`Regenerate ${v} HP/s`,finisherRing:v=>`Finisher releases a ring (${Math.round(v*100)}% damage)`,
  spdPct:v=>`+${v}% Move speed`,cdr:v=>`-${v}% skill cooldowns`,trapPct:v=>`+${v}% trap damage`,atkSpdPct:v=>`+${v}% Attack speed`,regenPct:v=>`+${v}% resource regen`,
  skillDmg:v=>`+${v}% skill damage`,pierce:()=>'Basic shots pierce enemies',burn:()=>'Fire skills burn enemies',freeze:()=>'Cold skills stun briefly',
  dodge:v=>`${v}% chance to dodge hits`,rollCd:v=>`-${v}% roll cooldown`,poisonX:v=>`+${v}% poison damage`
};
function describeNode(n){
  if(n.type==='skill')return SKILLS[n.skill].desc+`  (cost ${SKILLS[n.skill].cost}, cooldown ${SKILLS[n.skill].cd}s)`;
  return Object.keys(n.mods).map(k=>MODLABEL[k](n.mods[k])).join('. ');
}
