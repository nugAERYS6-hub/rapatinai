// ==========================================================================
// MENU: RIWAYAT RAPAT - DETAIL NOTULEN RAPAT & PRATINJAU DOKUMEN
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { escapeHtml, formatHariTanggal, RAPATIN_API_KEY } from "../shared/utils.js";
import { tampilkanToast, tutupSemuaView, resetSemuaMenuAktif } from "../shared/ui.js";
import { renderAiContent, formatRingkasanHTML } from "./ai.js";
import { bukaRiwayat, muatStats, muatDaftarRapat } from "./riwayat.js";

/**
 * Menampilkan kerangka skeleton shimmer saat memuat data detail rapat
 */
export function tampilkanSkeletonDetail() {
  tutupSemuaView();
  if (el.viewDetail) el.viewDetail.classList.remove("tersembunyi");

  if (el.detailTopik) {
    el.detailTopik.innerHTML = `<span class="detail-skeleton-line skeleton-title"></span>`;
  }
  if (el.detailTanggal) {
    el.detailTanggal.innerHTML = `<span class="detail-skeleton-pill"></span>`;
  }
  if (el.detailWaktu) {
    el.detailWaktu.classList.remove("tersembunyi");
    el.detailWaktu.innerHTML = `<span class="detail-skeleton-pill"></span>`;
  }
  if (el.detailTempat) {
    el.detailTempat.classList.remove("tersembunyi");
    el.detailTempat.innerHTML = `<span class="detail-skeleton-pill"></span>`;
  }
  if (el.detailStatus) {
    el.detailStatus.className = "badge-status-rapat";
    el.detailStatus.innerHTML = `<span class="detail-skeleton-pill"></span>`;
  }
  if (el.detailPimpinan) el.detailPimpinan.textContent = "...";
  if (el.detailNotulis) el.detailNotulis.textContent = "...";
  if (el.detailTotalPeserta) el.detailTotalPeserta.textContent = "...";

  if (el.kontenPesertaGrid) {
    el.kontenPesertaGrid.innerHTML = `
      <div class="peserta-item-card skeleton-card-pulse">
        <div class="detail-skeleton-circle"></div>
        <div style="flex:1;"><div class="detail-skeleton-line" style="width:70%;margin-bottom:6px;"></div><div class="detail-skeleton-line" style="width:40%;"></div></div>
      </div>
      <div class="peserta-item-card skeleton-card-pulse">
        <div class="detail-skeleton-circle"></div>
        <div style="flex:1;"><div class="detail-skeleton-line" style="width:65%;margin-bottom:6px;"></div><div class="detail-skeleton-line" style="width:45%;"></div></div>
      </div>
    `;
  }

  if (el.kontenPoinList) {
    el.kontenPoinList.innerHTML = `
      <div class="poin-row-item skeleton-card-pulse">
        <div class="detail-skeleton-circle" style="width:24px;height:24px;border-radius:6px;"></div>
        <div class="poin-content" style="flex:1;"><div class="detail-skeleton-line" style="width:90%;margin-bottom:6px;"></div><div class="detail-skeleton-line" style="width:65%;"></div></div>
      </div>
    `;
  }

  if (el.kontenLampiranGrid) {
    el.kontenLampiranGrid.innerHTML = `
      <div class="card-lampiran-item skeleton-card-pulse">
        <div class="detail-skeleton-circle" style="width:36px;height:36px;border-radius:8px;"></div>
        <div style="flex:1;"><div class="detail-skeleton-line" style="width:60%;margin-bottom:6px;"></div><div class="detail-skeleton-line" style="width:30%;"></div></div>
      </div>
    `;
  }
}

/**
 * Menampilkan rincian detail 1 notulen rapat eksekutif
 */
