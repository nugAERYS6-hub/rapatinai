<?php

namespace App\Services\Rapat;

use App\Models\Rapat;
use Illuminate\Http\Client\ConnectionException;
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

    /**
     * Membersihkan teks ringkasan dari header/label markdown berulang
     */
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

    /**
     * Format daftar anggota peserta rapat secara ringkas
     */
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

    /**
     * Kompresi dan sanitasi poin pembahasan bila notulen terlalu panjang / masif.
     * Mencegah payload token berlebih yang memicu timeout dan respon lambat LLM.
     */
    public static function siapkanPoinPembahasanRingkas(array $poinList, int $maxItems = 35, int $maxCharPerItem = 600): string
    {
        if (empty($poinList)) {
            return "- (Tidak ada rincian poin pembahasan tercatat)";
        }

        $totalAwal = count($poinList);
        $items = array_slice($poinList, 0, $maxItems);

        $hasil = [];
        foreach ($items as $idx => $p) {
            $isi = trim($p['isi'] ?? '');
            if ($isi === '') continue;

            // Pangkas teks per poin jika melampaui batas maksimal karakter
            if (mb_strlen($isi) > $maxCharPerItem) {
                $isi = mb_substr($isi, 0, $maxCharPerItem) . '... [dipersingkat]';
            }

            $keputusan = !empty($p['keputusan']) && $p['keputusan'] !== 'Dalam Pembahasan' 
                ? " (Keputusan: {$p['keputusan']})" 
                : "";

            $hasil[] = ($idx + 1) . ". " . $isi . $keputusan;
        }

        if (empty($hasil)) {
            return "- (Tidak ada rincian poin pembahasan tercatat)";
        }

        if ($totalAwal > $maxItems) {
            $sisa = $totalAwal - $maxItems;
            $hasil[] = "... [Catatan: {$sisa} poin pembahasan berikutnya diringkas secara proporsional untuk efisiensi pemrosesan]";
        }

        return implode("\n", $hasil);
    }

    /**
     * Memanggil Google Gemini API dengan optimasi timeout, model fallback yang valid,
     * dan manajemen waktu kumulatif agar tidak menyebabkan HTTP 504.
     */
    public static function panggilGemini(string $prompt, float $temperature = 0.3, int $maxOutputTokens = 2048): string
    {
        $apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY');
        if (empty($apiKey)) {
            throw new \RuntimeException("Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi di file .env atau config.");
        }

        // Daftar model resmi Google Gemini yang aktif, cepat, dan responsif
        $configuredModel = config('services.gemini.model', 'gemini-flash-lite-latest');
        $modelCandidates = array_unique([
            $configuredModel,
            'gemini-flash-lite-latest',
            'gemini-3.5-flash',
            'gemini-3.6-flash',
            'gemini-3.7-flash',
            'gemini-3.8-flash',
            'gemini-flash-latest',
        ]);

        $timeoutPerAttempt = (int) config('services.gemini.timeout', 25);
        $maxTotalSeconds = (int) config('services.gemini.max_retry_seconds', 45);

        $startTime = microtime(true);
        $lastException = null;

        foreach ($modelCandidates as $model) {
            $elapsed = microtime(true) - $startTime;
            if ($elapsed >= $maxTotalSeconds) {
                Log::warning("Gemini API: Batas waktu total ({$maxTotalSeconds}s) tercapai sebelum mencoba model {$model}.");
                break;
            }

            // Sisa waktu yang aman untuk percobaan ini
            $remainingTime = max(10, (int)($maxTotalSeconds - $elapsed));
            $currentTimeout = min($timeoutPerAttempt, $remainingTime);

            try {
                $response = Http::timeout($currentTimeout)
                    ->connectTimeout(8)
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [
                            [
                                'parts' => [
                                    ['text' => $prompt]
                                ]
                            ]
                        ],
                        'generationConfig' => [
                            'temperature' => $temperature,
                            'maxOutputTokens' => $maxOutputTokens,
                        ]
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if (!empty($text)) {
                        return trim($text);
                    }
                    throw new \RuntimeException("Respon AI berhasil diterima namun tidak memiliki teks jawaban.");
                }

                $status = $response->status();
                $errData = $response->json();
                $apiMessage = $errData['error']['message'] ?? "HTTP {$status}";
                $apiStatus = $errData['error']['status'] ?? '';

                // Tangani kasus kuota habis / rate limit
                if ($status === 429 || $apiStatus === 'RESOURCE_EXHAUSTED') {
                    throw new \RuntimeException("Batas kuota panggilan Gemini API tercapai (Rate Limit / Quota Exceeded). Mohon tunggu sekitar 1-2 menit sebelum mencoba kembali.");
                }

                // Tangani kredensial tidak valid
                if ($status === 401 || $status === 403 || $apiStatus === 'PERMISSION_DENIED') {
                    throw new \RuntimeException("Kunci API Gemini tidak valid atau tidak memiliki izin akses (HTTP {$status}).");
                }

                throw new \RuntimeException("Model {$model} merespon error: {$apiMessage}");
            } catch (ConnectionException $e) {
                $lastException = new \RuntimeException("Koneksi ke Gemini AI mengalami batas waktu (timeout setelah {$currentTimeout}s). Server AI sedang lambat atau notulen terlalu panjang.");
                Log::warning("Gemini timeout model {$model}: " . $e->getMessage());
            } catch (\Throwable $e) {
                // Jika error adalah kuota/auth, jangan lanjutkan perulangan model karena hasilnya akan sama
                $pesan = $e->getMessage();
                if (str_contains($pesan, 'Batas kuota') || str_contains($pesan, 'Kunci API Gemini tidak valid')) {
                    throw $e;
                }

                $lastException = $e;
                Log::warning("Gemini model {$model} error: " . $pesan);
            }
        }

        if ($lastException) {
            throw $lastException;
        }

        throw new \RuntimeException("Permintaan AI tidak dapat diselesaikan dalam batas waktu yang ditentukan ({$maxTotalSeconds} detik). Silakan coba lagi.");
    }

    /**
     * Mengklasifikasikan error untuk respon frontend yang jelas
     */
    public static function klasifikasiError(\Throwable $e): array
    {
        $msg = $e->getMessage();
        $code = 500;
        $tipe = 'error';

        if (str_contains($msg, 'batas waktu') || str_contains($msg, 'timeout') || str_contains($msg, 'Operation timed out')) {
            $code = 504;
            $tipe = 'timeout';
            $userMsg = "Proses analisis AI memakan waktu lebih lama dari biasanya (timeout). Notulen mungkin cukup panjang atau jaringan sedang lambat. Silakan klik tombol untuk mencoba kembali.";
        } elseif (str_contains($msg, 'high demand') || str_contains($msg, '503') || str_contains($msg, 'temporarily overloaded')) {
            $code = 503;
            $tipe = 'overload';
            $userMsg = "Server Google Gemini sedang mengalami lonjakan beban sesaat (high demand). Silakan tekan tombol 'Coba Lagi' untuk memproses ulang.";
        } elseif (str_contains($msg, 'Batas kuota') || str_contains($msg, 'Rate Limit') || str_contains($msg, '429')) {
            $code = 429;
            $tipe = 'quota';
            $userMsg = "Batas kuota Gemini API saat ini tercapai. Harap tunggu sekitar 1–2 menit sebelum mencoba kembali.";
        } elseif (str_contains($msg, 'Kunci API') || str_contains($msg, 'tidak valid') || str_contains($msg, 'belum dikonfigurasi')) {
            $code = 401;
            $tipe = 'auth';
            $userMsg = "Kunci API Gemini (GEMINI_API_KEY) belum terpasang atau tidak valid. Periksa konfigurasi di file .env.";
        } else {
            $userMsg = "Gagal memproses AI: " . $msg;
        }

        return [
            'status' => $code,
            'tipe' => $tipe,
            'pesan' => $userMsg,
        ];
    }

    /**
     * Membuat Ringkasan Eksekutif Resmi dengan notulen yang telah diringkas secara aman
     */
    public static function mintaRingkasanAI(Rapat $rapat): string
    {
        $poinList = Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        $daftarPoin = self::siapkanPoinPembahasanRingkas($poinList, 40, 500);

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
- JANGAN menggunakan formatting markdown tebal ganda (**) untuk memberi label/judul baru.
- PENTING DAN WAJIB: Tuliskan narasi secara utuh dan tuntas. Pastikan seluruh kalimat dan paragraf terselesaikan sempurna hingga tanda titik penutup. JANGAN berhenti atau menggantung di tengah kalimat.";

        $raw = self::panggilGemini($prompt, 0.2, 2048);
        return self::bersihkanRingkasan($raw);
    }

    /**
     * Merumuskan Usulan Rekomendasi & Ide Strategis Tambahan
     */
    public static function mintaIdeBaruAI(Rapat $rapat): string
    {
        $poinList = Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        $daftarPoin = self::siapkanPoinPembahasanRingkas($poinList, 30, 400);

        $prompt = "Kamu adalah konsultan tata kelola dan manajemen strategis.
Berdasarkan hasil rapat berikut, usulkan 3-4 rekomendasi strategis atau ide pengembangan TAMBAHAN yang konkret, realistis, dan memberikan nilai tambah.

Topik: {$rapat->topik}
Catatan Notulensi / Hasil Rapat:
{$daftarPoin}

ATURAN:
- Jangan mengulang apa yang sudah ada di atas.
- Tulis dalam format nomor 1, 2, 3, 4 dengan bahasa formal, jelas, dan berorientasi hasil.
- Tiap usulan terdiri atas 1-2 kalimat lugas.";

        return self::panggilGemini($prompt, 0.4, 1024);
    }

    /**
     * Mengekstrak Action Items & Penugasan Konkret dari Notulen
     */
    public static function mintaActionItemsAI(Rapat $rapat): array
    {
        $poinList = Rapat::parsePoinPembahasan($rapat->poinPembahasan);
        $daftarPoin = self::siapkanPoinPembahasanRingkas($poinList, 35, 400);

        $tlList = Rapat::parseTindakLanjut($rapat->tindakLanjut);
        $daftarTLArr = [];
        foreach (array_slice($tlList, 0, 20) as $t) {
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

        $teks = self::panggilGemini($prompt, 0.1, 2048);
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
