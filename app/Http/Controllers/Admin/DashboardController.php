<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Claim;
use App\Models\Outlet;
use App\Models\PartnerPayout;
use App\Models\Setting;
use App\Models\Slot;
use App\Support\AdminQueues;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A1 Beranda: ringkasan hari ini (klaim masuk, voucher belum dikirim, antrean pemenuhan, slot terpakai), slot terpakai
 * per area, dan daftar yang perlu perhatian dengan tautan langsung ke antreannya.
 */
class DashboardController extends Controller
{
    public function index(): Response
    {
        $tokens = AdminQueues::tokens()->count();
        $fuel = AdminQueues::fuel()->count();
        $goods = AdminQueues::goods()->count();
        $totalSlots = Slot::count();
        $usedSlots = Slot::where('status', 'used')->count();

        // Slot terpakai per area titik.
        $perArea = Area::query()
            ->whereHas('outlets')
            ->get()
            ->map(fn (Area $area) => [
                'name' => $area->name,
                'used' => Slot::where('status', 'used')->whereHas('board.outlet', fn ($q) => $q->where('area_id', $area->id))->count(),
                'total' => Slot::whereHas('board.outlet', fn ($q) => $q->where('area_id', $area->id))->count(),
            ])
            ->sortByDesc('used')
            ->values();

        $attention = [];
        $needsHelp = AdminQueues::needsHelp()->count();
        if ($needsHelp) {
            $attention[] = ['text' => "{$needsHelp} permintaan perlu bantuan admin: nomor tujuan gagal 3 kali", 'href' => route('admin.pemenuhan')];
        }
        $unpaid = PartnerPayout::where('status', 'menunggu_bayar')->count();
        if ($unpaid) {
            $attention[] = ['text' => "{$unpaid} rekap mitra menunggu dibayar", 'href' => route('admin.pembayaran')];
        }
        $pausedOutlets = Outlet::where('status', '!=', 'active')->count();
        $attention[] = Setting::programPaused()
            ? ['text' => 'Program sedang dijeda. Peserta tidak bisa klaim.', 'href' => route('admin.pengaturan'), 'danger' => true]
            : ($pausedOutlets
                ? ['text' => "{$pausedOutlets} titik sedang dijeda", 'href' => route('admin.papan')]
                : ['text' => 'Tidak ada jeda aktif di program maupun titik', 'href' => route('admin.pengaturan')]);

        return Inertia::render('admin/beranda', [
            'stats' => [
                'claimsToday' => Claim::whereDate('submitted_at', today())->count(),
                'toDispatch' => AdminQueues::dispatch()->count(),
                'fulfillment' => $tokens + $fuel + $goods,
                'fulfillmentBreakdown' => "{$tokens} token, {$fuel} bensin, {$goods} merch dan LE",
                'usedSlots' => $usedSlots,
                'totalSlots' => $totalSlots,
            ],
            'perArea' => $perArea,
            'outletCount' => Outlet::count(),
            'attention' => $attention,
        ]);
    }
}