export async function tampilkanDetailRapat(id, syncHash = true) {
  if (syncHash && window.location.hash !== `#/detail/${id}`) {
    window.location.hash = `#/detail/${id}`;
    return;
  }

  tampilkanSkeletonDetail();

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

    if (el.detailPimpinan) {
      const nipPimpinan = rapat.pimpinan_nip ? ` (NIP. ${rapat.pimpinan_nip})` : "";
      el.detailPimpinan.textContent = (rapat.pimpinanRapat || "-") + nipPimpinan;
    }
    if (el.detailNotulis) {
      const nipNotulis = rapat.notulis_nip ? ` (NIP. ${rapat.notulis_nip})` : "";
      el.detailNotulis.textContent = (rapat.notulis || "-") + nipNotulis;
    }
    if (el.detailTotalPeserta) el.detailTotalPeserta.textContent = `${rapat.anggota?.length || 0} Orang Hadir`;

    if (el.avatarPimpinan) {
      el.avatarPimpinan.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
    }
    if (el.avatarNotulis) {
      el.avatarNotulis.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>`;
    }

    if (el.btnUnduhPdf) el.btnUnduhPdf.href = `/api/rapat/${rapat.id}/export-pdf?api_key=${encodeURIComponent(RAPATIN_API_KEY)}`;
    if (el.btnUnduhWord) el.btnUnduhWord.href = `/api/rapat/${rapat.id}/export-word?api_key=${encodeURIComponent(RAPATIN_API_KEY)}`;

    await muatKonfigInstansi();
    renderAiContent(rapat);
    renderPesertaGrid(rapat.anggota || []);
    renderPoinList(rapat.poinPembahasan || []);
    renderLampiranGrid(rapat.lampiran || []);
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
      const nama = escapeHtml(a.nama || "-");
      const jabatan = escapeHtml(a.jabatan || "-");
      const instansi = escapeHtml(a.asalInstansi || "-");
      return `
        <div class="peserta-item-card">
          <div class="peserta-avatar-badge" aria-hidden="true">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
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
 * Memuat konfigurasi profil dan kop surat instansi
 */
export async function muatKonfigInstansi() {
  if (STATE.instansi) return STATE.instansi;
  try {
    const res = await fetch("/api/instansi");
    const json = await res.json();
    if (json.success && json.data) {
      STATE.instansi = json.data;
      return STATE.instansi;
    }
  } catch (e) {
    console.warn("Gagal memuat konfigurasi instansi:", e);
  }
  STATE.instansi = {
    pemerintah: "PEMERINTAH PROVINSI MALUKU UTARA",
    opd: "BADAN PERENCANAAN PEMBANGUNAN DAERAH",
    opd_singkat: "BAPPEDA",
    alamat: "Jl. Raya Lintas Halmahera, Gosale Puncak, Sofifi, Maluku Utara 97827",
    kontak: "Laman: bappeda.malutprov.go.id | Pos-el: bappeda@malutprov.go.id",
    logo_path: "logo-bappeda.jpg",
  };
  return STATE.instansi;
}

/**
 * Merender lembar pratinjau dokumen cetak dinas resmi
 */
export function renderPaperPreview(rapat) {
  if (!el.paperPreviewContent) return;

  const instansi = STATE.instansi || {
    pemerintah: "PEMERINTAH PROVINSI MALUKU UTARA",
    opd: "BADAN PERENCANAAN PEMBANGUNAN DAERAH",
    opd_singkat: "BAPPEDA",
    alamat: "Jl. Raya Lintas Halmahera, Gosale Puncak, Sofifi, Maluku Utara 97827",
    kontak: "Laman: bappeda.malutprov.go.id | Pos-el: bappeda@malutprov.go.id",
    logo_path: "logo-bappeda.jpg",
  };

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

  const logoHtml = instansi.logo_path
    ? `<div class="kop-logo-box">
         <img src="${escapeHtml(instansi.logo_path)}" alt="Logo ${escapeHtml(instansi.opd || 'Instansi')}" class="kop-logo-img" onerror="this.style.display='none'" />
       </div>`
    : "";

  el.paperPreviewContent.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto; color: #000000; font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.6;">
      <!-- KOP SURAT RESMI (DINAMIS) -->
      <div class="kop-surat-wrapper">
        ${logoHtml}
        <div class="kop-text-box" style="${!logoHtml ? 'text-align: center;' : ''}">
          <div class="kop-instansi-prov">${escapeHtml((instansi.pemerintah || "").toUpperCase())}</div>
          <div class="kop-nama-dinas">${escapeHtml((instansi.opd || "").toUpperCase())}</div>
          ${instansi.alamat ? `<div class="kop-alamat">${escapeHtml(instansi.alamat)}</div>` : ''}
          ${instansi.kontak ? `<div class="kop-kontak">${escapeHtml(instansi.kontak)}</div>` : ''}
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

      <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11pt; page-break-inside: avoid;">
        <div style="text-align: center; width: 250px;">
          ${escapeHtml(rapat.pimpinan_jabatan || "Pemimpin rapat")},<br><br><br><br><br>
          <b style="text-decoration: underline;">${pimpinanStr}</b>
          ${rapat.pimpinan_nip ? `<div style="font-size: 9.5pt; margin-top: 2px;">NIP. ${escapeHtml(rapat.pimpinan_nip)}</div>` : ""}
        </div>
        <div style="text-align: center; width: 250px;">
          Notulen,<br><br><br><br><br>
          <b style="text-decoration: underline;">${notulisStr}</b>
          ${rapat.notulis_nip ? `<div style="font-size: 9.5pt; margin-top: 2px;">NIP. ${escapeHtml(rapat.notulis_nip)}</div>` : ""}
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
 * Menampilkan berkas lampiran pendukung rapat
 */
export function renderLampiranGrid(lampiranList = []) {
  if (!el.kontenLampiranGrid) return;

  const list = Array.isArray(lampiranList) ? lampiranList : [];
  if (el.badgeLampiranCount) {
    el.badgeLampiranCount.textContent = `${list.length} Berkas`;
  }

  if (list.length === 0) {
    el.kontenLampiranGrid.innerHTML = `
      <div class="lampiran-empty-state" style="grid-column: 1 / -1;">
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity: 0.35; margin: 0 auto 8px;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Belum ada berkas lampiran pendukung untuk rapat ini.</p>
        <p style="font-size: 11.5px; color: #64748b;">Gunakan tombol di atas untuk mengunggah scan daftar hadir, foto kegiatan, atau materi presentasi.</p>
      </div>
    `;
    return;
  }

  const itemsHtml = list.map((item) => {
    const mime = (item.tipe_mime || "").toLowerCase();
    const nama = item.nama_file || "Berkas";
    const ext = nama.split(".").pop().toLowerCase();

    let iconText = "FILE";
    let iconClass = "lampiran-icon-default";

    if (mime.includes("pdf") || ext === "pdf") {
      iconText = "PDF";
      iconClass = "lampiran-icon-pdf";
    } else if (mime.includes("image") || ["jpg", "jpeg", "png", "webp"].includes(ext)) {
      iconText = "IMG";
      iconClass = "lampiran-icon-image";
    } else if (mime.includes("word") || ["doc", "docx"].includes(ext)) {
      iconText = "DOC";
      iconClass = "lampiran-icon-word";
    } else if (mime.includes("presentation") || ["ppt", "pptx"].includes(ext)) {
      iconText = "PPT";
      iconClass = "lampiran-icon-presentation";
    } else if (mime.includes("excel") || mime.includes("spreadsheet") || ["xls", "xlsx"].includes(ext)) {
      iconText = "XLS";
      iconClass = "lampiran-icon-excel";
    }

    const downloadUrl = item.download_url
      ? `${item.download_url}?api_key=${encodeURIComponent(RAPATIN_API_KEY)}`
      : (item.url ? `${item.url}?api_key=${encodeURIComponent(RAPATIN_API_KEY)}` : "#");

    return `
      <div class="card-lampiran-item" data-lampiran-id="${escapeHtml(item.id)}">
        <div class="lampiran-item-icon ${iconClass}">
          <span>${iconText}</span>
        </div>
        <div class="lampiran-item-info">
          <div class="lampiran-item-nama" title="${escapeHtml(nama)}">${escapeHtml(nama)}</div>
          <div class="lampiran-item-meta">
            <span>${escapeHtml(item.ukuran_formatted || "-")}</span>
            <span>•</span>
            <span style="text-transform: capitalize;">${escapeHtml(item.kategori || "Dokumen")}</span>
          </div>
        </div>
        <div class="lampiran-item-actions">
          <button type="button" class="btn-lampiran-action btn-lampiran-preview tombol-preview-lampiran" data-lampiran-id="${escapeHtml(item.id)}" title="Pratinjau berkas">
            Lihat
          </button>
          <a href="${downloadUrl}" class="btn-lampiran-action btn-lampiran-unduh" target="_blank" download title="Unduh berkas">
            Unduh
          </a>
          <button type="button" class="btn-lampiran-action btn-lampiran-hapus tombol-hapus-lampiran" data-lampiran-id="${escapeHtml(item.id)}" data-nama="${escapeHtml(nama)}" title="Hapus lampiran">
            Hapus
          </button>
        </div>
      </div>
    `;
  }).join("");

  el.kontenLampiranGrid.innerHTML = itemsHtml;

  // Bind preview lampiran buttons & item click
  el.kontenLampiranGrid.querySelectorAll(".tombol-preview-lampiran").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const lampiranId = btn.dataset.lampiranId;
      const item = list.find((l) => String(l.id) === String(lampiranId));
      if (item) bukaPreviewLampiran(item);
    });
  });

  el.kontenLampiranGrid.querySelectorAll(".card-lampiran-item").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".lampiran-item-actions")) return;
      const lampiranId = card.dataset.lampiranId;
      const item = list.find((l) => String(l.id) === String(lampiranId));
      if (item) bukaPreviewLampiran(item);
    });
  });

  // Bind hapus lampiran buttons
  el.kontenLampiranGrid.querySelectorAll(".tombol-hapus-lampiran").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const lampiranId = btn.dataset.lampiranId;
      const namaBerkas = btn.dataset.nama || "berkas ini";
      if (!STATE.rapatAktif || !lampiranId) return;

      const konfirmasi = confirm(`Hapus berkas lampiran "${namaBerkas}"?`);
      if (!konfirmasi) return;

      try {
        btn.disabled = true;
        btn.textContent = "...";
        const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}/lampiran/${lampiranId}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.pesan || "Gagal menghapus lampiran");

        tampilkanToast("Berkas lampiran berhasil dihapus");
        STATE.rapatAktif.lampiran = (STATE.rapatAktif.lampiran || []).filter((l) => l.id !== lampiranId);
        renderLampiranGrid(STATE.rapatAktif.lampiran);
      } catch (err) {
        tampilkanToast(err.message, "error");
        btn.disabled = false;
        btn.textContent = "Hapus";
      }
    });
  });
}

