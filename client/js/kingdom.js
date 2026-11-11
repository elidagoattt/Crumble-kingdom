/* Crumble Kingdom: the kingdom view.
 * A cake island in a strawberry-milk sea that you can drag and pinch-zoom. Tap a building to collect what it made or open its panel;
 * the build menu hands a building here to be placed on the grid. Your sweets wander about between the buildings.
 */
(() => {
'use strict';
const D = window.CKData, CK = window.CK, Art = window.CKArt, K = Art.kit;
const T = 52;                         // one tile in world pixels
let canvas, g, raf = 0, last = 0, time = 0, visible = false;
const cam = {x: 0, y: 0, z: 1};
let vw = 0, vh = 0, dpr = 1;
let placing = null;                   // {type, x, y, id?} while a building is being placed or moved
let walkers = [], floats = [], pops = {};
const pointers = new Map(); let drag = null, pinch = null;

function init(el) {
  canvas = el; g = canvas.getContext('2d');
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', moveP);
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : .9); }, {passive: false});
  window.addEventListener('resize', resize); resize();
  const castle = CK.state.buildings.find(b => b.type === 'castle');
  cam.z = Math.min(1.2, Math.max(.55, Math.min(vw, vh * 1.6) / (T * 9)));
  centerOn((castle.x + 1) * T, (castle.y + 1.2) * T);
  syncWalkers(); CK.onChange(syncWalkers);
}
function resize() { if (!canvas) return; dpr = Math.min(2.5, window.devicePixelRatio || 1); vw = canvas.clientWidth; vh = canvas.clientHeight; canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr); }
function show() { if (visible) return; visible = true; resize(); last = performance.now(); raf = requestAnimationFrame(frame); }
function hide() { visible = false; cancelAnimationFrame(raf); }
function centerOn(wx, wy) { cam.x = wx - vw / cam.z / 2; cam.y = wy - vh / cam.z / 2; clampCam(); }
function clampCam() {
  const n = D.GRID * T, m = 160, w = vw / cam.z, h = vh / cam.z;
  cam.x = w >= n + m * 2 ? (n - w) / 2 : Math.max(-m, Math.min(n + m - w, cam.x));       // a view wider than the island keeps it centred
  cam.y = h >= n + m * 2 ? (n - h) / 2 : Math.max(-m, Math.min(n + m - h, cam.y));
}
function zoomAt(cx, cy, f) { const r = canvas.getBoundingClientRect(), sx = cx - r.left, sy = cy - r.top, wx = cam.x + sx / cam.z, wy = cam.y + sy / cam.z; cam.z = Math.max(Math.min(vw, vh) / (D.GRID * T + 200), Math.min(2, cam.z * f)); cam.x = wx - sx / cam.z; cam.y = wy - sy / cam.z; clampCam(); }
const toWorld = (cx, cy) => { const r = canvas.getBoundingClientRect(); return {x: cam.x + (cx - r.left) / cam.z, y: cam.y + (cy - r.top) / cam.z}; };

// ---------------------------------------------------------------- sweets that wander
function syncWalkers() {
  const S = CK.state, want = Math.min(10, 3 + CK.countOf('cottage') * 2), ids = Object.keys(S.cats).slice(0, want);
  walkers = walkers.filter(w => ids.includes(w.id));
  for (const id of ids) if (!walkers.some(w => w.id === id)) { const p = freeSpot(); walkers.push({id, x: p.x, y: p.y, tx: p.x, ty: p.y, wait: Math.random() * 3, pose: 'idle', flip: false, t: Math.random() * 9}); }
}
function blocked(wx, wy) { const tx = wx / T, ty = wy / T; return CK.state.buildings.some(b => { const s = D.BUILDINGS[b.type].size; return tx > b.x - .2 && tx < b.x + s + .2 && ty > b.y - .1 && ty < b.y + s + .3; }); }
function freeSpot() { const o = CK.landStart() * T, n = CK.land() * T; for (let i = 0; i < 40; i++) { const x = o + 20 + Math.random() * (n - 40), y = o + 30 + Math.random() * (n - 50); if (!blocked(x, y)) return {x, y}; } return {x: o + n / 2, y: o + n - 20}; }
function stepWalkers(dt) {
  for (const w of walkers) {
    w.t += dt;
    const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
    if (d > 3) { const nx = w.x + dx / d * 34 * dt, ny = w.y + dy / d * 34 * dt; if (blocked(nx, ny)) { w.tx = w.x; w.ty = w.y; } else { w.x = nx; w.y = ny; } w.pose = 'walk'; w.flip = dx < 0; }
    else { w.wait -= dt; if (w.pose === 'walk') { w.pose = ['idle', 'idle', 'nap', 'play', 'dance'][Math.floor(Math.random() * 5)]; w.wait = 2 + Math.random() * 5; }
      if (w.wait <= 0) { const p = freeSpot(); if (Math.hypot(p.x - w.x, p.y - w.y) < 260) { w.tx = p.x; w.ty = p.y; } w.wait = 1; } }
  }
}

