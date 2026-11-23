<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consent extends Model
{
    protected $fillable = [
        'participant_id', 'version', 'body', 'is_required_accepted', 'is_optional_accepted', 'agreed_at',
    ];

    protected $casts = [
        'is_required_accepted' => 'boolean',
        'is_optional_accepted' => 'boolean',
        'agreed_at' => 'datetime',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }
}
