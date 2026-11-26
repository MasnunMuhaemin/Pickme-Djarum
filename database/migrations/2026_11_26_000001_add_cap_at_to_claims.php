<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Waktu cap klaim dihitung. Voucher mitra langsung dapat cap; token, bensin, dan merchandise baru dapat cap setelah
 * admin menyelesaikannya. Peringkat dihitung dari kolom ini.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->timestamp('cap_at')->nullable()->after('submitted_at');
        });

        // Klaim lama yang sudah disetujui sudah terhitung di kolom caps peserta: samakan.
        DB::table('claims')->where('status', 'approved')->update(['cap_at' => DB::raw('submitted_at')]);
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropColumn('cap_at');
        });
    }
};
