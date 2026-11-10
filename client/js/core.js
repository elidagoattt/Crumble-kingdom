/* Crumble Kingdom: the save file and the rules (spending, building, levelling, baking new sweets).
 * Screens never change the save directly; they call the functions here, which keeps every rule in one place.
 */
(() => {
'use strict';
const D = window.CKData;
const KEY = 'crumble-kingdom-save-v1';
const now = () => Date.now();

function fresh() {
  return {
    v: 1, created: now(), seen: now(),
    res: {sugar: 300, flour: 40, butter: 0, jam: 60, gems: 150},
    castle: 1,
    buildings: [{id: 1, type: 'castle', x: D.GRID / 2 - 1, y: D.GRID / 2 - 1, lv: 1, at: now()}],
    nextId: 2,
    cats: {},                // id -> {lv, stars}
    team: [null, null, null, null, null],
    stars: {},               // "episode-level" -> best stars
    seenStory: {},           // which episode intros/outros have been shown
    goal: 0, goalsPaid: {},
    pity: 0,
    daily: {day: '', streak: 0},
    stats: {collected: 0, draws: 0, wins: 0},
    settings: {sound: true, music: true, speed: 1, auto: true},
    tutorial: 0
  };
}
let S = fresh();
const listeners = new Set();
const changed = () => { save(); listeners.forEach(fn => { try { fn(S); } catch (e) { console.error(e); } }); };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const data = JSON.parse(raw); if (data && data.v === 1) S = Object.assign(fresh(), data, {res: Object.assign(fresh().res, data.res), stats: Object.assign(fresh().stats, data.stats), settings: Object.assign(fresh().settings, data.settings)}); }
  } catch { /* a broken or blocked save just starts a new game */ }
  if (!Object.keys(S.cats).length) { D.STARTERS.forEach((id, i) => { S.cats[id] = {lv: 1, stars: 0}; S.team[i] = id; }); }
  return S;
}
let saveTimer = 0;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { S.seen = now(); localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full or blocked */ } }, 150); }
function reset() { try { localStorage.removeItem(KEY); } catch {} S = fresh(); load(); changed(); }

// ---- money
const canPay = cost => Object.entries(cost || {}).every(([k, v]) => (S.res[k] || 0) >= v);
function pay(cost) { if (!canPay(cost)) return false; for (const [k, v] of Object.entries(cost || {})) S.res[k] -= v; return true; }
function give(gain) { for (const [k, v] of Object.entries(gain || {})) if (v) S.res[k] = (S.res[k] || 0) + Math.round(v); changed(); }
const costText = cost => Object.entries(cost || {}).map(([k, v]) => D.RES[k].icon + ' ' + fmt(v)).join('  ');
function fmt(n) { n = Math.floor(n); return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n); }

// ---- kingdom
const land = (lv = S.castle) => D.CASTLE[lv].land;                // side of the cleared square, in tiles
const landStart = (lv = S.castle) => (D.GRID - land(lv)) / 2;     // first cleared tile (the square is centred on the castle)
const cleared = (x, y, lv = S.castle) => { const o = landStart(lv), n = land(lv); return x >= o && y >= o && x < o + n && y < o + n; };
const limitOf = type => { const b = D.BUILDINGS[type]; if (b.decor) return 99; if (b.unique) return 1; return D.CASTLE[S.castle].limit[type] || 0; };
const countOf = type => S.buildings.filter(b => b.type === type).length;
const cozy = (s = S) => s.buildings.reduce((sum, b) => sum + (D.BUILDINGS[b.type].cozy || 0) * (b.lv || 1), 0) + s.castle * 10;
const buildCost = type => { const b = D.BUILDINGS[type], n = countOf(type); const out = {}; for (const [k, v] of Object.entries(b.cost || {})) out[k] = Math.round(v * (b.decor ? 1 : Math.pow(1.6, n))); return out; };
const upgradeCost = b => { const def = D.BUILDINGS[b.type]; if (b.type === 'castle') return D.CASTLE[S.castle].cost; const out = {}; for (const [k, v] of Object.entries(def.cost || {})) out[k] = Math.round(v * Math.pow(1.75, b.lv)); if (b.lv >= 3) out.butter = (out.butter || 0) + b.lv * 12; return out; };
const maxLevel = b => b.type === 'castle' ? D.CASTLE.length - 1 : Math.min(D.BUILDINGS[b.type].max || 1, S.castle + 2);
const rateOf = b => { const def = D.BUILDINGS[b.type]; return def.make ? def.rate * (1 + (b.lv - 1) * .55) : 0; };      // per minute
const capOf = b => { const def = D.BUILDINGS[b.type]; return def.make ? Math.round(def.cap * (1 + (b.lv - 1) * .7)) : 0; };
function stored(b) { const def = D.BUILDINGS[b.type]; if (!def.make) return 0; return Math.min(capOf(b), Math.floor((now() - b.at) / 60000 * rateOf(b))); }

