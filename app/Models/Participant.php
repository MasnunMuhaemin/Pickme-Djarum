<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Participant extends Model
{
    protected $fillable = ['name', 'whatsapp', 'birth_date', 'area_id', 'pin_hash', 'caps', 'is_student', 'registered_at'];

    protected $hidden = ['pin_hash'];

    protected $casts = [
        'birth_date' => 'date',
        'caps' => 'integer',
        'is_student' => 'boolean',
        'registered_at' => 'datetime',
    ];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(ParticipantDevice::class);
    }

    public function giftsViaClaims(): HasManyThrough
    {
        return $this->hasManyThrough(Gift::class, Claim::class);
    }

    public function hasAcceptedConsent(string $version): bool
    {
        return $this->consents()->where('version', $version)->where('is_required_accepted', true)->exists();
    }
}
