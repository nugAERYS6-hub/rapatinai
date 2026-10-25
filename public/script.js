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
  btnToggleSidebar: document.getElementById("tombol-toggle-sidebar"),
  btnBukaSidebar: document.getElementById("tombol-buka-sidebar"),
  btnBukaMobile: document.getElementById("tombol-buka-sidebar-mobile"),
  btnTutupMobile: document.getElementById("tombol-tutup-sidebar-mobile"),
  menuRapatBaru: document.getElementById("menu-rapat-baru"),
  menuRiwayatRapat: document.getElementById("menu-riwayat-rapat"),
  sidebarRiwayatContent: document.getElementById("sidebar-riwayat-content"),
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
  breadcrumbMiddle: document.getElementById("breadcrumb-middle"),
  breadcrumbSepMiddle: document.getElementById("breadcrumb-sep-middle"),
  drafAutoSavePill: document.getElementById("draf-auto-save-pill"),
  viewRiwayat: document.getElementById("tampilan-riwayat"),
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
  btnAiActionItems: document.getElementById("btn-ai-action-items"),
  kontenRingkasanAi: document.getElementById("konten-ringkasan-ai"),
  kontenIdeAi: document.getElementById("konten-ide-ai"),
  kontenActionItemsAi: document.getElementById("konten-action-items-ai"),
  btnCopyRingkasan: document.getElementById("btn-copy-ringkasan"),
  btnCopyIde: document.getElementById("btn-copy-ide"),
  btnCopyActionItems: document.getElementById("btn-copy-action-items"),

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

  editIdRapat: document.getElementById("edit-id-rapat"),
  inputTanggal: document.getElementById("tanggal"),
  inputTopik: document.getElementById("topik"),
  inputPimpinan: document.getElementById("pimpinan"),
  inputNotulis: document.getElementById("notulis"),
  inputWaktu: document.getElementById("waktu"),
  inputTempat: document.getElementById("tempat"),
  inputStatus: document.getElementById("status-rapat"),
  daftarAnggotaChips: document.getElementById("daftar-anggota-chips"),
  btnBukaModalAnggota: document.getElementById("tombol-buka-modal-anggota"),
  daftarPoinInputs: document.getElementById("daftar-poin-inputs"),
  btnTambahPoin: document.getElementById("tambah-poin"),
  daftarTindakLanjutInputs: document.getElementById("daftar-tindak-lanjut-inputs"),
  btnTambahTindakLanjut: document.getElementById("tambah-tindak-lanjut"),
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

// ==========================================================================
// SECURITY: HELPER ESCAPE HTML UNTUK MENCEGAH XSS
// ==========================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

  toast.innerHTML = `<span>${ikon}</span> <span>${escapeHtml(pesan)}</span>`;
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
        Gagal memuat data: ${escapeHtml(err.message)}
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

// ==========================================================================
// TAMPILKAN DETAIL 1 RAPAT
// ==========================================================================
async function tampilkanDetailRapat(id, syncHash = true) {
  if (syncHash && window.location.hash !== `#/detail/${id}`) {
    window.location.hash = `#/detail/${id}`;
    return;
  }

  try {
    const res = await fetch(`/api/rapat/${id}`);
    if (!res.ok) throw new Error("Notulen rapat tidak ditemukan");
    const rapat = await res.json();

    STATE.rapatAktif = rapat;

    resetSemuaMenuAktif();

    document.querySelectorAll(".item-rapat-sidebar").forEach((elItem) => {
      elItem.classList.toggle("aktif", elItem.dataset.id === String(id));
    });

    el.breadcrumbMiddle?.classList.remove("tersembunyi");
    el.breadcrumbSepMiddle?.classList.remove("tersembunyi");
    el.breadcrumbCurrent.textContent = rapat.topik;

    el.detailTopik.textContent = rapat.topik;
    el.detailTanggal.innerHTML = `<span>${escapeHtml(formatHariTanggal(rapat.tanggal))}</span>`;
    if (el.detailWaktu) {
      if (rapat.waktu) {
        el.detailWaktu.innerHTML = `<span>${escapeHtml(rapat.waktu)}</span>`;
        el.detailWaktu.classList.remove("tersembunyi");
      } else {
        el.detailWaktu.classList.add("tersembunyi");
      }
    }
    if (el.detailTempat) {
      if (rapat.tempat) {
        el.detailTempat.innerHTML = `<span>${escapeHtml(rapat.tempat)}</span>`;
        el.detailTempat.classList.remove("tersembunyi");
      } else {
        el.detailTempat.classList.add("tersembunyi");
      }
    }
    if (el.detailStatus) {
      const st = rapat.status || "Selesai";
      el.detailStatus.textContent = st;
      el.detailStatus.className = "badge-status-rapat";
      if (st === "Berlangsung") {
        el.detailStatus.classList.add("badge-berlangsung");
      } else if (st === "Dijadwalkan") {
        el.detailStatus.classList.add("badge-dijadwalkan");
      } else {
        el.detailStatus.classList.add("badge-selesai");
      }
    }
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

    tutupSemuaView();
    el.viewDetail.classList.remove("tersembunyi");
  } catch (err) {
    tampilkanToast(err.message, "error");
    if (window.location.hash.startsWith("#/detail/")) {
      bukaRiwayat();
    }
  }
}

