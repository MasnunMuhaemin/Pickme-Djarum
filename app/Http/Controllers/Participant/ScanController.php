<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Reject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    /**
     * Peserta yang sudah masuk dan warungnya sudah diketahui langsung ke foto bungkus, tanpa scan ulang:
     * warung dari QR yang terbaca di sesi ini, atau warung klaim terakhirnya. `?ganti` membuka kamera scan
     * untuk pindah ke warung lain. Peserta yang belum pernah scan maupun klaim tetap scan QR dulu.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $participantId = $request->session()->get('participant_id');
        if ($participantId && ! $request->has('ganti')) {
            $code = $request->session()->get('outlet_scanned') ?: Participant::find($participantId)
                ?->claims()->whereNotNull('submitted_at')->latest('submitted_at')->first()?->outlet?->code;

            if ($code && Outlet::where('code', $code)->where('status', 'active')->exists()) {
                $request->session()->put(['claim_outlet' => $code, 'outlet_scanned' => $code]);

                return to_route('participant.foto', ['outlet' => $code]);
            }
        }

        return Inertia::render('participant/scan');
    }

    /**
     * QR papan berisi alamat tetap titik, mis. https://domain/w07 (PRD FR-06). Kode manual berisi kode saja (W07).
     * Dari alamat diambil segmen terakhir path; isi lain dikembalikan apa adanya supaya tercatat sebagai QR tidak dikenal.
     */
    public static function outletCodeFrom(string $scanned): string
    {
        $value = trim($scanned);
        if (preg_match('#^https?://#i', $value)) {
            $path = trim((string) parse_url($value, PHP_URL_PATH), '/');
            $value = $path === '' ? $value : basename($path);
        }

        return strtoupper($value);
    }

    public function resolve(Request $request): RedirectResponse
    {
        $code = self::outletCodeFrom((string) $request->input('code'));
        $outlet = Outlet::where('code', $code)->where('status', 'active')->first();

        if (! $outlet) {
            Reject::create([
                'reason' => 'unknown_qr',
                'metadata' => ['code' => strtoupper(substr($code, 0, 32))],
                'occurred_at' => now(),
            ]);

            return to_route('participant.qr-tidak-dikenal');
        }

        $request->session()->put(['claim_outlet' => $outlet->code, 'outlet_scanned' => $outlet->code]);

        if ($request->session()->get('participant_id')) {
            return to_route('participant.foto', ['outlet' => $outlet->code]);
        }

        return to_route('participant.masuk');
    }
}
