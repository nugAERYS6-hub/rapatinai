<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Konfigurasi Kop Surat & Identitas Instansi (Dinamis)
    |--------------------------------------------------------------------------
    |
    | Berkas konfigurasi ini mengatur parameter identitas instansi untuk
    | kop surat resmi pada laporan rapat (PDF DomPDF, Word PhpWord,
    | dan Pratinjau Dokumen).
    |
    | Setiap nilai dapat dikustomisasi secara fleksibel melalui berkas .env
    | ataupun langsung mengubah nilai default di bawah ini.
    |
    */

    // Nama Pemerintah Daerah / Provinsi / Kabupaten / Kota
    'pemerintah'   => env('INSTANSI_PEMERINTAH', 'PEMERINTAH PROVINSI MALUKU UTARA'),

    // Nama Organisasi Perangkat Daerah (OPD) / Badan / Dinas
    'opd'          => env('INSTANSI_OPD', 'BADAN PERENCANAAN PEMBANGUNAN DAERAH'),

    // Singkatan OPD (opsional, misal BAPPEDA, DISKOMINFO, BPKAD)
    'opd_singkat'  => env('INSTANSI_OPD_SINGKAT', 'BAPPEDA'),

    // Alamat lengkap kantor instansi
    'alamat'       => env('INSTANSI_ALAMAT', 'Jl. Raya Lintas Halmahera, Gosale Puncak, Sofifi, Maluku Utara 97827'),

    // Kontak resmi, website, email, dan saluran komunikasi
    'kontak'       => env('INSTANSI_KONTAK', 'Laman: bappeda.malutprov.go.id | Pos-el: bappeda@malutprov.go.id'),

    // Nama file atau path logo instansi (relatif terhadap folder public/ atau storage/)
    'logo_path'    => env('INSTANSI_LOGO_PATH', 'logo-bappeda.jpg'),
];
