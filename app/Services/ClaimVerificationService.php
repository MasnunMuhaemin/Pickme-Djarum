<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Reject;
use App\Models\Slot;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

/**
 * Pemeriksaan saat kode slot dimasukkan (PRD bagian 18). Tanpa persetujuan admin dan tanpa penahanan slot:
 * kode slot kosong yang benar langsung jadi klaim berhasil; tanda hanya catatan untuk admin.
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

        $rejection = match (true) {
            ! $slot => ['unknown_slot_code', 'Kode tidak dikenal. Cek lagi huruf dan angkanya.'],
            $slot->board->outlet_id !== $claim->outlet_id => [
                'wrong_board',
                "Kode ini dari papan titik lain. Ambil slot di papan {$claim->outlet->code}.",
            ],
            $slot->status === 'used' => ['slot_used', 'Kode ini sudah pernah dipakai. Ambil slot lain yang masih kosong.'],
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

        return DB::transaction(function () use ($claim, $slot) {
            $slot = Slot::whereKey($slot->id)->lockForUpdate()->first();
            if ($slot->status === 'used') {
                return ['error' => 'Slot ini baru saja diambil peserta lain. Ambil slot lain yang masih kosong.'];
            }

            // Tidak ada penahanan: slot kosong mana pun di papan yang sama diterima.
            $flags = $claim->flags();

            $photoAt = $claim->photo?->created_at ?? $claim->created_at;
            if ($photoAt && $photoAt->diffInMinutes(now()) > config('participant.flags.late_code_minutes')) {
                $flags[] = 'late_code';
            }

            // Klaim draf lain yang disarankan slot ini melepasnya (slot_id unik per klaim).
            Claim::where('slot_id', $slot->id)->where('id', '!=', $claim->id)->where('status', 'draft')
                ->update(['slot_id' => null, 'code' => null]);

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
}
