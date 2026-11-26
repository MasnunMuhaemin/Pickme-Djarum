<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Models\Slot;
use App\Services\RankingService;
use App\Support\RewardPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    private const ORDER = ['voucher', 'token', 'merch', 'bensin'];

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
            ]);
        }

        // Jenis hadiah yang ada di papan aktif, beserta sisa slot yang masih kosong.
        $prizes = Slot::query()
            ->whereHas('board', fn ($q) => $q->where('status', 'active'))
            ->get(['prize_type', 'status'])
            ->groupBy('prize_type')
            ->sortBy(fn ($slots, $type) => array_search($type, self::ORDER, true) === false ? 99 : array_search($type, self::ORDER, true))
            ->map(fn ($slots, $type) => RewardPresenter::prize($type, $slots->where('status', 'empty')->count()))
            ->values();

        return Inertia::render('participant/home', ['prizes' => $prizes]);
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
            'rank' => $this->rankings->ranking()->firstWhere('participant_id', $participant->id)?->rank,
            // Dibatasi ke batas harian (0 = tanpa batas): klaim lama sebelum aturan batas berlaku tidak membuat angka melebihi batas.
            'claims_today' => $limit > 0 ? min($today, $limit) : $today,
            'daily_limit' => $limit,
        ];
    }
}
