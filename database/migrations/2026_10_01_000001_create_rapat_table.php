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
        Schema::create('rapat', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tanggal', 32);
            $table->string('topik', 500);
            $table->string('pimpinanRapat', 255);
            $table->string('notulis', 255);
            $table->string('waktu', 255)->nullable();
            $table->string('tempat', 255)->nullable();
            $table->longText('anggota')->nullable();
            $table->longText('poinPembahasan')->nullable();
            $table->longText('tindakLanjut')->nullable();
            $table->longText('ringkasanAI')->nullable();
            $table->longText('ideBaruAI')->nullable();
            $table->string('status', 50)->default('Selesai');
            $table->timestamps();

            $table->index('tanggal');
            $table->index('topik');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rapat');
    }
};
