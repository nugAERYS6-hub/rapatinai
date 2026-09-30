<?php

namespace App\Http\Controllers;

use App\Models\Rapat;
use App\Services\ExportService;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

    public function store(Request $request)
    {
        try {
            $tanggal = $request->input('tanggal');
            $topik = $request->input('topik');
            $pimpinan = $request->input('pimpinanRapat');
            $notulis = $request->input('notulis');

            if (!$tanggal || !$topik || !$pimpinan || !$notulis) {
                return response()->json([
                    'success' => false,
                    'pesan' => 'Kolom tanggal, topik, pimpinan, dan notulis wajib diisi.',
                ], 400);
            }

            $newId = (string)round(microtime(true) * 1000);

            $anggota = $request->input('anggota', []);
            $poinPembahasan = $request->input('poinPembahasan', []);
            $tindakLanjut = $request->input('tindakLanjut', []);

            $rapat = Rapat::create([
                'id' => $newId,
                'tanggal' => $tanggal,
                'topik' => $topik,
                'pimpinanRapat' => $pimpinan,
                'notulis' => $notulis,
                'waktu' => $request->input('waktu', ''),
                'tempat' => $request->input('tempat', ''),
                'anggota' => is_string($anggota) ? $anggota : json_encode($anggota, JSON_UNESCAPED_UNICODE),
                'poinPembahasan' => is_string($poinPembahasan) ? $poinPembahasan : json_encode($poinPembahasan, JSON_UNESCAPED_UNICODE),
                'tindakLanjut' => is_string($tindakLanjut) ? $tindakLanjut : json_encode($tindakLanjut, JSON_UNESCAPED_UNICODE),
                'ringkasanAI' => null,
                'ideBaruAI' => null,
                'status' => $request->input('status', 'Selesai'),
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

    public function update(Request $request, $id)
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
}
