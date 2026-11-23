<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\PhotoUploadRequest;
use App\Http\Requests\SlotCodeRequest;
use App\Models\Area;
use App\Models\Claim;
use App\Models\Outlet;
use App\Models\Participant;
use App\Services\ClaimVerificationService;
use App\Services\PhotoService;
use App\Services\RewardCreationService;
use App\Services\SlotAssignmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function showBoard(Request $request): Response
    {
        $code = $this->outletCode($request);
        $request->session()->put('claim_outlet', $code);
        $outlet = Outlet::with('board.slots')->where('code', $code)->firstOrFail();
        $participant = $request->session()->get('participant_id') ? $this->participant($request) : null;
        $activeClaim = $participant?->claims()->whereIn('status', ['draft', 'pending'])->latest()->first();

        return Inertia::render('participant/papan', [
            'outlet' => $outlet->only(['id', 'code', 'name', 'status']),
            'slots' => $outlet->board->slots->map(fn ($s) => [
                'position' => $s->position,
                'code' => $s->code,
                'status' => $s->status,
            ]),
            'availableCount' => $outlet->board->slots->where('status', 'empty')->count(),
            'totalSlots' => $outlet->board->slots->count(),
            'activeClaim' => $activeClaim?->only(['id', 'status', 'claim_code', 'slot_id']),
            'canClaim' => $outlet->isActive(),
            'modal' => $request->query('modal'),
            'areas' => Area::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function start(Request $request): RedirectResponse
    {
        $participant = $this->participant($request);
        if ($participant->is_student === false) {
            return to_route('participant.mahasiswa.khusus');
        }

        $code = $this->outletCode($request);
        $request->session()->put('claim_outlet', $code);
        $outlet = Outlet::where('code', $code)->firstOrFail();

        if (! $outlet->isActive()) {
            return back()->withErrors(['claim' => 'Papan sedang dijeda. Coba lagi nanti.']);
        }

        return to_route('participant.foto', ['outlet' => $code]);
    }

    public function showPhoto(Request $request): Response
    {
        return Inertia::render('participant/foto', [
            'outlet' => $this->outletCode($request),
            'claim' => null,
        ]);
    }

    public function storePhoto(
        Request $request,
        PhotoUploadRequest $form,
        PhotoService $photos,
        SlotAssignmentService $slots
    ): RedirectResponse {
        $participant = $this->participant($request);
        $code = $this->outletCode($request);
        $outlet = Outlet::where('code', $code)->firstOrFail();

        $claim = $slots->createClaim($participant, $outlet);
        $result = $photos->store($claim, $request->file('photo'));

        if ($result['is_dark']) {
            $claim->update(['flag' => 'dark_photo', 'status' => 'pending']);
        }

        $assigned = $slots->assignToClaim($claim);
        if (isset($assigned['error'])) {
            return to_route('participant.slot')->withErrors(['claim' => $assigned['error']]);
        }

        return to_route('participant.slot');
    }

    public function showSlot(Request $request): Response
    {
        $claim = $this->activeDraft($request);
        if ($claim && ! $claim->slot_id) {
            $slots = app(SlotAssignmentService::class);
            $assigned = $slots->assignToClaim($claim);
            if (isset($assigned['error'])) {
                return to_route('participant.papan')->withErrors(['claim' => $assigned['error']]);
            }
            $claim = $claim->fresh();
        }

        $outlet = Outlet::with('board.slots')->where('code', $this->outletCode($request))->firstOrFail();

        return Inertia::render('participant/slot', [
            'claim' => $claim?->load('slot')->only(['id', 'status', 'claim_code', 'slot']),
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

        $rewards->create($result['claim']);
        $variant = $claim->slot->prize_type;

        return to_route('participant.klaim.berhasil', ['variant' => $variant]);
    }

    private function activeDraft(Request $request): ?Claim
    {
        return $this->participant($request)
            ->claims()
            ->whereIn('status', ['draft', 'pending'])
            ->with('slot')
            ->latest()
            ->first();
    }
}
