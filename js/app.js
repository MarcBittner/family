/* ===== To Vivienne, With Love — curation studio ===== */
const AREAS = [
  { key: "vivienne",  label: "Vivienne",  letter: "V", color: "#c98a9a" },
  { key: "augustine", label: "Augustine", letter: "A", color: "#7fb0c9" },
  { key: "evan",      label: "Evan",      letter: "E", color: "#86c98a" },
  { key: "loki",      label: "Loki",      letter: "L", color: "#9a8ec9" },
  { key: "filou",     label: "Filou",     letter: "F", color: "#d9a86a" },
  { key: "maomao",    label: "Mao Mao",   letter: "M", color: "#69c9b8" },
];
const AREA_BY_KEY = Object.fromEntries(AREAS.map(a => [a.key, a]));
const STORE_KEY = "vivienne_curation_v1";

/* ---- state: load saved overrides, merge onto data ---- */
const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
const photos = window.PHOTOS.map(p => ({
  ...p,
  area: saved[p.id]?.area ?? p.area ?? "",
  fav:  saved[p.id]?.fav  ?? p.fav  ?? false,
}));
const byId = Object.fromEntries(photos.map(p => [p.id, p]));

let filterArea = "all";       // 'all' | 'unsorted' | area key
let onlyFav = false, onlyUnsorted = false;

function persist() {
  const out = {};
  for (const p of photos) if (p.area || p.fav) out[p.id] = { area: p.area, fav: p.fav };
  localStorage.setItem(STORE_KEY, JSON.stringify(out));
}

/* ---- filters bar ---- */
const filtersEl = document.getElementById("filters");
function renderFilters() {
  const counts = { all: photos.length, unsorted: 0 };
  AREAS.forEach(a => counts[a.key] = 0);
  for (const p of photos) { if (!p.area) counts.unsorted++; else counts[p.area]++; }
  const chip = (key, label, color) =>
    `<button class="fbtn ${filterArea===key?'active':''}" data-f="${key}">
       ${color?`<span class="dot" style="background:${color}"></span>`:''}${label}
       <span class="n">${counts[key]??0}</span></button>`;
  filtersEl.innerHTML =
    chip("all","All") +
    chip("unsorted","Unsorted") +
    AREAS.map(a => chip(a.key, a.label, a.color)).join("");
  filtersEl.querySelectorAll(".fbtn").forEach(b =>
    b.onclick = () => { filterArea = b.dataset.f; renderFilters(); renderGrid(); });
}

/* ---- grid ---- */
const gridEl = document.getElementById("grid");
const countsEl = document.getElementById("counts");

function visible() {
  return photos.filter(p => {
    if (onlyFav && !p.fav) return false;
    if (onlyUnsorted && p.area) return false;
    if (filterArea === "all") return true;
    if (filterArea === "unsorted") return !p.area;
    return p.area === filterArea;
  });
}

function cardHTML(p) {
  const a = p.area ? AREA_BY_KEY[p.area] : null;
  const areaBtns = AREAS.map(ar =>
    `<button class="abtn ${p.area===ar.key?'sel':''}" data-a="${ar.key}"
       style="${p.area===ar.key?`background:${ar.color};border-color:${ar.color}`:''}"
       title="${ar.label}">${ar.letter}</button>`).join("");
  return `<div class="card ${p.fav?'kept':''}" data-id="${p.id}">
    <img src="${p.src}" alt="${p.id}" loading="lazy" />
    <span class="card__id">${p.id}</span>
    ${p.kind==="video"?'<span class="card__vid">▶ vid</span>':''}
    ${a?`<span class="card__tag" style="background:${a.color}">${a.label}</span>`:''}
    <button class="card__fav ${p.fav?'on':''}" data-fav title="keep">★</button>
    <div class="card__areas">${areaBtns}</div>
  </div>`;
}

function renderGrid() {
  const vis = visible();
  gridEl.innerHTML = vis.map(cardHTML).join("");
  const favs = photos.filter(p => p.fav).length;
  countsEl.textContent = `${vis.length} shown · ${favs} kept ★`;
}

/* event delegation */
gridEl.addEventListener("click", e => {
  const card = e.target.closest(".card"); if (!card) return;
  const p = byId[card.dataset.id]; if (!p) return;
  if (e.target.matches("[data-fav]")) {
    p.fav = !p.fav; persist();
    card.classList.toggle("kept", p.fav);
    e.target.classList.toggle("on", p.fav);
    renderFiltersCountOnly();
    return;
  }
  if (e.target.matches("[data-a]")) {
    const k = e.target.dataset.a;
    p.area = (p.area === k) ? "" : k;       // toggle off if same
    persist(); renderFilters();
    // if filtering by an area, the card may drop out — re-render grid
    if (filterArea !== "all") renderGrid();
    else { // just update this card in place
      card.outerHTML = cardHTML(p);
    }
  }
});
function renderFiltersCountOnly(){ const f=filterArea; renderFilters(); filterArea=f; }

/* ---- toggles ---- */
document.getElementById("onlyFav").onchange = e => { onlyFav = e.target.checked; renderGrid(); };
document.getElementById("onlyUnsorted").onchange = e => { onlyUnsorted = e.target.checked; renderGrid(); };

/* ---- export ---- */
const modal = document.getElementById("modal");
function buildExport() {
  const out = { generated: new Date().toISOString(), areas: {}, kept: [] };
  AREAS.forEach(a => out.areas[a.key] = []);
  for (const p of photos) {
    if (p.area) out.areas[p.area].push(p.id);
    if (p.fav) out.kept.push(p.id);
  }
  return JSON.stringify(out, null, 2);
}
document.getElementById("exportBtn").onclick = () => {
  const txt = buildExport();
  document.getElementById("exportText").value = txt;
  modal.hidden = false;
  navigator.clipboard?.writeText(txt).catch(()=>{});
};
document.getElementById("copyBtn").onclick = () =>
  navigator.clipboard?.writeText(document.getElementById("exportText").value);
document.getElementById("closeModal").onclick = () => modal.hidden = true;
modal.addEventListener("click", e => { if (e.target===modal) modal.hidden = true; });

/* ---- music ---- */
const TRACKS = [
  { title: "My Body Is a Cage — Peter Gabriel", src: "assets/music/my-body-is-a-cage.mp3" },
  { title: "A Thousand Years — Christina Perri", src: "assets/music/a-thousand-years.mp3" },
  { title: "My Immortal — Evanescence",          src: "assets/music/my-immortal.mp3" },
];
const audio = new Audio();
audio.loop = true;
let curTrack = 0;
const sel = document.getElementById("musicSelect");
const trackLabel = document.getElementById("musicTrack");
const toggle = document.getElementById("musicToggle");
TRACKS.forEach((t,i) => sel.add(new Option(t.title, i)));
function loadTrack(i){ curTrack=+i; audio.src=TRACKS[i].src; trackLabel.textContent=TRACKS[i].title; sel.value=i; }
loadTrack(0);
sel.onchange = e => { loadTrack(e.target.value); if(!audio.paused){ audio.play().catch(()=>{}); } };
toggle.onclick = () => {
  if (audio.paused) {
    audio.play().then(()=>toggle.textContent="❚❚")
      .catch(()=>{ trackLabel.textContent="(add the .mp3 to assets/music/ to play)"; });
  } else { audio.pause(); toggle.textContent="▶"; }
};

/* ---- init ---- */
renderFilters();
renderGrid();
