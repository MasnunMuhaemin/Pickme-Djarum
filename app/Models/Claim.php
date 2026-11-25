<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Claim extends Model
{
    protected $fillable = [
        'participant_id', 'outlet_id', 'slot_id', 'code', 'claim_code', 'flag', 'status', 'submitted_at',
    ];

    protected $casts = ['submitted_at' => 'datetime'];


    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(Slot::class);
    }

    public function photo(): HasOne
    {
        return $this->hasOne(ClaimPhoto::class);
    }

    /** Voucher hasil klaim ini sendiri (bukan dari mystery gift). */
    public function voucher(): HasOne
    {
        return $this->hasOne(Voucher::class)->where('source', 'claim');
    }

    /** Semua voucher yang menempel ke klaim ini, termasuk voucher mystery gift. */
    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function gifts(): HasMany
    {
        return $this->hasMany(Gift::class);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /** @return list<string> */
    public function flags(): array
    {
        return array_values(array_filter(explode(',', (string) $this->flag)));
    }

    /** @param  list<string>  $flags */
    public static function joinFlags(array $flags): ?string
    {
        $flags = array_values(array_unique(array_filter($flags)));

        return $flags ? implode(',', $flags) : null;
    }
}
