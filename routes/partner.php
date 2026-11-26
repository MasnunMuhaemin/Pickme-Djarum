<?php

use App\Http\Controllers\Partner\PartnerAuthController;
use App\Http\Controllers\Partner\PartnerPortalController;
use Illuminate\Support\Facades\Route;

// Halaman mitra (PRD bagian 12): alamat terpisah dari peserta dan admin, masuk dengan PIN mitra.
Route::prefix('mitra')->name('mitra.')->group(function () {
    Route::get('masuk', [PartnerAuthController::class, 'show'])->name('masuk');
    Route::post('masuk', [PartnerAuthController::class, 'login'])->name('masuk.store');
    Route::post('keluar', [PartnerAuthController::class, 'logout'])->name('keluar');

    Route::middleware('partner')->group(function () {
        Route::get('/', [PartnerPortalController::class, 'check'])->name('cek');
        Route::post('cek', [PartnerPortalController::class, 'lookup'])->name('cek.store');
        Route::get('kode/{code}', [PartnerPortalController::class, 'result'])->name('kode');
        Route::post('kode/{code}/tukar', [PartnerPortalController::class, 'redeem'])->name('tukar');
        Route::get('kode/{code}/ditukar', [PartnerPortalController::class, 'redeemed'])->name('ditukar');
        Route::get('kode/{code}/foto', [PartnerPortalController::class, 'photo'])->name('foto');
        Route::post('kode/{code}/foto', [PartnerPortalController::class, 'storePhoto'])->name('foto.store');
        Route::get('kode/{code}/selesai', [PartnerPortalController::class, 'done'])->name('selesai');

        Route::get('rekap', [PartnerPortalController::class, 'recap'])->name('rekap');
        Route::get('rekap/{week}', [PartnerPortalController::class, 'weekDetail'])->where('week', '\d{4}-\d{2}-\d{2}')->name('rekap.minggu');
        Route::get('tukar/{code}', [PartnerPortalController::class, 'detail'])->name('rincian');
        Route::get('bukti/{code}', [PartnerPortalController::class, 'proofImage'])->name('bukti');

        Route::get('antrean', [PartnerPortalController::class, 'queue'])->name('antrean');
        Route::post('antrean/{voucher}/selesai', [PartnerPortalController::class, 'queueDone'])->name('antrean.selesai');
        Route::post('antrean/{voucher}/nomor-salah', [PartnerPortalController::class, 'queueWrong'])->name('antrean.salah');
    });
});
