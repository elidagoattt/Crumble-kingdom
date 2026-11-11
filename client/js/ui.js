/* Crumble Kingdom: menus (resource bar, goals, build, sweets, adventure map, Magic Oven, settings). */
(() => {
'use strict';
const D = window.CKData, CK = window.CK, Art = window.CKArt;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const sfx = n => window.CKSound?.play(n);
let sheetName = '', mapTab = null, lastRes = {};

// ---------------------------------------------------------------- small pieces
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('toasts').append(t); setTimeout(() => t.remove(), 2500); }
function fail(res) { if (res && res.error) { toast(res.error); sfx('error'); return true; } return false; }
function modal(html, onReady) {
  const m = $('modal'); m.hidden = false; m.innerHTML = html;
  m.onclick = e => { if (e.target === m && !m.querySelector('[data-sticky]')) closeModal(); };
  m.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
  onReady?.(m); return m;
}
function closeModal() { const m = $('modal'); m.hidden = true; m.innerHTML = ''; cancelAnimationFrame(heroRaf); }
function sheet(name, html, onReady) {
  const s = $('sheet'); sheetName = name; s.hidden = false; s.innerHTML = '<div class="panel"><button class="x" data-shut>✕</button>' + html + '</div>';
  s.onclick = e => { if (e.target === s) closeSheet(); };
  s.querySelector('[data-shut]').onclick = closeSheet; onReady?.(s);
}
function closeSheet() { $('sheet').hidden = true; $('sheet').innerHTML = ''; sheetName = ''; }
const stars = (n, of = 5) => '<span class="stars">' + Array.from({length: of}, (_, i) => '<span class="' + (i < n ? 'on' : '') + '">★</span>').join('') + '</span>';
const rc = id => D.RARITY[D.CATS[id].rarity].color;

// an animated hero for cards
let heroRaf = 0;
function hero(id, size, pose) {
  const c = document.createElement('canvas'), d = Math.min(3, window.devicePixelRatio || 1); c.width = c.height = size * d; c.style.width = c.style.height = size + 'px';
  const g = c.getContext('2d'); let t0 = performance.now();
  const tick = now => { if (!c.isConnected && now - t0 > 500) return; g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, size, size); Art.kit.shadow(g, size / 2, size * .88, size * .22, size * .06); Art.hero(g, size / 2, size * .88, size / 62, {id, pose: pose || 'idle', t: (now - t0) / 1000}); heroRaf = requestAnimationFrame(tick); };
  cancelAnimationFrame(heroRaf); heroRaf = requestAnimationFrame(tick); return c;
}

// ---------------------------------------------------------------- HUD
function renderHud() {
  const S = CK.state, el = $('res');
  el.innerHTML = ['sugar', 'flour', 'butter', 'jam', 'cutters', 'tickets'].map(k => `<span data-k="${k}"><i>${D.RES[k].icon}</i>${CK.fmt(S.res[k])}</span>`).join('') + `<span class="lvl" data-kingdom>🏰 Lv ${S.castle} · 🌼 ${CK.cozy()} <u>ⓘ</u></span>`;
  el.onclick = e => { if (e.target.closest('[data-kingdom]')) { sfx('tap'); openKingdom(); } };
  for (const k of Object.keys(S.res)) { if (lastRes[k] != null && S.res[k] > lastRes[k]) el.querySelector(`[data-k="${k}"]`)?.classList.add('bump'); lastRes[k] = S.res[k]; }
  const goal = CK.currentGoal(), g = $('goal');
  if (!goal) { g.hidden = true; document.querySelectorAll('#nav button').forEach(b => b.classList.remove('hint')); return; }
  const done = CK.goalDone(); g.hidden = false; g.className = 'goal' + (done ? ' done' : '');
  g.innerHTML = `<i>${done ? '🎁' : '📜'}</i><div><b>GOAL ${S.goal + 1}/${D.GOALS.length}</b>${esc(goal.text)}</div><em>${done ? 'Claim ✂️' + goal.cutters : 'Go'}</em>`;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('hint', !done && b.dataset.open === goal.go));
  g.onclick = () => { if (CK.goalDone()) { const got = CK.claimGoal(); sfx('collect'); toast('Goal done! +' + got.cutters + ' ✂️ Cookie Cutter' + (got.cutters === 1 ? '' : 's')); } else if (goal.go === 'kingdom') { closeSheet(); window.CKKingdom.home(); toast(goal.id === 'collect' ? 'Tap the bubble above your Sugar Mill.' : 'Tap your Cake Castle, then Upgrade.'); } else open(goal.go); };
}

