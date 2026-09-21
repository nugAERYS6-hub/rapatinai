require("dotenv").config();

const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } = require("docx");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// INISIALISASI & TUNING DATABASE BERKUALITAS ENTERPRISE
// ==========================================
const db = new Database(path.join(__dirname, "data", "rapatinai.db"));

// Tuning performa tinggi untuk banyak pengguna & dataset besar
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("busy_timeout = 5000");      // Tunggu hingga 5 detik jika ada concurrent lock
db.pragma("cache_size = -64000");      // Alokasi 64MB RAM cache
db.pragma("mmap_size = 268435456");    // 256MB Memory-mapped I/O
db.pragma("temp_store = MEMORY");

// Inisialisasi skema tabel rapat
db.exec(`
  CREATE TABLE IF NOT EXISTS rapat (
    id TEXT PRIMARY KEY,
    tanggal TEXT NOT NULL,
    topik TEXT NOT NULL,
    pimpinanRapat TEXT NOT NULL,
    notulis TEXT NOT NULL,
    waktu TEXT,
    tempat TEXT,
    anggota TEXT,
    poinPembahasan TEXT,
    tindakLanjut TEXT,
    ringkasanAI TEXT,
    ideBaruAI TEXT,
    status TEXT DEFAULT 'Selesai',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Helper format Hari / Tanggal Indonesia (Contoh: "Senin / 28 April 2014")
function formatHariTanggal(tglStr) {
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

// Migrasi kolom jika belum ada (zero-downtime safe)
const migrasiKolom = [
  "ALTER TABLE rapat ADD COLUMN status TEXT DEFAULT 'Selesai'",
  "ALTER TABLE rapat ADD COLUMN created_at TEXT",
  "ALTER TABLE rapat ADD COLUMN updated_at TEXT",
  "ALTER TABLE rapat ADD COLUMN ideBaruAI TEXT",
  "ALTER TABLE rapat ADD COLUMN waktu TEXT",
  "ALTER TABLE rapat ADD COLUMN tempat TEXT"
];

migrasiKolom.forEach((sql) => {
  try {
    db.exec(sql);
  } catch (e) {
    // Abaikan jika kolom sudah ada
  }
});

// Pastikan nilai default terisi untuk baris lama
try {
  db.exec(`
    UPDATE rapat SET created_at = datetime('now', 'localtime') WHERE created_at IS NULL;
    UPDATE rapat SET updated_at = datetime('now', 'localtime') WHERE updated_at IS NULL;
    UPDATE rapat SET status = 'Selesai' WHERE status IS NULL;
  `);
} catch (e) {}

// B-Tree Indexes untuk query cepat
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_rapat_tanggal ON rapat(tanggal DESC);
  CREATE INDEX IF NOT EXISTS idx_rapat_created ON rapat(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_rapat_topik ON rapat(topik);
`);

