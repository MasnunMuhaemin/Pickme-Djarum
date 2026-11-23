<?php

use App\Http\Controllers\Participant\CardController;
use App\Http\Controllers\Participant\ClaimController;
use App\Http\Controllers\Participant\ClaimStatusController;
use App\Http\Controllers\Participant\ConsentController;
use App\Http\Controllers\Participant\GiftController;
use App\Http\Controllers\Participant\HomeController;
use App\Http\Controllers\Participant\ParticipantAuthController;
use App\Http\Controllers\Participant\RewardController;
use App\Http\Controllers\Participant\ScanController;
use App\Http\Controllers\Participant\SupportController;
use App\Http\Controllers\Participant\VoucherController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('participant')->name('participant.')->group(function () {
    Route::get('/', [HomeController::class, 'show'])->name('home');

    Route::get('scan', [ScanController::class, 'show'])->name('scan');
    Route::post('scan', [ScanController::class, 'resolve'])->name('scan.resolve');
    Route::get('qr-tidak-dikenal', fn () => Inertia::render('participant/qr-tidak-dikenal'))->name('qr-tidak-dikenal');
    Route::get('lupa-pin', [SupportController::class, 'showForgotPin'])->name('lupa-pin');
    Route::post('lupa-pin', [SupportController::class, 'storeForgotPin'])->name('lupa-pin.store');

    Route::get('daftar', [ParticipantAuthController::class, 'showRegister'])->name('daftar');
    Route::post('daftar', [ParticipantAuthController::class, 'register'])->name('daftar.store');
    Route::get('masuk', [ParticipantAuthController::class, 'showLogin'])->name('masuk');
    Route::post('masuk', [ParticipantAuthController::class, 'login'])->name('masuk.store');
    Route::post('keluar', [ParticipantAuthController::class, 'logout'])->name('keluar');
    Route::get('daftar/belum-bisa', fn () => Inertia::render('participant/daftar-belum-bisa'))->name('daftar.belum-bisa');

    // Halaman persetujuan bisa dibaca tamu dari form daftar; menyimpan persetujuan tetap wajib masuk.
    Route::get('persetujuan', [ConsentController::class, 'show'])->name('persetujuan');

    Route::middleware('participant')->group(function () {
        Route::post('persetujuan', [ConsentController::class, 'store'])->name('persetujuan.store');

        // Langkah klaim (P4 sampai P6): wajib sudah menyetujui teks versi terbaru, wajib mahasiswa, dan
        // tidak bisa dibuka saat program atau titik dijeda (PRD bagian 10).
        Route::middleware(['consented', 'student', 'claim-open'])->group(function () {
            Route::post('klaim/mulai', [ClaimController::class, 'start'])->name('klaim.mulai');
            Route::get('foto', [ClaimController::class, 'showPhoto'])->name('foto');
            Route::post('foto', [ClaimController::class, 'storePhoto'])->name('foto.store');
            Route::get('slot', [ClaimController::class, 'showSlot'])->name('slot');
            Route::post('slot', [ClaimController::class, 'submitCode'])->name('slot.store');
        });

        Route::get('klaim/berhasil', [ClaimController::class, 'showSuccess'])->name('klaim.berhasil');
        Route::get('klaim/diperiksa/{claim?}', [ClaimStatusController::class, 'pending'])->whereNumber('claim')->name('klaim.diperiksa');
        Route::get('klaim/ditolak/{claim?}', [ClaimStatusController::class, 'rejected'])->whereNumber('claim')->name('klaim.ditolak');
    });

    Route::get('papan', [ClaimController::class, 'showBoard'])->name('papan');


    Route::middleware('participant')->group(function () {
        Route::get('hadiah', [RewardController::class, 'index'])->name('hadiah');
        Route::get('voucher/{code?}', [VoucherController::class, 'show'])->name('voucher');
        Route::get('nomor-tujuan/{voucherId?}', [GiftController::class, 'showDestination'])->name('nomor-tujuan');
        Route::post('nomor-tujuan/{voucherId?}', [GiftController::class, 'storeDestination'])->name('nomor-tujuan.store');
        Route::get('alamat/{giftId?}', [GiftController::class, 'showAddress'])->name('alamat');
        Route::post('alamat/{giftId?}', [GiftController::class, 'storeAddress'])->name('alamat.store');
    });
    Route::get('terima-kasih', fn () => Inertia::render('participant/terima-kasih'))->name('terima-kasih');

    Route::get('kartu', [CardController::class, 'index'])->name('kartu');

    Route::get('mahasiswa', [SupportController::class, 'showStudent'])->name('mahasiswa');
    Route::post('mahasiswa', [SupportController::class, 'storeStudent'])->name('mahasiswa.store');
    Route::get('mahasiswa/khusus', fn () => Inertia::render('participant/khusus-mahasiswa'))->name('mahasiswa.khusus');
});
