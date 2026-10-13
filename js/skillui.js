'use strict';
// ================= Skills screen: Skills (ranks, runes, slots) | Talents (three specialization trees) =================
const SLOTKEYS=['K','L',';'];
function openTree(tab){ui={mode:'tree',tab:tab||0,si:0,b:0,n:0}}
function knownSkills(){
  const ids=P.hero.skills.map(k=>k.id);
  for(const id in P.learned){const n=NODEBYID[id];if(n&&n.type==='skill')ids.push(n.skill)}
  for(const id in P.learned){const n=NODEBYID[id];if(n&&n.type==='cap'&&n.ult)ids.push(n.ult)}
  return ids;
}
function learnReason(n){
  if(P.learned[n.id])return'Already learned';
  const br=TREES[n.hero][n.b];
  if(n.n>0&&!P.learned[br.nodes[n.n-1].id])return'Learn the previous talent first';
  if(n.type==='cap'&&TREES[n.hero].some((b,bi)=>bi!==n.b&&P.learned[b.nodes[LASTNODE].id]))return'Only one specialization allowed';
  if(P.sp<n.cost)return`Needs ${n.cost} skill point${n.cost>1?'s':''}`;
  return'';
}
function learnNode(n){
  const r=learnReason(n);
  if(r){toast(r,'#ff8070');return}
  P.sp-=n.cost;P.learned[n.id]=true;recalc();Snd.level();puff(P.x,P.y,12,'#8fd0ff',70);
  const sk=n.type==='skill'?n.skill:n.ult;
  if(sk){
    const i=P.bound.indexOf(null);
    if(i>=0&&!P.bound.includes(sk)){P.bound[i]=sk;toast(`${SKILLS[sk].name} learned and bound to ${SLOTKEYS[i]}`,'#8fd0ff')}
    else toast(`${SKILLS[sk].name} learned`,'#8fd0ff');
  }
}
function bindSkill(id,slot){
  if(!SKILLS[id])return;
  const cur=P.bound.indexOf(id);
  if(cur>=0&&cur!==slot)P.bound[cur]=P.bound[slot];
  P.bound[slot]=id;P.cd[slot]=0;Snd.pickup();
  toast(`${SKILLS[id].name} bound to ${SLOTKEYS[slot]}`,'#8fd0ff');
}
function respec(){
  const cost=40*P.lvl;
  if(P.gold<cost){toast(`Respec costs ${cost} gold`,'#ff8070');return}
  let back=0;for(const id in P.learned)back+=NODEBYID[id].cost;
  for(const id in P.ranks)back+=Math.max(0,P.ranks[id]-1);
  if(!back){toast('Nothing to reset','#ff8070');return}
  P.gold-=cost;P.sp+=back;P.learned={};P.ranks={};P.runes={};P.bound=P.hero.skills.map(k=>k.id).concat([null]);P.cd=[0,0,0];recalc();Snd.coin();toast('Skills and talents reset');
}
function rankUp(id){
  const r=rankOf(id);
  if(SKILLS[id].ult){toast('Ultimates cannot be ranked up','#ff8070');return}
  if(r>=MAXRANK){toast('Already at the highest rank','#ff8070');return}
  if(P.sp<1){toast('Needs 1 skill point','#ff8070');return}
  const nr=r+1,saved=ui;
  if(nr===3||nr===5){
    const idx=nr===3?0:1,pair=RUNESET[id][idx];
    ui=menu(`Rank ${nr}: choose a rune for ${SKILLS[id].name}`,pair.map(k=>({t:`${RUNEDEF[k].n}:  ${RUNEDEF[k].d}`,fn(){
      P.sp--;P.ranks[id]=nr;P.runes[id]=P.runes[id]||[null,null];P.runes[id][idx]=k;Snd.level();toast(`${SKILLS[id].name} rank ${nr}: ${RUNEDEF[k].n}`,'#8fd0ff');ui=saved}})).concat([{t:'Cancel',fn(){ui=saved}}]),false);
    return;
  }
  P.sp--;P.ranks[id]=nr;Snd.level();puff(P.x,P.y,10,'#8fd0ff',60);toast(`${SKILLS[id].name} rank ${nr}`,'#8fd0ff');
}
function skillEffectLine(id){
  const r=rankOf(id);
  return`Rank ${r}: +${12*(r-1)}% damage, -${4*(r-1)}% cooldown`;
}

