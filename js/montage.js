/* ===== "To Vivienne, With Love" — cinematic opening montage ===== *
 * Autoplay slideshow with Ken Burns + words, started by one tap (so audio is allowed).
 * Slides are easy to edit — swap images (full-res later) and words freely.            */

const SLIDES = [
  { img: "download.jpeg",            lines: ["To Vivienne,", "With Love"], big: true },
  { img: "montage/thumbs/0065.jpg",  lines: ["It began quietly —", "you, me, and two cats", "sure the place was theirs."] },
  { img: "montage/thumbs/0174.jpg",  lines: ["I didn't know then", "these were the best days", "of my life."] },
  { img: "montage/thumbs/0226.jpg",  lines: ["We went looking for the world,", "and found it in each other."] },
  { img: "montage/thumbs/0252.jpg",  lines: ["We made a home.", "None of it was loud.", "All of it was everything."] },
  { img: "montage/thumbs/0547.jpg",  lines: ["The day Augustine arrived,", "I watched you become a mother —", "and loved you more than ever."] },
  { img: "montage/thumbs/0610.jpg",  lines: ["A family.", "The thing I want most", "in this world."] },
  { img: "montage/thumbs/0488.jpg",  lines: ["You loved them like family —", "Loki, especially —", "because that's what they were."] },
  { img: "montage/thumbs/0780.jpg",  lines: ["Every ordinary day with you", "was the whole point."] },
  { img: "montage/thumbs/0743.jpg",  lines: ["Sober now. Clear now.", "And what I see is you."] },
  { img: "download.jpeg",            lines: ["Come home.", "I'm here.", "I'm not going anywhere."], big: true },
];

const SLIDE_MS = 6000;

const stage   = document.getElementById("montage");
const enterEl = document.getElementById("enter");
const layerA  = document.getElementById("mlayerA");
const layerB  = document.getElementById("mlayerB");
const textEl  = document.getElementById("mtext");
const skipEl  = document.getElementById("mskip");

let idx = 0, timer = null, front = layerA, back = layerB, running = false;

function paint(slide, layer) {
  layer.style.backgroundImage = `url("${slide.img}")`;
  layer.classList.remove("kb1", "kb2");
  void layer.offsetWidth;
  layer.classList.add(idx % 2 ? "kb1" : "kb2");
}
function showText(slide) {
  textEl.classList.remove("show");
  textEl.className = "montage__text" + (slide.big ? " montage__text--big" : "");
  textEl.innerHTML = slide.lines.map(l => `<span>${l}</span>`).join("");
  void textEl.offsetWidth;
  setTimeout(() => textEl.classList.add("show"), 350);
}
function step() {
  const slide = SLIDES[idx];
  paint(slide, back);
  back.style.opacity = 1; front.style.opacity = 0;
  [front, back] = [back, front];
  showText(slide);
  idx++;
  timer = setTimeout(idx >= SLIDES.length ? end : step, SLIDE_MS);
}
function play() {
  if (running) return;
  running = true;
  enterEl.classList.add("gone");
  stage.classList.add("playing");
  document.body.classList.remove("montage-done");
  if (window.Music) window.Music.play();
  idx = 0; front = layerA; back = layerB; step();
}
function end() {
  clearTimeout(timer);
  running = false;
  stage.classList.add("done");
  document.body.classList.add("montage-done");
  setTimeout(() => { stage.classList.remove("playing", "done"); }, 1400);
  if (location.hash === "#montage" || location.hash === "") location.hash = "#vivienne";
}
function reset() {        // show the gate again (for replays from the menu)
  clearTimeout(timer); running = false;
  stage.classList.remove("playing", "done");
  enterEl.classList.remove("gone");
}
function stop() {         // leave the montage without showing the gate (navigating away)
  clearTimeout(timer); running = false;
  stage.classList.remove("playing", "done");
}

document.getElementById("enterBtn").addEventListener("click", play);
skipEl.addEventListener("click", e => { e.stopPropagation(); end(); });
document.addEventListener("keydown", e => { if (!running && !enterEl.classList.contains("gone") && (e.key === "Enter" || e.key === " ")) play(); });

window.Montage = { play, reset, stop, end, get running() { return running; } };
