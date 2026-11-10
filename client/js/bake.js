/* Crumble Kingdom: the Magic Oven bake animation.
 * CKBake.play(results, {event}, onDone) shows each new sweet popping out of the oven, one at a time:
 * the oven rumbles and glows in the sweet's rarity colour, the door drops open, and the sweet hops out.
 * Tap to move on; Skip jumps straight to the end. `onDone(skipped)` is called when it is over.
 *
 * Replaceable art (see ART.md): oven.png (door shut), oven-open.png (door open), bg-oven.png (the room).
 */
(() => {
'use strict';
const D = window.CKData, Art = window.CKArt, K = window.CKKit, {E, C, RR, star, OUT} = K;
const W = 640, H = 360, CX = W / 2, BASE = 318;      // scene size in drawing units; the canvas scales to fit
const sfx = n => window.CKSound?.play(n);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const back = p => { const c = 1.9; p = clamp(p) - 1; return 1 + (c + 1) * p * p * p + c * p * p; };   // overshoot then settle
const mix = (a, b, p) => { const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), x = h(a), y = h(b); return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * p)).join(',') + ')'; };

let raf = 0, run = null;

function room(g, event) {
  const img = Art.pic('bg-oven');
  if (img) { g.drawImage(img, 0, 0, W, H); return; }
  const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, event ? '#4b3a8c' : '#ffe2b8'); wall.addColorStop(1, event ? '#7b5cff' : '#ffc98a');
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = event ? .1 : .22; g.fillStyle = '#fff'; for (let x = -20; x < W; x += 64) g.fillRect(x, 0, 32, H); g.restore();
  // shelves with jars on each side
  for (const side of [-1, 1]) for (let r = 0; r < 2; r++) {
    const sx = CX + side * 232, sy = 96 + r * 78;
    RR(g, sx - 62, sy, 124, 9, 3, '#b8783c', OUT, 2.4);
    for (let i = 0; i < 3; i++) { const jx = sx - 38 + i * 38, col = ['#ff9cc0', '#9ad8ff', '#ffd45c', '#b9f0a8', '#d9b8ff', '#ffb38a'][(i + r * 3 + (side > 0 ? 2 : 0)) % 6]; RR(g, jx - 13, sy - 34, 26, 34, 7, col, OUT, 2.2); RR(g, jx - 10, sy - 40, 20, 8, 3, '#fff6e6', OUT, 2); g.save(); g.globalAlpha = .45; RR(g, jx - 9, sy - 29, 5, 20, 3, '#fff'); g.restore(); }
  }
  // bunting
  g.save(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.beginPath(); g.moveTo(-10, 14); g.quadraticCurveTo(CX, 62, W + 10, 14); g.stroke();
  for (let i = 0; i < 11; i++) { const p = (i + .5) / 11, x = -10 + (W + 20) * p, y = 14 + 96 * p * (1 - p) * 2 * .5; g.beginPath(); g.moveTo(x - 13, y); g.lineTo(x + 13, y); g.lineTo(x, y + 24); g.closePath(); g.fillStyle = ['#ff7aa8', '#fff6e6', '#7ac8ff', '#ffd45c'][i % 4]; g.fill(); g.stroke(); }
  g.restore();
  // counter
  RR(g, -10, BASE - 4, W + 20, 60, 0, '#c98a4e', OUT, 3); RR(g, -10, BASE - 14, W + 20, 16, 4, '#fff6e6', OUT, 3);
}

