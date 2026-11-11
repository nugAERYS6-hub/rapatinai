// ==========================================================================
// MENU: BERANDA - LANDING PAGE & PENGENALAN NOTULENSI
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { tutupSemuaView, resetSemuaMenuAktif } from "../shared/ui.js";

/**
 * Memperbarui tampilan angka statistik di kartu metrik Beranda
 */
export function updateBerandaStats() {
  const statTotal = document.getElementById("stat-beranda-total");
  const statBulan = document.getElementById("stat-beranda-bulan");
  const statAi = document.getElementById("stat-beranda-ai");

  if (el.statTotalRapat && statTotal) {
    statTotal.textContent = el.statTotalRapat.textContent || "0";
  }
  if (el.statBulanIni && statBulan) {
    statBulan.textContent = el.statBulanIni.textContent || "0";
  }
  if (el.statAiReady && statAi) {
    statAi.textContent = el.statAiReady.textContent || "0";
  }
}

/**
 * Menampilkan halaman Beranda (Landing Page)
 */
export function bukaBeranda(syncHash = true) {
  if (syncHash && window.location.hash !== "#/beranda") {
    window.location.hash = "#/beranda";
    return;
  }

  resetSemuaMenuAktif();
  if (el.menuBeranda) el.menuBeranda.classList.add("aktif");

  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  if (el.breadcrumbCurrent) el.breadcrumbCurrent.textContent = "Beranda";

  tutupSemuaView();
  if (el.viewBeranda) {
    el.viewBeranda.classList.remove("tersembunyi");
  }

  updateBerandaStats();
}

/**
 * Inisialisasi event navigasi kartu dan tombol aksi pada halaman Beranda
 */
export function initBerandaEvents() {
  // Tombol Hero Utama
  const btnHeroMulai = document.getElementById("btn-hero-mulai-rapat");
  if (btnHeroMulai) {
    btnHeroMulai.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.hash = "#/baru";
    });
  }

  const btnHeroRiwayat = document.getElementById("btn-hero-buka-riwayat");
  if (btnHeroRiwayat) {
    btnHeroRiwayat.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.hash = "#/riwayat";
    });
  }

  // Tombol Kartu Penjelasan Tab Menu
  const btnCardRapat = document.getElementById("btn-card-rapat-baru");
  if (btnCardRapat) {
    btnCardRapat.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.hash = "#/baru";
    });
  }

  const btnCardRiwayat = document.getElementById("btn-card-riwayat-rapat");
  if (btnCardRiwayat) {
    btnCardRiwayat.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.hash = "#/riwayat";
    });
  }

  const btnCardPengaturan = document.getElementById("btn-card-pengaturan");
  if (btnCardPengaturan) {
    btnCardPengaturan.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.hash = "#/pengaturan";
    });
  }
}
