// ==========================================================================
// MENU: PENGATURAN - MANAJEMEN TEMA (UNIFIED SINGLE TOGGLE - UIVERSE SUN & MOON)
// ==========================================================================

/**
 * Menerapkan tema tampilan ke seluruh dokumen
 * Catatan: Switch Uiverse: checked = Malam (Gelap), unchecked = Siang (Terang)
 * @param {"gelap"|"terang"} tema
 */
export function terapkanTema(tema) {
  const isGelap = tema === "gelap";

  if (isGelap) {
    document.body.classList.remove("tema-terang");
  } else {
    document.body.classList.add("tema-terang");
  }

  // Update input checkbox state: checked = Gelap/Malam, unchecked = Terang/Siang
  const toggleInput = document.getElementById("theme-toggle-input");
  if (toggleInput) {
    toggleInput.checked = isGelap;
  }

  // Update visual text badge
  const badgeTitle = document.getElementById("theme-badge-title");
  const badgeSub = document.getElementById("theme-badge-sub");

  if (badgeTitle) {
    badgeTitle.textContent = isGelap ? "Tema Gelap" : "Tema Terang";
  }
  if (badgeSub) {
    badgeSub.textContent = isGelap
      ? "Mode malam aktif — kontras tinggi dan nyaman di mata."
      : "Mode terang aktif — tampilan jernih dan cerah di kondisi terang.";
  }

  try {
    localStorage.setItem("rapatinai_tema", tema);
  } catch (e) {}
}

/**
 * Inisialisasi tema yang tersimpan dan event switch
 */
export function initTemaEvents() {
  const temaTersimpan = localStorage.getItem("rapatinai_tema") || "gelap";
  terapkanTema(temaTersimpan);

  const toggleInput = document.getElementById("theme-toggle-input");
  const toggleCard = document.getElementById("theme-toggle-card");

  if (toggleInput) {
    toggleInput.addEventListener("change", (e) => {
      // Pada switch Uiverse: checked = gelap (malam), unchecked = terang (siang)
      terapkanTema(e.target.checked ? "gelap" : "terang");
    });
  }

  // Klik pada seluruh baris kartu tema untuk pengalaman pengguna yang intuitif
  if (toggleCard) {
    toggleCard.addEventListener("click", (e) => {
      // Jangan trigger ganda jika target klik adalah input atau label langsung
      if (e.target && (e.target.tagName === "INPUT" || e.target.closest("label"))) {
        return;
      }
      const isCurrentlyGelap = !document.body.classList.contains("tema-terang");
      terapkanTema(isCurrentlyGelap ? "terang" : "gelap");
    });

    // Dukungan navigasi keyboard (Enter / Space)
    toggleCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const isCurrentlyGelap = !document.body.classList.contains("tema-terang");
        terapkanTema(isCurrentlyGelap ? "terang" : "gelap");
      }
    });
  }
}
