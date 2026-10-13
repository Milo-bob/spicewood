'use strict';
// ================= Three more text pages turned into scenes =================
//  mid       after the Rust Warden: the earth shudders, a ringed stump, the land as it was, and the first doubt about Maren's letters
//  turning   the Great Turning at the Heart (vision of the whole wood, then of its fall)
//  betrayal  Maren and the Tithe Guard at the foot of the great tree: the seed is taken, the spigot goes into the root
//  bind      Maren binds herself to the dying Heart and rises as the last guardian
// Played once; New Game+ and old saves see the old text pages.
const GUARD_PAL={h:'#8a8a8a',c:'#6a6a74',k:'#3a3a42',g:'#d0d0d8'};
const treeAnchor=()=>{const t=M.props.find(p=>p.k==='worldtree');return t?[(t.tx+.5)*TS,(t.ty+9)*TS,(t.tx+.5)*TS,(t.ty-4)*TS]:[P.x,P.y-40,P.x,P.y-120]}   // arena centre, top of the trunk
const plain=s=>s.replace(/^[A-Z]+: "?/,'').replace(/"$/,'');

SCENES.mid=()=>{
  const S=REL(0,-30);
  return[
    {k:'bars'},{k:'lights'},{k:'wait',t:.5},
    {k:'say',who:'',text:[STORY.mid[0]]},{k:'shake',n:7},{k:'sfx',n:'boom'},{k:'wait',t:.6},
    {k:'cam',at:REL(0,-90),t:.01,spd:.5,async:true},
    {k:'cap',text:STORY.mid[1],t:4.4},
    {k:'cam',follow:true,t:.7},
    {k:'prop',id:'stump',kind:'stump',at:S,alpha:0},{k:'alpha',id:'stump',to:1,t:1},{k:'cam',at:REL(0,-18),t:.8},
    {k:'flash'},{k:'vision',on:true,kind:'dungeon',r:14},{k:'grade',mode:'past'},
    {k:'cap',text:'Wood grew here once. Perhaps everywhere. Perhaps the land was not always like this.',t:5},
    {k:'flash'},{k:'vision',on:false},{k:'grade'},{k:'hide',id:'stump'},{k:'cam',follow:true,t:.6},
    {k:'say',who:'',text:[STORY.mid[3],STORY.mid[4]]},
    {k:'bars',on:false}
  ];
};
function midScene(){if(flags.sc&&flags.sc.mid)showStory(STORY.mid);else playScene('mid')}

SCENES.turning=()=>{
  const[ax,ay,tx,ty]=treeAnchor();
  return[
    {k:'bars'},{k:'wait',t:.4},
    {k:'say',who:'',text:[STORY.turning[0]]},
    {k:'cam',at:[tx,ty-40],t:.01,spd:.45,async:true},
    {k:'cap',text:'In its trunk, behind bark like folded hands, a golden light beats. That is the Heart.',t:5},
    {k:'flash'},{k:'vision',on:true,r:30},{k:'grade',mode:'past'},{k:'cam',at:[ax,ay+10],t:.01,spd:.35,async:true},
    {k:'cap',text:'The light touches your hand, and the roots remember. You see the Spicewood as it was: one wood, unbroken, from the sea to the snow.',t:6.4},
    {k:'flash'},{k:'vision',on:false},{k:'grade'},{k:'tint',c:'70,64,56',a:.3},
    {k:'cap',text:STORY.turning[3],t:6},
    {k:'tint'},{k:'cam',follow:true,t:.6},
    {k:'say',who:'',text:[STORY.turning[4]]},
    {k:'bars',on:false}
  ];
};

