/* ===== Music — streams the real songs via the YouTube IFrame API ===== *
 * Tracks (in order):
 *   1. My Body Is a Cage — Peter Gabriel
 *   2. A Thousand Years   — Christina Perri
 *   3. My Immortal        — Evanescence
 * Plays the actual recordings from YouTube (no files to host). A tiny synth
 * bed is kept only as a last-ditch fallback if YouTube can't embed at all.   */
(function () {
  const TRACKS = [
    { id: "bJwiLFhVlCM", title: "My Body Is a Cage — Peter Gabriel" },
    { id: "rtOvBOTyX00", title: "A Thousand Years — Christina Perri" },
    { id: "5anLPw0Efmo", title: "My Immortal — Evanescence" },
  ];
  const VOL = 65;

  let yt = null, ytReady = false, playing = false, pending = false, idx = 0, errs = 0, usingSynth = false;

  /* ---- inject YouTube IFrame API + hidden player host ---- */
  const host = document.createElement("div");
  host.id = "ytplayer";
  host.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none";
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(host));
  if (document.body) document.body.appendChild(host);
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = function () {
    yt = new YT.Player("ytplayer", {
      height: "1", width: "1",
      playerVars: { playsinline: 1, controls: 0, disablekb: 1 },
      events: {
        onReady: () => { ytReady = true; yt.setVolume(VOL); if (pending) { pending = false; startYT(); } },
        onError: () => skipBroken(),
        onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) next(); },
      },
    });
  };

  function startYT() {
    try {
      usingSynth = false; stopSynth();
      yt.loadVideoById(TRACKS[idx].id);
      yt.setVolume(0); yt.playVideo();
      fadeYT(VOL);
      label(); updateBtn();
    } catch (_) { synthStart(); }
  }
  function fadeYT(to) {
    let v = 0; const t = setInterval(() => { v = Math.min(to, v + 4); try { yt.setVolume(v); } catch (_) {} if (v >= to) clearInterval(t); }, 120);
  }
  function next() { idx = (idx + 1) % TRACKS.length; errs = 0; if (playing && ytReady) startYT(); }
  function skipBroken() {            // a video can't embed → try the next; if all fail → synth
    errs++;
    if (errs >= TRACKS.length) { synthStart(); return; }
    idx = (idx + 1) % TRACKS.length;
    if (playing) startYT();
  }

  /* ---- public API ---- */
  function play() {
    if (playing) return; playing = true;
    if (ytReady) startYT(); else { pending = true; }   // will start the instant the API is ready
    updateBtn();
  }
  function pause() {
    playing = false;
    try { yt && yt.pauseVideo(); } catch (_) {}
    if (usingSynth) stopSynth();
    updateBtn();
  }
  function toggle() { playing ? pause() : play(); }
  function setVolume(v) { try { yt && yt.setVolume(Math.round(v)); } catch (_) {} synthVol(v / 100); }
  function selectTrack(i) { idx = i % TRACKS.length; if (playing) startYT(); }

  function label() {
    const el = document.getElementById("musicTrack");
    if (el) el.textContent = TRACKS[idx].title;
  }
  function updateBtn() {
    const b = document.getElementById("musicToggle");
    if (b) { b.classList.toggle("on", playing); }
  }

  /* ================= synth fallback (only if YouTube is fully blocked) ================= */
  let ctx, master, voices = [], chordTimer, chordIdx = 0;
  const CHORDS = [[110, 130.81, 164.81], [87.31, 110, 130.81], [98, 130.81, 164.81], [98, 123.47, 146.83]];
  function synthStart() {
    usingSynth = true;
    if (!ctx) buildSynth(); else if (ctx.state === "suspended") ctx.resume();
    master && master.gain.setTargetAtTime(0.8, ctx.currentTime, 0.8);
    const el = document.getElementById("musicTrack"); if (el) el.textContent = "(ambient — YouTube blocked embedding)";
  }
  function stopSynth() { if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.4); }
  function synthVol(v) { if (ctx && master && usingSynth) master.gain.setTargetAtTime(v, ctx.currentTime, 0.5); }
  function buildSynth() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100;
    lp.connect(master); master.connect(ctx.destination);
    voices = CHORDS[0].map((f) => {
      const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = f; o2.detune.value = 6;
      const g = ctx.createGain(); g.gain.value = 0.16; o1.connect(g); o2.connect(g); g.connect(lp);
      o1.start(); o2.start(); return { o1, o2 };
    });
    chordTimer = setInterval(() => {
      chordIdx = (chordIdx + 1) % CHORDS.length; const c = CHORDS[chordIdx];
      voices.forEach((v, i) => { v.o1.frequency.setTargetAtTime(c[i], ctx.currentTime, 1.2); v.o2.frequency.setTargetAtTime(c[i], ctx.currentTime, 1.2); });
    }, 8000);
  }

  window.Music = { play, pause, toggle, setVolume, selectTrack, TRACKS, get playing() { return playing; } };
})();
