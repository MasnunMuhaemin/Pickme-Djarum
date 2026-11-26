<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Gift;
use App\Models\Voucher;
use App\Services\RewardCreationService;
use App\Support\ActivityLogger;
use App\Support\AdminQueues;
use App\Support\Mask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A3 Antrean pemenuhan. Tab: Top up (pulsa/kuota diisi admin), Token listrik (Berhasil wajib nomor referensi agregator, Gagal wajib alasan
 * dan menambah hitungan), Bensin tunai (Hubungi lewat WhatsApp lalu Serahkan dengan tanggal dan penerima),
 * Merch dan LE (Kirim lalu Selesai, dengan tanggal). Permintaan yang 3 kali salah tampil di "Perlu bantuan admin".
 */
class FulfillmentController extends Controller
{
    private const TABS = ['topup', 'token', 'bensin', 'barang', 'bantuan'];

    public function index(Request $request): Response
    {
        $max = (int) config('participant.destination_max_failures');
        $with = ['claim.participant', 'claim.outlet', 'voucherType', 'mysteryPrize'];

        $topups = AdminQueues::topups()->with($with)->oldest('updated_at')->get();
        $tokens = Voucher::with($with)->where('type', 'token')
            ->whereIn('status', ['pending_process', 'pending_data', 'rejected'])
            ->orderByRaw("status = 'pending_process' desc")->oldest()->get();
        $fuel = Voucher::with($with)->where('type', 'bensin')
            ->whereIn('status', ['pending', 'contacted', 'handed_over'])
            ->orderByRaw("status = 'handed_over' asc")->oldest()->get();
        $goods = Gift::with('claim.participant', 'claim.outlet')->whereIn('type', AdminQueues::GIFT_TYPES)
            ->whereIn('status', ['pending_address', 'ready_to_ship', 'shipping', 'done'])
            ->orderByRaw("status = 'done' asc")->oldest()->get();
        $help = AdminQueues::needsHelp()->with($with)->oldest()->get();

        $rows = [
            'topup' => $topups->map(fn (Voucher $v) => $this->voucherRow($v, 'topup', $max)),
            'token' => $tokens->map(fn (Voucher $v) => $this->voucherRow($v, 'token', $max)),
            'bensin' => $fuel->map(fn (Voucher $v) => $this->voucherRow($v, 'bensin', $max)),
            'barang' => $goods->map(fn (Gift $g) => $this->giftRow($g)),
            'bantuan' => $help->map(fn (Voucher $v) => $this->voucherRow($v, 'bantuan', $max)),
        ];
        $counts = [
            'topup' => $topups->count(),
            'token' => AdminQueues::tokens()->count(),
            'bensin' => AdminQueues::fuel()->count(),
            'barang' => AdminQueues::goods()->count(),
            'bantuan' => $help->count(),
        ];
        // Tanpa pilihan tab: buka tab pertama yang ada antreannya.
        $tab = in_array($request->query('tab'), self::TABS, true)
            ? $request->query('tab')
            : (collect(self::TABS)->first(fn ($t) => $counts[$t] > 0) ?? 'topup');

        return Inertia::render('admin/pemenuhan', ['tab' => $tab, 'counts' => $counts, 'rows' => $rows]);
    }

    /** Satu baris antrean voucher (top up, token, bensin, perlu bantuan) dalam bentuk yang sama untuk daftar dan detail. */
    private function voucherRow(Voucher $v, string $kind, int $max): array
    {
        $participant = $v->claim?->participant;
        [$label, $done] = match ($v->status) {
            'pending_process' => [$kind === 'token' ? 'Siap diproses' : 'Siap di-top up', false],
            'pending_data' => ['Menunggu nomor', false],
            'rejected' => ['Menunggu isi ulang', false],
            'needs_admin' => ['Perlu bantuan', false],
            'pending' => ['Menunggu dihubungi', false],
            'contacted' => ['Dihubungi', false],
            'handed_over' => ['Diserahkan', true],
            default => [$v->status, true],
        };
        $prize = match (true) {
            (bool) $v->mysteryPrize => "Mystery gift: {$v->mysteryPrize->name}",
            $v->type === 'token' => 'Token listrik',
            $v->type === 'bensin' => 'Bensin tunai',
            default => $v->voucherType?->name ?? 'Pulsa/kuota',
        };
        $message = match ($kind) {
            'bensin' => 'Halo, hadiah bensin tunai PICKME kamu siap diserahkan. Kapan bisa ditemui?',
            'bantuan' => 'Halo, nomor tujuan hadiah PICKME kamu belum berhasil diproses. Boleh kirim nomor yang benar?',
            default => 'Halo, ini admin PICKME soal hadiah kamu.',
        };

        return [
            'key' => "v{$v->id}",
            'id' => $v->id,
            'kind' => $kind,
            'type' => $v->type,
            'name' => $participant?->name ?? '-',
            'whatsapp' => $participant?->whatsapp,
            'prize' => $prize,
            'value' => $this->rupiah($v->amount()),
            'status' => $v->status,
            'label' => $label,
            'done' => $done,
            'at' => $v->updated_at?->format('d/m H:i'),
            'claim' => $v->claim?->claim_code,
            'outlet' => $v->claim?->outlet?->name,
            'destination' => $v->destination,
            'failed' => $v->failed_attempts,
            'max' => $max,
            'fail_reason' => $v->fail_reason,
            'handed' => $v->status === 'handed_over' ? trim(($v->processed_at?->format('d M Y') ?? '').' · '.($v->reference ?? '')) : null,
            'wa' => Mask::waLink($participant?->whatsapp, $message),
        ];
    }

