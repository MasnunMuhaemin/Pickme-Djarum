<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mystery gift diatur admin (desain "Mystery gift"): isi hadiah bebas dengan stok dan cara pemenuhan, serta daftar
 * izin/blokir akun. Hadiah yang keluar tetap dicatat sebagai voucher atau hadiah barang seperti biasa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mystery_prizes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // kode: admin kirim kode (mis. Spotify) · mitra: tukar di mitra · topup: top up oleh admin · ambil: ambil di titik.
            $table->string('fulfillment');
            $table->foreignId('partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->unsignedInteger('value')->default(0);
            $table->unsignedInteger('stock');
            $table->unsignedInteger('given')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
        Schema::create('mystery_access', function (Blueprint $table) {
            $table->id();
            $table->string('whatsapp')->unique();
            $table->string('kind'); // allow | block
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->foreignId('mystery_prize_id')->nullable()->after('voucher_type_id')->constrained('mystery_prizes')->nullOnDelete();
        });
        Schema::table('gifts', function (Blueprint $table) {
            $table->foreignId('mystery_prize_id')->nullable()->after('type')->constrained('mystery_prizes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('gifts', fn (Blueprint $table) => $table->dropConstrainedForeignId('mystery_prize_id'));
        Schema::table('vouchers', fn (Blueprint $table) => $table->dropConstrainedForeignId('mystery_prize_id'));
        Schema::dropIfExists('mystery_access');
        Schema::dropIfExists('mystery_prizes');
    }
};