// ---------------------------------------------------------------- drawing
function drawLand() {
  const n = D.GRID * T;
  // a sea of strawberry milk
  const sea = g.createLinearGradient(0, cam.y, 0, cam.y + vh / cam.z); sea.addColorStop(0, '#ffd3e2'); sea.addColorStop(1, '#ffb3cf');
  g.fillStyle = sea; g.fillRect(cam.x, cam.y, vw / cam.z, vh / cam.z);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < 60; i++) { const wx = ((i * 211) % (n + 600)) - 300, wy = ((i * 137) % (n + 600)) - 300 + Math.sin(time + i) * 4, len = 18 + (i % 4) * 8; g.beginPath(); g.moveTo(wx + Math.sin(time * .6 + i) * 10, wy); g.lineTo(wx + len + Math.sin(time * .6 + i) * 10, wy); g.stroke(); }
  // the island is a big sponge cake: cream foam, golden sponge side, mint frosting on top
  const pulse = 3 + Math.sin(time * 1.4) * 2;
  K.RR(g, -34 - pulse, -34 - pulse, n + 68 + pulse * 2, n + 84 + pulse * 2, 70, 'rgba(255,255,255,.6)');
  K.RR(g, -22, -22, n + 44, n + 66, 58, '#e8b060', '#b8782e', 3);
  g.fillStyle = '#ff7aa8'; K.RR(g, -22, n + 16, n + 44, 7, 0, '#ff8ab0');                         // jam layer in the sponge
  K.RR(g, -22, -22, n + 44, n + 44, 58, '#fff6e6', '#e0c8a0', 3);                               // cream edge
  // drips of cream down the front of the cake
  g.fillStyle = '#fff6e6'; for (let i = 0; i < Math.floor(n / 44); i++) { const dx = 10 + i * 44 + (i % 3) * 5, len = 10 + (i * 7 % 3) * 7; K.RR(g, dx, n + 14, 13, len, 6.5, '#fff6e6'); }
  K.RR(g, -8, -8, n + 16, n + 16, 44, '#bfeccd', '#8fd0a8', 3);
  // soft checker so the grid can be felt without lines
  g.save(); g.beginPath(); g.roundRect ? g.roundRect(-6, -6, n + 12, n + 12, 42) : g.rect(-6, -6, n + 12, n + 12); g.clip();
  g.fillStyle = 'rgba(255,255,255,.16)';
  for (let y = 0; y < n / T; y++) for (let x = 0; x < n / T; x++) if ((x + y) % 2) g.fillRect(x * T, y * T, T, T);
  if (placing) { const o = CK.landStart() * T, m = CK.land() * T; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; for (let i = 0; i <= m / T; i++) { g.beginPath(); g.moveTo(o + i * T, o); g.lineTo(o + i * T, o + m); g.moveTo(o, o + i * T); g.lineTo(o + m, o + i * T); g.stroke(); } }
  // sprinkles scattered on the frosting
  const cols = ['#ff7aa8', '#7ac8ff', '#ffd45c', '#fff', '#b48af0'];
  for (let i = 0; i < 420; i++) { const x = (i * 97.3) % n, y = (i * 61.7) % n; if (x < cam.x - 10 || x > cam.x + vw / cam.z + 10 || y < cam.y - 10 || y > cam.y + vh / cam.z + 10) continue; g.save(); g.translate(x, y); g.rotate(i * 1.7); K.RR(g, -4, -1.3, 8, 2.6, 1.3, cols[i % 5]); g.restore(); }
  g.restore();
}


