<?php

namespace Tests\Feature;

use App\Models\Rapat;
use App\Services\GeminiService;
use Tests\TestCase;

class AiTest extends TestCase
{
    public function test_siapkan_poin_pembahasan_ringkas_kompresi(): void
    {
        // 50 poin pembahasan panjang
        $poinBanyak = [];
        for ($i = 1; $i <= 50; $i++) {
            $poinBanyak[] = [
                'isi' => "Poin pembahasan ke-{$i} dengan teks detail " . str_repeat("lorem ipsum dolor sit amet ", 30),
                'keputusan' => ($i % 2 === 0) ? 'Disetujui' : 'Dalam Pembahasan',
            ];
        }

        $ringkasan = GeminiService::siapkanPoinPembahasanRingkas($poinBanyak, 30, 200);

        $this->assertNotEmpty($ringkasan);
        // Memastikan batasan jumlah item dipotong ke 30 dan ada catatan sisa 20 poin
        $this->assertStringContainsString('30.', $ringkasan);
        $this->assertStringNotContainsString('31.', $ringkasan);
        $this->assertStringContainsString('20 poin pembahasan berikutnya diringkas', $ringkasan);
        $this->assertStringContainsString('[dipersingkat]', $ringkasan);
    }

    public function test_klasifikasi_error_ai(): void
    {
        // Timeout
        $errTimeout = new \RuntimeException("cURL error 28: Operation timed out after 25000 milliseconds");
        $resTimeout = GeminiService::klasifikasiError($errTimeout);
        $this->assertEquals(504, $resTimeout['status']);
        $this->assertEquals('timeout', $resTimeout['tipe']);

        // Kuota
        $errQuota = new \RuntimeException("Batas kuota panggilan Gemini API tercapai (Rate Limit / Quota Exceeded)");
        $resQuota = GeminiService::klasifikasiError($errQuota);
        $this->assertEquals(429, $resQuota['status']);
        $this->assertEquals('quota', $resQuota['tipe']);

        // Auth
        $errAuth = new \RuntimeException("Kunci API Gemini tidak valid (HTTP 401)");
        $resAuth = GeminiService::klasifikasiError($errAuth);
        $this->assertEquals(401, $resAuth['status']);
        $this->assertEquals('auth', $resAuth['tipe']);
    }

    public function test_ai_controller_error_response_structure(): void
    {
        // Rapat tidak ditemukan
        $res = $this->postJson('/api/rapat/non-existent-id/rangkum');
        $res->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('pesan', 'Rapat tidak ditemukan');
    }
}
