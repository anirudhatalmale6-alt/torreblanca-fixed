/* ============================
   TORRE BLANCA - Piso 3 (Apto-02)
   - Hover: muestra mask en #overlay
   - Click: abre panel detalle/info
   - "Todas las fotos": grid por áreas
   - Texto: lee .docx via Mammoth
   ============================ */

(() => {
  const APT = "apto-02";
  const ASSETS = `./assets/${APT}/`;
  const BASE_IMG = `${ASSETS}${APT}-base.jpg`;

  // ====== AREAS ======
  const AREAS = {
    "cocina-comedor": { title: "COCINA / COMEDOR", mask: `${APT}-mask-cocina-comedor.jpg`, kind: "detail" },
    "sala":           { title: "SALA",             mask: `${APT}-mask-sala.jpg`,           kind: "detail" },
    "terraza":        { title: "TERRAZA",          mask: `${APT}-mask-terraza.jpg`,        kind: "detail" },
    "master-bedroom": { title: "MASTER BEDROOM",   mask: `${APT}-mask-master-bedroom.jpg`, kind: "detail" },
    "habitacion-2":   { title: "HABITACIÓN 2",     mask: `${APT}-mask-habitacion-2.jpg`,   kind: "detail" },
    "habitacion-3":   { title: "HABITACIÓN 3",     mask: `${APT}-mask-habitacion-3.jpg`,   kind: "detail" },

    // informativos
    "cubo-de-luz": { title: "CUBO DE ILUMINACIÓN", mask: `${APT}-mask-cubo-de-luz.jpg`, kind: "info" },
    "elevador":    { title: "ELEVADOR",            mask: `${APT}-mask-elevador.jpg`,    kind: "info" },
    "gradas":      { title: "GRADAS",              mask: `${APT}-mask-gradas.jpg`,      kind: "info" },
    "todos-los-banos":   { title: "TODOS LOS BAÑOS",   mask: `${APT}-mask-todos-los-banos.jpg`,   kind: "info" },
    "todos-los-closets": { title: "TODOS LOS CLOSETS", mask: `${APT}-mask-todos-los-closets.jpg`, kind: "info" },
    "lavanderia-y-cuarto-muchacha": { title: "LAVANDERÍA Y CUARTO MUCHACHA", mask: `${APT}-mask-lavanderia-y-cuarto-muchacha.jpg`, kind: "info" },
  };

  // ====== DOM ======
  const overlay = document.getElementById("overlay");
  const hud = document.getElementById("hud");
  const hudTitle = document.getElementById("hudTitle");
  const hudSub = document.getElementById("hudSub");

  const btnAllPhotos = document.getElementById("btnAllPhotos");

  const galleryPanel = document.getElementById("galleryPanel");
  const galleryBack = document.getElementById("galleryBack");
  const galleryTitle = document.getElementById("galleryTitle");
  const galleryCards = document.getElementById("galleryCards");

  const detailPanel = document.getElementById("detailPanel");
  const detailBack = document.getElementById("detailBack");
  const detailTitle = document.getElementById("detailTitle");
  const detailHeroImg = document.getElementById("detailHeroImg");
  const heroHint = document.getElementById("heroHint");
  const detailText = document.getElementById("detailText");
  const detailGallery = document.getElementById("detailGallery");
  const detailLoading = document.getElementById("detailLoading");

  const viewerPanel = document.getElementById("viewerPanel");
  const viewerBack = document.getElementById("viewerBack");
  const viewerTitle = document.getElementById("viewerTitle");
  const viewerImg = document.getElementById("viewerImg");

  // ====== helpers seguros ======
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  function setPanel(panel, open) {
    if (!panel) return;
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    panel.classList.toggle("is-open", !!open);
  }

  function setHudIdle(isIdle) {
    if (!hud) return;
    hud.classList.toggle("is-idle", !!isIdle);
    hud.classList.toggle("is-active", !isIdle);
  }

  async function headOk(url) {
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      return r.ok;
    } catch (e) {
      return false;
    }
  }

  function imgUrl(areaKey, i) {
    return `${ASSETS}${APT}-${areaKey}-${i}.jpg`;
  }

  async function firstExistingPhoto(areaKey, max = 20) {
    for (let i = 1; i <= max; i++) {
      const u = imgUrl(areaKey, i);
      // HEAD para no bajar imagen completa
      if (await headOk(u)) return u;
    }
    return null;
  }

  async function listPhotos(areaKey, max = 50) {
    const out = [];
    for (let i = 1; i <= max; i++) {
      const u = imgUrl(areaKey, i);
      if (!(await headOk(u))) break;
      out.push(u);
    }
    return out;
  }

  async function loadDocxHtml(areaKey) {
    const docx = `${ASSETS}${APT}-${areaKey}-txt.docx`;
    // si no existe, devolver vacío
    if (!(await headOk(docx))) return "";
    try {
      const res = await fetch(docx, { cache: "no-store" });
      const ab = await res.arrayBuffer();
      if (!window.mammoth || !window.mammoth.convertToHtml) return "";
      const result = await window.mammoth.convertToHtml({ arrayBuffer: ab });
      return result.value || "";
    } catch (e) {
      return "";
    }
  }

  function setOverlaySrc(src) {
    if (!overlay) return;
    overlay.src = src;
    overlay.style.opacity = src && src !== BASE_IMG ? "1" : "0";
  }

  function resetOverlay() {
    setOverlaySrc(BASE_IMG);
    if (overlay) overlay.style.opacity = "0";
  }

  // ====== HOVER: mostrar masks ======
  async function onHover(areaKey) {
    const cfg = AREAS[areaKey];
    if (!cfg) return;

    if (hudTitle) hudTitle.textContent = cfg.title;
    if (hudSub) hudSub.textContent = cfg.kind === "detail" ? "Tap / click para ver detalle" : "Tap / click para ver info";
    setHudIdle(false);

    const maskUrl = `${ASSETS}${cfg.mask}`;
    if (await headOk(maskUrl)) {
      setOverlaySrc(maskUrl);
    } else {
      // si falta la máscara, no rompas: solo quedate en base
      resetOverlay();
    }
  }

  function onLeave() {
    if (hudTitle) hudTitle.textContent = "PASA EL MOUSE POR UN ÁREA";
    if (hudSub) hudSub.textContent = "Tap / click para ver detalle";
    setHudIdle(true);
    resetOverlay();
  }

  // ====== DETAIL / INFO ======
  async function openDetail(areaKey) {
    const cfg = AREAS[areaKey];
    if (!cfg) return;

    setPanel(galleryPanel, false);
    setPanel(viewerPanel, false);
    setPanel(detailPanel, true);

    if (detailTitle) detailTitle.textContent = cfg.title;
    if (detailHeroImg) detailHeroImg.src = "";
    if (detailText) detailText.innerHTML = "";
    if (detailGallery) detailGallery.innerHTML = "";
    if (detailLoading) detailLoading.hidden = false;

    const [html, photos] = await Promise.all([
      loadDocxHtml(areaKey),
      listPhotos(areaKey, 50),
    ]);

    if (detailText) detailText.innerHTML = html || "";

    if (photos.length) {
      if (detailHeroImg) detailHeroImg.src = photos[0];

      // thumbs
      for (const u of photos) {
        const t = document.createElement("img");
        t.src = u;
        t.alt = cfg.title;
        t.loading = "lazy";
        t.addEventListener("click", () => openViewer(cfg.title, u));
        detailGallery.appendChild(t);
      }

      // hero click
      if (heroHint) heroHint.onclick = () => openViewer(cfg.title, photos[0]);
      if (detailHeroImg) detailHeroImg.onclick = () => openViewer(cfg.title, photos[0]);
    }

    if (detailLoading) detailLoading.hidden = true;
  }

  async function openInfo(areaKey) {
    const cfg = AREAS[areaKey];
    if (!cfg) return;

    // info usa el mismo panel detalle (sin necesidad de fotos)
    setPanel(galleryPanel, false);
    setPanel(viewerPanel, false);
    setPanel(detailPanel, true);

    if (detailTitle) detailTitle.textContent = cfg.title;
    if (detailHeroImg) detailHeroImg.src = "";
    if (detailGallery) detailGallery.innerHTML = "";
    if (detailLoading) detailLoading.hidden = false;

    const html = await loadDocxHtml(areaKey);
    if (detailText) detailText.innerHTML = html || "";

    if (detailLoading) detailLoading.hidden = true;
  }

  function openViewer(title, url) {
    setPanel(detailPanel, false);
    setPanel(galleryPanel, false);
    setPanel(viewerPanel, true);

    if (viewerTitle) viewerTitle.textContent = title || "FOTO";
    if (viewerImg) viewerImg.src = url;
  }

  // ====== TODAS LAS FOTOS ======
  async function openAllPhotos() {
    setPanel(detailPanel, false);
    setPanel(viewerPanel, false);
    setPanel(galleryPanel, true);

    if (galleryTitle) galleryTitle.textContent = document.body.dataset.aptoName || "APARTAMENTO";
    if (!galleryCards) return;

    galleryCards.innerHTML = "";

    // Mostrar primero las áreas "detail"
    const keys = Object.keys(AREAS).filter(k => AREAS[k].kind === "detail");

    for (const k of keys) {
      const cfg = AREAS[k];
      const cover = await firstExistingPhoto(k, 20);

      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.style.textAlign = "left";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = cfg.title;
      img.src = cover || BASE_IMG;

      const meta = document.createElement("div");
      meta.className = "cardMeta";

      const h = document.createElement("div");
      h.className = "cardTitle";
      h.textContent = cfg.title;

      const s = document.createElement("div");
      s.className = "cardSub";
      s.textContent = cover ? "" : "Sin fotos aún";

      meta.appendChild(h);
      meta.appendChild(s);

      card.appendChild(img);
      card.appendChild(meta);

      card.addEventListener("click", () => openDetail(k));
      galleryCards.appendChild(card);
    }
  }

  // ====== bind events ======
  function bind() {
    // overlay init
    resetOverlay();
    setHudIdle(true);

    // ====== RESET PANELS (arranque limpio) ======
    setPanel(galleryPanel, false);
    setPanel(detailPanel, false);
    setPanel(viewerPanel, false);

    // hover/click hotspots
    qsa("[data-area]").forEach(el => {
      const areaKey = el.dataset.area;
      el.addEventListener("mouseenter", () => onHover(areaKey));
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("focus", () => onHover(areaKey));
      el.addEventListener("blur", onLeave);

      el.addEventListener("click", async () => {
        const cfg = AREAS[areaKey];
        if (!cfg) return;
        if (cfg.kind === "detail") await openDetail(areaKey);
        else await openInfo(areaKey);
      });
    });

    // botones
    if (btnAllPhotos) btnAllPhotos.addEventListener("click", openAllPhotos);

    if (galleryBack) galleryBack.addEventListener("click", () => {
      setPanel(galleryPanel, false);
    });

    if (detailBack) detailBack.addEventListener("click", () => {
      setPanel(detailPanel, false);
    });

    if (viewerBack) viewerBack.addEventListener("click", () => {
      setPanel(viewerPanel, false);
      setPanel(detailPanel, true);
    });
  }

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
