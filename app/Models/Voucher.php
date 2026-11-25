<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voucher extends Model
{
    protected $fillable = [
        'claim_id', 'code', 'type', 'source', 'status', 'destination', 'failed_attempts', 'expires_at',
        'sent_at', 'processed_at', 'reference', 'partner_id', 'voucher_type_id', 'value', 'redeemed_at', 'fail_reason',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'sent_at' => 'datetime',
        'processed_at' => 'datetime',
        'redeemed_at' => 'datetime',
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

    /** Mitra tempat voucher ditukar (A5 rekap pembayaran). */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** Voucher mitra yang sudah terkirim tapi lewat masa berlaku dianggap kadaluarsa (PRD bagian 17). */
    public function isExpired(): bool
    {
        return $this->status === 'expired'
            || ($this->status === 'sent' && $this->type === 'voucher' && $this->expires_at?->isPast());
    }
}
