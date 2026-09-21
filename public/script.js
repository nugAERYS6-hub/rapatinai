// ==========================================================================
// RAPATINAI — EXECUTIVE CLIENT APPLICATION JAVASCRIPT
// Enterprise Architecture: Reactive UI, FTS5 Search, Draft Auto-Save & AI Hub
// ==========================================================================

// --- State Aplikasi ---
const STATE = {
  rapatAktif: null,
  daftarRapat: [],
  page: 1,
  totalPages: 1,
  limit: 20,
  filter: "all",
  searchQuery: "",
  searchDebounceTimer: null,
  anggotaForm: [],
  isEditing: false,
  editId: null,
  draftStorageKey: "rapatinai_draft_v3",
};

// --- Elemen DOM Utama ---
const el = {
  // Sidebar
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebar-overlay"),
  btnBukaMobile: document.getElementById("tombol-buka-sidebar-mobile"),
  btnTutupMobile: document.getElementById("tombol-tutup-sidebar-mobile"),
  btnRapatBaru: document.getElementById("tombol-rapat-baru"),
  btnHeaderNew: document.getElementById("btn-header-new"),
  inputCari: document.getElementById("input-cari-rapat"),
  btnClearCari: document.getElementById("tombol-clear-cari"),
  filterPills: document.getElementById("filter-pills"),
  daftarRapatSidebar: document.getElementById("daftar-rapat-sidebar"),
  counterDaftar: document.getElementById("counter-daftar"),
  btnPrevPage: document.getElementById("btn-prev-page"),
  btnNextPage: document.getElementById("btn-next-page"),
  labelPageInfo: document.getElementById("label-page-info"),

  // Stats
  statTotalRapat: document.getElementById("stat-total-rapat"),
  statBulanIni: document.getElementById("stat-bulan-ini"),
  statAiReady: document.getElementById("stat-ai-ready"),

  // Views & Breadcrumb
  breadcrumbCurrent: document.getElementById("breadcrumb-current"),
  drafAutoSavePill: document.getElementById("draf-auto-save-pill"),
  viewDetail: document.getElementById("tampilan-detail"),
  viewForm: document.getElementById("tampilan-form"),

  // Detail View
  detailTopik: document.getElementById("detail-topik"),
  detailTanggal: document.getElementById("detail-tanggal"),
  detailWaktu: document.getElementById("detail-waktu"),
  detailTempat: document.getElementById("detail-tempat"),
  detailStatus: document.getElementById("detail-badge-status"),
  detailPimpinan: document.getElementById("detail-pimpinan"),
  detailNotulis: document.getElementById("detail-notulis"),
  detailTotalPeserta: document.getElementById("detail-total-peserta"),
  avatarPimpinan: document.getElementById("avatar-pimpinan"),
  avatarNotulis: document.getElementById("avatar-notulis"),
  btnUnduhPdf: document.getElementById("btn-unduh-pdf"),
  btnUnduhWord: document.getElementById("btn-unduh-word"),
  btnSalinNotulen: document.getElementById("btn-salin-notulen"),
  btnEditRapat: document.getElementById("btn-edit-rapat"),
  btnHapusRapat: document.getElementById("btn-hapus-rapat"),

  // AI Suite
  btnAiRingkasan: document.getElementById("btn-ai-ringkasan"),
  btnAiIde: document.getElementById("btn-ai-ide"),
  kontenRingkasanAi: document.getElementById("konten-ringkasan-ai"),
  kontenIdeAi: document.getElementById("konten-ide-ai"),
  btnCopyRingkasan: document.getElementById("btn-copy-ringkasan"),
  btnCopyIde: document.getElementById("btn-copy-ide"),

  // Cards Content
  kontenPesertaGrid: document.getElementById("konten-peserta-grid"),
  kontenPoinList: document.getElementById("konten-poin-list"),
  paperPreviewContent: document.getElementById("paper-preview-content"),
  btnPrintDoc: document.getElementById("btn-print-doc"),
  badgePesertaCount: document.getElementById("badge-peserta-count"),
  badgePoinCount: document.getElementById("badge-poin-count"),

  // Form View
  formRapat: document.getElementById("form-rapat"),
  judulForm: document.getElementById("judul-form"),
  formModeTag: document.getElementById("form-mode-tag"),
  editIdRapat: document.getElementById("edit-id-rapat"),
  inputTanggal: document.getElementById("tanggal"),
  inputTopik: document.getElementById("topik"),
  inputPimpinan: document.getElementById("pimpinan"),
  inputNotulis: document.getElementById("notulis"),
  inputWaktu: document.getElementById("waktu"),
  inputTempat: document.getElementById("tempat"),
  daftarAnggotaChips: document.getElementById("daftar-anggota-chips"),
  btnBukaModalAnggota: document.getElementById("tombol-buka-modal-anggota"),
  daftarPoinInputs: document.getElementById("daftar-poin-inputs"),
  btnTambahPoin: document.getElementById("tambah-poin"),
  btnBatalForm: document.getElementById("tombol-batal-form"),
  btnSimpanSubmit: document.getElementById("tombol-simpan-submit"),
  labelSimpanSubmit: document.getElementById("label-simpan-submit"),

  // Modal Anggota
  modalAnggota: document.getElementById("modal-anggota"),
  btnCloseModalX: document.getElementById("btn-close-modal-x"),
  formModalAnggota: document.getElementById("form-modal-anggota"),
  inputModalNama: document.getElementById("modal-nama"),
  inputModalJabatan: document.getElementById("modal-jabatan"),
  inputModalInstansi: document.getElementById("modal-instansi"),
  btnBatalAnggota: document.getElementById("tombol-batal-anggota"),
  btnSimpanAnggota: document.getElementById("tombol-simpan-anggota"),

  // Toast
  kontainerToast: document.getElementById("kontainer-toast"),
};

