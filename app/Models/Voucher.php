<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voucher extends Model
{
    protected $fillable = [
        'claim_id', 'code', 'type', 'status', 'destination', 'failed_attempts', 'expires_at',
        'sent_at', 'processed_at', 'reference',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'sent_at' => 'datetime',
        'processed_at' => 'datetime',
        'failed_attempts' => 'integer',
    ];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }
}
