// ==========================================================================
// RAPATINAI - FUNGSI UTILITAS UMUM
// ==========================================================================

import { tampilkanToast } from "./ui.js";

/**
 * Mencegah serangan XSS dengan escaping karakter khusus HTML
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Format Hari / Tanggal Indonesia ("Senin / 28 April 2026")
 */
export function formatHariTanggal(tglStr) {
  if (!tglStr) return "-";
  try {
    const d = new Date(tglStr);
    if (isNaN(d.getTime())) return tglStr;
    const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulanArr = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${hariArr[d.getDay()]} / ${d.getDate()} ${bulanArr[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return tglStr;
  }
}

/**
 * Format ukuran file ke format B / KB / MB
 */
export function formatUkuranFile(bytes) {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/**
 * Format waktu ISO ke format tanggal & waktu Indonesia
 */
export function formatWaktuBackup(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    const tgl = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${tgl}, ${jam}`;
  } catch {
    return isoStr;
  }
}

/**
 * Menyalin teks ke clipboard sistem dengan notifikasi toast
 */
export function copyToClipboard(text, message = "Berhasil disalin ke clipboard!") {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    tampilkanToast(message);
  }).catch(() => {
    tampilkanToast("Gagal menyalin teks", "error");
  });
}
