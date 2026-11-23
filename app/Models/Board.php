<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Board extends Model
{
    protected $fillable = ['outlet_id', 'code', 'week_label', 'status'];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function slots(): HasMany
    {
        return $this->hasMany(Slot::class);
    }
}
