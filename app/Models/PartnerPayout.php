<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Rekap mingguan per mitra (A5). Status: berjalan (minggu ini), menunggu_bayar (minggu lalu), dibayar.
 * Pembayaran dilakukan di luar webapp; koreksi jumlah wajib beralasan dan hanya sebelum dibayar.
 */
class PartnerPayout extends Model
{
    protected $fillable = ['partner_id', 'week_start', 'redeemed_count', 'total_value', 'status', 'paid_at', 'proof', 'correction_reason'];

    protected $casts = ['week_start' => 'date', 'paid_at' => 'date', 'redeemed_count' => 'integer', 'total_value' => 'integer'];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
