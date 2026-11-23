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
        $claims = $participant->claims()->where('status', 'approved')->with(['vouchers', 'gifts', 'slot'])->get();

        $rewards = $claims->flatMap(function ($claim) {
            $items = [];
            // Termasuk voucher mystery gift yang menempel ke klaim ini.
            foreach ($claim->vouchers as $voucher) {
                $items[] = RewardPresenter::voucher($voucher);
            }
            foreach ($claim->gifts as $gift) {
                $items[] = RewardPresenter::gift($gift);
            }

            return $items;
        })
            // Mystery gift cap ke-5 ditaruh paling atas supaya mudah ditemukan.
            ->sortBy(fn ($reward) => ($reward['mystery'] ?? false) ? 0 : 1)
            ->values();

        // Klaim yang ditangguhkan (antre admin) dan ditolak tampil di atas, menuju halaman statusnya.
        $claimCards = $participant->claims()->whereIn('status', ['pending', 'rejected'])
            ->with('outlet')->latest('submitted_at')->get()
            ->sortBy(fn ($claim) => $claim->status === 'pending' ? 0 : 1)
            ->map(fn ($claim) => RewardPresenter::claim($claim))
            ->values();

        return Inertia::render('participant/hadiah', [
            'rewards' => $claimCards->concat($rewards)->values(),
            'approvedClaims' => $claims->count(),
        ]);
    }
}