// ---------- update ----------
function updateTree(){
  const s=ui;
  if(Input.cancel()||Input.hit('tree')){ui=null;return}
  if(Input.hit('tabl')||Input.hit('tabr')){s.tab=1-s.tab;Snd.menu();return}
  if(s.tab===0){
    const ks=knownSkills();
    if(Input.hit('up')){s.si=(s.si+ks.length-1)%ks.length;Snd.menu()}
    if(Input.hit('down')){s.si=(s.si+1)%ks.length;Snd.menu()}
    s.si=Math.min(s.si,ks.length-1);
    const id=ks[s.si];
    if(Input.confirm())rankUp(id);
    for(let k=0;k<3;k++)if(Input.hit('n'+(k+1)))bindSkill(id,k);
  }else{
    const tr=TREES[P.hero.id];
    if(Input.hit('left')){s.b=(s.b+2)%3;Snd.menu()}
    if(Input.hit('right')){s.b=(s.b+1)%3;Snd.menu()}
    if(Input.hit('down')){s.n=Math.min(LASTNODE,s.n+1);Snd.menu()}
    if(Input.hit('up')){s.n=Math.max(0,s.n-1);Snd.menu()}
    const nd=tr[s.b].nodes[s.n];
    if(Input.confirm())learnNode(nd);
    const sk=nd.type==='skill'?nd.skill:nd.ult;
    if(sk&&P.learned[nd.id])for(let k=0;k<3;k++)if(Input.hit('n'+(k+1)))bindSkill(sk,k);
  }
}

