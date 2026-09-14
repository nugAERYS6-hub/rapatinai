// script.js — RapatinAI: form input, sidebar riwayat, dan tampilan detail

const formRapat = document.getElementById('form-rapat');
const daftarPoin = document.getElementById('daftar-poin');
const daftarTindakLanjut = document.getElementById('daftar-tindak-lanjut');
const daftarRapatSidebar = document.getElementById('daftar-rapat-sidebar');
const tampilanForm = document.getElementById('tampilan-form');
const tampilanDetail = document.getElementById('tampilan-detail');
const kontenDetail = document.getElementById('konten-detail');
const tombolRapatBaru = document.getElementById('tombol-rapat-baru');

function tambahBarisPoin() {
  const baris = document.createElement('div');
  baris.className = 'baris-poin';
  baris.innerHTML = `
    <input type="text" placeholder="Poin pembahasan" class="input-isi-poin">
    <input type="text" placeholder="Keputusan" class="input-keputusan-poin">
    <button type="button" class="tombol-hapus-baris" aria-label="Hapus baris">×</button>
  `;
  baris.querySelector('.tombol-hapus-baris').addEventListener('click', () => baris.remove());
  daftarPoin.appendChild(baris);
}

function tambahBarisTindakLanjut() {
  const baris = document.createElement('div');
  baris.className = 'baris-tindak-lanjut';
  baris.innerHTML = `
    <input type="text" placeholder="Tindak lanjut" class="input-tindak-lanjut">
    <button type="button" class="tombol-hapus-baris" aria-label="Hapus baris">×</button>
  `;
  baris.querySelector('.tombol-hapus-baris').addEventListener('click', () => baris.remove());
  daftarTindakLanjut.appendChild(baris);
}

document.getElementById('tambah-poin').addEventListener('click', tambahBarisPoin);
document.getElementById('tambah-tindak-lanjut').addEventListener('click', tambahBarisTindakLanjut);

tambahBarisPoin();
tambahBarisTindakLanjut();

function ambilDataPoinPembahasan() {
  const isiPoinSemua = document.querySelectorAll('.input-isi-poin');
  const keputusanSemua = document.querySelectorAll('.input-keputusan-poin');
  const hasil = [];
  isiPoinSemua.forEach((input, index) => {
    if (input.value.trim() !== '') {
      hasil.push({ isi: input.value.trim(), keputusan: keputusanSemua[index].value.trim() });
    }
  });
  return hasil;
}

function ambilDataTindakLanjut() {
  const inputSemua = document.querySelectorAll('.input-tindak-lanjut');
  const hasil = [];
  inputSemua.forEach(input => {
    if (input.value.trim() !== '') hasil.push(input.value.trim());
  });
  return hasil;
}

function resetForm() {
  formRapat.reset();
  daftarPoin.innerHTML = '';
  daftarTindakLanjut.innerHTML = '';
  tambahBarisPoin();
  tambahBarisTindakLanjut();
}

formRapat.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dataRapat = {
    tanggal: document.getElementById('tanggal').value,
    topik: document.getElementById('topik').value,
    pimpinanRapat: document.getElementById('pimpinan').value,
    notulis: document.getElementById('notulis').value,
    anggota: document.getElementById('anggota').value,
    poinPembahasan: ambilDataPoinPembahasan(),
    tindakLanjut: ambilDataTindakLanjut()
  };

  try {
    const respon = await fetch('/api/rapat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataRapat)
    });

    if (!respon.ok) throw new Error('Gagal menyimpan rapat');

    resetForm();
    await muatDaftarRapatSidebar();
    alert('Rapat berhasil disimpan!');
  } catch (error) {
    alert('Terjadi kesalahan: ' + error.message);
  }
});

async function muatDaftarRapatSidebar() {
  const respon = await fetch('/api/rapat');
  const semuaRapat = await respon.json();

  if (semuaRapat.length === 0) {
    daftarRapatSidebar.innerHTML = '<p class="sidebar-kosong">Belum ada rapat</p>';
    return;
  }

  daftarRapatSidebar.innerHTML = '';

  semuaRapat.forEach(rapat => {
    const item = document.createElement('div');
    item.className = 'item-rapat-sidebar';
    item.dataset.id = rapat.id;
    item.innerHTML = `
      <span class="judul-item">${rapat.topik}</span>
      <span class="tanggal-item">${rapat.tanggal}</span>
    `;
    item.addEventListener('click', () => tampilkanDetailRapat(rapat.id));
    daftarRapatSidebar.appendChild(item);
  });
}

