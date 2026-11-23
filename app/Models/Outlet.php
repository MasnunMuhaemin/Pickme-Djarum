<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Outlet extends Model
{
    protected $fillable = ['code', 'name', 'area_id', 'status'];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function board(): HasOne
    {
        return $this->hasOne(Board::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && ! Setting::programPaused();
    }
}
