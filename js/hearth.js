'use strict';
// ================= Hearthmoor life: spices and cooking, the Trading Road, the Hearth Fair, Maren's house =================
// Spices: one grows in eight regions. Dolly cooks them into six dishes; every dish eaten once is a permanent Heart (flags.fruits + 1).
// Trading Road (like the trading sequence in Link's Awakening): a prize from the Acorn Catch is traded from villager to villager,
// each swap giving something better, until the Golden Acorn brings the fair's lost grand prize home (a Heart Fruit).
// State (all in flags, so it saves with the slot): spice{id}, meals{id}, tr (0 nothing, 1..7 = item held, 8 = done), trStarted, fairBest, fairMet.

// ---------------- spices ----------------
const SPICE={
  glade:{id:'emberpepper',n:'Emberpepper',c:'#e0502a',d:'A red pod that glows like a coal.',hint:'in Ember Glade'},
  amber:{id:'amberclove',n:'Amberclove',c:'#d89a20',d:'Sticky, sweet buds from the old trees of Amber Hollow.',hint:'in Amber Hollow'},
  marsh:{id:'mistmint',n:'Mistmint',c:'#5acaa0',d:'Cool leaves that grow where the mist never lifts.',hint:'in Mistwater Marsh'},
  grove:{id:'ghostcinnamon',n:'Ghostbark Cinnamon',c:'#b8a8e0',d:'Pale bark curls that smell of rain and old fires.',hint:'in Ghostbark Grove'},
  saffron:{id:'saffron',n:'Meadow Saffron',c:'#f0c030',d:'Three golden threads in a purple flower.',hint:'in Saffron Meadows'},
  tangle:{id:'vanilla',n:'Wild Vanilla',c:'#e8d8a0',d:'A dark pod from the creepers of the deep jungle.',hint:'in Tanglewood Depths'},
  delta:{id:'cardamom',n:'Delta Cardamom',c:'#8ac060',d:'Green pods, heavy with scent, from the river delta.',hint:'in the Spice Delta'},
  ridge:{id:'frostanise',n:'Frostanise',c:'#a0d8ff',d:'A star-shaped seed that stays cold in your hand.',hint:'on Hoarfrost Ridge'}
};
const SPICEBY={};for(const z in SPICE)SPICEBY[SPICE[z].id]=Object.assign({zone:z},SPICE[z]);
const spiceHave=id=>!!(flags&&flags.spice&&flags.spice[id]);
const spiceCount=()=>Object.keys(SPICEBY).filter(spiceHave).length;

const MEALS=[
  {id:'ember_stew',n:'Ember Stew',a:'emberpepper',b:'amberclove',say:['Dolly: Pepper to wake the blood, clove to hold it steady. Sit. Eat.','The stew is hot enough to make your ears ring, and then it is simply warm all the way down.']},
  {id:'mist_dumplings',n:'Mist Dumplings',a:'mistmint',b:'amberclove',say:['Dolly: Mint cools what the clove warms. My grandmother made these when the fever came.','Soft, fragrant, a little sweet. Your whole chest feels roomier afterwards.']},
  {id:'saffron_rice',n:'Saffron Rice',a:'saffron',b:'emberpepper',say:['Dolly: Gold on red. A dish for a hero, or at least for someone who walks as far as you do.','Every grain tastes of sunshine and smoke.']},
  {id:'ghost_buns',n:'Ghostbark Buns',a:'ghostcinnamon',b:'mistmint',say:['Dolly: Cinnamon from the grove, mint from the marsh. Odd friends, but they bake well together.','The buns are pale, airy and gone in three bites. You feel lighter and somehow sturdier.']},
  {id:'jungle_custard',n:'Jungle Custard',a:'vanilla',b:'cardamom',say:['Dolly: Vanilla and cardamom! I have not smelled that since I was a girl on the delta road.','Silky, rich, heavy with scent. Your heart beats a little stronger.']},
  {id:'frost_pudding',n:'Frost Pudding',a:'frostanise',b:'ghostcinnamon',say:['Dolly: Cold seed, warm bark. Do not let it fool you, it bites back.','It is cold on the tongue and warm in the belly, and the warmth stays.']}
];
const mealDone=m=>!!(flags&&flags.meals&&flags.meals[m.id]);
const mealCount=()=>MEALS.filter(mealDone).length;
const mealReady=m=>!mealDone(m)&&spiceHave(m.a)&&spiceHave(m.b);

