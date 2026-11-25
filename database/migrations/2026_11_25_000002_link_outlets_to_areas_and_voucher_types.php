<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Satu warung mencakup banyak area kos (PRD keputusan 22), dan admin memilih jenis voucher apa saja yang masuk ke
 * papan tiap warung. Warung tanpa pilihan jenis voucher memakai semua jenis.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('area_outlet', function (Blueprint $table) {
            $table->foreignId('area_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->primary(['area_id', 'outlet_id']);
        });

        Schema::create('outlet_voucher_type', function (Blueprint $table) {
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('voucher_type_id')->constrained()->cascadeOnDelete();
            $table->primary(['outlet_id', 'voucher_type_id']);
        });

        // Area warung yang sudah ada menjadi area pertamanya.
        DB::table('outlets')->whereNotNull('area_id')->orderBy('id')->each(function ($outlet) {
            DB::table('area_outlet')->insert(['area_id' => $outlet->area_id, 'outlet_id' => $outlet->id]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('outlet_voucher_type');
        Schema::dropIfExists('area_outlet');
    }
};
