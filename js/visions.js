'use strict';
// ================= Visions, landscape intros and the Codex page =================
// How the Great Turning reaches the player: not as a paragraph, but as a picture.
//  - regionIntro: the first time you enter a region, a short film: the land as it is, a flash, the land as it was (the same spot turned back into forest), a flash, and why it changed.
//  - stumpVision: touching a Ringed Stump shows the same spot as forest and the reason, then the Codex page.
//  - bossVision: when a guardian falls, its memory: the boss room becomes a sunlit glade for a few seconds, the colour returns.
//  - dungeonShot: the establishing shot when you enter a dungeon for the first time: the camera flies to where the guardian waits.
// All of them are skippable (Backspace). Nothing here involves any character from the love story.
const REGION_VIS={
  glade:{before:'Ember Glade. This is how all of the Spicewoods once looked: one wood, whole and old.',now:'Here the Heart still reaches the roots.',why:''},
  amber:{before:'Amber Hollow. Sap ran in the roots like honey, and the wood ran on to the sea.',now:'Here the forest still remembers itself.',why:''},
  marsh:{before:'Mistwater Marsh was a deep, dry wood. The roots held the water like a cup.',now:'Now the marsh drowns what is left of it.',why:'When the Heart let go of the water, the ground forgot how to hold it.'},
  rust:{before:'Rustpeak was a forested ridge, rich in iron under its roots.',now:'Now it is bare rock and open mines.',why:'The founders cleared the slopes for ore. Without roots the soil slid away.'},
  grove:{before:'Ghostbark Grove was a living wood, the quietest in all the Spicewoods.',now:'Now it stands dead in the dark, and will not rest.',why:'The Heart still calls it home, and the dead answer.'},
  saffron:{before:'Saffron Meadows was a deep wood, dim and cool.',now:'Now it is endless golden fields under a restless wind.',why:'The founders felled it for the crop. The wind found the bare ground at once.'},
  steppe:{before:'The Windward Steppe was a wood on the high ground, thick with birds.',now:'Now it is open land, and the wind carries a single word.',why:'Where the trees fell, nothing is left to stop the Heart\'s whisper.'},
  spire:{before:'The Smolder Spire was a forested mountain, green to the top.',now:'Now it is black glass and running slag.',why:'The Heart\'s fever baked it where it stood.'},
  ember:{before:'Cinderfall Heights were green hills under the autumn sun.',now:'Now they are ash and scorched ground.',why:'The fever began here, and the soil still remembers the heat.'},
  tangle:{before:'Tanglewood was once an ordinary wood, well kept and quiet.',now:'Now it runs wild and swallows its own roads.',why:'Where no Heart guides the growth, the forest does not die. It overgrows.'},
  delta:{before:'The Spice Delta was a river valley under old trees.',now:'Now it is a hundred channels and floating islands.',why:'When the roots gave way, the rivers took the land.'},
  mesa:{before:'The Sunbaked Mesa was a wood, watered from below by the Heart\'s roots.',now:'Now it is sand and cactus.',why:'The Heart stopped pumping water. The trees dried up and the dunes rose.'},
  gulch:{before:'Crystal Gulch was a deep, humming grove.',now:'Now it is glass, and light that has nowhere to go.',why:'The sap froze mid-flow and turned to crystal.'},
  ridge:{before:'Hoarfrost Ridge was pine hills under a warm autumn sun.',now:'Now it is snow over a sleeping wood.',why:'The cold did not kill it. It only put it to sleep.'},
  heart:{before:'The Heart of Spicewood. This is where it all began.',now:'Every root in the forest still leads here.',why:''}
};
// what a fallen guardian remembers: [the memory, what became of it]
const BOSSVIS={
  barkfather:['A sapling in the sun, and the Heart\'s sap running sweet through its first bark.','He guarded the Hollow Oak for three hundred years. Nobody ever thanked him.'],
  mycelia:['Her spores carried the Heart\'s memory from root to root, and the forest sang.','Now every spore carries only pain.'],
  drowned:['The marsh was a dry, deep wood. She sang to the roots and the roots sang back.','When the water came, she kept singing to the drowned.'],
  warden:['The first plough, forged from the iron roots of the Heart. The village cheered.','Then the founders took the slopes for ore. He guarded the shafts until he rusted.'],
  king:['Corwin Ashgrove raised his hand under the great tree and swore: protect, never take.','He kept the first half until he forgot everything else.'],
  harvest:['Wheat among the trees, sun on the granary, a whole village laughing.','He stored the harvest so it would never be lost. He never learned who it was for.'],
  cinder:['The first forge fire, kindled from the Heart\'s own warmth.','He never stopped hammering. There was never anything left to guard.'],
  storm:['The Steppe was a wood, and he was its voice, carrying news from tree to tree.','The trees fell. The news never stopped.'],
  magma:['A mountain forest, and Pell Cardamon crowning himself with roots.','He burned so that the Heart did not have to.'],
  frost:['Corwin carrying a single green seed up the ridge through the snow.','He froze it to keep it safe. Someone had to carry it home.'],
  prism:['Light falling through the Heart\'s canopy, all day, without end.','Its memories, trapped in glass. Break one and you free a memory.'],
  sand:['A palace in the forest, and water running through the roots beneath it.','He ruled the dust long after the water was gone.'],
  thorn:['The Heart dropped a single seed, and a jungle grew from it.','She raised it wild, and wild it has remained.'],
  baron:['A market under the trees, barrels of spice, a laughing man with a ledger.','He hoarded the taste of the Heart so that nobody would ever lose it.']
};