function bersihkanRingkasan(text) {
  if (!text) return "";
  let str = text.trim();
  while (true) {
    const next = str
      .replace(/^(?:#+\s*)?(?:\*{1,3})?\s*(?:ringkasan\s+eksekutif|executive\s+summary|ringkasan\s+hasil\s+rapat|ringkasan)(?:\s*[:\-])?\s*(?:\*{1,3})?\s*(\n+|$)/i, "")
      .replace(/^(?:\*{1,3})?\s*(?:rapat\s+[^\n]+?)(?:\*{1,3})?\s*(\n+|$)/i, "")
      .trim();
    if (next === str) break;
    str = next;
  }
  return str;
}

function formatRingkasanHTML(text, indent = false) {
  const bersih = bersihkanRingkasan(text);
  if (!bersih) return "";
  return bersih
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const aman = escapeHtml(p);
      const denganBold = aman.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
      return `<p style="margin-bottom: 8px; ${indent ? "text-indent: 28px;" : ""}">${denganBold}</p>`;
    })
    .join("");
}

function renderActionItemsUI(items) {
  if (!el.kontenActionItemsAi) return;
  if (!items || items.length === 0) {
    el.kontenActionItemsAi.innerHTML = `
      <p class="placeholder-ai">Belum ada action items. Klik tombol <b>Action Items AI</b> di atas untuk mengekstrak tugas konkret dari notulen rapat.</p>
    `;
    return;
  }

  const itemsHtml = items.map((item, idx) => {
    const tugas = escapeHtml(item.tugas || item.isi || "-");
    const pic = escapeHtml(item.pic || "-");
    const estimasi = escapeHtml(item.estimasi || item.deadline || "-");
    const prioritas = escapeHtml(item.prioritas || "Normal");
    let prioClass = "prio-normal";
    if (prioritas.toLowerCase().includes("tinggi") || prioritas.toLowerCase().includes("high")) prioClass = "prio-tinggi";
    else if (prioritas.toLowerCase().includes("sedang") || prioritas.toLowerCase().includes("medium")) prioClass = "prio-sedang";

    return `
      <div class="action-item-card">
        <div class="action-item-header">
          <span class="action-item-num">#${idx + 1}</span>
          <span class="action-item-prio ${prioClass}">${prioritas}</span>
        </div>
        <div class="action-item-body">
          <p class="action-item-text">${tugas}</p>
        </div>
        <div class="action-item-footer">
          <div class="action-item-meta">
            <span class="meta-label">PIC:</span>
            <span class="meta-val">${pic}</span>
          </div>
          <div class="action-item-meta">
            <span class="meta-label">Tenggat:</span>
            <span class="meta-val">${estimasi}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  el.kontenActionItemsAi.innerHTML = `<div class="action-items-grid">${itemsHtml}</div>`;
}

function renderAiContent(rapat) {
  if (rapat.ringkasanAI) {
    el.kontenRingkasanAi.innerHTML = formatRingkasanHTML(rapat.ringkasanAI, false);
  } else {
    el.kontenRingkasanAi.innerHTML = `
      <p class="placeholder-ai">Belum dibuat ringkasan. Klik tombol <b>Ringkasan AI</b> di atas untuk menyusun narasi resmi.</p>
    `;
  }

  if (rapat.ideBaruAI) {
    el.kontenIdeAi.innerHTML = `<p>${escapeHtml(rapat.ideBaruAI)}</p>`;
  } else {
    el.kontenIdeAi.innerHTML = `
      <p class="placeholder-ai">Belum ada rekomendasi. Klik tombol <b>Ide Strategis AI</b> untuk usulan kebijakan baru.</p>
    `;
  }

  const actionItemsData = rapat.actionItemsAI || (rapat.tindakLanjut && rapat.tindakLanjut.length > 0 ? rapat.tindakLanjut : null);
  renderActionItemsUI(actionItemsData);
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
      const inisial = escapeHtml((a.nama || "P").charAt(0).toUpperCase());
      const nama = escapeHtml(a.nama || "-");
      const jabatan = escapeHtml(a.jabatan || "-");
      const instansi = escapeHtml(a.asalInstansi || "-");
      return `
        <div class="peserta-item-card">
          <div class="peserta-avatar-badge">${inisial}</div>
          <div class="peserta-details">
            <span class="peserta-nama" title="${nama}">${nama}</span>
            <span class="peserta-jabatan">${jabatan}</span>
            <span class="peserta-instansi">${instansi}</span>
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
      const amanTeks = escapeHtml(teks);
      return `
        <div class="poin-row-item">
          <span class="poin-number">${String(idx + 1).padStart(2, "0")}</span>
          <div class="poin-content">
            <p class="poin-text">${amanTeks}</p>
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
              <span style="flex: 1;">${escapeHtml(teks)}</span>
            </div>
          `;
      })
      .join("")
    : `<div style="font-style: italic; color: #64748b; padding-left: 26px;">- Tidak ada catatan hasil rapat -</div>`;

  const hariTanggalStr = escapeHtml(formatHariTanggal(rapat.tanggal));
  const judulTopik = escapeHtml((rapat.topik || "").toUpperCase().replace(/^RAPAT\s+/, ""));
  const waktuStr = escapeHtml(rapat.waktu || "-");
  const tempatStr = escapeHtml(rapat.tempat || "-");
  const pimpinanStr = escapeHtml(rapat.pimpinanRapat || "-");
  const notulisStr = escapeHtml(rapat.notulis || "-");

  el.paperPreviewContent.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto; color: #000000; font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.6;">
      <!-- KOP SURAT RESMI BAPPEDA PROVINSI MALUKU UTARA -->
      <div class="kop-surat-wrapper">
        <div class="kop-logo-box">
          <img src="logo-bappeda.jpg" alt="Logo BAPPEDA Maluku Utara" class="kop-logo-img" />
        </div>
        <div class="kop-text-box">
          <div class="kop-instansi-prov">PEMERINTAH PROVINSI MALUKU UTARA</div>
          <div class="kop-nama-dinas">BADAN PERENCANAAN PEMBANGUNAN DAERAH</div>
          <div class="kop-alamat">Jalan Raya Lintas Halmahera, Gosale Puncak, Sofifi, Maluku Utara 97827</div>
          <div class="kop-kontak">Laman: bappeda.malutprov.go.id &nbsp;|&nbsp; Pos-el: bappeda@malutprov.go.id</div>
        </div>
        <div class="kop-spacer"></div>
      </div>
      <div class="kop-garis-tebal"></div>
      <div class="kop-garis-tipis"></div>

      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 13.5pt; font-weight: bold; letter-spacing: 0.5px;">LAPORAN HASIL RAPAT</div>
        <div style="font-size: 12.5pt; font-weight: bold; margin-top: 2px;">${judulTopik}</div>
      </div>

      <table style="width: 100%; font-size: 11pt; border-collapse: collapse; margin-bottom: 12px; line-height: 1.2;">
        <tr>
          <td style="width: 170px; padding: 1px 0; vertical-align: top;">Hari / tanggal</td>
          <td style="width: 15px; padding: 1px 0; vertical-align: top;">:</td>
          <td style="padding: 1px 0; vertical-align: top;">${hariTanggalStr}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0; vertical-align: top;">Waktu</td>
          <td style="padding: 1px 0; vertical-align: top;">:</td>
          <td style="padding: 1px 0; vertical-align: top;">${waktuStr}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0; vertical-align: top;">Tempat</td>
          <td style="padding: 1px 0; vertical-align: top;">:</td>
          <td style="padding: 1px 0; vertical-align: top;">${tempatStr}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0; vertical-align: top;">Pemimpin rapat</td>
          <td style="padding: 1px 0; vertical-align: top;">:</td>
          <td style="padding: 1px 0; vertical-align: top;">${pimpinanStr}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0; vertical-align: top;">Notulen</td>
          <td style="padding: 1px 0; vertical-align: top;">:</td>
          <td style="padding: 1px 0; vertical-align: top;">${notulisStr}</td>
        </tr>
        <tr>
          <td style="padding: 1px 0; vertical-align: top;">Peserta</td>
          <td style="padding: 1px 0; vertical-align: top;">:</td>
          <td style="padding: 1px 0; vertical-align: top;">Terlampir</td>
        </tr>
        <tr>
          <td style="padding: 1px 0; vertical-align: top;">Hasil rapat</td>
          <td style="padding: 1px 0; vertical-align: top;">:</td>
          <td style="padding: 1px 0; vertical-align: top;"></td>
        </tr>
      </table>

      <div style="margin-bottom: 12px; text-align: justify; line-height: 1.6;">
        Rapat dibuka oleh ${pimpinanStr} yang menjelaskan mengenai :
      </div>

      <div style="margin-bottom: 36px; padding-left: 10px;">
        ${poinHtml}
      </div>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11pt;">
        <div style="text-align: center; width: 220px;">
          Pemimpin rapat,<br><br><br><br><br>
          <b>${pimpinanStr}</b>
        </div>
        <div style="text-align: center; width: 220px;">
          Notulen,<br><br><br><br><br>
          <b>${notulisStr}</b>
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
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 500;">${escapeHtml(a.nama)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(a.jabatan || "-")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(a.asalInstansi || "-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}

      ${rapat.tindakLanjut && rapat.tindakLanjut.length > 0 ? `
        <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 20px;">
          <div style="font-weight: bold; font-size: 11pt; margin-bottom: 8px;">TINDAK LANJUT &amp; PENUGASAN</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
            <thead>
              <tr style="background: #f8fafc; text-align: left;">
                <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 36px; text-align: center;">No</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px 8px;">Tugas / Tindak Lanjut</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 140px;">PIC</th>
                <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 110px;">Tenggat</th>
              </tr>
            </thead>
            <tbody>
              ${rapat.tindakLanjut.map((tl, idx) => `
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(tl.tugas || tl.isi || "-")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(tl.pic || "-")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${escapeHtml(tl.deadline || "-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}

      ${rapat.ringkasanAI ? `
        <div style="margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 18px;">
          <div style="font-weight: bold; font-size: 11pt; margin-bottom: 6px;">Ringkasan</div>
          <div style="font-size: 10.5pt; text-align: justify; line-height: 1.6;">${formatRingkasanHTML(rapat.ringkasanAI, true)}</div>
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

    STATE.rapatAktif.ringkasanAI = bersihkanRingkasan(json.ringkasanAI);
    el.kontenRingkasanAi.innerHTML = `<div class="item-muncul">${formatRingkasanHTML(STATE.rapatAktif.ringkasanAI, false)}</div>`;
    tampilkanToast("Ringkasan AI berhasil dibuat!");
    muatStats();
    renderPaperPreview(STATE.rapatAktif);
  } catch (err) {
    el.kontenRingkasanAi.innerHTML = `<p style="color: #ef4444;">Error: ${escapeHtml(err.message)}</p>`;
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
    el.kontenIdeAi.innerHTML = `<p class="item-muncul">${escapeHtml(json.ideBaruAI)}</p>`;
    tampilkanToast("Ide strategis AI berhasil disusun!");
  } catch (err) {
    el.kontenIdeAi.innerHTML = `<p style="color: #ef4444;">Error: ${escapeHtml(err.message)}</p>`;
    tampilkanToast(err.message, "error");
  } finally {
    el.btnAiIde.disabled = false;
  }
});

if (el.btnAiActionItems) {
  el.btnAiActionItems.addEventListener("click", async () => {
    if (!STATE.rapatAktif) return;
    el.btnAiActionItems.disabled = true;
    el.kontenActionItemsAi.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: #2563eb; font-weight: 600;">
        <span class="spinner-inline" style="border-top-color: #2563eb;"></span>
        Sedang mengekstrak Action Items & Penugasan dengan Gemini...
      </div>
    `;

    try {
      const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}/action-items`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.pesan || "Gagal membuat action items");

      const items = json.actionItems || [];
      STATE.rapatAktif.actionItemsAI = items;
      renderActionItemsUI(items);
      tampilkanToast("Action items AI berhasil diekstrak!");
    } catch (err) {
      el.kontenActionItemsAi.innerHTML = `<p style="color: #ef4444;">Error: ${escapeHtml(err.message)}</p>`;
      tampilkanToast(err.message, "error");
    } finally {
      el.btnAiActionItems.disabled = false;
    }
  });
}

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

if (el.btnCopyActionItems) {
  el.btnCopyActionItems.addEventListener("click", () => {
    const items = STATE.rapatAktif?.actionItemsAI || STATE.rapatAktif?.tindakLanjut;
    if (!items || items.length === 0) {
      tampilkanToast("Belum ada action items untuk disalin", "info");
      return;
    }
    const text = items.map((it, idx) => {
      const tugas = it.tugas || it.isi || "-";
      const pic = it.pic || "-";
      const estimasi = it.estimasi || it.deadline || "-";
      const prioritas = it.prioritas ? ` [${it.prioritas}]` : "";
      return `${idx + 1}. ${tugas}${prioritas}\n   PIC: ${pic} | Tenggat: ${estimasi}`;
    }).join("\n\n");

    copyToClipboard(`ACTION ITEMS & PENUGASAN RAPAT:\n\n${text}`, "Action items disalin!");
  });
}

el.btnSalinNotulen.addEventListener("click", () => {
  if (!STATE.rapatAktif) return;
  const r = STATE.rapatAktif;
  const hariTanggal = formatHariTanggal(r.tanggal);
  const poinTeks = (r.poinPembahasan && r.poinPembahasan.length > 0)
    ? r.poinPembahasan.map((p, i) => `   ${i + 1}. ${typeof p === "string" ? p : (p.isi || "")}`).join("\n")
    : "   - Tidak ada catatan hasil rapat -";

  const teksLengkap = `
PEMERINTAH PROVINSI MALUKU UTARA
BADAN PERENCANAAN PEMBANGUNAN DAERAH (BAPPEDA)
Jl. Raya Lintas Halmahera, Gosale Puncak, Sofifi, Maluku Utara 97827
================================================================================
LAPORAN HASIL RAPAT
${(r.topik || "").toUpperCase()}
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
function tampilkanFormBaru(syncHash = true) {
  if (syncHash && window.location.hash !== "#/baru") {
    window.location.hash = "#/baru";
    return;
  }

  STATE.isEditing = false;
  STATE.editId = null;
  el.judulForm.textContent = "Notulen Rapat Baru";
  el.labelSimpanSubmit.textContent = "Simpan Notulen Rapat";
  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  el.breadcrumbCurrent.textContent = "Buat Notulen Baru";

  resetSemuaMenuAktif();
  if (el.menuRapatBaru) el.menuRapatBaru.classList.add("aktif");

  el.formRapat.reset();
  el.editIdRapat.value = "";
  if (el.inputWaktu) el.inputWaktu.value = "";
  if (el.inputTempat) el.inputTempat.value = "";
  if (el.inputStatus) el.inputStatus.value = "Selesai";
  STATE.anggotaForm = [];
  renderAnggotaChips();

  el.daftarPoinInputs.innerHTML = "";
  tambahBarisPoin("");

  if (el.daftarTindakLanjutInputs) {
    el.daftarTindakLanjutInputs.innerHTML = "";
  }

  el.inputTanggal.value = new Date().toISOString().slice(0, 10);

  pulihkanDrafOtomatis();

  document.querySelectorAll(".item-rapat-sidebar").forEach((i) => i.classList.remove("aktif"));

  tutupSemuaView();
  el.viewForm.classList.remove("tersembunyi");
}

function bukaEditRapat() {
  if (!STATE.rapatAktif) return;
  const r = STATE.rapatAktif;

  STATE.isEditing = true;
  STATE.editId = r.id;
  el.judulForm.textContent = `Edit: ${r.topik}`;
  el.labelSimpanSubmit.textContent = "Perbarui Notulen Rapat";
  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  el.breadcrumbCurrent.textContent = `Edit — ${r.topik}`;

  el.editIdRapat.value = r.id;
  el.inputTanggal.value = r.tanggal || "";
  el.inputTopik.value = r.topik || "";
  el.inputPimpinan.value = r.pimpinanRapat || "";
  el.inputNotulis.value = r.notulis || "";
  if (el.inputWaktu) el.inputWaktu.value = r.waktu || "";
  if (el.inputTempat) el.inputTempat.value = r.tempat || "";
  if (el.inputStatus) el.inputStatus.value = r.status || "Selesai";

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

  if (el.daftarTindakLanjutInputs) {
    el.daftarTindakLanjutInputs.innerHTML = "";
    if (r.tindakLanjut && r.tindakLanjut.length > 0) {
      r.tindakLanjut.forEach((tl) => tambahBarisTindakLanjut(tl));
    }
  }

  el.viewDetail.classList.add("tersembunyi");
  el.viewForm.classList.remove("tersembunyi");
}

el.btnEditRapat.addEventListener("click", bukaEditRapat);

if (el.breadcrumbMiddle) {
  el.breadcrumbMiddle.addEventListener("click", () => {
    window.location.hash = "#/riwayat";
  });
}

// ==========================================================================
// NAVIGASI MENU SIDEBAR & VIEWS
// ==========================================================================
const elPengaturan = {
  viewPengaturan: document.getElementById("tampilan-pengaturan"),
  menuPengaturan: document.getElementById("menu-pengaturan"),
  btnBackupDb: document.getElementById("btn-backup-db"),
  btnTemaGelap: document.getElementById("btn-tema-gelap"),
  btnTemaTerang: document.getElementById("btn-tema-terang"),
  checkGelap: document.getElementById("check-gelap"),
  checkTerang: document.getElementById("check-terang"),
};

function tutupSemuaView() {
  if (el.viewRiwayat) el.viewRiwayat.classList.add("tersembunyi");
  if (el.viewDetail) el.viewDetail.classList.add("tersembunyi");
  if (el.viewForm) el.viewForm.classList.add("tersembunyi");
  if (elPengaturan.viewPengaturan) elPengaturan.viewPengaturan.classList.add("tersembunyi");
}

function resetSemuaMenuAktif() {
  [el.menuRapatBaru, el.menuRiwayatRapat, elPengaturan.menuPengaturan].forEach(m => {
    if (m) m.classList.remove("aktif");
  });
}

function bukaRiwayat(syncHash = true) {
  if (syncHash && window.location.hash !== "#/riwayat") {
    window.location.hash = "#/riwayat";
    return;
  }
  tutupSidebarMobile();
  resetSemuaMenuAktif();
  if (el.menuRiwayatRapat) el.menuRiwayatRapat.classList.add("aktif");
  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  el.breadcrumbCurrent.textContent = "Riwayat Rapat";
  tutupSemuaView();
  if (el.viewRiwayat) el.viewRiwayat.classList.remove("tersembunyi");
}

function bukaPengaturan(syncHash = true) {
  if (syncHash && window.location.hash !== "#/pengaturan") {
    window.location.hash = "#/pengaturan";
    return;
  }
  tutupSidebarMobile();
  resetSemuaMenuAktif();
  if (elPengaturan.menuPengaturan) elPengaturan.menuPengaturan.classList.add("aktif");
  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  el.breadcrumbCurrent.textContent = "Pengaturan";
  tutupSemuaView();
  if (elPengaturan.viewPengaturan) elPengaturan.viewPengaturan.classList.remove("tersembunyi");
  renderRiwayatBackup();
}

if (el.menuRapatBaru) {
  el.menuRapatBaru.addEventListener("click", () => {
    tutupSidebarMobile();
    window.location.hash = "#/baru";
  });
}

if (el.menuRiwayatRapat) {
  el.menuRiwayatRapat.addEventListener("click", () => {
    tutupSidebarMobile();
    window.location.hash = "#/riwayat";
  });
}

if (elPengaturan.menuPengaturan) {
  elPengaturan.menuPengaturan.addEventListener("click", () => {
    tutupSidebarMobile();
    window.location.hash = "#/pengaturan";
  });
}


const BACKUP_STORAGE_KEY = "rapatinai_backup_log_v1";

function muatLogBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function simpanLogBackup(log) {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(log));
  } catch(e) {}
}

function formatUkuranFile(bytes) {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatWaktuBackup(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    const tgl = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${tgl}, ${jam}`;
  } catch { return isoStr; }
}

function renderRiwayatBackup() {
  const log = muatLogBackup();
  const tbody = document.getElementById("tbody-riwayat-backup");
  const rowKosong = document.getElementById("backup-row-kosong");
  const statTotal = document.getElementById("backup-stat-total");
  const statSukses = document.getElementById("backup-stat-sukses");
  const statTerakhir = document.getElementById("backup-stat-terakhir");

  if (!tbody) return;

  // Update stats
  const totalSukses = log.filter(l => l.status === "sukses").length;
  if (statTotal) statTotal.textContent = log.length;
  if (statSukses) statSukses.textContent = totalSukses;
  if (statTerakhir) {
    statTerakhir.textContent = log.length > 0 ? formatWaktuBackup(log[0].waktu) : "—";
  }

  if (log.length === 0) {
    if (rowKosong) rowKosong.style.display = "";
    // Remove all rows except kosong
    Array.from(tbody.querySelectorAll("tr:not(#backup-row-kosong)")).forEach(r => r.remove());
    return;
  }

  if (rowKosong) rowKosong.style.display = "none";

  // Remove existing data rows
  Array.from(tbody.querySelectorAll("tr:not(#backup-row-kosong)")).forEach(r => r.remove());

  log.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${idx * 40}ms`;

    const badgeClass = item.status === "sukses" ? "backup-badge--sukses" : "backup-badge--gagal";
    const badgeLabel = item.status === "sukses" ? "✓ Berhasil" : "✕ Gagal";

    const namaAman = escapeHtml(item.nama || "—");
    const aksiHtml = item.status === "sukses"
      ? `<button class="btn-unduh-ulang" title="Unduh file backup database" data-nama="${namaAman}">
           <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
         </button>`
      : `<span style="color:#475569;font-size:12px;">—</span>`;

    tr.innerHTML = `
      <td>${log.length - idx}</td>
      <td><span class="backup-td-filename">${namaAman}</span></td>
      <td><span class="backup-td-waktu">${escapeHtml(formatWaktuBackup(item.waktu))}</span></td>
      <td><span class="backup-td-ukuran">${escapeHtml(formatUkuranFile(item.ukuranBytes))}</span></td>
      <td><span class="backup-badge ${badgeClass}">${badgeLabel}</span></td>
      <td style="text-align:center;">${aksiHtml}</td>
    `;

    tbody.appendChild(tr);
  });

  // Wire unduh-ulang buttons
  tbody.querySelectorAll(".btn-unduh-ulang").forEach(btn => {
    btn.addEventListener("click", () => {
      jalankanBackup(labelBtnBackup, btnBackupDb);
    });
  });
}

async function jalankanBackup(labelEl, btnEl) {
  if (btnEl) { btnEl.disabled = true; }
  if (labelEl) { labelEl.textContent = "Memproses..."; }

  const waktu = new Date().toISOString();
  const nama = `backup_rapatinai_${waktu.slice(0,10).replace(/-/g,'')}_${waktu.slice(11,19).replace(/:/g,'')}.sql`;

  try {
    const res = await fetch("/api/backup/mysql");
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Server error: " + res.status);
    }

    const blob = await res.blob();
    const ukuranBytes = blob.size;
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nama;
    a.click();

    // Log ke localStorage
    const log = muatLogBackup();
    log.unshift({ nama, waktu, ukuranBytes, status: "sukses", url: null }); // blob URL akan expired, simpan null
    if (log.length > 100) log.splice(100);
    simpanLogBackup(log);

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    tampilkanToast("Backup MySQL berhasil diunduh!", "sukses");
    renderRiwayatBackup();
  } catch (err) {
    // Log gagal
    const log = muatLogBackup();
    log.unshift({ nama, waktu, ukuranBytes: 0, status: "gagal", url: null });
    if (log.length > 100) log.splice(100);
    simpanLogBackup(log);

    tampilkanToast("Gagal membuat backup: " + err.message, "error");
    renderRiwayatBackup();
  } finally {
    if (btnEl) { btnEl.disabled = false; }
    if (labelEl) { labelEl.textContent = "Buat Backup Sekarang"; }
  }
}