/**
 * Membuka modal pratinjau berkas lampiran (gambar/PDF/dokumen)
 */
export function bukaPreviewLampiran(item) {
  if (!el.modalPreviewLampiran || !item) return;

  const nama = item.nama_file || "Berkas";
  const mime = (item.tipe_mime || "").toLowerCase();
  const ext = nama.split(".").pop().toLowerCase();
  const downloadUrl = item.download_url
    ? `${item.download_url}?api_key=${encodeURIComponent(RAPATIN_API_KEY)}`
    : (item.url ? `${item.url}?api_key=${encodeURIComponent(RAPATIN_API_KEY)}` : "#");
  const previewUrl = item.preview_url
    ? `${item.preview_url}?api_key=${encodeURIComponent(RAPATIN_API_KEY)}`
    : downloadUrl;

  if (el.modalPreviewNama) el.modalPreviewNama.textContent = nama;
  if (el.modalPreviewMeta) {
    el.modalPreviewMeta.textContent = `${item.ukuran_formatted || "-"} • ${item.kategori || "Dokumen"}`;
  }
  if (el.modalPreviewBtnUnduh) {
    el.modalPreviewBtnUnduh.href = downloadUrl;
  }

  if (!el.modalPreviewBody) return;

  if (mime.includes("image") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
    el.modalPreviewBody.innerHTML = `
      <div class="preview-img-container">
        <img src="${previewUrl}" alt="${escapeHtml(nama)}" class="preview-img-full" />
      </div>
    `;
  } else if (mime.includes("pdf") || ext === "pdf") {
    el.modalPreviewBody.innerHTML = `
      <iframe src="${previewUrl}" class="preview-pdf-iframe" title="${escapeHtml(nama)}"></iframe>
    `;
  } else {
    let iconLabel = ext.toUpperCase() || "FILE";
    el.modalPreviewBody.innerHTML = `
      <div class="preview-fallback-box">
        <div class="lampiran-item-icon lampiran-icon-default" style="width: 58px; height: 58px; font-size: 18px; margin: 0 auto 16px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-weight: 800;">
          <span>${iconLabel}</span>
        </div>
        <h4 style="font-size: 15px; font-weight: 600; color: inherit; margin-bottom: 8px;">${escapeHtml(nama)}</h4>
        <p style="font-size: 12.5px; color: #64748b; margin-bottom: 20px; line-height: 1.5;">
          Format berkas ini tidak dapat dipratinjau langsung di dalam jendela peramban. Silakan unduh untuk membuka dengan aplikasi terkait.
        </p>
        <a href="${downloadUrl}" class="btn-lampiran-action btn-lampiran-unduh" style="padding: 8px 18px; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;" download>
          Unduh Berkas (${escapeHtml(item.ukuran_formatted || "")})
        </a>
      </div>
    `;
  }

  el.modalPreviewLampiran.showModal();
}

