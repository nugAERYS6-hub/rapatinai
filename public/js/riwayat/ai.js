// ==========================================================================
// MENU: RIWAYAT RAPAT - AI INTELLIGENCE SUITE (GEMINI FLASH)
// ==========================================================================

import { STATE, el } from "../shared/state.js";
import { escapeHtml, copyToClipboard } from "../shared/utils.js";
import { tampilkanToast } from "../shared/ui.js";
import { muatStats } from "./riwayat.js";
import { renderPaperPreview } from "./detail.js";

/**
 * Membersihkan judul/awalan redundan dari narasi ringkasan AI
 */
export function bersihkanRingkasan(text) {
  if (!text) return "";
  let str = text.trim();
  while (true) {
    const next = str
      .replace(/^(?:#+\s*)?(?:\*{1,3})?\s*(?:ringkasan\s+eksekutif|executive\s+summary|ringkasan\s+hasil\s+rapat|ringkasan)(?:\s*[:\-])?\s*(?:\*{1,3})?\s*(\n+|$)/i, "")
      .replace(/^(?:\*{1,3})?\s*(?:rapat\s+[^\n]+?)(?:\*{1,3})?\s*(\n+|$)/i, "")
      .trim();
    if (next === str) break;
    str = next;
  }
  return str;
}

/**
 * Format teks ringkasan menjadi paragraf-paragraf HTML rapi
 */
export function formatRingkasanHTML(text, indent = false) {
  const bersih = bersihkanRingkasan(text);
  if (!bersih) return "";
  return bersih
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const aman = escapeHtml(p);
      const denganBold = aman.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
      return `<p style="margin-bottom: 8px; ${indent ? "text-indent: 28px;" : ""}">${denganBold}</p>`;
    })
    .join("");
}

/**
 * Merender daftar action items AI ke dalam grid kartu
 */
