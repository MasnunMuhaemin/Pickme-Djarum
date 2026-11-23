<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Reject;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

class ClaimVerificationService
{
    public function submitCode(Claim $claim, string $code): array
    {
        $normalized = strtoupper(preg_replace('/[\s-]/', '', $code) ?? '');

        if (strlen($normalized) !== 6) {
            return ['error' => 'Kode harus 6 karakter. Huruf besar otomatis, spasi dan strip diabaikan.'];
        }

        if ($normalized !== $claim->slot->code) {
            Reject::create([
                'reason' => 'invalid_slot_code',
                'outlet_id' => $claim->outlet_id,
                'metadata' => ['claim_id' => $claim->id],
                'occurred_at' => now(),
            ]);
            ActivityLogger::log('claim.code_rejected', 'claim', $claim->id, ['code' => $normalized], $claim->participant);

            return ['error' => 'Kode tidak dikenal. Cek lagi huruf dan angkanya, atau ulangi dari awal. Slot tetap ditahan untuk kamu.'];
        }

        DB::transaction(function () use ($claim) {
            $claim->update(['status' => 'approved', 'submitted_at' => now()]);
            $claim->slot->update(['status' => 'used', 'used_at' => now(), 'held_until' => null]);
            ActivityLogger::log('claim.approved', 'claim', $claim->id, [], $claim->participant);
        });

        return ['claim' => $claim->fresh()->load(['slot', 'voucher', 'gifts'])];
    }
}
