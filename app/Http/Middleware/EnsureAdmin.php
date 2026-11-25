<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Panel admin hanya untuk akun users bertanda admin. Diperiksa di backend; menyembunyikan menu di frontend
 * bukan kontrol keamanan (PRD bagian B §9).
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return redirect()->guest(route('login'));
        }

        abort_unless($request->user()->is_admin, 403, 'Halaman ini khusus admin.');

        return $next($request);
    }
}