export function renderActionItemsUI(items) {
  if (!el.kontenActionItemsAi) return;
  if (!items || items.length === 0) {
    el.kontenActionItemsAi.innerHTML = `
      <p class="placeholder-ai">Belum ada action items. Klik tombol <b>Action Items AI</b> di atas untuk mengekstrak tugas konkret dari notulen rapat.</p>
    `;
    return;
  }

  const itemsHtml = items.map((item, idx) => {
    const tugas = escapeHtml(item.tugas || item.isi || "-");
    const pic = escapeHtml(item.pic || "-");
    const estimasi = escapeHtml(item.estimasi || item.deadline || "-");
    const prioritas = escapeHtml(item.prioritas || "Normal");
    let prioClass = "prio-normal";
    if (prioritas.toLowerCase().includes("tinggi") || prioritas.toLowerCase().includes("high")) prioClass = "prio-tinggi";
    else if (prioritas.toLowerCase().includes("sedang") || prioritas.toLowerCase().includes("medium")) prioClass = "prio-sedang";

    return `
      <div class="action-item-card">
        <div class="action-item-header">
          <span class="action-item-num">#${idx + 1}</span>
          <span class="action-item-prio ${prioClass}">${prioritas}</span>
        </div>
        <div class="action-item-body">
          <p class="action-item-text">${tugas}</p>
        </div>
        <div class="action-item-footer">
          <div class="action-item-meta">
            <span class="meta-label">PIC:</span>
            <span class="meta-val">${pic}</span>
          </div>
          <div class="action-item-meta">
            <span class="meta-label">Tenggat:</span>
            <span class="meta-val">${estimasi}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");

  el.kontenActionItemsAi.innerHTML = `<div class="action-items-grid">${itemsHtml}</div>`;
}

/**
 * Menampilkan konten AI (ringkasan, ide, action items) pada kartu detail
 */
export function renderAiContent(rapat) {
  if (rapat.ringkasanAI) {
    el.kontenRingkasanAi.innerHTML = formatRingkasanHTML(rapat.ringkasanAI, false);
  } else {
    el.kontenRingkasanAi.innerHTML = `
      <p class="placeholder-ai">Belum dibuat ringkasan. Klik tombol <b>Ringkasan AI</b> di atas untuk menyusun narasi resmi.</p>
    `;
  }

  if (rapat.ideBaruAI) {
    el.kontenIdeAi.innerHTML = `<p>${escapeHtml(rapat.ideBaruAI)}</p>`;
  } else {
    el.kontenIdeAi.innerHTML = `
      <p class="placeholder-ai">Belum ada rekomendasi. Klik tombol <b>Ide Strategis AI</b> untuk usulan kebijakan baru.</p>
    `;
  }

  const actionItemsData = rapat.actionItemsAI || (rapat.tindakLanjut && rapat.tindakLanjut.length > 0 ? rapat.tindakLanjut : null);
  renderActionItemsUI(actionItemsData);
}

/**
 * Inisialisasi event tombol-tombol AI dan tombol salin AI
 */
/**
 * Merender kotak pesan error/peringatan AI yang informatif beserta tombol coba lagi
 */
function renderAiErrorUI(container, err, onRetry) {
  const isTimeout = err?.tipe === "timeout" || (err?.message && err.message.toLowerCase().includes("timeout"));
  const isQuota = err?.tipe === "quota" || (err?.message && err.message.toLowerCase().includes("kuota"));
  const isOverload = err?.tipe === "overload" || (err?.message && (err.message.toLowerCase().includes("high demand") || err.message.toLowerCase().includes("lonjakan")));

  const badgeColor = isTimeout ? "#d97706" : (isQuota ? "#7c3aed" : (isOverload ? "#0284c7" : "#ef4444"));
  const badgeTitle = isTimeout ? "Waktu Respons Habis (Timeout)" : (isQuota ? "Batas Kuota Gemini Tercapai" : (isOverload ? "Server AI Sibuk (Lonjakan Beban)" : "Gagal Memproses AI"));

  container.innerHTML = `
    <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid ${badgeColor}50; border-radius: 8px; padding: 12px; margin-top: 6px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
        <span style="font-weight: 700; font-size: 0.85rem; color: ${badgeColor}; display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-triangle-exclamation"></i> ${badgeTitle}
        </span>
        ${onRetry ? `<button type="button" class="btn-retry-ai" style="padding: 4px 12px; font-size: 0.78rem; font-weight: 600; border-radius: 6px; background: #2563eb; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-rotate-right"></i> Coba Lagi</button>` : ''}
      </div>
      <p style="font-size: 0.85rem; color: #475569; margin: 0; line-height: 1.45;">${escapeHtml(err.message || "Terjadi kendala pada layanan AI.")}</p>
    </div>
  `;

  if (onRetry) {
    const btn = container.querySelector(".btn-retry-ai");
    if (btn) btn.addEventListener("click", onRetry);
  }
}

/**
 * Inisialisasi event tombol-tombol AI dan tombol salin AI
 */
export function initAiEvents() {
  if (el.btnAiRingkasan) {
    const handleRingkasan = async () => {
      if (!STATE.rapatAktif) return;
      el.btnAiRingkasan.disabled = true;
      el.kontenRingkasanAi.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: #2563eb; font-weight: 600;">
          <span class="spinner-inline" style="border-top-color: #2563eb;"></span>
          Sedang menganalisis notulen dengan Gemini Flash...
        </div>
      `;

      try {
        const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}/rangkum`, { method: "POST" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          const err = new Error(json.pesan || `Gagal membuat ringkasan (HTTP ${res.status})`);
          err.tipe = json.tipe || "error";
          throw err;
        }

        STATE.rapatAktif.ringkasanAI = bersihkanRingkasan(json.ringkasanAI);
        el.kontenRingkasanAi.innerHTML = `<div class="item-muncul">${formatRingkasanHTML(STATE.rapatAktif.ringkasanAI, false)}</div>`;
        tampilkanToast("Ringkasan AI berhasil dibuat!");
        muatStats();
        renderPaperPreview(STATE.rapatAktif);
      } catch (err) {
        renderAiErrorUI(el.kontenRingkasanAi, err, handleRingkasan);
        tampilkanToast(err.message, "error");
      } finally {
        el.btnAiRingkasan.disabled = false;
      }
    };

    el.btnAiRingkasan.addEventListener("click", handleRingkasan);
  }

  if (el.btnAiIde) {
    const handleIde = async () => {
      if (!STATE.rapatAktif) return;
      el.btnAiIde.disabled = true;
      el.kontenIdeAi.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: #2563eb; font-weight: 600;">
          <span class="spinner-inline" style="border-top-color: #2563eb;"></span>
          Sedang merumuskan ide & rekomendasi baru...
        </div>
      `;

      try {
        const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}/ide-baru`, { method: "POST" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          const err = new Error(json.pesan || `Gagal membuat ide baru (HTTP ${res.status})`);
          err.tipe = json.tipe || "error";
          throw err;
        }

        STATE.rapatAktif.ideBaruAI = json.ideBaruAI;
        el.kontenIdeAi.innerHTML = `<p class="item-muncul">${escapeHtml(json.ideBaruAI)}</p>`;
        tampilkanToast("Ide strategis AI berhasil disusun!");
      } catch (err) {
        renderAiErrorUI(el.kontenIdeAi, err, handleIde);
        tampilkanToast(err.message, "error");
      } finally {
        el.btnAiIde.disabled = false;
      }
    };

    el.btnAiIde.addEventListener("click", handleIde);
  }

  if (el.btnAiActionItems) {
    const handleActionItems = async () => {
      if (!STATE.rapatAktif) return;
      el.btnAiActionItems.disabled = true;
      el.kontenActionItemsAi.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: #2563eb; font-weight: 600;">
          <span class="spinner-inline" style="border-top-color: #2563eb;"></span>
          Sedang mengekstrak Action Items & Penugasan dengan Gemini...
        </div>
      `;

      try {
        const res = await fetch(`/api/rapat/${STATE.rapatAktif.id}/action-items`, { method: "POST" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          const err = new Error(json.pesan || `Gagal membuat action items (HTTP ${res.status})`);
          err.tipe = json.tipe || "error";
          throw err;
        }

        const items = json.actionItems || [];
        STATE.rapatAktif.actionItemsAI = items;
        renderActionItemsUI(items);
        tampilkanToast("Action items AI berhasil diekstrak!");
      } catch (err) {
        renderAiErrorUI(el.kontenActionItemsAi, err, handleActionItems);
        tampilkanToast(err.message, "error");
      } finally {
        el.btnAiActionItems.disabled = false;
      }
    };

    el.btnAiActionItems.addEventListener("click", handleActionItems);
  }

  if (el.btnCopyRingkasan) {
    el.btnCopyRingkasan.addEventListener("click", () => {
      if (STATE.rapatAktif?.ringkasanAI) copyToClipboard(STATE.rapatAktif.ringkasanAI, "Ringkasan disalin!");
    });
  }

  if (el.btnCopyIde) {
    el.btnCopyIde.addEventListener("click", () => {
      if (STATE.rapatAktif?.ideBaruAI) copyToClipboard(STATE.rapatAktif.ideBaruAI, "Ide rekomendasi disalin!");
    });
  }

  if (el.btnCopyActionItems) {
    el.btnCopyActionItems.addEventListener("click", () => {
      const items = STATE.rapatAktif?.actionItemsAI || STATE.rapatAktif?.tindakLanjut;
      if (!items || items.length === 0) {
        tampilkanToast("Belum ada action items untuk disalin", "info");
        return;
      }
      const text = items.map((it, idx) => {
        const tugas = it.tugas || it.isi || "-";
        const pic = it.pic || "-";
        const estimasi = it.estimasi || it.deadline || "-";
        const prioritas = it.prioritas ? ` [${it.prioritas}]` : "";
        return `${idx + 1}. ${tugas}${prioritas}\n   PIC: ${pic} | Tenggat: ${estimasi}`;
      }).join("\n\n");

      copyToClipboard(`ACTION ITEMS & PENUGASAN RAPAT:\n\n${text}`, "Action items disalin!");
    });
  }
}
