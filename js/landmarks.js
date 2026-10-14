'use strict';
// ================= Landmarks and shrine set pieces =================
// Drawn in the same vocabulary as the tiles and trees: warm 1px outline, three-tone shading
// (dark / base / light, light from the upper left), grass tufts where they meet the ground.
// Every function gets B(color, dx, dy, w, h), relative to the prop's tile; (x,y) is that tile's pixel position.
const LO='#2a160a';
const LP={
  stone:['#5a564c','#8a867a','#b4ae9c'],
  plaster:['#a89468','#d8c8a0','#efe2c0'],
  wood:['#3a2412','#6a4424','#8a5c30'],
  dead:['#2a2018','#4a3a2c','#6a5640'],
  sand:['#a8864a','#d9b975','#efd9a0'],
  rust:['#4a3a30','#8a6a58','#b8927a'],
  brick:['#4a2a1e','#8a5238','#b07a58'],
  teal:['#3a4a48','#6a8a88','#9ab8b0'],
  cream:['#b8a888','#e8d8b8','#f8f0d8'],
  cap:['#7a2a60','#b0489a','#e07ac8'],
  red:['#6e220c','#a83a16','#d05a24'],
  orange:['#8a5010','#c8801e','#eaa638'],
  green:['#143a1a','#24602a','#3e8c3e'],
  leaf:['#1e4a22','#2f7a34','#5ab04a'],
  lacquer:['#7a2418','#a83a2a','#c8503a'],
  tile:['#1e3a3a','#2f5a5a','#4a8a7a'],
  obsidian:['#14101a','#2a2430','#4a4252'],
  ice:['#6aa0d0','#bfe4ff','#eaf8ff']
};
function lmH(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}   // stable pseudo-random, so nothing flickers
function lmEll(B,mx,my,rx,ry,c,top){for(let dy=-ry;dy<=(top?0:ry);dy++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-dy*dy/(ry*ry+.01))));if(w>0)B(c,mx-w,my+dy,w*2,1)}}
function lmBlob(B,mx,my,rx,ry,p,seed){
  lmEll(B,mx,my,rx+1,ry+1,LO);lmEll(B,mx,my+1,rx,ry,p[0]);lmEll(B,mx-1,my-1,Math.max(1,rx-2),Math.max(1,ry-2),p[1]);
  lmEll(B,mx-3,my-3,Math.max(1,Math.round(rx*.5)),Math.max(1,Math.round(ry*.4)),p[2]);
  for(let i=0;i<Math.round(rx*.9);i++){const a=lmH(seed*7+i)*6.28,r=lmH(seed*13+i)*.8;B(i%2?p[2]:p[0],Math.round(mx+Math.cos(a)*rx*r),Math.round(my+Math.sin(a)*ry*r),2,1)}
}
function lmBox(B,x,y,w,h,p){const s=Math.max(2,w>>3);B(LO,x-1,y-1,w+2,h+2);B(p[1],x,y,w,h);B(p[2],x,y,s,h);B(p[2],x,y,w,1);B(p[0],x+w-s,y,s,h);B(p[0],x,y+h-1,w,1)}
function lmTaper(B,y0,y1,l0,r0,l1,r1,p){   // top at y0 (l0..r0), bottom at y1 (l1..r1)
  B(LO,l0,y0-1,r0-l0,1);
  for(let yy=y0;yy<y1;yy++){
    const t=(yy-y0)/Math.max(1,y1-y0-1),l=Math.round(l0+(l1-l0)*t),r=Math.round(r0+(r1-r0)*t),s=Math.max(2,(r-l)>>2);
    B(LO,l-1,yy,1,1);B(LO,r,yy,1,1);B(p[1],l,yy,r-l,1);B(p[2],l,yy,s,1);B(p[0],r-s,yy,s,1);
  }
}
function lmBricks(B,x,y,w,h,c,rh){for(let r=0,yy=y+rh;yy<y+h;yy+=rh,r++){B(c,x,yy,w,1);for(let xx=x+((r%2)?3:7);xx<x+w;xx+=7)B(c,xx,yy-rh+1,1,rh-1)}}
function lmTufts(B,x0,x1,y,seed){for(let x=x0;x<x1;x+=3){const h=lmH(x*3+seed),tall=h>.65;B(h<.5?'#545f26':'#737c35',x,y-1-(tall?1:0),1,2+(tall?1:0));B('#808840',x+1,y-1,1,1)}}
function lmMoss(B,list,c){for(const[a,b,w,h]of list){B(c||'#4a7a28',a,b,w,h);B('#6a9a3a',a,b,Math.max(1,w-1),1)}}
function lmPoly(pts,x,y,fill,stroke){cx.beginPath();pts.forEach((q,i)=>i?cx.lineTo(x+q[0],y+q[1]):cx.moveTo(x+q[0],y+q[1]));cx.closePath();cx.fillStyle=fill;cx.fill();if(stroke){cx.strokeStyle=stroke;cx.lineWidth=1;cx.stroke()}}
function lmTrunk(B,p){
  lmTaper(B,-12,16,2,14,-3,19,p);
  B(p[0],5,-8,1,12);B(p[0],10,-3,1,14);B(p[0],7,6,1,6);B(p[2],4,-9,1,8);
  B(LO,5,5,7,11);B('#120a04',6,6,5,10);B(p[0],6,6,5,1);   // hollow
  B(LO,-6,13,6,3);B(p[1],-5,13,5,2);B(LO,16,13,7,3);B(p[1],16,13,6,2);   // roots
}
function lmRoof(B,mid,y0,y1,hw0,hw1,p){   // tiled roof, rows y0..y1, half width from hw0 (top) to hw1 (bottom), upturned eaves
  B(LO,mid-hw0,y0-1,hw0*2,1);
  for(let yy=y0;yy<=y1;yy++){
    const t=(yy-y0)/Math.max(1,y1-y0),hw=Math.round(hw0+(hw1-hw0)*t),l=mid-hw,r=mid+hw;
    B(LO,l-1,yy,1,1);B(LO,r,yy,1,1);B(p[1],l,yy,r-l,1);B(p[2],l,yy,Math.min(4,hw),1);
    if((yy-y0)%2===1)B(p[0],l,yy,r-l,1);
  }
  B(LO,mid-hw1-3,y1-2,3,1);B(p[1],mid-hw1-2,y1-2,2,1);B(LO,mid+hw1+1,y1-2,3,1);B(p[1],mid+hw1+1,y1-2,2,1);
  B(LO,mid-hw1-1,y1+1,hw1*2+3,1);B(p[0],mid-hw1,y1,hw1*2+1,1);
}