// Inisialisasi FTS5 (Full-Text Search) untuk pencarian instan skala besar
try {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS rapat_fts USING fts5(
      id UNINDEXED,
      topik,
      pimpinanRapat,
      notulis,
      poinPembahasan,
      tindakLanjut,
      ringkasanAI,
      content='rapat',
      content_rowid='rowid'
    );

    CREATE TRIGGER IF NOT EXISTS rapat_ai AFTER INSERT ON rapat BEGIN
      INSERT INTO rapat_fts(rowid, id, topik, pimpinanRapat, notulis, poinPembahasan, tindakLanjut, ringkasanAI)
      VALUES (new.rowid, new.id, new.topik, new.pimpinanRapat, new.notulis, new.poinPembahasan, new.tindakLanjut, new.ringkasanAI);
    END;

    CREATE TRIGGER IF NOT EXISTS rapat_ad AFTER DELETE ON rapat BEGIN
      INSERT INTO rapat_fts(rapat_fts, rowid, id, topik, pimpinanRapat, notulis, poinPembahasan, tindakLanjut, ringkasanAI)
      VALUES('delete', old.rowid, old.id, old.topik, old.pimpinanRapat, old.notulis, old.poinPembahasan, old.tindakLanjut, old.ringkasanAI);
    END;

    CREATE TRIGGER IF NOT EXISTS rapat_au AFTER UPDATE ON rapat BEGIN
      INSERT INTO rapat_fts(rapat_fts, rowid, id, topik, pimpinanRapat, notulis, poinPembahasan, tindakLanjut, ringkasanAI)
      VALUES('delete', old.rowid, old.id, old.topik, old.pimpinanRapat, old.notulis, old.poinPembahasan, old.tindakLanjut, old.ringkasanAI);
      INSERT INTO rapat_fts(rowid, id, topik, pimpinanRapat, notulis, poinPembahasan, tindakLanjut, ringkasanAI)
      VALUES (new.rowid, new.id, new.topik, new.pimpinanRapat, new.notulis, new.poinPembahasan, new.tindakLanjut, new.ringkasanAI);
    END;
  `);

  // Bangun ulang indeks FTS5 dari tabel rapat
  try {
    db.exec("INSERT INTO rapat_fts(rapat_fts) VALUES('rebuild');");
  } catch (rebuildErr) {
    console.warn("FTS5 rebuild note:", rebuildErr.message);
  }
} catch (err) {
  console.warn("FTS5 setup note:", err.message);
}

// ==========================================
// FUNGSI TRANSFORMASI & PARSING DATA TOLERAN
// ==========================================
function parseAnggota(nilai) {
  if (!nilai) return [];
  try {
    const hasil = JSON.parse(nilai);
    if (Array.isArray(hasil)) {
      return hasil.map((item) => {
        if (typeof item === "string") {
          return { nama: item.trim(), jabatan: "-", asalInstansi: "-" };
        }
        return {
          nama: item.nama || "",
          jabatan: item.jabatan || "-",
          asalInstansi: item.asalInstansi || "-",
        };
      });
    }
  } catch (e) {
    // Data lama berupa teks dipisah koma
  }
  return String(nilai)
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((nama) => ({ nama, jabatan: "-", asalInstansi: "-" }));
}

function parsePoinPembahasan(nilai) {
  if (!nilai) return [];
  try {
    const hasil = JSON.parse(nilai);
    if (Array.isArray(hasil)) {
      return hasil.map((p) => {
        if (typeof p === "string") {
          return { isi: p, keputusan: "Disetujui" };
        }
        return {
          isi: p.isi || "",
          keputusan: p.keputusan || "Disetujui",
        };
      });
    }
  } catch (e) {
    // String biasa
  }
  return String(nilai)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((isi) => ({ isi, keputusan: "Disetujui" }));
}

function parseTindakLanjut(nilai) {
  if (!nilai) return [];
  try {
    const hasil = JSON.parse(nilai);
    if (Array.isArray(hasil)) {
      return hasil.map((t) => {
        if (typeof t === "string") {
          return {
            tugas: t,
            pic: "-",
            deadline: "-",
            selesai: false,
          };
        }
        return {
          tugas: t.tugas || t.isi || "",
          pic: t.pic || "-",
          deadline: t.deadline || "-",
          selesai: Boolean(t.selesai),
        };
      });
    }
  } catch (e) {
    // String biasa
  }
  return String(nilai)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((tugas) => ({ tugas, pic: "-", deadline: "-", selesai: false }));
}

function ubahBarisJadiRapatLengkap(baris) {
  if (!baris) return null;
  return {
    ...baris,
    waktu: baris.waktu || "",
    tempat: baris.tempat || "",
    anggota: parseAnggota(baris.anggota),
    poinPembahasan: parsePoinPembahasan(baris.poinPembahasan),
    tindakLanjut: parseTindakLanjut(baris.tindakLanjut),
  };
}

// ==========================================
// AI HELPER (GEMINI 2.5 FLASH)
// ==========================================
const GLOSARIUM_PEMDA = `
- OPD: Organisasi Perangkat Daerah
- RKPD: Rencana Kerja Pemerintah Daerah
- P-Renja: Perubahan Rencana Kerja
- Perda: Peraturan Daerah
- APBD: Anggaran Pendapatan dan Belanja Daerah
- Bappeda: Badan Perencanaan Pembangunan Daerah
- Musrenbang: Musyawarah Perencanaan Pembangunan
`.trim();

function formatAnggotaRingkas(anggota) {
  return anggota
    .map((a) => `${a.nama} (${a.jabatan || "-"}, ${a.asalInstansi || "-"})`)
    .join(", ");
}

async function panggilGemini(prompt, temperature = 0.3) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi di file .env");
  }

  // Coba model gemini-3.6-flash utama, lalu fallback ke gemini-flash-latest
  const modelList = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash"];
  let lastError = null;

  for (const model of modelList) {
    try {
      const respon = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: 2048,
            },
          }),
        },
      );

      const data = await respon.json();
      if (!respon.ok) {
        throw new Error(data.error?.message || `Gagal memanggil model ${model}`);
      }

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      }
      throw new Error("Respon AI tidak memiliki teks jawaban");
    } catch (err) {
      lastError = err;
      console.warn(`Percobaan model ${model} gagal, mencoba model berikutnya...`);
    }
  }

  throw lastError || new Error("Semua percobaan model Gemini gagal.");
}

async function mintaRingkasanAI(rapat) {
  const daftarPoin = (rapat.poinPembahasan || [])
    .map((p) => `- ${typeof p === "string" ? p : (p.isi || "")}`)
    .filter(Boolean)
    .join("\n");

  const prompt = `Kamu adalah analis kebijakan dan asisten notulensi rapat eksekutif pemerintah/korporasi.
Buatkan Ringkasan Eksekutif Formal yang elegan, padat, dan terstruktur (2-3 paragraf) dari notulen berikut dalam Bahasa Indonesia baku.

Glosarium referensi bila terkait:
${GLOSARIUM_PEMDA}

Topik Rapat: ${rapat.topik}
Tanggal: ${rapat.tanggal}
Pimpinan: ${rapat.pimpinanRapat}
Notulis: ${rapat.notulis}
Peserta: ${formatAnggotaRingkas(rapat.anggota)}

Catatan Notulensi / Hasil Rapat:
${daftarPoin}

ATURAN KETAT:
- Gunakan HANYA data eksplisit di atas. Jangan mengarang nama dinas/lokasi fiktif.
- Susun secara naratif mengalir dan profesional (Executive Summary standard).
- Tekankan apa yang dibahas serta keputusan/hasil yang disepakati bersama.`;

  return panggilGemini(prompt, 0.2);
}

async function mintaIdeBaruAI(rapat) {
  const daftarPoin = (rapat.poinPembahasan || [])
    .map((p) => `- ${typeof p === "string" ? p : (p.isi || "")}`)
    .filter(Boolean)
    .join("\n");

  const prompt = `Kamu adalah konsultan tata kelola dan manajemen strategis.
Berdasarkan hasil rapat berikut, usulkan 3-4 rekomendasi strategis atau ide pengembangan TAMBAHAN yang konkret, realistis, dan memberikan nilai tambah.

Topik: ${rapat.topik}
Catatan Notulensi / Hasil Rapat:
${daftarPoin}

ATURAN:
- Jangan mengulang apa yang sudah ada di atas.
- Tulis dalam format nomor 1, 2, 3, 4 dengan bahasa formal, jelas, dan berorientasi hasil.
- Tiap usulan terdiri atas 1-2 kalimat lugas.`;

  return panggilGemini(prompt, 0.5);
}

async function mintaActionItemsAI(rapat) {
  const daftarPoin = rapat.poinPembahasan.map((p) => `- ${p.isi} [${p.keputusan}]`).join("\n");
  const daftarTL = rapat.tindakLanjut.map((t) => `- ${t.tugas}`).join("\n");

  const prompt = `Kamu adalah Project Management Specialist.
Dari notulen rapat berikut, ekstrak daftar Action Items (Tugas Konkret) yang harus dilakukan.
Keluarkan respon HANYA dalam format JSON valid berupa array objek:
[
  {
    "tugas": "Deskripsi tugas konkret",
    "pic": "Pihak / Jabatan yang bertanggung jawab",
    "prioritas": "Tinggi / Sedang / Normal",
    "estimasi": "Contoh: 1 Minggu"
  }
]

Data Rapat:
Topik: ${rapat.topik}
Pimpinan: ${rapat.pimpinanRapat}
Pembahasan:
${daftarPoin}
Tindak lanjut tercatat:
${daftarTL}

JANGAN berikan markdown pembuka/penutup atau teks lain selain JSON murni.`;

  const teks = await panggilGemini(prompt, 0.1);
  try {
    const bersih = teks.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(bersih);
  } catch (e) {
    return [{ tugas: teks, pic: "-", prioritas: "Normal", estimasi: "-" }];
  }
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. GET /api/stats — Ringkasan performa / Dashboard metric
app.get("/api/stats", (req, res) => {
  try {
    const totalRapat = db.prepare("SELECT count(*) as count FROM rapat").get().count;
    const bulanIni = new Date().toISOString().slice(0, 7); // YYYY-MM
    const rapatBulanIni = db.prepare("SELECT count(*) as count FROM rapat WHERE tanggal LIKE ?").get(`${bulanIni}%`).count;
    const denganAI = db.prepare("SELECT count(*) as count FROM rapat WHERE ringkasanAI IS NOT NULL AND length(ringkasanAI) > 0").get().count;

    res.json({
      success: true,
      data: {
        totalRapat,
        rapatBulanIni,
        denganAI,
        bulanIni,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/rapat — List ringan dengan pagination & FTS5 search
app.get("/api/rapat", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const offset = (page - 1) * limit;
    const q = (req.query.q || "").trim();
    const filter = req.query.filter || "all"; // all, bulan_ini, ada_ai

    let totalCount = 0;
    let baris = [];

    if (q) {
      // Pencarian kecepatan tinggi dengan FTS5 atau LIKE fallback
      try {
        const queryFTS = q.replace(/['"*]/g, "") + "*";
        const countStmt = db.prepare(`
          SELECT count(*) as count
          FROM rapat_fts
          WHERE rapat_fts MATCH ?
        `);
        totalCount = countStmt.get(queryFTS).count;

        const dataStmt = db.prepare(`
          SELECT 
            r.id, r.tanggal, r.topik, r.pimpinanRapat, r.notulis, r.status, r.created_at,
            (r.ringkasanAI IS NOT NULL AND length(r.ringkasanAI) > 0) as hasRingkasan,
            (r.ideBaruAI IS NOT NULL AND length(r.ideBaruAI) > 0) as hasIdeBaru
          FROM rapat_fts f
          JOIN rapat r ON r.rowid = f.rowid
          WHERE rapat_fts MATCH ?
          ORDER BY r.tanggal DESC, r.rowid DESC
          LIMIT ? OFFSET ?
        `);
        baris = dataStmt.all(queryFTS, limit, offset);
      } catch (ftsError) {
        // Fallback ke LIKE jika karakter FTS tidak valid
        const likePattern = `%${q}%`;
        const countStmt = db.prepare(`
          SELECT count(*) as count FROM rapat
          WHERE topik LIKE ? OR pimpinanRapat LIKE ? OR notulis LIKE ?
        `);
        totalCount = countStmt.get(likePattern, likePattern, likePattern).count;

        const dataStmt = db.prepare(`
          SELECT 
            id, tanggal, topik, pimpinanRapat, notulis, status, created_at,
            (ringkasanAI IS NOT NULL AND length(ringkasanAI) > 0) as hasRingkasan,
            (ideBaruAI IS NOT NULL AND length(ideBaruAI) > 0) as hasIdeBaru
          FROM rapat
          WHERE topik LIKE ? OR pimpinanRapat LIKE ? OR notulis LIKE ?
          ORDER BY tanggal DESC, rowid DESC
          LIMIT ? OFFSET ?
        `);
        baris = dataStmt.all(likePattern, likePattern, likePattern, limit, offset);
      }
    } else {
      let whereClause = "";
      const params = [];

      if (filter === "bulan_ini") {
        const bulanIni = new Date().toISOString().slice(0, 7);
        whereClause = "WHERE tanggal LIKE ?";
        params.push(`${bulanIni}%`);
      } else if (filter === "ada_ai") {
        whereClause = "WHERE ringkasanAI IS NOT NULL AND length(ringkasanAI) > 0";
      }

      const countStmt = db.prepare(`SELECT count(*) as count FROM rapat ${whereClause}`);
      totalCount = countStmt.get(...params).count;

      const dataStmt = db.prepare(`
        SELECT 
          id, tanggal, topik, pimpinanRapat, notulis, status, created_at,
          (ringkasanAI IS NOT NULL AND length(ringkasanAI) > 0) as hasRingkasan,
          (ideBaruAI IS NOT NULL AND length(ideBaruAI) > 0) as hasIdeBaru
        FROM rapat
        ${whereClause}
        ORDER BY tanggal DESC, rowid DESC
        LIMIT ? OFFSET ?
      `);
      baris = dataStmt.all(...params, limit, offset);
    }

    res.json({
      success: true,
      data: baris,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err) {
    console.error("Error GET /api/rapat:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/rapat/:id — Detail lengkap satu rapat
app.get("/api/rapat/:id", (req, res) => {
  try {
    const baris = db.prepare("SELECT * FROM rapat WHERE id = ?").get(req.params.id);
    if (!baris) {
      return res.status(404).json({ success: false, pesan: "Notulen rapat tidak ditemukan" });
    }
    res.json(ubahBarisJadiRapatLengkap(baris));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/rapat — Buat notulen baru
app.post("/api/rapat", (req, res) => {
  try {
    const { tanggal, topik, pimpinanRapat, notulis, waktu, tempat, anggota, poinPembahasan, tindakLanjut, status } = req.body;

    if (!topik || !tanggal || !pimpinanRapat || !notulis) {
      return res.status(400).json({
        success: false,
        pesan: "Kolom tanggal, topik, pimpinan, dan notulis wajib diisi.",
      });
    }

    const idBaru = Date.now().toString();
    const rapatBaru = {
      id: idBaru,
      tanggal,
      topik,
      pimpinanRapat,
      notulis,
      waktu: waktu || "",
      tempat: tempat || "",
      anggota: JSON.stringify(anggota || []),
      poinPembahasan: JSON.stringify(poinPembahasan || []),
      tindakLanjut: JSON.stringify(tindakLanjut || []),
      ringkasanAI: null,
      ideBaruAI: null,
      status: status || "Selesai",
    };

    const stmt = db.prepare(`
      INSERT INTO rapat (id, tanggal, topik, pimpinanRapat, notulis, waktu, tempat, anggota, poinPembahasan, tindakLanjut, ringkasanAI, ideBaruAI, status, created_at, updated_at)
      VALUES (@id, @tanggal, @topik, @pimpinanRapat, @notulis, @waktu, @tempat, @anggota, @poinPembahasan, @tindakLanjut, @ringkasanAI, @ideBaruAI, @status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    stmt.run(rapatBaru);

    const hasil = db.prepare("SELECT * FROM rapat WHERE id = ?").get(idBaru);
    res.status(201).json({
      success: true,
      data: ubahBarisJadiRapatLengkap(hasil),
    });
  } catch (err) {
    console.error("Error POST /api/rapat:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. PUT /api/rapat/:id — Perbarui notulen rapat (Fitur Edit)
app.put("/api/rapat/:id", (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare("SELECT * FROM rapat WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ success: false, pesan: "Rapat tidak ditemukan" });
    }

    const { tanggal, topik, pimpinanRapat, notulis, waktu, tempat, anggota, poinPembahasan, tindakLanjut, status, ringkasanAI, ideBaruAI } = req.body;

    const dataUpdate = {
      id,
      tanggal: tanggal || existing.tanggal,
      topik: topik || existing.topik,
      pimpinanRapat: pimpinanRapat || existing.pimpinanRapat,
      notulis: notulis || existing.notulis,
      waktu: waktu !== undefined ? waktu : (existing.waktu || ""),
      tempat: tempat !== undefined ? tempat : (existing.tempat || ""),
      anggota: anggota !== undefined ? JSON.stringify(anggota) : existing.anggota,
      poinPembahasan: poinPembahasan !== undefined ? JSON.stringify(poinPembahasan) : existing.poinPembahasan,
      tindakLanjut: tindakLanjut !== undefined ? JSON.stringify(tindakLanjut) : existing.tindakLanjut,
      status: status || existing.status || "Selesai",
      ringkasanAI: ringkasanAI !== undefined ? ringkasanAI : existing.ringkasanAI,
      ideBaruAI: ideBaruAI !== undefined ? ideBaruAI : existing.ideBaruAI,
    };

    db.prepare(`
      UPDATE rapat
      SET tanggal = @tanggal,
          topik = @topik,
          pimpinanRapat = @pimpinanRapat,
          notulis = @notulis,
          waktu = @waktu,
          tempat = @tempat,
          anggota = @anggota,
          poinPembahasan = @poinPembahasan,
          tindakLanjut = @tindakLanjut,
          status = @status,
          ringkasanAI = @ringkasanAI,
          ideBaruAI = @ideBaruAI,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run(dataUpdate);

    const hasil = db.prepare("SELECT * FROM rapat WHERE id = ?").get(id);
    res.json({
      success: true,
      data: ubahBarisJadiRapatLengkap(hasil),
    });
  } catch (err) {
    console.error("Error PUT /api/rapat/:id:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. DELETE /api/rapat/:id — Hapus notulen rapat
app.delete("/api/rapat/:id", (req, res) => {
  try {
    const id = req.params.id;
    const info = db.prepare("DELETE FROM rapat WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, pesan: "Rapat tidak ditemukan" });
    }
    res.json({ success: true, pesan: "Notulen rapat berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST /api/rapat/:id/rangkum — Generate Ringkasan AI
app.post("/api/rapat/:id/rangkum", async (req, res) => {
  try {
    const baris = db.prepare("SELECT * FROM rapat WHERE id = ?").get(req.params.id);
    if (!baris) return res.status(404).json({ success: false, pesan: "Rapat tidak ditemukan" });

    const rapat = ubahBarisJadiRapatLengkap(baris);
    const ringkasan = await mintaRingkasanAI(rapat);

    db.prepare("UPDATE rapat SET ringkasanAI = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ringkasan, rapat.id);
    res.json({ success: true, ringkasanAI: ringkasan });
  } catch (error) {
    console.error("Error rangkum AI:", error);
    res.status(500).json({ success: false, pesan: "Gagal membuat ringkasan AI: " + error.message });
  }
});

// 8. POST /api/rapat/:id/ide-baru — Generate Ide Baru AI
app.post("/api/rapat/:id/ide-baru", async (req, res) => {
  try {
    const baris = db.prepare("SELECT * FROM rapat WHERE id = ?").get(req.params.id);
    if (!baris) return res.status(404).json({ success: false, pesan: "Rapat tidak ditemukan" });

    const rapat = ubahBarisJadiRapatLengkap(baris);
    const ideBaru = await mintaIdeBaruAI(rapat);

    db.prepare("UPDATE rapat SET ideBaruAI = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(ideBaru, rapat.id);
    res.json({ success: true, ideBaruAI: ideBaru });
  } catch (error) {
    console.error("Error ide baru AI:", error);
    res.status(500).json({ success: false, pesan: "Gagal membuat ide baru: " + error.message });
  }
});

// 9. POST /api/rapat/:id/action-items — AI Action Items Extraction
app.post("/api/rapat/:id/action-items", async (req, res) => {
  try {
    const baris = db.prepare("SELECT * FROM rapat WHERE id = ?").get(req.params.id);
    if (!baris) return res.status(404).json({ success: false, pesan: "Rapat tidak ditemukan" });

    const rapat = ubahBarisJadiRapatLengkap(baris);
    const items = await mintaActionItemsAI(rapat);
    res.json({ success: true, actionItems: items });
  } catch (error) {
    res.status(500).json({ success: false, pesan: error.message });
  }
});

// 10. GET /api/rapat/:id/export-pdf — Ekspor PDF Formal Baku
app.get("/api/rapat/:id/export-pdf", (req, res) => {
  try {
    const baris = db.prepare("SELECT * FROM rapat WHERE id = ?").get(req.params.id);
    if (!baris) return res.status(404).json({ pesan: "Rapat tidak ditemukan" });

    const rapat = ubahBarisJadiRapatLengkap(baris);
    const safeTopic = rapat.topik.replace(/[^a-zA-Z0-9-_]/g, "_");
    const namaFile = `Laporan_Rapat_${safeTopic}_${rapat.tanggal}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });

    doc.pipe(res);

    // 1. Header Judul Laporan Terpusat
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000").text("LAPORAN HASIL RAPAT", { align: "center" });
    doc.fontSize(11).font("Helvetica-Bold").text(rapat.topik.toUpperCase(), { align: "center" });
    if (rapat.tempat) {
      doc.fontSize(11).font("Helvetica-Bold").text(rapat.tempat.toUpperCase(), { align: "center" });
    }
    doc.moveDown(1.4);

    // 2. Metadata Tabel dengan Titik Dua Sejajar
    const labelX = 60;
    const colonX = 180;
    const valX = 192;
    const lineGap = 18;
    let curY = doc.y;

    const barisMeta = [
      ["Hari / tanggal", formatHariTanggal(rapat.tanggal)],
      ["Waktu", rapat.waktu || "-"],
      ["Tempat", rapat.tempat || "-"],
      ["Pemimpin rapat", rapat.pimpinanRapat || "-"],
      ["Notulen", rapat.notulis || "-"],
      ["Peserta", "Terlampir"],
      ["Hasil rapat", ""],
    ];

    doc.font("Helvetica").fontSize(10).fillColor("#000000");
    barisMeta.forEach(([lbl, val]) => {
      doc.text(lbl, labelX, curY);
      doc.text(":", colonX, curY);
      if (val) {
        doc.text(val, valX, curY, { width: 330 });
      }
      curY += lineGap;
    });

    doc.y = curY + 10;

    // 3. Kalimat Pembuka Hasil Rapat
    doc.fontSize(10).font("Helvetica").text(
      `Rapat dibuka oleh ${rapat.pimpinanRapat} yang menjelaskan mengenai :`,
      { align: "justify", lineGap: 3 }
    );
    doc.moveDown(0.7);

    // 4. Poin-Poin Hasil Rapat (Numbered List)
    if (rapat.poinPembahasan && rapat.poinPembahasan.length > 0) {
      rapat.poinPembahasan.forEach((p, idx) => {
        const text = typeof p === "string" ? p : (p.isi || "");
        doc.fontSize(10).font("Helvetica").text(
          `${idx + 1}.  ${text}`,
          { indent: 16, align: "justify", lineGap: 3 }
        );
        doc.moveDown(0.35);
      });
    } else {
      doc.fontSize(10).font("Helvetica-Oblique").text("- Tidak ada catatan hasil rapat -", { indent: 16 });
    }

    // 5. Tanda Tangan Resmi
    doc.moveDown(2);
    if (doc.y > 670) doc.addPage();
    const signY = doc.y;

    doc.font("Helvetica").fontSize(10).fillColor("#000000");
    doc.text("Pemimpin rapat,", 80, signY, { align: "left" });
    doc.text("Notulen,", 380, signY, { align: "left" });

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text(rapat.pimpinanRapat, 80, signY + 60, { align: "left" });
    doc.text(rapat.notulis, 380, signY + 60, { align: "left" });

    // 6. Lampiran Daftar Peserta Rapat (Jika ada)
    if (rapat.anggota && rapat.anggota.length > 0) {
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(11).text("LAMPIRAN: DAFTAR HADIR PESERTA RAPAT", { align: "center" });
      doc.moveDown(1);
      doc.font("Helvetica").fontSize(9.5);
      rapat.anggota.forEach((a, idx) => {
        doc.text(`${idx + 1}. ${a.nama} — ${a.jabatan || "-"} (${a.asalInstansi || "-"})`, { indent: 15 });
        doc.moveDown(0.25);
      });
    }

    // 7. Ringkasan Eksekutif & Ide Baru AI (Jika Tersedia)
    if (rapat.ringkasanAI || rapat.ideBaruAI) {
      doc.moveDown(1.5);
      if (rapat.ringkasanAI) {
        doc.font("Helvetica-Bold").fontSize(10.5).text("RINGKASAN EKSEKUTIF (AI):");
        doc.moveDown(0.3);
        doc.font("Helvetica").fontSize(9.5).text(rapat.ringkasanAI, { indent: 10, align: "justify", lineGap: 2 });
        doc.moveDown(0.8);
      }
      if (rapat.ideBaruAI) {
        doc.font("Helvetica-Bold").fontSize(10.5).text("REKOMENDASI STRATEGIS (AI):");
        doc.moveDown(0.3);
        doc.font("Helvetica").fontSize(9.5).text(rapat.ideBaruAI, { indent: 10, align: "justify", lineGap: 2 });
      }
    }

    doc.end();
  } catch (err) {
    console.error("Error export PDF:", err);
    res.status(500).send("Gagal mengunduh PDF: " + err.message);
  }
});

// 11. GET /api/rapat/:id/export-word — Ekspor DOCX Formal Baku
app.get("/api/rapat/:id/export-word", async (req, res) => {
  try {
    const baris = db.prepare("SELECT * FROM rapat WHERE id = ?").get(req.params.id);
    if (!baris) return res.status(404).json({ pesan: "Rapat tidak ditemukan" });

    const rapat = ubahBarisJadiRapatLengkap(baris);
    const safeTopic = rapat.topik.replace(/[^a-zA-Z0-9-_]/g, "_");
    const namaFile = `Laporan_Rapat_${safeTopic}_${rapat.tanggal}.docx`;

    const children = [
      new Paragraph({
        text: "LAPORAN HASIL RAPAT",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: rapat.topik.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
      }),
    ];

    if (rapat.tempat) {
      children.push(
        new Paragraph({
          text: rapat.tempat.toUpperCase(),
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.CENTER,
        })
      );
    }

    children.push(new Paragraph({ text: "" }));

    // Metadata Baris
    const metaList = [
      ["Hari / tanggal", formatHariTanggal(rapat.tanggal)],
      ["Waktu", rapat.waktu || "-"],
      ["Tempat", rapat.tempat || "-"],
      ["Pemimpin rapat", rapat.pimpinanRapat || "-"],
      ["Notulen", rapat.notulis || "-"],
      ["Peserta", "Terlampir"],
      ["Hasil rapat", ""],
    ];

    metaList.forEach(([lbl, val]) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: (lbl + " ").padEnd(24, " ") }),
            new TextRun({ text: ": " + val }),
          ],
        })
      );
    });

    children.push(new Paragraph({ text: "" }));
    children.push(
      new Paragraph({
        text: `Rapat dibuka oleh ${rapat.pimpinanRapat} yang menjelaskan mengenai :`,
      })
    );
    children.push(new Paragraph({ text: "" }));

    if (rapat.poinPembahasan && rapat.poinPembahasan.length > 0) {
      rapat.poinPembahasan.forEach((p, idx) => {
        const text = typeof p === "string" ? p : (p.isi || "");
        children.push(
          new Paragraph({
            text: `${idx + 1}.  ${text}`,
          })
        );
      });
    } else {
      children.push(new Paragraph({ text: "- Tidak ada catatan hasil rapat -" }));
    }

    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));

    // Tanda Tangan
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Pemimpin rapat,".padEnd(55, " ") }),
          new TextRun({ text: "Notulen," }),
        ],
      })
    );
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));
    children.push(new Paragraph({ text: "" }));
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: rapat.pimpinanRapat.padEnd(55, " "), bold: true }),
          new TextRun({ text: rapat.notulis, bold: true }),
        ],
      })
    );

    // Lampiran Peserta
    if (rapat.anggota && rapat.anggota.length > 0) {
      children.push(new Paragraph({ text: "", pageBreakBefore: true }));
      children.push(
        new Paragraph({
          text: "LAMPIRAN: DAFTAR HADIR PESERTA RAPAT",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        })
      );
      children.push(new Paragraph({ text: "" }));
      rapat.anggota.forEach((a, idx) => {
        children.push(
          new Paragraph({
            text: `${idx + 1}. ${a.nama} — ${a.jabatan || "-"} (${a.asalInstansi || "-"})`,
          })
        );
      });
    }

    if (rapat.ringkasanAI) {
      children.push(new Paragraph({ text: "" }));
      children.push(
        new Paragraph({
          text: "RINGKASAN EKSEKUTIF (AI)",
          heading: HeadingLevel.HEADING_2,
        })
      );
      children.push(new Paragraph({ text: rapat.ringkasanAI }));
    }

    if (rapat.ideBaruAI) {
      children.push(new Paragraph({ text: "" }));
      children.push(
        new Paragraph({
          text: "REKOMENDASI STRATEGIS (AI)",
          heading: HeadingLevel.HEADING_2,
        })
      );
      children.push(new Paragraph({ text: rapat.ideBaruAI }));
    }

    const dokumen = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(dokumen);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${namaFile}"`);
    res.send(buffer);
  } catch (err) {
    console.error("Error export Word:", err);
    res.status(500).send("Gagal mengunduh Word: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`RapatinAI Server aktif di http://localhost:${PORT}`);
});
