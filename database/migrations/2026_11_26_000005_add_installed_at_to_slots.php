<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Panduan pasang papan: waktu tiap slot fisik ditempel di papan warung oleh tim. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('slots', function (Blueprint $table) {
            $table->timestamp('installed_at')->nullable()->after('used_at');
        });
        // Papan yang sudah berjalan sudah terpasang di warung.
        DB::table('slots')->update(['installed_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('slots', function (Blueprint $table) {
            $table->dropColumn('installed_at');
        });
    }
};
