<?php

use App\Http\Controllers\Pengaturan\BackupController;
use App\Http\Controllers\Rapat\AiController;
use App\Http\Controllers\Rapat\ExportController;
use App\Http\Controllers\Rapat\LampiranController;
use App\Http\Controllers\Rapat\RapatController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - RapatinAI
|--------------------------------------------------------------------------
| Terproteksi oleh:
| - EnsureApiAuthorized ('api.auth'): Validasi kunci API & proteksi akses
| - RateLimiter ('throttle:api', 'throttle:crud', 'throttle:ai', 'throttle:backup'):
|   Pembatasan frekuensi permintaan untuk mencegah penyalahgunaan
*/

Route::middleware(['api.auth', 'throttle:api'])->group(function () {

    // --- 1. Manajemen Rapat (Baca Data & Statistik) ---
    Route::get('/stats', [RapatController::class, 'stats']);
    Route::get('/rapat', [RapatController::class, 'index']);
    Route::get('/rapat/trash', [RapatController::class, 'trash']);
    Route::get('/rapat/{id}', [RapatController::class, 'show']);

    // --- 1. Manajemen Rapat (Operasi Tulis CRUD - Rate Limited) ---
    Route::middleware(['throttle:crud'])->group(function () {
        Route::post('/rapat', [RapatController::class, 'store']);
        Route::put('/rapat/{id}', [RapatController::class, 'update']);
        Route::delete('/rapat/{id}', [RapatController::class, 'destroy']);
        Route::post('/rapat/{id}/restore', [RapatController::class, 'restore']);
        Route::delete('/rapat/{id}/force', [RapatController::class, 'forceDelete']);
        Route::patch('/rapat/{id}/action-items/{index}/toggle', [RapatController::class, 'toggleActionItem']);
    });

    // --- 2. Fitur AI Notulensi (Gemini Flash - Strict Rate Limited) ---
    Route::middleware(['throttle:ai'])->group(function () {
        Route::post('/rapat/{id}/rangkum', [AiController::class, 'rangkum']);
        Route::post('/rapat/{id}/ide-baru', [AiController::class, 'ideBaru']);
        Route::post('/rapat/{id}/action-items', [AiController::class, 'actionItems']);
    });

    // --- 3. Lampiran Berkas Dokumen Pendukung Rapat ---
    Route::get('/rapat/{id}/lampiran', [LampiranController::class, 'index']);
    Route::get('/rapat/{id}/lampiran/{lampiranId}/download', [LampiranController::class, 'download']);
    Route::get('/rapat/{id}/lampiran/{lampiranId}/preview', [LampiranController::class, 'preview']);
    Route::middleware(['throttle:crud'])->group(function () {
        Route::post('/rapat/{id}/lampiran', [LampiranController::class, 'store']);
        Route::delete('/rapat/{id}/lampiran/{lampiranId}', [LampiranController::class, 'destroy']);
    });

    // --- 4. Ekspor Dokumen Resmi (PDF & Word) & Profil Instansi ---
    Route::get('/instansi', [ExportController::class, 'getInstansi']);
    Route::get('/rapat/{id}/export-pdf', [ExportController::class, 'exportPdf']);
    Route::get('/rapat/{id}/export-word', [ExportController::class, 'exportWord']);

    // --- 5. Pengaturan & Cadangan Database (Strict Rate Limited) ---
    Route::middleware(['throttle:backup'])->group(function () {
        Route::get('/backup/mysql', [BackupController::class, 'backupMysql']);
        Route::post('/backup/restore', [BackupController::class, 'restoreBackup']);
    });
});
