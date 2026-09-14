require('dotenv').config();

const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database(path.join(__dirname, 'data', 'rapatinai.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rapat (
    id TEXT PRIMARY KEY,
    tanggal TEXT,
    topik TEXT,
    pimpinanRapat TEXT,
    notulis TEXT,
    anggota TEXT,
    poinPembahasan TEXT,
    tindakLanjut TEXT,
    ringkasanAI TEXT,
    ideBaruAI TEXT
  )
`);

// Migrasi aman buat database lama yang belum punya kolom ideBaruAI
try {
  db.exec('ALTER TABLE rapat ADD COLUMN ideBaruAI TEXT');
} catch (error) {
  // Kolom udah ada, aman diabaikan
}

function bacaSemuaRapat() {
  const baris = db.prepare('SELECT * FROM rapat ORDER BY rowid DESC').all();
  return baris.map(ubahBarisJadiRapat);
}

function bacaSatuRapat(id) {
  const baris = db.prepare('SELECT * FROM rapat WHERE id = ?').get(id);
  return baris ? ubahBarisJadiRapat(baris) : null;
}

function ubahBarisJadiRapat(baris) {
  return {
    ...baris,
    poinPembahasan: JSON.parse(baris.poinPembahasan || '[]'),
    tindakLanjut: JSON.parse(baris.tindakLanjut || '[]')
  };
}

function simpanRapatBaru(rapat) {
  db.prepare(`
    INSERT INTO rapat (id, tanggal, topik, pimpinanRapat, notulis, anggota, poinPembahasan, tindakLanjut, ringkasanAI, ideBaruAI)
    VALUES (@id, @tanggal, @topik, @pimpinanRapat, @notulis, @anggota, @poinPembahasan, @tindakLanjut, @ringkasanAI, @ideBaruAI)
  `).run({
    ...rapat,
    poinPembahasan: JSON.stringify(rapat.poinPembahasan),
    tindakLanjut: JSON.stringify(rapat.tindakLanjut),
    ringkasanAI: null,
    ideBaruAI: null
  });
}

function updateRingkasanAI(id, ringkasan) {
  db.prepare('UPDATE rapat SET ringkasanAI = ? WHERE id = ?').run(ringkasan, id);
}

function updateIdeBaruAI(id, ideBaru) {
  db.prepare('UPDATE rapat SET ideBaruAI = ? WHERE id = ?').run(ideBaru, id);
}

// Glosarium istilah pemda — dikasih ke AI tiap kali manggil, biar konsisten pakai bahasa resmi
const GLOSARIUM_PEMDA = `
- OPD: Organisasi Perangkat Daerah
- RKPD: Rencana Kerja Pemerintah Daerah
- P-Renja: Perubahan Rencana Kerja
- Perda: Peraturan Daerah
- APBD: Anggaran Pendapatan dan Belanja Daerah
- Bappeda: Badan Perencanaan Pembangunan Daerah
- Musrenbang: Musyawarah Perencanaan Pembangunan
`.trim();

async function mintaRingkasanAI(rapat) {
  const daftarPoin = rapat.poinPembahasan
    .map(p => `- ${p.isi} (Keputusan: ${p.keputusan || '-'})`)
    .join('\n');

  const daftarTindakLanjut = rapat.tindakLanjut
    .map(t => `- ${t}`)
    .join('\n');

  const prompt = `Kamu adalah asisten notulensi rapat pemerintah daerah. Buatkan ringkasan naratif formal (2-3 paragraf) dari data rapat berikut, dalam Bahasa Indonesia baku.

Gunakan istilah resmi pemerintah daerah yang sesuai konteks, contoh:
${GLOSARIUM_PEMDA}

Topik: ${rapat.topik}
Tanggal: ${rapat.tanggal}
Pimpinan Rapat: ${rapat.pimpinanRapat}
Notulis: ${rapat.notulis}
Anggota Rapat: ${rapat.anggota}

Poin Pembahasan dan Keputusan:
${daftarPoin}

Tindak Lanjut:
${daftarTindakLanjut}

PENTING:
- Gunakan HANYA informasi yang tercantum secara eksplisit di atas.
- JANGAN menambahkan nama instansi, provinsi, lokasi, atau detail spesifik apapun yang tidak disebutkan di data di atas.
- Hanya pakai istilah dari glosarium di atas jika memang relevan dengan konteks rapat — jangan dipaksakan.
- Tulis dalam bentuk narasi yang mengalir, cocok untuk laporan resmi, bukan dalam bentuk poin-poin.`;

  return panggilGemini(prompt, 0.2);
}

async function mintaIdeBaruAI(rapat) {
  const daftarPoin = rapat.poinPembahasan
    .map(p => `- ${p.isi} (Keputusan: ${p.keputusan || '-'})`)
    .join('\n');

  const daftarTindakLanjut = rapat.tindakLanjut.length > 0
    ? rapat.tindakLanjut.map(t => `- ${t}`).join('\n')
    : '(belum ada tindak lanjut yang dicatat)';

  const prompt = `Kamu adalah asisten kebijakan pemerintah daerah. Berdasarkan data rapat berikut, usulkan 2-4 ide baru atau rekomendasi tindak lanjut TAMBAHAN yang relevan dan realistis untuk ditindaklanjuti oleh instansi pemerintah daerah.

Gunakan istilah resmi pemerintah daerah yang sesuai konteks, contoh:
${GLOSARIUM_PEMDA}

Topik: ${rapat.topik}

Poin Pembahasan dan Keputusan:
${daftarPoin}

Tindak Lanjut yang sudah dicatat:
${daftarTindakLanjut}

PENTING:
- JANGAN mengulang tindak lanjut yang sudah dicatat di atas.
- Usulan harus masuk akal dan relevan dengan topik serta poin pembahasan — jangan mengarang detail yang tidak berhubungan.
- Jangan menyebut nama instansi, lokasi, atau data spesifik yang tidak ada di atas.
- Tulis dalam format daftar bernomor singkat, satu kalimat per usulan, bahasa formal.`;

  return panggilGemini(prompt, 0.6);
}

async function panggilGemini(prompt, temperature) {
  const respon = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature }
      })
    }
  );

  const data = await respon.json();

  if (!respon.ok) {
    throw new Error(data.error?.message || 'Gagal menghubungi Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

app.get('/api/rapat', (req, res) => {
  res.json(bacaSemuaRapat());
});

app.get('/api/rapat/:id', (req, res) => {
  const rapat = bacaSatuRapat(req.params.id);
  if (!rapat) return res.status(404).json({ pesan: 'Rapat tidak ditemukan' });
  res.json(rapat);
});

app.post('/api/rapat', (req, res) => {
  const rapatBaru = {
    id: Date.now().toString(),
    tanggal: req.body.tanggal,
    topik: req.body.topik,
    pimpinanRapat: req.body.pimpinanRapat,
    notulis: req.body.notulis,
    anggota: req.body.anggota,
    poinPembahasan: req.body.poinPembahasan,
    tindakLanjut: req.body.tindakLanjut
  };

  simpanRapatBaru(rapatBaru);
  res.status(201).json(rapatBaru);
});

app.post('/api/rapat/:id/rangkum', async (req, res) => {
  try {
    const rapat = bacaSatuRapat(req.params.id);
    if (!rapat) return res.status(404).json({ pesan: 'Rapat tidak ditemukan' });

    const ringkasan = await mintaRingkasanAI(rapat);
    updateRingkasanAI(rapat.id, ringkasan);

    res.json({ ringkasanAI: ringkasan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal membuat ringkasan AI: ' + error.message });
  }
});

app.post('/api/rapat/:id/ide-baru', async (req, res) => {
  try {
    const rapat = bacaSatuRapat(req.params.id);
    if (!rapat) return res.status(404).json({ pesan: 'Rapat tidak ditemukan' });

    const ideBaru = await mintaIdeBaruAI(rapat);
    updateIdeBaruAI(rapat.id, ideBaru);

    res.json({ ideBaruAI: ideBaru });
  } catch (error) {
    console.error(error);
    res.status(500).json({ pesan: 'Gagal membuat ide baru: ' + error.message });
  }
});

app.get('/api/rapat/:id/export-pdf', (req, res) => {
  const rapat = bacaSatuRapat(req.params.id);
  if (!rapat) return res.status(404).json({ pesan: 'Rapat tidak ditemukan' });

  const namaFile = `notulen-${rapat.topik.replace(/\s+/g, '-')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${namaFile}"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).fillColor('#0B4C8C').text('NOTULEN RAPAT', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(12).fillColor('#1B2430').text(rapat.topik, { align: 'center' });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#F2994A').lineWidth(2).stroke();
  doc.moveDown();

  doc.fontSize(11).fillColor('#1B2430');
  doc.text(`Tanggal: ${rapat.tanggal}`);
  doc.text(`Pimpinan Rapat: ${rapat.pimpinanRapat}`);
  doc.text(`Notulis: ${rapat.notulis}`);
  doc.text(`Anggota Rapat: ${rapat.anggota}`);
  doc.moveDown();

  doc.fontSize(13).fillColor('#0B4C8C').text('Poin Pembahasan & Keputusan');
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#1B2430');
  rapat.poinPembahasan.forEach((p, i) => {
    doc.text(`${i + 1}. ${p.isi}`);
    doc.fontSize(10).fillColor('#667085').text(`    Keputusan: ${p.keputusan || '-'}`);
    doc.fontSize(11).fillColor('#1B2430');
    doc.moveDown(0.2);
  });
  doc.moveDown();

  doc.fontSize(13).fillColor('#0B4C8C').text('Tindak Lanjut');
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#1B2430');
  if (rapat.tindakLanjut.length > 0) {
    rapat.tindakLanjut.forEach((t, i) => doc.text(`${i + 1}. ${t}`));
  } else {
    doc.text('-');
  }

  if (rapat.ideBaruAI) {
    doc.moveDown();
    doc.fontSize(13).fillColor('#0B4C8C').text('Usulan Ide Baru');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#1B2430').text(rapat.ideBaruAI, { align: 'justify' });
  }

  if (rapat.ringkasanAI) {
    doc.moveDown();
    doc.fontSize(13).fillColor('#0B4C8C').text('Ringkasan');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#1B2430').font('Helvetica-Oblique').text(rapat.ringkasanAI, { align: 'justify' });
    doc.font('Helvetica');
  }

  doc.end();
});