/* The oven. `open` 0 (shut) to 1 (door flat down); `heat` 0..1 is how bright the fire is; `col` is the glow colour. */
function oven(g, t, open, heat, col, shake) {
  const x = CX + shake, y = BASE - 14;
  const img = Art.pic(open > .5 ? 'oven-open' : 'oven', 'oven');
  if (img) { Art.sprite(g, img, x, y + 6, 210); return; }
  K.shadow(g, x, y + 2, 122, 14, .25);
  // chimney
  RR(g, x - 16, y - 208, 32, 50, 5, '#c97a55', OUT, 3); RR(g, x - 21, y - 214, 42, 12, 5, '#e89a72', OUT, 3);
  // dome
  g.beginPath(); g.moveTo(x - 104, y); g.lineTo(x - 104, y - 82); g.quadraticCurveTo(x - 104, y - 176, x, y - 176); g.quadraticCurveTo(x + 104, y - 176, x + 104, y - 82); g.lineTo(x + 104, y); g.closePath();
  g.fillStyle = '#f2a57c'; g.fill(); g.lineWidth = 3.4; g.strokeStyle = OUT; g.stroke();
  g.save(); g.clip(); g.globalAlpha = .28; g.fillStyle = '#fff';
  for (let r = 0; r < 8; r++) for (let i = -1; i < 8; i++) { g.beginPath(); g.roundRect?.(x - 104 + i * 30 + (r % 2) * 15, y - 22 - r * 21, 25, 15, 3); g.fill(); }
  g.globalAlpha = .16; g.fillStyle = '#8a3a2a'; g.fillRect(x + 56, y - 180, 60, 190); g.restore();
  // icing on the roof
  g.beginPath(); g.moveTo(x - 100, y - 104); g.quadraticCurveTo(x - 98, y - 174, x, y - 176); g.quadraticCurveTo(x + 98, y - 174, x + 100, y - 104);
  for (let i = 0; i < 6; i++) { const a = x + 100 - i * 33.3, d = [22, 9, 26, 12, 20, 8][i]; g.quadraticCurveTo(a - 4, y - 104 + d, a - 16, y - 104 + d); g.quadraticCurveTo(a - 30, y - 104 + d, a - 33.3, y - 104); }
  g.closePath(); g.fillStyle = '#fff6fa'; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
  for (let i = 0; i < 9; i++) { const a = -1.25 + i * .31; C(g, x + Math.sin(a) * 78, y - 100 - Math.cos(a) * 58, 3.4, ['#ff5a8a', '#7ac8ff', '#ffd45c', '#8ae08a'][i % 4], OUT, 1.2); }
  // the mouth and the fire inside
  RR(g, x - 62, y - 100, 124, 96, [58, 58, 6, 6], '#3a1e14', OUT, 3.4);
  g.save(); g.beginPath(); g.roundRect?.(x - 55, y - 93, 110, 86, [52, 52, 4, 4]); g.clip();
  const fire = g.createRadialGradient(x, y - 30, 4, x, y - 40, 78); fire.addColorStop(0, '#fffbe0'); fire.addColorStop(.35, col); fire.addColorStop(1, '#3a1e14');
  g.globalAlpha = .25 + heat * .75; g.fillStyle = fire; g.fillRect(x - 60, y - 100, 120, 100);
  g.globalAlpha = heat; for (let i = 0; i < 5; i++) { const fx = x - 36 + i * 18, fh = 22 + Math.sin(t * 9 + i * 1.7) * 9 + heat * 14; g.beginPath(); g.moveTo(fx - 11, y - 6); g.quadraticCurveTo(fx - 9, y - 6 - fh * .6, fx, y - 6 - fh); g.quadraticCurveTo(fx + 9, y - 6 - fh * .6, fx + 11, y - 6); g.closePath(); g.fillStyle = i % 2 ? '#fff2a8' : '#ffffff'; g.fill(); }
  g.restore();
  // the door: swings down on its bottom hinge
  const sy = Math.cos(clamp(open) * Math.PI / 2 * 1.06);
  g.save(); g.translate(x, y - 4); g.scale(1, Math.max(-.12, sy));
  RR(g, -58, -92, 116, 92, [54, 54, 6, 6], sy > 0 ? '#8a5644' : '#6e4234', OUT, 3.2);
  if (sy > .12) { RR(g, -44, -78, 88, 60, [42, 42, 6, 6], '#5a3428', OUT, 2.4); g.save(); g.globalAlpha = .3 + heat * .7; C(g, 0, -44, 23, col); g.globalAlpha = heat; C(g, 0, -44, 13 + Math.sin(t * 11) * 3, '#fffbe0'); g.restore(); C(g, 0, -44, 24, null, OUT, 2.6); RR(g, -24, -13, 48, 8, 4, '#ffd45c', OUT, 2); }
  g.restore();
  // plinth and a star on top
  RR(g, x - 118, y - 4, 236, 16, 5, '#8a5a3a', OUT, 3);
  star(g, x, y - 150, 13, '#ffd45c', Math.sin(t * 2) * .2);
}

