<?php

namespace Database\Seeders;

use App\Models\Outlet;
use App\Models\Partner;
use Illuminate\Database\Seeder;

/** Titik peta contoh di sekitar kampus untuk warung dan mitra voucher yang belum punya koordinat. Tidak menimpa isian admin. */
class DemoMapSeeder extends Seeder
{
    public function run(): void
    {
        $campus = config('participant.campus');
        $place = function ($model, int $i, float $radius) use ($campus) {
            $angle = $i * 2.4; // sudut emas: titik tersebar rata, tidak menumpuk
            $model->update([
                'lat' => round($campus['lat'] + cos($angle) * $radius * (1 + $i % 3 * 0.35), 7),
                'lng' => round($campus['lng'] + sin($angle) * $radius * (1 + $i % 3 * 0.35), 7),
            ]);
        };
        Outlet::whereNull('lat')->orderBy('code')->get()->each(fn ($o, $i) => $place($o, $i + 1, 0.004));
        Partner::where('type', 'umum')->whereNull('lat')->orderBy('name')->get()->each(fn ($p, $i) => $place($p, $i + 7, 0.005));
    }
}
