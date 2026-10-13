'use strict';
// ================= Cutscenes and the Lia story (Link's Awakening style) =================
// Short scripted scenes that play inside the real world: letterbox bars, camera pans, actors who walk and react, a few choices.
// The love story: Lia, Elder Maren's granddaughter. She hears the Heart (her mother sang to it and never came back), she tells Brann the truth Maren hides,
// and in the end her lullaby is what lets the Heart take Maren gently. Her choices never change the plot, only how close the two end up (flags.bond).
//
// Scene steps ({k:...}):  bars on | tint c a | fade to t | cam at:[x,y] t / cam follow | actor id name at pal | move id to t | emote id e t | say who text[] |
//                         choice q opts:[{t,bond,steps}] | wait t | shake | sfx n | toast s | flag set | bond n | hide id | pages pages title | run fn
const LIA_PAL={h:'#b8461e',c:'#4f8a5a',k:'#2e4a2e',g:'#f0d0b0'};
const MAREN_PAL={h:'#e8e8e8',c:'#6a5a8a',k:'#3a2a5a',g:'#d8b040'};
let SC=null;
const addBond=n=>{flags.bond=(flags.bond||0)+n};
const V=(tx,ty)=>[(WVS.x+tx+.5)*TS,(WVS.y+ty+.5)*TS];   // village tile -> world pixels
const REL=(dx,dy)=>[P.x+dx,P.y+dy];
const heroName=()=>P.hero.name;

function playScene(id,done,arg){
  const def=SCENES[id];if(!def)return;
  flags.sc=flags.sc||{};flags.sc[id]=true;
  P.att=null;P.moving=false;P.kx=P.ky=0;P.rollT=0;P.dashT=0;
  SC={id,steps:def(arg),i:0,cur:null,actors:{},emotes:[],bars:0,barsTo:0,fadeA:0,fadeTo:0,fadeDur:1,tint:null,camT:null,camSpd:3.2,done,ending:false,skippable:!!def.skippable,vis:null,grade:null,cap:null,flashA:0};
}
function sceneActor(a){return SC&&SC.actors[a]}
const actorPos=id=>id==='player'?P:SC.actors[id];

