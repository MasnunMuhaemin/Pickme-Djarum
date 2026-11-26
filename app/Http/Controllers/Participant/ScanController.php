<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Reject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    /**
     * Semua peserta, termasuk yang sudah masuk, melihat kamera scan dulu. Warung baru dipakai setelah QR
     * benar-benar terbaca di sesi ini.
     */
    public function show(): Response
    {
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

            // Popup di halaman scan, bukan halaman terpisah. Alamat dituju langsung supaya popup pasti tampil.
            return to_route('participant.scan')->withErrors(['qr' => 'QR ini belum terdaftar. Coba papan lain atau minta bantuan admin warung.']);
        }

        $request->session()->put(['claim_outlet' => $outlet->code, 'outlet_scanned' => $outlet->code]);

        if ($request->session()->get('participant_id')) {
            return to_route('participant.foto', ['outlet' => $outlet->code]);
        }

        return to_route('participant.masuk');
    }
}
