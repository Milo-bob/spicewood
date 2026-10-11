'use strict';
const W=480,H=270,TS=16,TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
const randi=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
function seeded(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---------- Sound (tiny WebAudio synth) ----------
const Snd=(()=>{
  let ac=null,on=true;
  function init(){
    if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)()}catch(e){ac=null}}
    if(ac&&ac.state==='suspended')ac.resume();
  }
  function tone(f,d,type,v,slide,delay){
    if(!ac||!on)return;
    try{
      const t=ac.currentTime+(delay||0),o=ac.createOscillator(),g=ac.createGain();
      o.type=type||'square';o.frequency.setValueAtTime(f,t);
      if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t+d);
      g.gain.setValueAtTime(v||.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);
    }catch(e){}
  }
  return{
    init,
    toggle(){on=!on;return on},
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
