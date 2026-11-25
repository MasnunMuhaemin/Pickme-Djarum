<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Gift;
use App\Models\Voucher;
use App\Services\RewardCreationService;
use App\Support\ActivityLogger;
use App\Support\AdminQueues;
use App\Support\ClaimFlags;
use App\Support\Mask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A2 Antrean foto: klaim bertanda di kiri, rincian di kanan (foto, tanda, keputusan). Tolak wajib beralasan.
 * Keputusan bisa diurungkan selama hadiah belum diproses. Target diputuskan paling lama 1×24 jam.
 */
class PhotoQueueController extends Controller
{
    public function index(Request $request): Response
    {
        $queue = AdminQueues::photos()->with(['participant', 'outlet'])->oldest('submitted_at')->get();
        $selectedId = $request->integer('claim') ?: $queue->first()?->id;
        $selected = $selectedId ? Claim::with(['participant', 'outlet', 'slot', 'photo', 'decider'])->find($selectedId) : null;

        return Inertia::render('admin/antrean-foto', [
            'queue' => $queue->map(fn (Claim $claim) => [
                'id' => $claim->id,
                'name' => $claim->participant?->name,
                'outlet' => $claim->outlet?->code,
                'time' => $claim->submitted_at?->format('H:i'),
                'flags' => ClaimFlags::labels($claim->flags()),
            ]),
            'claim' => $selected ? $this->detail($selected) : null,
            'rejectReasons' => ClaimFlags::REJECT_REASONS,
        ]);
    }

    public function photo(Claim $claim): StreamedResponse
    {
        $path = $claim->photo?->path;
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path);
    }

    public function approve(Request $request, Claim $claim, RewardCreationService $rewards): RedirectResponse
    {
        abort_unless($claim->status === 'pending', 422, 'Klaim ini sudah diputuskan.');

        DB::transaction(function () use ($request, $claim, $rewards) {
            $claim->update(['status' => 'approved', 'decided_by' => $request->user()->id, 'decided_at' => now(), 'reject_reason' => null]);
            $rewards->create($claim->fresh(['slot', 'participant']));
        });
        ActivityLogger::log('claim.approved_by_admin', 'claim', $claim->id, ['claim_code' => $claim->claim_code], $request->user());

        return to_route('admin.antrean-foto', ['claim' => $claim->id])->with('status', "Klaim {$claim->claim_code} disetujui.");
    }

    public function reject(Request $request, Claim $claim): RedirectResponse
    {
        abort_unless($claim->status === 'pending', 422, 'Klaim ini sudah diputuskan.');
        $data = $request->validate(
            ['reason' => ['required', Rule::in(ClaimFlags::REJECT_REASONS)]],
            ['reason.required' => 'Pilih alasan penolakan dulu.', 'reason.in' => 'Pilih alasan dari daftar.'],
        );

        $claim->update(['status' => 'rejected', 'decided_by' => $request->user()->id, 'decided_at' => now(), 'reject_reason' => $data['reason']]);
        ActivityLogger::log('claim.rejected_by_admin', 'claim', $claim->id, ['claim_code' => $claim->claim_code, 'reason' => $data['reason']], $request->user());

        return to_route('admin.antrean-foto', ['claim' => $claim->id])->with('status', "Klaim {$claim->claim_code} ditolak.");
    }

    /** Kembalikan klaim ke antrean. Hanya selama hadiahnya belum diproses (PRD bagian 6). */
    public function undo(Request $request, Claim $claim): RedirectResponse
    {
        abort_unless(in_array($claim->status, ['approved', 'rejected'], true) && $claim->decided_by, 422, 'Klaim ini belum diputuskan admin.');
        if ($claim->status === 'approved' && ($reason = $this->undoBlocker($claim))) {
            return back()->withErrors(['undo' => $reason]);
        }

        DB::transaction(function () use ($claim) {
            if ($claim->status === 'approved') {
                $claim->voucher()->delete();
                $claim->gifts()->where('type', '!=', 'mystery_pack')->delete();
                $claim->participant()->where('caps', '>', 0)->decrement('caps');
            }
            $claim->update(['status' => 'pending', 'decided_by' => null, 'decided_at' => null, 'reject_reason' => null]);
        });
        ActivityLogger::log('claim.decision_undone', 'claim', $claim->id, ['claim_code' => $claim->claim_code], $request->user());

        return to_route('admin.antrean-foto', ['claim' => $claim->id])->with('status', "Keputusan klaim {$claim->claim_code} diurungkan.");
    }

    /** Alasan keputusan tidak bisa diurungkan, atau null bila boleh. */
    private function undoBlocker(Claim $claim): ?string
    {
        // Hadiah dianggap belum diproses selama masih di status awalnya (lihat RewardCreationService),
        // belum dikirim lewat WhatsApp, dan belum ditukar.
        $initial = ['voucher' => 'sent', 'token' => 'pending_data', 'bensin' => 'pending'];
        $voucher = $claim->voucher;
        if ($voucher && ($voucher->redeemed_at || $voucher->sent_at || $voucher->status !== ($initial[$voucher->type] ?? null))) {
            return 'Hadiah klaim ini sudah diproses, keputusan tidak bisa diurungkan.';
        }
        $gift = $claim->gifts()->where('type', '!=', 'mystery_pack')->first();
        if ($gift && $gift->status !== 'pending_address') {
            return 'Hadiah klaim ini sudah diproses, keputusan tidak bisa diurungkan.';
        }
        $participant = $claim->participant;
        $claimIds = $participant->claims()->pluck('id');
        $hasMystery = Gift::whereIn('claim_id', $claimIds)->where('type', 'mystery_pack')->exists()
            || Voucher::whereIn('claim_id', $claimIds)->where('source', 'mystery')->exists();
        if ($hasMystery && $participant->caps <= 5) {
            return 'Mystery gift cap ke-5 peserta sudah terbentuk dari klaim ini, keputusan tidak bisa diurungkan.';
        }

        return null;
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
            'photo_url' => $claim->photo ? route('admin.antrean-foto.foto', $claim) : null,
            'participant' => $participant ? $participant->name.' · '.Mask::whatsapp($participant->whatsapp) : '-',
            'history' => ($approved === 0 ? 'Klaim pertama' : "{$approved} klaim disetujui").' · '.($participant?->caps ?? 0).' cap',
            'flags' => ClaimFlags::labels($claim->flags()),
            'slot' => $claim->slot?->position,
            'decided' => $claim->decided_by ? [
                'by' => $claim->decider?->name,
                'at' => $claim->decided_at?->format('d M H:i'),
                'reason' => $claim->reject_reason,
            ] : null,
            'can_undo' => in_array($claim->status, ['approved', 'rejected'], true) && $claim->decided_by
                && ($claim->status === 'rejected' || ! $this->undoBlocker($claim)),
        ];
    }
}
