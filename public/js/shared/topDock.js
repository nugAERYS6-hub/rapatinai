// ==========================================================================
// THREEUI ANIMATED TOP DOCK (SABLE DOCK) INTEGRATION
// Component: AnimatedTopDock
// Variant: sable
// Runtime: DOM + CSS + WebGL + Three.js r128
// Source revision: 5a736cd3c1f6f19802f61ebb10e1701b9f7aa26e
// ==========================================================================

import { createTopDockController, ANIMATED_TOP_DOCK_DEFAULTS } from "./topDockController.js";
import { STATE } from "./state.js";
import { tampilkanToast } from "./ui.js";

let topDockCleanup = null;

export const TOP_DOCK_CONFIG = {
  ...ANIMATED_TOP_DOCK_DEFAULTS,
  variant: "sable",
  proximity: 122,
  spring: 0.19,
  damping: 0.70,
  widthGrowth: 17,
  heightGrowth: 16,
  drop: 3.5,
  axis: "x",
  distribute: false,
  lockTrack: false,
};

/**
 * Sinkronisasi item aktif pada AnimatedTopDock berdasarkan rute aktif
 */
export function syncTopDockActive(dockId) {
  const root = document.getElementById("animated-top-dock-nav");
  if (!root) return;

  const links = root.querySelectorAll(".animated-top-dock__link");
  links.forEach((btn) => {
    const id = btn.getAttribute("data-dock-id");
    const isActive = id === dockId;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

/**
 * Inisialisasi AnimatedTopDock controller dan event click
 */
export function initAnimatedTopDock() {
  const root = document.getElementById("animated-top-dock-nav");
  if (!root) return;

  if (topDockCleanup) {
    topDockCleanup();
    topDockCleanup = null;
  }

  // Bangun spring physics controller dari exact ThreeUI source
  topDockCleanup = createTopDockController(root, () => TOP_DOCK_CONFIG);

  // Logo button (Home)
  const btnLogo = document.getElementById("dock-btn-logo");
  if (btnLogo) {
    btnLogo.addEventListener("click", () => {
      window.location.hash = "#/riwayat";
    });
  }

  // SYSTEM -> Notulen Rapat Baru
  const btnSystem = document.getElementById("dock-btn-system");
  if (btnSystem) {
    btnSystem.addEventListener("click", () => {
      window.location.hash = "#/baru";
    });
  }

  // METHOD -> AI Intelligence Suite (Ringkasan, Ide, Action Items)
  const btnMethod = document.getElementById("dock-btn-method");
  if (btnMethod) {
    btnMethod.addEventListener("click", () => {
      if (STATE.rapatAktif && STATE.rapatAktif.id) {
        window.location.hash = `#/detail/${STATE.rapatAktif.id}`;
        setTimeout(() => {
          const aiSuite = document.querySelector(".ai-suite-container, .card-ai-suite");
          if (aiSuite) {
            aiSuite.scrollIntoView({ behavior: "smooth", block: "center" });
            aiSuite.classList.add("highlight-pulse");
            setTimeout(() => aiSuite.classList.remove("highlight-pulse"), 1500);
          }
        }, 300);
      } else {
        window.location.hash = "#/riwayat";
        tampilkanToast("Pilih salah satu rapat untuk mengakses modul AI Intelligence", "info");
      }
      syncTopDockActive("method");
    });
  }

  // WORK -> Riwayat Rapat & Arsip
  const btnWork = document.getElementById("dock-btn-work");
  if (btnWork) {
    btnWork.addEventListener("click", () => {
      window.location.hash = "#/riwayat";
    });
  }

  // ACCESS -> Pengaturan Instansi & Tema
  const btnAccess = document.getElementById("dock-btn-access");
  if (btnAccess) {
    btnAccess.addEventListener("click", () => {
      window.location.hash = "#/pengaturan";
    });
  }

  // NOTES -> Detail Notulen Rapat Aktif
  const btnNotes = document.getElementById("dock-btn-notes");
  if (btnNotes) {
    btnNotes.addEventListener("click", () => {
      if (STATE.rapatAktif && STATE.rapatAktif.id) {
        window.location.hash = `#/detail/${STATE.rapatAktif.id}`;
      } else {
        window.location.hash = "#/riwayat";
        tampilkanToast("Pilih rapat dari daftar riwayat terlebih dahulu untuk melihat catatan", "info");
      }
    });
  }
}

