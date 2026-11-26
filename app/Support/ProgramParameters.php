<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Parameter program yang bisa diubah admin di A7 Pengaturan (PRD bagian 3). Nilai tersimpan di tabel settings
 * dengan kunci "param.<kunci config>" dan menimpa config/participant.php saat aplikasi berjalan.
 */
class ProgramParameters
{
    /**
     * @return array<string, array{label: string, unit: string, min: int, max: int, note?: string}>
     */
    public static function editable(): array
    {
        return [
            'participant.flags.similar_photo_max_distance' => ['label' => 'Foto mirip (jarak hash maksimal)', 'unit' => 'bit', 'min' => 0, 'max' => 20],
            'participant.flags.dark_photo_brightness' => ['label' => 'Foto gelap (kecerahan di bawah)', 'unit' => 'dari 255', 'min' => 0, 'max' => 255],
            'participant.flags.late_code_minutes' => ['label' => 'Jeda foto ke input kode', 'unit' => 'menit', 'min' => 1, 'max' => 240],
            'participant.mystery_voucher_chance' => [
                'label' => 'Peluang peserta mendapat mystery gift di cap ke-5', 'unit' => '%', 'min' => 0, 'max' => 100,
            ],
            'participant.destination_max_failures' => ['label' => 'Batas salah nomor tujuan', 'unit' => 'kali', 'min' => 1, 'max' => 10],
            'participant.min_age' => ['label' => 'Batas usia pendaftar', 'unit' => 'tahun', 'min' => 17, 'max' => 30],
        ];
    }

    /** Terapkan nilai tersimpan ke config. Aman dipanggil sebelum tabel settings ada (mis. saat migrate). */
    public static function apply(): void
    {
        try {
            if (! Schema::hasTable('settings')) {
                return;
            }
            $saved = Setting::where('key', 'like', 'param.%')->pluck('value', 'key');
        } catch (Throwable) {
            return;
        }

        foreach ($saved as $key => $value) {
            $configKey = substr($key, strlen('param.'));
            if (array_key_exists($configKey, self::editable()) && is_numeric($value)) {
                config([$configKey => (int) $value]);
            }
        }
    }

    public static function isSaved(string $configKey): bool
    {
        return Setting::where('key', "param.{$configKey}")->exists();
    }
}
