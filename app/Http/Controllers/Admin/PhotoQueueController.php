<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Outlet;
use App\Support\ActivityLogger;
use App\Support\ClaimFlags;
use Illuminate\Http\RedirectResponse;
use App\Support\Mask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A2 Foto klaim: klaim langsung berhasil tanpa persetujuan admin, jadi halaman ini hanya menampilkan foto bungkus
 * tiap klaim (terbaru dulu) beserta rinciannya.
 */
class PhotoQueueController extends Controller
{
    public function index(Request $request): Response
    {
        $outlet = strtoupper((string) $request->query('warung'));
        $search = trim((string) $request->query('q'));
        $claims = Claim::query()
            ->whereHas('photo')
            ->where('status', 'approved')
            ->when($outlet, fn ($q) => $q->whereHas('outlet', fn ($o) => $o->where('code', $outlet)))
            // Cari nama atau nomor peserta, kode klaim, dan kode voucher.
            ->when($search, fn ($q) => $q->where(fn ($w) => $w->where('claim_code', 'like', "%{$search}%")
                ->orWhereHas('participant', fn ($p) => $p->where('name', 'like', "%{$search}%")
                    ->when(preg_replace('/\D/', '', $search), fn ($p, $digits) => $p->orWhere('whatsapp', 'like', "%{$digits}%")))
                ->orWhereHas('voucher', fn ($v) => $v->where('code', 'like', '%'.strtoupper(preg_replace('/[\s-]+/', '', $search)).'%'))))
            ->with(['participant', 'outlet', 'slot', 'photo', 'voucher.voucherType', 'gifts'])
            ->latest('submitted_at')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('admin/antrean-foto', [
            'photos' => collect($claims->items())->map(fn (Claim $claim) => $this->detail($claim)),
            'pagination' => ['current' => $claims->currentPage(), 'last' => $claims->lastPage(), 'total' => $claims->total()],
            'outlets' => Outlet::orderBy('code')->pluck('code'),
            'outlet' => $outlet ?: null,
            'search' => $search,
        ]);
    }

    public function photo(Claim $claim): StreamedResponse
    {
        $path = $claim->photo?->path;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }

    /** Hapus foto bungkus (file dan catatannya). Klaim dan hadiahnya tetap; penghapusan tercatat di log. */
    public function destroyPhoto(Request $request, Claim $claim): RedirectResponse
    {
        $photo = $claim->photo;
        abort_unless($photo, 404);
        Storage::disk('local')->delete($photo->path);
        $photo->delete();
        ActivityLogger::log('claim.photo_deleted', 'claim', $claim->id, ['claim_code' => $claim->claim_code], $request->user());

        return back()->with('status', "Foto klaim {$claim->claim_code} dihapus.");
    }

    private function detail(Claim $claim): array
    {
        $participant = $claim->participant;
        $approved = $participant?->claims()->where('status', 'approved')->count() ?? 0;

        return [
            'id' => $claim->id,
            'claim_code' => $claim->claim_code,
            'status' => $claim->status,
            'outlet' => $claim->outlet?->code,
            'time' => $claim->submitted_at?->format('H:i:s'),
            'date' => $claim->submitted_at?->translatedFormat('d M Y'),
            'photo_url' => $claim->photo ? route('admin.antrean-foto.foto', $claim) : null,
            'participant' => $participant?->name ?? '-',
            // Nomor lengkap untuk admin; disamarkan di layar sampai admin menekan ikon mata.
            'whatsapp' => $participant?->whatsapp,
            'history' => ($approved === 0 ? 'Klaim pertama' : "{$approved} klaim disetujui").' · '.($participant?->caps ?? 0).' cap',
            'flags' => ClaimFlags::labels($claim->flags()),
            'slot' => $claim->slot?->position,
            // Hadiah yang didapat dari slot ini, beserta kode vouchernya (merchandise tidak punya kode).
            'reward' => $claim->voucher
                ? ($claim->voucher->voucherType?->name ?? ucfirst($claim->voucher->type)).' · Rp'.number_format($claim->voucher->amount(), 0, ',', '.')
                : ($claim->gifts->firstWhere('type', '!=', 'mystery_pack') ? 'Merchandise' : null),
            'voucher_code' => $claim->voucher?->code,
        ];
    }
}
