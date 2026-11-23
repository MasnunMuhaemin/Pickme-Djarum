<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\PhotoUploadRequest;
use App\Http\Requests\SlotCodeRequest;
use App\Models\Area;
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

    /** P1/P4: beranda dan papan titik. */
    public function showBoard(Request $request): Response
    {
        $code = $this->outletCode($request);
        $request->session()->put('claim_outlet', $code);
        $outlet = Outlet::with(['board.slots', 'area'])->where('code', $code)->firstOrFail();
        $participant = $request->session()->get('participant_id') ? $this->participant($request) : null;
        $activeClaim = $participant?->claims()->where('status', 'draft')->latest()->first();
        $available = $outlet->board->slots->where('status', 'empty')->count();

        return Inertia::render('participant/papan', [
            'outlet' => [...$outlet->only(['id', 'code', 'name', 'status']), 'area' => $outlet->area?->name],
            // Kode slot tidak dikirim ke browser: kode hanya ada di balik slot fisik.
            'slots' => $outlet->board->slots->map(fn ($s) => [
                'position' => $s->position,
                'status' => $s->status,
            ]),
            'availableCount' => $available,
            'totalSlots' => $outlet->board->slots->count(),
            'activeClaim' => $activeClaim?->only(['id', 'status', 'claim_code', 'slot_id']),
            'canClaim' => $outlet->isActive() && $outlet->board?->status === 'active' && $available > 0,
            'paused' => ! $outlet->isActive() || $outlet->board?->status !== 'active',
            'board' => $outlet->board?->only(['week_label', 'status']),
            'modal' => $request->query('modal'),
            'areas' => Area::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function start(Request $request): RedirectResponse
    {
        $code = $this->outletCode($request);
        $request->session()->put('claim_outlet', $code);
        $outlet = Outlet::with('board')->where('code', $code)->firstOrFail();

        if (! $outlet->isActive()) {
            return back()->withErrors(['claim' => 'Papan sedang dijeda. Coba lagi nanti.']);
        }
        if (! $outlet->board->slots()->where('status', 'empty')->exists()) {
            return back()->withErrors(['claim' => 'Papan ini sudah penuh. Coba klaim di titik lain.']);
        }

        return to_route('participant.foto', ['outlet' => $code]);
    }

    /** P5: foto bungkus. Jam server saat kamera dibuka dipakai untuk watermark (PRD FR-35). */
    public function showPhoto(Request $request): Response
    {
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
            return to_route('participant.papan')->withErrors(['claim' => $assigned['error']]);
        }

        return to_route('participant.slot');
    }

    /** P6: slot yang ditunjuk dan input kode. */
    public function showSlot(Request $request): Response|RedirectResponse
    {
        $claim = $this->activeDraft($request);
        if ($claim && ! $claim->slot_id) {
            $assigned = app(SlotAssignmentService::class)->assignToClaim($claim);
            if (isset($assigned['error'])) {
                return to_route('participant.papan')->withErrors(['claim' => $assigned['error']]);
            }
            $claim = $claim->fresh('slot');
        }

        $outlet = Outlet::with('board.slots')->where('code', $this->outletCode($request))->firstOrFail();

        return Inertia::render('participant/slot', [
            'claim' => $claim ? [
                'id' => $claim->id,
                'status' => $claim->status,
                'claim_code' => $claim->claim_code,
                'held_until' => $claim->slot?->held_until?->toIso8601String(),
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
            return to_route('participant.papan')->withErrors(['claim' => 'Klaim tidak ditemukan atau slot belum ditunjuk.']);
        }

        $result = $verification->submitCode($claim, $form->input('code'));
        if (isset($result['error'])) {
            return back()->withErrors(['code' => $result['error']]);
        }

        // Klaim bertanda menunggu admin: cap dan hadiah baru dibuat saat disetujui (PRD bagian 6).
        if (! $result['claim']->isApproved()) {
            return to_route('participant.klaim.diperiksa', $result['claim']->id);
        }

        $rewards->create($result['claim']);

        return to_route('participant.klaim.berhasil');
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
                'submitted_at' => $claim->submitted_at?->format('d M Y H:i'),
            ],
            'caps' => $participant->fresh()->caps,
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