function cookIntro(){
  if(flags.cookIntro)return[];
  flags.cookIntro=true;
  return['Dolly: One more thing. The forest still grows spices, if you know where to look. Bring me two that go together and I will cook you something that stays with you. Every new dish makes your heart a little bigger.'];
}
function cookMenu(){
  const nm=id=>SPICEBY[id].n;
  const opts=MEALS.map(m=>({
    t:()=>mealDone(m)?`${m.n}: eaten`:mealReady(m)?`${m.n}: ${nm(m.a)} + ${nm(m.b)}   (cook it!)`:`${m.n}: needs ${nm(m.a)} + ${nm(m.b)}`,
    fn(){cookMeal(m);return true}}));
  opts.push({t:'Leave',fn(){}});
  const foot=()=>{
    const m=MEALS[ui&&ui.sel];
    if(!m)return`Spices ${spiceCount()}/${Object.keys(SPICEBY).length}   Dishes ${mealCount()}/${MEALS.length}`;
    if(mealDone(m))return'You ate this one. It lives in your heart now.';
    const miss=[m.a,m.b].filter(id=>!spiceHave(id)).map(id=>`${nm(id)} grows ${SPICEBY[id].hint}`);
    return miss.length?miss.join('. ')+'.':'You have everything. Press Enter to cook.';
  };
  return menu("Dolly's Kitchen",opts,true,foot);
}
function cookMeal(m){
  if(mealDone(m)){toast('You already ate this dish. Try another recipe.','#ffd080');return}
  if(!mealReady(m)){toast('You are missing a spice for that.','#ff8070');return}
  flags.meals=flags.meals||{};flags.meals[m.id]=true;
  flags.fruits=(flags.fruits||0)+1;recalc();P.hp=P.maxHp;
  save();Snd.level();
  say('Dolly',m.say,()=>{
    toast(`${m.n}: your heart grows! (${mealCount()}/${MEALS.length} dishes)`,'#ffb070');
    puff(P.x,P.y-8,16,'#ffb070',70);
    ui=cookMenu();
  });
}
// a spice plant out in the forest
function pickSpice(o){
  const s=SPICEBY[o.id];if(!s||spiceHave(s.id))return;
  flags.spice=flags.spice||{};flags.spice[s.id]=true;
  M.props=M.props.filter(p=>p!==o);
  M.t[o.ty*M.w+o.tx]=M.dark?T.DFLOOR:T.GRASS;buildLayer();
  puff((o.tx+.5)*TS,(o.ty+.5)*TS-4,14,s.c,70);Snd.pickup();
  const first=spiceCount()===1;
  say(`You found ${s.n}!`,first?[s.d,'It smells wonderful. Dolly, who runs the Hearth in Hearthmoor, would know what to cook with it.']:[s.d,`Spices ${spiceCount()}/${Object.keys(SPICEBY).length}. Dolly might have a dish for it.`],()=>save());
}

