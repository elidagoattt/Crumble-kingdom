// What If? Studio: drawing. Characters (people and animals), sets, props and captions.
// Every set is drawn to fit any stage size, so videos work in portrait (540x960) and landscape (960x540).
(function () {
  const INK = '#241a15';
  const TAU = Math.PI * 2;

  // ---------- options shown in the editor ----------
  const SPECIES = { person: '🧑 Person', cat: '🐱 Cat', dog: '🐶 Dog', bunny: '🐰 Bunny', bear: '🐻 Bear', fox: '🦊 Fox', pig: '🐷 Pig', bird: '🐦 Bird' };
  const FUR_DEFAULT = { cat: '#f2a65a', dog: '#c08a55', bunny: '#f4f1ec', bear: '#8a5a3b', fox: '#ec7a2c', pig: '#f7b6c2', bird: '#5fb3e8' };
  const HAIR = { none: 'Bald', flop: 'Flop', curly: 'Curly', spiky: 'Spiky', buzz: 'Buzz', bun: 'Bun', long: 'Long', beanie: 'Beanie' };
  const SHIRTS = { tee: 'T-shirt', jacket: 'Jacket', collar: 'Collar', stripes: 'Stripes', hoodie: 'Hoodie', vest: 'Vest', dress: 'Dress', none: 'No clothes' };
  const EXPR = { neutral: '😐 Neutral', happy: '😊 Happy', smug: '😏 Smug', shocked: '😮 Shocked', laugh: '😆 Laughing', sad: '😢 Sad', angry: '😠 Angry', confused: '🤨 Confused', sleepy: '😴 Sleepy' };
  const ANIM = { idle: 'Idle', talk: 'Talk', wave: 'Wave', point: 'Point', cheer: 'Cheer', jump: 'Jump', shake: 'Shake', walkin: 'Walk in', spin: 'Spin', facepalm: 'Facepalm' };
  const SKINS = ['#f6f2ec', '#f3d9c1', '#e3b48e', '#c48a62', '#8d5a3b', '#5e3b26'];
  const FURS = ['#f2a65a', '#f4f1ec', '#1f1f1f', '#9a9a9a', '#c08a55', '#8a5a3b', '#ec7a2c', '#f7b6c2', '#5fb3e8', '#ffd23f', '#7ac74f'];
  const HAIRCOL = ['#f0c24b', '#e07a3a', '#6b4227', '#2b1d16', '#121212', '#d9d4cc', '#e8559a', '#3a7be0'];
  const SHIRTCOL = ['#2f63e0', '#3fc1b0', '#f2c230', '#e85b3a', '#5fbf4a', '#8a5cd6', '#2a3348', '#f07fb0', '#ffffff', '#7a5a3c'];

  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const line = (c, pts, lw = 7, col = INK) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
  const fillStroke = (c, fill, lw = 7) => { if (fill) { c.fillStyle = fill; c.fill(); } c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); };
  const osc = (t, f) => Math.sin(t * f * TAU);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };

  // ---------- a character ----------
  // look = {species, hair, hairColor, skin, fur, patch, shirt, shirtColor, glasses, blush}
  // s = {expr, anim, t (seconds into the scene), talking, hold, holdText, wobble}
  function person(ctx, look, s) {
    const t = s.t || 0, a = s.anim || 'idle';
    let bob = osc(t, 0.6) * 3, dy = 0, shakeX = 0;
    if (a === 'jump') { const p = (t % 1.1) / 1.1; dy = -Math.max(0, Math.sin(p * Math.PI)) * 90; }
    if (a === 'cheer') dy = -Math.abs(osc(t, 1.4)) * 30;
    if (a === 'shake') shakeX = osc(t, 9) * 6;
    ctx.save();
    ctx.translate(shakeX, dy + bob);
    if (s.wobble) { ctx.rotate(osc(t, 1.1) * 0.09); const q = osc(t, 2.2) * 0.05; ctx.scale(1 + q, 1 - q); }
    if (a === 'spin') { ctx.translate(0, -230); ctx.rotate((t * 1.6 % 1) * TAU); ctx.translate(0, 230); }
    const walking = a === 'walkin' && t < 0.9;
    const sw = walking ? osc(t, 2.4) * 22 : 0;
    line(ctx, [[-20, -150], [-22 - sw, -6]]); line(ctx, [[20, -150], [22 + sw, -6]]);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-28 - sw, -4, 16, 8, 0, 0, TAU); ctx.ellipse(28 + sw, -4, 16, 8, 0, 0, TAU); ctx.fill();
    const hands = armPose(a, t, s);
    const shoulder = [[-46, -300], [46, -300]];
    torso(ctx, look);
    for (let i = 0; i < 2; i++) {
      const [hx, hy] = hands[i], [sx, sy] = shoulder[i];
      const mx = (sx + hx) / 2 + (i ? 14 : -14), my = (sy + hy) / 2 + 10;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(mx, my, hx, hy); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx, hy, 10, 0, TAU); ctx.fill();
    }
    if (s.hold && s.hold !== 'none') { ctx.save(); ctx.translate(hands[1][0], hands[1][1]); drawProp(ctx, s.hold, 0.6, s.holdText || '', t); ctx.restore(); }
    ctx.save();
    if (s.wobble) ctx.translate(osc(t, 1.4) * 7, 0);
    head(ctx, look, s);
    ctx.restore();
    ctx.restore();
  }

  function armPose(a, t, s) {
    let L = [-72, -168], R = [72, -168];
    if (a === 'wave') R = [100 + osc(t, 1.6) * 18, -470];
    if (a === 'point') R = [165, -300];
    if (a === 'cheer') { L = [-95, -500 + osc(t, 1.4) * 10]; R = [95, -500 - osc(t, 1.4) * 10]; }
    if (a === 'shake') { L = [-60, -210 + osc(t, 9) * 6]; R = [60, -210 - osc(t, 9) * 6]; }
    if (a === 'facepalm') R = [30, -420];
    if (a === 'talk') R = [95, -250 + osc(t, 1.2) * 14];
    if (s.hold && s.hold !== 'none' && a !== 'wave' && a !== 'cheer' && a !== 'point') R = [95, -240];
    return [L, R];
  }

  function torso(ctx, look) {
    const animal = look.species && look.species !== 'person';
    const type = look.shirt || 'tee';
    const col = type === 'none' ? (animal ? (look.fur || FUR_DEFAULT[look.species]) : (look.skin || SKINS[0])) : (look.shirtColor || '#2f63e0');
    ctx.save();
    if (type === 'dress') { ctx.beginPath(); ctx.moveTo(-46, -320); ctx.lineTo(46, -320); ctx.lineTo(78, -130); ctx.lineTo(-78, -130); ctx.closePath(); fillStroke(ctx, col); ctx.restore(); return; }
    rr(ctx, -58, -330, 116, 200, [46, 46, 28, 28]); fillStroke(ctx, col);
    ctx.save(); rr(ctx, -58, -330, 116, 200, [46, 46, 28, 28]); ctx.clip();
    if (type === 'jacket' || type === 'vest') {
      ctx.fillStyle = type === 'vest' ? '#fff8e6' : '#eef3f6'; ctx.fillRect(-20, -330, 40, 200);
      line(ctx, [[-20, -330], [-20, -130]], 5); line(ctx, [[20, -330], [20, -130]], 5);
      if (type === 'jacket') { rr(ctx, -50, -200, 24, 26, 3); fillStroke(ctx, null, 4); rr(ctx, 26, -200, 24, 26, 3); fillStroke(ctx, null, 4); }
    } else if (type === 'collar') {
      ctx.beginPath(); ctx.moveTo(-34, -328); ctx.lineTo(0, -300); ctx.lineTo(-14, -280); ctx.closePath(); fillStroke(ctx, '#ffffff', 4);
      ctx.beginPath(); ctx.moveTo(34, -328); ctx.lineTo(0, -300); ctx.lineTo(14, -280); ctx.closePath(); fillStroke(ctx, '#ffffff', 4);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(-26, -230, 9, 50, 0.1, 0, TAU); ctx.fill();
    } else if (type === 'stripes') {
      ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let x = -60; x < 60; x += 20) ctx.fillRect(x, -330, 8, 200);
    } else if (type === 'hoodie') {
      ctx.beginPath(); ctx.arc(0, -330, 42, 0, Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      rr(ctx, -34, -205, 68, 40, 10); fillStroke(ctx, null, 4);
    } else if (type === 'none' && animal) {
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(0, -200, 36, 60, 0, 0, TAU); ctx.fill();
    } else { ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-28, -235, 9, 55, 0.1, 0, TAU); ctx.fill(); }
    ctx.restore(); ctx.restore();
  }

  function head(ctx, look, s) {
    const R = 74, cy = -405;
    const sp = look.species || 'person';
    const animal = sp !== 'person';
    const skin = animal ? (look.fur || FUR_DEFAULT[sp]) : (look.skin || SKINS[0]);
    const hair = animal ? 'none' : (look.hair || 'none'), hc = look.hairColor || '#2b1d16';
    if (animal) earsBehind(ctx, sp, skin, cy, R, s.t || 0);
    if (hair === 'long') { rr(ctx, -84, cy - 40, 168, 150, 40); fillStroke(ctx, hc); }
    ctx.beginPath(); ctx.arc(0, cy, R, 0, TAU); fillStroke(ctx, skin);
    ctx.save(); ctx.beginPath(); ctx.arc(0, cy, R - 3, 0, TAU); ctx.clip();
    if (animal && look.patch) { ctx.fillStyle = '#1f1f1f'; ctx.beginPath(); ctx.ellipse(-34, cy - 34, 62, 52, 0.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(48, cy - 56, 40, 30, -0.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.beginPath(); ctx.arc(28, cy + 14, R, 0, TAU); ctx.fill();
    if (['dog', 'bear', 'fox'].includes(sp)) { ctx.fillStyle = sp === 'fox' ? '#fff6ea' : shade(skin, 1.25); ctx.beginPath(); ctx.ellipse(4, cy + 34, 38, 28, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (animal) earsFront(ctx, sp, skin, cy, R);
    hairTop(ctx, hair, hc, cy, R);
    face(ctx, s, cy, look, sp);
    if (animal) snout(ctx, sp, skin, cy, s);
  }

  function earsBehind(ctx, sp, fur, cy, R, t) {
    const inner = '#ff9fb4';
    if (sp === 'cat' || sp === 'fox') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 62, cy - 28); ctx.lineTo(d * 58, cy - R - 46); ctx.lineTo(d * 14, cy - R + 6); ctx.closePath(); fillStroke(ctx, fur, 6); ctx.beginPath(); ctx.moveTo(d * 52, cy - 40); ctx.lineTo(d * 52, cy - R - 26); ctx.lineTo(d * 26, cy - R + 6); ctx.closePath(); ctx.fillStyle = sp === 'fox' ? '#fff6ea' : inner; ctx.fill(); }
    } else if (sp === 'bunny') {
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 30, cy - R + 10); ctx.rotate(d * (0.15 + osc(t, 0.5) * 0.04)); ctx.beginPath(); ctx.ellipse(0, -70, 22, 72, 0, 0, TAU); fillStroke(ctx, fur, 6); ctx.beginPath(); ctx.ellipse(0, -66, 10, 54, 0, 0, TAU); ctx.fillStyle = inner; ctx.fill(); ctx.restore(); }
    } else if (sp === 'bear') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 54, cy - 56, 26, 0, TAU); fillStroke(ctx, fur, 6); ctx.beginPath(); ctx.arc(d * 54, cy - 56, 12, 0, TAU); ctx.fillStyle = shade(fur, 0.75); ctx.fill(); }
    } else if (sp === 'pig') {
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 60, cy - 30); ctx.lineTo(d * 64, cy - R - 18); ctx.lineTo(d * 24, cy - R + 4); ctx.closePath(); fillStroke(ctx, fur, 6); }
    }
  }
  function earsFront(ctx, sp, fur, cy, R) {
    if (sp === 'dog') for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 64, cy - 30); ctx.rotate(d * 0.25); ctx.beginPath(); ctx.ellipse(0, 34, 22, 48, 0, 0, TAU); fillStroke(ctx, shade(fur, 0.7), 6); ctx.restore(); }
    if (sp === 'bird') { ctx.save(); for (const [x, r] of [[-12, -0.3], [4, 0], [20, 0.3]]) { ctx.save(); ctx.translate(x, cy - R + 4); ctx.rotate(r); ctx.beginPath(); ctx.ellipse(0, -16, 7, 20, 0, 0, TAU); fillStroke(ctx, fur, 5); ctx.restore(); } ctx.restore(); }
  }
  function snout(ctx, sp, fur, cy, s) {
    const talk = s.talking ? Math.abs(osc(s.t || 0, 3.2)) : 0;
    ctx.save();
    if (sp === 'bird') {
      ctx.beginPath(); ctx.moveTo(-14, cy + 20); ctx.lineTo(28, cy + 24); ctx.lineTo(-14, cy + 30); ctx.closePath(); fillStroke(ctx, '#ffb02e', 4);
      ctx.beginPath(); ctx.moveTo(-14, cy + 32); ctx.lineTo(22, cy + 34 + talk * 8); ctx.lineTo(-14, cy + 40 + talk * 6); ctx.closePath(); fillStroke(ctx, '#f08a1e', 4);
    } else if (sp === 'pig') {
      ctx.beginPath(); ctx.ellipse(4, cy + 22, 22, 15, 0, 0, TAU); fillStroke(ctx, shade(fur, 0.9), 5);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-4, cy + 22, 4, 6, 0, 0, TAU); ctx.ellipse(12, cy + 22, 4, 6, 0, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = sp === 'cat' || sp === 'bunny' ? '#ff8fa6' : INK; ctx.beginPath(); ctx.moveTo(-6, cy + 16); ctx.lineTo(14, cy + 16); ctx.lineTo(4, cy + 26); ctx.closePath(); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      if (sp === 'cat' || sp === 'fox' || sp === 'bunny') { ctx.lineWidth = 3; for (const d of [-1, 1]) for (const k of [-1, 0, 1]) line(ctx, [[4 + d * 26, cy + 24 + k * 6], [4 + d * 64, cy + 18 + k * 12]], 3); }
    }
    ctx.restore();
  }

  function hairTop(ctx, hair, hc, cy, R) {
    if (hair === 'none') return;
    ctx.save();
    if (hair === 'flop' || hair === 'long') {
      ctx.beginPath(); ctx.arc(0, cy - 4, R + 8, Math.PI * 1.02, Math.PI * 1.98);
      for (let i = 0; i <= 6; i++) { const x = R + 6 - i * ((2 * R + 12) / 6); ctx.quadraticCurveTo(x + 8, cy - 18 + (i % 2) * 8, x - 4, cy - 24); }
      ctx.closePath(); fillStroke(ctx, hc);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-10, cy - 40, 40, Math.PI * 1.15, Math.PI * 1.6); ctx.stroke();
    } else if (hair === 'curly') {
      ctx.beginPath(); ctx.arc(0, cy - 6, R + 6, Math.PI * 1.03, Math.PI * 1.97); ctx.quadraticCurveTo(0, cy - 40, -R - 4, cy - 14); ctx.closePath(); fillStroke(ctx, hc);
      ctx.strokeStyle = '#efe6d8'; ctx.lineWidth = 3;
      for (let r = 0; r < 2; r++) for (let i = 0; i < 6 - r; i++) { const x = -48 + i * 19 + r * 9, y = cy - 62 + r * 22; ctx.beginPath(); ctx.arc(x, y, 6, Math.PI * 0.2, Math.PI * 1.3); ctx.stroke(); }
    } else if (hair === 'spiky') {
      ctx.beginPath(); ctx.arc(0, cy - 6, R + 5, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(0, cy - 44, -R - 3, cy - 16); ctx.closePath(); fillStroke(ctx, hc);
      ctx.beginPath(); ctx.moveTo(-12, cy - R - 2); ctx.lineTo(2, cy - R - 36); ctx.lineTo(14, cy - R); ctx.closePath(); fillStroke(ctx, hc, 5);
    } else if (hair === 'buzz') {
      ctx.beginPath(); ctx.arc(0, cy, R + 3, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(0, cy - 52, -R, cy - 22); ctx.closePath(); fillStroke(ctx, hc, 5);
    } else if (hair === 'bun') {
      ctx.beginPath(); ctx.arc(0, cy - R - 12, 22, 0, TAU); fillStroke(ctx, hc);
      ctx.beginPath(); ctx.arc(0, cy - 4, R + 5, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(0, cy - 40, -R - 3, cy - 18); ctx.closePath(); fillStroke(ctx, hc);
    } else if (hair === 'beanie') {
      ctx.beginPath(); ctx.arc(0, cy - 8, R + 8, Math.PI, 0); ctx.closePath(); fillStroke(ctx, hc);
      rr(ctx, -R - 10, cy - 28, 2 * R + 20, 26, 10); fillStroke(ctx, hc);
      ctx.beginPath(); ctx.arc(0, cy - R - 20, 14, 0, TAU); fillStroke(ctx, hc);
    }
    ctx.restore();
  }

  function face(ctx, s, cy, look, sp) {
    const e = s.expr || 'neutral', t = s.t || 0;
    const bird = sp === 'bird';
    const talkOpen = s.talking && !bird ? (0.5 + 0.5 * Math.abs(osc(t, 3.2))) : 0;
    const ey = cy + 2, ex = 26;
    const mY = sp && sp !== 'person' && sp !== 'pig' ? 6 : 0; // animals' mouths sit a bit lower, under the nose
    ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 6;
    if (look.patch && sp !== 'person') { ctx.strokeStyle = INK; }
    const brow = (y, tiltL = 0, tiltR = 0) => { line(ctx, [[-ex - 18, y + tiltL], [-ex + 16, y - tiltL]], 7); line(ctx, [[ex - 16, y - tiltR], [ex + 18, y + tiltR]], 7); };
    const dots = (r = 8) => { ctx.fillStyle = look.patch ? '#fff' : INK; ctx.beginPath(); ctx.arc(-ex, ey, r + (look.patch ? 2 : 0), 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-ex, ey, r, 0, TAU); ctx.arc(ex, ey, r, 0, TAU); ctx.fill(); };
    const arcs = (up = true) => { for (const x of [-ex, ex]) { ctx.beginPath(); ctx.arc(x, ey + (up ? 6 : -6), 11, up ? Math.PI * 1.1 : Math.PI * 0.1, up ? Math.PI * 1.9 : Math.PI * 0.9); ctx.strokeStyle = look.patch && x < 0 ? '#fff' : INK; ctx.stroke(); } ctx.strokeStyle = INK; };
    const mouthO = (w, h) => { if (bird) return; ctx.beginPath(); ctx.ellipse(4, cy + 40 + mY, w, h, 0, 0, TAU); ctx.fillStyle = '#5a1d1d'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff8fa0'; ctx.beginPath(); ctx.ellipse(4, cy + 40 + mY + h * 0.45, w * 0.6, h * 0.35, 0, 0, TAU); ctx.fill(); ctx.fillStyle = INK; };
    const smile = () => { if (bird) return; if (sp && sp !== 'person' && sp !== 'pig') { ctx.beginPath(); ctx.arc(-8, cy + 30, 12, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(16, cy + 30, 12, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(4, cy + 30, 18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); } };
    const brw = (y) => { if (look.patch) { ctx.save(); ctx.strokeStyle = '#fff'; line(ctx, [[-ex - 18, y], [-ex + 16, y]], 7, '#fff'); ctx.restore(); line(ctx, [[ex - 16, y], [ex + 18, y]], 7); } else brow(y); };
    if (e === 'happy') { brw(ey - 34); arcs(true); if (talkOpen) mouthO(14, 8 + talkOpen * 10); else smile(); }
    else if (e === 'smug') {
      line(ctx, [[-ex - 20, ey - 26], [-ex + 16, ey - 30]], 7, look.patch ? '#fff' : INK); line(ctx, [[ex - 16, ey - 30], [ex + 20, ey - 26]], 7);
      for (const x of [-ex, ex]) { const col = look.patch && x < 0 ? '#fff' : INK; line(ctx, [[x - 20, ey - 4], [x + 20, ey - 4]], 6, col); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, ey - 4, 10, 0, Math.PI); ctx.fill(); }
      if (talkOpen) mouthO(12, 6 + talkOpen * 8); else if (!bird) { ctx.beginPath(); ctx.moveTo(-8, cy + 40 + mY); ctx.quadraticCurveTo(14, cy + 44 + mY, 30, cy + 26 + mY); ctx.stroke(); }
    }
    else if (e === 'shocked') { brw(ey - 40); ctx.lineWidth = 5; for (const x of [-ex, ex]) { ctx.beginPath(); ctx.arc(x, ey, 14, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, ey + 1, 6, 0, TAU); ctx.fill(); } mouthO(12, 18 + talkOpen * 4); }
    else if (e === 'laugh') { brw(ey - 34); line(ctx, [[-ex - 12, ey - 6], [-ex + 2, ey], [-ex - 12, ey + 6]], 6, look.patch ? '#fff' : INK); line(ctx, [[ex + 12, ey - 6], [ex - 2, ey], [ex + 12, ey + 6]], 6); if (!bird) { ctx.beginPath(); ctx.moveTo(-24, cy + 26 + mY); ctx.lineTo(32, cy + 26 + mY); ctx.quadraticCurveTo(4, cy + 74 + mY + talkOpen * 6, -24, cy + 26 + mY); ctx.fillStyle = '#5a1d1d'; ctx.fill(); ctx.stroke(); } }
    else if (e === 'sad') { line(ctx, [[-ex - 16, ey - 22], [-ex + 14, ey - 34]], 7, look.patch ? '#fff' : INK); line(ctx, [[ex - 14, ey - 34], [ex + 16, ey - 22]], 7); dots(7); if (!bird) { ctx.beginPath(); ctx.arc(4, cy + 52 + mY, 16, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); } ctx.fillStyle = '#7cc6f2'; ctx.beginPath(); ctx.ellipse(-ex - 4, ey + 22 + (t * 30 % 26), 4, 7, 0, 0, TAU); ctx.fill(); }
    else if (e === 'angry') { line(ctx, [[-ex - 18, ey - 30], [-ex + 14, ey - 18]], 8, look.patch ? '#fff' : INK); line(ctx, [[ex - 14, ey - 18], [ex + 18, ey - 30]], 8); dots(7); if (talkOpen) mouthO(14, 6 + talkOpen * 8); else if (!bird) { ctx.beginPath(); ctx.arc(4, cy + 50 + mY, 16, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); } }
    else if (e === 'confused') { line(ctx, [[-ex - 18, ey - 26], [-ex + 14, ey - 26]], 7, look.patch ? '#fff' : INK); line(ctx, [[ex - 14, ey - 38], [ex + 18, ey - 30]], 7); dots(7); if (!bird) { ctx.beginPath(); ctx.moveTo(-14, cy + 38 + mY); ctx.quadraticCurveTo(-4, cy + 30 + mY, 4, cy + 38 + mY); ctx.quadraticCurveTo(12, cy + 46 + mY, 22, cy + 36 + mY); ctx.stroke(); } }
    else if (e === 'sleepy') { brw(ey - 30); arcs(false); if (!bird) { ctx.beginPath(); ctx.ellipse(6, cy + 38 + mY, 7, 9, 0, 0, TAU); ctx.fillStyle = '#5a1d1d'; ctx.fill(); ctx.stroke(); } ctx.fillStyle = INK; ctx.font = '700 26px Fredoka, sans-serif'; ctx.fillText('z', 70, cy - 60 - (t * 20 % 30)); }
    else { brw(ey - 32); dots(8); if (talkOpen) mouthO(13, 6 + talkOpen * 9); else if (!bird) line(ctx, [[-10, cy + 38 + mY], [18, cy + 38 + mY]], 6); }
    if (look.glasses) { ctx.lineWidth = 5; ctx.strokeStyle = INK; for (const x of [-ex, ex]) { ctx.beginPath(); ctx.arc(x, ey, 20, 0, TAU); ctx.stroke(); } line(ctx, [[-ex + 20, ey], [ex - 20, ey]], 5); }
    if (look.blush) { ctx.fillStyle = 'rgba(255,120,140,.35)'; ctx.beginPath(); ctx.ellipse(-ex - 14, ey + 24, 12, 7, 0, 0, TAU); ctx.ellipse(ex + 14, ey + 24, 12, 7, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // ---------- props ----------
  const PROPS = { mug: '☕ Mug', phone: '📱 Phone', ticket: '🎟️ Ticket', sign: '🪧 Sign', bubble: '💬 Speech bubble', thought: '💭 Thought', money: '💵 Money', bag: '🛍️ Bag', laptop: '💻 Laptop', car: '🚗 Car', question: '❓ Question mark', exclaim: '❗ Shock lines', star: '⭐ Star', heart: '❤️ Heart', sun: '☀️ Sun', moon: '🌙 Moon', bowl: '🥣 Pet bowl', ball: '⚾ Ball' };
  function wrap(ctx, text, maxW) { const words = String(text).split(/\s+/); const lines = []; let cur = ''; for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; } if (cur) lines.push(cur); return lines; }
  function drawProp(ctx, type, sc, text, t) {
    ctx.save(); ctx.scale(sc, sc);
    const T = (str, size, col = INK, maxW = 200, y = 0) => { ctx.font = `700 ${size}px Fredoka, sans-serif`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const ls = wrap(ctx, str, maxW); ls.forEach((l, i) => ctx.fillText(l, 0, y + (i - (ls.length - 1) / 2) * size * 1.1)); };
    if (type === 'mug') { rr(ctx, -30, -40, 60, 70, 10); fillStroke(ctx, '#fff', 5); ctx.beginPath(); ctx.arc(36, -6, 16, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); }
    else if (type === 'phone') { rr(ctx, -28, -52, 56, 104, 12); fillStroke(ctx, '#1d2330', 5); rr(ctx, -21, -44, 42, 86, 7); ctx.fillStyle = '#7fd0ff'; ctx.fill(); }
    else if (type === 'ticket') { ctx.rotate(-0.06); rr(ctx, -130, -60, 260, 120, 8); fillStroke(ctx, '#fff3d6', 5); ctx.fillStyle = '#f2b230'; ctx.fillRect(-127, -57, 254, 24); T('VIP CONCERT', 18, INK, 240, -45); T(text || 'SEAT 12B', 30, INK, 170, 4); ctx.beginPath(); ctx.arc(90, 4, 26, 0, TAU); ctx.fillStyle = '#e8463a'; ctx.fill(); ctx.save(); ctx.translate(90, 0); T('VIP', 18, '#fff', 60, 4); ctx.restore(); }
    else if (type === 'sign') { line(ctx, [[0, 20], [0, 150]], 9, '#7a5a3c'); rr(ctx, -140, -70, 280, 110, 12); fillStroke(ctx, '#fffbef', 6); T(text || 'Sign text', 30, INK, 250, -15); }
    else if (type === 'bubble' || type === 'thought') {
      ctx.font = '700 30px Fredoka, sans-serif'; const ls = wrap(ctx, text || 'Hello!', 240); const h = 40 + ls.length * 34, w = 280;
      if (type === 'bubble') { rr(ctx, -w / 2, -h, w, h, 26); fillStroke(ctx, '#fff', 5); ctx.beginPath(); ctx.moveTo(-30, -4); ctx.lineTo(-60, 40); ctx.lineTo(0, -4); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); line(ctx, [[-30, 0], [-60, 40], [2, 0]], 5); }
      else { ctx.beginPath(); ctx.ellipse(0, -h / 2, w / 2 + 10, h / 2 + 10, 0, 0, TAU); fillStroke(ctx, '#fff', 5); for (const [x, y, r] of [[-60, 24, 14], [-84, 52, 8]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); fillStroke(ctx, '#fff', 4); } }
      T(text || 'Hello!', 30, INK, 240, -h / 2);
    }
    else if (type === 'money') { for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(-0.2 + i * 0.15); rr(ctx, -70, -34 - i * 6, 140, 68, 6); fillStroke(ctx, '#7fd36b', 5); ctx.restore(); } T('£', 40, '#1f5a14', 60, -12); }
    else if (type === 'bag') { rr(ctx, -55, -50, 110, 110, 8); fillStroke(ctx, '#f07fb0', 5); ctx.beginPath(); ctx.arc(0, -50, 26, Math.PI, 0); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
    else if (type === 'laptop') { rr(ctx, -90, -110, 180, 115, 8); fillStroke(ctx, '#2a3348', 5); rr(ctx, -80, -100, 160, 95, 4); ctx.fillStyle = '#bfe3ff'; ctx.fill(); if (text) T(text, 20, INK, 150, -52); ctx.beginPath(); ctx.moveTo(-110, 5); ctx.lineTo(110, 5); ctx.lineTo(96, 22); ctx.lineTo(-96, 22); ctx.closePath(); fillStroke(ctx, '#cfd6df', 5); }
    else if (type === 'car') {
      ctx.beginPath(); ctx.moveTo(-210, 0); ctx.lineTo(-210, -60); ctx.quadraticCurveTo(-200, -80, -150, -84); ctx.lineTo(-100, -140); ctx.lineTo(90, -140); ctx.lineTo(150, -84); ctx.quadraticCurveTo(205, -80, 210, -50); ctx.lineTo(210, 0); ctx.closePath(); fillStroke(ctx, text && /^#/.test(text) ? text : '#56c977', 6);
      ctx.beginPath(); ctx.moveTo(-88, -128); ctx.lineTo(-10, -128); ctx.lineTo(-10, -86); ctx.lineTo(-128, -86); ctx.closePath(); fillStroke(ctx, '#bfe3ff', 5);
      ctx.beginPath(); ctx.moveTo(6, -128); ctx.lineTo(84, -128); ctx.lineTo(128, -86); ctx.lineTo(6, -86); ctx.closePath(); fillStroke(ctx, '#bfe3ff', 5);
      for (const x of [-130, 130]) { ctx.beginPath(); ctx.arc(x, 0, 38, 0, TAU); fillStroke(ctx, '#2a2a2a', 6); ctx.beginPath(); ctx.arc(x, 0, 16, 0, TAU); ctx.fillStyle = '#c9ced6'; ctx.fill(); }
    }
    else if (type === 'question') { ctx.rotate(osc(t, 0.8) * 0.1); ctx.font = '800 140px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.strokeText('?', 0, 0); ctx.fillStyle = '#3f7cf0'; ctx.fillText('?', 0, 0); }
    else if (type === 'exclaim') { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.35; line(ctx, [[Math.cos(a) * 50, Math.sin(a) * 50], [Math.cos(a) * (90 + osc(t, 3) * 6), Math.sin(a) * (90 + osc(t, 3) * 6)]], 8); } }
    else if (type === 'star') { ctx.rotate(t * 0.6); ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 26 : 60, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); fillStroke(ctx, '#ffd23f', 5); }
    else if (type === 'heart') { ctx.scale(1 + osc(t, 1.2) * 0.06, 1 + osc(t, 1.2) * 0.06); ctx.beginPath(); ctx.moveTo(0, 40); ctx.bezierCurveTo(-80, -10, -40, -70, 0, -30); ctx.bezierCurveTo(40, -70, 80, -10, 0, 40); fillStroke(ctx, '#ff4f6d', 6); }
    else if (type === 'sun') { const col = text && /^#/.test(text) ? text : '#ffcc33'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + t * 0.3; line(ctx, [[Math.cos(a) * 70, Math.sin(a) * 70], [Math.cos(a) * 95, Math.sin(a) * 95]], 8, col); } ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); fillStroke(ctx, col, 6); }
    else if (type === 'moon') { ctx.beginPath(); ctx.arc(0, 0, 60, 0.3 * Math.PI, 1.7 * Math.PI); ctx.arc(24, -6, 50, 1.6 * Math.PI, 0.4 * Math.PI, true); ctx.closePath(); fillStroke(ctx, '#ffe9a8', 6); }
    else if (type === 'bowl') { ctx.beginPath(); ctx.moveTo(-70, -30); ctx.lineTo(70, -30); ctx.lineTo(54, 10); ctx.lineTo(-54, 10); ctx.closePath(); fillStroke(ctx, '#e85b3a', 6); ctx.fillStyle = '#a86a3a'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(-48 + i * 16, -34 - (i % 2) * 6, 9, 0, TAU); ctx.fill(); } }
    else if (type === 'ball') { ctx.translate(0, -Math.abs(osc(t, 0.9)) * 40); ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); fillStroke(ctx, '#fff', 5); ctx.strokeStyle = '#e85b3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-40, 0, 30, -0.7, 0.7); ctx.stroke(); ctx.beginPath(); ctx.arc(40, 0, 30, Math.PI - 0.7, Math.PI + 0.7); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- sets (drawn to fit W x H) ----------
  const SETS = { meadow: '🌼 Meadow café', checkout: '🛒 Shop checkout', arena: '🎟️ VIP arena gate', street: '🏡 Street', dressing: '🪞 Dressing room', office: '💻 Giveaway office', bedroom: '🛏️ Bedroom', classroom: '🏫 Classroom', space: '🚀 Space', beach: '🏖️ Beach', night: '🌃 City at night', plain: '🎨 Plain colour' };
  const SIGN_SETS = { office: 'Screen text', classroom: 'Board text', checkout: 'Screen text', arena: 'Banner text', plain: 'Colour (e.g. #ffd23f)' };
  function sky(ctx, W, top, bot, h) { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, h); }
  function cloud(ctx, x, y, s) { ctx.fillStyle = 'rgba(255,255,255,.92)'; for (const [dx, dy, r] of [[0, 0, 40], [40, -18, 46], [86, 0, 38], [44, 14, 40]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill(); } }
  function bigText(ctx, str, x, y, size, col, maxW) { ctx.font = `800 ${size}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const ls = wrap(ctx, str, maxW); ls.forEach((l, i) => { ctx.fillStyle = col; ctx.fillText(l, x, y + (i - (ls.length - 1) / 2) * size * 1.05); }); }
  function confetti(ctx, W, y0, h, n, cols) { for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse((i * 131.7) % W, y0 + (i * 71.3) % h, 5, 3, i, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  function drawSet(ctx, set, t, sign, W, H) {
    ctx.save();
    const land = W > H;
    if (set === 'meadow') {
      sky(ctx, W, '#86bff0', '#d9ecf7', H * 0.55); cloud(ctx, W * 0.07, H * 0.15, 1); cloud(ctx, W * 0.66, H * 0.1, .8); if (land) cloud(ctx, W * 0.38, H * 0.2, .7);
      ctx.fillStyle = '#4aa646'; ctx.beginPath(); ctx.moveTo(0, H * 0.49); ctx.quadraticCurveTo(W / 2, H * 0.37, W, H * 0.47); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      for (const x of [W * 0.13, W * 0.26]) { ctx.fillStyle = '#3b8f3a'; ctx.beginPath(); ctx.arc(x, H * 0.44, 34, 0, TAU); ctx.arc(x + 30, H * 0.44 - 10, 30, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#7fd35c'; ctx.fillRect(0, H * 0.58, W, H * 0.42);
      const n = Math.round(W * H / 3700); for (let i = 0; i < n; i++) { const x = (i * 97.3) % W, y = H * 0.6 + ((i * 53.1) % (H * 0.4)); ctx.fillStyle = ['#e85b9a', '#f2c230', '#b98cff', '#ffffff', '#ff8a4f'][i % 5]; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
      const px = W * 0.87; line(ctx, [[px, H * 0.34], [px, H * 0.94]], 10, '#1d2741');
      ctx.beginPath(); ctx.moveTo(px - 220, H * 0.42); ctx.lineTo(px, H * 0.31); ctx.lineTo(px + 130, H * 0.375); ctx.lineTo(px + 70, H * 0.44); ctx.closePath(); ctx.fillStyle = '#ee8a3a'; ctx.fill();
      ctx.fillStyle = '#d6432f'; ctx.beginPath(); ctx.moveTo(px - 150, H * 0.4); ctx.lineTo(px, H * 0.31); ctx.lineTo(px - 50, H * 0.42); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px, H * 0.73, 120, 30, 0, 0, TAU); ctx.fillStyle = '#f4f4f2'; ctx.fill(); line(ctx, [[px, H * 0.75], [px, H * 0.9]], 12, '#1d2741');
    } else if (set === 'checkout') {
      ctx.fillStyle = '#dfe9f3'; ctx.fillRect(0, 0, W, H); const wx = W * 0.074, wy = H * 0.094, ww = W * 0.85, wh = H * 0.27;
      ctx.fillStyle = '#9fc9ef'; ctx.fillRect(wx, wy, ww, wh); cloud(ctx, wx + 50, wy + wh * 0.4, .6); ctx.strokeStyle = '#2a3a63'; ctx.lineWidth = 10; ctx.strokeRect(wx, wy, ww, wh); line(ctx, [[W / 2, wy], [W / 2, wy + wh]], 8, '#2a3a63');
      ctx.fillStyle = '#2a3a63'; ctx.fillRect(0, H * 0.667, W, H); ctx.fillStyle = '#e9eef4'; ctx.fillRect(0, H * 0.667, W, 26);
      const sx = W - 240, sy = H * 0.667 - 210; rr(ctx, sx, sy, 200, 150, 10); fillStroke(ctx, '#1f2a48', 6); rr(ctx, sx + 16, sy + 16, 168, 118, 6); ctx.fillStyle = '#7fd0ff'; ctx.fill(); bigText(ctx, sign || '£4.99', sx + 100, sy + 75, 34, '#0d2a4a', 150); line(ctx, [[sx + 100, sy + 150], [sx + 100, H * 0.667]], 14, '#1f2a48');
    } else if (set === 'arena') {
      ctx.fillStyle = '#7fc0ef'; ctx.fillRect(0, 0, W, H); const fy = H * 0.708; ctx.fillStyle = '#3f6fa8'; ctx.fillRect(0, H * 0.583, W, fy - H * 0.583);
      line(ctx, [[W / 2, H * 0.21], [W / 2, fy]], 6, '#2a4a7a'); for (const x of [W / 2 - 60, W / 2 + 60]) line(ctx, [[x, H * 0.42], [x, H * 0.583]], 10, '#f2c230');
      for (const x of [W * 0.11, W * 0.89]) { ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.arc(x, H * 0.49, 12, 0, TAU); ctx.fill(); }
      const by = H * 0.083; rr(ctx, -10, by, W + 20, 100, 6); fillStroke(ctx, '#14215a', 8); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 6; ctx.strokeRect(6, by + 16, W - 12, 68); bigText(ctx, sign || 'ARENA GATE B · VIP ENTRY', W / 2, by + 51, 36, '#f2c230', W - 30);
      ctx.fillStyle = '#f4f1ec'; ctx.fillRect(0, fy, W, H - fy); confetti(ctx, W, fy + 10, H - fy, Math.round(W * (H - fy) / 580), ['#e85b9a', '#3a7be0', '#f2c230', '#5fbf4a', '#ff8a4f']);
    } else if (set === 'street') {
      const gy = H * 0.583; sky(ctx, W, '#7fb6ea', '#cfe4f5', gy); cloud(ctx, W * 0.55, H * 0.12, .8);
      const houses = land ? [[-20, W * 0.3, H * 0.3, '#f1efe8', '#3a4a7a'], [W * 0.33, W * 0.36, H * 0.38, '#e9ece4', '#8a2b3a'], [W * 0.72, W * 0.3, H * 0.28, '#f4e6d8', '#2f5a3a']] : [[-20, W * 0.41, H * 0.21, '#f1efe8', '#3a4a7a'], [W * 0.43, W * 0.61, H * 0.27, '#e9ece4', '#8a2b3a']];
      for (const [x, w, h, col, roof] of houses) { ctx.fillStyle = col; ctx.fillRect(x, gy - h, w, h); ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 20, gy - h); ctx.lineTo(x + w / 2, gy - h - 70); ctx.lineTo(x + w + 20, gy - h); ctx.fill(); ctx.fillStyle = '#4a78c8'; for (let k = 0; k < 2; k++) ctx.fillRect(x + 30 + k * (w / 2), gy - h + h * 0.25, 40, Math.min(50, h * 0.3)); }
      for (const x of land ? [W * 0.06, W * 0.62, W * 0.93] : [W * 0.11, W * 0.61]) { line(ctx, [[x, gy], [x, gy - 100]], 14, '#6b4227'); ctx.fillStyle = '#5aa64a'; ctx.beginPath(); ctx.arc(x, gy - 130, 60, 0, TAU); ctx.arc(x + 40, gy - 110, 46, 0, TAU); ctx.arc(x - 40, gy - 108, 44, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#7fbf5a'; ctx.fillRect(0, gy, W, H * 0.042); ctx.fillStyle = '#6b7590'; ctx.fillRect(0, gy + H * 0.042, W, H); ctx.fillStyle = '#f2c230'; for (let x = 10; x < W; x += 90) ctx.fillRect(x, H * 0.8, 50, 8);
    } else if (set === 'dressing') {
      ctx.fillStyle = '#3a2f5a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#2a2147'; ctx.fillRect(0, H * 0.833, W, H);
      const mw = 300, mx = W / 2 - mw / 2, my = H * 0.115, mh = H * 0.71; rr(ctx, mx, my, mw, mh, 6); fillStroke(ctx, '#f2c230', 8); const g = ctx.createLinearGradient(0, my, 0, my + mh); g.addColorStop(0, '#9fd0ff'); g.addColorStop(1, '#3a7be0'); rr(ctx, mx + 16, my + 16, mw - 32, mh - 32, 4); ctx.fillStyle = g; ctx.fill();
      const l = ctx.createRadialGradient(W / 2, 40, 10, W / 2, 40, 220); l.addColorStop(0, 'rgba(255,250,220,.7)'); l.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = l; ctx.fillRect(0, 0, W, 320);
      rr(ctx, -20, H * 0.52, 110, H * 0.31, 10); fillStroke(ctx, '#5a6fb0', 6); rr(ctx, W - 100, H * 0.667, 120, H * 0.167, 10); fillStroke(ctx, '#e88a3a', 6);
    } else if (set === 'office') {
      ctx.fillStyle = '#f6c98a'; ctx.fillRect(0, 0, W, H); rr(ctx, -10, H * 0.03, W + 20, 90, 4); fillStroke(ctx, '#e3b04b', 6); bigText(ctx, 'GIVEAWAY CENTRAL', W / 2, H * 0.03 + 46, 40, '#7a5520', W - 20);
      const wx = W * 0.11, wy = H * 0.03 + 120, ww = W * 0.78, wh = H * 0.667 - wy - 40; ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); ctx.fillStyle = '#7fd8e8'; ctx.fillRect(wx, wy, ww, wh); ctx.fillStyle = '#4aa646'; ctx.beginPath(); ctx.arc(wx + ww * 0.2, wy + wh, wh * 0.55, Math.PI, 0); ctx.arc(wx + ww * 0.8, wy + wh, wh * 0.7, Math.PI, 0); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.strokeRect(wx, wy, ww, wh); line(ctx, [[W / 2, wy], [W / 2, wy + wh]], 10, '#fff'); line(ctx, [[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], 10, '#fff');
      ctx.fillStyle = '#e9e6df'; ctx.fillRect(0, H * 0.667, W, H); const sx = W - 280, sy = H * 0.667 - 170; rr(ctx, sx, sy, 250, 170, 10); fillStroke(ctx, '#1f2a48', 6); rr(ctx, sx + 16, sy + 16, 218, 138, 6); ctx.fillStyle = '#0f2a3a'; ctx.fill(); ctx.strokeStyle = '#5fe08a'; ctx.lineWidth = 4; ctx.strokeRect(sx + 22, sy + 22, 206, 126); bigText(ctx, sign || 'GRAND PRIZE!', sx + 125, sy + 85, 28, '#5fe08a', 190);
    } else if (set === 'bedroom') {
      ctx.fillStyle = '#c9d8f0'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#a98a6a'; ctx.fillRect(0, H * 0.77, W, H);
      const wx = W - 240, wy = H * 0.125; ctx.fillStyle = '#20306a'; ctx.fillRect(wx, wy, 200, 220); ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(wx + 140, wy + 50, 24, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.strokeRect(wx, wy, 200, 220);
      rr(ctx, 20, H * 0.77 - 140, 300, 170, 14); fillStroke(ctx, '#7aa0e0', 6); rr(ctx, 30, H * 0.77 - 170, 90, 50, 20); fillStroke(ctx, '#fff', 5);
    } else if (set === 'classroom') {
      ctx.fillStyle = '#f2e6c9'; ctx.fillRect(0, 0, W, H); rr(ctx, W * 0.074, H * 0.125, W * 0.85, H * 0.31, 8); fillStroke(ctx, '#2f5a3a', 10); bigText(ctx, sign || 'E = mc²', W / 2, H * 0.28, 46, '#f4f4ea', W * 0.78);
      ctx.fillStyle = '#b07a4a'; ctx.fillRect(0, H * 0.79, W, H); rr(ctx, W - 210, H * 0.79 - 140, 200, 30, 6); fillStroke(ctx, '#8a5a32', 6);
    } else if (set === 'space') {
      ctx.fillStyle = '#0b0f2a'; ctx.fillRect(0, 0, W, H); const n = Math.round(W * H / 4300); for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(osc(t + i, 0.3))})`; ctx.beginPath(); ctx.arc((i * 137.3) % W, (i * 89.7) % H, (i % 3) + 1, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(W * 0.8, H * 0.19, 80, 0, TAU); fillStroke(ctx, '#e88a3a', 6); ctx.beginPath(); ctx.ellipse(W * 0.8, H * 0.19, 130, 26, -0.3, 0, TAU); ctx.lineWidth = 8; ctx.strokeStyle = '#f2c230'; ctx.stroke();
      ctx.fillStyle = '#8a8fa8'; ctx.beginPath(); ctx.ellipse(W / 2, H * 1.1, W * 0.96, H * 0.27, 0, 0, TAU); ctx.fill();
    } else if (set === 'beach') {
      sky(ctx, W, '#5fc0f0', '#bfe8fa', H * 0.5); ctx.fillStyle = '#ffd34f'; ctx.beginPath(); ctx.arc(W * 0.17, H * 0.125, 50, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2f9ad6'; ctx.fillRect(0, H * 0.5, W, H * 0.146); ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let x = -60; x < W; x += 60) ctx.fillRect(x + (t * 30 % 60), H * 0.54, 30, 5);
      ctx.fillStyle = '#f2d79a'; ctx.fillRect(0, H * 0.646, W, H);
    } else if (set === 'night') {
      sky(ctx, W, '#0f1438', '#3a2f6a', H); ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(W * 0.81, H * 0.125, 40, 0, TAU); ctx.fill();
      const gy = H * 0.667; for (let i = 0; i * 80 - 10 < W; i++) { const x = i * 80 - 10, h = (H * 0.21) + ((i * 73) % (H * 0.21)); ctx.fillStyle = '#1a1f45'; ctx.fillRect(x, gy - h, 70, h); ctx.fillStyle = '#ffd96a'; for (let r = 0; r < h / 40 - 1; r++) for (let k = 0; k < 2; k++) if ((i + r + k) % 3) ctx.fillRect(x + 12 + k * 28, gy + 20 - h + r * 40, 14, 18); }
      ctx.fillStyle = '#2a2f4a'; ctx.fillRect(0, gy, W, H);
    } else {
      ctx.fillStyle = /^#[0-9a-f]{3,8}$/i.test(sign || '') ? sign : '#ffd23f'; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  // ---------- captions ----------
  function chunks(text, per) { const w = String(text || '').trim().split(/\s+/).filter(Boolean); const out = []; for (let i = 0; i < w.length; i += per) out.push(w.slice(i, i + per).join(' ')); return out; }
  function captionIndex(text, t, dur, per) { const cs = chunks(text, per || 2); if (!cs.length) return -1; const span = Math.max(0.3, (dur - 0.2) / cs.length); return Math.min(cs.length - 1, Math.floor(t / span)); }
  function caption(ctx, text, t, dur, per, W, H) {
    const cs = chunks(text, per || 2); if (!cs.length) return;
    const span = Math.max(0.3, (dur - 0.2) / cs.length); const i = Math.min(cs.length - 1, Math.floor(t / span)); const k = Math.min(1, (t - i * span) / 0.12);
    ctx.save(); ctx.translate(W / 2, H * 0.72); const s = 0.85 + 0.15 * k; ctx.scale(s, s);
    let size = 64; ctx.font = `800 ${size}px Fredoka, sans-serif`; while (ctx.measureText(cs[i]).width > W - 40 && size > 30) { size -= 4; ctx.font = `800 ${size}px Fredoka, sans-serif`; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.22; ctx.strokeStyle = '#111'; ctx.strokeText(cs[i], 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(cs[i], 0, 0);
    ctx.restore();
  }
  function titleCard(ctx, text, t, W, H) {
    if (!text) return; const k = Math.min(1, t / 0.35); const bw = Math.min(450, W - 90);
    ctx.save(); ctx.translate(W / 2, H * 0.22); ctx.rotate(-0.05); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); ctx.globalAlpha = k;
    ctx.font = '800 34px Fredoka, sans-serif'; const ls = wrap(ctx, text.toUpperCase(), bw - 50); const h = 40 + ls.length * 38;
    rr(ctx, -bw / 2, -h / 2, bw, h, 22); ctx.fillStyle = '#121a33'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#3f7cf0'; ctx.stroke();
    ctx.fillStyle = '#3f7cf0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ls.forEach((l, i) => ctx.fillText(l, 0, (i - (ls.length - 1) / 2) * 38));
    ctx.restore();
  }

  window.WI = { SPECIES, FUR_DEFAULT, HAIR, SHIRTS, EXPR, ANIM, SKINS, FURS, HAIRCOL, SHIRTCOL, PROPS, SETS, SIGN_SETS, person, drawProp, drawSet, caption, captionIndex, titleCard };
})();
