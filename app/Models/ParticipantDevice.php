<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParticipantDevice extends Model
{
    protected $fillable = ['participant_id', 'device_id', 'first_seen_at', 'last_seen_at', 'status'];

    protected $casts = ['first_seen_at' => 'datetime', 'last_seen_at' => 'datetime'];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(DeviceEvent::class, 'device_id', 'device_id');
    }
}
