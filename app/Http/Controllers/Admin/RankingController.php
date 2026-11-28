<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Participant;
use App\Models\Setting;
use App\Services\RankingService;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Peringkat (usulan prototype): total program dan minggu ini. 10 teratas merch LE, 4 teratas golden slot Laga Kosan.
 * Peringkat ditutup admin sebelum Laga Kosan dimulai; penutupan memerlukan konfirmasi dan tercatat di log.
 */
class RankingController extends Controller
{
    public function index(Request $request, RankingService $rankings): Response
    {
        $tab = $request->query('tab') === 'minggu' ? 'minggu' : 'total';
        $rows = $rankings->ranking($tab === 'minggu' ? $rankings->weekStart() : null)->take(RankingService::TOP);
        $participants = Participant::whereIn('id', $rows->pluck('participant_id'))->get()->keyBy('id');
        $closedAt = Setting::get('ranking_closed_at');

        return Inertia::render('admin/peringkat', [
            'tab' => $tab,
            'closedAt' => $closedAt,
            'rows' => $rows->map(function ($row) use ($participants, $rankings, $closedAt) {
                $prize = $rankings->prize($row->rank);
                $claims = Claim::where('claims.participant_id', $row->participant_id);
                // Titik tempat peserta paling sering klaim (kolom diberi nama tabel karena ada join).
                $outlet = (clone $claims)->where('claims.status', 'approved')->join('outlets', 'outlets.id', '=', 'claims.outlet_id')
                    ->selectRaw('outlets.code as code, outlets.name as name, count(*) as n')->groupBy('outlets.code', 'outlets.name')->orderByDesc('n')->first();

                return [
                    'rank' => $row->rank,
                    'name' => $participants[$row->participant_id]?->name ?? 'Peserta',
                    'outlet' => $outlet ? "{$outlet->code} · {$outlet->name}" : null,
                    'caps' => $row->caps,
                    'flagged' => (clone $claims)->whereNotNull('flag')->count(),
                    'golden' => $prize === 'golden_slot',
                    'merch' => $prize !== null,
                    'golden_status' => $prize === 'golden_slot' ? ($closedAt ? 'Dikonfirmasi bisa main' : 'Menunggu konfirmasi') : null,
                ];
            })->values(),
        ]);
    }

    public function close(Request $request): RedirectResponse
    {
        $request->validate(['confirm' => ['accepted']], ['confirm.accepted' => 'Centang konfirmasi dulu.']);
        abort_if(Setting::get('ranking_closed_at'), 422, 'Peringkat sudah ditutup.');

        Setting::put('ranking_closed_at', now()->format('d M Y H:i'));
        ActivityLogger::log('ranking.closed', 'ranking', null, [], $request->user());

        return back()->with('status', 'Peringkat ditutup. Pemenang dikonfirmasi.');
    }
}
