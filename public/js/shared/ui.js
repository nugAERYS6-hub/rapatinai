// ==========================================================================
// RAPATINAI - UI INTERACTION, TOAST, & SIDEBAR MANAGEMENT
// ==========================================================================

import { el, elPengaturan } from "./state.js";
import { cleanupPen3D } from "../beranda/pen3d.js";

/**
 * Menampilkan Toast notifikasi di pojok layar
 */
export function tampilkanToast(pesan, tipe = "sukses") {
  if (!el.kontainerToast) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipe}`;

  let ikon = "✓";
  if (tipe === "error") ikon = "✕";
  if (tipe === "info") ikon = "ℹ";

  const amanPesan = String(pesan)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  toast.innerHTML = `<span>${ikon}</span> <span>${amanPesan}</span>`;
  el.kontainerToast.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast-tampil"));

  setTimeout(() => {
    toast.classList.remove("toast-tampil");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

/**
 * Menyembunyikan seluruh tampilan (views) utama
 */
export function tutupSemuaView() {
  if (el.viewBeranda) el.viewBeranda.classList.add("tersembunyi");
  if (el.viewRiwayat) el.viewRiwayat.classList.add("tersembunyi");
  if (el.viewDetail) el.viewDetail.classList.add("tersembunyi");
  if (el.viewForm) el.viewForm.classList.add("tersembunyi");
  if (elPengaturan.viewPengaturan) elPengaturan.viewPengaturan.classList.add("tersembunyi");

  try {
    cleanupPen3D();
  } catch (_) {}
}

/**
 * Menghapus status 'aktif' dari seluruh menu sidebar
 */
/**
 * Reset menu aktif (kompatibilitas backward)
 */
export function resetSemuaMenuAktif() {
  // Navigasi aktif dikelola langsung oleh Top Dock Controller
}

/**
 * Inisialisasi latar belakang interaktif (grid texture, mouse spotlight, dan card shimmer)
 */
export function initInteractiveBackground() {
  const mainPanel = document.querySelector(".main-panel");
  if (!mainPanel) return;

  let rafId = null;
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight * 0.35;
  let currentX = targetX;
  let currentY = targetY;

  function updateMotion() {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;

    mainPanel.style.setProperty("--mouse-x", `${currentX.toFixed(1)}px`);
    mainPanel.style.setProperty("--mouse-y", `${currentY.toFixed(1)}px`);

    if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
      rafId = requestAnimationFrame(updateMotion);
    } else {
      rafId = null;
    }
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      const rect = mainPanel.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;

      if (!rafId) {
        rafId = requestAnimationFrame(updateMotion);
      }

      // Card hover shimmer positioning
      const card = e.target.closest(
        ".card-luxury, .detail-hero-card, .form-card-section, .riwayat-stat-card, .backup-stat-card, .item-rapat-sidebar"
      );
      if (card) {
        const cRect = card.getBoundingClientRect();
        card.style.setProperty("--card-mouse-x", `${(e.clientX - cRect.left).toFixed(1)}px`);
        card.style.setProperty("--card-mouse-y", `${(e.clientY - cRect.top).toFixed(1)}px`);
      }
    },
    { passive: true }
  );

  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    sidebar.addEventListener(
      "pointermove",
      (e) => {
        const sRect = sidebar.getBoundingClientRect();
        const relY = e.clientY - sRect.top;
        sidebar.style.setProperty("--sidebar-mouse-y", `${relY.toFixed(1)}px`);
      },
      { passive: true }
    );
  }
}