// ---------------------------------------------------------------- build
function openBuild() {
  const S = CK.state;
  const tile = type => {
    const def = D.BUILDINGS[type], cost = CK.buildCost(type), n = CK.countOf(type), lim = CK.limitOf(type), locked = S.castle < (def.need || 1), full = !def.decor && n >= lim;
    return `<button class="tile ${locked ? 'locked' : ''}" data-b="${type}"><span data-th="${type}"></span><b>${def.name}</b>
      ${def.decor ? `<small>🌼 +${def.cozy}</small>` : `<small>${n}/${lim}</small>`}
      <span class="cost ${locked || full || !CK.canPay(cost) ? 'no' : ''}">${locked ? '🏰 Lv ' + def.need : full ? (def.unique ? 'Built' : 'Castle ↑') : CK.costText(cost)}</span></button>`;
  };
  const main = Object.keys(D.BUILDINGS).filter(t => !D.BUILDINGS[t].decor && !D.BUILDINGS[t].fixed), decor = Object.keys(D.BUILDINGS).filter(t => D.BUILDINGS[t].decor);
  sheet('build', `<h2>Build</h2><p class="sub">Buildings make ingredients over time. Decorations add 🌼 cozy points.</p>
    <div class="scroll"><div class="grid">${main.map(tile).join('')}</div><h3 style="margin:14px 4px 8px">Decorations</h3><div class="grid">${decor.map(tile).join('')}</div></div>`, s => {
    s.querySelectorAll('[data-th]').forEach(el => el.replaceWith(Art.thumb(el.dataset.th, 70)));
    s.querySelectorAll('[data-b]').forEach(b => b.onclick = () => {
      const type = b.dataset.b, def = D.BUILDINGS[type];
      if (S.castle < (def.need || 1)) return fail({error: 'Needs Castle level ' + def.need + '.'});
      if (!def.decor && CK.countOf(type) >= CK.limitOf(type)) return fail({error: def.unique ? 'You already have one.' : 'Upgrade the Castle to build more.'});
      if (!CK.canPay(CK.buildCost(type))) return fail({error: 'Not enough resources.'});
      closeSheet(); sfx('tap'); window.CKKingdom.startPlacing(type);
    });
  });
}
function placingBar(p, ok) {
  const bar = $('placing'); bar.hidden = false; $('nav').hidden = true;
  $('placing-name').textContent = (p.id ? 'Move ' : '') + D.BUILDINGS[p.type].name;
  $('place-yes').disabled = !ok;
  $('place-yes').onclick = () => { const res = window.CKKingdom.confirmPlacing(); if (fail(res)) return; endPlacing(); };
  $('place-no').onclick = () => { window.CKKingdom.cancelPlacing(); endPlacing(); };
}
function endPlacing() { $('placing').hidden = true; $('nav').hidden = false; }

function buildingPanel(b) {
  const def = D.BUILDINGS[b.type];
  const max = CK.maxLevel(b), cost = b.lv < max || b.type === 'castle' ? CK.upgradeCost(b) : null, top = b.type === 'castle' ? b.lv >= D.CASTLE.length - 1 : b.lv >= (def.max || 1);
  let info = '';
  if (def.make) info = `<div class="statline"><span>${D.RES[def.make].icon} ${def.slow ? '1 every ' + (Math.round(10 / CK.rateOf(b) / 60) / 10) + ' h' : Math.round(CK.rateOf(b)) + '/min'}</span><span>Holds ${CK.capOf(b)}</span><span>Now ${CK.stored(b)}</span></div>`;
  if (b.type === 'castle') { const next = D.CASTLE[b.lv + 1]; info = `<div class="statline"><span>Land ${CK.land()}×${CK.land()}</span><span>🌼 ${CK.cozy()}</span></div>` + (next ? `<p>Next level clears the leaves to ${next.land}×${next.land} land, allows more buildings and gives +1 ✂️ Cookie Cutter.</p>` : '<p>All the land is cleared!</p>') + '<button class="btn blue" data-how>🏰 How kingdom levels work</button>'; }
  const canUp = !def.decor && cost && !top;
  modal(`<div class="card"><button class="x" data-close>✕</button><div class="hero" data-th></div>
    <h2>${def.name}${def.decor ? '' : ' <small>Lv ' + b.lv + '</small>'}</h2><p>${def.text || 'A decoration. Adds 🌼 ' + def.cozy + ' cozy points.'}</p>${info}
    ${canUp ? (b.lv >= max && b.type !== 'castle' ? '<p><b>Upgrade the Castle to level this up more.</b></p>' : `<button class="btn green col" data-up ${CK.canPay(cost) ? '' : 'disabled'}>Upgrade to Lv ${b.lv + 1}<small>${CK.costText(cost)}</small></button>`) : top && !def.decor ? '<p><b>Top level!</b></p>' : ''}
    <div class="row">${def.fixed ? '' : '<button class="btn blue" data-move>Move</button><button class="btn red" data-del>Remove</button>'}</div></div>`, m => {
    const th = document.createElement('canvas'), d = Math.min(3, devicePixelRatio || 1); th.width = th.height = 120 * d; th.style.width = th.style.height = '120px'; const g = th.getContext('2d'); g.scale(d, d); Art.building(g, b.type, 60, 112, 104, {lv: b.lv, t: .5, seed: b.id}); m.querySelector('[data-th]').append(th);
    m.querySelector('[data-up]')?.addEventListener('click', () => { const res = CK.upgrade(b.id); if (fail(res)) return; sfx('level'); closeModal(); if (b.type === 'castle') { window.CKKingdom.burstLeaves(); toast('The leaves fall back! More land and buildings unlocked. +1 ✂️'); } else toast(def.name + ' is now level ' + res.building.lv + '!'); });
    m.querySelector('[data-how]')?.addEventListener('click', openKingdom);
    m.querySelector('[data-move]')?.addEventListener('click', () => { closeModal(); window.CKKingdom.startMoving(b.id); });
    m.querySelector('[data-del]')?.addEventListener('click', () => confirmBox('Remove ' + def.name + '?', 'You get half of its cost back.', 'Remove', () => { CK.remove(b.id); toast(def.name + ' removed.'); }));
  });
}
function confirmBox(title, text, yes, fn) {
  modal(`<div class="card small"><h2>${esc(title)}</h2><p>${esc(text)}</p><button class="btn red" data-yes>${esc(yes)}</button><button class="btn" data-close>Cancel</button></div>`, m => { m.querySelector('[data-yes]').onclick = () => { closeModal(); fn(); }; });
}