function stepRun(s,st){
  switch(st.k){
    case'bars':s.barsTo=st.on===false?0:1;return true;
    case'tint':s.tint=st.c?{c:st.c,a:st.a}:null;return true;
    case'fade':s.fadeTo=st.to;s.fadeDur=Math.max(.01,st.t||1);if(st.t===0)s.fadeA=st.to;s.cur={wait:st.t||0};return false;
    case'cam':
      if(st.follow)s.camT=null;else s.camT=st.at;
      s.camSpd=st.spd||3.2;
      if(st.async)return true;
      s.cur={wait:st.t===undefined?.9:st.t};return false;
    case'vision':if(st.on)visionOn(s,st);else visionOff(s);return true;
    case'lights':if(s.litWas===undefined){s.litWas=M.dark;M.dark=false}return true;
    case'grade':s.grade=st.mode||null;return true;
    case'flash':s.flashA=1;return true;
    case'cap':s.cap={text:st.text,t:0,dur:st.t||3,small:!!st.small};s.cur={wait:st.t||3};return false;
    case'actor':s.actors[st.id]={id:st.id,name:st.name||'',x:st.at[0],y:st.at[1],pal:st.pal,anim:0,hidden:false,alpha:st.alpha};return true;
    case'hide':for(const id of[].concat(st.id))if(s.actors[id])s.actors[id].hidden=true;return true;
    case'prop':s.actors[st.id]={id:st.id,kind:st.kind,x:st.at[0],y:st.at[1],pal:LIA_PAL,anim:0,hidden:false,alpha:st.alpha===undefined?1:st.alpha};return true;
    case'alpha':{const a=s.actors[st.id];if(!a)return true;a.hidden=false;s.cur={t:0,dur:st.t||1,fade:{a,from:a.alpha===undefined?1:a.alpha,to:st.to}};return false}
    case'window':if(st.on)s.win={pic:st.pic,p:0,on:true};else if(s.win)s.win.on=false;return true;
    case'move':{
      const ids=[].concat(st.id),tos=Array.isArray(st.id)&&st.tos?st.tos:null,moves=[];let dur=st.t||0;
      ids.forEach((id,k)=>{
        const a=actorPos(id);if(!a)return;
        const to=tos?tos[k]:st.to,fx0=a.x,fy0=a.y,d=Math.hypot(to[0]-fx0,to[1]-fy0);
        moves.push({a,fx0,fy0,tx:to[0],ty:to[1],player:id==='player'});
        if(!st.t)dur=Math.max(dur,Math.max(.2,d/55));
        if(id==='player'&&d>.5)P.face={x:(to[0]-fx0)/d,y:(to[1]-fy0)/d};
      });
      if(!moves.length)return true;
      if(st.async){(s.bg=s.bg||[]).push({t:0,dur,moves});return true}   // keeps walking while the next steps run
      s.cur={t:0,dur,moves};
      return false}
    case'face':if(st.id==='player')P.face={x:st.dir[0],y:st.dir[1]};return true;
    case'emote':s.emotes.push({id:st.id,e:st.e,t:st.t||1.4});return true;
    case'say':s.cur={waiting:true};say(st.who==='@hero'?heroName():st.who,st.text,()=>{if(SC===s){s.cur=null;s.i++}});return false;
    case'pages':s.cur={waiting:true};showStory(st.pages,()=>{if(SC===s){s.cur=null;s.i++}},st.title);return false;
    case'choice':{
      s.cur={waiting:true};
      ui=menu(st.q||'',st.opts.map(o=>({t:o.t,fn(){
        if(o.bond)addBond(o.bond);
        if(o.steps)s.steps.splice(s.i+1,0,...o.steps);
        s.cur=null;s.i++}})),false);
      return false}
    case'wait':s.cur={wait:st.t};return false;
    case'shake':shake=Math.max(shake,st.n||5);return true;
    case'sfx':try{Snd[st.n]()}catch(e){}return true;
    case'toast':toast(st.s,st.c);return true;
    case'flag':Object.assign(flags,st.set);return true;
    case'bond':addBond(st.n);return true;
    case'run':st.fn();return true;
  }
  return true;
}
function restoreLights(s){if(s.litWas!==undefined){M.dark=s.litWas;s.litWas=undefined}}
function endSceneNow(s){visionOff(s);restoreLights(s);if(SC===s)SC=null;P.moving=false;placeLia();if(s.done)s.done()}
function updateScene(dt){
  const s=SC;
  if(s.skippable&&(Input.hit('back')||Input.hit('pause'))){endSceneNow(s);return}
  s.flashA=Math.max(0,s.flashA-dt/.8);if(s.cap)s.cap.t+=dt;
  if(s.win){s.win.p=clamp(s.win.p+(s.win.on?dt*2.4:-dt*3),0,1);if(!s.win.on&&s.win.p<=0)s.win=null}
  s.bars+=(s.barsTo-s.bars)*Math.min(1,dt*5);
  s.fadeA+=clamp(s.fadeTo-s.fadeA,-dt/s.fadeDur,dt/s.fadeDur);
  for(const e of s.emotes)e.t-=dt;
  s.emotes=s.emotes.filter(e=>e.t>0);
  // camera: free point or the hero
  let tx,ty;
  if(s.camT){tx=s.camT[0]-W/2;ty=s.camT[1]-H/2}else{tx=P.x-W/2;ty=P.y-H/2}
  tx=M.w*TS<=W?(M.w*TS-W)/2:clamp(tx,0,M.w*TS-W);ty=M.h*TS<=H?(M.h*TS-H)/2:clamp(ty,0,M.h*TS-H);
  cam.x+=(tx-cam.x)*Math.min(1,dt*s.camSpd);cam.y+=(ty-cam.y)*Math.min(1,dt*s.camSpd);
  updateAmbient(dt);
  if(s.bg){for(const b of s.bg){b.t+=dt;const p=Math.min(1,b.t/b.dur);for(const m of b.moves){m.a.x=m.fx0+(m.tx-m.fx0)*p;m.a.y=m.fy0+(m.ty-m.fy0)*p;m.a.anim+=dt*8}}s.bg=s.bg.filter(b=>b.t<b.dur)}
  // running step
  if(s.cur){
    const c=s.cur;
    if(c.moves){
      c.t+=dt;const p=Math.min(1,c.t/c.dur);
      for(const m of c.moves){
        m.a.x=m.fx0+(m.tx-m.fx0)*p;m.a.y=m.fy0+(m.ty-m.fy0)*p;
        if(m.player){P.moving=true;P.anim+=dt*9}else m.a.anim+=dt*8;
      }
      if(p>=1){for(const m of c.moves)if(m.player)P.moving=false;s.cur=null;s.i++}
    }else if(c.fade){
      c.t+=dt;const p=Math.min(1,c.t/c.dur);c.fade.a.alpha=c.fade.from+(c.fade.to-c.fade.from)*p;
      if(p>=1){if(c.fade.to<=0)c.fade.a.hidden=true;s.cur=null;s.i++}
    }else if(c.wait!==undefined){c.wait-=dt;if(c.wait<=0){s.cur=null;s.i++}}
    return;
  }
  // next steps (instant ones run in a row)
  let guard=0;
  while(!s.cur&&s.i<s.steps.length&&guard++<60){
    const st=s.steps[s.i];
    if(stepRun(s,st))s.i++;
    else break;
  }
  if(!s.cur&&s.i>=s.steps.length){
    s.barsTo=0;s.tint=null;s.grade=null;s.cap=null;s.fadeTo=0;
    if(s.bars<.04&&s.fadeA<.02){visionOff(s);restoreLights(s);SC=null;P.moving=false;placeLia();if(s.done)s.done();if(!s.skippable)save()}
  }
}

