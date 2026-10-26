// ==========================================================================
// MENU: RIWAYAT RAPAT - DAFTAR, STATISTIK, CARI & FILTER
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { escapeHtml } from "../shared/utils.js";
import { tutupSemuaView, resetSemuaMenuAktif, tutupSidebarMobile } from "../shared/ui.js";

/**
 * Memuat ringkasan statistik (total, bulan ini, ada AI)
 */
export async function muatStats() {
  try {
    const res = await fetch("/api/stats");
    const json = await res.json();
    if (json.success && json.data) {
      if (el.statTotalRapat) el.statTotalRapat.textContent = json.data.totalRapat;
      if (el.statBulanIni) el.statBulanIni.textContent = json.data.rapatBulanIni;
      if (el.statAiReady) el.statAiReady.textContent = json.data.denganAI;
    }
  } catch (e) {
    console.warn("Gagal memuat statistik:", e);
  }
}

/**
 * Memuat daftar riwayat notulen rapat dengan pagination & filter
 */
export async function muatDaftarRapat(page = 1) {
  STATE.page = page;

  if (el.daftarRapatSidebar) {
    el.daftarRapatSidebar.innerHTML = `
      <div class="sidebar-skeleton-wrap">
        <div class="skeleton skeleton-item"></div>
        <div class="skeleton skeleton-item"></div>
        <div class="skeleton skeleton-item"></div>
      </div>
    `;
  }

  try {
    const params = new URLSearchParams({
      page: STATE.page,
      limit: STATE.limit,
      filter: STATE.filter,
    });
    if (STATE.searchQuery) params.set("q", STATE.searchQuery);

    const res = await fetch(`/api/rapat?${params.toString()}`);
    const json = await res.json();

    if (!json.success) throw new Error(json.error || "Gagal mengambil data rapat");

    STATE.daftarRapat = json.data || [];
    STATE.totalPages = json.pagination?.totalPages || 1;
    const totalCount = json.pagination?.total || 0;

    if (el.counterDaftar) el.counterDaftar.textContent = totalCount;
    if (el.labelPageInfo) el.labelPageInfo.textContent = `Hal ${STATE.page} / ${STATE.totalPages}`;
    if (el.btnPrevPage) el.btnPrevPage.disabled = STATE.page <= 1;
    if (el.btnNextPage) el.btnNextPage.disabled = STATE.page >= STATE.totalPages;

    renderSidebarList();
  } catch (err) {
    if (el.daftarRapatSidebar) {
      el.daftarRapatSidebar.innerHTML = `
        <div style="padding: 16px; color: #f87171; font-size: 12px;">
          Gagal memuat data: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}

/**
 * Merender daftar rapat ke dalam list / grid
 */
export function renderSidebarList() {
  if (!el.daftarRapatSidebar) return;

  if (STATE.daftarRapat.length === 0) {
    el.daftarRapatSidebar.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px;">
        Tidak ada data notulen ditemukan
      </div>
    `;
    return;
  }

  el.daftarRapatSidebar.innerHTML = "";

  STATE.daftarRapat.forEach((rapat) => {
    const item = document.createElement("div");
    item.className = "item-rapat-sidebar";
    item.dataset.id = rapat.id;

    if (STATE.rapatAktif && STATE.rapatAktif.id === rapat.id) {
      item.classList.add("aktif");
    }

    item.innerHTML = `
      <div class="item-row-top">
        <span class="item-topik" title="${escapeHtml(rapat.topik)}">${escapeHtml(rapat.topik)}</span>
      </div>
      <div class="item-row-meta">
        <span class="item-tanggal">${escapeHtml(rapat.tanggal || "-")}</span>
      </div>
    `;

    item.addEventListener("click", () => {
      tutupSidebarMobile();
      window.location.hash = `#/detail/${rapat.id}`;
    });

    el.daftarRapatSidebar.appendChild(item);
  });
}

/**
 * Menampilkan panel utama Riwayat Rapat
 */
export function bukaRiwayat(syncHash = true) {
  if (syncHash && window.location.hash !== "#/riwayat") {
    window.location.hash = "#/riwayat";
    return;
  }
  tutupSidebarMobile();
  resetSemuaMenuAktif();
  if (el.menuRiwayatRapat) el.menuRiwayatRapat.classList.add("aktif");
  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  if (el.breadcrumbCurrent) el.breadcrumbCurrent.textContent = "Riwayat Rapat";
  tutupSemuaView();
  if (el.viewRiwayat) el.viewRiwayat.classList.remove("tersembunyi");
}

/**
 * Inisialisasi event pencarian, filter, dan pagination
 */
export function initRiwayatEvents() {
  // Menu sidebar click
  if (el.menuRiwayatRapat) {
    el.menuRiwayatRapat.addEventListener("click", () => {
      tutupSidebarMobile();
      if (window.location.hash === "#/riwayat") {
        bukaRiwayat(false);
      } else {
        window.location.hash = "#/riwayat";
      }
    });
  }

  // Breadcrumb middle click
  if (el.breadcrumbMiddle) {
    el.breadcrumbMiddle.addEventListener("click", () => {
      window.location.hash = "#/riwayat";
    });
  }

  // Input cari rapat
  if (el.inputCari) {
    el.inputCari.addEventListener("input", (e) => {
      const val = e.target.value;
      el.btnClearCari?.classList.toggle("tersembunyi", !val);

      clearTimeout(STATE.searchDebounceTimer);
      STATE.searchDebounceTimer = setTimeout(() => {
        STATE.searchQuery = val.trim();
        muatDaftarRapat(1);
      }, 280);
    });
  }

  // Clear cari
  if (el.btnClearCari) {
    el.btnClearCari.addEventListener("click", () => {
      if (el.inputCari) el.inputCari.value = "";
      el.btnClearCari.classList.add("tersembunyi");
      STATE.searchQuery = "";
      muatDaftarRapat(1);
    });
  }

  // Filter pills
  if (el.filterPills) {
    el.filterPills.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        el.filterPills.querySelectorAll(".pill").forEach((p) => p.classList.remove("aktif"));
        pill.classList.add("aktif");
        STATE.filter = pill.dataset.filter;
        muatDaftarRapat(1);
      });
    });
  }

  // Pagination buttons
  if (el.btnPrevPage) {
    el.btnPrevPage.addEventListener("click", () => {
      if (STATE.page > 1) muatDaftarRapat(STATE.page - 1);
    });
  }

  if (el.btnNextPage) {
    el.btnNextPage.addEventListener("click", () => {
      if (STATE.page < STATE.totalPages) muatDaftarRapat(STATE.page + 1);
    });
  }
}
