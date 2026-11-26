<?php

namespace Database\Seeders;

use App\Models\Participant;
use App\Models\Partner;
use App\Models\Voucher;
use App\Models\VoucherType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Akun mitra contoh untuk mencoba halaman /mitra:
 * - Kopi Groei (mitra voucher), PIN 1470: voucher Dimas siap dicek dan ditukar, dua sudah ditukar untuk rekap.
 * - Pulsa Demo (mitra kuota), PIN 3690: voucher kuota Fajar masuk antrean top up.
 * Memakai voucher dari DemoLeaderboardSeeder; PIN yang sudah diatur admin tidak ditimpa.
 */
class DemoPartnerSeeder extends Seeder
{
    public function run(): void
    {
        $kopi = Partner::firstOrCreate(['name' => 'Kopi Groei'], ['type' => 'umum', 'status' => 'active']);
        $kopi->pin_hash ??= Hash::make('1470');
        $kopi->save();

        $pulsa = Partner::firstOrCreate(['name' => 'Pulsa Demo'], ['type' => 'kuota', 'status' => 'active', 'whatsapp' => '081200000099']);
        $pulsa->pin_hash ??= Hash::make('3690');
        $pulsa->save();

        $kopiType = VoucherType::where('partner_id', $kopi->id)->first();
        $kuotaType = VoucherType::where('fulfillment', 'kuota')->first();
        if ($kuotaType && ! $kuotaType->partner_id) {
            $kuotaType->update(['partner_id' => $pulsa->id]);
        }

        // Voucher Dimas jadi voucher Kopi Groei: dua sudah ditukar (minggu ini dan minggu lalu), sisanya bisa dicek.
        $dimas = $this->vouchers('081200000001');
        foreach ($dimas as $i => $voucher) {
            $redeemedAt = match ($i) {
                0 => now()->subHours(3),
                1 => now()->subWeek()->startOfWeek()->addDays(2)->setTime(14, 52),
                default => null,
            };
            $voucher->update([
                'voucher_type_id' => $kopiType?->id,
                'partner_id' => $kopi->id,
                'value' => $kopiType?->value ?? $voucher->value,
                'status' => $redeemedAt ? 'redeemed' : 'sent',
                'redeemed_at' => $redeemedAt,
            ]);
        }

        // Voucher Fajar jadi pulsa/kuota: dua menunggu top up mitra, satu menunggu nomor HP dari peserta.
        $fajar = $this->vouchers('081200000005');
        foreach ($fajar as $i => $voucher) {
            $voucher->update([
                'voucher_type_id' => $kuotaType?->id,
                'partner_id' => $pulsa->id,
                'value' => $kuotaType?->value ?? $voucher->value,
                'status' => $i < 2 ? 'pending_process' : 'pending_data',
                'destination' => ['081234567890', '085711223344'][$i] ?? null,
            ]);
        }
    }

    /** Voucher akun demo yang belum dipasangkan ke mitra (seeder aman dijalankan ulang). */
    private function vouchers(string $whatsapp)
    {
        $participant = Participant::where('whatsapp', $whatsapp)->first();

        return $participant
            ? Voucher::whereIn('claim_id', $participant->claims()->pluck('id'))->whereNull('partner_id')->orderBy('id')->get()->values()
            : collect();
    }
}
