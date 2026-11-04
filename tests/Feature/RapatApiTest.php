<?php

namespace Tests\Feature;

use App\Models\Rapat;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RapatApiTest extends TestCase
{
    use RefreshDatabase;

    private function createSampleRapat(array $overrides = []): Rapat
    {
        return Rapat::create(array_merge([
            'id' => (string) Str::ulid(),
            'tanggal' => '2026-10-01',
            'topik' => 'Rapat Uji Coba Otomatis',
            'pimpinanRapat' => 'Budi Santoso',
            'notulis' => 'Siti Rahma',
            'waktu' => '09:00:00',
            'waktu_selesai' => '11:00:00',
            'tempat' => 'Ruang Rapat Utama Bappeda',
            'anggota' => json_encode([['nama' => 'Ahmad', 'jabatan' => 'Kabid', 'asalInstansi' => 'Bappeda']]),
            'poinPembahasan' => json_encode([['isi' => 'Pembahasan transformasi ke Laravel', 'keputusan' => 'Disetujui']]),
            'tindakLanjut' => json_encode([['tugas' => 'Implementasi API', 'pic' => 'Ahmad', 'deadline' => '2026-10-15', 'selesai' => false]]),
            'ringkasanAI' => 'Ringkasan uji coba.',
            'ideBaruAI' => 'Ide uji coba.',
            'status' => 'Selesai',
        ], $overrides));
    }

    public function test_stats_endpoint(): void
    {
        $this->createSampleRapat();

        $response = $this->getJson('/api/stats');
        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure([
                     'success',
                     'data' => ['totalRapat', 'rapatBulanIni', 'denganAI', 'bulanIni', 'terhapus']
                 ]);
    }

    public function test_list_rapat_endpoint(): void
    {
        $this->createSampleRapat();

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
        $rapat = $this->createSampleRapat(['topik' => 'Rapat Koordinasi Perencanaan']);

        $response = $this->getJson("/api/rapat/{$rapat->id}");
        $response->assertStatus(200)
                 ->assertJsonPath('id', (string)$rapat->id)
                 ->assertJsonPath('topik', 'Rapat Koordinasi Perencanaan');
    }

    public function test_crud_and_soft_delete_flow(): void
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
            'created_by' => 'user-ipw-01',
            'taskboard_id' => 'tb-card-99',
        ];

        $createRes = $this->postJson('/api/rapat', $payload);
        $createRes->assertStatus(201)
                  ->assertJsonPath('success', true)
                  ->assertJsonPath('data.topik', 'Rapat Uji Coba Otomatis')
                  ->assertJsonPath('data.created_by', 'user-ipw-01');

        $createdId = $createRes->json('data.id');
        $this->assertNotEmpty($createdId);

        // 2. Update
        $updateRes = $this->putJson("/api/rapat/{$createdId}", [
            'topik' => 'Rapat Uji Coba Otomatis - Updated',
        ]);
        $updateRes->assertStatus(200)
                  ->assertJsonPath('success', true)
                  ->assertJsonPath('data.topik', 'Rapat Uji Coba Otomatis - Updated');

        // 3. Soft Delete
        $deleteRes = $this->deleteJson("/api/rapat/{$createdId}");
        $deleteRes->assertStatus(200)
                  ->assertJsonPath('success', true);

        // Pastikan tidak muncul di list aktif
        $listRes = $this->getJson('/api/rapat');
        $this->assertEquals(0, $listRes->json('pagination.total'));

        // 4. Periksa di tempat sampah (trash)
        $trashRes = $this->getJson('/api/rapat/trash');
        $trashRes->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('total', 1);

        // 5. Restore dari tempat sampah
        $restoreRes = $this->postJson("/api/rapat/{$createdId}/restore");
        $restoreRes->assertStatus(200)
                   ->assertJsonPath('success', true);

        // Pastikan muncul kembali di list aktif
        $listAfterRestore = $this->getJson('/api/rapat');
        $this->assertEquals(1, $listAfterRestore->json('pagination.total'));

        // 6. Soft delete kembali lalu force delete permanen
        $this->deleteJson("/api/rapat/{$createdId}");
        $forceRes = $this->deleteJson("/api/rapat/{$createdId}/force");
        $forceRes->assertStatus(200)
                 ->assertJsonPath('success', true);

        $trashAfterForce = $this->getJson('/api/rapat/trash');
        $this->assertEquals(0, $trashAfterForce->json('total'));
    }

    public function test_export_pdf(): void
    {
        $rapat = $this->createSampleRapat();

        $response = $this->get("/api/rapat/{$rapat->id}/export-pdf");
        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }

    public function test_export_word(): void
    {
        $rapat = $this->createSampleRapat();

        $response = $this->get("/api/rapat/{$rapat->id}/export-word");
        $response->assertStatus(200);
        $this->assertStringContainsString('wordprocessingml', $response->headers->get('content-type'));
    }
}