const LMDRAW={
  windmill(B,x,y,t){
    const pl=LP.plaster,st=LP.stone;
    const L=yy=>Math.round(-1-6*(yy+24)/39),Rr=yy=>Math.round(17+6*(yy+24)/39);
    lmTaper(B,-24,16,-1,17,-7,23,pl);
    for(let yy=9;yy<16;yy++){B(st[1],L(yy),yy,Rr(yy)-L(yy),1);B(st[2],L(yy),yy,3,1);B(st[0],Rr(yy)-4,yy,4,1)}
    lmBricks(B,-6,9,28,7,st[0],3);B(LO,L(9)-1,9,Rr(9)-L(9)+2,1);
    for(const by of[-6,-15]){B('#6a4a28',L(by),by,Rr(by)-L(by),2);B('#8a5c30',L(by),by,Rr(by)-L(by),1)}
    B('#6a4a28',8,-24,2,18);B('#6a4a28',8,-13,2,5);
    B(LO,4,5,10,11);B(LO,5,4,8,1);B('#5a3a1c',5,6,8,10);B('#7a5230',5,6,3,10);B('#4a2c14',9,6,1,10);B('#c9a040',11,11,1,1);
    B(LO,5,-13,8,9);B('#ffc860',6,-12,6,7);B('#ffe8a0',6,-12,6,1);B(LO,8,-12,2,7);B(LO,6,-10,6,1);glow(x+9,y-9,16,'255,200,96',.22);
    // cap
    for(let yy=-37;yy<=-26;yy++){
      const tt=(yy+37)/11,half=Math.round(3+9*tt),l=8-half,r=8+half;
      B(LO,l-1,yy,1,1);B(LO,r,yy,1,1);B('#7a3020',l,yy,r-l,1);B('#964428',l,yy,3,1);if((yy+37)%3===2)B('#561e12',l,yy,r-l,1);
    }
    B(LO,5,-38,6,1);B('#561e12',-5,-26,26,2);B(LO,-6,-27,28,1);B(LO,-6,-25,28,1);B('#964428',-5,-26,26,1);
    B(LO,7,-42,3,4);B('#c9a040',8,-41,1,3);
    lmMoss(B,[[-5,13,3,2],[19,12,3,3],[16,-3,2,2]]);
    // sails
    cx.save();cx.translate(x+8,y-31);cx.rotate(t*.6);
    for(let i=0;i<4;i++){
      cx.save();cx.rotate(i*Math.PI/2);
      cx.fillStyle=LO;cx.fillRect(-2,-27,4,27);cx.fillRect(0,-26,11,16);
      cx.fillStyle='#6a4a28';cx.fillRect(-1,-26,2,26);
      cx.fillStyle='#e8d8b0';cx.fillRect(1,-25,9,14);
      cx.fillStyle='#b89868';cx.fillRect(1,-19,9,1);cx.fillRect(5,-25,1,14);cx.fillRect(1,-25,9,1);
      cx.fillStyle='#fff6dc';cx.fillRect(2,-24,3,5);
      cx.restore();
    }
    cx.fillStyle=LO;cx.fillRect(-3,-3,6,6);cx.fillStyle='#8a5c30';cx.fillRect(-2,-2,4,4);cx.fillStyle='#c9a040';cx.fillRect(-1,-1,2,2);cx.restore();
    // barrel and tufts
    B(LO,-6,9,7,8);B('#8a5a22',-5,10,5,6);B('#a87a3a',-5,10,1,6);B('#4a3014',-5,12,5,1);B('#4a3014',-5,15,5,1);
    lmTufts(B,-9,25,16,1);
  },

  oakgiant(B,x,y,t){
    const bk=LP.wood;
    lmTrunk(B,bk);
    lmBlob(B,-4,-22,13,10,LP.red,1);lmBlob(B,20,-22,13,10,LP.red,2);lmBlob(B,8,-17,14,7,LP.red,8);
    lmBlob(B,8,-30,18,12,LP.orange,3);lmBlob(B,-3,-33,10,8,LP.orange,4);lmBlob(B,19,-34,10,8,LP.orange,5);lmBlob(B,8,-42,10,7,LP.orange,6);
    for(let i=0;i<4;i++){const ph=(t*.3+i*.27)%1;B(i%2?'#eaa638':'#d05a24',Math.round(-6+i*9+Math.sin(t*2+i*2)*4),Math.round(-14+ph*30),2,1)}
    lmTufts(B,-9,25,16,2);
  },

  vinetree(B,x,y,t){
    const bk=LP.wood;
    lmTrunk(B,bk);
    for(let i=0;i<5;i++)B('#2a8a3a',3+i*2,-10+i*5,2,2);
    lmBlob(B,-4,-22,13,10,LP.green,11);lmBlob(B,20,-22,13,10,LP.green,12);lmBlob(B,8,-17,14,7,LP.green,18);
    lmBlob(B,8,-30,18,12,LP.leaf,13);lmBlob(B,-3,-33,10,8,LP.leaf,14);lmBlob(B,19,-34,10,8,LP.leaf,15);lmBlob(B,8,-42,10,7,LP.leaf,16);
    for(let i=0;i<9;i++){
      const vx=-12+i*4.4|0,len=12+((i*7)%9),sx=Math.round(Math.sin(t*1.2+i)*1);
      B(LO,vx+sx-1,-20,3,len+1);B('#24602a',vx+sx,-20,1,len);B('#5ab04a',vx+sx+1,-20,1,len-3);
      if(i%3===0){B('#e86a8a',vx+sx-1,-20+len,3,2);B('#ffc0d0',vx+sx,-20+len,1,1)}
    }
    lmTufts(B,-9,25,16,3);
  },

  statue(B,x,y,t){
    const p=LP.teal;
    lmBox(B,-5,11,26,5,p);lmBox(B,-2,6,20,6,p);B(p[0],-1,8,18,1);
    lmTaper(B,-14,6,4,12,1,15,p);                 // robe
    B(p[0],8,-12,1,17);B(p[0],5,-6,1,10);B(p[2],3,-4,1,8);
    B(LO,-2,-12,3,10);B(p[1],-1,-11,2,8);B(LO,15,-12,3,10);B(p[0],15,-11,2,8);   // sleeves
    B(LO,3,-8,10,5);B(p[2],4,-7,8,3);B(p[0],4,-5,8,1);   // hands
    lmBlob(B,8,-20,6,6,p,21);B(LO,5,-22,6,5);B('#10201e',6,-21,4,3);   // hooded head
    cx.globalAlpha=.7+.3*Math.sin(t*2.5);B('#7af0e0',7,-14,2,2);cx.globalAlpha=1;   // little orb in the hands
    glow(x+8,y-12,18,'120,230,220',.25+.1*Math.sin(t*2.5));
    lmMoss(B,[[-3,12,6,3],[3,-1,3,6],[13,2,3,5],[1,8,4,2],[6,-17,4,2]],'#3e6a3a');
    for(const rx of[-8,-6,22,24]){B('#3e6a3a',rx,8,1,8);B('#6a9a3a',rx+1,10,1,6);B('#8a6a3a',rx,6+(rx&1),2,2)}
    lmTufts(B,-9,25,16,4);
  },

  ruintower(B,x,y,t){
    const p=LP.rust;
    lmBox(B,-3,-18,22,34,p);lmBricks(B,-3,-18,22,34,p[0],4);
    lmBox(B,-3,-34,9,17,p);lmBricks(B,-3,-34,9,17,p[0],4);
    lmBox(B,12,-28,7,11,p);lmBricks(B,12,-28,7,11,p[0],4);
    B(LO,6,-18,6,1);B(LO,7,-34,2,1);B(p[2],0,-35,3,1);   // broken edges
    B(LO,2,-27,3,8);B('#120c08',3,-26,1,6);B(LO,14,-24,2,6);B('#120c08',14,-23,1,4);   // slits
    B(LO,6,-12,3,8);B('#120c08',7,-11,1,6);
    B(LO,4,3,9,13);B(LO,5,2,7,1);B('#120c08',5,4,7,12);   // doorway
    lmMoss(B,[[-3,-6,7,3],[10,6,6,3],[14,-16,5,2],[-1,-24,3,3],[4,15,6,1]]);
    for(let i=0;i<5;i++)B('#2a6a2a',-3+(i%2),-24+i*4,1,5);   // ivy
    lmBox(B,-9,12,6,4,p);lmBox(B,20,13,5,3,p);lmBox(B,24,10,4,3,p);
    lmTufts(B,-10,28,16,5);
  },

  gallows(B,x,y,t){
    const w=LP.dead;
    lmBox(B,-8,12,34,4,w);lmBox(B,-4,8,26,4,w);B(w[0],-4,10,26,1);   // platform
    lmBox(B,-2,-40,5,48,w);lmBox(B,-2,-40,30,5,w);
    for(let i=0;i<8;i++){B(LO,3+i,-34+i-1,3,3);B(w[1],3+i,-34+i,2,2)}   // brace
    const sx=Math.round(Math.sin(t*1.3)*1);
    B(LO,20+sx,-35,3,15);B('#c8b890',21+sx,-35,1,14);B(LO,18+sx,-22,7,5);B('#c8b890',19+sx,-21,5,3);B(LO,20+sx,-20,3,1);   // rope and noose
    B('#1a1a22',10,-44,5,4);B('#2a2a36',11,-45,3,2);B('#e8a030',15,-43,2,1);B('#fff',13,-45,1,1);   // crow
    B('#4a3a2c',5,13,3,2);B('#8a8070',14,14,3,2);B('#e8e0c8',16,13,2,2);   // bones
    lmTufts(B,-10,28,16,6);
  },

  rootarch(B,x,y,t){
    const bk=LP.wood;
    lmEll(B,8,15,18,40,LO,true);lmEll(B,8,15,17,39,bk[0],true);lmEll(B,7,15,16,38,bk[1],true);lmEll(B,5,15,13,35,bk[2],true);lmEll(B,6,15,12,34,bk[1],true);
    lmEll(B,8,15,10,31,LO,true);lmEll(B,8,15,9,30,'#2a1a08',true);
    cx.globalAlpha=.55+.25*Math.sin(t*2);lmEll(B,8,15,8,27,'#8a5a14',true);lmEll(B,8,15,5,18,'#d8a030',true);cx.globalAlpha=1;
    glow(x+8,y-4,32,'255,210,100',.4);
    for(const[bx,by,bh]of[[-9,-10,24],[-7,-4,20],[21,-8,22],[19,-2,18]]){B(bk[0],bx,by,1,bh);B(bk[2],bx+2,by+3,1,bh-6)}
    B('#d8a030',7,-31,2,4);B('#fff0a0',7,-31,1,2);   // glyph
    B(LO,-13,12,9,4);B(bk[1],-12,12,8,3);B(LO,19,12,9,4);B(bk[1],19,12,8,3);
    lmMoss(B,[[-10,-2,3,4],[21,2,3,5]],'#3a6a2a');
    for(let i=0;i<4;i++){const ph=(t*.25+i*.25)%1;cx.globalAlpha=1-ph;B('#ffe9a0',Math.round(2+i*4+Math.sin(t+i)*2),Math.round(10-ph*28),1,1);cx.globalAlpha=1}
    lmTufts(B,-16,32,16,7);
  },

  shroomtower(B,x,y,t){
    const c=LP.cream,m=LP.cap;
    lmTaper(B,-22,16,3,13,1,15,c);
    lmBox(B,-1,-4,18,3,c);B(c[0],0,-2,16,1);   // ring
    B(LO,6,6,5,10);B(LO,7,5,3,1);B('#5a2a10',7,7,3,9);B('#ffc860',7,9,3,3);B('#ffe8a0',7,9,1,3);   // little door
    B(LO,10,-14,4,4);B('#ffc860',11,-13,2,2);glow(x+12,y-12,14,'255,200,96',.2);
    lmEll(B,8,-21,24,16,LO,true);lmEll(B,8,-21,23,15,m[0],true);lmEll(B,6,-21,20,13,m[1],true);lmEll(B,2,-23,14,9,m[2],true);lmEll(B,5,-22,12,7,m[1],true);
    B(LO,-16,-22,48,1);B(m[0],-15,-21,46,3);for(let gx=-14;gx<31;gx+=3)B(LO,gx,-21,1,3);B(LO,-15,-18,46,1);   // gills
    for(const[sx,sy,sr]of[[-4,-34,4],[10,-38,5],[21,-32,4],[1,-27,3],[15,-27,3],[26,-25,2]]){lmEll(B,sx,sy,sr,Math.max(1,sr>>1),'#fff0f8');B('#e8b8d8',sx-sr+1,sy+1,sr*2-2,1)}
    for(let i=0;i<5;i++){const ph=(t*.3+i*.2)%1;cx.globalAlpha=Math.sin(ph*3.14);B('#a8fff0',Math.round(-10+i*8+Math.sin(t*1.5+i)*3),Math.round(-20-ph*22),1,1);cx.globalAlpha=1}
    lmTufts(B,-5,22,16,8);B('#e87a58',-6,14,3,2);B('#fff0f8',-5,13,1,1);
  },

  chimney(B,x,y,t){
    const p=LP.brick;
    lmTaper(B,-46,14,2,14,-2,18,p);
    for(let yy=-44;yy<14;yy+=4)B(p[0],-1,yy,1,1);
    lmBricks(B,-2,-46,20,60,p[0],4);
    for(const by of[-30,-10]){B(LO,-4,by-1,24,5);B('#3a3a44',-3,by,22,3);B('#6a6a78',-3,by,22,1)}
    lmBox(B,-4,-52,24,6,['#2a2a32','#4a4a54','#6a6a78']);B('#1a0e08',1,-51,14,2);
    B('#2a1a12',3,-44,3,6);B('#2a1a12',11,-42,2,8);   // soot
    lmBox(B,-6,12,28,4,LP.stone);
    B(LO,3,5,10,10);B('#120804',4,6,8,9);
    const fl=.5+.5*Math.sin(t*9);cx.globalAlpha=.6+.3*fl;B('#ff7a20',5,10,6,5);B('#ffd060',6,12,4,3);cx.globalAlpha=1;glow(x+8,y+10,26,'255,120,40',.28+.12*fl);
    for(let i=0;i<4;i++){const ph=(t*.25+i*.25)%1;cx.globalAlpha=(1-ph)*.55;B(i%2?'#7a726a':'#5a544e',Math.round(4+Math.sin(t+i)*3-ph*3),Math.round(-56-ph*30),Math.round(8+ph*8),Math.round(5+ph*4));cx.globalAlpha=1}
    lmTufts(B,-8,24,16,9);
  },

  pagoda(B,x,y,t){
    const wl=LP.lacquer,rf=LP.tile;
    lmBox(B,-7,13,30,3,LP.stone);
    lmBox(B,-4,3,24,10,wl);B(LO,5,5,6,8);B('#2a1008',6,6,4,7);for(const px of[-3,17])B('#e8c858',px,3,2,10);
    lmRoof(B,8,-4,3,9,18,rf);
    lmBox(B,1,-12,14,8,wl);B('#e8c858',1,-12,14,1);B(LO,6,-10,4,5);B('#ffc860',7,-9,2,3);
    lmRoof(B,8,-18,-12,7,14,rf);
    lmBox(B,3,-24,10,6,wl);B('#e8c858',3,-24,10,1);
    lmRoof(B,8,-30,-24,4,10,rf);
    B(LO,7,-44,3,14);B('#e8c858',8,-43,1,13);B(LO,6,-47,5,4);B('#fff0a0',7,-46,3,2);
    for(const[bx,by]of[[-6,3],[22,3],[-1,-12],[16,-12]]){B('#e8c858',bx,by,2,2);B(LO,bx,by+2,2,1)}
    lmTufts(B,-8,24,16,10);
  },

  obelisk(B,x,y,t){
    const p=LP.sand;
    lmBox(B,-5,12,26,4,p);lmBox(B,-2,8,20,5,p);
    lmTaper(B,-48,8,3,13,0,16,p);
    for(let i=0;i<5;i++){B('#8a6a30',5,-42+i*10,6,1);B('#8a6a30',7,-40+i*10,2,2)}
    B(LO,6,-60,4,1);for(let i=0;i<6;i++){B(LO,3+i/2|0,-54+i-1,10-i,1)}
    // pyramidion
    for(let yy=-58;yy<-48;yy++){const hw=Math.round((yy+58)*.5)+1;B(LO,8-hw-1,yy,1,1);B(LO,8+hw,yy,1,1);B('#e8c040',8-hw,yy,hw*2,1);B('#fff0a0',8-hw,yy,Math.max(1,hw>>1),1)}
    B(LO,7,-60,2,2);
    glow(x+8,y-52,16,'255,220,110',.3+.12*Math.sin(t*2));
    lmMoss(B,[[-3,13,5,2]],'#7a8a3a');
    lmTufts(B,-8,24,16,11);
  },

  stones(B,x,y,t){
    const p=['#5a5a52','#9a9a92','#c4c4ba'];
    const men=(mx,h,w,s)=>{lmTaper(B,16-h,16,mx+2,mx+w-1,mx,mx+w,p);B(p[0],mx+w-3,16-h+3,1,h-6);lmMoss(B,[[mx,10,w,3],[mx+1,16-h+8,2,3]],'#5a8a3a');B('#c8c070',mx+2,16-h+5+s,2,1)};
    men(-12,32,9,0);men(10,32,9,1);
    lmBox(B,-14,-22,34,7,p);B(p[0],-14,-16,34,1);lmBricks(B,-14,-22,34,7,p[0],7);
    men(-2,15,8,2);men(20,20,8,3);
    const g=.5+.5*Math.sin(t*2);cx.globalAlpha=.5+.4*g;B('#ffd070',-9,-10,2,5);B('#ffd070',13,-8,2,4);B('#ffd070',0,-19,2,2);cx.globalAlpha=1;
    glow(x+8,y-8,28,'255,210,112',.12+.08*g);
    lmTufts(B,-14,30,16,12);
  },

  spike(B,x,y,t){
    const p=LP.obsidian,g=.5+.5*Math.sin(t*3);
    lmTaper(B,-54,16,7,9,-4,20,p);
    lmTaper(B,-26,16,-12,-8,-12,2,p);lmTaper(B,-18,16,22,26,18,30,p);
    B(p[2],5,-48,1,40);
    cx.globalAlpha=.6+.4*g;
    B('#c84a1a',7,-40,2,8);B('#ff8a30',5,-26,2,14);B('#c84a1a',9,-8,2,10);B('#ffd060',6,-22,1,5);B('#ff8a30',-8,-10,1,10);B('#ff8a30',24,-6,1,8);
    cx.globalAlpha=1;
    glow(x+8,y-4,30,'255,120,40',.22+.1*g);
    for(let i=0;i<4;i++){const ph=(t*.35+i*.25)%1;cx.globalAlpha=1-ph;B('#ffb040',Math.round(2+i*4+Math.sin(t*2+i)*2),Math.round(10-ph*50),1,1);cx.globalAlpha=1}
    B(LO,-10,13,8,3);B(p[1],-9,13,7,2);B(LO,18,13,9,3);B(p[1],19,13,7,2);
  },

  crystals(B,x,y,t){
    const g=.5+.5*Math.sin(t*2);
    glow(x+8,y-14,34,'200,170,255',.2+.1*g);
    const cr=(mx,h,w,c1,c2,c3)=>{
      lmPoly([[mx-w,16],[mx-w+1,16-h*.7],[mx,16-h],[mx,16]],x,y,c1,LO);
      lmPoly([[mx,16-h],[mx+w-1,16-h*.7],[mx+w,16],[mx,16]],x,y,c2,LO);
      lmPoly([[mx-w+2,16-2],[mx-w+3,16-h*.65],[mx-1,16-h+3],[mx-1,16-2]],x,y,c3);
    };
    cr(-6,38,7,'#c8a0ff','#8a62c8','#e8d8ff');
    cr(10,54,8,'#a0d8ff','#5a94c8','#e0f4ff');
    cr(24,32,6,'#ff9ae0','#c25aa0','#ffd8f4');
    cr(2,22,5,'#d8b8ff','#9a72d0','#f0e4ff');
    cx.globalAlpha=g;B('#fff',9,-30,2,2);B('#fff',-8,-14,1,1);B('#fff',25,-8,1,1);cx.globalAlpha=1;
    lmTufts(B,-12,30,16,13);
  },

  icearch(B,x,y,t){
    const p=LP.ice,g=.5+.5*Math.sin(t*2);
    lmEll(B,8,16,19,42,LO,true);lmEll(B,8,16,18,41,p[0],true);lmEll(B,7,16,17,40,p[1],true);lmEll(B,5,16,13,36,p[2],true);lmEll(B,8,16,12,34,p[1],true);
    lmEll(B,8,16,10,31,LO,true);lmEll(B,8,16,9,30,'#16283c',true);
    cx.globalAlpha=.25+.15*g;lmEll(B,8,16,8,28,'#bfe4ff',true);cx.globalAlpha=1;
    for(const[bx,by,bh]of[[-10,-6,20],[-8,-12,16],[22,-4,18],[20,-10,14]]){B(p[0],bx,by,1,bh);B('#fff',bx+2,by+2,1,bh-6)}
    B(LO,-13,8,9,8);B(p[1],-12,9,7,6);B(p[2],-12,9,3,3);B(LO,20,9,9,7);B(p[1],21,10,7,5);B(p[2],21,10,3,2);   // icy feet
    cx.globalAlpha=g;B('#fff',-2,-30,3,3);B('#fff',16,-26,2,2);B('#fff',-14,-2,1,1);B('#fff',28,-4,1,1);cx.globalAlpha=1;
    glow(x+8,y-10,30,'160,210,255',.12+.06*g);
    for(let i=0;i<4;i++){const ph=(t*.2+i*.25)%1;cx.globalAlpha=1-ph;B('#fff',Math.round(-6+i*9),Math.round(-ph*10-14+ph*26),1,1);cx.globalAlpha=1}
  }
};
function drawLandmark(k,x,y,t,R_){
  shadow(x+8,y+16,18);
  const f=LMDRAW[k];if(f)f(R_,x,y,t);
}

