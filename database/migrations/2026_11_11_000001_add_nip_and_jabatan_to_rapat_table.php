<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rapat', function (Blueprint $table) {
            $table->string('pimpinan_nip', 50)->nullable()->after('pimpinanRapat');
            $table->string('pimpinan_jabatan', 150)->nullable()->after('pimpinan_nip');
            $table->string('notulis_nip', 50)->nullable()->after('notulis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rapat', function (Blueprint $table) {
            $table->dropColumn(['pimpinan_nip', 'pimpinan_jabatan', 'notulis_nip']);
        });
    }
};

