<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRapatRequest;
use App\Http\Requests\UpdateRapatRequest;
use App\Models\Rapat;
use App\Services\ExportService;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RapatController extends Controller
{
    public function stats()
    {
        try {
            $totalRapat = Rapat::count();
            $bulanIni = date('Y-m');
            $rapatBulanIni = Rapat::where('tanggal', 'like', "{$bulanIni}%")->count();
            $denganAI = Rapat::whereNotNull('ringkasanAI')
                ->where('ringkasanAI', '!=', '')
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'totalRapat' => $totalRapat,
                    'rapatBulanIni' => $rapatBulanIni,
                    'denganAI' => $denganAI,
                    'bulanIni' => $bulanIni,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error("Error stats: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $page = max(1, (int)$request->query('page', 1));
            $limit = min(100, max(1, (int)$request->query('limit', 20)));
            $offset = ($page - 1) * $limit;
            $q = trim((string)$request->query('q', ''));
            $filter = $request->query('filter', 'all');

            $query = Rapat::query();

            if ($q !== '') {
                $query->where(function ($builder) use ($q) {
                    $builder->where('topik', 'like', "%{$q}%")
                        ->orWhere('pimpinanRapat', 'like', "%{$q}%")
                        ->orWhere('notulis', 'like', "%{$q}%")
                        ->orWhere('poinPembahasan', 'like', "%{$q}%")
                        ->orWhere('ringkasanAI', 'like', "%{$q}%");
                });
            } else {
                if ($filter === 'bulan_ini') {
                    $bulanIni = date('Y-m');
                    $query->where('tanggal', 'like', "{$bulanIni}%");
                } elseif ($filter === 'ada_ai') {
                    $query->whereNotNull('ringkasanAI')->where('ringkasanAI', '!=', '');
                }
            }

            $totalCount = $query->count();
            $items = $query->orderBy('tanggal', 'desc')
                ->orderBy('created_at', 'desc')
                ->offset($offset)
                ->limit($limit)
                ->get();

            $data = $items->map(function ($r) {
                return [
                    'id' => (string)$r->id,
                    'tanggal' => (string)$r->tanggal,
                    'topik' => (string)$r->topik,
                    'pimpinanRapat' => (string)$r->pimpinanRapat,
                    'notulis' => (string)$r->notulis,
                    'status' => $r->status ?? 'Selesai',
                    'created_at' => (string)$r->created_at,
                    'hasRingkasan' => (!empty($r->ringkasanAI)) ? 1 : 0,
                    'hasIdeBaru' => (!empty($r->ideBaruAI)) ? 1 : 0,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $totalCount,
                    'totalPages' => (int)ceil($totalCount / $limit) ?: 1,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error("Error GET /api/rapat: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Notulen rapat tidak ditemukan'], 404);
            }
            return response()->json($rapat->toApiDetail());
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function store(StoreRapatRequest $request)
    {
        try {
            // Gunakan ULID sebagai ID unik yang aman dari collision
            $newId = (string) Str::ulid();

            $anggota = $request->input('anggota', []);
            $poinPembahasan = $request->input('poinPembahasan', []);
            $tindakLanjut = $request->input('tindakLanjut', []);

            $rapat = Rapat::create([
                'id'             => $newId,
                'tanggal'        => $request->input('tanggal'),
                'topik'          => $request->input('topik'),
                'pimpinanRapat'  => $request->input('pimpinanRapat'),
                'notulis'        => $request->input('notulis'),
                'waktu'          => $request->input('waktu', ''),
                'tempat'         => $request->input('tempat', ''),
                'anggota'        => is_string($anggota) ? $anggota : json_encode($anggota, JSON_UNESCAPED_UNICODE),
                'poinPembahasan' => is_string($poinPembahasan) ? $poinPembahasan : json_encode($poinPembahasan, JSON_UNESCAPED_UNICODE),
                'tindakLanjut'   => is_string($tindakLanjut) ? $tindakLanjut : json_encode($tindakLanjut, JSON_UNESCAPED_UNICODE),
                'ringkasanAI'    => null,
                'ideBaruAI'      => null,
                'status'         => $request->input('status', 'Selesai'),
            ]);

            return response()->json([
                'success' => true,
                'data' => $rapat->toApiDetail(),
            ], 201);
        } catch (\Throwable $e) {
            Log::error("Error POST /api/rapat: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function update(UpdateRapatRequest $request, $id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Rapat tidak ditemukan'], 404);
            }

            if ($request->has('tanggal')) $rapat->tanggal = $request->input('tanggal');
            if ($request->has('topik')) $rapat->topik = $request->input('topik');
            if ($request->has('pimpinanRapat')) $rapat->pimpinanRapat = $request->input('pimpinanRapat');
            if ($request->has('notulis')) $rapat->notulis = $request->input('notulis');
            if ($request->has('waktu')) $rapat->waktu = $request->input('waktu');
            if ($request->has('tempat')) $rapat->tempat = $request->input('tempat');

            if ($request->has('anggota')) {
                $a = $request->input('anggota');
                $rapat->anggota = is_string($a) ? $a : json_encode($a, JSON_UNESCAPED_UNICODE);
            }
            if ($request->has('poinPembahasan')) {
                $p = $request->input('poinPembahasan');
                $rapat->poinPembahasan = is_string($p) ? $p : json_encode($p, JSON_UNESCAPED_UNICODE);
            }
            if ($request->has('tindakLanjut')) {
                $t = $request->input('tindakLanjut');
                $rapat->tindakLanjut = is_string($t) ? $t : json_encode($t, JSON_UNESCAPED_UNICODE);
            }
            if ($request->has('status')) $rapat->status = $request->input('status');
            if ($request->has('ringkasanAI')) $rapat->ringkasanAI = $request->input('ringkasanAI');
            if ($request->has('ideBaruAI')) $rapat->ideBaruAI = $request->input('ideBaruAI');

            $rapat->save();

            return response()->json([
                'success' => true,
                'data' => $rapat->toApiDetail(),
            ]);
        } catch (\Throwable $e) {
            Log::error("Error PUT /api/rapat/{$id}: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Rapat tidak ditemukan'], 404);
            }
            $rapat->delete();
            return response()->json(['success' => true, 'pesan' => 'Notulen rapat berhasil dihapus']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function rangkum($id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Rapat tidak ditemukan'], 404);
            }

            $ringkasan = GeminiService::mintaRingkasanAI($rapat);
            $rapat->ringkasanAI = $ringkasan;
            $rapat->save();

            return response()->json(['success' => true, 'ringkasanAI' => $ringkasan]);
        } catch (\Throwable $e) {
            Log::error("Error rangkum: " . $e->getMessage());
            return response()->json(['success' => false, 'pesan' => "Gagal membuat ringkasan AI: " . $e->getMessage()], 500);
        }
    }

    public function ideBaru($id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Rapat tidak ditemukan'], 404);
            }

            $ide = GeminiService::mintaIdeBaruAI($rapat);
            $rapat->ideBaruAI = $ide;
            $rapat->save();

            return response()->json(['success' => true, 'ideBaruAI' => $ide]);
        } catch (\Throwable $e) {
            Log::error("Error ide baru: " . $e->getMessage());
            return response()->json(['success' => false, 'pesan' => "Gagal membuat ide baru: " . $e->getMessage()], 500);
        }
    }

    public function actionItems($id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Rapat tidak ditemukan'], 404);
            }

            $items = GeminiService::mintaActionItemsAI($rapat);
            return response()->json(['success' => true, 'actionItems' => $items]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'pesan' => $e->getMessage()], 500);
        }
    }

    public function exportPdf($id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['pesan' => 'Rapat tidak ditemukan'], 404);
            }
            return ExportService::generatePdf($rapat);
        } catch (\Throwable $e) {
            Log::error("Error export PDF: " . $e->getMessage());
            return response()->make("Gagal mengunduh PDF: " . $e->getMessage(), 500);
        }
    }

    public function exportWord($id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['pesan' => 'Rapat tidak ditemukan'], 404);
            }
            return ExportService::generateWord($rapat);
        } catch (\Throwable $e) {
            Log::error("Error export Word: " . $e->getMessage());
            return response()->make("Gagal mengunduh Word: " . $e->getMessage(), 500);
        }
    }

    public function backupMysql()
    {
        try {
            $rows = Rapat::orderBy('created_at', 'desc')->get();
            $tanggalBackup = now()->format('Y-m-d H:i:s');
            $namaFile = 'backup_rapatinai_' . now()->format('Y-m-d') . '.sql';

            $sql = "-- ============================================\n";
            $sql .= "-- RapatinAI - Backup Database MySQL\n";
            $sql .= "-- Tanggal Backup: {$tanggalBackup}\n";
            $sql .= "-- Total Data: {$rows->count()} rapat\n";
            $sql .= "-- ============================================\n\n";

            $sql .= "SET NAMES utf8mb4;\n";
            $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

            // DROP & CREATE TABLE
            $sql .= "-- -------------------------------------------\n";
            $sql .= "-- Struktur Tabel: rapat\n";
            $sql .= "-- -------------------------------------------\n";
            $sql .= "DROP TABLE IF EXISTS `rapat`;\n";
            $sql .= "CREATE TABLE `rapat` (\n";
            $sql .= "  `id` VARCHAR(255) NOT NULL,\n";
            $sql .= "  `tanggal` VARCHAR(255) NOT NULL,\n";
            $sql .= "  `topik` TEXT NOT NULL,\n";
            $sql .= "  `pimpinanRapat` TEXT NOT NULL,\n";
            $sql .= "  `notulis` TEXT NOT NULL,\n";
            $sql .= "  `waktu` VARCHAR(255) DEFAULT NULL,\n";
            $sql .= "  `tempat` TEXT DEFAULT NULL,\n";
            $sql .= "  `anggota` LONGTEXT DEFAULT NULL,\n";
            $sql .= "  `poinPembahasan` LONGTEXT DEFAULT NULL,\n";
            $sql .= "  `tindakLanjut` LONGTEXT DEFAULT NULL,\n";
            $sql .= "  `ringkasanAI` LONGTEXT DEFAULT NULL,\n";
            $sql .= "  `ideBaruAI` LONGTEXT DEFAULT NULL,\n";
            $sql .= "  `status` VARCHAR(50) DEFAULT 'Selesai',\n";
            $sql .= "  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,\n";
            $sql .= "  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n";
            $sql .= "  PRIMARY KEY (`id`)\n";
            $sql .= ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n";

            // INSERT DATA
            if ($rows->count() > 0) {
                $sql .= "-- -------------------------------------------\n";
                $sql .= "-- Data Tabel: rapat ({$rows->count()} baris)\n";
                $sql .= "-- -------------------------------------------\n";
                $sql .= "LOCK TABLES `rapat` WRITE;\n";

                $columns = ['id', 'tanggal', 'topik', 'pimpinanRapat', 'notulis', 'waktu', 'tempat', 'anggota', 'poinPembahasan', 'tindakLanjut', 'ringkasanAI', 'ideBaruAI', 'status', 'created_at', 'updated_at'];

                foreach ($rows as $row) {
                    $values = [];
                    foreach ($columns as $col) {
                        $val = $row->{$col};
                        if ($val === null) {
                            $values[] = 'NULL';
                        } else {
                            $escaped = addslashes((string)$val);
                            $escaped = str_replace("\n", "\\n", $escaped);
                            $escaped = str_replace("\r", "\\r", $escaped);
                            $escaped = str_replace("\t", "\\t", $escaped);
                            $values[] = "'" . $escaped . "'";
                        }
                    }
                    $sql .= "INSERT INTO `rapat` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");\n";
                }

                $sql .= "UNLOCK TABLES;\n\n";
            }

            $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";
            $sql .= "-- Backup selesai. {$rows->count()} data berhasil diekspor.\n";

            return response($sql, 200, [
                'Content-Type' => 'application/sql; charset=utf-8',
                'Content-Disposition' => "attachment; filename=\"{$namaFile}\"",
            ]);
        } catch (\Throwable $e) {
            Log::error("Error backup MySQL: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal membuat backup: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Restore database dari file .sql yang diunggah.
     * Hanya menerima pernyataan INSERT untuk keamanan ekstra.
     */
    public function restoreBackup(Request $request)
    {
        // Validasi file upload
        $request->validate([
            'file_sql' => ['required', 'file', 'mimes:sql,txt', 'max:51200'], // max 50MB
        ], [
            'file_sql.required' => 'File SQL wajib dipilih.',
            'file_sql.mimes'    => 'File harus berekstensi .sql atau .txt.',
            'file_sql.max'      => 'Ukuran file maksimal 50 MB.',
        ]);

        try {
            $file = $request->file('file_sql');
            $konten = file_get_contents($file->getRealPath());

            if (empty(trim($konten))) {
                return response()->json(['success' => false, 'pesan' => 'File SQL kosong, tidak ada yang dipulihkan.'], 400);
            }

            // Keamanan: hanya izinkan pernyataan yang diketahui aman
            $barisBaris = array_filter(
                preg_split('/\r?\n/', $konten),
                fn($b) => !empty(trim($b)) && !str_starts_with(ltrim($b), '--')
            );

            // Gabungkan kembali dan bagi berdasarkan titik-koma
            $sqlGabung = implode("\n", $barisBaris);
            $pernyataan = array_filter(
                explode(';', $sqlGabung),
                fn($s) => !empty(trim($s))
            );

            // Whitelist: pernyataan yang diizinkan
            $izinkan = ['SET', 'DROP TABLE', 'CREATE TABLE', 'LOCK TABLES', 'UNLOCK TABLES', 'INSERT INTO'];
            $jumlahInsert = 0;
            $jumlahTotal = 0;

            DB::beginTransaction();

            foreach ($pernyataan as $sql) {
                $bersih = strtoupper(ltrim(trim($sql)));
                $diizinkan = false;
                foreach ($izinkan as $prefix) {
                    if (str_starts_with($bersih, $prefix)) {
                        $diizinkan = true;
                        break;
                    }
                }

                if (!$diizinkan) {
                    // Lewati pernyataan yang tidak ada di whitelist
                    continue;
                }

                DB::statement(trim($sql));
                $jumlahTotal++;

                if (str_starts_with($bersih, 'INSERT INTO')) {
                    $jumlahInsert++;
                }
            }

            DB::commit();

            Log::info("Restore database berhasil: {$jumlahInsert} baris INSERT dari {$jumlahTotal} pernyataan.");

            return response()->json([
                'success' => true,
                'pesan'   => "Database berhasil dipulihkan! {$jumlahInsert} baris data telah diimpor.",
                'detail'  => [
                    'total_pernyataan' => $jumlahTotal,
                    'total_insert'     => $jumlahInsert,
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Error restore backup: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'pesan'   => 'Gagal memulihkan database: ' . $e->getMessage(),
            ], 500);
        }
    }
}
