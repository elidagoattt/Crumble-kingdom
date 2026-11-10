/* Crumble Kingdom: code-drawn smooth art kit (cats, foes, bosses, scenery).
 * Everything here is drawn with canvas paths so it stays sharp at any size. js/art.js wraps this kit and lets a
 * PNG in client/assets/ replace any piece (see ART.md).
 */
(()=>{'use strict';if(window.CKKit)return;
const OUT='#3a2433';
const rng=seed=>{let x=Math.sin(seed*999.13)*43758.5453;return ()=>{x=Math.sin(x*12.9898+78.233)*43758.5453;return x-Math.floor(x)}};
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,gg=n>>8&255,b=n&255;const f=amt<0?0:255,p=Math.abs(amt);r=Math.round((f-r)*p+r);gg=Math.round((f-gg)*p+gg);b=Math.round((f-b)*p+b);return '#'+((1<<24)+(r<<16)+(gg<<8)+b).toString(16).slice(1)}
const E=(g,x,y,rx,ry,fill,stroke,lw,rot)=>{g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.lineWidth=lw||1.4;g.strokeStyle=stroke;g.stroke()}};
const C=(g,x,y,r,fill,stroke,lw)=>E(g,x,y,r,r,fill,stroke,lw);
function RR(g,x,y,w,h,r,fill,stroke,lw){g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.lineWidth=lw||1.4;g.strokeStyle=stroke;g.stroke()}}
function poly(g,pts,fill,stroke,lw){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.lineWidth=lw||1.4;g.strokeStyle=stroke;g.lineJoin='round';g.stroke()}}
function shadow(g,x,y,rx,ry,a){E(g,x,y,rx,ry||rx*.32,'rgba(20,10,30,'+(a||.22)+')')}
// ------------------------------------------------------------------ cats
const BIRMAN={base:'#f6ead3',stripe:'#e8d6b6',light:'#fffaf0',eye:'#4a8ad8',nose:'#c98a86',earIn:'#7a5a4a',white:['paws'],points:'#6a4a3c'};
// Carnival cats (original designs): Jester and Prankster.
const EXTRA={jester:{name:'Jester',base:'#f6f2ea',stripe:'#e2dacb',light:'#ffffff',white:[],eye:'#2fbf8a',nose:'#f29ab0',earIn:'#f6b9c8',hat:'jester'},
 antie:{name:'Antie',base:'#f2d06a',stripe:'#d9b44a',light:'#fff0a8',white:[],eye:'#2a1d2f',nose:'#2a1d2f',earIn:'#e8a64a',dots:true,hair:'#7a4a2a',xeye:true,robe:true,tongue:true},
 klina:{name:'Klina',base:'#ecc996',stripe:'#d4ab72',light:'#fff2d8',white:['muzzle'],eye:'#7a4ad8',nose:'#e88a9a',earIn:'#f2b0a8',glasses:true,bow:'#ff8fbf',outfit:true},
 prankster:{name:'Prankster',base:'#6b7f8c',stripe:'#53636e',light:'#93a7b4',tabby:true,white:['chest','muzzle','paws'],eye:'#f2b23a',nose:'#e88a9a',earIn:'#e9a3b3',hat:'beanie',wink:true}};
