<?php

namespace App\Services;

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
        $phpWord->setDefaultFontName('Times New Roman');
        $phpWord->setDefaultFontSize(11);

        $section = $phpWord->addSection([
            'marginTop' => 800,
            'marginBottom' => 800,
            'marginLeft' => 1000,
            'marginRight' => 1000,
        ]);

        // Kop Surat
        $section->addText("PEMERINTAH PROVINSI MALUKU UTARA", ['bold' => true, 'size' => 12], ['alignment' => Jc::CENTER, 'spaceAfter' => 20]);
        $section->addText("BADAN PERENCANAAN PEMBANGUNAN DAERAH", ['bold' => true, 'size' => 13], ['alignment' => Jc::CENTER, 'spaceAfter' => 20]);
        $section->addText("Jl. Raya Lintas Halmahera, Gosale Puncak, Sofifi, Maluku Utara 97827", ['size' => 9], ['alignment' => Jc::CENTER, 'spaceAfter' => 20]);
        $section->addText("Laman: bappeda.malutprov.go.id  |  Pos-el: bappeda@malutprov.go.id", ['size' => 8.5], ['alignment' => Jc::CENTER, 'spaceAfter' => 80]);

        // Garis Pembatas
        $tableGaris = $section->addTable(['width' => 100 * 50, 'unit' => 'pct']);
        $rowGaris = $tableGaris->addRow();
        $rowGaris->addCell(8000, [
            'borderBottomSize' => 18,
            'borderBottomColor' => '000000',
        ]);

        $section->addTextBreak(1);

        // Header Judul
        $section->addText("LAPORAN HASIL RAPAT", ['bold' => true, 'size' => 12.5], ['alignment' => Jc::CENTER, 'spaceAfter' => 40]);
        $section->addText(strtoupper($rapat->topik), ['bold' => true, 'size' => 11.5], ['alignment' => Jc::CENTER, 'spaceAfter' => 120]);

        // Metadata
        $metaList = [
            ["Hari / tanggal", Rapat::formatHariTanggal($rapat->tanggal)],
            ["Waktu", $rapat->waktu ?: "-"],
            ["Tempat", $rapat->tempat ?: "-"],
            ["Pemimpin rapat", $rapat->pimpinanRapat ?: "-"],
            ["Notulen", $rapat->notulis ?: "-"],
            ["Peserta", "Terlampir"],
            ["Hasil rapat", ""],
        ];

        $tableMeta = $section->addTable(['width' => 100 * 50, 'unit' => 'pct']);
        foreach ($metaList as [$lbl, $val]) {
            $row = $tableMeta->addRow(240);
            $row->addCell(2400)->addText($lbl, ['size' => 10.5]);
            $row->addCell(300)->addText(":", ['size' => 10.5]);
            $row->addCell(5300)->addText($val, ['size' => 10.5]);
        }

        $section->addTextBreak(1);
        $section->addText("Rapat dibuka oleh " . ($rapat->pimpinanRapat ?: "Pimpinan Rapat") . " yang menjelaskan mengenai :", ['size' => 10.5]);
        $section->addTextBreak(1);

        // Poin Pembahasan
        $poinList = Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        if (count($poinList) > 0) {
            foreach ($poinList as $idx => $p) {
                $teks = is_array($p) ? ($p['isi'] ?? '') : $p;
                $section->addText(($idx + 1) . ".  " . $teks, ['size' => 10.5], ['alignment' => Jc::BOTH, 'spaceAfter' => 40]);
            }
        } else {
            $section->addText("- Tidak ada catatan hasil rapat -", ['italic' => true, 'size' => 10.5]);
        }

        $section->addTextBreak(2);

        // Tanda Tangan
        $tableSign = $section->addTable(['width' => 100 * 50, 'unit' => 'pct']);
        $rowSign1 = $tableSign->addRow();
        $rowSign1->addCell(4000)->addText("Pemimpin rapat,", ['size' => 10.5]);
        $rowSign1->addCell(4000)->addText("Notulen,", ['size' => 10.5]);

        $rowSignSpace = $tableSign->addRow();
        $rowSignSpace->addCell(4000)->addTextBreak(3);
        $rowSignSpace->addCell(4000)->addTextBreak(3);

        $rowSign2 = $tableSign->addRow();
        $rowSign2->addCell(4000)->addText($rapat->pimpinanRapat ?: "-", ['bold' => true, 'size' => 10.5]);
        $rowSign2->addCell(4000)->addText($rapat->notulis ?: "-", ['bold' => true, 'size' => 10.5]);

        // Lampiran Peserta
        $anggotaList = Rapat::parseAnggota($rapat->anggota);
        if (count($anggotaList) > 0) {
            $section->addPageBreak();
            $section->addText("LAMPIRAN: DAFTAR HADIR PESERTA RAPAT", ['bold' => true, 'size' => 11.5], ['alignment' => Jc::CENTER, 'spaceAfter' => 120]);

            $tablePeserta = $section->addTable([
                'borderSize' => 6,
                'borderColor' => '000000',
                'cellMargin' => 80,
                'width' => 100 * 50,
                'unit' => 'pct'
            ]);

            $headerRow = $tablePeserta->addRow();
            $headerRow->addCell(600, ['bgColor' => 'f2f2f2'])->addText("No", ['bold' => true, 'size' => 10], ['alignment' => Jc::CENTER]);
            $headerRow->addCell(3000, ['bgColor' => 'f2f2f2'])->addText("Nama Peserta", ['bold' => true, 'size' => 10]);
            $headerRow->addCell(2200, ['bgColor' => 'f2f2f2'])->addText("Jabatan", ['bold' => true, 'size' => 10]);
            $headerRow->addCell(2200, ['bgColor' => 'f2f2f2'])->addText("Instansi / Unit", ['bold' => true, 'size' => 10]);

            foreach ($anggotaList as $idx => $a) {
                $row = $tablePeserta->addRow();
                $row->addCell(600)->addText($idx + 1, ['size' => 9.5], ['alignment' => Jc::CENTER]);
                $row->addCell(3000)->addText($a['nama'] ?? '-', ['bold' => true, 'size' => 9.5]);
                $row->addCell(2200)->addText($a['jabatan'] ?? '-', ['size' => 9.5]);
                $row->addCell(2200)->addText($a['asalInstansi'] ?? '-', ['size' => 9.5]);
            }
        }

        // Ringkasan & Ide Baru AI
        if (!empty($rapat->ringkasanAI)) {
            $section->addTextBreak(1);
            $section->addText("Ringkasan", ['bold' => true, 'size' => 11], ['spaceAfter' => 40]);
            $cleanRingkasan = GeminiService::bersihkanRingkasan($rapat->ringkasanAI);
            $paragrafList = preg_split('/\n\s*\n/', $cleanRingkasan);
            foreach ($paragrafList as $p) {
                $pClean = trim(str_replace('**', '', $p));
                if ($pClean !== '') {
                    $section->addText($pClean, ['size' => 10], ['alignment' => Jc::BOTH, 'spaceAfter' => 60]);
                }
            }
        }

        if (!empty($rapat->ideBaruAI)) {
            $section->addTextBreak(1);
            $section->addText("REKOMENDASI STRATEGIS (AI)", ['bold' => true, 'size' => 11], ['spaceAfter' => 40]);
            $section->addText(trim($rapat->ideBaruAI), ['size' => 10], ['alignment' => Jc::BOTH]);
        }

        $safeTopic = preg_replace('/[^a-zA-Z0-9-_]/', '_', $rapat->topik);
        $fileName = "Laporan_Rapat_{$safeTopic}_{$rapat->tanggal}.docx";

        $tempFile = tempnam(sys_get_temp_dir(), 'rapat_docx');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        return response()->download($tempFile, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])->deleteFileAfterSend(true);
    }
}
