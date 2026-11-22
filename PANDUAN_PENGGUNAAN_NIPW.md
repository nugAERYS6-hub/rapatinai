# MODUL PANDUAN PENGGUNAAN APLIKASI WEB NIPW
## (Notulensi Infrastruktur dan Pengembangan Wilayah)
**Sistem Informasi Notulensi Rapat & Manajemen Hasil Pembahasan Kedinasan Terintegrasi AI**

---

### Informasi Dokumen
| Parameter | Keterangan |
| :--- | :--- |
| **Nama Aplikasi** | NIPW (Notulensi Infrastruktur dan Pengembangan Wilayah) |
| **Unit Kerja** | Bidang Infrastruktur dan Kewilayahan |
| **Instansi** | Bappeda Provinsi Maluku Utara |
| **Versi Aplikasi** | v1.8.0 (Tahun 2026) |
| **Klasifikasi Dokumen** | Modul Panduan Operasional Pengguna (User Manual) |

---

> ### 💡 Petunjuk Pengisian Tangkapan Layar (Screenshot)
> Modul ini telah dilengkapi dengan **blok placeholder tangkapan layar** berlabel khusus:
> `📸 [TEMPATKAN SCREENSHOT X: NAMA BAGIAN]`.
> 
> **Cara Mengambil & Memasang Screenshot di Windows:**
> 1. Buka halaman aplikasi NIPW di browser Anda sesuai instruksi pada tiap bab.
> 2. Tekan kombinasi tombol **`Windows + Shift + S`** untuk membuka pemotong layar (Snipping Tool).
> 3. Pilih area tampilan yang ingin ditangkap, lalu simpan file gambar di folder dokumen Anda (misal format `.png` atau `.jpg`).
> 4. Ganti baris placeholder screenshot dengan tautan gambar Markdown:
>    `![Deskripsi Tangkapan Layar](path/ke/file_gambar.png)` atau langsung tempel (*paste*) jika dokumen ini dibuka di editor dokumen seperti Microsoft Word/Google Docs.

---

