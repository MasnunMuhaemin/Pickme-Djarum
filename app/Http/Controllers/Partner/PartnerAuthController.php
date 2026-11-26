<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

/** M1 Masuk mitra: satu isian PIN dari admin. Percobaan salah dibatasi per perangkat (PRD bagian 19). */
class PartnerAuthController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->session()->get('partner_id')) {
            return to_route('mitra.cek');
        }

        return Inertia::render('partner/masuk', ['adminWhatsapp' => config('participant.admin_whatsapp')]);
    }

    public function login(Request $request): RedirectResponse
    {
        $data = $request->validate(['pin' => ['required', 'digits:4']], ['pin.required' => 'Isi PIN mitra.', 'pin.digits' => 'PIN terdiri dari 4 angka.']);

        $key = 'partner-login:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, config('participant.login_max_attempts'))) {
            $minutes = (int) ceil(RateLimiter::availableIn($key) / 60);

            return back()->withErrors(['pin' => "Terlalu banyak percobaan. Coba lagi {$minutes} menit lagi."]);
        }

        // PIN unik per mitra dan tersimpan sebagai hash, jadi dicocokkan satu per satu.
        // shortcut: memeriksa hash semua mitra aktif (cukup untuk puluhan mitra); pakai id mitra + PIN bila mitra ratusan.
        $partner = Partner::where('status', 'active')->whereNotNull('pin_hash')->get()
            ->first(fn (Partner $p) => Hash::check($data['pin'], $p->pin_hash));

        if (! $partner) {
            RateLimiter::hit($key, config('participant.login_lock_minutes') * 60);

            return back()->withErrors(['pin' => 'PIN salah.']);
        }

        RateLimiter::clear($key);
        $partner->update(['last_login_at' => now()]);
        $request->session()->regenerate();
        $request->session()->put('partner_id', $partner->id);
        ActivityLogger::log('partner.login', 'partner', $partner->id, [], $partner);

        return to_route('mitra.cek');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('partner_id');
        $request->session()->regenerate();

        return to_route('mitra.masuk');
    }
}