function coatOf(id){const C0=window.CKCoats||{};if(id==='birman')return BIRMAN;if(EXTRA[id])return EXTRA[id];return C0[id]||C0.astro||{base:'#f0953c',stripe:'#c4631f',light:'#ffbf73',tabby:true,white:[],eye:'#e3a92f',nose:'#e98a8f',earIn:'#f4a9a6'}}
function cat(g,x,y,s,o={}){const c=o.coat||coatOf(o.id||'astro'),t=o.t||0,pose=o.pose||'idle',W=c.white||[],dark=c.dark;
 g.save();g.translate(x,y);g.scale((o.flip?-1:1)*s,s);
 const walk=pose==='walk'?Math.sin(t*12):0,bob=pose==='walk'?Math.abs(Math.cos(t*12))*1.6:pose==='idle'?Math.sin(t*3)*.6:pose==='win'?Math.abs(Math.sin(t*6))*4:pose==='dance'?Math.abs(Math.sin(t*6))*3:pose==='play'?Math.abs(Math.sin(t*5))*5:pose==='nap'?-4:0;
 const lean=pose==='attack'?.18:pose==='hurt'?-.2:pose==='dance'?Math.sin(t*6)*.13:pose==='play'?.16:0,lift=pose==='jump'?4:0;
 shadow(g,0,0,14,4.2);
 // squash (+) and stretch (-), anchored at the feet
 const sq=(o.squash||0)+(pose==='nap'?.18:0);if(sq)g.scale(1+sq,1-sq);
 g.translate(0,-bob-lift);g.rotate(lean);
 const base=c.base,str=c.stripe,lt=c.light,pt=c.points,tux=c.patch==='tux',cal=c.patch==='calico';
 const furTop=pt?pt:tux?'#2f2836':base;
 // tail
 g.lineCap='round';g.beginPath();g.moveTo(-11,-12);const tw=Math.sin(t*4)*3;g.bezierCurveTo(-24,-14,-24+tw,-30,-16+tw,-34);g.lineWidth=7.2;g.strokeStyle=OUT;g.stroke();g.lineWidth=5;g.strokeStyle=pt||(tux?'#2f2836':base);g.stroke();
 if(c.tabby){g.lineWidth=1.6;g.strokeStyle=str;for(let i=0;i<3;i++){g.beginPath();const k=.3+i*.22;g.arc(-18+i*1.5+tw*k,-20-i*4,2.6,0,Math.PI);g.stroke()}}
 // legs (back pair then front pair)
 const leg=(lx,ph,front)=>{const sw=pose==='jump'?-3:Math.sin(ph)*3.2;const col=W.includes('paws')?'#ffffff':pt||(tux&&!front?'#2f2836':base);RR(g,lx-3+sw*.3,-9,6,9+(pose==='jump'?-3:0),3,col,OUT,1.4);};
 leg(-7,walk*2+Math.PI,false);leg(6,walk*2,false);
 // body
 const bodyG=g.createLinearGradient(0,-24,0,-2);bodyG.addColorStop(0,lt);bodyG.addColorStop(.35,base);bodyG.addColorStop(1,shade(base,-.12));
 E(g,0,-12,14,10,bodyG,OUT,1.6);
 if(tux)E(g,-4,-15,9,7,'#2f2836');if(cal){E(g,-6,-16,5,4,'#e8913a');E(g,5,-18,4,3,'#2f2836')}
 if(c.tabby){g.lineWidth=1.8;g.strokeStyle=str;g.lineCap='round';for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(i*5-2,-21);g.quadraticCurveTo(i*5,-16,i*5-1,-12);g.stroke()}}
 if(W.includes('chest')||W.includes('belly'))E(g,8,-10,6,6.5,'#ffffff');
 if(pt)E(g,0,-12,13,9,'rgba(0,0,0,0)');
 leg(-3,walk*2,true);leg(9,walk*2+Math.PI,true);
 if(c.dots){const r=rng(3);for(let k=0;k<14;k++){C(g,-10+r()*20,-19+r()*13,.7,'rgba(90,60,20,.55)')}}
 if(c.outfit){RR(g,-12,-12,24,10,4,'#3a2f4a',OUT,1.4);g.beginPath();g.ellipse(0,-15,13,7.5,0,Math.PI,0);g.lineTo(13,-12);g.lineTo(-13,-12);g.closePath();g.fillStyle='#8a5ad8';g.fill();g.lineWidth=1.4;g.strokeStyle=OUT;g.stroke();
  E(g,-10,-19,4.4,3.4,'#a57cf0',OUT,1.2);E(g,11,-19,4.4,3.4,'#a57cf0',OUT,1.2);
  g.save();g.translate(-4,-14.5);g.scale(1.15,1.15);poly(g,[[-2.6,-3.4],[2.6,-3.4],[0,0],[2.6,3.4],[-2.6,3.4],[0,0]],'#ffe6a8',OUT,.9);poly(g,[[-1.6,2.6],[1.6,2.6],[0,.6]],'#e0a23a');RR(g,-3.2,-4.4,6.4,1.4,.6,'#7a4a2a');RR(g,-3.2,3,6.4,1.4,.6,'#7a4a2a');g.restore()}
 if(c.robe){const gr=g.createLinearGradient(0,-24,0,0);gr.addColorStop(0,'#3b9de0');gr.addColorStop(1,'#8fd3f5');
  g.beginPath();g.moveTo(-8,-22);g.lineTo(10,-22);g.lineTo(15,-4);for(let k=0;k<6;k++){const x0=15-k*5.4;g.quadraticCurveTo(x0-2.7,-1+(k%2?2:-1),x0-5.4,-4)}g.closePath();g.fillStyle=gr;g.fill();g.lineWidth=1.5;g.strokeStyle=OUT;g.stroke();
  g.strokeStyle='#1d1a2a';g.lineWidth=1.2;g.beginPath();g.moveTo(1,-22);g.lineTo(2,-3);g.stroke();g.lineWidth=1.8;for(const y of [-16,-9]){g.beginPath();g.moveTo(-3,y);g.lineTo(6,y);g.stroke()}
  for(const x of [-4,8])RR(g,x,-6,6,3,1.5,'#2fbfaa',OUT,1)}
 // paw out when attacking
 if(pose==='attack'){g.save();g.rotate(-.5);RR(g,10,-20,12,6,3,W.includes('paws')?'#fff':base,OUT,1.4);g.restore()}
 if(pose==='win'||pose==='dance'){const up=pose==='dance'?Math.sin(t*6):1;const pc=W.includes('paws')?'#fff':base;RR(g,6,-34-(up>0?4:0),5,12,2.5,pc,OUT,1.4);RR(g,-8,-34-(up<0?4:0),5,12,2.5,pc,OUT,1.4)}
 if(pose==='play'){g.save();g.rotate(-.7);RR(g,8,-22,12,6,3,W.includes('paws')?'#fff':base,OUT,1.4);g.restore()}
 // cape (Kitty Pass royal outfit)
 if(o.cape){poly(g,[[-8,-22],[-20,-6],[-6,-4]],'#c9302c',OUT,1.2)}
 if(c.hat==='jester'){for(let k=0;k<7;k++){const a=Math.PI*(.15+k*.12);C(g,6+Math.cos(a)*-9,-19+Math.sin(a)*3.4,3.2,k%2?'#ffc83a':'#1fae7a',OUT,1)}}
 if(c.hat==='beanie'){poly(g,[[6,-19],[-2,-23],[-2,-15]],'#9be35a',OUT,1.1);poly(g,[[6,-19],[14,-23],[14,-15]],'#9be35a',OUT,1.1);C(g,1,-20,.9,'#ff6f9a');C(g,11,-18,.9,'#ff6f9a');C(g,6,-19,2.2,'#ff6f9a',OUT,1)}
 // head
 g.save();g.translate(6,-29);g.rotate(pose==='hurt'?-.15:0);
 const ear=(ex,dir)=>{poly(g,[[ex-6*dir,-6],[ex+1*dir,-19],[ex+7*dir,-7]],pt||(tux?'#2f2836':base),OUT,1.6);poly(g,[[ex-3*dir,-7],[ex+1*dir,-15],[ex+4*dir,-7.5]],c.earIn)};
 ear(-7,1);ear(7,-1);
 const headG=g.createRadialGradient(-3,-6,2,0,0,16);headG.addColorStop(0,lt);headG.addColorStop(.5,base);headG.addColorStop(1,shade(base,-.1));
 E(g,0,0,14,12.5,headG,OUT,1.6);
 if(pt)E(g,3,2,8.5,7,pt);
 if(c.dots){const r=rng(5);for(let k=0;k<12;k++){const a=r()*6.28,d=r()*11;C(g,Math.cos(a)*d,Math.sin(a)*d*.85,.65,'rgba(90,60,20,.55)')}}
 if(tux){g.save();g.beginPath();g.ellipse(0,0,14,12.5,0,0,Math.PI*2);g.clip();E(g,-6,-8,10,8,'#2f2836');E(g,8,-8,7,6,'#2f2836');g.restore()}
 if(cal){g.save();g.beginPath();g.ellipse(0,0,14,12.5,0,0,Math.PI*2);g.clip();E(g,-7,-7,7,6,'#e8913a');E(g,8,-9,6,5,'#2f2836');g.restore()}
 if(c.tabby){g.lineWidth=1.6;g.strokeStyle=str;g.lineCap='round';for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(i*3.5,-12);g.lineTo(i*3,-7.5);g.stroke()}g.beginPath();g.moveTo(-13,0);g.lineTo(-9,1);g.moveTo(-13,3.5);g.lineTo(-9,3.5);g.stroke()}
 if(W.includes('blaze'))poly(g,[[1,-12],[4,-12],[5,2],[0,2]],'#ffffff');
 if(W.includes('muzzle'))E(g,4,5,6.5,4.5,'#ffffff');
 // face (3/4 view, looking right)
 const blink=(t%3.6)<.12&&pose!=='hurt';
 if(pose==='hurt'){g.lineWidth=1.6;g.strokeStyle=OUT;g.beginPath();g.moveTo(-3,-2);g.lineTo(1,0);g.lineTo(-3,2);g.moveTo(11,-2);g.lineTo(7,0);g.lineTo(11,2);g.stroke()}
 else if(c.wink&&(pose==='idle'||pose==='walk')&&!blink){g.lineWidth=1.6;g.strokeStyle=OUT;g.beginPath();g.moveTo(11.6,1);g.arc(9,1,2.6,Math.PI*1.1,Math.PI*1.9);g.stroke();const ex=-1;E(g,ex,0,3,3.6,'#2a1d2f');E(g,ex+.3,.4,2.2,2.8,c.eye);E(g,ex+.2,.8,1.2,1.8,'#1a1020');C(g,ex-.9,-1.3,1,'#ffffff')}
 else if(pose==='win'||pose==='dance'||pose==='nap'||blink){g.lineWidth=1.6;g.strokeStyle=OUT;g.beginPath();g.arc(-1,1,2.6,Math.PI*1.1,Math.PI*1.9);g.moveTo(11.6,1);g.arc(9,1,2.6,Math.PI*1.1,Math.PI*1.9);g.stroke()}
 else if(c.xeye){E(g,-1,0,3.6,4.2,'#ffffff',OUT,1.1);E(g,-.6,.5,2.6,3.2,'#2a1d2f');C(g,-1.6,-.8,1,'#fff');C(g,9,0,3.2,'#f4f0e8',OUT,1);g.strokeStyle=OUT;g.lineWidth=1.5;g.beginPath();g.moveTo(7,-2);g.lineTo(11,2);g.moveTo(11,-2);g.lineTo(7,2);g.stroke()}
 else{for(const ex of [-1,9]){E(g,ex,0,3,3.6,'#2a1d2f');E(g,ex+.3,.4,2.2,2.8,c.eye);E(g,ex+.2,.8,1.2,1.8,'#1a1020');C(g,ex-.9,-1.3,1,'#ffffff');C(g,ex+1,1.6,.5,'#ffffff')}}
 if(c.xeye)poly(g,[[4.5,3.4],[6,6],[3,6]],c.nose);else poly(g,[[3.4,4.2],[5.6,4.2],[4.5,5.6]],c.nose);
 if(c.tongue&&(pose==='idle'||pose==='walk'||pose==='nap'))E(g,5.4,8,1.3,1.7,'#e84a5a',OUT,.7);
 g.lineWidth=1.1;g.strokeStyle=OUT;g.beginPath();g.moveTo(4.5,5.6);g.quadraticCurveTo(3.4,7.5,2,6.6);g.moveTo(4.5,5.6);g.quadraticCurveTo(5.6,7.5,7,6.6);g.stroke();
 if(pose==='attack'||pose==='win'||pose==='dance'){E(g,4.5,8,2,1.6,'#c94c6a')}
 E(g,-5,5,2.6,1.5,'rgba(255,120,150,.35)');E(g,13,5,2.2,1.4,'rgba(255,120,150,.35)');
 g.strokeStyle='rgba(58,36,51,.55)';g.lineWidth=.8;g.beginPath();g.moveTo(10,5);g.lineTo(17,4);g.moveTo(10,6.5);g.lineTo(17,7);g.moveTo(-2,5);g.lineTo(-9,4);g.stroke();
 if(c.glasses){g.lineWidth=1.6;g.strokeStyle='#4a2a5a';for(const ex of [-1,9]){C(g,ex,0,4.8,'rgba(220,240,255,.28)','#4a2a5a',1.6)}g.beginPath();g.moveTo(3.8,-.5);g.quadraticCurveTo(4,-2,5.2,-.5);g.moveTo(-5.8,-.5);g.lineTo(-12,-2.4);g.moveTo(13.8,-.5);g.lineTo(14.6,-2);g.stroke();for(const ex of [-1,9])E(g,ex-2,-2.2,1.4,.8,'rgba(255,255,255,.7)',null,0,-.6)}
 if(c.bow){g.save();g.translate(8,-13);g.rotate(.25);poly(g,[[0,0],[-7,-4],[-7,4]],c.bow,OUT,1.2);poly(g,[[0,0],[7,-4],[7,4]],c.bow,OUT,1.2);C(g,0,0,2.2,shade(c.bow,-.15),OUT,1);g.restore()}
 if(c.hair){for(const [hx,hy,hr] of [[-8,-10,5],[-3,-13,5.4],[3,-13,5.2],[8,-10,4.8],[-11,-5,4],[11,-5,3.8]]){C(g,hx,hy,hr,c.hair,OUT,1.2)}for(const [hx,hy] of [[-8,-11],[-3,-14],[3,-14],[8,-11]]){g.strokeStyle='#a8743a';g.lineWidth=1;g.beginPath();g.arc(hx,hy,2.2,0,4);g.stroke()}}
 if(c.hat==='jester'){const sw=Math.sin(t*4)*1.5;
  const cone=(pts,col)=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);g.quadraticCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1]);g.quadraticCurveTo(pts[3][0],pts[3][1],pts[4][0],pts[4][1]);g.closePath();g.fillStyle=col;g.fill();g.lineWidth=1.4;g.strokeStyle=OUT;g.stroke()};
  cone([[-13,-8],[-20,-18],[-24+sw,-26],[-12,-20],[-4,-10]],'#1fae7a');cone([[-5,-10],[-2,-24],[1+sw*.5,-32],[4,-22],[5,-10]],'#ffc83a');cone([[4,-10],[14,-20],[25+sw,-24],[18,-14],[13,-8]],'#1fae7a');
  for(const [bx,by] of [[-24+sw,-26],[1+sw*.5,-32],[25+sw,-24]]){C(g,bx,by,2.6,'#ffd45c',OUT,1);C(g,bx-.7,by-.7,.8,'#fff')}
  RR(g,-14,-11,28,5,2.5,'#7a2fbf',OUT,1.2);for(let k=-10;k<=10;k+=5)poly(g,[[k,-11],[k+2,-8.5],[k,-6],[k-2,-8.5]],'#ffc83a');
  A_star(g,-8,4,2.2,'#ffc83a')}
 if(c.hat==='beanie'){g.beginPath();g.moveTo(-9,-8);g.quadraticCurveTo(-9,-21,0,-21);g.quadraticCurveTo(9,-21,9,-8);g.closePath();g.fillStyle='#ffc83a';g.fill();g.save();g.clip();g.fillStyle='#ff8a3c';g.fillRect(-10,-17,20,3);g.fillStyle='#2fb5c9';g.fillRect(-10,-12,20,3);g.restore();g.lineWidth=1.4;g.strokeStyle=OUT;g.stroke();
  RR(g,-10.5,-9.5,21,3.4,1.7,'#2fb5c9',OUT,1.1);RR(g,-.8,-25,1.6,5,.8,OUT);const sp=Math.cos(t*20);E(g,0,-25.5,9*Math.abs(sp)+1,1.6,sp>0?'#ff4f6a':'#3b8bff',OUT,.9);C(g,0,-25.5,1.2,'#ffd45c')}
 if(o.crown){poly(g,[[-6,-11],[-7,-19],[-3,-15],[0,-21],[3,-15],[7,-19],[6,-11]],'#ffd45c',OUT,1.2);C(g,0,-14,1.4,'#ff6f9a')}
 g.restore();
 if(pose==='nap'){g.fillStyle='#ffffff';g.strokeStyle=OUT;g.lineWidth=2.4;g.font='900 9px system-ui';for(let k=0;k<3;k++){const q=(t*.6+k/3)%1;g.globalAlpha=1-q;g.strokeText('z',18+q*10+k*2,-40-q*18);g.fillText('z',18+q*10+k*2,-40-q*18)}g.globalAlpha=1}
 g.restore()}