// ---------------------------------------------------------------- sweets
function openCats() {
  const S = CK.state, ids = Object.keys(D.CATS).sort((a, b) => (S.cats[b] ? 1 : 0) - (S.cats[a] ? 1 : 0) || D.RARITY[D.CATS[b].rarity].stars - D.RARITY[D.CATS[a].rarity].stars || CK.stats(b).power - CK.stats(a).power);
  sheet('cats', `<h2>Sweets</h2><p class="sub">Tap a team slot to remove someone. Tap a sweet below for details.</p>
    <div class="team">${S.team.map((id, i) => `<button class="slot ${id ? 'has' : ''}" data-slot="${i}" style="--rc:${id ? rc(id) + '55' : ''}">${id ? `<span data-p="${id}"></span><small>${D.ROLES[D.CATS[id].role].icon} Lv ${S.cats[id].lv}</small>` : '＋'}</button>`).join('')}</div>
    <div class="power"><span>⚡ Team power</span><span>${CK.fmt(CK.teamPower())}</span></div>
    <div class="scroll"><div class="grid">${ids.map(id => { const c = D.CATS[id], own = S.cats[id]; return `<button class="tile cat ${own ? '' : 'missing'} ${S.team.includes(id) ? 'inteam' : ''}" data-cat="${id}" style="--rc:${rc(id)}44"><span class="role">${D.ROLES[c.role].icon}</span>${own ? `<span class="lv">Lv ${own.lv}</span>` : ''}<span data-p="${id}"></span><b>${own ? c.name : '???'}</b>${own ? stars(own.stars) : `<small>${D.RARITY[c.rarity].name}</small>`}</button>`; }).join('')}</div></div>`, s => {
    s.querySelectorAll('[data-p]').forEach(el => el.replaceWith(Art.portrait(el.dataset.p, 64)));
    s.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => { const id = S.team[+b.dataset.slot]; if (!id) return toast('Tap a sweet below to add it.'); const res = CK.toggleTeam(id); if (!fail(res)) { sfx('tap'); openCats(); } });
    s.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => catCard(b.dataset.cat));
  });
}
function catCard(id) {
  const S = CK.state, c = D.CATS[id], own = S.cats[id], role = D.ROLES[c.role], rar = D.RARITY[c.rarity], st = D.catStats(id, own), cost = own ? D.levelCost(own.lv) : 0, inTeam = S.team.includes(id);
  sfx('tap');
  modal(`<div class="card" style="--rc:${rar.color}"><button class="x" data-close>✕</button><div class="hero" data-hero></div>
    <h2>${own ? c.name : '???'}</h2>${own ? `<p style="margin:-4px 0 6px;color:var(--brown)">${c.kind}</p>` : ''}<span class="rar">${rar.name}</span> <span class="chip">${role.icon} ${role.name}</span>
    ${own ? `<div>${stars(own.stars)}</div><div class="statline"><span>Lv ${own.lv}</span><span>❤️ ${st.hp}</span><span>⚔️ ${st.atk}</span><span>⚡ ${st.power}</span></div>` : '<p>Bake this friend in the Magic Oven.</p>'}
    <div class="skillbox"><b>${c.skill.icon} ${c.skill.name} <small>(every ${c.skill.cd}s)</small></b>${c.skill.text}</div>
    ${own ? `<div class="row"><button class="btn green col" data-lv ${own.lv >= D.MAX_LEVEL || !CK.canPay({jam: cost}) ? 'disabled' : ''}>${own.lv >= D.MAX_LEVEL ? 'Top level' : 'Level up'}<small>${own.lv >= D.MAX_LEVEL ? '' : '🍓 ' + CK.fmt(cost)}</small></button>
      <button class="btn ${inTeam ? 'red' : 'blue'}" data-team>${inTeam ? 'Leave team' : 'Join team'}</button></div>` : ''}</div>`, m => {
    m.querySelector('[data-hero]').append(hero(id, 150, own ? 'idle' : 'idle'));
    if (!own) m.querySelector('[data-hero] canvas').style.filter = 'brightness(0) opacity(.4)';
    m.querySelector('[data-lv]')?.addEventListener('click', () => { const res = CK.levelUp(id); if (fail(res)) return; sfx('level'); catCard(id); if (sheetName === 'cats') openCats(); });
    m.querySelector('[data-team]')?.addEventListener('click', () => { const res = CK.toggleTeam(id); if (fail(res)) return; sfx('tap'); closeModal(); openCats(); });
  });
}

