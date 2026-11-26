<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Gift;
use App\Models\Participant;
use App\Models\Slot;
use App\Models\Voucher;
use App\Models\VoucherType;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

class RewardCreationService
{
    public function __construct(private SlotPrizeService $prizes) {}

    /** Jenis voucher yang bisa keluar dari mystery gift (PRD keputusan 9: acak dari semua jenis). */
    private const MYSTERY_VOUCHER_TYPES = ['voucher', 'token', 'bensin'];

    /**
     * Klaim yang disetujui membentuk tepat satu hadiah (PRD FR-13). Cap langsung bertambah untuk voucher mitra;
     * token, bensin, dan merchandise baru menambah cap setelah admin menyelesaikannya (lihat grantCap).
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
                $this->createVoucher($claim, $type, 'claim', $claim->slot->voucherType);
            }

            ActivityLogger::log('reward.created', 'claim', $claim->id, ['type' => $type], $claim->participant);
            if ($type === 'voucher') {
                $this->grantCap($claim);
            }

            return $claim->load(['voucher', 'gifts', 'participant']);
        });
    }

    /** Tambah satu cap untuk klaim ini (sekali saja), lalu cek mystery gift cap ke-5. */
    public function grantCap(Claim $claim): void
    {
        DB::transaction(function () use ($claim) {
            $claim = Claim::lockForUpdate()->find($claim->id);
            if (! $claim || $claim->cap_at || ! $claim->isApproved()) {
                return;
            }
            $claim->update(['cap_at' => now()]);
            $claim->participant()->increment('caps');
            ActivityLogger::log('cap.granted', 'claim', $claim->id, [], $claim->participant);
            $this->mysteryGift($claim->participant()->first());
        });
    }

    /**
     * Status awal per jenis pemenuhan (PRD bagian 17):
     * voucher mitra langsung terkirim, token menunggu nomor tujuan, bensin tunai menunggu admin tanpa form.
     */
    private function createVoucher(Claim $claim, string $type, string $source, ?VoucherType $voucherType = null): Voucher
    {
        // Jenis di slot dipakai hanya bila cocok dengan jenis hadiahnya; selain itu pilih dari master data.
        if ($voucherType && ! in_array($voucherType->fulfillment, VoucherType::FULFILLMENTS_BY_PRIZE[$type] ?? [], true)) {
            $voucherType = null;
        }
        $voucherType ??= $this->prizes->pick($type, $claim->outlet_id);

        return Voucher::create([
            'claim_id' => $claim->id,
            // Voucher dari slot memakai kode yang sudah disiapkan di slot itu (terlihat admin sebelum diklaim).
            'code' => ($source === 'claim' ? $claim->slot?->voucher_code : null) ?? self::voucherCode(),
            'type' => $type,
            'source' => $source,
            'voucher_type_id' => $voucherType?->id,
            'partner_id' => $voucherType?->partner_id,
            'value' => $voucherType?->value ?? (int) config("participant.prize_values.{$type}", 0),
            'status' => match ($type) {
                'voucher' => 'sent',
                'token' => 'pending_data',
                default => 'pending',
            },
            // Kode voucher langsung terlihat di Hadiahku; sent_at diisi saat admin mengirimnya lewat WhatsApp
            // (layar Kirim voucher).
            'sent_at' => null,
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

    /**
     * Kode voucher: KGR + 6 karakter, tanpa spasi dan tanpa strip, mis. KGR7HQ4MX. Huruf dan angka yang mirip
     * (I, L, O, 0, 1) tidak dipakai supaya tidak salah baca saat ditukar di mitra.
     */
    public static function voucherCode(): string
    {
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        do {
            $code = 'KGR';
            for ($i = 0; $i < 6; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (Voucher::where('code', $code)->exists() || Slot::where('voucher_code', $code)->exists());

        return $code;
    }

    /** Kode yang diketik orang (huruf kecil, spasi, strip) disamakan dengan format simpanan. */
    public static function normalizeCode(string $code): string
    {
        return strtoupper(preg_replace('/[\s-]+/', '', $code) ?? '');
    }
}
