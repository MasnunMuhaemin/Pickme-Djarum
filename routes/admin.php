<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BoardController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EmergencyController;
use App\Http\Controllers\Admin\FulfillmentController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\Admin\PartnerController;
use App\Http\Controllers\Admin\PhotoQueueController;
use App\Http\Controllers\Admin\RankingController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\VoucherDispatchController;
use Illuminate\Support\Facades\Route;

/*
 * Panel admin (PRD bagian 13, A1 sampai A8). Semua aksi tercatat atas nama akun admin.
 */
Route::prefix('admin')->name('admin.')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('beranda');

    // A2 Antrean foto
    Route::get('antrean-foto', [PhotoQueueController::class, 'index'])->name('antrean-foto');
    Route::get('antrean-foto/{claim}/foto', [PhotoQueueController::class, 'photo'])->name('antrean-foto.foto');
    Route::post('antrean-foto/{claim}/setujui', [PhotoQueueController::class, 'approve'])->name('antrean-foto.setujui');
    Route::post('antrean-foto/{claim}/tolak', [PhotoQueueController::class, 'reject'])->name('antrean-foto.tolak');
    Route::post('antrean-foto/{claim}/urungkan', [PhotoQueueController::class, 'undo'])->name('antrean-foto.urungkan');

    // A3 Antrean pemenuhan
    Route::get('pemenuhan', [FulfillmentController::class, 'index'])->name('pemenuhan');
    Route::post('pemenuhan/token/{voucher}/berhasil', [FulfillmentController::class, 'tokenSuccess'])->name('pemenuhan.token.berhasil');
    Route::post('pemenuhan/token/{voucher}/gagal', [FulfillmentController::class, 'tokenFail'])->name('pemenuhan.token.gagal');
    Route::post('pemenuhan/bensin/{voucher}/hubungi', [FulfillmentController::class, 'fuelContact'])->name('pemenuhan.bensin.hubungi');
    Route::post('pemenuhan/bensin/{voucher}/serahkan', [FulfillmentController::class, 'fuelHandOver'])->name('pemenuhan.bensin.serahkan');
    Route::post('pemenuhan/barang/{gift}/kirim', [FulfillmentController::class, 'giftShip'])->name('pemenuhan.barang.kirim');
    Route::post('pemenuhan/barang/{gift}/selesai', [FulfillmentController::class, 'giftDone'])->name('pemenuhan.barang.selesai');

    // Kirim voucher mitra ke peserta lewat WhatsApp
    Route::get('kirim-voucher', [VoucherDispatchController::class, 'index'])->name('kirim-voucher');
    Route::post('kirim-voucher/{voucher}/terkirim', [VoucherDispatchController::class, 'markSent'])->name('kirim-voucher.terkirim');

    Route::get('peringkat', [RankingController::class, 'index'])->name('peringkat');
    Route::post('peringkat/tutup', [RankingController::class, 'close'])->name('peringkat.tutup');

    // A4 Papan dan slot (hanya baca, jeda per titik)
    Route::get('papan', [BoardController::class, 'index'])->name('papan');
    // Lembar cetak papan fisik: QR titik dan 25 kode slot beserta isinya.
    Route::get('papan/{outlet:code}/cetak', [BoardController::class, 'print'])->name('papan.cetak');

    // A5 Mitra dan pembayaran
    Route::get('mitra', [PartnerController::class, 'index'])->name('mitra');
    Route::post('mitra', [PartnerController::class, 'store'])->name('mitra.store');
    Route::post('mitra/{partner}/pin', [PartnerController::class, 'resetPin'])->name('mitra.pin');
    Route::post('mitra/{partner}/status', [PartnerController::class, 'toggleStatus'])->name('mitra.status');
    Route::post('mitra/{partner}/dibayar', [PartnerController::class, 'markPaid'])->name('mitra.dibayar');
    Route::post('mitra/{partner}/koreksi', [PartnerController::class, 'correct'])->name('mitra.koreksi');

    // A6 Master data
    Route::get('master-data', [MasterDataController::class, 'index'])->name('master-data');
    Route::post('master-data/jenis-voucher', [MasterDataController::class, 'storeType'])->name('master-data.jenis.store');
    Route::put('master-data/jenis-voucher/{voucherType}', [MasterDataController::class, 'updateType'])->name('master-data.jenis.update');
    Route::delete('master-data/jenis-voucher/{voucherType}', [MasterDataController::class, 'destroyType'])->name('master-data.jenis.destroy');
    Route::post('master-data/titik', [MasterDataController::class, 'storeOutlet'])->name('master-data.titik.store');
    Route::post('master-data/area', [MasterDataController::class, 'storeArea'])->name('master-data.area.store');
    Route::post('master-data/area/{area}/antar', [MasterDataController::class, 'toggleDelivery'])->name('master-data.area.antar');

    // A7 Pengaturan dan tombol darurat
    Route::get('pengaturan', [SettingsController::class, 'index'])->name('pengaturan');
    Route::post('pengaturan', [SettingsController::class, 'update'])->name('pengaturan.update');
    Route::post('darurat/jeda', [EmergencyController::class, 'pause'])->name('darurat.jeda');
    Route::post('darurat/lanjutkan', [EmergencyController::class, 'resume'])->name('darurat.lanjutkan');

    // A8 Log aktivitas
    Route::get('log', [ActivityLogController::class, 'index'])->name('log');
    Route::get('log/ekspor', [ActivityLogController::class, 'export'])->name('log.ekspor');
});
