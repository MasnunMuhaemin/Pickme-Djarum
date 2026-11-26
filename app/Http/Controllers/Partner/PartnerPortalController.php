<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\PartnerPayout;
use App\Models\Slot;
use App\Models\Voucher;
use App\Services\PhotoService;
use App\Services\RewardCreationService;
use App\Support\ActivityLogger;
use App\Support\RewardPresenter;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Halaman mitra (PRD bagian 12): M2 cek dan tukar kode (lalu foto bukti),
 * M4 rekap mingguan. Mitra hanya melihat voucher miliknya dan nama depan penukar.
 */
class PartnerPortalController extends Controller
{
    public function __construct(private PhotoService $photos) {}

    /**
     * Cek kode. Hasil yang tidak bisa ditukar dan "Voucher sudah ditukar" tampil sebagai popup di atas layar ini
     * (dibawa lewat session flash), bukan halaman tersendiri.
     */
    public function check(Request $request): Response
    {
        return Inertia::render('partner/cek', [
            'result' => $request->session()->get('mitra_check'),
            'redeemed' => $request->session()->get('mitra_redeemed'),
        ]);
    }

    public function lookup(Request $request): RedirectResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:30']], ['code.required' => 'Isi kode dari peserta.']);
        $code = RewardCreationService::normalizeCode($data['code']);

        if ($code === '') {
            return back()->withErrors(['code' => 'Isi kode dari peserta.']);
        }