// Wire: Backup Database tunggal (di dalam halaman Pengaturan)
const btnBackupDb = document.getElementById("btn-backup-db");
const labelBtnBackup = document.getElementById("label-btn-backup");
if (btnBackupDb) {
  btnBackupDb.addEventListener("click", () => jalankanBackup(labelBtnBackup, btnBackupDb));
}

// Wire: Hapus semua log backup
const btnHapusSemua = document.getElementById("btn-hapus-semua-backup");
if (btnHapusSemua) {
  btnHapusSemua.addEventListener("click", () => {
    if (!confirm("Yakin ingin menghapus semua riwayat log backup? Tindakan ini tidak dapat dibatalkan.")) return;
    simpanLogBackup([]);
    renderRiwayatBackup();
    tampilkanToast("Semua riwayat backup telah dihapus.", "info");
  });
}

// ==========================================================================
// RESTORE DATABASE
// ==========================================================================
const inputFileRestore = document.getElementById("input-file-restore");

if (inputFileRestore) {
  inputFileRestore.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset agar bisa memilih file yang sama lagi nanti
    inputFileRestore.value = "";

    // Validasi ekstensi di sisi klien
    const ekstensiDiizinkan = [".sql", ".txt"];
    const ekstensiFile = "." + file.name.split(".").pop().toLowerCase();
    if (!ekstensiDiizinkan.includes(ekstensiFile)) {
      tampilkanToast("File tidak valid. Hanya file .sql yang didukung.", "error");
      return;
    }

    // Validasi ukuran (max 50 MB)
    if (file.size > 50 * 1024 * 1024) {
      tampilkanToast("File terlalu besar. Maksimal 50 MB.", "error");
      return;
    }

    // Tampilkan dialog konfirmasi sebelum eksekusi
    const ukuranFormatted = formatUkuranFile(file.size);
    const konfirmasi = confirm(
      `⚠️ PERHATIAN — RESTORE DATABASE\n\n` +
      `File yang dipilih:\n  ${file.name} (${ukuranFormatted})\n\n` +
      `Proses restore akan menimpa seluruh data rapat yang saat ini ada di database.\n` +
      `Pastikan Anda telah membuat backup terbaru sebelum melanjutkan!\n\n` +
      `Apakah Anda yakin ingin memulihkan database dari file ini?`
    );

    if (!konfirmasi) {
      tampilkanToast("Restore dibatalkan.", "info");
      return;
    }

    // Mulai proses restore
    const labelTrigger = document.getElementById("label-restore-trigger");
    const labelRestoreTeks = document.getElementById("label-restore-teks");

    if (labelTrigger) {
      labelTrigger.style.pointerEvents = "none";
      labelTrigger.style.opacity = "0.65";
    }
    if (labelRestoreTeks) {
      labelRestoreTeks.textContent = "Memulihkan...";
    }

    tampilkanToast("Sedang memulihkan database, harap tunggu...", "info");

    try {
      const formData = new FormData();
      formData.append("file_sql", file);

      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.pesan || data.message || `HTTP ${res.status}`);
      }

      tampilkanToast(`✅ ${data.pesan}`, "sukses");

      // Reload data rapat setelah restore berhasil
      await muatStats();
      await muatDaftarRapat(1);
      renderRiwayatBackup();

    } catch (err) {
      tampilkanToast("❌ Gagal memulihkan: " + err.message, "error");
    } finally {
      if (labelTrigger) {
        labelTrigger.style.pointerEvents = "";
        labelTrigger.style.opacity = "";
      }
      if (labelRestoreTeks) {
        labelRestoreTeks.textContent = "Pulihkan (.sql)";
      }
    }
  });
}

