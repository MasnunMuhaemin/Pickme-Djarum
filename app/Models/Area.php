<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $fillable = ['name', 'is_delivery_area'];

    protected $casts = ['is_delivery_area' => 'boolean'];

    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }

    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class);
    }
}
