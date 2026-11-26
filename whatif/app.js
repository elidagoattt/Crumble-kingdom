// What If? Studio: the editor. Scenes, cast, drag and drop, play and export.
(function () {
  const { SW, SH } = WI;
  const $ = (s, r = document) => r.querySelector(s);
  const cv = $('#stage'), ctx = cv.getContext('2d');
  const RES = 2; cv.width = SW * RES; cv.height = SH * RES;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const KEY = 'whatif-studio-v1';

  // ---------- example project ----------
  function example() {
    const cast = [
      { id: 'prof', name: 'Prof', hair: 'none', hairColor: '#2b1d16', skin: '#f6f2ec', shirt: 'collar', shirtColor: '#2f63e0', glasses: true },
      { id: 'max', name: 'Max', hair: 'flop', hairColor: '#f0c24b', skin: '#f6f2ec', shirt: 'jacket', shirtColor: '#3fc1b0', glasses: false },
      { id: 'ruby', name: 'Ruby', hair: 'flop', hairColor: '#e07a3a', skin: '#f6f2ec', shirt: 'vest', shirtColor: '#f2c230', glasses: false },
      { id: 'jay', name: 'Jay', hair: 'curly', hairColor: '#6b4227', skin: '#f6f2ec', shirt: 'stripes', shirtColor: '#5fbf4a', glasses: false },
      { id: 'kai', name: 'Kai', hair: 'spiky', hairColor: '#121212', skin: '#f6f2ec', shirt: 'tee', shirtColor: '#f2c230', glasses: false },
    ];
    const A = (cast, x, y, s, o = {}) => ({ id: uid(), cast, x, y, s, flip: false, expr: 'neutral', anim: 'idle', talk: false, hold: 'none', holdText: '', ...o });
    const P = (type, x, y, s, text = '') => ({ id: uid(), type, x, y, s, text });
    return {
      title: 'What if the sun turned blue?', per: 2, voice: false, cast,
      scenes: [
        { id: uid(), set: 'meadow', dur: 4, cam: 'in', sign: '', title: 'What if the sun turned blue?', caption: 'What if tomorrow morning the sun turned blue?', actors: [A('prof', 200, 900, 0.85, { expr: 'happy', anim: 'talk', talk: true, hold: 'mug' })], props: [P('sun', 430, 170, 0.8, '#3fa0ff')] },
        { id: uid(), set: 'meadow', dur: 3.5, cam: 'punch', sign: '', title: '', caption: 'Everything would look like a freezing winter day', actors: [A('prof', 200, 900, 0.95, { expr: 'shocked', anim: 'shake' })], props: [P('sun', 430, 170, 0.8, '#3fa0ff'), P('exclaim', 200, 330, 0.9)] },
        { id: uid(), set: 'arena', dur: 4, cam: 'none', sign: '', title: '', caption: 'And forty people would still claim seat 12B', actors: [A('max', 140, 900, 0.75, { expr: 'smug', hold: 'ticket', holdText: 'SEAT 12B' }), A('jay', 300, 920, 0.75, { expr: 'smug', hold: 'ticket', holdText: 'SEAT 12B' }), A('kai', 450, 900, 0.75, { expr: 'confused', flip: true })], props: [] },
        { id: uid(), set: 'checkout', dur: 3.5, cam: 'in', sign: '£4.99', title: '', caption: 'But the register would still know what you bagged', actors: [A('ruby', 190, 920, 0.95, { expr: 'smug', anim: 'point' })], props: [P('bag', 120, 780, 0.8)] },
      ],
    };
  }

  // ---------- state ----------
  let S; try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { S = null; }
  if (!S || !S.scenes || !S.scenes.length) S = example();
  let cur = 0, sel = null, tab = 'scene', playing = false, playT = 0, editT = 0, recorder = null, lastSpoken = -1;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const scene = () => S.scenes[cur];
  const castOf = (id) => S.cast.find((c) => c.id === id) || S.cast[0];
  const total = () => S.scenes.reduce((a, s) => a + s.dur, 0);
  const BACK = new Set(['car', 'sun', 'moon']);

  // ---------- drawing a scene ----------
  function drawScene(sc, t, editor) {
    ctx.save(); ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.clearRect(0, 0, SW, SH);
    let z = 1;
    if (sc.cam === 'in') z = 1 + 0.08 * Math.min(1, t / sc.dur);
    if (sc.cam === 'punch') z = 1 + 0.14 * Math.exp(-t * 4) + 0.03;
    if (sc.cam === 'out') z = 1.1 - 0.1 * Math.min(1, t / sc.dur);
    if (sc.cam === 'shake') ctx.translate(Math.sin(t * 40) * 4, Math.cos(t * 33) * 4);
    ctx.translate(SW / 2, SH / 2); ctx.scale(z, z); ctx.translate(-SW / 2, -SH / 2);
    WI.drawSet(ctx, sc.set, t, sc.sign);
    const drawP = (p) => { ctx.save(); ctx.translate(p.x, p.y); WI.drawProp(ctx, p.type, p.s, p.text, t); ctx.restore(); if (editor && sel && sel.id === p.id) outline(p); };
    sc.props.filter((p) => BACK.has(p.type)).forEach(drawP);
    const actors = [...sc.actors].sort((a, b) => a.y - b.y);
    for (const a of actors) {
      let x = a.x; const anim = a.anim;
      if (anim === 'walkin' && t < 0.9) x = a.x + (a.flip ? 1 : -1) * (1 - t / 0.9) * 420;
      ctx.save(); ctx.translate(x, a.y); ctx.scale(a.s * (a.flip ? -1 : 1), a.s);
      WI.person(ctx, castOf(a.cast), { expr: a.expr, anim, t, talking: a.talk || anim === 'talk', hold: a.hold, holdText: a.holdText });
      ctx.restore();
      if (editor && sel && sel.id === a.id) outline(a, true);
    }
    sc.props.filter((p) => !BACK.has(p.type)).forEach(drawP);
    ctx.restore();
    ctx.save(); ctx.setTransform(RES, 0, 0, RES, 0, 0);
    WI.titleCard(ctx, sc.title, t);
    WI.caption(ctx, sc.caption, t, sc.dur, S.per);
    ctx.restore();
  }
  function box(o, isActor) { return isActor ? { x: o.x - 90 * o.s, y: o.y - 560 * o.s, w: 180 * o.s, h: 570 * o.s } : (() => { const r = (o.type === 'car' ? 220 : o.type === 'ticket' || o.type === 'sign' || o.type === 'bubble' || o.type === 'thought' ? 150 : 80) * o.s; const up = o.type === 'bubble' || o.type === 'thought' ? 1.6 : 1; return { x: o.x - r, y: o.y - r * up, w: 2 * r, h: r * (1 + up) }; })(); }
  function outline(o, isActor) { const b = box(o, isActor); ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = '#ff3d81'; ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.restore(); }

  // ---------- main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (playing) {
      playT += dt;
      let acc = 0, idx = 0;
      for (; idx < S.scenes.length; idx++) { if (playT < acc + S.scenes[idx].dur) break; acc += S.scenes[idx].dur; }
      if (idx >= S.scenes.length) { stopPlay(); } else {
        if (idx !== lastSpoken) { lastSpoken = idx; speak(S.scenes[idx].caption); }
        drawScene(S.scenes[idx], playT - acc, false);
        $('#prog').style.width = (playT / total() * 100) + '%';
      }
    }
    if (!playing) { editT = (editT + dt) % Math.max(0.5, scene().dur); drawScene(scene(), editT, true); }
    requestAnimationFrame(frame);
  }

  function speak(text) {
    if (!S.voice || recorder || !('speechSynthesis' in window) || !text) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {}
  }
  function startPlay() { sel = null; playing = true; playT = 0; lastSpoken = -1; document.body.classList.add('playing'); $('#play').textContent = '■ Stop'; }
  function stopPlay() {
    playing = false; document.body.classList.remove('playing'); $('#play').textContent = '▶ Play'; $('#prog').style.width = '0';
    try { speechSynthesis.cancel(); } catch (e) {}
    if (recorder && recorder.state === 'recording') recorder.stop();
  }

  // ---------- export a video ----------
  function exportVideo() {
    if (!window.MediaRecorder || !cv.captureStream) { toast('Your browser can’t record video. Try Chrome or Safari.'); return; }
    const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const mime = types.find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const chunksArr = [];
    recorder = new MediaRecorder(cv.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 6e6 } : undefined);
    recorder.ondataavailable = (e) => e.data.size && chunksArr.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksArr, { type: recorder.mimeType || 'video/webm' });
      const ext = (recorder.mimeType || '').includes('mp4') ? 'mp4' : 'webm';
      const url = URL.createObjectURL(blob);
      const a = $('#dl'); a.href = url; a.download = (S.title || 'what-if').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.' + ext;
      $('#dlwrap').hidden = false; recorder = null; toast('Video ready! Tap Save video.');
    };
    $('#dlwrap').hidden = true; recorder.start(); startPlay(); toast('Recording… let it play to the end');
  }

  // ---------- dragging on the stage ----------
  function stagePoint(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * SW, y: (e.clientY - r.top) / r.height * SH }; }
  function hit(p) {
    const sc = scene();
    const front = sc.props.filter((o) => !BACK.has(o.type)).reverse();
    for (const o of front) { const b = box(o); if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { o, kind: 'prop' }; }
    const actors = [...sc.actors].sort((a, b) => b.y - a.y);
    for (const o of actors) { const b = box(o, true); if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { o, kind: 'actor' }; }
    for (const o of sc.props.filter((o) => BACK.has(o.type)).reverse()) { const b = box(o); if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { o, kind: 'prop' }; }
    return null;
  }
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    if (playing) return;
    const p = stagePoint(e), h = hit(p);
    if (!h) { sel = null; renderPanel(); return; }
    sel = h.o; sel.kind = undefined; drag = { o: h.o, dx: p.x - h.o.x, dy: p.y - h.o.y };
    cv.setPointerCapture(e.pointerId); tab = 'selected'; renderPanel();
  });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const p = stagePoint(e); drag.o.x = Math.round(Math.max(0, Math.min(SW, p.x - drag.dx))); drag.o.y = Math.round(Math.max(60, Math.min(SH + 80, p.y - drag.dy))); });
  cv.addEventListener('pointerup', () => { if (drag) save(); drag = null; });

  // ---------- panels ----------
  const opts = (obj, val) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${v}</option>`).join('');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const swatches = (list, val, field) => `<div class="sw">${list.map((c) => `<button type="button" data-sw="${field}" data-v="${c}" style="background:${c}" class="${c === val ? 'on' : ''}" aria-label="${c}"></button>`).join('')}</div>`;
  function isActor(o) { return !!(o && o.cast); }

  function renderStrip() {
    $('#strip').innerHTML = S.scenes.map((s, i) => `<button type="button" class="chip ${i === cur ? 'on' : ''}" data-scene="${i}"><b>${i + 1}</b>${esc(WI.SETS[s.set].split(' ').slice(1).join(' '))}<small>${s.dur}s</small></button>`).join('') + `<button type="button" class="chip add" data-act="newscene">+ Scene</button>`;
  }

  function renderPanel() {
    renderStrip();
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const sc = scene(); const P = $('#panel');
    if (tab === 'scene') {
      P.innerHTML = `
        <label>Set<select data-f="set">${opts(WI.SETS, sc.set)}</select></label>
        ${WI.SIGN_SETS[sc.set] ? `<label>${WI.SIGN_SETS[sc.set]}<input data-f="sign" value="${esc(sc.sign)}" maxlength="40"></label>` : ''}
        <label>Length: <b>${sc.dur}s</b><input type="range" min="1.5" max="10" step="0.5" value="${sc.dur}" data-f="dur" data-num></label>
        <label>Camera<select data-f="cam">${opts({ none: 'Still', in: 'Slow zoom in', out: 'Slow zoom out', punch: 'Punch zoom', shake: 'Shaky' }, sc.cam)}</select></label>
        <div class="row"><button type="button" data-act="dupscene">Duplicate scene</button><button type="button" data-act="left">◀ Move</button><button type="button" data-act="right">Move ▶</button><button type="button" class="danger" data-act="delscene">Delete scene</button></div>`;
    } else if (tab === 'words') {
      P.innerHTML = `
        <label>Caption (plays word by word)<textarea data-f="caption" rows="3" maxlength="200">${esc(sc.caption)}</textarea></label>
        <label>Title box (big question at the top, optional)<input data-f="title" value="${esc(sc.title)}" maxlength="80"></label>
        <label>Words at a time<select data-g="per">${opts({ 1: '1 word', 2: '2 words', 3: '3 words', 4: '4 words' }, String(S.per))}</select></label>
        <label class="tick"><input type="checkbox" data-g="voice" ${S.voice ? 'checked' : ''}> Read captions out loud when playing</label>
        <label>Video name<input data-g="title" value="${esc(S.title)}" maxlength="60"></label>`;
    } else if (tab === 'add') {
      P.innerHTML = `<h3>Characters</h3><div class="grid">${S.cast.map((c) => `<button type="button" class="tile" data-addcast="${c.id}"><canvas data-face="${c.id}" width="120" height="150"></canvas>${esc(c.name)}</button>`).join('')}<button type="button" class="tile new" data-act="newcast">＋<br>New character</button></div>
        <h3>Props</h3><div class="grid">${Object.entries(WI.PROPS).map(([k, v]) => `<button type="button" class="tile prop" data-addprop="${k}">${v}</button>`).join('')}</div>`;
      drawFaces();
    } else if (tab === 'selected') {
      if (!sel) { P.innerHTML = `<p class="hint">Tap a character or prop on the stage to edit it. Drag to move it.</p>`; return; }
      if (isActor(sel)) {
        const c = castOf(sel.cast);
        P.innerHTML = `<h3>${esc(c.name)}</h3>
          <div class="chips">${Object.entries(WI.EXPR).map(([k, v]) => `<button type="button" class="${sel.expr === k ? 'on' : ''}" data-set="expr" data-v="${k}">${v}</button>`).join('')}</div>
          <h3>Animation</h3><div class="chips">${Object.entries(WI.ANIM).map(([k, v]) => `<button type="button" class="${sel.anim === k ? 'on' : ''}" data-set="anim" data-v="${k}">${v}</button>`).join('')}</div>
          <label class="tick"><input type="checkbox" data-s="talk" ${sel.talk ? 'checked' : ''}> Mouth moves (talking)</label>
          <label>Holding<select data-s="hold">${opts({ none: 'Nothing', mug: '☕ Mug', phone: '📱 Phone', ticket: '🎟️ Ticket', sign: '🪧 Sign', money: '💵 Money', bag: '🛍️ Bag', laptop: '💻 Laptop', heart: '❤️ Heart', star: '⭐ Star' }, sel.hold)}</select></label>
          ${['ticket', 'sign', 'laptop'].includes(sel.hold) ? `<label>Text on it<input data-s="holdText" value="${esc(sel.holdText)}" maxlength="40"></label>` : ''}
          <label>Size<input type="range" min="0.35" max="1.5" step="0.05" value="${sel.s}" data-s="s" data-num></label>
          <div class="row"><button type="button" data-act="flip">↔ Flip</button><button type="button" data-act="front">Bring forward</button><button type="button" data-act="editcast">✏️ Edit look</button><button type="button" class="danger" data-act="delsel">Delete</button></div>`;
      } else {
        P.innerHTML = `<h3>${WI.PROPS[sel.type]}</h3>
          ${['sign', 'bubble', 'thought', 'ticket', 'laptop'].includes(sel.type) ? `<label>Text<input data-s="text" value="${esc(sel.text)}" maxlength="80"></label>` : ''}
          ${['car', 'sun'].includes(sel.type) ? `<label>Colour</label>${swatches(['#56c977', '#e85b3a', '#3f7cf0', '#ffcc33', '#3fa0ff', '#2a3348', '#f07fb0'], sel.text, 'proptext')}` : ''}
          <label>Size<input type="range" min="0.3" max="2" step="0.05" value="${sel.s}" data-s="s" data-num></label>
          <div class="row"><button type="button" data-act="delsel" class="danger">Delete</button></div>`;
      }
    } else if (tab === 'cast') {
      const c = S.cast.find((x) => x.id === editingCast) || S.cast[0]; editingCast = c.id;
      P.innerHTML = `<div class="castpick">${S.cast.map((x) => `<button type="button" class="${x.id === c.id ? 'on' : ''}" data-pickcast="${x.id}">${esc(x.name)}</button>`).join('')}<button type="button" data-act="newcast">＋ New</button></div>
        <div class="castedit"><canvas id="castview" width="240" height="320"></canvas><div>
        <label>Name<input data-c="name" value="${esc(c.name)}" maxlength="16"></label>
        <label>Hair<select data-c="hair">${opts(WI.HAIR, c.hair)}</select></label>
        <label>Hair colour</label>${swatches(WI.HAIRCOL, c.hairColor, 'hairColor')}
        <label>Skin</label>${swatches(WI.SKINS, c.skin, 'skin')}
        <label>Outfit<select data-c="shirt">${opts(WI.SHIRTS, c.shirt)}</select></label>
        <label>Outfit colour</label>${swatches(WI.SHIRTCOL, c.shirtColor, 'shirtColor')}
        <label class="tick"><input type="checkbox" data-c="glasses" ${c.glasses ? 'checked' : ''}> Glasses</label>
        <label class="tick"><input type="checkbox" data-c="blush" ${c.blush ? 'checked' : ''}> Rosy cheeks</label>
        ${S.cast.length > 1 ? `<button type="button" class="danger" data-act="delcast">Delete character</button>` : ''}
        </div></div>`;
      drawCastView();
    }
  }
  let editingCast = null;
  function drawCastView() { const c = $('#castview'); if (!c) return; const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.save(); g.translate(120, 312); g.scale(0.55, 0.55); WI.person(g, S.cast.find((x) => x.id === editingCast), { expr: 'happy', t: 0 }); g.restore(); }
  function drawFaces() { document.querySelectorAll('[data-face]').forEach((cn) => { const g = cn.getContext('2d'); g.save(); g.translate(60, 300); g.scale(0.62, 0.62); WI.person(g, castOf(cn.dataset.face), { expr: 'smug', t: 0 }); g.restore(); }); }

  // ---------- panel events ----------
  $('#panel').addEventListener('input', (e) => {
    const el = e.target, sc = scene(); const val = el.type === 'checkbox' ? el.checked : (el.dataset.num !== undefined ? parseFloat(el.value) : el.value);
    if (el.dataset.f) { sc[el.dataset.f] = val; if (el.dataset.f === 'dur') { el.previousElementSibling && (el.parentElement.querySelector('b').textContent = val + 's'); renderStrip(); } if (el.dataset.f === 'set') renderPanel(); }
    if (el.dataset.g) { S[el.dataset.g] = el.dataset.g === 'per' ? parseInt(val, 10) : val; }
    if (el.dataset.s && sel) { sel[el.dataset.s] = val; if (el.dataset.s === 'hold') renderPanel(); }
    if (el.dataset.c) { const c = S.cast.find((x) => x.id === editingCast); c[el.dataset.c] = val; drawCastView(); if (el.dataset.c === 'name') {} }
    save();
  });
  $('#panel').addEventListener('change', (e) => { if (e.target.dataset.c === 'name') renderPanel(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const sc = scene();
    if (b.dataset.tab) { tab = b.dataset.tab; renderPanel(); return; }
    if (b.dataset.scene !== undefined) { cur = +b.dataset.scene; sel = null; editT = 0; renderPanel(); return; }
    if (b.dataset.set && sel) { sel[b.dataset.set] = b.dataset.v; if (b.dataset.set === 'anim') editT = 0; save(); renderPanel(); return; }
    if (b.dataset.sw) {
      if (b.dataset.sw === 'proptext' && sel) sel.text = b.dataset.v; else { const c = S.cast.find((x) => x.id === editingCast); c[b.dataset.sw] = b.dataset.v; }
      save(); renderPanel(); return;
    }
    if (b.dataset.addcast) { const a = { id: uid(), cast: b.dataset.addcast, x: 120 + Math.round(Math.random() * 300), y: 900, s: 0.8, flip: false, expr: 'neutral', anim: 'idle', talk: false, hold: 'none', holdText: '' }; sc.actors.push(a); sel = a; tab = 'selected'; save(); renderPanel(); return; }
    if (b.dataset.addprop) { const t = b.dataset.addprop; const p = { id: uid(), type: t, x: 270, y: t === 'car' ? 880 : t === 'sun' || t === 'moon' ? 170 : 520, s: t === 'car' ? 1 : 0.8, text: t === 'bubble' ? 'Wait, what?!' : t === 'sign' ? 'WHAT IF?' : t === 'thought' ? 'Hmm…' : t === 'ticket' ? 'SEAT 12B' : '' }; sc.props.push(p); sel = p; tab = 'selected'; save(); renderPanel(); return; }
    if (b.dataset.pickcast) { editingCast = b.dataset.pickcast; renderPanel(); return; }
    const act = b.dataset.act; if (!act) return;
    if (act === 'newscene') { const s = { id: uid(), set: sc.set, dur: 3.5, cam: 'none', sign: '', title: '', caption: 'And then…', actors: [], props: [] }; S.scenes.splice(cur + 1, 0, s); cur++; sel = null; tab = 'scene'; }
    if (act === 'dupscene') { const s = JSON.parse(JSON.stringify(sc)); s.id = uid(); s.actors.forEach((a) => a.id = uid()); s.props.forEach((p) => p.id = uid()); S.scenes.splice(cur + 1, 0, s); cur++; }
    if (act === 'delscene' && S.scenes.length > 1) { S.scenes.splice(cur, 1); cur = Math.max(0, cur - 1); sel = null; }
    if (act === 'left' && cur > 0) { [S.scenes[cur - 1], S.scenes[cur]] = [S.scenes[cur], S.scenes[cur - 1]]; cur--; }
    if (act === 'right' && cur < S.scenes.length - 1) { [S.scenes[cur + 1], S.scenes[cur]] = [S.scenes[cur], S.scenes[cur + 1]]; cur++; }
    if (act === 'flip' && sel) sel.flip = !sel.flip;
    if (act === 'front' && sel) { sel.y += 6; }
    if (act === 'delsel' && sel) { sc.actors = sc.actors.filter((x) => x !== sel); sc.props = sc.props.filter((x) => x !== sel); sel = null; }
    if (act === 'editcast' && sel) { editingCast = sel.cast; tab = 'cast'; }
    if (act === 'newcast') { const c = { id: uid(), name: 'New ' + (S.cast.length + 1), hair: 'flop', hairColor: WI.HAIRCOL[S.cast.length % WI.HAIRCOL.length], skin: WI.SKINS[0], shirt: 'tee', shirtColor: WI.SHIRTCOL[S.cast.length % WI.SHIRTCOL.length], glasses: false }; S.cast.push(c); editingCast = c.id; tab = 'cast'; }
    if (act === 'delcast' && S.cast.length > 1) { const id = editingCast; S.cast = S.cast.filter((x) => x.id !== id); S.scenes.forEach((s) => s.actors = s.actors.filter((a) => a.cast !== id)); editingCast = S.cast[0].id; sel = null; }
    save(); renderPanel();
  });
  $('#play').onclick = () => playing ? stopPlay() : startPlay();
  $('#rec').onclick = () => { if (!playing) exportVideo(); };
  $('#new').onclick = () => { $('#menu').hidden = !$('#menu').hidden; };
  $('#menu').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; $('#menu').hidden = true;
    if (b.dataset.m === 'blank') { const keepCast = S.cast; S = { title: 'My What If', per: 2, voice: S.voice, cast: keepCast, scenes: [{ id: uid(), set: 'meadow', dur: 4, cam: 'in', sign: '', title: 'What if…?', caption: 'What if…', actors: [], props: [] }] }; }
    if (b.dataset.m === 'example') S = example();
    cur = 0; sel = null; tab = 'scene'; save(); renderPanel();
  });
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3200); }

  (document.fonts ? document.fonts.load('800 40px Fredoka') : Promise.resolve()).finally(() => { renderPanel(); requestAnimationFrame(frame); });
})();
