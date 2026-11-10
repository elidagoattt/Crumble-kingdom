/* Crumble Kingdom: the heroes. Each one is an original dessert character drawn with canvas paths:
 * a body (cookie, cupcake, donut, macaron ...), a face, little arms and feet, a topping, and a tool for its role.
 * CKSweets.draw(g, x, y, scale, {id, pose, t, flip}) draws one standing on (x, y). Scale 1 is about 46px tall.
 * Poses: idle, walk, attack, hurt, win, dance, nap, play.
 */
(() => {
'use strict';
const K = window.CKKit, {E, C, RR, poly, shade} = K;
const OUT = '#4a2c2a';

/* How each hero looks. body picks the painter below; the colours feed it. */
const LOOKS = {
  chip:    {body:'cookie',  base:'#e0a868', dark:'#b87a3c', bits:'#5a3420', top:'none',     cheeks:'#f08a7a'},
  cosmo:   {body:'donut',   base:'#e8b070', dark:'#c08442', icing:'#3a2f7a', bits:'#ffe38a', top:'stars',   cheeks:'#c88ae8'},
  brick:   {body:'square',  base:'#6a3c24', dark:'#4a2614', icing:'#8a5234', bits:'#f6e6c8', top:'drizzle', cheeks:'#d8785a', eye:'#fff'},
  truffle: {body:'ball',    base:'#4a2a1c', dark:'#2e1810', icing:'#6a4028', bits:'#c89a5a', top:'swirl',   cheeks:'#b8604a', eye:'#fff'},
  flan:    {body:'pudding', base:'#ffd97a', dark:'#e0a83c', icing:'#b8621e', top:'cherry',  cheeks:'#f09a6a'},
  pippin:  {body:'pie',     base:'#e8943c', dark:'#b86a1e', icing:'#f2c888', top:'cream',   cheeks:'#e86a4a'},
  marma:   {body:'tart',    base:'#f2c888', dark:'#c8944a', icing:'#ffa23c', bits:'#ffd27a', top:'leaf',    cheeks:'#f08a5a'},
  mallow:  {body:'mallow',  base:'#fff8f2', dark:'#e6d6d0', top:'none',     cheeks:'#ffb0c0'},
  luna:    {body:'macaron', base:'#c4a8ee', dark:'#9a7cd0', icing:'#fff3fb', top:'moon',    cheeks:'#f09ac8'},
  biscuit: {body:'biscuit', base:'#f0d090', dark:'#c8a058', bits:'#c8a058', top:'none',     cheeks:'#f09a7a'},
  waffle:  {body:'waffle',  base:'#f2b84a', dark:'#c8862a', icing:'#fff3c8', top:'butter',  cheeks:'#f08a5a'},
  poppy:   {body:'cupcake', base:'#ffe0b8', dark:'#f08ab0', icing:'#ff9cc0', bits:'#fff', top:'berry',   cheeks:'#ff8aa8'},
  minty:   {body:'cone',    base:'#a8ecc8', dark:'#6cc8a0', icing:'#e0a868', bits:'#5a3420', top:'wafer',   cheeks:'#7ad0a8'},
  mochi:   {body:'mochi',   base:'#fff6f8', dark:'#f0d0dc', top:'leaf',     cheeks:'#ff9ab8'},
  toffee:  {body:'candy',   base:'#d88a3c', dark:'#a8601e', icing:'#ffe0a0', top:'none',     cheeks:'#f0a06a'},
  stack:   {body:'stack',   base:'#f0c070', dark:'#c88a3a', icing:'#b8621e', top:'butter',  cheeks:'#f08a5a'},
  rolly:   {body:'roll',    base:'#a8d078', dark:'#7aa850', icing:'#fff8e8', top:'cream',   cheeks:'#f0a0a0'},
  antie:   {body:'cookie',  base:'#e8c090', dark:'#b88a52', bits:'#2a4a9a', top:'curls',    cheeks:'#f08a7a', robe:'#3b7de0', xeye:true},
  klina:   {body:'cookie',  base:'#ffe6d0', dark:'#e0b090', bits:'#ff9ac0', top:'bow',      cheeks:'#ff9ab8', glasses:true, pendant:true, robe:'#7a4ad0'}
};
const ROLE_TOOL = {guard: 'shield', slash: 'sword', shot: 'sling', magic: 'wand', heal: 'heart', support: 'whisk'};

// ---------------------------------------------------------------- bodies (centred on 0,0, about 34 wide and tall)
const BODY = {
  cookie(g, L) { C(g, 0, 0, 17, L.base, OUT, 2); g.save(); g.globalAlpha = .35; E(g, -5, -7, 8, 5, '#fff'); g.restore(); for (const [x, y, r] of [[-9, -8, 2.4], [8, -10, 2], [11, 3, 2.4], [-11, 5, 2], [1, 11, 2.2], [-2, -13, 1.6]]) C(g, x, y, r, L.bits); },
  biscuit(g, L) { RR(g, -16, -15, 32, 30, 8, L.base, OUT, 2); for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) C(g, sx * 16, -10 + i * 7, 1.6, L.dark); for (const [x, y] of [[-8, -9], [8, -9], [-8, 9], [8, 9], [0, -11]]) C(g, x, y, 1.3, L.bits); },
  donut(g, L) { C(g, 0, 0, 17, L.base, OUT, 2); g.beginPath(); g.moveTo(-16, -3); g.bezierCurveTo(-16, -22, 16, -22, 16, -3); g.bezierCurveTo(12, 3, 9, -3, 5, 2); g.bezierCurveTo(1, 6, -3, -2, -7, 2); g.bezierCurveTo(-11, 5, -14, 0, -16, -3); g.fillStyle = L.icing; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); for (const [x, y, c] of [[-9, -9, '#ffe38a'], [-2, -13, '#ff9ac0'], [7, -10, '#9ae8ff'], [11, -4, '#ffe38a'], [-12, -3, '#fff']]) K.star ? K.star(g, x, y, 1.9, c, x) : C(g, x, y, 1.4, c); },
  square(g, L) { RR(g, -16, -15, 32, 30, 6, L.base, OUT, 2); RR(g, -16, -15, 32, 9, [6, 6, 0, 0], L.icing); g.strokeStyle = L.bits; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(-12, -11); g.quadraticCurveTo(-6, -4, 0, -11); g.quadraticCurveTo(6, -4, 12, -11); g.stroke(); RR(g, -16, -15, 32, 30, 6, null, OUT, 2); },
  ball(g, L) { C(g, 0, 0, 16.5, L.base, OUT, 2); g.save(); g.globalAlpha = .3; E(g, -6, -8, 7, 4, '#fff'); g.restore(); g.strokeStyle = L.icing; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.arc(0, -4, 12, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); for (const [x, y] of [[-10, 6], [10, 5], [0, 12]]) C(g, x, y, 1.3, L.bits); },
  pudding(g, L) { g.beginPath(); g.moveTo(-17, 15); g.quadraticCurveTo(-15, -14, -9, -15); g.lineTo(9, -15); g.quadraticCurveTo(15, -14, 17, 15); g.closePath(); g.fillStyle = L.base; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    g.beginPath(); g.moveTo(-10.5, -15); g.lineTo(10.5, -15); g.quadraticCurveTo(13, -9, 9, -6); g.quadraticCurveTo(5, -10, 1, -5); g.quadraticCurveTo(-4, -10, -8, -6); g.quadraticCurveTo(-13, -9, -10.5, -15); g.fillStyle = L.icing; g.fill(); g.stroke(); g.save(); g.globalAlpha = .4; E(g, -8, 2, 3, 7, '#fff'); g.restore(); },
  pie(g, L) { C(g, 0, 0, 17, L.icing, OUT, 2); C(g, 0, 0, 13, L.base, L.dark, 1.4); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; C(g, Math.cos(a) * 15, Math.sin(a) * 15, 2.1, L.icing, L.dark, .8); } },
  tart(g, L) { C(g, 0, 0, 17, L.base, OUT, 2); C(g, 0, 0, 12.5, L.icing, L.dark, 1.4); g.strokeStyle = L.bits; g.lineWidth = 1.3; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); g.stroke(); } },
  mallow(g, L) { RR(g, -15, -16, 30, 32, 11, L.base, OUT, 2); g.save(); g.globalAlpha = .6; E(g, 0, 13, 12, 3, L.dark); g.restore(); },
  macaron(g, L) { RR(g, -17, -16, 34, 15, [12, 12, 4, 4], L.base, OUT, 2); RR(g, -17, 2, 34, 14, [4, 4, 11, 11], L.base, OUT, 2); RR(g, -15, -2, 30, 5, 2.5, L.icing, OUT, 1.4); for (let i = -3; i <= 3; i++) { C(g, i * 4.6, -2.2, 1.5, L.dark); C(g, i * 4.6, 3.4, 1.5, L.dark); } g.save(); g.globalAlpha = .35; E(g, -7, -11, 6, 2.5, '#fff'); g.restore(); },
  waffle(g, L) { RR(g, -16, -16, 32, 32, 7, L.base, OUT, 2); g.strokeStyle = L.dark; g.lineWidth = 1.6; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 8, -14); g.lineTo(i * 8, 14); g.moveTo(-14, i * 8); g.lineTo(14, i * 8); g.stroke(); } },
  cupcake(g, L) { poly(g, [[-13, -1], [13, -1], [9.5, 16], [-9.5, 16]], L.base, OUT, 2); g.strokeStyle = L.dark; g.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5, 0); g.lineTo(i * 3.8, 15); g.stroke(); } E(g, 0, -4, 16.5, 7.5, L.icing, OUT, 2); E(g, 0, -10, 12, 6.5, L.icing, OUT, 2); E(g, 0, -15.5, 7, 5, L.icing, OUT, 2); for (const [x, y] of [[-8, -6], [6, -3], [1, -12], [-3, -17]]) C(g, x, y, 1, L.bits); },
  cone(g, L) { poly(g, [[-10, 0], [10, 0], [0, 18]], L.icing, OUT, 2); g.strokeStyle = L.dark === '#6cc8a0' ? '#b87a3c' : L.dark; g.lineWidth = 1; g.beginPath(); g.moveTo(-6, 2); g.lineTo(2, 12); g.moveTo(6, 2); g.lineTo(-2, 12); g.stroke(); C(g, 0, -5, 14.5, L.base, OUT, 2); g.beginPath(); g.moveTo(-14, -1); g.quadraticCurveTo(-10, 6, -6, 1); g.quadraticCurveTo(-2, 6, 2, 1); g.quadraticCurveTo(6, 6, 10, 1); g.quadraticCurveTo(13, 4, 14, -1); g.fillStyle = L.base; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); for (const [x, y] of [[-7, -11], [6, -12], [9, -3], [-10, -3]]) RR(g, x - 1.2, y - 1.2, 2.4, 2.4, .6, L.bits); },
  mochi(g, L) { E(g, 0, 2, 17.5, 14.5, L.base, OUT, 2); g.save(); g.globalAlpha = .5; E(g, -6, -5, 7, 3.5, '#fff'); g.restore(); E(g, 0, 12, 11, 2.5, L.dark); },
  candy(g, L) { for (const sx of [-1, 1]) poly(g, [[sx * 12, -2], [sx * 22, -9], [sx * 22, 7]], L.icing, OUT, 2); E(g, 0, 0, 15, 14, L.base, OUT, 2); g.strokeStyle = L.icing; g.lineWidth = 2.4; for (const sx of [-8, 0, 8]) { g.beginPath(); g.moveTo(sx - 3, -12); g.lineTo(sx + 3, 12); g.stroke(); } E(g, 0, 0, 15, 14, null, OUT, 2); },
  stack(g, L) { for (let i = 0; i < 3; i++) E(g, 0, 10 - i * 9, 17 - i * .6, 6.5, L.base, OUT, 2); g.beginPath(); g.moveTo(-14, -10); g.quadraticCurveTo(-12, 0, -8, -6); g.quadraticCurveTo(-3, 3, 3, -5); g.quadraticCurveTo(9, 2, 14, -9); g.quadraticCurveTo(0, -18, -14, -10); g.fillStyle = L.icing; g.fill(); g.lineWidth = 1.5; g.strokeStyle = OUT; g.stroke(); },
  roll(g, L) { C(g, 0, 0, 17, L.base, OUT, 2); g.strokeStyle = L.icing; g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); for (let a = 0; a < 11; a += .25) { const r = 2 + a * 1.2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); }
};