/* Land the castle has not cleared yet is hidden under big mint leaves. Each Castle level clears a wider square. */
const LEAF = ['#5fbf6a', '#4fae5c', '#6fcf7a', '#48a056'];
function drawLeafTile(x, y) {
  const cx = x * T + T / 2, cy = y * T + T / 2, k = (x * 7 + y * 13) % 4, sway = Math.sin(time * 1.2 + x * .7 + y * .9) * 1.5;
  K.E(g, cx + sway, cy + 4, T * .62, T * .5, LEAF[k], '#2f7a40', 2, (k - 1.5) * .3);
  K.E(g, cx - T * .18 + sway, cy - T * .2, T * .42, T * .3, LEAF[(k + 1) % 4], '#2f7a40', 1.6, -.5 + k * .2);
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - T * .3 + sway, cy + 6); g.quadraticCurveTo(cx + sway, cy - 2, cx + T * .32 + sway, cy + 2); g.stroke();
  if ((x * 5 + y * 3) % 11 === 0) { K.C(g, cx + 8, cy - 6, 5, '#ff8ab0', '#3a2433', 1.4); K.C(g, cx + 8, cy - 6, 1.8, '#ffe38a'); }
}
function drawLeaves() {
  const x0 = Math.max(0, Math.floor(cam.x / T) - 1), x1 = Math.min(D.GRID - 1, Math.ceil((cam.x + vw / cam.z) / T)), y0 = Math.max(0, Math.floor(cam.y / T) - 1), y1 = Math.min(D.GRID - 1, Math.ceil((cam.y + vh / cam.z) / T));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!CK.cleared(x, y)) drawLeafTile(x, y);
  // a signpost on the edge of the next ring says what unlocks it
  const lv = CK.state.castle; if (lv >= D.CASTLE.length - 1) return;
  const o = CK.landStart(), n = CK.land(), sx = (o + n / 2) * T, sy = (o + n) * T + T * .55, txt = '🔒 Castle Lv ' + (lv + 1) + ' clears more land';
  g.font = "900 15px 'Trebuchet MS',system-ui,sans-serif"; const w = g.measureText(txt).width + 26;
  K.RR(g, sx - 3, sy - 2, 6, 30, 2, '#8a5a3a', '#3a2433', 1.6); K.RR(g, sx - w / 2, sy - 26, w, 28, 9, '#fff6e6', '#3a2433', 2.4);
  g.fillStyle = '#3a2433'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, sx, sy - 11.5);
}
function burstLeaves() { const o = CK.landStart() * T, n = CK.land() * T; for (let i = 0; i < 90; i++) { const side = i % 4, p = Math.random() * n; const x = side === 0 ? o + p : side === 1 ? o + n : side === 2 ? o + p : o, y = side === 0 ? o : side === 1 ? o + p : side === 2 ? o + n : o + p; leafBits.push({x, y, vx: (Math.random() - .5) * 220, vy: -60 - Math.random() * 200, r: Math.random() * 6.28, t: 0, c: LEAF[i % 4]}); } }
let leafBits = [];

function drawBuilding(b, ghost) {
  const def = D.BUILDINGS[b.type], size = def.size, cx = (b.x + size / 2) * T, by = (b.y + size) * T - 5, w = size * T * (def.decor ? .92 : 1.02);
  const pop = pops[b.id] ? Math.max(0, pops[b.id]) : 0;
  Art.building(g, b.type, cx, by, w, {t: time + b.id, lv: b.lv, seed: b.id, pop: Math.sin(pop * Math.PI) * 1.2, alpha: ghost ? .75 : 1, badge: !def.decor && !ghost});
  if (ghost) return;
  if (def.make) {
    const have = CK.stored(b), cap = CK.capOf(b);
    if (have >= Math.max(1, cap * .12)) {
      const full = have >= cap, bob = Math.sin(time * 3 + b.id) * 4, y = by - w * .86 + bob;
      K.E(g, cx, y, 19, 19, full ? '#ffe38a' : '#fff', '#3a2433', 2.4); K.poly(g, [[cx - 6, y + 16], [cx, y + 26], [cx + 6, y + 16]], full ? '#ffe38a' : '#fff', '#3a2433', 2.4); K.E(g, cx, y + 14, 6, 3, full ? '#ffe38a' : '#fff');
      g.font = '19px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(D.RES[def.make].icon, cx, y + 1);
    }
  }
}

