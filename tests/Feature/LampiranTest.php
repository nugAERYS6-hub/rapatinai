<?php

namespace Tests\Feature;

use App\Models\Rapat;
use App\Models\RapatLampiran;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class LampiranTest extends TestCase
{
    use RefreshDatabase;

    private function createSampleRapat(): Rapat
    {
        return Rapat::create([
            'id' => (string) Str::ulid(),
            'tanggal' => '2026-10-01',
            'topik' => 'Rapat Uji Lampiran',
            'pimpinanRapat' => 'Budi Santoso',
            'notulis' => 'Siti Rahma',
            'waktu' => '09:00:00',
            'tempat' => 'Ruang Rapat Utama',
            'status' => 'Selesai',
        ]);
    }

    public function test_list_lampiran_empty_initially(): void
    {
        $rapat = $this->createSampleRapat();

        $response = $this->getJson("/api/rapat/{$rapat->id}/lampiran");
        $response->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('total', 0)
                 ->assertJsonPath('data', []);
    }

    public function test_upload_lampiran_success(): void
    {
        Storage::fake('public');
        $rapat = $this->createSampleRapat();

        $file = UploadedFile::fake()->create('daftar_hadir_peserta.pdf', 500, 'application/pdf');

        $response = $this->postJson("/api/rapat/{$rapat->id}/lampiran", [
            'berkas' => $file,
            'kategori' => 'daftar_hadir',
            'keterangan' => 'Scan daftar hadir tanda tangan basah',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.nama_file', 'daftar_hadir_peserta.pdf')
                 ->assertJsonPath('data.kategori', 'daftar_hadir')
                 ->assertJsonPath('data.keterangan', 'Scan daftar hadir tanda tangan basah');

        $lampiranId = $response->json('data.id');
        $lampiran = RapatLampiran::find($lampiranId);
        $this->assertNotNull($lampiran);
        Storage::disk('public')->assertExists($lampiran->path);
    }

    public function test_upload_lampiran_validation_max_size(): void
    {
        Storage::fake('public');
        $rapat = $this->createSampleRapat();

        // Ukuran 12 MB (melebihi batas 10 MB)
        $largeFile = UploadedFile::fake()->create('dokumen_besar.pdf', 12288, 'application/pdf');

        $response = $this->postJson("/api/rapat/{$rapat->id}/lampiran", [
            'berkas' => $largeFile,
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('success', false);
    }

    public function test_upload_lampiran_validation_disallowed_mime(): void
    {
        Storage::fake('public');
        $rapat = $this->createSampleRapat();

        // Ekstensi tidak diizinkan (.exe)
        $exeFile = UploadedFile::fake()->create('script.exe', 100, 'application/x-msdownload');

        $response = $this->postJson("/api/rapat/{$rapat->id}/lampiran", [
            'berkas' => $exeFile,
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('success', false);
    }

    public function test_download_lampiran(): void
    {
        Storage::fake('public');
        $rapat = $this->createSampleRapat();

        $file = UploadedFile::fake()->create('foto_kegiatan.jpg', 300, 'image/jpeg');
        $uploadRes = $this->postJson("/api/rapat/{$rapat->id}/lampiran", [
            'berkas' => $file,
            'kategori' => 'foto',
        ]);
        $lampiranId = $uploadRes->json('data.id');

        $downloadRes = $this->get("/api/rapat/{$rapat->id}/lampiran/{$lampiranId}/download");
        $downloadRes->assertStatus(200);
        $this->assertStringContainsString('attachment', $downloadRes->headers->get('content-disposition'));
        $this->assertStringContainsString('foto_kegiatan.jpg', $downloadRes->headers->get('content-disposition'));
    }

    public function test_delete_lampiran(): void
    {
        Storage::fake('public');
        $rapat = $this->createSampleRapat();

        $file = UploadedFile::fake()->create('bahan_tayang.pptx', 200, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        $uploadRes = $this->postJson("/api/rapat/{$rapat->id}/lampiran", [
            'berkas' => $file,
            'kategori' => 'materi',
        ]);
        $lampiranId = $uploadRes->json('data.id');
        $lampiran = RapatLampiran::find($lampiranId);

        $deleteRes = $this->deleteJson("/api/rapat/{$rapat->id}/lampiran/{$lampiranId}");
        $deleteRes->assertStatus(200)
                  ->assertJsonPath('success', true);

        $this->assertNull(RapatLampiran::find($lampiranId));
        Storage::disk('public')->assertMissing($lampiran->path);
    }
}

