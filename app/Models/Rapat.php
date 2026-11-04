<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rapat extends Model
{
    use SoftDeletes;

    protected $table = 'rapat';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tanggal',
        'topik',
        'pimpinanRapat',
        'notulis',
        'waktu',
        'waktu_selesai',
        'tempat',
        'anggota',
        'poinPembahasan',
        'tindakLanjut',
        'ringkasanAI',
        'ideBaruAI',
        'status',
        'created_by',
        'taskboard_id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Type casting atribut model
     */
    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'deleted_at' => 'datetime',
    ];

    public static function parseAnggota($nilai): array
    {
        if (empty($nilai)) {
            return [];
        }
        if (is_array($nilai)) {
            $hasil = $nilai;
        } else {
            $decoded = json_decode($nilai, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $hasil = $decoded;
            } else {
                $hasil = null;
            }
        }

        if (is_array($hasil)) {
            $out = [];
            foreach ($hasil as $item) {
                if (is_string($item)) {
                    $out[] = [
                        'nama' => trim($item),
                        'jabatan' => '-',
                        'asalInstansi' => '-',
                    ];
                } elseif (is_array($item)) {
                    $out[] = [
                        'nama' => $item['nama'] ?? '',
                        'jabatan' => !empty($item['jabatan']) ? $item['jabatan'] : '-',
                        'asalInstansi' => !empty($item['asalInstansi']) ? $item['asalInstansi'] : '-',
                    ];
                }
            }
            return $out;
        }

        $parts = explode(',', (string)$nilai);
        $out = [];
        foreach ($parts as $p) {
            $t = trim($p);
            if ($t !== '') {
                $out[] = [
                    'nama' => $t,
                    'jabatan' => '-',
                    'asalInstansi' => '-',
                ];
            }
        }
        return $out;
    }

    public static function parsePoinPembahasan($nilai): array
    {
        if (empty($nilai)) {
            return [];
        }
        if (is_array($nilai)) {
            $hasil = $nilai;
        } else {
            $decoded = json_decode($nilai, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $hasil = $decoded;
            } else {
                $hasil = null;
            }
        }

        if (is_array($hasil)) {
            $out = [];
            foreach ($hasil as $p) {
                if (is_string($p)) {
                    $out[] = ['isi' => $p, 'keputusan' => 'Disetujui'];
                } elseif (is_array($p)) {
                    $out[] = [
                        'isi' => $p['isi'] ?? '',
                        'keputusan' => $p['keputusan'] ?? 'Disetujui',
                    ];
                }
            }
            return $out;
        }

        $parts = explode("\n", (string)$nilai);
        $out = [];
        foreach ($parts as $line) {
            $t = trim($line);
            if ($t !== '') {
                $out[] = ['isi' => $t, 'keputusan' => 'Disetujui'];
            }
        }
        return $out;
    }

    public static function parseTindakLanjut($nilai): array
    {
        if (empty($nilai)) {
            return [];
        }
        if (is_array($nilai)) {
            $hasil = $nilai;
        } else {
            $decoded = json_decode($nilai, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $hasil = $decoded;
            } else {
                $hasil = null;
            }
        }

        if (is_array($hasil)) {
            $out = [];
            foreach ($hasil as $t) {
                if (is_string($t)) {
                    $out[] = [
                        'tugas' => $t,
                        'pic' => '-',
                        'deadline' => '-',
                        'selesai' => false,
                    ];
                } elseif (is_array($t)) {
                    $out[] = [
                        'tugas' => $t['tugas'] ?? ($t['isi'] ?? ''),
                        'pic' => $t['pic'] ?? '-',
                        'deadline' => $t['deadline'] ?? '-',
                        'selesai' => (bool)($t['selesai'] ?? false),
                    ];
                }
            }
            return $out;
        }

        $parts = explode("\n", (string)$nilai);
        $out = [];
        foreach ($parts as $line) {
            $t = trim($line);
            if ($t !== '') {
                $out[] = [
                    'tugas' => $t,
                    'pic' => '-',
                    'deadline' => '-',
                    'selesai' => false,
                ];
            }
        }
        return $out;
    }

    /**
     * Accessor untuk menggabungkan waktu mulai dan waktu selesai menjadi teks tampilan
     */
    public function getFormattedWaktuAttribute(): string
    {
        $m = $this->waktu ? substr((string)$this->waktu, 0, 5) : '';
        $s = $this->waktu_selesai ? substr((string)$this->waktu_selesai, 0, 5) : '';
        if ($m && $s) {
            return "{$m} - {$s}";
        }
        return $m;
    }

    /**
     * Membantu memvalidasi & mem-parsing input waktu (bisa berupa rentang atau terpisah) ke format TIME SQL
     */
    public static function parseWaktuInput(?string $waktu, ?string $waktuSelesai = null): array
    {
        $waktu = trim((string)$waktu);
        $waktuSelesai = trim((string)$waktuSelesai);

        if (strpos($waktu, '-') !== false && empty($waktuSelesai)) {
            $parts = explode('-', $waktu, 2);
            return [
                self::parseTimeSingle($parts[0]),
                self::parseTimeSingle($parts[1]),
            ];
        }

        return [
            self::parseTimeSingle($waktu),
            self::parseTimeSingle($waktuSelesai),
        ];
    }

    private static function parseTimeSingle(?string $str): ?string
    {
        if (!$str) return null;
        $clean = trim(str_replace('.', ':', $str));
        if (preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?/', $clean, $matches)) {
            $h = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $m = $matches[2];
            $s = isset($matches[3]) ? $matches[3] : '00';
            return "{$h}:{$m}:{$s}";
        }
        return null;
    }

    public static function formatHariTanggal($tgl): string
    {
        if (!$tgl) return "-";
        if ($tgl instanceof \DateTimeInterface) {
            $time = $tgl->getTimestamp();
        } else {
            $time = strtotime((string)$tgl);
        }
        if (!$time) return (string)$tgl;
        $hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        $bulanArr = [
            1 => "Januari", 2 => "Februari", 3 => "Maret", 4 => "April", 5 => "Mei", 6 => "Juni",
            7 => "Juli", 8 => "Agustus", 9 => "September", 10 => "Oktober", 11 => "November", 12 => "Desember"
        ];
        $hari = $hariArr[(int)date('w', $time)];
        $tglNum = (int)date('j', $time);
        $bln = $bulanArr[(int)date('n', $time)];
        $thn = date('Y', $time);
        return "{$hari} / {$tglNum} {$bln} {$thn}";
    }

    public function toApiSummary(): array
    {
        $tglFormatted = $this->tanggal instanceof \DateTimeInterface
            ? $this->tanggal->format('Y-m-d')
            : (string)$this->tanggal;

        return [
            'id' => (string)$this->id,
            'tanggal' => $tglFormatted,
            'waktu' => (string)$this->formatted_waktu,
            'waktu_mulai' => $this->waktu ? substr((string)$this->waktu, 0, 5) : '',
            'waktu_selesai' => $this->waktu_selesai ? substr((string)$this->waktu_selesai, 0, 5) : '',
            'topik' => (string)$this->topik,
            'pimpinanRapat' => (string)$this->pimpinanRapat,
            'notulis' => (string)$this->notulis,
            'status' => $this->status ?? 'Selesai',
            'created_by' => $this->created_by,
            'taskboard_id' => $this->taskboard_id,
            'created_at' => $this->created_at ? (string)$this->created_at : null,
            'deleted_at' => $this->deleted_at ? (string)$this->deleted_at : null,
            'hasRingkasan' => (!empty($this->ringkasanAI)) ? 1 : 0,
            'hasIdeBaru' => (!empty($this->ideBaruAI)) ? 1 : 0,
        ];
    }

    public function toApiDetail(): array
    {
        $tglFormatted = $this->tanggal instanceof \DateTimeInterface
            ? $this->tanggal->format('Y-m-d')
            : (string)$this->tanggal;

        $waktuMulai = $this->waktu ? substr((string)$this->waktu, 0, 5) : '';
        $waktuSelesai = $this->waktu_selesai ? substr((string)$this->waktu_selesai, 0, 5) : '';

        return [
            'id'             => (string)$this->id,
            'tanggal'        => $tglFormatted,
            'topik'          => (string)$this->topik,
            'pimpinanRapat'  => (string)$this->pimpinanRapat,
            'notulis'        => (string)$this->notulis,
            'waktu'          => $this->formatted_waktu,
            'waktu_mulai'    => $waktuMulai,
            'waktu_selesai'  => $waktuSelesai,
            'tempat'         => (string)($this->tempat ?? ''),
            'anggota'        => self::parseAnggota($this->anggota),
            'poinPembahasan' => self::parsePoinPembahasan($this->poinPembahasan),
            'tindakLanjut'   => self::parseTindakLanjut($this->tindakLanjut),
            'ringkasanAI'    => $this->ringkasanAI,
            'ideBaruAI'      => $this->ideBaruAI,
            'status'         => $this->status ?? 'Selesai',
            'created_by'     => $this->created_by,
            'taskboard_id'   => $this->taskboard_id,
            'created_at'     => $this->created_at ? (string)$this->created_at : null,
            'updated_at'     => $this->updated_at ? (string)$this->updated_at : null,
            'deleted_at'     => $this->deleted_at ? (string)$this->deleted_at : null,
            'lampiran'       => $this->lampiran ? $this->lampiran->map(fn($l) => $l->toApiArray())->values()->all() : [],
        ];
    }

    /**
     * Relasi ke berkas lampiran pendukung rapat
     */
    public function lampiran()
    {
        return $this->hasMany(RapatLampiran::class, 'rapat_id', 'id')->orderBy('created_at', 'desc');
    }
}
