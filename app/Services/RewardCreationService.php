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
    /** Jenis voucher yang bisa keluar dari mystery gift (PRD keputusan 9: acak dari semua jenis). */
    private const MYSTERY_VOUCHER_TYPES = ['voucher', 'token', 'bensin'];

    /**
     * Klaim yang disetujui membentuk tepat satu hadiah dan menambah satu cap (PRD FR-13).
     * Aman dipanggil berulang: klaim yang sudah punya hadiah tidak dibuatkan lagi.
     */
    public function create(Claim $claim): Claim
    {
        if (! $claim->isApproved() || $claim->voucher || $claim->gifts()->where('type', '!=', 'mystery_pack')->exists()) {
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
                $this->createVoucher($claim, $type, 'claim');
            }

            $claim->participant()->increment('caps');
            ActivityLogger::log('reward.created', 'claim', $claim->id, ['type' => $type], $claim->participant);
            $this->mysteryGift($claim->participant()->first());

            return $claim->load(['voucher', 'gifts', 'participant']);
        });
    }

    /**
     * Status awal per jenis pemenuhan (PRD bagian 17):
     * voucher mitra langsung terkirim, token menunggu nomor tujuan, bensin tunai menunggu admin tanpa form.
     */
    private function createVoucher(Claim $claim, string $type, string $source): Voucher
    {
        return Voucher::create([
            'claim_id' => $claim->id,
            'code' => $this->voucherCode(),
            'type' => $type,
            'source' => $source,
            'status' => match ($type) {
                'voucher' => 'sent',
                'token' => 'pending_data',
                default => 'pending',
            },
            'expires_at' => $type === 'voucher' ? now()->addDays(config('participant.voucher_valid_days')) : null,
            'sent_at' => $type === 'voucher' ? now() : null,
        ]);
    }

    /**
     * Cap ke-5 memberi satu mystery gift per peserta: voucher (peluang di pengaturan) atau 1 bungkus gratis.
     * Hadiah menempel ke klaim pertama yang disetujui dan ditandai asalnya, tanpa klaim baru.
     */
    private function mysteryGift(Participant $participant): void
    {
        if ($participant->caps !== 5) {
            return;
        }

        $claimIds = $participant->claims()->pluck('id');
        $alreadyGiven = Gift::whereIn('claim_id', $claimIds)->where('type', 'mystery_pack')->exists()
            || Voucher::whereIn('claim_id', $claimIds)->where('source', 'mystery')->exists();
        if ($alreadyGiven) {
            return;
        }

        $claim = $participant->claims()->where('status', 'approved')->oldest()->first();

        if (random_int(1, 100) <= config('participant.mystery_voucher_chance')) {
            $type = self::MYSTERY_VOUCHER_TYPES[array_rand(self::MYSTERY_VOUCHER_TYPES)];
            $this->createVoucher($claim, $type, 'mystery');
            ActivityLogger::log('mystery.voucher', 'claim', $claim->id, ['type' => $type], $participant);

            return;
        }

        Gift::create([
            'claim_id' => $claim->id,
            'type' => 'mystery_pack',
            'status' => 'pending',
        ]);
        ActivityLogger::log('mystery.free_pack', 'claim', $claim->id, [], $participant);
    }

    private function voucherCode(): string
    {
        do {
            $code = 'KGR-'.strtoupper(bin2hex(random_bytes(3)));
        } while (Voucher::where('code', $code)->exists());

        return $code;
    }
}
