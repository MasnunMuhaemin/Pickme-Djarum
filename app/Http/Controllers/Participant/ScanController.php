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
    public function show(): Response
    {
        return Inertia::render('participant/scan', [
            'outlets' => Outlet::where('status', 'active')->get(['code', 'name']),
        ]);
    }

    public function resolve(Request $request): RedirectResponse
    {
        $code = strtoupper(trim((string) $request->input('code')));
        $outlet = Outlet::where('code', $code)->where('status', 'active')->first();

        if (! $outlet) {
            Reject::create([
                'reason' => 'unknown_qr',
                'metadata' => ['code' => strtoupper(substr($code, 0, 32))],
                'occurred_at' => now(),
            ]);

            return to_route('participant.qr-tidak-dikenal');
        }

        $request->session()->put('claim_outlet', $outlet->code);

        if ($request->session()->get('participant_id')) {
            return to_route('participant.foto', ['outlet' => $outlet->code]);
        }

        return to_route('participant.masuk');
    }
}
