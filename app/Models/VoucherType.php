<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Master data jenis voucher (A6): skema B, nilai penukaran, jumlah, dan cara pemenuhan. */
class VoucherType extends Model
{
    protected $fillable = ['name', 'partner_id', 'partner_label', 'value', 'quantity', 'fulfillment'];

    protected $casts = ['value' => 'integer', 'quantity' => 'integer'];

    /** Jenis pemenuhan per jenis hadiah slot. */
    public const FULFILLMENTS_BY_PRIZE = [
        'voucher' => ['mitra', 'kuota'],
        'token' => ['agregator'],
        'bensin' => ['tunai'],
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
