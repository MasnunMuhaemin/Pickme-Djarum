<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Claim;
use App\Models\Outlet;
use App\Models\Partner;
use App\Models\Setting;
use App\Models\Slot;
use App\Models\VoucherType;
use App\Services\SlotPrizeService;
use App\Support\ActivityLogger;
use App\Support\GeoPoint;
use App\Support\Mask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A6 Master data: jenis voucher (skema B, nilai penukaran, jumlah), titik, dan area. Perubahan tercatat.
 * Titik baru otomatis mendapat alamat QR dan 25 slot.
 */
class MasterDataController extends Controller
{
    public const FULFILLMENTS = ['mitra' => 'Mitra', 'agregator' => 'Token listrik', 'kuota' => 'Pulsa via mitra', 'tunai' => 'Bensin tunai'];

    /** Menu lama Master data dibuka ke langkah pertama, Area. */
    /** Master data (desain): urutan isi data program, dari area sampai generator kode dan QR warung. */
    public function index(SlotPrizeService $prizes): Response
    {
        $outlets = Outlet::count();

        return Inertia::render('admin/master-data', [
            'stock' => $prizes->stock(),
            'counts' => [
                'areas' => Area::count(),
                'types' => VoucherType::count(),
                'partners' => Partner::where('type', '!=', 'outlet')->count(),
                'outlets' => $outlets,
                'qrTested' => Outlet::whereNotNull('qr_tested_at')->count(),
                'slots' => Slot::count(),
            ],
            'generatorRunAt' => Setting::get('generator_run_at'),
            'locked' => (bool) Setting::get('generator_run_at') || Slot::exists(),
        ]);
    }

    /** Warung (desain): ringkasan, tabel warung dengan slot terpakai, status, dan QR. */
    public function warung(): Response
    {
        $counts = Slot::query()->selectRaw("board_id, count(*) as total, sum(case when status = 'used' then 1 else 0 end) as used")
            ->groupBy('board_id')->get()->keyBy('board_id');
        $usedQr = Claim::distinct()->pluck('outlet_id')->flip();
        $outlets = Outlet::with(['areas', 'voucherTypes', 'board', 'area'])->orderBy('code')->get();

        return Inertia::render('admin/master-warung', [
            'stats' => [
                'active' => $outlets->where('status', 'active')->count(),
                'paused' => $outlets->where('status', '!=', 'active')->count(),
                'emptySlots' => Slot::where('status', '!=', 'used')->count(),
                'qrUsed' => $outlets->filter(fn (Outlet $o) => $usedQr->has($o->id))->count(),
                'total' => $outlets->count(),
            ],
            'outlets' => $outlets->map(fn (Outlet $o) => [
                'id' => $o->id,
                'code' => $o->code,
                'name' => $o->name,
                'area' => $o->area?->name,
                'used' => (int) ($counts[$o->board?->id]->used ?? 0),
                'total' => (int) ($counts[$o->board?->id]->total ?? 0),
                'active' => $o->status === 'active',
                // QR dianggap teruji setelah ada klaim pertama dari warung ini.
                'qr_used' => $usedQr->has($o->id),
                'qr_tested' => $o->qr_tested_at?->format('d/m H:i'),
                'location' => $o->lat !== null ? "{$o->lat}, {$o->lng}" : '',
                'whatsapp' => $o->whatsapp,
                'wa' => Mask::waLink($o->whatsapp, "Halo {$o->name}, ini admin PICKME."),
                'qr' => url($o->code),
                'area_ids' => $o->areas->pluck('id'),
                'areas' => $o->areas->pluck('name'),
                'voucher_type_ids' => $o->voucherTypes->pluck('id'),
                'voucher_types' => $o->voucherTypes->pluck('name'),
            ]),
            'areas' => $this->areaOptions(),
            'voucherTypes' => VoucherType::with('partner')->orderBy('name')->get()->map(fn (VoucherType $t) => [
                'id' => $t->id,
                'name' => $t->name.' · '.($t->partner?->name ?? $t->partner_label ?? '-').' · Rp'.number_format($t->value, 0, ',', '.'),
            ]),
        ]);
    }

