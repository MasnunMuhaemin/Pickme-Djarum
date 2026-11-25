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
        $tab = $request->query('tab') === 'sudah' ? 'sudah' : 'perlu';
        $query = $tab === 'sudah'
            ? Voucher::query()->where('type', 'voucher')->whereNotNull('sent_at')->latest('sent_at')
            : AdminQueues::dispatch()->oldest();

        $rows = $query->with(['claim.participant', 'partner', 'voucherType'])->limit(200)->get()->map(function (Voucher $v) {
            $participant = $v->claim?->participant;
            $value = 'Rp'.number_format($v->amount(), 0, ',', '.');
            $partner = $v->partner?->name ?? $v->voucherType?->partner_label ?? 'Kopi Grosir';
            $kind = $v->voucherType?->name ?? 'Voucher';
            $expires = $v->expires_at?->translatedFormat('d M Y');
            $message = "Halo {$participant?->name}, hadiah PICK(ME) kamu: voucher {$kind} {$value} di {$partner}.\n"
                ."Kode voucher: {$v->code}\n"
                ."Tunjukkan kode ini di {$partner}.".($expires ? " Berlaku sampai {$expires}." : '');

            return [
                'id' => $v->id,
                'name' => $participant?->name ?? '-',
                'whatsapp' => Mask::whatsapp($participant?->whatsapp),
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
            'counts' => ['perlu' => AdminQueues::dispatch()->count()],
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
