/* Crumble Kingdom: the art layer.
 * Every picture in the game is asked for by name here. If a PNG with that name is in client/assets/ it is used;
 * otherwise the picture is drawn by code (js/artkit.js, js/sweets.js and the building painters below).
 * That makes all art replaceable without touching game code: drop in `hero-chip.png` and Chip uses it. See ART.md.
 */
(() => {
'use strict';
const K = window.CKKit, {E, C, RR, poly, shade, OUT, star} = K, S = K.scene;
const images = {};          // name -> HTMLImageElement (only loaded ones)
let ready = false;
const fileSet = new Set();     // every file name found in client/assets/ (pictures and music)

/* The server lists what is in client/assets/. With no server (opened as a file) nothing is replaced. */
async function load() {
  try {
    const res = await fetch('/api/art', {cache: 'no-store'});
    const files = res.ok ? (await res.json()).files || [] : [];
    files.forEach(f => fileSet.add(f.toLowerCase()));
    await Promise.all(files.filter(f => /\.(png|webp|jpg|jpeg|svg)$/i.test(f)).map(f => new Promise(done => {
      const img = new Image();
      img.onload = () => { images[f.replace(/\.[a-z]+$/i, '').toLowerCase()] = img; done(); };
      img.onerror = done;
      img.src = 'assets/' + f;
    })));
  } catch { /* code-drawn art is the fallback */ }
  ready = true;
}
const pic = (...names) => { for (const n of names) if (images[n]) return images[n]; return null; };

/* Draws a replacement picture standing on (x, y): bottom-centre anchored, `h` pixels tall. */
function sprite(g, img, x, y, h, o = {}) {
  const w = h * img.width / img.height;
  g.save(); g.translate(x, y); g.scale(o.flip ? -1 : 1, 1);
  if (o.squash) g.scale(1 + o.squash, 1 - o.squash);
  if (o.hit > 0) g.filter = 'brightness(1.8)';
  if (o.alpha != null) g.globalAlpha = o.alpha;
  g.drawImage(img, -w / 2, -h, w, h);
  g.restore();
}

// ---- characters. `scale` 1 is about 46px tall for a hero.
function hero(g, x, y, scale, o = {}) {
  const img = pic('hero-' + o.id + '-' + (o.pose || 'idle'), 'hero-' + o.id);
  if (img) { const bob = o.pose === 'walk' ? Math.abs(Math.sin((o.t || 0) * 9)) * 2 * scale : Math.sin((o.t || 0) * 3) * scale; return sprite(g, img, x, y - bob, 46 * scale, o); }
  if (o.hit > 0) { g.save(); g.filter = 'brightness(1.5)'; window.CKSweets.draw(g, x, y, scale, o); g.restore(); } else window.CKSweets.draw(g, x, y, scale, o);
}
const cat = hero;      // older name, still used around the code
function foe(g, x, y, scale, kind, o = {}) {
  const img = pic('foe-' + kind);
  if (img) return sprite(g, img, x, y - Math.abs(Math.sin((o.t || 0) * 6)) * 2 * scale, 34 * scale, o);
  K.foe(g, x, y, scale, kind, o);
}
function boss(g, x, y, scale, kind, o = {}) {
  const img = pic('boss-' + (o.id || kind), 'boss-' + kind);
  if (img) return sprite(g, img, x, y, 64 * scale, o);
  K.boss(g, x, y, scale, kind, o);
}

// ---- buildings. Drawn standing on (x, y) = bottom-centre of their footprint, `w` pixels wide.
const WALL = '#fff3df';
function roof(g, x, y, w, h, col) {
  poly(g, [[x - w / 2 - 4, y], [x, y - h], [x + w / 2 + 4, y]], col, OUT, 2);
  g.save(); g.globalAlpha = .25; poly(g, [[x - w / 2 - 4, y], [x, y - h], [x - w * .1, y]], '#fff'); g.restore();
}
function door(g, x, y, w, h, col) { RR(g, x - w / 2, y - h, w, h, [w / 2, w / 2, 0, 0], col || '#8a5a3a', OUT, 1.6); C(g, x + w * .22, y - h * .45, 1.4, '#ffd45c'); }
function windowP(g, x, y, s, lit) { RR(g, x - s / 2, y - s / 2, s, s, 3, lit ? '#ffe9a6' : '#a8dcf2', OUT, 1.5); g.beginPath(); g.moveTo(x, y - s / 2); g.lineTo(x, y + s / 2); g.moveTo(x - s / 2, y); g.lineTo(x + s / 2, y); g.lineWidth = 1; g.strokeStyle = OUT; g.stroke(); }
function flag(g, x, y, col, t) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 16); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); const wv = Math.sin(t * 4) * 2; poly(g, [[x, y - 16], [x + 11, y - 13 + wv], [x, y - 9]], col, OUT, 1.4); }
function levelPips(g, x, y, lv) { if (!lv || lv < 2) return; const txt = 'Lv ' + lv; g.font = '900 10px system-ui,sans-serif'; const w = g.measureText(txt).width + 10; RR(g, x - w / 2, y, w, 14, 7, '#3a2433'); g.fillStyle = '#ffe38a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y + 7.5); }

const CREAM = '#fff6e6', CHOC = '#7a4a2a', PINK = '#ff9cc0';
// wavy icing along the top edge of a shape from x0 to x1 at height y
function icing(g, x0, x1, y, drop, col) {
  g.beginPath(); g.moveTo(x0, y); const n = Math.max(3, Math.round((x1 - x0) / (drop * 1.6)));
  for (let i = 0; i < n; i++) { const a = x0 + (x1 - x0) * i / n, c = x0 + (x1 - x0) * (i + 1) / n; g.quadraticCurveTo((a + c) / 2, y + drop * (i % 2 ? 1.5 : .8), c, y); }
  g.lineTo(x1, y - drop * .9); g.lineTo(x0, y - drop * .9); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
}
function candle(g, x, y, u, t, col) { RR(g, x - 2 * u, y - 13 * u, 4 * u, 13 * u, 1.5 * u, col, OUT, 1.4); const f = 1 + Math.sin(t * 9 + x) * .15; E(g, x, y - 17 * u, 2.6 * u * f, 4.2 * u * f, '#ffb02e', OUT, 1.1); E(g, x, y - 16.2 * u, 1.2 * u, 2.2 * u, '#fff2a8'); }

const PAINT = {
  // A tiered celebration cake with a door. It gains tiers, candles and a star as it levels up.
  castle(g, x, y, w, lv, t) {
    const u = w / 100, tiers = lv >= 5 ? 3 : lv >= 2 ? 2 : 1;
    K.shadow(g, x, y - 2, w * .5, w * .12);
    E(g, x, y - 3 * u, 48 * u, 9 * u, '#fff', OUT, 2);                                  // cake plate
    let top = y - 4 * u;
    const cols = ['#ffd9e6', '#fff1c8', '#d9f0ff'];
    for (let i = 0; i < tiers; i++) {
      const tw = (40 - i * 11) * u, th = (30 - i * 4) * u;
      RR(g, x - tw, top - th, tw * 2, th, 5 * u, cols[i], OUT, 2);
      g.fillStyle = i % 2 ? '#ffc23c' : '#ff7aa8'; RR(g, x - tw, top - th * .45, tw * 2, 3.4 * u, 0, g.fillStyle);  // filling stripe
      icing(g, x - tw, x + tw, top - th + 2 * u, 5 * u, i === 1 ? PINK : CREAM);
      if (i === 0) { door(g, x, top, 15 * u, 21 * u, CHOC); windowP(g, x - 24 * u, top - th * .55, 8 * u, true); windowP(g, x + 24 * u, top - th * .55, 8 * u, true); }
      else windowP(g, x, top - th * .5, 7 * u, true);
      for (const sx of [-1, 1]) { C(g, x + sx * (tw - 6 * u), top - th - 1 * u, 3.6 * u, '#e8323c', OUT, 1.3); }
      top -= th;
    }
    const n = Math.min(5, 1 + Math.floor(lv / 2));
    for (let i = 0; i < n; i++) candle(g, x + (i - (n - 1) / 2) * 8 * u, top - 1 * u, u, t, ['#7ac8ff', '#ff9cc0', '#ffe38a'][i % 3]);
    if (lv >= 3) star(g, x, top - 30 * u, 6 * u, '#ffd45c', t);
    flag(g, x - 40 * u, y - 30 * u, '#ff7aa8', t); flag(g, x + 40 * u, y - 30 * u, '#7ac8ff', t + 1);
  },
  // Sugar Mill: a round sugar-cube hut with a spinning peppermint wheel.
  pond(g, x, y, w, lv, t) {
    const u = w / 100;
    K.shadow(g, x, y - 2, w * .44, w * .1);
    RR(g, x - 30 * u, y - 42 * u, 60 * u, 42 * u, 6 * u, '#fff', OUT, 2);
    g.save(); g.globalAlpha = .5; for (let i = 0; i < 6; i++) RR(g, x - 26 * u + (i % 3) * 18 * u, y - 38 * u + Math.floor(i / 3) * 18 * u, 14 * u, 14 * u, 2 * u, '#dff0ff'); g.restore();
    icing(g, x - 32 * u, x + 32 * u, y - 40 * u, 6 * u, '#9ad8ff');
    door(g, x - 12 * u, y, 14 * u, 22 * u, '#5a9ad8');
    g.save(); g.translate(x + 15 * u, y - 20 * u); g.rotate(t * 1.4); C(g, 0, 0, 14 * u, '#fff', OUT, 2);
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 13 * u, i * 1.047, i * 1.047 + .52); g.closePath(); g.fillStyle = '#ff5a6a'; g.fill(); } C(g, 0, 0, 3 * u, '#fff', OUT, 1.2); g.restore();
    for (let i = 0; i < 3; i++) { const p = (t * .5 + i / 3) % 1; g.save(); g.globalAlpha = 1 - p; RR(g, x + 15 * u + Math.sin(i * 2 + p * 4) * 8 * u, y - 44 * u - p * 22 * u, 4 * u, 4 * u, 1, '#fff', OUT, 1); g.restore(); }
  },
  // Flour Windmill
  lumber(g, x, y, w, lv, t) {
    const u = w / 100;
    K.shadow(g, x, y - 2, w * .42, w * .1);
    poly(g, [[x - 20 * u, y], [x - 13 * u, y - 56 * u], [x + 13 * u, y - 56 * u], [x + 20 * u, y]], '#f6e0b8', OUT, 2);
    roof(g, x, y - 56 * u, 30 * u, 18 * u, '#e8604f');
    door(g, x, y, 13 * u, 20 * u);
    windowP(g, x, y - 34 * u, 8 * u, true);
    g.save(); g.translate(x, y - 58 * u); g.rotate(t * .9);
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); RR(g, -1.6 * u, -34 * u, 3.2 * u, 34 * u, 1, CHOC, OUT, 1.2); RR(g, 1.6 * u, -33 * u, 11 * u, 22 * u, 2, '#fff8ee', OUT, 1.4); }
    C(g, 0, 0, 4 * u, '#ffd45c', OUT, 1.5); g.restore();
    for (const sx of [-1, 1]) { RR(g, x + sx * 30 * u - 7 * u, y - 14 * u, 14 * u, 14 * u, 4 * u, '#f2e2c0', OUT, 1.6); g.strokeStyle = OUT; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + sx * 30 * u - 4 * u, y - 11 * u); g.lineTo(x + sx * 30 * u + 4 * u, y - 11 * u); g.stroke(); }
  },
  // Butter Churn dairy
  mill(g, x, y, w, lv, t) {
    const u = w / 100;
    K.shadow(g, x, y - 2, w * .44, w * .1);
    RR(g, x - 34 * u, y - 40 * u, 46 * u, 40 * u, 4, '#fff3a8', OUT, 2);
    roof(g, x - 11 * u, y - 40 * u, 48 * u, 24 * u, '#ffb02e');
    door(g, x - 11 * u, y, 14 * u, 22 * u);
    poly(g, [[x + 16 * u, y], [x + 19 * u, y - 30 * u], [x + 37 * u, y - 30 * u], [x + 40 * u, y]], '#d9a066', OUT, 2);
    for (const yy of [8, 22]) RR(g, x + 16 * u, y - yy * u, 24 * u, 3 * u, 1, '#8a5a3a');
    const up = Math.sin(t * 5) * 6 * u; RR(g, x + 26.5 * u, y - 52 * u + up, 3 * u, 24 * u, 1.5, '#8a5a3a', OUT, 1.2); RR(g, x + 22 * u, y - 55 * u + up, 12 * u, 4 * u, 2, '#8a5a3a', OUT, 1.2);
    RR(g, x - 28 * u, y - 60 * u, 13 * u, 9 * u, 2, '#fff0a0', OUT, 1.5);
  },
  // Jam Kitchen: a giant jam jar with a chimney
  bakery(g, x, y, w, lv, t) {
    const u = w / 100;
    K.shadow(g, x, y - 2, w * .42, w * .1);
    for (let i = 0; i < 3; i++) { const p = (t * .5 + i / 3) % 1; g.save(); g.globalAlpha = .55 * (1 - p); C(g, x + 20 * u + Math.sin(p * 6 + i) * 4 * u, y - 66 * u - p * 24 * u, (4 + p * 6) * u, '#ffd0e0'); g.restore(); }
    RR(g, x + 15 * u, y - 66 * u, 10 * u, 18 * u, 2, '#b86a4a', OUT, 2);
    RR(g, x - 30 * u, y - 46 * u, 60 * u, 46 * u, 12 * u, '#ff6a8a', OUT, 2);
    g.save(); g.globalAlpha = .35; RR(g, x - 24 * u, y - 40 * u, 8 * u, 30 * u, 4 * u, '#fff'); g.restore();
    RR(g, x - 26 * u, y - 54 * u, 52 * u, 11 * u, 4 * u, '#fff3df', OUT, 2);
    for (let i = 0; i < 5; i++) poly(g, [[x - 26 * u + i * 10.4 * u, y - 44 * u], [x - 15.6 * u + i * 10.4 * u, y - 44 * u], [x - 20.8 * u + i * 10.4 * u, y - 37 * u]], i % 2 ? '#fff' : '#ff9cc0', OUT, 1.2);
    RR(g, x - 13 * u, y - 30 * u, 26 * u, 16 * u, 3, '#fff8ee', OUT, 1.5);
    g.save(); g.translate(x, y - 22 * u); poly(g, [[-4 * u, -4 * u], [4 * u, -4 * u], [0, 5 * u]], '#ff4a5a', OUT, 1.2); E(g, 0, -4.5 * u, 4 * u, 1.8 * u, '#5ab85a'); g.restore();
    door(g, x, y, 12 * u, 12 * u, CHOC);
  },
  // Gingerbread house
  cottage(g, x, y, w, lv, t) {
    const u = w / 100;
    K.shadow(g, x, y - 2, w * .42, w * .1);
    RR(g, x - 28 * u, y - 38 * u, 56 * u, 38 * u, 4, '#c88a52', OUT, 2);
    poly(g, [[x - 34 * u, y - 36 * u], [x, y - 68 * u], [x + 34 * u, y - 36 * u]], '#a8683a', OUT, 2);
    g.beginPath(); g.moveTo(x - 34 * u, y - 36 * u); g.lineTo(x, y - 68 * u); g.lineTo(x + 34 * u, y - 36 * u); g.lineWidth = 6 * u; g.strokeStyle = '#fff'; g.lineJoin = 'round'; g.stroke(); g.lineWidth = 1.2; g.strokeStyle = OUT; g.stroke();
    for (let i = 0; i < 5; i++) C(g, x - 22 * u + i * 11 * u, y - 37 * u + Math.abs(i - 2) * -0 , 2.6 * u, ['#ff5a6a', '#7ac8ff', '#ffd45c', '#8ae08a', '#ff9cc0'][i], OUT, 1);
    door(g, x, y, 14 * u, 22 * u, '#7a4a2a'); windowP(g, x - 17 * u, y - 20 * u, 10 * u, true); windowP(g, x + 17 * u, y - 20 * u, 10 * u, true);
    C(g, x, y - 46 * u, 5 * u, '#fff', OUT, 1.4); g.save(); g.translate(x, y - 46 * u); g.rotate(t); for (let i = 0; i < 3; i++) { g.rotate(2.094); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 4.4 * u, 0, 1); g.closePath(); g.fillStyle = '#ff5a6a'; g.fill(); } g.restore();
  },
  // ---- extra buildings
  honey(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .4, w * .1);
    for (let i = 0; i < 4; i++) { const r = [34, 31, 25, 16][i]; E(g, x, y - 12 * u - i * 15 * u, r * u, 10.5 * u, i % 2 ? '#ffc93c' : '#ffb02e', OUT, 2); g.save(); g.globalAlpha = .35; E(g, x - r * .45 * u, y - 15 * u - i * 15 * u, r * .22 * u, 3 * u, '#fff'); g.restore(); }
    C(g, x, y - 70 * u, 5 * u, '#8a5a3a', OUT, 1.6);
    RR(g, x - 9 * u, y - 18 * u, 18 * u, 18 * u, [9 * u, 9 * u, 0, 0], '#5a3418', OUT, 1.8);
    for (let i = 0; i < 3; i++) { const a = t * 2.2 + i * 2.1, bx = x + Math.cos(a) * (38 + i * 4) * u, by = y - 44 * u + Math.sin(a * 1.3) * 16 * u; E(g, bx - 2 * u, by - 3 * u, 3.4 * u, 2 * u, '#ffffffcc', OUT, .8); E(g, bx, by, 4.2 * u, 3 * u, '#ffd45c', OUT, 1.2); RR(g, bx - 1 * u, by - 3 * u, 1.6 * u, 6 * u, 0, OUT); }
  },
  market(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .44, w * .1);
    RR(g, x - 34 * u, y - 40 * u, 4 * u, 40 * u, 1, '#b8783c', OUT, 1.6); RR(g, x + 30 * u, y - 40 * u, 4 * u, 40 * u, 1, '#b8783c', OUT, 1.6);
    RR(g, x - 32 * u, y - 22 * u, 64 * u, 22 * u, 3, '#e8b070', OUT, 2);
    for (let i = 0; i < 3; i++) { RR(g, x - 28 * u + i * 20 * u, y - 32 * u, 16 * u, 12 * u, 2, '#c98a4e', OUT, 1.5); for (let k = 0; k < 3; k++) C(g, x - 24 * u + i * 20 * u + k * 4.5 * u, y - 33 * u, 3 * u, ['#ff5a6a', '#ffd45c', '#8ae08a'][(i + k) % 3], OUT, 1); }
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(x - 40 * u + i * 13.4 * u, y - 44 * u); g.lineTo(x - 26.6 * u + i * 13.4 * u, y - 44 * u); g.lineTo(x - 28 * u + i * 12.6 * u + 2 * u, y - 62 * u); g.lineTo(x - 38 * u + i * 12.6 * u, y - 62 * u); g.closePath(); g.fillStyle = i % 2 ? '#fff6e6' : '#5ac8d8'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); C(g, x - 33.3 * u + i * 13.4 * u, y - 44 * u, 6.7 * u, i % 2 ? '#fff6e6' : '#5ac8d8', OUT, 1.6); }
    RR(g, x - 12 * u, y - 76 * u, 24 * u, 12 * u, 4, '#fff6e6', OUT, 1.6); C(g, x, y - 70 * u, 3.4 * u, '#ff9cc0', OUT, 1);
  },
  dairy(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .44, w * .1);
    poly(g, [[x - 32 * u, y], [x - 32 * u, y - 38 * u], [x - 20 * u, y - 60 * u], [x + 20 * u, y - 60 * u], [x + 32 * u, y - 38 * u], [x + 32 * u, y]], '#ff6a6a', OUT, 2);
    poly(g, [[x - 36 * u, y - 36 * u], [x - 22 * u, y - 63 * u], [x + 22 * u, y - 63 * u], [x + 36 * u, y - 36 * u], [x + 30 * u, y - 36 * u], [x + 19 * u, y - 56 * u], [x - 19 * u, y - 56 * u], [x - 30 * u, y - 36 * u]], '#fff6e6', OUT, 1.8);
    RR(g, x - 13 * u, y - 26 * u, 26 * u, 26 * u, 2, '#fff6e6', OUT, 1.8); g.beginPath(); g.moveTo(x - 13 * u, y - 26 * u); g.lineTo(x + 13 * u, y); g.moveTo(x + 13 * u, y - 26 * u); g.lineTo(x - 13 * u, y); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke();
    C(g, x, y - 44 * u, 7 * u, '#a8dcf2', OUT, 1.6);
    RR(g, x + 36 * u, y - 20 * u, 10 * u, 20 * u, 3, '#fff', OUT, 1.6); RR(g, x + 38 * u, y - 27 * u, 6 * u, 8 * u, 2, '#fff', OUT, 1.6); RR(g, x + 37.5 * u, y - 29 * u, 7 * u, 3 * u, 1, '#7ac8ff', OUT, 1.2);
  },
  jamfair(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .44, w * .1);
    g.beginPath(); g.moveTo(x - 34 * u, y); g.lineTo(x - 34 * u, y - 30 * u); g.quadraticCurveTo(x - 34 * u, y - 62 * u, x, y - 62 * u); g.quadraticCurveTo(x + 34 * u, y - 62 * u, x + 34 * u, y - 30 * u); g.lineTo(x + 34 * u, y); g.closePath(); g.fillStyle = '#c8f0ecdd'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    g.save(); g.clip(); for (let i = 0; i < 4; i++) { const bx = x - 24 * u + i * 16 * u; RR(g, bx - 1.2 * u, y - 34 * u, 2.4 * u, 34 * u, 1, '#5ab85a'); for (let k = 0; k < 4; k++) C(g, bx + (k % 2 ? 4 : -4) * u, y - 10 * u - k * 8 * u + Math.sin(t * 2 + i + k) * u, 3.6 * u, ['#7a5cff', '#ff5a8a', '#5a7aff', '#ff4a5a'][(i + k) % 4], OUT, 1); } g.restore();
    g.lineWidth = 1.6; g.strokeStyle = '#fff'; g.beginPath(); for (const dx of [-17, 0, 17]) { g.moveTo(x + dx * u, y); g.lineTo(x + dx * u, y - (dx ? 55 : 62) * u); } g.moveTo(x - 34 * u, y - 30 * u); g.lineTo(x + 34 * u, y - 30 * u); g.stroke();
    RR(g, x - 37 * u, y - 5 * u, 74 * u, 6 * u, 2, '#fff6e6', OUT, 1.6);
  },
  cutter(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .42, w * .1);
    RR(g, x + 14 * u, y - 70 * u, 10 * u, 22 * u, 2, '#8a8fa0', OUT, 1.8);
    for (let i = 0; i < 3; i++) { const p = (t * .5 + i / 3) % 1; g.save(); g.globalAlpha = .5 * (1 - p); C(g, x + 19 * u + Math.sin(p * 5 + i) * 3 * u, y - 72 * u - p * 20 * u, (3 + p * 5) * u, '#fff'); g.restore(); }
    RR(g, x - 30 * u, y - 40 * u, 60 * u, 40 * u, 4, '#9ad0e8', OUT, 2); roof(g, x, y - 40 * u, 64 * u, 20 * u, '#5a7ab8');
    C(g, x, y - 44 * u, 11 * u, '#fff6e6', OUT, 1.8); star(g, x, y - 44 * u, 8 * u, '#ffd45c', Math.sin(t * 2) * .25); star(g, x, y - 44 * u, 4.4 * u, '#fff6e6', Math.sin(t * 2) * .25);
    door(g, x - 12 * u, y, 13 * u, 20 * u, CHOC); windowP(g, x + 14 * u, y - 16 * u, 12 * u, true);
  },
  booth(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .36, w * .09);
    RR(g, x - 22 * u, y - 44 * u, 44 * u, 44 * u, 4, '#fff6e6', OUT, 2);
    g.save(); g.beginPath(); g.rect(x - 22 * u, y - 44 * u, 44 * u, 44 * u); g.clip(); for (let i = 0; i < 4; i++) RR(g, x - 22 * u + i * 12 * u, y - 44 * u, 6 * u, 44 * u, 0, '#ff7aa8'); g.restore(); RR(g, x - 22 * u, y - 44 * u, 44 * u, 44 * u, 4, null, OUT, 2);
    RR(g, x - 13 * u, y - 34 * u, 26 * u, 16 * u, [8 * u, 8 * u, 2, 2], '#3a2433', OUT, 1.8); RR(g, x - 16 * u, y - 19 * u, 32 * u, 4 * u, 2, '#b8783c', OUT, 1.4);
    poly(g, [[x - 28 * u, y - 44 * u], [x, y - 66 * u], [x + 28 * u, y - 44 * u]], '#7b5cff', OUT, 2);
    RR(g, x - .8 * u, y - 80 * u, 1.6 * u, 16 * u, 0, OUT); poly(g, [[x, y - 80 * u], [x + 12 * u + Math.sin(t * 4) * u, y - 76 * u], [x, y - 72 * u]], '#ffd45c', OUT, 1.2);
    RR(g, x - 9 * u, y - 13 * u, 18 * u, 9 * u, 2, '#ffd45c', OUT, 1.4);
  },
  parlour(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .42, w * .1);
    RR(g, x - 30 * u, y - 40 * u, 60 * u, 40 * u, 6, '#b9ecd8', OUT, 2);
    for (let i = 0; i < 5; i++) C(g, x - 24 * u + i * 12 * u, y - 40 * u, 6.4 * u, i % 2 ? '#fff6e6' : '#ff9cc0', OUT, 1.6);
    RR(g, x - 33 * u, y - 47 * u, 66 * u, 8 * u, 3, '#fff6e6', OUT, 1.8);
    poly(g, [[x - 9 * u, y - 47 * u], [x + 9 * u, y - 47 * u], [x, y - 47 * u + 0.1]], '#e8b070'); poly(g, [[x - 9 * u, y - 60 * u], [x + 9 * u, y - 60 * u], [x, y - 44 * u]], '#e8b070', OUT, 1.6);
    C(g, x, y - 65 * u, 9.5 * u, '#ff9cc0', OUT, 1.8); C(g, x - 6 * u, y - 74 * u, 7 * u, '#fff6e6', OUT, 1.8); C(g, x + 5 * u, y - 76 * u, 6.4 * u, '#9ad8ff', OUT, 1.8); C(g, x + 5 * u, y - 84 * u, 2.6 * u, '#ff4a5a', OUT, 1.2);
    door(g, x + 14 * u, y, 13 * u, 22 * u, '#ff7aa8'); RR(g, x - 24 * u, y - 26 * u, 26 * u, 16 * u, 3, '#fff8ee', OUT, 1.6);
    for (let i = 0; i < 3; i++) C(g, x - 18 * u + i * 7 * u, y - 16 * u, 2.8 * u, ['#ff9cc0', '#ffd45c', '#9ad8ff'][i], OUT, 1);
  },
  teahouse(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .44, w * .1);
    for (let i = 0; i < 3; i++) { const p = (t * .4 + i / 3) % 1; g.save(); g.globalAlpha = .5 * (1 - p); C(g, x + 40 * u + Math.sin(p * 5 + i) * 3 * u, y - 52 * u - p * 22 * u, (3 + p * 5) * u, '#fff'); g.restore(); }
    g.beginPath(); g.moveTo(x + 26 * u, y - 26 * u); g.quadraticCurveTo(x + 44 * u, y - 28 * u, x + 42 * u, y - 48 * u); g.lineWidth = 8 * u; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke(); g.lineWidth = 5 * u; g.strokeStyle = '#9ad8ff'; g.stroke();
    E(g, x - 34 * u, y - 28 * u, 9 * u, 13 * u, null, OUT, 7 * u); E(g, x - 34 * u, y - 28 * u, 9 * u, 13 * u, null, '#9ad8ff', 4 * u);
    E(g, x, y - 27 * u, 32 * u, 27 * u, '#9ad8ff', OUT, 2); g.save(); g.globalAlpha = .4; E(g, x - 14 * u, y - 38 * u, 6 * u, 10 * u, '#fff', null, 0, .5); g.restore();
    for (let i = 0; i < 6; i++) C(g, x + Math.cos(i * 1.05 + .5) * 22 * u, y - 27 * u + Math.sin(i * 1.05 + .5) * 17 * u, 2.6 * u, '#fff6e6');
    E(g, x, y - 53 * u, 17 * u, 5 * u, '#fff6e6', OUT, 1.8); C(g, x, y - 60 * u, 4.6 * u, '#ff9cc0', OUT, 1.6);
    door(g, x, y - 1 * u, 13 * u, 20 * u, CHOC); windowP(g, x - 17 * u, y - 30 * u, 9 * u, true); windowP(g, x + 17 * u, y - 30 * u, 9 * u, true);
  },
  school(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .46, w * .1);
    RR(g, x - 36 * u, y - 34 * u, 72 * u, 34 * u, 3, '#ffd9a0', OUT, 2); roof(g, x, y - 34 * u, 76 * u, 14 * u, '#d85a5a');
    RR(g, x - 11 * u, y - 62 * u, 22 * u, 34 * u, 2, '#ffe9c8', OUT, 2); roof(g, x, y - 62 * u, 24 * u, 14 * u, '#d85a5a');
    C(g, x, y - 50 * u, 6 * u, '#ffd45c', OUT, 1.6); C(g, x, y - 45 * u + Math.sin(t * 3) * u, 1.8 * u, OUT);
    RR(g, x - .8 * u, y - 90 * u, 1.6 * u, 15 * u, 0, OUT); poly(g, [[x, y - 90 * u], [x + 11 * u + Math.sin(t * 4) * u, y - 86.5 * u], [x, y - 83 * u]], '#7ac8ff', OUT, 1.2);
    door(g, x, y, 13 * u, 20 * u, CHOC); for (const dx of [-25, 25]) windowP(g, x + dx * u, y - 18 * u, 11 * u, true);
    RR(g, x - 9 * u, y - 31 * u, 18 * u, 7 * u, 2, '#3a5a4a', OUT, 1.2);
  },
  clock(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .34, w * .09);
    RR(g, x - 20 * u, y - 14 * u, 40 * u, 14 * u, 3, '#c98a4e', OUT, 2);
    RR(g, x - 15 * u, y - 70 * u, 30 * u, 58 * u, 3, '#ffb8d4', OUT, 2); g.save(); g.globalAlpha = .3; RR(g, x - 12 * u, y - 66 * u, 5 * u, 50 * u, 2, '#fff'); g.restore();
    for (let i = 0; i < 3; i++) RR(g, x - 15 * u, y - 26 * u - i * 0, 30 * u, 0, 0);
    RR(g, x - 19 * u, y - 76 * u, 38 * u, 8 * u, 3, '#fff6e6', OUT, 1.8); roof(g, x, y - 76 * u, 34 * u, 20 * u, '#7b5cff');
    C(g, x, y - 100 * u, 5 * u, '#ff5a8a', OUT, 1.6);
    C(g, x, y - 52 * u, 11.5 * u, '#fff6e6', OUT, 2); g.lineCap = 'round'; g.strokeStyle = OUT;
    g.lineWidth = 2 * u; g.beginPath(); g.moveTo(x, y - 52 * u); g.lineTo(x + Math.sin(t * .3) * 5.5 * u, y - 52 * u - Math.cos(t * .3) * 5.5 * u); g.stroke();
    g.lineWidth = 1.4 * u; g.beginPath(); g.moveTo(x, y - 52 * u); g.lineTo(x + Math.sin(t * 2) * 8.5 * u, y - 52 * u - Math.cos(t * 2) * 8.5 * u); g.stroke();
    door(g, x, y, 11 * u, 16 * u, CHOC); windowP(g, x, y - 28 * u, 8 * u, true);
  },
  lighthouse(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .36, w * .09);
    g.save(); g.globalAlpha = .28 + Math.sin(t * 2) * .1; poly(g, [[x, y - 84 * u], [x + Math.cos(t) * 70 * u, y - 100 * u], [x + Math.cos(t) * 70 * u, y - 68 * u]], '#fff2a8'); g.restore();
    RR(g, x - 24 * u, y - 10 * u, 48 * u, 10 * u, 3, '#b8783c', OUT, 2);
    const body = [[x - 17 * u, y - 10 * u], [x - 11 * u, y - 74 * u], [x + 11 * u, y - 74 * u], [x + 17 * u, y - 10 * u]];
    poly(g, body, '#fff6e6', OUT, 2); g.save(); g.beginPath(); body.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.clip();
    for (let i = 0; i < 5; i++) poly(g, [[x - 24 * u, y - 16 * u - i * 16 * u], [x + 24 * u, y - 28 * u - i * 16 * u], [x + 24 * u, y - 20 * u - i * 16 * u], [x - 24 * u, y - 8 * u - i * 16 * u]], '#ff5a6a'); g.restore(); poly(g, body, null, OUT, 2);
    RR(g, x - 15 * u, y - 79 * u, 30 * u, 6 * u, 2, '#8a5a3a', OUT, 1.6); RR(g, x - 9 * u, y - 93 * u, 18 * u, 15 * u, 2, '#fff2a8', OUT, 1.8); C(g, x, y - 86 * u, 4 * u + Math.sin(t * 4) * u, '#fff');
    roof(g, x, y - 93 * u, 20 * u, 11 * u, '#ff5a6a'); door(g, x, y - 10 * u, 10 * u, 15 * u, CHOC);
  },
  // Magic Oven: where new friends are baked
  well(g, x, y, w, lv, t) {
    const u = w / 100;
    K.shadow(g, x, y - 2, w * .42, w * .1);
    RR(g, x - 7 * u, y - 78 * u, 14 * u, 22 * u, 3, '#b86a4a', OUT, 2);
    for (let i = 0; i < 3; i++) { const p = (t * .5 + i / 3) % 1; star(g, x + Math.sin(i * 2.1 + t) * 10 * u, y - 80 * u - p * 26 * u, (1 - p) * 6 * u, ['#fff2a8', '#ff9cc0', '#9ad8ff'][i], t * 2 + i); }
    g.beginPath(); g.moveTo(x - 34 * u, y); g.lineTo(x - 34 * u, y - 34 * u); g.quadraticCurveTo(x - 34 * u, y - 64 * u, x, y - 64 * u); g.quadraticCurveTo(x + 34 * u, y - 64 * u, x + 34 * u, y - 34 * u); g.lineTo(x + 34 * u, y); g.closePath(); g.fillStyle = '#e88a5a'; g.fill(); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke();
    g.save(); g.globalAlpha = .3; for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) RR(g, x - 30 * u + i * 16 * u + (r % 2) * 8 * u, y - 14 * u - r * 12 * u, 13 * u, 9 * u, 2, '#fff'); g.restore();
    const glow = .75 + Math.sin(t * 5) * .25;
    RR(g, x - 19 * u, y - 36 * u, 38 * u, 30 * u, [16 * u, 16 * u, 3, 3], '#3a1e14', OUT, 2);
    g.save(); g.globalAlpha = glow; RR(g, x - 15 * u, y - 30 * u, 30 * u, 23 * u, [13 * u, 13 * u, 2, 2], '#ffb02e'); E(g, x, y - 14 * u, 9 * u, 9 * u * glow, '#fff2a8'); g.restore();
    RR(g, x - 24 * u, y - 6 * u, 48 * u, 6 * u, 2, '#8a5a3a', OUT, 1.6);
    star(g, x, y - 48 * u, 6 * u, '#ffd45c', t * .8);
  },
  // Chocolate fountain
  fountain(g, x, y, w, lv, t) {
    const u = w / 100;
    E(g, x, y - 14 * u, 44 * u, 16 * u, '#f6e6c8', OUT, 2); E(g, x, y - 16 * u, 37 * u, 12 * u, '#7a4a2a', OUT, 1.6);
    for (const [ty, tw] of [[30, 26], [48, 17], [62, 9]]) { RR(g, x - 3 * u, y - ty * u, 6 * u, 16 * u, 2, '#f6e6c8', OUT, 1.6); E(g, x, y - ty * u, tw * u, 5 * u, '#8a5632', OUT, 1.8);
      for (let i = 0; i < 5; i++) { const px = x + (i - 2) * tw * .42 * u, p = (t * 1.2 + i * .23 + ty) % 1; RR(g, px - 1.6 * u, y - ty * u + 2 * u, 3.2 * u, (5 + p * 9) * u, 1.6 * u, '#7a4a2a'); } }
    C(g, x, y - 68 * u, 4.5 * u, '#e8323c', OUT, 1.4);
  },
  statue(g, x, y, w, lv, t) {
    const u = w / 100;
    K.shadow(g, x, y - 2, w * .34, w * .09);
    RR(g, x - 22 * u, y - 18 * u, 44 * u, 18 * u, 3, '#f2c888', OUT, 2); icing(g, x - 23 * u, x + 23 * u, y - 16 * u, 4 * u, CREAM);
    g.save(); g.filter = 'sepia(1) saturate(1.6) brightness(1.05)'; window.CKSweets.draw(g, x, y - 18 * u, u * 1.5, {id: 'chip', pose: 'win', t: .26, tool: false}); g.restore();
  },
  // Giant cherry decoration
  cherry(g, x, y, w, lv, t) {
    const u = w / 100; K.shadow(g, x, y - 2, w * .3, w * .08);
    g.strokeStyle = '#4a7a2a'; g.lineWidth = 3 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 12 * u, y - 30 * u); g.quadraticCurveTo(x - 4 * u, y - 70 * u, x + 10 * u, y - 76 * u); g.moveTo(x + 14 * u, y - 26 * u); g.quadraticCurveTo(x + 14 * u, y - 60 * u, x + 10 * u, y - 76 * u); g.stroke();
    E(g, x + 20 * u, y - 76 * u, 12 * u, 5 * u, '#6cc070', OUT, 1.5, -.3);
    C(g, x - 14 * u, y - 20 * u, 19 * u, '#e8323c', OUT, 2); C(g, x + 16 * u, y - 17 * u, 16 * u, '#d82a3a', OUT, 2);
    g.save(); g.globalAlpha = .5; E(g, x - 20 * u, y - 28 * u, 5 * u, 3 * u, '#fff'); E(g, x + 11 * u, y - 24 * u, 4 * u, 2.4 * u, '#fff'); g.restore();
  }
};
// decor drawn straight from the kit's scenery
const DECOR = {tree: 'tree', flowers: 'flowers', lamp: 'lamp', fence: 'fence', candytree: 'candyTree', lolly: 'lolly', gumdrop: 'gumdrop', crystals: 'crystals'};

