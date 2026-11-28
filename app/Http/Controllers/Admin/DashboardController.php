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
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A1 Beranda (desain admin): 4 kartu angka, grafik klaim per hari, status klaim, hadiah terpakai, slot per area,
 * warung teratas, antrean pemenuhan, klaim terbaru, dan penukaran per mitra. Filter periode (hari ini, 7 hari, 30 hari,
 * semua) berlaku untuk semua panel kecuali antrean pemenuhan, yang selalu menunjukkan antrean saat ini.
 */
class DashboardController extends Controller
{
    private const PERIODS = ['hari', '7', '30', 'semua'];

    public function index(Request $request): Response
    {
        $period = in_array($request->query('periode'), self::PERIODS, true) ? $request->query('periode') : '7';
        // Awal periode; null berarti seluruh program. Akhir periode hanya untuk rentang tanggal pilihan admin.
        $from = match ($period) {
            'hari' => CarbonImmutable::today(),
            '7' => CarbonImmutable::today()->subDays(6),
            '30' => CarbonImmutable::today()->subDays(29),
            default => null,
        };
        $to = null;
        $range = $this->range($request);
        if ($range) {
            [$from, $to] = $range;
            $period = 'rentang';
        }
        $since = fn ($query, string $column) => $query
            ->when($from, fn ($q) => $q->where($column, '>=', $from))
            ->when($to, fn ($q) => $q->where($column, '<=', $to));

        $totalSlots = Slot::count();
        $usedSlots = $since(Slot::where('status', 'used'), 'used_at')->count();

        $days = $this->chart($period, $from, $to);

        $approved = $since(Claim::where('status', 'approved'), 'submitted_at')->count();
        $waiting = $since(Claim::where('status', 'draft')->whereNotNull('slot_id'), 'created_at')->count();
        $rejected = $since(Claim::where('status', 'rejected'), 'submitted_at')->count();

        $redeemed = $since(Voucher::where('status', 'redeemed'), 'redeemed_at')->get();

        // Hadiah dari slot yang terpakai dalam periode, per jenis.
        $usedByKind = $since(Slot::where('status', 'used'), 'used_at')->selectRaw('prize_type, count(*) as total')->groupBy('prize_type')->pluck('total', 'prize_type');

        // Tanggal dari server (bukan input mentah), aman disisipkan ke SQL.
        $usedSql = "sum(case when status = 'used'"
            .($from ? " and used_at >= '".$from->toDateTimeString()."'" : '')
            .($to ? " and used_at <= '".$to->toDateTimeString()."'" : '')
            .' then 1 else 0 end)';
        $boardCounts = Slot::query()->selectRaw("board_id, count(*) as total, {$usedSql} as used")
            ->groupBy('board_id')->get()->keyBy('board_id');
        $outlets = Outlet::with('board')->get()->map(fn (Outlet $o) => [
            'code' => $o->code,
            'name' => $o->name,
            'used' => (int) ($boardCounts[$o->board?->id]->used ?? 0),
            'total' => (int) ($boardCounts[$o->board?->id]->total ?? 0),
        ]);

        $perArea = Area::query()->whereHas('outlets')->get()->map(fn (Area $area) => [
            'name' => $area->name,
            'used' => $since(Slot::where('status', 'used'), 'used_at')->whereHas('board.outlet', fn ($q) => $q->where('area_id', $area->id))->count(),
            'total' => Slot::whereHas('board.outlet', fn ($q) => $q->where('area_id', $area->id))->count(),
        ])->sortByDesc('used')->values();

        $kuota = Voucher::where('type', 'voucher')->where('status', 'pending_process')->whereHas('voucherType', fn ($q) => $q->where('fulfillment', 'kuota'))->count();

        $recent = $since(Claim::with(['outlet', 'voucher', 'gifts'])->whereIn('status', ['approved', 'rejected']), 'submitted_at')->latest('submitted_at')->take(5)->get()
            ->map(fn (Claim $c) => [
                'code' => $c->claim_code,
                'outlet' => $c->outlet ? "{$c->outlet->code} · {$c->outlet->name}" : null,
                'kind' => $c->voucher
                    ? ['voucher' => 'Voucher', 'token' => 'Token listrik', 'bensin' => 'Bensin'][$c->voucher->type] ?? 'Voucher'
                    : ($c->gifts->firstWhere('type', '!=', 'mystery_pack') ? 'Merchandise' : '-'),
                'status' => $c->status,
                'ago' => $c->submitted_at?->locale('id')->diffForHumans(),
            ]);

        // Penukaran per mitra dalam periode.
        $perPartner = Partner::query()->where('status', 'active')->get()->map(fn (Partner $p) => [
            'name' => $p->name,
            'count' => $since(Voucher::where('partner_id', $p->id)->whereNotNull('redeemed_at'), 'redeemed_at')->count(),
        ])->filter(fn ($row) => $row['count'] > 0)->sortByDesc('count')->values()->take(7);
        $partnerVouchers = $since(Voucher::whereNotNull('partner_id')->whereNotNull('redeemed_at'), 'redeemed_at')->get();

        return Inertia::render('admin/beranda', [
            'period' => $period,
            'range' => $range ? ['from' => $range[0]->toDateString(), 'to' => $range[1]->toDateString()] : null,
            'stats' => [
                'claims' => $approved,
                'oldestToday' => Claim::whereDate('submitted_at', today())->oldest('submitted_at')->value('submitted_at'),
                'toProcess' => AdminQueues::dispatch()->count() + AdminQueues::tokens()->count() + AdminQueues::fuel()->count() + AdminQueues::goods()->count() + $kuota,
                'needsHelp' => AdminQueues::needsHelp()->count(),
                'usedSlots' => $usedSlots,
                'totalSlots' => $totalSlots,
                'redeemed' => $redeemed->count(),
                'redeemedValue' => $redeemed->sum(fn (Voucher $v) => $v->amount()),
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
                'vouchers' => $partnerVouchers->count(),
                'value' => $partnerVouchers->sum(fn (Voucher $v) => $v->amount()),
            ],
        ]);
    }

