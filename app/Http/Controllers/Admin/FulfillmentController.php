<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gift;
use App\Models\Voucher;
use App\Support\ActivityLogger;
use App\Support\AdminQueues;
use App\Support\Mask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A3 Antrean pemenuhan. Tiga tab: Token listrik (Berhasil wajib nomor referensi agregator, Gagal wajib alasan
 * dan menambah hitungan), Bensin tunai (Hubungi lewat WhatsApp lalu Serahkan dengan tanggal dan penerima),
 * Merch dan LE (Kirim lalu Selesai, dengan tanggal). Permintaan yang 3 kali salah tampil di "Perlu bantuan admin".
 */
class FulfillmentController extends Controller
{
    public function index(Request $request): Response
    {
        // Tanpa pilihan tab: buka tab pertama yang ada antreannya.
        $tab = in_array($request->query('tab'), ['token', 'bensin', 'barang'], true)
            ? $request->query('tab')
            : (AdminQueues::tokens()->exists() ? 'token' : (AdminQueues::fuel()->exists() ? 'bensin' : (AdminQueues::goods()->exists() ? 'barang' : 'token')));

        $tokens = Voucher::with('claim.participant')->where('type', 'token')
            ->whereIn('status', ['pending_process', 'pending_data', 'rejected'])
            ->orderByRaw("status = 'pending_process' desc")->oldest()->get();
        $fuel = Voucher::with('claim.participant')->where('type', 'bensin')
            ->whereIn('status', ['pending', 'contacted', 'handed_over'])
            ->orderByRaw("status = 'handed_over' asc")->oldest()->get();
        $goods = Gift::with('claim.participant')->whereIn('type', AdminQueues::GIFT_TYPES)
            ->whereIn('status', ['pending_address', 'ready_to_ship', 'shipping', 'done'])
            ->orderByRaw("status = 'done' asc")->oldest()->get();
        $help = AdminQueues::needsHelp()->with('claim.participant')->oldest()->get();

        return Inertia::render('admin/pemenuhan', [
            'tab' => $tab,
            'counts' => [
                'token' => AdminQueues::tokens()->count(),
                'bensin' => AdminQueues::fuel()->count(),
                'barang' => AdminQueues::goods()->count(),
            ],
            'tokens' => $tokens->map(fn (Voucher $v) => [
                ...$this->person($v->claim?->participant),
                'id' => $v->id,
                'value' => $this->rupiah($v->amount()),
                'destination' => $v->destination,
                'failed' => $v->failed_attempts,
                'max' => (int) config('participant.destination_max_failures'),
                'status' => $v->status,
            ]),
            'fuel' => $fuel->map(fn (Voucher $v) => [
                ...$this->person($v->claim?->participant),
                'id' => $v->id,
                'value' => $this->rupiah($v->amount()),
                'status' => $v->status,
                'handed' => $v->status === 'handed_over' ? trim(($v->processed_at?->format('d M Y') ?? '').' · '.($v->reference ?? '')) : null,
                'wa' => Mask::waLink($v->claim?->participant?->whatsapp, 'Halo, hadiah bensin tunai PICKME kamu siap diserahkan. Kapan bisa ditemui?'),
            ]),
            'goods' => $goods->map(fn (Gift $g) => [
                'id' => $g->id,
                'name' => $g->claim?->participant?->name,
                'prize' => $g->type === 'limited_edition' ? 'Limited edition' : 'Merchandise',
                'area' => $g->area,
                'address' => $g->address,
                'status' => $g->status,
                'shipped_at' => $g->shipped_at?->format('d M Y'),
                'completed_at' => $g->completed_at?->format('d M Y'),
            ]),
            'help' => $help->map(fn (Voucher $v) => [
                ...$this->person($v->claim?->participant),
                'id' => $v->id,
                'value' => $this->rupiah($v->amount()),
                'destination' => $v->destination,
                'failed' => $v->failed_attempts,
                'max' => (int) config('participant.destination_max_failures'),
                'wa' => Mask::waLink($v->claim?->participant?->whatsapp, 'Halo, nomor tujuan hadiah PICKME kamu belum berhasil diproses. Boleh kirim nomor meter atau ID pelanggan PLN yang benar?'),
            ]),
        ]);
    }

