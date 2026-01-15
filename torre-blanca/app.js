const overlay = document.getElementById("overlay");
const hudTitle = document.getElementById("hudTitle");
const hudSub = document.getElementById("hudSub");

const FLOORS = {
  1: { title: "PISO 1 / ESTACIONAMIENTO", img: "./assets/piso-01-mask.png", href: "./piso-1/" },
  2: { title: "PISO 2 / APARTAMENTO 1",    img: "./assets/piso-02-mask.png", href: "./piso-2/" },
  3: { title: "PISO 3 / APARTAMENTO 2",    img: "./assets/piso-03-mask.png", href: "./piso-3/" },
  4: { title: "PISO 4 / APARTAMENTO 3",    img: "./assets/piso-04-mask.png", href: "./piso-4/" },
  5: { title: "PISO 5 / PENTHOUSE",        img: "./assets/piso-05-mask.png", href: "./piso-5/" },
};

Object.values(FLOORS).forEach(f => { const i = new Image(); i.src = f.img; });

const canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;

let selectedFloor = null;

function showFloor(n, mode){
  const f = FLOORS[n];
  if(!f) return;

  overlay.src = f.img;
  overlay.style.opacity = "1";
  hudTitle.textContent = f.title;

  if (mode === "tap") {
    hudSub.textContent = "Tap otra vez para entrar";
  } else {
    hudSub.textContent = "Click para entrar";
  }
}

function clearFloor(){
  overlay.style.opacity = "0";
  selectedFloor = null;
  hudTitle.textContent = "PASA EL MOUSE POR UN PISO";
  hudSub.textContent = "Torre Blanca";
}

function goToFloor(n){
  const f = FLOORS[n];
  if (f?.href) window.location.href = f.href;
}

document.querySelectorAll(".spot").forEach(btn => {
  const n = btn.dataset.floor;

  // Desktop hover real
  if (canHover) {
    btn.addEventListener("mouseenter", () => showFloor(n, "hover"));
    btn.addEventListener("mouseleave", clearFloor);
  }

  // Accesibilidad / teclado
  btn.addEventListener("focus", () => showFloor(n, canHover ? "hover" : "tap"));
  btn.addEventListener("blur", () => { if (canHover) clearFloor(); });

  // Click/tap
  btn.addEventListener("click", (e) => {
    if (canHover) {
      // desktop: click entra directo
      goToFloor(n);
      return;
    }

    // mobile: 1er tap previsualiza, 2do tap entra
    e.preventDefault();
    e.stopPropagation();

    if (selectedFloor !== n) {
      selectedFloor = n;
      showFloor(n, "tap");
      return;
    }

    goToFloor(n);
  });
});

// Tap fuera para limpiar (solo mobile)
document.addEventListener("click", (e) => {
  if (canHover) return;
  if (e.target && e.target.closest && e.target.closest(".spot")) return;
  clearFloor();
});

// En mobile, ajustar textos iniciales
if (!canHover) {
  hudTitle.textContent = "TOCÁ UN PISO";
  hudSub.textContent = "Tap para ver / Tap otra vez para entrar";
}