// THEME TOGGLE

function terapkanTema(tema) {
  if (tema === "terang") {
    document.body.classList.add("tema-terang");
    if (elPengaturan.btnTemaGelap) elPengaturan.btnTemaGelap.classList.remove("aktif");
    if (elPengaturan.btnTemaTerang) elPengaturan.btnTemaTerang.classList.add("aktif");
    if (elPengaturan.checkGelap) elPengaturan.checkGelap.classList.add("tersembunyi");
    if (elPengaturan.checkTerang) elPengaturan.checkTerang.classList.remove("tersembunyi");
  } else {
    document.body.classList.remove("tema-terang");
    if (elPengaturan.btnTemaGelap) elPengaturan.btnTemaGelap.classList.add("aktif");
    if (elPengaturan.btnTemaTerang) elPengaturan.btnTemaTerang.classList.remove("aktif");
    if (elPengaturan.checkGelap) elPengaturan.checkGelap.classList.remove("tersembunyi");
    if (elPengaturan.checkTerang) elPengaturan.checkTerang.classList.add("tersembunyi");
  }
  localStorage.setItem("rapatinai_tema", tema);
}

const temaTersimpan = localStorage.getItem("rapatinai_tema") || "gelap";
terapkanTema(temaTersimpan);

if (elPengaturan.btnTemaGelap) {
  elPengaturan.btnTemaGelap.addEventListener("click", () => terapkanTema("gelap"));
}
if (elPengaturan.btnTemaTerang) {
  elPengaturan.btnTemaTerang.addEventListener("click", () => terapkanTema("terang"));
}

