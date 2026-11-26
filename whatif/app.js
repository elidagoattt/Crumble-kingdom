// What If? Studio: the editor. Scenes, cast, drag and drop, keyboard, sound, play, export and the tutorial.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const cv = $('#stage'), ctx = cv.getContext('2d');
  const RES = 2;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const KEY = 'whatif-studio-v2', TUT_KEY = 'whatif-tutorial-done';
  const FORMATS = { portrait: [540, 960], landscape: [960, 540] };
  let W = 540, H = 960;

  // ---------- starting cast (people and animals) ----------
  function defaultCast() {
    return [
      { id: 'prof', name: 'Prof', species: 'person', hair: 'none', hairColor: '#2b1d16', skin: '#f6f2ec', shirt: 'collar', shirtColor: '#2f63e0', glasses: true },
      { id: 'max', name: 'Max', species: 'person', hair: 'flop', hairColor: '#f0c24b', skin: '#f6f2ec', shirt: 'jacket', shirtColor: '#3fc1b0' },
      { id: 'ruby', name: 'Ruby', species: 'person', hair: 'flop', hairColor: '#e07a3a', skin: '#f6f2ec', shirt: 'vest', shirtColor: '#f2c230' },
      { id: 'jay', name: 'Jay', species: 'person', hair: 'curly', hairColor: '#6b4227', skin: '#f6f2ec', shirt: 'stripes', shirtColor: '#5fbf4a' },
      { id: 'kai', name: 'Kai', species: 'person', hair: 'spiky', hairColor: '#121212', skin: '#f6f2ec', shirt: 'tee', shirtColor: '#f2c230' },
      { id: 'ginger', name: 'Ginger', species: 'cat', fur: '#f2a65a', shirt: 'none', shirtColor: '#2f63e0' },
      { id: 'patch', name: 'Patch', species: 'cat', fur: '#f4f1ec', patch: true, shirt: 'none', shirtColor: '#2f63e0' },
      { id: 'biscuit', name: 'Biscuit', species: 'dog', fur: '#c08a55', shirt: 'hoodie', shirtColor: '#e85b3a' },
      { id: 'bun', name: 'Bun', species: 'bunny', fur: '#f4f1ec', shirt: 'none', shirtColor: '#f07fb0' },
    ];
  }
  const A = (cast, x, y, s, o = {}) => ({ id: uid(), cast, x, y, s, flip: false, expr: 'neutral', anim: 'idle', talk: false, wobble: false, hold: 'none', holdText: '', ...o });
  const P = (type, x, y, s, text = '') => ({ id: uid(), type, x, y, s, text });
  function starter() {
    return { title: 'My What If', format: 'portrait', per: 2, voice: false, cast: defaultCast(), scenes: [
      { id: uid(), set: 'meadow', dur: 4, cam: 'in', sign: '', title: 'What if cats could talk?', caption: 'What if cats could talk?', actors: [A('prof', 150, 900, 0.75, { expr: 'happy', anim: 'talk', talk: true, hold: 'mug' }), A('ginger', 380, 900, 0.65, { expr: 'smug', wobble: true, flip: true })], props: [] },
    ] };
  }
  function example() {
    return { title: 'What if the sun turned blue?', format: 'portrait', per: 2, voice: false, cast: defaultCast(), scenes: [
      { id: uid(), set: 'meadow', dur: 4, cam: 'in', sign: '', title: 'What if the sun turned blue?', caption: 'What if tomorrow morning the sun turned blue?', actors: [A('prof', 200, 900, 0.85, { expr: 'happy', anim: 'talk', talk: true, hold: 'mug' })], props: [P('sun', 430, 170, 0.8, '#3fa0ff')] },
      { id: uid(), set: 'meadow', dur: 3.5, cam: 'punch', sign: '', title: '', caption: 'Everything would look like a freezing winter day', actors: [A('prof', 200, 900, 0.95, { expr: 'shocked', anim: 'shake' })], props: [P('sun', 430, 170, 0.8, '#3fa0ff'), P('exclaim', 200, 330, 0.9)] },
      { id: uid(), set: 'arena', dur: 4, cam: 'none', sign: '', title: '', caption: 'And forty people would still claim seat 12B', actors: [A('max', 140, 900, 0.75, { expr: 'smug', hold: 'ticket', holdText: 'SEAT 12B' }), A('jay', 300, 920, 0.75, { expr: 'smug', hold: 'ticket', holdText: 'SEAT 12B' }), A('kai', 450, 900, 0.75, { expr: 'confused', flip: true })], props: [] },
      { id: uid(), set: 'street', dur: 3.5, cam: 'in', sign: '', title: '', caption: 'Even the cat would be confused', actors: [A('patch', 200, 920, 0.8, { expr: 'confused', wobble: true }), A('biscuit', 400, 920, 0.7, { expr: 'shocked', anim: 'jump', flip: true })], props: [P('question', 200, 300, 0.8)] },
    ] };
  }

  // ---------- state ----------
  let S; try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { S = null; }
  if (!S || !S.scenes || !S.scenes.length) S = starter();
  if (!S.format) S.format = 'portrait';
  S.cast.forEach((c) => { if (!c.species) c.species = 'person'; });
  let cur = 0, sel = null, tab = 'scene', playing = false, playT = 0, editT = 0, recorder = null, lastScene = -1, lastWord = -1, editingCast = null;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const scene = () => S.scenes[cur];
  const castOf = (id) => S.cast.find((c) => c.id === id) || S.cast[0];
  const total = () => S.scenes.reduce((a, s) => a + s.dur, 0);
  const BACK = new Set(['car', 'sun', 'moon']);
  const sfx = (n) => window.Sound && Sound.sfx(n);

  function applyFormat() {
    [W, H] = FORMATS[S.format] || FORMATS.portrait;
    cv.width = W * RES; cv.height = H * RES;
    document.body.classList.toggle('land', S.format === 'landscape');
  }
  function setFormat(f) {
    if (f === S.format) return;
    const [w0, h0] = FORMATS[S.format], [w1, h1] = FORMATS[f];
    const k = Math.pow(h1 / h0, 0.6);
    for (const sc of S.scenes) for (const o of [...sc.actors, ...sc.props]) { o.x = Math.round(o.x * w1 / w0); o.y = Math.round(o.y * h1 / h0); o.s = Math.round(o.s * k * 100) / 100; }
    S.format = f; applyFormat(); save();
  }

  // ---------- drawing a scene ----------
  function drawScene(sc, t, editor) {
    ctx.save(); ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.clearRect(0, 0, W, H);
    let z = 1;
    if (sc.cam === 'in') z = 1 + 0.08 * Math.min(1, t / sc.dur);
    if (sc.cam === 'punch') z = 1 + 0.14 * Math.exp(-t * 4) + 0.03;
    if (sc.cam === 'out') z = 1.1 - 0.1 * Math.min(1, t / sc.dur);
    if (sc.cam === 'shake') ctx.translate(Math.sin(t * 40) * 4, Math.cos(t * 33) * 4);
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    WI.drawSet(ctx, sc.set, t, sc.sign, W, H);
    const drawP = (p) => { ctx.save(); ctx.translate(p.x, p.y); WI.drawProp(ctx, p.type, p.s, p.text, t); ctx.restore(); if (editor && sel && sel.id === p.id) outline(p); };
    sc.props.filter((p) => BACK.has(p.type)).forEach(drawP);
    for (const a of [...sc.actors].sort((a, b) => a.y - b.y)) {
      let x = a.x;
      if (a.anim === 'walkin' && t < 0.9) x = a.x + (a.flip ? 1 : -1) * (1 - t / 0.9) * 420;
      ctx.save(); ctx.translate(x, a.y); ctx.scale(a.s * (a.flip ? -1 : 1), a.s);
      WI.person(ctx, castOf(a.cast), { expr: a.expr, anim: a.anim, t, talking: a.talk || a.anim === 'talk', hold: a.hold, holdText: a.holdText, wobble: a.wobble });
      ctx.restore();
      if (editor && sel && sel.id === a.id) outline(a, true);
    }
    sc.props.filter((p) => !BACK.has(p.type)).forEach(drawP);
    ctx.restore();
    ctx.save(); ctx.setTransform(RES, 0, 0, RES, 0, 0);
    WI.titleCard(ctx, sc.title, t, W, H);
    WI.caption(ctx, sc.caption, t, sc.dur, S.per, W, H);
    ctx.restore();
  }
  function box(o, isActor) {
    if (isActor) return { x: o.x - 90 * o.s, y: o.y - 560 * o.s, w: 180 * o.s, h: 570 * o.s };
    const r = (o.type === 'car' ? 220 : ['ticket', 'sign', 'bubble', 'thought'].includes(o.type) ? 150 : 80) * o.s; const up = o.type === 'bubble' || o.type === 'thought' ? 1.6 : 1;
    return { x: o.x - r, y: o.y - r * up, w: 2 * r, h: r * (1 + up) };
  }
  function outline(o, isActor) { const b = box(o, isActor); ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = '#ff3d81'; ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.restore(); }

  // ---------- main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (playing) {
      playT += dt;
      let acc = 0, idx = 0;
      for (; idx < S.scenes.length; idx++) { if (playT < acc + S.scenes[idx].dur) break; acc += S.scenes[idx].dur; }
      if (idx >= S.scenes.length) stopPlay(true);
      else {
        const sc = S.scenes[idx], lt = playT - acc;
        if (idx !== lastScene) { if (lastScene >= 0) sfx('whoosh'); if (sc.title) setTimeout(() => sfx('ding'), 120); lastScene = idx; lastWord = -1; speak(sc.caption); }
        const wi = WI.captionIndex(sc.caption, lt, sc.dur, S.per); if (wi !== lastWord && wi >= 0) { lastWord = wi; if (S.popWords !== false) sfx('tick'); }
        drawScene(sc, lt, false);
        $('#prog').style.width = (playT / total() * 100) + '%';
      }
    }
    if (!playing) { editT = (editT + dt) % Math.max(0.5, scene().dur); drawScene(scene(), editT, true); }
    requestAnimationFrame(frame);
  }
  function speak(text) {
    if (!S.voice || !('speechSynthesis' in window) || !text) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; speechSynthesis.speak(u); } catch (e) {}
  }
  function startPlay() { sel = null; playing = true; playT = 0; lastScene = -1; document.body.classList.add('playing'); $('#play').textContent = '■ Stop'; }
  function stopPlay(finished) {
    playing = false; document.body.classList.remove('playing'); $('#play').textContent = '▶ Play'; $('#prog').style.width = '0';
    try { speechSynthesis.cancel(); } catch (e) {}
    if (recorder && recorder.state === 'recording') recorder.stop();
    if (finished) sfx('done');
  }

  // ---------- export a video (with the music and sound effects) ----------
  function exportVideo() {
    if (!window.MediaRecorder || !cv.captureStream) { toast('Your browser can’t record video. Try Chrome or Safari.'); return; }
    const types = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
    const mime = types.find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const stream = cv.captureStream(30);
    const audio = window.Sound && Sound.stream(); if (audio) audio.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    const parts = [];
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 6e6 } : undefined);
    recorder.ondataavailable = (e) => e.data.size && parts.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(parts, { type: recorder.mimeType || 'video/webm' });
      const ext = (recorder.mimeType || '').includes('mp4') ? 'mp4' : 'webm';
      const a = $('#dl'); a.href = URL.createObjectURL(blob); a.download = (S.title || 'what-if').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.' + ext;
      $('#dlwrap').hidden = false; recorder = null; toast('Video ready! Tap Save video.');
    };
    $('#dlwrap').hidden = true; recorder.start(); startPlay(); toast('Recording… let it play to the end');
  }

  // ---------- dragging on the stage (finger or mouse) ----------
  function stagePoint(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
  function hit(p) {
    const sc = scene(), inside = (b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    for (const o of sc.props.filter((o) => !BACK.has(o.type)).reverse()) if (inside(box(o))) return o;
    for (const o of [...sc.actors].sort((a, b) => b.y - a.y)) if (inside(box(o, true))) return o;
    for (const o of sc.props.filter((o) => BACK.has(o.type)).reverse()) if (inside(box(o))) return o;
    return null;
  }
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    if (playing) return;
    const p = stagePoint(e), h = hit(p);
    if (!h) { if (sel) { sel = null; renderPanel(); } return; }
    if (sel !== h) sfx('click');
    sel = h; drag = { o: h, dx: p.x - h.x, dy: p.y - h.y };
    cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; tab = 'selected'; renderPanel();
  });
  cv.addEventListener('pointermove', (e) => {
    const p = stagePoint(e);
    if (!drag) { if (e.pointerType === 'mouse') cv.style.cursor = !playing && hit(p) ? 'grab' : 'default'; return; }
    drag.o.x = Math.round(Math.max(0, Math.min(W, p.x - drag.dx))); drag.o.y = Math.round(Math.max(60, Math.min(H + 80, p.y - drag.dy)));
  });
  cv.addEventListener('pointerup', () => { if (drag) save(); drag = null; cv.style.cursor = 'grab'; });
  cv.addEventListener('wheel', (e) => { if (!sel || playing) return; e.preventDefault(); resize(e.deltaY < 0 ? 0.05 : -0.05); }, { passive: false });
  function resize(d) { if (!sel) return; const max = isActor(sel) ? 1.6 : 2; sel.s = Math.round(Math.max(0.3, Math.min(max, sel.s + d)) * 100) / 100; save(); const r = $('[data-s="s"]'); if (r) r.value = sel.s; }

  // ---------- computer keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (!$('#tut').hidden) { if (e.key === 'ArrowRight' || e.key === 'Enter') tutGo(1); else if (e.key === 'ArrowLeft') tutGo(-1); else if (e.key === 'Escape') tutEnd(); return; }
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === ' ') { e.preventDefault(); playing ? stopPlay() : startPlay(); return; }
    if (playing) return;
    if (!sel) { if (e.key === 'ArrowRight' && cur < S.scenes.length - 1) { cur++; renderPanel(); } if (e.key === 'ArrowLeft' && cur > 0) { cur--; renderPanel(); } return; }
    const step = e.shiftKey ? 20 : 5;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) { e.preventDefault(); sel.x += moves[e.key][0]; sel.y += moves[e.key][1]; save(); return; }
    const k = e.key.toLowerCase();
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); act('delsel'); }
    else if (k === 'f' && isActor(sel)) act('flip');
    else if (k === 'w' && isActor(sel)) act('wobble');
    else if (k === 'd') act('dupsel');
    else if (e.key === '+' || e.key === '=') resize(0.05);
    else if (e.key === '-' || e.key === '_') resize(-0.05);
    else if (e.key === 'Escape') { sel = null; renderPanel(); }
  });

  // ---------- panels ----------
  const opts = (obj, val) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${v}</option>`).join('');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const swatches = (list, val, field) => `<div class="sw">${list.map((c) => `<button type="button" data-sw="${field}" data-v="${c}" style="background:${c}" class="${c === val ? 'on' : ''}" aria-label="${c}"></button>`).join('')}</div>`;
  const isActor = (o) => !!(o && o.cast);

  function renderStrip() {
    $('#strip').innerHTML = S.scenes.map((s, i) => `<button type="button" class="chip ${i === cur ? 'on' : ''}" data-scene="${i}"><b>${i + 1}</b>${esc(WI.SETS[s.set].split(' ').slice(1).join(' '))}<small>${s.dur}s</small></button>`).join('') + `<button type="button" class="chip add" data-act="newscene">+ Scene</button>`;
  }
  function renderPanel() {
    renderStrip();
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    $('#music').textContent = Sound.musicOn ? '🎵' : '🔇'; $('#music').setAttribute('aria-pressed', Sound.musicOn);
    const sc = scene(), Pn = $('#panel');
    if (tab === 'scene') {
      Pn.innerHTML = `
        <div><span class="lbl">Video shape</span><div class="chips"><button type="button" data-fmt="portrait" class="${S.format === 'portrait' ? 'on' : ''}">📱 Portrait (Shorts, TikTok)</button><button type="button" data-fmt="landscape" class="${S.format === 'landscape' ? 'on' : ''}">🖥️ Landscape (YouTube)</button></div></div>
        <label>Set<select data-f="set">${opts(WI.SETS, sc.set)}</select></label>
        ${WI.SIGN_SETS[sc.set] ? `<label>${WI.SIGN_SETS[sc.set]}<input data-f="sign" value="${esc(sc.sign)}" maxlength="40"></label>` : ''}
        <label>Length: <b>${sc.dur}s</b><input type="range" min="1.5" max="10" step="0.5" value="${sc.dur}" data-f="dur" data-num></label>
        <label>Camera<select data-f="cam">${opts({ none: 'Still', in: 'Slow zoom in', out: 'Slow zoom out', punch: 'Punch zoom', shake: 'Shaky' }, sc.cam)}</select></label>
        <div class="row"><button type="button" data-act="dupscene">Duplicate scene</button><button type="button" data-act="left">◀ Move</button><button type="button" data-act="right">Move ▶</button><button type="button" class="danger" data-act="delscene">Delete scene</button></div>`;
    } else if (tab === 'words') {
      Pn.innerHTML = `
        <label>Caption (pops up word by word)<textarea data-f="caption" rows="3" maxlength="200">${esc(sc.caption)}</textarea></label>
        <label>Title box (big question at the top, optional)<input data-f="title" value="${esc(sc.title)}" maxlength="80"></label>
        <label>Words at a time<select data-g="per">${opts({ 1: '1 word', 2: '2 words', 3: '3 words', 4: '4 words' }, String(S.per))}</select></label>
        <label class="tick"><input type="checkbox" data-g="popWords" ${S.popWords !== false ? 'checked' : ''}> Pop sound on each caption word</label>
        <label class="tick"><input type="checkbox" data-g="voice" ${S.voice ? 'checked' : ''}> Read captions out loud when playing</label>
        <label>Video name<input data-g="title" value="${esc(S.title)}" maxlength="60"></label>`;
    } else if (tab === 'add') {
      const people = S.cast.filter((c) => c.species === 'person'), animals = S.cast.filter((c) => c.species !== 'person');
      const tiles = (list) => list.map((c) => `<button type="button" class="tile" data-addcast="${c.id}"><canvas data-face="${c.id}" width="120" height="150"></canvas>${esc(c.name)}</button>`).join('');
      Pn.innerHTML = `<h3>People</h3><div class="grid">${tiles(people)}<button type="button" class="tile new" data-act="newcast" data-sp="person">＋<br>New person</button></div>
        <h3>Animals</h3><div class="grid">${tiles(animals)}<button type="button" class="tile new" data-act="newcast" data-sp="cat">＋<br>New animal</button></div>
        <h3>Props</h3><div class="grid">${Object.entries(WI.PROPS).map(([k, v]) => `<button type="button" class="tile prop" data-addprop="${k}">${v}</button>`).join('')}</div>`;
      drawFaces();
    } else if (tab === 'selected') {
      if (!sel) { Pn.innerHTML = `<p class="hint">Tap a character or prop on the stage to edit it, then drag it to move it.</p>`; return; }
      if (isActor(sel)) {
        const c = castOf(sel.cast);
        Pn.innerHTML = `<h3>${esc(c.name)}</h3>
          <div class="chips">${Object.entries(WI.EXPR).map(([k, v]) => `<button type="button" class="${sel.expr === k ? 'on' : ''}" data-set="expr" data-v="${k}">${v}</button>`).join('')}</div>
          <h3>Animation</h3><div class="chips">${Object.entries(WI.ANIM).map(([k, v]) => `<button type="button" class="${sel.anim === k ? 'on' : ''}" data-set="anim" data-v="${k}">${v}</button>`).join('')}</div>
          <div class="row"><button type="button" class="big ${sel.wobble ? 'on' : ''}" data-act="wobble">🍮 Wobble ${sel.wobble ? 'ON' : 'off'}</button><button type="button" class="big ${sel.talk ? 'on' : ''}" data-act="talk">🗣️ Talking ${sel.talk ? 'ON' : 'off'}</button></div>
          <label>Holding<select data-s="hold">${opts({ none: 'Nothing', mug: '☕ Mug', phone: '📱 Phone', ticket: '🎟️ Ticket', sign: '🪧 Sign', money: '💵 Money', bag: '🛍️ Bag', laptop: '💻 Laptop', heart: '❤️ Heart', star: '⭐ Star', ball: '⚾ Ball' }, sel.hold)}</select></label>
          ${['ticket', 'sign', 'laptop'].includes(sel.hold) ? `<label>Text on it<input data-s="holdText" value="${esc(sel.holdText)}" maxlength="40"></label>` : ''}
          <label>Size<input type="range" min="0.3" max="1.6" step="0.05" value="${sel.s}" data-s="s" data-num></label>
          <div class="row"><button type="button" data-act="flip">↔ Flip</button><button type="button" data-act="front">Bring forward</button><button type="button" data-act="dupsel">Copy</button><button type="button" data-act="editcast">✏️ Edit look</button><button type="button" class="danger" data-act="delsel">Delete</button></div>`;
      } else {
        Pn.innerHTML = `<h3>${WI.PROPS[sel.type]}</h3>
          ${['sign', 'bubble', 'thought', 'ticket', 'laptop'].includes(sel.type) ? `<label>Text<input data-s="text" value="${esc(sel.text)}" maxlength="80"></label>` : ''}
          ${['car', 'sun'].includes(sel.type) ? `<span class="lbl">Colour</span>${swatches(['#56c977', '#e85b3a', '#3f7cf0', '#ffcc33', '#3fa0ff', '#2a3348', '#f07fb0'], sel.text, 'proptext')}` : ''}
          <label>Size<input type="range" min="0.3" max="2" step="0.05" value="${sel.s}" data-s="s" data-num></label>
          <div class="row"><button type="button" data-act="dupsel">Copy</button><button type="button" data-act="delsel" class="danger">Delete</button></div>`;
      }
    } else if (tab === 'cast') {
      const c = S.cast.find((x) => x.id === editingCast) || S.cast[0]; editingCast = c.id;
      const animal = c.species !== 'person';
      Pn.innerHTML = `<div class="castpick">${S.cast.map((x) => `<button type="button" class="${x.id === c.id ? 'on' : ''}" data-pickcast="${x.id}">${esc(x.name)}</button>`).join('')}<button type="button" data-act="newcast" data-sp="person">＋ New</button></div>
        <div class="castedit"><canvas id="castview" width="240" height="320"></canvas><div>
        <label>Name<input data-c="name" value="${esc(c.name)}" maxlength="16"></label>
        <label>What are they?<select data-c="species">${opts(WI.SPECIES, c.species)}</select></label>
        ${animal ? `<span class="lbl">Fur colour</span>${swatches(WI.FURS, c.fur, 'fur')}
          <label class="tick"><input type="checkbox" data-c="patch" ${c.patch ? 'checked' : ''}> Black patches (like a tuxedo cat)</label>`
        : `<label>Hair<select data-c="hair">${opts(WI.HAIR, c.hair)}</select></label>
          <span class="lbl">Hair colour</span>${swatches(WI.HAIRCOL, c.hairColor, 'hairColor')}
          <span class="lbl">Skin</span>${swatches(WI.SKINS, c.skin, 'skin')}`}
        <label>Outfit<select data-c="shirt">${opts(WI.SHIRTS, c.shirt)}</select></label>
        <span class="lbl">Outfit colour</span>${swatches(WI.SHIRTCOL, c.shirtColor, 'shirtColor')}
        <label class="tick"><input type="checkbox" data-c="glasses" ${c.glasses ? 'checked' : ''}> Glasses</label>
        <label class="tick"><input type="checkbox" data-c="blush" ${c.blush ? 'checked' : ''}> Rosy cheeks</label>
        ${S.cast.length > 1 ? `<button type="button" class="danger" data-act="delcast">Delete character</button>` : ''}
        </div></div>`;
      drawCastView();
    }
  }
  function drawCastView() { const c = $('#castview'); if (!c) return; const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.save(); g.translate(120, 312); g.scale(0.5, 0.5); WI.person(g, S.cast.find((x) => x.id === editingCast), { expr: 'happy', t: 0 }); g.restore(); }
  function drawFaces() { document.querySelectorAll('[data-face]').forEach((cn) => { const g = cn.getContext('2d'); g.save(); g.translate(60, 300); g.scale(0.62, 0.62); WI.person(g, castOf(cn.dataset.face), { expr: 'smug', t: 0 }); g.restore(); }); }

  // ---------- panel events ----------
  $('#panel').addEventListener('input', (e) => {
    const el = e.target, sc = scene(); const val = el.type === 'checkbox' ? el.checked : (el.dataset.num !== undefined ? parseFloat(el.value) : el.value);
    if (el.dataset.f) { sc[el.dataset.f] = val; if (el.dataset.f === 'dur') { el.parentElement.querySelector('b').textContent = val + 's'; renderStrip(); } if (el.dataset.f === 'set') renderPanel(); }
    if (el.dataset.g) S[el.dataset.g] = el.dataset.g === 'per' ? parseInt(val, 10) : val;
    if (el.dataset.s && sel) { sel[el.dataset.s] = val; if (el.dataset.s === 'hold') renderPanel(); }
    if (el.dataset.c) { const c = S.cast.find((x) => x.id === editingCast); c[el.dataset.c] = val; if (el.dataset.c === 'species') { if (val !== 'person') { c.fur = c.fur || WI.FUR_DEFAULT[val]; c.fur = WI.FUR_DEFAULT[val]; if (!c.shirt || c.shirt === 'tee') c.shirt = 'none'; } renderPanel(); } else drawCastView(); }
    save();
  });
  $('#panel').addEventListener('change', (e) => { if (e.target.dataset.c === 'name' || e.target.dataset.c === 'patch') renderPanel(); });
  document.addEventListener('click', (e) => {
    if (window.Sound) Sound.init();
    const b = e.target.closest('button'); if (!b || b.closest('#tut')) return;
    const sc = scene();
    if (b.dataset.tab) { tab = b.dataset.tab; sfx('click'); renderPanel(); return; }
    if (b.dataset.scene !== undefined) { cur = +b.dataset.scene; sel = null; editT = 0; sfx('click'); renderPanel(); return; }
    if (b.dataset.fmt) { setFormat(b.dataset.fmt); sfx('pop'); renderPanel(); return; }
    if (b.dataset.set && sel) { sel[b.dataset.set] = b.dataset.v; if (b.dataset.set === 'anim') { editT = 0; if (b.dataset.v === 'jump' || b.dataset.v === 'spin') sfx('boing'); else sfx('click'); } else sfx('click'); save(); renderPanel(); return; }
    if (b.dataset.sw) {
      if (b.dataset.sw === 'proptext' && sel) sel.text = b.dataset.v; else { const c = S.cast.find((x) => x.id === editingCast); c[b.dataset.sw] = b.dataset.v; }
      sfx('click'); save(); renderPanel(); return;
    }
    if (b.dataset.addcast) { const a = A(b.dataset.addcast, Math.round(W * 0.2 + Math.random() * W * 0.6), H * 0.94, S.format === 'landscape' ? 0.55 : (castOf(b.dataset.addcast).species === 'person' ? 0.8 : 0.65)); sc.actors.push(a); sel = a; tab = 'selected'; sfx('pop'); save(); renderPanel(); return; }
    if (b.dataset.addprop) { const t = b.dataset.addprop; const p = P(t, W / 2, t === 'car' ? H * 0.92 : t === 'sun' || t === 'moon' ? H * 0.18 : t === 'bowl' || t === 'ball' ? H * 0.9 : H * 0.54, t === 'car' ? 1 : 0.8, t === 'bubble' ? 'Wait, what?!' : t === 'sign' ? 'WHAT IF?' : t === 'thought' ? 'Hmm…' : t === 'ticket' ? 'SEAT 12B' : ''); sc.props.push(p); sel = p; tab = 'selected'; sfx('pop'); save(); renderPanel(); return; }
    if (b.dataset.pickcast) { editingCast = b.dataset.pickcast; sfx('click'); renderPanel(); return; }
    if (b.dataset.act) act(b.dataset.act, b);
  });
  function act(a, b) {
    const sc = scene();
    if (a === 'newscene') { S.scenes.splice(cur + 1, 0, { id: uid(), set: sc.set, dur: 3.5, cam: 'none', sign: '', title: '', caption: 'And then…', actors: [], props: [] }); cur++; sel = null; tab = 'scene'; sfx('pop'); }
    if (a === 'dupscene') { const s = JSON.parse(JSON.stringify(sc)); s.id = uid(); s.actors.forEach((x) => x.id = uid()); s.props.forEach((x) => x.id = uid()); S.scenes.splice(cur + 1, 0, s); cur++; sfx('pop'); }
    if (a === 'delscene' && S.scenes.length > 1) { S.scenes.splice(cur, 1); cur = Math.max(0, cur - 1); sel = null; sfx('trash'); }
    if (a === 'left' && cur > 0) { [S.scenes[cur - 1], S.scenes[cur]] = [S.scenes[cur], S.scenes[cur - 1]]; cur--; }
    if (a === 'right' && cur < S.scenes.length - 1) { [S.scenes[cur + 1], S.scenes[cur]] = [S.scenes[cur], S.scenes[cur + 1]]; cur++; }
    if (a === 'flip' && sel) { sel.flip = !sel.flip; sfx('click'); }
    if (a === 'wobble' && isActor(sel)) { sel.wobble = !sel.wobble; sfx('boing'); }
    if (a === 'talk' && isActor(sel)) { sel.talk = !sel.talk; sfx('click'); }
    if (a === 'front' && sel) sel.y += 6;
    if (a === 'dupsel' && sel) { const c = { ...JSON.parse(JSON.stringify(sel)), id: uid(), x: sel.x + 40 }; (isActor(sel) ? sc.actors : sc.props).push(c); sel = c; sfx('pop'); }
    if (a === 'delsel' && sel) { sc.actors = sc.actors.filter((x) => x !== sel); sc.props = sc.props.filter((x) => x !== sel); sel = null; sfx('trash'); }
    if (a === 'editcast' && sel) { editingCast = sel.cast; tab = 'cast'; }
    if (a === 'newcast') {
      const sp = (b && b.dataset.sp) || 'person', n = S.cast.length;
      const c = sp === 'person' ? { id: uid(), name: 'New ' + (n + 1), species: 'person', hair: 'flop', hairColor: WI.HAIRCOL[n % WI.HAIRCOL.length], skin: WI.SKINS[0], shirt: 'tee', shirtColor: WI.SHIRTCOL[n % WI.SHIRTCOL.length] }
        : { id: uid(), name: 'Pet ' + (n + 1), species: sp, fur: WI.FUR_DEFAULT[sp], shirt: 'none', shirtColor: WI.SHIRTCOL[n % WI.SHIRTCOL.length] };
      S.cast.push(c); editingCast = c.id; tab = 'cast'; sfx('pop');
    }
    if (a === 'delcast' && S.cast.length > 1) { const id = editingCast; S.cast = S.cast.filter((x) => x.id !== id); S.scenes.forEach((s) => s.actors = s.actors.filter((x) => x.cast !== id)); editingCast = S.cast[0].id; sel = null; sfx('trash'); }
    save(); renderPanel();
  }
  $('#play').onclick = () => { Sound.init(); playing ? stopPlay() : startPlay(); };
  $('#rec').onclick = () => { Sound.init(); if (!playing) exportVideo(); };
  $('#music').onclick = () => { Sound.init(); Sound.setMusic(!Sound.musicOn); try { localStorage.setItem('whatif-music', Sound.musicOn ? '1' : '0'); } catch (e) {} renderPanel(); };
  $('#help').onclick = () => tutStart();
  $('#new').onclick = () => { $('#menu').hidden = !$('#menu').hidden; };
  $('#menu').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; $('#menu').hidden = true;
    if (b.dataset.m === 'blank') { const keep = S.cast, f = S.format; S = { title: 'My What If', format: f, per: 2, voice: S.voice, cast: keep, scenes: [{ id: uid(), set: 'meadow', dur: 4, cam: 'in', sign: '', title: 'What if…?', caption: 'What if…', actors: [], props: [] }] }; }
    if (b.dataset.m === 'example') S = example();
    cur = 0; sel = null; tab = 'scene'; applyFormat(); save(); renderPanel();
  });
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3200); }

  // ---------- tutorial ----------
  const TUT = [
    { t: 'Welcome to What If? Studio!', b: 'Make your own stickman "what if" videos, like the ones on YouTube Shorts. I’ll show you around. It takes one minute.' },
    { el: '#stage', t: 'This is your video', b: 'Tap a character or prop to pick it, then drag it to move it. On a computer you can scroll the mouse wheel to make it bigger or smaller.' },
    { el: '#strip', t: 'Scenes', b: 'Your video is made of scenes. Tap one to edit it, or tap + Scene to add the next part of your story.' },
    { el: '[data-tab=scene]', tab: 'scene', t: 'Scene settings', b: 'Pick the set (meadow, shop, arena, space…), how long the scene lasts and a camera zoom. You can also switch between Portrait (Shorts and TikTok) and Landscape (YouTube).' },
    { el: '[data-tab=add]', tab: 'add', t: 'Add stuff', b: 'Add people, animals and props like speech bubbles, tickets, cars and signs. Tap one and it jumps onto the stage.' },
    { el: '[data-tab=selected]', tab: 'selected', pick: true, t: 'Make them act', b: 'Give the picked character a face (smug, shocked, laughing…) and an animation like wave, jump or spin. Turn on Wobble to make them jiggle like jelly!' },
    { el: '[data-tab=words]', tab: 'words', t: 'Words', b: 'Type the caption and it pops up word by word, just like the real videos. Add a title box for the big "WHAT IF" question at the top.' },
    { el: '[data-tab=cast]', tab: 'cast', t: 'Your cast', b: 'Make your own people and animals. Choose cat, dog, bunny, bear, fox, pig or bird, then pick colours, outfits and glasses.' },
    { el: '#music', t: 'Music', b: 'A chill lofi tune plays while you make your video. Tap here to turn it off or on.' },
    { el: '#play', t: 'Play it', b: 'Watch your whole video with music and sound effects. Tap again to stop.' },
    { el: '#rec', t: 'Save your video', b: 'Records your video with the sound, so you can save it and post it. Let it play to the end.' },
    { t: 'Computer shortcuts', b: 'Space: play or stop. Arrow keys: move (Shift moves faster). + and −: size. F: flip. W: wobble. D: copy. Delete: remove. You’re ready, go make something funny!' },
  ];
  let tutI = 0;
  function tutStart() { tutI = 0; $('#tut').hidden = false; $('#menu').hidden = true; tutShow(); }
  function tutEnd() { $('#tut').hidden = true; try { localStorage.setItem(TUT_KEY, '1'); } catch (e) {} tab = 'scene'; renderPanel(); }
  function tutGo(d) { tutI += d; if (tutI >= TUT.length) return tutEnd(); if (tutI < 0) tutI = 0; sfx('click'); tutShow(); }
  function tutShow() {
    const s = TUT[tutI];
    if (s.tab) { tab = s.tab; if (s.pick && !sel) sel = scene().actors[scene().actors.length - 1] || null; renderPanel(); }
    $('#tutTitle').textContent = s.t; $('#tutBody').textContent = s.b;
    $('#tutDots').innerHTML = TUT.map((_, i) => `<i class="${i === tutI ? 'on' : ''}"></i>`).join('');
    $('#tutBack').hidden = tutI === 0; $('#tutNext').textContent = tutI === TUT.length - 1 ? 'Let’s go!' : 'Next';
    tutPlace();
    const m = $('#tutFace'), g = m.getContext('2d'); g.clearRect(0, 0, m.width, m.height); g.save(); g.translate(60, 236); g.scale(0.42, 0.42); WI.person(g, castOf('ginger'), { expr: tutI === TUT.length - 1 ? 'laugh' : 'happy', anim: 'wave', t: 0.2 }); g.restore();
  }
  function tutPlace() {
    if ($('#tut').hidden) return;
    const s = TUT[tutI], spot = $('#tutSpot'), card = $('#tutCard');
    const el = s.el && $(s.el);
    if (el) {
      if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect(), pad = 8;
      Object.assign(spot.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px', borderRadius: '16px' });
      spot.classList.remove('center');
      const cw = Math.min(360, innerWidth - 24), ch = card.offsetHeight || 200;
      let top = r.bottom + 16, left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), innerWidth - cw - 12);
      if (top + ch > innerHeight - 12) top = r.top - ch - 16;
      if (top < 12) { top = Math.min(innerHeight - ch - 12, Math.max(12, r.top + 12)); left = r.right + 16 + cw < innerWidth ? r.right + 16 : Math.max(12, r.left - cw - 16); if (left < 12 || left + cw > innerWidth) left = 12; }
      Object.assign(card.style, { top: top + 'px', left: left + 'px', width: cw + 'px', transform: 'none' });
    } else {
      Object.assign(spot.style, { left: '50%', top: '50%', width: '0px', height: '0px' }); spot.classList.add('center');
      Object.assign(card.style, { top: '50%', left: '50%', width: Math.min(380, innerWidth - 24) + 'px', transform: 'translate(-50%, -50%)' });
    }
  }
  $('#tutNext').onclick = () => { Sound.init(); tutGo(1); };
  $('#tutBack').onclick = () => tutGo(-1);
  $('#tutSkip').onclick = () => tutEnd();
  addEventListener('resize', () => tutPlace());
  addEventListener('scroll', () => tutPlace(), true);

  // ---------- start ----------
  try { if (localStorage.getItem('whatif-music') === '0') Sound.setMusic(false); } catch (e) {}
  applyFormat();
  (document.fonts ? document.fonts.load('800 40px Fredoka') : Promise.resolve()).finally(() => {
    renderPanel(); requestAnimationFrame(frame);
    let seen = false; try { seen = localStorage.getItem(TUT_KEY) === '1'; } catch (e) {}
    if (!seen) tutStart();
  });
  // music starts on the first tap anywhere (browsers need a tap before sound can play)
  addEventListener('pointerdown', () => Sound.init(), { once: true });
})();
