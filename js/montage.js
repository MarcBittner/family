/* ===== "To Vivienne, With Love" — cinematic opening montage ===== *
 * Autoplay slideshow with Ken Burns + words, started by one tap (so audio is allowed).
 * Slides are easy to edit — swap images (full-res later) and words freely.            */

const SLIDES = [
  { img: "download.jpeg",            lines: ["To Vivienne,", "With Love"], big: true },
  { img: "montage/thumbs/0065.jpg",  lines: ["Before everything,", "there was us."] },
  { img: "montage/thumbs/0089.jpg",  lines: ["Two people who found home", "in each other."] },
  { img: "montage/new/n16.jpg",      lines: [] },
  { img: "montage/thumbs/0174.jpg",  lines: ["I didn't know then", "these were the best days of my life.", "I know it now."] },
  { img: "montage/thumbs/0185.jpg",  lines: [] },
  { img: "montage/thumbs/0246.jpg",  lines: [] },
  { img: "montage/thumbs/0226.jpg",  lines: ["We went looking for the world,", "and kept finding you."] },
  { img: "montage/thumbs/0237.jpg",  lines: [] },
  { img: "montage/thumbs/0252.jpg",  lines: ["We built a life.", "Quiet mornings.", "Your hand in mine."] },
  { img: "montage/thumbs/0413.jpg",  lines: [] },
  { img: "montage/thumbs/0742.jpg",  lines: ["And one day,", "you married me."] },
  { img: "montage/thumbs/0741.jpg",  lines: [] },
  { img: "montage/thumbs/0488.jpg",  lines: ["You loved them like family —", "Loki most of all —", "because that's what they were."] },
  { img: "montage/thumbs/0547.jpg",  lines: ["Then Augustine.", "I watched you become a mother,", "and loved you more than I knew I could."] },
  { img: "montage/thumbs/0610.jpg",  lines: ["A family —", "the thing I want most", "in this world."] },
  { img: "montage/thumbs/0596.jpg",  lines: [] },
  { img: "montage/thumbs/0780.jpg",  lines: ["Every ordinary day with you two", "was the whole point."] },
  { img: "montage/thumbs/0743.jpg",  lines: ["I lost my way for a while.", "I won't hide from that,", "or ask you to carry it."] },
  { img: "download.jpeg",            lines: ["I'm sober now. Clear now.", "And what I see is you,", "Auggie, and Evan."] },
  { img: "download.jpeg",            lines: ["Whatever comes,", "I'm not going anywhere."], big: true },
];

/* per-section montages get their slides passed in; default is the love story above */
let slides = SLIDES;

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
  layer.classList.remove("kbon");
  void layer.offsetWidth;
  layer.classList.add("kbon");
}
function showText(slide) {
  textEl.classList.remove("show");
  textEl.className = "montage__text" + (slide.big ? " montage__text--big" : "");
  textEl.innerHTML = slide.lines.map(l => `<span>${l}</span>`).join("");
  void textEl.offsetWidth;
  setTimeout(() => textEl.classList.add("show"), 350);
}
function step() {
  const slide = slides[idx];
  paint(slide, back);
  back.style.opacity = 1; front.style.opacity = 0;
  [front, back] = [back, front];
  showText(slide);
  idx++;
  timer = setTimeout(idx >= slides.length ? end : step, SLIDE_MS);
}
function play(custom, songs) {
  clearTimeout(timer);
  slides = (custom && custom.length) ? custom : SLIDES;
  running = true;
  enterEl.classList.add("gone");
  stage.classList.add("playing");
  document.body.classList.remove("montage-done");
  if (window.Music) window.Music.playList(songs);   // always switch to the right playlist (default if none)
  slides.forEach(s => { const im = new Image(); im.src = s.img; });   // preload all images in the background
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

document.getElementById("enterBtn").addEventListener("click", () => play(null, window.MAIN_SONGS));
skipEl.addEventListener("click", e => { e.stopPropagation(); end(); });
document.addEventListener("keydown", e => { if (!running && !enterEl.classList.contains("gone") && (e.key === "Enter" || e.key === " ")) play(); });

window.Montage = { play, reset, stop, end, get running() { return running; } };
