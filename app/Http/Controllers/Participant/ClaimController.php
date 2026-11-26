<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\PhotoUploadRequest;
use App\Http\Requests\SlotCodeRequest;
use App\Models\Claim;
use App\Models\Gift;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Voucher;
use App\Services\ClaimFlagService;
use App\Services\ClaimVerificationService;
use App\Services\PhotoService;
use App\Services\RewardCreationService;
use App\Services\SlotAssignmentService;
use App\Support\RewardPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ClaimController extends Controller
{
    private function participant(Request $request): Participant
    {
        return Participant::findOrFail($request->session()->get('participant_id'));
    }

    private function outletCode(Request $request): string
    {
        return strtoupper((string) ($request->input('outlet') ?: $request->session()->get('claim_outlet') ?: 'W07'));
    }

    /** Batas klaim harian per peserta; klaim yang ditolak tidak dihitung. */
    private function dailyLimitReached(Request $request): bool
    {
        $id = $request->session()->get('participant_id');

        $limit = (int) config('participant.daily_claim_limit');

        return $id && $limit > 0 && Participant::claimsTodayOf($id) >= $limit;
    }

    /** P5: foto bungkus. Jam server saat kamera dibuka dipakai untuk watermark (PRD FR-35). */
    public function showPhoto(Request $request): Response|RedirectResponse
    {
        // Dicek sebelum kamera dibuka supaya peserta tidak memfoto sia-sia.
        if ($this->dailyLimitReached($request)) {
            return to_route('participant.home')->withErrors(['limit' => 'Batas klaim hari ini tercapai.']);
        }
        $outlet = Outlet::with('board')->where('code', $this->outletCode($request))->first();
        if ($outlet && ! $outlet->board->slots()->where('status', 'empty')->exists()) {
            return to_route('participant.home')->withErrors(['full' => 'Papan ini sudah penuh. Coba klaim di titik lain.']);
        }

        $openedAt = now();
        $request->session()->put('photo_opened_at', $openedAt->toIso8601String());

        return Inertia::render('participant/foto', [
            'outlet' => $this->outletCode($request),
            'openedAt' => $openedAt->format('H:i:s'),
            'claim' => null,
        ]);
    }

    public function storePhoto(
        Request $request,
        PhotoUploadRequest $form,
        PhotoService $photos,
        SlotAssignmentService $slots,
        ClaimFlagService $flagger,
    ): RedirectResponse {
        $participant = $this->participant($request);
        // Dicek lagi di sini supaya batas tidak bisa dilewati dengan mengirim foto langsung.
        if ($this->dailyLimitReached($request)) {
            return to_route('participant.home')->withErrors(['limit' => 'Batas klaim hari ini tercapai.']);
        }
        $outlet = Outlet::where('code', $this->outletCode($request))->firstOrFail();
        $openedAt = $request->session()->pull('photo_opened_at');
        $openedAt = $openedAt ? Carbon::parse($openedAt) : null;

        $claim = $slots->createClaim($participant, $outlet);

        try {
            $result = $photos->store($claim, $request->file('photo'), $openedAt);
        } catch (\RuntimeException) {
            $claim->delete();

            return back()->withErrors(['photo' => 'Foto belum terbaca, coba ambil ulang.']);
        }

        $claim->update(['flag' => Claim::joinFlags($flagger->photoFlags($claim, $result, $openedAt))]);

        $assigned = $slots->assignToClaim($claim);
        if (isset($assigned['error'])) {
            return to_route('participant.home')->withErrors(['claim' => $assigned['error']]);
        }

        // P6: papan slot dengan slot yang ditunjuk; peserta memasukkan kode slot, lalu hadiah dibuka di Klaim berhasil.
        return to_route('participant.slot');
    }

    /** P6: slot yang ditunjuk dan input kode. */
    public function showSlot(Request $request): Response|RedirectResponse
    {
        $claim = $this->activeDraft($request);
        if ($claim && ! $claim->slot_id) {
            $assigned = app(SlotAssignmentService::class)->assignToClaim($claim);
            if (isset($assigned['error'])) {
                return to_route('participant.home')->withErrors(['claim' => $assigned['error']]);
            }
            $claim = $claim->fresh('slot');
        }

        $outlet = Outlet::with('board.slots')->where('code', $this->outletCode($request))->firstOrFail();

        return Inertia::render('participant/slot', [
            'claim' => $claim ? [
                'id' => $claim->id,
                'status' => $claim->status,
                'claim_code' => $claim->claim_code,
                'slot' => $claim->slot ? [
                    'position' => $claim->slot->position,
                    // Kode slot yang ditunjuk selalu ditampilkan, sama di lokal dan production.
                    'code' => $claim->slot->code,
                ] : null,
            ] : null,
            'board' => $outlet->board->slots->map(fn ($s) => [
                'position' => $s->position,
                'status' => $s->status,
            ]),
        ]);
    }

    public function submitCode(
        Request $request,
        SlotCodeRequest $form,
        ClaimVerificationService $verification,
        RewardCreationService $rewards
    ): RedirectResponse {
        $claim = $this->activeDraft($request);
        if (! $claim || ! $claim->slot_id) {
            return to_route('participant.home')->withErrors(['claim' => 'Klaim tidak ditemukan atau slot belum ditunjuk.']);
        }

        $result = $verification->submitCode($claim, $form->input('code'));
        if (isset($result['error'])) {
            return back()->withErrors(['code' => $result['error']]);
        }

        $rewards->create($result['claim']);

        return to_route('participant.klaim.berhasil');
    }

    /** Klaim yang ditolak admin: alasan, kartu cap (nomornya tetap terpakai), dan bantuan admin. */
    public function showRejected(Request $request, string $code): Response
    {
        $participant = $this->participant($request);
        $claim = $participant->claims()->where('claim_code', $code)->where('status', 'rejected')->firstOrFail();

        return Inertia::render('participant/klaim-ditolak', [
            'claim' => [
                'claim_code' => $claim->claim_code,
                'reason' => $claim->reject_reason,
                'rejected_at' => $claim->rejected_at?->format('d M Y H:i'),
            ],
            'capTrail' => $participant->capTrail(),
            'hasMystery' => RewardController::mysteryReward($participant) !== null,
            'dailyLimit' => (int) config('participant.daily_claim_limit'),
            'adminWhatsapp' => config('participant.admin_whatsapp'),
        ]);
    }

    /** P7: hasil klaim, diisi dari data hadiah klaim terakhir yang disetujui. */
    public function showSuccess(Request $request): Response|RedirectResponse
    {
        $participant = $this->participant($request);
        $claim = $participant->claims()->where('status', 'approved')->with(['voucher', 'gifts', 'outlet'])->latest('submitted_at')->first();
        if (! $claim) {
            return to_route('participant.hadiah');
        }

        // Hadiah klaim ini sendiri; mystery gift bisa menempel ke klaim yang sama dan dipisah di bawah.
        $ownGift = $claim->gifts->firstWhere('type', '!=', 'mystery_pack');
        $reward = $claim->voucher
            ? RewardPresenter::voucher($claim->voucher)
            : ($ownGift ? RewardPresenter::gift($ownGift) : null);

        return Inertia::render('participant/klaim-berhasil', [
            'reward' => $reward,
            'mystery' => $this->mysteryEarnedBy($claim),
            'claim' => [
                'claim_code' => $claim->claim_code,
                'outlet' => $claim->outlet->code,
                'slot' => $claim->slot?->position,
                'submitted_at' => $claim->submitted_at?->format('d M Y H:i'),
            ],
            'caps' => $participant->fresh()->caps,
            'capTrail' => $participant->capTrail(),
            'hasMystery' => RewardController::mysteryReward($participant) !== null,
        ]);
    }

    /**
     * Mystery gift yang terbentuk karena klaim ini (cap ke-5), untuk pemberitahuan di layar hasil klaim.
     * Mystery gift dibuat dalam transaksi yang sama segera setelah klaim disetujui.
     */
    private function mysteryEarnedBy(Claim $claim): ?array
    {
        if (! $claim->submitted_at) {
            return null;
        }

        $claimIds = Claim::where('participant_id', $claim->participant_id)->pluck('id');
        $since = $claim->submitted_at->copy()->subSeconds(5);

        $voucher = Voucher::whereIn('claim_id', $claimIds)->where('source', 'mystery')->where('created_at', '>=', $since)->first();
        if ($voucher) {
            return RewardPresenter::voucher($voucher);
        }

        $gift = Gift::whereIn('claim_id', $claimIds)->where('type', 'mystery_pack')->where('created_at', '>=', $since)->first();

        return $gift ? RewardPresenter::gift($gift) : null;
    }

    private function activeDraft(Request $request): ?Claim
    {
        return $this->participant($request)
            ->claims()
            ->where('status', 'draft')
            ->with('slot')
            ->latest()
            ->first();
    }
}
