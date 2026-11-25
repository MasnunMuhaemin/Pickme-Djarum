<?php

namespace App\Support;

use App\Models\Claim;
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
        $value = self::rupiah($voucher->amount());
        // Jenis dan mitra dari Master data (A6); voucher lama tanpa jenis memakai label bawaan.
        $kind = $voucher->voucherType;
        $partner = $voucher->partner?->name ?? $kind?->partner_label;
        $where = $voucher->type === 'voucher' && $partner ? " · tukar di {$partner}" : '';
        $daysLeft = self::daysLeft($voucher);
        $expired = $voucher->isExpired();
        $needsDestination = $voucher->type === 'token' && in_array($voucher->status, ['pending_data', 'rejected'], true);

        [$title, $description] = match ($voucher->type) {
            'voucher' => [
                $kind ? "Voucher {$kind->name}" : 'Voucher Kopi Grosir',
                $expired ? "{$value}{$where} · masa berlaku habis" : "{$value}{$where} · berlaku {$daysLeft} hari",
            ],
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
            'mystery' => $voucher->source === 'mystery',
            'status' => $expired ? 'expired' : $voucher->status,
            'status_label' => $label,
            'tone' => $tone,
            'action' => $action,
            'href' => $href,
            // Pemberitahuan bila peserta masih harus mengisi form lanjutan supaya hadiah bisa dikirim.
            'follow_up' => match (true) {
                $needsDestination && $voucher->status === 'rejected' => [
                    'title' => 'Nomor tujuan ditolak',
                    'message' => 'Nomor meter atau ID pelanggan PLN sebelumnya tidak bisa diproses. Isi ulang supaya token bisa dikirim.',
                ],
                $needsDestination => [
                    'title' => 'Lengkapi data token listrik',
                    'message' => 'Isi nomor meter atau ID pelanggan PLN. Token baru diproses setelah nomor diisi.',
                ],
                default => null,
            },
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

        [$label, $tone] = match (true) {
            $isFreePack && in_array($gift->status, ['pending', 'pending_address'], true) => ['Menunggu admin', 'waiting'],
            default => match ($gift->status) {
                'pending_address' => ['Menunggu alamat', 'progress'],
                'ready_to_ship' => ['Siap dikirim', 'waiting'],
                'shipping' => ['Sedang diantar', 'progress'],
                'contacted' => ['Dihubungi admin', 'progress'],
                'done', 'completed' => ['Selesai', 'done'],
                default => ['Menunggu admin', 'waiting'],
            },
        };

        return [
            'id' => $gift->id,
            'kind' => $isFreePack ? 'mystery' : 'merch',
            'title' => $isFreePack ? 'Mystery gift: 1 bungkus gratis' : 'Merchandise',
            'description' => $isFreePack ? 'Admin hubungi lewat WhatsApp untuk penyerahan' : 'Diantar ke alamatmu',
            'mystery' => $isFreePack,
            'status' => $gift->status,
            'status_label' => $label,
            'tone' => $tone,
            // Menunggu alamat: langsung ke form alamat. Selain itu ke halaman detail hadiah barang.
            'action' => $needsAddress ? 'Isi alamat' : 'Lihat detail',
            'href' => $needsAddress ? route('participant.alamat', $gift->id) : route('participant.hadiah-barang', $gift->id),
            'follow_up' => $needsAddress ? [
                'title' => 'Lengkapi alamat pengiriman',
                'message' => 'Isi alamat dan area pengantaran. Hadiah baru dikirim setelah alamat diisi.',
            ] : null,
        ];
    }

    /**
     * Kartu klaim yang belum menjadi hadiah: ditangguhkan untuk pemeriksaan admin, atau ditolak.
     * Alasan tanda tidak ditampilkan ke peserta (PRD P7).
     */
    public static function claim(Claim $claim): array
    {
        $pending = $claim->status === 'pending';
        $when = $claim->submitted_at?->format('d M H:i');

        return [
            'id' => $claim->id,
            'kind' => $pending ? 'claim_pending' : 'claim_rejected',
            'title' => "Klaim {$claim->claim_code}",
            'description' => 'Titik '.($claim->outlet?->code ?? '-').($when ? " · {$when}" : ''),
            'status' => $claim->status,
            'status_label' => $pending ? 'Sedang diperiksa' : 'Ditolak',
            'tone' => $pending ? 'waiting' : 'rejected',
            'action' => $pending ? 'Lihat status' : 'Lihat alasan',
            'href' => route($pending ? 'participant.klaim.diperiksa' : 'participant.klaim.ditolak', $claim->id),
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
