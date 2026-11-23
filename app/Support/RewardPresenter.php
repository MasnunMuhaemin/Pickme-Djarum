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
    /**
     * Status per jenis pemenuhan (PRD bagian 17):
     * voucher mitra: sent, redeemed, expired. Token: pending_data, pending_process, rejected (nomor ditolak),
     * needs_admin (3 kali ditolak), sent. Bensin tunai: pending, contacted, handed_over (tanpa tombol aksi).
     */
    public static function voucher(Voucher $voucher): array
    {
        $value = self::rupiah((int) config("participant.prize_values.{$voucher->type}", 0));
        $daysLeft = self::daysLeft($voucher);
        $expired = $voucher->isExpired();
        $needsDestination = $voucher->type === 'token' && in_array($voucher->status, ['pending_data', 'rejected'], true);

        [$title, $description] = match ($voucher->type) {
            'voucher' => ['Voucher Kopi Grosir', $expired ? "{$value} · masa berlaku habis" : "{$value} · berlaku {$daysLeft} hari"],
            'token' => ['Token listrik', "{$value} · kode dikirim lewat WhatsApp"],
            'bensin' => ['Bensin motor', "Tunai {$value} · admin hubungi lewat WhatsApp"],
            default => ['Hadiah', $value],
        };
        if ($voucher->source === 'mystery') {
            $title = "Mystery gift: {$title}";
        }

        [$label, $tone] = match (true) {
            $expired => ['Kadaluarsa', 'waiting'],
            $voucher->status === 'redeemed' => ['Sudah ditukar', 'done'],
            $needsDestination && $voucher->status === 'pending_data' => ['Isi nomor tujuan', 'progress'],
            $needsDestination => ['Nomor ditolak, isi ulang', 'progress'],
            $voucher->status === 'needs_admin' => ['Perlu bantuan admin', 'waiting'],
            $voucher->status === 'pending_process' => ['Diproses 1×24 jam', 'progress'],
            $voucher->status === 'contacted' => ['Dihubungi admin', 'progress'],
            in_array($voucher->status, ['sent', 'handed_over', 'done'], true) => [$voucher->type === 'bensin' ? 'Diserahkan' : 'Terkirim', 'done'],
            default => ['Menunggu admin', 'waiting'],
        };

        // Tombol aksi hanya bila peserta perlu bertindak. Bensin tunai tidak punya tombol (PRD P8).
        [$action, $href] = match (true) {
            $needsDestination => ['Isi nomor', route('participant.nomor-tujuan', $voucher->id)],
            $voucher->type === 'voucher' => ['Lihat kode', route('participant.voucher', $voucher->code)],
            $voucher->type === 'token' => ['Lihat status', route('participant.voucher', $voucher->code)],
            default => [null, null],
        };

        return [
            'id' => $voucher->id,
            'kind' => $voucher->type,
            'title' => $title,
            'description' => $description,
            'value' => $value,
            'days_left' => $daysLeft,
            'status' => $expired ? 'expired' : $voucher->status,
            'status_label' => $label,
            'tone' => $tone,
            'action' => $action,
            'href' => $href,
        ];
    }

    /**
     * Hadiah fisik: pending_address, ready_to_ship, shipping, done. Bungkus gratis dari mystery gift:
     * pending, contacted, done (cara serah diputuskan admin).
     */
    public static function gift(Gift $gift): array
    {
        $isFreePack = $gift->type === 'mystery_pack';
        $needsAddress = ! $isFreePack && $gift->status === 'pending_address';

        [$label, $tone] = match ($gift->status) {
            'pending_address' => ['Menunggu alamat', 'progress'],
            'ready_to_ship' => ['Siap dikirim', 'waiting'],
            'shipping' => ['Sedang diantar', 'progress'],
            'contacted' => ['Dihubungi admin', 'progress'],
            'done', 'completed' => ['Selesai', 'done'],
            default => ['Menunggu admin', 'waiting'],
        };

        return [
            'id' => $gift->id,
            'kind' => $isFreePack ? 'mystery' : 'merch',
            'title' => $isFreePack ? 'Mystery gift: 1 bungkus gratis' : 'Merchandise',
            'description' => $isFreePack ? 'Admin hubungi lewat WhatsApp untuk penyerahan' : 'Diantar ke alamatmu',
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
