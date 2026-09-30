<?php

namespace Tests\Feature;

use Tests\TestCase;

class RapatApiTest extends TestCase
{
    public function test_stats_endpoint(): void
    {
        $response = $this->getJson('/api/stats');
        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'success',
                     'data' => ['totalRapat', 'rapatBulanIni', 'denganAI', 'bulanIni']
                 ]);
    }

    public function test_list_rapat_endpoint(): void
    {
        $response = $this->getJson('/api/rapat');
        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'success',
                     'data',
                     'pagination' => ['page', 'limit', 'total', 'totalPages']
                 ]);
    }

    public function test_detail_rapat_endpoint(): void
    {
        $response = $this->getJson('/api/rapat/1789219057184');
        $response->assertStatus(200)
                 ->assertJsonPath('id', '1789219057184')
                 ->assertJsonPath('topik', 'Rapat P-Renja');
    }

    public function test_crud_flow(): void
    {
        // 1. Create
        $payload = [
            'tanggal' => '2026-10-01',
            'topik' => 'Rapat Uji Coba Otomatis',
            'pimpinanRapat' => 'Budi Santoso',
            'notulis' => 'Siti Rahma',
            'waktu' => '09:00 - 11:00 WIT',
            'tempat' => 'Ruang Rapat Utama Bappeda',
            'anggota' => [
                ['nama' => 'Ahmad', 'jabatan' => 'Kabid', 'asalInstansi' => 'Bappeda'],
            ],
            'poinPembahasan' => [
                ['isi' => 'Pembahasan transformasi ke Laravel', 'keputusan' => 'Disetujui'],
            ],
            'tindakLanjut' => [],
            'status' => 'Selesai',
        ];

        $createRes = $this->postJson('/api/rapat', $payload);
        $createRes->assertStatus(201)
                  ->assertJsonPath('success', true)
                  ->assertJsonPath('data.topik', 'Rapat Uji Coba Otomatis');

        $createdId = $createRes->json('data.id');
        $this->assertNotEmpty($createdId);

        // 2. Update
        $updateRes = $this->putJson("/api/rapat/{$createdId}", [
            'topik' => 'Rapat Uji Coba Otomatis - Updated',
        ]);
        $updateRes->assertStatus(200)
                  ->assertJsonPath('success', true)
                  ->assertJsonPath('data.topik', 'Rapat Uji Coba Otomatis - Updated');

        // 3. Delete
        $deleteRes = $this->deleteJson("/api/rapat/{$createdId}");
        $deleteRes->assertStatus(200)
                  ->assertJsonPath('success', true);
    }

    public function test_export_pdf(): void
    {
        $response = $this->get('/api/rapat/1789219057184/export-pdf');
        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }

    public function test_export_word(): void
    {
        $response = $this->get('/api/rapat/1789219057184/export-word');
        $response->assertStatus(200);
        $this->assertStringContainsString('wordprocessingml', $response->headers->get('content-type'));
    }
}
