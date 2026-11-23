<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Http\Requests\DestinationRequest;
use App\Models\Area;
use App\Models\Gift;
use App\Models\Participant;
use App\Models\Voucher;
use App\Support\ActivityLogger;
use App\Support\RewardPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GiftController extends Controller
{
    /** Detail hadiah barang (merchandise, limited edition, bungkus gratis mystery gift) milik peserta. */
    public function show(Request $request, int $giftId): Response
    {
        $gift = $this->gift($this->participant($request), $giftId)->load('claim.outlet');
        // Alamat tersimpan sebagai "alamat Catatan: catatan" (lihat storeAddress).
        [$address, $note] = array_pad(explode(' Catatan: ', (string) $gift->address, 2), 2, null);

        return Inertia::render('participant/hadiah-barang', [
            'gift' => [
                'id' => $gift->id,
                'area' => $gift->area,
                'address' => $address ?: null,
                'note' => $note ?: null,
                'claim_code' => $gift->claim?->claim_code,
                'outlet' => $gift->claim?->outlet?->code,
                'received_at' => $gift->created_at?->translatedFormat('d M Y'),
            ],
            'reward' => RewardPresenter::gift($gift),
        ]);
    }

    /** Form alamat hanya untuk merchandise/limited edition yang menunggu alamat (PRD bagian 14). */
    public function showAddress(Request $request, ?int $giftId = null): Response|RedirectResponse
    {
        $participant = $this->participant($request);
        $gift = $this->gift($participant, $giftId);
        if ($gift->status !== 'pending_address' || $gift->type === 'mystery_pack') {
            return to_route('participant.hadiah');
        }

        $areas = Area::where('is_delivery_area', true)->orderBy('name')->pluck('name');

        return Inertia::render('participant/alamat', [
            'gift' => $gift->only(['id', 'type', 'status']),
            // Data yang sudah ada tidak ditanya lagi (tetap bisa diubah): nama peserta sebagai penerima, area dari
            // pendaftaran bila termasuk area antar, dan alamat yang pernah diisi untuk hadiah sebelumnya.
            // Nomor WhatsApp untuk pengantar memakai nomor akun.
            'defaults' => $this->addressDefaults($participant, $areas->all()),
            'areas' => $areas,
        ]);
    }

    public function storeAddress(AddressRequest $request, ?int $giftId = null): RedirectResponse
    {
        $participant = $this->participant($request);
        $gift = $this->gift($participant, $giftId);
        if ($gift->status !== 'pending_address') {
            return to_route('participant.hadiah');
        }
        $data = $request->validated();

        $gift->update([
            'area' => $data['area'],
            'address' => trim($data['address'].(! empty($data['note']) ? ' Catatan: '.$data['note'] : '')),
            'status' => 'ready_to_ship',
        ]);
        ActivityLogger::log('gift.address_saved', 'gift', $gift->id, [], $participant);

        return to_route('participant.terima-kasih');
    }

    /**
     * Nomor tujuan token listrik: bisa diisi saat menunggu data atau setelah nomor ditolak. Setelah ditolak
     * sebanyak batas di pengaturan, status menjadi perlu bantuan admin (PRD FR-16).
     */
    public function showDestination(Request $request, ?int $voucherId = null): Response|RedirectResponse
    {
        $participant = $this->participant($request);
        $voucher = $this->voucher($participant, $voucherId);
        if (! $this->canFillDestination($voucher)) {
            return to_route('participant.hadiah');
        }

        return Inertia::render('participant/nomor-tujuan', [
            'voucher' => $voucher->only(['id', 'type', 'status', 'failed_attempts']),
            'reward' => RewardPresenter::voucher($voucher),
            'maxFailures' => config('participant.destination_max_failures'),
        ]);
    }

    public function storeDestination(DestinationRequest $request, ?int $voucherId = null): RedirectResponse
    {
        $participant = $this->participant($request);
        $voucher = $this->voucher($participant, $voucherId);
        if (! $this->canFillDestination($voucher)) {
            return to_route('participant.hadiah');
        }

        $voucher->update([
            'destination' => $request->validated('destination'),
            'status' => 'pending_process',
        ]);
        ActivityLogger::log('voucher.destination_saved', 'voucher', $voucher->id, [], $participant);

        return to_route('participant.terima-kasih');
    }

    /**
     * @param  list<string>  $deliveryAreas
     * @return array{recipient: string, area: string, address: string, note: string}
     */
    private function addressDefaults(Participant $participant, array $deliveryAreas): array
    {
        $last = Gift::whereHas('claim', fn ($q) => $q->where('participant_id', $participant->id))
            ->whereNotNull('address')->where('address', '!=', '')
            ->latest('updated_at')->first();

        // Alamat tersimpan sebagai "alamat Catatan: catatan" (lihat storeAddress).
        [$address, $note] = array_pad(explode(' Catatan: ', (string) $last?->address, 2), 2, '');
        $registeredArea = $participant->area?->name;
        $area = $last?->area ?: $registeredArea;

        return [
            'recipient' => $participant->name,
            'area' => in_array($area, $deliveryAreas, true) ? $area : (in_array($registeredArea, $deliveryAreas, true) ? $registeredArea : ''),
            'address' => $address,
            'note' => $note,
        ];
    }

    private function canFillDestination(Voucher $voucher): bool
    {
        return $voucher->type === 'token'
            && in_array($voucher->status, ['pending_data', 'rejected'], true)
            && $voucher->failed_attempts < config('participant.destination_max_failures');
    }

    private function participant(Request $request): Participant
    {
        return Participant::findOrFail($request->session()->get('participant_id'));
    }

    private function gift(Participant $participant, ?int $id): Gift
    {
        $query = Gift::whereHas('claim', fn ($q) => $q->where('participant_id', $participant->id));

        return $id ? $query->where('id', $id)->firstOrFail() : $query->latest()->firstOrFail();
    }

    private function voucher(Participant $participant, ?int $id): Voucher
    {
        $query = Voucher::whereHas('claim', fn ($q) => $q->where('participant_id', $participant->id));

        return $id ? $query->where('id', $id)->firstOrFail() : $query->latest()->firstOrFail();
    }
}
