'use strict';
// ================= Account + cloud saves (same login as Death Arena: one Holiday Games account for every game) =================
// The 3 save slots live in localStorage and, when you are logged in, also in a Supabase table (tools/supabase_spicewood.sql, run once).
// Login: user name + password (internally <name>@players.holiday-games.com, so nobody needs a real e-mail). No password reset.
// Sync: per slot the client remembers the hash of the last agreed state (meta.base).
//   only local changed -> upload, only cloud changed -> download, both changed (or first connect) -> the player chooses.
// While playing, every save uploads the active slot after a few quiet seconds. Without network or table the game simply runs offline.
const Account={
  URL:'https://kqtjtagbhaaddfqibaxh.supabase.co',
  KEY:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdGp0YWdiaGFhZGRmcWliYXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTAzMDQsImV4cCI6MjEwNzEyNjMwNH0.dqw0HzW7UNdr_xW7BzauWXzAMJaP7M8TcUQwe5IjC78',
  DOMAIN:'players.holiday-games.com',
  TABLE:'spicewood_saves',
  META_KEY:'spicewood.account',
  DELAY:6000,
  meta:null,changed:false,syncing:0,status:'',statusColor:null,busy:false,pushing:false,timer:null,started:false,conflicts:{},el:null,refresh:null,

  get configured(){return!!(this.URL&&this.KEY)},
  get on(){return!!(this.meta&&this.meta.ref)},
  load(){try{const raw=localStorage.getItem(this.META_KEY);if(raw)this.meta=JSON.parse(raw)}catch(e){this.meta=null}if(this.meta&&!this.meta.base)this.meta.base={}},
  saveMeta(){try{if(this.meta)localStorage.setItem(this.META_KEY,JSON.stringify(this.meta));else localStorage.removeItem(this.META_KEY)}catch(e){}},
  say(text,color){this.status=text;this.statusColor=color||null;if(this.refresh)this.refresh()},

  // ---- network ----
  async http(method,path,body,token,extra){
    try{
      const h=Object.assign({apikey:this.KEY,'Content-Type':'application/json',Authorization:'Bearer '+(token||this.KEY)},extra||{});
      const res=await fetch(this.URL+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
      let json=null;try{json=await res.json()}catch(e){}
      return{ok:res.ok,status:res.status,json};
    }catch(e){return{ok:false,status:0,offline:true,json:null}}
  },
  errText(r){
    if(r.offline)return'NO CONNECTION';
    const m=String((r.json&&(r.json.msg||r.json.error_description||r.json.message||r.json.error))||'');
    if(r.status===404||/relation.*does not exist|could not find the table/i.test(m))return'CLOUD TABLE MISSING (RUN tools/supabase_spicewood.sql)';
    if(/already registered|already exists/i.test(m))return'THIS NAME IS ALREADY TAKEN';
    if(/invalid login/i.test(m))return'WRONG NAME OR PASSWORD';
    if(/password/i.test(m)&&/(least|short|weak)/i.test(m))return'PASSWORD TOO SHORT (6+ CHARACTERS)';
    if(/rate limit|too many/i.test(m))return'TOO MANY TRIES - WAIT A MINUTE';
    return m?m.slice(0,80).toUpperCase():'ERROR '+r.status;
  },
  emailOf(name){return name.toLowerCase()+'@'+this.DOMAIN},
  validName(name){return/^[a-z0-9_]{3,20}$/i.test(name)},
  setSession(j,name){
    const prev=this.meta;
    this.meta={name:name||(prev&&prev.name)||'',uid:j.user.id,tok:j.access_token,ref:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000,base:prev&&prev.name===name?prev.base||{}:{}};
    this.saveMeta();
  },
  async auth(kind,name,pw){
    if(!this.configured)return{ok:false,error:'CLOUD SAVES ARE NOT SET UP YET'};
    if(!this.validName(name))return{ok:false,error:'NAME: 3-20 LETTERS, NUMBERS OR _'};
    if(String(pw).length<6)return{ok:false,error:'PASSWORD TOO SHORT (6+ CHARACTERS)'};
    const body={email:this.emailOf(name),password:pw};
    const r=kind==='signup'?await this.http('POST','/auth/v1/signup',body):await this.http('POST','/auth/v1/token?grant_type=password',body);
    if(!r.ok)return{ok:false,error:this.errText(r)};
    if(!r.json||!r.json.access_token)return{ok:false,error:'ACCOUNT MADE, BUT E-MAIL CONFIRMATION IS STILL ON IN SUPABASE'};
    this.setSession(r.json,name.toLowerCase());
    return{ok:true};
  },
  logout(){this.meta=null;this.conflicts={};this.saveMeta();clearTimeout(this.timer)},
  async token(){
    const m=this.meta;if(!m)return null;
    if(m.exp-Date.now()>60000)return m.tok;
    const r=await this.http('POST','/auth/v1/token?grant_type=refresh_token',{refresh_token:m.ref});
    if(r.ok&&r.json&&r.json.access_token){m.tok=r.json.access_token;m.ref=r.json.refresh_token;m.exp=Date.now()+(r.json.expires_in||3600)*1000;this.saveMeta();return m.tok}
    if(r.status===400||r.status===401){this.meta.ref=null;this.saveMeta();this.say('SESSION EXPIRED - PLEASE LOG IN AGAIN','red')}
    return null;
  },
  async rest(method,path,body,extra){
    const t=await this.token();if(!t)return{ok:false,status:0,offline:!this.meta||!!this.meta.ref,json:null};
    return this.http(method,path,body,t,extra);
  },

  // ---- slot codes ----
  localCode(i){
    try{const raw=localStorage.getItem(SAVE_KEYS[i]);if(!raw)return null;return'SW1:'+btoa(unescape(encodeURIComponent(raw)))}catch(e){return null}
  },
  decode(code){
    const m=/^SW1:([A-Za-z0-9+/=]+)$/.exec(String(code||'').trim());if(!m)return null;
    try{const raw=decodeURIComponent(escape(atob(m[1]))),d=JSON.parse(raw);return d&&typeof d.h==='number'&&d.flags?{raw,d}:null}catch(e){return null}
  },
  hash(code){if(!code)return'';let h=2166136261;for(let i=0;i<code.length;i++){h^=code.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16)+'.'+code.length},
  peek(code){
    const x=this.decode(code);if(!x)return null;
    const d=x.d;return{hero:HEROES[d.h]?HEROES[d.h].name:'?',lvl:d.lvl,map:d.map,won:!!(d.flags&&d.flags.won),ngp:(d.flags&&d.flags.ngp)||0,pt:d.pt||0};
  },
  importCode(i,code){
    const x=this.decode(code);if(!x)return{ok:false,error:'THIS IS NOT A VALID SPICEWOOD SAVE CODE'};
    try{localStorage.setItem(SAVE_KEYS[i],x.raw)}catch(e){return{ok:false,error:'COULD NOT WRITE THE SAVE'}}
    return{ok:true};
  },
  async upload(i,code){
    const r=await this.rest('POST','/rest/v1/'+this.TABLE+'?on_conflict=user_id,slot',[{user_id:this.meta.uid,slot:i,code}],{Prefer:'resolution=merge-duplicates,return=minimal'});
    if(r.ok){this.meta.base[i]=this.hash(code);this.saveMeta()}
    return r;
  },
  async download(i,cloudCode){
    const res=this.importCode(i,cloudCode);
    if(!res.ok)return{ok:false,status:0,json:{msg:res.error}};
    this.meta.base[i]=this.hash(cloudCode);this.saveMeta();
    return{ok:true};
  },

  // ---- sync of all slots (call from the title screen only: a download replaces local slots) ----
  async syncAll(){
    if(!this.on||this.busy)return;
    this.busy=true;this.syncing++;this.changed=false;this.say('SYNCING...','grey');
    let ok=false;
    try{
      const r=await this.rest('GET','/rest/v1/'+this.TABLE+'?select=slot,code');
      if(!r.ok){if(this.on)this.say(this.errText(r),'red');return}
      const cloud={};for(const row of r.json||[])cloud[row.slot]=row.code;
      let up=0,down=0;this.conflicts={};
      for(let i=0;i<SAVE_KEYS.length;i++){
        const lc=this.localCode(i),cc=cloud[i]||null,lh=this.hash(lc),ch=this.hash(cc),base=this.meta.base[i];
        if(!lc&&!cc)continue;
        let res=null;
        if(lh===ch){this.meta.base[i]=lh;this.saveMeta();continue}
        if(!lc){res=await this.download(i,cc);down++}
        else if(!cc){res=await this.upload(i,lc);up++}
        else if(base===ch){res=await this.upload(i,lc);up++}
        else if(base===lh){res=await this.download(i,cc);down++}
        else{this.conflicts[i]={local:lc,cloud:cc};continue}
        if(res&&!res.ok){this.say(this.errText(res),'red');return}
      }
      ok=true;
      const nc=Object.keys(this.conflicts).length;
      this.say(nc?'CHOOSE WHICH SAVE TO KEEP ('+nc+' SLOT'+(nc>1?'S':'')+')':(up||down?'SYNCED: '+up+' UPLOADED, '+down+' DOWNLOADED':'EVERYTHING IS UP TO DATE'),nc?'orange':'teal');
    }finally{this.busy=false;this.syncing--;if(!ok)this.changed=true;if(this.refresh)this.refresh();if(typeof slotCache!=='undefined')slotCache.t=-1e9}
  },
  async resolve(i,choice){
    const c=this.conflicts[i];if(!c||this.busy)return;
    this.busy=true;
    try{
      const res=choice==='cloud'?await this.download(i,c.cloud):await this.upload(i,this.localCode(i)||c.local);
      if(res.ok){delete this.conflicts[i];const n=Object.keys(this.conflicts).length;this.say(n?'CHOOSE WHICH SAVE TO KEEP':'SYNCED',n?'orange':'teal')}
      else this.say(this.errText(res),'red');
    }finally{this.busy=false;if(this.refresh)this.refresh();if(typeof slotCache!=='undefined')slotCache.t=-1e9}
  },

  async deleteSlot(i){const r=await this.rest('DELETE','/rest/v1/'+this.TABLE+'?slot=eq.'+i);if(r.ok&&this.meta)delete this.meta.base[i];this.saveMeta();return r},

  // ---- continuous upload: every save() reports here; after DELAY of quiet the active slot goes up ----
  dirty(){
    if(this.pushing||!this.on)return;
    this.changed=true;clearTimeout(this.timer);
    this.timer=setTimeout(()=>this.pushActive(),this.DELAY);
  },
  async pushActive(){
    if(!this.on||this.busy)return;
    const i=curSlot;if(this.conflicts[i])return;
    const code=this.localCode(i);
    if(!code||this.hash(code)===this.meta.base[i])return;
    const r=await this.upload(i,code);
    if(r.ok)this.say('SAVED TO CLOUD','teal');
    else if(!r.offline)this.say(this.errText(r),'red');
  },
  flush(){if(this.timer){clearTimeout(this.timer);this.timer=null;this.pushActive()}},

  // ---- dialog (real HTML inputs: works in the iframe and on tablets) ----
  open(){
    if(this.el)return;
    try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}
    const C={bg:'#1a110a',panel:'#241810',line:'#8a6a3a',text:'#f0e6d0',dim:'#a89878',gold:'#ffd040',teal:'#7fd6b0',red:'#ff7a6a',orange:'#ff9a50',grey:'#8a8272',blue:'#8fd0ff'};
    const mk=(tag,css,text)=>{const e=document.createElement(tag);e.style.cssText=css||'';if(text)e.textContent=text;return e};
    const root=mk('div','position:fixed;inset:0;background:rgba(8,5,3,.9);z-index:10;display:flex;align-items:center;justify-content:center;font-family:"Segoe UI",Tahoma,Verdana,Arial,sans-serif;');
    root.setAttribute('data-nogame','1');
    const box=mk('div','width:min(520px,92vw);max-height:92vh;overflow:auto;box-sizing:border-box;padding:16px;background:'+C.bg+';border:2px solid '+C.line+';color:'+C.text+';');
    const btn=(label,color,fn)=>{const b=mk('button','flex:1 1 130px;padding:10px 8px;margin:3px;cursor:pointer;background:'+C.panel+';color:'+color+';border:2px solid '+color+';font:inherit;font-size:14px;font-weight:bold;',label);b.onclick=fn;return b};
    const input=(type,ph)=>{const e=mk('input','width:100%;box-sizing:border-box;margin:4px 0;padding:8px;background:#0c0805;color:'+C.text+';border:2px solid '+C.line+';font:16px monospace;');e.type=type;e.placeholder=ph;e.autocomplete=type==='password'?'current-password':'username';e.spellcheck=false;return e};
    const colorOf=c=>(c&&C[c])||C.grey;
    let nameIn=null,pwIn=null,codeBox=null,slotSel=null;
    const render=()=>{
      const keepName=nameIn?nameIn.value:'',keepPw=pwIn?pwIn.value:'',keepCode=codeBox?codeBox.value:'';
      box.textContent='';
      box.appendChild(mk('div','color:'+C.gold+';font-size:22px;margin-bottom:6px;font-weight:bold;','ACCOUNT'));
      const msg=mk('div','min-height:20px;margin:8px 2px;font-size:13px;color:'+colorOf(this.statusColor)+';',this.status);
      const row=mk('div','display:flex;flex-wrap:wrap;');
      if(!this.configured){
        box.appendChild(mk('div','color:'+C.dim+';font-size:14px;line-height:1.4;','Your save lives in this browser. Use the save code below to move it between devices.'));
      }else if(!this.on){
        box.appendChild(mk('div','color:'+C.dim+';font-size:13px;line-height:1.4;margin-bottom:6px;','Log in to keep your 3 save slots in the cloud and play with the same progress on every device. It is the same Holiday Games login as Death Arena. Choose any name and a password. There is NO password reset, so remember it.'));
        nameIn=input('text','NAME');pwIn=input('password','PASSWORD (6+ CHARACTERS)');
        nameIn.value=keepName||(this.meta&&this.meta.name)||'';pwIn.value=keepPw;
        box.appendChild(nameIn);box.appendChild(pwIn);box.appendChild(msg);
        const go=async kind=>{
          this.say(kind==='signup'?'CREATING ACCOUNT...':'LOGGING IN...','grey');
          const r=await this.auth(kind,nameIn.value.trim(),pwIn.value);
          if(!r.ok){this.say(r.error,'red');return}
          pwIn=null;nameIn=null;this.say('LOGGED IN','teal');await this.syncAll();
        };
        row.appendChild(btn('LOG IN',C.blue,()=>go('login')));row.appendChild(btn('CREATE ACCOUNT',C.orange,()=>go('signup')));
        pwIn.addEventListener('keydown',e=>{if(e.key==='Enter')go('login')});
      }else{
        nameIn=null;pwIn=null;
        box.appendChild(mk('div','color:'+C.teal+';font-size:16px;margin-bottom:4px;font-weight:bold;','LOGGED IN AS '+this.meta.name.toUpperCase()));
        box.appendChild(mk('div','color:'+C.dim+';font-size:13px;line-height:1.4;','Your slots are uploaded a few seconds after every save and compared when you open the title screen. If you play on two devices, the last one to save wins, so let a device finish saving before you switch.'));
        box.appendChild(msg);
        for(const i of Object.keys(this.conflicts).map(Number)){
          const c=this.conflicts[i],fmt=p=>p?`${p.hero}  LV ${p.lvl}  ${p.map}${p.won?'  FINISHED':''}`:'?';
          const card=mk('div','border:2px solid '+C.orange+';padding:8px;margin:6px 0;');
          card.appendChild(mk('div','color:'+C.orange+';font-size:15px;font-weight:bold;','SLOT '+(i+1)+': THIS DEVICE AND THE CLOUD DIFFER'));
          card.appendChild(mk('div','font-size:13px;margin:4px 0;','THIS DEVICE:  '+fmt(this.peek(c.local))));
          card.appendChild(mk('div','font-size:13px;margin:4px 0;','CLOUD:  '+fmt(this.peek(c.cloud))));
          const r2=mk('div','display:flex;flex-wrap:wrap;');
          r2.appendChild(btn('KEEP THIS DEVICE',C.blue,()=>this.resolve(i,'local')));r2.appendChild(btn('KEEP CLOUD',C.gold,()=>this.resolve(i,'cloud')));
          card.appendChild(r2);box.appendChild(card);
        }
        row.appendChild(btn('SYNC NOW',C.blue,()=>this.syncAll()));row.appendChild(btn('LOG OUT',C.red,()=>{this.logout();this.say('LOGGED OUT (YOUR SAVES STAY ON THIS DEVICE)','grey')}));
      }
      // manual save codes
      box.appendChild(mk('div','color:'+C.gold+';font-size:15px;margin:12px 0 4px;font-weight:bold;','SAVE CODE'));
      slotSel=mk('select','padding:6px;background:#0c0805;color:'+C.text+';border:2px solid '+C.line+';font:inherit;margin-right:6px;');
      for(let i=0;i<SAVE_KEYS.length;i++){const o=document.createElement('option');o.value=i;o.textContent='Slot '+(i+1);if(i===curSlot)o.selected=true;slotSel.appendChild(o)}
      codeBox=mk('textarea','width:100%;box-sizing:border-box;height:60px;margin:6px 0;background:#0c0805;color:'+C.dim+';border:2px solid '+C.line+';font:11px monospace;');
      codeBox.value=keepCode;codeBox.placeholder='Paste a save code here to import it, or press EXPORT to get one.';codeBox.spellcheck=false;
      const r3=mk('div','display:flex;flex-wrap:wrap;align-items:center;');
      r3.appendChild(slotSel);
      r3.appendChild(btn('EXPORT',C.blue,()=>{const c=this.localCode(+slotSel.value);if(!c){this.say('THAT SLOT IS EMPTY','red');return}codeBox.value=c;codeBox.select();try{document.execCommand('copy');this.say('CODE COPIED','teal')}catch(e){}}));
      r3.appendChild(btn('IMPORT',C.orange,()=>{const i=+slotSel.value,res=this.importCode(i,codeBox.value);if(!res.ok){this.say(res.error,'red');return}this.changed=true;if(this.on)this.meta.base[i]='';this.say('IMPORTED INTO SLOT '+(i+1),'teal');if(typeof slotCache!=='undefined')slotCache.t=-1e9}));
      box.appendChild(r3);box.appendChild(codeBox);
      row.appendChild(btn('CLOSE',C.grey,()=>this.close()));
      box.appendChild(row);
      if(nameIn)nameIn.focus();
    };
    this.refresh=render;
    root.appendChild(box);render();
    root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')this.close()});
    root.addEventListener('keyup',e=>e.stopPropagation());
    root.addEventListener('mousedown',e=>e.stopPropagation());
    root.addEventListener('wheel',e=>e.stopPropagation());
    root.addEventListener('contextmenu',e=>e.stopPropagation(),true);
    document.body.appendChild(root);
    this.el=root;
  },
  close(){
    if(!this.el)return;
    this.el.remove();this.el=null;this.refresh=null;
    window.focus();
  }
};
Account.load();
// Title screen tick: when logged in and something changed (or on first start), compare all slots. Conflicts open the dialog.
Account.menuTick=function(){
  if(!this.on||!this.configured||this.busy||(this.started&&!this.changed))return;
  this.started=true;
  this.syncAll().then(()=>{if(Object.keys(this.conflicts).length)this.open()});
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)Account.flush()});
