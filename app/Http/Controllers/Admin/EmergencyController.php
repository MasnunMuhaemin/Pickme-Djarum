<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Setting;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Tombol Darurat (PRD bagian 9 dan A7): jeda seluruh program atau satu titik. Jeda wajib beralasan, konfirmasi dua
 * langkah, dan tercatat di log. Peserta melihat halaman dijeda; klaim yang sedang berjalan tidak hilang;
 * penukaran di mitra tetap berjalan.
 */
class EmergencyController extends Controller
{
    public function pause(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'scope' => ['required', Rule::in(['program', 'outlet'])],
            'outlet_id' => ['required_if:scope,outlet', 'nullable', 'exists:outlets,id'],
            'reason' => ['required', 'string', 'min:5', 'max:200'],
            'confirm' => ['accepted'],
        ], [
            'reason.required' => 'Tulis alasan jeda.',
            'reason.min' => 'Alasan minimal 5 karakter.',
            'confirm.accepted' => 'Centang "Saya mengerti dampaknya" dulu.',
            'outlet_id.required_if' => 'Pilih titik yang dijeda.',
        ]);

        if ($data['scope'] === 'program') {
            Setting::put('program_paused', 1);
            Setting::put('program_pause_reason', $data['reason']);
            ActivityLogger::log('program.paused', 'program', null, ['reason' => $data['reason']], $request->user());

            return back()->with('status', 'Seluruh program dijeda.');
        }

        $outlet = Outlet::findOrFail($data['outlet_id']);
        $outlet->update(['status' => 'paused']);
        ActivityLogger::log('outlet.paused', 'outlet', $outlet->id, ['code' => $outlet->code, 'reason' => $data['reason']], $request->user());

        return back()->with('status', "Titik {$outlet->code} dijeda.");
    }

    public function resume(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'scope' => ['required', Rule::in(['program', 'outlet'])],
            'outlet_id' => ['required_if:scope,outlet', 'nullable', 'exists:outlets,id'],
        ]);

        if ($data['scope'] === 'program') {
            Setting::put('program_paused', 0);
            Setting::put('program_pause_reason', null);
            ActivityLogger::log('program.resumed', 'program', null, [], $request->user());

            return back()->with('status', 'Program berjalan lagi.');
        }

        $outlet = Outlet::findOrFail($data['outlet_id']);
        $outlet->update(['status' => 'active']);
        ActivityLogger::log('outlet.resumed', 'outlet', $outlet->id, ['code' => $outlet->code], $request->user());

        return back()->with('status', "Titik {$outlet->code} berjalan lagi.");
    }
}
