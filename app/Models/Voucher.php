<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voucher extends Model
{
    protected $fillable = [
        'claim_id', 'code', 'type', 'source', 'status', 'destination', 'failed_attempts',
        'sent_at', 'processed_at', 'reference', 'partner_id', 'voucher_type_id', 'mystery_prize_id', 'value', 'redeemed_at', 'fail_reason', 'proof_path', 'proof_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'processed_at' => 'datetime',
        'redeemed_at' => 'datetime',
        'proof_at' => 'datetime',
        'failed_attempts' => 'integer',
        'value' => 'integer',
    ];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }

    public function voucherType(): BelongsTo
    {
        return $this->belongsTo(VoucherType::class);
    }

    /** Nilai rupiah voucher: salinan dari jenis voucher, atau nilai bawaan untuk voucher lama. */
    public function amount(): int
    {
        return $this->value ?? (int) config("participant.prize_values.{$this->type}", 0);
    }

    /** Pulsa/kuota: diisi admin ke nomor HP peserta (Pemenuhan › Top up), bukan ditukar dengan kode. */
    public function isKuota(): bool
    {
        return $this->type === 'voucher' && ($this->voucherType?->fulfillment === 'kuota' || $this->mysteryPrize?->fulfillment === 'topup');
    }

    public function mysteryPrize(): BelongsTo
    {
        return $this->belongsTo(MysteryPrize::class);
    }

    /** Mitra tempat voucher ditukar (A5 rekap pembayaran). */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
