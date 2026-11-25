<?php

use App\Models\Claim;
use App\Services\RewardCreationService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Klaim tidak lagi menunggu persetujuan admin dan voucher tidak punya masa berlaku.
 * Klaim lama yang masih menunggu langsung disetujui (hadiahnya dibuat), voucher kadaluarsa kembali aktif,
 * lalu kolom keputusan admin dan masa berlaku dihapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        $rewards = app(RewardCreationService::class);
        Claim::where('status', 'pending')->with(['slot', 'participant'])->each(function (Claim $claim) use ($rewards) {
            $claim->update(['status' => 'approved']);
            if ($claim->slot) {
                $rewards->create($claim->fresh(['slot', 'participant']));
            }
        });
        DB::table('vouchers')->where('status', 'expired')->update(['status' => 'sent']);

        Schema::table('claims', function (Blueprint $table) {
            $table->dropConstrainedForeignId('decided_by');
            $table->dropColumn(['decided_at', 'reject_reason']);
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->string('reject_reason')->nullable();
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable();
        });
    }
};
