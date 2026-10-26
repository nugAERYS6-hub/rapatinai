// ==========================================================================
// RAPATINAI - UI INTERACTION, TOAST, & SIDEBAR MANAGEMENT
// ==========================================================================

import { el, elPengaturan } from "./state.js";

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
  if (el.viewRiwayat) el.viewRiwayat.classList.add("tersembunyi");
  if (el.viewDetail) el.viewDetail.classList.add("tersembunyi");
  if (el.viewForm) el.viewForm.classList.add("tersembunyi");
  if (elPengaturan.viewPengaturan) elPengaturan.viewPengaturan.classList.add("tersembunyi");
}

/**
 * Menghapus status 'aktif' dari seluruh menu sidebar
 */
export function resetSemuaMenuAktif() {
  [el.menuRapatBaru, el.menuRiwayatRapat, elPengaturan.menuPengaturan].forEach((m) => {
    if (m) m.classList.remove("aktif");
  });
}

/**
 * Sinkronisasi visual checkbox hamburger dan tombol buka
 */
export function syncHamburgerMotion() {
  const isMobile = window.innerWidth <= 960;
  const isBuka = isMobile
    ? Boolean(el.sidebar && el.sidebar.classList.contains("buka"))
    : !document.body.classList.contains("sidebar-collapsed");

  const checkTop = document.getElementById("check-icon-top");
  const checkSidebar = document.getElementById("check-icon-sidebar");

  if (checkSidebar) {
    checkSidebar.checked = isBuka;
  }
  if (checkTop) {
    checkTop.checked = isMobile ? isBuka : false;
  }
}

/**
 * Toggle buka/tutup sidebar (desktop collapsible / mobile drawer)
 */
export function toggleSidebar(forceState) {
  const isMobile = window.innerWidth <= 960;

  if (isMobile) {
    const isBuka = el.sidebar && el.sidebar.classList.contains("buka");
    const targetState = typeof forceState === "boolean" ? !forceState : !isBuka;
    if (targetState) {
      if (el.sidebar) el.sidebar.classList.add("buka");
      if (el.sidebarOverlay) el.sidebarOverlay.classList.remove("tersembunyi");
    } else {
      if (el.sidebar) el.sidebar.classList.remove("buka");
      if (el.sidebarOverlay) el.sidebarOverlay.classList.add("tersembunyi");
    }
  } else {
    const isCollapsed = document.body.classList.contains("sidebar-collapsed");
    const targetCollapsed = typeof forceState === "boolean" ? forceState : !isCollapsed;

    document.body.classList.toggle("sidebar-collapsed", targetCollapsed);
    try {
      localStorage.setItem("rapatinai_sidebar_collapsed", targetCollapsed ? "true" : "false");
    } catch (e) {}
  }

  syncHamburgerMotion();
}

export function bukaSidebarMobile() {
  toggleSidebar(false);
}

export function tutupSidebarMobile() {
  toggleSidebar(true);
}

/**
 * Inisialisasi event listeners sidebar & tombol hamburger
 */
export function initSidebarEvents() {
  // Restore saved desktop state
  try {
    const savedState = localStorage.getItem("rapatinai_sidebar_collapsed");
    if (savedState === "true" && window.innerWidth > 960) {
      document.body.classList.add("sidebar-collapsed");
    }
  } catch (e) {}

  [el.btnToggleSidebar, el.btnBukaSidebar, el.btnBukaMobile, el.btnTutupMobile].filter(Boolean).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  });

  const checkTopInput = document.getElementById("check-icon-top");
  const checkSidebarInput = document.getElementById("check-icon-sidebar");
  if (checkTopInput) {
    checkTopInput.addEventListener("change", (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }
  if (checkSidebarInput) {
    checkSidebarInput.addEventListener("change", (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (el.sidebarOverlay) {
    el.sidebarOverlay.addEventListener("click", () => toggleSidebar(true));
  }

  window.addEventListener("resize", syncHamburgerMotion);
  syncHamburgerMotion();
}
