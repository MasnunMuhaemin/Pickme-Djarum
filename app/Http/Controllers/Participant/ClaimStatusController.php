<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Participant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Klaim yang ditangguhkan (antre pemeriksaan admin) dan yang ditolak. Dibuka dari kartu di Hadiahku.
 * Alasan tanda tidak ditampilkan ke peserta (PRD P7).
 */
class ClaimStatusController extends Controller
{
    public function pending(Request $request, ?int $claim = null): Response|RedirectResponse
    {
        return $this->render($request, $claim, 'pending', 'participant/klaim-diperiksa');
    }

    public function rejected(Request $request, ?int $claim = null): Response|RedirectResponse
    {
        return $this->render($request, $claim, 'rejected', 'participant/klaim-ditolak');
    }

    private function render(Request $request, ?int $claimId, string $status, string $page): Response|RedirectResponse
    {
        $participant = Participant::findOrFail($request->session()->get('participant_id'));
        $query = $participant->claims()->where('status', $status)->with(['slot', 'outlet']);
        $claim = $claimId ? $query->whereKey($claimId)->first() : $query->latest('submitted_at')->first();

        // Klaim yang sudah diputuskan admin: arahkan ke Hadiahku supaya status terbaru yang tampil.
        if ($claimId && ! $claim) {
            return to_route('participant.hadiah');
        }

        return Inertia::render($page, [
            'claim' => $claim ? self::present($claim) : null,
            'caps' => $participant->caps,
            'adminWhatsapp' => config('participant.admin_whatsapp'),
        ]);
    }

    public static function present(Claim $claim): array
    {
        return [
            'id' => $claim->id,
            'status' => $claim->status,
            'claim_code' => $claim->claim_code,
            'outlet' => $claim->outlet?->code,
            'slot' => $claim->slot?->position,
            'submitted_at' => $claim->submitted_at?->format('d M Y H:i'),
        ];
    }
}