async function tampilkanDetailRapat(id) {
  const respon = await fetch(`/api/rapat/${id}`);
  const rapat = await respon.json();

  const daftarPoinHtml = rapat.poinPembahasan
    .map(p => `<li><b>${p.isi}</b> → Keputusan: ${p.keputusan || '-'}</li>`)
    .join('');

  const daftarTindakLanjutHtml = rapat.tindakLanjut.length > 0
    ? rapat.tindakLanjut.map(t => `<li>${t}</li>`).join('')
    : '<li>-</li>';

  kontenDetail.innerHTML = `
    <h1>${rapat.topik}</h1>
    <p class="subjudul">${rapat.tanggal}</p>

    <p><b>Pimpinan:</b> ${rapat.pimpinanRapat} &nbsp;|&nbsp; <b>Notulis:</b> ${rapat.notulis}</p>
    <p><b>Anggota:</b> ${rapat.anggota}</p>

    <h2>Poin Pembahasan</h2>
    <ul>${daftarPoinHtml}</ul>

    <h2>Tindak Lanjut</h2>
    <ul>${daftarTindakLanjutHtml}</ul>

    <h2>Usulan Ide Baru (AI)</h2>
    <button class="tombol-sekunder" onclick="buatIdeBaruAI('${rapat.id}')">Buat Ide Baru</button>
    <div class="hasil-teks" id="ide-baru-${rapat.id}">
      ${rapat.ideBaruAI ? `<p>${rapat.ideBaruAI}</p>` : ''}
    </div>

    <h2>Ringkasan</h2>
    <button class="tombol-sekunder" onclick="buatRingkasanAI('${rapat.id}')">Buat Ringkasan</button>
    <div class="hasil-teks" id="ringkasan-${rapat.id}">
      ${rapat.ringkasanAI ? `<p>${rapat.ringkasanAI}</p>` : ''}
    </div>

    <div class="tombol-export">
      <a href="/api/rapat/${rapat.id}/export-pdf" class="tombol-unduh">Unduh PDF</a>
      <a href="/api/rapat/${rapat.id}/export-word" class="tombol-unduh">Unduh Word</a>
    </div>
  `;

  document.querySelectorAll('.item-rapat-sidebar').forEach(el => el.classList.remove('aktif'));
  const itemAktif = document.querySelector(`.item-rapat-sidebar[data-id="${id}"]`);
  if (itemAktif) itemAktif.classList.add('aktif');

  tampilanForm.classList.add('tersembunyi');
  tampilanDetail.classList.remove('tersembunyi');
}

function tampilkanForm() {
  tampilanDetail.classList.add('tersembunyi');
  tampilanForm.classList.remove('tersembunyi');
  document.querySelectorAll('.item-rapat-sidebar').forEach(el => el.classList.remove('aktif'));
}

tombolRapatBaru.addEventListener('click', tampilkanForm);

async function buatRingkasanAI(id) {
  const kontainer = document.getElementById(`ringkasan-${id}`);
  kontainer.innerHTML = '<p>Sedang membuat ringkasan...</p>';

  try {
    const respon = await fetch(`/api/rapat/${id}/rangkum`, { method: 'POST' });
    const data = await respon.json();

    if (!respon.ok) throw new Error(data.pesan || 'Gagal membuat ringkasan');

    kontainer.innerHTML = `<p>${data.ringkasanAI}</p>`;
  } catch (error) {
    kontainer.innerHTML = `<p class="teks-error">${error.message}</p>`;
  }
}

async function buatIdeBaruAI(id) {
  const kontainer = document.getElementById(`ide-baru-${id}`);
  kontainer.innerHTML = '<p>Sedang menyusun usulan ide...</p>';

  try {
    const respon = await fetch(`/api/rapat/${id}/ide-baru`, { method: 'POST' });
    const data = await respon.json();

    if (!respon.ok) throw new Error(data.pesan || 'Gagal membuat ide baru');

    kontainer.innerHTML = `<p>${data.ideBaruAI}</p>`;
  } catch (error) {
    kontainer.innerHTML = `<p class="teks-error">${error.message}</p>`;
  }
}

const tombolMic = document.getElementById('tombol-mic');
const statusMic = document.getElementById('status-mic');
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognitionAPI) {
  tombolMic.disabled = true;
  statusMic.textContent = '⚠️ Browser lo gak dukung voice recognition (coba pakai Chrome)';
} else {
  const recognition = new SpeechRecognitionAPI();
  recognition.lang = 'id-ID';
  recognition.continuous = true;
  recognition.interimResults = false;

  let sedangMerekam = false;

  recognition.onresult = (event) => {
    const hasilTerakhir = event.results[event.results.length - 1];
    const teksUcapan = hasilTerakhir[0].transcript;
    const elemenAktif = document.activeElement;

    if (elemenAktif && elemenAktif.tagName === 'INPUT') {
      const isiSekarang = elemenAktif.value;
      elemenAktif.value = isiSekarang ? `${isiSekarang} ${teksUcapan}` : teksUcapan;
    } else {
      statusMic.textContent = '⚠️ Klik dulu field yang mau diisi, baru ngomong';
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') {
      statusMic.textContent = '🔴 Masih mendengarkan... (belum kedengeran suara)';
      return;
    }
    statusMic.textContent = `⚠️ Error: ${event.error}`;
    sedangMerekam = false;
    tombolMic.textContent = '🎙️ Mulai Bicara';
    tombolMic.classList.remove('merekam');
  };

  recognition.onend = () => {
    if (sedangMerekam) recognition.start();
  };

  tombolMic.addEventListener('click', () => {
    if (!sedangMerekam) {
      recognition.start();
      sedangMerekam = true;
      tombolMic.textContent = '⏹️ Berhenti Bicara';
      tombolMic.classList.add('merekam');
      statusMic.textContent = '🔴 Sedang mendengarkan... klik field, lalu ngomong';
    } else {
      recognition.stop();
      sedangMerekam = false;
      tombolMic.textContent = '🎙️ Mulai Bicara';
      tombolMic.classList.remove('merekam');
      statusMic.textContent = '';
    }
  });
}

muatDaftarRapatSidebar();