<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Slot;
use App\Services\RankingService;
use App\Support\RewardPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    private const ORDER = ['voucher', 'token', 'merch', 'limited', 'bensin'];

    public function __construct(private RankingService $rankings) {}

    public function show(Request $request): Response
    {
        $participant = $this->participant($request);

        // Sudah masuk: beranda pribadi (kartu cap, pintasan). Tamu: halaman pengenalan program.
        if ($participant) {
            $lastOutlet = $request->session()->get('outlet_scanned')
                ?: $participant->claims()->whereNotNull('submitted_at')->latest('submitted_at')->first()?->outlet?->code;

            return Inertia::render('participant/home', [
                'me' => [
                    ...$this->summary($participant),
                    'last_outlet' => $lastOutlet,
                    'mystery' => RewardController::mysteryReward($participant),
                ],
                'lastBoard' => $this->board($lastOutlet),
                'leaders' => $this->leaders(),
            ]);
        }

        return Inertia::render('participant/home', ['prizes' => self::guestPrizes()]);
    }

    /** Jenis hadiah yang ada di papan aktif, beserta sisa slot yang masih kosong (beranda tamu). */
    public static function guestPrizes()
    {
        return Slot::query()
            ->whereHas('board', fn ($q) => $q->where('status', 'active'))
            ->get(['prize_type', 'status'])
            ->groupBy('prize_type')
            ->sortBy(fn ($slots, $type) => array_search($type, self::ORDER, true) === false ? 99 : array_search($type, self::ORDER, true))
            ->map(fn ($slots, $type) => RewardPresenter::prize($type, $slots->where('status', 'empty')->count()))
            ->values();
    }

    /** Profil saya: ringkasan cap, peringkat, klaim hari ini, dan data akun. */
    public function profile(Request $request): Response
    {
        $participant = $this->participant($request)->load('area');
        $wa = $participant->whatsapp;

        return Inertia::render('participant/profil', [
            'me' => [
                ...$this->summary($participant),
                // Nomor disamarkan di layar; hanya empat digit terakhir yang tampil.
                'whatsapp' => substr($wa, 0, 2).'** **** '.substr($wa, -4),
                'is_student' => $participant->is_student,
                'area' => $participant->area?->name,
            ],
        ]);
    }

    /** Papan terakhir di beranda: 25 slot urut A1 sampai E5 (terisi atau belum), nama warung, dan area. */
    private function board(?string $code): ?array
    {
        $outlet = $code ? Outlet::with(['area', 'board.slots'])->where('code', $code)->first() : null;
        if (! $outlet?->board) {
            return null;
        }
        $slots = $outlet->board->slots->sortBy('position')->values();

        return [
            'code' => $outlet->code,
            'name' => $outlet->name,
            'area' => $outlet->area?->name,
            'total' => $slots->count(),
            'used' => $slots->where('status', 'used')->count(),
            'filled' => $slots->map(fn (Slot $s) => $s->status === 'used')->all(),
        ];
    }

    /** Tiga teratas peringkat untuk kartu "Sedang memimpin". */
    private function leaders(): array
    {
        $top = $this->rankings->ranking()->take(3);
        $names = Participant::whereIn('id', $top->pluck('participant_id'))->pluck('name', 'id');

        return $top->map(fn ($row) => [
            'name' => str((string) ($names[$row->participant_id] ?? '-'))->trim()->before(' ')->value(),
            'caps' => $row->caps,
        ])->values()->all();
    }

    private function participant(Request $request): ?Participant
    {
        $id = $request->session()->get('participant_id');

        return $id ? Participant::find($id) : null;
    }

    private function summary(Participant $participant): array
    {
        $limit = (int) config('participant.daily_claim_limit');
        $today = Participant::claimsTodayOf($participant->id);

        return [
            'name' => $participant->name,
            'caps' => $participant->caps,
            'cap_trail' => $participant->capTrail(),
            'rank' => $this->rankings->ranking()->firstWhere('participant_id', $participant->id)?->rank,
            // Dibatasi ke batas harian (0 = tanpa batas): klaim lama sebelum aturan batas berlaku tidak membuat angka melebihi batas.
            'claims_today' => $limit > 0 ? min($today, $limit) : $today,
            'daily_limit' => $limit,
        ];
    }
}