// Helper Format Hari / Tanggal Indonesia ("Senin / 28 April 2014")
function formatHariTanggal(tglStr) {
  if (!tglStr) return "-";
  try {
    const d = new Date(tglStr);
    if (isNaN(d.getTime())) return tglStr;
    const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulanArr = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${hariArr[d.getDay()]} / ${d.getDate()} ${bulanArr[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return tglStr;
  }
}

// ==========================================================================
// TOAST NOTIFIKASI
// ==========================================================================
function tampilkanToast(pesan, tipe = "sukses") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipe}`;

  let ikon = "✓";
  if (tipe === "error") ikon = "✕";
  if (tipe === "info") ikon = "ℹ";

  toast.innerHTML = `<span>${ikon}</span> <span>${pesan}</span>`;
  el.kontainerToast.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast-tampil"));

  setTimeout(() => {
    toast.classList.remove("toast-tampil");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// ==========================================================================
// LOAD STATS & DAFTAR RAPAT
// ==========================================================================
async function muatStats() {
  try {
    const res = await fetch("/api/stats");
    const json = await res.json();
    if (json.success && json.data) {
      el.statTotalRapat.textContent = json.data.totalRapat;
      el.statBulanIni.textContent = json.data.rapatBulanIni;
      el.statAiReady.textContent = json.data.denganAI;
    }
  } catch (e) {
    console.warn("Gagal memuat statistik:", e);
  }
}

async function muatDaftarRapat(page = 1) {
  STATE.page = page;

  el.daftarRapatSidebar.innerHTML = `
    <div class="sidebar-skeleton-wrap">
      <div class="skeleton skeleton-item"></div>
      <div class="skeleton skeleton-item"></div>
      <div class="skeleton skeleton-item"></div>
    </div>
  `;

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

    el.counterDaftar.textContent = totalCount;
    el.labelPageInfo.textContent = `Hal ${STATE.page} / ${STATE.totalPages}`;
    el.btnPrevPage.disabled = STATE.page <= 1;
    el.btnNextPage.disabled = STATE.page >= STATE.totalPages;

    renderSidebarList();
  } catch (err) {
    el.daftarRapatSidebar.innerHTML = `
      <div style="padding: 16px; color: #f87171; font-size: 12px;">
        Gagal memuat data: ${err.message}
      </div>
    `;
  }
}

function renderSidebarList() {
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

    const hasAiBadge = (rapat.hasRingkasan || rapat.hasIdeBaru)
      ? `<span class="mini-pill-ai">✨ AI</span>`
      : "";

    item.innerHTML = `
      <div class="item-row-top">
        <span class="item-topik" title="${rapat.topik}">${rapat.topik}</span>
      </div>
      <div class="item-row-meta">
        <span class="item-tanggal">${rapat.tanggal || "-"}</span>
        <div class="item-badges">
          ${hasAiBadge}
        </div>
      </div>
    `;

    item.addEventListener("click", () => {
      tutupSidebarMobile();
      tampilkanDetailRapat(rapat.id);
    });

    el.daftarRapatSidebar.appendChild(item);
  });
}

// ==========================================================================
// TAMPILKAN DETAIL 1 RAPAT
// ==========================================================================
async function tampilkanDetailRapat(id) {
  try {
    const res = await fetch(`/api/rapat/${id}`);
    if (!res.ok) throw new Error("Notulen rapat tidak ditemukan");
    const rapat = await res.json();

    STATE.rapatAktif = rapat;

    document.querySelectorAll(".item-rapat-sidebar").forEach((elItem) => {
      elItem.classList.toggle("aktif", elItem.dataset.id === String(id));
    });

    el.breadcrumbCurrent.textContent = rapat.topik;

    el.detailTopik.textContent = rapat.topik;
    el.detailTanggal.innerHTML = `📅 <span>${formatHariTanggal(rapat.tanggal)}</span>`;
    if (el.detailWaktu) {
      if (rapat.waktu) {
        el.detailWaktu.innerHTML = `⏰ <span>${rapat.waktu}</span>`;
        el.detailWaktu.classList.remove("tersembunyi");
      } else {
        el.detailWaktu.classList.add("tersembunyi");
      }
    }
    if (el.detailTempat) {
      if (rapat.tempat) {
        el.detailTempat.innerHTML = `📍 <span>${rapat.tempat}</span>`;
        el.detailTempat.classList.remove("tersembunyi");
      } else {
        el.detailTempat.classList.add("tersembunyi");
      }
    }
    el.detailStatus.textContent = rapat.status || "Selesai";
    el.detailPimpinan.textContent = rapat.pimpinanRapat || "-";
    el.detailNotulis.textContent = rapat.notulis || "-";
    el.detailTotalPeserta.textContent = `${rapat.anggota.length} Orang Hadir`;

    el.avatarPimpinan.textContent = (rapat.pimpinanRapat || "P").charAt(0).toUpperCase();
    el.avatarNotulis.textContent = (rapat.notulis || "N").charAt(0).toUpperCase();

    el.btnUnduhPdf.href = `/api/rapat/${rapat.id}/export-pdf`;
    el.btnUnduhWord.href = `/api/rapat/${rapat.id}/export-word`;

    renderAiContent(rapat);
    renderPesertaGrid(rapat.anggota);
    renderPoinList(rapat.poinPembahasan);
    renderPaperPreview(rapat);

    el.viewForm.classList.add("tersembunyi");
    el.viewDetail.classList.remove("tersembunyi");
  } catch (err) {
    tampilkanToast(err.message, "error");
  }
}

function renderAiContent(rapat) {
  if (rapat.ringkasanAI) {
    el.kontenRingkasanAi.innerHTML = `<p>${rapat.ringkasanAI}</p>`;
  } else {
    el.kontenRingkasanAi.innerHTML = `
      <p class="placeholder-ai">Belum dibuat ringkasan. Klik tombol <b>Ringkasan AI</b> di atas untuk menyusun narasi resmi.</p>
    `;
  }

  if (rapat.ideBaruAI) {
    el.kontenIdeAi.innerHTML = `<p>${rapat.ideBaruAI}</p>`;
  } else {
    el.kontenIdeAi.innerHTML = `
      <p class="placeholder-ai">Belum ada rekomendasi. Klik tombol <b>Ide Strategis AI</b> untuk usulan kebijakan baru.</p>
    `;
  }
}

function renderPesertaGrid(anggota) {
  el.badgePesertaCount.textContent = `${anggota.length} Peserta`;

  if (!anggota || anggota.length === 0) {
    el.kontenPesertaGrid.innerHTML = `
      <div class="empty-state-hint" style="grid-column: 1 / -1; padding: 12px 0;">
        Tidak ada data peserta yang dicatat.
      </div>
    `;
    return;
  }

  el.kontenPesertaGrid.innerHTML = anggota
    .map((a) => {
      const inisial = (a.nama || "P").charAt(0).toUpperCase();
      return `
        <div class="peserta-item-card">
          <div class="peserta-avatar-badge">${inisial}</div>
          <div class="peserta-details">
            <span class="peserta-nama" title="${a.nama}">${a.nama}</span>
            <span class="peserta-jabatan">${a.jabatan || "-"}</span>
            <span class="peserta-instansi">${a.asalInstansi || "-"}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderPoinList(poinList) {
  el.badgePoinCount.textContent = `${poinList.length} Notulensi`;

  if (!poinList || poinList.length === 0) {
    el.kontenPoinList.innerHTML = `
      <div class="empty-state-hint" style="padding: 12px 0;">
        Tidak ada catatan notulensi.
      </div>
    `;
    return;
  }

  el.kontenPoinList.innerHTML = poinList
    .map((p, idx) => {
      const teks = typeof p === "string" ? p : (p.isi || "");
      return `
        <div class="poin-row-item">
          <span class="poin-number">${String(idx + 1).padStart(2, "0")}</span>
          <div class="poin-content">
            <p class="poin-text">${teks}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderPaperPreview(rapat) {
  const poinHtml = (rapat.poinPembahasan && rapat.poinPembahasan.length > 0)
    ? rapat.poinPembahasan
        .map((p, i) => {
          const teks = typeof p === "string" ? p : (p.isi || "");
          return `
            <div style="display: flex; margin-bottom: 7px; text-align: justify; line-height: 1.6;">
              <span style="width: 26px; flex-shrink: 0;">${i + 1}.</span>
              <span style="flex: 1;">${teks}</span>
            </div>
          `;
        })
        .join("")
    : `<div style="font-style: italic; color: #64748b; padding-left: 26px;">- Tidak ada catatan hasil rapat -</div>`;

  const hariTanggalStr = formatHariTanggal(rapat.tanggal);

  el.paperPreviewContent.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto; color: #000000; font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="font-size: 13.5pt; font-weight: bold; letter-spacing: 0.5px;">LAPORAN HASIL RAPAT</div>
        <div style="font-size: 12.5pt; font-weight: bold; margin-top: 2px;">${(rapat.topik || "").toUpperCase()}</div>
        ${rapat.tempat ? `<div style="font-size: 12pt; font-weight: bold; margin-top: 2px;">${rapat.tempat.toUpperCase()}</div>` : ""}
      </div>

      <table style="width: 100%; font-size: 11pt; border-collapse: collapse; margin-bottom: 22px;">
        <tr>
          <td style="width: 170px; padding: 2.5px 0; vertical-align: top;">Hari / tanggal</td>
          <td style="width: 15px; padding: 2.5px 0; vertical-align: top;">:</td>
          <td style="padding: 2.5px 0; vertical-align: top;">${hariTanggalStr}</td>
        </tr>
        <tr>
          <td style="padding: 2.5px 0; vertical-align: top;">Waktu</td>
          <td style="padding: 2.5px 0; vertical-align: top;">:</td>
          <td style="padding: 2.5px 0; vertical-align: top;">${rapat.waktu || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 2.5px 0; vertical-align: top;">Tempat</td>
          <td style="padding: 2.5px 0; vertical-align: top;">:</td>
          <td style="padding: 2.5px 0; vertical-align: top;">${rapat.tempat || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 2.5px 0; vertical-align: top;">Pemimpin rapat</td>
          <td style="padding: 2.5px 0; vertical-align: top;">:</td>
          <td style="padding: 2.5px 0; vertical-align: top;">${rapat.pimpinanRapat || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 2.5px 0; vertical-align: top;">Notulen</td>
          <td style="padding: 2.5px 0; vertical-align: top;">:</td>
          <td style="padding: 2.5px 0; vertical-align: top;">${rapat.notulis || "-"}</td>
        </tr>
        <tr>
          <td style="padding: 2.5px 0; vertical-align: top;">Peserta</td>
          <td style="padding: 2.5px 0; vertical-align: top;">:</td>
          <td style="padding: 2.5px 0; vertical-align: top;">Terlampir</td>
        </tr>
        <tr>
          <td style="padding: 2.5px 0; vertical-align: top;">Hasil rapat</td>
          <td style="padding: 2.5px 0; vertical-align: top;">:</td>
          <td style="padding: 2.5px 0; vertical-align: top;"></td>
        </tr>
      </table>

      <div style="margin-bottom: 12px; text-align: justify; line-height: 1.6;">
        Rapat dibuka oleh ${rapat.pimpinanRapat || "Pimpinan Rapat"} yang menjelaskan mengenai :
      </div>

      <div style="margin-bottom: 36px; padding-left: 10px;">
        ${poinHtml}
      </div>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11pt;">
        <div style="text-align: center; width: 220px;">
          Pemimpin rapat,<br><br><br><br><br>
          <b>${rapat.pimpinanRapat || "-"}</b>
        </div>
        <div style="text-align: center; width: 220px;">
          Notulen,<br><br><br><br><br>
          <b>${rapat.notulis || "-"}</b>
        </div>
      </div>

      ${rapat.anggota && rapat.anggota.length > 0 ? `
        <div style="margin-top: 50px; border-top: 1px dashed #cbd5e1; padding-top: 24px; page-break-before: always;">
          <div style="font-weight: bold; font-size: 11.5pt; text-align: center; margin-bottom: 12px;">
            LAMPIRAN: DAFTAR HADIR PESERTA RAPAT
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 8px;">
            <thead>
              <tr style="background: #f8fafc; text-align: left;">
                <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 40px; text-align: center;">No</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px 8px;">Nama Peserta</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px 8px;">Jabatan</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px 8px;">Instansi / Unit</th>
              </tr>
            </thead>
            <tbody>
              ${rapat.anggota.map((a, idx) => `
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 500;">${a.nama}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${a.jabatan || "-"}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${a.asalInstansi || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}

      ${rapat.ringkasanAI ? `
        <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 18px;">
          <div style="font-weight: bold; font-size: 11pt; margin-bottom: 6px;">RINGKASAN EKSEKUTIF (AI)</div>
          <div style="font-size: 10.5pt; text-align: justify; line-height: 1.6;">${rapat.ringkasanAI}</div>
        </div>
      ` : ""}
    </div>
  `;
}

// ==========================================
// FITUR AI GENERATION (GEMINI FLASH)
// ==========================================
el.btnAiRingkasan.addEventListener("click", async () => {
  if (!STATE.rapatAktif) return;
  el.btnAiRingkasan.disabled = true;
  el.kontenRingkasanAi.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; color: #2563eb; font-weight: 600;">
      <span class="spinner-inline" style="border-top-color: #2563eb;"></span>
      Sedang menganalisis notulen dengan Gemini Flash...
    </div>
  `;

  try {
    const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}/rangkum`, { method: "POST" });
    const json = await res.json();
    if (!json.success) throw new Error(json.pesan || "Gagal membuat ringkasan");

    STATE.rapatAktif.ringkasanAI = json.ringkasanAI;
    el.kontenRingkasanAi.innerHTML = `<p class="item-muncul">${json.ringkasanAI}</p>`;
    tampilkanToast("Ringkasan AI berhasil dibuat!");
    muatStats();
    renderPaperPreview(STATE.rapatAktif);
  } catch (err) {
    el.kontenRingkasanAi.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
    tampilkanToast(err.message, "error");
  } finally {
    el.btnAiRingkasan.disabled = false;
  }
});

el.btnAiIde.addEventListener("click", async () => {
  if (!STATE.rapatAktif) return;
  el.btnAiIde.disabled = true;
  el.kontenIdeAi.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; color: #2563eb; font-weight: 600;">
      <span class="spinner-inline" style="border-top-color: #2563eb;"></span>
      Sedang merumuskan ide & rekomendasi baru...
    </div>
  `;

  try {
    const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}/ide-baru`, { method: "POST" });
    const json = await res.json();
    if (!json.success) throw new Error(json.pesan || "Gagal membuat ide baru");

    STATE.rapatAktif.ideBaruAI = json.ideBaruAI;
    el.kontenIdeAi.innerHTML = `<p class="item-muncul">${json.ideBaruAI}</p>`;
    tampilkanToast("Ide strategis AI berhasil disusun!");
  } catch (err) {
    el.kontenIdeAi.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
    tampilkanToast(err.message, "error");
  } finally {
    el.btnAiIde.disabled = false;
  }
});

// ==========================================
// SALIN KE CLIPBOARD
// ==========================================
function copyToClipboard(text, message = "Berhasil disalin ke clipboard!") {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    tampilkanToast(message);
  }).catch(() => {
    tampilkanToast("Gagal menyalin teks", "error");
  });
}

