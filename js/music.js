/* ===== Music — streams real songs via the YouTube IFrame API ===== *
 * The active playlist (LIST) defaults to the love-story set; each section
 * montage swaps in its own playlist via Music.playList([...]). Each song has
 * fallback uploads; a synth bed is the last resort if YouTube fails entirely. */
(function () {
  const DEFAULT_TRACKS = [
    { title: "My Body Is a Cage — Peter Gabriel", ids: ["bJwiLFhVlCM", "dTZQ2IB_x7c", "SrstRzBSS6E"] },
    { title: "A Thousand Years — Christina Perri", ids: ["rtOvBOTyX00", "sYeRlr5xxfg", "NZGHXy1IAHM"] },
    { title: "My Immortal — Evanescence",          ids: ["5anLPw0Efmo", "A1mPY9z4kvQ", "ANbyXGc0z4U"] },
    { title: "Video — Aimee Mann",                  ids: ["WVgx5J0wFFk", "ACPG9_01srI", "bswSO5NtyNo"] },
  ];
  const VOL = 65;

  let yt = null, ytReady = false, playing = false, pending = false;
  let LIST = DEFAULT_TRACKS, idx = 0, cand = 0, deadSongs = 0, usingSynth = false, loadedId = null, watch = null;

  const host = document.createElement("div");
  host.id = "ytplayer";
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
          try { yt.cueVideoById(DEFAULT_TRACKS[0].ids[0]); loadedId = DEFAULT_TRACKS[0].ids[0]; } catch (_) {}
          if (pending) { pending = false; startCurrent(); }
        },
        onError: () => tryNextCandidate(),
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) clearTimeout(watch);
          if (e.data === YT.PlayerState.ENDED) nextSong();
        },
      },
    });
  };

  function startCurrent() {
    try {
      usingSynth = false; stopSynth();
      const want = LIST[idx].ids[cand];
      if (want !== loadedId) { yt.loadVideoById(want); loadedId = want; } else { yt.playVideo(); }
      if (want === loadedId) yt.playVideo();
      yt.setVolume(0); fadeYT(VOL); label(); updateBtn();
      clearTimeout(watch);
      watch = setTimeout(() => { try { if (yt.getPlayerState() !== 1) synthStart(); } catch (_) { synthStart(); } }, 3500);
    } catch (_) { synthStart(); }
  }
  function fadeYT(to) { let v = 0; const t = setInterval(() => { v = Math.min(to, v + 4); try { yt.setVolume(v); } catch (_) {} if (v >= to) clearInterval(t); }, 120); }
  function tryNextCandidate() {
    cand++;
    if (cand < LIST[idx].ids.length) { if (playing) startCurrent(); return; }
    cand = 0; deadSongs++;
    if (deadSongs >= LIST.length) { synthStart(); return; }
    idx = (idx + 1) % LIST.length;
    if (playing) startCurrent();
  }
  function nextSong() { idx = (idx + 1) % LIST.length; cand = 0; deadSongs = 0; if (playing && ytReady) startCurrent(); }

  function play() { if (playing) return; playing = true; if (ytReady) startCurrent(); else pending = true; updateBtn(); }
  function playList(tracks) {
    LIST = (tracks && tracks.length) ? tracks : DEFAULT_TRACKS;
    idx = 0; cand = 0; deadSongs = 0; playing = true;
    if (ytReady) startCurrent(); else pending = true;
    updateBtn();
  }
  function pause() { playing = false; try { yt && yt.pauseVideo(); } catch (_) {} if (usingSynth) stopSynth(); updateBtn(); }
  function toggle() { playing ? pause() : play(); }
  function setVolume(v) { try { yt && yt.setVolume(Math.round(v)); } catch (_) {} synthVol(v / 100); }

  function label() { const el = document.getElementById("musicTrack"); if (el) el.textContent = LIST[idx].title; }
  function updateBtn() { const b = document.getElementById("musicToggle"); if (b) b.classList.toggle("on", playing); }

  /* ---- synth fallback ---- */
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

  window.Music = { play, playList, pause, toggle, setVolume, DEFAULT_TRACKS, get playing() { return playing; } };
})();
