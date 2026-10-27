// ==========================================================================
// MENU: RIWAYAT RAPAT - EXPORT DOKUMEN & COPY NOTULEN
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { formatHariTanggal, copyToClipboard } from "../shared/utils.js";

/**
 * Inisialisasi event tombol ekspor dan salin notulensi
 */
export function initExportEvents() {
  if (el.btnSalinNotulen) {
    el.btnSalinNotulen.addEventListener("click", () => {
      if (!STATE.rapatAktif) return;
      const r = STATE.rapatAktif;
      const hariTanggal = formatHariTanggal(r.tanggal);
      const poinTeks = (r.poinPembahasan && r.poinPembahasan.length > 0)
        ? r.poinPembahasan.map((p, i) => `   ${i + 1}. ${typeof p === "string" ? p : (p.isi || "")}`).join("\n")
        : "   - Tidak ada catatan hasil rapat -";

      const instansi = STATE.instansi || {
        pemerintah: "PEMERINTAH PROVINSI MALUKU UTARA",
        opd: "BADAN PERENCANAAN PEMBANGUNAN DAERAH",
        opd_singkat: "BAPPEDA",
        alamat: "Jl. Raya Lintas Halmahera, Gosale Puncak, Sofifi, Maluku Utara 97827",
      };

      const opdBaris = (instansi.opd || "").toUpperCase() + (instansi.opd_singkat ? ` (${instansi.opd_singkat.toUpperCase()})` : "");

      const teksLengkap = `
${(instansi.pemerintah || "").toUpperCase()}
${opdBaris}
${instansi.alamat || ""}
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
  }

  if (el.btnPrintDoc) {
    el.btnPrintDoc.addEventListener("click", () => {
      window.print();
    });
  }
}
