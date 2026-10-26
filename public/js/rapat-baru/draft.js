// ==========================================================================
// MENU: RAPAT BARU - DRAF AUTO-SAVE (LOCALSTORAGE)
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { ambilDataPoinForm, ambilDataTindakLanjutForm, tambahBarisPoin, tambahBarisTindakLanjut } from "./dinamis.js";
import { renderAnggotaChips } from "./peserta.js";

/**
 * Menyimpan draf formulir secara otomatis ke localStorage
 */
export function simpanDrafOtomatis() {
  if (STATE.isEditing) return;
  const draftData = {
    tanggal: el.inputTanggal?.value || "",
    topik: el.inputTopik?.value || "",
    pimpinan: el.inputPimpinan?.value || "",
    notulis: el.inputNotulis?.value || "",
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
  } catch (e) {}
}

/**
 * Memulihkan draf formulir yang tersimpan di localStorage
 */
export function pulihkanDrafOtomatis() {
  try {
    const raw = localStorage.getItem(STATE.draftStorageKey);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d || !d.topik) return;

    if (el.inputTanggal) el.inputTanggal.value = d.tanggal || "";
    if (el.inputTopik) el.inputTopik.value = d.topik || "";
    if (el.inputPimpinan) el.inputPimpinan.value = d.pimpinan || "";
    if (el.inputNotulis) el.inputNotulis.value = d.notulis || "";
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
  } catch (e) {}
}

/**
 * Menghapus draf formulir yang tersimpan
 */
export function hapusDrafOtomatis() {
  localStorage.removeItem(STATE.draftStorageKey);
  el.drafAutoSavePill?.classList.add("tersembunyi");
}
