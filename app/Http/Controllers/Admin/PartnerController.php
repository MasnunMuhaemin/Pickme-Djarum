<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Area;
use App\Models\Outlet;
use App\Models\Partner;
use App\Models\PartnerPayout;
use App\Models\Voucher;
use App\Support\ActivityLogger;
use App\Support\Pin;
use App\Support\Mask;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A5 Mitra dan pembayaran. Rekap mingguan (Senin sampai Minggu) jumlah dan nilai voucher ditukar per mitra.
 * Admin membayar di luar webapp lalu menandai dibayar dengan tanggal dan bukti. Koreksi jumlah wajib beralasan
 * dan hanya sebelum dibayar. Tab Akun mengelola akun, PIN, dan status mitra.
 */
class PartnerController extends Controller
{
    public const TYPES = ['outlet' => 'Warung titik', 'kuota' => 'Mitra kuota', 'umum' => 'Mitra voucher'];

    public function index(Request $request): Response
    {
        $thisWeek = now()->startOfWeek(CarbonInterface::MONDAY);
        $lastWeek = $thisWeek->copy()->subWeek();
        $partners = Partner::with(['area', 'voucherTypes'])->orderBy('name')->get();
        $payouts = PartnerPayout::whereDate('week_start', $lastWeek)->get()->keyBy('partner_id');

        $running = $partners->map(function (Partner $p) use ($thisWeek) {
            [$count, $value] = $this->redeemed($p, $thisWeek, now());

            return ['id' => $p->id, 'name' => $p->name, 'count' => $count, 'value' => $value, 'status' => 'Berjalan'];
        })->values();

        $last = $partners->map(function (Partner $p) use ($lastWeek, $thisWeek, $payouts) {
            $payout = $payouts[$p->id] ?? null;
            [$liveCount, $liveValue] = $this->redeemed($p, $lastWeek, $thisWeek);
            $count = $payout?->redeemed_count ?? $liveCount;

            return [
                'id' => $p->id,
                'name' => $p->name,
                'count' => $count,
                'value' => $payout?->total_value ?? $liveValue,
                'status' => $payout?->status === 'dibayar' ? 'dibayar' : 'menunggu_bayar',
                'paid_at' => $payout?->paid_at?->translatedFormat('d M Y'),
                'proof' => $payout?->proof,
                'correction' => $payout?->correction_reason,
            ];
        })->filter(fn ($row) => $row['count'] > 0 || $row['status'] === 'dibayar')->values();

        return Inertia::render('admin/pembayaran', [
            'weekLabel' => $thisWeek->translatedFormat('d M').' sampai '.$thisWeek->copy()->endOfWeek(CarbonInterface::SUNDAY)->translatedFormat('d M'),
            'lastWeekLabel' => $lastWeek->translatedFormat('d M').' sampai '.$lastWeek->copy()->endOfWeek(CarbonInterface::SUNDAY)->translatedFormat('d M'),
            'running' => $running,
            'last' => $last,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'type' => ['required', Rule::in(array_keys(self::TYPES))],
            // Akun warung terikat ke satu warung titik (PRD keputusan 18); mitra voucher dan kuota tidak punya area.
            'outlet_id' => [Rule::requiredIf($request->input('type') === 'outlet'), 'nullable', 'exists:outlets,id', 'unique:partners,outlet_id'],
            'whatsapp' => ['required', 'regex:/^08[0-9]{8,11}$/'],
        ], [
            'whatsapp.regex' => 'Nomor WhatsApp diawali 08, 10 sampai 13 angka.',
            'outlet_id.required' => 'Pilih warung untuk akun ini.',
            'outlet_id.unique' => 'Warung ini sudah punya akun.',
        ]);
        $data['area_id'] = $data['type'] === 'outlet' ? Outlet::find($data['outlet_id'])->area_id : null;
        if ($data['type'] !== 'outlet') {
            $data['outlet_id'] = null;
        }

        $pin = Pin::generate();
        $partner = Partner::create([...$data, 'pin_hash' => Hash::make($pin), 'status' => 'active']);
        ActivityLogger::log('partner.created', 'partner', $partner->id, ['name' => $partner->name], $request->user());

        return back()->with('status', "Mitra {$partner->name} ditambahkan.")->with('partner_pin', $this->pinFlash($partner, $pin));
    }

    /** PIN baru hanya ditampilkan sekali ke admin; admin tidak pernah bisa melihat PIN lama (PRD 2.1). */
    public function resetPin(Request $request, Partner $partner): RedirectResponse
    {
        $pin = Pin::generate();
        $partner->update(['pin_hash' => Hash::make($pin)]);
        ActivityLogger::log('partner.pin_reset', 'partner', $partner->id, [], $request->user());

        return back()->with('status', "PIN {$partner->name} direset.")->with('partner_pin', $this->pinFlash($partner, $pin));
    }