function fits(type, x, y, ignoreId) {
  const size = D.BUILDINGS[type].size, o = landStart(), n = land();
  if (x < o || y < o || x + size > o + n || y + size > o + n) return false;
  return !S.buildings.some(b => { if (b.id === ignoreId) return false; const s = D.BUILDINGS[b.type].size; return x < b.x + s && x + size > b.x && y < b.y + s && y + size > b.y; });
}
function build(type, x, y) {
  const def = D.BUILDINGS[type];
  if (!def || def.fixed) return {error: 'That cannot be built.'};
  if (S.castle < (def.need || 1)) return {error: 'Needs Castle level ' + def.need + '.'};
  if (countOf(type) >= limitOf(type)) return {error: def.unique ? 'You already have one.' : 'Upgrade the Castle to build more.'};
  if (!fits(type, x, y)) return {error: 'No room there.'};
  if (!pay(buildCost(type))) return {error: 'Not enough resources.'};
  const b = {id: S.nextId++, type, x, y, lv: 1, at: now()};
  S.buildings.push(b); changed(); return {building: b};
}
function move(id, x, y) { const b = S.buildings.find(q => q.id === id); if (!b || !fits(b.type, x, y, id)) return false; b.x = x; b.y = y; changed(); return true; }
function remove(id) { const b = S.buildings.find(q => q.id === id); if (!b || D.BUILDINGS[b.type].fixed) return false; S.buildings = S.buildings.filter(q => q.id !== id); const back = {}; for (const [k, v] of Object.entries(D.BUILDINGS[b.type].cost || {})) back[k] = Math.round(v * .5); give(back); return true; }
function collect(id) {
  const b = S.buildings.find(q => q.id === id); if (!b) return null;
  const amount = stored(b); if (amount < 1) return null;
  const kind = D.BUILDINGS[b.type].make; b.at = now(); S.stats.collected++; give({[kind]: amount}); return {kind, amount};
}
function upgrade(id) {
  const b = S.buildings.find(q => q.id === id); if (!b) return {error: 'Missing building.'};
  if (b.lv >= maxLevel(b)) return {error: b.type === 'castle' ? 'The Castle is at its top level.' : 'Upgrade the Castle first.'};
  const keep = stored(b);
  if (!pay(upgradeCost(b))) return {error: 'Not enough resources.'};
  b.lv++; if (b.type === 'castle') { S.castle = b.lv; S.res.gems += 50; }
  if (D.BUILDINGS[b.type].make) b.at = now() - keep / rateOf(b) * 60000;    // keep what was already made
  changed(); return {building: b};
}

// ---- cats
const owned = id => S.cats[id];
const stats = id => D.catStats(id, S.cats[id]);
const teamPower = () => S.team.filter(Boolean).reduce((sum, id) => sum + stats(id).power, 0);
function levelUp(id) {
  const c = S.cats[id]; if (!c) return {error: 'You do not have that sweet yet.'};
  if (c.lv >= D.MAX_LEVEL) return {error: 'Top level!'};
  if (!pay({jam: D.levelCost(c.lv)})) return {error: 'Not enough jam.'};
  c.lv++; changed(); return {lv: c.lv};
}
function setTeam(slot, id) {
  if (id) { const at = S.team.indexOf(id); if (at >= 0) S.team[at] = S.team[slot]; }
  S.team[slot] = id || null; changed();
}
function toggleTeam(id) {
  const at = S.team.indexOf(id);
  if (at >= 0) { if (S.team.filter(Boolean).length <= 1) return {error: 'Your team needs at least one sweet.'}; S.team[at] = null; changed(); return {out: true}; }
  const free = S.team.indexOf(null); if (free < 0) return {error: 'Your team is full. Tap a team member to remove it first.'};
  S.team[free] = id; changed(); return {in: true};
}

