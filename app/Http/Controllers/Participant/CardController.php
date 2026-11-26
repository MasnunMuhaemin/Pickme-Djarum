<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Participant;
use App\Services\RankingService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * P9 Kartu dan peringkat. Peringkat dihitung dari klaim berstatus disetujui: cap terbanyak, lalu yang lebih
 * dulu mencapai jumlah itu (PRD bagian 3 dan FR-21). 10 teratas mendapat limited edition, 4 teratas golden slot.
 */
class CardController extends Controller
{
    public function __construct(private RankingService $rankings) {}

    public function index(Request $request): Response
    {
        $participant = $request->session()->get('participant_id')
            ? Participant::find($request->session()->get('participant_id'))
            : null;

        $total = $this->rankings->ranking();
        $weekly = $this->rankings->ranking($this->rankings->weekStart());

        return Inertia::render('participant/kartu', [
            'caps' => $participant?->caps ?? 0,
            'capTrail' => $participant?->capTrail() ?? [],
            'name' => $participant?->name,
            'mysteryAt' => 5,
            // Mystery gift yang sudah terbentuk; kartu menampilkan "Siap diklaim" sampai dibuka.
            'mystery' => $participant ? RewardController::mysteryReward($participant) : null,
            'outlets' => Outlet::where('status', 'active')->count(),
            'leaderboard' => [
                'total' => $this->top($total, $participant),
                'weekly' => $this->top($weekly, $participant),
            ],
            'me' => $participant ? [
                'total' => $this->position($total, $participant),
                'weekly' => $this->position($weekly, $participant),
            ] : null,
            'whatsappGroup' => config('participant.whatsapp_group_url'),
        ]);
    }

    private function top(Collection $ranking, ?Participant $me): array
    {
        $rows = $ranking->take(RankingService::TOP);
        $names = Participant::whereIn('id', $rows->pluck('participant_id'))->pluck('name', 'id');

        return $rows->map(fn ($row) => [
            'rank' => $row->rank,
            'name' => $names[$row->participant_id] ?? 'Peserta',
            'caps' => $row->caps,
            'prize' => $this->rankings->prize($row->rank),
            'is_me' => $me && $row->participant_id === $me->id,
        ])->values()->all();
    }

    private function position(Collection $ranking, Participant $me): ?array
    {
        $row = $ranking->firstWhere('participant_id', $me->id);

        return $row ? ['rank' => $row->rank, 'caps' => $row->caps, 'prize' => $this->rankings->prize($row->rank)] : null;
    }
}
