<?php

namespace Database\Seeders;

use App\Models\Rapat;
use Illuminate\Database\Seeder;
use PDO;

class SqliteDataSeeder extends Seeder
{
    public function run(): void
    {
        $sqlitePath = base_path('../data/rapatinai.db');
        if (!file_exists($sqlitePath)) {
            $sqlitePath = base_path('data/rapatinai.db');
        }

        if (!file_exists($sqlitePath)) {
            $this->command->warn("SQLite file not found at: $sqlitePath");
            return;
        }

        $this->command->info("Reading SQLite data from: $sqlitePath");
        $sqlite = new PDO("sqlite:" . $sqlitePath);
        $rows = $sqlite->query("SELECT * FROM rapat")->fetchAll(PDO::FETCH_ASSOC);

        $this->command->info("Found " . count($rows) . " rows in SQLite.");

        foreach ($rows as $row) {
            Rapat::updateOrCreate(
                ['id' => (string)$row['id']],
                [
                    'tanggal' => $row['tanggal'],
                    'topik' => $row['topik'],
                    'pimpinanRapat' => $row['pimpinanRapat'],
                    'notulis' => $row['notulis'],
                    'waktu' => $row['waktu'] ?? '',
                    'tempat' => $row['tempat'] ?? '',
                    'anggota' => $row['anggota'],
                    'poinPembahasan' => $row['poinPembahasan'],
                    'tindakLanjut' => $row['tindakLanjut'],
                    'ringkasanAI' => $row['ringkasanAI'] ?? null,
                    'ideBaruAI' => $row['ideBaruAI'] ?? null,
                    'status' => $row['status'] ?? 'Selesai',
                    'created_at' => $row['created_at'] ?? now(),
                    'updated_at' => $row['updated_at'] ?? now(),
                ]
            );
        }

        $this->command->info("Successfully migrated all SQLite records to MySQL!");
    }
}