// ---- Magic Oven
function rollOne() {
  S.pity++; S.stats.draws++;
  const odds = D.GACHA.odds; let r = Math.random() * 100, rarity = 'common';
  if (S.pity >= D.GACHA.pity) rarity = Math.random() < .1 ? 'special' : 'epic';
  else if ((r -= odds.special) < 0) rarity = 'special';
  else if ((r -= odds.epic) < 0) rarity = 'epic';
  else if ((r -= odds.rare) < 0) rarity = 'rare';
  if (rarity === 'epic' || rarity === 'special') S.pity = 0;
  const pool = Object.keys(D.CATS).filter(id => D.CATS[id].rarity === rarity);
  const id = pool[Math.floor(Math.random() * pool.length)];
  const have = S.cats[id];
  if (!have) { S.cats[id] = {lv: 1, stars: 0}; return {id, rarity, isNew: true}; }
  if (have.stars < 5) { have.stars++; return {id, rarity, starUp: have.stars}; }
  const jam = D.dupeJam[rarity]; S.res.jam += jam; return {id, rarity, jam};
}
function draw(times) {
  const cost = times === 10 ? D.GACHA.cost10 : D.GACHA.cost1;
  if (!S.buildings.some(b => b.type === 'well')) return {error: 'Build the Magic Oven first.'};
  if (!pay({gems: cost})) return {error: 'Not enough gems.'};
  const results = []; for (let i = 0; i < times; i++) results.push(rollOne());
  changed(); return {results};
}

// ---- stages
const stageKey = (w, s) => w + '-' + s;
const starsOf = (w, s) => S.stars[stageKey(w, s)] || 0;
function stageOpen(w, s) { if (w === 0 && s === 0) return true; return s > 0 ? starsOf(w, s - 1) > 0 : starsOf(w - 1, D.EPISODES[w - 1].levels - 1) > 0; }
const episodeDone = w => starsOf(w, D.EPISODES[w].levels - 1) > 0;
const episodeStars = w => { let n = 0; for (let i = 0; i < D.EPISODES[w].levels; i++) n += starsOf(w, i); return n; };
function finishStage(w, s, stars) {
  const info = D.stageInfo(w, s), first = !starsOf(w, s), best = Math.max(starsOf(w, s), stars);
  const gain = Object.assign({}, info.reward);
  if (!first) for (const k of Object.keys(gain)) gain[k] = Math.round(gain[k] * .5);
  if (first) gain.gems = info.firstGems;
  if (stars === 3 && starsOf(w, s) < 3) gain.gems = (gain.gems || 0) + 20;
  S.stars[stageKey(w, s)] = best; S.stats.wins++;
  // finishing an episode for the first time can bring a new friend along
  let friend = null; const gift = D.EPISODES[w].gift;
  if (first && info.boss && gift && !S.cats[gift]) { S.cats[gift] = {lv: Math.max(1, Math.round(info.n / 4)), stars: 0}; friend = gift; const free = S.team.indexOf(null); if (free >= 0) S.team[free] = gift; }
  give(gain); return {gain, first, best, friend, episodeDone: first && !!info.boss};
}

// ---- goals and the daily gift
function currentGoal() { while (S.goal < D.GOALS.length && S.goalsPaid[D.GOALS[S.goal].id]) S.goal++; return D.GOALS[S.goal] || null; }
function goalDone() { const g = currentGoal(); return !!g && g.check(S); }
function claimGoal() { const g = currentGoal(); if (!g || !g.check(S)) return null; S.goalsPaid[g.id] = 1; S.goal++; give({gems: g.gems}); return g; }
function dailyGift() {
  const today = new Date().toISOString().slice(0, 10); if (S.daily.day === today) return null;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  S.daily.streak = S.daily.day === y ? Math.min(7, S.daily.streak + 1) : 1; S.daily.day = today;
  const gain = {gems: 20 + S.daily.streak * 10, sugar: 200 * S.daily.streak, jam: 30 * S.daily.streak};
  give(gain); return {gain, streak: S.daily.streak};
}

window.CK = {
  get state() { return S; }, load, save, reset, onChange: fn => listeners.add(fn), changed,
  canPay, pay, give, costText, fmt,
  land, landStart, cleared, limitOf, countOf, cozy, buildCost, upgradeCost, maxLevel, rateOf, capOf, stored, fits, build, move, remove, collect, upgrade,
  owned, stats, teamPower, levelUp, setTeam, toggleTeam, draw,
  starsOf, stageOpen, episodeDone, episodeStars, finishStage, currentGoal, goalDone, claimGoal, dailyGift
};
})();
