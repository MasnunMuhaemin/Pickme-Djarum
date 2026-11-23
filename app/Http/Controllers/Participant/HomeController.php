<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Slot;
use App\Support\RewardPresenter;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    private const ORDER = ['voucher', 'token', 'merch', 'bensin'];

    public function show(): Response
    {
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
}