app.get('/api/rapat/:id/export-word', async (req, res) => {
  const rapat = bacaSatuRapat(req.params.id);
  if (!rapat) return res.status(404).json({ pesan: 'Rapat tidak ditemukan' });

  const children = [
    new Paragraph({ text: 'NOTULEN RAPAT', heading: HeadingLevel.HEADING_1, alignment: 'center' }),
    new Paragraph({ text: rapat.topik, alignment: 'center' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: `Tanggal: ${rapat.tanggal}` }),
    new Paragraph({ text: `Pimpinan Rapat: ${rapat.pimpinanRapat}` }),
    new Paragraph({ text: `Notulis: ${rapat.notulis}` }),
    new Paragraph({ text: `Anggota Rapat: ${rapat.anggota}` }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Poin Pembahasan & Keputusan', heading: HeadingLevel.HEADING_2 })
  ];

  rapat.poinPembahasan.forEach((p, i) => {
    children.push(new Paragraph({ text: `${i + 1}. ${p.isi}` }));
    children.push(new Paragraph({ text: `Keputusan: ${p.keputusan || '-'}`, italics: true }));
  });

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ text: 'Tindak Lanjut', heading: HeadingLevel.HEADING_2 }));

  if (rapat.tindakLanjut.length > 0) {
    rapat.tindakLanjut.forEach((t, i) => children.push(new Paragraph({ text: `${i + 1}. ${t}` })));
  } else {
    children.push(new Paragraph({ text: '-' }));
  }

  if (rapat.ideBaruAI) {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: 'Usulan Ide Baru', heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: rapat.ideBaruAI }));
  }

  if (rapat.ringkasanAI) {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: 'Ringkasan', heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: rapat.ringkasanAI, italics: true }));
  }

  const dokumen = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(dokumen);

  const namaFile = `notulen-${rapat.topik.replace(/\s+/g, '-')}.docx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${namaFile}"`);
  res.send(buffer);
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});