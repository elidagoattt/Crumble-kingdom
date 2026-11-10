/* Crumble Kingdom: battles.
 * Your team of up to five sweets fights waves of foes on its own; you choose when each one uses its skill
 * (or leave Auto on). Front-row heroes hold the line, flying foes dive at the back row, bosses warn before a special.
 * CKBattle.start({w, s, onEnd}) opens a battle; onEnd({win, stars}) is called when the result screen closes.
 */
(() => {
'use strict';
const D = window.CKData, CK = window.CK, Art = window.CKArt, K = Art.kit;
const H = 300, GROUND = 236, TIME_LIMIT = 180;
const SPEEDS = [1, 1.5, 2.5];
const rand = (a, b) => a + Math.random() * (b - a);
let B = null;           // the running battle
let root, canvas, g, raf = 0, last = 0;

// ---------------------------------------------------------------- set-up
function start(opts) {
  const info = D.stageInfo(opts.w, opts.s), S = CK.state;
  const ids = S.team.filter(Boolean);
  if (!ids.length) return false;
  B = {
    info, opts, t: 0, time: TIME_LIMIT, wave: -1, phase: 'run', phaseT: 0, scroll: 0, speed: SPEEDS.includes(S.settings.speed) ? S.settings.speed : 1, auto: S.settings.auto !== false,
    cats: [], foes: [], shots: [], fx: [], texts: [], banner: null, freeze: 0, slowmo: 0, over: null, shake: 0, fainted: 0, W: 640
  };
  // cats line up by role: front row furthest right
  const rows = [[], [], []];
  ids.forEach(id => rows[D.ROLES[D.CATS[id].role].row].push(id));
  rows.forEach((list, row) => list.forEach((id, i) => {
    const def = D.CATS[id], st = CK.stats(id), role = D.ROLES[def.role];
    B.cats.push({
      id, def, role, row, slot: i, n: list.length, x: 0, y: 0, hx: 0, hy: 0, hp: st.hp, max: st.hp, atk: st.atk,
      atkT: rand(.2, .9), rate: role.row === 0 ? 1.05 : 1.35, skillCd: def.skill.cd * rand(.35, .6), pose: 'walk', poseT: 0, hit: 0, alive: true,
      form: 0, shield: 0, rally: 0, slow: 0, poison: 0, autoWait: rand(.3, 1.2)
    });
  }));
  buildDom();
  layout(); B.cats.forEach(c => { c.x = c.hx - 160; c.y = c.hy; });
  nextWave();
  last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  return true;
}

function layout() {
  // The scene is H units tall. It is scaled to fit the canvas width; a tall canvas just shows more sky.
  const rect = {width: canvas.clientWidth, height: canvas.clientHeight}, d = Math.min(2.5, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(rect.width * d)); canvas.height = Math.max(1, Math.round(rect.height * d));
  const W = Math.max(380, Math.min(820, Math.round(H * rect.width / Math.max(1, rect.height))));
  B.W = W; B.px = canvas.width / W;
  const tall = canvas.height / B.px;                     // how many scene units fit top to bottom
  B.top = tall > H ? Math.min(tall - H, Math.max(0, tall * .62 - GROUND)) : tall - H; B.y0 = -B.top; B.bottom = tall - B.top;
  B.big = W >= 560; B.overlay = rect.width > rect.height && window.innerHeight <= 560;   // landscape phones draw the title over the scene
  const front = W * .40, gap = Math.min(58, W * .115);
  for (const c of B.cats) {
    c.hx = front - c.row * gap - (c.slot % 2) * 10;
    c.hy = GROUND + (c.n > 1 ? (c.slot - (c.n - 1) / 2) * 20 : 0) + (c.row === 1 ? 4 : 0);
  }
}

function nextWave() {
  B.wave++;
  if (B.wave >= B.info.waves.length) return win();
  B.phase = 'run'; B.phaseT = 0;
  const list = B.info.waves[B.wave], sc = B.info.scale, bossWave = B.info.boss && B.wave === B.info.waves.length - 1;
  B.pending = list.map((kind, i) => {
    const def = D.FOES[kind];
    return {kind, def, x: B.W + 40 + i * 34, y: GROUND + ((i % 3) - 1) * 16, hp: Math.round(def.hp * sc), max: Math.round(def.hp * sc), atk: def.atk * sc,
      spd: def.spd, range: def.range, fly: !!def.fly, ranged: !!def.ranged, hop: !!def.hop, atkT: rand(.4, 1.2), hit: 0, stun: 0, alive: true, t: rand(0, 5)};
  });
  if (bossWave) {
    const def = D.BOSSES[B.info.boss]; B.pending.length = Math.min(B.pending.length, 2);
    B.pending.push({kind: B.info.boss, def, boss: true, x: B.W + 70, y: GROUND + 4, hp: Math.round(def.hp * sc), max: Math.round(def.hp * sc), atk: def.atk * sc,
      spd: 38, range: 56, atkT: 1.5, hit: 0, stun: 0, alive: true, t: 0, specT: 6, warn: 0});
  }
}

// ---------------------------------------------------------------- helpers
const liveCats = () => B.cats.filter(c => c.alive);
const liveFoes = () => B.foes.filter(f => f.alive);
const frontCat = () => liveCats().sort((a, b) => b.x - a.x)[0];
const backCat = () => liveCats().sort((a, b) => a.x - b.x)[0];
const nearestFoe = x => liveFoes().sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
function text(x, y, str, col, big) { B.texts.push({x: x + rand(-8, 8), y, str, col, big, t: 0}); }
function puff(x, y, col, n = 8, sp = 90) { for (let i = 0; i < n; i++) { const a = rand(0, 6.28), v = rand(.3, 1) * sp; B.fx.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: rand(.3, .6), t: 0, col, r: rand(2, 5)}); } }
function sfx(name) { window.CKSound?.play(name); }

