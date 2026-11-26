<?php

namespace App\Http\Middleware;

use App\Models\Participant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Program ini khusus mahasiswa. Peserta yang belum menjawab diarahkan ke pertanyaan "Kamu mahasiswa?",
 * yang menjawab "Bukan" ke pemberitahuan khusus mahasiswa. Keduanya popup di halaman scan.
 * Dipasang setelah middleware participant.
 */
class EnsureStudent
{
    public function handle(Request $request, Closure $next): Response
    {
        $participant = Participant::find($request->session()->get('participant_id'));

        if ($participant?->is_student === null) {
            if ($request->filled('outlet')) {
                $request->session()->put('claim_outlet', strtoupper((string) $request->input('outlet')));
            }

            return to_route('participant.mahasiswa');
        }

        if ($participant->is_student === false) {
            return to_route('participant.mahasiswa.khusus');
        }

        return $next($request);
    }
}