// ---------------- the Trading Road ----------------
const TRITEM=[null,'Straw Doll','Red Thread','Horseshoe Charm','Moonpetal','Wooden Songbird','Brass Key','Golden Acorn'];
// step k: who takes the item you hold (item k) and what they give back (item k+1)
const TRSTEP=[null,
  {who:'stash',pages:['Bruna: A straw doll! My niece lost hers at the fair and has been grumpy ever since. Will you part with it?','She clutches the doll to her chest as if it were made of gold.','Bruna: Take this in thanks. I dyed the thread myself. It is the finest red in Hearthmoor.']},
  {who:'smith',pages:['Torvald: Red thread, and strong. The strap of my apron tore last week and I have been tying it with a bootlace like a fool.','He stitches it up in a few quick pulls.','Torvald: Here. A charm I made from the first horseshoe I ever forged. Keeps luck in the metal.']},
  {who:'alch',pages:['Pip: An iron charm! Stirring a cauldron with it keeps the potion from tasting of rust. Wonderful!','Pip: Take this in return. A moonpetal. It blooms once a year, for one night, and I kept it dried for something special.']},
  {who:'lia',pages:['Lia: A moonpetal! I have been looking for one to press into my songbook. Grandmother\'s lullaby needs a flower like this.','She presses it between two pages and smiles at you for a heartbeat longer than necessary.','Lia: I carved this while the well was not talking to me. It is a songbird. Maybe it will sing for someone.']},
  null,   // step 5 is the clock in Maren's house (HOUSE_USE.clock)
  {who:'tavern',pages:['Dolly: That key! It belonged to my husband\'s old chest. I have been hunting it for a decade.','The chest creaks open. Dust, ribbons, and at the bottom, wrapped in cloth, a little golden nut.','Dolly: A golden acorn. That was the grand prize of the Hearth Fair before it vanished. Take it to Tilly, she has been crying about it for years.']}
];
function tradeHold(){return(flags&&flags.tr>=1&&flags.tr<=7)?TRITEM[flags.tr]:null}
function tradeGive(k,toast_){
  flags.tr=k;save();Snd.level();
  toast(toast_||`You got the ${TRITEM[k]}!`,'#ffe9a0');
}
// returns true when the villager takes part in the trade (otherwise normal conversation continues)
function tradeTalk(n){
  if(n.id==='fair'){fairTalk(n);return true}
  const k=flags.tr||0,st=TRSTEP[k];
  if(!st||st.who!==n.id)return false;
  if(n.id==='lia'){addBond(1)}
  say(n.name,st.pages,()=>tradeGive(k+1,`You got the ${TRITEM[k+1]}! (traded away: ${TRITEM[k]})`));
  return true;
}
function hearthHints(){
  const L=[];
  if(MEALS.some(mealReady))L.push('Dolly can cook a new dish with your spices.');
  return L;
}

