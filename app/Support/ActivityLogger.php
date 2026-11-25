<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\Participant;
use App\Models\User;

/**
 * Log aktivitas (A8): siapa, kapan, apa, dan alasan. Tidak bisa diubah dari aplikasi.
 * Aktor: peserta, admin (akun users), atau sistem.
 */
class ActivityLogger
{
    public static function log(string $action, string $subjectType, ?int $subjectId = null, array $metadata = [], Participant|User|null $actor = null): void
    {
        ActivityLog::create([
            'actor_type' => match (true) {
                $actor instanceof User => 'admin',
                $actor instanceof Participant => 'participant',
                default => 'system',
            },
            'actor_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'metadata' => $metadata,
        ]);
    }
}
