/* ===== To Vivienne, With Love — nav router + sections + curation ===== */
const AREAS = [
  { key: "vivienne",  label: "Vivienne",  letter: "V", color: "#c98a9a", tag: "To Vivienne, with love." },
  { key: "augustine", label: "Augustine", letter: "A", color: "#7fb0c9", tag: "Our Boo." },
  { key: "evan",      label: "Evan",      letter: "E", color: "#86c98a", tag: "Wanted in every single day." },
  { key: "loki",      label: "Loki",      letter: "L", color: "#9a8ec9", tag: "In loving memory." },
  { key: "filou",     label: "Filou",     letter: "F", color: "#d9a86a", tag: "In loving memory." },
  { key: "maomao",    label: "Mao Mao",   letter: "M", color: "#69c9b8", tag: "The newest of us.", comingSoon: true },
  { key: "marc",      label: "Marc",      letter: "Y", color: "#8fa9c0", tag: "Who I'm becoming." },
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
  vivienne:  { open: ["For Vivienne"], captions: [], close: ["Whatever comes,", "I'm not going anywhere."] },
  augustine: {
    open: ["Augustine Che Bittner", "our Boo"],
    captions: [
      ["Our first son.", "The one who made us a family."],
      ["He almost left us once —", "a sunflower seed, a frightening day in China.", "We have never forgotten how close it was."],
      ["So every ordinary day with him", "feels like a gift we were handed twice."],
      ["He doesn't have many words yet.", "He has his own way of being here —", "careful, particular, entirely himself."],
      ["He climbs to the highest thing he can find", "and jumps. Fearless. Again and again."],
      ["Loves animals. Loves the iPad too much.", "Eats exactly what he wants, and nothing else."],
      ["A tiny version of me —", "same face, same wiring —", "and I love every bit of it."],
    ],
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
    songs: [{ title: "Daydreamin' — Lupe Fiasco", ids: ["7XOAStfv-v0", "3xkP8h5Cwpk"] }],
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
    songs: [{ title: "Ghost — Indigo Girls", ids: ["KwbeHSI-3Co", "zrGQNIysc0I"] }],
  },
  maomao:    { open: ["Mao Mao —", "the newest of us."], captions: [], close: ["Welcome home, little one."] },
  marc: {
    open: ["Marc"],
    captions: [],
    close: ["Still here.", "Still trying.", "Still becoming."],
    songs: [
      { title: "Fallen — Sarah McLachlan", ids: ["Jqps9ZdMxs0", "5xyGOeG8vdo"] },
      { title: "Skeleton Key — Dessa", ids: ["B-elJDC8N7I", "OS8BLqDbY5U"] },
    ],
  },
};
function buildAreaSlides(key) {
  const m = AREA_MONTAGE[key] || { open: [AREA_BY_KEY[key].label], captions: [], close: [] };
  let pics = photos.filter(p => p.area === key && !p.hidden);   // montages use the keepers only
  if (!pics.length) return null;
  const favs = pics.filter(p => p.fav);
  if (favs.length >= 6) pics = favs;                      // prefer keepers once you've starred enough
  const caps = (m.captions || []).slice();
  const MAX = Math.max(18, caps.length * 2 + 2);   // enough photos to space the words out
  if (pics.length > MAX) {
    const stride = pics.length / MAX;
    pics = Array.from({ length: MAX }, (_, i) => pics[Math.floor(i * stride)]);
  }
  const n = pics.length;
  const gap = caps.length ? Math.max(1, Math.floor(n / (caps.length + 1))) : n + 1;
  const slides = [{ img: pics[0].src, lines: m.open, big: true }];
  pics.forEach((p, i) => slides.push({ img: p.src, lines: (caps.length && i > 0 && i % gap === 0) ? caps.shift() : [] }));
  while (caps.length) slides.push({ img: pics[n - 1].src, lines: caps.shift() });
  slides.push({ img: pics[n - 1].src, lines: m.close, big: true });
  return slides;
}

function renderSection(key) {
  const a = AREA_BY_KEY[key];
  const all = photos.filter(p => p.area === key);
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

/* ---------- init ---------- */
route();
