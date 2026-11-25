<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Setting;
use App\Models\Slot;
use App\Models\VoucherType;
use App\Support\ActivityLogger;
use App\Support\ProgramParameters;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A7 Pengaturan: Tombol darurat di atas (bingkai merah), lalu parameter program bagian 3. Parameter yang bisa
 * diubah tersimpan di settings; tiap perubahan tercatat di log.
 */
class SettingsController extends Controller
{
    public function index(): Response
    {
        $slotsPerBoard = 25;
        $fixed = [
            ['label' => 'Jumlah titik', 'value' => Outlet::count().' warung', 'stored' => 'Master data'],
            ['label' => 'Slot per papan', 'value' => "{$slotsPerBoard} (A1 sampai E5)", 'stored' => 'Tetap'],
            ['label' => 'Total slot', 'value' => (string) Slot::count(), 'stored' => 'Turunan'],
            ['label' => 'Isi slot (skema B)', 'value' => $this->prizeMix(), 'stored' => 'Generator'],
            ['label' => 'Batas klaim harian', 'value' => '2 per nomor per hari (belum diaktifkan selama uji coba)', 'stored' => 'Pengaturan'],
            ['label' => 'Cek foto pertama peserta baru', 'value' => config('participant.flags.first_photo') ? 'Aktif' : 'Nonaktif', 'stored' => 'Pengaturan'],
            ['label' => 'Kartu loyalti', 'value' => '10 cap, mystery gift di cap ke-5', 'stored' => 'Tetap'],
        ];

        $editable = collect(ProgramParameters::editable())->map(fn ($meta, $key) => [
            'key' => $key,
            'label' => $meta['label'],
            'unit' => $meta['unit'],
            'min' => $meta['min'],
            'max' => $meta['max'],
            'note' => $meta['note'] ?? null,
            'value' => (int) config($key),
            'stored' => ProgramParameters::isSaved($key) ? 'Pengaturan' : 'Bawaan',
        ])->values();

        return Inertia::render('admin/pengaturan', [
            'fixed' => $fixed,
            'parameters' => $editable,
            'paused' => Setting::programPaused(),
            'pauseReason' => Setting::get('program_pause_reason'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $meta = ProgramParameters::editable();
        $rules = collect($meta)->mapWithKeys(fn ($m, $key) => [
            'values.'.str_replace('.', '__', $key) => ['required', 'integer', "min:{$m['min']}", "max:{$m['max']}"],
        ])->all();
        $data = $request->validate($rules, ['*.required' => 'Wajib diisi.', '*.integer' => 'Harus angka.', '*.min' => 'Terlalu kecil.', '*.max' => 'Terlalu besar.']);

        $changes = [];
        foreach ($meta as $key => $m) {
            $new = (int) $data['values'][str_replace('.', '__', $key)];
            $old = (int) config($key);
            if ($new !== $old || ! ProgramParameters::isSaved($key)) {
                if ($new !== $old) {
                    $changes[$key] = ['from' => $old, 'to' => $new];
                }
                Setting::put("param.{$key}", $new);
                config([$key => $new]);
            }
        }

        if ($changes) {
            ActivityLogger::log('settings.updated', 'settings', null, $changes, $request->user());
        }

        return back()->with('status', $changes ? count($changes).' parameter diperbarui.' : 'Tidak ada perubahan.');
    }

    private function prizeMix(): string
    {
        $types = VoucherType::sum('quantity');
        $merch = Slot::where('prize_type', 'merch')->count();

        return ($types ?: Slot::where('prize_type', '!=', 'merch')->count())." voucher · {$merch} merchandise";
    }
}
