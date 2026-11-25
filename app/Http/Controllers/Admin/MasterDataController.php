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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function index(): Response
    {
        $types = VoucherType::with('partner')->orderBy('id')->get();

        return Inertia::render('admin/master-data', [
            'types' => $types->map(fn (VoucherType $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'partner_id' => $t->partner_id,
                'partner' => $t->partner?->name ?? $t->partner_label,
                'partner_label' => $t->partner_label,
                'value' => $t->value,
                'quantity' => $t->quantity,
                'fulfillment' => $t->fulfillment,
                'fulfillment_label' => self::FULFILLMENTS[$t->fulfillment] ?? $t->fulfillment,
            ]),
            'summary' => $this->summary($types),
            'partners' => Partner::orderBy('name')->get(['id', 'name']),
            'fulfillments' => collect(self::FULFILLMENTS)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'outlets' => Outlet::with('area')->orderBy('code')->get()->map(fn (Outlet $o) => [
                'code' => $o->code, 'name' => $o->name, 'area' => $o->area?->name, 'qr' => url($o->code),
            ]),
            'areas' => Area::withCount('outlets')->orderBy('name')->get()->map(fn (Area $a) => [
                'id' => $a->id, 'name' => $a->name, 'delivery' => (bool) $a->is_delivery_area, 'outlets' => $a->outlets_count,
            ]),
        ]);
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

        return back()->with('status', "Jenis voucher {$voucherType->name} diperbarui.");
    }

    public function destroyType(Request $request, VoucherType $voucherType): RedirectResponse
    {
        ActivityLogger::log('master.voucher_type', 'voucher_type', $voucherType->id, ['action' => 'delete', 'name' => $voucherType->name], $request->user());
        $voucherType->delete();

        return back()->with('status', 'Jenis voucher dihapus.');
    }

    /** Titik baru otomatis mendapat alamat QR (/KODE) dan papan 25 slot A1 sampai E5 dengan kode acak. */
    public function storeOutlet(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'regex:/^[A-Za-z][0-9]{2}$/', 'unique:outlets,code'],
            'name' => ['required', 'string', 'max:80'],
            'area_id' => ['required', 'exists:areas,id'],
        ], ['code.regex' => 'Kode titik: satu huruf dan dua angka, mis. W21.', 'code.unique' => 'Kode titik sudah dipakai.']);
        $code = strtoupper($data['code']);

        $outlet = app(SlotPrizeService::class)->createOutlet($code, $data['name'], (int) $data['area_id']);
        ActivityLogger::log('master.outlet_created', 'outlet', $outlet->id, ['code' => $code], $request->user());

        return back()->with('status', "Titik {$code} ditambahkan dengan 25 slot. Alamat QR: ".url($code));
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
