<?php

namespace App\Support;

use App\Models\Gift;
use App\Models\Voucher;

/**
 * Menyiapkan data hadiah untuk tampilan peserta (Hadiahku dan detail voucher), supaya label dan nilai selalu sama.
 *
 * tone: done (hijau, selesai), progress (lime, sedang jalan / perlu aksi), waiting (krem, menunggu pihak lain).
 */
class RewardPresenter
{
    public static function voucher(Voucher $voucher): array
    {
        $value = self::rupiah((int) config("participant.prize_values.{$voucher->type}", 0));
        $needsDestination = $voucher->status === 'pending_data';
        $daysLeft = self::daysLeft($voucher);

        [$title, $description] = match ($voucher->type) {
            'voucher' => ['Voucher Kopi Grosir', "{$value} · berlaku {$daysLeft} hari"],
            'token' => ['Token listrik', "{$value} · kode dikirim lewat WhatsApp"],
            'bensin' => ['Bensin motor', "Tunai {$value} · admin hubungi lewat WhatsApp"],
            default => ['Hadiah', $value],
        };

        [$label, $tone] = match (true) {
            $voucher->status === 'sent' => ['Terkirim', 'done'],
            $needsDestination => ['Isi nomor tujuan', 'progress'],
            $voucher->type === 'token' => ['Diproses 1×24 jam', 'progress'],
            default => ['Menunggu admin', 'waiting'],
        };

        return [
            'id' => $voucher->id,
            'kind' => $voucher->type,
            'title' => $title,
            'description' => $description,
            'value' => $value,
            'days_left' => $daysLeft,
            'status' => $voucher->status,
            'status_label' => $label,
            'tone' => $tone,
            'action' => match (true) {
                $needsDestination => 'Isi nomor',
                $voucher->type === 'voucher' => 'Lihat kode',
                default => 'Lihat status',
            },
            'href' => $needsDestination
                ? route('participant.nomor-tujuan', $voucher->id)
                : route('participant.voucher', $voucher->code),
        ];
    }

    public static function gift(Gift $gift): array
    {
        $needsAddress = $gift->status === 'pending_address';

        [$label, $tone] = match ($gift->status) {
            'pending_address' => ['Menunggu alamat', 'progress'],
            'ready_to_ship' => ['Siap dikirim', 'waiting'],
            default => ['Terkirim', 'done'],
        };

        return [
            'id' => $gift->id,
            'kind' => $gift->type === 'mystery_pack' ? 'mystery' : 'merch',
            'title' => $gift->type === 'mystery_pack' ? 'Mystery gift' : 'Merchandise',
            'description' => $gift->type === 'mystery_pack' ? 'Hadiah kejutan, diantar ke alamatmu' : 'Diantar ke alamatmu',
            'status' => $gift->status,
            'status_label' => $label,
            'tone' => $tone,
            'action' => $needsAddress ? 'Isi alamat' : null,
            'href' => $needsAddress ? route('participant.alamat', $gift->id) : null,
        ];
    }

    /**
     * Ringkasan satu jenis hadiah untuk daftar "Hadiah yang bisa kamu dapat" di home.
     */
    public static function prize(string $type, int $remaining): array
    {
        $value = self::rupiah((int) config("participant.prize_values.{$type}", 0));

        [$title, $subtitle, $display] = match ($type) {
            'voucher' => ['Voucher Kopi Grosir', 'Voucher belanja', $value],
            'token' => ['Token listrik', 'Dikirim lewat WhatsApp', $value],
            'merch' => ['Merchandise', 'Diantar ke alamatmu', 'Barang'],
            'bensin' => ['Bensin motor', 'Tunai, admin hubungi', $value],
            default => ['Hadiah', 'Hadiah program', $value],
        };

        return [
            'type' => $type,
            'title' => $title,
            'subtitle' => $subtitle,
            'value' => $display,
            'remaining' => $remaining,
        ];
    }

    private static function daysLeft(Voucher $voucher): int
    {
        if (! $voucher->expires_at) {
            return (int) config('participant.voucher_valid_days');
        }

        return max(0, (int) ceil(now()->diffInDays($voucher->expires_at, false)));
    }

    private static function rupiah(int $amount): string
    {
        return 'Rp'.number_format($amount, 0, ',', '.');
    }
}
