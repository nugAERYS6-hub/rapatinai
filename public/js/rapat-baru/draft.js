// ==========================================================================
// MENU: RAPAT BARU - DRAF AUTO-SAVE & FORM GUARD
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { ambilDataPoinForm, ambilDataTindakLanjutForm, tambahBarisPoin, tambahBarisTindakLanjut } from "./dinamis.js";
import { renderAnggotaChips } from "./peserta.js";
import { tampilkanToast } from "../shared/ui.js";

let timerAutoSave = null;

/**
 * Format timestamp milidetik ke teks tanggal & jam yang ramah
 */
function formatWaktuDraf(ts) {
  if (!ts) return "beberapa saat yang lalu";
  const d = new Date(ts);
  const tgl = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${tgl} pukul ${jam}`;
}

/**
 * Memeriksa apakah ada draf tersimpan di localStorage
 */
export function cekDrafTersimpan() {
  try {
    const raw = localStorage.getItem(STATE.draftStorageKey);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const hasPoin = Array.isArray(d.poin) && d.poin.some((p) => {
      const txt = typeof p === "string" ? p : (p?.isi || "");
      return txt.trim().length > 0;
    });
    const hasTugas = Array.isArray(d.tindakLanjut) && d.tindakLanjut.length > 0;
    const hasText = !!(d.topik?.trim() || d.pimpinan?.trim() || d.notulis?.trim() || hasPoin || hasTugas);

    return hasText ? d : null;
  } catch (e) {
    return null;
  }
}

/**
 * Menyimpan draf formulir secara otomatis ke localStorage (Debounced)
 */
export function simpanDrafOtomatis() {
  if (STATE.isEditing) return;

  clearTimeout(timerAutoSave);
  timerAutoSave = setTimeout(() => {
    eksekusiSimpanDraf();
  }, 500);
}

function eksekusiSimpanDraf() {
  if (STATE.isEditing) return;

  const poin = ambilDataPoinForm();
  const tindakLanjut = ambilDataTindakLanjutForm();
  const topik = el.inputTopik?.value || "";
  const pimpinan = el.inputPimpinan?.value || "";
  const notulis = el.inputNotulis?.value || "";

  const hasPoin = poin.some((p) => (typeof p === "string" ? p : (p?.isi || "")).trim().length > 0);
  const hasContent = topik.trim().length > 0 || pimpinan.trim().length > 0 || notulis.trim().length > 0 || hasPoin || tindakLanjut.length > 0;

  if (!hasContent) {
    STATE.isFormDirty = false;
    if (el.drafStatusPill) el.drafStatusPill.classList.add("tersembunyi");
    return;
  }

  STATE.isFormDirty = true;

  const now = Date.now();
  const draftData = {
    tanggal: el.inputTanggal?.value || "",
    topik,
    pimpinan,
    notulis,
    waktu: el.inputWaktu ? el.inputWaktu.value : "",
    waktu_selesai: el.inputWaktuSelesai ? el.inputWaktuSelesai.value : "",
    tempat: el.inputTempat ? el.inputTempat.value : "",
    status: el.inputStatus ? el.inputStatus.value : "Selesai",
    anggota: STATE.anggotaForm || [],
    poin,
    tindakLanjut,
    timestamp: now,
  };

  try {
    localStorage.setItem(STATE.draftStorageKey, JSON.stringify(draftData));

    if (el.drafStatusPill) {
      const jamStr = new Date(now).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      if (el.drafStatusText) el.drafStatusText.textContent = `Draf tersimpan (${jamStr})`;
      el.drafStatusPill.classList.remove("tersembunyi");
    }
  } catch (e) {
    console.warn("Gagal menyimpan draf lokal:", e);
  }
}

/**
 * Menampilkan banner pemulihan jika ditemukan draf notulen dari sesi sebelumnya
 */
export function tampilkanBannerDrafJikaAda() {
  if (STATE.isEditing) {
    if (el.bannerPulihkanDraf) el.bannerPulihkanDraf.classList.add("tersembunyi");
    return;
  }

  const draf = cekDrafTersimpan();
  if (draf && el.bannerPulihkanDraf) {
    if (el.teksWaktuDraf) {
      el.teksWaktuDraf.textContent = `Draf notulen "${draf.topik || "Tanpa Judul"}" tersimpan pada ${formatWaktuDraf(draf.timestamp)}. Ingin memulihkan catatan ini?`;
    }
    el.bannerPulihkanDraf.classList.remove("tersembunyi");
  } else if (el.bannerPulihkanDraf) {
    el.bannerPulihkanDraf.classList.add("tersembunyi");
  }
}

/**
 * Memulihkan draf formulir yang tersimpan di localStorage
 */
export function pulihkanDrafOtomatis() {
  try {
    const d = cekDrafTersimpan();
    if (!d) return;

    if (el.inputTanggal && d.tanggal) el.inputTanggal.value = d.tanggal;
    if (el.inputTopik) el.inputTopik.value = d.topik || "";
    if (el.inputPimpinan) el.inputPimpinan.value = d.pimpinan || "";
    if (el.inputNotulis) el.inputNotulis.value = d.notulis || "";
    if (el.inputWaktu) el.inputWaktu.value = d.waktu || "";
    if (el.inputWaktuSelesai) el.inputWaktuSelesai.value = d.waktu_selesai || "";
    if (el.inputTempat) el.inputTempat.value = d.tempat || "";
    if (el.inputStatus && d.status) el.inputStatus.value = d.status;

    if (Array.isArray(d.anggota)) {
      STATE.anggotaForm = d.anggota;
      renderAnggotaChips();
    }

    if (Array.isArray(d.poin) && d.poin.length > 0 && el.daftarPoinInputs) {
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

    STATE.isFormDirty = true;
    if (el.bannerPulihkanDraf) el.bannerPulihkanDraf.classList.add("tersembunyi");
    if (el.drafStatusPill) {
      if (el.drafStatusText) el.drafStatusText.textContent = "Draf dipulihkan";
      el.drafStatusPill.classList.remove("tersembunyi");
    }

    tampilkanToast("Draf notulen berhasil dipulihkan!");
  } catch (e) {
    console.error("Gagal memulihkan draf:", e);
  }
}

/**
 * Menghapus draf formulir yang tersimpan
 */
export function hapusDrafOtomatis() {
  localStorage.removeItem(STATE.draftStorageKey);
  STATE.isFormDirty = false;
  if (el.drafStatusPill) el.drafStatusPill.classList.add("tersembunyi");
  if (el.bannerPulihkanDraf) el.bannerPulihkanDraf.classList.add("tersembunyi");
}

/**
 * Inisialisasi event tombol draf & window beforeunload guard
 */
export function initDraftEvents() {
  if (el.btnPulihkanDraf) {
    el.btnPulihkanDraf.addEventListener("click", () => {
      pulihkanDrafOtomatis();
    });
  }

  if (el.btnBuangDraf) {
    el.btnBuangDraf.addEventListener("click", () => {
      const konfirmasi = confirm("Yakin ingin menghapus draf yang belum tersimpan ini? Catatan lama tidak dapat dikembalikan.");
      if (konfirmasi) {
        hapusDrafOtomatis();
        tampilkanToast("Draf lama telah dihapus", "info");
      }
    });
  }

  // Guard: Peringatkan jika tab ditutup / direfresh saat ada perubahan belum tersimpan
  window.addEventListener("beforeunload", (e) => {
    if (STATE.isFormDirty && !STATE.isEditing) {
      e.preventDefault();
      e.returnValue = "Ada catatan notulen yang belum disimpan ke database. Yakin ingin meninggalkan halaman?";
      return e.returnValue;
    }
  });
}
