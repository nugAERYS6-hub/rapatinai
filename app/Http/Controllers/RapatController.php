<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Pengaturan\BackupController;
use App\Http\Controllers\Rapat\AiController;
use App\Http\Controllers\Rapat\ExportController;
use App\Http\Controllers\Rapat\RapatController as CoreRapatController;
use App\Services\Pengaturan\BackupService;
use Illuminate\Http\Request;

/**
 * Controller agregator untuk kompatibilitas penuh.
 * Implementasi fungsional telah dipisahkan ke folder per fungsi:
 * - App\Http\Controllers\Rapat\RapatController (CRUD & Statistik)
 * - App\Http\Controllers\Rapat\AiController (Ringkasan, Ide Baru, Action Items AI)
 * - App\Http\Controllers\Rapat\ExportController (Ekspor PDF & Word)
 * - App\Http\Controllers\Pengaturan\BackupController (Backup & Restore Database)
 */
class RapatController extends CoreRapatController
{
    protected AiController $aiController;
    protected ExportController $exportController;
    protected BackupController $backupController;

    public function __construct()
    {
        $this->aiController = app(AiController::class);
        $this->exportController = app(ExportController::class);
        $this->backupController = app(BackupController::class);
    }

    public function rangkum($id)
    {
        return $this->aiController->rangkum($id);
    }

    public function ideBaru($id)
    {
        return $this->aiController->ideBaru($id);
    }

    public function actionItems($id)
    {
        return $this->aiController->actionItems($id);
    }

    public function exportPdf($id)
    {
        return $this->exportController->exportPdf($id);
    }

    public function exportWord($id)
    {
        return $this->exportController->exportWord($id);
    }

    public function backupMysql()
    {
        return $this->backupController->backupMysql();
    }

    public function restoreBackup(Request $request)
    {
        return $this->backupController->restoreBackup($request);
    }
}
