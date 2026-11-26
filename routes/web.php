<?php

use App\Http\Controllers\Participant\OutletQrController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/participant')->name('home');

// QR per titik: satu alamat tetap yang tidak berubah setelah dicetak, mis. /w07 (PRD FR-06).
Route::get('{outlet}', OutletQrController::class)->where('outlet', '[A-Za-z][0-9]{2}')->name('qr.outlet');

Route::middleware(['auth'])->group(function () {
    // Akun admin langsung ke panel admin setelah masuk.
    Route::get('dashboard', function () {
        return request()->user()->is_admin ? to_route('admin.beranda') : Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/participant.php';
require __DIR__.'/admin.php';
require __DIR__.'/partner.php';