// ---------------------------------------------------------------- story mode: episodes, then a trail of levels
function openMap() {
  const eps = D.EPISODES.map((e, w) => {
    const open = CK.stageOpen(w, 0), done = CK.episodeDone(w), got = CK.episodeStars(w), max = e.levels * 3;
    let cleared = 0; for (let i = 0; i < e.levels; i++) if (CK.starsOf(w, i)) cleared++;
    return `<button class="ep ${open ? '' : 'locked'} ${done ? 'done' : ''} ${open && !done ? 'now' : ''}" data-ep="${w}" style="--a:${e.sky[0]};--b:${e.ground}">
      <span class="ep-n">EPISODE ${w + 1}</span><i>${open ? e.icon : '🔒'}</i><b>${e.name}</b>
      <span class="ep-bar"><u style="width:${cleared / e.levels * 100}%"></u></span>
      <small>${done ? '✔ Complete' : open ? cleared + '/' + e.levels + ' levels' : 'Finish Episode ' + w} · ★ ${got}/${max}</small></button>`;
  }).join('');
  sheet('map', `<h2>Story</h2><p class="sub">Ten episodes to win back the Golden Recipe. Swipe sideways to see them all.</p><div class="eps">${eps}</div>`, s => {
    s.querySelectorAll('[data-ep]').forEach(b => b.onclick = () => { const w = +b.dataset.ep; if (!CK.stageOpen(w, 0)) return fail({error: 'Finish Episode ' + w + ' first.'}); sfx('tap'); openEpisode(w); });
    s.querySelector('.ep.now')?.scrollIntoView({inline: 'center', block: 'nearest'});
  });
}
function openEpisode(w) {
  const e = D.EPISODES[w], step = 86, width = e.levels * step + 120, mid = 92, amp = 38;
  const pos = i => ({x: 70 + i * step, y: mid + Math.sin(i * 1.05) * amp});
  let path = ''; for (let i = 0; i < e.levels; i++) { const p = pos(i); path += (i ? ' L' : 'M') + p.x + ' ' + p.y; }
  const nodes = Array.from({length: e.levels}, (_, i) => { const p = pos(i), st = CK.starsOf(w, i), ok = CK.stageOpen(w, i), boss = i === e.levels - 1, elite = i === Math.floor(e.levels / 2);
    return `<button class="node ${boss ? 'boss' : elite ? 'elite' : ''} ${ok ? '' : 'locked'} ${ok && !st ? 'next' : ''}" data-st="${w}-${i}" style="left:${p.x}px;top:${p.y}px"><b>${ok ? (boss ? '👑' : elite ? '⚡' : i + 1) : '🔒'}</b>${stars(st, 3)}</button>`; }).join('');
  sheet('map', `<h2>${e.icon} Episode ${w + 1}: ${e.name}</h2><p class="sub"><button class="link" data-back>‹ All episodes</button> · ★ ${CK.episodeStars(w)}/${e.levels * 3} · Three ★ if nobody faints</p>
    <div class="trail" style="--a:${e.sky[0]};--b:${e.sky[1]};--c:${e.ground}"><div class="trail-in" style="width:${width}px"><svg width="${width}" height="190"><path d="${path}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 16" opacity=".9"/></svg>${nodes}</div></div>`, s => {
    s.querySelector('[data-back]').onclick = openMap;
    s.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const [ww, st] = b.dataset.st.split('-').map(Number); if (!CK.stageOpen(ww, st)) return fail({error: 'Win the level before this one first.'}); stageCard(ww, st); });
    (s.querySelector('.node.next') || s.querySelector('.node.boss'))?.scrollIntoView({inline: 'center', block: 'nearest'});
  });
}

/* A story scene: speakers take turns in a speech bubble. Tap anywhere for the next line. */
function scene(w, lines, done) {
  const e = D.EPISODES[w]; let i = 0;
  const m = $('modal'); m.hidden = false; m.onclick = null;
  m.innerHTML = `<div class="scene" style="--a:${e.sky[0]};--b:${e.ground}"><button class="pill skip" data-skip>Skip ▸▸</button><div class="who" data-who></div><div class="bubble"><b data-name></b><p data-line></p><em>Tap to continue ▸</em></div></div>`;
  const box = m.querySelector('.scene'), who = m.querySelector('[data-who]');
  const end = () => { cancelAnimationFrame(heroRaf); m.hidden = true; m.innerHTML = ''; done?.(); };
  const show = () => {
    const [id, line] = lines[i], isBoss = !!D.BOSSES[id];
    who.innerHTML = ''; who.className = 'who ' + (isBoss ? 'right' : 'left'); box.classList.toggle('foe', isBoss);
    if (isBoss) { const c = document.createElement('canvas'), d = Math.min(3, devicePixelRatio || 1); c.width = c.height = 170 * d; c.style.width = c.style.height = '170px'; const g = c.getContext('2d'); g.scale(d, d); const def = D.BOSSES[id]; if (def.tint) g.filter = def.tint; Art.boss(g, 85, 160, 3.1, def.art || id, {id, t: .3}); who.append(c); }
    else who.append(hero(id, 170, 'idle'));
    m.querySelector('[data-name]').textContent = (D.CATS[id] || D.BOSSES[id]).name; m.querySelector('[data-line]').textContent = line; sfx('tap');
  };
  box.onclick = ev => { if (ev.target.closest('[data-skip]')) return end(); i++; if (i >= lines.length) end(); else show(); };
  show();
}

