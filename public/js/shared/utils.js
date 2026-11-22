// ==========================================================================
// RAPATINAI - FUNGSI UTILITAS UMUM
// ==========================================================================

import { tampilkanToast } from "./ui.js";

/**
 * Kunci API RapatinAI (hanya untuk backward-compatibility, nilai statis dihilangkan)
 */
export const RAPATIN_API_KEY = "";

/**
 * Pengelolaan CSRF Token untuk SPA Internal
 */
let cachedCsrfToken =
  (typeof document !== "undefined" && document.querySelector('meta[name="csrf-token"]')?.content) ||
  null;

let csrfPromise = null;

export async function muatCsrfToken(force = false) {
  if (cachedCsrfToken && !force) return cachedCsrfToken;
  if (csrfPromise) return csrfPromise;

  csrfPromise = fetch("/api/csrf-token", { credentials: "same-origin" })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.csrf_token) {
        cachedCsrfToken = data.csrf_token;
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) meta.content = cachedCsrfToken;
        return cachedCsrfToken;
      }
      return null;
    })
    .catch((err) => {
      console.warn("Gagal memuat token CSRF:", err);
      return null;
    })
    .finally(() => {
      csrfPromise = null;
    });

  return csrfPromise;
}

// Inisialisasi awal CSRF token saat dokumen siap
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => muatCsrfToken());
  } else {
    muatCsrfToken();
  }
}

// Global Fetch Interceptor: Menyertakan X-Requested-With dan X-CSRF-TOKEN secara otomatis
if (typeof window !== "undefined" && window.fetch && !window.__rapatinFetchIntercepted) {
  window.__rapatinFetchIntercepted = true;
  const rawFetch = window.fetch;

  window.fetch = async function (resource, init = {}) {
    init = init || {};
    init.credentials = init.credentials || "same-origin";

    const method = (init.method || "GET").toUpperCase();
    const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    // Ambil token CSRF untuk operasi mutasi
    let token = cachedCsrfToken;
    if (isMutating && !token) {
      token = await muatCsrfToken();
    }

    if (init.headers instanceof Headers) {
      if (!init.headers.has("X-Requested-With")) init.headers.set("X-Requested-With", "XMLHttpRequest");
      if (token && !init.headers.has("X-CSRF-TOKEN")) init.headers.set("X-CSRF-TOKEN", token);
    } else if (Array.isArray(init.headers)) {
      init.headers.push(["X-Requested-With", "XMLHttpRequest"]);
      if (token) init.headers.push(["X-CSRF-TOKEN", token]);
    } else {
      init.headers = Object.assign({}, init.headers, {
        "X-Requested-With": "XMLHttpRequest",
      });
      if (token) {
        init.headers["X-CSRF-TOKEN"] = token;
      }
    }

    const response = await rawFetch(resource, init);

    // Auto-refresh token jika menerima respon 419 (CSRF Token Expired)
    if (response.status === 419 && !init._retriedCsrf) {
      const newToken = await muatCsrfToken(true);
      if (newToken) {
        init._retriedCsrf = true;
        if (init.headers instanceof Headers) {
          init.headers.set("X-CSRF-TOKEN", newToken);
        } else if (Array.isArray(init.headers)) {
          init.headers = init.headers.filter(([k]) => k.toUpperCase() !== "X-CSRF-TOKEN");
          init.headers.push(["X-CSRF-TOKEN", newToken]);
        } else {
          init.headers["X-CSRF-TOKEN"] = newToken;
        }
        return rawFetch(resource, init);
      }
    }

    return response;
  };
}

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
    let d;
    if (typeof tglStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(tglStr)) {
      const [y, m, day] = tglStr.split("-").map(Number);
      d = new Date(y, m - 1, day);
    } else {
      d = new Date(tglStr);
    }
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
  if (!bytes || bytes === 0) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/**
 * Format waktu ISO ke format tanggal & waktu Indonesia
 */
export function formatWaktuBackup(isoStr) {
  if (!isoStr) return "-";
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
