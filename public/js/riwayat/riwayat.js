// ==========================================================================
// MENU: RIWAYAT RAPAT - DAFTAR, STATISTIK, CARI & FILTER
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { escapeHtml } from "../shared/utils.js";
import { tutupSemuaView, resetSemuaMenuAktif, tampilkanToast } from "../shared/ui.js";

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

      if (el.badgeTrashCount) {
        const trashCount = json.data.terhapus || 0;
        el.badgeTrashCount.textContent = trashCount;
        el.badgeTrashCount.classList.toggle("tersembunyi", trashCount === 0);
      }
    }
  } catch (e) {
    console.warn("Gagal memuat statistik:", e);
  }
}

/**
 * Memuat daftar riwayat notulen rapat dengan pagination & filter (termasuk Tempat Sampah)
 */
export async function muatDaftarRapat(page = 1) {
  STATE.page = page;

  const isTrash = STATE.filter === "trash";
  if (el.trashNoticeBanner) {
    el.trashNoticeBanner.classList.toggle("tersembunyi", !isTrash);
  }

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
    let res;
    if (isTrash) {
      res = await fetch("/api/rapat/trash");
    } else {
      const params = new URLSearchParams({
        page: STATE.page,
        limit: STATE.limit,
        filter: STATE.filter,
      });
      if (STATE.searchQuery) params.set("q", STATE.searchQuery);
      res = await fetch(`/api/rapat?${params.toString()}`);
    }

    const json = await res.json();
    if (!json.success) throw new Error(json.error || json.pesan || "Gagal mengambil data rapat");

    STATE.daftarRapat = json.data || [];
    STATE.totalPages = isTrash ? 1 : (json.pagination?.totalPages || 1);
    const totalCount = isTrash ? (json.total ?? STATE.daftarRapat.length) : (json.pagination?.total || 0);

    if (el.counterDaftar) el.counterDaftar.textContent = totalCount;
    if (el.labelPageInfo) el.labelPageInfo.textContent = `Hal ${STATE.page} / ${STATE.totalPages}`;
    if (el.btnPrevPage) el.btnPrevPage.disabled = isTrash || STATE.page <= 1;
    if (el.btnNextPage) el.btnNextPage.disabled = isTrash || STATE.page >= STATE.totalPages;

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
 * Merender daftar rapat ke dalam list / grid (mendukung mode aktif & tempat sampah)
 */
export function renderSidebarList() {
  if (!el.daftarRapatSidebar) return;

  const isTrash = STATE.filter === "trash";

  if (STATE.daftarRapat.length === 0) {
    el.daftarRapatSidebar.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; grid-column: 1 / -1;">
        ${isTrash ? "Tempat sampah kosong. Tidak ada notulen rapat yang terhapus." : "Tidak ada data notulen ditemukan"}
      </div>
    `;
    return;
  }

  el.daftarRapatSidebar.innerHTML = "";

  STATE.daftarRapat.forEach((rapat) => {
    const item = document.createElement("div");
    item.className = "item-rapat-sidebar";
    if (isTrash) item.classList.add("trash-item");
    item.dataset.id = rapat.id;

    if (!isTrash && STATE.rapatAktif && STATE.rapatAktif.id === rapat.id) {
      item.classList.add("aktif");
    }

    if (isTrash) {
      item.innerHTML = `
        <div class="item-row-top">
          <span class="item-topik" title="${escapeHtml(rapat.topik)}">${escapeHtml(rapat.topik)}</span>
          <span class="badge-status-rapat badge-dijadwalkan" style="font-size: 10px; padding: 2px 7px;">Terhapus</span>
        </div>
        <div class="item-row-meta" style="margin-top: 4px;">
          <span class="item-tanggal">${escapeHtml(rapat.tanggal || "-")}</span>
          <span style="font-size: 11px; color: #94a3b8;">${escapeHtml(rapat.pimpinanRapat || "-")}</span>
        </div>
        <div class="trash-card-actions">
          <button type="button" class="btn-trash-restore" data-id="${rapat.id}" title="Pulihkan notulen ini">
            <span>↺ Pulihkan</span>
          </button>
          <button type="button" class="btn-trash-force" data-id="${rapat.id}" title="Hapus permanen dari database">
            <span>✕ Hapus Permanen</span>
          </button>
        </div>
      `;

      // Event listener Pulihkan
      const btnRestore = item.querySelector(".btn-trash-restore");
      if (btnRestore) {
        btnRestore.addEventListener("click", async (e) => {
          e.stopPropagation();
          try {
            btnRestore.disabled = true;
            btnRestore.textContent = "Memulihkan...";
            const res = await fetch(`/api/rapat/${rapat.id}/restore`, { method: "POST" });
            const json = await res.json();
            if (!json.success) throw new Error(json.pesan || "Gagal memulihkan rapat");

            tampilkanToast("Notulen rapat berhasil dipulihkan!");
            await muatStats();
            await muatDaftarRapat(1);
          } catch (err) {
            tampilkanToast(err.message, "error");
            btnRestore.disabled = false;
            btnRestore.textContent = "↺ Pulihkan";
          }
        });
      }

      // Event listener Hapus Permanen
      const btnForce = item.querySelector(".btn-trash-force");
      if (btnForce) {
        btnForce.addEventListener("click", async (e) => {
          e.stopPropagation();
          const konfirmasi = confirm(`Hapus PERMANEN notulen "${rapat.topik}"?\n\nPERINGATAN: Tindakan ini tidak dapat dibatalkan dan data akan hilang selamanya dari database.`);
          if (!konfirmasi) return;

          try {
            btnForce.disabled = true;
            btnForce.textContent = "Menghapus...";
            const res = await fetch(`/api/rapat/${rapat.id}/force`, { method: "DELETE" });
            const json = await res.json();
            if (!json.success) throw new Error(json.pesan || "Gagal menghapus permanen");

            tampilkanToast("Notulen rapat berhasil dihapus permanen");
            await muatStats();
            await muatDaftarRapat(1);
          } catch (err) {
            tampilkanToast(err.message, "error");
            btnForce.disabled = false;
            btnForce.textContent = "✕ Hapus Permanen";
          }
        });
      }
    } else {
      item.innerHTML = `
        <div class="item-row-top">
          <span class="item-topik" title="${escapeHtml(rapat.topik)}">${escapeHtml(rapat.topik)}</span>
        </div>
        <div class="item-row-meta">
          <span class="item-tanggal">${escapeHtml(rapat.tanggal || "-")}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        window.location.hash = `#/detail/${rapat.id}`;
      });
    }

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
