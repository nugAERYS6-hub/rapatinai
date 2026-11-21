# DOKUMEN DIAGRAM COMPUTATIONAL THINKING
**Mata Kuliah:** Pemrograman Terstruktur [+Praktikum] (4 SKS)  
**Proyek:** Sistem Notulensi Infrastruktur dan Pengembangan Wilayah (NIPW / RapatinAI)

---

## 1. Diagram Kerangka Kerja 4 Pilar Computational Thinking

```mermaid
flowchart TD
    subgraph Problem["MASALAH NYATA KEDINASAN"]
        P1["Catatan rapat tidak terstruktur, tercecer, dan rawan hilang"]
        P2["Penyusunan ringkasan dan tindak lanjut memakan waktu lama"]
    end

    subgraph Core["COMPUTATIONAL THINKING PADA NIPW"]
        direction TB

        subgraph D1["1. Dekomposisi (Decomposition)"]
            M1["Modul Entri & Form Rapat"]
            M2["Modul Manajemen Peserta"]
            M3["Modul AI Summarization & Action Items"]
            M4["Modul Ekspor PDF & DOCX"]
            M5["Modul Backup & Parser Restore SQL"]
        end

        subgraph D2["2. Pengenalan Pola (Pattern Recognition)"]
            PT1["Pola Siklus Hidup CRUD Notulen"]
            PT2["Pola Relasi Master-Detail (1:N)"]
            PT3["Standardisasi JSON Response API"]
            PT4["Format Template Dokumen Kedinasan"]
        end

        subgraph D3["3. Abstraksi (Abstraction)"]
            AB1["Entitas Esensial: Rapat, Peserta, Action Items"]
            AB2["Mekanisme Soft Delete (deleted_at)"]
            AB3["Penyaringan Query Aman pada SQL Parser"]
            AB4["Abstraksi State Management (Vanilla JS SPA)"]
        end

        subgraph D4["4. Perancangan Algoritma (Algorithm Design)"]
            AL1["Algoritma Validasi & DB Transaction"]
            AL2["Algoritma Debounce Autosave Draf"]
            AL3["Algoritma Parsing Output AI ke Schema JSON"]
            AL4["Algoritma Ekspor & Compiling Dokumen"]
        end
    end

    subgraph Solution["HASIL & LUARAN SISTEM"]
        S1["Sistem NIPW Terstruktur, Modular, dan Teruji"]
        S2["Dokumen Notulen Resmi Standar Pemerintah"]
    end

    Problem --> Core
    D1 --> Solution
    D2 --> Solution
    D3 --> Solution
    D4 --> Solution
```

---

## 2. Diagram Dekomposisi Arsitektur Sistem Terstruktur

```mermaid
flowchart TD
    App["SISTEM INFORMASI NIPW"]

    App --> UI["Lapisan Antarmuka (Presentation Layer)"]
    App --> Logic["Lapisan Logika Terstruktur (Logic/Controller Layer)"]
    App --> Data["Lapisan Data & Persistensi (Data Layer)"]
    App --> Service["Lapisan Layanan Eksternal (Service Layer)"]

    UI --> U1["Beranda & Statistik Kedinasan"]
    UI --> U2["Formulir Notulen & Draf Otomatis"]
    UI --> U3["Riwayat Rapat & Tempat Sampah"]
    UI --> U4["Panel Backup & Restore Database"]

    Logic --> L1["RapatController (CRUD & Validasi)"]
    Logic --> L2["AiController (Pipeline Gemini API)"]
    Logic --> L3["LampiranController (I/O File Storage)"]
    Logic --> L4["BackupController (SQL Dump & Restore Parser)"]

    Data --> D_Rapat[("Tabel rapats")]
    Data --> D_Peserta[("Tabel pesertas")]
    Data --> D_Lampiran[("Tabel lampirans")]
    Data --> D_Action[("Tabel action_items")]
    Data --> D_Backup[("Tabel riwayat_backups")]

    Service --> S_AI["Google Gemini AI API"]
    Service --> S_PDF["DomPDF Engine"]
    Service --> S_Word["PHPWord Engine"]
```

---

## 3. Diagram Alir Algoritma Penyimpanan Rapat Terstruktur

```mermaid
flowchart TD
    Start(["Mulai"]) --> Input["Input Data Rapat & Peserta"]
    Input --> Validasi{"Apakah field wajib lengkap?<br/>(Topik, Tanggal, dll)"}

    Validasi -- "Tidak" --> ErrVal["Kembalikan Pesan Error Validasi (HTTP 422)"]
    ErrVal --> EndFail(["Selesai (Gagal)"])

    Validasi -- "Ya" --> BeginTx["Buka Transaksi Basis Data<br/>(DB::beginTransaction)"]
    BeginTx --> InsertRapat["Insert Data Utama ke Tabel rapats"]
    InsertRapat --> GetId["Ambil Generated rapat_id"]

    GetId --> LoopPeserta{"Ada data peserta<br/>dalam antrean?"}

    LoopPeserta -- "Ya" --> InsertPeserta["Insert Peserta dengan rapat_id terkait"]
    InsertPeserta --> LoopPeserta

    LoopPeserta -- "Selesai / Kosong" --> CekTx{"Apakah seluruh eksekusi<br/>kueri berhasil?"}

    CekTx -- "Ya" --> Commit["Komit Transaksi Basis Data<br/>(DB::commit)"]
    Commit --> ResponSukses["Kembalikan JSON Sukses (HTTP 201)"]
    ResponSukses --> EndSuccess(["Selesai (Berhasil)"])

    CekTx -- "Terjadi Eksepsi" --> Rollback["Batalkan Seluruh Perubahan<br/>(DB::rollBack)"]
    Rollback --> ResponError["Kembalikan Pesan Error Sistem (HTTP 500)"]
    ResponError --> EndFail
```

---

## 4. Entity-Relationship Diagram (ERD Basis Data Terstruktur)

```mermaid
erDiagram
    RAPAT ||--o{ PESERTA : "memiliki (1:N)"
    RAPAT ||--o{ LAMPIRAN : "memiliki (1:N)"
    RAPAT ||--o{ ACTION_ITEM : "menghasilkan (1:N)"
    PENGGUNA ||--o{ RIWAYAT_BACKUP : "mencatat (1:N)"

    RAPAT {
        bigint id PK
        string topik
        date tanggal
        time waktu_mulai
        time waktu_selesai
        string pimpinan_rapat
        string notulis
        text catatan_rapat
        text ringkasan_ai
        timestamp deleted_at "Soft Delete"
    }

    PESERTA {
        bigint id PK
        bigint rapat_id FK
        string nama
        string jabatan
        string asal_instansi
    }

    LAMPIRAN {
        bigint id PK
        bigint rapat_id FK
        string nama_asli
        string path_file
        bigint ukuran_bytes
    }

    ACTION_ITEM {
        bigint id PK
        bigint rapat_id FK
        string tugas
        string pic
        date batas_waktu
        enum prioritas
    }

    RIWAYAT_BACKUP {
        bigint id PK
        string nama_file
        string status
        bigint ukuran_bytes
        timestamp waktu_backup
    }

    PENGGUNA {
        bigint id PK
        string nama
        string email
    }
```
