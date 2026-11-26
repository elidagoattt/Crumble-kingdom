// What If? Studio: drawing. Characters, sets, props, captions, all drawn on a 540x960 stage.
(function () {
  const SW = 540, SH = 960;
  const INK = '#241a15';
  const TAU = Math.PI * 2;

  // ---------- options shown in the editor ----------
  const HAIR = { none: 'Bald', flop: 'Flop', curly: 'Curly', spiky: 'Spiky', buzz: 'Buzz', bun: 'Bun', long: 'Long', beanie: 'Beanie' };
  const SHIRTS = { tee: 'T-shirt', jacket: 'Jacket', collar: 'Collar', stripes: 'Stripes', hoodie: 'Hoodie', vest: 'Vest', dress: 'Dress' };
  const EXPR = { neutral: '😐 Neutral', happy: '😊 Happy', smug: '😏 Smug', shocked: '😮 Shocked', laugh: '😆 Laughing', sad: '😢 Sad', angry: '😠 Angry', confused: '🤨 Confused', sleepy: '😴 Sleepy' };
  const ANIM = { idle: 'Idle', talk: 'Talk', wave: 'Wave', point: 'Point', cheer: 'Cheer', jump: 'Jump', shake: 'Shake', walkin: 'Walk in', spin: 'Spin', facepalm: 'Facepalm' };
  const SKINS = ['#f6f2ec', '#f3d9c1', '#e3b48e', '#c48a62', '#8d5a3b', '#5e3b26'];
  const HAIRCOL = ['#f0c24b', '#e07a3a', '#6b4227', '#2b1d16', '#121212', '#d9d4cc', '#e8559a', '#3a7be0'];
  const SHIRTCOL = ['#2f63e0', '#3fc1b0', '#f2c230', '#e85b3a', '#5fbf4a', '#8a5cd6', '#2a3348', '#f07fb0', '#ffffff', '#7a5a3c'];

  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const line = (c, pts, lw = 7, col = INK) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
  const fillStroke = (c, fill, lw = 7) => { if (fill) { c.fillStyle = fill; c.fill(); } c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(); };
  const osc = (t, f) => Math.sin(t * f * TAU);

  // ---------- a character ----------
  // c = look {hair, hairColor, skin, shirt, shirtColor, glasses}; s = {expr, anim, t (seconds into the scene), talking}
  function person(ctx, look, s) {
    const t = s.t || 0, a = s.anim || 'idle';
    let bob = osc(t, 0.6) * 3, rot = 0, dy = 0, shakeX = 0;
    if (a === 'jump') { const p = (t % 1.1) / 1.1; dy = -Math.max(0, Math.sin(p * Math.PI)) * 90; }
    if (a === 'cheer') dy = -Math.abs(osc(t, 1.4)) * 30;
    if (a === 'shake') shakeX = osc(t, 9) * 6;
    if (a === 'spin') rot = (t * 1.6 % 1) * TAU;
    ctx.save();
    ctx.translate(shakeX, dy + bob);
    if (a === 'spin') { ctx.translate(0, -230); ctx.rotate(rot); ctx.translate(0, 230); }
    const walking = a === 'walkin' && t < 0.9;
    // legs
    const sw = walking ? osc(t, 2.4) * 22 : 0;
    line(ctx, [[-20, -150], [-22 - sw, -6]]); line(ctx, [[20, -150], [22 + sw, -6]]);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-28 - sw, -4, 16, 8, 0, 0, TAU); ctx.ellipse(28 + sw, -4, 16, 8, 0, 0, TAU); ctx.fill();
    // arms (behind torso edge)
    const hands = armPose(a, t, s);
    const shoulder = [[-46, -300], [46, -300]];
    // body
    torso(ctx, look);
    for (let i = 0; i < 2; i++) {
      const [hx, hy] = hands[i], [sx, sy] = shoulder[i];
      const mx = (sx + hx) / 2 + (i ? 14 : -14), my = (sy + hy) / 2 + 10;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(mx, my, hx, hy); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx, hy, 10, 0, TAU); ctx.fill();
    }
    // held prop in the right hand
    if (s.hold && s.hold !== 'none') { ctx.save(); ctx.translate(hands[1][0], hands[1][1]); drawProp(ctx, s.hold, 0.6, s.holdText || '', t, true); ctx.restore(); }
    head(ctx, look, s);
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
    const col = look.shirtColor || '#2f63e0';
    const type = look.shirt || 'tee';
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
    } else { ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-28, -235, 9, 55, 0.1, 0, TAU); ctx.fill(); }
    ctx.restore(); ctx.restore();
  }

  function head(ctx, look, s) {
    const R = 74, cy = -405;
    const skin = look.skin || SKINS[0];
    const hair = look.hair || 'none', hc = look.hairColor || '#2b1d16';
    // long hair behind the head
    if (hair === 'long') { rr(ctx, -84, cy - 40, 168, 150, 40); fillStroke(ctx, hc); }
    ctx.beginPath(); ctx.arc(0, cy, R, 0, TAU); fillStroke(ctx, skin);
    ctx.save(); ctx.beginPath(); ctx.arc(0, cy, R, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.beginPath(); ctx.arc(28, cy + 14, R, 0, TAU); ctx.fill();
    ctx.restore();
    hairTop(ctx, hair, hc, cy, R);
    face(ctx, s, cy, look);
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

  function face(ctx, s, cy, look) {
    const e = s.expr || 'neutral', t = s.t || 0;
    const talkOpen = s.talking ? (0.5 + 0.5 * Math.abs(osc(t, 3.2))) : 0;
    const ey = cy + 2, ex = 26;
    ctx.save(); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineWidth = 6;
    const brow = (y, tiltL = 0, tiltR = 0) => { line(ctx, [[-ex - 18, y + tiltL], [-ex + 16, y - tiltL]], 7); line(ctx, [[ex - 16, y - tiltR], [ex + 18, y + tiltR]], 7); };
    const dots = (r = 8) => { ctx.beginPath(); ctx.arc(-ex, ey, r, 0, TAU); ctx.arc(ex, ey, r, 0, TAU); ctx.fill(); };
    const arcs = (up = true) => { ctx.beginPath(); ctx.arc(-ex, ey + (up ? 6 : -6), 11, up ? Math.PI * 1.1 : Math.PI * 0.1, up ? Math.PI * 1.9 : Math.PI * 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(ex, ey + (up ? 6 : -6), 11, up ? Math.PI * 1.1 : Math.PI * 0.1, up ? Math.PI * 1.9 : Math.PI * 0.9); ctx.stroke(); };
    const mouthO = (w, h) => { ctx.beginPath(); ctx.ellipse(4, cy + 40, w, h, 0, 0, TAU); ctx.fillStyle = '#5a1d1d'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff8fa0'; ctx.beginPath(); ctx.ellipse(4, cy + 40 + h * 0.45, w * 0.6, h * 0.35, 0, 0, TAU); ctx.fill(); ctx.fillStyle = INK; };
    if (e === 'happy') { brow(ey - 34); arcs(true); if (talkOpen) mouthO(14, 8 + talkOpen * 10); else { ctx.beginPath(); ctx.arc(4, cy + 30, 18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); } }
    else if (e === 'smug') {
      line(ctx, [[-ex - 20, ey - 26], [-ex + 16, ey - 30]], 7); line(ctx, [[ex - 16, ey - 30], [ex + 20, ey - 26]], 7);
      for (const x of [-ex, ex]) { line(ctx, [[x - 20, ey - 4], [x + 20, ey - 4]], 6); ctx.beginPath(); ctx.arc(x, ey - 4, 10, 0, Math.PI); ctx.fill(); }
      if (talkOpen) mouthO(12, 6 + talkOpen * 8); else { ctx.beginPath(); ctx.moveTo(-8, cy + 40); ctx.quadraticCurveTo(14, cy + 44, 30, cy + 26); ctx.stroke(); }
    }
    else if (e === 'shocked') { brow(ey - 40); ctx.lineWidth = 5; for (const x of [-ex, ex]) { ctx.beginPath(); ctx.arc(x, ey, 14, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, ey + 1, 6, 0, TAU); ctx.fill(); } mouthO(12, 18 + talkOpen * 4); }
    else if (e === 'laugh') { brow(ey - 34); line(ctx, [[-ex - 12, ey - 6], [-ex + 2, ey], [-ex - 12, ey + 6]], 6); line(ctx, [[ex + 12, ey - 6], [ex - 2, ey], [ex + 12, ey + 6]], 6); ctx.beginPath(); ctx.moveTo(-24, cy + 26); ctx.lineTo(32, cy + 26); ctx.quadraticCurveTo(4, cy + 74 + talkOpen * 6, -24, cy + 26); ctx.fillStyle = '#5a1d1d'; ctx.fill(); ctx.stroke(); }
    else if (e === 'sad') { line(ctx, [[-ex - 16, ey - 22], [-ex + 14, ey - 34]], 7); line(ctx, [[ex - 14, ey - 34], [ex + 16, ey - 22]], 7); dots(7); ctx.beginPath(); ctx.arc(4, cy + 52, 16, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); ctx.fillStyle = '#7cc6f2'; ctx.beginPath(); ctx.ellipse(-ex - 4, ey + 22 + (t * 30 % 26), 4, 7, 0, 0, TAU); ctx.fill(); }
    else if (e === 'angry') { line(ctx, [[-ex - 18, ey - 30], [-ex + 14, ey - 18]], 8); line(ctx, [[ex - 14, ey - 18], [ex + 18, ey - 30]], 8); dots(7); if (talkOpen) mouthO(14, 6 + talkOpen * 8); else { ctx.beginPath(); ctx.arc(4, cy + 50, 16, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); } }
    else if (e === 'confused') { line(ctx, [[-ex - 18, ey - 26], [-ex + 14, ey - 26]], 7); line(ctx, [[ex - 14, ey - 38], [ex + 18, ey - 30]], 7); dots(7); ctx.beginPath(); ctx.moveTo(-14, cy + 38); ctx.quadraticCurveTo(-4, cy + 30, 4, cy + 38); ctx.quadraticCurveTo(12, cy + 46, 22, cy + 36); ctx.stroke(); }
    else if (e === 'sleepy') { brow(ey - 30); arcs(false); ctx.beginPath(); ctx.ellipse(6, cy + 38, 7, 9, 0, 0, TAU); ctx.fillStyle = '#5a1d1d'; ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = '700 26px Fredoka, sans-serif'; ctx.fillText('z', 70, cy - 60 - (t * 20 % 30)); }
    else { brow(ey - 32); dots(8); if (talkOpen) mouthO(13, 6 + talkOpen * 9); else line(ctx, [[-10, cy + 38], [18, cy + 38]], 6); }
    if (look.glasses) { ctx.lineWidth = 5; ctx.strokeStyle = INK; for (const x of [-ex, ex]) { ctx.beginPath(); ctx.arc(x, ey, 20, 0, TAU); ctx.stroke(); } line(ctx, [[-ex + 20, ey], [ex - 20, ey]], 5); }
    if (look.blush) { ctx.fillStyle = 'rgba(255,120,140,.35)'; ctx.beginPath(); ctx.ellipse(-ex - 14, ey + 24, 12, 7, 0, 0, TAU); ctx.ellipse(ex + 14, ey + 24, 12, 7, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // ---------- props ----------
  const PROPS = { mug: '☕ Mug', phone: '📱 Phone', ticket: '🎟️ Ticket', sign: '🪧 Sign', bubble: '💬 Speech bubble', thought: '💭 Thought', money: '💵 Money', bag: '🛍️ Bag', laptop: '💻 Laptop', car: '🚗 Car', question: '❓ Question mark', exclaim: '❗ Shock lines', star: '⭐ Star', heart: '❤️ Heart', sun: '☀️ Sun', moon: '🌙 Moon' };
  function wrap(ctx, text, maxW) { const words = String(text).split(/\s+/); const lines = []; let cur = ''; for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; } if (cur) lines.push(cur); return lines; }
  function drawProp(ctx, type, sc, text, t, held) {
    ctx.save(); ctx.scale(sc, sc);
    const T = (str, size, col = INK, maxW = 200, y = 0) => { ctx.font = `700 ${size}px Fredoka, sans-serif`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const ls = wrap(ctx, str, maxW); ls.forEach((l, i) => ctx.fillText(l, 0, y + (i - (ls.length - 1) / 2) * size * 1.1)); };
    if (type === 'mug') { rr(ctx, -30, -40, 60, 70, 10); fillStroke(ctx, '#fff', 5); ctx.beginPath(); ctx.arc(36, -6, 16, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); }
    else if (type === 'phone') { rr(ctx, -28, -52, 56, 104, 12); fillStroke(ctx, '#1d2330', 5); rr(ctx, -21, -44, 42, 86, 7); ctx.fillStyle = '#7fd0ff'; ctx.fill(); }
    else if (type === 'ticket') { ctx.rotate(-0.06); rr(ctx, -130, -60, 260, 120, 8); fillStroke(ctx, '#fff3d6', 5); ctx.fillStyle = '#f2b230'; ctx.fillRect(-127, -57, 254, 24); T('VIP CONCERT', 18, INK, 240, -45); T(text || 'SEAT 12B', 30, INK, 170, 4); ctx.beginPath(); ctx.arc(90, 4, 26, 0, TAU); ctx.fillStyle = '#e8463a'; ctx.fill(); T('VIP', 18, '#fff', 60, 4); ctx.translate(90, 0); T('', 1); }
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
    else if (type === 'question' || type === 'exclaim') {
      if (type === 'question') { ctx.rotate(osc(t, 0.8) * 0.1); T('?', 140, '#2f63e0'); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText('?', 0, 0); }
      else for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.35; line(ctx, [[Math.cos(a) * 50, Math.sin(a) * 50], [Math.cos(a) * (90 + osc(t, 3) * 6), Math.sin(a) * (90 + osc(t, 3) * 6)]], 8); }
    }
    else if (type === 'star') { ctx.rotate(t * 0.6); ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 26 : 60, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); fillStroke(ctx, '#ffd23f', 5); }
    else if (type === 'heart') { ctx.scale(1 + osc(t, 1.2) * 0.06, 1 + osc(t, 1.2) * 0.06); ctx.beginPath(); ctx.moveTo(0, 40); ctx.bezierCurveTo(-80, -10, -40, -70, 0, -30); ctx.bezierCurveTo(40, -70, 80, -10, 0, 40); fillStroke(ctx, '#ff4f6d', 6); }
    else if (type === 'sun') { const col = text && /^#/.test(text) ? text : '#ffcc33'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + t * 0.3; line(ctx, [[Math.cos(a) * 70, Math.sin(a) * 70], [Math.cos(a) * 95, Math.sin(a) * 95]], 8, col); } ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); fillStroke(ctx, col, 6); }
    else if (type === 'moon') { ctx.beginPath(); ctx.arc(0, 0, 60, 0.3 * Math.PI, 1.7 * Math.PI); ctx.arc(24, -6, 50, 1.6 * Math.PI, 0.4 * Math.PI, true); ctx.closePath(); fillStroke(ctx, '#ffe9a8', 6); }
    ctx.restore();
  }

  // ---------- sets ----------
  const SETS = { meadow: '🌼 Meadow café', checkout: '🛒 Shop checkout', arena: '🎟️ VIP arena gate', street: '🏡 Street', dressing: '🪞 Dressing room', office: '💻 Giveaway office', bedroom: '🛏️ Bedroom', classroom: '🏫 Classroom', space: '🚀 Space', beach: '🏖️ Beach', night: '🌃 City at night', plain: '🎨 Plain colour' };
  const SIGN_SETS = { office: 'Screen text', classroom: 'Board text', checkout: 'Screen text', arena: 'Banner text', plain: 'Colour (e.g. #ffd23f)' };
  function sky(ctx, top, bot, h = SH) { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, h); }
  function cloud(ctx, x, y, s) { ctx.fillStyle = 'rgba(255,255,255,.92)'; for (const [dx, dy, r] of [[0, 0, 40], [40, -18, 46], [86, 0, 38], [44, 14, 40]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill(); } }
  function bigText(ctx, str, x, y, size, col, maxW, stroke) { ctx.font = `800 ${size}px Fredoka, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const ls = wrap(ctx, str, maxW); ls.forEach((l, i) => { const yy = y + (i - (ls.length - 1) / 2) * size * 1.05; if (stroke) { ctx.lineWidth = stroke; ctx.strokeStyle = INK; ctx.strokeText(l, x, yy); } ctx.fillStyle = col; ctx.fillText(l, x, yy); }); }
  function drawSet(ctx, set, t, sign) {
    ctx.save();
    if (set === 'meadow') {
      sky(ctx, '#86bff0', '#d9ecf7', 520); cloud(ctx, 40, 140, 1); cloud(ctx, 360, 100, .8);
      ctx.fillStyle = '#4aa646'; ctx.beginPath(); ctx.moveTo(0, 470); ctx.quadraticCurveTo(270, 360, 540, 450); ctx.lineTo(540, 960); ctx.lineTo(0, 960); ctx.fill();
      for (const [x, y] of [[70, 420], [140, 400]]) { ctx.fillStyle = '#3b8f3a'; ctx.beginPath(); ctx.arc(x, y, 34, 0, TAU); ctx.arc(x + 30, y - 10, 30, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#7fd35c'; ctx.fillRect(0, 560, 540, 400);
      for (let i = 0; i < 140; i++) { const x = (i * 97) % 540, y = 580 + ((i * 53) % 360); ctx.fillStyle = ['#e85b9a', '#f2c230', '#b98cff', '#ffffff', '#ff8a4f'][i % 5]; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
      // umbrella + table
      line(ctx, [[470, 330], [470, 900]], 10, '#1d2741');
      ctx.beginPath(); ctx.moveTo(250, 400); ctx.lineTo(470, 300); ctx.lineTo(600, 360); ctx.lineTo(540, 420); ctx.closePath(); ctx.fillStyle = '#ee8a3a'; ctx.fill();
      ctx.fillStyle = '#d6432f'; ctx.beginPath(); ctx.moveTo(320, 380); ctx.lineTo(470, 300); ctx.lineTo(420, 400); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(470, 700, 120, 30, 0, 0, TAU); ctx.fillStyle = '#f4f4f2'; ctx.fill(); line(ctx, [[470, 720], [470, 860]], 12, '#1d2741');
    } else if (set === 'checkout') {
      ctx.fillStyle = '#dfe9f3'; ctx.fillRect(0, 0, 540, 960); ctx.fillStyle = '#9fc9ef'; ctx.fillRect(40, 90, 460, 260); ctx.strokeStyle = '#2a3a63'; ctx.lineWidth = 10; ctx.strokeRect(40, 90, 460, 260); line(ctx, [[270, 90], [270, 350]], 8, '#2a3a63');
      cloud(ctx, 90, 200, .6);
      ctx.fillStyle = '#2a3a63'; ctx.fillRect(0, 640, 540, 320); ctx.fillStyle = '#e9eef4'; ctx.fillRect(0, 640, 540, 26);
      rr(ctx, 300, 430, 200, 150, 10); fillStroke(ctx, '#1f2a48', 6); rr(ctx, 316, 446, 168, 118, 6); ctx.fillStyle = '#7fd0ff'; ctx.fill(); bigText(ctx, sign || '£4.99', 400, 505, 34, '#0d2a4a', 150); line(ctx, [[400, 580], [400, 640]], 14, '#1f2a48');
    } else if (set === 'arena') {
      ctx.fillStyle = '#7fc0ef'; ctx.fillRect(0, 0, 540, 960); ctx.fillStyle = '#3f6fa8'; ctx.fillRect(0, 560, 540, 120);
      line(ctx, [[270, 200], [270, 680]], 6, '#2a4a7a'); for (const x of [210, 330]) line(ctx, [[x, 400], [x, 560]], 10, '#f2c230');
      for (const x of [60, 480]) { ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.arc(x, 470, 12, 0, TAU); ctx.fill(); }
      rr(ctx, -10, 80, 560, 100, 6); fillStroke(ctx, '#14215a', 8); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 6; ctx.strokeRect(6, 96, 528, 68); bigText(ctx, sign || 'ARENA GATE B · VIP ENTRY', 270, 131, 36, '#f2c230', 520);
      ctx.fillStyle = '#f4f1ec'; ctx.fillRect(0, 680, 540, 280);
      for (let i = 0; i < 260; i++) { ctx.fillStyle = ['#e85b9a', '#3a7be0', '#f2c230', '#5fbf4a', '#ff8a4f'][i % 5]; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse((i * 131) % 540, 690 + (i * 71) % 270, 5, 3, i, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    } else if (set === 'street') {
      sky(ctx, '#7fb6ea', '#cfe4f5', 560); cloud(ctx, 300, 120, .8);
      for (const [x, w, h, col, roof] of [[-20, 220, 200, '#f1efe8', '#3a4a7a'], [230, 330, 260, '#e9ece4', '#8a2b3a']]) { ctx.fillStyle = col; ctx.fillRect(x, 560 - h, w, h); ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 20, 560 - h); ctx.lineTo(x + w / 2, 560 - h - 80); ctx.lineTo(x + w + 20, 560 - h); ctx.fill(); ctx.fillStyle = '#4a78c8'; for (let k = 0; k < 2; k++) ctx.fillRect(x + 40 + k * (w / 2), 560 - h + 50, 40, 50); }
      for (const x of [60, 330]) { line(ctx, [[x, 560], [x, 460]], 14, '#6b4227'); ctx.fillStyle = '#5aa64a'; ctx.beginPath(); ctx.arc(x, 430, 60, 0, TAU); ctx.arc(x + 40, 450, 46, 0, TAU); ctx.arc(x - 40, 452, 44, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#7fbf5a'; ctx.fillRect(0, 560, 540, 40); ctx.fillStyle = '#6b7590'; ctx.fillRect(0, 600, 540, 360); ctx.fillStyle = '#f2c230'; for (let x = 10; x < 540; x += 90) ctx.fillRect(x, 770, 50, 8);
    } else if (set === 'dressing') {
      ctx.fillStyle = '#3a2f5a'; ctx.fillRect(0, 0, 540, 960); ctx.fillStyle = '#2a2147'; ctx.fillRect(0, 800, 540, 160);
      rr(ctx, 120, 110, 300, 680, 6); fillStroke(ctx, '#f2c230', 8); const g = ctx.createLinearGradient(0, 120, 0, 780); g.addColorStop(0, '#9fd0ff'); g.addColorStop(1, '#3a7be0'); rr(ctx, 136, 126, 268, 648, 4); ctx.fillStyle = g; ctx.fill();
      const l = ctx.createRadialGradient(270, 40, 10, 270, 40, 200); l.addColorStop(0, 'rgba(255,250,220,.7)'); l.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = l; ctx.fillRect(0, 0, 540, 300);
      rr(ctx, -20, 500, 110, 300, 10); fillStroke(ctx, '#5a6fb0', 6); rr(ctx, 440, 640, 120, 160, 10); fillStroke(ctx, '#e88a3a', 6);
    } else if (set === 'office') {
      ctx.fillStyle = '#f6c98a'; ctx.fillRect(0, 0, 540, 960); rr(ctx, -10, 30, 560, 90, 4); fillStroke(ctx, '#e3b04b', 6); bigText(ctx, 'GIVEAWAY CENTRAL', 270, 76, 40, '#7a5520', 520);
      ctx.fillStyle = '#7fd8e8'; ctx.fillRect(60, 170, 420, 300); ctx.fillStyle = '#4aa646'; ctx.beginPath(); ctx.arc(140, 470, 110, Math.PI, 0); ctx.arc(400, 470, 140, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.strokeRect(60, 170, 420, 300); line(ctx, [[270, 170], [270, 470]], 10, '#fff'); line(ctx, [[60, 320], [480, 320]], 10, '#fff');
      ctx.fillStyle = '#e9e6df'; ctx.fillRect(0, 640, 540, 320); rr(ctx, 260, 470, 250, 170, 10); fillStroke(ctx, '#1f2a48', 6); rr(ctx, 276, 486, 218, 138, 6); ctx.fillStyle = '#0f2a3a'; ctx.fill(); ctx.strokeStyle = '#5fe08a'; ctx.lineWidth = 4; ctx.strokeRect(282, 492, 206, 126); bigText(ctx, sign || 'GRAND PRIZE!', 385, 555, 28, '#5fe08a', 190);
    } else if (set === 'bedroom') {
      ctx.fillStyle = '#c9d8f0'; ctx.fillRect(0, 0, 540, 960); ctx.fillStyle = '#a98a6a'; ctx.fillRect(0, 740, 540, 220);
      sky(ctx, '#1b2a5a', '#3a4f8f', 0); ctx.fillStyle = '#20306a'; ctx.fillRect(300, 120, 200, 220); ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(440, 170, 24, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.strokeRect(300, 120, 200, 220);
      rr(ctx, 20, 600, 300, 170, 14); fillStroke(ctx, '#7aa0e0', 6); rr(ctx, 30, 570, 90, 50, 20); fillStroke(ctx, '#fff', 5);
    } else if (set === 'classroom') {
      ctx.fillStyle = '#f2e6c9'; ctx.fillRect(0, 0, 540, 960); rr(ctx, 40, 120, 460, 300, 8); fillStroke(ctx, '#2f5a3a', 10); bigText(ctx, sign || 'E = mc²', 270, 270, 46, '#f4f4ea', 420);
      ctx.fillStyle = '#b07a4a'; ctx.fillRect(0, 760, 540, 200); rr(ctx, 330, 620, 200, 30, 6); fillStroke(ctx, '#8a5a32', 6);
    } else if (set === 'space') {
      ctx.fillStyle = '#0b0f2a'; ctx.fillRect(0, 0, 540, 960); for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(osc(t + i, 0.3))})`; ctx.beginPath(); ctx.arc((i * 137) % 540, (i * 89) % 960, (i % 3) + 1, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(430, 180, 80, 0, TAU); fillStroke(ctx, '#e88a3a', 6); ctx.beginPath(); ctx.ellipse(430, 180, 130, 26, -0.3, 0, TAU); ctx.lineWidth = 8; ctx.strokeStyle = '#f2c230'; ctx.stroke();
      ctx.fillStyle = '#8a8fa8'; ctx.beginPath(); ctx.ellipse(270, 1060, 520, 260, 0, 0, TAU); ctx.fill();
    } else if (set === 'beach') {
      sky(ctx, '#5fc0f0', '#bfe8fa', 480); ctx.fillStyle = '#ffd34f'; ctx.beginPath(); ctx.arc(90, 120, 50, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2f9ad6'; ctx.fillRect(0, 480, 540, 140); ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let x = 0; x < 540; x += 60) ctx.fillRect(x + (t * 30 % 60), 520, 30, 5);
      ctx.fillStyle = '#f2d79a'; ctx.fillRect(0, 620, 540, 340);
    } else if (set === 'night') {
      sky(ctx, '#0f1438', '#3a2f6a', 960); ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(440, 120, 40, 0, TAU); ctx.fill();
      for (let i = 0; i < 7; i++) { const x = i * 80 - 10, h = 200 + (i * 73) % 200; ctx.fillStyle = '#1a1f45'; ctx.fillRect(x, 640 - h, 70, h); ctx.fillStyle = '#ffd96a'; for (let r = 0; r < h / 40 - 1; r++) for (let k = 0; k < 2; k++) if ((i + r + k) % 3) ctx.fillRect(x + 12 + k * 28, 660 - h + r * 40, 14, 18); }
      ctx.fillStyle = '#2a2f4a'; ctx.fillRect(0, 640, 540, 320);
    } else {
      ctx.fillStyle = /^#[0-9a-f]{3,8}$/i.test(sign || '') ? sign : '#ffd23f'; ctx.fillRect(0, 0, 540, 960);
    }
    ctx.restore();
  }

  // ---------- captions ----------
  function chunks(text, per) { const w = String(text || '').trim().split(/\s+/).filter(Boolean); const out = []; for (let i = 0; i < w.length; i += per) out.push(w.slice(i, i + per).join(' ')); return out; }
  function caption(ctx, text, t, dur, per, y = 690) {
    const cs = chunks(text, per || 2); if (!cs.length) return;
    const span = Math.max(0.3, (dur - 0.2) / cs.length); const i = Math.min(cs.length - 1, Math.floor(t / span)); const k = Math.min(1, (t - i * span) / 0.12);
    ctx.save(); ctx.translate(270, y); const s = 0.85 + 0.15 * k; ctx.scale(s, s);
    ctx.font = '800 64px Fredoka, sans-serif'; let size = 64; while (ctx.measureText(cs[i]).width > 500 && size > 30) { size -= 4; ctx.font = `800 ${size}px Fredoka, sans-serif`; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.22; ctx.strokeStyle = '#111'; ctx.strokeText(cs[i], 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(cs[i], 0, 0);
    ctx.restore();
  }
  function titleCard(ctx, text, t) {
    if (!text) return; const k = Math.min(1, t / 0.35);
    ctx.save(); ctx.translate(270, 210); ctx.rotate(-0.05); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); ctx.globalAlpha = k;
    ctx.font = '800 34px Fredoka, sans-serif'; const ls = wrap(ctx, text.toUpperCase(), 400); const h = 40 + ls.length * 38;
    rr(ctx, -225, -h / 2, 450, h, 22); ctx.fillStyle = '#121a33'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#3f7cf0'; ctx.stroke();
    ctx.fillStyle = '#3f7cf0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ls.forEach((l, i) => ctx.fillText(l, 0, (i - (ls.length - 1) / 2) * 38));
    ctx.restore();
  }

  window.WI = { SW, SH, HAIR, SHIRTS, EXPR, ANIM, SKINS, HAIRCOL, SHIRTCOL, PROPS, SETS, SIGN_SETS, person, drawProp, drawSet, caption, titleCard };
})();
