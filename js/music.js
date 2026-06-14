/* ===== Music — streams the real songs via the YouTube IFrame API ===== *
 * Each song has fallback uploads; if one can't embed, it tries the next,
 * then the next song, and only synthesizes a bed if YouTube fails entirely. */
(function () {
  const TRACKS = [
    { title: "My Body Is a Cage — Peter Gabriel", ids: ["bJwiLFhVlCM", "dTZQ2IB_x7c", "SrstRzBSS6E"] },
    { title: "A Thousand Years — Christina Perri", ids: ["rtOvBOTyX00", "sYeRlr5xxfg", "NZGHXy1IAHM"] },
    { title: "My Immortal — Evanescence",          ids: ["5anLPw0Efmo", "A1mPY9z4kvQ", "ANbyXGc0z4U"] },
  ];
  const VOL = 65;

  let yt = null, ytReady = false, playing = false, pending = false;
  let idx = 0, cand = 0, deadSongs = 0, usingSynth = false, loadedId = null, watch = null;

  const host = document.createElement("div");
  host.id = "ytplayer";
  // MUST stay within the viewport or YouTube refuses to play; keep it tiny + nearly invisible.
  host.style.cssText = "position:fixed;right:2px;bottom:2px;width:2px;height:2px;opacity:.01;z-index:0;pointer-events:none;overflow:hidden";
  (document.body || document.documentElement).appendChild(host);
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = function () {
    yt = new YT.Player("ytplayer", {
      height: "1", width: "1",
      playerVars: { playsinline: 1, controls: 0, disablekb: 1 },
      events: {
        onReady: () => {
          ytReady = true; yt.setVolume(VOL);
          try { yt.cueVideoById(TRACKS[0].ids[0]); loadedId = TRACKS[0].ids[0]; } catch (_) {}  // pre-buffer track 1
          if (pending) { pending = false; startYT(); }
        },
        onError: () => tryNextCandidate(),
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) { clearTimeout(watch); }   // it's really playing → cancel fallback
          if (e.data === YT.PlayerState.ENDED) nextSong();
        },
      },
    });
  };

  function startYT() {
    try {
      usingSynth = false; stopSynth();
      const want = TRACKS[idx].ids[cand];
      if (want !== loadedId) { yt.loadVideoById(want); loadedId = want; } else { yt.playVideo(); }
      if (want === loadedId) yt.playVideo();
      yt.setVolume(0); fadeYT(VOL); label(); updateBtn();
      clearTimeout(watch);
      watch = setTimeout(() => { try { if (yt.getPlayerState() !== 1) synthStart(); } catch (_) { synthStart(); } }, 3000);
    } catch (_) { synthStart(); }
  }
  function fadeYT(to) { let v = 0; const t = setInterval(() => { v = Math.min(to, v + 4); try { yt.setVolume(v); } catch (_) {} if (v >= to) clearInterval(t); }, 120); }
  function tryNextCandidate() {
    cand++;
    if (cand < TRACKS[idx].ids.length) { if (playing) startYT(); return; }   // try another upload of same song
    cand = 0; deadSongs++;
    if (deadSongs >= TRACKS.length) { synthStart(); return; }                 // every song blocked → ambient
    idx = (idx + 1) % TRACKS.length;
    if (playing) startYT();
  }
  function nextSong() { idx = (idx + 1) % TRACKS.length; cand = 0; deadSongs = 0; if (playing && ytReady) startYT(); }

  function play() { if (playing) return; playing = true; if (ytReady) startYT(); else pending = true; updateBtn(); }
  function pause() { playing = false; try { yt && yt.pauseVideo(); } catch (_) {} if (usingSynth) stopSynth(); updateBtn(); }
  function toggle() { playing ? pause() : play(); }
  function setVolume(v) { try { yt && yt.setVolume(Math.round(v)); } catch (_) {} synthVol(v / 100); }
  function selectTrack(i) { idx = i % TRACKS.length; cand = 0; deadSongs = 0; if (playing) startYT(); }

  function label() { const el = document.getElementById("musicTrack"); if (el) el.textContent = TRACKS[idx].title; }
  function updateBtn() { const b = document.getElementById("musicToggle"); if (b) b.classList.toggle("on", playing); }

  /* ---- synth fallback (only if YouTube is fully blocked) ---- */
  let ctx, master, voices = [], chordIdx = 0;
  const CHORDS = [[110, 130.81, 164.81], [87.31, 110, 130.81], [98, 130.81, 164.81], [98, 123.47, 146.83]];
  function synthStart() {
    usingSynth = true;
    if (!ctx) buildSynth(); else if (ctx.state === "suspended") ctx.resume();
    if (master) master.gain.setTargetAtTime(0.8, ctx.currentTime, 0.8);
    const el = document.getElementById("musicTrack"); if (el) el.textContent = "(ambient)";
  }
  function stopSynth() { if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.4); }
  function synthVol(v) { if (ctx && master && usingSynth) master.gain.setTargetAtTime(v, ctx.currentTime, 0.5); }
  function buildSynth() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100; lp.connect(master); master.connect(ctx.destination);
    voices = CHORDS[0].map((f) => {
      const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = f; o2.detune.value = 6;
      const g = ctx.createGain(); g.gain.value = 0.16; o1.connect(g); o2.connect(g); g.connect(lp);
      o1.start(); o2.start(); return { o1, o2 };
    });
    setInterval(() => { chordIdx = (chordIdx + 1) % CHORDS.length; const c = CHORDS[chordIdx];
      voices.forEach((v, i) => { v.o1.frequency.setTargetAtTime(c[i], ctx.currentTime, 1.2); v.o2.frequency.setTargetAtTime(c[i], ctx.currentTime, 1.2); }); }, 8000);
  }

  window.Music = { play, pause, toggle, setVolume, selectTrack, TRACKS, get playing() { return playing; } };
})();
