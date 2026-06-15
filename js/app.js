/* ===== To Vivienne, With Love — nav router + sections + curation ===== */
const AREAS = [
  { key: "vivienne",  label: "Vivienne",  letter: "V", color: "#c98a9a", tag: "To Vivienne, with love.", quotes: [["It was no large matter of love,", "it was everything."], ["What is left after this?", "What can death loose in me", "after your embrace?"]] },
  { key: "augustine", label: "Augustine", letter: "A", color: "#7fb0c9", tag: "Our Boo." },
  { key: "evan",      label: "Evan",      letter: "E", color: "#86c98a", tag: "Wanted in every single day." },
  { key: "loki",      label: "Loki",      letter: "L", color: "#9a8ec9", tag: "In loving memory." },
  { key: "filou",     label: "Filou",     letter: "F", color: "#d9a86a", tag: "In loving memory." },
  { key: "maomao",    label: "Mao Mao",   letter: "M", color: "#69c9b8", tag: "The newest of us.", comingSoon: true },
  { key: "marc",      label: "Marc",      letter: "Y", color: "#8fa9c0", tag: "Who I'm becoming.", quotes: [[
    "We all begin with good intent",
    "When love was raw and young",
    "We believe that we could change ourselves",
    "The past can be undone",
    "But we carry on our back the burden",
    "Time always reveals",
    "In the lonely light of morning",
    "In the wound that would not heal",
  ]] },
];
const AREA_BY_KEY = Object.fromEntries(AREAS.map(a => [a.key, a]));
const STORE_KEY = "vivienne_curation_v1";

const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
const photos = window.PHOTOS.map(p => ({
  ...p,
  area: saved[p.id]?.area ?? p.area ?? "",
  fav:  saved[p.id]?.fav  ?? p.fav  ?? false,
}));
const byId = Object.fromEntries(photos.map(p => [p.id, p]));
function persist() {
  const out = {};
  for (const p of photos) if (p.area || p.fav) out[p.id] = { area: p.area, fav: p.fav };
  localStorage.setItem(STORE_KEY, JSON.stringify(out));
}

/* ---------- shared card ---------- */
function cardHTML(p) {
  const a = p.area ? AREA_BY_KEY[p.area] : null;
  const areaBtns = AREAS.map(ar =>
    `<button class="abtn ${p.area === ar.key ? "sel" : ""}" data-a="${ar.key}"
       style="${p.area === ar.key ? `background:${ar.color};border-color:${ar.color}` : ""}"
       title="${ar.label}">${ar.letter}</button>`).join("");
  return `<div class="card ${p.fav ? "kept" : ""} ${p.hidden ? "dup" : ""}" data-id="${p.id}">
    <img src="${p.src}" alt="${p.id}" loading="lazy" />
    <span class="card__id">${p.id}</span>
    ${p.hidden ? '<span class="card__dup">similar</span>' : ""}
    ${p.kind === "video" ? '<span class="card__vid">▶</span>' : ""}
    ${a ? `<span class="card__tag" style="background:${a.color}">${a.label}</span>` : ""}
    <button class="card__fav ${p.fav ? "on" : ""}" data-fav title="keep">★</button>
    <div class="card__areas">${areaBtns}</div>
  </div>`;
}

/* ---------- views ---------- */
const VIEW = document.getElementById("view");

