<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Daftar izin (allow) atau blokir (block) mystery gift per nomor WhatsApp. */
class MysteryAccess extends Model
{
    protected $table = 'mystery_access';

    protected $fillable = ['whatsapp', 'kind', 'user_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
