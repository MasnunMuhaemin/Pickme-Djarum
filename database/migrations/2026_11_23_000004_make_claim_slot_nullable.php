<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropForeign(['slot_id']);
            $table->dropUnique(['slot_id']);
            $table->foreignId('slot_id')->nullable()->change();
            $table->string('code', 6)->nullable()->change();
            $table->unique('slot_id');
            $table->foreign('slot_id')->references('id')->on('slots')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropForeign(['slot_id']);
            $table->dropUnique(['slot_id']);
            $table->foreignId('slot_id')->nullable(false)->change();
            $table->string('code', 6)->nullable(false)->change();
            $table->unique('slot_id');
            $table->foreign('slot_id')->references('id')->on('slots')->restrictOnDelete();
        });
    }
};
