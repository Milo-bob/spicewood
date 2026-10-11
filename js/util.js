'use strict';
const W=480,H=270,TS=16,TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
function seeded(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---------- Sound (tiny WebAudio synth) + procedural music ----------
const Snd=(()=>{
  let ac=null,on=true,sfxG=null,musG=null;
  const cfg={sfx:1,music:.6};
  try{const st=JSON.parse(localStorage.getItem('spicewood_settings')||'null');if(st){if(typeof st.sfx==='number')cfg.sfx=st.sfx;if(typeof st.music==='number')cfg.music=st.music;on=st.on!==false}}catch(e){}
  function saveCfg(){try{localStorage.setItem('spicewood_settings',JSON.stringify({sfx:cfg.sfx,music:cfg.music,on}))}catch(e){}}
  function apply(){if(sfxG)sfxG.gain.value=on?cfg.sfx:0;if(musG)musG.gain.value=on?cfg.music:0}
  function init(){
    if(!ac){
      try{
        ac=new(window.AudioContext||window.webkitAudioContext)();
        sfxG=ac.createGain();sfxG.connect(ac.destination);
        musG=ac.createGain();musG.connect(ac.destination);
        apply();
        if(typeof Music!=='undefined'&&Music.want)Music.play(Music.want,true);
      }catch(e){ac=null}
    }
    if(ac&&ac.state==='suspended')ac.resume();
  }
  function tone(f,d,type,v,slide,delay){
    if(!ac||!on)return;
    try{
      const t=ac.currentTime+(delay||0),o=ac.createOscillator(),g=ac.createGain();
      o.type=type||'square';o.frequency.setValueAtTime(f,t);
      if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);
      g.gain.setValueAtTime(v||.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.connect(g);g.connect(sfxG);o.start(t);o.stop(t+d+.02);
    }catch(e){}
  }
  return{
    init,
    ctx:()=>ac,bus:()=>musG,
    cfg,
    setSfx(v){cfg.sfx=v;apply();saveCfg()},
    setMusic(v){cfg.music=v;apply();saveCfg()},
    toggle(){on=!on;apply();saveCfg();return on},
    get on(){return on},
    swing:()=>tone(260,.07,'sawtooth',.02,-110),
    shoot:()=>tone(520,.09,'triangle',.03,-300),
    hit:()=>tone(150,.09,'square',.05,-70),
    crit:()=>{tone(200,.1,'square',.06,-80);tone(420,.08,'triangle',.04,200,.03)},
    hurt:()=>tone(110,.18,'sawtooth',.06,-60),
    spell:()=>tone(330,.22,'sine',.05,380),
    roll:()=>tone(200,.12,'triangle',.03,240),
    pickup:()=>{tone(660,.06,'square',.03);tone(880,.08,'square',.03,0,.05)},
    coin:()=>tone(1100,.05,'square',.025),
    level:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.18,'square',.04,0,i*.09))},
    boom:()=>tone(90,.35,'sawtooth',.08,-50),
    menu:()=>tone(440,.05,'square',.025),
    open:()=>{tone(300,.12,'triangle',.04,200);tone(500,.16,'triangle',.04,300,.08)}
  };
})();