function hurtFoe(f, dmg, col) {
  if (!f.alive) return;
  dmg = Math.max(1, Math.round(dmg * rand(.92, 1.08))); f.hp -= dmg; f.hit = .18;
  text(f.x, f.y - (f.boss ? 96 : 44), String(dmg), col || '#fff', dmg > 220);
  if (f.hp <= 0) { f.alive = false; f.dead = 0; puff(f.x, f.y - 20, '#fff', 12, 120); sfx(f.boss ? 'boom' : 'pop'); if (f.boss) { B.shake = .6; B.slowmo = 1.2; } }
}
function hurtCat(c, dmg) {
  if (!c.alive) return;
  if (c.shield > 0) dmg *= c.shieldPow;
  dmg = Math.max(1, Math.round(dmg * rand(.92, 1.08))); c.hp -= dmg; c.hit = .18;
  text(c.x, c.y - 56, '-' + dmg, '#ff8a8a');
  if (c.hp <= 0) { c.hp = 0; c.alive = false; c.dead = 0; B.fainted++; puff(c.x, c.y - 20, '#ffd9e6', 10); sfx('faint'); refreshButtons(); }
}
function healCat(c, amount) { if (!c.alive) return; const real = Math.min(c.max - c.hp, Math.round(amount)); c.hp += real; if (real > 0) text(c.x, c.y - 56, '+' + real, '#8cf0a0'); puff(c.x, c.y - 26, '#8cf0a0', 5, 50); }

// ---------------------------------------------------------------- skills
function useSkill(c) {
  if (!B || B.over || !c.alive || c.skillCd > 0 || B.phase !== 'fight' || !liveFoes().length) return false;
  const sk = c.def.skill, foes = liveFoes(), pw = c.atk * sk.power * (c.form > 0 ? 1.4 : 1);
  c.skillCd = sk.cd; c.pose = 'attack'; c.poseT = .6;
  B.banner = {id: c.id, name: sk.name, icon: sk.icon, t: 0, col: c.role.color}; B.slowmo = Math.max(B.slowmo, .45); sfx('skill');
  const mid = foes.reduce((s, f) => s + f.x, 0) / foes.length;
  switch (sk.kind) {
    case 'hit': { const f = nearestFoe(c.x); B.shots.push({x: c.x + 14, y: c.y - 30, to: f, dmg: pw, spd: 520, icon: sk.icon, big: true, col: '#ffe38a'}); break; }
    case 'aoe': B.fx.push({ring: true, x: mid, y: GROUND - 20, t: 0, life: .5, col: c.role.color, r: 130}); setTimeout(() => B && foes.forEach(f => hurtFoe(f, pw, '#ffe38a')), 180); B.shake = .25; break;
    case 'stun': foes.forEach(f => { hurtFoe(f, pw, '#ffe38a'); if (!f.boss) f.stun = sk.dur; else f.stun = sk.dur * .4; }); B.shake = .25; break;
    case 'heal': liveCats().forEach(a => healCat(a, pw)); break;
    case 'shield': liveCats().forEach(a => { a.shield = sk.dur; a.shieldPow = sk.power; }); break;
    case 'rally': liveCats().forEach(a => { a.rally = sk.dur; a.rallyPow = sk.power; }); break;
    case 'form': c.form = sk.dur; c.formPow = sk.power; puff(c.x, c.y - 30, '#ffd45c', 20, 150); break;
    case 'freeze': B.freeze = sk.dur; B.hourglass = {t: 0, dur: sk.dur, dmg: pw}; break;
  }
  refreshButtons(); return true;
}

