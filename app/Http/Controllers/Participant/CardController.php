<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Participant;
use Carbon\CarbonInterface;
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
    private const TOP = 10;

    public function index(Request $request): Response
    {
        $participant = $request->session()->get('participant_id')
            ? Participant::find($request->session()->get('participant_id'))
            : null;

        $total = $this->ranking();
        $weekly = $this->ranking(now()->startOfWeek(CarbonInterface::MONDAY));

        return Inertia::render('participant/kartu', [
            'caps' => $participant?->caps ?? 0,
            'name' => $participant?->name,
            'mysteryAt' => 5,
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

    /** @return Collection<int, object{participant_id: int, caps: int, reached_at: string, rank: int}> */
    private function ranking(?CarbonInterface $since = null): Collection
    {
        return Claim::query()
            ->where('status', 'approved')
            ->when($since, fn ($q) => $q->where('submitted_at', '>=', $since))
            ->groupBy('participant_id')
            ->selectRaw('participant_id, count(*) as caps, max(submitted_at) as reached_at')
            ->orderByDesc('caps')
            ->orderBy('reached_at')
            ->get()
            ->values()
            ->map(function ($row, $i) {
                $row->rank = $i + 1;
                $row->caps = (int) $row->caps;

                return $row;
            });
    }

    private function top(Collection $ranking, ?Participant $me): array
    {
        $rows = $ranking->take(self::TOP);
        $names = Participant::whereIn('id', $rows->pluck('participant_id'))->pluck('name', 'id');

        return $rows->map(fn ($row) => [
            'rank' => $row->rank,
            'name' => $names[$row->participant_id] ?? 'Peserta',
            'caps' => $row->caps,
            'prize' => $this->prize($row->rank),
            'is_me' => $me && $row->participant_id === $me->id,
        ])->values()->all();
    }

    private function position(Collection $ranking, Participant $me): ?array
    {
        $row = $ranking->firstWhere('participant_id', $me->id);

        return $row ? ['rank' => $row->rank, 'caps' => $row->caps, 'prize' => $this->prize($row->rank)] : null;
    }

    private function prize(int $rank): ?string
    {
        return match (true) {
            $rank <= 4 => 'golden_slot',
            $rank <= self::TOP => 'limited_edition',
            default => null,
        };
    }
}
