<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\ClaimPhoto;
use Carbon\CarbonInterface;

/**
 * Tanda yang memasukkan klaim ke antrean admin (PRD bagian 18). Tanda tidak menolak klaim,
 * hanya menahannya untuk diperiksa admin.
 *
 * Saat foto diunggah: first_photo, random_sample, similar_photo, dark_photo, photo_delay.
 * Saat kode dimasukkan (ClaimVerificationService): different_slot, late_code.
 */
class ClaimFlagService
{
    /**
     * @param  array{perceptual_hash: string, brightness: int}  $photo
     * @return list<string>
     */
    public function photoFlags(Claim $claim, array $photo, ?CarbonInterface $cameraOpenedAt): array
    {
        $config = config('participant.flags');
        $flags = [];

        if ($config['first_photo'] && $this->isFirstPhoto($claim)) {
            $flags[] = 'first_photo';
        }

        if ($config['random_sample_percent'] > 0 && random_int(1, 100) <= $config['random_sample_percent']) {
            $flags[] = 'random_sample';
        }

        if ($this->hasSimilarPhoto($claim, $photo['perceptual_hash'], $config['similar_photo_max_distance'])) {
            $flags[] = 'similar_photo';
        }

        if ($photo['brightness'] < $config['dark_photo_brightness']) {
            $flags[] = 'dark_photo';
        }

        if ($cameraOpenedAt && $cameraOpenedAt->diffInMinutes(now()) > $config['photo_delay_minutes']) {
            $flags[] = 'photo_delay';
        }

        return $flags;
    }

    private function isFirstPhoto(Claim $claim): bool
    {
        return ! ClaimPhoto::whereHas('claim', fn ($q) => $q
            ->where('participant_id', $claim->participant_id)
            ->where('id', '!=', $claim->id)
        )->exists();
    }

    /**
     * Bandingkan dengan hash foto klaim lain. Jumlah klaim program kecil (sekitar 500), jadi perbandingan
     * langsung masih ringan; hash dengan versi berbeda tidak dibandingkan.
     */
    private function hasSimilarPhoto(Claim $claim, string $hash, int $maxDistance): bool
    {
        return ClaimPhoto::where('claim_id', '!=', $claim->id)
            ->where('hash_version', 'dhash-64')
            ->pluck('perceptual_hash')
            ->contains(fn ($other) => $this->distance($hash, $other) <= $maxDistance);
    }

    private function distance(string $a, string $b): int
    {
        if (strlen($a) !== strlen($b)) {
            return PHP_INT_MAX;
        }

        $bits = 0;
        foreach (str_split($a) as $i => $char) {
            $bits += substr_count(decbin(hexdec($char) ^ hexdec($b[$i])), '1');
        }

        return $bits;
    }
}