function bossSpecial(b) {
  const sp = b.def.special, cats = liveCats(), dmg = b.atk * sp.power;
  B.shake = .4; sfx('boom');
  if (sp.kind === 'aoe') cats.forEach(c => { hurtCat(c, dmg); puff(c.x, c.y - 20, '#ffb347', 6); });
  else if (sp.kind === 'slow') cats.forEach(c => { hurtCat(c, dmg * .6); c.slow = sp.dur; });
  else if (sp.kind === 'back') { const c = backCat(); if (c) { hurtCat(c, dmg); puff(c.x, c.y - 20, '#ff7aa8', 10); } }
  else if (sp.kind === 'poison') cats.forEach(c => { c.poison = sp.dur; c.poisonDmg = dmg; });
}

// ---------------------------------------------------------------- update
function update(dt) {
  B.t += dt;
  if (B.over) return;
  if (B.phase === 'run') {
    B.phaseT += dt; B.scroll += dt * 120;
    for (const c of B.cats) if (c.alive) { c.x += (c.hx - c.x) * Math.min(1, dt * 4); c.y += (c.hy - c.y) * Math.min(1, dt * 6); c.pose = 'walk'; }
    if (B.phaseT > 1.3) { B.phase = 'fight'; B.foes = B.pending; B.pending = []; showWave(); }
    return;
  }
  B.time -= dt; if (B.time <= 0) { B.time = 0; return lose(); }
  const frozen = B.freeze > 0; if (frozen) B.freeze -= dt;
  if (B.hourglass) { const hg = B.hourglass; hg.t += dt; if (hg.t >= hg.dur && !hg.done) { hg.done = true; liveFoes().forEach((f, i) => setTimeout(() => { if (!B) return; hurtFoe(f, hg.dmg, '#a8e0ff'); puff(f.x, f.y - 24, '#a8e0ff', 10); }, i * 90)); B.shake = .35; } if (hg.t > hg.dur + .5) B.hourglass = null; }

  // cats
  for (const c of B.cats) {
    if (!c.alive) { c.dead += dt; continue; }
    c.hit = Math.max(0, c.hit - dt); c.poseT -= dt; c.skillCd = Math.max(0, c.skillCd - dt);
    for (const k of ['form', 'shield', 'rally', 'slow']) if (c[k] > 0) c[k] -= dt;
    if (c.poison > 0) { c.poison -= dt; c.poisonT = (c.poisonT || 0) + dt; if (c.poisonT > 1) { c.poisonT = 0; hurtCat(c, c.poisonDmg); } }
    const foe = nearestFoe(c.x);
    if (!foe) { if (c.poseT <= 0) c.pose = 'idle'; continue; }
    const dist = foe.x - c.x, reach = c.role.range + (foe.boss ? 30 : 8);
    let speedMul = (c.rally > 0 ? c.rallyPow : 1) * (c.form > 0 ? 1.6 : 1) * (c.slow > 0 ? .55 : 1);
    if (c.row === 0 && dist > reach && c.x < B.W * .6) { c.x += Math.min(dist - reach, 70 * dt); if (c.poseT <= 0) c.pose = 'walk'; }
    else if (c.poseT <= 0) c.pose = 'idle';
    c.atkT -= dt * speedMul;
    if (c.atkT <= 0 && dist <= reach + 4) {
      c.atkT = c.rate; c.pose = 'attack'; c.poseT = .28;
      const dmg = c.atk * (c.form > 0 ? c.formPow : 1);
      if (c.def.role === 'heal') {
        const weak = liveCats().filter(a => a.hp < a.max * .95).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
        if (weak) healCat(weak, c.atk * .7); else B.shots.push({x: c.x + 12, y: c.y - 28, to: foe, dmg: dmg * .5, spd: 380, col: '#8cf0a0'});
      } else if (c.row === 0) { hurtFoe(foe, dmg); puff(foe.x - 8, foe.y - 22, '#fff', 3, 60); sfx('hit'); }
      else B.shots.push({x: c.x + 12, y: c.y - 28, to: foe, dmg, spd: 420, col: c.role.color, aoe: c.def.role === 'magic' ? .35 : 0});
    }
    if (B.auto && c.skillCd <= 0) { c.autoWait -= dt; if (c.autoWait <= 0) { const sk = c.def.skill.kind; const needHeal = liveCats().some(a => a.hp < a.max * .65); if (sk !== 'heal' || needHeal) useSkill(c); c.autoWait = rand(.4, 1); } }
  }

  // foes
  for (const f of B.foes) {
    f.t += dt; f.hit = Math.max(0, f.hit - dt);
    if (!f.alive) { f.dead += dt; continue; }
    if (frozen) continue;
    if (f.stun > 0) { f.stun -= dt; continue; }
    const target = f.fly ? backCat() : frontCat(); if (!target) continue;
    const dist = f.x - target.x, reach = f.range + (f.boss ? 20 : 0);
    if (dist > reach) f.x -= f.spd * dt * (f.hop ? .6 + Math.abs(Math.sin(f.t * 5)) : 1);
    else {
      f.atkT -= dt;
      if (f.atkT <= 0) { f.atkT = f.boss ? 1.5 : 1.25; f.lunge = .2;
        if (f.ranged) B.shots.push({x: f.x - 10, y: f.y - 24, to: target, dmg: f.atk, spd: 300, col: '#c08aff', foe: true});
        else hurtCat(target, f.atk); }
    }
    if (f.lunge > 0) f.lunge -= dt;
    if (f.boss) {
      if (f.warn > 0) { f.warn -= dt; if (f.warn <= 0) bossSpecial(f); }
      else { f.specT -= dt; if (f.specT <= 0) { f.specT = 9; f.warn = 1.1; B.warning = {name: f.def.special.name, icon: f.def.special.icon, t: 0}; sfx('warn'); } }
    }
  }

  // shots
  for (const s of B.shots) {
    const to = s.to; if (!to || !to.alive) { s.dead = true; continue; }
    const ty = to.y - (to.boss ? 50 : 24), dx = to.x - s.x, dy = ty - s.y, d = Math.hypot(dx, dy), step = s.spd * dt;
    if (d <= step + 6) {
      s.dead = true;
      if (s.foe) hurtCat(to, s.dmg); else { hurtFoe(to, s.dmg, s.big ? '#ffe38a' : '#fff'); if (s.aoe) liveFoes().forEach(f => { if (f !== to && Math.abs(f.x - to.x) < 60) hurtFoe(f, s.dmg * s.aoe); }); if (s.big) { B.shake = .2; puff(to.x, ty, '#ffe38a', 14, 140); } }
    } else { s.x += dx / d * step; s.y += dy / d * step; }
  }
  B.shots = B.shots.filter(s => !s.dead);
  B.foes = B.foes.filter(f => f.alive || f.dead < .5);

  if (!liveCats().length) return lose();
  if (!liveFoes().length && B.phase === 'fight') { B.shots = B.shots.filter(s => !s.foe); nextWave(); }
}

