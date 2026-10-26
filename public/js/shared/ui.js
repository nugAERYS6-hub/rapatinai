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
  const isMobile = window.innerWidth <= 960;
  if (isMobile) {
    toggleSidebar(false);
  }
}

export function tutupSidebarMobile() {
  const isMobile = window.innerWidth <= 960;
  if (isMobile) {
    toggleSidebar(true);
  }
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

  // Inisialisasi glider tab menu aktif
  initSidebarGlider();
}

/**
 * Update posisi glider aktif di sidebar menu (motion meluncur mulus dari tab ke tab)
 */
export function updateSidebarGlider(immediate = false) {
  const sidebarMenu = document.getElementById("sidebar-menu");
  const glider = document.getElementById("sidebar-active-glider");
  if (!sidebarMenu || !glider) return;

  const activeItem = sidebarMenu.querySelector(".menu-item.aktif");
  if (!activeItem) {
    glider.style.opacity = "0";
    return;
  }

  const menuRect = sidebarMenu.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();
  const topOffset = itemRect.top - menuRect.top;
  const height = itemRect.height;

  if (immediate) {
    glider.style.transition = "none";
    glider.style.transform = `translateY(${topOffset}px)`;
    glider.style.height = `${height}px`;
    glider.style.opacity = "1";
    void glider.offsetHeight; // Force reflow
    glider.style.transition = "";
  } else {
    glider.style.opacity = "1";
    glider.style.height = `${height}px`;
    glider.style.transform = `translateY(${topOffset}px)`;
  }
}

/**
 * Inisialisasi observer & listeners untuk glider menu sidebar
 */
export function initSidebarGlider() {
  const sidebarMenu = document.getElementById("sidebar-menu");
  if (!sidebarMenu) return;

  // Inisialisasi posisi awal tanpa hentakan
  requestAnimationFrame(() => updateSidebarGlider(true));

  // Amati perubahan class pada menu-item secara otomatis
  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => updateSidebarGlider(false));
  });

  observer.observe(sidebarMenu, {
    attributes: true,
    subtree: true,
    attributeFilter: ["class"]
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(() => updateSidebarGlider(true));
  });
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