// ---------- drawing ----------
function drawSceneActor(a){
  if(a.hidden)return;
  if(a.kind){drawSceneProp(a);return}
  if(a.alpha!==undefined)cx.globalAlpha=Math.max(0,a.alpha);
  const spr=a.spr||(a.spr=Spr.npc(a.pal)),x=Math.round(a.x),y=Math.round(a.y),sh=spr.front.height;
  const hop=a.anim>0&&Math.floor(a.anim)%2?-1:0;
  shadow(x,y+3,6);cx.drawImage(spr.front,x-Math.floor(spr.front.width/2),y+1-sh+hop);
  Spr.legs(cx,x,y+hop,a.pal.k,a.anim>0?Math.floor(a.anim)%2:0);
  cx.globalAlpha=1;
}
function sceneActorsForDraw(list,vis){
  if(!SC)return;
  for(const id in SC.actors){const a=SC.actors[id];if(vis(a.x,a.y))list.push({y:a.y,f:()=>drawSceneActor(a)})}
}
function drawSceneOverlay(){
  const s=SC;if(!s)return;
  if(s.grade)drawVisionGrade(s.grade);
  if(s.tint){cx.fillStyle=`rgba(${s.tint.c},${s.tint.a})`;cx.fillRect(0,0,W,H)}
  // emotes
  for(const e of s.emotes){
    const a=actorPos(e.id);if(!a)continue;
    const x=Math.round(a.x-cam.x),y=Math.round(a.y-cam.y)-30+Math.round(Math.sin(time*6)*1.5);
    cx.fillStyle='#fff';cx.fillRect(x-8,y-8,16,14);cx.fillRect(x-2,y+6,4,3);cx.fillStyle='#1a110a';cx.fillRect(x-7,y-7,14,12);cx.fillRect(x-2,y+5,4,3);
    if(e.e==='heart')drawHeart(x-4,y-5,1,1);
    else text(e.e==='note'?'~':e.e,x,y-6,e.e==='!'?'#ffe040':'#fff',10,'center',true);
  }
  // letterbox
  const b=Math.round(s.bars*28);
  if(b>0){cx.fillStyle='#000';cx.fillRect(0,0,W,b);cx.fillRect(0,H-b,W,b)}
  if(s.fadeA>0){cx.fillStyle=`rgba(0,0,0,${s.fadeA})`;cx.fillRect(0,0,W,H)}
  if(s.flashA>0){cx.fillStyle=`rgba(255,250,235,${Math.min(1,s.flashA*1.3)})`;cx.fillRect(0,0,W,H)}
  if(s.win)drawSceneWindow(s.win);
  if(s.cap)drawSceneCaption(s.cap);
  if(s.skippable&&s.bars>.5){if(touchActive())touchBtn(W-66,H-26,58,16,'SKIP >>',()=>tapKey('back'));else text('Backspace: skip',W-8,H-10,'#8a7a62',6,'right')}
  if(!s.skippable)toasts.slice(-2).forEach((t,i)=>{cx.globalAlpha=clamp(t.t,0,1);text(t.s,W/2,b+8+i*10,t.c,8,'center');cx.globalAlpha=1});
}

