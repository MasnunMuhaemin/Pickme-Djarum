<?php

namespace App\Services;

use App\Models\Board;
use App\Models\Outlet;
use App\Models\Slot;
use App\Models\VoucherType;
use Illuminate\Support\Facades\DB;

/**
 * Menentukan isi slot dari Master data jenis voucher (A6). Jenis dipilih acak dengan bobot sisa kuota
 * (jumlah di master data dikurangi slot yang sudah memakainya), supaya sebaran mengikuti jumlah per jenis.
 */
class SlotPrizeService
{
    public function pick(string $prizeType): ?VoucherType
    {
        $fulfillments = VoucherType::FULFILLMENTS_BY_PRIZE[$prizeType] ?? null;
        if (! $fulfillments) {
            return null;
        }

        $types = VoucherType::whereIn('fulfillment', $fulfillments)->get();
        if ($types->isEmpty()) {
            return null;
        }
        $used = Slot::whereIn('voucher_type_id', $types->pluck('id'))
            ->selectRaw('voucher_type_id, count(*) as n')->groupBy('voucher_type_id')->pluck('n', 'voucher_type_id');

        // Acak berbobot sisa kuota: sebaran mengikuti jumlah di master data, tapi tiap papan tetap bervariasi.
        $weights = $types->mapWithKeys(fn (VoucherType $t) => [$t->id => max(0, $t->quantity - (int) ($used[$t->id] ?? 0))]);
        $total = $weights->sum();
        if ($total === 0) {
            return $types->first();
        }
        $roll = random_int(1, $total);
        foreach ($weights as $id => $weight) {
            if (($roll -= $weight) <= 0) {
                return $types->firstWhere('id', $id);
            }
        }

        return $types->first();
    }

    /**
     * Titik baru lengkap: papan dengan 25 slot A1 sampai E5, kode slot acak, dan isi dari master data.
     * Alamat QR titik otomatis /KODE (route qr.outlet).
     */
    public function createOutlet(string $code, string $name, int $areaId): Outlet
    {
        $code = strtoupper($code);

        return DB::transaction(function () use ($code, $name, $areaId) {
            $outlet = Outlet::create(['code' => $code, 'name' => $name, 'area_id' => $areaId, 'status' => 'active']);
            $board = Board::create(['outlet_id' => $outlet->id, 'code' => "{$code}-BOARD", 'week_label' => $code, 'status' => 'active']);

            // Campuran 25 slot mengikuti papan contoh: 17 voucher, 2 token, 2 bensin, 4 merchandise.
            $plan = array_merge(array_fill(0, 17, 'voucher'), ['token', 'token', 'bensin', 'bensin', 'merch', 'merch', 'merch', 'merch']);
            shuffle($plan);
            foreach ($plan as $i => $prize) {
                Slot::create([
                    'board_id' => $board->id,
                    'position' => chr(65 + intdiv($i, 5)).($i % 5 + 1),
                    'code' => $this->slotCode(),
                    'prize_type' => $prize,
                    'voucher_type_id' => $this->pick($prize)?->id,
                    'status' => 'empty',
                ]);
            }

            return $outlet;
        });
    }

    private function slotCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (Slot::where('code', $code)->exists());

        return $code;
    }

    /** Isi slot lama yang belum punya jenis voucher. Mengembalikan jumlah slot yang diisi. */
    public function fillMissing(): int
    {
        $filled = 0;
        Slot::whereNull('voucher_type_id')->where('prize_type', '!=', 'merch')->orderBy('id')
            ->each(function (Slot $slot) use (&$filled) {
                if ($type = $this->pick($slot->prize_type)) {
                    $slot->update(['voucher_type_id' => $type->id]);
                    $filled++;
                }
            });

        return $filled;
    }
}
