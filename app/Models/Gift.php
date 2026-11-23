<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Gift extends Model
{
    protected $fillable = ['claim_id', 'type', 'status', 'area', 'address', 'completed_at'];

    protected $casts = ['completed_at' => 'datetime'];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }
}
