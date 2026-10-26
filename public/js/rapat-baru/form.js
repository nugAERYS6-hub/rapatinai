// ==========================================================================
// MENU: RAPAT BARU - FORM BUILDER & SUBMISSION
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { tampilkanToast, tutupSemuaView, resetSemuaMenuAktif } from "../shared/ui.js";
import { renderAnggotaChips, initPesertaEvents } from "./peserta.js";
import { tambahBarisPoin, tambahBarisTindakLanjut, ambilDataPoinForm, ambilDataTindakLanjutForm, initDinamisEvents } from "./dinamis.js";
import { pulihkanDrafOtomatis, hapusDrafOtomatis, simpanDrafOtomatis } from "./draft.js";
import { muatStats, muatDaftarRapat, bukaRiwayat } from "../riwayat/riwayat.js";
import { tampilkanDetailRapat } from "../riwayat/detail.js";

/**
 * Menampilkan formulir pembuatan notulen rapat baru
 */
export function tampilkanFormBaru(syncHash = true) {
  if (syncHash && window.location.hash !== "#/baru") {
    window.location.hash = "#/baru";
    return;
  }

  STATE.isEditing = false;
  STATE.editId = null;
  if (el.judulForm) el.judulForm.textContent = "Notulen Rapat Baru";
  if (el.labelSimpanSubmit) el.labelSimpanSubmit.textContent = "Simpan Notulen Rapat";
  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  if (el.breadcrumbCurrent) el.breadcrumbCurrent.textContent = "Buat Notulen Baru";

  resetSemuaMenuAktif();
  if (el.menuRapatBaru) el.menuRapatBaru.classList.add("aktif");

  if (el.formRapat) el.formRapat.reset();
  if (el.editIdRapat) el.editIdRapat.value = "";
  if (el.inputWaktu) el.inputWaktu.value = "";
  if (el.inputTempat) el.inputTempat.value = "";
  if (el.inputStatus) el.inputStatus.value = "Selesai";
  STATE.anggotaForm = [];
  renderAnggotaChips();

  if (el.daftarPoinInputs) {
    el.daftarPoinInputs.innerHTML = "";
    tambahBarisPoin("");
  }

  if (el.daftarTindakLanjutInputs) {
    el.daftarTindakLanjutInputs.innerHTML = "";
  }

  if (el.inputTanggal) {
    el.inputTanggal.value = new Date().toISOString().slice(0, 10);
  }

  pulihkanDrafOtomatis();

  document.querySelectorAll(".item-rapat-sidebar").forEach((i) => i.classList.remove("aktif"));

  tutupSemuaView();
  if (el.viewForm) el.viewForm.classList.remove("tersembunyi");
}

/**
 * Membuka formulir untuk mengedit data rapat yang sedang aktif
 */
export function bukaEditRapat() {
  if (!STATE.rapatAktif) return;
  const r = STATE.rapatAktif;

  STATE.isEditing = true;
  STATE.editId = r.id;
  if (el.judulForm) el.judulForm.textContent = `Edit: ${r.topik}`;
  if (el.labelSimpanSubmit) el.labelSimpanSubmit.textContent = "Perbarui Notulen Rapat";
  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  if (el.breadcrumbCurrent) el.breadcrumbCurrent.textContent = `Edit — ${r.topik}`;

  if (el.editIdRapat) el.editIdRapat.value = r.id;
  if (el.inputTanggal) el.inputTanggal.value = r.tanggal || "";
  if (el.inputTopik) el.inputTopik.value = r.topik || "";
  if (el.inputPimpinan) el.inputPimpinan.value = r.pimpinanRapat || "";
  if (el.inputNotulis) el.inputNotulis.value = r.notulis || "";
  if (el.inputWaktu) el.inputWaktu.value = r.waktu || "";
  if (el.inputTempat) el.inputTempat.value = r.tempat || "";
  if (el.inputStatus) el.inputStatus.value = r.status || "Selesai";

  STATE.anggotaForm = [...(r.anggota || [])];
  renderAnggotaChips();

  if (el.daftarPoinInputs) {
    el.daftarPoinInputs.innerHTML = "";
    if (r.poinPembahasan && r.poinPembahasan.length > 0) {
      r.poinPembahasan.forEach((p) => {
        const teks = typeof p === "string" ? p : (p.isi || "");
        tambahBarisPoin(teks);
      });
    } else {
      tambahBarisPoin("");
    }
  }

  if (el.daftarTindakLanjutInputs) {
    el.daftarTindakLanjutInputs.innerHTML = "";
    if (r.tindakLanjut && r.tindakLanjut.length > 0) {
      r.tindakLanjut.forEach((tl) => tambahBarisTindakLanjut(tl));
    }
  }

  if (el.viewDetail) el.viewDetail.classList.add("tersembunyi");
  if (el.viewForm) el.viewForm.classList.remove("tersembunyi");
}

/**
 * Inisialisasi event listener form
 */
export function initFormEvents() {
  initPesertaEvents();
  initDinamisEvents();

  // Batal form
  if (el.btnBatalForm) {
    el.btnBatalForm.addEventListener("click", () => {
      const sedangEdit = STATE.isEditing;
      STATE.isEditing = false;
      STATE.editId = null;

      if (sedangEdit && STATE.rapatAktif) {
        if (el.viewForm) el.viewForm.classList.add("tersembunyi");
        if (el.viewDetail) el.viewDetail.classList.remove("tersembunyi");
        window.location.hash = `#/detail/${STATE.rapatAktif.id}`;
      } else {
        if (el.formRapat) el.formRapat.reset();
        hapusDrafOtomatis();
        bukaRiwayat();
      }
    });
  }

  // Edit rapat trigger
  if (el.btnEditRapat) {
    el.btnEditRapat.addEventListener("click", bukaEditRapat);
  }

  // Input change auto-save listeners
  [el.inputTanggal, el.inputTopik, el.inputPimpinan, el.inputNotulis, el.inputWaktu, el.inputTempat, el.inputStatus].filter(Boolean).forEach((input) => {
    input.addEventListener("input", simpanDrafOtomatis);
    input.addEventListener("change", simpanDrafOtomatis);
  });

  // Submit form (create & update)
  if (el.formRapat) {
    el.formRapat.addEventListener("submit", async (e) => {
      e.preventDefault();

      const tanggal = el.inputTanggal?.value;
      const topik = el.inputTopik?.value.trim();
      const pimpinan = el.inputPimpinan?.value.trim();
      const notulis = el.inputNotulis?.value.trim();
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

      if (el.btnSimpanSubmit) el.btnSimpanSubmit.disabled = true;
      if (el.labelSimpanSubmit) el.labelSimpanSubmit.textContent = "Menyimpan ke Database...";

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
        if (el.btnSimpanSubmit) el.btnSimpanSubmit.disabled = false;
        if (el.labelSimpanSubmit) {
          el.labelSimpanSubmit.textContent = STATE.isEditing ? "Perbarui Notulen Rapat" : "Simpan Notulen Rapat";
        }
      }
    });
  }
}