el.btnBatalForm.addEventListener("click", () => {
  const sedangEdit = STATE.isEditing;
  STATE.isEditing = false;
  STATE.editId = null;

  if (sedangEdit && STATE.rapatAktif) {
    el.viewForm.classList.add("tersembunyi");
    el.viewDetail.classList.remove("tersembunyi");
    window.location.hash = `#/detail/${STATE.rapatAktif.id}`;
  } else {
    el.formRapat.reset();
    hapusDrafOtomatis();
    bukaRiwayat();
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
    window.location.hash = "#/riwayat";
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
        <span><b>${escapeHtml(a.nama)}</b> — ${escapeHtml(a.jabatan || "-")} (${escapeHtml(a.asalInstansi || "-")})</span>
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
// DYNAMIC ROWS: POIN PEMBAHASAN (EXPANDABLE TEXTAREA)
// ==========================================
function tambahBarisPoin(isi = "") {
  const row = document.createElement("div");
  row.className = "dynamic-row dynamic-row-poin";
  row.innerHTML = `
    <textarea class="input-poin-teks" rows="2" placeholder="Catatan notulensi / hasil pembahasan..." required>${escapeHtml(isi)}</textarea>
    <button type="button" class="btn-row-del" title="Hapus baris">×</button>
  `;

  const textarea = row.querySelector("textarea");
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(48, textarea.scrollHeight)}px`;
    simpanDrafOtomatis();
  });

  row.querySelector(".btn-row-del").addEventListener("click", () => {
    row.remove();
    simpanDrafOtomatis();
  });

  el.daftarPoinInputs.appendChild(row);

  if (isi) {
    requestAnimationFrame(() => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(48, textarea.scrollHeight)}px`;
    });
  }
}

