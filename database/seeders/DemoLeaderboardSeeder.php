<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Board;
use App\Models\Claim;
use App\Models\Consent;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Slot;
use App\Models\Voucher;
use App\Services\RewardCreationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Lima akun peserta contoh supaya Leaderboard terisi. Akunnya utuh (bisa masuk dengan PIN 2468), dengan klaim
 * disetujui dan voucher sungguhan. Klaim memakai papan warung contoh W90 yang dijeda, jadi slot W07 untuk uji
 * klaim tidak terpakai. Aman dijalankan ulang: akun yang sudah punya klaim dilewati.
 */
class DemoLeaderboardSeeder extends Seeder
{
    /** Nama, nomor WhatsApp, jumlah cap (total 25 = satu papan). */
    private const PEOPLE = [
        ['Dimas Saputra', '081200000001', 7],
        ['Rani Lestari', '081200000002', 6],
        ['Bayu Pratama', '081200000003', 5],
        ['Intan Permata', '081200000004', 4],
        ['Fajar Nugroho', '081200000005', 3],
    ];

    public function run(): void
    {
        DB::transaction(function () {
            $area = Area::firstOrCreate(['name' => 'Sukabirus'], ['is_delivery_area' => true]);
            $outlet = Outlet::firstOrCreate(['code' => 'W90'], ['name' => 'Warung Demo (data contoh)', 'area_id' => $area->id, 'status' => 'paused']);
            $outlet->areas()->syncWithoutDetaching([$area->id]);
            $board = Board::firstOrCreate(['outlet_id' => $outlet->id], ['code' => 'W90BOARD', 'week_label' => 'W90', 'status' => 'active']);

            foreach (range(0, 24) as $i) {
                Slot::firstOrCreate(
                    ['board_id' => $board->id, 'position' => chr(65 + intdiv($i, 5)).($i % 5 + 1)],
                    ['code' => 'DEMO'.str_pad((string) $i, 2, '0', STR_PAD_LEFT), 'prize_type' => 'voucher', 'voucher_code' => RewardCreationService::voucherCode(), 'status' => 'empty'],
                );
            }

            foreach (self::PEOPLE as $rank => [$name, $whatsapp, $caps]) {
                $participant = Participant::firstOrCreate(['whatsapp' => $whatsapp], [
                    'name' => $name,
                    'birth_date' => '2002-03-10',
                    'area_id' => $area->id,
                    'pin_hash' => Hash::make('2468'),
                    'is_student' => true,
                    'registered_at' => now()->subDays(20),
                ]);
                Consent::firstOrCreate(
                    ['participant_id' => $participant->id, 'version' => config('participant.consent_version')],
                    ['body' => config('participant.consent_body'), 'is_required_accepted' => true, 'agreed_at' => now()->subDays(20)],
                );
                if ($participant->claims()->exists()) {
                    continue;
                }

                foreach (range(1, $caps) as $n) {
                    $slot = $board->slots()->where('status', 'empty')->first();
                    if (! $slot) {
                        break;
                    }
                    // Sebagian klaim minggu ini supaya tab Mingguan juga terisi; peringkat atas mencapai cap lebih dulu.
                    $at = $n <= 2 ? now()->subHours(6 + $rank * 3 + $n) : now()->subDays(8 + $rank + $n);
                    $claim = Claim::create([
                        'participant_id' => $participant->id,
                        'outlet_id' => $outlet->id,
                        'slot_id' => $slot->id,
                        'code' => $slot->code,
                        'claim_code' => 'KLM'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT),
                        'status' => 'approved',
                        'submitted_at' => $at,
                        'cap_at' => $at,
                    ]);
                    $slot->update(['status' => 'used', 'used_at' => $at, 'holder_id' => $participant->id]);
                    Voucher::create([
                        'claim_id' => $claim->id,
                        'code' => $slot->voucher_code,
                        'type' => 'voucher',
                        'source' => 'claim',
                        'status' => 'sent',
                        'value' => (int) config('participant.prize_values.voucher', 0),
                    ]);
                }

                $participant->update(['caps' => $participant->claims()->whereNotNull('cap_at')->count()]);
            }
        });
    }
}
