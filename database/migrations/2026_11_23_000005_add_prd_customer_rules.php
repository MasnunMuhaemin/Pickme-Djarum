<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Parameter yang diubah admin tanpa deploy, mis. jeda seluruh program (PRD FR-28, FR-29).
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Mystery gift berupa voucher menempel ke klaim yang sudah ada dan ditandai asalnya (PRD bagian 16).
        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('source')->default('claim')->after('type');
            $table->index('claim_id', 'vouchers_claim_id_index');
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropUnique('vouchers_claim_id_unique');
        });

        // Satu klaim bisa punya beberapa tanda, disimpan dipisah koma.
        Schema::table('claims', function (Blueprint $table) {
            $table->string('flag', 255)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unique('claim_id', 'vouchers_claim_id_unique');
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropIndex('vouchers_claim_id_index');
            $table->dropColumn('source');
        });
        Schema::dropIfExists('settings');
    }
};
