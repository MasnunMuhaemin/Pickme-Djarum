<?php

namespace App\Http\Middleware;

use App\Models\Partner;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Halaman mitra wajib masuk dengan PIN; akun yang dinonaktifkan admin langsung dikeluarkan. */
class EnsurePartner
{
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->session()->get('partner_id');
        if (! $id || ! Partner::whereKey($id)->where('status', 'active')->exists()) {
            $request->session()->forget('partner_id');

            return to_route('mitra.masuk');
        }

        return $next($request);
    }
}