// ---------- draw ----------
function tbtn(x,y,w,label,fn,on){
  cx.fillStyle=on?'#5a4220':'#3a2814';cx.fillRect(x,y,w,13);cx.strokeStyle='#8a6a3a';cx.strokeRect(x+.5,y+.5,w-1,12);text(label,x+w/2,y+3,'#ffe9a0',7,'center');reg(x,y,w,13,fn);
}
function drawTree(){
  const s=ui;
  cx.fillStyle='rgba(8,4,2,.9)';cx.fillRect(0,0,W,H);
  panel(4,4,W-8,H-8);
  ['Skills','Talents'].forEach((n,i)=>{
    const x=10+i*70,on=s.tab===i;
    cx.fillStyle=on?'#5a4220':'#241810';cx.fillRect(x,8,66,12);cx.strokeStyle=on?'#ffd040':'#5a4220';cx.strokeRect(x+.5,8.5,65,11);
    text(n,x+33,11,on?'#ffe9a0':'#a89878',7,'center',on);reg(x,8,66,12,()=>{s.tab=i;Snd.menu()});
  });
  text(`${P.hero.name} the ${P.hero.cls}`,160,10,P.hero.light,8,'left',true);
  text(`Skill points: ${P.sp}`,W-14,10,P.sp>0?'#8fd0ff':'#7a6a58',9,'right',true);
  if(s.tab===0)drawSkillsTab();else drawTalentsTab();
  tbtn(W-130,246,56,`Respec ${40*P.lvl}g`,respec);tbtn(W-70,246,56,'Close',()=>{ui=null});
}
function drawSkillsTab(){
  const s=ui,ks=knownSkills();
  text('Known skills',12,25,'#a89878',7);
  ks.forEach((id,i)=>{
    const sk=SKILLS[id],y=35+i*28,sel=s.si===i,r=rankOf(id),slot=P.bound.indexOf(id);
    cx.fillStyle=sel?'#4a3418':'#241810';cx.fillRect(10,y,230,25);cx.strokeStyle=sel?'#fff':'#5a4228';cx.strokeRect(10.5,y+.5,229,24);
    cx.fillStyle=P.hero.color;cx.fillRect(14,y+4,16,16);cx.fillStyle=P.hero.light;cx.fillRect(16,y+6,6,6);
    text(sk.name,36,y+2,sk.ult?'#ffb050':'#ffe9a0',8,'left',true);
    if(!sk.ult)for(let k=0;k<MAXRANK;k++){cx.fillStyle=k<r?'#8fd0ff':'#3a3a4a';cx.fillRect(36+k*8,y+13,6,6)}
    else text('ULTIMATE',36,y+14,'#ffb050',6);
    text(slot>=0?`[${SLOTKEYS[slot]}]`:'',232,y+3,'#8fd0ff',8,'right',true);
    text(`Cost ${sk.cost}  CD ${sk.cd}s`,232,y+15,'#a89878',6,'right');
    reg(10,y,230,25,()=>{s.si=i;if(s.si===i&&sel)rankUp(id)});
  });
  const id=ks[Math.min(s.si,ks.length-1)],sk=SKILLS[id],r=rankOf(id);
  panel(250,22,W-258,218);
  text(sk.name,258,28,sk.ult?'#ffb050':'#ffd040',9,'left',true);
  wrap(sk.desc,W-280,7).slice(0,4).forEach((l,i)=>text(l,258,40+i*9,'#f0e6d0',7));
  if(sk.ult){text('Unlocked by your specialization capstone.',258,86,'#a89878',6)}
  else{
    text(skillEffectLine(id),258,80,'#8fd0ff',7);
    const set=RUNESET[id],ru=P.runes[id]||[];
    text('Runes',258,96,'#a89878',7);
    for(let t=0;t<2;t++){
      const need=t?5:3,have=r>=need&&ru[t];
      text(`Rank ${need}:`,258,108+t*28,have?'#ffe9a0':'#6a5a48',7);
      if(have)text(`${RUNEDEF[ru[t]].n}: ${RUNEDEF[ru[t]].d}`,258,117+t*28,'#8ae08a',6);
      else text(`Choose between ${set[t].map(k=>RUNEDEF[k].n).join(' or ')}`,258,117+t*28,'#7a6a58',6);
    }
    tbtn(258,168,100,r>=MAXRANK?'Max rank':`Rank up (1 pt)`,()=>rankUp(id));
  }
  text('Bind to slot',258,190,'#a89878',7);
  for(let k=0;k<3;k++)tbtn(258+k*40,200,36,`${SLOTKEYS[k]}${P.bound[k]===id?' *':''}`,()=>bindSkill(id,k),P.bound[k]===id);
  text('Enter: rank up   1 2 3: bind to K L ;',258,222,'#7a6a58',6);
  text('Up/Down choose skill   Z/C switch tab   T/Backspace close',12,H-12,'#7a6a58',6);
}
function drawTalentsTab(){
  const s=ui,tr=TREES[P.hero.id];
  tr.forEach((br,bi)=>{
    const x=10+bi*157;
    text(br.name,x+72,24,br.color,9,'center',true);
    br.nodes.forEach((nd,ni)=>{
      const y=36+ni*24,learned=!!P.learned[nd.id],sel=s.b===bi&&s.n===ni,can=!learned&&!learnReason(nd);
      cx.fillStyle=learned?'#2e3a1c':sel?'#4a3418':'#241810';cx.fillRect(x,y,144,21);
      cx.strokeStyle=sel?'#fff':learned?br.color:can?'#a8884a':'#4a3a28';cx.lineWidth=1;cx.strokeRect(x+.5,y+.5,143,20);
      if(ni>0){cx.fillStyle=P.learned[br.nodes[ni-1].id]?br.color:'#4a3a28';cx.fillRect(x+72,y-3,1,3)}
      const tag=nd.type==='skill'?'ACTIVE':nd.type==='cap'?'ULT':'';
      text(nd.name,x+5,y+2,learned?'#d8f0b0':can?'#ffe9a0':'#8a7a62',8,'left',true);
      text(learned?'LEARNED':`${tag?tag+'  ':''}${nd.cost} pt`,x+5,y+12,learned?br.color:'#a89878',6);
      reg(x,y,144,21,()=>{s.b=bi;s.n=ni;learnNode(nd)});
    });
  });
  const nd=tr[s.b].nodes[s.n];
  panel(8,186,W-16,56);
  text(nd.name,16,192,'#ffd040',9,'left',true);
  wrap(describeNode(nd),W-170,7).slice(0,4).forEach((l,i)=>text(l,16,204+i*9,'#f0e6d0',7));
  const r=P.learned[nd.id]?'':learnReason(nd);
  if(r)text(r,16,234,'#ff8070',6);
  tbtn(W-130,192,112,P.learned[nd.id]?'Learned':'Learn (Enter)',()=>learnNode(nd));
  const sk=nd.type==='skill'?nd.skill:nd.ult;
  if(sk&&P.learned[nd.id])for(let k=0;k<3;k++)tbtn(W-130+k*38,210,36,`Bind ${SLOTKEYS[k]}`,()=>bindSkill(sk,k),P.bound[k]===sk);
  text('Arrows move   Enter learn   Z/C switch tab   T/Backspace close',12,H-12,'#7a6a58',6);
}
