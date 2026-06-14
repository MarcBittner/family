/* ===== To Vivienne, With Love — nav router + sections + curation ===== */
const AREAS = [
  { key: "vivienne",  label: "Vivienne",  letter: "V", color: "#c98a9a", tag: "To Vivienne, with love." },
  { key: "augustine", label: "Augustine", letter: "A", color: "#7fb0c9", tag: "Our Boo." },
  { key: "evan",      label: "Evan",      letter: "E", color: "#86c98a", tag: "Wanted in every single day." },
  { key: "loki",      label: "Loki",      letter: "L", color: "#9a8ec9", tag: "In loving memory." },
  { key: "filou",     label: "Filou",     letter: "F", color: "#d9a86a", tag: "In loving memory." },
  { key: "maomao",    label: "Mao Mao",   letter: "M", color: "#69c9b8", tag: "The newest of us." },
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
  return `<div class="card ${p.fav ? "kept" : ""}" data-id="${p.id}">
    <img src="${p.src}" alt="${p.id}" loading="lazy" />
    <span class="card__id">${p.id}</span>
    ${p.kind === "video" ? '<span class="card__vid">▶</span>' : ""}
    ${a ? `<span class="card__tag" style="background:${a.color}">${a.label}</span>` : ""}
    <button class="card__fav ${p.fav ? "on" : ""}" data-fav title="keep">★</button>
    <div class="card__areas">${areaBtns}</div>
  </div>`;
}

/* ---------- views ---------- */
const VIEW = document.getElementById("view");

/* per-section montage words — REPLACE freely (Marc's words for Loki/Filou/Boo go here) */
const AREA_MONTAGE = {
  vivienne:  { open: ["For Vivienne"],                 close: ["Whatever comes,", "I'm not going anywhere."] },
  augustine: { open: ["Augustine —", "our Boo."],      close: ["You are so loved, Auggie."] },
  evan:      { open: ["Evan."],                        close: ["Wanted, every single day."] },
  loki:      { open: ["Loki", "—", "forever ours."],   close: ["Rest easy, sweet boy."] },
  filou:     { open: ["Filou", "—", "our orange shadow."], close: ["Always missed."] },
  maomao:    { open: ["Mao Mao —", "the newest of us."], close: ["Welcome home, little one."] },
};
function buildAreaSlides(key) {
  const m = AREA_MONTAGE[key] || { open: [AREA_BY_KEY[key].label], close: [] };
  let pics = photos.filter(p => p.area === key);
  if (!pics.length) return null;
  const favs = pics.filter(p => p.fav);
  if (favs.length >= 6) pics = favs;            // prefer keepers if you've starred enough
  const MAX = 16;
  if (pics.length > MAX) {                       // sample evenly across the set, keep order
    const stride = pics.length / MAX;
    pics = Array.from({ length: MAX }, (_, i) => pics[Math.floor(i * stride)]);
  }
  const slides = [{ img: pics[0].src, lines: m.open, big: true }];
  pics.forEach(p => slides.push({ img: p.src, lines: [] }));
  slides.push({ img: pics[pics.length - 1].src, lines: m.close, big: true });
  return slides;
}

function renderSection(key) {
  const a = AREA_BY_KEY[key];
  const list = photos.filter(p => p.area === key);
  VIEW.innerHTML = `
    <section class="section">
      <header class="section__head">
        <h2 class="section__title">${a.label}</h2>
        <p class="section__tag">${a.tag}</p>
        <p class="section__count">${list.length} photo${list.length === 1 ? "" : "s"}</p>
        ${list.length ? `<button class="btn montage-cta" id="playSection">▶ Play ${a.label}'s montage</button>` : ""}
      </header>
      ${list.length
        ? `<div class="grid">${list.map(cardHTML).join("")}</div>`
        : `<div class="empty">
             <p>No photos filed under <strong>${a.label}</strong> yet.</p>
             <p>Open the <a href="#gallery">Gallery</a> and tap <b>${a.letter}</b> on the photos that belong here — they'll appear in this section.</p>
           </div>`}
    </section>`;
  const ps = document.getElementById("playSection");
  if (ps) ps.onclick = () => window.Montage.play(buildAreaSlides(key));
}

let filterArea = "all", onlyFav = false, onlyUnsorted = false;
function renderGallery() {
  const counts = { all: photos.length, unsorted: 0 };
  AREAS.forEach(a => (counts[a.key] = 0));
  for (const p of photos) { if (!p.area) counts.unsorted++; else counts[p.area]++; }
  const chip = (k, label, color) =>
    `<button class="fbtn ${filterArea === k ? "active" : ""}" data-f="${k}">
       ${color ? `<span class="dot" style="background:${color}"></span>` : ""}${label}
       <span class="n">${counts[k] ?? 0}</span></button>`;
  const vis = photos.filter(p => {
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
        <span class="spacer"></span>
        <span class="counts">${vis.length} shown · ${photos.filter(p => p.fav).length} kept ★</span>
        <button class="btn" id="exportBtn">Export my picks</button>
      </div>
      <div class="grid">${vis.map(cardHTML).join("")}</div>
    </section>`;
  document.getElementById("onlyFav").onchange = e => { onlyFav = e.target.checked; renderGallery(); };
  document.getElementById("onlyUnsorted").onchange = e => { onlyUnsorted = e.target.checked; renderGallery(); };
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