/* per-section montage words — { open, captions[], close }. Captions unfold across the photos. */
const AREA_MONTAGE = {
  vivienne:  { open: ["For Vivienne"], captions: [], close: ["Whatever comes,", "I'm not going anywhere."], songs: [{ title: "I Believe — Stevie Wonder", ids: ["D4LsZjv8Uao", "VfDZNwJ3jVU", "H--_-gPX3Nw"] }] },
  augustine: {
    open: ["Augustine Che Bittner", "our Boo"],
    captions: [
      ["Our first son.", "The one who made us a family."],
      ["He is precious beyond words,", "and reminds us every day", "that tomorrow is not promised."],
      ["So every ordinary day with him", "feels like a gift."],
      ["He doesn't have many words yet.", "He has his own way of being here —", "careful, particular, entirely himself."],
      ["He climbs to the highest thing he can find", "and jumps. Fearless. Again and again."],
      ["Loves animals. Loves the iPad too much.", "Eats exactly what he wants, and nothing else."],
    ],
    pins: { "p0562": ["A tiny version of me —", "same face, same wiring —", "and I love every bit of it."] },
    close: ["Augustine.", "Precious beyond all of it.", "Ours."],
    songs: [{ title: "Hallelujah — Pentatonix", ids: ["LRP8d7hhpoQ", "9UyYjXVnQTE"] }],
  },
  evan:      { open: ["Evan."], captions: [], close: ["Wanted, every single day."], songs: [{ title: "Pretty Good Year — Tori Amos", ids: ["xr8auZq-Xn8", "abvktnzBUkU", "qODQB8kp9C4"] }] },
  loki: {
    open: ["Loki", "the sweetest heart"],
    captions: [
      ["The kindest, sweetest heart", "of any cat we ever knew."],
      ["Small and round —", "though you always swore", "he was just big-boned."],
      ["Not as clever as his brother,", "but braver of heart —", "whatever Filou learned, Loki learned next."],
      ["He loved food more than anything,", "but wanted so badly to be good"],
      ["that he'd guard the pizza without a bite,", "waiting for his 'Loki piece.'", "(Once or twice, a whole chicken still vanished.)"],
      ["Stubborn to the bone.", "He'd miss the same jump a hundred times,", "and try it a hundred and one."],
      ["He loved the sun, and his family,", "and he watched over Boo", "when Boo was small."],
      ["And every night, for years,", "he slept curled on your head."],
      ["Last March, at Lake Arrowhead,", "a door was left open.", "By morning, he was gone."],
      ["We searched for months — every door, every street,", "walking in shifts, you three months along with Evan,", "calling and calling his name."],
    ],
    close: ["We never found him.", "We miss him terribly —", "and you, Vivienne, most of all."],
    songs: [{ title: "Gangnam Style — PSY", ids: ["9bZkp7q19f0", "CH1XGdu-hzQ"] }],
  },
  filou: {
    open: ["Filou", "my orange shadow"],
    captions: [
      ["My oldest friend.", "The smartest cat I ever knew —", "and by far the grumpiest."],
      ["Two surgeries as a kitten saved his life.", "After that, he trusted almost no one."],
      ["He didn't even trust you for years —", "which made the day he finally did", "mean everything."],
      ["Fifteen years he was mine.", "The best friend I have ever had."],
      ["My orange shadow —", "his whole life spent as near to me", "as he could get."],
      ["When we fought, he'd put himself between us", "and swat at whoever might do harm.", "He guarded this family fiercely."],
      ["He looked after his brother Loki,", "and came running for us", "every time Loki got himself stuck."],
      ["He slept on my shoulder almost every night", "for thirteen of his fifteen years."],
    ],
    close: ["Last summer he died in my arms,", "after a short illness.", "Loved beyond measure."],
    songs: [{ title: "Seen Enough — Dryer", ids: ["gKgTSAMA04I", "cXTNS18dx7Q"] }],
  },
  maomao:    { open: ["Mao Mao —", "the newest of us."], captions: [], close: ["Welcome home, little one."] },
  marc: {
    open: ["Marc"],
    captions: [
      ["I didn't get an easy start —", "a hard childhood, a guarded life."],
      ["I was good at the things", "that don't require people:", "books, business, getting by alone."],
      ["For years, the only things I loved", "were a couple of cats."],
      ["Then I met you,", "and the whole world changed color."],
      ["I'm not always easy to live with.", "I don't always know how to show what I feel.", "I'm still learning to be good to the people I love."],
      ["But you are my sun and my moon.", "You showed me a life worth living."],
      ["I love our boys more than my own breath —", "and I want to be the father,", "the husband, they deserve."],
      ["I'm an alcoholic.", "I'm sober now,", "and I fight to stay that way, every day."],
    ],
    close: ["Not the man I was —", "the man I'm becoming.", "For you. For them. For good."],
    songs: [{ title: "While My Guitar Gently Weeps — Prince & friends", ids: ["6SFNW5F8K9Y", "3MC6s9HHonU"] }],
  },
};
function areaPhotos(key) {
  // Marc appears in the couple shots (tagged vivienne), so his section draws from both.
  if (key === "marc") return photos.filter(p => p.area === "marc" || p.area === "vivienne");
  return photos.filter(p => p.area === key);
}
function buildAreaSlides(key) {
  const m = AREA_MONTAGE[key] || { open: [AREA_BY_KEY[key].label], captions: [], close: [] };
  let pics = areaPhotos(key).filter(p => !p.hidden && p.kind !== "video");   // keepers only, no video stills
  if (!pics.length) return null;
  const favs = pics.filter(p => p.fav);
  if (favs.length >= 6) pics = favs;                      // prefer keepers once you've starred enough
  const caps = (m.captions || []).slice();
  const pins = m.pins || {};                              // photoId -> caption pinned to that exact photo
  const MAX = Math.max(36, caps.length * 3 + 2);
  if (pics.length > MAX) {
    const stride = pics.length / MAX;
    pics = Array.from({ length: MAX }, (_, i) => pics[Math.floor(i * stride)]);
  }
  Object.keys(pins).forEach(id => {                       // ensure pinned photos appear
    if (!pics.some(p => p.id === id)) { const pp = photos.find(p => p.id === id); if (pp) pics.splice(Math.floor(pics.length / 2), 0, pp); }
  });
  const n = pics.length;
  const gap = caps.length ? Math.max(1, Math.floor(n / (caps.length + 1))) : n + 1;
  const slides = [{ img: pics[0].src, lines: m.open, big: true }];
  pics.forEach((p, i) => {
    const lines = pins[p.id] ? pins[p.id] : ((caps.length && i > 0 && i % gap === 0) ? caps.shift() : []);
    slides.push({ img: p.src, lines });
  });
  while (caps.length) slides.push({ img: pics[n - 1].src, lines: caps.shift() });
  slides.push({ img: pics[pics.length - 1].src, lines: m.close, big: true });
  return slides;
}

