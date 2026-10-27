<?php

namespace App\Http\Controllers\Rapat;

use App\Http\Controllers\Controller;
use App\Models\Rapat;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ExportController extends Controller
{
    /**
     * Mendapatkan profil & konfigurasi kop surat instansi
     */
    public function getInstansi()
    {
        return response()->json([
            'success' => true,
            'data' => ExportService::getInstansiConfig(),
        ]);
    }

    /**
     * Ekspor Laporan Resmi ke format PDF
     */
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

    /**
     * Ekspor Laporan Resmi ke format Word (DOCX)
     */
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