## DAFTAR ISI
1. [BAB I: PENDAHULUAN](#bab-i-pendahuluan)
   - 1.1 Latar Belakang & Tujuan
   - 1.2 Sasaran Pengguna
   - 1.3 Prasyarat Perangkat & Browser
2. [BAB II: ANTARMUKA & NAVIGASI UTAMA](#bab-ii-antarmuka--navigasi-utama)
   - 2.1 Tata Letak Antarmuka (Layout)
   - 2.2 Top Command Bar & Breadcrumb
   - 2.3 Sable Dock (Menu Navigasi Melayang)
   - 2.4 Mode Tema (Gelap & Terang)
3. [BAB III: PANDUAN MENU BERANDA (LANDING PAGE)](#bab-iii-panduan-menu-beranda-landing-page)
   - 3.1 Indikator Statistik Eksekutif
   - 3.2 Aksi Cepat (Quick Action Buttons)
   - 3.3 Kartu Informasi SOP & Dokumentasi Kedinasan
4. [BAB IV: PANDUAN PENYUSUNAN NOTULEN BARU (MENU RAPAT BARU)](#bab-iv-panduan-penyusunan-notulen-baru-menu-rapat-baru)
   - 4.1 Identitas & Waktu Pelaksanaan Rapat
   - 4.2 Pejabat Kedinasan (Pimpinan Rapat, NIP, & Notulis)
   - 4.3 Menambahkan Daftar Kehadiran / Peserta Rapat
   - 4.4 Pengisian Dinamis Poin-Poin Pembahasan Notula
   - 4.5 Pengisian Rencana Tindak Lanjut (Action Items)
   - 4.6 Pengamanan Draf Otomatis (*Local Auto-Save*)
   - 4.7 Menyimpan Notulen ke Basis Data
5. [BAB V: PANDUAN RIWAYAT RAPAT & ARSIP DIGITAL](#bab-v-panduan-riwayat-rapat--arsip-digital)
   - 5.1 Menelusuri Daftar Arsip Rapat
   - 5.2 Pencarian Cepat (*Live Keyword Search*)
   - 5.3 Filter Rentang Tanggal & Filter Status
   - 5.4 Manajemen Tong Sampah (*Trash*), Pemulihan Data (*Restore*), & Hapus Permanen
6. [BAB VI: PANDUAN DETAIL NOTULEN & KECERDASAN BUATAN (AI)](#bab-vi-panduan-detail-notulen--kecerdasan-buatan-ai)
   - 6.1 Membuka Halaman Detail Rapat & Pratinjau Kertas Dinas (*Paper Preview*)
   - 6.2 Memanfaatkan Kecerdasan Buatan (Google Gemini Flash)
     - A. Perumusan Ringkasan Eksekutif
     - B. Rekomendasi Solusi & Terobosan Baru
     - C. Ekstraksi Otomatis Action Items
   - 6.3 Checklist Status Tindak Lanjut (*Interactive Action Items*)
   - 6.4 Manajemen Dokumen Lampiran (Upload, Preview Modal, Unduh)
   - 6.5 Ekspor Dokumen Resmi (PDF Kedinasan & Microsoft Word)
7. [BAB VII: PANDUAN PENGATURAN SISTEM & KEAMANAN DATA](#bab-vii-panduan-pengaturan-sistem--keamanan-data)
   - 7.1 Manajemen Preferensi Tema Tampilan
   - 7.2 Pencadangan Basis Data (*Backup MySQL*)
   - 7.3 Pemulihan Basis Data (*Restore Database*)
   - 7.4 Pemantauan Riwayat Cadangan Data
8. [BAB VIII: TANYA JAWAB & PEMECAHAN MASALAH (FAQ)](#bab-viii-tanya-jawab--pemecahan-masalah-faq)

---

## BAB I: PENDAHULUAN

### 1.1 Latar Belakang & Tujuan
Aplikasi **NIPW (Notulensi Infrastruktur dan Pengembangan Wilayah)** dirancang secara khusus untuk memenuhi standar administrasi kedinasan pada unit kerja pemerintah daerah (khususnya Bidang Infrastruktur dan Kewilayahan, Bappeda Provinsi Maluku Utara). 

Tujuan utama sistem ini meliputi:
1. **Standarisasi Dokumen Notulensi:** Memastikan penulisan notula memuat elemen resmi kedinasan lengkap dengan nomor identitas aparatur (NIP 18-digit), jabatan pimpinan rapat, dan struktur penulisan baku.
2. **Keamanan Pencatatan Real-time:** Menghindari risiko hilangnya materi rapat akibat browser tertutup atau kendala teknis perangkat melalui fitur *auto-save local draft*.
3. **Efisiensi Perumusan Keputusan:** Mempercepat perumusan intisari rapat, kesimpulan strategis, serta penugasan tindak lanjut melalui integrasi kecerdasan buatan (*AI Gemini Flash*).
4. **Sentralisasi Arsip & Ekspor Resmi:** Mempermudah pencarian rekam jejak rapat serta menghasilkan dokumen siap cetak berupa PDF resmi dengan kop surat kedinasan maupun dokumen Word yang dapat disunting kembali.

### 1.2 Sasaran Pengguna
* **Notulis / Staf Pencatat Rapat:** Bertugas mencatat poin pembahasan, kehadiran peserta, serta mengunggah lampiran pendukung.
* **Pejabat Pengawas / Koordinator:** Memantau kemajuan tindak lanjut (*action items*) dari setiap hasil pembahasan.
* **Pimpinan Perangkat Daerah:** Membaca intisari ringkasan eksekutif secara ringkas dan menandatangani dokumen hasil rapat.

### 1.3 Prasyarat Perangkat & Browser
* **Perangkat:** Komputer Desktop, Laptop, atau Tablet kerja.
* **Peramban (Browser):** Google Chrome (versi 110+), Microsoft Edge, Mozilla Firefox, atau browser berbasis Chromium modern lainnya dengan dukungan JavaScript aktif.
* **Koneksi Jaringan:** Terhubung ke jaringan lokal / intranet instansi atau internet publik yang mengarah ke server NIPW.

---

## BAB II: ANTARMUKA & NAVIGASI UTAMA

### 2.1 Tata Letak Antarmuka (Layout)
Antarmuka web NIPW dirancang menggunakan pendekatan modern, bersih (*clean glassmorphism*), dan responsif untuk memastikan kenyamanan pengguna selama berjam-jam mencatat jalannya rapat kedinasan.

> 📸 **[TEMPATKAN SCREENSHOT 1: TAMPILAN KESELURUHAN WEB NIPW]**
> *Petunjuk Tangkapan Layar: Tangkap tampilan layar penuh aplikasi saat pertama kali dibuka pada browser, menampilkan Top Command Bar dan halaman Beranda.*

---

### 2.2 Top Command Bar & Breadcrumb
Di bagian paling atas layar terdapat **Top Command Bar** yang memuat:
1. **Breadcrumb Trail (Jejak Navigasi):** Menunjukkan posisi halaman yang sedang aktif saat ini (contoh: `NIPW / Riwayat Rapat / Detail Rapat`). Pengguna dapat mengklik teks jejak untuk kembali ke halaman sebelumnya secara cepat.
2. **Indikator Dokumen Aktif:** Membantu pengguna mengetahui status notulen yang sedang disunting atau dilihat.

---

### 2.3 Sable Dock (Menu Navigasi Melayang)
Pada area tengah atas, terdapat bilah navigasi dinamis berformat *Dock* (Sable Dock) yang memiliki efek animasi dan tombol pintas ke 4 modul utama:

| Ikon & Nama Menu | Rute URL | Fungsi Utama |
| :--- | :--- | :--- |
| **🏠 Beranda** | `#/beranda` | Halaman pengantar eksekutif, statistik ringkasan, dan SOP kedinasan. |
| **➕ Rapat Baru** | `#/baru` | Formulir lengkap penyusunan notulen rapat baru. |
| **📂 Riwayat Rapat** | `#/riwayat` | Arsip seluruh risalah rapat, filter tanggal, dan status notulen. |
| **⚙️ Pengaturan** | `#/pengaturan` | Konfigurasi tema tampilan, cadangan (*backup*), dan pemulihan (*restore*) basis data. |

> 📸 **[TEMPATKAN SCREENSHOT 2: DETAIL SABLE DOCK & BREADCRUMB]**
> *Petunjuk Tangkapan Layar: Tangkap area atas layar yang memperlihatkan Top Command Bar, jejak Breadcrumb di sebelah kiri, dan tombol-tombol Sable Dock di tengah.*

---

### 2.4 Mode Tema (Gelap & Terang)
NIPW mendukung dua tema warna tampilan:
* **Tema Gelap (Dark Mode):** Direkomendasikan untuk ruang rapat dengan pencahayaan redup agar mata tidak cepat lelah.
* **Tema Terang (Light Mode):** Direkomendasikan saat bekerja di luar ruangan atau ruang kerja kantor dengan pencahayaan terang.
* Pengaturan tema dapat diubah secara instan di menu **Pengaturan** menggunakan sakelar interaktif.

---

## BAB III: PANDUAN MENU BERANDA (LANDING PAGE)

Menu Beranda merupakan gerbang utama yang menyajikan ringkasan eksekutif bagi pimpinan dan staf sebelum memulai pekerjaan.

> 📸 **[TEMPATKAN SCREENSHOT 3: HALAMAN BERANDA / LANDING PAGE]**
> *Petunjuk Tangkapan Layar: Buka menu Beranda (`#/beranda`). Tangkap bagian Hero Banner, metrik statistik, dan tombol pintasan aksi cepat.*

### 3.1 Indikator Statistik Eksekutif
Pada kartu statistik di halaman beranda, sistem menampilkan angka real-time yang bersumber langsung dari basis data:
* **Total Rapat Tercatat:** Menghitung seluruh agenda rapat yang tersimpan di sistem.
* **Rapat Bulan Berjalan:** Menghitung intensitas rapat kedinasan dalam bulan aktif.
* **Tindak Lanjut / Action Items:** Menunjukkan jumlah komitmen tugas yang belum maupun telah diselesaikan.

### 3.2 Aksi Cepat (Quick Action Buttons)
Tersedia dua tombol utama di bagian atas banner beranda:
* **Tombol "Buat Notulen Baru":** Mengarahkan pengguna langsung ke formulir pembuatan notulen rapat baru tanpa perlu mencari menu.
* **Tombol "Buka Riwayat Rapat":** Membuka daftar arsip rapat untuk pencarian data dokumen masa lalu.

### 3.3 Kartu Informasi SOP & Dokumentasi Kedinasan
Bagian bawah beranda memuat pedoman ringkas alur kerja pencatatan rapat, kepatuhan format administrasi aparatur, serta penjelasan pemanfaatan AI yang selaras dengan etika kerahasiaan data kedinasan.

---

## BAB IV: PANDUAN PENYUSUNAN NOTULEN BARU (MENU RAPAT BARU)

Untuk mulai mencatat rapat yang sedang berlangsung atau merapikan notula rapat terdahulu, klik tombol **"Rapat Baru"** pada menu navigasi atau tombol aksi di beranda.

> 📸 **[TEMPATKAN SCREENSHOT 4: FORMULIR PEMBUATAN RAPAT BARU (BAGIAN ATAS)]**
> *Petunjuk Tangkapan Layar: Buka menu `#/baru`. Tangkap bagian atas formulir: Topik Rapat, Tanggal, Rentang Waktu, Tempat, dan Status Rapat.*

---

### 4.1 Identitas & Waktu Pelaksanaan Rapat
Isi bidang-bidang formulir sesuai data pelaksanaan rapat:
1. **Topik / Judul Rapat (Wajib):** Tuliskan judul pembahasan rapat secara jelas dan formal.
   * *Contoh:* `Rapat Koordinasi Penanganan Longsor Ruas Jalan Trans Halmahera KM 42`
2. **Tanggal Rapat (Wajib):** Pilih tanggal pelaksanaan rapat menggunakan kalender pop-up.
3. **Waktu Mulai & Waktu Selesai:** 
   * *Waktu Mulai:* Jam dimulainya rapat (misal `09:00`).
   * *Waktu Selesai:* Jam berakhirnya rapat (misal `12:30`) atau dapat dikosongkan jika rapat masih berlangsung.
4. **Tempat / Ruang Rapat:** Lokasi fisik atau tautan pertemuan virtual.
   * *Contoh:* `Ruang Rapat Utama Bappeda / Zoom Meeting ID: 821-xxxx`
5. **Status Rapat:** Pilih salah satu opsi status:
   * **Draf:** Notulensi masih dalam proses penyusunan/koreksi.
   * **Terjadwal:** Agenda rapat baru diagendakan dan belum berlangsung.
   * **Selesai:** Rapat telah rampung dan hasil notula sudah final.

---

### 4.2 Pejabat Kedinasan (Pimpinan Rapat, NIP, & Notulis)
Kelengkapan pejabat sangat penting untuk keabsahan lembar notulen saat diekspor ke format resmi:
* **Pimpinan Rapat:** Nama lengkap beserta gelar pejabat yang memimpin jalannya rapat (misal: `Dr. Ir. H. Muhammad Ridwan, M.Si`).
* **Jabatan Resmi Pimpinan:** Jabatan dinas yang diemban (misal: `Kepala Bidang Infrastruktur dan Kewilayahan`).
* **NIP Pimpinan (18 Digit):** Nomor Induk Pegawai pimpinan rapat. Sistem memvalidasi kesesuaian format standar BKN.
* **Nama Notulis:** Nama staf atau aparatur yang bertugas menyusun catatan.
* **NIP Notulis:** Nomor Induk Pegawai notulis rapat (bila ada).

> 📸 **[TEMPATKAN SCREENSHOT 5: BAGIAN PEJABAT KEDINASAN & MODAL ANGGOTA]**
> *Petunjuk Tangkapan Layar: Tangkap area input Pimpinan Rapat, NIP, Notulis, dan pop-up modal "Tambah Peserta Rapat" yang sedang terbuka.*

---

### 4.3 Menambahkan Daftar Kehadiran / Peserta Rapat
1. Klik tombol **"+ Tambah Peserta"** untuk membuka kotak dialog (modal).
2. Isi formulir peserta:
   * **Nama Peserta:** Nama lengkap undangan/peserta.
   * **Jabatan:** Jabatan teknis peserta (opsional).
   * **Instansi / Perangkat Daerah:** Unit kerja/dinas asal peserta (misal: `Dinas PUPR Provinsi`).
3. Klik tombol **"Simpan Peserta"**.
4. Nama peserta akan muncul dalam bentuk *badge chip* interaktif. Anda dapat menghapus peserta dengan mengklik tanda silang (**×**) pada masing-masing chip.

---

### 4.4 Pengisian Dinamis Poin-Poin Pembahasan Notula
Area notula disusun secara modular per poin pembahasan agar tersusun rapi:
1. Ketik materi pembahasan, masukan pimpinan, atau dinamika diskusi pada kotak teks baris yang tersedia.
2. Untuk menambah pembahasan berikutnya, klik tombol **"+ Tambah Poin Pembahasan"**.
3. Untuk menghapus poin yang keliru, klik ikon tempat sampah di ujung kanan baris yang bersangkutan.

---

### 4.5 Pengisian Rencana Tindak Lanjut (Action Items)
Rencana aksi memuat mandat atau kesepakatan tugas yang harus diselesaikan setelah rapat usai:
1. Klik tombol **"+ Tambah Tindak Lanjut"**.
2. Masukkan rincian tugas pada baris yang muncul:
   * **Deskripsi Tugas:** Uraian pekerjaan yang harus dilakukan.
   * **Penanggung Jawab (PIC):** Nama aparatur atau seksi/subbidang yang memegang tanggung jawab.
   * **Tenggat Waktu (Deadline):** Tanggal target penyelesaian.

---

### 4.6 Pengamanan Draf Otomatis (*Local Auto-Save*)
Sistem NIPW dilengkapi fitur pengaman ketikan otomatis:
* Setiap kali Anda mengetik teks, sistem secara senyap menyimpan perubahan ke *browser storage* lokal Anda.
* Jika listrik padam, tab browser tertutup tanpa sengaja, atau koneksi terputus, saat Anda membuka kembali menu **Rapat Baru**, sistem akan memunculkan **Banner Notifikasi Pemulihan Draf**:
  > *"Draf notulen sebelumnya ditemukan tersimpan pada perangkat ini (pukul 10:15). Apakah Anda ingin memulihkan ketikan tersebut?"*
* Klik **"Pulihkan Draf"** untuk mengembalikan seluruh ketikan, atau klik **"Abaikan / Buang"** untuk memulai catatan baru dari awal.

> 📸 **[TEMPATKAN SCREENSHOT 6: BANNER PEMULIHAN DRAF OTOMATIS]**
> *Petunjuk Tangkapan Layar: Buka formulir `#/baru` saat ada draf lokal tersimpan, tangkap banner notifikasi berwarna kuning/emas di bagian atas form.*

---

### 4.7 Menyimpan Notulen ke Basis Data
Setelah seluruh informasi terisi lengkap:
1. Pastikan kolom wajib (Judul, Tanggal, Pimpinan) tidak kosong.
2. Klik tombol utama **"Simpan Notulen Rapat"** di bagian bawah formulir.
3. Tunggu hingga notifikasi sukses (*Toast Pop-up*) berwarna hijau muncul di sudut layar.
4. Sistem akan secara otomatis mengarahkan Anda ke tampilan **Detail Notulen Rapat**.

---

## BAB V: PANDUAN RIWAYAT RAPAT & ARSIP DIGITAL

Menu **Riwayat Rapat** (`#/riwayat`) berfungsi sebagai pusat arsip digital untuk memantau, mencari, mengoreksi, dan mengelola seluruh riwayat pertemuan kedinasan yang pernah dicatat.

> 📸 **[TEMPATKAN SCREENSHOT 7: HALAMAN RIWAYAT & ARSIP RAPAT]**
> *Petunjuk Tangkapan Layar: Buka menu `#/riwayat`. Tangkap bilah pencarian, filter tanggal, dan daftar kartu/tabel rapat yang tersimpan.*

---

### 5.1 Menelusuri Daftar Arsip Rapat
Pada halaman riwayat, seluruh notulen disusun rapi dalam kartu/baris arsip yang memuat:
* Judul / Topik Pembahasan
* Tanggal dan Rentang Waktu Rapat
* Nama Pemimpin Rapat beserta Jabatan
* Jumlah Peserta dan Poin Notula
* Status Rapat (Badge: *Selesai*, *Terjadwal*, atau *Draf*)

### 5.2 Pencarian Cepat (*Live Keyword Search*)
Untuk menemukan dokumen rapat secara instan:
1. Klik pada kolom pencarian bertuliskan **"Cari berdasarkan topik, pimpinan, atau kata kunci..."**.
2. Ketikkan kata kunci yang dicari (misal: `Jalan Trans`, `Bappeda`, atau nama pimpinan).
3. Daftar rapat akan langsung terfilter secara otomatis tanpa perlu memuat ulang halaman.

### 5.3 Filter Rentang Tanggal & Filter Status
Untuk mempersempit pencarian dokumen kedinasan:
* **Filter Dari Tanggal & Sampai Tanggal:** Tentukan rentang waktu pelaksanaan rapat (sangat berguna saat penyusunan laporan triwulanan atau tahunan).
* **Filter Status:** Pilih untuk hanya menampilkan rapat berstatus *Selesai*, *Draf*, atau *Terjadwal*.
* Klik tombol **"Reset Filter"** jika ingin mengembalikan daftar ke kondisi awal.

---

### 5.4 Manajemen Tong Sampah (*Trash*), Pemulihan Data (*Restore*), & Hapus Permanen
Aplikasi NIPW menerapkan pengamanan penghapusan data bertingkat (*Soft Delete*):
1. **Menghapus Notulen (Pindah ke Tong Sampah):**
   * Klik ikon opsi/hapus pada kartu rapat yang bersangkutan.
   * Dokumen akan dipindahkan ke folder **Tong Sampah (Trash)** dan tidak akan hilang seketika.
2. **Membuka Tong Sampah:**
   * Klik tombol **"Tong Sampah"** di bagian atas menu riwayat.
3. **Memulihkan Notulen (*Restore*):**
   * Jika notulen terhapus karena ketidaksengajaan, klik tombol **"Pulihkan"** pada daftar tong sampah. Notulen akan kembali aktif di riwayat utama.
4. **Hapus Permanen (*Force Delete*):**
   * Digunakan jika dokumen benar-benar tidak lagi dibutuhkan atau merupakan data uji coba. Tindakan ini tidak dapat dibatalkan.

> 📸 **[TEMPATKAN SCREENSHOT 8: TAMPILAN MODAL TONG SAMPAH / TRASH]**
> *Petunjuk Tangkapan Layar: Klik tombol "Tong Sampah" pada riwayat rapat, lalu tangkap daftar dokumen yang ada di dalam tong sampah beserta tombol "Pulihkan".*

---

## BAB VI: PANDUAN DETAIL NOTULEN & KECERDASAN BUATAN (AI)

Halaman **Detail Notulen Rapat** merupakan pusat analisis, asistensi cerdas, pratinjau dokumen resmi, dan ekspor berkas.

> 📸 **[TEMPATKAN SCREENSHOT 9: HALAMAN DETAIL RAPAT LENGKAP]**
> *Petunjuk Tangkapan Layar: Buka salah satu rapat dari menu riwayat. Tangkap tampilan detail notulen yang memperlihatkan metadata, daftar peserta, poin notula, dan bilah tombol AI.*

---

### 6.1 Pratinjau Kertas Dinas (*Paper Preview*)
Di sisi tampilan detail, sistem menyajikan simulasi lembar kertas berstandar format dinas resmi:
* Memuat Kop Dokumen Kedinasan Bidang Infrastruktur dan Kewilayahan.
* Format penyajian tabel yang rapi dan elegan.
* Kolom tanda tangan resmi pimpinan rapat lengkap dengan Jabatan dan NIP 18-digit.

---

### 6.2 Memanfaatkan Kecerdasan Buatan (Google Gemini Flash)
NIPW dibekali asisten AI canggih untuk mengolah notula rapat menjadi dokumen bernilai eksekutif hanya dalam satu klik:

> 📸 **[TEMPATKAN SCREENSHOT 10: FITUR ASISTENSI CERDAS AI]**
> *Petunjuk Tangkapan Layar: Tangkap bagian tab/panel AI Gemini Flash saat memunculkan hasil Ringkasan Eksekutif dan Tombol Aksi AI.*

#### A. Perumusan Ringkasan Eksekutif Otomatis
* **Kegunaan:** Mengubah poin-poin catatan rapat yang panjang dan dinamis menjadi rangkuman terstruktur, formal, dan padat untuk bahan laporan cepat kepada pimpinan.
* **Cara Menggunakan:**
  1. Klik tombol **"Buat Ringkasan AI"**.
  2. Tunggu beberapa detik selama indikator proses shimmer/berkedip berjalan.
  3. Narasi ringkasan eksekutif akan ditampilkan secara otomatis dalam paragraf formal kedinasan.
  4. Tersedia tombol **"Salin Teks"** untuk menyalin isi ringkasan ke papan klip komputer.

#### B. Rekomendasi Solusi & Terobosan Baru
* **Kegunaan:** Memberikan masukan strategis berbasis data mengenai alternatif kebijakan, manajemen risiko lapangan, serta langkah solutif teknis di bidang infrastruktur berdasarkan topik yang dibahas.
* **Cara Menggunakan:** Klik tombol **"Ide & Rekomendasi AI"**, lalu tinjau poin-poin rekomendasi yang dihasilkan.

#### C. Ekstraksi Otomatis Action Items
* **Kegunaan:** Membaca keseluruhan dinamika rapat untuk mendeteksi kesepakatan tindak lanjut yang mungkin belum terdaftar di tabel rencana aksi.
* **Cara Menggunakan:** Klik tombol **"Deteksi Action Items AI"**, lalu tinjau tugas yang diusulkan oleh sistem untuk dimasukkan ke daftar pekerjaan tim.

---

### 6.3 Checklist Status Tindak Lanjut (*Interactive Action Items*)
Pada bagian daftar rencana tindak lanjut:
* Setiap baris tugas dilengkapi dengan **Kotak Centang (Checkbox) Interaktif**.
* Jika suatu tugas telah diselesaikan oleh staf/PIC terkait, klik kotak centang tersebut.
* Sistem akan otomatis memperbarui status menjadi **Selesai (Completed)** dengan penanda coret garis halus dan status tersimpan langsung ke basis data tanpa perlu menyunting ulang formulir.

---

### 6.4 Manajemen Dokumen Lampiran (Upload, Preview Modal, Unduh)
Rapat kedinasan kerap melibatkan bahan paparan, surat undangan, daftar hadir tertandatangan, atau dokumentasi foto lapangan:
1. **Mengunggah Lampiran:**
   * Gulir ke bagian **"Lampiran Berkas"**.
   * Klik tombol **"+ Unggah Berkas"**.
   * Pilih berkas dari komputer (didukung: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.jpg`, `.png` hingga ukuran maksimal 10 MB).
   * Klik **"Simpan / Unggah"**.
2. **Membuka Pratinjau Langsung (Preview Modal):**
   * Klik ikon **Mata (Pratinjau)** pada kartu lampiran.
   * Jendela pratinjau mewah (*Luxury Preview Modal*) akan terbuka di layar tanpa perlu mengunduh file terlebih dahulu.
3. **Mengunduh Berkas:**
   * Klik tombol **Unduh** untuk menyimpan salinan file ke perangkat Anda.

> 📸 **[TEMPATKAN SCREENSHOT 11: MODAL PRATINJAU LAMPIRAN BERKAS]**
> *Petunjuk Tangkapan Layar: Buka pratinjau salah satu berkas lampiran PDF atau foto hingga jendela dialog "modal-preview-lampiran" terbuka penuh.*

---

### 6.5 Ekspor Dokumen Resmi (PDF Kedinasan & Microsoft Word)
Pada sudut atas halaman detail, tersedia dua tombol ekspor dokumen resmi berstandar tata naskah dinas:

#### 1. Ekspor ke PDF Resmi (`.pdf`)
* Klik tombol **"Cetak / Unduh PDF"**.
* Sistem akan secara otomatis mengompilasi seluruh data rapat (Kop Resmi Bappeda Provinsi Maluku Utara, detail waktu, susunan peserta, poin risalah rapat, rencana tindak lanjut, dan kolom pengesahan tanda tangan pimpinan rapat lengkap ber-NIP).
* File PDF akan langsung terunduh dan siap untuk dicetak fisik atau dibagikan sebagai dokumen resmi kedinasan.

#### 2. Ekspor ke Microsoft Word (`.docx`)
* Klik tombol **"Unduh Word (DOCX)"**.
* Dokumen berformat Word akan dibuat secara otomatis dengan tipografi kedinasan rapi.
* Sangat bermanfaat jika notulis perlu menambahkan catatan redaksional khusus atau lampiran tambahan sebelum diajukan ke sekretariat.

---

## BAB VII: PANDUAN PENGATURAN SISTEM & KEAMANAN DATA

Menu **Pengaturan** (`#/pengaturan`) digunakan oleh pengelola sistem atau staf administrasi untuk memelihara kestabilan dan keamanan arsip data.

> 📸 **[TEMPATKAN SCREENSHOT 12: HALAMAN PENGATURAN SISTEM]**
> *Petunjuk Tangkapan Layar: Buka menu `#/pengaturan`. Tangkap kartu Sakelar Tema (Sun/Moon), panel Backup Basis Data, dan panel Restore Basis Data.*

---

### 7.1 Manajemen Preferensi Tema Tampilan
1. Buka halaman **Pengaturan**.
2. Pada kartu **"Preferensi Tampilan & Tema"**, klik sakelar toggle bergambar animasi Matahari & Bulan (*Uiverse Toggle*).
3. Tampilan aplikasi akan seketika beralih antara **Mode Terang** dan **Mode Gelap**.
4. Pilihan Anda akan tersimpan secara otomatis pada peramban komputer Anda.

---

### 7.2 Pencadangan Basis Data (*Backup MySQL*)
Untuk mencegah risiko kehilangan data akibat kerusakan perangkat keras server:
1. Gulir ke bagian **"Cadangkan Basis Data (Backup MySQL)"**.
2. Klik tombol **"Unduh Cadangan SQL Sekarang"**.
3. Sistem akan menghasilkan berkas cadangan dengan format nama:
   `backup_rapatinai_YYYY-MM-DD_HH-mm-ss.sql`
4. Simpan berkas ini di penyimpanan aman (misalnya *flashdisk* kedinasan atau *cloud storage* resmi instansi).

---

### 7.3 Pemulihan Basis Data (*Restore Database*)
Fitur ini digunakan saat Anda ingin mengembalikan seluruh arsip rapat dari berkas cadangan masa lalu:
1. Buka bagian **"Pemulihan Basis Data (Restore Database)"**.
2. Klik tombol **"Pilih Berkas Cadangan (.sql)"** dan cari file `.sql` yang valid.
3. Klik tombol **"Mulai Pemulihan Data"**.
4. Sistem akan menampilkan dialog konfirmasi keamanan (Peringatan: Data yang ada saat ini akan diselaraskan dengan data cadangan).
5. Konfirmasi persetujuan, lalu tunggu hingga muncul notifikasi pemulihan berhasil.

> 📸 **[TEMPATKAN SCREENSHOT 13: LOG RIWAYAT CADANGAN BASIS DATA]**
> *Petunjuk Tangkapan Layar: Tangkap tabel riwayat log unduhan backup pada halaman pengaturan yang memperlihatkan nama berkas, ukuran, dan tanggal pencadangan.*

---

### 7.4 Pemantauan Riwayat Cadangan Data
Di bawah panel backup, terdapat tabel **Riwayat Log Cadangan** yang mencatat setiap kali aktivitas unduh cadangan dilakukan (dilengkapi stempel waktu dan ukuran berkas) untuk mempermudah audit administrasi IT.

---

## BAB VIII: TANYA JAWAB & PEMECAHAN MASALAH (FAQ)

#### Q1: Ketikan saya tiba-tiba hilang karena listrik padam atau tab browser tertutup. Bagaimana cara mengembalikannya?
**Jawaban:**
Buka kembali aplikasi web NIPW, lalu klik menu **Rapat Baru**. Di bagian atas formulir akan muncul kotak informasi pemulihan draf berwarna emas. Klik tombol **"Pulihkan Draf"**, maka seluruh judul, pimpinan, peserta, dan poin-poin yang Anda ketikkan sebelum browser tertutup akan kembali seketika.

#### Q2: Mengapa tombol "Simpan Notulen" tidak dapat diklik atau memunculkan peringatan?
**Jawaban:**
Periksa kembali formulir Anda. Pastikan kolom-kolom pokok kedinasan telah terisi:
1. Topik Rapat tidak boleh kosong.
2. Tanggal Pelaksanaan Rapat harus valid.
3. Nama Pimpinan Rapat dan Jabatan Resmi wajib terisi.
4. Minimal terdapat 1 (satu) baris poin pembahasan notula.

#### Q3: Mengapa fitur Kecerdasan Buatan (AI) memunculkan pesan "Sedang Sibuk / Batas Frekuensi Tercapai"?
**Jawaban:**
Fitur AI menggunakan pengamanan laju permintaan (*Rate Limiter*) untuk mencegah beban server berlebih. Jika Anda baru saja mengklik tombol AI, beri jeda sekitar 10–15 detik sebelum menekan tombol AI berikutnya. Pastikan juga server terhubung dengan akses internet untuk berkomunikasi dengan Google Gemini API.

#### Q4: Format berkas apa saja yang diperbolehkan untuk Lampiran Dokumen?
**Jawaban:**
Sistem mendukung dokumen PDF (`.pdf`), Microsoft Word (`.doc`, `.docx`), Microsoft Excel (`.xls`, `.xlsx`), Microsoft PowerPoint (`.ppt`, `.pptx`), dan gambar dokumentasi (`.jpg`, `.jpeg`, `.png`) dengan batasan ukuran berkas maksimum 10 MB per file.

#### Q5: Apakah dokumen PDF yang diunduh sudah sesuai dengan tata naskah dinas resmi?
**Jawaban:**
Ya, template ekspor PDF NIPW telah dikonfigurasi dengan tata letak resmi Bappeda Provinsi Maluku Utara (Bidang Infrastruktur dan Kewilayahan), menggunakan margin standar kedinasan, penataan tabel terstruktur, dan blok tanda tangan pejabat yang dilengkapi NIP 18-digit yang sah.

---

*Modul Dokumen Panduan ini disusun untuk standarisasi operasional sistem NIPW (Notulensi Infrastruktur dan Pengembangan Wilayah).*  
*Hak Cipta © 2026 NIPW - Bidang Infrastruktur dan Kewilayahan.*
