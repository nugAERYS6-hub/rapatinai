<?php

namespace App\Services\Rapat;

use App\Models\Rapat;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\Style\Font;

class ExportService
{
    public static function generatePdf(Rapat $rapat)
    {
        $logoPath = public_path('logo-bappeda.jpg');
        if (!file_exists($logoPath)) {
            $logoPath = base_path('../public/logo-bappeda.jpg');
        }

        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $type = pathinfo($logoPath, PATHINFO_EXTENSION);
            $data = file_get_contents($logoPath);
            $logoBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
        }

        $pdf = Pdf::loadView('pdf.laporan_rapat', [
            'rapat' => $rapat,
            'logoBase64' => $logoBase64,
        ])->setPaper('a4', 'portrait');

        $safeTopic = preg_replace('/[^a-zA-Z0-9-_]/', '_', $rapat->topik);
        $fileName = "Laporan_Rapat_{$safeTopic}_{$rapat->tanggal}.pdf";

        return $pdf->download($fileName);
    }

    public static function generateWord(Rapat $rapat)
    {
        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(11);

        $section = $phpWord->addSection([
            'marginTop' => 1440,
            'marginBottom' => 1440,
            'marginLeft' => 1440,
            'marginRight' => 1440,
        ]);

        $section->addText("PEMERINTAH PROVINSI MALUKU UTARA", [
            'bold' => true, 'size' => 12, 'name' => 'Arial'
        ], ['alignment' => Jc::CENTER, 'spaceAfter' => 60]);

        $section->addText("BADAN PERENCANAAN PEMBANGUNAN DAERAH (BAPPEDA)", [
            'bold' => true, 'size' => 14, 'name' => 'Arial'
        ], ['alignment' => Jc::CENTER, 'spaceAfter' => 60]);

        $section->addText("Jalan Raya Lintas Halmahera, Gosale Puncak, Kota Sofifi, Maluku Utara 97852", [
            'italic' => true, 'size' => 9, 'name' => 'Arial'
        ], ['alignment' => Jc::CENTER, 'spaceAfter' => 120]);

        $section->addLine([
            'weight' => 2, 'width' => 450, 'height' => 0, 'color' => '000000'
        ]);
        $section->addTextBreak(1);

        $section->addText("NOTULEN RAPAT KEDINASAN", [
            'bold' => true, 'size' => 13, 'underline' => 'single', 'name' => 'Arial'
        ], ['alignment' => Jc::CENTER, 'spaceAfter' => 180]);

        $tableStyle = [
            'borderSize' => 0,
            'borderColor' => 'FFFFFF',
            'cellMargin' => 50,
        ];
        $phpWord->addTableStyle('InfoTable', $tableStyle);
        $table = $section->addTable('InfoTable');

        $infoRows = [
            ['Hari / Tanggal', ': ' . $rapat->tanggal],
            ['Waktu', ': ' . ($rapat->waktu ?: '-')],
            ['Tempat', ': ' . ($rapat->tempat ?: '-')],
            ['Acara / Topik', ': ' . $rapat->topik],
            ['Pimpinan Rapat', ': ' . $rapat->pimpinanRapat],
            ['Notulis', ': ' . $rapat->notulis],
        ];

        foreach ($infoRows as $row) {
            $table->addRow();
            $table->addCell(2500)->addText($row[0], ['bold' => true, 'size' => 10]);
            $table->addCell(6500)->addText($row[1], ['size' => 10]);
        }

        $section->addTextBreak(1);

        $section->addText("I. DAFTAR PESERTA RAPAT", ['bold' => true, 'size' => 11], ['spaceAfter' => 120]);
        $anggotaList = Rapat::parseAnggota($rapat->anggota);
        if (count($anggotaList) > 0) {
            $pesertaTable = $section->addTable([
                'borderSize' => 6,
                'borderColor' => '999999',
                'cellMargin' => 60,
            ]);
            $pesertaTable->addRow();
            $pesertaTable->addCell(800)->addText("No", ['bold' => true, 'size' => 9]);
            $pesertaTable->addCell(3500)->addText("Nama", ['bold' => true, 'size' => 9]);
            $pesertaTable->addCell(2500)->addText("Jabatan", ['bold' => true, 'size' => 9]);
            $pesertaTable->addCell(2200)->addText("Instansi", ['bold' => true, 'size' => 9]);

            foreach ($anggotaList as $idx => $a) {
                $pesertaTable->addRow();
                $pesertaTable->addCell(800)->addText((string)($idx + 1), ['size' => 9]);
                $pesertaTable->addCell(3500)->addText($a['nama'] ?? '-', ['size' => 9]);
                $pesertaTable->addCell(2500)->addText($a['jabatan'] ?? '-', ['size' => 9]);
                $pesertaTable->addCell(2200)->addText($a['asalInstansi'] ?? '-', ['size' => 9]);
            }
        } else {
            $section->addText("-", ['size' => 10]);
        }

        $section->addTextBreak(1);

        $section->addText("II. NOTULENSI & HASIL PEMBAHASAN", ['bold' => true, 'size' => 11], ['spaceAfter' => 120]);
        $poinList = Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        if (count($poinList) > 0) {
            foreach ($poinList as $idx => $p) {
                $section->addListItem(
                    ($p['isi'] ?? '-') . " [Status: " . ($p['keputusan'] ?? 'Disetujui') . "]",
                    0,
                    ['size' => 10],
                    ['spaceAfter' => 60]
                );
            }
        } else {
            $section->addText("-", ['size' => 10]);
        }

        if (!empty($rapat->ringkasanAI)) {
            $section->addTextBreak(1);
            $section->addText("III. RINGKASAN EKSEKUTIF (AI)", ['bold' => true, 'size' => 11], ['spaceAfter' => 120]);
            $cleanRingkasan = GeminiService::bersihkanRingkasan($rapat->ringkasanAI);
            $section->addText($cleanRingkasan, ['size' => 10, 'italic' => false], [
                'alignment' => Jc::BOTH,
                'spaceAfter' => 120
            ]);
        }

        if (!empty($rapat->ideBaruAI)) {
            $section->addTextBreak(1);
            $section->addText("IV. REKOMENDASI STRATEGIS & TINDAK LANJUT", ['bold' => true, 'size' => 11], ['spaceAfter' => 120]);
            $section->addText($rapat->ideBaruAI, ['size' => 10], [
                'alignment' => Jc::BOTH,
                'spaceAfter' => 120
            ]);
        }

        $section->addTextBreak(2);
        $ttdTable = $section->addTable(['borderSize' => 0, 'borderColor' => 'FFFFFF']);
        $ttdTable->addRow();
        $cellKiri = $ttdTable->addCell(4500);
        $cellKanan = $ttdTable->addCell(4500);

        $cellKiri->addText("Notulis,", ['size' => 10], ['alignment' => Jc::CENTER]);
        $cellKiri->addTextBreak(3);
        $cellKiri->addText($rapat->notulis, ['bold' => true, 'size' => 10, 'underline' => 'single'], ['alignment' => Jc::CENTER]);

        $cellKanan->addText("Pimpinan Rapat,", ['size' => 10], ['alignment' => Jc::CENTER]);
        $cellKanan->addTextBreak(3);
        $cellKanan->addText($rapat->pimpinanRapat, ['bold' => true, 'size' => 10, 'underline' => 'single'], ['alignment' => Jc::CENTER]);

        $safeTopic = preg_replace('/[^a-zA-Z0-9-_]/', '_', $rapat->topik);
        $fileName = "Laporan_Rapat_{$safeTopic}_{$rapat->tanggal}.docx";
        $tempPath = storage_path("app/{$fileName}");

        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempPath);

        return response()->download($tempPath, $fileName)->deleteFileAfterSend(true);
    }
}