// ---------- the rune shrine: dais, carved ring and four ancient columns ----------
function drawRune(p,x,y,t,R_){
  const B=R_,done=flags.trials&&flags.trials[p.id],cxp=x+8,cyp=y+8,pu=.5+.5*Math.sin(t*3),sp=LP.stone;
  lmEll(B,8,10,22,12,LO);lmEll(B,8,9,21,11,sp[0]);lmEll(B,8,8,20,10,sp[1]);lmEll(B,8,8,16,8,sp[0]);lmEll(B,8,8,15,7,'#76726a');
  for(let i=0;i<8;i++){const a=i*TAU/8+.4;B(sp[0],Math.round(8+Math.cos(a)*19),Math.round(8+Math.sin(a)*9),1,1);B(sp[0],8+Math.round(Math.cos(a)*9),8+Math.round(Math.sin(a)*4),Math.round(Math.cos(a)*7),1)}
  lmMoss(B,[[-12,8,3,2],[22,10,3,2],[2,16,4,2]]);
  cx.save();
  if(!done)glow(cxp,cyp,34+4*pu,'255,210,100',.42);
  cx.strokeStyle=done?'#5a5a52':'#ffd070';cx.lineWidth=1.5;
  for(const rr of[10,16]){cx.beginPath();cx.ellipse(cxp,cyp,rr,rr*.62,0,0,TAU);cx.stroke()}
  cx.fillStyle=done?'#6a6a60':'#ffe9a0';
  for(let i=0;i<6;i++){const a=i*TAU/6+(done?0:t*.5);cx.fillRect(Math.round(cxp+Math.cos(a)*13-1),Math.round(cyp+Math.sin(a)*8-1),3,3)}
  if(!done){cx.fillStyle=`rgba(255,230,150,${.5+.4*pu})`;cx.fillRect(cxp-1,cyp-6,3,12);cx.fillRect(cxp-6,cyp-1,12,3)}
  cx.restore();
}
function drawPillar(p,x,y,t,R_){
  const B=R_,sp=LP.stone,g=.5+.5*Math.sin(t*2+x);
  shadow(x+8,y+15,8);
  lmBox(B,1,12,14,4,sp);
  lmBox(B,3,-5,10,17,sp);B(sp[0],7,-4,1,16);B(sp[2],5,-4,1,15);B(sp[0],10,-4,1,16);
  lmBox(B,1,-9,14,5,sp);B(sp[0],1,-6,14,1);
  B(LO,5,-10,3,1);B(sp[2],9,-10,2,1);   // chipped top
  cx.globalAlpha=.55+.4*g;B('#ffd070',7,2,2,5);B('#fff0b0',7,3,1,2);cx.globalAlpha=1;
  lmMoss(B,[[3,9,5,3],[11,-2,2,5],[2,-8,4,2]]);
  lmTufts(B,0,17,16,14);
}