el.btnCopyRingkasan.addEventListener("click", () => {
  if (STATE.rapatAktif?.ringkasanAI) copyToClipboard(STATE.rapatAktif.ringkasanAI, "Ringkasan disalin!");
});

el.btnCopyIde.addEventListener("click", () => {
  if (STATE.rapatAktif?.ideBaruAI) copyToClipboard(STATE.rapatAktif.ideBaruAI, "Ide rekomendasi disalin!");
});

el.btnSalinNotulen.addEventListener("click", () => {
  if (!STATE.rapatAktif) return;
  const r = STATE.rapatAktif;
  const hariTanggal = formatHariTanggal(r.tanggal);
  const poinTeks = (r.poinPembahasan && r.poinPembahasan.length > 0)
    ? r.poinPembahasan.map((p, i) => `   ${i + 1}. ${typeof p === "string" ? p : (p.isi || "")}`).join("\n")
    : "   - Tidak ada catatan hasil rapat -";

  const teksLengkap = `
LAPORAN HASIL RAPAT
${(r.topik || "").toUpperCase()}
${r.tempat ? r.tempat.toUpperCase() + "\n" : ""}
Hari / tanggal   : ${hariTanggal}
Waktu            : ${r.waktu || "-"}
Tempat           : ${r.tempat || "-"}
Pemimpin rapat   : ${r.pimpinanRapat || "-"}
Notulen          : ${r.notulis || "-"}
Peserta          : Terlampir
Hasil rapat      :

Rapat dibuka oleh ${r.pimpinanRapat || "Pimpinan Rapat"} yang menjelaskan mengenai :
${poinTeks}

Pemimpin rapat,                      Notulen,



${r.pimpinanRapat || "-"}            ${r.notulis || "-"}
  `.trim();

  copyToClipboard(teksLengkap, "Laporan hasil rapat berhasil disalin!");
});

