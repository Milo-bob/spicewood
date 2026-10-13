'use strict';
// ================= The four revelations as pictures =================
// They used to be black text pages after a boss chest. Now they play in the boss room itself:
//  charter  (Cinder Forge)       the seven founders under the great tree, the oath, and Edda Maren's second plate
//  mirror   (Prism Vault)        a shard shows the elder's cellar: Maren and her ledger
//  founder  (Ghostbark Crypt)    Corwin's ghost, Edda's ledger, nine generations carrying barrels, the Oathcrown
//  warden   (Hoarfrost Reliquary) the last seed, and a lantern climbing the stairs behind you
// Text is the same as before (STORY.charter etc.), only spoken and shown. Played once; New Game+ shows the old text pages.
const FOUNDER_PAL=[
  {h:'#9ba3ad',c:'#4a6a4a',k:'#2a3a2a',g:'#d8c890'},   // Corwin Ashgrove
  {h:'#3a2a1a',c:'#6a5a4a',k:'#2a2018',g:'#a0a0a0'},   // Halvard
  {h:'#2a6a4a',c:'#4a8a5a',k:'#1a4a2a',g:'#8fe0a0'},   // Sorrel Pike
  {h:'#6a4a2a',c:'#8a6a3a',k:'#4a3a1e',g:'#f0d890'},   // Wren Dunmore
  {h:'#4a2a6a',c:'#7a4aa8',k:'#3a1a5a',g:'#d8b0f0'},   // Ysolt Vane
  {h:'#c8a050',c:'#a83a2a',k:'#5a1e18',g:'#f0d060'},   // Pell Cardamon
  {h:'#2a2a3a',c:'#4a5a7a',k:'#2a3a4a',g:'#d8d8f0'}    // Edda Maren
];
const GEN_PAL={h:'#1a1a1a',c:'#2a2a3a',k:'#101018',g:'#8a8a98'};
const FNAMES=['Corwin Ashgrove','Halvard','Sorrel Pike','Wren Dunmore','Ysolt Vane','Pell Cardamon','Edda Maren'];

