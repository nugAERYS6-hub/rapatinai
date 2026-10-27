// ==========================================================================
// RAPATINAI - STATE & DOM ELEMENTS REGISTRY
// ==========================================================================

export const STATE = {
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
  instansi: null,
};

export const el = {
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

export const elPengaturan = {
  viewPengaturan: document.getElementById("tampilan-pengaturan"),
  menuPengaturan: document.getElementById("menu-pengaturan"),
  btnBackupDb: document.getElementById("btn-backup-db"),
  themeToggleCard: document.getElementById("theme-toggle-card"),
  themeToggleInput: document.getElementById("theme-toggle-input"),
  themeBadgeTitle: document.getElementById("theme-badge-title"),
  themeBadgeSub: document.getElementById("theme-badge-sub"),
  themeBadgeIcon: document.getElementById("theme-badge-icon"),
  thumbIcon: document.getElementById("thumb-icon"),
};