el.btnPrintDoc.addEventListener("click", () => {
  window.print();
});

// ==========================================
// SMART FORM: CREATE & EDIT RAPAT
// ==========================================
function tampilkanFormBaru() {
  STATE.isEditing = false;
  STATE.editId = null;
  el.judulForm.textContent = "Notulen Rapat Baru";
  el.formModeTag.textContent = "Mode Input Baru";
  el.labelSimpanSubmit.textContent = "Simpan Notulen Rapat";
  el.breadcrumbCurrent.textContent = "Buat Notulen Baru";

  el.formRapat.reset();
  el.editIdRapat.value = "";
  if (el.inputWaktu) el.inputWaktu.value = "";
  if (el.inputTempat) el.inputTempat.value = "";
  STATE.anggotaForm = [];
  renderAnggotaChips();

  el.daftarPoinInputs.innerHTML = "";
  tambahBarisPoin("");

  el.inputTanggal.value = new Date().toISOString().slice(0, 10);

  pulihkanDrafOtomatis();

  document.querySelectorAll(".item-rapat-sidebar").forEach((i) => i.classList.remove("aktif"));

  el.viewDetail.classList.add("tersembunyi");
  el.viewForm.classList.remove("tersembunyi");
}

function bukaEditRapat() {
  if (!STATE.rapatAktif) return;
  const r = STATE.rapatAktif;

  STATE.isEditing = true;
  STATE.editId = r.id;
  el.judulForm.textContent = `Edit: ${r.topik}`;
  el.formModeTag.textContent = "Mode Edit";
  el.labelSimpanSubmit.textContent = "Perbarui Notulen Rapat";
  el.breadcrumbCurrent.textContent = `Edit — ${r.topik}`;

  el.editIdRapat.value = r.id;
  el.inputTanggal.value = r.tanggal || "";
  el.inputTopik.value = r.topik || "";
  el.inputPimpinan.value = r.pimpinanRapat || "";
  el.inputNotulis.value = r.notulis || "";
  if (el.inputWaktu) el.inputWaktu.value = r.waktu || "";
  if (el.inputTempat) el.inputTempat.value = r.tempat || "";

  STATE.anggotaForm = [...(r.anggota || [])];
  renderAnggotaChips();

  el.daftarPoinInputs.innerHTML = "";
  if (r.poinPembahasan && r.poinPembahasan.length > 0) {
    r.poinPembahasan.forEach((p) => {
      const teks = typeof p === "string" ? p : (p.isi || "");
      tambahBarisPoin(teks);
    });
  } else {
    tambahBarisPoin("");
  }

  el.viewDetail.classList.add("tersembunyi");
  el.viewForm.classList.remove("tersembunyi");
}

