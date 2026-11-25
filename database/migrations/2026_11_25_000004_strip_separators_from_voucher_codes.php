<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Kode voucher tidak boleh berisi spasi atau strip. Kode lama (mis. KGR-6E0815) dirapikan menjadi KGR6E0815.
 * Bila hasilnya bentrok dengan kode lain, ditambah satu karakter supaya tetap unik.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('vouchers')->where(fn ($q) => $q->where('code', 'like', '%-%')->orWhere('code', 'like', '% %'))
            ->orderBy('id')->get(['id', 'code'])
            ->each(function ($voucher) {
                $code = strtoupper(preg_replace('/[\s-]+/', '', $voucher->code));
                $suffix = 2;
                $candidate = $code;
                while (DB::table('vouchers')->where('code', $candidate)->where('id', '!=', $voucher->id)->exists()) {
                    $candidate = $code.$suffix++;
                }
                DB::table('vouchers')->where('id', $voucher->id)->update(['code' => $candidate]);
            });
    }

    public function down(): void
    {
        // Format lama tidak dikembalikan: kode tanpa strip tetap sah.
    }
};
