<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Support\RewardPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RewardController extends Controller
{
    public function index(Request $request): Response
    {
        $participant = Participant::findOrFail($request->session()->get('participant_id'));
        $claims = $participant->claims()->where('status', 'approved')->with(['voucher', 'gifts', 'slot'])->get();

        $rewards = $claims->flatMap(function ($claim) {
            $items = [];
            if ($claim->voucher) {
                $items[] = RewardPresenter::voucher($claim->voucher);
            }
            foreach ($claim->gifts as $gift) {
                $items[] = RewardPresenter::gift($gift);
            }

            return $items;
        })->values();

        return Inertia::render('participant/hadiah', [
            'rewards' => $rewards,
            'approvedClaims' => $claims->count(),
        ]);
    }
}
