<?php

namespace App\Services;

use App\Models\DeviceEvent;
use App\Models\Participant;
use App\Models\ParticipantDevice;
use Illuminate\Http\Request;

class DeviceService
{
    public function track(Request $request, ?Participant $participant, string $eventType): string
    {
        $deviceId = $request->input('device_id') ?: $request->header('X-Device-Id') ?: 'unknown-device';
        $now = now();

        $device = ParticipantDevice::firstOrCreate(
            ['device_id' => $deviceId],
            ['participant_id' => $participant?->id, 'first_seen_at' => $now, 'last_seen_at' => $now],
        );

        $risk = null;
        if ($device->participant_id && $participant && $device->participant_id !== $participant->id) {
            $risk = 'account_switch';
        }

        $device->update([
            'last_seen_at' => $now,
            'participant_id' => $participant?->id ?? $device->participant_id,
        ]);

        DeviceEvent::create([
            'participant_id' => $participant?->id,
            'device_id' => $deviceId,
            'event_type' => $eventType,
            'ip' => $request->ip(),
            'risk_flag' => $risk,
            'reason' => $risk ? 'Device dipakai akun lain sebelumnya.' : null,
            'occurred_at' => $now,
        ]);

        return $deviceId;
    }
}
