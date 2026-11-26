<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Setting;
use App\Models\Slot;
use App\Support\ActivityLogger;
use App\Support\RewardPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A4 Papan dan slot: daftar titik dan 25 slot tiap titik (kosong, ditahan, terpakai) beserta pengambil dan waktu.
 * Hanya baca; jeda per titik dipicu dari sini lewat Tombol Darurat.
 */
class BoardController extends Controller
{
    private const PRIZE_LABELS = ['voucher' => 'Voucher', 'token' => 'Token listrik', 'bensin' => 'Bensin motor', 'merch' => 'Merchandise', 'limited' => 'Limited edition'];

    /** Jenis isi slot untuk tampilan admin: voucher (termasuk token/bensin/kuota), merch, atau limited. */
    public static function kind(string $prizeType): string
    {
        return in_array($prizeType, ['merch', 'limited'], true) ? $prizeType : 'voucher';
    }

    /** Lembar cetak untuk membuat papan fisik: QR alamat titik, dan kode di balik tiap slot beserta isinya. */
    public function print(Request $request, Outlet $outlet): Response
    {
        $slots = $outlet->board?->slots()->with('voucherType')->orderBy('position')->get() ?? collect();
        ActivityLogger::log('board.printed', 'outlet', $outlet->id, ['code' => $outlet->code], $request->user());

        return Inertia::render('admin/cetak-papan', [
            'outlet' => ['code' => $outlet->code, 'name' => $outlet->name, 'area' => $outlet->area?->name, 'qr' => url($outlet->code)],
            'slots' => $slots->map(fn (Slot $s) => [
                'position' => $s->position,
                'code' => $s->code,
                'prize' => $this->prizeLabel($s),
                'partner' => $s->voucherType?->partner?->name ?? $s->voucherType?->partner_label,
                'status' => $s->status,
            ]),
        ]);
    }

    /** Daftar cetak semua papan (PDF lewat dialog cetak browser): satu halaman per papan, urut A1 sampai E5. */
    public function printAll(Request $request): Response
    {
        ActivityLogger::log('board.printed', 'outlet', null, ['code' => 'semua'], $request->user());

        return Inertia::render('admin/daftar-cetak', [
            'boards' => Outlet::with('board.slots.voucherType')->orderBy('code')->get()
                ->filter(fn (Outlet $o) => $o->board?->slots->isNotEmpty())
                ->map(fn (Outlet $o) => [
                    'code' => $o->code,
                    'name' => $o->name,
                    'slots' => $o->board->slots->sortBy('position')->values()->map(fn (Slot $s) => [
                        'position' => $s->position,
                        'code' => $s->code,
                        'prize' => $this->prizeLabel($s),
                    ]),
                ])->values(),
        ]);
    }

    /**
     * Cetak voucher (desain): alur cetak dan pasang, lalu ekspor kode unik per papan (CSV) untuk dicetak tim.
     * Satu voucher = satu slot = satu kode di kotak KODE UNIK.
     */
    public function printIndex(): Response
    {
        $outlets = Outlet::with('board.slots')->orderBy('code')->get();

        return Inertia::render('admin/cetak-voucher', [
            'outlets' => $outlets->map(fn (Outlet $o) => [
                'code' => $o->code,
                'name' => $o->name,
                'vouchers' => $o->board?->slots->whereNotIn('prize_type', ['merch', 'limited'])->count() ?? 0,
                'merch' => $o->board?->slots->where('prize_type', 'merch')->count() ?? 0,
                'limited' => $o->board?->slots->where('prize_type', 'limited')->count() ?? 0,
            ]),
            'totalCodes' => Slot::count(),
            'lastExport' => Setting::get('voucher_export_at'),
        ]);
    }

