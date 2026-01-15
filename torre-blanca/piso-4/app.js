const overlay = document.getElementById("overlay");
const hud = document.getElementById("hud");
const hudTitle = document.getElementById("hudTitle");
const hudSub = document.getElementById("hudSub");

const btnAllPhotos = document.getElementById("btnAllPhotos");

const galleryPanel = document.getElementById("galleryPanel");
const galleryCards = document.getElementById("galleryCards");
const galleryBack = document.getElementById("galleryBack");
const galleryTitle = document.getElementById("galleryTitle");

const detailPanel = document.getElementById("detailPanel");
const detailBack = document.getElementById("detailBack");
const detailTitle = document.getElementById("detailTitle");
const detailHeroImg = document.getElementById("detailHeroImg");
const detailText = document.getElementById("detailText");
const detailGallery = document.getElementById("detailGallery");
const detailLoading = document.getElementById("detailLoading");
const heroHint = document.getElementById("heroHint");

const viewerPanel = document.getElementById("viewerPanel");
const viewerBack = document.getElementById("viewerBack");
const viewerTitle = document.getElementById("viewerTitle");
const viewerImg = document.getElementById("viewerImg");

const ASSET_DIR = "./assets/apto-03/";
const APTO_PREFIX = "apto-03-";
const APTO_NAME = (document.body.dataset.aptoName || "APARTAMENTO").trim();

galleryTitle.textContent = APTO_NAME;

const AREAS = {
  // DETALLE (abre detalle)
  "cocina-comedor": { title: "COCINA / COMEDOR", mask: "apto-03-mask-cocina-comedor.jpg", kind: "detail" },
  "sala":           { title: "SALA",            mask: "apto-03-mask-sala.jpg",           kind: "detail" },
  "terraza":        { title: "TERRAZA",         mask: "apto-03-mask-terraza.jpg",        kind: "detail" },
  "master-bedroom": { title: "MASTER BEDROOM",  mask: "apto-03-mask-master-bedroom.jpg", kind: "detail" },
  "habitacion-2":   { title: "HABITACIÓN 2",    mask: "apto-03-mask-habitacion-2.jpg",   kind: "detail" },
  "habitacion-3":   { title: "HABITACIÓN 3",    mask: "apto-03-mask-habitacion-3.jpg",   kind: "detail" },

  // INFORMATIVO (solo HUD)
  "cubo-de-luz": { title: "CUBO DE ILUMINACIÓN", mask: "apto-03-mask-cubo-de-luz.jpg", kind: "info" },
  "elevador":    { title: "ELEVADOR",            mask: "apto-03-mask-elevador.jpg",     kind: "info" },
  "gradas":      { title: "GRADAS",              mask: "apto-03-mask-gradas.jpg",       kind: "info" },
  "todos-los-banos":   { title: "TODOS LOS BAÑOS",   mask: "apto-03-mask-todos-los-banos.jpg",   kind: "info" },
  "todos-los-closets": { title: "TODOS LOS CLOSETS", mask: "apto-03-mask-todos-los-closets.jpg", kind: "info" },
  "lavanderia-y-cuarto-muchacha": { title: "LAVANDERÍA Y CUARTO MUCHACHA", mask: "apto-03-mask-lavanderia-y-cuarto-muchacha.jpg", kind: "info" },
};

// Preload masks
Object.values(AREAS).forEach(a => { const i = new Image(); i.src = ASSET_DIR + a.mask; });

const canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
let selectedArea = null;
let currentDetailKey = null;
let currentHeroSrc = null;

function setHudState(state){
  hud.classList.remove("is-idle","is-active");
  if(state) hud.classList.add(state);
}
function setHud(title, sub){
  hudTitle.textContent = title || "";
  hudSub.textContent = sub || "";
}

function showArea(key){
  const a = AREAS[key];
  if(!a) return;

  overlay.src = ASSET_DIR + a.mask;
  overlay.style.opacity = "1";

  setHudState("is-active");
  if(a.kind === "detail"){
    setHud(a.title, "Tap / click para ver detalle");
  } else {
    setHud(a.title, "");
  }
}

function clearArea(){
  overlay.style.opacity = "0";
  selectedArea = null;
  setHudState("is-idle");
  setHud("PASA EL MOUSE POR UN ÁREA", "Tap / click para ver detalle");
}

function openPanel(panel){
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}
function closePanel(panel){
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  // Si no queda ninguna abierta, re-habilitar scroll body
  const anyOpen = document.querySelector(".panel.is-open");
  if(!anyOpen) document.body.classList.remove("modal-open");
}

async function fileExists(url){
  try{
    const r = await fetch(url, { method:"HEAD", cache:"no-store" });
    return r.ok;
  }catch(e){
    return false;
  }
}

async function loadImagesForKey(key){
  // 1 = portada, 2..N = adicionales
  const list = [];
  for(let n=1; n<=60; n++){
    const jpg = `${ASSET_DIR}${APTO_PREFIX}${key}-${n}.jpg`;
    const jpeg = `${ASSET_DIR}${APTO_PREFIX}${key}-${n}.jpeg`;
    const png = `${ASSET_DIR}${APTO_PREFIX}${key}-${n}.png`;

    if(await fileExists(jpg)) { list.push(jpg); continue; }
    if(await fileExists(jpeg)){ list.push(jpeg); continue; }
    if(await fileExists(png)) { list.push(png); continue; }

    if(n === 1) break; // si no hay portada, no insistir
    break; // para adicionales, paramos al primer hueco
  }
  return list;
}

