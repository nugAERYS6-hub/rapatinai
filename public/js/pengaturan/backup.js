// ==========================================================================
// MENU: PENGATURAN - BACKUP & RESTORE DATABASE MYSQL
// ==========================================================================

import { el, elPengaturan } from "../shared/state.js";
import { escapeHtml, formatUkuranFile, formatWaktuBackup } from "../shared/utils.js";
import { tampilkanToast, tutupSemuaView, resetSemuaMenuAktif, tutupSidebarMobile } from "../shared/ui.js";
import { muatStats, muatDaftarRapat } from "../riwayat/riwayat.js";

const BACKUP_STORAGE_KEY = "rapatinai_backup_log_v1";

/**
 * Memuat riwayat log backup dari localStorage
 */
export function muatLogBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan riwayat log backup ke localStorage
 */
export function simpanLogBackup(log) {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(log));
  } catch (e) {}
}

/**
 * Merender tabel riwayat unduhan backup
 */
export function renderRiwayatBackup() {
  const log = muatLogBackup();
  const tbody = document.getElementById("tbody-riwayat-backup");
  const rowKosong = document.getElementById("backup-row-kosong");
  const statTotal = document.getElementById("backup-stat-total");
  const statSukses = document.getElementById("backup-stat-sukses");
  const statTerakhir = document.getElementById("backup-stat-terakhir");

  if (!tbody) return;

  const totalSukses = log.filter((l) => l.status === "sukses").length;
  if (statTotal) statTotal.textContent = log.length;
  if (statSukses) statSukses.textContent = totalSukses;
  if (statTerakhir) {
    statTerakhir.textContent = log.length > 0 ? formatWaktuBackup(log[0].waktu) : "—";
  }

  if (log.length === 0) {
    if (rowKosong) rowKosong.style.display = "";
    Array.from(tbody.querySelectorAll("tr:not(#backup-row-kosong)")).forEach((r) => r.remove());
    return;
  }

  if (rowKosong) rowKosong.style.display = "none";
  Array.from(tbody.querySelectorAll("tr:not(#backup-row-kosong)")).forEach((r) => r.remove());

  log.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${idx * 40}ms`;

    const badgeClass = item.status === "sukses" ? "backup-badge--sukses" : "backup-badge--gagal";
    const badgeLabel = item.status === "sukses" ? "✓ Berhasil" : "✕ Gagal";

    const namaAman = escapeHtml(item.nama || "—");
    const aksiHtml = item.status === "sukses"
      ? `<button class="btn-unduh-ulang" title="Unduh file backup database" data-nama="${namaAman}">
           <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
         </button>`
      : `<span style="color:#475569;font-size:12px;">—</span>`;

    tr.innerHTML = `
      <td>${log.length - idx}</td>
      <td><span class="backup-td-filename">${namaAman}</span></td>
      <td><span class="backup-td-waktu">${escapeHtml(formatWaktuBackup(item.waktu))}</span></td>
      <td><span class="backup-td-ukuran">${escapeHtml(formatUkuranFile(item.ukuranBytes))}</span></td>
      <td><span class="backup-badge ${badgeClass}">${badgeLabel}</span></td>
      <td style="text-align:center;">${aksiHtml}</td>
    `;

    tbody.appendChild(tr);
  });

  const labelBtnBackup = document.getElementById("label-btn-backup");
  const btnBackupDb = document.getElementById("btn-backup-db");
  tbody.querySelectorAll(".btn-unduh-ulang").forEach((btn) => {
    btn.addEventListener("click", () => {
      jalankanBackup(labelBtnBackup, btnBackupDb);
    });
  });
}

/**
 * Menjalankan proses backup MySQL dan mengunduh berkas .sql
 */
export async function jalankanBackup(labelEl, btnEl) {
  if (btnEl) btnEl.disabled = true;
  if (labelEl) labelEl.textContent = "Memproses...";

  const waktu = new Date().toISOString();
  const nama = `backup_rapatinai_${waktu.slice(0, 10).replace(/-/g, "")}_${waktu.slice(11, 19).replace(/:/g, "")}.sql`;

  try {
    const res = await fetch("/api/backup/mysql");
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Server error: " + res.status);
    }

    const blob = await res.blob();
    const ukuranBytes = blob.size;
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nama;
    a.click();

    const log = muatLogBackup();
    log.unshift({ nama, waktu, ukuranBytes, status: "sukses", url: null });
    if (log.length > 100) log.splice(100);
    simpanLogBackup(log);

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    tampilkanToast("Backup MySQL berhasil diunduh!", "sukses");
    renderRiwayatBackup();
  } catch (err) {
    const log = muatLogBackup();
    log.unshift({ nama, waktu, ukuranBytes: 0, status: "gagal", url: null });
    if (log.length > 100) log.splice(100);
    simpanLogBackup(log);

    tampilkanToast("Gagal membuat backup: " + err.message, "error");
    renderRiwayatBackup();
  } finally {
    if (btnEl) btnEl.disabled = false;
    if (labelEl) labelEl.textContent = "Buat Backup Sekarang";
  }
}

/**
 * Menampilkan tampilan halaman Pengaturan
 */
export function bukaPengaturan(syncHash = true) {
  if (syncHash && window.location.hash !== "#/pengaturan") {
    window.location.hash = "#/pengaturan";
    return;
  }
  tutupSidebarMobile();
  resetSemuaMenuAktif();
  if (elPengaturan.menuPengaturan) elPengaturan.menuPengaturan.classList.add("aktif");
  el.breadcrumbMiddle?.classList.add("tersembunyi");
  el.breadcrumbSepMiddle?.classList.add("tersembunyi");
  if (el.breadcrumbCurrent) el.breadcrumbCurrent.textContent = "Pengaturan";
  tutupSemuaView();
  if (elPengaturan.viewPengaturan) elPengaturan.viewPengaturan.classList.remove("tersembunyi");
  renderRiwayatBackup();
}

/**
 * Inisialisasi event tombol backup, restore file, dan hapus log
 */
export function initBackupEvents() {
  if (elPengaturan.menuPengaturan) {
    elPengaturan.menuPengaturan.addEventListener("click", () => {
      tutupSidebarMobile();
      if (window.location.hash === "#/pengaturan") {
        bukaPengaturan(false);
      } else {
        window.location.hash = "#/pengaturan";
      }
    });
  }

  const btnBackupDb = document.getElementById("btn-backup-db");
  const labelBtnBackup = document.getElementById("label-btn-backup");
  if (btnBackupDb) {
    btnBackupDb.addEventListener("click", () => jalankanBackup(labelBtnBackup, btnBackupDb));
  }

  const btnHapusSemua = document.getElementById("btn-hapus-semua-backup");
  if (btnHapusSemua) {
    btnHapusSemua.addEventListener("click", () => {
      if (!confirm("Yakin ingin menghapus semua riwayat log backup? Tindakan ini tidak dapat dibatalkan.")) return;
      simpanLogBackup([]);
      renderRiwayatBackup();
      tampilkanToast("Semua riwayat backup telah dihapus.", "info");
    });
  }

  const inputFileRestore = document.getElementById("input-file-restore");
  if (inputFileRestore) {
    inputFileRestore.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      inputFileRestore.value = "";

      const ekstensiDiizinkan = [".sql", ".txt"];
      const ekstensiFile = "." + file.name.split(".").pop().toLowerCase();
      if (!ekstensiDiizinkan.includes(ekstensiFile)) {
        tampilkanToast("File tidak valid. Hanya file .sql yang didukung.", "error");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        tampilkanToast("File terlalu besar. Maksimal 50 MB.", "error");
        return;
      }

      const ukuranFormatted = formatUkuranFile(file.size);
      const konfirmasi = confirm(
        `⚠️ PERHATIAN — RESTORE DATABASE\n\n` +
        `File yang dipilih:\n  ${file.name} (${ukuranFormatted})\n\n` +
        `Proses restore akan menimpa seluruh data rapat yang saat ini ada di database.\n` +
        `Pastikan Anda telah membuat backup terbaru sebelum melanjutkan!\n\n` +
        `Apakah Anda yakin ingin memulihkan database dari file ini?`
      );

      if (!konfirmasi) {
        tampilkanToast("Restore dibatalkan.", "info");
        return;
      }

      const labelTrigger = document.getElementById("label-restore-trigger");
      const labelRestoreTeks = document.getElementById("label-restore-teks");

      if (labelTrigger) {
        labelTrigger.style.pointerEvents = "none";
        labelTrigger.style.opacity = "0.65";
      }
      if (labelRestoreTeks) {
        labelRestoreTeks.textContent = "Memulihkan...";
      }

      tampilkanToast("Sedang memulihkan database, harap tunggu...", "info");

      try {
        const formData = new FormData();
        formData.append("file_sql", file);

        const res = await fetch("/api/backup/restore", {
          method: "POST",
          headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.pesan || data.message || `HTTP ${res.status}`);
        }

        tampilkanToast(`✅ ${data.pesan}`, "sukses");

        await muatStats();
        await muatDaftarRapat(1);
        renderRiwayatBackup();
      } catch (err) {
        tampilkanToast("❌ Gagal memulihkan: " + err.message, "error");
      } finally {
        if (labelTrigger) {
          labelTrigger.style.pointerEvents = "";
          labelTrigger.style.opacity = "";
        }
        if (labelRestoreTeks) {
          labelRestoreTeks.textContent = "Pulihkan (.sql)";
        }
      }
    });
  }
}
