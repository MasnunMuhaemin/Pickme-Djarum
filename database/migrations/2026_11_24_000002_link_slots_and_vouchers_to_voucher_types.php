<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Isi slot mengikuti Master data jenis voucher: voucher yang terbentuk membawa mitra dan nilainya sendiri.
 * Nilai disalin ke voucher supaya perubahan master data tidak mengubah voucher yang sudah dibagikan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('slots', function (Blueprint $table) {
            $table->foreignId('voucher_type_id')->nullable()->after('prize_type')->constrained('voucher_types')->nullOnDelete();
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->foreignId('voucher_type_id')->nullable()->after('partner_id')->constrained('voucher_types')->nullOnDelete();
            $table->unsignedInteger('value')->nullable()->after('voucher_type_id');
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('voucher_type_id');
            $table->dropColumn('value');
        });
        Schema::table('slots', function (Blueprint $table) {
            $table->dropConstrainedForeignId('voucher_type_id');
        });
    }
};
