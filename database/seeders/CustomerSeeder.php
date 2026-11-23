<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Board;
use App\Models\Outlet;
use App\Models\Slot;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomerSeeder extends Seeder
{
    private const TAKEN = ['A1', 'A3', 'A5', 'B2', 'B4', 'C1', 'C5', 'D2', 'D5', 'E4'];

    public function run(): void
    {
        DB::transaction(function () {
            $area = Area::firstOrCreate(['name' => 'Sukabirus'], ['is_delivery_area' => true]);
            // Area pengiriman prototipe (PRD bagian 3); daftar final menunggu admin.
            foreach (['Sukapura', 'PGA'] as $name) {
                Area::firstOrCreate(['name' => $name], ['is_delivery_area' => true]);
            }
            $outlet = Outlet::firstOrCreate(['code' => 'W07'], ['name' => 'Warung Djarum', 'area_id' => $area->id, 'status' => 'active']);
            $board = Board::firstOrCreate(['outlet_id' => $outlet->id], ['code' => 'W07-BOARD', 'week_label' => 'W07', 'status' => 'active']);

            $prizes = array_fill(0, 25, 'voucher');
            foreach ([3, 9, 18] as $i) {
                $prizes[$i] = 'token';
            }
            foreach ([6, 14, 22] as $i) {
                $prizes[$i] = 'merch';
            }
            foreach ([11, 20] as $i) {
                $prizes[$i] = 'bensin';
            }

            foreach (range(0, 24) as $i) {
                $position = chr(65 + intdiv($i, 5)).($i % 5 + 1);
                $taken = in_array($position, self::TAKEN, true);
                Slot::firstOrCreate(
                    ['board_id' => $board->id, 'position' => $position],
                    [
                        'code' => $this->slotCode($i),
                        'prize_type' => $prizes[$i],
                        'status' => $taken ? 'used' : 'empty',
                        'used_at' => $taken ? now() : null,
                    ],
                );
            }
        });
    }

    private function slotCode(int $index): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $seed = 7919 + $index * 104729;
        $out = '';
        for ($i = 0; $i < 6; $i++) {
            $out .= $alphabet[$seed % strlen($alphabet)];
            $seed = intdiv($seed, strlen($alphabet)) + 31;
        }

        return $out;
    }
}