function stageCard(w, st) {
  const info = D.stageInfo(w, st), power = CK.teamPower(), first = !CK.starsOf(w, st), kinds = [...new Set(info.waves.flat())];
  const tough = power < info.power * .75 ? '😰 Very hard' : power < info.power ? '😬 Tough' : power < info.power * 1.4 ? '🙂 Fair' : '😎 Easy';
  sfx('tap');
  modal(`<div class="card wide"><button class="x" data-close>✕</button><h2>${info.world.icon} ${info.name}</h2>
    <p>${info.elite ? '<b>⚡ Elite level:</b> tougher foes, bigger reward.<br>' : ''}${info.boss ? '<b>Boss: ' + D.BOSSES[info.boss].name + '</b><br>Watch for ' + D.BOSSES[info.boss].special.icon + ' ' + D.BOSSES[info.boss].special.name + '!' : info.waves.length + ' waves'}</p>
    <div class="hero" data-foes></div>
    <div class="statline"><span>⚡ Your team ${CK.fmt(power)}</span><span>Needs about ${CK.fmt(info.power)}</span><span>${tough}</span></div>
    <div class="chips"><span class="chip">🍬 ${CK.fmt(info.reward.sugar * (first ? 1 : .5))}</span><span class="chip">🍓 ${Math.round(info.reward.jam * (first ? 1 : .5))}</span>${first && info.firstCutters ? `<span class="chip">✂️ ${info.firstCutters}</span>` : ''}${first && info.firstTickets ? `<span class="chip">🎟️ ${info.firstTickets}</span>` : ''}${CK.starsOf(w, st) < 3 ? '<span class="chip">3★ = ✂️ 1</span>' : ''}</div>
    <div class="row"><button class="btn blue" data-team>Team</button><button class="btn green" data-go>Fight!</button></div></div>`, m => {
    const c = document.createElement('canvas'), d = Math.min(3, devicePixelRatio || 1), wd = 260, ht = 84; c.width = wd * d; c.height = ht * d; c.style.width = wd + 'px'; c.style.height = ht + 'px'; const g = c.getContext('2d'); g.scale(d, d);
    const list = kinds.slice(0, info.boss ? 2 : 4), step = wd / (list.length + (info.boss ? 1.6 : 0) + 1);
    list.forEach((k, i) => Art.foe(g, step * (i + 1), 74, 1.6, k, {t: .3}));
    if (info.boss) Art.boss(g, wd - step * 1.1, 80, 1.15, info.boss, {t: .3});
    m.querySelector('[data-foes]').append(c);
    m.querySelector('[data-team]').onclick = () => { closeModal(); openCats(); };
    m.querySelector('[data-go]').onclick = () => { closeModal(); closeSheet(); window.CKGame.fight(w, st); };
  });
}

