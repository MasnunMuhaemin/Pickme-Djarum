<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Admin bisa memblokir peserta (mis. indikasi kecurangan). Peserta terblokir tidak bisa masuk. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('participants', function (Blueprint $table) {
            $table->timestamp('blocked_at')->nullable()->after('registered_at');
            $table->string('blocked_reason', 200)->nullable()->after('blocked_at');
        });
    }

    public function down(): void
    {
        Schema::table('participants', function (Blueprint $table) {
            $table->dropColumn(['blocked_at', 'blocked_reason']);
        });
    }
};