// ---------------- the Hearth Fair: Tilly's Acorn Catch ----------------
const FAIR_FEE=10,FAIR_WIN=8,FAIR_TIME=30;
function fairTalk(n){
  flags.fairMet=true;
  if(flags.tr===7){
    say(n.name,['Tilly: Is that...? The golden acorn! It is real! All these years I told people it was only lost, not stolen.','She holds it up and the whole stall seems to glow.','Tilly: The fair promised a Heart Fruit to whoever brought it home. I kept it for you. Here. And a little gold for the road.'],()=>{
      flags.tr=8;flags.fruits=(flags.fruits||0)+1;recalc();P.hp=P.maxHp;P.gold+=100;save();Snd.level();
      toast('The Hearth Fair gives you a Heart Fruit! Your heart grows. (+100 gold)','#a0ff80');puff(P.x,P.y-8,20,'#a0ff80',80);
    });
    return;
  }
  const lines=[];
  if(!flags.fairIntro){flags.fairIntro=true;lines.push('Tilly: Step right up! The Hearth Fair has been quiet since the forest sickened, but I keep the stall anyway.')}
  if(flags.tr===8)lines.push('Tilly: Champion of the Hearth Fair! Play as much as you like. The acorns never get tired.');
  else if(flags.trStarted)lines.push('Tilly: Back for another round? Keep an eye on the burrs.');
  else lines.push(`Tilly: Catch my falling acorns in the basket! Golden ones count triple, burrs bite back. Score ${FAIR_WIN} and you win a prize. ${FAIR_FEE} gold a go.`);
  say(n.name,lines,()=>{ui=fairMenu()});
}
function fairMenu(){
  return menu("Tilly's Acorn Catch",[
    {t:()=>`Play (${FAIR_FEE}g)   best: ${flags.fairBest||0}`,fn(){startFair()}},
    {t:'Leave',fn(){}}],true,goldLine);
}
function startFair(){
  if(P.gold<FAIR_FEE){toast('Not enough gold','#ff8070');ui=fairMenu();return}
  P.gold-=FAIR_FEE;Snd.coin();
  ui={mode:'fair',st:'ready',t:1.4,left:FAIR_TIME,score:0,bx:W/2,items:[],sp:.4,flash:0,catches:0,golden:0};
}
let FPTR=null;
(function(){
  const c=document.getElementById('c');
  const at=e=>{const r=c.getBoundingClientRect();FPTR={x:(e.clientX-r.left)/r.width*W,t:performance.now()}};
  c.addEventListener('pointermove',at);c.addEventListener('pointerdown',at);
})();
const FAIRX0=56,FAIRX1=W-56,FAIRY=H-50;
function updateFair(dt){
  const s=ui;
  if(Input.hit('back')||Input.hit('pause')){ui=fairMenu();return}   // giving up keeps the fee, like at any fair
  if(s.flash>0)s.flash-=dt;
  if(s.st==='ready'){s.t-=dt;if(s.t<=0)s.st='play';return}
  if(s.st==='done'){if(Input.confirm())finishFair(s);return}
  // play
  const ax=Input.axis().x;
  if(Math.abs(ax)>.1)s.bx+=ax*230*dt;
  else if(FPTR&&performance.now()-FPTR.t<1500)s.bx+=clamp(FPTR.x-s.bx,-420*dt,420*dt);
  s.bx=clamp(s.bx,FAIRX0+18,FAIRX1-18);
  s.left-=dt;
  s.sp-=dt;
  if(s.sp<=0){
    const prog=1-s.left/FAIR_TIME;
    s.sp=.62-.26*prog;
    const r=Math.random();
    s.items.push({x:rand(FAIRX0+10,FAIRX1-10),y:36,v:rand(64,92)+prog*50,k:r<.12?'gold':r<.34?'burr':'acorn',rot:rand(0,6)});
  }
  for(const it of s.items){
    it.y+=it.v*dt;it.rot+=dt*3;
    if(!it.hit&&it.y>FAIRY-6&&it.y<FAIRY+8&&Math.abs(it.x-s.bx)<22){
      it.hit=true;
      if(it.k==='burr'){s.score=Math.max(0,s.score-2);s.flash=.25;Snd.hurt()}
      else{s.score+=it.k==='gold'?3:1;s.catches++;if(it.k==='gold')s.golden++;Snd.pickup()}
    }
  }
  s.items=s.items.filter(it=>!it.hit&&it.y<H-18);
  if(s.left<=0){s.st='done';s.left=0;Snd.level()}
}
function finishFair(s){
  flags.fairBest=Math.max(flags.fairBest||0,s.score);
  const gold=Math.max(0,s.score-6)*3;
  P.gold+=gold;ui=null;
  const win=!flags.trStarted&&s.score>=FAIR_WIN;
  if(win){
    flags.trStarted=true;flags.tr=1;save();
    say('Tilly',[`Tilly: ${s.score} points! You have a basket-hand like nobody I have seen. Here is your prize.`,'She hands you a little straw doll with button eyes.','Tilly: She is a bit lonely. I bet someone in Hearthmoor would love her.'],()=>toast('You got the Straw Doll! The Trading Road begins.','#ffe9a0'));
  }else{
    save();
    say('Tilly',[gold>0?`Tilly: ${s.score} points, and ${gold} gold from the till. Not bad!`:s.score>=FAIR_WIN?`Tilly: ${s.score} points. Good basket-work!`:`Tilly: ${s.score} points. ${FAIR_WIN} wins a prize, so close! Try again.`],()=>{ui=fairMenu()});
  }
}
function drawFair(){
  const s=ui,x0=FAIRX0,x1=FAIRX1;
  cx.fillStyle='rgba(8,4,2,.9)';cx.fillRect(0,0,W,H);
  panel(x0-14,8,x1-x0+28,H-16);
  const g=cx.createLinearGradient(0,22,0,H-24);g.addColorStop(0,'#3a2412');g.addColorStop(1,'#14100a');
  cx.fillStyle=g;cx.fillRect(x0-6,22,x1-x0+12,H-46);
  // bunting
  for(let i=0;i<14;i++){cx.fillStyle=['#c03030','#e0a030','#3a8a4a','#4a6ab0'][i%4];cx.fillRect(x0-6+i*((x1-x0+12)/14),22,((x1-x0+12)/14)-3,6)}
  text('ACORN CATCH',W/2,11,'#ffd040',9,'center',true);
  text(`Score ${s.score}`,x0-6,H-34,'#ffe9a0',8,'left',true);
  text(`Time ${Math.ceil(s.left)}`,x1+6,H-34,'#ffe9a0',8,'right',true);
  // falling things
  for(const it of s.items){
    const x=Math.round(it.x),y=Math.round(it.y);
    if(it.k==='burr'){cx.fillStyle='#5a2a1a';cx.fillRect(x-4,y-4,8,8);cx.fillStyle='#c04a2a';for(let a=0;a<4;a++){const q=a*Math.PI/2+it.rot;cx.fillRect(Math.round(x+Math.cos(q)*5)-1,Math.round(y+Math.sin(q)*5)-1,2,2)}cx.fillStyle='#3a1a0e';cx.fillRect(x-2,y-2,4,4)}
    else{const c=it.k==='gold'?['#ffd040','#fff0a0','#a07818']:['#a8743a','#d8a060','#5a3a1c'];
      cx.fillStyle=c[2];cx.fillRect(x-3,y-4,6,2);cx.fillStyle=c[0];cx.fillRect(x-3,y-2,6,6);cx.fillStyle=c[1];cx.fillRect(x-2,y-1,2,3);
      if(it.k==='gold'){cx.globalAlpha=.4+.3*Math.sin(time*10+it.x);cx.fillStyle='#fff0a0';cx.fillRect(x-6,y-1,12,1);cx.fillRect(x,y-6,1,12);cx.globalAlpha=1}}
  }
  // the basket
  const bx=Math.round(s.bx),by=FAIRY;
  cx.fillStyle=s.flash>0?'#c04a2a':'#8a5a2a';cx.fillRect(bx-17,by,34,10);cx.fillStyle=s.flash>0?'#e07050':'#b8843e';cx.fillRect(bx-15,by+1,30,2);
  cx.fillStyle='#4a2c14';for(let i=-14;i<15;i+=5)cx.fillRect(bx+i,by+3,1,7);cx.fillRect(bx-17,by+7,34,1);
  cx.fillStyle='#6a4424';cx.fillRect(bx-18,by-2,2,5);cx.fillRect(bx+16,by-2,2,5);
  if(s.st==='ready'){text(s.t>.5?'Get ready...':'Go!',W/2,H/2-14,'#ffe9a0',16,'center',true);text('Left / Right or drag to move the basket',W/2,H/2+10,'#c8b890',7,'center')}
  if(s.st==='done'){
    panel(W/2-110,H/2-44,220,84);
    text('Time!',W/2,H/2-36,'#ffd040',12,'center',true);
    text(`${s.score} points`,W/2,H/2-16,'#fff',10,'center',true);
    text(s.score>=FAIR_WIN?'A prize-winning basket!':`${FAIR_WIN} points win a prize`,W/2,H/2,'#a8e0a0',7,'center');
    text('Enter: continue',W/2,H/2+18,'#ffd040',7,'center',true);
    reg(0,0,W,H,()=>tapKey('interact'));
  }else{
    text('Backspace: leave',x1+6,12,'#a89878',6,'right');
    if(touchActive())touchBtn(W-28,3,24,16,'X',()=>tapKey('back'));
  }
}

