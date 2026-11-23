<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceEvent extends Model
{
    protected $fillable = ['participant_id', 'device_id', 'event_type', 'ip', 'risk_flag', 'reason', 'occurred_at'];

    protected $casts = ['occurred_at' => 'datetime'];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }
}