el.btnEditRapat.addEventListener("click", bukaEditRapat);
if (el.btnRapatBaru) {
  el.btnRapatBaru.addEventListener("click", () => {
    tutupSidebarMobile();
    tampilkanFormBaru();
  });
}
if (el.btnHeaderNew) {
  el.btnHeaderNew.addEventListener("click", () => {
    tutupSidebarMobile();
    tampilkanFormBaru();
  });
}

el.btnBatalForm.addEventListener("click", () => {
  if (STATE.rapatAktif) {
    el.viewForm.classList.add("tersembunyi");
    el.viewDetail.classList.remove("tersembunyi");
  } else {
    el.formRapat.reset();
    hapusDrafOtomatis();
  }
});

// ==========================================
// HAPUS RAPAT
// ==========================================
el.btnHapusRapat.addEventListener("click", async () => {
  if (!STATE.rapatAktif) return;
  const konfirmasi = confirm(`Yakin ingin menghapus notulen "${STATE.rapatAktif.topik}"? Data tidak dapat dikembalikan.`);
  if (!konfirmasi) return;

  try {
    const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.pesan || "Gagal menghapus");

    tampilkanToast("Notulen rapat berhasil dihapus");
    STATE.rapatAktif = null;
    await muatStats();
    await muatDaftarRapat(1);
    tampilkanFormBaru();
  } catch (err) {
    tampilkanToast(err.message, "error");
  }
});