// ---------- Lia in the world ----------
const liaSpot=()=>{
  if(flags.won&&M.after)return[(M.after.cx+3)*TS+8,(M.after.cy+3)*TS+8];
  const ch=typeof chapter==='function'?chapter():0;
  const t=[[21.5,14.6],[17.5,17.6],[8.5,20.4],[29.5,20.2],[21.5,14.6]][Math.min(ch,4)];
  return V(t[0],t[1]);
};
function placeLia(){
  if(!M||M.id!=='world'||!flags||!flags.sc||!flags.sc.meet)return;
  M.npcs=M.npcs.filter(n=>n.id!=='lia');
  const p=liaSpot();
  M.npcs.push({id:'lia',name:'Lia',x:p[0],y:p[1],pal:LIA_PAL});
  NP=M.npcs;
}
const LIA_TALK=[
  ['The well says rain is coming. It is usually wrong, but it is never boring.','Come back and tell me what is in the Hollow Oak. The Heart gets very quiet when I think about it.'],
  ['Grandmother says the south road is open. She was smiling too much.','Do you ever feel the trees listening? I do. Especially when she reads her letters aloud.'],
  ['You are back. I still hum the Matron\'s song. My mother hummed it, too.','The marsh people say the guardians cry at night. I believe them.'],
  ['I read her ledger last night. Edda Maren, the Tithe, one part in three. It is her handwriting. It is almost mine.','I am not going to cry. I am going to be useful.'],
  ['The seedling is already taller than my thumb. It hums when you say its name.','Come back in spring. Bring bread. Something grows in this soil, and it is not only the tree.']
];
function liaTalk(){
  const ch=flags.won?4:(typeof chapter==='function'?chapter():0);
  flags.lia=flags.lia||{};
  const first=!flags.lia[ch];flags.lia[ch]=true;if(first)addBond(1);
  say('Lia',LIA_TALK[ch],()=>{if(first)save()});
}
// the Heart-leaf charm is a key item shown in the inventory (see KEYITEMS)

