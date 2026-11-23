<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('participant')->name('participant.')->group(function () {
    Route::get('/', fn () => Inertia::render('participant/home'))->name('home');
    Route::get('papan', fn () => Inertia::render('participant/papan'))->name('papan');
    Route::get('scan', fn () => Inertia::render('participant/scan'))->name('scan');
    Route::get('daftar', fn () => Inertia::render('participant/daftar'))->name('daftar');
    Route::get('daftar/belum-bisa', fn () => Inertia::render('participant/daftar-belum-bisa'))->name('daftar.belum-bisa');
    Route::get('persetujuan', fn () => Inertia::render('participant/persetujuan'))->name('persetujuan');
    Route::get('foto', fn () => Inertia::render('participant/foto'))->name('foto');
    Route::get('slot', fn () => Inertia::render('participant/slot'))->name('slot');

    Route::get('klaim/berhasil/{variant}', fn (string $variant) => Inertia::render('participant/klaim-berhasil', ['variant' => $variant]))
        ->whereIn('variant', ['voucher', 'token', 'merch', 'bensin'])
        ->name('klaim.berhasil');
    Route::get('klaim/diperiksa', fn () => Inertia::render('participant/klaim-diperiksa'))->name('klaim.diperiksa');
    Route::get('klaim/ditolak', fn () => Inertia::render('participant/klaim-ditolak'))->name('klaim.ditolak');

    Route::get('hadiah', fn () => Inertia::render('participant/hadiah'))->name('hadiah');
    Route::get('voucher', fn () => Inertia::render('participant/voucher'))->name('voucher');
    Route::get('nomor-tujuan', fn () => Inertia::render('participant/nomor-tujuan'))->name('nomor-tujuan');
    Route::get('alamat', fn () => Inertia::render('participant/alamat'))->name('alamat');
    Route::get('kartu', fn () => Inertia::render('participant/kartu'))->name('kartu');

    Route::get('mahasiswa', fn () => Inertia::render('participant/mahasiswa'))->name('mahasiswa');
    Route::get('mahasiswa/khusus', fn () => Inertia::render('participant/khusus-mahasiswa'))->name('mahasiswa.khusus');

    Route::get('qr-tidak-dikenal', fn () => Inertia::render('participant/qr-tidak-dikenal'))->name('qr-tidak-dikenal');
    Route::get('lupa-pin', fn () => Inertia::render('participant/lupa-pin'))->name('lupa-pin');
    Route::get('terima-kasih', fn () => Inertia::render('participant/terima-kasih'))->name('terima-kasih');
});
