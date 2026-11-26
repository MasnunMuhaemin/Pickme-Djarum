<?php

namespace App\Support;

use App\Models\Gift;
use App\Models\Voucher;
use Illuminate\Database\Eloquent\Builder;

/**
 * Definisi antrean admin, dipakai bersama oleh badge sidebar, Beranda (A1), dan halaman antreannya.
 */
class AdminQueues
{
    /** Barang yang dikirim admin ke alamat peserta (tab Merch dan LE). */
    public const GIFT_TYPES = ['merchandise', 'limited_edition'];

    /** Pulsa/kuota (voucher mitra kuota atau mystery gift top up): nomor sudah diisi, admin yang mengisi. */
    public static function topups(): Builder
    {
        return Voucher::query()->where('type', 'voucher')->where('status', 'pending_process')
            ->where(fn (Builder $q) => $q->whereHas('voucherType', fn ($t) => $t->where('fulfillment', 'kuota'))
                ->orWhereHas('mysteryPrize', fn ($m) => $m->where('fulfillment', 'topup')));
    }

    /** A3 token listrik: nomor tujuan sudah diisi peserta, menunggu diproses ke agregator. */
    public static function tokens(): Builder
    {
        return Voucher::query()->where('type', 'token')->where('status', 'pending_process');
    }

    /** A3 bensin tunai: menunggu dihubungi atau diserahkan. */
    public static function fuel(): Builder
    {
        return Voucher::query()->where('type', 'bensin')->whereIn('status', ['pending', 'contacted']);
    }

    /** A3 merch dan LE: alamat sudah ada, menunggu dikirim atau sedang diantar. */
    public static function goods(): Builder
    {
        return Gift::query()->whereIn('type', self::GIFT_TYPES)->whereIn('status', ['ready_to_ship', 'shipping']);
    }

    /** Permintaan yang sudah 3 kali salah: tampil di "Perlu bantuan admin". */
    public static function needsHelp(): Builder
    {
        return Voucher::query()->where('status', 'needs_admin');
    }

    /** Voucher mitra yang kodenya belum dikirim ke peserta lewat WhatsApp. */
    public static function dispatch(): Builder
    {
        return Voucher::query()->where('type', 'voucher')->where('status', 'sent')->whereNull('sent_at');
    }

    /** @return array{fulfillment: int, dispatch: int} */
    public static function badges(): array
    {
        return [
            'fulfillment' => self::topups()->count() + self::tokens()->count() + self::fuel()->count() + self::goods()->count() + self::needsHelp()->count(),
            'dispatch' => self::dispatch()->count(),
        ];
    }
}