// ==========================================
// CHIPS PESERTA RAPAT
// ==========================================
function renderAnggotaChips() {
  if (STATE.anggotaForm.length === 0) {
    el.daftarAnggotaChips.innerHTML = `
      <div class="empty-state-hint">Belum ada peserta ditambahkan. Klik tombol di atas.</div>
    `;
    return;
  }

  el.daftarAnggotaChips.innerHTML = STATE.anggotaForm
    .map((a, idx) => `
      <div class="chip-attendee">
        <span><b>${a.nama}</b> — ${a.jabatan || "-"} (${a.asalInstansi || "-"})</span>
        <button type="button" class="chip-remove-btn" data-index="${idx}" aria-label="Hapus">×</button>
      </div>
    `)
    .join("");

  el.daftarAnggotaChips.querySelectorAll(".chip-remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      STATE.anggotaForm.splice(idx, 1);
      renderAnggotaChips();
      simpanDrafOtomatis();
    });
  });
}

// Modal Peserta
el.btnBukaModalAnggota.addEventListener("click", () => {
  el.inputModalNama.value = "";
  el.inputModalJabatan.value = "";
  el.inputModalInstansi.value = "";
  el.modalAnggota.showModal();
  el.inputModalNama.focus();
});

function tutupModalAnggota() {
  el.modalAnggota.close();
}

