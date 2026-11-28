<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Partner;
use App\Models\VoucherType;
use App\Support\RewardPresenter;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Peta peserta (desain "Peta"): pin papan warung dan mitra voucher yang sudah punya titik peta, plus kampus.
 * Ketuk pin membuka popup info dan tombol Google Maps.
 */
class MapController extends Controller
{
    public function __invoke(): Response
    {
        $outlets = Outlet::with(['area', 'board.slots'])->where('status', 'active')->whereNotNull('lat')->orderBy('code')->get()
            ->map(fn (Outlet $o) => [
                'key' => "w{$o->id}",
                'code' => $o->code,
                // Label pin: angka kode warung, mis. W07 menjadi 07.
                'label' => substr($o->code, 1),
                'name' => $o->name,
                'area' => $o->area?->name,
                'left' => $o->board?->slots->where('status', '!=', 'used')->count() ?? 0,
                'total' => $o->board?->slots->count() ?? 0,
                'lat' => (float) $o->lat,
                'lng' => (float) $o->lng,
                'maps' => self::mapsLink((float) $o->lat, (float) $o->lng),
            ]);

        $partners = Partner::where('type', 'umum')->where('status', 'active')->whereNotNull('lat')->orderBy('name')->get()
            ->map(function (Partner $p) {
                $type = VoucherType::where('partner_id', $p->id)->orderByDesc('value')->first();

                return [
                    'key' => "m{$p->id}",
                    'name' => $p->name,
                    'voucher' => $type ? "{$type->name} · ".RewardPresenter::rupiah((int) $type->value) : null,
                    'value' => $type ? RewardPresenter::rupiah((int) $type->value) : null,
                    'lat' => (float) $p->lat,
                    'lng' => (float) $p->lng,
                    'maps' => $p->maps_url ?: self::mapsLink((float) $p->lat, (float) $p->lng),
                ];
            });

        return Inertia::render('participant/peta', [
            'outlets' => $outlets,
            'partners' => $partners,
            'campus' => config('participant.campus'),
        ]);
    }

    private static function mapsLink(float $lat, float $lng): string
    {
        return "https://www.google.com/maps/search/?api=1&query={$lat},{$lng}";
    }
}