function updateFx(dt) {
  for (const p of B.fx) { p.t += dt; if (!p.ring) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 240 * dt; } }
  B.fx = B.fx.filter(p => p.t < p.life);
  for (const t of B.texts) { t.t += dt; t.y -= 34 * dt; }
  B.texts = B.texts.filter(t => t.t < .9);
  if (B.banner) { B.banner.t += dt; if (B.banner.t > 1.1) B.banner = null; }
  if (B.warning) { B.warning.t += dt; if (B.warning.t > 1.3) B.warning = null; }
  B.shake = Math.max(0, B.shake - dt);
}

// ---------------------------------------------------------------- drawing
function drawBackdrop() {
  const w = B.info.world, W = B.W, img = Art.pic('bg-' + w.id);
  if (img) { const iw = H * img.width / img.height, off = (B.scroll * .5) % iw; for (let x = -off; x < W; x += iw) g.drawImage(img, x, 0, iw, H); return; }
  const sky = g.createLinearGradient(0, 0, 0, GROUND - 30); sky.addColorStop(0, w.sky[0]); sky.addColorStop(1, w.sky[1]); g.fillStyle = w.sky[0]; g.fillRect(-20, B.y0 - 20, W + 40, H - B.y0 + 40); g.fillStyle = sky; g.fillRect(-20, 0, W + 40, H);
  // far hills
  g.fillStyle = K.shade(w.hill, .25); g.beginPath(); g.moveTo(0, GROUND - 30);
  for (let x = 0; x <= W + 40; x += 40) g.lineTo(x, GROUND - 78 - Math.sin((x + B.scroll * .15) * .012) * 26 - Math.sin((x + B.scroll * .15) * .031) * 10);
  g.lineTo(W, GROUND); g.lineTo(0, GROUND); g.fill();
  g.fillStyle = w.hill; g.beginPath(); g.moveTo(0, GROUND - 20);
  for (let x = 0; x <= W + 40; x += 30) g.lineTo(x, GROUND - 46 - Math.sin((x + B.scroll * .3) * .017 + 2) * 18);
  g.lineTo(W, GROUND); g.lineTo(0, GROUND); g.fill();
  // scenery that scrolls past
  const S = Art.scene, set = {houses: ['house', 'tree', 'bush', 'fence'], blossom: ['candyTree', 'lolly', 'gumdrop', 'flowers'], trees: ['pine', 'tree', 'mushroom', 'bush'], lilies: ['reeds', 'tree', 'bush', 'reeds'],
    crystals: ['crystals', 'rock', 'crystals', 'mushroom'], sunflowers: ['sunflower', 'bush', 'sunflower', 'flowers'], frost: ['pine', 'crystals', 'rock', 'pine'], toxic: ['deadTree', 'toxic', 'rock', 'deadTree'], castle: ['pillar', 'torch', 'pillar', 'torch']}[w.deco] || ['tree'];
  const span = 150, first = Math.floor((B.scroll * .6) / span);
  for (let i = first - 1; i < first + Math.ceil(W / span) + 2; i++) {
    const kind = set[((i % set.length) + set.length) % set.length], x = i * span - B.scroll * .6 + 40, fn = S[kind];
    if (fn) fn(g, x, GROUND - 22, kind === 'house' ? 1.5 : 1.7, i * 7 + 3, B.t);
  }
  // ground
  g.fillStyle = w.ground; g.fillRect(-20, GROUND - 24, W + 40, H);
  g.fillStyle = K.shade(w.ground, .18); g.fillRect(0, GROUND - 24, W, 5);
  g.fillStyle = w.dirt; g.fillRect(-20, GROUND + 34, W + 40, Math.max(H, B.bottom) - GROUND);
  g.fillStyle = K.shade(w.dirt, -.12); for (let i = 0; i < 16; i++) { const x = ((i * 131 - B.scroll) % (W + 80) + W + 80) % (W + 80) - 40, y = GROUND + 52 + (i * 37) % Math.max(20, B.bottom - GROUND - 70); g.beginPath(); g.ellipse(x, y, 16 + (i % 3) * 6, 4, 0, 0, 6.28); g.fill(); }
  g.fillStyle = K.shade(w.ground, -.12);
  for (let i = 0; i < 14; i++) { const x = ((i * 97 - B.scroll) % (W + 60) + W + 60) % (W + 60) - 30; g.beginPath(); g.ellipse(x, GROUND - 6 + (i % 4) * 11, 12, 3, 0, 0, 6.28); g.fill(); }
}

