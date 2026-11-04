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
        Schema::create('rapat_lampiran', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('rapat_id', 64);
            $table->string('nama_file', 255);
            $table->string('path', 500);
            $table->unsignedBigInteger('ukuran'); // ukuran berkas dalam byte
            $table->string('tipe_mime', 100);
            $table->string('kategori', 50)->default('dokumen'); // foto, daftar_hadir, materi, dokumen
            $table->string('keterangan', 255)->nullable();
            $table->timestamps();

            $table->foreign('rapat_id')
                ->references('id')
                ->on('rapat')
                ->onDelete('cascade');

            $table->index('rapat_id');
            $table->index('kategori');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rapat_lampiran');
    }
};

