// ==========================================================================
// MENU: RAPAT BARU - PESERTA RAPAT & MODAL DIALOG
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { escapeHtml } from "../shared/utils.js";
import { tampilkanToast } from "../shared/ui.js";
import { simpanDrafOtomatis } from "./draft.js";

/**
 * Menampilkan daftar chips peserta rapat yang telah ditambahkan
 */
export function renderAnggotaChips() {
  if (!el.daftarAnggotaChips) return;

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

/**
 * Menutup modal dialog tambah peserta
 */
export function tutupModalAnggota() {
  if (el.modalAnggota) el.modalAnggota.close();
}

/**
 * Inisialisasi event modal peserta
 */
export function initPesertaEvents() {
  if (el.btnBukaModalAnggota) {
    el.btnBukaModalAnggota.addEventListener("click", () => {
      if (el.inputModalNama) el.inputModalNama.value = "";
      if (el.inputModalJabatan) el.inputModalJabatan.value = "";
      if (el.inputModalInstansi) el.inputModalInstansi.value = "";
      if (el.modalAnggota) el.modalAnggota.showModal();
      if (el.inputModalNama) el.inputModalNama.focus();
    });
  }

  if (el.btnCloseModalX) el.btnCloseModalX.addEventListener("click", tutupModalAnggota);
  if (el.btnBatalAnggota) el.btnBatalAnggota.addEventListener("click", tutupModalAnggota);

  if (el.formModalAnggota) {
    el.formModalAnggota.addEventListener("submit", (e) => {
      e.preventDefault();
      const nama = el.inputModalNama?.value.trim();
      if (!nama) {
        tampilkanToast("Nama peserta wajib diisi", "error");
        return;
      }

      STATE.anggotaForm.push({
        nama,
        jabatan: el.inputModalJabatan?.value.trim() || "-",
        asalInstansi: el.inputModalInstansi?.value.trim() || "-",
      });

      renderAnggotaChips();
      simpanDrafOtomatis();
      tutupModalAnggota();
    });
  }
}