// ---------- the same spot, turned back into forest ----------
const PAST_WOOD=new Set([T.TREE,T.CACTUS,T.PINE,T.CRYSTAL,T.CRAG,T.JTREE,T.GTREE,T.OBSID]);
const PAST_OPEN=new Set([T.GRASS,T.LEAF,T.FLOWER,T.CROP,T.SAND,T.SNOW,T.SCREE,T.ASH,T.MOSS,T.SHROOM,T.LONE,T.SHALLOW]);
const vhash=(x,y,s)=>(Math.imul((x*73856093)^(y*19349663)^(s*83492791),0x45d9f3b)>>>0)%100;
function pastTile(t,x,y,kind,zone){
  if(kind==='dungeon'){if(t===T.DFLOOR)return vhash(x,y,7)<72?T.GRASS:T.LEAF;if(t===T.DWALL)return T.TREE;return t}
  if(PAST_WOOD.has(t))return T.TREE;
  if(t===T.WATER&&zone!=='marsh'&&zone!=='delta')return t;
  if(PAST_OPEN.has(t)||t===T.WATER)return vhash(x>>2,y>>2,13)<58?T.TREE:(vhash(x,y,5)<75?T.GRASS:T.LEAF);
  return t;
}
function visionOn(s,st){
  if(s.vis)visionOff(s);
  const ax=st.at?st.at[0]:P.x,ay=st.at?st.at[1]:P.y,tx=Math.floor(ax/TS),ty=Math.floor(ay/TS),r=st.r||24,kind=st.kind||'forest';
  const v={saved:[],dark:M.dark,mist:M.mist,kind},zone=M.id==='world'?regionAtPx(ax,ay):null;
  for(let y=ty-Math.ceil(r*.7);y<=ty+Math.ceil(r*.7);y++)for(let x=tx-r;x<=tx+r;x++){
    if(x<2||y<2||x>=M.w-2||y>=M.h-2)continue;
    const i=y*M.w+x,t=M.t[i],n=pastTile(t,x,y,kind,zone);
    if(n!==t){v.saved.push(i,t);M.t[i]=n}
  }
  M.dark=false;M.mist=false;
  s.vis=v;buildLayer();
}
function visionOff(s){
  const v=s&&s.vis;if(!v)return;
  for(let k=0;k<v.saved.length;k+=2)M.t[v.saved[k]]=v.saved[k+1];
  M.dark=v.dark;M.mist=v.mist;s.vis=null;buildLayer();
}
const visionActive=()=>!!(SC&&SC.vis);