// ---------------------------------------------------------------- Kingdom level guide
const WHERE = {
  sugar:  'Sugar Mills and Honey Hives make it. Story wins give lots too.',
  flour:  'Flour Windmills and Sweet Markets make it. Story wins give some.',
  butter: 'Butter Churns (Castle Lv 2) and Milk Barns make it. Later story levels give some.'
};
function unlocksAt(lv) { return Object.keys(D.BUILDINGS).filter(t => (D.BUILDINGS[t].need || 1) === lv && !D.BUILDINGS[t].fixed); }
function openKingdom() {
  const S = CK.state, lv = S.castle, top = lv >= D.CASTLE.length - 1, cost = top ? null : D.CASTLE[lv].cost, next = D.CASTLE[lv + 1];
  const castle = S.buildings.find(b => b.type === 'castle'), can = cost && CK.canPay(cost);
  const rows = cost ? Object.entries(cost).map(([k, v]) => { const have = S.res[k] || 0, ok = have >= v; return `<div class="need ${ok ? 'ok' : ''}"><i>${D.RES[k].icon}</i><div><b>${D.RES[k].name} <span>${CK.fmt(Math.min(have, v))} / ${CK.fmt(v)} ${ok ? '✓' : ''}</span></b><div class="bar"><span style="width:${Math.min(100, have / v * 100)}%"></span></div>${ok ? '' : `<small>${WHERE[k] || ''}</small>`}</div></div>`; }).join('') : '';
  const names = lvl => unlocksAt(lvl).map(t => D.BUILDINGS[t].icon + ' ' + D.BUILDINGS[t].name);
  const ladder = D.CASTLE.slice(1).map((c, i) => { const n = i + 1, list = names(n); return `<div class="rung ${n === lv ? 'now' : n < lv ? 'done' : ''}"><b>${n < lv ? '✓' : n === lv ? '★' : '🔒'} Lv ${n}</b><span>Land ${c.land}×${c.land}${list.length ? ' · ' + list.join(', ') : ' · more of each building'}</span></div>`; }).join('');
  modal(`<div class="card wide kcard"><button class="x" data-close>✕</button><h2>🏰 Kingdom Level ${lv}</h2>
    ${top ? '<p><b>Your kingdom is at the top level. All the land is cleared!</b></p>' : `
    <p class="khow"><b>How to level up:</b> collect the ingredients below, then tap your <b>Cake Castle</b> and press <b>Upgrade</b>. Your kingdom level is your castle's level.</p>
    <div class="needs">${rows}</div>
    <div class="kunlock"><b>Level ${lv + 1} gives you</b><span>🍃 The leaves fall back: land grows to ${next.land}×${next.land}</span>${names(lv + 1).length ? `<span>🔨 New: ${names(lv + 1).join(', ')}</span>` : ''}<span>🏗️ More of each building, and buildings can level higher</span><span>✂️ +1 Cookie Cutter</span></div>
    <button class="btn ${can ? 'green' : ''} col" data-kup>${can ? 'Upgrade the Castle now' : 'Show me the Castle'}<small>${can ? 'You have everything!' : 'Not enough ingredients yet'}</small></button>`}
    <h3>All kingdom levels</h3><div class="ladder">${ladder}</div></div>`, m => {
    m.querySelector('[data-kup]')?.addEventListener('click', () => {
      if (can) { const res = CK.upgrade(castle.id); if (fail(res)) return; sfx('level'); closeModal(); closeSheet(); window.CKKingdom.home(); window.CKKingdom.burstLeaves(); toast('Kingdom level ' + CK.state.castle + '! The leaves fall back. +1 ✂️'); }
      else { closeModal(); closeSheet(); window.CKKingdom.home(); toast('Tap your Cake Castle to upgrade it when you have the ingredients.'); }
    });
  });
}

