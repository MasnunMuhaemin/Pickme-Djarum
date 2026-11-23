<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Models\Voucher;
use App\Support\RewardPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function show(Request $request, ?string $code = null): Response
    {
        $participant = Participant::findOrFail($request->session()->get('participant_id'));
        $query = Voucher::whereHas('claim', fn ($q) => $q->where('participant_id', $participant->id));
        $voucher = $code ? $query->where('code', $code)->firstOrFail() : $query->latest()->firstOrFail();

        return Inertia::render('participant/voucher', [
            'voucher' => [
                ...$voucher->only(['id', 'code', 'type', 'status', 'destination']),
                'expires_at' => $voucher->expires_at?->translatedFormat('d M Y'),
            ],
            'reward' => RewardPresenter::voucher($voucher),
        ]);
    }
}
