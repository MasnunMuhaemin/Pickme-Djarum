<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Reject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Titik dibaca dari alamat QR, peserta tidak mengisi lokasi. QR tidak dikenal menampilkan pesan (PRD FR-06).
 */
class OutletQrController extends Controller
{
    public function __invoke(Request $request, string $outlet): RedirectResponse
    {
        $code = strtoupper($outlet);

        if (! Outlet::where('code', $code)->exists()) {
            Reject::create(['reason' => 'unknown_qr', 'metadata' => ['code' => $code], 'occurred_at' => now()]);

            return to_route('participant.qr-tidak-dikenal');
        }

        $request->session()->put(['claim_outlet' => $code, 'outlet_scanned' => $code]);

        // Sama dengan hasil scan di aplikasi: belum masuk → popup masuk (setelah masuk lanjut ke foto),
        // sudah masuk → langsung foto bungkus.
        if ($request->session()->get('participant_id')) {
            return to_route('participant.foto', ['outlet' => $code]);
        }

        return to_route('participant.masuk');
    }
}