// ---------- the scenes ----------
const SCENES={};
SCENES.meet=()=>{
  const lia=V(21.6,14.6),maren=V(34,10.8),hn=heroName();
  return[
    {k:'fade',to:1,t:0},{k:'bars'},{k:'tint',c:'255,150,60',a:.14},
    {k:'actor',id:'lia',name:'Lia',at:lia,pal:LIA_PAL},
    {k:'cam',at:V(21,15),t:.01},{k:'fade',to:0,t:1.8},
    {k:'emote',id:'lia',e:'note',t:2},{k:'wait',t:1.6},
    {k:'move',id:'player',to:V(21,16.3),t:2.2},
    {k:'emote',id:'lia',e:'!',t:1.1},{k:'wait',t:.7},
    {k:'say',who:'Lia',text:['Oh! I did not hear you. Sorry. I was humming to the well. It is the only one in Hearthmoor that listens.']},
    {k:'say',who:'Lia',text:['You must be the one Grandmother pulled out of the river. She tells that story to anyone who holds still.']},
    {k:'choice',q:'Brann',opts:[
      {t:'"It was a long time ago."',bond:1,steps:[{k:'say',who:'Lia',text:['Long enough to grow a plough. You still have the sword hand, though. I can tell.']}]},
      {t:'"She tells it wrong. I jumped."',bond:1,steps:[{k:'emote',id:'lia',e:'heart',t:1.2},{k:'say',who:'Lia',text:['Of course you did. Keep that one. I will not tell her.']}]},
      {t:'(Say nothing.)',steps:[{k:'say',who:'Lia',text:['A quiet one. Good. Hearthmoor talks enough for ten villages.']}]}
    ]},
    {k:'say',who:'Lia',text:['I am Lia. I look after the herbs and the well, and Grandmother when she lets me.']},
    {k:'say',who:'Lia',text:[hn+', the woods are wrong. Last night I heard the Heart. It sounds like somebody crying in the next room.','Nobody believes me. Grandmother says it is the wind.']},
    {k:'say',who:'Lia',text:['Here. A Heart-leaf, dried. It keeps bad dreams away. Mostly.']},
    {k:'flag',set:{charm:true}},{k:'sfx',n:'pickup'},{k:'toast',s:'Received the Heart-leaf Charm','c':'#ffe9a0'},{k:'wait',t:.9},
    {k:'cam',at:maren,t:1.4},
    {k:'actor',id:'maren',name:'Elder Maren',at:maren,pal:MAREN_PAL},{k:'emote',id:'maren',e:'!',t:1},{k:'wait',t:.6},
    {k:'say',who:'Elder Maren',text:['There you are, hero! Come in, come in. The road will not wait for dusk!']},
    {k:'cam',at:V(21,15),t:1.2},
    {k:'say',who:'Lia',text:['...She never waits.','Eat something first. She forgets that people have to.']},
    {k:'cam',follow:true,t:.6},{k:'hide',id:'maren'},{k:'bars',on:false}
  ];
};
SCENES.well=()=>{
  const lia=V(17.6,17.8);
  return[
    {k:'bars'},{k:'tint',c:'255,120,40',a:.12},
    {k:'actor',id:'lia',name:'Lia',at:lia,pal:LIA_PAL},
    {k:'cam',at:V(18,17),t:1.2},{k:'move',id:'player',to:V(19.4,17.6)},
    {k:'emote',id:'lia',e:'!',t:1},{k:'wait',t:.5},
    {k:'say',who:'Lia',text:['Fenn came through at noon. He says the glade is silent. Is it true? Did you reach the Hollow Oak?']},
    {k:'say',who:'@hero',text:['The Barkfather is down. The road south is open.']},
    {k:'say',who:'Lia',text:['Did it hurt him? At the end?']},
    {k:'choice',q:'Brann',opts:[
      {t:'"He was in pain. I could see it."',bond:1,steps:[{k:'say',who:'Lia',text:['I thought so. The Heart said the same thing in my sleep. A tree does not rage for no reason.']}]},
      {t:'"It was a monster. It had to fall."',steps:[{k:'say',who:'Lia',text:['...Maybe.','Grandmother says that too. In exactly those words.']}]}
    ]},
    {k:'wait',t:.5},
    {k:'say',who:'Lia',text:['Listen. When I cannot sleep I sing something to the well. Only the start, I never learned the rest.','"Sleep, little tide, the Heart is near."']},
    {k:'emote',id:'lia',e:'note',t:2},{k:'wait',t:1.6},
    {k:'say',who:'Lia',text:['If you hear the rest of it out there, will you tell me?']},
    {k:'say',who:'@hero',text:['I will.']},
    {k:'emote',id:'lia',e:'heart',t:1.2},{k:'wait',t:.8},
    {k:'cam',follow:true,t:.5},{k:'bars',on:false}
  ];
};
SCENES.lullaby=()=>{
  const lia=V(8.8,20.6);
  return[
    {k:'bars'},{k:'tint',c:'40,70,150',a:.26},
    {k:'actor',id:'lia',name:'Lia',at:lia,pal:LIA_PAL},
    {k:'cam',at:V(8,21),t:1.4},{k:'move',id:'player',to:V(10.4,20.6)},
    {k:'emote',id:'lia',e:'note',t:1.8},{k:'wait',t:1.2},
    {k:'say',who:'Lia',text:['You found it, did you not? The rest of the song.']},
    {k:'say',who:'@hero',text:['It was scratched on the wall of the Sunken Shrine, in a dozen hands. "Sleep, little reed, nothing to fear."']},
    {k:'say',who:'Lia',text:['...It is my mother\'s lullaby. Nobody in Hearthmoor knows it but me.','She went into the woods when I was six. She wanted to ask the Heart to stop being tapped.','Grandmother says she left us. I have never believed her.']},
    {k:'choice',q:'Brann',opts:[
      {t:'"I will find out what happened to her."',bond:1,steps:[{k:'say',who:'Lia',text:['Do not promise me that.','...But thank you for saying it.']}]},
      {t:'"Hum it with me."',bond:1,steps:[{k:'emote',id:'player',e:'note',t:2},{k:'emote',id:'lia',e:'note',t:2},{k:'wait',t:2},{k:'say',who:'Lia',text:['You hum badly.','Do not stop.']}]},
      {t:'(Listen.)',steps:[{k:'wait',t:.8}]}
    ]},
    {k:'say',who:'Lia',text:['The Matron sang it to the dead water, did she not. So the Heart still remembers her song.','It remembers. That is what I cannot stop thinking about.']},
    {k:'cam',follow:true,t:.5},{k:'bars',on:false}
  ];
};
SCENES.hill=()=>{
  const lia=V(21.6,14.8);
  return[
    {k:'bars'},{k:'tint',c:'20,30,90',a:.34},
    {k:'actor',id:'lia',name:'Lia',at:lia,pal:LIA_PAL},
    {k:'cam',at:V(21.5,15),t:1.4},{k:'move',id:'player',to:V(20.2,15.8)},
    {k:'say',who:'Lia',text:['Torvald says you came back from Cinderfall with copper in your pack. May I see it?']},
    {k:'say',who:'',text:['You show her the rubbing of the charter: seven names, and under them a second plate. THE TITHE.']},
    {k:'wait',t:.8},{k:'emote',id:'lia',e:'...',t:1.6},{k:'wait',t:1.4},
    {k:'say',who:'Lia',text:['Edda Maren. That is the slant of Grandmother\'s hand. The same careful sevens.','On my twelfth birthday she gave me the ledger key. I said no. I said I did not want to count other people\'s things.']},
    {k:'say',who:'Lia',text:['I thought she was only strict.','She was keeping a tap.']},
    {k:'choice',q:'Brann',opts:[
      {t:'"This is not yours to carry."',bond:1,steps:[{k:'say',who:'Lia',text:['It is, a little. I eat at that table.','But thank you.']}]},
      {t:'"Can I trust you?"',steps:[{k:'say',who:'Lia',text:['That is the right question.','Ask me again at the Heart.']}]},
      {t:'(Take her hand.)',bond:2,steps:[{k:'emote',id:'lia',e:'heart',t:1.4},{k:'say',who:'Lia',text:['Your hand is rough as bark.','Do not let go yet.']}]}
    ]},
    {k:'say',who:'Lia',text:['I will read her letters before they reach you. And I will find out what she wants at the end of all this.']},
    {k:'say',who:'Lia',text:['Promise you will come back. Not for the village.','For the herbs.']},
    {k:'say',who:'@hero',text:['For the herbs.']},
    {k:'emote',id:'lia',e:'heart',t:1.2},{k:'wait',t:.9},
    {k:'cam',follow:true,t:.5},{k:'bars',on:false}
  ];
};
SCENES.ridge=()=>{
  const start=REL(80,46),stop=REL(26,8);
  return[
    {k:'bars'},{k:'tint',c:'70,110,210',a:.24},
    {k:'actor',id:'lia',name:'Lia',at:start,pal:LIA_PAL},
    {k:'cam',at:REL(40,20),t:1.4},
    {k:'move',id:'lia',to:stop,t:3},{k:'emote',id:'lia',e:'!',t:1},{k:'wait',t:.5},
    {k:'cam',follow:true,t:.8},
    {k:'say',who:'Lia',text:[heroName()+'! Wait. I have been running since Hearthmoor. Do not look at me like that.']},
    {k:'say',who:'@hero',text:['The Warden said "she comes behind you". I thought he meant your grandmother.']},
    {k:'say',who:'Lia',text:['He did. But I am not her.','I read the rest of the ledger. She has the Tithe Guard drawn up at the Heart. A hundred men. She knows you carry the seed.','And she knows I helped you. I left before she could lock the door.']},
    {k:'choice',q:'Brann',opts:[
      {t:'(Take her hand.)',bond:2,steps:[{k:'say',who:'Lia',text:['Your hands are cold.']},{k:'say',who:'@hero',text:['So are yours.']},{k:'emote',id:'lia',e:'heart',t:1.4}]},
      {t:'"Warm yourself. I am glad you came."',bond:1,steps:[{k:'say',who:'Lia',text:['Glad. Good. I was afraid you would be angry.']}]},
      {t:'"Go home, Lia. It is not safe."',steps:[{k:'say',who:'Lia',text:['No.','I have stood behind that door all my life. I will not stand behind another one.']}]}
    ]},
    {k:'wait',t:.6},
    {k:'say',who:'Lia',text:['When this is over, I want to see the Spicewoods the way the Heart remembers them. One wood, from the sea to the snow.']},
    {k:'say',who:'@hero',text:['Then we plant it back.']},
    {k:'emote',id:'lia',e:'heart',t:1.4},{k:'say',who:'Lia',text:['"We."']},
    {k:'say',who:'Lia',text:['Go at first light. I will follow behind the Guard, by the root-paths. Grandmother never learned them. The Heart taught me.']},
    {k:'fade',to:1,t:1.2},{k:'hide',id:'lia'},{k:'tint',c:'255,190,110',a:.10},{k:'wait',t:.6},{k:'fade',to:0,t:1.4},
    {k:'cam',follow:true,t:.4},{k:'bars',on:false}
  ];
};
SCENES.finale=()=>{
  const a=M.after,A=a?[(a.wx+1.5)*TS,(a.wy-2)*TS]:REL(0,-30),L0=[A[0]-8,A[1]+110],L1=[A[0]-22,A[1]+26];
  return[
    {k:'bars'},{k:'tint',c:'255,200,90',a:.10},
    {k:'cam',at:A,t:1.2},
    {k:'actor',id:'maren',name:'Elder Maren',at:A,pal:MAREN_PAL},
    {k:'say',who:'',text:[STORY.finale[0]]},
    {k:'say',who:'Elder Maren',text:['Nine generations... for what? A stew pot.']},
    {k:'actor',id:'lia',name:'Lia',at:L0,pal:LIA_PAL},
    {k:'move',id:'lia',to:L1,t:2.6},{k:'emote',id:'lia',e:'!',t:1.2},{k:'wait',t:.6},
    {k:'say',who:'Lia',text:['Grandmother!']},
    {k:'say',who:'Elder Maren',text:['Lia... you were not meant to see this. I only wanted the village to stay warm.']},
    {k:'say',who:'Lia',text:['The village was warm. It was never hungry.','You were.']},
    {k:'move',id:'lia',to:[A[0]-10,A[1]+12],t:1.4},
    {k:'tint',c:'255,200,90',a:.20},{k:'emote',id:'lia',e:'note',t:3},
    {k:'say',who:'Lia',text:['"Sleep, little tide, the Heart is near.','Sleep, little reed, nothing to fear."']},
    {k:'tint',c:'255,200,90',a:.30},{k:'shake',n:4},{k:'sfx',n:'level'},
    {k:'say',who:'',text:[STORY.finale[2],'Two voices sing with Lia. One of them is older. Lia stops, and does not breathe.']},
    {k:'hide',id:'maren'},
    {k:'say',who:'Lia',text:['Mother?']},
    {k:'say',who:'Lia',text:['She says she is not angry. She says it was only lonely.']},
    {k:'move',id:'player',to:[A[0]+8,A[1]+14],t:1.8},
    {k:'say',who:'',text:[STORY.finale[3],'Lia\'s hand closes over yours. The Heart-leaf charm warms in your pocket, then crumbles into green.']},
    {k:'tint',c:'255,220,120',a:.42},{k:'shake',n:3},{k:'sfx',n:'level'},{k:'wait',t:1.4},
    {k:'fade',to:1,t:1.6},
    {k:'pages',pages:finaleEpiloguePages(),title:'THE END'},
    {k:'cam',follow:true,t:.2},{k:'bars',on:false}
  ];
};
function finaleEpiloguePages(){
  const pg=STORY.finale.slice(4),last=pg.pop();
  const e=STORY.epi[P.hero.id];if(e)pg.push(e);
  const b=flags.bond||0;
  pg.push(b>=7?'Lia stays at the roots to tend the seedling. '+P.hero.name+' moves his plough to the edge of the new wood. Every evening someone sings across the field, and someone answers.'
    :b>=4?'Lia stays at the roots to tend the seedling. '+P.hero.name+' walks out to the Heart every spring with a loaf of bread, and neither of them says why.'
    :'Lia stays at the roots to tend the seedling. In spring a green leaf drifts down the river to '+P.hero.name+'\'s plough, with a single word on it: Thanks.');
  const helped=[];for(const z in QDEFS){const st=flags.q&&flags.q[QDEFS[z].id];if(st&&st.s===2&&ZNPC[z])helped.push(ZNPC[z].name)}
  if(helped.length)pg.push('In the crowd around the roots stand '+helped.slice(0,5).join(', ')+(helped.length>5?' and '+(helped.length-5)+' more':'')+'. They remember what you did for them.');
  pg.push(last);
  return pg;
}