// ------------------------------------------------------------------ enemies
function eyes(g,x,y,r,col,mean){C(g,x,y,r,'#fff',OUT,1);C(g,x+r*.25,y+r*.15,r*.55,col||'#2a1d2f');if(mean){g.lineWidth=1.3;g.strokeStyle=OUT;g.beginPath();g.moveTo(x-r,y-r*1.4);g.lineTo(x+r,y-r*.7);g.stroke()}}
function foe(g,x,y,s,k,o={}){const t=o.t||0,hit=o.hit>0;g.save();g.translate(x,y);g.scale((o.flip?-1:1)*s,s);if(o.squash)g.scale(1+o.squash,1-o.squash);
 const F=c=>hit?'#ffffff':c;const fly=k==='crow'||k==='bat'||k==='bee';shadow(g,0,fly?0:0,fly?7:10,fly?2:3,fly?.12:.22);
 if(fly)g.translate(0,-22+Math.sin(t*5)*3);
 const bob=Math.abs(Math.sin(t*8))*1.5;g.translate(0,-bob);
 if(k==='mouse'||k==='guard'){g.lineCap='round';g.beginPath();g.moveTo(9,-6);g.quadraticCurveTo(20,-4,20,-14);g.lineWidth=2;g.strokeStyle=F('#e8a0b6');g.stroke();
  E(g,0,-8,11,8,F(k==='guard'?'#8d88a6':'#a7a1b5'),OUT,1.5);C(g,-5,-17,5.5,F('#a7a1b5'),OUT,1.4);C(g,-5,-17,3,F('#f7b6c8'));C(g,4,-17,5.5,F('#a7a1b5'),OUT,1.4);C(g,4,-17,3,F('#f7b6c8'));
  E(g,-9,-8,4,3.4,F('#b7b1c5'),OUT,1.2);C(g,-12.5,-8,1.6,'#ff7ab0');eyes(g,-5,-11,2.4,null,true);
  if(k==='guard'){E(g,0,-17,8,4,F('#c9c4dc'),OUT,1.3);g.lineWidth=2;g.strokeStyle='#7a5235';g.beginPath();g.moveTo(-14,4);g.lineTo(-14,-28);g.stroke();poly(g,[[-14,-34],[-11.5,-27],[-16.5,-27]],'#dfe6f2',OUT,1)}}
 else if(k==='dust'){for(const [dx,dy,r] of [[-6,-8,6],[0,-12,7],[6,-8,6],[0,-5,7]])C(g,dx,dy,r,F('#e4dff0'),OUT,1.3);for(const [dx,dy,r] of [[-6,-8,5],[0,-12,6],[6,-8,5],[0,-5,6]])C(g,dx,dy,r,F('#efebf8'));eyes(g,-3,-9,2.2);eyes(g,3,-9,2.2)}
 else if(k==='gummy'||k==='slime'){const col=k==='gummy'?'#ff6f9a':'#7fe04e';const gr=g.createLinearGradient(0,-20,0,0);gr.addColorStop(0,F(shade(col,.35)));gr.addColorStop(1,F(col));
  g.beginPath();g.moveTo(-12,0);g.quadraticCurveTo(-13,-18,0,-19);g.quadraticCurveTo(13,-18,12,0);g.closePath();g.fillStyle=gr;g.fill();g.lineWidth=1.5;g.strokeStyle=OUT;g.stroke();
  E(g,-5,-13,3,1.6,'rgba(255,255,255,.7)',null,0,-.5);eyes(g,-4,-8,2.3);eyes(g,4,-8,2.3);if(k==='gummy'){C(g,-8,-17,3,F(col),OUT,1.2);C(g,8,-17,3,F(col),OUT,1.2)}}
 else if(k==='frog'){E(g,0,-7,12,8,F('#5fbf5a'),OUT,1.5);C(g,-6,-14,4.5,F('#5fbf5a'),OUT,1.3);C(g,6,-14,4.5,F('#5fbf5a'),OUT,1.3);eyes(g,-6,-14,2.6);eyes(g,6,-14,2.6);E(g,0,-4,7,3,F('#c8f0a0'));g.lineWidth=1.2;g.strokeStyle=OUT;g.beginPath();g.arc(0,-9,4,.2,Math.PI-.2);g.stroke()}
 else if(k==='crow'||k==='bat'||k==='bee'){const col=k==='crow'?'#2e2a3a':k==='bat'?'#6a4a9a':'#ffd45c';const fl=Math.sin(t*22)*.6;
  for(const d of [-1,1]){g.save();g.rotate(d*(.3+fl*.5));if(k==='bat')poly(g,[[0,-6],[d*16,-14],[d*13,-6],[d*16,-2],[d*6,-2]],F('#4a2f73'),OUT,1.2);else E(g,d*9,-10,8,4,k==='bee'?'rgba(220,240,255,.85)':F('#1e1a28'),OUT,1.1);g.restore()}
  E(g,0,-6,9,8,F(col),OUT,1.5);if(k==='bee'){g.save();g.beginPath();g.ellipse(0,-6,9,8,0,0,7);g.clip();g.fillStyle='#2a1d2f';g.fillRect(-2,-16,3,20);g.fillRect(4,-16,3,20);g.restore();g.lineWidth=1;g.strokeStyle=OUT;g.beginPath();g.moveTo(-3,-13);g.lineTo(-6,-18);g.moveTo(1,-13);g.lineTo(2,-18);g.stroke()}
  if(k==='crow')poly(g,[[-8,-6],[-14,-4],[-8,-3]],'#ffb14a',OUT,1);eyes(g,-3,-8,2.2,null,k!=='bee')}
 else if(k==='cupcake'){RR(g,-9,-9,18,9,2,F('#f2b46a'),OUT,1.4);g.strokeStyle='#d08a3a';g.lineWidth=1;for(let x=-6;x<=6;x+=4){g.beginPath();g.moveTo(x,-8);g.lineTo(x,-1);g.stroke()}for(const [dx,dy,r] of [[-6,-11,5],[0,-14,6],[6,-11,5]])C(g,dx,dy,r,F('#ff9ec7'),OUT,1.3);for(const [dx,dy,r] of [[-6,-12,3.6],[0,-15,4.4],[6,-12,3.6]])C(g,dx,dy,r,F('#ffc1dc'));C(g,0,-21,2.6,'#e8344f',OUT,1);eyes(g,-3.5,-12,2);eyes(g,3.5,-12,2);for(let n=0;n<5;n++)RR(g,-7+n*3,-17+(n%2)*3,1.6,.8,.4,['#7fd6ff','#ffd45c','#9fe08a'][n%3])}
 else if(k==='shroom'){RR(g,-5,-10,10,10,3,F('#fff3e0'),OUT,1.3);eyes(g,-2.4,-6,1.8,null,true);eyes(g,2.6,-6,1.8,null,true);g.beginPath();g.ellipse(0,-11,13,8,0,Math.PI,0);g.closePath();g.fillStyle=F('#8a4ad8');g.fill();g.lineWidth=1.5;g.strokeStyle=OUT;g.stroke();C(g,-6,-15,2,'#e2c8ff');C(g,3,-17,2.4,'#e2c8ff');C(g,8,-13,1.4,'#e2c8ff')}
 else if(k==='snail'){g.lineCap='round';E(g,0,-3,13,3.6,F('#c8e08a'),OUT,1.3);g.lineWidth=1.3;g.strokeStyle=OUT;g.beginPath();g.moveTo(-10,-5);g.lineTo(-13,-13);g.moveTo(-7,-5);g.lineTo(-8,-14);g.stroke();C(g,-13,-13,1.6,'#2a1d2f');C(g,-8,-14,1.6,'#2a1d2f');
  C(g,4,-10,9,F('#d08a4a'),OUT,1.5);g.strokeStyle='#8a5228';g.lineWidth=1.6;g.beginPath();for(let a=0;a<11;a+=.3){const r=a*.75;g.lineTo(4+Math.cos(a)*r,-10+Math.sin(a)*r)}g.stroke()}
 else if(k==='ghost'){const fade=.55+.45*Math.sin(t*2.2);g.globalAlpha*=fade;g.beginPath();g.moveTo(-10,0);g.quadraticCurveTo(-11,-20,0,-21);g.quadraticCurveTo(11,-20,10,0);for(let n=0;n<4;n++){const x0=10-n*5;g.quadraticCurveTo(x0-2.5,3*(n%2?-1:1)+1,x0-5,0)}g.closePath();g.fillStyle=F('#eef0ff');g.fill();g.lineWidth=1.4;g.strokeStyle=OUT;g.stroke();
  E(g,-3.5,-12,2,2.6,'#2a1d2f');E(g,3.5,-12,2,2.6,'#2a1d2f');E(g,0,-6,2,1.4,'#2a1d2f');E(g,-7,-8,2,1,'rgba(255,140,180,.5)');E(g,7,-8,2,1,'rgba(255,140,180,.5)')}
 else if(k==='beetle'){for(const d of [-1,1])for(let n=0;n<3;n++){g.strokeStyle=OUT;g.lineWidth=1.3;g.beginPath();g.moveTo(-4+n*4,-4);g.lineTo(-6+n*5,1);g.stroke()}E(g,1,-7,11,7,F('#3a8a3a'),OUT,1.5);g.strokeStyle=OUT;g.lineWidth=1;g.beginPath();g.moveTo(1,-14);g.lineTo(1,-1);g.stroke();
  C(g,-3,-9,1.6,'#9fff6a');C(g,5,-9,1.6,'#9fff6a');C(g,-10,-7,4.6,F('#2a5a2a'),OUT,1.3);poly(g,[[-13,-10],[-17,-15],[-12,-12]],'#2a1d2f');eyes(g,-11,-8,1.6,'#c8ff4e',true)}
 else if(k==='crystal'){poly(g,[[0,-24],[8,-12],[5,0],[-5,0],[-8,-12]],F('#9fe8ff'),OUT,1.5);poly(g,[[0,-24],[3,-12],[0,0],[-3,-12]],'rgba(255,255,255,.45)');eyes(g,-3,-10,2);eyes(g,3,-10,2)}
 if(o.wind>0){g.restore();g.save();g.translate(x,y);g.fillStyle='#ff3b4f';g.font='900 '+Math.round(16*s)+'px system-ui';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#fff';g.strokeText('!',0,-(fly?52:34)*s);g.fillText('!',0,-(fly?52:34)*s)}
 g.restore()}
function boss(g,x,y,s,k,o={}){const t=o.t||0;
 if(k==='birman'){cat(g,x,y,s*1.15,{coat:BIRMAN,pose:o.slam>0?'jump':'walk',t,flip:true,crown:true,squash:o.squash});return}
 const map={rat:'mouse',gumboss:'gummy',toad:'frog',sludge:'slime',queenbee:'bee'};
 if(map[k]){foe(g,x,y,s,map[k],{t,hit:o.hit,flip:false,squash:o.squash});const hy=y-({rat:26,gumboss:24,toad:22,sludge:24,queenbee:36}[k])*s;g.save();g.translate(x-(k==='rat'?1:0)*s,hy);g.scale(s,s);poly(g,[[-6,0],[-7,-8],[-3,-4],[0,-10],[3,-4],[7,-8],[6,0]],'#ffd45c',OUT,1.2);C(g,0,-3,1.4,'#ff6f9a');g.restore();return}
 g.save();g.translate(x,y);g.scale(s,s);if(o.squash)g.scale(1+o.squash,1-o.squash);shadow(g,0,0,14,4);const hit=o.hit>0;
 if(k==='owl'){E(g,0,-14,12,14,hit?'#fff':'#8a6a4a',OUT,1.6);E(g,0,-10,8,9,'#e6cfa8');C(g,-4.5,-18,4.2,'#fff',OUT,1.2);C(g,4.5,-18,4.2,'#fff',OUT,1.2);C(g,-4,-17.5,2.2,'#2a1d2f');C(g,5,-17.5,2.2,'#2a1d2f');poly(g,[[-1.5,-14],[1.5,-14],[0,-11]],'#ffb14a');poly(g,[[-10,-26],[-6,-32],[-4,-26]],'#8a6a4a',OUT,1.2);poly(g,[[10,-26],[6,-32],[4,-26]],'#8a6a4a',OUT,1.2);poly(g,[[-6,-30],[-7,-36],[-3,-33],[0,-38],[3,-33],[7,-36],[6,-30]],'#ffd45c',OUT,1)}
 else if(k==='golem'){for(const [dx,dy,r] of [[0,-14,12],[-10,-8,6],[10,-8,6]])C(g,dx,dy,r,hit?'#fff':'#7a8aa0',OUT,1.6);poly(g,[[-3,-34],[3,-34],[5,-24],[-5,-24]],'#9fe8ff',OUT,1.2);C(g,-4,-16,2.2,'#7fe6ff');C(g,4,-16,2.2,'#7fe6ff')}
 g.restore()}
// ------------------------------------------------------------------ scenery
const S={};
S.tree=(g,x,y,s,seed,t,col)=>{const r=rng(seed);g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,18,5);RR(g,-3.5,-22,7,22,3,'#8a5a3a',OUT,1.3);const c=col||['#4fae4a','#5fbf55','#3f9f45'][Math.floor(r()*3)];
 for(const [dx,dy,rr] of [[-10,-28,11],[10,-28,11],[0,-38,13],[0,-26,12]])C(g,dx,dy,rr,shade(c,-.15),OUT,1.4);for(const [dx,dy,rr] of [[-10,-29,9],[10,-29,9],[0,-39,11],[0,-27,10]])C(g,dx,dy,rr,c);C(g,-4,-42,5,shade(c,.25));C(g,6,-32,3,shade(c,.2));g.restore()};
