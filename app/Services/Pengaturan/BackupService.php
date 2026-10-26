<?php

namespace App\Services\Pengaturan;

use App\Models\Rapat;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BackupService
{
    /**
     * Menghasilkan dump SQL dari tabel rapat.
     */
    public function generateMysqlDump(): array
    {
        $rows = Rapat::orderBy('created_at', 'desc')->get();
        $tanggalBackup = now()->format('Y-m-d H:i:s');
        $namaFile = 'backup_rapatinai_' . now()->format('Y-m-d') . '.sql';

        $sql = "-- ============================================\n";
        $sql .= "-- RapatinAI - Backup Database MySQL\n";
        $sql .= "-- Tanggal Backup: {$tanggalBackup}\n";
        $sql .= "-- Total Data: {$rows->count()} rapat\n";
        $sql .= "-- ============================================\n\n";

        $sql .= "SET NAMES utf8mb4;\n";
        $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

        // DROP & CREATE TABLE
        $sql .= "-- -------------------------------------------\n";
        $sql .= "-- Struktur Tabel: rapat\n";
        $sql .= "-- -------------------------------------------\n";
        $sql .= "DROP TABLE IF EXISTS `rapat`;\n";
        $sql .= "CREATE TABLE `rapat` (\n";
        $sql .= "  `id` VARCHAR(255) NOT NULL,\n";
        $sql .= "  `tanggal` VARCHAR(255) NOT NULL,\n";
        $sql .= "  `topik` TEXT NOT NULL,\n";
        $sql .= "  `pimpinanRapat` TEXT NOT NULL,\n";
        $sql .= "  `notulis` TEXT NOT NULL,\n";
        $sql .= "  `waktu` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `tempat` TEXT DEFAULT NULL,\n";
        $sql .= "  `anggota` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `poinPembahasan` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `tindakLanjut` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `ringkasanAI` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `ideBaruAI` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `status` VARCHAR(50) DEFAULT 'Selesai',\n";
        $sql .= "  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,\n";
        $sql .= "  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n";
        $sql .= "  PRIMARY KEY (`id`)\n";
        $sql .= ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n";

        // INSERT DATA
        if ($rows->count() > 0) {
            $sql .= "-- -------------------------------------------\n";
            $sql .= "-- Data Tabel: rapat ({$rows->count()} baris)\n";
            $sql .= "-- -------------------------------------------\n";
            $sql .= "LOCK TABLES `rapat` WRITE;\n";

            $columns = [
                'id', 'tanggal', 'topik', 'pimpinanRapat', 'notulis',
                'waktu', 'tempat', 'anggota', 'poinPembahasan',
                'tindakLanjut', 'ringkasanAI', 'ideBaruAI', 'status',
                'created_at', 'updated_at'
            ];

            foreach ($rows as $row) {
                $values = [];
                foreach ($columns as $col) {
                    $val = $row->{$col};
                    if ($val === null) {
                        $values[] = 'NULL';
                    } else {
                        $escaped = addslashes((string)$val);
                        $escaped = str_replace("\n", "\\n", $escaped);
                        $escaped = str_replace("\r", "\\r", $escaped);
                        $escaped = str_replace("\t", "\\t", $escaped);
                        $values[] = "'" . $escaped . "'";
                    }
                }
                $sql .= "INSERT INTO `rapat` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");\n";
            }

            $sql .= "UNLOCK TABLES;\n\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";
        $sql .= "-- Backup selesai. {$rows->count()} data berhasil diekspor.\n";

        return [
            'content'  => $sql,
            'filename' => $namaFile,
            'count'    => $rows->count(),
        ];
    }

    /**
     * Memulihkan database dari file .sql.
     */
    public function restoreFromSqlFile(UploadedFile $file): array
    {
        $konten = file_get_contents($file->getRealPath());

        if (empty(trim($konten))) {
            throw new \InvalidArgumentException('File SQL kosong, tidak ada yang dipulihkan.');
        }

        $barisBaris = array_filter(
            preg_split('/\r?\n/', $konten),
            fn($b) => !empty(trim($b)) && !str_starts_with(ltrim($b), '--')
        );

        $sqlGabung = implode("\n", $barisBaris);
        $pernyataan = array_filter(
            explode(';', $sqlGabung),
            fn($s) => !empty(trim($s))
        );

        $izinkan = ['SET', 'DROP TABLE', 'CREATE TABLE', 'LOCK TABLES', 'UNLOCK TABLES', 'INSERT INTO'];
        $jumlahInsert = 0;
        $jumlahTotal = 0;

        DB::beginTransaction();

        try {
            foreach ($pernyataan as $sql) {
                $bersih = strtoupper(ltrim(trim($sql)));
                $diizinkan = false;
                foreach ($izinkan as $prefix) {
                    if (str_starts_with($bersih, $prefix)) {
                        $diizinkan = true;
                        break;
                    }
                }

                if (!$diizinkan) {
                    continue;
                }

                DB::statement(trim($sql));
                $jumlahTotal++;

                if (str_starts_with($bersih, 'INSERT INTO')) {
                    $jumlahInsert++;
                }
            }

            DB::commit();

            Log::info("Restore database berhasil: {$jumlahInsert} baris INSERT dari {$jumlahTotal} pernyataan.");

            return [
                'total_pernyataan' => $jumlahTotal,
                'total_insert'     => $jumlahInsert,
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