    /** Ubah nama, nomor WhatsApp, dan jenis mitra. Warung akun warung tidak dipindah dari sini. */
    public function update(Request $request, Partner $partner): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'whatsapp' => ['required', 'regex:/^08[0-9]{8,11}$/'],
            'type' => [Rule::requiredIf($partner->type !== 'outlet'), 'nullable', Rule::in(['umum', 'kuota'])],
        ], ['whatsapp.regex' => 'Nomor WhatsApp diawali 08, 10 sampai 13 angka.']);
        if ($partner->type === 'outlet') {
            unset($data['type']);
        }
        $before = $partner->only(['name', 'whatsapp', 'type']);
        $partner->update($data);
        ActivityLogger::log('partner.updated', 'partner', $partner->id, ['from' => $before, 'to' => $partner->only(['name', 'whatsapp', 'type'])], $request->user());

        return back()->with('status', "Data {$partner->name} diperbarui.");
    }

    public function toggleStatus(Request $request, Partner $partner): RedirectResponse
    {
        $partner->update(['status' => $partner->status === 'active' ? 'inactive' : 'active']);
        ActivityLogger::log('partner.status', 'partner', $partner->id, ['status' => $partner->status], $request->user());

        return back()->with('status', "Status {$partner->name}: ".($partner->status === 'active' ? 'aktif' : 'nonaktif').'.');
    }

    /** PIN baru untuk popup admin, dengan tautan WhatsApp berisi PIN untuk dikirim ke pemilik akun. */
    private function pinFlash(Partner $partner, string $pin): array
    {
        return [
            'name' => $partner->name,
            'pin' => $pin,
            'wa' => Mask::waLink($partner->whatsapp, "Halo {$partner->name}, PIN akun mitra PICKME kamu: {$pin}. Jangan bagikan PIN ke siapa pun."),
        ];
    }

    public function markPaid(Request $request, Partner $partner): RedirectResponse
    {
        $data = $request->validate(
            ['paid_at' => ['required', 'date', 'before_or_equal:today'], 'proof' => ['required', 'string', 'max:120']],
            ['paid_at.required' => 'Isi tanggal bayar.', 'proof.required' => 'Isi bukti bayar (mis. nomor transfer).'],
        );
        $payout = $this->lastWeekPayout($partner);
        abort_if($payout->status === 'dibayar', 422, 'Rekap ini sudah dibayar.');

        $payout->update(['status' => 'dibayar', 'paid_at' => $data['paid_at'], 'proof' => $data['proof']]);
        ActivityLogger::log('payout.paid', 'partner', $partner->id, ['week' => $payout->week_start->toDateString(), 'value' => $payout->total_value, 'proof' => $data['proof']], $request->user());

        return back()->with('status', "Rekap {$partner->name} ditandai dibayar.");
    }

    public function correct(Request $request, Partner $partner): RedirectResponse
    {
        $data = $request->validate(
            ['count' => ['required', 'integer', 'min:0', 'max:10000'], 'reason' => ['required', 'string', 'min:5', 'max:200']],
            ['reason.required' => 'Koreksi wajib beralasan.', 'reason.min' => 'Alasan minimal 5 karakter.'],
        );
        $payout = $this->lastWeekPayout($partner);
        abort_if($payout->status === 'dibayar', 422, 'Rekap yang sudah dibayar tidak bisa dikoreksi.');

        $from = $payout->redeemed_count;
        $payout->update(['redeemed_count' => $data['count'], 'total_value' => $data['count'] * $this->unitValue($partner), 'correction_reason' => $data['reason']]);
        ActivityLogger::log('payout.corrected', 'partner', $partner->id, ['from' => $from, 'to' => $data['count'], 'reason' => $data['reason']], $request->user());

        return back()->with('status', "Rekap {$partner->name} dikoreksi.");
    }

    private function lastWeekPayout(Partner $partner): PartnerPayout
    {
        $thisWeek = now()->startOfWeek(CarbonInterface::MONDAY);
        $lastWeek = $thisWeek->copy()->subWeek();
        [$count, $value] = $this->redeemed($partner, $lastWeek, $thisWeek);

        // whereDate: kolom week_start bisa tersimpan dengan jam (cast date), jadi dicocokkan per tanggal.
        return PartnerPayout::where('partner_id', $partner->id)->whereDate('week_start', $lastWeek)->first()
            ?? PartnerPayout::create([
                'partner_id' => $partner->id,
                'week_start' => $lastWeek->toDateString(),
                'redeemed_count' => $count,
                'total_value' => $value,
                'status' => 'menunggu_bayar',
            ]);
    }

    /** @return array{0: int, 1: int} jumlah dan nilai voucher yang ditukar di mitra dalam rentang waktu */
    private function redeemed(Partner $partner, CarbonInterface $from, CarbonInterface $to): array
    {
        $vouchers = Voucher::where('partner_id', $partner->id)->whereNotNull('redeemed_at')
            ->where('redeemed_at', '>=', $from)->where('redeemed_at', '<', $to)->get();

        return [$vouchers->count(), $vouchers->sum(fn (Voucher $v) => $v->amount())];
    }

    /** Nilai penukaran per voucher: dari jenis voucher mitra di master data, atau nilai voucher bawaan. */
    private function unitValue(Partner $partner): int
    {
        return (int) ($partner->voucherTypes->first()?->value ?? config('participant.prize_values.voucher', 0));
    }
}
