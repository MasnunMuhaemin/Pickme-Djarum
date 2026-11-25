<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Slot;
use App\Support\ActivityLogger;
use App\Support\RewardPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A4 Papan dan slot: daftar titik dan 25 slot tiap titik (kosong, ditahan, terpakai) beserta pengambil dan waktu.
 * Hanya baca; jeda per titik dipicu dari sini lewat Tombol Darurat.
 */
class BoardController extends Controller
{
    private const PRIZE_LABELS = ['voucher' => 'Voucher', 'token' => 'Token listrik', 'bensin' => 'Bensin motor', 'merch' => 'Merchandise'];

    /** Lembar cetak untuk membuat papan fisik: QR alamat titik, dan kode di balik tiap slot beserta isinya. */
    public function print(Request $request, Outlet $outlet): Response
    {
        $slots = $outlet->board?->slots()->with('voucherType')->orderBy('position')->get() ?? collect();
        ActivityLogger::log('board.printed', 'outlet', $outlet->id, ['code' => $outlet->code], $request->user());

        return Inertia::render('admin/cetak-papan', [
            'outlet' => ['code' => $outlet->code, 'name' => $outlet->name, 'area' => $outlet->area?->name, 'qr' => url($outlet->code)],
            'slots' => $slots->map(fn (Slot $s) => [
                'position' => $s->position,
                'code' => $s->code,
                'prize' => $this->prizeLabel($s),
                'partner' => $s->voucherType?->partner?->name ?? $s->voucherType?->partner_label,
                'status' => $s->status,
            ]),
        ]);
    }

    private function prizeLabel(Slot $slot): string
    {
        return $slot->voucherType
            ? $slot->voucherType->name.' · Rp'.number_format($slot->voucherType->value, 0, ',', '.')
            : (self::PRIZE_LABELS[$slot->prize_type] ?? $slot->prize_type);
    }

    public function index(Request $request): Response
    {
        $outlets = Outlet::with(['area', 'board'])->orderBy('code')->get();
        $selected = $outlets->firstWhere('code', strtoupper((string) $request->query('titik'))) ?? $outlets->first();

        $slots = $selected?->board
            ? $selected->board->slots()->with(['holder', 'claim.participant', 'claim.voucher.voucherType', 'claim.voucher.partner', 'voucherType.partner'])->orderBy('position')->get()
            : collect();

        // Isi hadiah papan titik terpilih per jenis voucher, supaya terlihat voucher apa saja yang ada di warung itu.
        $stock = $slots->groupBy(fn (Slot $s) => $this->prizeLabel($s))
            ->map(fn ($group, $label) => [
                'label' => $label,
                'partner' => $group->first()->voucherType?->partner?->name ?? $group->first()->voucherType?->partner_label,
                'total' => $group->count(),
                'used' => $group->where('status', 'used')->count(),
                'left' => $group->where('status', '!=', 'used')->count(),
            ])
            ->sortBy('label')
            ->values();

        // Hitungan slot semua papan dalam satu query (warung bisa puluhan).
        $counts = Slot::query()->selectRaw("board_id, count(*) as total, sum(case when status = 'used' then 1 else 0 end) as used")
            ->groupBy('board_id')->get()->keyBy('board_id');

        return Inertia::render('admin/papan', [
            'outlets' => $outlets->map(fn (Outlet $o) => [
                'id' => $o->id,
                'code' => $o->code,
                'name' => $o->name,
                'area' => $o->area?->name,
                'used' => (int) ($counts[$o->board?->id]->used ?? 0),
                'total' => (int) ($counts[$o->board?->id]->total ?? 0),
                'active' => $o->status === 'active',
            ]),
            'selected' => $selected ? [
                'id' => $selected->id,
                'code' => $selected->code,
                'name' => $selected->name,
                'area' => $selected->area?->name,
                'active' => $selected->status === 'active',
                'slots' => $slots->map(fn (Slot $s) => [
                    'position' => $s->position,
                    'status' => $s->status,
                    'prize' => $this->prizeLabel($s),
                    'by' => $s->claim?->participant?->name ?? $s->holder?->name,
                    'voucher_code' => $s->claim?->voucher?->code ?? $s->voucher_code,
                    'claimed' => (bool) $s->claim?->voucher,
                    // Label status sama dengan yang dilihat peserta di Hadiahku.
                    'voucher_status' => $s->claim?->voucher ? RewardPresenter::voucher($s->claim->voucher)['status_label'] : null,
                    'at' => ($s->used_at ?? $s->held_until)?->format('d M H:i'),
                ]),
            ] : null,
            'stock' => $stock,
        ]);
    }
}