el.btnTambahPoin.addEventListener("click", () => tambahBarisPoin(""));

function ambilDataPoinForm() {
  const rows = el.daftarPoinInputs.querySelectorAll(".dynamic-row");
  const hasil = [];
  rows.forEach((r) => {
    const textarea = r.querySelector(".input-poin-teks");
    const isi = textarea ? textarea.value.trim() : "";
    if (isi) hasil.push({ isi });
  });
  return hasil;
}

// ==========================================
// DYNAMIC ROWS: TINDAK LANJUT / PENUGASAN
// ==========================================
function tambahBarisTindakLanjut(data = {}) {
  const row = document.createElement("div");
  row.className = "dynamic-row-tl";
  const tugas = typeof data === "string" ? data : (data.tugas || data.isi || "");
  const pic = data.pic || "";
  const deadline = data.deadline || data.estimasi || "";

  row.innerHTML = `
    <div class="tl-field-tugas">
      <input type="text" class="input-tl-tugas" placeholder="Deskripsi tugas / tindak lanjut" value="${escapeHtml(tugas)}" required />
    </div>
    <div class="tl-field-pic">
      <input type="text" class="input-tl-pic" placeholder="PIC / Penanggung Jawab" value="${escapeHtml(pic)}" />
    </div>
    <div class="tl-field-deadline">
      <input type="text" class="input-tl-deadline" placeholder="Tenggat (e.g. 1 Minggu / 10 Nov)" value="${escapeHtml(deadline)}" />
    </div>
    <button type="button" class="btn-row-del" title="Hapus tindak lanjut">×</button>
  `;

  row.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", simpanDrafOtomatis));
  row.querySelector(".btn-row-del").addEventListener("click", () => {
    row.remove();
    simpanDrafOtomatis();
  });

  el.daftarTindakLanjutInputs?.appendChild(row);
}