    private function giftRow(Gift $g): array
    {
        $participant = $g->claim?->participant;
        $labels = ['pending_address' => 'Menunggu alamat', 'ready_to_ship' => 'Siap kirim', 'shipping' => 'Diantar', 'done' => 'Selesai'];

        return [
            'key' => "g{$g->id}",
            'id' => $g->id,
            'kind' => 'barang',
            'type' => $g->type,
            'name' => $participant?->name ?? '-',
            'whatsapp' => $participant?->whatsapp,
            'prize' => $g->type === 'limited_edition' ? 'Limited edition' : 'Merchandise',
            'value' => null,
            'status' => $g->status,
            'label' => $labels[$g->status] ?? $g->status,
            'done' => $g->status === 'done',
            'at' => $g->updated_at?->format('d/m H:i'),
            'claim' => $g->claim?->claim_code,
            'outlet' => $g->claim?->outlet?->name,
            'area' => $g->area,
            'address' => $g->address,
            'shipped_at' => $g->shipped_at?->format('d M Y'),
            'completed_at' => $g->completed_at?->format('d M Y'),
            'wa' => Mask::waLink($participant?->whatsapp, 'Halo, ini admin PICKME soal pengiriman hadiahmu.'),
        ];
    }

    /** Pulsa/kuota diisi admin (bukan mitra kuota lagi). */
    public function topupDone(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->isKuota() && $voucher->status === 'pending_process', 422);
        $voucher->update(['status' => 'done', 'processed_at' => now(), 'fail_reason' => null]);
        ActivityLogger::log('voucher.topup_done', 'voucher', $voucher->id, [], $request->user());

        return back()->with('status', 'Top up ditandai selesai.');
    }

    /** Nomor tidak bisa diisi: kembali ke peserta untuk diisi ulang; setelah batas salah perlu bantuan admin. */
    public function topupWrong(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->isKuota() && $voucher->status === 'pending_process', 422);
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:160']]);
        $failed = $voucher->failed_attempts + 1;
        $max = (int) config('participant.destination_max_failures');
        $voucher->update([
            'failed_attempts' => $failed,
            'status' => $failed >= $max ? 'needs_admin' : 'rejected',
            'fail_reason' => ($data['reason'] ?? null) ?: 'Nomor tidak bisa diisi',
        ]);
        ActivityLogger::log('voucher.topup_wrong_number', 'voucher', $voucher->id, ['attempt' => $failed], $request->user());

        return back()->with('status', $failed >= $max ? 'Gagal ke-'.$failed.': masuk Perlu bantuan.' : 'Dikembalikan ke peserta untuk isi ulang nomor.');
    }

    /** Perlu bantuan: admin mendapat nomor yang benar lewat WhatsApp lalu mengembalikannya ke antrean. */
    public function helpResolve(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->status === 'needs_admin', 422);
        $data = $request->validate(
            ['destination' => ['required', 'string', 'regex:/^[0-9]{8,20}$/']],
            ['destination.required' => 'Isi nomor yang benar.', 'destination.regex' => 'Nomor hanya angka, 8 sampai 20 digit.'],
        );
        $voucher->update(['destination' => $data['destination'], 'status' => 'pending_process', 'fail_reason' => null]);
        ActivityLogger::log('voucher.help_resolved', 'voucher', $voucher->id, [], $request->user());

        return back()->with('status', 'Nomor diperbarui. Permintaan kembali ke antrean.');
    }

    public function tokenSuccess(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->type === 'token' && $voucher->status === 'pending_process', 422);
        $data = $request->validate(
            ['reference' => ['required', 'string', 'max:64']],
            ['reference.required' => 'Isi nomor referensi dari agregator dulu.'],
        );

        $voucher->update(['status' => 'sent', 'reference' => $data['reference'], 'processed_at' => now(), 'fail_reason' => null]);
        $this->capFor($voucher->source === 'claim' ? $voucher->claim : null);
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
        $this->capFor($voucher->source === 'claim' ? $voucher->claim : null);
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
        $this->capFor($gift->type === 'merchandise' ? $gift->claim : null);
        ActivityLogger::log('gift.completed', 'gift', $gift->id, [], $request->user());

        return back()->with('status', 'Hadiah ditandai selesai diterima.');
    }

    /** Hadiah klaim selesai diproses admin. Cap sudah dihitung saat klaim, jadi ini hanya pengaman idempoten. */
    private function capFor(?Claim $claim): void
    {
        if ($claim) {
            app(RewardCreationService::class)->grantCap($claim);
        }
    }

    private function person($participant): array
    {
        return ['name' => $participant?->name ?? '-', 'whatsapp' => $participant?->whatsapp];
    }

    private function rupiah(int $value): string
    {
        return 'Rp'.number_format($value, 0, ',', '.');
    }
}
