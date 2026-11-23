<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Consent;
use App\Models\Participant;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsentController extends Controller
{
    public function show(Request $request): Response
    {
        $participant = Participant::find($request->session()->get('participant_id'));

        return Inertia::render('participant/persetujuan', [
            'consent' => [
                'version' => config('participant.consent_version'),
                'body' => config('participant.consent_body'),
                'accepted' => $participant?->hasAcceptedConsent(config('participant.consent_version')) ?? false,
            ],
            'guest' => $participant === null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $request->boolean('accepted')) {
            return back()->withErrors(['accepted' => 'Baca sampai bawah dulu untuk melanjutkan.']);
        }

        $participant = Participant::findOrFail($request->session()->get('participant_id'));
        Consent::updateOrCreate(
            ['participant_id' => $participant->id, 'version' => config('participant.consent_version')],
            [
                'body' => config('participant.consent_body'),
                'is_required_accepted' => true,
                'is_optional_accepted' => $request->boolean('optional'),
                'agreed_at' => now(),
            ],
        );
        ActivityLogger::log('consent.accepted', 'participant', $participant->id, ['version' => config('participant.consent_version')], $participant);

        return to_route('participant.foto');
    }
}