S.pine=(g,x,y,s,seed)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,14,4);RR(g,-3,-12,6,12,2,'#7a4a2a',OUT,1.2);for(let i=0;i<3;i++){const w=16-i*4,yy=-10-i*12;poly(g,[[-w,yy],[0,yy-18],[w,yy]],'#2f8a4a',OUT,1.3);poly(g,[[-w+4,yy-2],[0,yy-16],[0,yy-2]],'#3fa05a')}g.restore()};
S.bush=(g,x,y,s,seed,t,berries)=>{const r=rng(seed);g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,18,5);const sway=Math.sin((t||0)*1.5+seed)*.8;
 const leaves=[[-12,-10,9],[0,-16,10],[12,-10,9],[-6,-4,8],[7,-4,8]];for(const [dx,dy,rr] of leaves){C(g,dx+sway,dy,rr,'#2f8f4a',OUT,1.3)}for(const [dx,dy,rr] of leaves){C(g,dx+sway,dy-1,rr-2.4,'#4fbf5f');g.strokeStyle='#2f8f4a';g.lineWidth=1;g.beginPath();g.moveTo(dx+sway,dy-1);g.lineTo(dx+sway,dy-rr+2);g.stroke()}
 if(berries)for(let i=0;i<5;i++){const bx=(r()-.5)*26,by=-4-r()*16;C(g,bx,by,2.6,'#e8344f',OUT,.9);C(g,bx-.8,by-.8,.8,'#fff')}g.restore()};
