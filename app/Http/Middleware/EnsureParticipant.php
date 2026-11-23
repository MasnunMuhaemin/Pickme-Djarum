<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureParticipant
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get('participant_id')) {
            return to_route('participant.papan')->withErrors(['auth' => 'Masuk dulu untuk melanjutkan.']);
        }

        return $next($request);
    }
}
