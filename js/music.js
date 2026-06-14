/* ===== Music ===== *
 * Plays real MP3s from assets/music/ if present; otherwise synthesizes a soft
 * ambient bed with the Web Audio API so there's always sound. One module, used
 * by the montage and the nav toggle.                                           */
(function () {
  const FILES = [
    "assets/music/my-body-is-a-cage.mp3",
    "assets/music/a-thousand-years.mp3",
    "assets/music/my-immortal.mp3",
  ];

  let mode = null;          // 'file' | 'synth'
  let playing = false;
  let targetVol = 0.85;

  /* ---- file mode ---- */
  const audio = new Audio();
  audio.loop = false;
  let trackIdx = 0;
  audio.addEventListener("ended", () => { trackIdx = (trackIdx + 1) % FILES.length; audio.src = FILES[trackIdx]; audio.play().catch(()=>{}); });

  let haveFiles = false;
  // probe first file (HEAD); browsers may not allow HEAD on static, so fall back to load test
  fetch(FILES[0], { method: "HEAD" }).then(r => { haveFiles = r.ok; }).catch(() => { haveFiles = false; });

  /* ---- synth mode (ambient pad) ---- */
  let ctx, master, voices = [], chordTimer;
  // A minor-ish, slow and tender:  Am  F  C  G   (root, third, fifth — low octave)
  const CHORDS = [
    [110.00, 130.81, 164.81],   // Am  (A2 C3 E3)
    [ 87.31, 110.00, 130.81],   // F   (F2 A2 C3)
    [ 98.00, 130.81, 164.81],   // C/G (G2 C3 E3)
    [ 98.00, 123.47, 146.83],   // G   (G2 B2 D3)
  ];
  let chordIdx = 0;

  function buildSynth() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    // gentle space: feedback delay
    const delay = ctx.createDelay(); delay.delayTime.value = 0.38;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const wet = ctx.createGain(); wet.gain.value = 0.25;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);
    master.connect(ctx.destination); master.connect(delay);
    // soft low-pass over everything
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100; lp.Q.value = 0.6;
    lp.connect(master);
    // 3 detuned voices
    voices = CHORDS[0].map((f) => {
      const o1 = ctx.createOscillator(); o1.type = "sine";     o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = f; o2.detune.value = 6;
      const g = ctx.createGain(); g.gain.value = 0.16;
      o1.connect(g); o2.connect(g); g.connect(lp);
      o1.start(); o2.start();
      return { o1, o2, g };
    });
    // slow shimmer LFO on filter
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 350;
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency); lfo.start();
    scheduleChords();
  }
  function scheduleChords() {
    chordTimer = setInterval(() => {
      chordIdx = (chordIdx + 1) % CHORDS.length;
      const c = CHORDS[chordIdx];
      voices.forEach((v, i) => {
        const t = ctx.currentTime;
        v.o1.frequency.setTargetAtTime(c[i], t, 1.2);
        v.o2.frequency.setTargetAtTime(c[i], t, 1.2);
      });
    }, 8000);
  }

  function rampMaster(to, secs = 2.2) {
    if (!ctx) return;
    master.gain.setTargetAtTime(to, ctx.currentTime, secs / 3);
  }

  /* ---- public API ---- */
  function play() {
    if (playing) return;
    playing = true;
    if (haveFiles) {
      mode = "file";
      if (!audio.src) audio.src = FILES[trackIdx];
      audio.volume = 0;
      audio.play().then(() => fadeFile(targetVol)).catch(() => { mode = "synth"; ensureSynth(); });
    } else {
      mode = "synth"; ensureSynth();
    }
    updateBtn();
  }
  function ensureSynth() {
    if (!ctx) buildSynth(); else if (ctx.state === "suspended") ctx.resume();
    rampMaster(targetVol);
  }
  function fadeFile(to) {
    let v = audio.volume;
    const id = setInterval(() => { v = Math.min(to, v + 0.04); audio.volume = v; if (v >= to) clearInterval(id); }, 110);
  }
  function pause() {
    playing = false;
    if (mode === "file") audio.pause();
    if (mode === "synth") rampMaster(0);
    updateBtn();
  }
  function toggle() { playing ? pause() : play(); }
  function setVolume(v) { targetVol = v; if (mode === "file") audio.volume = v; if (mode === "synth") rampMaster(v); }

  function updateBtn() {
    const b = document.getElementById("musicToggle");
    if (b) { b.classList.toggle("on", playing); b.textContent = playing ? "♪" : "♪"; }
  }

  window.Music = { play, pause, toggle, setVolume, get playing() { return playing; }, get usingFiles() { return haveFiles; } };
})();
