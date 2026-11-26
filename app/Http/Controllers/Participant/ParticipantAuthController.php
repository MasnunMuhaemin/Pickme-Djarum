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
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantAuthController extends Controller
{
    public function showRegister(Request $request): Response|RedirectResponse
    {
        return $this->authPage($request, 'register');
    }

    public function showLogin(Request $request): Response|RedirectResponse
    {
        return $this->authPage($request, 'login');
    }

    /**
     * Popup masuk/daftar di atas halaman Scan. Peserta yang sudah masuk (mis. kembali lewat tombol back)
     * langsung ke Scan tanpa popup, karena kamera dijeda selama popup terbuka.
     */
    private function authPage(Request $request, string $modal): Response|RedirectResponse
    {
        if ($request->session()->get('participant_id')) {
            return to_route('participant.scan');
        }

        return Inertia::render('participant/scan', [
            'modal' => $modal,
            'areas' => Area::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function register(RegisterRequest $request, DeviceService $devices): RedirectResponse
    {
        // Batas pendaftaran per IP (PRD 2.4). IP hanya sinyal: dibatasi, bukan diblokir permanen.
        $registerKey = 'participant-register:'.$request->ip();
        if (RateLimiter::tooManyAttempts($registerKey, config('participant.register_per_ip_per_day'))) {
            return back()->withErrors(['whatsapp' => 'Terlalu banyak pendaftaran dari jaringan ini. Coba lagi besok atau hubungi admin.']);
        }

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

        RateLimiter::hit($registerKey, 24 * 60 * 60);

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

        // PIN 4 angka hanya 10.000 kombinasi: percobaan salah wajib dibatasi (PRD 2.1 dan FR-02).
        $loginKey = 'participant-login:'.$data['whatsapp'].'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($loginKey, config('participant.login_max_attempts'))) {
            $minutes = (int) ceil(RateLimiter::availableIn($loginKey) / 60);
            ActivityLogger::log('participant.login_locked', 'participant', null, ['whatsapp' => substr($data['whatsapp'], -4)]);

            return back()->withErrors(['pin' => "Terlalu banyak percobaan. Coba lagi dalam {$minutes} menit atau hubungi admin."]);
        }

        $participant = Participant::where('whatsapp', $data['whatsapp'])->first();

        if (! $participant || ! Hash::check($data['pin'], $participant->pin_hash)) {
            RateLimiter::hit($loginKey, config('participant.login_lock_minutes') * 60);

            Reject::create([
                'reason' => 'invalid_login',
                'outlet_id' => Outlet::where('code', 'W07')->value('id'),
                'occurred_at' => now(),
            ]);

            return back()->withErrors(['pin' => 'Nomor atau PIN belum cocok. Lupa PIN? Hubungi admin.']);
        }

        if ($participant->blocked_at) {
            return back()->withErrors(['pin' => 'Akun ini diblokir admin. Hubungi admin untuk informasi lebih lanjut.']);
        }

        RateLimiter::clear($loginKey);
        $request->session()->put('participant_id', $participant->id);
        $devices->track($request, $participant, 'login');
        ActivityLogger::log('participant.login', 'participant', $participant->id, [], $participant);

        if ($request->session()->get('claim_outlet')) {
            return to_route('participant.foto', ['outlet' => $request->session()->get('claim_outlet')]);
        }

        // Belum ada warung dari QR: ke Scan. Scan sendiri langsung ke foto bila warung klaim terakhir diketahui.
        return to_route('participant.scan');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget(['participant_id', 'claim_outlet', 'outlet_scanned']);
        // ID sesi baru supaya sesi lama tidak bisa dipakai lagi; login admin di sesi yang sama tetap aman.
        $request->session()->regenerate();

        return to_route('participant.home');
    }
}