S.flowers=(g,x,y,s,seed)=>{const r=rng(seed);g.save();g.translate(x,y);g.scale(s,s);const cols=['#fff6c4','#ffd45c','#ff9ec7','#c59bff','#ffffff'];for(let i=0;i<5;i++){const fx=(r()-.5)*22,fy=(r()-.5)*8,c=cols[Math.floor(r()*cols.length)];g.strokeStyle='#4f9a45';g.lineWidth=1;g.beginPath();g.moveTo(fx,fy);g.lineTo(fx,fy-5);g.stroke();for(let k=0;k<5;k++){const a=k/5*Math.PI*2;C(g,fx+Math.cos(a)*2,fy-6+Math.sin(a)*2,1.6,c)}C(g,fx,fy-6,1.1,'#ffb14a')}g.restore()};
S.fence=(g,x,y,s)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,5,2);RR(g,-3.5,-16,7,16,2.5,'#b8743a',OUT,1.3);E(g,0,-16,3.5,1.6,'#d89a5a',OUT,1);g.strokeStyle='#8a5a2a';g.lineWidth=.8;g.beginPath();g.arc(0,-16,1.6,0,6);g.stroke();g.restore()};
S.rail=(g,x1,y1,x2,y2,s)=>{g.lineCap='round';g.lineWidth=3.6*s;g.strokeStyle=OUT;g.beginPath();g.moveTo(x1,y1-10*s);g.lineTo(x2,y2-10*s);g.stroke();g.lineWidth=2.2*s;g.strokeStyle='#c98a4a';g.stroke()};
S.rock=(g,x,y,s,seed,t,col)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,10,3);poly(g,[[-10,0],[-8,-8],[-2,-11],[6,-9],[10,-2],[8,0]],col||'#a7a3b5',OUT,1.3);poly(g,[[-6,-7],[-2,-10],[4,-8],[0,-6]],'rgba(255,255,255,.35)');g.restore()};
S.house=(g,x,y,s,seed)=>{const r=rng(seed),roof=['#ff7a6a','#7fb8ff','#ffb14a','#c59bff','#6fcf8a'][Math.floor(r()*5)];g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,26,7);
 RR(g,-20,-28,40,28,3,'#fbe9cc',OUT,1.5);RR(g,-6,-16,12,16,6,'#a8621e',OUT,1.3);C(g,3,-8,1,'#ffd45c');RR(g,-16,-22,9,8,2,'#ffe9a0',OUT,1.1);RR(g,8,-22,9,8,2,'#ffe9a0',OUT,1.1);
 poly(g,[[-25,-26],[0,-46],[25,-26]],roof,OUT,1.6);poly(g,[[-25,-26],[0,-46],[0,-26]],shade(roof,.15));RR(g,10,-46,6,12,1.5,'#b98a6a',OUT,1.2);g.restore()};
