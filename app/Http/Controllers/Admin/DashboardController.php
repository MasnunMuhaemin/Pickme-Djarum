<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Claim;
use App\Models\Outlet;
use App\Models\Partner;
use App\Models\Slot;
use App\Models\Voucher;
use App\Support\AdminQueues;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A1 Beranda (desain admin): 4 kartu angka, grafik klaim per hari, status klaim, hadiah terpakai, slot per area,
 * warung teratas, antrean pemenuhan, klaim terbaru, dan penukaran per mitra minggu lalu.
 */
class DashboardController extends Controller
{
    public function index(): Response
    {
        $totalSlots = Slot::count();
        $usedSlots = Slot::where('status', 'used')->count();
        $thisWeek = CarbonImmutable::now()->startOfWeek(CarbonInterface::MONDAY);
        $lastWeek = $thisWeek->subWeek();

        // Klaim disetujui 7 hari terakhir, termasuk hari ini.
        $days = collect(range(6, 0))->map(function (int $ago) {
            $day = CarbonImmutable::today()->subDays($ago);

            return [
                'label' => $day->format('d/m'),
                'count' => Claim::where('status', 'approved')->whereDate('submitted_at', $day)->count(),
            ];
        });

        $approved = Claim::where('status', 'approved')->count();
        $waiting = Claim::where('status', 'draft')->whereNotNull('slot_id')->count();
        $rejected = Claim::where('status', 'rejected')->count();

        $redeemedThisWeek = Voucher::where('status', 'redeemed')->where('redeemed_at', '>=', $thisWeek)->get();

        // Hadiah dari slot yang sudah terpakai, per jenis.
        $usedByKind = Slot::where('status', 'used')->selectRaw('prize_type, count(*) as total')->groupBy('prize_type')->pluck('total', 'prize_type');

        $boardCounts = Slot::query()->selectRaw("board_id, count(*) as total, sum(case when status = 'used' then 1 else 0 end) as used")
            ->groupBy('board_id')->get()->keyBy('board_id');
        $outlets = Outlet::with('board')->get()->map(fn (Outlet $o) => [
            'code' => $o->code,
            'name' => $o->name,
            'used' => (int) ($boardCounts[$o->board?->id]->used ?? 0),
            'total' => (int) ($boardCounts[$o->board?->id]->total ?? 0),
        ]);

        $perArea = Area::query()->whereHas('outlets')->get()->map(fn (Area $area) => [
            'name' => $area->name,
            'used' => Slot::where('status', 'used')->whereHas('board.outlet', fn ($q) => $q->where('area_id', $area->id))->count(),
            'total' => Slot::whereHas('board.outlet', fn ($q) => $q->where('area_id', $area->id))->count(),
        ])->sortByDesc('used')->values();

        $kuota = Voucher::where('type', 'voucher')->where('status', 'pending_process')->whereHas('voucherType', fn ($q) => $q->where('fulfillment', 'kuota'))->count();

        $recent = Claim::with(['outlet', 'voucher', 'gifts'])->whereIn('status', ['approved', 'rejected'])->latest('submitted_at')->take(5)->get()
            ->map(fn (Claim $c) => [
                'code' => $c->claim_code,
                'outlet' => $c->outlet?->code,
                'kind' => $c->voucher
                    ? ['voucher' => 'Voucher', 'token' => 'Token listrik', 'bensin' => 'Bensin'][$c->voucher->type] ?? 'Voucher'
                    : ($c->gifts->firstWhere('type', '!=', 'mystery_pack') ? 'Merchandise' : '-'),
                'status' => $c->status,
                'ago' => $c->submitted_at?->locale('id')->diffForHumans(),
            ]);

        // Penukaran per mitra minggu lalu (voucher ditukar dan top up selesai).
        $perPartner = Partner::query()->where('status', 'active')->get()->map(fn (Partner $p) => [
            'name' => $p->name,
            'count' => Voucher::where('partner_id', $p->id)->whereNotNull('redeemed_at')
                ->where('redeemed_at', '>=', $lastWeek)->where('redeemed_at', '<', $thisWeek)->count(),
        ])->filter(fn ($row) => $row['count'] > 0)->sortByDesc('count')->values()->take(7);
        $lastWeekVouchers = Voucher::whereNotNull('partner_id')->whereNotNull('redeemed_at')
            ->where('redeemed_at', '>=', $lastWeek)->where('redeemed_at', '<', $thisWeek)->get();

        return Inertia::render('admin/beranda', [
            'stats' => [
                'claimsToday' => Claim::whereDate('submitted_at', today())->where('status', 'approved')->count(),
                'oldestToday' => Claim::whereDate('submitted_at', today())->oldest('submitted_at')->value('submitted_at'),
                'toProcess' => AdminQueues::dispatch()->count() + AdminQueues::tokens()->count() + AdminQueues::fuel()->count() + AdminQueues::goods()->count() + $kuota,
                'needsHelp' => AdminQueues::needsHelp()->count(),
                'usedSlots' => $usedSlots,
                'totalSlots' => $totalSlots,
                'redeemedWeek' => $redeemedThisWeek->count(),
                'redeemedWeekValue' => $redeemedThisWeek->sum(fn (Voucher $v) => $v->amount()),
            ],
            'days' => $days,
            'claimStatus' => ['approved' => $approved, 'waiting' => $waiting, 'rejected' => $rejected],
            'prizes' => [
                ['label' => 'Voucher', 'count' => (int) (($usedByKind['voucher'] ?? 0) + ($usedByKind['token'] ?? 0) + ($usedByKind['bensin'] ?? 0))],
                ['label' => 'Merchandise', 'count' => (int) ($usedByKind['merch'] ?? 0)],
            ],
            'perArea' => $perArea,
            'topOutlets' => $outlets->sortByDesc('used')->values()->take(4),
            'queues' => [
                ['label' => 'Kirim voucher', 'count' => AdminQueues::dispatch()->count(), 'href' => route('admin.kirim-voucher')],
                ['label' => 'Top up kuota', 'count' => $kuota, 'href' => route('admin.pemenuhan')],
                ['label' => 'Token listrik', 'count' => AdminQueues::tokens()->count(), 'href' => route('admin.pemenuhan')],
                ['label' => 'Bensin tunai', 'count' => AdminQueues::fuel()->count(), 'href' => route('admin.pemenuhan')],
                ['label' => 'Merchandise', 'count' => AdminQueues::goods()->count(), 'href' => route('admin.pemenuhan')],
                ['label' => 'Perlu bantuan', 'count' => AdminQueues::needsHelp()->count(), 'href' => route('admin.pemenuhan'), 'danger' => true],
            ],
            'recent' => $recent,
            'perPartner' => $perPartner,
            'partnerWeek' => [
                'partners' => $perPartner->count(),
                'vouchers' => $lastWeekVouchers->count(),
                'value' => $lastWeekVouchers->sum(fn (Voucher $v) => $v->amount()),
            ],
        ]);
    }
}