function renderSection(key) {
  const a = AREA_BY_KEY[key];
  const all = areaPhotos(key);
  const hiddenN = all.filter(p => p.hidden).length;
  const list = all.filter(p => showHidden || !p.hidden);
  VIEW.innerHTML = `
    <section class="section">
      <header class="section__head">
        <h2 class="section__title">${a.label}</h2>
        <p class="section__tag">${a.tag}</p>
        <p class="section__count">${list.length} photo${list.length === 1 ? "" : "s"}${hiddenN ? ` · ${hiddenN} near-duplicate${hiddenN === 1 ? "" : "s"} hidden` : ""}</p>
        ${all.length ? `<button class="btn montage-cta" id="playSection">▶ Play ${a.label}'s montage</button>` : ""}
        ${hiddenN ? `<button class="linkbtn" id="toggleHidden">${showHidden ? "hide near-duplicates" : `show hidden (${hiddenN})`}</button>` : ""}
      </header>
      ${(a.quotes || []).map(q => `<blockquote class="quote">${q.map(l => `<span>${l}</span>`).join("")}</blockquote>`).join("")}
      ${list.length
        ? `<div class="grid">${list.map(cardHTML).join("")}</div>`
        : a.comingSoon
          ? `<div class="empty"><p class="coming__big">Coming soon</p><p>${a.label} is on the way.</p></div>`
          : `<div class="empty">
             <p>No photos filed under <strong>${a.label}</strong> yet.</p>
             <p>Open the <a href="#gallery">Gallery</a> and tap <b>${a.letter}</b> on the photos that belong here — they'll appear in this section.</p>
           </div>`}
    </section>`;
  const ps = document.getElementById("playSection");
  if (ps) ps.onclick = () => window.Montage.play(buildAreaSlides(key), (AREA_MONTAGE[key] || {}).songs);
  const th = document.getElementById("toggleHidden");
  if (th) th.onclick = () => { showHidden = !showHidden; renderSection(key); };
}

let filterArea = "all", onlyFav = false, onlyUnsorted = false, showHidden = false;
function renderGallery() {
  const counts = { all: photos.length, unsorted: 0 };
  AREAS.forEach(a => (counts[a.key] = 0));
  for (const p of photos) { if (!p.area) counts.unsorted++; else counts[p.area]++; }
  const chip = (k, label, color) =>
    `<button class="fbtn ${filterArea === k ? "active" : ""}" data-f="${k}">
       ${color ? `<span class="dot" style="background:${color}"></span>` : ""}${label}
       <span class="n">${counts[k] ?? 0}</span></button>`;
  const vis = photos.filter(p => {
    if (!showHidden && p.hidden) return false;
    if (onlyFav && !p.fav) return false;
    if (onlyUnsorted && p.area) return false;
    if (filterArea === "all") return true;
    if (filterArea === "unsorted") return !p.area;
    return p.area === filterArea;
  });
  VIEW.innerHTML = `
    <section class="section">
      <header class="section__head">
        <h2 class="section__title">Gallery</h2>
        <p class="section__tag">Sort every photo into its area · ★ your keepers · it all auto-saves</p>
      </header>
      <div class="filters">
        ${chip("all", "All")}${chip("unsorted", "Unsorted")}${AREAS.map(a => chip(a.key, a.label, a.color)).join("")}
      </div>
      <div class="gactions">
        <label class="chk"><input type="checkbox" id="onlyFav" ${onlyFav ? "checked" : ""}/> only ★</label>
        <label class="chk"><input type="checkbox" id="onlyUnsorted" ${onlyUnsorted ? "checked" : ""}/> only unsorted</label>
        <label class="chk"><input type="checkbox" id="showHiddenChk" ${showHidden ? "checked" : ""}/> show near-duplicates</label>
        <span class="spacer"></span>
        <span class="counts">${vis.length} shown · ${photos.filter(p => p.fav).length} kept ★</span>
        <button class="btn" id="exportBtn">Export my picks</button>
      </div>
      <div class="grid">${vis.map(cardHTML).join("")}</div>
    </section>`;
  document.getElementById("onlyFav").onchange = e => { onlyFav = e.target.checked; renderGallery(); };
  document.getElementById("onlyUnsorted").onchange = e => { onlyUnsorted = e.target.checked; renderGallery(); };
  document.getElementById("showHiddenChk").onchange = e => { showHidden = e.target.checked; renderGallery(); };
  document.getElementById("exportBtn").onclick = openExport;
  VIEW.querySelectorAll(".fbtn").forEach(b => (b.onclick = () => { filterArea = b.dataset.f; renderGallery(); }));
}

/* ---------- grid interactions (delegated) ---------- */
VIEW.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card) return;
  const p = byId[card.dataset.id];
  if (e.target.matches("[data-fav]")) { p.fav = !p.fav; persist(); rerender(); return; }
  if (e.target.matches("[data-a]")) { const k = e.target.dataset.a; p.area = p.area === k ? "" : k; persist(); rerender(); return; }
  openLightbox(p);
});

/* ---------- lightbox ---------- */
function openLightbox(p) {
  const src = p.full ? p.full : p.src;
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = `<img src="${src}" alt="${p.id}" /><span class="lightbox__id">${p.id}</span>`;
  lb.onclick = () => lb.remove();
  document.body.appendChild(lb);
}

/* ---------- export ---------- */
const modal = document.getElementById("modal");
function openExport() {
  const out = { generated: new Date().toISOString(), areas: {}, kept: [] };
  AREAS.forEach(a => (out.areas[a.key] = []));
  for (const p of photos) { if (p.area) out.areas[p.area].push(p.id); if (p.fav) out.kept.push(p.id); }
  const txt = JSON.stringify(out, null, 2);
  document.getElementById("exportText").value = txt;
  modal.hidden = false;
  navigator.clipboard?.writeText(txt).catch(() => {});
}
document.getElementById("copyBtn").onclick = () => navigator.clipboard?.writeText(document.getElementById("exportText").value);
document.getElementById("closeModal").onclick = () => (modal.hidden = true);
modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; });

/* ---------- router ---------- */
function setActiveNav(r) {
  document.querySelectorAll("#navLinks a").forEach(a => a.classList.toggle("active", a.dataset.route === r));
}
function currentRoute() { return location.hash.replace("#", "") || "montage"; }
function rerender() {
  const r = currentRoute();
  if (r === "gallery") renderGallery();
  else if (AREA_BY_KEY[r]) renderSection(r);
}
function route() {
  const r = currentRoute();
  setActiveNav(r);
  document.getElementById("navLinks").classList.remove("open");
  const onMontage = r === "montage";
  document.body.classList.toggle("on-montage", onMontage);
  if (onMontage) {
    VIEW.innerHTML = "";
    if (window.Montage && !window.Montage.running) window.Montage.reset();
  } else {
    document.getElementById("enter").classList.add("gone");
    if (window.Montage) window.Montage.stop();
    window.scrollTo(0, 0);
    if (r === "gallery") renderGallery();
    else if (AREA_BY_KEY[r]) renderSection(r);
    else location.hash = "#montage";
  }
}
window.addEventListener("hashchange", route);

/* ---------- nav controls ---------- */
document.getElementById("musicToggle").onclick = () => window.Music && window.Music.toggle();
document.getElementById("burger").onclick = () => document.getElementById("navLinks").classList.toggle("open");

/* ---------- cover montage selector ---------- */
function renderEnterMenu() {
  const menu = document.getElementById("enterMenu");
  if (!menu) return;
  const chips = [`<button class="chip" data-m="vivienne">Vivienne</button>`];
  AREAS.forEach(a => {
    if (a.key === "vivienne" || a.key === "maomao") return;
    if (photos.some(p => p.area === a.key && !p.hidden)) chips.push(`<button class="chip" data-m="${a.key}">${a.label}</button>`);
  });
  menu.innerHTML = chips.join("");
  menu.querySelectorAll(".chip").forEach(b => b.onclick = () => {
    const k = b.dataset.m;
    if (k === "vivienne") window.Montage.play(null, AREA_MONTAGE.vivienne.songs);
    else window.Montage.play(buildAreaSlides(k), (AREA_MONTAGE[k] || {}).songs);
  });
}
window.MAIN_SONGS = AREA_MONTAGE.vivienne.songs;   // the begin/"whole story" button uses Vivienne's song
window.ALL_SONGS = (function () {                  // unique pool of every section's song, for shuffle + next
  const seen = new Set(), out = [];
  Object.values(AREA_MONTAGE).forEach(m => (m.songs || []).forEach(s => { if (!seen.has(s.title)) { seen.add(s.title); out.push(s); } }));
  return out;
})();
document.getElementById("musicNext").onclick = () => window.Music && window.Music.next();
renderEnterMenu();

/* ---------- init ---------- */
route();
