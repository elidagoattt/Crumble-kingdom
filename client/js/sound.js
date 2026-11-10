/* Crumble Kingdom: sounds.
 * Short effects and the cosy soundtrack are made with the Web Audio API, so no sound files are needed.
 * To use your own music, put `music-kingdom.mp3` and/or `music-battle.mp3` in client/assets/.
 */
(() => {
'use strict';
let ctx = null, music = null, musicName = '';
const on = () => window.CK?.state?.settings?.sound !== false;
function audio() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (ctx.state === 'suspended') ctx.resume(); return ctx; }

function tone(freq, dur, type = 'sine', vol = .12, slide = 0, delay = 0) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), v = a.createGain(), t = a.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(vol, t + .01); v.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(v).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
const SOUNDS = {
  tap: () => tone(520, .06, 'triangle', .08),
  collect: () => { tone(660, .08, 'triangle'); tone(990, .12, 'triangle', .1, 0, .06); },
  build: () => { tone(220, .1, 'square', .07); tone(330, .1, 'square', .07, 0, .08); tone(440, .16, 'square', .07, 0, .16); },
  hit: () => tone(180, .05, 'square', .04, -60),
  pop: () => tone(420, .09, 'triangle', .08, -200),
  skill: () => { tone(440, .1, 'sawtooth', .07, 400); tone(880, .2, 'triangle', .08, 0, .08); },
  boom: () => tone(120, .35, 'sawtooth', .13, -70),
  warn: () => { tone(300, .12, 'square', .07); tone(300, .12, 'square', .07, 0, .18); },
  faint: () => tone(330, .3, 'triangle', .09, -200),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', .11, 0, i * .11)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, .28, 'triangle', .1, 0, i * .16)),
  draw: () => [392, 494, 587, 784].forEach((f, i) => tone(f, .14, 'sine', .1, 0, i * .07)),
  rare: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .25, 'triangle', .11, 0, i * .08)),
  level: () => { tone(587, .1, 'triangle'); tone(880, .2, 'triangle', .11, 0, .09); },
  error: () => tone(160, .14, 'square', .06)
};
function play(name) { if (on()) try { SOUNDS[name]?.(); } catch { /* sound is never worth a crash */ } }

// ---------------------------------------------------------------- music
/* The soundtrack is played live from the note lists below (an original tune for each screen), so there are no
 * music files to load. A file in client/assets/ named music-kingdom.mp3 or music-battle.mp3 replaces that tune. */
const R = null;
const TUNES = {
  kingdom: {bpm: 84, vol: .5,
    chords: [[48,52,55],[45,48,52],[41,45,48],[43,47,50],[48,52,55],[45,48,52],[41,45,48],[43,47,50],[41,45,48],[43,47,50],[40,43,47],[45,48,52],[41,45,48],[43,47,50],[48,52,55],[48,52,55]],
    melody: [[76,R,79,R,84,R,79,76],[81,R,76,R,72,R,76,R],[77,R,81,R,84,R,81,77],[79,R,74,R,71,R,74,R],[76,79,84,R,88,R,84,79],[81,R,84,R,81,76,72,R],[77,R,76,R,74,R,72,R],[74,R,71,R,67,R,R,R],
             [72,77,81,R,84,R,81,R],[74,79,83,R,86,R,83,R],[76,R,79,R,83,R,79,R],[81,R,84,R,88,R,84,R],[84,R,81,R,77,R,81,R],[83,R,79,R,74,R,79,R],[84,R,79,R,76,R,72,R],[72,R,R,R,R,R,R,R]]},
  battle: {bpm: 132, vol: .42, drive: true,
    chords: [[45,48,52],[41,45,48],[48,52,55],[43,47,50],[45,48,52],[41,45,48],[40,44,47],[40,44,47]],
    melody: [[69,72,76,72,81,76,72,76],[69,72,77,72,81,77,72,77],[67,72,76,72,79,76,72,76],[67,71,74,71,79,74,71,74],[81,R,84,81,76,R,81,R],[77,R,81,77,72,R,77,R],[76,R,80,76,71,R,76,80],[83,R,80,R,76,R,R,R]]}
};
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let master = null, timer = 0, tune = null, step = 0, nextAt = 0;
const musicOn = () => on() && window.CK?.state?.settings?.music !== false;

function voice(freq, at, dur, type, vol, attack) {
  const o = ctx.createOscillator(), v = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  v.gain.setValueAtTime(0.0001, at); v.gain.linearRampToValueAtTime(vol, at + (attack || .01)); v.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(v).connect(master); o.start(at); o.stop(at + dur + .05);
}
function tick(at, len, soft) {      // a tiny brush of noise for rhythm
  const n = Math.floor(ctx.sampleRate * len), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource(), v = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
  src.buffer = buf; v.gain.value = soft; src.connect(f).connect(v).connect(master); src.start(at);
}
function schedule() {
  if (!tune || !ctx) return;
  const eighth = 60 / tune.bpm / 2;
  while (nextAt < ctx.currentTime + .25) {
    const bar = Math.floor(step / 8) % tune.melody.length, pos = step % 8, chord = tune.chords[bar], note = tune.melody[bar][pos];
    if (note != null) { voice(hz(note), nextAt, tune.drive ? .32 : .9, 'triangle', .16); voice(hz(note + 12), nextAt, .35, 'sine', .05); }      // music box
    if (pos === 0) chord.forEach((m, i) => { voice(hz(m + 12), nextAt, eighth * 8.2, 'sine', .05, .25); voice(hz(m + 12) * 1.004, nextAt, eighth * 8.2, 'sine', .035, .3); });   // warm pad
    if (tune.drive) { voice(hz(chord[0] - 12), nextAt, eighth * .9, 'triangle', pos % 2 ? .1 : .16); if (pos % 4 === 0) voice(110, nextAt, .12, 'sine', .22); if (pos % 4 === 2) tick(nextAt, .09, .1); else tick(nextAt, .03, .035); }
    else { if (pos === 0 || pos === 4) voice(hz(chord[0] - 12), nextAt, eighth * 3.6, 'sine', .16, .02); if (pos === 2 || pos === 6) voice(hz(chord[pos === 2 ? 1 : 2]), nextAt, eighth * 1.6, 'sine', .06); if (pos % 2) tick(nextAt, .03, .018); }
    nextAt += eighth; step++;
  }
}
function stopMusic() { clearInterval(timer); timer = 0; tune = null; if (music) { music.pause(); music = null; } if (master && ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, .15); } }
function setMusic(name) {
  if (name === musicName && (tune || music)) return;
  stopMusic(); musicName = name;
  if (!name || !musicOn()) return;
  if (window.CKArt?.hasFile?.('music-' + name + '.mp3')) { music = new Audio('assets/music-' + name + '.mp3'); music.loop = true; music.volume = .45; music.play().catch(() => {}); return; }
  const a = audio(); if (!a || !TUNES[name]) return;
  master = a.createGain(); master.gain.value = 0; master.gain.setTargetAtTime(TUNES[name].vol, a.currentTime, .4); master.connect(a.destination);
  tune = TUNES[name]; step = 0; nextAt = a.currentTime + .1; timer = setInterval(schedule, 60); schedule();
}
function refreshMusic() { const n = musicName; musicName = ''; setMusic(n); }
document.addEventListener('visibilitychange', () => { if (document.hidden) { const n = musicName; stopMusic(); musicName = n; } else if (musicName) refreshMusic(); });
window.CKSound = {play, setMusic, refreshMusic, stopMusic, unlock: audio};
})();
