<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Outlet;
use App\Models\Setting;
use App\Models\Slot;
use App\Services\SlotPrizeService;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Generator kode unik (desain Master data): membuat slot dan kode 6 karakter untuk semua papan dari stok master data.
 * Dijalankan sekali lalu terkunci; warung baru setelahnya diisi dari sisa stok lewat "Isi papan baru".
 */
class GeneratorController extends Controller
{
    private const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    public function __construct(private SlotPrizeService $prizes) {}

    public function index(): Response
    {
        $stock = $this->prizes->stock();
        $locked = $this->locked();
        $plan = SlotPrizeService::boardPlan($stock['boards'], $stock['merch'], $stock['limited']);
        if ($locked) {
            // Sudah dijalankan: tampilkan isi papan yang sebenarnya, bukan usulan dari master data.
            $byType = Slot::selectRaw('prize_type, count(*) as n')->groupBy('prize_type')->pluck('n', 'prize_type');
            $stock['merch'] = (int) ($byType['merch'] ?? 0);
            $stock['limited'] = (int) ($byType['limited'] ?? 0);
            $stock['voucher'] = (int) $byType->sum() - $stock['merch'] - $stock['limited'];
            $plan = Board::with('slots:id,board_id,prize_type')->orderBy('id')->get()->map(fn (Board $b) => [
                'merch' => $b->slots->where('prize_type', 'merch')->count(),
                'limited' => $b->slots->where('prize_type', 'limited')->count(),
                'voucher' => $b->slots->whereNotIn('prize_type', ['merch', 'limited'])->count(),
            ])->all();
        }
        $outlets = Outlet::orderBy('code')->get();
        $slotCount = Slot::count();
        $uniqueCodes = Slot::distinct()->count('code');

        return Inertia::render('admin/generator', [
            'locked' => $locked,
            'runAt' => Setting::get('generator_run_at'),
            'stock' => $stock,
            'groups' => $this->groups($plan, $locked ? Board::with('outlet')->orderBy('id')->get()->map(fn (Board $b) => $b->outlet?->code ?? $b->code)->all() : $outlets->pluck('code')->all()),
            'checks' => [
                'totalMatches' => $stock['slots'] === $stock['voucher'] + $stock['merch'] + $stock['limited'],
                'boards' => $stock['boards'],
                'outletsActive' => $outlets->where('status', 'active')->count(),
                'outlets' => $outlets->count(),
                'qrTested' => $outlets->whereNotNull('qr_tested_at')->count(),
            ],
            'preview' => $locked ? [] : $this->preview($plan, $outlets->first()?->code ?? 'W01'),
            'result' => ['slots' => $slotCount, 'unique' => $uniqueCodes, 'duplicates' => $slotCount - $uniqueCodes],
            'emptyBoards' => Board::whereDoesntHave('slots')->with('outlet')->get()->map(fn (Board $b) => $b->outlet?->code)->filter()->values(),
            'sampleCodes' => Slot::inRandomOrder()->limit(3)->pluck('code'),
        ]);
    }

    /** Jalankan sekali: isi semua papan kosong, lalu kunci. */
    public function run(Request $request): RedirectResponse
    {
        $request->validate(['confirm' => ['accepted']], ['confirm.accepted' => 'Centang dulu bahwa stok dan warung sudah diperiksa.']);
        if ($this->locked()) {
            return back()->withErrors(['confirm' => 'Generator sudah dijalankan dan terkunci.']);
        }

        $created = DB::transaction(function () use ($request) {
            $created = $this->prizes->fillEmptyBoards();
            Setting::put('generator_run_at', now()->format('d/m/Y H:i'));
            ActivityLogger::log('generator.run', 'settings', null, ['slots' => $created], $request->user());

            return $created;
        });

        return back()->with('status', "Generator selesai: {$created} hadiah dan kode unik dibuat. Generator terkunci.");
    }

    /** Setelah terkunci: isi papan warung baru dari sisa stok. */
    public function fill(Request $request): RedirectResponse
    {
        if (! $this->locked()) {
            return back()->withErrors(['confirm' => 'Jalankan generator dulu.']);
        }
        $created = $this->prizes->fillEmptyBoards();
        ActivityLogger::log('generator.fill', 'settings', null, ['slots' => $created], $request->user());

        return back()->with('status', $created ? "{$created} hadiah dibuat untuk papan baru." : 'Tidak ada papan kosong.');
    }

    /** Terkunci bila pernah dijalankan, atau bila papan sudah berisi sebelum ada generator (data lama). */
    private function locked(): bool
    {
        return (bool) Setting::get('generator_run_at') || Slot::exists();
    }

    /**
     * Ringkasan pembagian: papan dengan isi yang sama dikelompokkan, mis. "W01–W19 · 19 papan".
     *
     * @param  list<array{merch: int, limited: int, voucher: int}>  $plan
     * @param  list<string>  $codes
     */
    private function groups(array $plan, array $codes): array
    {
        $groups = [];
        foreach ($plan as $i => $counts) {
            $last = array_key_last($groups);
            if ($last !== null && $groups[$last]['counts'] === $counts) {
                $groups[$last]['to'] = $codes[$i] ?? $groups[$last]['to'];
                $groups[$last]['boards']++;
            } else {
                $groups[] = ['from' => $codes[$i] ?? 'W'.($i + 1), 'to' => $codes[$i] ?? 'W'.($i + 1), 'boards' => 1, 'counts' => $counts];
            }
        }

        return $groups;
    }

    /** Pratinjau 7 slot pertama papan pertama (belum disimpan; Acak ulang membuat ulang). */
    private function preview(array $plan, string $code): array
    {
        $first = $plan[0] ?? ['merch' => 0, 'limited' => 0, 'voucher' => 25];
        $kinds = array_merge(array_fill(0, $first['merch'], 'Merchandise'), array_fill(0, $first['limited'], 'Limited edition'), array_fill(0, $first['voucher'], 'Voucher'));
        shuffle($kinds);
        $rows = [];
        foreach (array_slice($kinds, 0, 7) as $n => $kind) {
            $rows[] = [
                'board' => $code,
                'position' => chr(65 + intdiv($n, 5)).($n % 5 + 1),
                'kind' => $kind,
                'code' => collect(range(1, 6))->map(fn () => self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)])->implode(''),
            ];
        }

        return $rows;
    }
}
