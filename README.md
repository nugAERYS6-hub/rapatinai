# RapatinAI

Aplikasi Notulensi & Manajemen Hasil Rapat Eksekutif berbasis web dengan integrasi AI (Google Gemini Flash) untuk perumusan Ringkasan Eksekutif, Rekomendasi Strategis, dan Ekspor Dokumen Resmi (PDF & Word).

---

## 🛠️ Arsitektur & Teknologi

- **Backend:** PHP 8.2+ dengan Framework **Laravel 12**
- **Database:** **MySQL** (Database: `rapatinai`, Tabel: `rapat`)
- **Frontend:** Vanilla HTML5, CSS3, & Modern JavaScript (Tanpa build step, reactive client UI)
- **AI Engine:** Google Gemini Flash (`gemini-3.8-flash` & `gemini-3.6-flash`)
- **Dokumen Generator:**
  - PDF: `barryvdh/laravel-dompdf` (Kop Resmi Bappeda Provinsi Maluku Utara)
  - Word: `phpoffice/phpword` (DOCX format standar kedinasan)

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- PHP >= 8.2 (dengan ekstensi `pdo_mysql`, `gd`, `zip`, `dom`, `xml`, `mbstring`, `curl`)
- MySQL / MariaDB (misal via XAMPP)
- Composer

### 2. Konfigurasi Database
Pastikan database MySQL bernama `rapatinai` sudah dibuat dan service MySQL aktif di port 3306.
Konfigurasi database dan API key di file `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rapatinai
DB_USERNAME=root
DB_PASSWORD=

GEMINI_API_KEY=your_api_key_here
```

### 3. Migrasi & Seed Data
Jika migrasi belum dijalankan:
```bash
php artisan migrate
```

Untuk memindahkan data lama dari SQLite ke MySQL:
```bash
php artisan db:seed --class=SqliteDataSeeder
```

### 4. Menjalankan Server
Jalankan development server Laravel:
```bash
php artisan serve
```
Akses aplikasi melalui peramban web di:
👉 **http://127.0.0.1:8000**

---

## 🧪 Pengujian Otomatis (Feature Tests)
Untuk menjalankan suite test otomatis untuk seluruh endpoint CRUD, PDF, dan Word:
```bash
php artisan test --filter=RapatApiTest
```

---

## 🔒 Keamanan & Proteksi API

Seluruh endpoint API pada RapatinAI telah dilengkapi lapisan perlindungan tingkat enterprise:
1. **Otorisasi API Key (`EnsureApiAuthorized`)**:
   - Memvalidasi header `X-API-KEY` (atau `Authorization: Bearer <token>`) sesuai kunci yang dikonfigurasi pada `.env` (`RAPATIN_API_KEY`).
   - Endpoint sensitif seperti `/api/backup/mysql` dan `/api/backup/restore` secara ketat mewajibkan kunci API yang sah.
   - Frontend SPA menyertakan interceptor `window.fetch` otomatis untuk menyematkan `X-API-KEY` dan `X-Requested-With: XMLHttpRequest`.
2. **Parser & Validator Restore SQL (`SqlRestoreParser`)**:
   - Memproses dump SQL berbasis *State Machine* (menangani tanda titik koma `;` di dalam string notulensi, karakter escape, dan komentar tanpa merusak integritas data).
   - Membatasi eksekusi secara ketat ke tabel `rapat`. Perintah berbahaya seperti `DROP TABLE users`, `TRUNCATE`, `INTO OUTFILE`, atau manipulasi tabel sistem langsung diblokir.
3. **Rate Limiting (`RateLimiter`)**:
   - `throttle:api`: 60 permintaan/menit per IP untuk pembacaan data.
   - `throttle:crud`: 30 permintaan/menit per IP untuk penambahan/perubahan/penghapusan notulen.
   - `throttle:ai`: 10 permintaan/menit per IP untuk menjaga kuota panggilan Gemini API.
   - `throttle:backup`: 5 permintaan/menit per IP untuk mencegah *I/O exhaustion* pada database.
4. **Proteksi Produksi (`APP_DEBUG=false`)**:
   - Mode debug dinonaktifkan untuk mencegah kebocoran *stack trace*, variabel lingkungan, dan kredensial database.
   - Penanganan error API diseragamkan dalam format JSON yang aman dan informatif.