function building(g, type, x, y, w, o = {}) {
  const img = pic('building-' + type + '-' + (o.lv || 1), 'building-' + type, 'decor-' + type);
  const t = o.t || 0;
  g.save();
  if (o.alpha != null) g.globalAlpha = o.alpha;
  if (o.pop) { g.translate(x, y); g.scale(1 + o.pop * .12, 1 - o.pop * .1); g.translate(-x, -y); }
  if (img) { const h = w * img.height / img.width; g.drawImage(img, x - w / 2, y - h, w, h); }
  else if (PAINT[type]) PAINT[type](g, x, y, w, o.lv || 1, t);
  else if (DECOR[type] && S[DECOR[type]]) S[DECOR[type]](g, x, y - w * .12, w / 34, o.seed || 1, t);
  else RR(g, x - w / 2, y - w, w, w, 8, '#ccc', OUT, 2);
  g.restore();
  if (o.badge) levelPips(g, x, y + 3, o.lv);
}

/* A small ready-made picture of a cat for menus (drawn once into its own canvas). */
function portrait(id, size, o = {}) {
  const c = document.createElement('canvas'), d = Math.min(3, window.devicePixelRatio || 1);
  c.width = c.height = size * d; c.style.width = c.style.height = size + 'px';
  const g = c.getContext('2d'); g.scale(d, d);
  const img = pic('portrait-' + id);
  if (img) g.drawImage(img, 0, 0, size, size);
  else hero(g, size / 2, size * .92, size / 50, {id, pose: o.pose || 'idle', t: .3, tool: false});
  return c;
}
function thumb(type, size) {
  const c = document.createElement('canvas'), d = Math.min(3, window.devicePixelRatio || 1);
  c.width = c.height = size * d; c.style.width = c.style.height = size + 'px';
  const g = c.getContext('2d'); g.scale(d, d);
  building(g, type, size / 2, size * .92, size * .82, {t: .5, lv: 1});
  return c;
}

window.CKArt = {load, pic, hasFile: f => fileSet.has(f.toLowerCase()), sprite, hero, cat, foe, boss, building, portrait, thumb, isReady: () => ready, kit: K, scene: S};
})();
