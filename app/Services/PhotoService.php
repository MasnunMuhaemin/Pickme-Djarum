<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Voucher;
use Carbon\CarbonInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PhotoService
{
    /**
     * Watermark memakai jam server saat kamera dibuka (bukan jam HP), id titik, dan kode klaim (PRD FR-35).
     */
    public function store(Claim $claim, UploadedFile $file, ?CarbonInterface $cameraOpenedAt = null): array
    {
        $image = imagecreatefromstring($file->getContent());
        if ($image === false) {
            throw new \RuntimeException('File gambar tidak valid.');
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $brightness = $this->brightness($image, $width, $height);
        $hash = $this->hash($image, $width, $height);

        $stamp = ($cameraOpenedAt ?? now())->format('d/m H:i:s').' - '.$claim->outlet->code.' - '.$claim->claim_code;
        $path = 'claims/'.$claim->id.'.jpg';
        $this->stampAndSave($image, [$stamp], $path);

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

    /**
     * Foto bukti penukaran mitra: watermark jam server, nama mitra, kode, dan nilai voucher.
     *
     * @return string path di disk local
     */
    public function storeProof(Voucher $voucher, UploadedFile $file): string
    {
        $image = imagecreatefromstring($file->getContent());
        if ($image === false) {
            throw new \RuntimeException('File gambar tidak valid.');
        }

        $lines = [
            now()->format('d/m/Y H:i:s').' WIB',
            Str::ascii((string) $voucher->partner?->name).' - '.$voucher->code.' - Rp'.number_format($voucher->amount(), 0, ',', '.'),
        ];
        $path = 'proofs/'.$voucher->id.'.jpg';
        $this->stampAndSave($image, $lines, $path);

        return $path;
    }

    /**
     * Tulis cap teks (satu baris atau lebih) di kiri bawah lalu simpan sebagai JPEG kualitas 80 (foto HP tidak
     * membengkak seperti PNG).
     *
     * @param  list<string>  $lines
     */
    private function stampAndSave(\GdImage $image, array $lines, string $path): void
    {
        $height = imagesy($image);
        $font = 5;
        $tw = imagefontwidth($font) * max(array_map('strlen', $lines));
        $th = imagefontheight($font);
        $boxHeight = $th * count($lines) + 2 * (count($lines) - 1);
        $bg = imagecolorallocatealpha($image, 0, 0, 0, 40);
        $fg = imagecolorallocate($image, 255, 255, 255);
        imagefilledrectangle($image, 6, $height - $boxHeight - 12, $tw + 14, $height - 6, $bg);
        foreach ($lines as $i => $line) {
            imagestring($image, $font, 10, $height - $boxHeight - 9 + $i * ($th + 2), $line, $fg);
        }

        ob_start();
        imagejpeg($image, null, 80);
        $jpeg = ob_get_clean();
        imagedestroy($image);
        Storage::disk('local')->put($path, $jpeg);
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