if (el.btnTambahTindakLanjut) {
  el.btnTambahTindakLanjut.addEventListener("click", () => tambahBarisTindakLanjut());
}

function ambilDataTindakLanjutForm() {
  if (!el.daftarTindakLanjutInputs) return [];
  const rows = el.daftarTindakLanjutInputs.querySelectorAll(".dynamic-row-tl");
  const hasil = [];
  rows.forEach((r) => {
    const tugas = r.querySelector(".input-tl-tugas")?.value.trim();
    const pic = r.querySelector(".input-tl-pic")?.value.trim() || "-";
    const deadline = r.querySelector(".input-tl-deadline")?.value.trim() || "-";
    if (tugas) {
      hasil.push({ tugas, pic, deadline, selesai: false });
    }
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
  const status = el.inputStatus ? el.inputStatus.value : "Selesai";

  if (!tanggal || !topik || !pimpinan || !notulis) {
    tampilkanToast("Mohon lengkapi tanggal, topik, pimpinan, dan notulis", "error");
    return;
  }

  const poinPembahasan = ambilDataPoinForm();
  const tindakLanjut = ambilDataTindakLanjutForm();

  const payload = {
    tanggal,
    topik,
    pimpinanRapat: pimpinan,
    notulis,
    waktu,
    tempat,
    anggota: STATE.anggotaForm,
    poinPembahasan,
    tindakLanjut,
    status,
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
    if (!json.success) {
      if (json.errors) {
        const detailError = Object.values(json.errors).flat().join(" ");
        throw new Error(detailError || json.pesan || "Validasi gagal");
      }
      throw new Error(json.pesan || json.error || "Gagal menyimpan");
    }

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
    status: el.inputStatus ? el.inputStatus.value : "Selesai",
    anggota: STATE.anggotaForm,
    poin: ambilDataPoinForm(),
    tindakLanjut: ambilDataTindakLanjutForm(),
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STATE.draftStorageKey, JSON.stringify(draftData));
    el.drafAutoSavePill?.classList.remove("tersembunyi");
  } catch (e) { }
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
    if (el.inputStatus && d.status) el.inputStatus.value = d.status;

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

    if (Array.isArray(d.tindakLanjut) && d.tindakLanjut.length > 0 && el.daftarTindakLanjutInputs) {
      el.daftarTindakLanjutInputs.innerHTML = "";
      d.tindakLanjut.forEach((tl) => tambahBarisTindakLanjut(tl));
    }

    el.drafAutoSavePill?.classList.remove("tersembunyi");
  } catch (e) { }
}

