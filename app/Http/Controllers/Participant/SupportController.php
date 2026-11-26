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
    public function showForgotPin(Request $request): Response
    {
        // Nomor dibawa dari form masuk (?wa=) atau dari akun yang sedang masuk, supaya tidak diketik ulang.
        $id = $request->session()->get('participant_id');
        $whatsapp = preg_replace('/\D/', '', (string) $request->query('wa')) ?: ($id ? Participant::find($id)?->whatsapp : null);

        return Inertia::render('participant/lupa-pin', [
            'whatsapp' => $whatsapp ?: null,
            'adminWhatsapp' => config('participant.admin_whatsapp'),
        ]);
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

    /** Pertanyaan status mahasiswa tampil sebagai popup di atas kamera scan. */
    public function showStudent(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->get('participant_id')) {
            return to_route('participant.scan');
        }

        return Inertia::render('participant/scan', ['student' => true]);
    }

    /** Jawaban "Bukan mahasiswa" juga popup, bukan halaman sendiri. */
    public function showStudentBlocked(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->get('participant_id')) {
            return to_route('participant.scan');
        }

        return Inertia::render('participant/scan', ['studentBlocked' => true]);
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

        if (! $isStudent) {
            return to_route('participant.mahasiswa.khusus');
        }

        // Kalau pertanyaan ini muncul di tengah klaim, langsung lanjut ke foto bungkus.
        $outlet = $request->session()->get('claim_outlet');

        return $participant && $outlet
            ? to_route('participant.foto', ['outlet' => $outlet])
            : to_route('participant.scan');
    }
}