S.lamp=(g,x,y,s,seed,t)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,5,2);RR(g,-1.5,-30,3,30,1,'#4a3a5a');RR(g,-5,-38,10,9,3,'#5a4a6a',OUT,1.2);const gl=g.createRadialGradient(0,-34,1,0,-34,14);gl.addColorStop(0,'rgba(255,230,140,.9)');gl.addColorStop(1,'rgba(255,230,140,0)');C(g,0,-34,14,gl);C(g,0,-34,3,'#fff3c4');g.restore()};
S.mushroom=(g,x,y,s,seed)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,7,2);RR(g,-3,-9,6,9,2,'#fff3e0',OUT,1.1);E(g,0,-10,8,5,'#e8344f',OUT,1.3);C(g,-3,-11,1.4,'#fff');C(g,3,-12,1.1,'#fff');g.restore()};
S.lolly=(g,x,y,s,seed)=>{const r=rng(seed),c=['#ff6f9a','#7fd6ff','#ffd45c','#9fe08a'][Math.floor(r()*4)];g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,6,2);RR(g,-1.2,-28,2.4,28,1,'#fff',OUT,.9);C(g,0,-32,9,c,OUT,1.4);g.lineWidth=2;g.strokeStyle='rgba(255,255,255,.8)';g.beginPath();for(let a=0;a<12;a+=.3){const rr=a*.65;g.lineTo(Math.cos(a)*rr,-32+Math.sin(a)*rr)}g.stroke();g.restore()};
S.gumdrop=(g,x,y,s,seed)=>{const r=rng(seed),c=['#ff6f9a','#7fd6ff','#ffd45c','#c59bff'][Math.floor(r()*4)];g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,9,3);g.beginPath();g.moveTo(-9,0);g.quadraticCurveTo(-9,-14,0,-14);g.quadraticCurveTo(9,-14,9,0);g.closePath();g.fillStyle=c;g.fill();g.lineWidth=1.3;g.strokeStyle=OUT;g.stroke();E(g,-3,-9,2.5,1.4,'rgba(255,255,255,.7)');for(let i=0;i<5;i++)C(g,(r()-.5)*12,-3-r()*9,.8,'#fff');g.restore()};
S.candyTree=(g,x,y,s,seed,t)=>S.tree(g,x,y,s,seed,t,['#ffb7d5','#ff9ec7','#ffd1e3'][seed%3]);
S.reeds=(g,x,y,s,seed)=>{g.save();g.translate(x,y);g.scale(s,s);for(let i=0;i<4;i++){const dx=-6+i*4;g.strokeStyle='#4f8a3a';g.lineWidth=1.6;g.beginPath();g.moveTo(dx,0);g.quadraticCurveTo(dx+2,-12,dx+1,-20-i%2*4);g.stroke();if(i%2)RR(g,dx-1,-24-i%2*4,3,7,1.5,'#8a5a3a')}g.restore()};
S.lily=(g,x,y,s,seed,t)=>{g.save();g.translate(x,y+Math.sin((t||0)*1.2+seed)*.6);g.scale(s,s);g.beginPath();g.ellipse(0,0,9,4,0,.3,Math.PI*2-.1);g.lineTo(0,0);g.closePath();g.fillStyle='#5fbf5a';g.fill();g.lineWidth=1.1;g.strokeStyle=OUT;g.stroke();if(seed%2){C(g,2,-2,2.4,'#ff9ec7',OUT,.8);C(g,2,-2,1,'#ffd45c')}g.restore()};
S.crystals=(g,x,y,s,seed,t)=>{g.save();g.translate(x,y);g.scale(s,s);const gl=g.createRadialGradient(0,-10,1,0,-10,20);gl.addColorStop(0,'rgba(140,220,255,.45)');gl.addColorStop(1,'rgba(140,220,255,0)');C(g,0,-10,20,gl);shadow(g,0,0,12,3);
 for(const [dx,h,w,c] of [[-7,16,5,'#c59bff'],[0,26,6,'#7fd6ff'],[7,14,5,'#9fe8ff']]){poly(g,[[dx-w,0],[dx-w,-h+5],[dx,-h],[dx+w,-h+5],[dx+w,0]],c,OUT,1.3);poly(g,[[dx-w,-h+5],[dx,-h],[dx,0],[dx-w,0]],'rgba(255,255,255,.3)')}if(Math.sin((t||0)*3+seed)>.6)C(g,1,-18,1.6,'#fff');g.restore()};
