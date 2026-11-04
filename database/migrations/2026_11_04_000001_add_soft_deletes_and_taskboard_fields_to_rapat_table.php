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
            if (!Schema::hasColumn('rapat', 'deleted_at')) {
                $table->softDeletes();
            }
            if (!Schema::hasColumn('rapat', 'created_by')) {
                $table->string('created_by', 100)->nullable()->after('status');
            }
            if (!Schema::hasColumn('rapat', 'taskboard_id')) {
                $table->string('taskboard_id', 100)->nullable()->after('created_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rapat', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('rapat', 'taskboard_id')) {
                $columns[] = 'taskboard_id';
            }
            if (Schema::hasColumn('rapat', 'created_by')) {
                $columns[] = 'created_by';
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
            if (Schema::hasColumn('rapat', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};

