<?php

namespace App\Support;

/** Penyamaran data pribadi untuk tampilan admin (PRD bagian 2: data seperlunya). */
class Mask
{
    /** 081234563456 menjadi 0812••••3456. */
    public static function whatsapp(?string $number): string
    {
        $number = (string) $number;
        if (strlen($number) < 8) {
            return $number;
        }

        return substr($number, 0, 4).'••••'.substr($number, -4);
    }

    /** Nomor untuk tautan wa.me (format internasional tanpa +): 0812... menjadi 62812... */
    public static function waLink(?string $number, string $text = ''): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $number);
        if (! $digits) {
            return null;
        }
        $intl = str_starts_with($digits, '0') ? '62'.substr($digits, 1) : $digits;

        return 'https://wa.me/'.$intl.($text !== '' ? '?text='.rawurlencode($text) : '');
    }
}
