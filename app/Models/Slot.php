<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Slot extends Model
{
    protected $fillable = [
        'board_id', 'position', 'code', 'prize_type', 'voucher_type_id', 'voucher_code', 'status', 'holder_id', 'held_until', 'used_at',
    ];

    protected $casts = [
        'held_until' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function holder(): BelongsTo
    {
        return $this->belongsTo(Participant::class, 'holder_id');
    }

    /** Isi slot dari Master data (A6); kosong untuk merchandise. */
    public function voucherType(): BelongsTo
    {
        return $this->belongsTo(VoucherType::class);
    }

    public function claim(): HasOne
    {
        return $this->hasOne(Claim::class);
    }
}