// Generative music: every zone has a scale, a chord loop and a mood. Phrases repeat every 4 bars.
const Music=(()=>{
  let cur=null,want=null,timer=null,step=0,nextT=0,tr=null;
  const hz=m=>440*Math.pow(2,(m-69)/12);
  const TRACKS={
    title:{bpm:66,root:50,scale:[0,3,5,7,10],prog:[0,-2,-4,-2],mel:.4,melWave:'triangle',bass:.05,pad:.03,seed:3},
    village:{bpm:92,root:57,scale:[0,2,4,7,9],prog:[0,5,7,5],mel:.5,melWave:'triangle',bass:.05,pad:.022,seed:11},
    forest:{bpm:72,root:52,scale:[0,3,5,7,10],prog:[0,-4,-2,-5],mel:.3,melWave:'triangle',bass:.05,pad:.035,seed:21},
    marsh:{bpm:60,root:55,scale:[0,2,3,7,9],prog:[0,0,-2,-2],mel:.28,melWave:'sine',bass:.045,pad:.04,seed:33,oct:12},
    dungeon:{bpm:56,root:45,scale:[0,1,5,7,8],prog:[0,0,-4,-2],mel:.18,melWave:'sine',bass:.06,pad:.04,seed:41},
    boss:{bpm:132,root:48,scale:[0,3,5,6,7,10],prog:[0,0,-2,-4],mel:.6,melWave:'square',bass:.05,pad:.02,seed:51,drive:true}
  };
  function note(f,t,dur,type,vol){
    const ac=Snd.ctx(),bus=Snd.bus();if(!ac||!bus)return;
    const o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.05);
  }
  function schedule(st,t){
    const beat=60/tr.bpm,bar=Math.floor(st/8),ip=st%8,pr=tr.prog[bar%tr.prog.length],base=tr.root+pr;
    if(ip===0){
      note(hz(base-12),t,beat*3.5,'sine',tr.bass);
      for(const k of[0,tr.scale[1],tr.scale[3]])note(hz(base+k),t,beat*7.5,'triangle',tr.pad);
    }
    if(tr.drive||ip===4)note(hz(base-12+(ip===6?7:0)),t,beat*(tr.drive?.45:1.6),'sine',tr.bass*(tr.drive?.8:.8));
    if(tr.drive&&ip%2===0)note(2200,t,.03,'square',.012);
    const r=seeded(tr.seed*100+(bar%4)*8+ip);
    if(r()<tr.mel){
      const deg=tr.scale[Math.floor(r()*tr.scale.length)]+(tr.oct||0)+(r()<.3?12:0);
      note(hz(base+12+deg),t,beat*(r()<.5?.9:.5),tr.melWave,tr.melWave==='square'?.018:.035);
    }
  }
  function run(){
    const ac=Snd.ctx();if(!ac||!tr)return;
    while(nextT<ac.currentTime+.3){schedule(step,nextT);nextT+=60/tr.bpm/2;step++}
  }
  function play(name,force){
    want=name;
    if(!name||(cur===name&&!force))return;
    const ac=Snd.ctx();if(!ac)return;
    cur=name;tr=TRACKS[name];step=0;nextT=ac.currentTime+.15;
    if(timer)clearInterval(timer);
    timer=setInterval(run,60);
  }
  return{play,get want(){return want},set want(v){want=v}};
})();

// ---------- Input ----------
const Input=(()=>{
  const codes={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',
    KeyJ:'attack',KeyK:'skill1',KeyL:'skill2',Space:'roll',KeyE:'interact',Enter:'enter',KeyI:'inv',Tab:'inv',KeyQ:'potion',
    KeyP:'pause',Backspace:'back',KeyX:'sell',Digit1:'n1',Digit2:'n2',Digit3:'n3',Digit4:'n4',KeyM:'mute',KeyT:'tree'};
  const NAV=new Set(['left','right','up','down']);
  const CONF=['enter','attack','interact','roll'];
  const held={},virt={};let hits={};const joy={x:0,y:0};
  addEventListener('keydown',e=>{
    const n=codes[e.code];if(!n)return;
    e.preventDefault();Snd.init();
    if(!e.repeat||NAV.has(n))hits[n]=true;
    held[n]=true;
  });
  addEventListener('keyup',e=>{const n=codes[e.code];if(!n)return;e.preventDefault();held[n]=false});
  addEventListener('blur',()=>{for(const k in held)held[k]=false});
  return{
    joy,
    down:n=>!!(held[n]||virt[n]),
    hit:n=>!!hits[n],
    confirm:()=>CONF.some(n=>hits[n]),
    cancel:()=>!!(hits.back||hits.inv||hits.pause),
    setV(n,v){if(v&&!virt[n])hits[n]=true;virt[n]=v},
    axis(){
      let x=(held.right||virt.right?1:0)-(held.left||virt.left?1:0)+joy.x;
      let y=(held.down||virt.down?1:0)-(held.up||virt.up?1:0)+joy.y;
      const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}
      return{x,y,l:Math.min(1,l)};
    },
    end(){hits={}}
  };
})();
