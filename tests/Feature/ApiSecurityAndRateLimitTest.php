<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ApiSecurityAndRateLimitTest extends TestCase
{
    use RefreshDatabase;
    /**
     * 1. Pengujian Proteksi Endpoint API
     */
    public function test_api_endpoint_rejects_unauthorized_external_request(): void
    {
        // Request tanpa header API key dan bukan dari Same-Origin
        $response = $this->withHeaders([
            'X-API-KEY' => '',
            'X-Requested-With' => '',
            'Referer' => 'http://malicious-external-site.com',
            'Origin' => 'http://malicious-external-site.com',
        ])->getJson('/api/stats');

        $response->assertStatus(401)
                 ->assertJsonPath('success', false)
                 ->assertJsonPath('pesan', 'Akses API ditolak. Kunci API tidak valid atau otorisasi tidak ditemukan. Harap sertakan header X-API-KEY.');
    }

    public function test_api_endpoint_accepts_valid_api_key_header(): void
    {
        $validKey = config('app.api_key', 'rapatin-secure-key-malut-2026');

        $response = $this->withHeaders([
            'X-API-KEY' => $validKey,
            'Referer' => 'http://anywhere.com',
        ])->getJson('/api/stats');

        // Harus berhasil melewati middleware auth (tidak 401)
        $this->assertNotEquals(401, $response->getStatusCode());
    }

    public function test_api_endpoint_accepts_valid_query_api_key(): void
    {
        $validKey = config('app.api_key', 'rapatin-secure-key-malut-2026');

        $response = $this->withHeaders([
            'X-API-KEY' => '',
            'X-Requested-With' => '',
            'Referer' => 'http://external.com',
        ])->get("/api/instansi?api_key={$validKey}");

        $this->assertNotEquals(401, $response->getStatusCode());
    }

    public function test_sensitive_backup_endpoint_strictly_requires_api_key(): void
    {
        // Bahkan jika Same-Origin, backup/restore HARUS menggunakan API key
        $response = $this->withHeaders([
            'X-API-KEY' => 'invalid-key-xyz',
            'X-Requested-With' => 'XMLHttpRequest',
            'Referer' => 'http://localhost:8000',
        ])->getJson('/api/backup/mysql');

        $response->assertStatus(401)
                 ->assertJsonPath('success', false);
    }

    /**
     * 2. Pengujian Rate Limiting
     */
    public function test_rate_limiter_api_throttles_after_limit(): void
    {
        $validKey = config('app.api_key', 'rapatin-secure-key-malut-2026');
        RateLimiter::clear(sha1('api' . '|' . '127.0.0.1'));
        RateLimiter::clear('api:127.0.0.1');

        // Simulasi hit hingga mendekati batas 60 req/menit
        for ($i = 0; $i < 60; $i++) {
            $res = $this->withHeaders([
                'X-API-KEY' => $validKey,
            ])->getJson('/api/instansi');
            $this->assertEquals(200, $res->getStatusCode());
        }

        // Request ke-61 harus terblokir dengan status HTTP 429 (Too Many Requests)
        $response = $this->withHeaders([
            'X-API-KEY' => $validKey,
        ])->getJson('/api/instansi');

        $response->assertStatus(429)
                 ->assertJsonPath('success', false)
                 ->assertJsonPath('pesan', 'Terlalu banyak permintaan API. Silakan tunggu beberapa saat.');
    }

    /**
     * 3. Pengujian APP_DEBUG=false
     */
    public function test_app_debug_is_false(): void
    {
        $this->assertFalse(config('app.debug'), 'APP_DEBUG seharusnya bernilai false untuk keamanan.');
    }
}
