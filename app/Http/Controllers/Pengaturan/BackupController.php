<?php

namespace App\Http\Controllers\Pengaturan;

use App\Http\Controllers\Controller;
use App\Services\Pengaturan\BackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BackupController extends Controller
{
    protected BackupService $backupService;

    public function __construct(BackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    /**
     * Unduh backup database MySQL format .sql
     */
    public function backupMysql()
    {
        try {
            $dump = $this->backupService->generateMysqlDump();

            return response($dump['content'], 200, [
                'Content-Type' => 'application/sql; charset=utf-8',
                'Content-Disposition' => "attachment; filename=\"{$dump['filename']}\"",
            ]);
        } catch (\Throwable $e) {
            Log::error("Error backup MySQL: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal membuat backup: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Restore database dari file .sql yang diunggah.
     */
    public function restoreBackup(Request $request)
    {
        $request->validate([
            'file_sql' => ['required', 'file', 'mimes:sql,txt', 'max:51200'], // max 50MB
        ], [
            'file_sql.required' => 'File SQL wajib dipilih.',
            'file_sql.mimes'    => 'File harus berekstensi .sql atau .txt.',
            'file_sql.max'      => 'Ukuran file maksimal 50 MB.',
        ]);

        try {
            $file = $request->file('file_sql');
            $hasil = $this->backupService->restoreFromSqlFile($file);

            return response()->json([
                'success' => true,
                'pesan'   => "Database berhasil dipulihkan! {$hasil['total_insert']} baris data telah diimpor.",
                'detail'  => $hasil,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'pesan' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            Log::error("Error restore backup: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'pesan'   => 'Gagal memulihkan database: ' . $e->getMessage(),
            ], 500);
        }
    }
}
