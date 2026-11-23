<?php

use App\Models\Voucher;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Voucher mitra yang lewat masa berlaku berubah menjadi kadaluarsa, tidak diperpanjang otomatis (PRD FR-14).
Artisan::command('vouchers:expire', function () {
    $count = Voucher::where('type', 'voucher')->where('status', 'sent')->where('expires_at', '<', now())
        ->update(['status' => 'expired']);
    $this->info("{$count} voucher ditandai kadaluarsa.");
})->purpose('Tandai voucher mitra yang lewat masa berlaku');

Schedule::command('vouchers:expire')->hourly();
