<?php

namespace Database\Seeders;

use App\Models\MysteryPrize;
use App\Models\Partner;
use Illuminate\Database\Seeder;

/** Contoh isi mystery gift sesuai desain admin. Aman dijalankan ulang; admin bisa mengubahnya di CMS. */
class MysteryPrizeSeeder extends Seeder
{
    public function run(): void
    {
        $barber = Partner::where('name', 'AD Barbershop')->value('id');
        $prizes = [
            ['Voucher Spotify', 'kode', null, 60000, 5],
            ['Voucher Netflix', 'kode', null, 65000, 5],
            ['Voucher kuota internet', 'topup', null, 50000, 5],
            ['Voucher barbershop', 'mitra', $barber, 55000, 5],
            ['Produk gratis', 'ambil', null, 0, 10],
        ];
        foreach ($prizes as [$name, $fulfillment, $partner, $value, $stock]) {
            if ($fulfillment === 'mitra' && ! $partner) {
                continue;
            }
            MysteryPrize::firstOrCreate(['name' => $name], ['fulfillment' => $fulfillment, 'partner_id' => $partner, 'value' => $value, 'stock' => $stock]);
        }
    }
}