function bar(x, y, w, frac, col) { g.fillStyle = '#2a1d36'; K.RR(g, x - w / 2 - 1.5, y - 1.5, w + 3, 8, 4, '#2a1d36'); K.RR(g, x - w / 2, y, w, 5, 2.5, '#5a4a66'); if (frac > 0) K.RR(g, x - w / 2, y, Math.max(3, w * frac), 5, 2.5, col); }

function draw() {
  const W = B.W, y0 = B.y0 + (B.overlay ? 30 : 0); g.setTransform(B.px, 0, 0, B.px, 0, B.top * B.px);
  if (B.shake > 0) g.translate(rand(-1, 1) * B.shake * 10, rand(-1, 1) * B.shake * 8);
  drawBackdrop();
  const frozen = B.freeze > 0;
  const units = [...B.cats.map(c => ({c, y: c.y})), ...B.foes.map(f => ({f, y: f.y}))].sort((a, b) => a.y - b.y);
  for (const u of units) {
    if (u.c) {
      const c = u.c; if (!c.alive && c.dead > .6) continue;
      const sc = B.big ? 1.3 : 1.15, alpha = c.alive ? 1 : 1 - c.dead / .6;
      g.save(); g.globalAlpha = alpha;
      K.shadow(g, c.x, c.y + 1, 15, 5);
      if (c.form > 0) { g.save(); g.globalAlpha = .5 + Math.sin(B.t * 12) * .2; K.E(g, c.x, c.y - 24, 30, 36, 'rgba(255,212,92,.45)'); g.restore(); }
      if (c.shield > 0) { g.save(); g.globalAlpha = .55; K.E(g, c.x, c.y - 24, 26, 32, 'rgba(140,220,255,.3)', '#bfeaff', 2); g.restore(); }
      Art.hero(g, c.x, c.y, sc, {id: c.id, pose: c.alive ? (c.hit > 0 ? 'hurt' : c.pose) : 'hurt', t: B.t + c.slot, hit: c.hit, flip: false});
      g.restore();
      if (c.alive) { bar(c.x, c.y - 62 * sc / 1.45 - 6, 34, c.hp / c.max, c.hp / c.max > .35 ? '#6ee06a' : '#ff6a6a'); if (c.poison > 0) { g.font = '11px system-ui'; g.fillText('☠️', c.x + 20, c.y - 60); } if (c.slow > 0) { g.font = '11px system-ui'; g.fillText('🍬', c.x - 26, c.y - 60); } }
    } else {
      const f = u.f, alpha = f.alive ? 1 : 1 - f.dead / .5, lunge = f.lunge > 0 ? -10 * Math.sin(f.lunge / .2 * Math.PI) : 0;
      const fy = f.y - (f.fly ? 34 + Math.sin(f.t * 4) * 5 : 0);
      g.save(); g.globalAlpha = alpha;
      if (frozen || f.stun > 0) g.filter = frozen ? 'saturate(.3) brightness(1.2) hue-rotate(160deg)' : 'saturate(.5)';
      K.shadow(g, f.x, f.y + 1, f.boss ? 40 : 13, f.boss ? 10 : 4);
      if (f.boss) { if (f.def.tint) g.filter = (g.filter && g.filter !== 'none' ? g.filter + ' ' : '') + f.def.tint;
        Art.boss(g, f.x + lunge, fy, B.big ? 2.7 : 2.4, f.def.art || f.kind, {id: f.kind, t: frozen ? 0 : f.t, hit: f.hit, slam: f.warn > 0 ? 1 - f.warn : 0}); }
      else Art.foe(g, f.x + lunge, fy, B.big ? 1.55 : 1.4, f.kind, {t: frozen ? 0 : f.t, hit: f.hit});
      g.restore();
      if (f.alive && !f.boss) bar(f.x, fy - 46, 28, f.hp / f.max, '#ff8a5a');
      if (f.alive && f.stun > 0 && !frozen) { g.font = '13px system-ui'; g.textAlign = 'center'; g.fillText('💫', f.x, fy - 52); }
    }
  }
  // shots
  for (const s of B.shots) {
    if (s.icon) { g.font = (s.big ? 24 : 16) + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.save(); g.translate(s.x, s.y); g.rotate(B.t * 10); g.fillText(s.icon, 0, 0); g.restore(); }
    else { K.C(g, s.x, s.y, 5.5, s.col, '#fff', 1.6); g.save(); g.globalAlpha = .35; K.C(g, s.x - 6, s.y, 4, s.col); g.restore(); }
  }
  // particles
  for (const p of B.fx) {
    const k = 1 - p.t / p.life;
    if (p.ring) { g.save(); g.globalAlpha = k; g.lineWidth = 8 * k; g.strokeStyle = p.col; g.beginPath(); g.ellipse(p.x, p.y, p.r * (1 - k), p.r * (1 - k) * .45, 0, 0, 6.28); g.stroke(); g.restore(); }
    else { g.save(); g.globalAlpha = k; K.C(g, p.x, p.y, p.r * k + 1, p.col); g.restore(); }
  }
  // Klina's hourglass
  if (B.hourglass) drawHourglass(B.hourglass);
  // floating numbers
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const t of B.texts) { g.save(); g.globalAlpha = Math.min(1, (0.9 - t.t) * 3); g.font = '900 ' + (t.big ? 20 : 14) + "px 'Trebuchet MS',system-ui,sans-serif"; g.lineWidth = 3.5; g.strokeStyle = '#2a1d36'; g.strokeText(t.str, t.x, t.y); g.fillStyle = t.col; g.fillText(t.str, t.x, t.y); g.restore(); }
  g.setTransform(B.px, 0, 0, B.px, 0, B.top * B.px);
  // boss bar
  const boss = B.foes.find(f => f.boss && f.alive);
  if (boss) { const bw = Math.min(300, W * .6); K.RR(g, W / 2 - bw / 2 - 3, y0 + 10, bw + 6, 18, 9, '#2a1d36'); K.RR(g, W / 2 - bw / 2, y0 + 13, bw, 12, 6, '#5a2a3a'); K.RR(g, W / 2 - bw / 2, y0 + 13, Math.max(8, bw * boss.hp / boss.max), 12, 6, '#ff5a6a'); g.font = "900 10px 'Trebuchet MS',system-ui,sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(boss.def.name, W / 2, y0 + 19.5); }
  // skill banner
  if (B.banner) { const b = B.banner, k = Math.min(1, b.t * 6) * Math.min(1, (1.1 - b.t) * 5), y = Math.max(y0 + 70, 70); g.save(); g.globalAlpha = k; g.translate(-(1 - k) * 80, 0);
    const grd = g.createLinearGradient(0, 0, W * .75, 0); grd.addColorStop(0, b.col); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.beginPath(); g.moveTo(0, y - 24); g.lineTo(W * .75, y - 18); g.lineTo(W * .75, y + 18); g.lineTo(0, y + 24); g.fill();
    Art.hero(g, 42, y + 22, 1.15, {id: b.id, pose: 'attack', t: b.t}); g.textAlign = 'left'; g.font = "900 19px 'Trebuchet MS',system-ui,sans-serif"; g.lineWidth = 4; g.strokeStyle = '#2a1d36'; g.strokeText(b.icon + ' ' + b.name + '!', 76, y); g.fillStyle = '#fff'; g.fillText(b.icon + ' ' + b.name + '!', 76, y); g.restore(); }
  if (B.warning) { const wn = B.warning, k = Math.min(1, wn.t * 6) * Math.min(1, (1.3 - wn.t) * 5); g.save(); g.globalAlpha = k * (.75 + Math.sin(wn.t * 22) * .25); g.textAlign = 'center'; g.font = "900 17px 'Trebuchet MS',system-ui,sans-serif"; const str = '⚠️ ' + wn.icon + ' ' + wn.name + '!'; const tw = g.measureText(str).width + 26; const wy = GROUND - 170; K.RR(g, W * .68 - tw / 2, wy, tw, 28, 14, '#c8281c', '#fff', 2); g.fillStyle = '#fff'; g.fillText(str, W * .68, wy + 15); g.restore(); }
}

