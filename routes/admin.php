<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BoardController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EmergencyController;
use App\Http\Controllers\Admin\FulfillmentController;
use App\Http\Controllers\Admin\GeneratorController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\Admin\MysteryGiftController;
use App\Http\Controllers\Admin\PartnerController;
use App\Http\Controllers\Admin\PhotoQueueController;
use App\Http\Controllers\Admin\RankingController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VoucherDispatchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
 * Panel admin (PRD bagian 13, A1 sampai A8). Semua aksi tercatat atas nama akun admin.
 */
Route::prefix('admin')->name('admin.')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('beranda');

    // A2 Antrean foto
    Route::get('antrean-foto', [PhotoQueueController::class, 'index'])->name('antrean-foto');
    Route::get('antrean-foto/{claim}/foto', [PhotoQueueController::class, 'photo'])->name('antrean-foto.foto');
    Route::delete('antrean-foto/{claim}/foto', [PhotoQueueController::class, 'destroyPhoto'])->name('antrean-foto.foto.hapus');

    // A3 Antrean pemenuhan
    Route::get('pemenuhan', [FulfillmentController::class, 'index'])->name('pemenuhan');
    Route::post('pemenuhan/topup/{voucher}/selesai', [FulfillmentController::class, 'topupDone'])->name('pemenuhan.topup.selesai');
    Route::post('pemenuhan/topup/{voucher}/nomor-salah', [FulfillmentController::class, 'topupWrong'])->name('pemenuhan.topup.salah');
    Route::post('pemenuhan/bantuan/{voucher}', [FulfillmentController::class, 'helpResolve'])->name('pemenuhan.bantuan');
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
    Route::get('cetak-voucher', [BoardController::class, 'printIndex'])->name('cetak-voucher');
    Route::get('master-data/isi-papan', [MasterDataController::class, 'isiPapan'])->name('master-data.isi-papan');
    Route::post('master-data/isi-papan', [MasterDataController::class, 'saveIsiPapan'])->name('master-data.isi-papan.simpan');
    Route::get('generator', [GeneratorController::class, 'index'])->name('generator');
    Route::post('generator/jalankan', [GeneratorController::class, 'run'])->name('generator.jalankan');
    Route::post('generator/isi', [GeneratorController::class, 'fill'])->name('generator.isi');
    Route::get('generator/cetak', [BoardController::class, 'printAll'])->name('generator.cetak');
    Route::get('mystery-gift', [MysteryGiftController::class, 'index'])->name('mystery-gift');
    Route::post('mystery-gift/aktif', [MysteryGiftController::class, 'toggle'])->name('mystery-gift.aktif');
    Route::post('mystery-gift/peluang', [MysteryGiftController::class, 'chance'])->name('mystery-gift.peluang');
    Route::post('mystery-gift/produk/{gift}/selesai', [MysteryGiftController::class, 'packDone'])->name('mystery-gift.selesai');
    Route::post('mystery-gift/hadiah', [MysteryGiftController::class, 'storePrize'])->name('mystery-gift.hadiah.store');
    Route::put('mystery-gift/hadiah/{prize}', [MysteryGiftController::class, 'updatePrize'])->name('mystery-gift.hadiah.update');
    Route::post('mystery-gift/hadiah/{prize}/aktif', [MysteryGiftController::class, 'togglePrize'])->name('mystery-gift.hadiah.aktif');
    Route::post('mystery-gift/voucher/{voucher}/kode', [MysteryGiftController::class, 'sendCode'])->name('mystery-gift.kode');
    Route::post('mystery-gift/voucher/{voucher}/topup', [MysteryGiftController::class, 'topupDone'])->name('mystery-gift.topup');
    Route::post('mystery-gift/akun', [MysteryGiftController::class, 'audience'])->name('mystery-gift.akun');
    Route::post('mystery-gift/daftar', [MysteryGiftController::class, 'storeAccess'])->name('mystery-gift.daftar.store');
    Route::delete('mystery-gift/daftar/{access}', [MysteryGiftController::class, 'destroyAccess'])->name('mystery-gift.daftar.destroy');
    Route::get('cetak-voucher/ekspor', [BoardController::class, 'exportCodes'])->name('cetak-voucher.ekspor');
    Route::get('papan/{outlet:code}/pasang', [BoardController::class, 'install'])->name('papan.pasang');
    Route::post('papan/{outlet:code}/pasang', [BoardController::class, 'markInstalled'])->name('papan.pasang.store');
    Route::get('papan/{outlet:code}', [BoardController::class, 'show'])->name('papan.detail');

    // A5 Mitra dan pembayaran
    Route::get('pembayaran', [PartnerController::class, 'index'])->name('pembayaran');
    // Alamat lama: rekap ke Pembayaran mitra, akun dan PIN ke Master data > Mitra & akun.
    Route::get('mitra', fn (Request $r) => $r->query('tab') === 'akun' ? to_route('admin.master-data.mitra') : to_route('admin.pembayaran'))->name('mitra');
    Route::post('mitra', [PartnerController::class, 'store'])->name('mitra.store');
    Route::post('mitra/{partner}/pin', [PartnerController::class, 'resetPin'])->name('mitra.pin');
    Route::post('mitra/{partner}/status', [PartnerController::class, 'toggleStatus'])->name('mitra.status');
    Route::put('mitra/{partner}', [PartnerController::class, 'update'])->name('mitra.update');
    Route::post('mitra/{partner}/dibayar', [PartnerController::class, 'markPaid'])->name('mitra.dibayar');
    Route::post('mitra/{partner}/koreksi', [PartnerController::class, 'correct'])->name('mitra.koreksi');
    Route::get('pembayaran/ekspor', [PartnerController::class, 'export'])->name('pembayaran.ekspor');
    Route::get('mitra/bukti-tukar/{voucher}', [PartnerController::class, 'redemptionProof'])->name('mitra.bukti-tukar');
    Route::get('mitra/bukti-bayar/{payout}', [PartnerController::class, 'payoutProof'])->name('mitra.bukti-bayar');

    // A6 Master data
    Route::get('master-data', [MasterDataController::class, 'index'])->name('master-data');
    Route::get('master-data/warung', [MasterDataController::class, 'warung'])->name('master-data.warung');
    Route::get('master-data/warung/qr', [MasterDataController::class, 'qr'])->name('master-data.warung.qr');
    Route::get('master-data/warung/qr/cetak', [MasterDataController::class, 'qr'])->name('master-data.warung.qr.cetak');
    Route::get('master-data/warung/ekspor', [MasterDataController::class, 'exportOutlets'])->name('master-data.warung.ekspor');
    Route::get('master-data/area', [MasterDataController::class, 'area'])->name('master-data.area');
    Route::get('master-data/mitra', [MasterDataController::class, 'mitra'])->name('master-data.mitra');
    Route::get('master-data/jenis-voucher', [MasterDataController::class, 'jenisVoucher'])->name('master-data.jenis-voucher');
    Route::post('master-data/jenis-voucher', [MasterDataController::class, 'storeType'])->name('master-data.jenis.store');
    Route::put('master-data/jenis-voucher/{voucherType}', [MasterDataController::class, 'updateType'])->name('master-data.jenis.update');
    Route::delete('master-data/jenis-voucher/{voucherType}', [MasterDataController::class, 'destroyType'])->name('master-data.jenis.destroy');
    Route::post('master-data/titik', [MasterDataController::class, 'storeOutlet'])->name('master-data.titik.store');
    Route::put('master-data/titik/{outlet}', [MasterDataController::class, 'updateOutlet'])->name('master-data.titik.update');
    Route::post('master-data/area', [MasterDataController::class, 'storeArea'])->name('master-data.area.store');
    Route::post('master-data/area/{area}/antar', [MasterDataController::class, 'toggleDelivery'])->name('master-data.area.antar');

    // A7 Pengaturan dan tombol darurat
    Route::get('pengaturan', [SettingsController::class, 'index'])->name('pengaturan');
    Route::post('pengaturan', [SettingsController::class, 'update'])->name('pengaturan.update');
    Route::post('pengaturan/kalimat-voucher', [SettingsController::class, 'updateVoucherLines'])->name('pengaturan.kalimat');
    Route::post('darurat/jeda', [EmergencyController::class, 'pause'])->name('darurat.jeda');
    Route::post('darurat/lanjutkan', [EmergencyController::class, 'resume'])->name('darurat.lanjutkan');

    // Kelola pengguna: admin dan peserta (peserta tidak dibuat dari admin).
    Route::get('pengguna', [UserController::class, 'index'])->name('pengguna');
    Route::post('pengguna/admin', [UserController::class, 'storeAdmin'])->name('pengguna.admin.store');
    Route::put('pengguna/admin/{user}', [UserController::class, 'updateAdmin'])->name('pengguna.admin.update');
    Route::post('pengguna/admin/{user}/status', [UserController::class, 'toggleAdmin'])->name('pengguna.admin.status');
    Route::put('pengguna/peserta/{participant}', [UserController::class, 'updateParticipant'])->name('pengguna.peserta.update');
    Route::post('pengguna/peserta/{participant}/pin', [UserController::class, 'resetParticipantPin'])->name('pengguna.peserta.pin');
    Route::post('pengguna/peserta/{participant}/blokir', [UserController::class, 'toggleBlock'])->name('pengguna.peserta.blokir');

    // A8 Log aktivitas
    Route::get('log', [ActivityLogController::class, 'index'])->name('log');
    Route::get('log/ekspor', [ActivityLogController::class, 'export'])->name('log.ekspor');
    Route::delete('log/{log}', [ActivityLogController::class, 'destroy'])->name('log.hapus');
});
