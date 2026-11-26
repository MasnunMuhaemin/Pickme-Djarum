<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Reject;
use App\Support\ActivityLogger;
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

        // Uji scan QR: admin yang sedang masuk men-scan QR, QR itu tercatat lolos (tanpa memulai klaim).
        if ($request->user()?->is_admin && ($found = Outlet::where('code', $code)->first())) {
            $found->update(['qr_tested_at' => now()]);
            ActivityLogger::log('outlet.qr_tested', 'outlet', $found->id, ['code' => $code], $request->user());

            return to_route('admin.master-data.warung')->with('status', "QR {$code} lolos uji scan.");
        }

        if (! Outlet::where('code', $code)->exists()) {
            Reject::create(['reason' => 'unknown_qr', 'metadata' => ['code' => $code], 'occurred_at' => now()]);

            return to_route('participant.scan')->withErrors(['qr' => 'QR ini belum terdaftar. Coba papan lain atau minta bantuan admin warung.']);
        }

        $request->session()->put(['claim_outlet' => $code, 'outlet_scanned' => $code]);

        // Sama dengan hasil scan di aplikasi: belum masuk → popup masuk (QR tersimpan, setelah masuk langsung
        // foto), sudah masuk → foto bungkus karena QR baru saja dipindai.
        if ($request->session()->get('participant_id')) {
            return to_route('participant.foto', ['outlet' => $code]);
        }

        return to_route('participant.masuk');
    }
}
