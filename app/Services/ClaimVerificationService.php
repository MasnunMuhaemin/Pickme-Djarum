<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Reject;
use App\Models\Slot;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

/**
 * Pemeriksaan saat kode slot dimasukkan (PRD bagian 18) dan penentuan status klaim:
 * tanpa tanda disetujui otomatis; bertanda hanya menunggu admin (pending) bila hadiahnya token listrik.
 */
class ClaimVerificationService
{
    public function submitCode(Claim $claim, string $code): array
    {
        $normalized = strtoupper(preg_replace('/[\s-]/', '', $code) ?? '');

        if (strlen($normalized) !== 6) {
            return ['error' => 'Kode harus 6 karakter. Huruf besar otomatis, spasi dan strip diabaikan.'];
        }

        $slot = Slot::with('board.outlet')->where('code', $normalized)->first();
        $assigned = $claim->slot;

        $rejection = match (true) {
            ! $slot => ['unknown_slot_code', 'Kode tidak dikenal. Cek lagi huruf dan angkanya. Slot tetap ditahan untuk kamu.'],
            $slot->board->outlet_id !== $claim->outlet_id => [
                'wrong_board',
                "Kode ini dari papan titik lain. Ambil slot di papan {$claim->outlet->code}.",
            ],
            $slot->status === 'used' => ['slot_used', 'Kode ini sudah pernah dipakai. Ambil slot yang ditunjuk untukmu.'],
            $this->heldByOther($slot, $claim) => [
                'slot_held_by_other',
                "Slot ini sedang ditahan peserta lain. Ambil slot yang ditunjuk: {$assigned?->position}.",
            ],
            default => null,
        };

        if ($rejection) {
            [$reason, $message] = $rejection;
            Reject::create([
                'reason' => $reason,
                'outlet_id' => $claim->outlet_id,
                'metadata' => ['claim_id' => $claim->id],
                'occurred_at' => now(),
            ]);
            ActivityLogger::log('claim.code_rejected', 'claim', $claim->id, ['reason' => $reason], $claim->participant);

            return ['error' => $message];
        }

        return DB::transaction(function () use ($claim, $slot, $assigned) {
            $slot = Slot::whereKey($slot->id)->lockForUpdate()->first();
            if ($slot->status === 'used' || $this->heldByOther($slot, $claim)) {
                return ['error' => 'Slot ini baru saja diambil peserta lain. Ambil slot yang ditunjuk untukmu.'];
            }

            $flags = $claim->flags();
            if ($assigned && $slot->id !== $assigned->id) {
                // Slot kosong lain di papan yang sama: diterima dengan tanda, slot yang ditunjuk dilepas.
                $flags[] = 'different_slot';
                $assigned->newQuery()->whereKey($assigned->id)->where('status', 'held')
                    ->update(['status' => 'empty', 'holder_id' => null, 'held_until' => null]);
            }

            $photoAt = $claim->photo?->created_at ?? $claim->created_at;
            if ($photoAt && $photoAt->diffInMinutes(now()) > config('participant.flags.late_code_minutes')) {
                $flags[] = 'late_code';
            }

            // Klaim draf lain yang masa tahannya habis atas slot ini melepasnya (slot_id unik per klaim).
            Claim::where('slot_id', $slot->id)->where('id', '!=', $claim->id)->where('status', 'draft')
                ->update(['slot_id' => null, 'code' => null]);

            // Hanya hadiah token listrik (perlu nomor meter dan diproses admin) yang menunggu pemeriksaan bila
            // bertanda. Voucher kopi dan hadiah lain langsung disetujui; tandanya tetap disimpan untuk catatan admin.
            $flag = Claim::joinFlags($flags);
            // Tidak ada persetujuan admin: kode slot benar berarti hadiah langsung jadi milik peserta.
            // Tanda tetap disimpan sebagai catatan pemeriksaan admin.
            $status = 'approved';

            $claim->update([
                'slot_id' => $slot->id,
                'code' => $slot->code,
                'flag' => $flag,
                'status' => $status,
                'submitted_at' => now(),
            ]);
            $slot->update(['status' => 'used', 'used_at' => now(), 'held_until' => null, 'holder_id' => $claim->participant_id]);

            ActivityLogger::log(
                $status === 'approved' ? 'claim.approved' : 'claim.queued',
                'claim',
                $claim->id,
                ['flags' => $flags],
                $claim->participant,
            );

            return ['claim' => $claim->fresh()->load(['slot', 'voucher', 'gifts'])];
        });
    }

    private function heldByOther(Slot $slot, Claim $claim): bool
    {
        return $slot->status === 'held'
            && $slot->holder_id !== $claim->participant_id
            && $slot->held_until?->isFuture();
    }
}
