<?php

use App\Services\RewardCreationService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Setiap slot hadiah (bukan merchandise) punya kode voucher sejak papan dibuat, supaya admin bisa melihat kode
 * yang sudah dan yang belum diklaim. Saat diklaim, kode slot inilah yang menjadi kode voucher peserta.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('slots', function (Blueprint $table) {
            $table->string('voucher_code', 20)->nullable()->unique()->after('voucher_type_id');
        });

        DB::table('slots')->where('prize_type', '!=', 'merch')->orderBy('id')->get(['id'])->each(function ($slot) {
            // Slot yang sudah diklaim memakai kode voucher yang sudah diterima peserta.
            $existing = DB::table('vouchers')->join('claims', 'claims.id', '=', 'vouchers.claim_id')
                ->where('claims.slot_id', $slot->id)->where('vouchers.source', 'claim')->value('vouchers.code');
            DB::table('slots')->where('id', $slot->id)->update(['voucher_code' => $existing ?? RewardCreationService::voucherCode()]);
        });
    }

    public function down(): void
    {
        Schema::table('slots', function (Blueprint $table) {
            $table->dropUnique(['voucher_code']);
            $table->dropColumn('voucher_code');
        });
    }
};
