<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->string('claim_code', 12)->unique()->nullable()->after('code');
        });
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropColumn('claim_code');
        });
    }
};
