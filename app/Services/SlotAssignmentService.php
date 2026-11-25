<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Slot;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

class SlotAssignmentService
{
    public function createClaim(Participant $participant, Outlet $outlet): Claim
    {
        return $participant->claims()->create([
            'outlet_id' => $outlet->id,
            'claim_code' => $this->claimCode(),
            'status' => 'draft',
        ]);
    }

    public function assignToClaim(Claim $claim): array
    {
        if ($claim->slot_id) {
            return ['claim' => $claim->load('slot')];
        }

        $outlet = $claim->outlet;
        if (! $outlet->isActive()) {
            return ['error' => 'Papan sedang dijeda. Coba lagi nanti.'];
        }

        return DB::transaction(function () use ($claim, $outlet) {
            $this->releaseExpiredHolds($outlet);

            $slot = $outlet->board->slots()
                ->where('status', 'empty')
                ->lockForUpdate()
                ->inRandomOrder()
                ->first();

            if (! $slot) {
                return ['error' => 'Papan penuh. Semua slot sudah diambil.'];
            }

            $claim->update(['slot_id' => $slot->id, 'code' => $slot->code]);
            $slot->update([
                'status' => 'held',
                'holder_id' => $claim->participant_id,
                'held_until' => now()->addMinutes(config('participant.slot_hold_minutes')),
            ]);

            ActivityLogger::log('slot.assigned', 'claim', $claim->id, ['slot' => $slot->position], $claim->participant);

            return ['claim' => $claim->fresh()->load('slot')];
        });
    }

    /**
     * Slot yang masa tahannya habis kembali kosong (PRD bagian 17). Klaim draf pemegangnya melepas slot itu
     * dan akan ditunjuk slot baru saat membuka layar slot lagi.
     */
    public function releaseExpiredHolds(Outlet $outlet): void
    {
        $expired = $outlet->board->slots()
            ->where('status', 'held')
            ->where('held_until', '<', now())
            ->lockForUpdate()
            ->pluck('id');

        if ($expired->isEmpty()) {
            return;
        }

        Slot::whereIn('id', $expired)->update(['status' => 'empty', 'holder_id' => null, 'held_until' => null]);
        Claim::whereIn('slot_id', $expired)->where('status', 'draft')->update(['slot_id' => null, 'code' => null]);
    }

    /** Kode klaim KLM + 4 angka, tanpa spasi dan tanpa strip (seragam dengan kode slot dan kode voucher). */
    private function claimCode(): string
    {
        do {
            $code = 'KLM'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Claim::where('claim_code', $code)->exists());

        return $code;
    }
}
