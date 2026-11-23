<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Area;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Reject;
use App\Services\DeviceService;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantAuthController extends Controller
{
    public function showRegister(): Response
    {
        return Inertia::render('participant/home', [
            'modal' => 'register',
            'areas' => Area::orderBy('name')->get(['id', 'name']),
            'outlet' => Outlet::where('code', 'W07')->first(),
        ]);
    }

    public function showLogin(): Response
    {
        return Inertia::render('participant/home', [
            'modal' => 'login',
            'areas' => Area::orderBy('name')->get(['id', 'name']),
            'outlet' => Outlet::where('code', 'W07')->first(),
        ]);
    }

    public function register(RegisterRequest $request, DeviceService $devices): RedirectResponse
    {
        $data = $request->validated();
        $outlet = Outlet::where('code', 'W07')->first();
        $age = now()->parse($data['birth_date'])->diffInYears(now());

        if ($age < config('participant.min_age')) {
            Reject::create([
                'reason' => 'underage',
                'outlet_id' => $outlet?->id,
                'metadata' => ['age' => $age],
                'occurred_at' => now(),
            ]);
            $devices->track($request, null, 'register_rejected');

            return to_route('participant.daftar.belum-bisa');
        }

        $participant = Participant::create([
            'name' => $data['name'],
            'whatsapp' => $data['whatsapp'],
            'birth_date' => $data['birth_date'],
            'area_id' => $data['area_id'],
            'pin_hash' => Hash::make($data['pin']),
            'registered_at' => now(),
        ]);

        $request->session()->put('participant_id', $participant->id);
        $devices->track($request, $participant, 'register');
        ActivityLogger::log('participant.registered', 'participant', $participant->id, [], $participant);

        return to_route('participant.persetujuan');
    }

    public function login(LoginRequest $request, DeviceService $devices): RedirectResponse
    {
        $data = $request->validated();
        $participant = Participant::where('whatsapp', $data['whatsapp'])->first();

        if (! $participant || ! Hash::check($data['pin'], $participant->pin_hash)) {
            Reject::create([
                'reason' => 'invalid_login',
                'outlet_id' => Outlet::where('code', 'W07')->value('id'),
                'occurred_at' => now(),
            ]);

            return back()->withErrors(['pin' => 'Nomor atau PIN belum cocok. Lupa PIN? Hubungi admin.']);
        }

        $request->session()->put('participant_id', $participant->id);
        $devices->track($request, $participant, 'login');
        ActivityLogger::log('participant.login', 'participant', $participant->id, [], $participant);

        if ($request->session()->get('claim_outlet')) {
            return to_route('participant.foto', ['outlet' => $request->session()->get('claim_outlet')]);
        }

        return to_route('participant.papan');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget(['participant_id', 'claim_outlet']);

        return to_route('participant.masuk');
    }
}
