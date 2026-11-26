<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Klaim yang ditolak admin dari Antrean foto: alasan dan waktu penolakan. Klaim ditolak tetap memakai satu nomor di
 * kartu cap peserta (tampil sebagai "ditolak"), tapi tidak dihitung sebagai cap.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->string('reject_reason')->nullable()->after('cap_at');
            $table->timestamp('rejected_at')->nullable()->after('reject_reason');
        });
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropColumn(['reject_reason', 'rejected_at']);
        });
    }
};