function draw() {
  g.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, -cam.x * dpr * cam.z, -cam.y * dpr * cam.z);
  drawLand();
  const snowy = CK.festive();
  if (snowy) { const n = D.GRID * T; K.RR(g, -22, -22, n + 44, n + 44, 58, 'rgba(255,255,255,.62)'); g.fillStyle = 'rgba(190,225,255,.5)'; for (let i = 0; i < 70; i++) K.E(g, (i * 263) % n, (i * 149) % n, 16 + (i % 3) * 7, 5 + (i % 2) * 2, 'rgba(200,228,250,.45)'); }
  const S = CK.state, items = [];
  for (const b of S.buildings) { if (placing && placing.id === b.id) continue; items.push({y: (b.y + D.BUILDINGS[b.type].size) * T, b}); }
  for (const w of walkers) items.push({y: w.y, w});
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    if (it.b) drawBuilding(it.b);
    else { const w = it.w; K.shadow(g, w.x, w.y + 1, 11, 4); Art.hero(g, w.x, w.y, .86, {id: w.id, pose: w.pose, t: w.t, flip: w.flip, tool: false}); }
  }
  drawLeaves();
  for (const p of leafBits) { g.save(); g.globalAlpha = Math.max(0, 1 - p.t / 1.2); g.translate(p.x, p.y); g.rotate(p.r + p.t * 5); K.E(g, 0, 0, 12, 6, p.c, '#2f7a40', 1.4); g.restore(); }
  if (placing) {
    const size = D.BUILDINGS[placing.type].size, ok = CK.fits(placing.type, placing.x, placing.y, placing.id);
    K.RR(g, placing.x * T + 2, placing.y * T + 2, size * T - 4, size * T - 4, 10, ok ? 'rgba(120,255,140,.45)' : 'rgba(255,90,90,.5)', ok ? '#3ad05a' : '#e03a3a', 3);
    drawBuilding({id: placing.id || 0, type: placing.type, x: placing.x, y: placing.y, lv: placing.lv || 1}, true);
  }
  if (snowy) { g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { const sp = 22 + (i % 5) * 9, x = ((i * 97.3 + Math.sin(time * .7 + i) * 18 + time * (i % 3 - 1) * 6) % (vw + 40) + vw + 40) % (vw + 40) - 20, y = (i * 53.7 + time * sp) % (vh + 20) - 10; g.globalAlpha = .55 + (i % 4) * .12; g.beginPath(); g.arc(x, y, 1.6 + (i % 3) * .9, 0, 6.283); g.fill(); } g.restore(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const f of floats) { g.save(); g.globalAlpha = Math.min(1, (1.2 - f.t) * 2.5); g.font = "900 20px 'Trebuchet MS',system-ui,sans-serif"; g.lineWidth = 4; g.strokeStyle = '#2a1d36'; g.strokeText(f.str, f.x, f.y); g.fillStyle = '#fff'; g.fillText(f.str, f.x, f.y); g.restore(); }
}

function frame(nowT) {
  if (!visible) return;
  const dt = Math.min(.05, (nowT - last) / 1000); last = nowT; time += dt;
  stepWalkers(dt);
  for (const f of floats) { f.t += dt; f.y -= 40 * dt; } floats = floats.filter(f => f.t < 1.2);
  for (const p of leafBits) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; } leafBits = leafBits.filter(p => p.t < 1.2);
  for (const k of Object.keys(pops)) { pops[k] -= dt * 2.4; if (pops[k] <= 0) delete pops[k]; }
  draw();
  raf = requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- touch
