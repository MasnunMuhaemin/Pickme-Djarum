<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voucher extends Model
{
    protected $fillable = [
        'claim_id', 'code', 'type', 'source', 'status', 'destination', 'failed_attempts',
        'sent_at', 'processed_at', 'reference', 'partner_id', 'voucher_type_id', 'value', 'redeemed_at', 'fail_reason',
    ];

    protected $casts = [
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

}
