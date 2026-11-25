<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Slot;
use App\Support\ActivityLogger;
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
            ? $selected->board->slots()->with(['holder', 'claim.participant', 'voucherType'])->orderBy('position')->get()
            : collect();

        $stock = Slot::query()->selectRaw("prize_type, count(*) as total, sum(status = 'used') as used")->groupBy('prize_type')->get()
            ->map(fn ($row) => [
                'label' => self::PRIZE_LABELS[$row->prize_type] ?? ucfirst($row->prize_type),
                'total' => (int) $row->total,
                'used' => (int) $row->used,
                'left' => (int) $row->total - (int) $row->used,
            ]);

        return Inertia::render('admin/papan', [
            'outlets' => $outlets->map(fn (Outlet $o) => [
                'id' => $o->id,
                'code' => $o->code,
                'area' => $o->area?->name,
                'used' => $o->board ? $o->board->slots()->where('status', 'used')->count() : 0,
                'total' => $o->board ? $o->board->slots()->count() : 0,
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
                    'at' => ($s->used_at ?? $s->held_until)?->format('d M H:i'),
                ]),
            ] : null,
            'stock' => $stock,
        ]);
    }
}