// ---------------------------------------------------------------- Magic Oven
let ovenTab = 'classic';
function openWell(tab) {
  if (tab) ovenTab = tab;
  const S = CK.state, G = D.GACHA, EV = D.EVENT, ev = ovenTab === 'event';
  closeModal();
  const shelf = ev ? EV.featured.concat(['cosmo', 'truffle', 'rolly']).slice(0, 6) : ['luna', 'cosmo', 'truffle', 'rolly', 'chip', 'stack'];
  const odds = ev ? EV.odds : G.odds, cur = ev ? 'tickets' : 'cutters', icon = D.RES[cur].icon, have = S.res[cur] || 0, left = Math.max(1, G.pity - S.pity);
  sheet('well', `<div class="shop${ev ? ' event' : ''}" style="--ev1:${EV.colors[0]};--ev2:${EV.colors[1]}"><div class="awning"><span>✦ THE MAGIC OVEN ✦</span></div>
    <div class="shop-in"><div class="otabs"><button class="${ev ? '' : 'on'}" data-tab="classic">🍪 Classic Bake<small>${D.RES.cutters.icon} ${CK.fmt(S.res.cutters || 0)}</small></button><button class="ev ${ev ? 'on' : ''}" data-tab="event">${EV.icon} ${esc(EV.name)}<small>${D.RES.tickets.icon} ${CK.fmt(S.res.tickets || 0)}</small></button></div>
      <div class="shelf">${shelf.map(id => `<span class="jar" style="--rc:${rc(id)}"><span data-p="${id}"></span><small>${D.RARITY[D.CATS[id].rarity].name}</small></span>`).join('')}</div>
      <div class="counter"><div class="oven" data-well></div>
        <div class="till"><p class="sign">${ev ? esc(EV.blurb) : 'Pop in a Cookie Cutter and bake a new friend!'}</p>
          <div class="tags"><button class="tag blue${have < G.cost1 ? ' poor' : ''}" data-draw="1"><b>Bake 1</b><span>${icon} ${G.cost1}</span></button><button class="tag gold${have < G.cost10 ? ' poor' : ''}" data-draw="10"><b>Bake 10</b><span>${icon} ${G.cost10}</span></button></div>
          <p class="note">You have ${icon} ${CK.fmt(have)} ${D.RES[cur].name}. An Epic or better is guaranteed within ${left} more bake${left === 1 ? '' : 's'}.</p>
          <div class="odds">${Object.entries(odds).reverse().map(([k, v]) => `<div><span style="color:${D.RARITY[k].color}">● ${D.RARITY[k].name}</span><span>${v}%</span></div>`).join('')}</div>
          <p class="note">${ev ? '🎟️ Event Tickets come from beating episode bosses and from daily gifts.' : '✂️ Cookie Cutters come from 3-star wins, goals, castle upgrades and daily gifts.'} They cannot be bought. ${ev ? '' : '<b>Antie and Klina only come from the special event.</b> '}A friend you already have gains a ★ instead; at 5★ you get jam.</p></div></div></div></div>`, s => {
    s.querySelector('.panel').classList.add('shop-panel');
    const c = document.createElement('canvas'), d = Math.min(3, window.devicePixelRatio || 1); c.width = 170 * d; c.height = 150 * d; c.style.width = '170px'; c.style.height = '150px';
    const g = c.getContext('2d'); g.setTransform(d * .62, 0, 0, d * .62, -320 * d * .62 + 85 * d, -92 * d * .62); window.CKBake.drawOven(g, .4, 0, .8, '#ffb02e', 0);
    s.querySelector('[data-well]').append(c);
    s.querySelectorAll('[data-p]').forEach(el => el.replaceWith(Art.portrait(el.dataset.p, 54)));
    s.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { sfx('tap'); openWell(b.dataset.tab); });
    s.querySelectorAll('[data-draw]').forEach(b => b.onclick = () => {
      const res = CK.draw(+b.dataset.draw, ev); if (fail(res)) return;
      renderHud();
      window.CKBake.play(res.results, {event: ev}, skipped => { if (skipped || res.results.length > 1) showPulls(res.results, true); else if (sheetName === 'well') openWell(); });
    });
  });
}
function showPulls(results, quiet) {
  const best = results.some(r => r.rarity === 'special' || r.rarity === 'epic'); if (!quiet) sfx(best ? 'rare' : 'draw');
  const single = results.length === 1, r0 = results[0];
  modal(`<div class="card" data-sticky><h2>${single ? (r0.isNew ? 'A new friend!' : D.CATS[r0.id].name + ' again!') : 'Fresh from the oven'}</h2>
    ${single ? `<div class="hero" data-hero></div><span class="rar" style="--rc:${D.RARITY[r0.rarity].color}">${D.RARITY[r0.rarity].name}</span><p><b>${D.CATS[r0.id].name}</b><br>${r0.isNew ? D.ROLES[D.CATS[r0.id].role].icon + ' ' + D.ROLES[D.CATS[r0.id].role].name + ' · ' + D.CATS[r0.id].skill.name : r0.starUp ? 'Now ' + r0.starUp + '★ and stronger!' : '+' + r0.jam + ' 🍓 jam'}</p>`
      : `<div class="pulls">${results.map((r, i) => `<div class="pull" style="--rc:${D.RARITY[r.rarity].color}88;animation-delay:${i * .08}s"><span data-p="${r.id}"></span>${D.CATS[r.id].name}${r.isNew ? '<em>NEW</em>' : r.starUp ? '<em style="background:#f2a81c">★' + r.starUp + '</em>' : ''}</div>`).join('')}</div>`}
    <button class="btn green" data-ok>Yay!</button></div>`, m => {
    if (single) m.querySelector('[data-hero]').append(hero(r0.id, 150, 'win'));
    m.querySelectorAll('[data-p]').forEach(el => el.replaceWith(Art.portrait(el.dataset.p, 56)));
    m.querySelector('[data-ok]').onclick = () => { closeModal(); if (sheetName === 'well') openWell(); };
  });
}

