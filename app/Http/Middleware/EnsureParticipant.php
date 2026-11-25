<?php

namespace App\Http\Middleware;

use App\Models\Participant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureParticipant
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get('participant_id')) {
            // Belum masuk: popup masuk di atas Scan; setelah masuk lanjut ke foto bila warung sudah terbaca.
            return to_route('participant.masuk')->withErrors(['auth' => 'Masuk dulu untuk melanjutkan.']);
        }

        // Peserta yang diblokir saat sedang masuk langsung dikeluarkan.
        if (Participant::whereKey($request->session()->get('participant_id'))->whereNotNull('blocked_at')->exists()) {
            $request->session()->forget('participant_id');

            return to_route('participant.masuk')->withErrors(['auth' => 'Akun ini diblokir admin. Hubungi admin untuk informasi lebih lanjut.']);
        }

        return $next($request);
    }
}