async function loadDocxHtmlForKey(key){
  const docxUrl = `${ASSET_DIR}${APTO_PREFIX}${key}-txt.docx`;
  if(!(await fileExists(docxUrl))){
    return `<p style="opacity:.85;color:#cbd5e1">No hay texto todavía. Subí el Word: <b>${APTO_PREFIX}${key}-txt.docx</b></p>`;
  }

  try{
    const res = await fetch(docxUrl, { cache:"no-store" });
    const arrayBuffer = await res.arrayBuffer();
    const out = await window.mammoth.convertToHtml({ arrayBuffer });
    // out.value ya es HTML con <ul><li> etc
    return out.value || "";
  }catch(e){
    return `<p style="opacity:.85;color:#cbd5e1">Error leyendo el Word. Verificá el archivo: <b>${APTO_PREFIX}${key}-txt.docx</b></p>`;
  }
}

function openViewer(title, imgSrc){
  viewerTitle.textContent = title || "FOTO";
  viewerImg.src = imgSrc;
  openPanel(viewerPanel);
}

async function openDetail(key, titleOverride){
  const a = AREAS[key];
  if(!a) return;
  if(a.kind !== "detail") return;

  currentDetailKey = key;
  detailTitle.textContent = titleOverride || a.title;

  detailLoading.hidden = false;
  detailText.innerHTML = "";
  detailGallery.innerHTML = "";
  detailHeroImg.removeAttribute("src");
  currentHeroSrc = null;

  openPanel(detailPanel);

  const imgs = await loadImagesForKey(key);
  const docxHtml = await loadDocxHtmlForKey(key);

  // Texto (IMPORTANTE: innerHTML para que salgan bullets)
  detailText.innerHTML = docxHtml;

  // Portada
  if(imgs.length){
    currentHeroSrc = imgs[0];
    detailHeroImg.src = imgs[0];
    detailHeroImg.alt = detailTitle.textContent;
  } else {
    detailHeroImg.alt = "Sin fotos todavía";
  }

  // Galería (2..N)
  const extras = imgs.slice(1);
  extras.forEach((src, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Foto ${idx+2}`);
    const im = document.createElement("img");
    im.src = src;
    im.alt = `Foto ${idx+2}`;
    b.appendChild(im);
    b.addEventListener("click", () => openViewer(detailTitle.textContent, src));
    detailGallery.appendChild(b);
  });

  detailLoading.hidden = true;
}

function openGallery(){
  galleryCards.innerHTML = "";
  Object.entries(AREAS).forEach(([key, a]) => {
    if(a.kind !== "detail") return;

    const row = document.createElement("div");
    row.className = "cardRow";
    row.tabIndex = 0;

    const cover = document.createElement("img");
    // portada: apto-03-<key>-1.(jpg|jpeg|png) => intentamos jpg primero
    cover.src = `${ASSET_DIR}${APTO_PREFIX}${key}-1.jpg`;
    cover.alt = a.title;

    const right = document.createElement("div");
    const t = document.createElement("div");
    t.className = "t";
    t.textContent = a.title;

    const s = document.createElement("div");
    s.className = "s";
    s.textContent = "Click para ver detalle";

    right.appendChild(t);
    right.appendChild(s);

    row.appendChild(cover);
    row.appendChild(right);

    row.addEventListener("click", () => openDetail(key, a.title));
    row.addEventListener("keydown", (e) => { if(e.key === "Enter") openDetail(key, a.title); });

    galleryCards.appendChild(row);
  });

  openPanel(galleryPanel);
}

function onSpotActivate(key){
  const a = AREAS[key];
  if(!a) return;

  if(a.kind === "detail"){
    openDetail(key, a.title);
  }
}

// Hotspots behavior
document.querySelectorAll(".spot").forEach(btn => {
  const key = btn.dataset.area;

  if(canHover){
    btn.addEventListener("mouseenter", () => showArea(key));
    btn.addEventListener("mouseleave", clearArea);
    btn.addEventListener("click", () => onSpotActivate(key));
    return;
  }

  // touch: tap 1 preview, tap 2 open detail (si aplica)
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if(selectedArea !== key){
      selectedArea = key;
      showArea(key);
      return;
    }
    onSpotActivate(key);
  });
});

document.addEventListener("click", (e) => {
  if(canHover) return;
  if(e.target && e.target.closest && e.target.closest(".spot")) return;
  clearArea();
});

// Buttons
btnAllPhotos.addEventListener("click", () => openGallery());

// Back
galleryBack.addEventListener("click", () => closePanel(galleryPanel));
detailBack.addEventListener("click", () => closePanel(detailPanel));
viewerBack.addEventListener("click", () => closePanel(viewerPanel));

// Click para ampliar (portada)
heroHint.addEventListener("click", () => {
  if(currentHeroSrc) openViewer(detailTitle.textContent, currentHeroSrc);
});
detailHeroImg.addEventListener("click", () => {
  if(currentHeroSrc) openViewer(detailTitle.textContent, currentHeroSrc);
});

// init
setHudState("is-idle");
setHud("PASA EL MOUSE POR UN ÁREA", "Tap / click para ver detalle");

/* TB_PDF_BUTTONS */
(function(){
  try{
    const ASSET_DIR_LOCAL = (typeof ASSET_DIR !== "undefined") ? ASSET_DIR : "./assets/apto-03/";
    const planoBtn = document.getElementById("btnPlanoPrecio");
    const ubiBtn   = document.getElementById("btnUbicacion");

    function openPdfLocal(name){
      window.open(ASSET_DIR_LOCAL + name, "_blank", "noopener,noreferrer");
    }

    if(planoBtn){
      planoBtn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        openPdfLocal("apto-03-plano.pdf");
      });
    }
    if(ubiBtn){
      ubiBtn.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        openPdfLocal("apto-03-ubicacion.pdf");
      });
    }
  }catch(err){}
})();
