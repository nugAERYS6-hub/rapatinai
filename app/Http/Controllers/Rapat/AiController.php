<?php

namespace App\Http\Controllers\Rapat;

use App\Http\Controllers\Controller;
use App\Models\Rapat;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    /**
     * Membuat Ringkasan Eksekutif AI
     */
    public function rangkum($id)
    {
        @set_time_limit(90);

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
            Log::error("Error rangkum rapat {$id}: " . $e->getMessage());
            $errorInfo = GeminiService::klasifikasiError($e);
            return response()->json([
                'success' => false,
                'pesan' => $errorInfo['pesan'],
                'tipe' => $errorInfo['tipe'],
                'detail' => config('app.debug') ? $e->getMessage() : null,
            ], $errorInfo['status']);
        }
    }

    /**
     * Membuat Rekomendasi & Ide Baru Strategis AI
     */
    public function ideBaru($id)
    {
        @set_time_limit(90);

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
            Log::error("Error ide baru rapat {$id}: " . $e->getMessage());
            $errorInfo = GeminiService::klasifikasiError($e);
            return response()->json([
                'success' => false,
                'pesan' => $errorInfo['pesan'],
                'tipe' => $errorInfo['tipe'],
                'detail' => config('app.debug') ? $e->getMessage() : null,
            ], $errorInfo['status']);
        }
    }

    /**
     * Mengekstrak Action Items & Penugasan AI
     */
    public function actionItems($id)
    {
        @set_time_limit(90);

        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Rapat tidak ditemukan'], 404);
            }

            $items = GeminiService::mintaActionItemsAI($rapat);
            return response()->json(['success' => true, 'actionItems' => $items]);
        } catch (\Throwable $e) {
            Log::error("Error action items rapat {$id}: " . $e->getMessage());
            $errorInfo = GeminiService::klasifikasiError($e);
            return response()->json([
                'success' => false,
                'pesan' => $errorInfo['pesan'],
                'tipe' => $errorInfo['tipe'],
                'detail' => config('app.debug') ? $e->getMessage() : null,
            ], $errorInfo['status']);
        }
    }
}
