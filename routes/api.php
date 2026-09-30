<?php

use App\Http\Controllers\RapatController;
use Illuminate\Support\Facades\Route;

Route::get('/stats', [RapatController::class, 'stats']);
Route::get('/rapat', [RapatController::class, 'index']);
Route::get('/rapat/{id}', [RapatController::class, 'show']);
Route::post('/rapat', [RapatController::class, 'store']);
Route::put('/rapat/{id}', [RapatController::class, 'update']);
Route::delete('/rapat/{id}', [RapatController::class, 'destroy']);

Route::post('/rapat/{id}/rangkum', [RapatController::class, 'rangkum']);
Route::post('/rapat/{id}/ide-baru', [RapatController::class, 'ideBaru']);
Route::post('/rapat/{id}/action-items', [RapatController::class, 'actionItems']);

Route::get('/rapat/{id}/export-pdf', [RapatController::class, 'exportPdf']);
Route::get('/rapat/{id}/export-word', [RapatController::class, 'exportWord']);