// ---------- the picture: warm light, vignette, shafts of sun, drifting motes ----------
function drawVisionGrade(mode){
  const past=mode==='past';
  cx.fillStyle=past?'rgba(255,208,110,.16)':'rgba(255,238,170,.12)';cx.fillRect(0,0,W,H);
  const g=cx.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,W*.62);g.addColorStop(0,'rgba(30,16,0,0)');g.addColorStop(1,'rgba(30,16,0,.5)');
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  const t=time;
  for(let k=0;k<4;k++){
    const x=((k*131+t*6)%(W+160))-80,a=.05+.03*Math.sin(t*.7+k*2);
    cx.fillStyle=`rgba(255,240,190,${a})`;
    cx.beginPath();cx.moveTo(x,0);cx.lineTo(x+22,0);cx.lineTo(x-62,H);cx.lineTo(x-96,H);cx.closePath();cx.fill();
  }
  for(let k=0;k<26;k++){
    const x=(k*57+t*(8+k%5*3))%W,y=(k*91+Math.sin(t*.8+k)*14+t*(5+k%3*2))%H,a=.35+.3*Math.sin(t*2+k);
    cx.fillStyle=`rgba(255,235,160,${a})`;cx.fillRect(Math.round(x),Math.round(y),k%4?1:2,k%4?1:2);
  }
}
function drawSceneCaption(c){
  const a=Math.min(1,c.t/.5,(c.dur-c.t)/.5);if(a<=0)return;
  cx.globalAlpha=a*.78;cx.fillStyle='#000';cx.fillRect(0,H-78,W,38);
  cx.globalAlpha=a;
  const sz=c.small?8:10,lines=wrap(c.text,W-100,sz).slice(0,2);
  lines.forEach((l,i)=>text(l,W/2,H-74+(lines.length>1?i*13:12),c.small?'#c8b890':'#fff0c8',sz,'center',true));
  cx.globalAlpha=1;
}

// ---------- the films ----------
SCENES.regionIntro=z=>{
  const V=REGION_VIS[z];
  const st=[{k:'bars'},{k:'cam',at:REL(-48,-6),t:.01,spd:9},{k:'wait',t:.8},
    {k:'flash'},{k:'vision',on:true,r:26},{k:'grade',mode:'past'},{k:'cam',at:REL(52,-4),t:.01,spd:.5,async:true},{k:'cap',text:V.before,t:4.6}];
  st.push({k:'flash'},{k:'vision',on:false},{k:'grade'},{k:'cam',at:REL(-20,0),t:.01,spd:.5,async:true},{k:'cap',text:V.now,t:3.4});
  if(V.why)st.push({k:'cap',text:V.why,t:3.8,small:true});
  st.push({k:'cam',follow:true,t:.6},{k:'bars',on:false});
  return st;
};
SCENES.regionIntro.skippable=true;
SCENES.stumpVision=z=>{
  const V=REGION_VIS[z],why=TOMEBYID[z+'_2']?TOMEBYID[z+'_2'].text:'';
  return[{k:'bars'},{k:'wait',t:.5},{k:'flash'},{k:'vision',on:true,r:24},{k:'grade',mode:'past'},{k:'cam',at:REL(36,-4),t:.01,spd:.5,async:true},
    {k:'cap',text:V.before,t:4.4},{k:'cap',text:why,t:5,small:true},
    {k:'flash'},{k:'vision',on:false},{k:'grade'},{k:'cam',follow:true,t:.5},{k:'bars',on:false}];
};
SCENES.stumpVision.skippable=true;
SCENES.bossVision=v=>{
  const B=BOSSVIS[v];
  return[{k:'bars'},{k:'wait',t:.6},{k:'flash'},{k:'vision',on:true,kind:'dungeon',r:16},{k:'grade',mode:'color'},{k:'cap',text:B[0],t:4.4},{k:'cap',text:B[1],t:4,small:true},
    {k:'flash'},{k:'vision',on:false},{k:'grade'},{k:'bars',on:false}];
};
SCENES.bossVision.skippable=true;
SCENES.dungeonShot=id=>{
  const spec=DUNGEONS.find(d=>d.id===id),bk=Object.keys(BOSSES).find(k=>BOSSES[k].flag===spec.bossFlag),B=BOSSES[bk]||{epi:'',name:''};
  const bs=M.spawns.find(q=>q.type==='boss'),tgt=bs?[bs.x,bs.y]:[P.x,P.y-90];
  return[{k:'bars'},{k:'cam',at:tgt,t:.01,spd:9},{k:'wait',t:.5},{k:'cap',text:spec.name,t:2.6},
    {k:'cam',at:[P.x,P.y],t:.01,spd:1,async:true},{k:'cap',text:B.epi?B.epi+': '+B.name:'',t:3,small:true},{k:'cam',follow:true,t:.4},{k:'bars',on:false}];
};
SCENES.dungeonShot.skippable=true;
function onMapEntered(id){
  if(!flags||!flags.sc||!M.dungeon||!DUNGEONS.some(d=>d.id===id)||flags.sc['ds_'+id])return;
  flags.sc['ds_'+id]=true;playScene('dungeonShot',null,id);
}