el.btnCloseModalX.addEventListener("click", tutupModalAnggota);
el.btnBatalAnggota.addEventListener("click", tutupModalAnggota);

el.formModalAnggota.addEventListener("submit", (e) => {
  e.preventDefault();
  const nama = el.inputModalNama.value.trim();
  if (!nama) {
    tampilkanToast("Nama peserta wajib diisi", "error");
    return;
  }

  STATE.anggotaForm.push({
    nama,
    jabatan: el.inputModalJabatan.value.trim() || "-",
    asalInstansi: el.inputModalInstansi.value.trim() || "-",
  });

  renderAnggotaChips();
  simpanDrafOtomatis();
  tutupModalAnggota();
});

// ==========================================
// DYNAMIC ROWS: POIN PEMBAHASAN & HASIL RAPAT
// ==========================================
function tambahBarisPoin(isi = "") {
  const row = document.createElement("div");
  row.className = "dynamic-row";
  row.innerHTML = `
    <input type="text" class="input-poin-teks" placeholder="Catatan notulensi / hasil rapat" value="${isi.replace(/"/g, "&quot;")}" required />
    <button type="button" class="btn-row-del" title="Hapus baris">×</button>
  `;

  row.querySelector(".btn-row-del").addEventListener("click", () => {
    row.remove();
    simpanDrafOtomatis();
  });

  row.querySelector("input").addEventListener("input", simpanDrafOtomatis);
  el.daftarPoinInputs.appendChild(row);
}

el.btnTambahPoin.addEventListener("click", () => tambahBarisPoin(""));

function ambilDataPoinForm() {
  const rows = el.daftarPoinInputs.querySelectorAll(".dynamic-row");
  const hasil = [];
  rows.forEach((r) => {
    const isi = r.querySelector(".input-poin-teks").value.trim();
    if (isi) hasil.push({ isi });
  });
  return hasil;
}