function play(results, opts, onDone) {
  opts = opts || {};
  const m = document.getElementById('modal');
  m.hidden = false; m.onclick = null;
  m.innerHTML = `<div class="bake" data-sticky><canvas></canvas>
    <div class="bake-count"></div><button class="bake-skip">Skip ⏭</button>
    <div class="bake-info" hidden><span class="rar"></span><b></b><em></em></div><div class="bake-tap" hidden>Tap to continue</div></div>`;
  const box = m.querySelector('.bake'), cv = box.querySelector('canvas'), g = cv.getContext('2d');
  const info = box.querySelector('.bake-info'), tap = box.querySelector('.bake-tap'), count = box.querySelector('.bake-count');
  const many = results.length > 1, pace = many ? .78 : 1;
  const T_RUMBLE = 1.15 * pace, T_OPEN = T_RUMBLE + .28, T_OUT = T_OPEN + .62;
  let i = 0, t0 = performance.now(), last = t0, stage = '', puffs = [], sparks = [], finished = false;
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const fit = () => { const r = box.getBoundingClientRect(); cv.width = Math.max(2, r.width * dpr); cv.height = Math.max(2, r.width * H / W * dpr); };
  fit(); window.addEventListener('resize', fit);

  function showInfo() {
    const r = results[i], c = D.CATS[r.id], rar = D.RARITY[r.rarity];
    info.hidden = false; tap.hidden = false; info.style.setProperty('--rc', rar.color);
    info.querySelector('.rar').textContent = rar.name + (r.isNew ? ' · NEW!' : '');
    info.querySelector('b').textContent = c.name;
    info.querySelector('em').textContent = r.isNew ? 'the ' + c.kind + ' · ' + D.ROLES[c.role].icon + ' ' + D.ROLES[c.role].name : r.starUp ? 'Now ' + r.starUp + '★ and stronger!' : '+' + r.jam + ' 🍓 jam';
    info.style.animation = 'none'; void info.offsetWidth; info.style.animation = '';
  }
  function begin() { t0 = performance.now(); stage = ''; puffs = []; sparks = []; info.hidden = true; tap.hidden = true; count.textContent = many ? (i + 1) + ' / ' + results.length : ''; sfx('ovenhum'); }
  function end(skipped) { if (finished) return; finished = true; cancelAnimationFrame(raf); window.removeEventListener('resize', fit); run = null; m.hidden = true; m.innerHTML = ''; onDone?.(skipped); }
  function next() { if (++i >= results.length) return end(false); begin(); }
  box.onclick = e => {
    if (e.target.closest('.bake-skip')) return end(true);
    const t = (performance.now() - t0) / 1000;
    if (t < T_OUT) t0 = performance.now() - T_OUT * 1000;      // a tap during the build-up jumps to the reveal
    else if (t > T_OUT + .25) next();
  };

  function frame(now) {
    if (finished) return;
    const t = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
    const r = results[i], rar = D.RARITY[r.rarity], fancy = r.rarity === 'epic' || r.rarity === 'special';
    g.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0);
    room(g, opts.event);

    const build = clamp(t / T_RUMBLE), open = clamp((t - T_RUMBLE) / (T_OPEN - T_RUMBLE)), out = clamp((t - T_OPEN) / (T_OUT - T_OPEN));
    const col = build < .55 ? '#ffb02e' : mix('#ffb02e', rar.color, clamp((build - .55) / .3));
    const shake = open < 1 ? Math.sin(t * 46) * (1.2 + build * build * (fancy ? 7 : 4.5)) * (1 - open) : 0;
    if (t >= T_RUMBLE && stage === '') { stage = 'open'; sfx('ovending'); for (let k = 0; k < 14; k++) puffs.push({x: CX + (Math.random() - .5) * 90, y: BASE - 50, vx: (Math.random() - .5) * 90, vy: -40 - Math.random() * 90, r: 10 + Math.random() * 14, a: .9}); }
    if (t >= T_OPEN && stage === 'open') { stage = 'out'; sfx(fancy ? 'rare' : 'draw'); for (let k = 0; k < (fancy ? 34 : 16); k++) { const a = Math.random() * 6.283, v = 90 + Math.random() * 190; sparks.push({x: CX, y: BASE - 150, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: 4 + Math.random() * 6, a: 1, c: [rar.color, '#fff2a8', '#ffffff'][k % 3], rot: a}); } }
    if (t >= T_OUT && stage === 'out') { stage = 'shown'; showInfo(); }
    if (build < 1 && Math.random() < dt * 9) puffs.push({x: CX + (Math.random() - .5) * 14, y: BASE - 230, vx: (Math.random() - .5) * 16, vy: -34 - Math.random() * 20, r: 6 + Math.random() * 6, a: .7});

    // light rays behind everything once the sweet is out
    if (out > 0) { g.save(); g.translate(CX, BASE - 150); g.rotate(t * .5); g.globalAlpha = (fancy ? .5 : .28) * out; g.fillStyle = fancy ? rar.color : '#fff6c8'; for (let k = 0; k < 12; k++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-22, -420); g.lineTo(22, -420); g.closePath(); g.fill(); } g.restore(); }
    // glow leaking round the door while it heats up
    if (build > .4 && open < 1) { g.save(); g.globalAlpha = (build - .4) * (fancy ? .75 : .45) * (1 - open); const gl = g.createRadialGradient(CX, BASE - 62, 20, CX, BASE - 62, 170); gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(CX - 180, BASE - 240, 360, 250); g.restore(); }

    oven(g, t, open, clamp(.25 + build * .75), col, shake);

    // the sweet hops out of the mouth, grows and lands in front
    if (out > 0) {
      const p = back(out), hop = Math.sin(clamp(out) * Math.PI) * 46;
      const sx = CX, sy = BASE - 30 + (1 - clamp(out)) * -30 - hop + (out >= 1 ? 0 : 0), sc = .5 + p * 2.35;
      g.save(); g.globalAlpha = clamp(out * 4);
      E(g, sx, BASE + 12, 34 * clamp(out) + 20, 8, 'rgba(20,10,30,.22)');
      RR(g, sx - 62 * clamp(out * 2), BASE + 2, 124 * clamp(out * 2), 10, 5, '#d8dde6', OUT, 2.4);      // baking tray
      Art.hero(g, sx, sy + 34, sc, {id: r.id, pose: out >= 1 ? 'win' : 'idle', t: t});
      g.restore();
    }
    // white flash as the door drops
    if (open > 0 && out < 1) { g.save(); g.globalAlpha = Math.sin(clamp((t - T_RUMBLE) / .5) * Math.PI) * (fancy ? .85 : .55); g.fillStyle = fancy ? mix('#ffffff', rar.color, .25) : '#fff'; g.fillRect(0, 0, W, H); g.restore(); }

    for (const p of puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += 14 * dt; p.a -= dt * .8; if (p.a > 0) { g.save(); g.globalAlpha = p.a * .8; C(g, p.x, p.y, p.r, '#fffaf2'); g.restore(); } }
    puffs = puffs.filter(p => p.a > 0);
    for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.a -= dt * .75; s.rot += dt * 5; if (s.a > 0) { g.save(); g.globalAlpha = clamp(s.a); star(g, s.x, s.y, s.r, s.c, s.rot); g.restore(); } }
    sparks = sparks.filter(s => s.a > 0);
    if (stage === 'shown' && fancy && Math.random() < dt * 14) sparks.push({x: CX + (Math.random() - .5) * 260, y: BASE - 60 - Math.random() * 200, vx: 0, vy: -30, r: 3 + Math.random() * 5, a: .9, c: Math.random() < .5 ? rar.color : '#fff2a8', rot: 0});

    // in a batch of ten, ordinary repeats move on by themselves
    if (many && stage === 'shown' && !r.isNew && !fancy && t > T_OUT + 1.05) next();
    raf = requestAnimationFrame(frame);
  }
  run = {end};
  begin(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}

window.CKBake = {play, stop: () => run?.end(true), drawOven: oven};
})();
