<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Claim;
use App\Models\Consent;
use App\Models\Gift;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Voucher;
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
                'caps' => 4,
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

        $this->approvedClaim($participant, $outlet, 'voucher', 'KGR-DEMO001');
        $this->approvedClaim($participant, $outlet, 'token', null);
        $this->approvedClaim($participant, $outlet, 'merch', null);
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
            'code' => $code ?? 'KGR-'.strtoupper(bin2hex(random_bytes(3))),
            'type' => $type,
            'status' => 'sent',
            'expires_at' => now()->addDays(14),
            'sent_at' => now()->subDays(2),
        ]);
    }
}
