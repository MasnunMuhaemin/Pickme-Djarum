<?php

namespace App\Http\Middleware;

use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Setting;
use App\Support\AdminQueues;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'participant' => $request->session()->get('participant_id')
                    ? Participant::find($request->session()->get('participant_id'))
                    : null,
            ],
            // Panel admin: badge antrean di sidebar dan status jeda untuk Tombol Darurat.
            'admin' => fn () => $request->user()?->is_admin && $request->is('admin', 'admin/*') ? [
                'badges' => AdminQueues::badges(),
                'paused' => Setting::programPaused(),
                'pauseReason' => Setting::get('program_pause_reason'),
                'outlets' => Outlet::orderBy('code')->get(['id', 'code', 'name', 'status']),
            ] : null,
            // Kalimat di gambar voucher peserta (diatur admin di Pengaturan).
            'voucherLines' => fn () => $request->is('participant', 'participant/*') ? Setting::voucherLines() : null,
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'pin' => fn () => $request->session()->get('partner_pin'),
            ],
        ]);
    }
}
