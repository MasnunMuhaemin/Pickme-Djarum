<?php

namespace App\Support;

/** Label tanda klaim untuk admin (PRD bagian 18) dan alasan tolak yang boleh dipilih. */
class ClaimFlags
{
    public const LABELS = [
        'first_photo' => 'Foto pertama peserta baru',
        'random_sample' => 'Sampel acak',
        'similar_photo' => 'Foto mirip klaim lain',
        'dark_photo' => 'Foto gelap',
        'photo_delay' => 'Foto dikirim lama setelah kamera dibuka',
        'different_slot' => 'Slot berbeda dari penunjukan',
        'late_code' => 'Jeda foto ke kode lebih dari 30 menit',
    ];

    /** Alasan tolak wajib dipilih dari daftar ini (PRD bagian 6). */
    public const REJECT_REASONS = [
        'Foto bukan bungkus produk program',
        'Foto buram atau terlalu gelap',
        'Foto sama dengan klaim lain',
        'Bukti pembelian tidak sesuai titik',
        'Kode slot tidak sesuai',
        'Indikasi kecurangan',
    ];

    /** @param  list<string>  $flags */
    public static function labels(array $flags): array
    {
        return array_map(fn ($flag) => self::LABELS[$flag] ?? $flag, $flags);
    }
}