    public function tokenSuccess(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->type === 'token' && $voucher->status === 'pending_process', 422);
        $data = $request->validate(
            ['reference' => ['required', 'string', 'max:64']],
            ['reference.required' => 'Isi nomor referensi dari agregator dulu.'],
        );

        $voucher->update(['status' => 'sent', 'reference' => $data['reference'], 'processed_at' => now(), 'fail_reason' => null]);
        ActivityLogger::log('token.sent', 'voucher', $voucher->id, ['reference' => $data['reference']], $request->user());

        return back()->with('status', 'Token listrik ditandai berhasil.');
    }

    public function tokenFail(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->type === 'token' && $voucher->status === 'pending_process', 422);
        $data = $request->validate(
            ['reason' => ['required', 'string', 'max:160']],
            ['reason.required' => 'Tulis alasan gagal dulu.'],
        );

        $failed = $voucher->failed_attempts + 1;
        $max = (int) config('participant.destination_max_failures');
        // Peserta mengisi ulang nomor tujuan; setelah batas salah, butuh bantuan admin (PRD FR-16).
        $voucher->update([
            'failed_attempts' => $failed,
            'fail_reason' => $data['reason'],
            'status' => $failed >= $max ? 'needs_admin' : 'rejected',
        ]);
        ActivityLogger::log('token.failed', 'voucher', $voucher->id, ['reason' => $data['reason'], 'failed' => $failed], $request->user());

        return back()->with('status', $failed >= $max ? 'Gagal ke-'.$failed.': masuk daftar perlu bantuan admin.' : 'Token ditandai gagal. Peserta diminta mengisi ulang nomor.');
    }

    public function fuelContact(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->type === 'bensin' && $voucher->status === 'pending', 422);
        $voucher->update(['status' => 'contacted']);
        ActivityLogger::log('fuel.contacted', 'voucher', $voucher->id, [], $request->user());

        return back()->with('status', 'Peserta ditandai sudah dihubungi.');
    }

    public function fuelHandOver(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->type === 'bensin' && in_array($voucher->status, ['pending', 'contacted'], true), 422);
        $data = $request->validate(
            ['date' => ['required', 'date', 'before_or_equal:today'], 'recipient' => ['required', 'string', 'max:80']],
            ['date.required' => 'Isi tanggal serah.', 'recipient.required' => 'Isi nama penerima.'],
        );

        $voucher->update(['status' => 'handed_over', 'processed_at' => $data['date'], 'reference' => $data['recipient']]);
        ActivityLogger::log('fuel.handed_over', 'voucher', $voucher->id, $data, $request->user());

        return back()->with('status', 'Bensin tunai ditandai sudah diserahkan.');
    }

    public function giftShip(Request $request, Gift $gift): RedirectResponse
    {
        abort_unless(in_array($gift->type, AdminQueues::GIFT_TYPES, true) && $gift->status === 'ready_to_ship', 422);
        $gift->update(['status' => 'shipping', 'shipped_at' => now()]);
        ActivityLogger::log('gift.shipped', 'gift', $gift->id, [], $request->user());

        return back()->with('status', 'Hadiah ditandai sedang dikirim.');
    }

    public function giftDone(Request $request, Gift $gift): RedirectResponse
    {
        abort_unless(in_array($gift->type, AdminQueues::GIFT_TYPES, true) && $gift->status === 'shipping', 422);
        $gift->update(['status' => 'done', 'completed_at' => now()]);
        ActivityLogger::log('gift.completed', 'gift', $gift->id, [], $request->user());

        return back()->with('status', 'Hadiah ditandai selesai diterima.');
    }

    private function person($participant): array
    {
        return ['name' => $participant?->name ?? '-', 'whatsapp' => Mask::whatsapp($participant?->whatsapp)];
    }

    private function rupiah(int $value): string
    {
        return 'Rp'.number_format($value, 0, ',', '.');
    }
}
