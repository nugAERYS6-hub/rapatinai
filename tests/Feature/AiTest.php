<?php

namespace Tests\Feature;

use App\Models\Rapat;
use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiTest extends TestCase
{
    use RefreshDatabase;
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

    public function test_schema_action_items_valid(): void
    {
        $schema = GeminiService::schemaActionItems();
        $this->assertEquals('ARRAY', $schema['type']);
        $this->assertEquals('OBJECT', $schema['items']['type']);
        $this->assertArrayHasKey('tugas', $schema['items']['properties']);
        $this->assertArrayHasKey('pic', $schema['items']['properties']);
        $this->assertArrayHasKey('prioritas', $schema['items']['properties']);
        $this->assertArrayHasKey('estimasi', $schema['items']['properties']);
        $this->assertEquals(['Tinggi', 'Sedang', 'Normal'], $schema['items']['properties']['prioritas']['enum']);
    }

    public function test_parse_json_action_items_structured(): void
    {
        $rawJson = json_encode([
            [
                'tugas' => 'Menyusun draf P-Renja 2026',
                'pic' => 'Bidang Perencanaan Bappeda',
                'prioritas' => 'Tinggi',
                'estimasi' => '2 Minggu',
            ],
            [
                'tugas' => 'Koordinasi dengan Diskominfo',
                'pic' => 'Siti Rahma',
                'prioritas' => 'medium', // test normalization to 'Sedang'
                'estimasi' => '3 Hari',
            ],
        ]);

        $parsed = GeminiService::parseJsonActionItems($rawJson);
        $this->assertCount(2, $parsed);
        $this->assertEquals('Menyusun draf P-Renja 2026', $parsed[0]['tugas']);
        $this->assertEquals('Bidang Perencanaan Bappeda', $parsed[0]['pic']);
        $this->assertEquals('Tinggi', $parsed[0]['prioritas']);
        $this->assertEquals('2 Minggu', $parsed[0]['estimasi']);

        $this->assertEquals('Sedang', $parsed[1]['prioritas']);
    }

    public function test_parse_json_action_items_with_markdown_wrapper(): void
    {
        $raw = "```json\n[{\"tugas\":\"Update server database\",\"pic\":\"Admin IT\",\"prioritas\":\"Normal\",\"estimasi\":\"1 Hari\"}]\n```";
        $parsed = GeminiService::parseJsonActionItems($raw);
        $this->assertCount(1, $parsed);
        $this->assertEquals('Update server database', $parsed[0]['tugas']);
        $this->assertEquals('Admin IT', $parsed[0]['pic']);
    }

    public function test_parse_json_action_items_fallback_malformed(): void
    {
        $malformed = "Ini bukan format JSON yang valid dari AI";
        $parsed = GeminiService::parseJsonActionItems($malformed);
        $this->assertCount(1, $parsed);
        $this->assertEquals('Ini bukan format JSON yang valid dari AI', $parsed[0]['tugas']);
        $this->assertEquals('-', $parsed[0]['pic']);
    }
}
