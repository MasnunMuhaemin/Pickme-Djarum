<?php

namespace App\Http\Middleware;

use App\Models\Outlet;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Saat program atau titik dijeda, layar klaim tidak bisa dibuka. Klaim yang sedang berjalan tidak hilang
 * dan bisa dilanjutkan setelah jeda dicabut (PRD bagian 10 dan FR-29).
 */
class EnsureClaimOpen
{
    public function handle(Request $request, Closure $next): Response
    {
        $code = strtoupper((string) ($request->input('outlet') ?: $request->session()->get('claim_outlet') ?: 'W07'));
        $outlet = Outlet::with('board')->where('code', $code)->first();

        if (! $outlet || ! $outlet->isActive() || $outlet->board?->status !== 'active') {
            return to_route('participant.papan', ['outlet' => $code])
                ->withErrors(['claim' => 'Program sedang dijeda. Klaimmu aman dan bisa dilanjutkan nanti.']);
        }

        return $next($request);
    }
}