// ---------- when each scene plays ----------
function sceneReady(){
  return M&&M.id==='world'&&!ui&&!SC&&fade.dir===0&&!P.dead&&P.rollT<=0&&P.dashT<=0
    &&!E.some(e=>!e.dead&&e.state!=='idle'&&e.state!=='dormant'&&Math.hypot(e.x-P.x,e.y-P.y)<220);
}
function inPlaza(){const vx=P.x/TS-WVS.x,vy=P.y/TS-WVS.y;return vx>=13&&vx<=28&&vy>=11.5&&vy<=21}
function sceneTick(){
  if(!flags||!flags.sc)return;
  if(!flags.sc.meet&&flags.stage>=3){flags.sc.meet=true;flags.charm=true;placeLia()}   // a save from before the story scenes: Lia simply lives in the village
  if(!sceneReady())return;
  const sc=flags.sc,z=regionAtPx(P.x,P.y);
  if(sc.meet&&z==='village'&&inPlaza()){
    if(flags.rewarded&&!sc.well)return playScene('well',placeLia);
    if(sc.well&&flags.boss3&&!sc.lullaby)return playScene('lullaby',placeLia);
    if(sc.lullaby&&flags.boss8&&!sc.hill)return playScene('hill',placeLia);
  }
  if(sc.meet&&z==='ridge'&&flags.boss11&&!sc.ridge)return playScene('ridge',placeLia);
  // the first time in a region: the landscape film
  if(z!=='village'&&REGION_VIS[z]&&!sc['ri_'+z]){sc['ri_'+z]=true;playScene('regionIntro',null,z)}
}
