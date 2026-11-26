<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Gift;
use App\Models\Participant;
use App\Models\Voucher;
use App\Support\RewardPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RewardController extends Controller
{
    public function index(Request $request): Response
    {
        $participant = Participant::findOrFail($request->session()->get('participant_id'));
        $claims = $participant->claims()->whereIn('status', ['approved', 'rejected'])->with(['vouchers', 'gifts', 'slot'])->get();

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

        return Inertia::render('participant/hadiah', [
            'rewards' => $rewards,
            'approvedClaims' => $claims->where('status', 'approved')->count(),
        ]);
    }

    /**
     * Klaim mystery gift cap ke-5. Hadiahnya sudah dibuat sistem saat cap ke-5 tercapai; halaman ini menampilkan
     * kartu tertutup lalu membukanya lewat kartu gosok.
     */
    public function mystery(Request $request): Response|RedirectResponse
    {
        $participant = Participant::findOrFail($request->session()->get('participant_id'));
        $reward = self::mysteryReward($participant);
        if (! $reward) {
            return to_route('participant.kartu');
        }

        return Inertia::render('participant/mystery-gift', ['reward' => $reward, 'caps' => $participant->caps]);
    }

    /** Mystery gift milik peserta (voucher acak atau satu bungkus gratis), atau null bila belum ada. */
    public static function mysteryReward(Participant $participant): ?array
    {
        $claimIds = $participant->claims()->pluck('id');
        $voucher = Voucher::whereIn('claim_id', $claimIds)->where('source', 'mystery')->first();
        if ($voucher) {
            return RewardPresenter::voucher($voucher);
        }
        $gift = Gift::whereIn('claim_id', $claimIds)->where('type', 'mystery_pack')->first();

        return $gift ? RewardPresenter::gift($gift) : null;
    }
}
