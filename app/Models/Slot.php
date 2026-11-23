<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Slot extends Model
{
    protected $fillable = [
        'board_id', 'position', 'code', 'prize_type', 'status', 'holder_id', 'held_until', 'used_at',
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

    public function claim(): HasOne
    {
        return $this->hasOne(Claim::class);
    }
}
