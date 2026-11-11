// ==========================================================================
// MENU: BERANDA - LANDING PAGE & PENGENALAN NOTULENSI
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { tutupSemuaView, resetSemuaMenuAktif } from "../shared/ui.js";

let berandaObserver = null;

/**
 * Inisialisasi animasi scroll reveal (fade up) khusus untuk elemen di halaman Beranda
 */
export function initBerandaScrollReveal() {
  const scrollContainer = document.querySelector(".main-scrollable-content");
  const revealElements = document.querySelectorAll("#tampilan-beranda .reveal-fade-up");
  if (!revealElements.length) return;

  if (berandaObserver) {
    berandaObserver.disconnect();
    berandaObserver = null;
  }

  // Cek apakah browser mendukung IntersectionObserver
  if ("IntersectionObserver" in window) {
    berandaObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: scrollContainer || null,
        rootMargin: "0px 0px -20px 0px",
        threshold: 0.08,
      }
    );

    revealElements.forEach((element) => {
      // Jika elemen sudah masuk di area pandang awal, langsung tampilkan
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < windowHeight * 0.95 && rect.bottom > 0) {
        element.classList.add("revealed");
      } else {
        berandaObserver.observe(element);
      }
    });
  } else {
    // Fallback untuk browser lawas: langsung tampilkan
    revealElements.forEach((element) => element.classList.add("revealed"));
  }
}

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

  // Jalankan scroll reveal animation
  requestAnimationFrame(() => {
    initBerandaScrollReveal();
  });
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

  // Scroll listener pendukung pada scrollable main content
  const scrollContainer = document.querySelector(".main-scrollable-content");
  if (scrollContainer) {
    let scrollRaf = null;
    scrollContainer.addEventListener(
      "scroll",
      () => {
        if (!scrollRaf) {
          scrollRaf = requestAnimationFrame(() => {
            const unrevealed = document.querySelectorAll("#tampilan-beranda .reveal-fade-up:not(.revealed)");
            if (unrevealed.length) {
              const containerRect = scrollContainer.getBoundingClientRect();
              unrevealed.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top <= containerRect.bottom - 20 && rect.bottom >= containerRect.top) {
                  el.classList.add("revealed");
                }
              });
            }
            scrollRaf = null;
          });
        }
      },
      { passive: true }
    );
  }

  // Inisialisasi awal animasi
  initBerandaScrollReveal();
}