function drawHourglass(hg) {
  const W = B.W, x = W * .62, y = 130, grow = Math.min(1, hg.t * 3), flip = hg.t > hg.dur * .45 ? Math.min(1, (hg.t - hg.dur * .45) * 3) * Math.PI : 0, out = hg.done ? Math.max(0, 1 - (hg.t - hg.dur) * 2) : 1;
  g.save(); g.fillStyle = 'rgba(40,60,120,' + .28 * out + ')'; g.fillRect(-20, B.y0 - 20, W + 40, B.bottom - B.y0 + 40);
  g.translate(x, y); g.scale(grow * out * 1.6 + .01, grow * out * 1.6 + .01); g.rotate(flip);
  g.globalAlpha = .92;
  K.RR(g, -22, -38, 44, 8, 3, '#f2b632', '#3a2433', 2); K.RR(g, -22, 30, 44, 8, 3, '#f2b632', '#3a2433', 2);
  K.poly(g, [[-18, -30], [18, -30], [3, 0], [18, 30], [-18, 30], [-3, 0]], 'rgba(200,235,255,.75)', '#3a2433', 2);
  const p = (hg.t % 1.2) / 1.2; K.poly(g, [[-12 * (1 - p), -26 + 22 * p], [12 * (1 - p), -26 + 22 * p], [1, -1], [-1, -1]], '#ffd45c'); K.poly(g, [[-15 * p, 28], [15 * p, 28], [0, 28 - 22 * p]], '#ffd45c');
  g.restore();
  // clock symbols orbit while time is stopped
  g.save(); g.globalAlpha = out; g.font = '18px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 6; i++) { const a = hg.t * 2 + i * 1.047; g.fillText(i % 2 ? '🕐' : '⏰', x + Math.cos(a) * 80 * grow, y + Math.sin(a) * 46 * grow); }
  g.restore();
}

