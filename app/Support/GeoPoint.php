<?php

namespace App\Support;

/** Koordinat dari teks "lat, lng" atau dari tautan Google Maps yang memuat koordinat (@lat,lng / q=lat,lng / !3dlat!4dlng). */
class GeoPoint
{
    /** @return array{lat: float, lng: float}|null */
    public static function parse(?string $text): ?array
    {
        $text = trim((string) $text);
        $patterns = [
            '/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/',
            '/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/',
            '/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/',
            '/[?&](?:q|query|ll)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                [$lat, $lng] = [(float) $m[1], (float) $m[2]];
                if (abs($lat) <= 90 && abs($lng) <= 180) {
                    return ['lat' => $lat, 'lng' => $lng];
                }
            }
        }

        return null;
    }
}
