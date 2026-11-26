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
     * voucher mitra: sent, redeemed (tanpa masa berlaku). Token: pending_data, pending_process, rejected (nomor ditolak),
     * needs_admin (3 kali ditolak), sent. Bensin tunai: pending, contacted, handed_over (tanpa tombol aksi).
     */
    public static function voucher(Voucher $voucher): array
    {
        $value = self::rupiah($voucher->amount());
        // Jenis dan mitra dari Master data (A6); voucher lama tanpa jenis memakai label bawaan.
        $kind = $voucher->voucherType;
        $partner = $voucher->partner?->name ?? $kind?->partner_label;
        $where = $voucher->type === 'voucher' && $partner ? " · tukar di {$partner}" : '';
        $kuota = $voucher->isKuota();
        $needsDestination = ($voucher->type === 'token' || $kuota) && in_array($voucher->status, ['pending_data', 'rejected'], true);

        [$title, $description] = match ($voucher->type) {
            'voucher' => $kuota
                ? [$kind ? $kind->name : 'Pulsa atau kuota', "{$value} · diisi ke nomor HP-mu"]
                : [$kind ? self::voucherTitle($kind->name) : 'Voucher Kopi Grosir', "{$value}{$where}"],
            'token' => ['Token listrik', "{$value} · kode dikirim lewat WhatsApp"],
            'bensin' => ['Bensin motor', "Tunai {$value} · admin hubungi lewat WhatsApp"],
            default => ['Hadiah', $value],
        };
        if ($voucher->status === 'cancelled') {
            $description = 'Klaim ditolak admin'.($voucher->claim?->reject_reason ? ": {$voucher->claim->reject_reason}" : '');
        }
        if ($voucher->source === 'mystery') {
            $title = "Mystery gift: {$title}";
        }

        [$label, $tone] = match (true) {
            $voucher->status === 'cancelled' => ['Klaim ditolak', 'rejected'],
            $voucher->status === 'redeemed' => ['Sudah ditukar', 'done'],
            $needsDestination && $voucher->status === 'pending_data' => ['Isi nomor tujuan', 'progress'],
            $needsDestination => ['Nomor ditolak, isi ulang', 'progress'],
            $voucher->status === 'needs_admin' => ['Perlu bantuan admin', 'waiting'],
            $voucher->status === 'pending_process' => [$kuota ? 'Diproses mitra' : 'Diproses 1×24 jam', 'progress'],
            $voucher->status === 'contacted' => ['Dihubungi admin', 'progress'],
            in_array($voucher->status, ['sent', 'handed_over', 'done'], true) => [$voucher->type === 'bensin' ? 'Diserahkan' : 'Terkirim', 'done'],
            default => ['Menunggu admin', 'waiting'],
        };

        // Tombol aksi hanya bila peserta perlu bertindak. Bensin tunai tidak punya tombol (PRD P8).
        [$action, $href] = match (true) {
            $voucher->status === 'cancelled' && $voucher->claim => ['Lihat detail', route('participant.klaim.ditolak', $voucher->claim->claim_code)],
            $voucher->status === 'cancelled' => [null, null],
            $needsDestination => ['Isi nomor', route('participant.nomor-tujuan', $voucher->id)],
            // Mystery gift cap ke-5 punya halaman detail sendiri (desain "Mystery gift terbuka!").
            $voucher->source === 'mystery' => ['Lihat detail', route('participant.mystery-gift')],
            $voucher->type === 'voucher' && ! $kuota => ['Lihat kode', route('participant.voucher', $voucher->code)],
            $voucher->type === 'token' || $kuota => ['Lihat status', route('participant.voucher', $voucher->code)],
            default => [null, null],
        };

        return [
            'id' => $voucher->id,
            'kind' => $kuota ? 'kuota' : $voucher->type,
            // Kode tampil di kotak putih gambar voucher (Klaim berhasil dan halaman Voucher).
            'code' => $voucher->code,
            'title' => $title,
            'description' => $description,
            'value' => $value,
            'mystery' => $voucher->source === 'mystery',
            'status' => $voucher->status,
            'status_label' => $label,
            'tone' => $tone,
            'action' => $action,
            'href' => $href,
            // Pemberitahuan bila peserta masih harus mengisi form lanjutan supaya hadiah bisa dikirim.
            'follow_up' => match (true) {
                $voucher->status === 'cancelled' => null,
                $kuota && $voucher->status === 'rejected' => [
                    'title' => 'Nomor HP ditolak',
                    'message' => 'Nomor HP sebelumnya tidak bisa diisi mitra. Isi ulang nomor yang benar.',
                ],
                $kuota && $needsDestination => [
                    'title' => 'Lengkapi nomor HP',
                    'message' => 'Isi nomor HP tujuan pulsa atau kuota. Mitra mengisinya setelah nomor diisi.',
                ],
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
                'cancelled' => ['Klaim ditolak', 'rejected'],
                default => ['Menunggu admin', 'waiting'],
            },
        };

        return [
            'id' => $gift->id,
            'kind' => $isFreePack ? 'mystery' : 'merch',
            'title' => $isFreePack ? 'Mystery gift: 1 bungkus gratis' : 'Merchandise',
            'description' => match (true) {
                $gift->status === 'cancelled' => 'Klaim ditolak admin'.($gift->claim?->reject_reason ? ": {$gift->claim->reject_reason}" : ''),
                $isFreePack => 'Admin hubungi lewat WhatsApp untuk penyerahan',
                default => 'Diantar ke alamatmu',
            },
            'mystery' => $isFreePack,
            'status' => $gift->status,
            'status_label' => $label,
            'tone' => $tone,
            // Menunggu alamat: langsung ke form alamat. Selain itu ke halaman detail hadiah barang.
            'action' => match (true) {
                $gift->status === 'cancelled' && $gift->claim => 'Lihat detail',
                $gift->status === 'cancelled' => null,
                $needsAddress => 'Isi alamat',
                default => 'Lihat detail',
            },
            'href' => match (true) {
                $gift->status === 'cancelled' && $gift->claim => route('participant.klaim.ditolak', $gift->claim->claim_code),
                $gift->status === 'cancelled' => null,
                $needsAddress => route('participant.alamat', $gift->id),
                $isFreePack => route('participant.mystery-gift'),
                default => route('participant.hadiah-barang', $gift->id),
            },
            'follow_up' => $needsAddress ? [
                'title' => 'Lengkapi alamat pengiriman',
                'message' => 'Isi alamat dan area pengantaran. Hadiah baru dikirim setelah alamat diisi.',
            ] : null,
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

    /** "Voucher Kopi"; nama jenis yang sudah diawali "Voucher" (mis. "Voucher warung") tidak diulang. */
    public static function voucherTitle(string $name): string
    {
        return str($name)->lower()->startsWith('voucher') ? $name : "Voucher {$name}";
    }

    public static function rupiah(int $amount): string
    {
        return 'Rp'.number_format($amount, 0, ',', '.');
    }
}