function drawSceneProp(a){
  if(a.hidden)return;
  const x=Math.round(a.x),y=Math.round(a.y+Math.sin(time*2.2+a.x)*1.5),al=a.alpha===undefined?1:a.alpha;
  if(al<=0)return;
  cx.globalAlpha=al;
  const R=(c,dx,dy,w,h)=>{cx.fillStyle=c;cx.fillRect(x+dx,y+dy,w,h)},pu=.5+.5*Math.sin(time*4);
  switch(a.kind){
    case'plate':case'plate2':{
      const red=a.kind==='plate2';glow(x,y,22+3*pu,red?'255,120,60':'255,190,100',.34);
      R('#000',-9,-8,18,15);R(red?'#a85030':'#c88040',-8,-7,16,13);R(red?'#d87050':'#e8b070',-8,-7,16,2);
      for(let i=0;i<4;i++)R(red?'#5a2010':'#8a5020',-6,-4+i*3,12-(i%2)*4,1);
      R('#000',-1,6,2,3);break}
    case'shard':{
      glow(x,y,26+4*pu,'140,200,255',.5);
      R('#000',-4,-13,9,24);R('#8fd0ff',-3,-12,7,22);R('#d8f4ff',-1,-12,2,22);R('#fff',0,-10,1,8);R('#4a90d0',2,-4,2,14);break}
    case'crown':{
      glow(x,y,16+2*pu,'255,210,100',.4);
      R('#000',-8,-5,17,11);R('#e8b840',-7,-4,15,9);R('#fff0a0',-7,-4,15,2);
      for(const dx of[-7,-2,3,8-2])R('#e8b840',dx,-8,3,5);
      R('#d03a3a',-5,0,2,2);R('#3a8ad0',0,0,2,2);R('#3ad07a',5,0,2,2);break}
    case'seed':{
      glow(x,y,24+4*pu,'120,255,140',.5);
      R('#000',-3,-6,7,12);R('#58d060',-2,-5,5,10);R('#a8ffb0',-1,-5,2,5);R('#2a8a3a',0,2,3,3);break}
    case'lantern':{
      const fl=.8+.2*Math.sin(time*13+a.x);glow(x,y,34*fl,'255,190,90',.5);
      R('#000',-3,-5,7,10);R('#6a4a2a',-2,-4,5,8);R('#ffd060',-1,-3,3,5);R('#fff0a0',0,-2,1,2);break}
    case'stump':{
      shadow(x,y+12,10);R('#3a2412',-8,2,16,10);R('#6a4424',-7,2,14,9);R('#8a5c30',-7,2,5,9);R('#3a2412',-9,-4,18,6);R('#c8a064',-8,-4,16,5);R('#8a6a3a',-6,-3,12,1);R('#8a6a3a',-4,-1,8,1);R('#8a6a3a',-1,-3,1,4);break}
    case'tap':{
      glow(x,y,10,'220,230,255',.4);R('#000',-6,-3,13,6);R('#c8d0d8',-5,-2,11,4);R('#f0f4f8',-5,-2,11,1);R('#8a909a',2,2,3,6);break}
    case'ledger':{
      R('#000',-5,-4,11,9);R('#6a3a1a',-4,-3,9,7);R('#e8d8b0',-3,-2,7,5);R('#8a6a3a',0,-2,1,5);break}
  }
  cx.globalAlpha=1;
}
// a picture in the air: the shard shows the elder's cellar
function drawSceneWindow(w){
  const p=w.p,ww=Math.round(300*p),hh=Math.round(160*p),x=Math.round(W/2-ww/2),y=Math.round(H/2-hh/2-6);
  if(ww<8)return;
  cx.fillStyle='#000';cx.fillRect(x-4,y-4,ww+8,hh+8);cx.fillStyle='#8fd0ff';cx.fillRect(x-3,y-3,ww+6,hh+6);
  cx.save();cx.beginPath();cx.rect(x,y,ww,hh);cx.clip();
  cx.fillStyle='#24160c';cx.fillRect(x,y,ww,hh);
  if(w.pic==='cellar'){
    const sx=x+ww/2,sy=y+hh/2;
    cx.fillStyle='#3a2414';for(let r=0;r<6;r++)for(let c=0;c<9;c++)if((r+c)%2===0)cx.fillRect(x+c*34,y+r*28,32,26);   // old stone
    cx.fillStyle='#1c1008';cx.fillRect(x,y+hh*.62,ww,hh*.4);
    // rows of barrels full of Heart-sap
    for(let row=0;row<2;row++)for(let c=0;c<7;c++){
      const bx=sx-120+c*40+(row?18:0),by=y+hh*.46+row*30,gl=.5+.5*Math.sin(time*2+c+row);
      cx.fillStyle='#000';cx.fillRect(bx-9,by-12,19,24);cx.fillStyle='#7a4a22';cx.fillRect(bx-8,by-11,17,22);cx.fillStyle='#9a6a32';cx.fillRect(bx-8,by-11,5,22);
      cx.fillStyle='#3a2410';cx.fillRect(bx-8,by-5,17,2);cx.fillRect(bx-8,by+4,17,2);
      cx.fillStyle=`rgba(255,200,80,${.35+.3*gl})`;cx.fillRect(bx-2,by-12,5,2);
    }
    // the elder with her ledger, drawn big
    const sp=Spr.npc(MAREN_PAL).front,sc=3,sw=sp.width*sc,sh=sp.height*sc;
    cx.fillStyle='rgba(0,0,0,.35)';cx.beginPath();cx.ellipse(sx,sy+hh*.34,22,6,0,0,TAU);cx.fill();
    cx.drawImage(sp,Math.round(sx-sw/2),Math.round(sy+hh*.34-sh),sw,sh);
    cx.fillStyle='#000';cx.fillRect(sx+10,sy+4,22,16);cx.fillStyle='#6a3a1a';cx.fillRect(sx+11,sy+5,20,14);cx.fillStyle='#e8d8b0';cx.fillRect(sx+13,sy+7,16,10);cx.fillStyle='#8a6a3a';cx.fillRect(sx+21,sy+7,1,10);
    // a silver spigot on the nearest barrel
    cx.fillStyle='#c8d0d8';cx.fillRect(sx-82,sy+36,8,3);cx.fillRect(sx-75,sy+36,2,8);
  }
  // scanlines and glass shine
  cx.fillStyle='rgba(143,208,255,.08)';for(let i=0;i<hh;i+=3)cx.fillRect(x,y+i,ww,1);
  cx.fillStyle='rgba(255,255,255,.07)';cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+ww*.5,y);cx.lineTo(x,y+hh*.6);cx.fill();
  cx.restore();
}

