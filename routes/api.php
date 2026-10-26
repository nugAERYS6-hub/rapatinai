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
| Rute API dipisahkan berdasarkan fungsi dan menu:
| 1. Manajemen & Data Rapat (Menu Rapat Baru & Riwayat Rapat)
| 2. Fitur AI Notulensi (Menu Riwayat Rapat / Detail)
| 3. Ekspor Dokumen Resmi (Menu Riwayat Rapat / Detail)
| 4. Pengaturan & Database (Menu Pengaturan)
*/

// --- 1. Manajemen Rapat (CRUD & Statistik) ---
Route::get('/stats', [RapatController::class, 'stats']);
Route::get('/rapat', [RapatController::class, 'index']);
Route::get('/rapat/{id}', [RapatController::class, 'show']);
Route::post('/rapat', [RapatController::class, 'store']);
Route::put('/rapat/{id}', [RapatController::class, 'update']);
Route::delete('/rapat/{id}', [RapatController::class, 'destroy']);

// --- 2. Fitur AI Notulensi ---
Route::post('/rapat/{id}/rangkum', [AiController::class, 'rangkum']);
Route::post('/rapat/{id}/ide-baru', [AiController::class, 'ideBaru']);
Route::post('/rapat/{id}/action-items', [AiController::class, 'actionItems']);

// --- 3. Ekspor Dokumen Resmi (PDF & Word) ---
Route::get('/rapat/{id}/export-pdf', [ExportController::class, 'exportPdf']);
Route::get('/rapat/{id}/export-word', [ExportController::class, 'exportWord']);

// --- 4. Pengaturan & Cadangan Database ---
Route::get('/backup/mysql', [BackupController::class, 'backupMysql']);
Route::post('/backup/restore', [BackupController::class, 'restoreBackup']);
