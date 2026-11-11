// ==========================================================================
// RAPATINAI - MASTER CLIENT APPLICATION JAVASCRIPT ENTRYPOINT
// Struktur modular dipisahkan berdasarkan fungsi dan menu:
// ├── shared/         (state, utils, ui, topDock)
// ├── rapat-baru/     (form, peserta, dinamis, draft)
// ├── riwayat/        (riwayat, detail, ai, export)
// └── pengaturan/     (backup, tema)
// ==========================================================================

import { STATE, el } from "./shared/state.js";
import { initInteractiveBackground } from "./shared/ui.js";
import { initAnimatedTopDock, syncTopDockActive } from "./shared/topDock.js";
import { initBerandaEvents, bukaBeranda, updateBerandaStats } from "./beranda/beranda.js";
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

  if (STATE.isFormDirty && !STATE.isEditing && !hash.startsWith("#/baru") && hash !== "#baru" && hash !== "") {
    const konfirmasi = confirm("Perhatian: Ada catatan notulen yang belum disimpan ke database. Tinggalkan halaman formulir?");
    if (!konfirmasi) {
      window.location.hash = "#/baru";
      return;
    }
    STATE.isFormDirty = false;
  }

  if (hash.startsWith("#/detail/")) {
    const id = hash.replace("#/detail/", "").trim();
    if (id) {
      syncTopDockActive("riwayat");
      await tampilkanDetailRapat(id, false);
      return;
    }
  }

  if (hash === "#/beranda" || hash === "#beranda" || hash === "" || hash === "#/" || hash === "#") {
    syncTopDockActive("beranda");
    bukaBeranda(false);
    return;
  }

  if (hash === "#/pengaturan" || hash === "#pengaturan") {
    syncTopDockActive("pengaturan");
    bukaPengaturan(false);
    return;
  }

  if (hash === "#/riwayat" || hash === "#riwayat") {
    syncTopDockActive("riwayat");
    bukaRiwayat(false);
    return;
  }

  if (hash === "#/baru" || hash === "#baru") {
    syncTopDockActive("rapat-baru");
    tampilkanFormBaru(false);
    return;
  }

  syncTopDockActive("beranda");
  bukaBeranda(false);
}

/**
 * Inisialisasi pintasan keyboard (Ctrl+N, '/')
 */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
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
  initAnimatedTopDock();
  initBerandaEvents();
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
  updateBerandaStats();
  renderRiwayatBackup();

  // 3. Router hash listener
  window.addEventListener("hashchange", handleRoute);

  // 4. Jalankan rute awal
  if (window.location.hash) {
    await handleRoute();
  } else {
    window.location.hash = "#/beranda";
  }
}

// Jalankan otomatis
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inisialisasiApp);
} else {
  inisialisasiApp();
}
