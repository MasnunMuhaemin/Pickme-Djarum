<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gift;
use App\Models\MysteryAccess;
use App\Models\MysteryPrize;
use App\Models\Participant;
use App\Models\Partner;
use App\Models\Setting;
use App\Models\Voucher;
use App\Support\ActivityLogger;
use App\Support\Mask;
use App\Support\RewardPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Mystery gift (desain admin): saklar aktif, peluang mendapat, isi hadiah beserta stok, penerima dan aksi
 * penyelesaiannya, serta akun yang boleh atau diblokir mendapat mystery gift.
 */
class MysteryGiftController extends Controller
{
    public function index(): Response
    {
        $packs = Gift::with(['claim.participant', 'mysteryPrize'])->where('type', 'mystery_pack')->get()->map(fn (Gift $g) => [
            'key' => "g{$g->id}",
            'id' => $g->id,
            'action' => in_array($g->status, ['done', 'completed', 'cancelled'], true) ? null : 'ambil',
            'at' => $g->created_at,
            'participant' => $g->claim?->participant,
            'prize' => $g->mysteryPrize?->name ?? 'Produk gratis',
            'fulfillment' => 'Ambil di titik',
            'label' => RewardPresenter::gift($g)['status_label'],
            'done' => in_array($g->status, ['done', 'completed'], true),
        ]);
        $vouchers = Voucher::with(['claim.participant', 'voucherType', 'mysteryPrize', 'partner'])->where('source', 'mystery')->get()->map(fn (Voucher $v) => [
            'key' => "v{$v->id}",
            'id' => $v->id,
            'action' => match (true) {
                $v->type === 'digital' && $v->status === 'pending_process' => 'kode',
                $v->isKuota() && $v->status === 'pending_process' => 'topup',
                default => null,
            },
            'at' => $v->created_at,
            'participant' => $v->claim?->participant,
            'prize' => $v->mysteryPrize?->name ?? RewardPresenter::voucher($v)['title'],
            'fulfillment' => MysteryPrize::FULFILLMENTS[$v->mysteryPrize?->fulfillment] ?? ($v->partner ? "Tukar di {$v->partner->name}" : 'Voucher'),
            'label' => RewardPresenter::voucher($v)['status_label'],
            'done' => in_array($v->status, ['redeemed', 'done', 'handed_over'], true) || ($v->type === 'digital' && $v->status === 'sent'),
        ]);

        $rows = $packs->concat($vouchers)->sortByDesc('at')->values()->map(fn ($r) => [
            ...collect($r)->except(['participant', 'at'])->all(),
            'at' => $r['at']?->format('d/m H:i'),
            'name' => $r['participant']?->name ?? '-',
            'whatsapp' => $r['participant']?->whatsapp,
            'wa' => Mask::waLink($r['participant']?->whatsapp, 'Halo '.($r['participant']?->name ?? '').', ini admin PICKME soal mystery gift kamu.'),
        ]);
        $prizes = MysteryPrize::with('partner')->orderBy('id')->get();

        return Inertia::render('admin/mystery-gift', [
            'enabled' => (bool) Setting::get('mystery_enabled', true),
            'chance' => (int) config('participant.mystery_voucher_chance'),
            'audience' => Setting::get('mystery_audience', 'all'),
            'rows' => $rows,
            'prizes' => $prizes->map(fn (MysteryPrize $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'fulfillment' => $p->fulfillment,
                'fulfillment_label' => MysteryPrize::FULFILLMENTS[$p->fulfillment] ?? $p->fulfillment,
                'partner_id' => $p->partner_id,
                'partner' => $p->partner?->name,
                'value' => $p->value,
                'stock' => $p->stock,
                'given' => $p->given,
                'active' => $p->active,
            ]),
            'partners' => Partner::where('type', '!=', 'outlet')->orderBy('name')->get(['id', 'name']),
            'access' => MysteryAccess::with('user')->latest()->get()->map(fn (MysteryAccess $a) => [
                'id' => $a->id,
                'whatsapp' => $a->whatsapp,
                'kind' => $a->kind,
                'name' => Participant::where('whatsapp', $a->whatsapp)->value('name'),
                'by' => $a->user?->name,
                'at' => $a->created_at?->format('d/m'),
            ]),
            'stats' => [
                'total' => $rows->count(),
                'vouchers' => $vouchers->count(),
                'packs' => $packs->count(),
                'waiting' => $rows->where('done', false)->count(),
                'done' => $rows->where('done', true)->count(),
                'stockLeft' => $prizes->sum(fn (MysteryPrize $p) => $p->remaining()),
                'stockTotal' => $prizes->sum('stock'),
            ],
        ]);
    }

    public function toggle(Request $request): RedirectResponse
    {
        $enabled = ! (bool) Setting::get('mystery_enabled', true);
        Setting::put('mystery_enabled', $enabled ? 1 : 0);
        ActivityLogger::log('mystery.toggled', 'settings', null, ['enabled' => $enabled], $request->user());

        return back()->with('status', $enabled ? 'Mystery gift diaktifkan.' : 'Mystery gift dimatikan.');
    }

    /** Peluang peserta mendapat mystery gift saat mencapai cap ke-5. */
    public function chance(Request $request): RedirectResponse
    {
        $data = $request->validate(['chance' => ['required', 'integer', 'min:0', 'max:100']]);
        $from = (int) config('participant.mystery_voucher_chance');
        Setting::put('param.participant.mystery_voucher_chance', $data['chance']);
        ActivityLogger::log('settings.updated', 'settings', null, ['participant.mystery_voucher_chance' => ['from' => $from, 'to' => $data['chance']]], $request->user());

        return back()->with('status', "Peluang mendapat mystery gift diubah menjadi {$data['chance']}%.");
    }

