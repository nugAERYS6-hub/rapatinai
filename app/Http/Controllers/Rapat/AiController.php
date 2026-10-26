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

    /**
     * Membuat Rekomendasi & Ide Baru Strategis AI
     */
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

    /**
     * Mengekstrak Action Items & Penugasan AI
     */
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
}
