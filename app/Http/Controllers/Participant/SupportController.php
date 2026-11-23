<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupportController extends Controller
{
    public function showForgotPin(): Response
    {
        return Inertia::render('participant/lupa-pin');
    }

    public function storeForgotPin(Request $request): RedirectResponse
    {
        $whatsapp = preg_replace('/\D/', '', (string) $request->input('whatsapp'));
        if (strlen($whatsapp) < 10) {
            return back()->withErrors(['whatsapp' => 'Isi nomor WhatsApp yang terdaftar.']);
        }

        $participant = Participant::where('whatsapp', $whatsapp)->first();

        ActivityLogger::log('pin_reset_requested', 'participant', $participant?->id, [
            'whatsapp' => $whatsapp,
            'registered' => (bool) $participant,
        ]);

        return back()->with('sent', true);
    }

    public function showStudent(): Response
    {
        return Inertia::render('participant/mahasiswa');
    }

    public function storeStudent(Request $request): RedirectResponse
    {
        $isStudent = $request->boolean('is_student');
        $participant = $request->session()->get('participant_id')
            ? Participant::find($request->session()->get('participant_id'))
            : null;

        $participant?->update(['is_student' => $isStudent]);
        ActivityLogger::log('student_confirmation', 'participant', $participant?->id, [
            'is_student' => $isStudent,
        ], $participant);

        return $isStudent
            ? to_route('participant.papan')
            : to_route('participant.mahasiswa.khusus');
    }

    public function showClaimStatus(Request $request, string $status = 'pending'): Response
    {
        $participant = $request->session()->get('participant_id')
            ? Participant::find($request->session()->get('participant_id'))
            : null;

        $claim = $participant?->claims()
            ->where('status', $status === 'pending' ? 'pending' : 'rejected')
            ->with('slot')
            ->latest()
            ->first();

        return Inertia::render($status === 'pending' ? 'participant/klaim-diperiksa' : 'participant/klaim-ditolak', [
            'claim' => $claim?->only(['id', 'status', 'submitted_at', 'slot']),
            'caps' => $participant?->caps ?? 0,
        ]);
    }
}