SCENES.betrayal=()=>{
  const[ax,ay,tx,ty]=treeAnchor(),M0=[ax,ay-26];
  const guards=[];
  for(let row=0;row<3;row++)for(let i=0;i<7;i++){const a=-Math.PI*.9+i*Math.PI*.8/6;guards.push({k:'actor',id:'g'+row+i,name:'',at:[ax+Math.cos(a+Math.PI*.05)*(46+row*13),ay-10+Math.sin(a)*(26+row*10)-18],pal:GUARD_PAL})}
  const ids=guards.map(g=>g.id),react=(STORY.reaction[P.hero.id]||'You say nothing.').replace(/^[A-Z]+: /,'');
  return[
    {k:'bars'},{k:'wait',t:.4},
    {k:'say',who:'',text:[STORY.betrayal[0]]},
    {k:'cam',at:[ax,ay-16],t:.01,spd:.8,async:true},
    {k:'actor',id:'maren',name:'Elder Maren',at:M0,pal:MAREN_PAL},{k:'prop',id:'lamp',kind:'lantern',at:[M0[0]+9,M0[1]-2]},
    ...guards,{k:'wait',t:1.2},
    {k:'say',who:'',text:[STORY.betrayal[1]]},
    {k:'say',who:'Elder Maren',text:[plain(STORY.betrayal[2]),plain(STORY.betrayal[3])]},
    {k:'say',who:'',text:[react]},
    // you refuse: the guard closes in, the seed is torn from your pack
    {k:'say',who:'',text:[STORY.betrayal[5]]},
    {k:'move',id:ids,tos:guards.map(g=>[(g.at[0]*2+P.x)/3,(g.at[1]*2+P.y)/3+4]),t:1.4},
    {k:'shake',n:8},{k:'sfx',n:'boom'},{k:'flash'},{k:'move',id:'player',to:[P.x,P.y+14],t:.35},
    {k:'prop',id:'seed',kind:'seed',at:[P.x,P.y-8]},{k:'move',id:'seed',to:[M0[0]-4,M0[1]-8],t:1.2},
    {k:'say',who:'Elder Maren',text:[plain(STORY.betrayal[6]).replace(/ She drives.*$/,'')]},
    {k:'prop',id:'tap',kind:'tap',at:[M0[0]+8,M0[1]-6]},{k:'move',id:'tap',to:[tx,ty+60],t:1.1},
    {k:'flash'},{k:'shake',n:10},{k:'sfx',n:'boom'},{k:'tint',c:'255,120,40',a:.22},
    {k:'cap',text:'She drives a silver spigot into the great root, and the Heart screams.',t:3.4},
    {k:'tint'},{k:'hide',id:[...ids,'maren','lamp','seed','tap']},{k:'cam',follow:true,t:.7},
    {k:'say',who:'',text:[STORY.betrayal[7]]},
    {k:'bars',on:false}
  ];
};

SCENES.bind=()=>{
  const[ax,ay,tx,ty]=treeAnchor(),M0=[ax+36,ay+30];
  return[
    {k:'bars'},{k:'wait',t:.3},{k:'cam',at:[ax,ay-14],t:.01,spd:.8,async:true},
    {k:'say',who:'',text:['The Heartwood sags, and for a moment the blight lifts.']},
    {k:'flash'},{k:'tint',c:'140,255,160',a:.16},{k:'wait',t:1},{k:'tint'},
    {k:'actor',id:'maren',name:'Elder Maren',at:M0,pal:MAREN_PAL},{k:'prop',id:'tap',kind:'tap',at:[M0[0]+7,M0[1]-6]},{k:'prop',id:'seed',kind:'seed',at:[M0[0]-6,M0[1]-6]},
    {k:'move',id:['maren','tap','seed'],tos:[[ax,ay-8],[ax+7,ay-14],[ax-6,ay-14]],t:2.6},
    {k:'say',who:'Elder Maren',text:[plain(STORY.bind[1]).split(' She presses')[0]]},
    {k:'move',id:'tap',to:[ax,ay-6],t:.7},{k:'flash'},{k:'shake',n:9},{k:'sfx',n:'boom'},{k:'tint',c:'255,210,90',a:.28},
    {k:'move',id:['maren','tap','seed'],tos:[[ax,ay-26],[ax,ay-32],[ax-6,ay-32]],t:1.6},
    {k:'say',who:'',text:['She presses the spigot to her own chest. Roots lash around her, and she rises, wreathed in sap and gold.']},
    {k:'say',who:'Elder Maren',text:[plain(STORY.bind[2])]},
    {k:'tint'},{k:'hide',id:['maren','tap','seed']},{k:'cam',follow:true,t:.6},{k:'bars',on:false}
  ];
};
function bindScene(done){if(flags.sc&&flags.sc.bind){showStory(STORY.bind,done)}else playScene('bind',done)}

// the betrayal at the Heart: the Great Turning, then Maren; then the seed is gone
function betrayalScenes(after){
  if(flags.sc&&flags.sc.turning&&flags.sc.betrayal){showStory(STORY.turning,()=>showStory(betrayalPages(),after,'The Heart of Spicewood'));return}
  playScene('turning',()=>playScene('betrayal',after));
}