// ==========================================
// SUBMIT FORM (CREATE ATAU UPDATE)
// ==========================================
el.formRapat.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tanggal = el.inputTanggal.value;
  const topik = el.inputTopik.value.trim();
  const pimpinan = el.inputPimpinan.value.trim();
  const notulis = el.inputNotulis.value.trim();
  const waktu = el.inputWaktu ? el.inputWaktu.value.trim() : "";
  const tempat = el.inputTempat ? el.inputTempat.value.trim() : "";

  if (!tanggal || !topik || !pimpinan || !notulis) {
    tampilkanToast("Mohon lengkapi tanggal, topik, pimpinan, dan notulis", "error");
    return;
  }

  const poinPembahasan = ambilDataPoinForm();

  const payload = {
    tanggal,
    topik,
    pimpinanRapat: pimpinan,
    notulis,
    waktu,
    tempat,
    anggota: STATE.anggotaForm,
    poinPembahasan,
    tindakLanjut: [],
    status: "Selesai",
  };

  el.btnSimpanSubmit.disabled = true;
  el.labelSimpanSubmit.textContent = "Menyimpan ke Database...";

  try {
    let res;
    if (STATE.isEditing && STATE.editId) {
      res = await fetch(`/api/rapat/${STATE.editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/rapat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    const json = await res.json();
    if (!json.success) throw new Error(json.pesan || json.error || "Gagal menyimpan");

    hapusDrafOtomatis();
    tampilkanToast(STATE.isEditing ? "Notulen berhasil diperbarui!" : "Notulen baru berhasil disimpan!");

    await muatStats();
    await muatDaftarRapat(1);

    const savedId = json.data?.id || (STATE.isEditing ? STATE.editId : null);
    if (savedId) {
      tampilkanDetailRapat(savedId);
    }
  } catch (err) {
    tampilkanToast(err.message, "error");
  } finally {
    el.btnSimpanSubmit.disabled = false;
    el.labelSimpanSubmit.textContent = STATE.isEditing ? "Perbarui Notulen Rapat" : "Simpan Notulen Rapat";
  }
});

// ==========================================
// DRAF AUTO-SAVE (LOCALSTORAGE)
// ==========================================
function simpanDrafOtomatis() {
  if (STATE.isEditing) return;
  const draftData = {
    tanggal: el.inputTanggal.value,
    topik: el.inputTopik.value,
    pimpinan: el.inputPimpinan.value,
    notulis: el.inputNotulis.value,
    waktu: el.inputWaktu ? el.inputWaktu.value : "",
    tempat: el.inputTempat ? el.inputTempat.value : "",
    anggota: STATE.anggotaForm,
    poin: ambilDataPoinForm(),
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STATE.draftStorageKey, JSON.stringify(draftData));
    el.drafAutoSavePill.classList.remove("tersembunyi");
  } catch (e) {}
}

function pulihkanDrafOtomatis() {
  try {
    const raw = localStorage.getItem(STATE.draftStorageKey);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d || !d.topik) return;

    el.inputTanggal.value = d.tanggal || "";
    el.inputTopik.value = d.topik || "";
    el.inputPimpinan.value = d.pimpinan || "";
    el.inputNotulis.value = d.notulis || "";
    if (el.inputWaktu) el.inputWaktu.value = d.waktu || "";
    if (el.inputTempat) el.inputTempat.value = d.tempat || "";

    if (Array.isArray(d.anggota)) {
      STATE.anggotaForm = d.anggota;
      renderAnggotaChips();
    }

    if (Array.isArray(d.poin) && d.poin.length > 0) {
      el.daftarPoinInputs.innerHTML = "";
      d.poin.forEach((p) => {
        const teks = typeof p === "string" ? p : (p.isi || "");
        tambahBarisPoin(teks);
      });
    }

    el.drafAutoSavePill.classList.remove("tersembunyi");
  } catch (e) {}
}

function hapusDrafOtomatis() {
  localStorage.removeItem(STATE.draftStorageKey);
  el.drafAutoSavePill.classList.add("tersembunyi");
}

[el.inputTanggal, el.inputTopik, el.inputPimpinan, el.inputNotulis, el.inputWaktu, el.inputTempat].filter(Boolean).forEach((input) => {
  input.addEventListener("input", simpanDrafOtomatis);
});

// ==========================================
// SEARCH & FILTER INTERACTION
// ==========================================
el.inputCari.addEventListener("input", (e) => {
  const val = e.target.value;
  el.btnClearCari.classList.toggle("tersembunyi", !val);

  clearTimeout(STATE.searchDebounceTimer);
  STATE.searchDebounceTimer = setTimeout(() => {
    STATE.searchQuery = val.trim();
    muatDaftarRapat(1);
  }, 280);
});

el.btnClearCari.addEventListener("click", () => {
  el.inputCari.value = "";
  el.btnClearCari.classList.add("tersembunyi");
  STATE.searchQuery = "";
  muatDaftarRapat(1);
});

el.filterPills.querySelectorAll(".pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    el.filterPills.querySelectorAll(".pill").forEach((p) => p.classList.remove("aktif"));
    pill.classList.add("aktif");
    STATE.filter = pill.dataset.filter;
    muatDaftarRapat(1);
  });
});

el.btnPrevPage.addEventListener("click", () => {
  if (STATE.page > 1) muatDaftarRapat(STATE.page - 1);
});

el.btnNextPage.addEventListener("click", () => {
  if (STATE.page < STATE.totalPages) muatDaftarRapat(STATE.page + 1);
});

// ==========================================
// MOBILE DRAWER NAVIGATION
// ==========================================
function bukaSidebarMobile() {
  el.sidebar.classList.add("buka");
  el.sidebarOverlay.classList.remove("tersembunyi");
}

function tutupSidebarMobile() {
  el.sidebar.classList.remove("buka");
  el.sidebarOverlay.classList.add("tersembunyi");
}

el.btnBukaMobile.addEventListener("click", bukaSidebarMobile);
el.btnTutupMobile.addEventListener("click", tutupSidebarMobile);
el.sidebarOverlay.addEventListener("click", tutupSidebarMobile);

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
    e.preventDefault();
    tampilkanFormBaru();
  }
  if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    e.preventDefault();
    el.inputCari.focus();
  }
});

// ==========================================
// INIT APP ON PAGE LOAD
// ==========================================
async function inisialisasiApp() {
  await muatStats();
  await muatDaftarRapat(1);

  if (STATE.daftarRapat.length > 0) {
    tampilkanDetailRapat(STATE.daftarRapat[0].id);
  } else {
    tampilkanFormBaru();
  }
}

inisialisasiApp();
