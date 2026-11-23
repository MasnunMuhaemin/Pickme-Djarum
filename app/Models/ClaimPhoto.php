<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClaimPhoto extends Model
{
    protected $fillable = ['claim_id', 'path', 'perceptual_hash', 'hash_version', 'brightness'];

    protected $casts = ['brightness' => 'integer'];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }
}