// ---------------------------------------------------------------- loop, DOM and results
function frame(nowT) {
  if (!B) return;
  let dt = Math.min(.05, (nowT - last) / 1000); last = nowT;
  if (!B.paused) {
    if (B.slowmo > 0) { B.slowmo -= dt; dt *= .35; }
    const steps = Math.ceil(B.speed), part = dt * B.speed / steps;      // fast speeds run as smaller sub-steps so nothing tunnels
    for (let i = 0; i < steps && B; i++) { update(part); if (B) updateFx(part); }
    if (!B) return;
    draw(); tickButtons();
  }
  raf = requestAnimationFrame(frame);
}

function buildDom() {
  root = document.getElementById('battle'); root.innerHTML = '';
  root.className = 'screen open';
  root.innerHTML = `
    <div class="b-top"><button class="pill" data-pause aria-label="Pause">❚❚</button><div class="b-title"><b>${B.info.name}</b><span data-wave></span></div><div class="b-time" data-time></div></div>
    <canvas class="b-canvas"></canvas>
    <div class="b-bottom"><div class="b-skills" data-skills></div>
      <p class="b-hint">Tap a glowing friend to use their skill</p><div class="b-toggles"><button class="pill" data-auto></button><button class="pill" data-speed></button></div></div>
    <div class="b-result" data-result hidden></div>`;
  canvas = root.querySelector('canvas'); g = canvas.getContext('2d');
  const skills = root.querySelector('[data-skills]');
  for (const c of [...B.cats].sort((a, b) => b.row - a.row)) {
    const btn = document.createElement('button'); btn.className = 'skill'; btn.style.setProperty('--col', c.role.color);
    btn.append(Art.portrait(c.id, 52));
    btn.insertAdjacentHTML('beforeend', `<i class="cd"></i><span class="ic">${c.def.skill.icon}</span><span class="hp"><b></b></span>`);
    btn.onclick = () => { if (!useSkill(c) && c.alive && c.skillCd > 0) btn.classList.add('nope'), setTimeout(() => btn.classList.remove('nope'), 200); };
    c.btn = btn; skills.append(btn);
  }
  root.querySelector('[data-pause]').onclick = pause;
  root.querySelector('[data-auto]').onclick = () => { B.auto = !B.auto; CK.state.settings.auto = B.auto; CK.save(); refreshButtons(); };
  root.querySelector('[data-speed]').onclick = () => { B.speed = SPEEDS[(SPEEDS.indexOf(B.speed) + 1) % SPEEDS.length]; CK.state.settings.speed = B.speed; CK.save(); refreshButtons(); };
  refreshButtons();
  window.addEventListener('resize', onResize);
}
const onResize = () => { if (B) layout(); };
function refreshButtons() {
  if (!root) return;
  root.querySelector('[data-auto]').textContent = B.auto ? '🤖 Auto ON' : '👆 Auto OFF';
  root.querySelector('[data-auto]').classList.toggle('on', B.auto);
  root.querySelector('[data-speed]').textContent = '⏩ ' + B.speed + 'x'; root.querySelector('[data-speed]').classList.toggle('on', B.speed > 1);
  for (const c of B.cats) c.btn?.classList.toggle('out', !c.alive);
}
function tickButtons() {
  for (const c of B.cats) { if (!c.btn) continue; const frac = c.skillCd / c.def.skill.cd; c.btn.style.setProperty('--cd', (frac * 360).toFixed(0) + 'deg'); c.btn.classList.toggle('ready', c.alive && c.skillCd <= 0 && B.phase === 'fight'); c.btn.querySelector('.hp b').style.width = (c.hp / c.max * 100).toFixed(0) + '%'; }
  root.querySelector('[data-time]').textContent = '⏱ ' + Math.max(0, Math.ceil(B.time));
}
function showWave() { const el = root.querySelector('[data-wave]'); el.textContent = (B.info.boss && B.wave === B.info.waves.length - 1 ? 'BOSS' : 'Wave ' + (B.wave + 1) + '/' + B.info.waves.length); }

