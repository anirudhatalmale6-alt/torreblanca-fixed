/* ===== TORRE BLANCA MOBILE FIX: detach HUD from map ===== */
(function(){
  function isMobile(){ return window.matchMedia && window.matchMedia("(max-width: 900px)").matches; }

  function detachHud(){
    if(!isMobile()) return;

    const hud = document.getElementById("hud");
    const stage = document.querySelector(".stage");
    const hero = document.querySelector(".hero");

    if(!hud || !stage || !hero) return;

    // Si ya está fuera del stack, no repetir
    if(hud.classList.contains("hud-mobile-detached")) return;

    // Mover HUD JUSTO DESPUÉS DEL MAPA (stage) => separado
    stage.insertAdjacentElement("afterend", hud);
    hud.classList.add("hud-mobile-detached");
  }

  document.addEventListener("DOMContentLoaded", detachHud);
  window.addEventListener("resize", detachHud);
})();
