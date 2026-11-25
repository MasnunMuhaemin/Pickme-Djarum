<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Support\ActivityLogger;
use App\Support\AdminQueues;
use App\Support\Mask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kirim voucher mitra ke peserta lewat WhatsApp. Tombol membuka WhatsApp dengan pesan terisi; status berubah
 * menjadi terkirim setelah admin menandai, atas nama akunnya. (Usulan prototype, belum ada di PRD A1 sampai A8.)
 */
class VoucherDispatchController extends Controller
{
    public function index(Request $request): Response
    {
        // Satu daftar: yang belum dikirim tetap di atas (terlama dulu), yang sudah dikirim tetap tampil di bawahnya
        // supaya admin bisa melihat keduanya. Saringan hanya mempersempit daftar, tidak menghilangkan riwayat.
        $tab = in_array($request->query('tab'), ['perlu', 'sudah'], true) ? $request->query('tab') : 'semua';
        $all = Voucher::query()->where('type', 'voucher')->whereIn('status', ['sent', 'redeemed']);
        $query = (clone $all)
            ->when($tab === 'perlu', fn ($q) => $q->whereNull('sent_at'))
            ->when($tab === 'sudah', fn ($q) => $q->whereNotNull('sent_at'))
            ->orderByRaw('sent_at is not null')
            ->orderByRaw('case when sent_at is null then created_at end asc')
            ->orderByDesc('sent_at');

        $rows = $query->with(['claim.participant', 'partner', 'voucherType'])->limit(300)->get()->map(function (Voucher $v) {
            $participant = $v->claim?->participant;
            $value = 'Rp'.number_format($v->amount(), 0, ',', '.');
            $partner = $v->partner?->name ?? $v->voucherType?->partner_label ?? 'Kopi Grosir';
            $kind = $v->voucherType?->name ?? 'Voucher';
            $message = "Halo {$participant?->name}, hadiah PICK(ME) kamu: voucher {$kind} {$value} di {$partner}.\n"
                ."Kode voucher: {$v->code}\n"
                ."Tunjukkan kode ini di {$partner}.";

            return [
                'id' => $v->id,
                'name' => $participant?->name ?? '-',
                'whatsapp' => $participant?->whatsapp,
                'partner' => $partner,
                'kind' => $kind,
                'value' => $value,
                'code' => $v->code,
                'sent_at' => $v->sent_at?->format('d M H:i'),
                'message' => $message,
                'wa' => Mask::waLink($participant?->whatsapp, $message),
            ];
        });

        return Inertia::render('admin/kirim-voucher', [
            'tab' => $tab,
            'counts' => [
                'perlu' => AdminQueues::dispatch()->count(),
                'sudah' => (clone $all)->whereNotNull('sent_at')->count(),
            ],
            'rows' => $rows,
        ]);
    }

    public function markSent(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_unless($voucher->type === 'voucher' && ! $voucher->sent_at, 422);
        $voucher->update(['sent_at' => now()]);
        ActivityLogger::log('voucher.sent_whatsapp', 'voucher', $voucher->id, ['code' => $voucher->code], $request->user());

        return back()->with('status', "Voucher {$voucher->code} ditandai terkirim.");
    }
}
