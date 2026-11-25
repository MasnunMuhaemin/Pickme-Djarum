<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Slot kosong yang berisi jenis voucher yang tidak dipilih untuk warungnya diisi ulang.
Artisan::command('slots:sinkron-warung', function (App\Services\SlotPrizeService $prizes) {
    $this->info($prizes->fixOutletMismatch().' slot diisi ulang sesuai pilihan voucher warung.');
})->purpose('Rapikan isi slot sesuai jenis voucher yang dipilih tiap warung');