function hapusDrafOtomatis() {
  localStorage.removeItem(STATE.draftStorageKey);
  el.drafAutoSavePill?.classList.add("tersembunyi");
}

[el.inputTanggal, el.inputTopik, el.inputPimpinan, el.inputNotulis, el.inputWaktu, el.inputTempat, el.inputStatus].filter(Boolean).forEach((input) => {
  input.addEventListener("input", simpanDrafOtomatis);
  input.addEventListener("change", simpanDrafOtomatis);
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
// SIDEBAR COLLAPSE & EXPAND (DESKTOP & MOBILE)
// ==========================================
function syncHamburgerMotion() {
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

function toggleSidebar(forceState) {
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

function bukaSidebarMobile() {
  toggleSidebar(false);
}

function tutupSidebarMobile() {
  toggleSidebar(true);
}

// Restore saved desktop state
try {
  const savedState = localStorage.getItem("rapatinai_sidebar_collapsed");
  if (savedState === "true" && window.innerWidth > 960) {
    document.body.classList.add("sidebar-collapsed");
  }
} catch (e) {}

// Event listeners for hamburger buttons (labels & inputs)
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

// ==========================================
// CLIENT-SIDE HASH ROUTER
// ==========================================
async function handleRoute() {
  const hash = window.location.hash || "";

  if (hash.startsWith("#/detail/")) {
    const id = hash.replace("#/detail/", "").trim();
    if (id) {
      await tampilkanDetailRapat(id, false);
      return;
    }
  }

  if (hash === "#/pengaturan" || hash === "#pengaturan") {
    bukaPengaturan(false);
    return;
  }

  if (hash === "#/riwayat" || hash === "#riwayat") {
    bukaRiwayat(false);
    return;
  }

  if (hash === "#/baru" || hash === "#baru") {
    tampilkanFormBaru(false);
    return;
  }

  // Jika hash tidak dikenali atau kosong
  tampilkanFormBaru(false);
}

window.addEventListener("hashchange", handleRoute);

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
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

// ==========================================
// INIT APP ON PAGE LOAD
// ==========================================
async function inisialisasiApp() {
  await muatStats();
  await muatDaftarRapat(1);
  renderRiwayatBackup();
  syncHamburgerMotion();

  // Tangani rute hash di URL saat pertama kali halaman dimuat / direfresh
  if (window.location.hash) {
    await handleRoute();
  } else {
    // Default jika belum ada hash: Notulen Baru
    window.location.hash = "#/baru";
  }
}

inisialisasiApp();
