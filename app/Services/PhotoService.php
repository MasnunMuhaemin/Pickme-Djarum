<?php

namespace App\Services;

use App\Models\Claim;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PhotoService
{
    public function store(Claim $claim, UploadedFile $file): array
    {
        $image = imagecreatefromstring($file->getContent());
        if ($image === false) {
            throw new \RuntimeException('File gambar tidak valid.');
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $brightness = $this->brightness($image, $width, $height);
        $hash = $this->hash($image, $width, $height);

        $stamp = now()->format('H:i:s').' - '.$claim->outlet->code.' - '.$claim->claim_code;
        $font = 5;
        $tw = imagefontwidth($font) * strlen($stamp);
        $th = imagefontheight($font);
        $bg = imagecolorallocatealpha($image, 0, 0, 0, 40);
        $fg = imagecolorallocate($image, 255, 255, 255);
        imagefilledrectangle($image, 6, $height - $th - 12, $tw + 14, $height - 6, $bg);
        imagestring($image, $font, 10, $height - $th - 9, $stamp, $fg);

        $path = 'claims/'.$claim->id.'.png';
        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        imagedestroy($image);
        Storage::disk('local')->put($path, $png);

        $claim->photo()->updateOrCreate(['claim_id' => $claim->id], [
            'path' => $path,
            'perceptual_hash' => $hash,
            'hash_version' => 'dhash-64',
            'brightness' => $brightness,
        ]);

        return [
            'perceptual_hash' => $hash,
            'brightness' => $brightness,
            'is_dark' => $brightness < config('participant.brightness_threshold'),
        ];
    }

    private function brightness(\GdImage $image, int $width, int $height): int
    {
        $sample = imagecreatetruecolor(32, 32);
        imagecopyresampled($sample, $image, 0, 0, 0, 0, 32, 32, $width, $height);
        $total = 0;
        for ($y = 0; $y < 32; $y++) {
            for ($x = 0; $x < 32; $x++) {
                $rgb = imagecolorat($sample, $x, $y);
                $total += (int) (($rgb >> 16 & 0xFF) * 0.299 + ($rgb >> 8 & 0xFF) * 0.587 + ($rgb & 0xFF) * 0.114);
            }
        }
        imagedestroy($sample);

        return (int) round($total / 1024);
    }

    private function hash(\GdImage $image, int $width, int $height): string
    {
        $sample = imagecreatetruecolor(9, 8);
        imagecopyresampled($sample, $image, 0, 0, 0, 0, 9, 8, $width, $height);
        $bits = '';
        for ($y = 0; $y < 8; $y++) {
            for ($x = 0; $x < 8; $x++) {
                $left = imagecolorat($sample, $x, $y) & 0xFF;
                $right = imagecolorat($sample, $x + 1, $y) & 0xFF;
                $bits .= $left > $right ? '1' : '0';
            }
        }
        imagedestroy($sample);

        $hex = '';
        foreach (str_split($bits, 4) as $chunk) {
            $hex .= dechex(bindec($chunk));
        }

        return $hex;
    }
}
