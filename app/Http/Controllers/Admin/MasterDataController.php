<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Outlet;
use App\Models\Partner;
use App\Models\Slot;
use App\Models\VoucherType;
use App\Services\SlotPrizeService;
use App\Support\ActivityLogger;
use App\Support\Mask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A6 Master data: jenis voucher (skema B, nilai penukaran, jumlah), titik, dan area. Perubahan tercatat.
 * Titik baru otomatis mendapat alamat QR dan 25 slot.
 */
class MasterDataController extends Controller
{
    public const FULFILLMENTS = ['mitra' => 'Mitra', 'agregator' => 'Token listrik', 'kuota' => 'Pulsa via mitra', 'tunai' => 'Bensin tunai'];

    /** Menu lama Master data dibuka ke langkah pertama, Area. */
    public function index(): RedirectResponse
    {
        return to_route('admin.master-data.area');
    }

    public function warung(): Response
    {
        return Inertia::render('admin/master-warung', [
            'outlets' => Outlet::with(['areas', 'voucherTypes'])->orderBy('code')->get()->map(fn (Outlet $o) => [
                'id' => $o->id,
                'code' => $o->code,
                'name' => $o->name,
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
            'partners' => Partner::with('outlet')->withCount('voucherTypes')->orderBy('name')->get()->map(fn (Partner $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'kind' => $p->type,
                'outlet' => $p->outlet ? "{$p->outlet->code} · {$p->outlet->name}" : null,
                'whatsapp' => $p->whatsapp,
                'wa' => Mask::waLink($p->whatsapp, "Halo {$p->name}, ini admin PICKME."),
                'active' => $p->status === 'active',
                'has_pin' => (bool) $p->pin_hash,
                'types' => $p->voucher_types_count,
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
        ];
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
        $outlet->update(['whatsapp' => $data['whatsapp']]);
        ActivityLogger::log('master.outlet_created', 'outlet', $outlet->id, ['code' => $code], $request->user());

        return back()->with('status', "Warung {$code} ditambahkan dengan 25 slot. Alamat QR: ".url($code));
    }

    /** Ubah warung: nama, area kos, dan jenis voucher papannya. Slot kosong yang jenisnya tidak dipilih lagi diisi ulang. */
    public function updateOutlet(Request $request, Outlet $outlet, SlotPrizeService $prizes): RedirectResponse
    {
        $data = $request->validate($this->outletRules(), self::OUTLET_MESSAGES);
        $areaIds = array_map('intval', $data['area_ids']);
        $typeIds = array_map('intval', $data['voucher_type_ids'] ?? []);
        $before = ['areas' => $outlet->areas()->pluck('areas.id')->all(), 'voucher_types' => $outlet->voucherTypes()->pluck('voucher_types.id')->all()];

        $outlet->update(['name' => $data['name'], 'whatsapp' => $data['whatsapp'], 'area_id' => $areaIds[0]]);
        $outlet->areas()->sync($areaIds);
        $outlet->voucherTypes()->sync($typeIds);
        // Akun warung ikut area utama warungnya.
        Partner::where('outlet_id', $outlet->id)->update(['area_id' => $outlet->area_id]);
        $fixed = $prizes->fixOutletMismatch($outlet->id);
        ActivityLogger::log('master.outlet_updated', 'outlet', $outlet->id, [
            'from' => $before, 'to' => ['areas' => $areaIds, 'voucher_types' => $typeIds], 'slots_refilled' => $fixed,
        ], $request->user());

        return back()->with('status', "Warung {$outlet->code} diperbarui.".($fixed ? " {$fixed} slot kosong diisi ulang." : ''));
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
