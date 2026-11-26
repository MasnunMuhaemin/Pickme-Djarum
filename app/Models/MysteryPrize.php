<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Isi mystery gift yang diatur admin: nama, cara pemenuhan, stok, dan saklar aktif. */
class MysteryPrize extends Model
{
    public const FULFILLMENTS = [
        'kode' => 'Admin kirim kode',
        'mitra' => 'Tukar di mitra',
        'topup' => 'Top up oleh admin',
        'ambil' => 'Ambil di titik',
    ];

    protected $fillable = ['name', 'fulfillment', 'partner_id', 'value', 'stock', 'given', 'active'];

    protected $casts = ['value' => 'integer', 'stock' => 'integer', 'given' => 'integer', 'active' => 'boolean'];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function remaining(): int
    {
        return max(0, $this->stock - $this->given);
    }
}
