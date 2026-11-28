<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Outlet extends Model
{
    protected $fillable = ['code', 'name', 'whatsapp', 'area_id', 'status', 'qr_tested_at', 'lat', 'lng'];

    protected $casts = ['qr_tested_at' => 'datetime'];

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

    /** Area kos yang dicakup warung ini; area_id tetap menyimpan area pertama untuk tampilan dan laporan. */
    public function areas(): BelongsToMany
    {
        return $this->belongsToMany(Area::class);
    }

    /** Jenis voucher yang dipilih admin untuk papan warung ini. Kosong berarti semua jenis. */
    public function voucherTypes(): BelongsToMany
    {
        return $this->belongsToMany(VoucherType::class);
    }
}
