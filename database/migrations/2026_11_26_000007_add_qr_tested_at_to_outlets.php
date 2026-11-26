<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Uji scan QR: admin yang sedang masuk men-scan QR warung, lalu QR itu tercatat lolos. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->timestamp('qr_tested_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('qr_tested_at');
        });
    }
};
