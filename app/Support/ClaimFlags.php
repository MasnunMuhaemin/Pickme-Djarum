<?php

namespace App\Support;

/** Label catatan sistem pada klaim (PRD bagian 18), tampil sebagai keterangan di Foto klaim. */
class ClaimFlags
{
    public const LABELS = [
        'first_photo' => 'Foto pertama peserta baru',
        'random_sample' => 'Sampel acak',
        'similar_photo' => 'Foto mirip klaim lain',
        'dark_photo' => 'Foto gelap',
        'photo_delay' => 'Foto dikirim lama setelah kamera dibuka',
        'different_slot' => 'Hadiah berbeda dari penunjukan',
        'late_code' => 'Jeda foto ke kode lebih dari 30 menit',
    ];

    /** @param  list<string>  $flags */
    public static function labels(array $flags): array
    {
        return array_map(fn ($flag) => self::LABELS[$flag] ?? $flag, $flags);
    }
}
