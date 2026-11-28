<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Titik peta peserta (Leaflet): koordinat warung dan mitra voucher. */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['outlets', 'partners'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->decimal('lat', 10, 7)->nullable();
                $t->decimal('lng', 10, 7)->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['outlets', 'partners'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->dropColumn(['lat', 'lng']));
        }
    }
};
