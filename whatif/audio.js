// What If? Studio: sound. A quiet lofi loop and small sound effects, all made with WebAudio (no files).
// Everything goes to the speakers and to a recording stream, so exported videos have sound too.
(function () {
  let ac = null, master, musicBus, sfxBus, recDest, noiseBuf, timer = null;
  let musicOn = true, nextBeat = 0, beat = 0;
  const BPM = 74, SPB = 60 / BPM;
  const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; // Fmaj7, Em7, Dm7, Cmaj7
  const BASS = [41, 40, 38, 36];
  const MEL = [[72, 0], [69, 1.5], [67, 2.5], null, [71, 0.5], [67, 2], null, [64, 1], [65, 0], [69, 1], [72, 2.5], null, [67, 0.5], [64, 2], [62, 3], null];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    ac = new C();
    master = ac.createGain(); master.gain.value = 0.9;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ac.destination);
    try { recDest = ac.createMediaStreamDestination(); comp.connect(recDest); } catch (e) { recDest = null; }
    musicBus = ac.createGain(); musicBus.gain.value = 0.16;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    musicBus.connect(lp); lp.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    crackle();
    nextBeat = ac.currentTime + 0.1;
    timer = setInterval(schedule, 50);
  }

  // ---------- lofi building blocks ----------
  function keys(m, t, len, vol) {
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500;
    for (const [type, mul, v] of [['sine', 1, 1], ['triangle', 2, 0.25]]) { const o = ac.createOscillator(); o.type = type; o.frequency.value = hz(m) * mul; o.detune.value = (Math.random() - 0.5) * 10; const og = ac.createGain(); og.gain.value = v; o.connect(og); og.connect(f); o.start(t); o.stop(t + len + 0.05); }
    f.connect(g); g.connect(musicBus);
  }
  function bass(m, t, len) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m); const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.55, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + len + 0.05); }
  function kick(t) { const o = ac.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); const g = ac.createGain(); g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.4); }
  function noise(t, len, freq, q, vol, type = 'bandpass', bus) { const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len); s.connect(f); f.connect(g); g.connect(bus || musicBus); s.start(t, Math.random()); s.stop(t + len + 0.05); return f; }
  function crackle() { // soft vinyl hiss under the music
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000; const g = ac.createGain(); g.gain.value = 0.025; s.connect(f); f.connect(g); g.connect(musicBus); s.start();
  }

  function schedule() {
    if (!ac) return;
    while (nextBeat < ac.currentTime + 0.25) {
      if (musicOn) playBeat(beat, nextBeat);
      nextBeat += SPB; beat++;
    }
  }
  function playBeat(b, t) {
    const bar = Math.floor(b / 4) % 4, pos = b % 4;
    const swing = SPB * 0.58;
    if (pos === 0) { for (const m of CHORDS[bar]) keys(m, t + Math.random() * 0.03, SPB * 3.6, 0.09); bass(BASS[bar], t, SPB * 1.8); }
    if (pos === 2) { for (const m of CHORDS[bar]) keys(m + 12, t + SPB * 0.5 + Math.random() * 0.02, SPB * 1.4, 0.035); bass(BASS[bar] + 7, t, SPB * 1.2); }
    if (pos === 0 || (pos === 2 && b % 8 === 6)) kick(t);
    if (pos === 1 || pos === 3) noise(t, 0.22, 1800, 0.8, 0.22);
    noise(t, 0.05, 8000, 1, 0.08, 'highpass'); noise(t + swing, 0.04, 8000, 1, 0.05, 'highpass');
    const mel = MEL[(Math.floor(b / 4)) % MEL.length];
    if (mel && pos === Math.floor(mel[1])) keys(mel[0], t + (mel[1] % 1) * SPB, SPB * 2, 0.06);
  }

  // ---------- sound effects ----------
  function tone(type, f0, f1, len, vol, t) { t = t || ac.currentTime; const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len); const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + len + 0.05); }
  const FX = {
    pop() { tone('sine', 380, 900, 0.09, 0.5); },
    click() { tone('triangle', 1200, 700, 0.05, 0.25); },
    tick() { tone('sine', 900, 1300, 0.05, 0.22); },
    whoosh() { const f = noise(ac.currentTime, 0.4, 400, 1.2, 0.5, 'bandpass', sfxBus); f.frequency.exponentialRampToValueAtTime(3500, ac.currentTime + 0.35); },
    ding() { const t = ac.currentTime; for (const [m, d] of [[84, 0], [88, 0.09]]) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m); const g = ac.createGain(); g.gain.setValueAtTime(0.35, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.8); o.connect(g); g.connect(sfxBus); o.start(t + d); o.stop(t + d + 0.9); } },
    boing() { const t = ac.currentTime; const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.12); o.frequency.exponentialRampToValueAtTime(260, t + 0.35); const l = ac.createOscillator(); l.frequency.value = 18; const lg = ac.createGain(); lg.gain.value = 40; l.connect(lg); lg.connect(o.frequency); const g = ac.createGain(); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45); o.connect(g); g.connect(sfxBus); o.start(t); l.start(t); o.stop(t + 0.5); l.stop(t + 0.5); },
    trash() { tone('sawtooth', 300, 80, 0.18, 0.15); },
    done() { const t = ac.currentTime; [72, 76, 79, 84].forEach((m, i) => { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m); const g = ac.createGain(); g.gain.setValueAtTime(0.25, t + i * 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.4); o.connect(g); g.connect(sfxBus); o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.45); }); },
  };
  let sfxOn = true;
  function sfx(name) { if (!ac || !sfxOn || !FX[name]) return; try { FX[name](); } catch (e) {} }

  window.Sound = {
    init, sfx,
    setMusic(on) { musicOn = on; if (ac) { musicBus.gain.cancelScheduledValues(ac.currentTime); musicBus.gain.setTargetAtTime(on ? 0.16 : 0, ac.currentTime, 0.2); } },
    setSfx(on) { sfxOn = on; },
    get musicOn() { return musicOn; },
    get sfxOn() { return sfxOn; },
    stream() { return recDest ? recDest.stream : null; },
  };
})();