S.deadTree=(g,x,y,s)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,10,3);g.lineCap='round';g.strokeStyle=OUT;g.lineWidth=6;const br=()=>{g.beginPath();g.moveTo(0,0);g.lineTo(0,-24);g.moveTo(0,-14);g.lineTo(-9,-24);g.moveTo(0,-20);g.lineTo(8,-30);g.stroke()};br();g.strokeStyle='#5a4a3a';g.lineWidth=3.6;br();g.restore()};
S.toxic=(g,x,y,s,seed,t)=>{g.save();g.translate(x,y);g.scale(s,s);E(g,0,0,18,6,'#6fd040',OUT,1.3);E(g,-2,-1,13,4,'#9fff6a');for(let i=0;i<3;i++){const b=((t||0)*.8+i*.33+seed*.1)%1;C(g,-8+i*8,-2-b*14,2*(1-b)+.6,'rgba(190,255,150,'+(1-b)+')')}g.restore()};
S.pillar=(g,x,y,s)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,10,3);RR(g,-7,-44,14,44,2,'#b9b2cc',OUT,1.4);RR(g,-9,-48,18,6,2,'#d4cee4',OUT,1.2);RR(g,-9,-4,18,4,1,'#d4cee4',OUT,1.2);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(2,-42,4,38);g.restore()};
S.banner=(g,x,y,s,seed,t)=>{g.save();g.translate(x,y);g.scale(s,s);RR(g,-1,-50,2,50,1,'#5a4a6a');const w=Math.sin((t||0)*2+seed)*1.5;poly(g,[[1,-48],[16+w,-46],[16+w,-26],[9,-30],[1,-26]],'#7a3a9a',OUT,1.2);C(g,8,-38,2.6,'#ffd45c');g.restore()};
S.torch=(g,x,y,s,seed,t)=>{g.save();g.translate(x,y);g.scale(s,s);RR(g,-1.6,-22,3.2,22,1,'#6a4a3a');const f=Math.sin((t||0)*14+seed)*1.2;const gl=g.createRadialGradient(0,-26,1,0,-26,14);gl.addColorStop(0,'rgba(255,180,80,.8)');gl.addColorStop(1,'rgba(255,180,80,0)');C(g,0,-26,14,gl);E(g,0,-26-f*.4,3.4,5+f,'#ff8a3c');E(g,0,-25,1.8,3,'#ffe27a');g.restore()};
S.sunflower=(g,x,y,s,seed,t)=>{g.save();g.translate(x,y);g.scale(s,s);g.strokeStyle='#3f8a3a';g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.lineTo(0,-26);g.stroke();E(g,4,-12,4,2,'#5fbf5a',null,0,-.5);g.translate(0,-28);g.rotate(Math.sin((t||0)+seed)*.08);for(let k=0;k<10;k++){g.save();g.rotate(k/10*Math.PI*2);E(g,0,-7,2.6,4.5,'#ffd45c',OUT,.8);g.restore()}C(g,0,0,4.4,'#8a5a3a',OUT,1);g.restore()};
S.hedge=(g,x,y,s,seed)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,16,4);RR(g,-16,-16,32,16,7,'#3f9f45',OUT,1.4);RR(g,-13,-15,26,6,4,'#5fbf55');g.restore()};
S.palm=(g,x,y,s,seed,t)=>{g.save();g.translate(x,y);g.scale(s,s);shadow(g,0,0,14,4);g.strokeStyle=OUT;g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(4,-20,2,-40);g.stroke();g.strokeStyle='#b8843a';g.lineWidth=4;g.stroke();const sw=Math.sin((t||0)*1.4+seed)*.06;g.translate(2,-40);g.rotate(sw);
 for(let k=0;k<6;k++){g.save();g.rotate(-Math.PI/2+(k-2.5)*.55);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(10,-6,22,2);g.quadraticCurveTo(10,2,0,0);g.fillStyle=k%2?'#4fae4a':'#5fc85a';g.fill();g.lineWidth=1.1;g.strokeStyle=OUT;g.stroke();g.restore()}C(g,-2,3,2.6,'#8a5a3a');C(g,2,4,2.6,'#8a5a3a');g.restore()};