    /**
     * Titik grafik klaim disetujui: per jam (hari ini), per hari (7 dan 30 hari), atau per minggu (semua, sejak klaim pertama).
     *
     * @return Collection<int, array{label: string, count: int}>
     */
    private function chart(string $period, ?CarbonImmutable $from, ?CarbonImmutable $to = null): Collection
    {
        $approved = Claim::where('status', 'approved')->whereNotNull('submitted_at');

        // Rentang pilihan admin: per hari bila sampai 62 hari, per minggu bila lebih panjang.
        if ($period === 'rentang') {
            $rows = (clone $approved)->whereBetween('submitted_at', [$from, $to])->pluck('submitted_at');
            if ($from->diffInDays($to) <= 62) {
                $byDay = $rows->countBy(fn ($at) => $at->format('Y-m-d'));
                $out = [];
                for ($d = $from->startOfDay(); $d->lte($to); $d = $d->addDay()) {
                    $out[] = ['label' => $d->format('d/m'), 'count' => (int) ($byDay[$d->format('Y-m-d')] ?? 0)];
                }

                return collect($out);
            }
            $byWeek = $rows->countBy(fn ($at) => $at->copy()->startOfWeek(CarbonInterface::MONDAY)->format('Y-m-d'));
            $out = [];
            for ($w = $from->startOfWeek(CarbonInterface::MONDAY); $w->lte($to); $w = $w->addWeek()) {
                $out[] = ['label' => $w->format('d/m'), 'count' => (int) ($byWeek[$w->format('Y-m-d')] ?? 0)];
            }

            return collect($out);
        }

        if ($period === 'hari') {
            $byHour = (clone $approved)->where('submitted_at', '>=', $from)->pluck('submitted_at')
                ->countBy(fn ($at) => (int) $at->format('G'));

            return collect(range(0, (int) now()->format('G')))->map(fn (int $h) => ['label' => sprintf('%02d:00', $h), 'count' => (int) ($byHour[$h] ?? 0)]);
        }

        if ($period === 'semua') {
            $first = (clone $approved)->min('submitted_at');
            $start = CarbonImmutable::parse($first ?? now())->startOfWeek(CarbonInterface::MONDAY);
            $byWeek = (clone $approved)->pluck('submitted_at')->countBy(fn ($at) => $at->copy()->startOfWeek(CarbonInterface::MONDAY)->format('Y-m-d'));
            $weeks = [];
            for ($w = $start; $w->lte(now()); $w = $w->addWeek()) {
                $weeks[] = ['label' => $w->format('d/m'), 'count' => (int) ($byWeek[$w->format('Y-m-d')] ?? 0)];
            }

            return collect($weeks);
        }

        $byDay = (clone $approved)->where('submitted_at', '>=', $from)->pluck('submitted_at')->countBy(fn ($at) => $at->format('Y-m-d'));
        $count = $period === '30' ? 30 : 7;

        return collect(range($count - 1, 0))->map(function (int $ago) use ($byDay) {
            $day = CarbonImmutable::today()->subDays($ago);

            return ['label' => $day->format('d/m'), 'count' => (int) ($byDay[$day->format('Y-m-d')] ?? 0)];
        });
    }

    /**
     * Rentang tanggal dari kalender (?dari=YYYY-MM-DD&sampai=YYYY-MM-DD). Tanggal terbalik ditukar; rentang maksimal 2 tahun.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}|null
     */
    private function range(Request $request): ?array
    {
        $parse = function ($value) {
            if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                return null;
            }
            try {
                return CarbonImmutable::createFromFormat('!Y-m-d', $value);
            } catch (\Throwable) {
                return null;
            }
        };
        $from = $parse($request->query('dari'));
        $to = $parse($request->query('sampai'));
        if (! $from || ! $to) {
            return null;
        }
        if ($from->gt($to)) {
            [$from, $to] = [$to, $from];
        }
        if ($from->diffInDays($to) > 731) {
            $from = $to->subDays(731);
        }

        return [$from->startOfDay(), $to->endOfDay()];
    }
}