/**
 * Inisialisasi event modal preview lampiran
 */
export function initModalPreviewEvents() {
  if (el.btnClosePreviewX && el.modalPreviewLampiran) {
    el.btnClosePreviewX.addEventListener("click", () => {
      el.modalPreviewLampiran.close();
    });
  }

  if (el.modalPreviewLampiran) {
    el.modalPreviewLampiran.addEventListener("click", (e) => {
      if (e.target === el.modalPreviewLampiran) {
        el.modalPreviewLampiran.close();
      }
    });

    el.modalPreviewLampiran.addEventListener("close", () => {
      if (el.modalPreviewBody) el.modalPreviewBody.innerHTML = "";
    });
  }
}

/**
 * Inisialisasi mekanisme upload lampiran (input file & drag-and-drop)
 */
export function initLampiranUpload() {
  const handleUploadFile = async (file) => {
    if (!STATE.rapatAktif) return;
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      tampilkanToast("Ukuran berkas melebihi batas 10 MB", "error");
      return;
    }

    const labelPilih = document.getElementById("label-pilih-lampiran");
    const teksAsli = labelPilih ? labelPilih.innerHTML : "";
    if (labelPilih) {
      labelPilih.innerHTML = "<span>Mengunggah...</span>";
      labelPilih.style.pointerEvents = "none";
    }

    try {
      const formData = new FormData();
      formData.append("berkas", file);

      const ext = (file.name.split(".").pop() || "").toLowerCase();
      let kategori = "dokumen";
      if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        kategori = "foto";
      } else if (file.name.toLowerCase().includes("hadir") || file.name.toLowerCase().includes("absens")) {
        kategori = "daftar_hadir";
      } else if (["ppt", "pptx"].includes(ext)) {
        kategori = "materi";
      }
      formData.append("kategori", kategori);

      const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}/lampiran`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.pesan || "Gagal mengunggah berkas");

      tampilkanToast("Berkas lampiran berhasil diunggah!");
      if (!Array.isArray(STATE.rapatAktif.lampiran)) {
        STATE.rapatAktif.lampiran = [];
      }
      STATE.rapatAktif.lampiran.unshift(json.data);
      renderLampiranGrid(STATE.rapatAktif.lampiran);
    } catch (err) {
      tampilkanToast(err.message, "error");
    } finally {
      if (el.inputFileLampiran) el.inputFileLampiran.value = "";
      if (labelPilih) {
        labelPilih.innerHTML = teksAsli;
        labelPilih.style.pointerEvents = "auto";
      }
    }
  };

  if (el.inputFileLampiran) {
    el.inputFileLampiran.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleUploadFile(file);
    });
  }

  if (el.dropzoneLampiran) {
    ["dragenter", "dragover"].forEach((evt) => {
      el.dropzoneLampiran.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.dropzoneLampiran.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((evt) => {
      el.dropzoneLampiran.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.dropzoneLampiran.classList.remove("dragover");
      });
    });

    el.dropzoneLampiran.addEventListener("drop", (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) handleUploadFile(file);
    });
  }
}

/**
 * Inisialisasi event tombol hapus rapat
 */
export function initDetailEvents() {
  initLampiranUpload();
  initModalPreviewEvents();

  if (el.btnHapusRapat) {
    el.btnHapusRapat.addEventListener("click", async () => {
      if (!STATE.rapatAktif) return;
      const konfirmasi = confirm(`Pindahkan notulen "${STATE.rapatAktif.topik}" ke Tempat Sampah?\n\nCatatan: Anda dapat memulihkannya kembali kapan saja dari filter Tempat Sampah.`);
      if (!konfirmasi) return;

      try {
        const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}`, { method: "DELETE" });
        const json = await res.json();
        if (!json.success) throw new Error(json.pesan || "Gagal menghapus");

        tampilkanToast("Notulen rapat berhasil dipindahkan ke Tempat Sampah");
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
