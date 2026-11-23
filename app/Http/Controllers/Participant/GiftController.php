<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Http\Requests\DestinationRequest;
use App\Models\Gift;
use App\Models\Participant;
use App\Models\Voucher;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GiftController extends Controller
{
    public function showAddress(Request $request, ?int $giftId = null): Response
    {
        $participant = $this->participant($request);
        $query = Gift::whereHas('claim', fn ($q) => $q->where('participant_id', $participant->id));
        $gift = $giftId ? $query->where('id', $giftId)->firstOrFail() : $query->latest()->firstOrFail();

        return Inertia::render('participant/alamat', ['gift' => $gift->only(['id', 'type', 'status'])]);
    }

    public function storeAddress(AddressRequest $request, ?int $giftId = null): RedirectResponse
    {
        $participant = $this->participant($request);
        $query = Gift::whereHas('claim', fn ($q) => $q->where('participant_id', $participant->id));
        $gift = $giftId ? $query->where('id', $giftId)->firstOrFail() : $query->latest()->firstOrFail();
        $data = $request->validated();

        $gift->update([
            'area' => $data['area'],
            'address' => trim($data['address'].(! empty($data['note']) ? ' Catatan: '.$data['note'] : '')),
            'status' => 'ready_to_ship',
        ]);
        ActivityLogger::log('gift.address_saved', 'gift', $gift->id, [], $participant);

        return to_route('participant.terima-kasih');
    }

    public function showDestination(Request $request, ?int $voucherId = null): Response
    {
        $participant = $this->participant($request);
        $voucher = $this->voucher($participant, $voucherId);

        return Inertia::render('participant/nomor-tujuan', [
            'voucher' => $voucher->only(['id', 'type', 'status', 'destination', 'failed_attempts']),
        ]);
    }

    public function storeDestination(DestinationRequest $request, ?int $voucherId = null): RedirectResponse
    {
        $participant = $this->participant($request);
        $voucher = $this->voucher($participant, $voucherId);
        $data = $request->validated();

        $voucher->update([
            'destination' => $data['destination'],
            'status' => 'pending_process',
        ]);
        ActivityLogger::log('voucher.destination_saved', 'voucher', $voucher->id, [], $participant);

        return to_route('participant.terima-kasih');
    }

    private function participant(Request $request): Participant
    {
        return Participant::findOrFail($request->session()->get('participant_id'));
    }

    private function voucher(Participant $participant, ?int $id): Voucher
    {
        $query = Voucher::whereHas('claim', fn ($q) => $q->where('participant_id', $participant->id));

        return $id ? $query->where('id', $id)->firstOrFail() : $query->latest()->firstOrFail();
    }
}
