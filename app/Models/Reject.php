<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reject extends Model
{
    protected $fillable = ['reason', 'outlet_id', 'metadata', 'occurred_at'];

    protected $casts = ['metadata' => 'array', 'occurred_at' => 'datetime'];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