// ---------------------------------------------------------------- menu
// Full screen: hides the browser's tabs and address bar. Browsers only allow it after a tap,
// so we also try once on the first touch. iPhone Safari cannot do this for web pages; there the
// fix is installing to the home screen (the manifest is already fullscreen).
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const FS = {
  on: () => !!(document.fullscreenElement || document.webkitFullscreenElement),
  can: () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen),
  standalone: () => !!(window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone),
  enter() { const el = document.documentElement; try { const r = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); r?.catch?.(() => {}); } catch (e) {} },
  exit() { try { const r = (document.exitFullscreen || document.webkitExitFullscreen)?.call(document); r?.catch?.(() => {}); } catch (e) {} },
};
function openMenu() {
  const S = CK.state;
  sheet('menu', `<h2>Menu</h2><div class="scroll" style="display:flex;flex-direction:column;gap:10px">
    <button class="btn ${S.settings.sound ? 'green' : ''}" data-sound>${S.settings.sound ? '🔊 Sound on' : '🔇 Sound off'}</button>
    <button class="btn ${S.settings.music !== false ? 'green' : ''}" data-music>${S.settings.music !== false ? '🎵 Music on' : '🎵 Music off'}</button>
    ${FS.can() ? `<button class="btn ${FS.on() ? 'green' : ''}" data-full>${FS.on() ? '⛶ Leave full screen' : '⛶ Full screen'}</button>` : ''}
    ${!FS.can() && IOS && !FS.standalone() ? `<p style="font-size:12px;font-weight:700;color:var(--brown);text-align:center;margin:0;background:#fff6fa;border-radius:12px;padding:8px">📲 For full screen on iPhone: tap Share → <b>Add to Home Screen</b>, then open Crumble Kingdom from your home screen.</p>` : ''}
    <button class="btn blue" data-help>📖 How to play</button>
    <button class="btn red" data-reset>🗑️ Start over</button>
    <p style="font-size:12px;font-weight:700;color:var(--brown);text-align:center;margin:6px 0 0">Crumble Kingdom · a game by Eli<br>Your progress is saved on this device.</p></div>`, s => {
    s.querySelector('[data-sound]').onclick = () => { S.settings.sound = !S.settings.sound; CK.changed(); openMenu(); sfx('tap'); window.CKSound.refreshMusic(); };
    s.querySelector('[data-music]').onclick = () => { S.settings.music = S.settings.music === false; CK.changed(); openMenu(); sfx('tap'); window.CKSound.refreshMusic(); };
    s.querySelector('[data-help]').onclick = help;
    const fb = s.querySelector('[data-full]');
    if (fb) fb.onclick = () => { FS.on() ? FS.exit() : FS.enter(); sfx('tap'); setTimeout(openMenu, 350); };
    s.querySelector('[data-reset]').onclick = () => confirmBox('Start over?', 'This deletes your kingdom, sweets and progress on this device. It cannot be undone.', 'Delete everything', () => { CK.reset(); location.reload(); });
  });
}
function help() {
  modal(`<div class="card"><button class="x" data-close>✕</button><h2>How to play</h2>
    <p style="text-align:left">🔨 <b>Build</b> mills, churns and kitchens. They fill up over time: tap them to collect.<br><br>
    📖 Play the <b>Story</b> with a team of up to 5 sweets. They fight on their own; you choose when to use each skill.<br><br>
    🛡️ Guards and Slashers stand in front. Flying foes dive at your back row, so keep a Healer.<br><br>
    🍓 Spend <b>jam</b> to level up your sweets. 🔥 The <b>Magic Oven</b> is always open: bake new friends with ✂️ Cookie Cutters, or 🎟️ Event Tickets in the special event.<br><br>
    🏰 Your <b>kingdom level</b> is your Castle's level. Tap the Castle and press Upgrade to clear the leaves: more land and more buildings. Tap the 🏰 chip at the top to see what you need.</p><button class="btn green" data-close>Got it</button></div>`);
}
function story() {
  modal(`<div class="card" data-sticky><div class="hero" data-hero></div><h2>Welcome to Crumble Kingdom!</h2>
    <p><b>King Whiskers the Hungry</b> has gobbled up the Golden Recipe and chased the sweets out of their kingdom.<br><br>Build a cosy new home, bake a team of friends, and play through ten story episodes to win it back!</p>
    <button class="btn green" data-ok>Let's go! 🐾</button></div>`, m => { m.querySelector('[data-hero]').append(hero('chip', 140, 'win')); m.querySelector('[data-ok]').onclick = () => { CK.state.tutorial = 1; CK.changed(); closeModal(); daily(); }; });
}
function daily() {
  const got = CK.dailyGift(); if (!got) return;
  modal(`<div class="card"><h2>🎁 Daily gift</h2><p>Day ${got.streak} in a row! Come back tomorrow for more.</p><div class="chips">${Object.entries(got.gain).filter(([, v]) => v > 0).map(([k, v]) => `<span class="chip">${D.RES[k].icon} +${CK.fmt(v)}</span>`).join('')}</div><button class="btn green" data-close>Thanks!</button></div>`);
  sfx('collect');
}

function open(name) { ({build: openBuild, cats: openCats, map: openMap, well: openWell, menu: openMenu, kingdom: closeSheet}[name] || closeSheet)(); }
function init() {
  document.querySelectorAll('#nav [data-open]').forEach(b => b.onclick = () => { window.CKSound?.unlock(); sfx('tap'); open(b.dataset.open); });
  // Try full screen on the first tap (browsers ignore it without a user gesture; Android Chrome honours it)
  if (FS.can() && !FS.on() && !FS.standalone()) document.addEventListener('pointerdown', () => { if (!FS.on()) FS.enter(); }, {once: true});
  CK.onChange(renderHud); renderHud();
  setInterval(renderHud, 5000);
}

function friendJoined(id, done) { sfx('rare'); modal(`<div class="card" data-sticky><h2>A new friend joins!</h2><div class="hero" data-hero></div><span class="rar" style="--rc:${rc(id)}">${D.RARITY[D.CATS[id].rarity].name}</span><p><b>${D.CATS[id].name}</b> the ${D.CATS[id].kind}<br>${D.ROLES[D.CATS[id].role].icon} ${D.ROLES[D.CATS[id].role].name} · ${D.CATS[id].skill.name}</p><button class="btn green" data-ok>Welcome!</button></div>`, m => { m.querySelector('[data-hero]').append(hero(id, 150, 'win')); m.querySelector('[data-ok]').onclick = () => { closeModal(); done?.(); }; }); }
window.CKUI = {init, openKingdom, toast, open, openEpisode, scene, friendJoined, closeSheet, closeModal, buildingPanel, placingBar, story, daily, renderHud};
})();
