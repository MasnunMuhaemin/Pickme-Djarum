<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Participant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CardController extends Controller
{
    public function index(Request $request): Response
    {
        $participant = $request->session()->get('participant_id')
            ? Participant::find($request->session()->get('participant_id'))
            : null;

        $leaderboard = Participant::where('caps', '>', 0)
            ->orderByDesc('caps')
            ->orderBy('created_at')
            ->limit(10)
            ->get(['id', 'name', 'caps'])
            ->map(fn ($p, $i) => ['rank' => $i + 1, 'name' => $p->name, 'caps' => $p->caps]);

        return Inertia::render('participant/kartu', [
            'caps' => $participant?->caps ?? 0,
            'leaderboard' => $leaderboard,
            'areas' => Area::orderBy('name')->pluck('name'),
        ]);
    }
}
