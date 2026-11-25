<?php

namespace App\Services;

use App\Models\Claim;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Peringkat dari klaim berstatus disetujui: cap terbanyak, lalu yang lebih dulu mencapai jumlah itu
 * (PRD bagian 3 dan FR-21). 10 teratas mendapat limited edition, 4 teratas golden slot.
 * Dipakai halaman Kartu peserta dan Peringkat admin.
 */
class RankingService
{
    public const TOP = 10;

    public const GOLDEN = 4;

    /** @return Collection<int, object{participant_id: int, caps: int, reached_at: string, rank: int}> */
    public function ranking(?CarbonInterface $since = null): Collection
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

    public function weekStart(): CarbonInterface
    {
        return now()->startOfWeek(CarbonInterface::MONDAY);
    }

    public function prize(int $rank): ?string
    {
        return match (true) {
            $rank <= self::GOLDEN => 'golden_slot',
            $rank <= self::TOP => 'limited_edition',
            default => null,
        };
    }
}
