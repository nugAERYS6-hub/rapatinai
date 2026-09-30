<?php

namespace App\Services;

use App\Models\Rapat;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    const GLOSARIUM_PEMDA = "- OPD: Organisasi Perangkat Daerah
- RKPD: Rencana Kerja Pemerintah Daerah
- P-Renja: Perubahan Rencana Kerja
- Perda: Peraturan Daerah
- APBD: Anggaran Pendapatan dan Belanja Daerah
- Bappeda: Badan Perencanaan Pembangunan Daerah
- Musrenbang: Musyawarah Perencanaan Pembangunan";

    public static function bersihkanRingkasan(?string $text): string
    {
        if (!$text) return '';
        $str = trim($text);
        while (true) {
            $next = preg_replace('/^(?:#+\s*)?(?:\*{1,3})?\s*(?:ringkasan\s+eksekutif|executive\s+summary|ringkasan\s+hasil\s+rapat|ringkasan)(?:\s*[:\-])?\s*(?:\*{1,3})?\s*(\n+|$)/i', '', $str);
            $next = preg_replace('/^(?:\*{1,3})?\s*(?:rapat\s+[^\n]+?)(?:\*{1,3})?\s*(\n+|$)/i', '', $next);
            $next = trim($next);
            if ($next === $str) break;
            $str = $next;
        }
        return $str;
    }

    protected static function formatAnggotaRingkas(array $anggota): string
    {
        $list = [];
        foreach ($anggota as $a) {
            $nama = $a['nama'] ?? '';
            $jabatan = !empty($a['jabatan']) ? $a['jabatan'] : '-';
            $instansi = !empty($a['asalInstansi']) ? $a['asalInstansi'] : '-';
            $list[] = "{$nama} ({$jabatan}, {$instansi})";
        }
        return implode(', ', $list);
    }

    public static function panggilGemini(string $prompt, float $temperature = 0.3): string
    {
        $apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY');
        if (empty($apiKey)) {
            throw new \Exception("GEMINI_API_KEY belum dikonfigurasi di file .env");
        }

        $modelList = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest"];
        $lastError = null;

        foreach ($modelList as $model) {
            try {
                $response = Http::timeout(30)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'temperature' => $temperature,
                        'maxOutputTokens' => 2048,
                    ]
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    if (!empty($json['candidates'][0]['content']['parts'][0]['text'])) {
                        return trim($json['candidates'][0]['content']['parts'][0]['text']);
                    }
                    throw new \Exception("Respon AI tidak memiliki teks jawaban");
                } else {
                    $errData = $response->json();
                    $msg = $errData['error']['message'] ?? ("HTTP " . $response->status());
                    throw new \Exception("Model {$model} gagal: {$msg}");
                }
            } catch (\Throwable $e) {
                $lastError = $e;
                Log::warning("Gemini model {$model} error: " . $e->getMessage());
            }
        }

        throw $lastError ?: new \Exception("Semua percobaan model Gemini gagal.");
    }

    public static function mintaRingkasanAI(Rapat $rapat): string
    {
        $poinList = Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        $daftarPoinArr = [];
        foreach ($poinList as $p) {
            $isi = $p['isi'] ?? '';
            if ($isi !== '') {
                $daftarPoinArr[] = "- " . $isi;
            }
        }
        $daftarPoin = implode("\n", $daftarPoinArr);
        $anggotaList = Rapat::parseAnggota($rapat->anggota);
        $anggotaRingkas = self::formatAnggotaRingkas($anggotaList);

        $glosarium = self::GLOSARIUM_PEMDA;

        $prompt = "Kamu adalah analis kebijakan dan asisten notulensi rapat eksekutif pemerintah/korporasi.
Buatkan Ringkasan Eksekutif Formal yang elegan, padat, dan terstruktur (2-3 paragraf) dari notulen berikut dalam Bahasa Indonesia baku.

Glosarium referensi bila terkait:
{$glosarium}

Topik Rapat: {$rapat->topik}
Tanggal: {$rapat->tanggal}
Pimpinan: {$rapat->pimpinanRapat}
Notulis: {$rapat->notulis}
Peserta: {$anggotaRingkas}

Catatan Notulensi / Hasil Rapat:
{$daftarPoin}

ATURAN KETAT:
- JANGAN menuliskan judul, subjudul, headline, atau statement awalan apa pun seperti \"**RINGKASAN EKSEKUTIF**\", \"**Rapat...**\", \"Ringkasan:\", atau label pembuka sejenisnya.
- Langsung mulai pada kalimat pertama narasi paragraf ringkasan (misalnya: \"Pada tanggal ...\").
- Gunakan HANYA data eksplisit di atas. Jangan mengarang nama dinas/lokasi fiktif.
- JANGAN memasukkan tempat pelaksanaan rapat pada pembuka ringkasan, karena tempat sudah ada di formulir informasi rapat.
- Susun secara naratif mengalir dan profesional (Executive Summary standard).
- Tekankan apa yang dibahas serta keputusan/hasil yang disepakati bersama.
- JANGAN menggunakan formatting markdown tebal ganda (**) untuk memberi label/judul baru.";

        $raw = self::panggilGemini($prompt, 0.2);
        return self::bersihkanRingkasan($raw);
    }

    public static function mintaIdeBaruAI(Rapat $rapat): string
    {
        $poinList = Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        $daftarPoinArr = [];
        foreach ($poinList as $p) {
            $isi = $p['isi'] ?? '';
            if ($isi !== '') {
                $daftarPoinArr[] = "- " . $isi;
            }
        }
        $daftarPoin = implode("\n", $daftarPoinArr);

        $prompt = "Kamu adalah konsultan tata kelola dan manajemen strategis.
Berdasarkan hasil rapat berikut, usulkan 3-4 rekomendasi strategis atau ide pengembangan TAMBAHAN yang konkret, realistis, dan memberikan nilai tambah.

Topik: {$rapat->topik}
Catatan Notulensi / Hasil Rapat:
{$daftarPoin}

ATURAN:
- Jangan mengulang apa yang sudah ada di atas.
- Tulis dalam format nomor 1, 2, 3, 4 dengan bahasa formal, jelas, dan berorientasi hasil.
- Tiap usulan terdiri atas 1-2 kalimat lugas.";

        return self::panggilGemini($prompt, 0.5);
    }

    public static function mintaActionItemsAI(Rapat $rapat): array
    {
        $poinList = Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        $daftarPoinArr = [];
        foreach ($poinList as $p) {
            $daftarPoinArr[] = "- " . ($p['isi'] ?? '') . " [" . ($p['keputusan'] ?? 'Disetujui') . "]";
        }
        $daftarPoin = implode("\n", $daftarPoinArr);

        $tlList = Rapat::parseTindakLanjut($rapat->tindakLanjut);
        $daftarTLArr = [];
        foreach ($tlList as $t) {
            $daftarTLArr[] = "- " . ($t['tugas'] ?? '');
        }
        $daftarTL = implode("\n", $daftarTLArr);

        $prompt = "Kamu adalah Project Management Specialist.
Dari notulen rapat berikut, ekstrak daftar Action Items (Tugas Konkret) yang harus dilakukan.
Keluarkan respon HANYA dalam format JSON valid berupa array objek:
[
  {
    \"tugas\": \"Deskripsi tugas konkret\",
    \"pic\": \"Pihak / Jabatan yang bertanggung jawab\",
    \"prioritas\": \"Tinggi / Sedang / Normal\",
    \"estimasi\": \"Contoh: 1 Minggu\"
  }
]

Data Rapat:
Topik: {$rapat->topik}
Pimpinan: {$rapat->pimpinanRapat}
Pembahasan:
{$daftarPoin}
Tindak lanjut tercatat:
{$daftarTL}

JANGAN berikan markdown pembuka/penutup atau teks lain selain JSON murni.";

        $teks = self::panggilGemini($prompt, 0.1);
        try {
            $bersih = preg_replace('/```(?:json)?/i', '', $teks);
            $bersih = trim($bersih);
            $parsed = json_decode($bersih, true);
            if (is_array($parsed)) {
                return $parsed;
            }
        } catch (\Throwable $e) {}

        return [
            [
                'tugas' => $teks,
                'pic' => '-',
                'prioritas' => 'Normal',
                'estimasi' => '-',
            ]
        ];
    }
}