function A_star(g,x,y,r,col){star(g,x,y,r,col,0)}
function butterfly(g,x,y,s,t,col){g.save();g.translate(x,y);g.scale(s,s);const f=Math.abs(Math.sin(t*16));for(const d of [-1,1]){g.save();g.scale(d*(.35+f*.65),1);E(g,4,-2,4.5,3.4,col||'#ff9ec7',OUT,.9);E(g,3.4,2,3,2.4,shade(col||'#ff9ec7',.2),OUT,.8);g.restore()}RR(g,-.8,-4,1.6,8,.8,OUT);g.restore()}
function star(g,x,y,r,col,rot){g.save();g.translate(x,y);g.rotate(rot||0);g.beginPath();for(let i=0;i<10;i++){const rr=i%2?r*.45:r,a=i/10*Math.PI*2-Math.PI/2;g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}g.closePath();g.fillStyle=col;g.fill();g.restore()}
// 🦊 The Golden Fox (Kitty Pass premium pet): a chibi fox with a big fluffy tail and a sparkle.
function fox(g,x,y,s,o={}){const t=o.t||0,G='#f0a23a',L='#fff3d0',D='#a8621e';g.save();g.translate(x,y);g.scale(s,s);const bob=Math.abs(Math.sin(t*3))*1.5;shadow(g,0,0,14,4);g.translate(0,-bob);
 const sw=Math.sin(t*3)*.25;g.save();g.translate(-10,-12);g.rotate(-.6+sw);E(g,-8,-10,9,15,G,OUT,1.5);E(g,-10,-20,5,6,L);g.restore();
 for(const lx of [-6,5]){RR(g,lx-3,-9,6,9,3,D,OUT,1.3)}
 const bg=g.createLinearGradient(0,-24,0,-2);bg.addColorStop(0,'#ffd27a');bg.addColorStop(1,G);E(g,0,-12,12,9.5,bg,OUT,1.6);E(g,5,-10,6,6,L);
 g.save();g.translate(6,-28);poly(g,[[-11,-4],[-8,-19],[-1,-9]],G,OUT,1.5);poly(g,[[11,-4],[8,-19],[1,-9]],G,OUT,1.5);poly(g,[[-9,-6],[-7.5,-15],[-3,-9]],'#5a2a1a');poly(g,[[9,-6],[7.5,-15],[3,-9]],'#5a2a1a');
 const hg=g.createRadialGradient(-3,-5,2,0,0,15);hg.addColorStop(0,'#ffe0a0');hg.addColorStop(1,G);E(g,0,0,13,11,hg,OUT,1.6);poly(g,[[-13,1],[0,2],[0,11],[-6,9]],L);poly(g,[[13,1],[0,2],[0,11],[6,9]],L);
 const bl=(t%3.4)<.12;if(bl){g.lineWidth=1.6;g.strokeStyle=OUT;g.beginPath();g.arc(-5,1,2.4,Math.PI*1.1,Math.PI*1.9);g.moveTo(7.4,1);g.arc(5,1,2.4,Math.PI*1.1,Math.PI*1.9);g.stroke()}else for(const ex of [-5,5]){E(g,ex,0,2.6,3.2,'#2a1d2f');C(g,ex-.8,-1.2,1,'#fff')}
 E(g,0,5,2,1.4,'#2a1d2f');E(g,-8,4,2.4,1.4,'rgba(255,120,150,.4)');E(g,8,4,2.4,1.4,'rgba(255,120,150,.4)');poly(g,[[-5,-11],[-6,-17],[-2,-14],[0,-19],[2,-14],[6,-17],[5,-11]],'#ffd45c',OUT,1.1);C(g,0,-13,1.2,'#ff6f9a');g.restore();
 if(Math.sin(t*2.6)>.4)star(g,14,-40,3.4,'#fff6c4',t*2);g.restore()}
window.CKKit={fox,EXTRA,cat,foe,boss,scene:S,shadow,coatOf,shade,E,C,RR,poly,rng,OUT,butterfly,star};
})();
