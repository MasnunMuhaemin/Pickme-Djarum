<?php

namespace App\Support;

use App\Models\Claim;
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

    /** A2: klaim bertanda yang menunggu keputusan admin. */
    public static function photos(): Builder
    {
        return Claim::query()->where('status', 'pending');
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

    /** @return array{photos: int, fulfillment: int, dispatch: int} */
    public static function badges(): array
    {
        return [
            'photos' => self::photos()->count(),
            'fulfillment' => self::tokens()->count() + self::fuel()->count() + self::goods()->count() + self::needsHelp()->count(),
            'dispatch' => self::dispatch()->count(),
        ];
    }
}
