<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Claim;
use App\Models\Consent;
use App\Models\Gift;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Voucher;
use App\Services\RewardCreationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoParticipantSeeder extends Seeder
{
    public function run(): void
    {
        $outlet = Outlet::where('code', 'W07')->firstOrFail();
        $area = Area::where('name', 'Sukabirus')->firstOrFail();

        $participant = Participant::firstOrCreate(
            ['whatsapp' => '081234567890'],
            [
                'name' => 'Sakinah',
                'birth_date' => '1998-06-15',
                'area_id' => $area->id,
                'pin_hash' => Hash::make('1234'),
                // Cap = jumlah klaim disetujui (PRD bagian 3); dihitung ulang di bawah.
                'caps' => 0,
                'is_student' => true,
                'registered_at' => now()->subDays(12),
            ],
        );

        Consent::firstOrCreate(
            ['participant_id' => $participant->id, 'version' => config('participant.consent_version')],
            [
                'body' => config('participant.consent_body'),
                'is_required_accepted' => true,
                'agreed_at' => now()->subDays(12),
            ],
        );

        $this->approvedClaim($participant, $outlet, 'voucher', 'KGRDEMO01');
        $this->approvedClaim($participant, $outlet, 'token', null);
        $this->approvedClaim($participant, $outlet, 'merch', null);

        $participant->update(['caps' => $participant->claims()->where('status', 'approved')->count()]);
    }

    private function approvedClaim(Participant $participant, Outlet $outlet, string $type, ?string $code): void
    {
        $slot = $outlet->board->slots()->where('status', 'empty')->first();
        if (! $slot) {
            return;
        }

        $claim = Claim::create([
            'participant_id' => $participant->id,
            'outlet_id' => $outlet->id,
            'slot_id' => $slot->id,
            'code' => $slot->code,
            'claim_code' => 'KLM'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT),
            'status' => 'approved',
            'submitted_at' => now()->subDays(3),
        ]);

        $slot->update(['status' => 'used', 'used_at' => now()->subDays(3), 'holder_id' => $participant->id]);

        if ($type === 'merch') {
            Gift::create([
                'claim_id' => $claim->id,
                'type' => 'merchandise',
                'status' => 'pending_address',
            ]);

            return;
        }

        Voucher::create([
            'claim_id' => $claim->id,
            'code' => $code ?? RewardCreationService::voucherCode(),
            'type' => $type,
            // Token menunggu nomor tujuan; voucher mitra langsung terkirim (PRD bagian 17).
            'status' => $type === 'token' ? 'pending_data' : 'sent',
            'sent_at' => $type === 'voucher' ? now()->subDays(2) : null,
        ]);
    }
}
