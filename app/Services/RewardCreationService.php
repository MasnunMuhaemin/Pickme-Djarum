<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Gift;
use App\Models\MysteryAccess;
use App\Models\MysteryPrize;
use App\Models\Participant;
use App\Models\Setting;
use App\Models\Slot;
use App\Models\Voucher;
use App\Models\VoucherType;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

class RewardCreationService
{
    public function __construct(private SlotPrizeService $prizes) {}

    /**
     * Klaim yang disetujui membentuk tepat satu hadiah (PRD FR-13). Cap langsung bertambah untuk semua jenis
     * hadiah, termasuk token listrik, bensin, dan merchandise yang pemenuhannya menyusul. Aman dipanggil berulang:
     * klaim yang sudah punya hadiah tidak dibuatkan lagi.
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
            } elseif ($type === 'limited') {
                // Barang limited edition ada di plastik slot: peserta langsung memegangnya.
                Gift::create(['claim_id' => $claim->id, 'type' => 'limited_edition', 'status' => 'done', 'completed_at' => now()]);
            } else {
                $this->createVoucher($claim, $type, 'claim', $claim->slot->voucherType);
            }

            ActivityLogger::log('reward.created', 'claim', $claim->id, ['type' => $type], $claim->participant);
            // Cap dihitung saat klaim berhasil, bukan menunggu admin menyelesaikan hadiahnya.
            $this->grantCap($claim);

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
            'status' => match (true) {
                // Pulsa/kuota: peserta mengisi nomor HP dulu, lalu admin mengisinya di Pemenuhan › Top up.
                $type === 'voucher' && $voucherType?->fulfillment === 'kuota' => 'pending_data',
                $type === 'voucher' => 'sent',
                $type === 'token' => 'pending_data',
                default => 'pending',
            },
            // Kode voucher langsung terlihat di Hadiahku; sent_at diisi saat admin mengirimnya lewat WhatsApp
            // (layar Kirim voucher).
            'sent_at' => null,
        ]);
    }

    /**
     * Cap ke-5 bisa memberi satu mystery gift per peserta (menu Mystery gift di CMS):
     * 1. saklar aktif, akun tidak diblokir, dan (bila mode daftar izin) nomornya ada di daftar izin;
     * 2. diundi dengan peluang di CMS: tidak semua peserta dapat;
     * 3. yang menang mendapat satu hadiah acak dari isi yang aktif dan stoknya ada (makin banyak sisa, makin besar peluang).
     * Hadiah menempel ke klaim pertama yang disetujui dan ditandai asalnya, tanpa klaim baru.
     */
    private function mysteryGift(Participant $participant): void
    {
        if ($participant->caps !== 5 || ! Setting::get('mystery_enabled', true)) {
            return;
        }

        $claimIds = $participant->claims()->pluck('id');
        $alreadyGiven = Gift::whereIn('claim_id', $claimIds)->where('type', 'mystery_pack')->exists()
            || Voucher::whereIn('claim_id', $claimIds)->where('source', 'mystery')->exists();
        if ($alreadyGiven || ! $this->mysteryEligible($participant)) {
            return;
        }

        $claim = $participant->claims()->where('status', 'approved')->oldest()->first();
        if (random_int(1, 100) > (int) config('participant.mystery_voucher_chance')) {
            ActivityLogger::log('mystery.missed', 'claim', $claim->id, [], $participant);

            return;
        }

        $prizes = MysteryPrize::where('active', true)->whereColumn('given', '<', 'stock')->lockForUpdate()->get();
        $prize = $this->pickWeighted($prizes);
        if (! $prize) {
            ActivityLogger::log('mystery.out_of_stock', 'claim', $claim->id, [], $participant);

            return;
        }
        $prize->increment('given');

        if ($prize->fulfillment === 'ambil') {
            Gift::create(['claim_id' => $claim->id, 'type' => 'mystery_pack', 'status' => 'pending', 'mystery_prize_id' => $prize->id]);
        } else {
            Voucher::create([
                'claim_id' => $claim->id,
                'code' => self::voucherCode(),
                // kode: voucher digital yang kodenya dikirim admin; mitra & topup memakai jalur voucher yang sudah ada.
                'type' => $prize->fulfillment === 'kode' ? 'digital' : 'voucher',
                'source' => 'mystery',
                'mystery_prize_id' => $prize->id,
                'partner_id' => $prize->fulfillment === 'mitra' ? $prize->partner_id : null,
                'value' => $prize->value,
                'status' => match ($prize->fulfillment) {
                    'mitra' => 'sent',
                    'topup' => 'pending_data',
                    default => 'pending_process',
                },
            ]);
        }
        ActivityLogger::log('mystery.won', 'claim', $claim->id, ['prize' => $prize->name], $participant);
    }

    /** Akun boleh mendapat mystery gift: tidak diblokir, dan ada di daftar izin bila mode daftar izin aktif. */
    private function mysteryEligible(Participant $participant): bool
    {
        $access = MysteryAccess::where('whatsapp', $participant->whatsapp)->value('kind');
        if ($access === 'block') {
            return false;
        }

        return Setting::get('mystery_audience', 'all') !== 'list' || $access === 'allow';
    }

    /** Pilih satu hadiah acak, berbobot sisa stok. */
    private function pickWeighted($prizes): ?MysteryPrize
    {
        $total = $prizes->sum(fn (MysteryPrize $p) => $p->remaining());
        if ($total < 1) {
            return null;
        }
        $roll = random_int(1, $total);
        foreach ($prizes as $prize) {
            $roll -= $prize->remaining();
            if ($roll <= 0) {
                return $prize;
            }
        }

        return null;
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
