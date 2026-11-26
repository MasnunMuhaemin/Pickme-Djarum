<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\User;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;

/**
 * Admin menolak klaim yang sudah disetujui (Antrean foto). Hadiah klaim itu dibatalkan dan capnya dicabut; nomor
 * cap tetap terpakai sebagai "ditolak" di kartu peserta. Hanya selama hadiahnya belum diproses (PRD: keputusan bisa
 * diurungkan selama hadiah belum diproses): voucher yang sudah ditukar mitra atau hadiah yang sudah dikirim tidak
 * bisa ditolak dari sini.
 */
class ClaimRejectionService
{
    /** Status hadiah yang berarti sudah diproses (ditukar, top up selesai, token terkirim, bensin diserahkan, barang dikirim). */
    private const PROCESSED_VOUCHER = ['redeemed', 'done', 'handed_over'];

    private const PROCESSED_GIFT = ['shipping', 'done', 'completed'];

    /** Alasan klaim tidak bisa ditolak, atau null bila bisa. */
    public function blocker(Claim $claim): ?string
    {
        if ($claim->status !== 'approved') {
            return 'Klaim ini tidak berstatus disetujui.';
        }
        $voucher = $claim->voucher;
        if ($voucher && (in_array($voucher->status, self::PROCESSED_VOUCHER, true) || ($voucher->type === 'token' && $voucher->status === 'sent'))) {
            return 'Hadiah klaim ini sudah diproses, jadi tidak bisa ditolak dari sini.';
        }
        if ($claim->gifts->where('type', '!=', 'mystery_pack')->contains(fn ($g) => in_array($g->status, self::PROCESSED_GIFT, true))) {
            return 'Hadiah barang klaim ini sudah dikirim, jadi tidak bisa ditolak dari sini.';
        }

        return null;
    }

    public function reject(Claim $claim, string $reason, User $admin): void
    {
        DB::transaction(function () use ($claim, $reason, $admin) {
            $claim = Claim::with(['voucher', 'gifts', 'participant'])->lockForUpdate()->findOrFail($claim->id);
            if ($blocker = $this->blocker($claim)) {
                throw new \DomainException($blocker);
            }

            // cap_at tetap disimpan: urutan nomor cap peserta tidak bergeser. Peringkat hanya menghitung klaim disetujui.
            $hadCap = (bool) $claim->cap_at;
            $claim->update(['status' => 'rejected', 'reject_reason' => $reason, 'rejected_at' => now()]);
            if ($hadCap && $claim->participant->caps > 0) {
                $claim->participant->decrement('caps');
            }

            // Hadiah klaim ini dibatalkan; mystery gift yang menempel ke klaim yang sama tidak ikut.
            $claim->voucher?->update(['status' => 'cancelled']);
            $claim->gifts->where('type', '!=', 'mystery_pack')->each->update(['status' => 'cancelled']);

            ActivityLogger::log('claim.rejected', 'claim', $claim->id, ['reason' => $reason, 'cap_revoked' => $hadCap], $admin);
        });
    }
}