function pause() {
  if (!B || B.over) return; B.paused = true;
  const box = root.querySelector('[data-result]'); box.hidden = false;
  box.innerHTML = `<div class="card small"><h2>Paused</h2><button class="btn green" data-go>Keep fighting</button><button class="btn red" data-quit>Give up</button></div>`;
  box.querySelector('[data-go]').onclick = () => { box.hidden = true; B.paused = false; last = performance.now(); };
  box.querySelector('[data-quit]').onclick = () => close({win: false, quit: true});
}
function win() {
  B.over = 'win'; B.cats.forEach(c => { if (c.alive) { c.pose = 'win'; c.poseT = 99; } });
  const stars = B.fainted === 0 ? 3 : B.fainted <= 2 ? 2 : 1;
  const out = CK.finishStage(B.info.w, B.info.s, stars); sfx('win');
  B.out = out; setTimeout(() => result(true, stars, out), 900);
}
function lose() { B.over = 'lose'; sfx('lose'); setTimeout(() => result(false, 0, null), 700); }
function result(won, stars, out) {
  if (!B) return;
  const box = root.querySelector('[data-result]'); box.hidden = false;
  const gain = out ? Object.entries(out.gain).filter(([, v]) => v > 0).map(([k, v]) => `<span class="chip">${D.RES[k].icon} +${CK.fmt(v)}</span>`).join('') : '';
  box.innerHTML = won
    ? `<div class="card result win"><div class="ribbon">VICTORY!</div><div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? 'on' : ''}" style="animation-delay:${i * .18}s">★</span>`).join('')}</div>
        <p>${out.first ? 'First clear!' : 'Replay rewards'}${stars === 3 ? ' Nobody fainted.' : ''}</p><div class="chips">${gain}</div>
        <button class="btn green" data-ok>Continue</button></div>`
    : `<div class="card result lose"><div class="ribbon grey">DEFEAT</div><p>${B.time <= 0 ? 'You ran out of time.' : 'Your team fainted.'}<br>Level up your sweets with jam, or try a different team.</p>
        <button class="btn green" data-again>Try again</button><button class="btn" data-ok>Back</button></div>`;
  box.querySelector('[data-ok]').onclick = () => close({win: won, stars, out});
  box.querySelector('[data-again]')?.addEventListener('click', () => { const o = B.opts; shut(); start(o); });
}
function shut() { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); B = null; if (root) { root.className = 'screen'; root.innerHTML = ''; } }
function close(res) { const o = B?.opts; shut(); o?.onEnd?.(res); }

window.CKBattle = {start, active: () => !!B, _state: () => B, _skill: i => B && useSkill(B.cats[i])};
})();
