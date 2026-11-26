<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Desain "Mitra dan pembayaran": alamat dan tautan Google Maps mitra (ditampilkan ke peserta di detail voucher),
 * waktu terakhir masuk portal mitra, dan file bukti transfer pembayaran mingguan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->string('address')->nullable()->after('whatsapp');
            $table->string('maps_url', 500)->nullable()->after('address');
            $table->timestamp('last_login_at')->nullable()->after('status');
        });
        Schema::table('partner_payouts', function (Blueprint $table) {
            $table->string('proof_path')->nullable()->after('proof');
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn(['address', 'maps_url', 'last_login_at']);
        });
        Schema::table('partner_payouts', function (Blueprint $table) {
            $table->dropColumn('proof_path');
        });
    }
};
