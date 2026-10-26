// ==========================================================================
// MENU: PENGATURAN - MANAJEMEN TEMA (GELAP & TERANG)
// ==========================================================================

import { elPengaturan } from "../shared/state.js";

/**
 * Menerapkan tema tampilan ke seluruh dokumen
 */
export function terapkanTema(tema) {
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
  try {
    localStorage.setItem("rapatinai_tema", tema);
  } catch (e) {}
}

/**
 * Inisialisasi tema yang tersimpan dan event tombol
 */
export function initTemaEvents() {
  const temaTersimpan = localStorage.getItem("rapatinai_tema") || "gelap";
  terapkanTema(temaTersimpan);

  if (elPengaturan.btnTemaGelap) {
    elPengaturan.btnTemaGelap.addEventListener("click", () => terapkanTema("gelap"));
  }
  if (elPengaturan.btnTemaTerang) {
    elPengaturan.btnTemaTerang.addEventListener("click", () => terapkanTema("terang"));
  }
}
