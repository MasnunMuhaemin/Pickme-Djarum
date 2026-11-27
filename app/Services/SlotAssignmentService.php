<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Outlet;
use App\Models\Participant;
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
            // Saran slot tanpa penahanan: utamakan slot kosong yang belum disarankan ke peserta lain.
            $suggested = Claim::where('status', 'draft')->whereNotNull('slot_id')->pluck('slot_id');
            $slots = $outlet->board->slots()->where('status', '!=', 'used')->lockForUpdate();
            $slot = (clone $slots)->whereNotIn('id', $suggested)->inRandomOrder()->first() ?? $slots->inRandomOrder()->first();

            if (! $slot) {
                return ['error' => 'Papan penuh. Semua hadiah sudah diambil.'];
            }

            // slot_id unik per klaim: saran lama di klaim draf lain dilepas.
            Claim::where('slot_id', $slot->id)->where('status', 'draft')->where('id', '!=', $claim->id)->update(['slot_id' => null, 'code' => null]);
            $claim->update(['slot_id' => $slot->id, 'code' => $slot->code]);
            ActivityLogger::log('slot.assigned', 'claim', $claim->id, ['slot' => $slot->position], $claim->participant);

            return ['claim' => $claim->fresh()->load('slot')];
        });
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
