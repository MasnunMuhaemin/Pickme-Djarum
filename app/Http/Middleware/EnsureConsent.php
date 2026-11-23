<?php

namespace App\Http\Middleware;

use App\Models\Participant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Persetujuan data wajib sebelum klaim. Versi teks baru meminta persetujuan ulang (PRD FR-04).
 */
class EnsureConsent
{
    public function handle(Request $request, Closure $next): Response
    {
        $participant = Participant::find($request->session()->get('participant_id'));

        if (! $participant?->hasAcceptedConsent(config('participant.consent_version'))) {
            if ($request->filled('outlet')) {
                $request->session()->put('claim_outlet', strtoupper((string) $request->input('outlet')));
            }

            return to_route('participant.persetujuan');
        }

        return $next($request);
    }
}
