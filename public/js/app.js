// ==========================================================================
// RAPATINAI - MASTER CLIENT APPLICATION JAVASCRIPT ENTRYPOINT
// Struktur modular dipisahkan berdasarkan fungsi dan menu:
// ├── shared/         (state, utils, ui, sidebar)
// ├── rapat-baru/     (form, peserta, dinamis, draft)
// ├── riwayat/        (riwayat, detail, ai, export)
// └── pengaturan/     (backup, tema)
// ==========================================================================

import { el } from "./shared/state.js";
import { initSidebarEvents, toggleSidebar, initInteractiveBackground, updateSidebarGlider } from "./shared/ui.js";
import { initFormEvents, tampilkanFormBaru } from "./rapat-baru/form.js";
import { initRiwayatEvents, muatStats, muatDaftarRapat, bukaRiwayat } from "./riwayat/riwayat.js";
import { initDetailEvents, tampilkanDetailRapat } from "./riwayat/detail.js";
import { initAiEvents } from "./riwayat/ai.js";
import { initExportEvents } from "./riwayat/export.js";
import { initBackupEvents, bukaPengaturan, renderRiwayatBackup } from "./pengaturan/backup.js";
import { initTemaEvents } from "./pengaturan/tema.js";

/**
 * Client-Side Hash Router
 */
export async function handleRoute() {
  const hash = window.location.hash || "";

  if (hash.startsWith("#/detail/")) {
    const id = hash.replace("#/detail/", "").trim();
    if (id) {
      await tampilkanDetailRapat(id, false);
      requestAnimationFrame(updateSidebarGlider);
      return;
    }
  }

  if (hash === "#/pengaturan" || hash === "#pengaturan") {
    bukaPengaturan(false);
    requestAnimationFrame(updateSidebarGlider);
    return;
  }

  if (hash === "#/riwayat" || hash === "#riwayat") {
    bukaRiwayat(false);
    requestAnimationFrame(updateSidebarGlider);
    return;
  }

  if (hash === "#/baru" || hash === "#baru") {
    tampilkanFormBaru(false);
    requestAnimationFrame(updateSidebarGlider);
    return;
  }

  tampilkanFormBaru(false);
  requestAnimationFrame(updateSidebarGlider);
}

/**
 * Inisialisasi pintasan keyboard (Ctrl+B, Ctrl+N, '/')
 */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleSidebar();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
      e.preventDefault();
      window.location.hash = "#/baru";
    }
    if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      el.inputCari?.focus();
    }
  });
}

/**
 * Inisialisasi Aplikasi Saat Halaman Selesai Dimuat
 */
export async function inisialisasiApp() {
  // 1. Inisialisasi komponen dasar, latar interaktif & event
  initInteractiveBackground();
  initSidebarEvents();
  initFormEvents();
  initRiwayatEvents();
  initDetailEvents();
  initAiEvents();
  initExportEvents();
  initBackupEvents();
  initTemaEvents();
  initKeyboardShortcuts();

  // 2. Muat data awal
  await muatStats();
  await muatDaftarRapat(1);
  renderRiwayatBackup();

  // 3. Router hash listener
  window.addEventListener("hashchange", handleRoute);

  // 4. Jalankan rute awal
  if (window.location.hash) {
    await handleRoute();
  } else {
    window.location.hash = "#/baru";
  }
}

// Jalankan otomatis
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inisialisasiApp);
} else {
  inisialisasiApp();
}
