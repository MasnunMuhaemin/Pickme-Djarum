<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\Participant;

class ActivityLogger
{
    public static function log(string $action, string $subjectType, ?int $subjectId = null, array $metadata = [], ?Participant $actor = null): void
    {
        ActivityLog::create([
            'actor_type' => $actor ? 'participant' : 'system',
            'actor_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'metadata' => $metadata,
        ]);
    }
}