// ---------------------------------------------------------------- toppings (drawn above the body, origin = top of body)
const TOP = {
  none() {},
  stars(g) { K.star?.(g, 0, -4, 4, '#ffe38a', .2); },
  drizzle() {},
  swirl(g, L) { E(g, 0, -1, 5, 3, L.icing, OUT, 1.4); C(g, 0, -3.5, 2.4, L.bits, OUT, 1); },
  cherry(g) { g.strokeStyle = '#4a7a2a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -3); g.quadraticCurveTo(3, -10, 7, -10); g.stroke(); C(g, 0, -2, 4.2, '#e8323c', OUT, 1.5); C(g, -1.3, -3.3, 1.1, '#ffb0b0'); },
  cream(g, L) { E(g, 0, 0, 8, 4, '#fff8ee', OUT, 1.5); E(g, 0, -4, 5.5, 3.5, '#fff8ee', OUT, 1.5); E(g, 0, -7.5, 3, 2.6, '#fff8ee', OUT, 1.5); },
  leaf(g) { g.save(); g.rotate(-.5); E(g, 3, -3, 6, 3, '#6cc070', OUT, 1.4); g.restore(); },
  moon(g) { g.save(); g.translate(0, -6); C(g, 0, 0, 5, '#ffe38a', OUT, 1.4); g.globalCompositeOperation = 'destination-out'; C(g, 2.6, -1.4, 4.2, '#000'); g.restore(); },
  butter(g) { RR(g, -5, -4, 10, 6, 1.5, '#fff0a0', OUT, 1.4); },
  berry(g) { poly(g, [[-4.5, -6], [4.5, -6], [0, 2]], '#ff4a5a', OUT, 1.5); E(g, 0, -6.5, 4.5, 2.2, '#5ab85a', OUT, 1.2); C(g, -1.5, -3.5, .6, '#ffe38a'); C(g, 1.6, -4, .6, '#ffe38a'); },
  wafer(g) { g.save(); g.rotate(.5); RR(g, 2, -12, 4, 13, 1.5, '#e0a868', OUT, 1.3); g.restore(); },
  curls(g) { for (const [x, y, r] of [[-9, 1, 4.6], [-3, -3, 5.2], [4, -3, 5.2], [10, 1, 4.6], [0, 1, 4.4]]) { C(g, x, y, r, '#5a3420', OUT, 1.5); g.strokeStyle = '#8a5a3a'; g.lineWidth = 1.1; g.beginPath(); g.arc(x, y, r * .5, .5, 4.5); g.stroke(); } },
  bow(g) { for (const sx of [-1, 1]) poly(g, [[0, -2], [sx * 9, -8], [sx * 9, 4]], '#ff7ab0', OUT, 1.5); C(g, 0, -2, 2.6, '#ff9ac0', OUT, 1.3); }
};

// ---------------------------------------------------------------- tools held in the front hand (origin = hand)
const TOOL = {
  shield(g) { g.save(); RR(g, -7, -9, 14, 17, [3, 3, 7, 7], '#f2c888', OUT, 1.6); g.strokeStyle = '#c8944a'; g.lineWidth = 1; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 4, -8); g.lineTo(i * 4, 6); g.stroke(); } g.restore(); },
  sword(g) { RR(g, -1.6, -20, 3.2, 17, 1.5, '#fff', OUT, 1.3); g.strokeStyle = '#ff5a6a'; g.lineWidth = 1.3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-1.6, -18 + i * 4); g.lineTo(1.6, -16 + i * 4); g.stroke(); } RR(g, -4.5, -4, 9, 2.6, 1, '#ffd45c', OUT, 1.2); RR(g, -1.4, -2, 2.8, 5, 1, '#8a5a3a', OUT, 1.1); },
  sling(g) { g.strokeStyle = OUT; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 4); g.lineTo(0, -5); g.moveTo(0, -5); g.lineTo(-5, -13); g.moveTo(0, -5); g.lineTo(5, -13); g.stroke(); g.strokeStyle = '#d88a3c'; g.lineWidth = 1.8; g.stroke(); g.strokeStyle = '#ff7ab0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-5, -13); g.quadraticCurveTo(0, -8, 5, -13); g.stroke(); },
  wand(g, t) { RR(g, -1.2, -16, 2.4, 20, 1, '#fff', OUT, 1.2); C(g, 0, -19, 6, '#ff9ac0', OUT, 1.5); g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.beginPath(); for (let a = 0; a < 7; a += .3) { const r = a * .75; g.lineTo(Math.cos(a + t) * r, -19 + Math.sin(a + t) * r); } g.stroke(); },
  heart(g) { RR(g, -1.1, -12, 2.2, 16, 1, '#f6e6c8', OUT, 1.1); g.save(); g.translate(0, -15); g.beginPath(); g.moveTo(0, 4.5); g.bezierCurveTo(-8, -1, -4, -7, 0, -3); g.bezierCurveTo(4, -7, 8, -1, 0, 4.5); g.fillStyle = '#ff6a8a'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = OUT; g.stroke(); g.restore(); },
  whisk(g) { RR(g, -1.3, -6, 2.6, 11, 1, '#b8c4d0', OUT, 1.1); g.strokeStyle = OUT; g.lineWidth = 1.3; for (const w of [5, 2.6, 0]) { g.beginPath(); g.ellipse(0, -12, w + .6, 7, 0, 0, 6.283); g.stroke(); } }
};

