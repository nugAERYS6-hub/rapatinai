<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tambahkan kolom waktu_selesai jika belum ada
        if (!Schema::hasColumn('rapat', 'waktu_selesai')) {
            Schema::table('rapat', function (Blueprint $table) {
                $table->time('waktu_selesai')->nullable()->after('waktu');
            });
        }

        // 2. Normalisasi dan migrasi data yang sudah tersimpan sebelumnya
        $records = DB::table('rapat')->select('id', 'tanggal', 'waktu')->get();
        foreach ($records as $row) {
            $update = [];

            // A. Konversi Tanggal ke format standar SQL 'YYYY-MM-DD'
            $tglRaw = trim((string)$row->tanggal);
            if (!empty($tglRaw)) {
                $time = strtotime($tglRaw);
                $update['tanggal'] = $time ? date('Y-m-d', $time) : date('Y-m-d');
            } else {
                $update['tanggal'] = date('Y-m-d');
            }

            // B. Ekstraksi Waktu Mulai & Waktu Selesai ke format SQL 'HH:MM:SS'
            $waktuRaw = trim((string)$row->waktu);
            $parsedMulai = null;
            $parsedSelesai = null;

            if (!empty($waktuRaw)) {
                // Menangani format rentang: "09.00-12.30", "09:00 - 12:30", "09.00 s/d 12.30"
                $normalized = str_replace(['s/d', 'sd', 'sampai', 'to'], '-', $waktuRaw);
                if (strpos($normalized, '-') !== false) {
                    $parts = explode('-', $normalized, 2);
                    $parsedMulai = $this->parseTimeToSql($parts[0]);
                    $parsedSelesai = $this->parseTimeToSql($parts[1]);
                } else {
                    $parsedMulai = $this->parseTimeToSql($waktuRaw);
                }
            }

            $update['waktu'] = $parsedMulai;
            $update['waktu_selesai'] = $parsedSelesai;

            DB::table('rapat')->where('id', $row->id)->update($update);
        }

        // 3. Ubah tipe data kolom tanggal menjadi DATE dan waktu menjadi TIME
        DB::statement("ALTER TABLE `rapat` MODIFY `tanggal` DATE NOT NULL;");
        DB::statement("ALTER TABLE `rapat` MODIFY `waktu` TIME NULL;");
        DB::statement("ALTER TABLE `rapat` MODIFY `waktu_selesai` TIME NULL;");

        // 4. Tambahkan indeks komposit untuk optimasi query rentang tanggal & sorting kronologis
        Schema::table('rapat', function (Blueprint $table) {
            $table->index(['tanggal', 'waktu'], 'rapat_tanggal_waktu_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rapat', function (Blueprint $table) {
            $table->dropIndex('rapat_tanggal_waktu_index');
        });

        DB::statement("ALTER TABLE `rapat` MODIFY `tanggal` VARCHAR(32) NOT NULL;");
        DB::statement("ALTER TABLE `rapat` MODIFY `waktu` VARCHAR(255) NULL;");

        if (Schema::hasColumn('rapat', 'waktu_selesai')) {
            Schema::table('rapat', function (Blueprint $table) {
                $table->dropColumn('waktu_selesai');
            });
        }
    }

    /**
     * Parsing string waktu ke format SQL HH:MM:SS
     */
    private function parseTimeToSql(?string $str): ?string
    {
        if (!$str) return null;
        $clean = trim(str_replace('.', ':', $str));
        if (preg_match('/^(\d{1,2}):(\d{2})(?::(\d{2}))?/', $clean, $matches)) {
            $h = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $m = $matches[2];
            $s = isset($matches[3]) ? $matches[3] : '00';
            return "{$h}:{$m}:{$s}";
        }
        return null;
    }
};