// ---------------- Maren's house and the village extras ----------------
Object.assign(HOUSE_USE,{
  spice(o){pickSpice(o)},
  clock(){
    const k=flags.tr||0;
    if(k===5){
      say('Maren\'s clock',['The old cuckoo clock has stood still for years. A tiny door at the top is missing its bird.','You set the wooden songbird in its place. The clock shudders, ticks, and sings the hour in a thin sweet voice.','Behind the little door, something glints: a small brass key.'],()=>tradeGive(6,'You got the Brass Key! (traded away: Wooden Songbird)'));
    }else if(k>5||flags.tr===8)say('Maren\'s clock',['The cuckoo clock ticks along happily. The wooden songbird sings the hour.']);
    else say('Maren\'s clock',['An old cuckoo clock. It has stopped, and a tiny door at the top is missing its bird.']);
  },
  letters(){
    const got=Object.keys(flags.letters||{}).map(Number).filter(i=>LETTERS[i]).sort((a,b)=>a-b);
    if(!got.length){say('Maren\'s desk',['Neat stacks of paper, a sealed inkwell, a pen worn short. Nothing is written yet.']);return}
    const open=()=>menu('Maren\'s desk: drafts of her letters',got.map(i=>({t:`Letter ${i+1}`,fn(){ui=null;say('A letter from Elder Maren',LETTERS[i].pages,()=>{ui=open()})}})).concat([{t:'Leave',fn(){}}]),true,goldLine);
    say('Maren\'s desk',['Drafts of every letter she has written to you, in neat rows. Which one do you want to read?'],()=>{ui=open()});
  },
  hatch(){
    if(flags.boss16)say('Cellar hatch',['The iron lock hangs broken. Below, rows of empty barrels, dry and dusty. Whatever was here is gone.']);
    else say('Cellar hatch',['A heavy trapdoor with an iron lock. Faint amber light seeps between the boards, and a sweet, syrupy smell rises through the cracks.','Preserves, probably. Maren is very proud of her cellar.']);
  }
});