    public function storePrize(Request $request): RedirectResponse
    {
        $prize = MysteryPrize::create($this->validatedPrize($request));
        ActivityLogger::log('mystery.prize_created', 'settings', null, ['name' => $prize->name, 'stock' => $prize->stock], $request->user());

        return back()->with('status', "Hadiah {$prize->name} ditambahkan.");
    }

    public function updatePrize(Request $request, MysteryPrize $prize): RedirectResponse
    {
        $data = $this->validatedPrize($request);
        if ($data['stock'] < $prize->given) {
            return back()->withErrors(['stock' => "Stok tidak boleh kurang dari yang sudah keluar ({$prize->given})."]);
        }
        $prize->update($data);
        ActivityLogger::log('mystery.prize_updated', 'settings', null, ['name' => $prize->name, 'stock' => $prize->stock], $request->user());

        return back()->with('status', "Hadiah {$prize->name} diperbarui.");
    }

    public function togglePrize(Request $request, MysteryPrize $prize): RedirectResponse
    {
        $prize->update(['active' => ! $prize->active]);
        ActivityLogger::log('mystery.prize_toggled', 'settings', null, ['name' => $prize->name, 'active' => $prize->active], $request->user());

        return back();
    }

    /** Voucher digital: admin mengisi kode, peserta menerima lewat WhatsApp. */
    public function sendCode(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->source === 'mystery' && $voucher->type === 'digital' && $voucher->status === 'pending_process', 422);
        $data = $request->validate(['code' => ['required', 'string', 'max:120']], ['code.required' => 'Isi kode voucher dari penyedia.']);
        $voucher->update(['reference' => trim($data['code']), 'status' => 'sent', 'sent_at' => now(), 'processed_at' => now()]);
        ActivityLogger::log('mystery.code_sent', 'voucher', $voucher->id, [], $request->user());

        $participant = $voucher->claim?->participant;
        $wa = Mask::waLink($participant?->whatsapp, "Halo {$participant?->name}, ini kode mystery gift {$voucher->mysteryPrize?->name} kamu: {$voucher->reference}");

        return back()->with('status', 'Kode tersimpan. Kirim ke peserta lewat WhatsApp.')->with('mystery_wa', $wa);
    }

    /** Pulsa/kuota mystery gift: admin sudah mengisi ke nomor peserta. */
    public function topupDone(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->source === 'mystery' && $voucher->isKuota() && $voucher->status === 'pending_process', 422);
        $voucher->update(['status' => 'done', 'processed_at' => now()]);
        ActivityLogger::log('mystery.topup_done', 'voucher', $voucher->id, [], $request->user());

        return back()->with('status', 'Top up ditandai selesai.');
    }

    /** Produk gratis: tandai sudah diambil di titik. */
    public function packDone(Request $request, Gift $gift): RedirectResponse
    {
        abort_unless($gift->type === 'mystery_pack' && ! in_array($gift->status, ['done', 'completed', 'cancelled'], true), 422);
        $gift->update(['status' => 'done', 'completed_at' => now()]);
        ActivityLogger::log('mystery.pack_done', 'gift', $gift->id, [], $request->user());

        return back()->with('status', 'Hadiah ditandai sudah diambil.');
    }

    /** Siapa yang bisa dapat: semua peserta, atau hanya akun di daftar izin. */
    public function audience(Request $request): RedirectResponse
    {
        $data = $request->validate(['audience' => ['required', Rule::in(['all', 'list'])]]);
        Setting::put('mystery_audience', $data['audience']);
        ActivityLogger::log('mystery.audience', 'settings', null, $data, $request->user());

        return back()->with('status', $data['audience'] === 'all' ? 'Semua peserta bisa mendapat mystery gift.' : 'Hanya akun di daftar izin yang bisa mendapat mystery gift.');
    }

    public function storeAccess(Request $request): RedirectResponse
    {
        $request->merge(['whatsapp' => preg_replace('/\D/', '', (string) $request->input('whatsapp'))]);
        $data = $request->validate(
            ['whatsapp' => ['required', 'regex:/^08[0-9]{8,11}$/'], 'kind' => ['required', Rule::in(['allow', 'block'])]],
            ['whatsapp.regex' => 'Nomor WhatsApp diawali 08, 10 sampai 13 angka.'],
        );
        MysteryAccess::updateOrCreate(['whatsapp' => $data['whatsapp']], ['kind' => $data['kind'], 'user_id' => $request->user()->id]);
        ActivityLogger::log('mystery.access', 'settings', null, $data, $request->user());

        return back()->with('status', $data['kind'] === 'block' ? 'Nomor diblokir dari mystery gift.' : 'Nomor ditambahkan ke daftar izin.');
    }

    public function destroyAccess(Request $request, MysteryAccess $access): RedirectResponse
    {
        $access->delete();
        ActivityLogger::log('mystery.access_removed', 'settings', null, ['whatsapp' => $access->whatsapp], $request->user());

        return back()->with('status', 'Nomor dihapus dari daftar.');
    }

    private function validatedPrize(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'fulfillment' => ['required', Rule::in(array_keys(MysteryPrize::FULFILLMENTS))],
            'partner_id' => [Rule::requiredIf($request->input('fulfillment') === 'mitra'), 'nullable', 'exists:partners,id'],
            'value' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'stock' => ['required', 'integer', 'min:0', 'max:100000'],
        ], [
            'name.required' => 'Isi nama hadiah.',
            'partner_id.required' => 'Pilih mitra tempat voucher ditukar.',
            'stock.required' => 'Isi stok.',
        ]) + ['value' => (int) $request->input('value', 0)];
    }
}
