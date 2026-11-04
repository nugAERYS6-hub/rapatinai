<?php

use App\Http\Controllers\Pengaturan\BackupController;
use App\Http\Controllers\Rapat\AiController;
use App\Http\Controllers\Rapat\ExportController;
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
    Route::get('/rapat/{id}', [RapatController::class, 'show']);

    // --- 1. Manajemen Rapat (Operasi Tulis CRUD - Rate Limited) ---
    Route::middleware(['throttle:crud'])->group(function () {
        Route::post('/rapat', [RapatController::class, 'store']);
        Route::put('/rapat/{id}', [RapatController::class, 'update']);
        Route::delete('/rapat/{id}', [RapatController::class, 'destroy']);
    });

    // --- 2. Fitur AI Notulensi (Gemini Flash - Strict Rate Limited) ---
    Route::middleware(['throttle:ai'])->group(function () {
        Route::post('/rapat/{id}/rangkum', [AiController::class, 'rangkum']);
        Route::post('/rapat/{id}/ide-baru', [AiController::class, 'ideBaru']);
        Route::post('/rapat/{id}/action-items', [AiController::class, 'actionItems']);
    });

    // --- 3. Ekspor Dokumen Resmi (PDF & Word) & Profil Instansi ---
    Route::get('/instansi', [ExportController::class, 'getInstansi']);
    Route::get('/rapat/{id}/export-pdf', [ExportController::class, 'exportPdf']);
    Route::get('/rapat/{id}/export-word', [ExportController::class, 'exportWord']);

    // --- 4. Pengaturan & Cadangan Database (Strict Rate Limited) ---
    Route::middleware(['throttle:backup'])->group(function () {
        Route::get('/backup/mysql', [BackupController::class, 'backupMysql']);
        Route::post('/backup/restore', [BackupController::class, 'restoreBackup']);
    });
});
