<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rapat extends Model
{
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
        'tempat',
        'anggota',
        'poinPembahasan',
        'tindakLanjut',
        'ringkasanAI',
        'ideBaruAI',
        'status',
        'created_at',
        'updated_at',
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

    public static function formatHariTanggal(?string $tglStr): string
    {
        if (!$tglStr) return "-";
        try {
            $time = strtotime($tglStr);
            if (!$time) return $tglStr;
            $hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            $bulanArr = [
                1 => "Januari", 2 => "Februari", 3 => "Maret", 4 => "April", 5 => "Mei", 6 => "Juni",
                7 => "Juli", 8 => "Agustus", 9 => "September", 10 => "Oktober", 11 => "November", 12 => "Desember"
            ];
            $hari = $hariArr[(int)date('w', $time)];
            $tgl = (int)date('j', $time);
            $bln = $bulanArr[(int)date('n', $time)];
            $thn = date('Y', $time);
            return "{$hari} / {$tgl} {$bln} {$thn}";
        } catch (\Throwable $e) {
            return $tglStr;
        }
    }

    public function toApiDetail(): array
    {
        return [
            'id' => (string)$this->id,
            'tanggal' => (string)$this->tanggal,
            'topik' => (string)$this->topik,
            'pimpinanRapat' => (string)$this->pimpinanRapat,
            'notulis' => (string)$this->notulis,
            'waktu' => (string)($this->waktu ?? ''),
            'tempat' => (string)($this->tempat ?? ''),
            'anggota' => self::parseAnggota($this->anggota),
            'poinPembahasan' => self::parsePoinPembahasan($this->poinPembahasan),
            'tindakLanjut' => self::parseTindakLanjut($this->tindakLanjut),
            'ringkasanAI' => $this->ringkasanAI,
            'ideBaruAI' => $this->ideBaruAI,
            'status' => $this->status ?? 'Selesai',
            'created_at' => $this->created_at ? (string)$this->created_at : null,
            'updated_at' => $this->updated_at ? (string)$this->updated_at : null,
        ];
    }
}
