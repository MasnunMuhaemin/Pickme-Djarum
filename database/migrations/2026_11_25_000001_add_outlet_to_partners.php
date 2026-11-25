<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Akun mitra jenis outlet adalah akun warung titik tertentu (PRD keputusan 18), bukan mitra voucher di area.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->foreignId('outlet_id')->nullable()->after('area_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropConstrainedForeignId('outlet_id');
        });
    }
};
