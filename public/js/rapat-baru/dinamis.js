// ==========================================================================
// MENU: RAPAT BARU - DYNAMIC ROWS: NOTULENSI & TINDAK LANJUT
// ==========================================================================

import { el } from "../shared/state.js";
import { escapeHtml } from "../shared/utils.js";
import { simpanDrafOtomatis } from "./draft.js";

/**
 * Menambahkan satu baris input poin notulensi / pembahasan rapat
 */
export function tambahBarisPoin(isi = "") {
  if (!el.daftarPoinInputs) return;

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

/**
 * Mengambil array objek poin pembahasan dari formulir
 */
export function ambilDataPoinForm() {
  if (!el.daftarPoinInputs) return [];
  const rows = el.daftarPoinInputs.querySelectorAll(".dynamic-row");
  const hasil = [];
  rows.forEach((r) => {
    const textarea = r.querySelector(".input-poin-teks");
    const isi = textarea ? textarea.value.trim() : "";
    if (isi) hasil.push({ isi });
  });
  return hasil;
}

/**
 * Menambahkan baris input tindak lanjut / penugasan
 */
export function tambahBarisTindakLanjut(data = {}) {
  if (!el.daftarTindakLanjutInputs) return;

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

  el.daftarTindakLanjutInputs.appendChild(row);
}

/**
 * Mengambil array objek tindak lanjut dari formulir
 */
export function ambilDataTindakLanjutForm() {
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

/**
 * Inisialisasi tombol tambah baris dinamis
 */
export function initDinamisEvents() {
  if (el.btnTambahPoin) {
    el.btnTambahPoin.addEventListener("click", () => tambahBarisPoin(""));
  }
  if (el.btnTambahTindakLanjut) {
    el.btnTambahTindakLanjut.addEventListener("click", () => tambahBarisTindakLanjut());
  }
}