function down(e) {
  canvas.setPointerCapture?.(e.pointerId); pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = {d: Math.hypot(a.x - b.x, a.y - b.y)}; drag = null; return; }
  const w = toWorld(e.clientX, e.clientY);
  drag = {sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false, ghost: false};
  if (placing) { const size = D.BUILDINGS[placing.type].size; if (w.x > placing.x * T - 10 && w.x < (placing.x + size) * T + 10 && w.y > placing.y * T - 30 && w.y < (placing.y + size) * T + 10) { drag.ghost = true; drag.ox = w.x - placing.x * T; drag.oy = w.y - placing.y * T; } }
}
function moveP(e) {
  if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (pinch && pointers.size === 2) { const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch.d); pinch.d = d; return; }
  if (!drag) return;
  if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) drag.moved = true;
  if (!drag.moved) return;
  if (drag.ghost) { const w = toWorld(e.clientX, e.clientY); placeAt(Math.round((w.x - drag.ox) / T), Math.round((w.y - drag.oy) / T)); }
  else { cam.x = drag.cx - (e.clientX - drag.sx) / cam.z; cam.y = drag.cy - (e.clientY - drag.sy) / cam.z; clampCam(); }
}
function up(e) {
  pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null;
  if (!drag) return; const d = drag; drag = null;
  if (d.moved) return;
  const w = toWorld(e.clientX, e.clientY);
  if (placing) { const size = D.BUILDINGS[placing.type].size; placeAt(Math.floor(w.x / T - (size - 1) / 2), Math.floor(w.y / T - (size - 1) / 2)); return; }
  // tap: the building whose picture is under the finger (front-most first)
  const hit = [...CK.state.buildings].sort((a, b) => (b.y + D.BUILDINGS[b.type].size) - (a.y + D.BUILDINGS[a.type].size)).find(b => { const s = D.BUILDINGS[b.type].size; return w.x > b.x * T - 4 && w.x < (b.x + s) * T + 4 && w.y > (b.y - (D.BUILDINGS[b.type].decor ? .3 : .7)) * T && w.y < (b.y + s) * T + 4; });
  if (hit) tapBuilding(hit);
}
function tapBuilding(b) {
  const def = D.BUILDINGS[b.type]; pops[b.id] = 1;
  if (def.make) { const got = CK.collect(b.id); if (got) { const cx = (b.x + def.size / 2) * T, y = (b.y + def.size) * T - def.size * T * .9; floats.push({x: cx, y, str: '+' + CK.fmt(got.amount) + ' ' + D.RES[got.kind].icon, t: 0}); window.CKSound?.play('collect'); return; } }
  window.CKSound?.play('tap'); window.CKUI?.buildingPanel(b);
}

// ---------------------------------------------------------------- placing
function placeAt(x, y) { if (!placing) return; const size = D.BUILDINGS[placing.type].size, o = CK.landStart(), n = CK.land(); placing.x = Math.max(o, Math.min(o + n - size, x)); placing.y = Math.max(o, Math.min(o + n - size, y)); window.CKUI?.placingBar(placing, CK.fits(placing.type, placing.x, placing.y, placing.id)); }
function firstFree(type) { const o = CK.landStart(), n = CK.land(), size = D.BUILDINGS[type].size, cx = Math.round((cam.x + vw / cam.z / 2) / T), cy = Math.round((cam.y + vh / cam.z / 2) / T); let best = null;
  for (let y = o; y <= o + n - size; y++) for (let x = o; x <= o + n - size; x++) if (CK.fits(type, x, y)) { const d = Math.hypot(x - cx, y - cy); if (!best || d < best.d) best = {x, y, d}; } return best; }
function startPlacing(type) { const spot = firstFree(type) || {x: CK.landStart(), y: CK.landStart()}; placing = {type, x: spot.x, y: spot.y}; placeAt(spot.x, spot.y); }
function startMoving(id) { const b = CK.state.buildings.find(q => q.id === id); if (!b) return; placing = {type: b.type, id, x: b.x, y: b.y, lv: b.lv}; placeAt(b.x, b.y); }
function confirmPlacing() {
  if (!placing) return {error: 'Nothing to place.'};
  const p = placing; let res;
  if (p.id) res = CK.move(p.id, p.x, p.y) ? {ok: true} : {error: 'No room there.'};
  else res = CK.build(p.type, p.x, p.y);
  if (!res.error) { pops[res.building?.id || p.id] = 1; placing = null; window.CKSound?.play('build'); }
  return res;
}
function cancelPlacing() { placing = null; }
function focus(b) { const s = D.BUILDINGS[b.type].size; centerOn((b.x + s / 2) * T, (b.y + s / 2) * T); }

window.CKKingdom = {init, show, hide, burstLeaves, home: () => { const c = CK.state.buildings.find(b => b.type === 'castle'); centerOn((c.x + 1) * T, (c.y + 1.2) * T); }, startPlacing, startMoving, confirmPlacing, cancelPlacing, isPlacing: () => !!placing, focus, resize, _tap: tapBuilding};
})();
