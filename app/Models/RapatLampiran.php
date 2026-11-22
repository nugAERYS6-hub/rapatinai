<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class RapatLampiran extends Model
{
    protected $table = 'rapat_lampiran';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'rapat_id',
        'nama_file',
        'path',
        'ukuran',
        'tipe_mime',
        'kategori',
        'keterangan',
    ];

    /**
     * Relasi ke model Rapat
     */
    public function rapat()
    {
        return $this->belongsTo(Rapat::class, 'rapat_id', 'id');
    }

    /**
     * Hook model: pastikan fisik berkas di storage terhapus saat baris lampiran dihapus
     */
    protected static function booted()
    {
        static::deleting(function ($lampiran) {
            $lampiran->hapusBerkasFisik();
        });
    }

    /**
     * Menghapus fisik berkas dari media penyimpanan ('local' atau 'public')
     */
    public function hapusBerkasFisik(): bool
    {
        try {
            $path = (string)$this->path;
            if (empty($path)) {
                return false;
            }

            if (Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
                return true;
            }

            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                return true;
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Gagal menghapus berkas fisik lampiran {$this->id}: " . $e->getMessage());
        }

        return false;
    }

    /**
     * Format ukuran berkas dalam representasi byte yang mudah dibaca (KB / MB)
     */
    public function formatUkuran(): string
    {
        $bytes = (int)$this->ukuran;
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }

    /**
     * Representasi data untuk JSON API
     */
    public function toApiArray(): array
    {
        return [
            'id'               => (string)$this->id,
            'rapat_id'         => (string)$this->rapat_id,
            'nama_file'        => (string)$this->nama_file,
            'ukuran'           => (int)$this->ukuran,
            'ukuran_formatted' => $this->formatUkuran(),
            'tipe_mime'        => (string)$this->tipe_mime,
            'kategori'         => (string)($this->kategori ?: 'dokumen'),
            'keterangan'       => $this->keterangan,
            'preview_url'      => url("/api/rapat/{$this->rapat_id}/lampiran/{$this->id}/preview"),
            'download_url'     => url("/api/rapat/{$this->rapat_id}/lampiran/{$this->id}/download"),
            'url'              => url("/api/rapat/{$this->rapat_id}/lampiran/{$this->id}/preview"),
            'is_private'       => true,
            'created_at'       => $this->created_at ? (string)$this->created_at : null,
        ];
    }
}

