<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Outlet;
use App\Models\Partner;
use App\Models\User;
use App\Models\VoucherType;
use App\Services\SlotPrizeService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Akun admin dan data master awal panel admin (mitra dan jenis voucher sesuai desain A6).
 * Email dan password admin diambil dari .env (ADMIN_EMAIL, ADMIN_PASSWORD); ganti password setelah masuk pertama.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@pickme.test')],
            ['name' => env('ADMIN_NAME', 'Admin A'), 'password' => Hash::make(env('ADMIN_PASSWORD', 'admin12345')), 'is_admin' => true, 'email_verified_at' => now()],
        );

        // [nama jenis, mitra, nilai, jumlah, pemenuhan]
        $types = [
            ['Voucher warung', 'Outlet (20 titik)', 20000, 53, 'mitra'],
            ['Steam motor', 'Jaya Steam', 20000, 19, 'mitra'],
            ['Makan dan minum', 'ADD dan Warpeng', 25000, 34, 'mitra'],
            ['Galon', 'Outlet (20 titik)', 25000, 19, 'mitra'],
            ['Kopi', 'Kopi Groei', 30000, 26, 'mitra'],
            ['Warnet', 'Khronos Warnet', 35000, 18, 'mitra'],
            ['Makan dan minum', 'Warmul Sukpur dan Sukbir', 35000, 15, 'mitra'],
            ['Laundry', 'Seven Sukbir dan Sukpur', 40000, 17, 'mitra'],
            ['Rental PS', 'Playora Rental PS', 47000, 5, 'mitra'],
            ['Barbershop', 'AD Barbershop', 55000, 3, 'mitra'],
            ['Kuota internet', 'Mitra kuota (belum ditetapkan)', 50000, 10, 'kuota'],
            ['Token listrik', 'Agregator (belum dipilih)', 20000, 23, 'agregator'],
            ['Token listrik', 'Agregator (belum dipilih)', 50000, 8, 'agregator'],
            ['Bensin motor', 'Tunai oleh admin', 30000, 19, 'tunai'],
            ['Bensin motor', 'Tunai oleh admin', 40000, 8, 'tunai'],
        ];

        foreach ($types as [$name, $partnerName, $value, $quantity, $fulfillment]) {
            // Mitra hanya dibuat untuk penukar voucher sungguhan, bukan untuk agregator/tunai/titik.
            $isRealPartner = $fulfillment === 'mitra' && ! str_starts_with($partnerName, 'Outlet');
            $partner = $isRealPartner
                ? Partner::firstOrCreate(['name' => $partnerName], ['type' => 'umum', 'status' => 'active'])
                : null;

            VoucherType::firstOrCreate(
                ['name' => $name, 'partner_label' => $partnerName, 'value' => $value],
                ['partner_id' => $partner?->id, 'quantity' => $quantity, 'fulfillment' => $fulfillment],
            );
        }

        $prizes = app(SlotPrizeService::class);
        $prizes->fillMissing();

        // Titik kedua untuk uji coba; tidak dibuat ulang bila sudah ada.
        if (! Outlet::where('code', 'W08')->exists()) {
            $area = Area::firstOrCreate(['name' => 'Sukapura'], ['is_delivery_area' => true]);
            $prizes->createOutlet('W08', 'Warung Sukapura', $area->id);
        }
    }
}