// ---------- the Codex: a full page with a before/after picture, a badge on the HUD, key B ----------
let codexFlash=0;
const codexCount=()=>flags&&flags.lore?TOMELIST.filter(t=>flags.lore[t.id]).length:0;
function openCodexPage(id,first){
  const t=TOMEBYID[id];if(!t)return;
  flags.lore=flags.lore||{};
  if(first){flags.lore[id]=true;codexFlash=time+9;Snd.level();toast(`Codex entry added (${codexCount()}/${TOMELIST.length})`,'#8fd0ff');save()}
  ui={mode:'codexpage',id,t:0,first};
}
function updateCodexPage(dt){const s=ui;s.t+=dt;if(s.t>.45&&(Input.confirm()||Input.hit('back')||Input.hit('codex')))ui=null}
function landscapeSwatch(x,y,w,h,zone,past){
  const S=ZSPEC[zone];if(!S)return;
  const col=id=>{const c=MMC[id]||[80,80,80];return`rgb(${c[0]},${c[1]},${c[2]})`};
  cx.fillStyle='#000';cx.fillRect(x-1,y-1,w+2,h+2);
  // sky and ground
  const sky=cx.createLinearGradient(0,y,0,y+h*.5);
  if(past){sky.addColorStop(0,'#f0c070');sky.addColorStop(1,'#f8e0a0')}else{sky.addColorStop(0,S.cold?'#a8c0d8':S.night?'#2a2a48':'#c0a888');sky.addColorStop(1,S.cold?'#d0e0ec':S.night?'#4a4a6a':'#e0d0b0')}
  cx.fillStyle=sky;cx.fillRect(x,y,w,h*.55);
  const ground=past?col(T.GRASS):col(S.mode==='islands'?T.WATER:S.ground);
  cx.fillStyle=ground;cx.fillRect(x,y+h*.5,w,h*.5);
  if(!past&&(zone==='marsh'||zone==='delta')){cx.fillStyle=col(T.WATER);cx.fillRect(x,y+h*.62,w,h*.38)}
  // trees: dense and round when it was a forest, the region's own wood now
  const n=past?9:Math.max(3,Math.round(8*S.dens));
  for(let k=0;k<n;k++){
    const tx=x+4+((k*37+zone.length*11)%(w-10)),ty=y+h*.5+((k*53)%Math.floor(h*.3))-2,ww=past?9:7;
    if(past){cx.fillStyle='#4a2c14';cx.fillRect(tx+3,ty,3,8);cx.fillStyle=k%2?'#c8641e':'#e0902a';cx.fillRect(tx-1,ty-9,ww+2,10);cx.fillRect(tx+1,ty-12,ww-2,4)}
    else{
      const wc=col(S.wood);cx.fillStyle=wc;
      if(S.wood===T.CACTUS){cx.fillRect(tx+3,ty-9,3,12);cx.fillRect(tx,ty-6,3,2);cx.fillRect(tx+6,ty-4,3,2)}
      else if(S.wood===T.PINE){cx.fillRect(tx+3,ty-10,3,4);cx.fillRect(tx+1,ty-7,7,4);cx.fillRect(tx,ty-4,9,5)}
      else if(S.wood===T.CRYSTAL){cx.fillRect(tx+3,ty-12,3,12);cx.fillRect(tx+2,ty-9,5,6);cx.fillStyle='#fff';cx.fillRect(tx+4,ty-10,1,3)}
      else if(S.wood===T.CRAG||S.wood===T.OBSID){cx.fillRect(tx,ty-4,9,6);cx.fillRect(tx+2,ty-8,5,4)}
      else{cx.fillStyle='#4a2c14';cx.fillRect(tx+3,ty,3,7);cx.fillStyle=wc;cx.fillRect(tx,ty-8,ww+2,9)}
    }
  }
}
function drawCodexPage(){
  const s=ui,t=TOMEBYID[s.id];if(!t)return;
  cx.fillStyle='rgba(8,4,2,.9)';cx.fillRect(0,0,W,H);
  const px=22,py=12,pw=W-44,ph=H-24;
  cx.fillStyle='#e9d9b4';cx.fillRect(px,py,pw,ph);cx.fillStyle='#d8c498';cx.fillRect(px+3,py+3,pw-6,ph-6);
  cx.strokeStyle='#6a4a22';cx.lineWidth=2;cx.strokeRect(px+1.5,py+1.5,pw-3,ph-3);cx.lineWidth=1;
  text('CODEX',px+12,py+10,'#8a6a3a',7);
  text(WORLD[t.zone]?WORLD[t.zone].name:'',px+pw-12,py+10,'#8a6a3a',7,'right');
  text(t.title,px+12,py+24,'#3a2410',14,'left',true);
  cx.fillStyle='#8a6a3a';cx.fillRect(px+12,py+42,pw-24,1);
  wrap(t.text,pw*.52,9).forEach((l,i)=>text(l,px+12,py+52+i*13,'#2a1a0a',9));
  // picture: once / now
  const ix=px+pw*.62,iw=pw*.34;
  text('ONCE',ix,py+50,'#6a4a22',6);landscapeSwatch(ix,py+58,iw,52,t.zone,true);
  text('NOW',ix,py+118,'#6a4a22',6);landscapeSwatch(ix,py+126,iw,52,t.zone,false);
  if(s.first&&Math.floor(time*3)%2)text('NEW ENTRY',px+pw-12,py+ph-34,'#b03020',8,'right',true);
  text(`Codex ${codexCount()}/${TOMELIST.length}`,px+12,py+ph-16,'#6a4a22',7);
  if(s.t>.45)text('Enter: close',px+pw-12,py+ph-16,'#6a4a22',7,'right');
  reg(0,0,W,H,()=>{if(s.t>.45)ui=null});
}
function drawCodexBadge(){
  if(!P||ui)return;
  const x=6,y=H-22,flash=time<codexFlash&&Math.floor(time*4)%2;
  const here=(M.id==='world'&&typeof curZone==='function')?curZone():(M.zone||null),tz=here&&TOMES[here];
  const n=tz?tz.filter((_,i)=>flags.lore&&flags.lore[here+'_'+i]).length:0;
  cx.fillStyle='rgba(16,10,6,.78)';cx.fillRect(x,y,tz?96:70,16);cx.strokeStyle=flash?'#ffd040':'#5a4228';cx.strokeRect(x+.5,y+.5,tz?95:69,15);
  cx.fillStyle=flash?'#ffd040':'#c8a050';cx.fillRect(x+3,y+3,7,9);cx.fillStyle='#3a2410';cx.fillRect(x+4,y+4,5,7);cx.fillStyle=flash?'#fff':'#e8d8a8';cx.fillRect(x+5,y+5,1,5);
  text(`Codex ${codexCount()}/${TOMELIST.length}`,x+13,y+2,flash?'#ffe9a0':'#c8b890',6);
  text(tz?`here ${n}/${tz.length}  B`:'B',x+13,y+9,'#8a7a62',5);
  reg(x,y,tz?96:70,16,()=>openInv(2));
}