        return $this->state($this->partner($request), $code)[0] === 'valid' ? to_route('mitra.kode', $code) : $this->refused($request, $code);
    }

    /** Kode valid: kartu voucher dengan tombol Tukar sekarang. Kode lain kembali ke Cek kode dengan popup alasannya. */
    public function result(Request $request, string $code): Response|RedirectResponse
    {
        [$state, $voucher] = $this->state($this->partner($request), $code);
        if ($state !== 'valid') {
            return $this->refused($request, $code);
        }

        return Inertia::render('partner/kode', ['code' => $code, 'voucher' => $this->card($voucher)]);
    }

    /** Kembali ke Cek kode dengan popup alasan tidak bisa ditukar. */
    private function refused(Request $request, string $code): RedirectResponse
    {
        return to_route('mitra.cek')->with('mitra_check', ['state' => $this->state($this->partner($request), $code)[0], 'code' => $code]);
    }

    /** Tukar bersifat final di sisi mitra dan hanya sekali (PRD bagian 8). */
    public function redeem(Request $request, string $code): RedirectResponse
    {
        $partner = $this->partner($request);
        $redeemed = DB::transaction(function () use ($partner, $code) {
            $voucher = Voucher::where('code', $code)->lockForUpdate()->first();
            if ($this->state($partner, $code, $voucher)[0] !== 'valid') {
                return false;
            }
            $voucher->update(['status' => 'redeemed', 'redeemed_at' => now()]);
            ActivityLogger::log('voucher.redeemed', 'voucher', $voucher->id, [], $partner);

            return true;
        });

        // Berhasil: popup "Voucher sudah ditukar" dengan tombol Foto bukti di atas Cek kode.
        return $redeemed
            ? to_route('mitra.cek')->with('mitra_redeemed', $this->card(Voucher::where('code', $code)->first()))
            : $this->refused($request, $code);
    }

    public function redeemed(Request $request, string $code): Response|RedirectResponse
    {
        $voucher = $this->mine($request, $code);

        return $voucher ? Inertia::render('partner/ditukar', ['voucher' => $this->card($voucher)]) : to_route('mitra.cek');
    }

    public function photo(Request $request, string $code): Response|RedirectResponse
    {
        $voucher = $this->mine($request, $code);

        return $voucher
            ? Inertia::render('partner/foto', [
                'voucher' => $this->card($voucher),
                'openedAt' => now()->format('d/m/Y H:i:s'),
                'adminWhatsapp' => config('participant.admin_whatsapp'),
            ])
            : to_route('mitra.cek');
    }

    public function storePhoto(Request $request, string $code): RedirectResponse
    {
        $voucher = $this->mine($request, $code);
        if (! $voucher) {
            return to_route('mitra.cek');
        }
        $request->validate(
            ['photo' => ['required', 'image', 'max:8192']],
            ['photo.required' => 'Ambil foto dulu.', 'photo.image' => 'File harus berupa foto.', 'photo.max' => 'Foto terlalu besar.'],
        );

        $voucher->update(['proof_path' => $this->photos->storeProof($voucher, $request->file('photo')), 'proof_at' => now()]);
        ActivityLogger::log('voucher.proof_saved', 'voucher', $voucher->id, [], $this->partner($request));

        return to_route('mitra.selesai', $code);
    }

    public function done(Request $request, string $code): Response
    {
        return Inertia::render('partner/selesai', ['code' => $code]);
    }

    /**
     * M4: minggu ini berjalan, lalu semua minggu sebelumnya sejak mitra mulai (minimal tiga), terbaru di atas.
     * Halaman menyaring per bulan supaya daftar tetap ringkas saat minggunya bertambah. Mitra hanya melihat angka.
     */
    public function recap(Request $request): Response
    {
        $partner = $this->partner($request);
        $thisWeek = CarbonImmutable::now()->startOfWeek(CarbonInterface::MONDAY);
        $firstRedeemed = Voucher::where('partner_id', $partner->id)->min('redeemed_at');
        $start = (collect([$partner->created_at, $firstRedeemed])->filter()->map(fn ($d) => CarbonImmutable::parse($d))->min() ?? $thisWeek)
            ->startOfWeek(CarbonInterface::MONDAY);
        // shortcut: dua query per minggu, dibatasi 52 minggu; hitung sekali per minggu (group by) bila program lebih dari setahun.
        $weeks = max(3, min(52, (int) round($start->diffInWeeks($thisWeek))));

        return Inertia::render('partner/rekap', [
            'current' => $this->week($partner, $thisWeek),
            'previous' => collect(range(1, $weeks))->map(fn (int $n) => $this->week($partner, $thisWeek->subWeeks($n)))->all(),
        ]);
    }

    public function weekDetail(Request $request, string $week): Response
    {
        $partner = $this->partner($request);
        $start = CarbonImmutable::parse($week)->startOfWeek(CarbonInterface::MONDAY);
        $rows = $this->redemptions($partner, $start, $start->addWeek());

        return Inertia::render('partner/rekap-minggu', [
            'week' => $this->week($partner, $start),
            'rows' => $rows,
        ]);
    }

    public function detail(Request $request, string $code): Response|RedirectResponse
    {
        $voucher = $this->mine($request, $code);
        if (! $voucher) {
            return to_route('mitra.rekap');
        }

        return Inertia::render('partner/rincian-tukar', [
            'voucher' => [
                ...$this->card($voucher),
                // Nama voucher seperti di desain: nama mitra penukar (mis. Kopi Groei), bukan kategori jenis voucher.
                'voucher_name' => $voucher->partner?->name ?? $voucher->voucherType?->name ?? '-',
                'redeemed_at' => $voucher->redeemed_at?->format('d/m/Y H:i').' WIB',
                // Tombol kembali ke rincian minggu tempat penukaran ini.
                'week' => $voucher->redeemed_at?->startOfWeek(CarbonInterface::MONDAY)->toDateString(),
                'status_label' => $voucher->isKuota() ? 'Top up selesai' : 'Ditukar',
                'photo_url' => $voucher->proof_path ? route('mitra.bukti', $voucher->code) : null,
                'kuota' => $voucher->isKuota(),
            ],
        ]);
    }

    public function proofImage(Request $request, string $code): StreamedResponse
    {
        $voucher = $this->mine($request, $code);
        abort_unless($voucher?->proof_path && Storage::disk('local')->exists($voucher->proof_path), 404);

        return Storage::disk('local')->response($voucher->proof_path, headers: ['Cache-Control' => 'private, max-age=300']);
    }

    /**
     * @return array{0: string, 1: ?Voucher}
     */
    private function state(Partner $partner, string $code, ?Voucher $voucher = null): array
    {
        $voucher ??= Voucher::where('code', $code)->first();
        if (! $voucher) {
            // Kode sudah disiapkan di slot tapi belum diklaim peserta.
            return [Slot::where('voucher_code', $code)->exists() ? 'not_ready' : 'unknown', null];
        }
        // Token, bensin, dan pulsa/kuota tidak ditukar dengan kode di mitra.
        if ($voucher->type !== 'voucher' || $voucher->isKuota()) {
            return ['unknown', null];
        }
        if ($voucher->partner_id !== $partner->id) {
            return ['not_mine', null];
        }

        return match ($voucher->status) {
            'redeemed' => ['redeemed', null],
            'cancelled' => ['cancelled', null],
            'sent' => ['valid', $voucher],
            default => ['not_ready', null],
        };
    }

    private function card(Voucher $voucher): array
    {
        $kind = $voucher->voucherType;

        return [
            'code' => $voucher->code,
            'title' => $kind ? RewardPresenter::voucherTitle($kind->name) : 'Voucher',
            'value' => RewardPresenter::rupiah($voucher->amount()),
            // Mitra hanya melihat nama depan penukar (PRD bagian 12).
            'holder' => str($voucher->claim?->participant?->name ?? '-')->trim()->before(' ')->value(),
        ];
    }

    /** Voucher milik mitra ini yang sudah ditukar (atau top up selesai). */
    private function mine(Request $request, string $code): ?Voucher
    {
        return Voucher::where('code', $code)->where('partner_id', $this->partner($request)->id)
            ->whereIn('status', ['redeemed', 'done'])->whereNotNull('redeemed_at')->first();
    }

    /** Ringkasan satu minggu Senin sampai Minggu; minggu yang sudah direkap admin memakai angka rekapnya. */
    private function week(Partner $partner, CarbonImmutable $start): array
    {
        $vouchers = $this->redeemedBetween($partner, $start, $start->addWeek());
        $payout = PartnerPayout::where('partner_id', $partner->id)->whereDate('week_start', $start)->first();
        $isCurrent = $start->equalTo(CarbonImmutable::now()->startOfWeek(CarbonInterface::MONDAY));
        $weeksAgo = (int) round($start->diffInWeeks(CarbonImmutable::now()->startOfWeek(CarbonInterface::MONDAY)));

        return [
            'key' => $start->toDateString(),
            'range' => $this->date($start).' - '.$this->date($start->addDays(6)).' '.$start->addDays(6)->year,
            'label' => ['Minggu ini', 'Minggu lalu', 'Dua minggu lalu', 'Tiga minggu lalu'][$weeksAgo]
                ?? $this->date($start).' - '.$this->date($start->addDays(6)).' '.$start->addDays(6)->year,
            // Filter bulan di halaman rekap (bulan tempat minggu itu dimulai).
            'month' => $start->format('Y-m'),
            'month_label' => ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][$start->month - 1].' '.$start->year,
            'count' => $payout?->redeemed_count ?? $vouchers->count(),
            'value' => RewardPresenter::rupiah($payout?->total_value ?? $vouchers->sum(fn (Voucher $v) => $v->amount())),
            'photos' => $vouchers->whereNotNull('proof_path')->count(),
            'redeemed' => $vouchers->count(),
            'status' => $isCurrent ? 'berjalan' : ($payout?->status === 'dibayar' ? 'dibayar' : 'menunggu_bayar'),
            'paid_at' => $payout?->paid_at ? $this->day($payout->paid_at).', '.$payout->paid_at->format('d/m/Y') : null,
            'proof' => $payout?->proof,
        ];
    }

    private function redemptions(Partner $partner, CarbonImmutable $from, CarbonImmutable $to): array
    {
        return $this->redeemedBetween($partner, $from, $to)->sortByDesc('redeemed_at')->values()->map(fn (Voucher $v) => [
            ...$this->card($v),
            'at' => $this->day($v->redeemed_at).' '.$v->redeemed_at->format('H:i'),
            'has_photo' => (bool) $v->proof_path,
            'kuota' => $v->isKuota(),
        ])->all();
    }

    private function redeemedBetween(Partner $partner, CarbonInterface $from, CarbonInterface $to)
    {
        return Voucher::with(['voucherType', 'claim.participant'])->where('partner_id', $partner->id)->whereNotNull('redeemed_at')
            ->where('redeemed_at', '>=', $from)->where('redeemed_at', '<', $to)->get();
    }

    private function day(CarbonInterface $date): string
    {
        return ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][$date->dayOfWeek];
    }

    /** Tanggal pendek berbahasa Indonesia, mis. "24 Nov" (locale aplikasi masih en). */
    private function date(CarbonInterface $date): string
    {
        return $date->day.' '.['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][$date->month - 1];
    }

    private function partner(Request $request): Partner
    {
        return Partner::findOrFail($request->session()->get('partner_id'));
    }
}
