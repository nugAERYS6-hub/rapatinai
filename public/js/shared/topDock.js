// ==========================================================================
// THREEUI ANIMATED TOP DOCK (SABLE DOCK) INTEGRATION
// Component: AnimatedTopDock
// Variant: sable
// Runtime: DOM + CSS + WebGL + Three.js r128
// Source revision: 5a736cd3c1f6f19802f61ebb10e1701b9f7aa26e
// ==========================================================================

import { createTopDockController, ANIMATED_TOP_DOCK_DEFAULTS } from "./topDockController.js";

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

  // Tab 1: Rapat Baru
  const btnRapatBaru = document.getElementById("dock-btn-rapat-baru");
  if (btnRapatBaru) {
    btnRapatBaru.addEventListener("click", () => {
      window.location.hash = "#/baru";
    });
  }

  // Tab 2: Riwayat Rapat
  const btnRiwayat = document.getElementById("dock-btn-riwayat");
  if (btnRiwayat) {
    btnRiwayat.addEventListener("click", () => {
      window.location.hash = "#/riwayat";
    });
  }

  // Tab 3: Pengaturan
  const btnPengaturan = document.getElementById("dock-btn-pengaturan");
  if (btnPengaturan) {
    btnPengaturan.addEventListener("click", () => {
      window.location.hash = "#/pengaturan";
    });
  }
}