---

## 📡 Daftar REST API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Menampilkan antarmuka web (index.html) |
| `GET` | `/api/stats` | Statistik dashboard (total rapat, rapat bulan ini, ada AI) |
| `GET` | `/api/rapat` | Daftar rapat dengan pagination & pencarian |
| `GET` | `/api/rapat/{id}` | Detail lengkap satu notulen rapat |
| `POST` | `/api/rapat` | Membuat notulen rapat baru |
| `PUT` | `/api/rapat/{id}` | Memperbarui data notulen rapat |
| `DELETE` | `/api/rapat/{id}` | Menghapus notulen rapat |
| `POST` | `/api/rapat/{id}/rangkum` | Menghasilkan Ringkasan Eksekutif AI |
| `POST` | `/api/rapat/{id}/ide-baru` | Menghasilkan Rekomendasi Strategis AI |
| `POST` | `/api/rapat/{id}/action-items` | Menghasilkan Action Items tugas terstruktur AI |
| `GET` | `/api/rapat/{id}/export-pdf` | Mengunduh Laporan Resmi format PDF |
| `GET` | `/api/rapat/{id}/export-word` | Mengunduh Laporan Resmi format Word (DOCX) |
| `GET` | `/api/backup/mysql` | Mengunduh cadangan database MySQL (.sql) |
| `POST` | `/api/backup/restore` | Memulihkan database dari berkas backup .sql |

---

## 📁 Struktur Folder & File Berdasarkan Fungsi

Struktur folder telah dipisahkan secara modular berdasarkan menu dan fungsinya (Single Responsibility Principle):

```text
rapatinAI/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Rapat/                # Fungsi Menu Rapat Baru & Riwayat Rapat
│   │   │   │   ├── RapatController.php   (CRUD & Statistik)
│   │   │   │   ├── AiController.php      (Fitur AI: Ringkasan, Ide Baru, Action Items)
│   │   │   │   └── ExportController.php  (Ekspor PDF & Word)
│   │   │   ├── Pengaturan/           # Fungsi Menu Pengaturan
│   │   │   │   └── BackupController.php  (Backup & Restore Database)
│   │   │   └── RapatController.php   (Aggregator controller backward-compatible)
│   │   └── Requests/
│   │       ├── StoreRapatRequest.php
│   │       └── UpdateRapatRequest.php
│   └── Services/
│       ├── Rapat/                    # Service logika bisnis rapat
│       │   ├── GeminiService.php
│       │   └── ExportService.php
│       └── Pengaturan/               # Service pencadangan database
│           └── BackupService.php
│
├── public/
│   ├── css/                          # CSS Modular berdasarkan Menu & Fungsi
│   │   ├── shared/                   (variables, layout, components)
│   │   ├── rapat-baru/               (form notulen baru, input dinamis)
│   │   ├── riwayat/                  (panel riwayat, detail, AI suite, cetak)
│   │   ├── pengaturan/               (backup, tabel log, tema)
│   │   └── app.css                   (Master stylesheet @import)
│   ├── js/                           # JavaScript Modular berdasarkan Menu & Fungsi
│   │   ├── shared/                   (state registry, utils, ui & sidebar)
│   │   ├── rapat-baru/               (form handler, chips peserta, input dinamis, draf)
│   │   ├── riwayat/                  (riwayat list & filter, detail rapat, AI suite, ekspor)
│   │   ├── pengaturan/               (backup & restore database, tema switcher)
│   │   └── app.js                    (Master client orchestrator & router)
│   ├── stitch_screens/               # Mockup Layar Terkategori
│   │   ├── rapat_baru/               (Screen 1 & 2: Form Bagian 1, 2, 3)
│   │   ├── riwayat_rapat/            (Screen 3, 4, 5, 6: Detail, KOP, Lampiran)
│   │   └── index.html                (Penampil showcase koleksi layar)
│   ├── index.html                    (Halaman web utama single-page application)
│   ├── style.css                     (Proxy entrypoint ke css/app.css)
│   └── script.js                     (Proxy entrypoint ke js/app.js)
```

