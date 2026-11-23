<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Gift;
use App\Models\Participant;
use App\Models\Voucher;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

class RewardCreationService
{
    public function create(Claim $claim): Claim
    {
        if ($claim->voucher || $claim->gifts()->exists()) {
            return $claim->load(['voucher', 'gifts']);
        }

        $type = $claim->slot->prize_type;

        return DB::transaction(function () use ($claim, $type) {
            if ($type === 'merch') {
                Gift::create([
                    'claim_id' => $claim->id,
                    'type' => 'merchandise',
                    'status' => 'pending_address',
                ]);
            } else {
                Voucher::create([
                    'claim_id' => $claim->id,
                    'code' => $this->voucherCode(),
                    'type' => $type,
                    'status' => $type === 'voucher' ? 'sent' : 'pending_data',
                    'expires_at' => now()->addDays(config('participant.voucher_valid_days')),
                    'sent_at' => $type === 'voucher' ? now() : null,
                ]);
            }

            $claim->participant()->increment('caps');
            ActivityLogger::log('reward.created', 'claim', $claim->id, ['type' => $type], $claim->participant);
            $this->mysteryGift($claim->participant()->first());

            return $claim->load(['voucher', 'gifts', 'participant']);
        });
    }

    private function mysteryGift(Participant $participant): void
    {
        if ($participant->caps !== 5) {
            return;
        }
        if ($participant->giftsViaClaims()->where('type', 'mystery_pack')->exists()) {
            return;
        }

        Gift::create([
            'claim_id' => $participant->claims()->where('status', 'approved')->first()->id,
            'type' => 'mystery_pack',
            'status' => 'pending_address',
        ]);
    }

    private function voucherCode(): string
    {
        do {
            $code = 'KGR-'.strtoupper(bin2hex(random_bytes(3)));
        } while (Voucher::where('code', $code)->exists());

        return $code;
    }
}
