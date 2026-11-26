<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Participant extends Model
{
    protected $fillable = ['name', 'whatsapp', 'birth_date', 'area_id', 'pin_hash', 'caps', 'is_student', 'registered_at', 'blocked_at', 'blocked_reason'];

    protected $hidden = ['pin_hash'];

    protected $casts = [
        'birth_date' => 'date',
        'caps' => 'integer',
        'is_student' => 'boolean',
        'registered_at' => 'datetime',
        'blocked_at' => 'datetime',
    ];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    /** Jumlah klaim hari ini yang dihitung untuk batas harian (klaim ditolak tidak dihitung). */
    public static function claimsTodayOf(int $id): int
    {
        return Claim::where('participant_id', $id)
            ->where('status', '!=', 'rejected')
            ->where('created_at', '>=', today())
            ->count();
    }

    /**
     * Isi kartu cap berurutan (maks 10 nomor): 'cap' untuk klaim yang capnya dihitung, 'rejected' untuk klaim yang
     * ditolak admin. Klaim ditolak tetap memakai satu nomor, jadi klaim berikutnya lanjut ke nomor sesudahnya.
     *
     * @return list<'cap'|'rejected'>
     */
    public function capTrail(): array
    {
        return $this->claims()
            ->where(fn ($q) => $q->where(fn ($a) => $a->where('status', 'approved')->whereNotNull('cap_at'))->orWhere('status', 'rejected'))
            ->orderByRaw('coalesce(cap_at, rejected_at)')
            ->limit(10)
            ->pluck('status')
            ->map(fn (string $status) => $status === 'rejected' ? 'rejected' : 'cap')
            ->all();
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
