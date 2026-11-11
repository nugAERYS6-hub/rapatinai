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

    public function test_toggle_action_item_success(): void
    {
        $rapat = $this->createSampleRapat([
            'tindakLanjut' => json_encode([
                ['tugas' => 'Siapkan bahan rapat paripurna', 'pic' => 'Bidang Litbang', 'deadline' => '10 Nov 2026', 'selesai' => false],
                ['tugas' => 'Kirim undangan koordinasi OPD', 'pic' => 'Sekretariat', 'deadline' => '12 Nov 2026', 'selesai' => false],
            ]),
        ]);

        // Toggle index 0 dari false ke true
        $res = $this->patchJson("/api/rapat/{$rapat->id}/action-items/0/toggle", [
            'selesai' => true,
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.index', 0)
            ->assertJsonPath('data.selesai', true)
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.selesai_count', 1);

        $rapat->refresh();
        $items = Rapat::parseTindakLanjut($rapat->tindakLanjut);
        $this->assertTrue($items[0]['selesai']);
        $this->assertNotNull($items[0]['selesai_at']);

        // Toggle kembali index 0 ke false
        $res2 = $this->patchJson("/api/rapat/{$rapat->id}/action-items/0/toggle", [
            'selesai' => false,
        ]);
        $res2->assertStatus(200)
             ->assertJsonPath('data.selesai', false)
             ->assertJsonPath('data.selesai_count', 0);

        $rapat->refresh();
        $items2 = Rapat::parseTindakLanjut($rapat->tindakLanjut);
        $this->assertFalse($items2[0]['selesai']);
    }

    public function test_toggle_action_item_invalid_index(): void
    {
        $rapat = $this->createSampleRapat([
            'tindakLanjut' => json_encode([
                ['tugas' => 'Tugas tunggal', 'pic' => 'Staf A', 'deadline' => '10 Nov 2026'],
            ]),
        ]);

        $res = $this->patchJson("/api/rapat/{$rapat->id}/action-items/99/toggle");
        $res->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_filter_by_date_range(): void
    {
        $this->createSampleRapat(['tanggal' => '2026-09-15', 'topik' => 'Rapat September']);
        $this->createSampleRapat(['tanggal' => '2026-10-10', 'topik' => 'Rapat Oktober']);
        $this->createSampleRapat(['tanggal' => '2026-11-05', 'topik' => 'Rapat November']);

        // Rentang Oktober saja
        $res = $this->getJson('/api/rapat?start_date=2026-10-01&end_date=2026-10-31');
        $res->assertStatus(200)
            ->assertJsonPath('pagination.total', 1)
            ->assertJsonPath('data.0.topik', 'Rapat Oktober');

        // Mulai dari 1 Oktober ke depan
        $res2 = $this->getJson('/api/rapat?start_date=2026-10-01');
        $res2->assertStatus(200)
             ->assertJsonPath('pagination.total', 2);

        // Sampai akhir September
        $res3 = $this->getJson('/api/rapat?end_date=2026-09-30');
        $res3->assertStatus(200)
             ->assertJsonPath('pagination.total', 1)
             ->assertJsonPath('data.0.topik', 'Rapat September');
    }

    public function test_nip_and_jabatan_in_crud_flow(): void
    {
        $payload = [
            'tanggal' => '2026-11-12',
            'topik' => 'Rapat Koordinasi Evaluasi OPD Triwulan IV',
            'pimpinanRapat' => 'Drs. H. Mulyadi, M.Si',
            'pimpinan_nip' => '19750815 199803 1 004',
            'pimpinan_jabatan' => 'Kepala Badan Perencanaan Pembangunan Daerah',
            'notulis' => 'Rina Wijaya, S.Kom',
            'notulis_nip' => '19920420 201802 2 001',
            'waktu' => '09:00',
            'waktu_selesai' => '12:00',
            'tempat' => 'Ruang Pola Kantor Bupati',
            'status' => 'Selesai',
        ];

        // 1. Create
        $res = $this->postJson('/api/rapat', $payload);
        $res->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.pimpinan_nip', '19750815 199803 1 004')
            ->assertJsonPath('data.pimpinan_jabatan', 'Kepala Badan Perencanaan Pembangunan Daerah')
            ->assertJsonPath('data.notulis_nip', '19920420 201802 2 001');

        $id = $res->json('data.id');

        // 2. Read detail
        $resDetail = $this->getJson("/api/rapat/{$id}");
        $resDetail->assertStatus(200)
                  ->assertJsonPath('pimpinan_nip', '19750815 199803 1 004')
                  ->assertJsonPath('pimpinan_jabatan', 'Kepala Badan Perencanaan Pembangunan Daerah')
                  ->assertJsonPath('notulis_nip', '19920420 201802 2 001');

        // 3. Update
        $updatePayload = [
            'pimpinan_jabatan' => 'Plt. Sekretaris Daerah',
            'pimpinan_nip' => '19750815 199803 1 005',
        ];
        $resUpdate = $this->putJson("/api/rapat/{$id}", $updatePayload);
        $resUpdate->assertStatus(200)
                  ->assertJsonPath('data.pimpinan_jabatan', 'Plt. Sekretaris Daerah')
                  ->assertJsonPath('data.pimpinan_nip', '19750815 199803 1 005');
    }
}