    /** Ubah isi papan (desain): jumlah tiap jenis voucher, merchandise, dan limited edition yang dibagi generator. */
    public function isiPapan(SlotPrizeService $prizes): Response
    {
        $used = Slot::whereNotNull('voucher_type_id')->selectRaw('voucher_type_id, count(*) as n')->groupBy('voucher_type_id')->pluck('n', 'voucher_type_id');

        return Inertia::render('admin/isi-papan', [
            'stock' => $prizes->stock(),
            'locked' => (bool) Setting::get('generator_run_at') || Slot::exists(),
            'placed' => ['merch' => Slot::where('prize_type', 'merch')->count(), 'limited' => Slot::where('prize_type', 'limited')->count()],
            'types' => VoucherType::with('partner')->orderBy('name')->get()->map(fn (VoucherType $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'partner' => $t->partner?->name ?? $t->partner_label,
                'fulfillment' => $t->fulfillment,
                'value' => $t->value,
                'quantity' => $t->quantity,
                'placed' => (int) ($used[$t->id] ?? 0),
            ]),
        ]);
    }

    public function saveIsiPapan(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'merch' => ['required', 'integer', 'min:0'],
            'limited' => ['required', 'integer', 'min:0'],
            'quantities' => ['array'],
            'quantities.*' => ['integer', 'min:0'],
        ]);
        DB::transaction(function () use ($data, $request) {
            Setting::put('stock_merch', (int) $data['merch']);
            Setting::put('stock_limited', (int) $data['limited']);
            foreach ($data['quantities'] ?? [] as $id => $qty) {
                VoucherType::whereKey($id)->update(['quantity' => (int) $qty]);
            }
            ActivityLogger::log('board.stock_updated', 'settings', null, ['merch' => $data['merch'], 'limited' => $data['limited']], $request->user());
        });

        return back()->with('status', 'Isi papan disimpan.');
    }

    /** Semua QR warung dalam satu halaman untuk diunduh atau dicetak. */
    public function qr(Request $request): Response
    {
        $usedQr = Claim::distinct()->pluck('outlet_id')->flip();

        return Inertia::render($request->routeIs('admin.master-data.warung.qr.cetak') ? 'admin/qr-cetak' : 'admin/qr-warung', [
            'outlets' => Outlet::with('area')->orderBy('code')->get()->map(fn (Outlet $o) => [
                'code' => $o->code,
                'name' => $o->name,
                'area' => $o->area?->name,
                'qr' => url($o->code),
                'qr_used' => $usedQr->has($o->id),
                'qr_tested' => $o->qr_tested_at?->format('d/m H:i'),
            ]),
        ]);
    }

    /** Ekspor CSV daftar warung. */
    public function exportOutlets(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Titik', 'Nama warung', 'Area', 'Status', 'Hadiah terpakai', 'Total hadiah', 'Alamat QR']);
            foreach (Outlet::with(['area', 'board.slots'])->orderBy('code')->get() as $o) {
                $slots = $o->board?->slots ?? collect();
                fputcsv($out, [$o->code, $o->name, $o->area?->name, $o->status === 'active' ? 'Aktif' : 'Dijeda',
                    $slots->where('status', 'used')->count(), $slots->count(), url($o->code)]);
            }
            fclose($out);
        }, 'warung.csv', ['Content-Type' => 'text/csv']);
    }

    public function area(): Response
    {
        return Inertia::render('admin/master-area', [
            'areas' => Area::withCount('coveringOutlets')->orderBy('name')->get()->map(fn (Area $a) => [
                'id' => $a->id, 'name' => $a->name, 'delivery' => (bool) $a->is_delivery_area, 'outlets' => $a->covering_outlets_count,
            ]),
        ]);
    }

    public function mitra(): Response
    {
        return Inertia::render('admin/master-mitra', [
            'partners' => Partner::with(['outlet', 'voucherTypes'])->withCount('voucherTypes')->orderBy('name')->get()->map(fn (Partner $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'kind' => $p->type,
                'outlet' => $p->outlet ? "{$p->outlet->code} · {$p->outlet->name}" : null,
                'whatsapp' => $p->whatsapp,
                'wa' => Mask::waLink($p->whatsapp, "Halo {$p->name}, ini admin PICKME."),
                'active' => $p->status === 'active',
                'has_pin' => (bool) $p->pin_hash,
                'types' => $p->voucher_types_count,
                'type_names' => $p->voucherTypes->pluck('name')->implode(', '),
                'address' => $p->address,
                'maps_url' => $p->maps_url,
                'location' => $p->lat !== null ? "{$p->lat}, {$p->lng}" : '',
                'last_login' => $p->last_login_at
                    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][$p->last_login_at->dayOfWeek].', '.$p->last_login_at->format('d/m H:i')
                    : null,
            ]),
            // Warung yang belum punya akun, untuk form tambah akun warung.
            'freeOutlets' => Outlet::whereNotIn('id', Partner::whereNotNull('outlet_id')->pluck('outlet_id'))->orderBy('code')->get()
                ->map(fn (Outlet $o) => ['id' => $o->id, 'name' => "{$o->code} · {$o->name}"]),
        ]);
    }

    public function jenisVoucher(): Response
    {
        $types = VoucherType::with(['partner', 'outlets'])->orderBy('id')->get();
        $outletsWithChoice = DB::table('outlet_voucher_type')->distinct()->pluck('outlet_id');
        // Warung tanpa pilihan memakai semua jenis, jadi ikut dihitung untuk tiap jenis.
        $openOutlets = Outlet::whereNotIn('id', $outletsWithChoice)->orderBy('code')->pluck('code');

        return Inertia::render('admin/master-voucher', [
            'types' => $types->map(fn (VoucherType $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'partner_id' => $t->partner_id,
                'partner' => $t->partner?->name ?? $t->partner_label,
                'partner_label' => $t->partner_label,
                'outlets' => $t->outlets->pluck('code')->merge($openOutlets)->unique()->sort()->values(),
                'value' => $t->value,
                'quantity' => $t->quantity,
                'fulfillment' => $t->fulfillment,
                'fulfillment_label' => self::FULFILLMENTS[$t->fulfillment] ?? $t->fulfillment,
            ]),
            'summary' => $this->summary($types),
            // Akun warung tidak punya jenis voucher sendiri: voucher warung dan galon ditukar di warung titik.
            'partners' => Partner::where('type', '!=', 'outlet')->orderBy('name')->get(['id', 'name']),
            'fulfillments' => collect(self::FULFILLMENTS)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'outletCodes' => Outlet::orderBy('code')->pluck('code'),
            'outletNames' => Outlet::pluck('name', 'code'),
        ]);
    }

    private function areaOptions()
    {
        return Area::orderBy('name')->get(['id', 'name']);
    }

    public function storeType(Request $request): RedirectResponse
    {
        $type = VoucherType::create($this->validated($request));
        ActivityLogger::log('master.voucher_type', 'voucher_type', $type->id, ['action' => 'create', 'name' => $type->name], $request->user());

        return back()->with('status', "Jenis voucher {$type->name} ditambahkan.");
    }

    public function updateType(Request $request, VoucherType $voucherType): RedirectResponse
    {
        $before = $voucherType->only(['name', 'value', 'quantity']);
        $voucherType->update($this->validated($request));
        ActivityLogger::log('master.voucher_type', 'voucher_type', $voucherType->id, ['action' => 'update', 'from' => $before, 'to' => $voucherType->only(['name', 'value', 'quantity'])], $request->user());
        // Mitra bisa berganti area: slot kosong yang jadi salah area diisi ulang.
        // Jenis pemenuhan bisa berubah: slot kosong yang jadi tidak cocok diisi ulang.
        app(SlotPrizeService::class)->fixOutletMismatch();

        return back()->with('status', "Jenis voucher {$voucherType->name} diperbarui.");
    }

    public function destroyType(Request $request, VoucherType $voucherType): RedirectResponse
    {
        ActivityLogger::log('master.voucher_type', 'voucher_type', $voucherType->id, ['action' => 'delete', 'name' => $voucherType->name], $request->user());
        $voucherType->delete();
        app(SlotPrizeService::class)->fillMissing();

        return back()->with('status', 'Jenis voucher dihapus.');
    }

    /** Titik baru otomatis mendapat alamat QR (/KODE) dan papan 25 slot A1 sampai E5 dengan kode acak. */
    /** Aturan isian warung: banyak area kos (minimal satu) dan jenis voucher untuk papannya (boleh kosong = semua). */
    private function outletRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'whatsapp' => ['required', 'regex:/^08[0-9]{8,11}$/'],
            'area_ids' => ['required', 'array', 'min:1'],
            'area_ids.*' => ['integer', 'exists:areas,id'],
            'voucher_type_ids' => ['array'],
            'voucher_type_ids.*' => ['integer', 'exists:voucher_types,id'],
            // Titik peta peserta: "lat, lng" atau tautan Google Maps yang memuat koordinat.
            'location' => ['nullable', 'string', 'max:500', function ($attribute, $value, $fail) {
                if ($value && ! GeoPoint::parse($value)) {
                    $fail('Titik peta tidak dikenali. Tempel koordinat dari Google Maps, mis. -6.9733, 107.6301.');
                }
            }],
        ];
    }

    /** @return array{lat: ?float, lng: ?float} */
    private static function coordinates(?string $location): array
    {
        $point = GeoPoint::parse($location);

        return ['lat' => $point['lat'] ?? null, 'lng' => $point['lng'] ?? null];
    }

    private const OUTLET_MESSAGES = [
        'code.regex' => 'Kode warung: satu huruf dan dua angka, mis. W21.',
        'code.unique' => 'Kode warung sudah dipakai.',
        'whatsapp.required' => 'Isi nomor WhatsApp warung.',
        'whatsapp.regex' => 'Nomor WhatsApp diawali 08, 10 sampai 13 angka.',
        'area_ids.required' => 'Pilih minimal satu area kos.',
        'area_ids.min' => 'Pilih minimal satu area kos.',
    ];

    public function storeOutlet(Request $request, SlotPrizeService $prizes): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'regex:/^[A-Za-z][0-9]{2}$/', 'unique:outlets,code'],
            ...$this->outletRules(),
        ], self::OUTLET_MESSAGES);
        $code = strtoupper($data['code']);

        $outlet = $prizes->createOutlet($code, $data['name'], array_map('intval', $data['area_ids']), array_map('intval', $data['voucher_type_ids'] ?? []));
        $outlet->update(['whatsapp' => $data['whatsapp'], ...self::coordinates($data['location'] ?? null)]);
        ActivityLogger::log('master.outlet_created', 'outlet', $outlet->id, ['code' => $code], $request->user());

        return back()->with('status', "Warung {$code} ditambahkan dengan 25 hadiah. Alamat QR: ".url($code));
    }

    /** Ubah warung: nama, area kos, dan jenis voucher papannya. Slot kosong yang jenisnya tidak dipilih lagi diisi ulang. */
    public function updateOutlet(Request $request, Outlet $outlet, SlotPrizeService $prizes): RedirectResponse
    {
        $data = $request->validate($this->outletRules(), self::OUTLET_MESSAGES);
        $areaIds = array_map('intval', $data['area_ids']);
        $typeIds = array_map('intval', $data['voucher_type_ids'] ?? []);
        $before = ['areas' => $outlet->areas()->pluck('areas.id')->all(), 'voucher_types' => $outlet->voucherTypes()->pluck('voucher_types.id')->all()];

        $outlet->update(['name' => $data['name'], 'whatsapp' => $data['whatsapp'], 'area_id' => $areaIds[0], ...self::coordinates($data['location'] ?? null)]);
        $outlet->areas()->sync($areaIds);
        $outlet->voucherTypes()->sync($typeIds);
        // Akun warung ikut area utama warungnya.
        Partner::where('outlet_id', $outlet->id)->update(['area_id' => $outlet->area_id]);
        $fixed = $prizes->fixOutletMismatch($outlet->id);
        ActivityLogger::log('master.outlet_updated', 'outlet', $outlet->id, [
            'from' => $before, 'to' => ['areas' => $areaIds, 'voucher_types' => $typeIds], 'slots_refilled' => $fixed,
        ], $request->user());

        return back()->with('status', "Warung {$outlet->code} diperbarui.".($fixed ? " {$fixed} hadiah kosong diisi ulang." : ''));
    }

    public function storeArea(Request $request): RedirectResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:60', 'unique:areas,name'], 'delivery' => ['boolean']]);
        $area = Area::create(['name' => $data['name'], 'is_delivery_area' => (bool) ($data['delivery'] ?? false)]);
        ActivityLogger::log('master.area', 'area', $area->id, ['action' => 'create', 'name' => $area->name], $request->user());

        return back()->with('status', "Area {$area->name} ditambahkan.");
    }

    public function toggleDelivery(Request $request, Area $area): RedirectResponse
    {
        $area->update(['is_delivery_area' => ! $area->is_delivery_area]);
        ActivityLogger::log('master.area', 'area', $area->id, ['action' => 'delivery', 'delivery' => $area->is_delivery_area], $request->user());

        return back()->with('status', "Area {$area->name}: ".($area->is_delivery_area ? 'termasuk' : 'bukan').' area pengiriman.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'partner_id' => ['nullable', 'exists:partners,id'],
            'partner_label' => ['nullable', 'string', 'max:80'],
            'value' => ['required', 'integer', 'min:0', 'max:10000000'],
            'quantity' => ['required', 'integer', 'min:0', 'max:100000'],
            'fulfillment' => ['required', Rule::in(array_keys(self::FULFILLMENTS))],
        ], ['name.required' => 'Isi nama jenis voucher.', 'value.required' => 'Isi nilai penukaran.', 'quantity.required' => 'Isi jumlah.']);
    }

    private function summary($types): string
    {
        $by = $types->groupBy('fulfillment')->map->sum('quantity');

        return collect(self::FULFILLMENTS)->map(fn ($label, $key) => ($by[$key] ?? 0) > 0 ? "{$label} {$by[$key]}" : null)->filter()->implode(' · ');
    }
}