    /** CSV kode unik: satu papan (?titik=W07) atau semua papan. Kolom: Titik, Nama warung, Slot, Kode unik, Isi papan. */
    public function exportCodes(Request $request): StreamedResponse
    {
        $code = strtoupper((string) $request->query('titik'));
        $outlets = Outlet::with('board.slots.voucherType')->when($code, fn ($q) => $q->where('code', $code))->orderBy('code')->get();
        Setting::put('voucher_export_at', now()->format('d/m/Y H:i'));
        ActivityLogger::log('voucher.codes_exported', 'outlet', null, ['titik' => $code ?: 'semua'], $request->user());

        return response()->streamDownload(function () use ($outlets) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Titik', 'Nama warung', 'Slot', 'Kode unik', 'Isi papan']);
            foreach ($outlets as $o) {
                foreach ($o->board?->slots->sortBy('position') ?? [] as $slot) {
                    fputcsv($out, [$o->code, $o->name, $slot->position, $slot->code, $this->prizeLabel($slot)]);
                }
            }
            fclose($out);
        }, 'kode-unik-'.($code ?: 'semua').'.csv', ['Content-Type' => 'text/csv']);
    }

    /** Panduan pasang (desain): urutan A1 sampai E5, slot berikutnya yang dipasang, dan daftar barang papan. */
    public function install(Outlet $outlet): Response
    {
        $slots = $outlet->board?->slots()->with('voucherType')->orderBy('position')->get() ?? collect();
        $next = $slots->first(fn (Slot $s) => ! $s->installed_at);

        return Inertia::render('admin/pasang-papan', [
            'outlet' => ['code' => $outlet->code, 'name' => $outlet->name, 'area' => $outlet->area?->name],
            'slots' => $slots->map(fn (Slot $s) => [
                'position' => $s->position,
                'prize' => $this->prizeLabel($s),
                'kind' => self::kind($s->prize_type),
                'installed' => (bool) $s->installed_at,
            ]),
            'next' => $next?->position,
            'items' => $slots->groupBy(fn (Slot $s) => self::kind($s->prize_type) !== 'voucher' ? self::PRIZE_LABELS[$s->prize_type] : ($s->voucherType?->name ?? 'Voucher'))
                ->map(fn ($g, $label) => ['label' => $label, 'count' => $g->count()])->values(),
        ]);
    }

    /** Tandai slot berikutnya terpasang (atau batalkan tanda pada slot tertentu). */
    public function markInstalled(Request $request, Outlet $outlet): RedirectResponse
    {
        $data = $request->validate(['position' => ['required', 'regex:/^[A-E][1-5]$/'], 'installed' => ['required', 'boolean']]);
        $slot = $outlet->board?->slots()->where('position', $data['position'])->firstOrFail();
        $slot->update(['installed_at' => $data['installed'] ? now() : null]);
        ActivityLogger::log('slot.installed', 'outlet', $outlet->id, $data, $request->user());

        return back();
    }

    private function prizeLabel(Slot $slot): string
    {
        return $slot->voucherType
            ? $slot->voucherType->name.' · Rp'.number_format($slot->voucherType->value, 0, ',', '.')
            : (self::PRIZE_LABELS[$slot->prize_type] ?? $slot->prize_type);
    }

    /**
     * Ringkasan semua papan (desain "Papan dan slot"): tabel warung dengan slot terpakai, stok per jenis hadiah di
     * semua papan, dan ringkasan warung terpilih. Grid 25 slot ada di detail warung.
     */
    public function index(Request $request): Response
    {
        $outlets = Outlet::with(['area', 'board'])->orderBy('code')->get();
        $counts = Slot::query()->selectRaw("board_id, count(*) as total, sum(case when status = 'used' then 1 else 0 end) as used")
            ->groupBy('board_id')->get()->keyBy('board_id');
        $selected = $outlets->firstWhere('code', strtoupper((string) $request->query('titik'))) ?? $outlets->first();

        // Stok per jenis di semua papan: voucher (rincian per pemenuhan) dan merchandise.
        $slots = Slot::with('voucherType')->get(['id', 'prize_type', 'status', 'voucher_type_id']);
        $kind = fn (Slot $s) => self::kind($s->prize_type);
        $stock = $slots->groupBy($kind)->map(fn ($group, $key) => [
            'key' => $key,
            'label' => self::PRIZE_LABELS[$key] ?? 'Voucher',
            'total' => $group->count(),
            'used' => $group->where('status', 'used')->count(),
            'left' => $group->where('status', '!=', 'used')->count(),
            'detail' => $key !== 'voucher'
                ? 'Ambil di papan'
                : $group->groupBy(fn (Slot $s) => match (true) {
                    $s->prize_type === 'token' => 'token',
                    $s->prize_type === 'bensin' => 'bensin',
                    $s->voucherType?->fulfillment === 'kuota' => 'kuota',
                    default => 'mitra',
                })->map(fn ($g, $k) => "{$k} {$g->count()}")->sortKeys()->implode(' · '),
        ])->sortBy(fn ($row) => ['voucher' => 0, 'merch' => 1, 'limited' => 2][$row['key']])->values();

        $selectedSlots = $selected?->board ? $selected->board->slots()->get(['prize_type', 'status']) : collect();
        $usedSelected = $selectedSlots->where('status', 'used');

        return Inertia::render('admin/papan', [
            'outlets' => $outlets->map(fn (Outlet $o) => [
                'code' => $o->code,
                'name' => $o->name,
                'area' => $o->area?->name,
                'used' => (int) ($counts[$o->board?->id]->used ?? 0),
                'total' => (int) ($counts[$o->board?->id]->total ?? 0),
                'active' => $o->status === 'active',
            ]),
            'stock' => $stock,
            'totals' => ['slots' => $slots->count(), 'used' => $slots->where('status', 'used')->count()],
            'selected' => $selected ? [
                'id' => $selected->id,
                'code' => $selected->code,
                'name' => $selected->name,
                'active' => $selected->status === 'active',
                'used' => $usedSelected->count(),
                'total' => $selectedSlots->count(),
                'used_voucher' => $usedSelected->whereNotIn('prize_type', ['merch', 'limited'])->count(),
                'used_merch' => $usedSelected->where('prize_type', 'merch')->count(),
                'used_limited' => $usedSelected->where('prize_type', 'limited')->count(),
                'claims_today' => $selected->claims()->whereDate('submitted_at', today())->count(),
            ] : null,
        ]);
    }

    /** Detail papan satu warung: 25 slot (kosong, ditahan, terpakai), pengambil, waktu, dan isi hadiahnya. */
    public function show(Request $request, Outlet $outlet): Response
    {
        $outlets = Outlet::with(['area', 'board'])->orderBy('code')->get();
        $selected = $outlets->firstWhere('id', $outlet->id);

        $slots = $selected?->board
            ? $selected->board->slots()->with(['holder', 'claim.participant', 'claim.voucher.voucherType', 'claim.voucher.partner', 'voucherType.partner'])->orderBy('position')->get()
            : collect();

        // Isi hadiah papan titik terpilih per jenis voucher, supaya terlihat voucher apa saja yang ada di warung itu.
        $stock = $slots->groupBy(fn (Slot $s) => $this->prizeLabel($s))
            ->map(fn ($group, $label) => [
                'label' => $label,
                'partner' => $group->first()->voucherType?->partner?->name ?? $group->first()->voucherType?->partner_label,
                'total' => $group->count(),
                'used' => $group->where('status', 'used')->count(),
                'left' => $group->where('status', '!=', 'used')->count(),
            ])
            ->sortBy('label')
            ->values();

        // Hitungan slot semua papan dalam satu query (warung bisa puluhan).
        $counts = Slot::query()->selectRaw("board_id, count(*) as total, sum(case when status = 'used' then 1 else 0 end) as used")
            ->groupBy('board_id')->get()->keyBy('board_id');

        return Inertia::render('admin/papan-detail', [
            'outlets' => $outlets->map(fn (Outlet $o) => [
                'id' => $o->id,
                'code' => $o->code,
                'name' => $o->name,
                'area' => $o->area?->name,
                'used' => (int) ($counts[$o->board?->id]->used ?? 0),
                'total' => (int) ($counts[$o->board?->id]->total ?? 0),
                'active' => $o->status === 'active',
            ]),
            'selected' => $selected ? [
                'id' => $selected->id,
                'code' => $selected->code,
                'name' => $selected->name,
                'area' => $selected->area?->name,
                'active' => $selected->status === 'active',
                'qr' => url($selected->code),
                'slots' => $slots->map(fn (Slot $s) => [
                    'position' => $s->position,
                    'status' => $s->status,
                    // Kode di balik slot fisik (hanya terlihat admin).
                    'code' => $s->code,
                    'kind' => self::kind($s->prize_type),
                    'prize' => $this->prizeLabel($s),
                    'by' => $s->claim?->participant?->name ?? $s->holder?->name,
                    'voucher_code' => $s->claim?->voucher?->code ?? $s->voucher_code,
                    'claimed' => (bool) $s->claim?->voucher,
                    // Label status sama dengan yang dilihat peserta di Hadiahku.
                    'voucher_status' => $s->claim?->voucher ? RewardPresenter::voucher($s->claim->voucher)['status_label'] : null,
                    'at' => ($s->used_at ?? $s->held_until)?->format('d M H:i'),
                ]),
            ] : null,
            'stock' => $stock,
        ]);
    }
}
