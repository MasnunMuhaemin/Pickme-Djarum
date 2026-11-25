<?php

namespace App\Support;

/** PIN 4 angka untuk peserta dan mitra. Angka kembar atau berurutan (1111, 1234, 4321) tidak dipakai. */
class Pin
{
    public static function generate(): string
    {
        do {
            $pin = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            $weak = count(array_unique(str_split($pin))) === 1 || str_contains('0123456789', $pin) || str_contains('9876543210', $pin);
        } while ($weak);

        return $pin;
    }
}