function face(g, L, pose, t, blink) {
  const ec = L.eye || '#3a2420', happy = pose === 'win' || pose === 'dance' || pose === 'play', hurt = pose === 'hurt', nap = pose === 'nap';
  E(g, -9.5, 3.5, 3.2, 2, L.cheeks); E(g, 9.5, 3.5, 3.2, 2, L.cheeks);
  g.strokeStyle = ec; g.lineWidth = 1.8; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const sx of [-1, 1]) {
    const ex = sx * 6;
    if (L.xeye && sx === 1) { g.beginPath(); g.moveTo(ex - 2.4, -2.9); g.lineTo(ex + 2.4, 1.9); g.moveTo(ex + 2.4, -2.9); g.lineTo(ex - 2.4, 1.9); g.stroke(); continue; }
    if (hurt) { g.beginPath(); g.moveTo(ex - sx * 2.4, -2.6); g.lineTo(ex + sx * 1.6, -.5); g.lineTo(ex - sx * 2.4, 1.6); g.stroke(); }
    else if (happy) { g.beginPath(); g.arc(ex, .4, 2.5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else if (nap || blink) { g.beginPath(); g.arc(ex, -1.4, 2.5, Math.PI * .15, Math.PI * .85); g.stroke(); }
    else { E(g, ex, -.6, 2.3, 3, ec); C(g, ex + .7, -1.7, .9, '#fff'); }
  }
  if (L.glasses) { g.strokeStyle = '#7a4ad0'; g.lineWidth = 1.4; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 6, -.6, 4.6, 0, 6.283); g.stroke(); } g.beginPath(); g.moveTo(-1.4, -.6); g.lineTo(1.4, -.6); g.stroke(); }
  g.strokeStyle = ec; g.lineWidth = 1.5;
  if (hurt) { g.beginPath(); g.arc(0, 6.4, 2, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  else if (happy || pose === 'attack') { g.beginPath(); g.arc(0, 3, 3, 0, Math.PI); g.closePath(); g.fillStyle = '#b8424a'; g.fill(); g.stroke(); }
  else if (nap) { C(g, 0, 4.4, 1.2, ec); }
  else { g.beginPath(); g.arc(0, 2.6, 2.6, Math.PI * .15, Math.PI * .85); g.stroke(); }
}

function draw(g, x, y, s, o = {}) {
  const L = LOOKS[o.id] || LOOKS.chip, t = o.t || 0, pose = o.pose || 'idle';
  const role = window.CKData?.CATS?.[o.id]?.role, tool = o.tool === false ? null : ROLE_TOOL[role];
  let bob = Math.sin(t * 3) * .8, tilt = 0, lift = 0, dx = 0, sq = 0, armA = .25, armB = -.25, step = 0;
  if (pose === 'walk') { tilt = Math.sin(t * 10) * .09; lift = Math.abs(Math.sin(t * 10)) * 2; step = Math.sin(t * 10); }
  else if (pose === 'attack') { const k = Math.sin(Math.min(1, (t * 3.5) % 1) * Math.PI); dx = k * 7; tilt = k * .22; armA = -1.3 + k * 1.9; }
  else if (pose === 'hurt') { tilt = -.26; dx = -3; }
  else if (pose === 'win') { lift = Math.abs(Math.sin(t * 6)) * 9; armA = -2.2; armB = 2.2; sq = Math.sin(t * 12) * .04; }
  else if (pose === 'dance') { tilt = Math.sin(t * 6) * .2; lift = Math.abs(Math.sin(t * 6)) * 3; armA = -1.2 + Math.sin(t * 6); armB = 1.2 + Math.sin(t * 6); }
  else if (pose === 'play') { lift = Math.abs(Math.sin(t * 5)) * 6; tilt = Math.sin(t * 5) * .15; armA = -1.6; }
  else if (pose === 'nap') { tilt = .1; sq = .06 + Math.sin(t * 2) * .03; bob = 0; }
  else sq = Math.sin(t * 3) * .02;

  g.save(); g.translate(x, y); g.scale((o.flip ? -1 : 1) * s, s);
  // feet
  for (const sx of [-1, 1]) E(g, sx * 7 + (pose === 'walk' ? step * sx * 2.5 : 0), -2 - (pose === 'walk' ? Math.max(0, step * sx) * 2.5 : 0), 5, 3.4, '#6a3a24', OUT, 1.5);
  g.translate(dx, -21 - lift + bob); g.rotate(tilt); g.scale(1 + sq, 1 - sq);
  // back arm
  g.save(); g.translate(-15, 3); g.rotate(armB); RR(g, -2.6, 0, 5.2, 9, 2.6, L.base, OUT, 1.5); g.restore();
  if (L.robe) { g.beginPath(); g.moveTo(-15, -4); g.quadraticCurveTo(-22, 8, -17 + Math.sin(t * 4) * 2, 19); g.lineTo(-6, 16); g.closePath(); g.fillStyle = L.robe; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); }
  (BODY[L.body] || BODY.cookie)(g, L);
  if (L.robe) { g.beginPath(); g.moveTo(-15.5, 6); g.quadraticCurveTo(0, 13, 15.5, 6); g.quadraticCurveTo(13, 16, 0, 17.5); g.quadraticCurveTo(-13, 16, -15.5, 6); g.fillStyle = L.robe; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); C(g, 0, 10.5, 1.8, '#ffd45c', OUT, 1); }
  if (L.pendant) { g.save(); g.translate(0, 12.5); poly(g, [[-3.4, -4], [3.4, -4], [.6, 0], [3.4, 4], [-3.4, 4], [-.6, 0]], '#cfeaff', OUT, 1.2); RR(g, -4, -5, 8, 1.6, .6, '#f2b632'); RR(g, -4, 3.6, 8, 1.6, .6, '#f2b632'); g.restore(); }
  g.save(); g.translate(0, {macaron: 8, cupcake: 7, cone: -4}[L.body] || 0); if (L.body === 'macaron') g.scale(.9, .9); face(g, L, pose, t, (t % 3.4) > 3.25); g.restore();
  const topY = {cupcake: -20, cone: -19, macaron: -16, stack: -15, pudding: -15}[L.body] ?? -16.5;
  g.save(); g.translate(0, topY); (TOP[L.top] || TOP.none)(g, L); g.restore();
  // front arm and tool
  g.save(); g.translate(15, 3); g.rotate(armA); RR(g, -2.6, 0, 5.2, 9, 2.6, L.base, OUT, 1.5);
  if (tool && pose !== 'nap') { g.translate(0, 8.5); g.rotate(-armA * .55 + (tool === 'shield' ? 0 : .5)); TOOL[tool](g, t); }
  g.restore();
  if (pose === 'nap') { g.font = '900 8px system-ui'; g.fillStyle = '#7a8ad0'; g.textAlign = 'center'; const p = (t * .5) % 1; g.globalAlpha = 1 - p; g.fillText('z', 16 + p * 6, -18 - p * 12); }
  g.restore();
}

window.CKSweets = {draw, LOOKS};
})();
