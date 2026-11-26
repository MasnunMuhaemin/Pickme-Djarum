<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Foto bukti penukaran dari mitra (M2): diambil setelah voucher ditukar, bisa diulang dari rincian tukar. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('proof_path')->nullable()->after('redeemed_at');
            $table->timestamp('proof_at')->nullable()->after('proof_path');
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['proof_path', 'proof_at']);
        });
    }
};
