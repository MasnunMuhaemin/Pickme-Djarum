<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Panel admin (PRD bagian 13, A1 sampai A8): peran admin, keputusan klaim, pemenuhan hadiah, mitra dan pembayaran,
 * serta master jenis voucher.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
        });

        // Keputusan admin atas klaim bertanda (A2): siapa, kapan, dan alasan tolak.
        Schema::table('claims', function (Blueprint $table) {
            $table->foreignId('decided_by')->nullable()->after('submitted_at')->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable()->after('decided_by');
            $table->string('reject_reason')->nullable()->after('decided_at');
        });

        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // outlet: warung titik; kuota: penjual pulsa/kuota; umum: mitra voucher lain (kopi, laundry, dst).
            $table->string('type')->default('umum');
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('whatsapp')->nullable();
            $table->string('pin_hash')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // Master data jenis voucher (A6): skema B, nilai penukaran, dan jumlah.
        Schema::create('voucher_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('partner_id')->nullable()->constrained('partners')->nullOnDelete();
            $table->string('partner_label')->nullable();
            $table->unsignedInteger('value');
            $table->unsignedInteger('quantity')->default(0);
            // mitra: ditukar di mitra; agregator: token/pulsa lewat agregator; tunai: diserahkan admin.
            $table->string('fulfillment')->default('mitra');
            $table->timestamps();
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->foreignId('partner_id')->nullable()->after('source')->constrained('partners')->nullOnDelete();
            $table->timestamp('redeemed_at')->nullable()->after('processed_at');
            $table->string('fail_reason')->nullable()->after('reference');
        });

        Schema::table('gifts', function (Blueprint $table) {
            $table->timestamp('shipped_at')->nullable()->after('address');
            $table->string('handed_to')->nullable()->after('shipped_at');
        });

        // Rekap mingguan per mitra (A5): dibayar di luar webapp, ditandai dengan tanggal dan bukti.
        Schema::create('partner_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->date('week_start');
            $table->unsignedInteger('redeemed_count')->default(0);
            $table->unsignedInteger('total_value')->default(0);
            $table->string('status')->default('berjalan');
            $table->date('paid_at')->nullable();
            $table->string('proof')->nullable();
            $table->string('correction_reason')->nullable();
            $table->timestamps();
            $table->unique(['partner_id', 'week_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_payouts');
        Schema::table('gifts', function (Blueprint $table) {
            $table->dropColumn(['shipped_at', 'handed_to']);
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('partner_id');
            $table->dropColumn(['redeemed_at', 'fail_reason']);
        });
        Schema::dropIfExists('voucher_types');
        Schema::dropIfExists('partners');
        Schema::table('claims', function (Blueprint $table) {
            $table->dropConstrainedForeignId('decided_by');
            $table->dropColumn(['decided_at', 'reject_reason']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