// ---------- the scenes ----------
const founderRing=(c,r)=>FOUNDER_PAL.map((pal,i)=>{const a=-Math.PI/2+i*TAU/7;return{k:'actor',id:'f'+i,name:FNAMES[i],at:[c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r*.7],pal}});
const hideFounders=()=>({k:'hide',id:['f0','f1','f2','f3','f4','f5','f6']});

SCENES.charter=()=>{
  const C=REL(0,-14);
  return[
    {k:'bars'},{k:'lights'},{k:'wait',t:.5},
    {k:'say',who:'',text:[STORY.charter[0]]},
    {k:'prop',id:'plate',kind:'plate',at:REL(0,-30)},{k:'cam',at:REL(0,-22),t:.9},
    {k:'cap',text:'THE OATH OF HEARTHMOOR',t:2.4},
    {k:'flash'},{k:'vision',on:true,kind:'dungeon',r:14},{k:'grade',mode:'past'},{k:'hide',id:'plate'},
    ...founderRing(C,40),
    {k:'cam',at:C,t:.01,spd:.7,async:true},
    {k:'cap',text:'Seven founders stand under the great tree: Corwin Ashgrove, Halvard, Sorrel Pike, Wren Dunmore, Ysolt Vane, Pell Cardamon, and Edda Maren.',t:6},
    {k:'move',id:'f6',to:[C[0],C[1]+8],t:1.4},
    {k:'prop',id:'plate2',kind:'plate2',at:[C[0]+14,C[1]+2]},
    {k:'cap',text:'Beneath the oath, a second plate: THE TITHE. One part in three of the Heart\'s sap, owed to Hearthmoor, every year, for ever. Signed: Edda Maren.',t:6.4},
    {k:'flash'},{k:'vision',on:false},{k:'grade'},hideFounders(),{k:'hide',id:'plate2'},
    {k:'cam',follow:true,t:.6},
    {k:'say',who:'',text:[STORY.charter[3]]},
    {k:'bars',on:false}
  ];
};
SCENES.mirror=()=>[
  {k:'bars'},{k:'lights'},{k:'wait',t:.6},
  {k:'say',who:'',text:['The Prism Wraith shatters, and one shard stays lit.']},
  {k:'prop',id:'shard',kind:'shard',at:REL(0,-28)},{k:'cam',at:REL(0,-24),t:.9},{k:'wait',t:.6},
  {k:'flash'},{k:'window',on:true,pic:'cellar'},{k:'wait',t:1.2},
  {k:'say',who:'',text:['It shows a room you know: the elder\'s cellar in Hearthmoor, barrel upon barrel of Heart-sap.']},
  {k:'say',who:'Elder Maren',text:['"Fourteen guardians."','"Nine have fallen. The hero is better than I dared hope."','"Soon there will be nothing left between me and the tap."']},
  {k:'window',on:false},{k:'wait',t:.7},{k:'flash'},{k:'hide',id:'shard'},{k:'sfx',n:'boom'},
  {k:'cam',follow:true,t:.6},
  {k:'say',who:'',text:[STORY.mirror[2]]},
  {k:'bars',on:false}
];
SCENES.founder=()=>{
  const C=REL(0,-14),ghost=REL(0,-40);
  const gens=[...Array(9).keys()];
  return[
    {k:'bars'},{k:'lights'},{k:'wait',t:.5},
    {k:'say',who:'',text:[STORY.founder[0]]},
    {k:'actor',id:'corwin',name:'Corwin Ashgrove',at:ghost,pal:FOUNDER_PAL[0],alpha:0},{k:'alpha',id:'corwin',to:.85,t:1.4},
    {k:'cam',at:REL(0,-28),t:.8},
    {k:'say',who:'Corwin Ashgrove',text:['"Protect, never take. That was the oath. I kept the first half until I forgot everything else."']},
    // the second half of the oath: Edda and her ledger
    {k:'flash'},{k:'vision',on:true,kind:'dungeon',r:14},{k:'grade',mode:'past'},
    {k:'actor',id:'edda',name:'Edda Maren',at:[C[0]-30,C[1]],pal:FOUNDER_PAL[6]},{k:'prop',id:'ledger',kind:'ledger',at:[C[0]-22,C[1]-2]},
    {k:'cam',at:C,t:.01,spd:.7,async:true},
    {k:'cap',text:'Edda kept the second half in her ledger, and called it the Tithe. The shame is ours.',t:5},
    // nine generations carry the sap away
    ...gens.map(i=>({k:'actor',id:'g'+i,name:'',at:[C[0]+130+i*18,C[1]+6+(i%2)*10],pal:GEN_PAL})),
    {k:'move',id:gens.map(i=>'g'+i),tos:gens.map(i=>[C[0]-130+i*18,C[1]+6+(i%2)*10]),t:7,async:true},
    {k:'cap',text:'"The Maren line has fed on the Heart for nine generations."',t:7},
    {k:'flash'},{k:'vision',on:false},{k:'grade'},{k:'hide',id:['edda','ledger',...gens.map(i=>'g'+i)]},
    {k:'cam',at:REL(0,-28),t:.8},
    {k:'say',who:'Corwin Ashgrove',text:['"The last of them sends heroes to cut the Heart\'s chains, so that nothing stands between her and the sap."']},
    {k:'prop',id:'crown',kind:'crown',at:[ghost[0],ghost[1]+8]},
    {k:'move',id:'crown',to:[P.x,P.y-12],t:1.6},{k:'sfx',n:'pickup'},{k:'hide',id:'crown'},
    {k:'say',who:'Corwin Ashgrove',text:['"Go to the Hoarfrost Ridge. My last guardian keeps the Heart\'s last seed. Plant it. Do not give it to her."']},
    {k:'alpha',id:'corwin',to:0,t:2},
    {k:'cam',follow:true,t:.5},{k:'bars',on:false}
  ];
};
SCENES.warden=()=>{
  const S0=REL(0,-26),W0=REL(0,-44);
  return[
    {k:'bars'},{k:'lights'},{k:'tint',c:'90,140,230',a:.16},{k:'wait',t:.5},
    {k:'say',who:'',text:['The Winter Warden\'s crown melts.']},
    {k:'prop',id:'seed',kind:'seed',at:S0,alpha:0},{k:'alpha',id:'seed',to:1,t:1.4},{k:'cam',at:REL(0,-20),t:.8},
    {k:'cap',text:'Beneath the ice lies the Heart\'s last secret: a single seed, still green.',t:3.6},
    {k:'say',who:'',text:[STORY.warden[1]]},
    {k:'actor',id:'warden',name:'The Winter Warden',at:W0,pal:{h:'#d8f0ff',c:'#7ab0e0',k:'#3a6a9a',g:'#f0ffff'},alpha:0},{k:'alpha',id:'warden',to:.7,t:1.4},
    {k:'say',who:'The Winter Warden',text:['"She comes behind you."','"She has been behind you all along. Plant it, hero. Quickly."']},
    {k:'alpha',id:'warden',to:0,t:1.6},
    // far behind: a lantern climbing the stairs
    {k:'prop',id:'lamp',kind:'lantern',at:REL(-110,64),alpha:0},{k:'cam',at:REL(-50,34),t:1.2},{k:'alpha',id:'lamp',to:1,t:.8},
    {k:'move',id:'lamp',to:REL(-72,48),t:3.2},
    {k:'cap',text:'Far behind you, a lantern is coming up the stairs.',t:3,small:true},
    {k:'alpha',id:'lamp',to:0,t:1},
    {k:'cam',follow:true,t:.6},{k:'tint'},{k:'bars',on:false}
  ];
};
for(const k of['charter','mirror','founder','warden'])SCENES[k].skippable=false;

// the first time a revelation plays as a picture; later (New Game+, old saves) as the old text pages
function revealScene(name){
  if(flags.sc&&flags.sc[name])showStory(STORY[name]);
  else playScene(name);
}
