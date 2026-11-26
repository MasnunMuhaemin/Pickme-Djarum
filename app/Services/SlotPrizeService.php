<?php

namespace App\Services;

use App\Models\Board;
use App\Models\Outlet;
use App\Models\Setting;
use App\Models\Slot;
use App\Models\VoucherType;
use Illuminate\Support\Facades\DB;

/**
 * Menentukan isi slot dari Master data jenis voucher (A6). Jenis dipilih acak dengan bobot sisa kuota
 * (jumlah di master data dikurangi slot yang sudah memakainya), supaya sebaran mengikuti jumlah per jenis.
 * Dengan warung: bila admin memilih jenis voucher untuk warung itu, hanya jenis terpilih yang dipakai. Pilihan berlaku
 * per jenis hadiah: warung yang hanya memilih voucher mitra tetap mendapat token/bensin dari semua jenisnya.
 */
class SlotPrizeService
{
    public function pick(string $prizeType, ?int $outletId = null): ?VoucherType
    {
        $fulfillments = VoucherType::FULFILLMENTS_BY_PRIZE[$prizeType] ?? null;
        if (! $fulfillments) {
            return null;
        }

        $types = VoucherType::whereIn('fulfillment', $fulfillments)->get();
        if ($outletId) {
            $chosen = DB::table('outlet_voucher_type')->where('outlet_id', $outletId)->pluck('voucher_type_id');
            $allowed = $types->whereIn('id', $chosen);
            if ($allowed->isNotEmpty()) {
                $types = $allowed->values();
            }
        }
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
    /**
     * @param  int[]  $areaIds  area kos yang dicakup warung; yang pertama menjadi area utama
     * @param  int[]  $voucherTypeIds  jenis voucher untuk papan warung ini; kosong berarti semua jenis
     */
    public function createOutlet(string $code, string $name, array $areaIds, array $voucherTypeIds = []): Outlet
    {
        $code = strtoupper($code);

        return DB::transaction(function () use ($code, $name, $areaIds, $voucherTypeIds) {
            $outlet = Outlet::create(['code' => $code, 'name' => $name, 'area_id' => $areaIds[0] ?? null, 'status' => 'active']);
            $outlet->areas()->sync($areaIds);
            $outlet->voucherTypes()->sync($voucherTypeIds);
            // Papan kosong: 25 slot dan kodenya dibuat oleh Generator kode unik (Master data).
            Board::create(['outlet_id' => $outlet->id, 'code' => "{$code}BOARD", 'week_label' => $code, 'status' => 'active']);

            return $outlet;
        });
    }

    /** Pemenuhan jenis voucher menentukan jenis hadiah slotnya. */
    private const PRIZE_BY_FULFILLMENT = ['mitra' => 'voucher', 'kuota' => 'voucher', 'agregator' => 'token', 'tunai' => 'bensin'];

    /**
     * Stok dari master data untuk generator: voucher dari jumlah tiap jenis voucher, merchandise dan limited edition
     * dari Ubah isi papan. Bawaan: limited edition 4 per papan, merchandise mengisi sisa supaya total = papan × 25.
     *
     * @return array{boards: int, slots: int, voucher: int, merch: int, limited: int, detail: array<string, int>}
     */
    public function stock(): array
    {
        $boards = Board::count();
        $types = VoucherType::all();
        $voucher = (int) $types->sum('quantity');
        // Belum diatur: papan lama yang sudah berisi memakai isi sebenarnya, papan baru memakai bawaan.
        $filled = Slot::exists();
        $limited = (int) Setting::get('stock_limited', $filled ? Slot::where('prize_type', 'limited')->count() : $boards * 4);
        $merch = (int) Setting::get('stock_merch', $filled ? Slot::where('prize_type', 'merch')->count() : max(0, $boards * 25 - $voucher - $limited));

        return [
            'boards' => $boards,
            'slots' => $boards * 25,
            'voucher' => $voucher,
            'merch' => $merch,
            'limited' => $limited,
            'detail' => $types->groupBy('fulfillment')->map(fn ($g) => (int) $g->sum('quantity'))->all(),
        ];
    }

    /**
     * Pembagian merchandise dan limited edition ke sejumlah papan: dibagi rata, sisanya ke papan pertama.
     * Sisa slot tiap papan diisi voucher. Mis. 39 merch ke 20 papan: 19 papan dapat 2, 1 papan dapat 1.
     *
     * @return list<array{merch: int, limited: int, voucher: int}>
     */
    public static function boardPlan(int $boards, int $merch, int $limited): array
    {
        $plan = [];
        for ($i = 0; $i < $boards; $i++) {
            $m = intdiv($merch, $boards) + ($i < $merch % $boards ? 1 : 0);
            $l = intdiv($limited, $boards) + ($i < $limited % $boards ? 1 : 0);
            $m = min($m, 25);
            $l = min($l, 25 - $m);
            $plan[] = ['merch' => $m, 'limited' => $l, 'voucher' => 25 - $m - $l];
        }

        return $plan;
    }

    /**
     * Isi semua papan yang belum punya slot: 25 slot A1 sampai E5, kode slot unik, dan isi dari sisa stok.
     * Dipakai saat generator dijalankan dan untuk warung baru setelah generator terkunci. Mengembalikan jumlah slot.
     */
    public function fillEmptyBoards(): int
    {
        return DB::transaction(function () {
            $boards = Board::whereDoesntHave('slots')->orderBy('id')->lockForUpdate()->get();
            if ($boards->isEmpty()) {
                return 0;
            }
            $stock = $this->stock();
            $merchLeft = max(0, $stock['merch'] - Slot::where('prize_type', 'merch')->count());
            $limitedLeft = max(0, $stock['limited'] - Slot::where('prize_type', 'limited')->count());
            $created = 0;

            foreach (self::boardPlan($boards->count(), $merchLeft, $limitedLeft) as $i => $counts) {
                $board = $boards[$i];
                $prizes = array_merge(
                    array_fill(0, $counts['merch'], 'merch'),
                    array_fill(0, $counts['limited'], 'limited'),
                    array_fill(0, $counts['voucher'], 'voucher'),
                );
                shuffle($prizes);
                foreach ($prizes as $n => $kind) {
                    $type = $kind === 'voucher' ? $this->pickAny($board->outlet_id) : null;
                    $prize = $type ? self::PRIZE_BY_FULFILLMENT[$type->fulfillment] ?? 'voucher' : $kind;
                    Slot::create([
                        'board_id' => $board->id,
                        'position' => chr(65 + intdiv($n, 5)).($n % 5 + 1),
                        'code' => $this->slotCode(),
                        'prize_type' => $prize,
                        'voucher_type_id' => $type?->id,
                        'voucher_code' => in_array($prize, ['merch', 'limited'], true) ? null : RewardCreationService::voucherCode(),
                        'status' => 'empty',
                    ]);
                    $created++;
                }
            }

            return $created;
        });
    }

    /**
     * Satu jenis voucher untuk slot voucher, acak berbobot sisa kuota. Pilihan jenis voucher warung berlaku untuk
     * voucher mitra/kuota; token dan bensin selalu dari semua jenisnya.
     */
    private function pickAny(?int $outletId): ?VoucherType
    {
        $types = VoucherType::all();
        $chosen = $outletId ? DB::table('outlet_voucher_type')->where('outlet_id', $outletId)->pluck('voucher_type_id') : collect();
        if ($chosen->isNotEmpty()) {
            $types = $types->filter(fn (VoucherType $t) => ! in_array($t->fulfillment, ['mitra', 'kuota'], true) || $chosen->contains($t->id))->values();
        }
        if ($types->isEmpty()) {
            return null;
        }
        $used = Slot::whereNotNull('voucher_type_id')->selectRaw('voucher_type_id, count(*) as n')->groupBy('voucher_type_id')->pluck('n', 'voucher_type_id');
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

    private function slotCode(): string
    {
        // 31 karakter tanpa I, L, O, 0, 1 supaya tidak tertukar saat dibaca dari papan.
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        do {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (Slot::where('code', $code)->exists() || Slot::where('voucher_code', $code)->exists());

        return $code;
    }

    /**
     * Slot yang belum terpakai tapi berisi jenis voucher yang tidak lagi dipilih untuk warungnya diisi ulang.
     * Slot yang sudah dipakai tidak diubah karena hadiahnya sudah jadi milik peserta. Mengembalikan jumlah slot yang diubah.
     */
    public function fixOutletMismatch(?int $outletId = null): int
    {
        $fixed = 0;
        Slot::with('board')
            ->where('status', '!=', 'used')
            ->whereIn('prize_type', ['voucher', 'token', 'bensin'])
            ->when($outletId, fn ($q) => $q->whereHas('board', fn ($b) => $b->where('outlet_id', $outletId)))
            ->each(function (Slot $slot) use (&$fixed) {
                $outletId = $slot->board?->outlet_id;
                $allowed = $this->allowedIds($slot->prize_type, $outletId);
                if ($slot->voucher_type_id && $allowed->contains($slot->voucher_type_id)) {
                    return;
                }
                $slot->update(['voucher_type_id' => $this->pick($slot->prize_type, $outletId)?->id]);
                $fixed++;
            });

        return $fixed;
    }

    /** Id jenis yang boleh mengisi slot jenis hadiah ini di warung tersebut (aturan yang sama dengan pick). */
    private function allowedIds(string $prizeType, ?int $outletId)
    {
        $ids = VoucherType::whereIn('fulfillment', VoucherType::FULFILLMENTS_BY_PRIZE[$prizeType] ?? [])->pluck('id');
        $chosen = $outletId ? DB::table('outlet_voucher_type')->where('outlet_id', $outletId)->pluck('voucher_type_id') : collect();
        $allowed = $ids->intersect($chosen);

        return $allowed->isNotEmpty() ? $allowed : $ids;
    }

    /** Isi slot lama yang belum punya jenis voucher. Mengembalikan jumlah slot yang diisi. */
    public function fillMissing(): int
    {
        $filled = 0;
        Slot::with('board')->whereNull('voucher_type_id')->whereIn('prize_type', ['voucher', 'token', 'bensin'])->orderBy('id')
            ->each(function (Slot $slot) use (&$filled) {
                if ($type = $this->pick($slot->prize_type, $slot->board?->outlet_id)) {
                    $slot->update(['voucher_type_id' => $type->id]);
                    $filled++;
                }
            });

        return $filled;
    }
}
