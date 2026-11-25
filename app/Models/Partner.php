<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Mitra penukar voucher (PRD bagian 12): warung titik, penjual pulsa/kuota, atau mitra voucher lain. */
class Partner extends Model
{
    protected $fillable = ['name', 'type', 'area_id', 'whatsapp', 'pin_hash', 'status'];

    protected $hidden = ['pin_hash'];

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function voucherTypes(): HasMany
    {
        return $this->hasMany(VoucherType::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(PartnerPayout::class);
    }
}
