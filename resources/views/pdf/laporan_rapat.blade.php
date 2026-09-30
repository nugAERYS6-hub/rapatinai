<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Laporan Hasil Rapat - {{ $rapat->topik }}</title>
    <style>
        @page {
            margin: 40px 50px 50px 50px;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.45;
            color: #000;
        }
        .kop-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
        }
        .kop-logo {
            width: 75px;
            vertical-align: middle;
            text-align: left;
        }
        .kop-logo img {
            width: 65px;
            height: auto;
        }
        .kop-text {
            text-align: center;
            vertical-align: middle;
        }
        .kop-text h3 {
            margin: 0;
            font-size: 12pt;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .kop-text h2 {
            margin: 2px 0;
            font-size: 13.5pt;
            font-weight: bold;
        }
        .kop-text p {
            margin: 1px 0;
            font-size: 8.5pt;
        }
        .kop-line-thick {
            border-top: 2.5px solid #000;
            margin-top: 5px;
            margin-bottom: 1.5px;
        }
        .kop-line-thin {
            border-top: 1px solid #000;
            margin-bottom: 18px;
        }
        .judul-doc {
            text-align: center;
            margin-bottom: 18px;
        }
        .judul-doc .h1 {
            font-size: 12.5pt;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .judul-doc .h2 {
            font-size: 11.5pt;
            font-weight: bold;
            margin-top: 2px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .meta-table td {
            padding: 2px 0;
            vertical-align: top;
            font-size: 10.5pt;
        }
        .meta-label {
            width: 150px;
        }
        .meta-colon {
            width: 15px;
            text-align: center;
        }
        .pembuka {
            text-align: justify;
            margin-bottom: 10px;
            font-size: 10.5pt;
        }
        .poin-item {
            margin-bottom: 6px;
            text-align: justify;
            font-size: 10.5pt;
        }
        .sign-table {
            width: 100%;
            margin-top: 35px;
            page-break-inside: avoid;
        }
        .sign-table td {
            width: 50%;
            vertical-align: top;
            font-size: 10.5pt;
        }
        .sign-name {
            font-weight: bold;
            margin-top: 60px;
        }
        .page-break {
            page-break-before: always;
        }
        .lampiran-title {
            text-align: center;
            font-weight: bold;
            font-size: 11.5pt;
            margin-bottom: 14px;
        }
        .peserta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-top: 8px;
        }
        .peserta-table th, .peserta-table td {
            border: 1px solid #000;
            padding: 5px 8px;
        }
        .peserta-table th {
            background-color: #f2f2f2;
            text-align: left;
        }
        .section-box {
            margin-top: 20px;
            border-top: 1px dashed #666;
            padding-top: 12px;
        }
        .section-box-title {
            font-weight: bold;
            font-size: 11pt;
            margin-bottom: 6px;
        }
        .section-box-content {
            font-size: 10pt;
            text-align: justify;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <!-- KOP SURAT RESMI -->
    <table class="kop-table">
        <tr>
            <td class="kop-logo">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo BAPPEDA"/>
                @endif
            </td>
            <td class="kop-text">
                <h3>PEMERINTAH PROVINSI MALUKU UTARA</h3>
                <h2>BADAN PERENCANAAN PEMBANGUNAN DAERAH</h2>
                <p>Jl. Raya Lintas Halmahera, Gosale Puncak, Sofifi, Maluku Utara 97827</p>
                <p>Laman: bappeda.malutprov.go.id &nbsp;|&nbsp; Pos-el: bappeda@malutprov.go.id</p>
            </td>
        </tr>
    </table>
    <div class="kop-line-thick"></div>
    <div class="kop-line-thin"></div>

    <!-- JUDUL LAPORAN -->
    <div class="judul-doc">
        <div class="h1">LAPORAN HASIL RAPAT</div>
        <div class="h2">{{ strtoupper($rapat->topik) }}</div>
    </div>

    <!-- METADATA RAPAT -->
    <table class="meta-table">
        <tr>
            <td class="meta-label">Hari / tanggal</td>
            <td class="meta-colon">:</td>
            <td>{{ \App\Models\Rapat::formatHariTanggal($rapat->tanggal) }}</td>
        </tr>
        <tr>
            <td class="meta-label">Waktu</td>
            <td class="meta-colon">:</td>
            <td>{{ $rapat->waktu ?: '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Tempat</td>
            <td class="meta-colon">:</td>
            <td>{{ $rapat->tempat ?: '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Pemimpin rapat</td>
            <td class="meta-colon">:</td>
            <td>{{ $rapat->pimpinanRapat ?: '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Notulen</td>
            <td class="meta-colon">:</td>
            <td>{{ $rapat->notulis ?: '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Peserta</td>
            <td class="meta-colon">:</td>
            <td>Terlampir</td>
        </tr>
        <tr>
            <td class="meta-label">Hasil rapat</td>
            <td class="meta-colon">:</td>
            <td></td>
        </tr>
    </table>

    <div class="pembuka">
        Rapat dibuka oleh {{ $rapat->pimpinanRapat ?: 'Pimpinan Rapat' }} yang menjelaskan mengenai :
    </div>

    <!-- POIN-POIN PEMBAHASAN -->
    <div style="margin-left: 15px; margin-bottom: 25px;">
        @php
            $poinList = \App\Models\Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        @endphp
        @forelse($poinList as $idx => $p)
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
                <tr>
                    <td style="width: 25px; vertical-align: top; font-size: 10.5pt;">{{ $idx + 1 }}.</td>
                    <td style="vertical-align: top; text-align: justify; font-size: 10.5pt;">{{ is_array($p) ? ($p['isi'] ?? '') : $p }}</td>
                </tr>
            </table>
        @empty
            <p style="font-style: italic; color: #555;">- Tidak ada catatan hasil rapat -</p>
        @endforelse
    </div>

    <!-- TANDA TANGAN -->
    <table class="sign-table">
        <tr>
            <td style="text-align: left; padding-left: 20px;">
                Pemimpin rapat,<br/>
                <div class="sign-name">{{ $rapat->pimpinanRapat ?: '-' }}</div>
            </td>
            <td style="text-align: left; padding-left: 20px;">
                Notulen,<br/>
                <div class="sign-name">{{ $rapat->notulis ?: '-' }}</div>
            </td>
        </tr>
    </table>

    <!-- LAMPIRAN PESERTA -->
    @php
        $anggotaList = \App\Models\Rapat::parseAnggota($rapat->anggota);
    @endphp
    @if(count($anggotaList) > 0)
        <div class="page-break"></div>
        <div class="lampiran-title">LAMPIRAN: DAFTAR HADIR PESERTA RAPAT</div>
        <table class="peserta-table">
            <thead>
                <tr>
                    <th style="width: 35px; text-align: center;">No</th>
                    <th>Nama Peserta</th>
                    <th>Jabatan</th>
                    <th>Instansi / Unit</th>
                </tr>
            </thead>
            <tbody>
                @foreach($anggotaList as $idx => $a)
                    <tr>
                        <td style="text-align: center;">{{ $idx + 1 }}</td>
                        <td style="font-weight: bold;">{{ $a['nama'] ?? '-' }}</td>
                        <td>{{ $a['jabatan'] ?? '-' }}</td>
                        <td>{{ $a['asalInstansi'] ?? '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- RINGKASAN & REKOMENDASI AI (JIKA ADA) -->
    @if(!empty($rapat->ringkasanAI) || !empty($rapat->ideBaruAI))
        <div class="section-box">
            @if(!empty($rapat->ringkasanAI))
                <div class="section-box-title">Ringkasan:</div>
                <div class="section-box-content">
                    {!! nl2br(e(\App\Services\GeminiService::bersihkanRingkasan($rapat->ringkasanAI))) !!}
                </div>
            @endif

            @if(!empty($rapat->ideBaruAI))
                <div class="section-box-title" style="margin-top: 15px;">REKOMENDASI STRATEGIS (AI):</div>
                <div class="section-box-content">
                    {!! nl2br(e($rapat->ideBaruAI)) !!}
                </div>
            @endif
        </div>
    @endif
</body>
</html>
