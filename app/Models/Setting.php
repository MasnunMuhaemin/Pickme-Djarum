<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Pengaturan program yang diubah admin tanpa deploy (PRD FR-28).
 */
class Setting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::find($key)?->value ?? $default;
    }

    public static function put(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /** Kalimat nyeleneh bawaan di gambar voucher; admin bisa menggantinya di Pengaturan. */
    public const VOUCHER_LINES = [
        'padahal bukan tombol tapi selalu tertekan',
        'dompet tipis, voucher tebal',
        'kode ini lebih setia dari mantan',
        'tunjukkan ke kasir, bukan ke mantan',
        'rezeki anak kos tidak ke mana',
        'kopi dulu, skripsi belakangan',
        'gratisan adalah bahasa cinta',
        'hemat itu keren, gratis itu legenda',
    ];

    /** @return list<string> Satu kalimat per baris, disimpan sebagai teks. */
    public static function voucherLines(): array
    {
        $saved = array_values(array_filter(array_map('trim', explode("
", (string) static::get('voucher_lines', '')))));

        return $saved ?: self::VOUCHER_LINES;
    }

    /** Tombol darurat: seluruh program dijeda (PRD bagian 9). */
    public static function programPaused(): bool
    {
        return (bool) static::get('program_paused', false);
    }
}