// extra props: the spice plants out in the forest, the fair stall, Maren's furniture
function drawHearthProp(p){
  const x=p.tx*TS,y=p.ty*TS,t=time;
  const R=(c,a,b,w,h)=>{cx.fillStyle=c;cx.fillRect(x+a,y+b,w,h)};
  switch(p.k){
    case'spice':{
      const s=SPICEBY[p.id];if(!s||spiceHave(s.id))return true;
      const pu=.5+.5*Math.sin(t*3+p.tx);
      glow(x+8,y+7,16+4*pu,hexRgb(s.c),.3+.18*pu);
      shadow(x+8,y+14,5);R('#2a5a22',7,7,2,7);R('#3a8a30',3,8,5,2);R('#3a8a30',9,6,5,2);R('#4aaa3a',4,7,2,1);
      R(shade(s.c,-.4),5,2,6,6);R(s.c,6,2,4,5);R('#ffffff',7,3,1,1);
      if(Math.random()<.06)puff(x+8+rand(-6,6),y+rand(0,8),1,s.c,18);
      return true}
    case'fairbooth':{
      const w=(p.w||2)*TS;shadow(x+w/2,y+15,w/2);
      R('#2a1808',0,6,w,10);R('#7a4c26',1,7,w-2,8);R('#a8743a',1,6,w-2,2);   // counter
      for(let i=0;i<w;i+=4){R(i%8?'#f0e6d0':'#c03030',i,-8,4,8);R(i%8?'#d8cdb4':'#a02424',i,0,4,2)}   // striped awning
      R('#3a2410',0,-9,w,1);R('#3a2410',0,-8,1,15);R('#3a2410',w-1,-8,1,15);
      R('#a8743a',4,3,3,4);R('#d8a060',4,3,3,1);R('#ffd040',w-9,3,3,4);R('#fff0a0',w-9,3,3,1);   // an acorn and a golden one on display
      return true}
    case'clock':{
      R('#2a1808',2,-14,12,30);R('#6a4424',3,-13,10,28);R('#8a5a2a',3,-13,10,3);R('#4a2c14',3,-2,10,1);
      R('#e8e0c8',5,-9,6,6);R('#2a1808',5,-9,6,1);R('#2a1808',5,-4,6,1);R('#2a1808',7,-8,1,3);R('#2a1808',7,-6,3,1);   // face
      const ticking=(flags.tr||0)>=6||flags.tr===8,sw=ticking?Math.sin(t*3)*2:0;
      R('#2a1808',7+sw,1,2,8);R('#d8b040',6+sw,9,4,4);
      if(ticking){R('#c8a050',6,-13,4,2);if(Math.floor(t*.5)%2)R('#e08a3a',7,-12,2,2)}
      else R('#14100a',6,-13,4,2);
      return true}
    case'desk':{
      const w=(p.w||2)*TS;shadow(x+w/2,y+15,w/2);
      R('#2a1808',0,5,w,11);R('#7a4c26',0,6,w,9);R('#a8743a',0,4,w,3);R('#c89458',0,4,w,1);
      R('#e8e0c8',3,1,8,5);R('#c8c0a8',4,2,6,1);R('#4a6ab0',w-9,2,2,3);R('#e8e0c8',w-8,0,1,3);R('#6a4424',w-12,5,3,2);
      return true}
    case'hatch':{
      const lit=!flags.boss16,pu=.5+.5*Math.sin(t*2);
      R('#2a1808',0,2,16,12);R('#5a3a1c',1,3,14,10);R('#3a2410',1,7,14,1);R('#7a5230',1,3,14,1);
      R('#6a665e',0,4,16,1);R('#6a665e',0,11,16,1);R('#c8c8d0',6,6,4,4);R('#2a2620',7,7,2,2);
      if(lit){cx.globalAlpha=.25+.2*pu;R('#ffb040',2,8,12,1);cx.globalAlpha=1;glow(x+8,y+8,22,'255,170,60',.18+.1*pu)}
      return true}
  }
  return false;
}
