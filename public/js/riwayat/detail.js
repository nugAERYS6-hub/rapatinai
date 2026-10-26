// ==========================================================================
// MENU: RIWAYAT RAPAT - DETAIL NOTULEN RAPAT & PRATINJAU DOKUMEN
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { escapeHtml, formatHariTanggal } from "../shared/utils.js";
import { tampilkanToast, tutupSemuaView, resetSemuaMenuAktif } from "../shared/ui.js";
import { renderAiContent, formatRingkasanHTML } from "./ai.js";
import { bukaRiwayat, muatStats, muatDaftarRapat } from "./riwayat.js";

/**
 * Menampilkan rincian detail 1 notulen rapat eksekutif
 */
export async function tampilkanDetailRapat(id, syncHash = true) {
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
    if (el.breadcrumbCurrent) el.breadcrumbCurrent.textContent = rapat.topik;

    if (el.detailTopik) el.detailTopik.textContent = rapat.topik;
    if (el.detailTanggal) el.detailTanggal.innerHTML = `<span>${escapeHtml(formatHariTanggal(rapat.tanggal))}</span>`;

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

    if (el.detailPimpinan) el.detailPimpinan.textContent = rapat.pimpinanRapat || "-";
    if (el.detailNotulis) el.detailNotulis.textContent = rapat.notulis || "-";
    if (el.detailTotalPeserta) el.detailTotalPeserta.textContent = `${rapat.anggota?.length || 0} Orang Hadir`;

    if (el.avatarPimpinan) el.avatarPimpinan.textContent = (rapat.pimpinanRapat || "P").charAt(0).toUpperCase();
    if (el.avatarNotulis) el.avatarNotulis.textContent = (rapat.notulis || "N").charAt(0).toUpperCase();

    if (el.btnUnduhPdf) el.btnUnduhPdf.href = `/api/rapat/${rapat.id}/export-pdf`;
    if (el.btnUnduhWord) el.btnUnduhWord.href = `/api/rapat/${rapat.id}/export-word`;

    renderAiContent(rapat);
    renderPesertaGrid(rapat.anggota || []);
    renderPoinList(rapat.poinPembahasan || []);
    renderPaperPreview(rapat);

    tutupSemuaView();
    if (el.viewDetail) el.viewDetail.classList.remove("tersembunyi");
  } catch (err) {
    tampilkanToast(err.message, "error");
    if (window.location.hash.startsWith("#/detail/")) {
      bukaRiwayat();
    }
  }
}

/**
 * Menampilkan kartu-kartu peserta hadir pada halaman detail
 */
export function renderPesertaGrid(anggota) {
  if (!el.kontenPesertaGrid) return;
  if (el.badgePesertaCount) el.badgePesertaCount.textContent = `${anggota.length} Peserta`;

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

/**
 * Menampilkan daftar poin pembahasan notulensi pada halaman detail
 */
export function renderPoinList(poinList) {
  if (!el.kontenPoinList) return;
  if (el.badgePoinCount) el.badgePoinCount.textContent = `${poinList.length} Notulensi`;

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

/**
 * Merender lembar pratinjau dokumen cetak dinas BAPPEDA
 */
export function renderPaperPreview(rapat) {
  if (!el.paperPreviewContent) return;

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

/**
 * Inisialisasi event tombol hapus rapat
 */
export function initDetailEvents() {
  if (el.btnHapusRapat) {
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
  }
}
