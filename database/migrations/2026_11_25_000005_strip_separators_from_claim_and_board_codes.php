<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Semua kode dibuat seragam tanpa spasi dan tanpa strip: kode klaim (KLM-1234 menjadi KLM1234) dan kode papan
 * (W07-BOARD menjadi W07BOARD), sama seperti kode slot dan kode voucher.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['claims' => 'claim_code', 'boards' => 'code'] as $table => $column) {
            DB::table($table)->where(fn ($q) => $q->where($column, 'like', '%-%')->orWhere($column, 'like', '% %'))
                ->orderBy('id')->get(['id', $column])
                ->each(function ($row) use ($table, $column) {
                    $code = strtoupper(preg_replace('/[\s-]+/', '', $row->{$column}));
                    $candidate = $code;
                    $suffix = 2;
                    while (DB::table($table)->where($column, $candidate)->where('id', '!=', $row->id)->exists()) {
                        $candidate = $code.$suffix++;
                    }
                    DB::table($table)->where('id', $row->id)->update([$column => $candidate]);
                });
        }
    }

    public function down(): void
    {
        // Format lama tidak dikembalikan: kode tanpa strip tetap sah.
    }
};
