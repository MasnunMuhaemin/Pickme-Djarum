<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** Penahanan slot dihapus: slot yang masih berstatus ditahan kembali kosong. */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('slots')->where('status', 'held')->update(['status' => 'empty', 'holder_id' => null, 'held_until' => null]);
    }

    public function down(): void {}
};
